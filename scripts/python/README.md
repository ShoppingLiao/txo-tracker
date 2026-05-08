# Python + fubon_neo 大盤行情抓取

本機 launchd 排程 + Fubon SDK 抓大盤 (加權 + 台指期),寫 Firestore `marketIndex`。

跟現有 GitHub Actions Node 版 (`scripts/fetchMarketData.mjs`) **並存**,過渡期間兩套都跑、用 `merge:true` 互相補位。Fubon 版穩定後即可關掉 Node + GitHub Actions。

---

## 1. 一次性安裝

```bash
# 1) 建 venv + 裝相依 (fubon_neo 除外)
bash scripts/python/setup.sh

# 2) 從富邦官網下載對應平台的 wheel:
#    https://www.fbs.com.tw/TradeAPI/docs/download/download-sdk
#    macOS Apple Silicon → fubon_neo-*-cp311-cp311-macosx_*_arm64.whl
#    macOS Intel        → fubon_neo-*-cp311-cp311-macosx_*_x86_64.whl
scripts/python/.venv/bin/pip install ~/Downloads/fubon_neo-*.whl

# 3) 確認 .env 已設好 (專案 root):
#    FUBON_USER_ID
#    FUBON_PASSWORD
#    FUBON_CERT_PATH       (絕對路徑到 .pfx,例 ~/fubon/cert.pfx)
#    FUBON_CERT_PASSWORD
#
#    Firebase service account 預設讀 scripts/serviceAccount.json,
#    要改路徑可設 FIREBASE_SA env

# 4) Dry-run 驗證 SDK + 抓資料 OK
scripts/python/.venv/bin/python scripts/python/fetch_market_fubon.py --slot all --dry-run
```

## 2. 啟用 launchd 排程

```bash
bash scripts/python/setup.sh --launchd
```

排程 (週一至週五):
- **11:00** — 抓盤中加權 + 台指期 → `price11`, `futuresPrice11`
- **13:25** — 同上 → `price1325`, `futuresPrice1325`
- **14:05** — 抓 OHLC + 自動算 `futuresDiff11/1325`
- **開機 (RunAtLoad)** — 立即跑一次,補抓漏排

查狀態 / 看 log:
```bash
launchctl list | grep com.txotracker
tail -f scripts/python/.launchd.log
```

停用:
```bash
launchctl unload ~/Library/LaunchAgents/com.txotracker.fetchmarket.plist
```

## 3. 手動觸發

```bash
# 自動依當前時間決定 slot
scripts/python/.venv/bin/python scripts/python/fetch_market_fubon.py

# 強制全抓 (補資料 / 假日後第一個交易日)
scripts/python/.venv/bin/python scripts/python/fetch_market_fubon.py --slot all
```

## 4. 跟 Node 版的關係

| 比較 | Node (GitHub Actions) | Python (本機 launchd) |
|---|---|---|
| 來源 | TAIFEX MIS/CSV + Fugle stock | 富邦 SDK (指數 + 期貨同源) |
| 永遠在跑 | ✅ | ❌ 電腦關機就漏 |
| 期貨範圍 | 受 Fugle plan 限制 | 完整 (五檔/分鐘 K/選擇權) |
| 資料 | 寫同一個 Firestore document | 同上 (merge:true) |
| `source` 欄位 | 沒寫 (預設 Node) | `"fubon"` |

過渡期建議跑 1-2 週,觀察 Python 那邊穩定後 (`source=="fubon"` 連續沒缺) 再砍 Node workflow。

## 5. 已知限制

- **fubon_neo 是 Python only** — 所以這份只能本機跑,GitHub Actions 用不了
- **Fubon login 一天可能有上限** — 排程 3 次/日 + RunAtLoad 應該安全
- **macOS 休眠/關機** — launchd 不會 catch-up 已過的排程,RunAtLoad 是唯一補抓機制
- **token / 帳密** — `.env` 在 gitignore,但憑證 `.pfx` 放使用者個人資料夾,不在 repo 內
