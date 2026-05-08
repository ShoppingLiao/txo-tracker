"""每日大盤行情抓取 (Python + fubon_neo) — Node fetchMarketData.mjs 的姊妹版。

跟 Node 版寫同一個 Firestore collection (marketIndex/{YYYY-MM-DD}),用 merge:true。
平日由 launchd 在 11:00 / 13:25 / 14:05 觸發,RunAtLoad=true 開機自動補抓。

抓取目標:
  IX0001 (加權指數)        → open, close, price11, price1325
  TXF<月碼><年末位> (台指期) → futuresOpen, futuresClose, futuresPrice11, futuresPrice1325
  futuresDiff11/1325        = futuresClose - futuresPrice (有 close + price 時自動算)

執行模式由參數或 TW 當前時間判斷:
  --slot 11    → 只抓 11:00 時點價
  --slot 1325  → 只抓 13:25 時點價
  --slot close → 盤後抓 OHLC + 算 diff
  --slot auto  → 依當前 TW 時間自動判斷 (default,搭配 launchd)
  --slot all   → 全抓 (RunAtLoad / 手動補)
"""

from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from loguru import logger

# .env / serviceAccount.json 從 script 同目錄讀。
#
# 開發時 (scripts/python/) — 同目錄沒檔,fallback 往上找 repo root 的 .env
# launchd 部署時 (~/Library/Application Support/TXOTracker/scripts/) — 同目錄已被 setup.sh 同步好
SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parents[1]  # scripts/python/../.. = repo root (開發時用)
for env_file in (SCRIPT_DIR / ".env", ROOT / ".env", ROOT / ".env.local"):
    if env_file.exists():
        load_dotenv(env_file, override=False)

from fubon_login import (  # noqa: E402
    FubonLoginFailed,
    FubonNotConfigured,
    get_marketdata_clients,
)

TW_TZ = timezone(timedelta(hours=8))


def today_tw_iso() -> str:
    return datetime.now(TW_TZ).strftime("%Y-%m-%d")


def current_tx_symbol(now: datetime | None = None) -> str:
    """近月台指期 symbol (TXF + 月碼A-L + 年末位)。

    結算日 = 每月第三個週三。當天結算後 (>13:30) 切下個月。
    這裡簡化:結算日當天仍視為近月,結算日隔天才切下月。
    """
    if now is None:
        now = datetime.now(TW_TZ)
    y, m = now.year, now.month

    third_wed_day = _third_wednesday_day(y, m)
    if now.day > third_wed_day:
        m += 1
        if m > 12:
            m = 1
            y += 1

    month_codes = "ABCDEFGHIJKL"
    return f"TXF{month_codes[m - 1]}{y % 10}"


def _third_wednesday_day(year: int, month: int) -> int:
    d = datetime(year, month, 1)
    # weekday(): Mon=0 ... Sun=6;Wed=2
    offset = (2 - d.weekday()) % 7
    return 1 + offset + 14


def detect_slot() -> str:
    """根據當前 TW 時間判斷 slot。"""
    now = datetime.now(TW_TZ)
    hm = now.hour * 100 + now.minute
    if 1050 <= hm < 1110:
        return "11"
    if 1320 <= hm < 1340:
        return "1325"
    if 1400 <= hm < 1700:
        return "close"
    return "all"


def fetch_quote(client: Any, symbol: str) -> dict[str, Any] | None:
    try:
        return client.intraday.quote(symbol=symbol)
    except Exception as e:
        logger.warning(f"quote {symbol} 失敗: {e}")
        return None


def fetch_minute_open(client: Any, symbol: str, date: str, hhmm: str) -> float | None:
    """從 1 分 K 找指定時點 (HH:MM) 那根 K 棒的 open。

    Fubon candle response: {data: [{date: ISO 8601, open, high, low, close, volume}]}
    例如 hhmm='11:00' 會找 date 開頭 'YYYY-MM-DDT11:00:00' 的 K 棒。
    若該 K 棒尚未生成 (例如 cron 在 10:59 跑) 則回 None。
    """
    try:
        res = client.intraday.candles(symbol=symbol, timeframe="1")
    except Exception as e:
        logger.warning(f"candles {symbol} 失敗: {e}")
        return None
    bars = (res or {}).get("data", []) if isinstance(res, dict) else []
    prefix = f"{date}T{hhmm}:00"
    for bar in bars:
        bd = bar.get("date", "") if isinstance(bar, dict) else ""
        if bd.startswith(prefix):
            return bar.get("open")
    return None


def _safe(d: dict[str, Any] | None, *keys: str) -> Any:
    if not d:
        return None
    for k in keys:
        if not isinstance(d, dict):
            return None
        d = d.get(k)
        if d is None:
            return None
    return d


def build_record(slot: str, existing: dict[str, Any], date: str) -> dict[str, Any]:
    """抓資料、組成要寫進 Firestore 的 record。

    時點價策略:
      - 11:00 / 13:25 的 priceXX 來自 1 分 K 該時點的 open (準確 + 支援盤後 catch-up)
      - 盤中 cron 觸發時若該根 K 還沒生成,fallback 用當下 quote.lastPrice
    """
    reststock, restfut = get_marketdata_clients()
    tx_symbol = current_tx_symbol()
    logger.info(f"slot={slot} 加權=IX0001 期貨={tx_symbol}")

    record: dict[str, Any] = dict(existing)

    def fill_if_empty(key: str, value: Any) -> None:
        if value is not None and existing.get(key) is None:
            record[key] = value

    spot = None
    fut = None

    def get_spot_quote():
        nonlocal spot
        if spot is None:
            spot = fetch_quote(reststock, "IX0001")
        return spot

    def get_fut_quote():
        nonlocal fut
        if fut is None:
            fut = fetch_quote(restfut, tx_symbol)
        return fut

    def time_of_day_price(client: Any, symbol: str, hhmm: str, current_quote_fn) -> float | None:
        """先從 1 分 K 取,沒拿到就用當下 quote 的 lastPrice (盤中即時 fallback)。"""
        v = fetch_minute_open(client, symbol, date, hhmm)
        if v is not None:
            return v
        q = current_quote_fn()
        return _safe(q, "lastPrice") or _safe(q, "closePrice")

    if slot in ("11", "all"):
        fill_if_empty("price11", time_of_day_price(reststock, "IX0001", "11:00", get_spot_quote))
        fill_if_empty("futuresPrice11", time_of_day_price(restfut, tx_symbol, "11:00", get_fut_quote))

    if slot in ("1325", "all"):
        fill_if_empty("price1325", time_of_day_price(reststock, "IX0001", "13:25", get_spot_quote))
        fill_if_empty("futuresPrice1325", time_of_day_price(restfut, tx_symbol, "13:25", get_fut_quote))

    if slot in ("close", "all"):
        get_spot_quote()
        get_fut_quote()
        for key, value in {
            "open": _safe(spot, "openPrice"),
            "close": _safe(spot, "closePrice"),
            "futuresOpen": _safe(fut, "openPrice"),
            "futuresClose": _safe(fut, "closePrice"),
        }.items():
            if value is not None:
                record[key] = value

    # diff = close - price (close 跟 price 都齊才算)
    fc = record.get("futuresClose")
    if fc is not None:
        for slot_key in ("11", "1325"):
            price_key = f"futuresPrice{slot_key}"
            diff_key = f"futuresDiff{slot_key}"
            if record.get(diff_key) is None and record.get(price_key) is not None:
                record[diff_key] = fc - record[price_key]

    return record


def _service_account_path() -> str:
    """找 Firebase Admin SA JSON。優先序:
    1. env FIREBASE_SA
    2. SCRIPT_DIR/serviceAccount.json (launchd 部署位置)
    3. <repo_root>/scripts/serviceAccount.json (開發時 fallback)
    """
    env_path = os.getenv("FIREBASE_SA")
    if env_path:
        return os.path.expanduser(env_path)
    candidates = [
        SCRIPT_DIR / "serviceAccount.json",
        ROOT / "scripts" / "serviceAccount.json",
    ]
    for p in candidates:
        if p.exists():
            return str(p)
    return str(candidates[-1])  # default for clear error


def write_firestore(date: str, record: dict[str, Any]) -> None:
    """寫 marketIndex/{date},merge:true。"""
    sa_path = _service_account_path()

    import firebase_admin
    from firebase_admin import credentials, firestore

    if not firebase_admin._apps:
        cred = credentials.Certificate(sa_path)
        firebase_admin.initialize_app(cred)

    db = firestore.client()
    record["date"] = date
    record["updatedAt"] = datetime.now(timezone.utc).isoformat()
    record["source"] = "fubon"
    db.collection("marketIndex").document(date).set(record, merge=True)
    logger.info(f"已寫入 marketIndex/{date} keys={sorted(record.keys())}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--slot", choices=["auto", "11", "1325", "close", "all"], default="auto")
    parser.add_argument("--dry-run", action="store_true", help="只印 record,不寫 Firestore")
    args = parser.parse_args()

    slot = detect_slot() if args.slot == "auto" else args.slot
    date = today_tw_iso()

    # 先讀既有 (避免覆寫)
    existing: dict[str, Any] = {}
    if not args.dry_run:
        import firebase_admin
        from firebase_admin import credentials, firestore

        if not firebase_admin._apps:
            firebase_admin.initialize_app(credentials.Certificate(_service_account_path()))
        snap = firestore.client().collection("marketIndex").document(date).get()
        if snap.exists:
            existing = snap.to_dict() or {}

    try:
        record = build_record(slot, existing, date)
    except (FubonNotConfigured, FubonLoginFailed) as e:
        logger.error(f"Fubon SDK 問題: {e}")
        sys.exit(2)

    has_data = any(
        record.get(k) is not None
        for k in (
            "open", "close", "price11", "price1325",
            "futuresOpen", "futuresClose", "futuresPrice11", "futuresPrice1325",
        )
    )
    if not has_data:
        logger.info("沒抓到任何資料 (假日或 SDK 回空),跳過寫入")
        return

    if args.dry_run:
        logger.info(f"[dry-run] would write: {record}")
    else:
        write_firestore(date, record)


if __name__ == "__main__":
    main()
