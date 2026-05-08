# Python + fubon_neo 大盤行情抓取

本機 launchd 排程 + Fubon SDK 抓大盤 (加權 + 台指期),寫 Firestore `marketIndex`。

跟現有 GitHub Actions Node 版 (`scripts/fetchMarketData.mjs`) **並存**,過渡期間兩套都跑、用 `merge:true` 互相補位。Fubon 版穩定後即可關掉 Node + GitHub Actions。

---

## 為什麼有「deploy」步驟

macOS 14+ 對 `~/Documents/` 有 TCC 隱私保護,launchd context 不能讀 Documents 內任何檔案。
所以 setup.sh 把 venv + Python script + `.env` + `serviceAccount.json` 全部複製到
`~/Library/Application Support/TXOTracker/`(TCC 沒擋的位置),launchd 從那邊跑。

副作用:**改完 .py / .env / serviceAccount.json 之後,要重跑 `setup.sh` 才會生效**。

```
~/Library/Application Support/TXOTracker/
├── venv/                          # virtualenv
├── scripts/                       # ← deploy 來源 = repo/scripts/python/*.py
│   ├── fetch_market_fubon.py
│   ├── fubon_login.py
│   ├── .env                       # ← copy from repo/.env
│   └── serviceAccount.json        # ← copy from repo/scripts/serviceAccount.json
└── logs/launchd.log
```

---

## 1. 一次性安裝

```bash
# 1) 建 venv + 裝相依 + deploy 到 AppSupport
bash scripts/python/setup.sh

# 2) fubon_neo 從富邦官網下載 .whl 後手動裝:
#    https://www.fbs.com.tw/TradeAPI/docs/download/download-sdk
"$HOME/Library/Application Support/TXOTracker/venv/bin/pip" install ~/Downloads/fubon_neo-*.whl

# 3) 確認 repo root 的 .env 已設好:
#    FUBON_USER_ID / FUBON_PASSWORD / FUBON_CERT_PATH / FUBON_CERT_PASSWORD
#    setup.sh 會把它複製進 deploy 目錄

# 4) Dry-run 驗證 (從 repo 路徑,本地開發模式)
"$HOME/Library/Application Support/TXOTracker/venv/bin/python" \
    scripts/python/fetch_market_fubon.py --slot all --dry-run
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
tail -f "$HOME/Library/Application Support/TXOTracker/logs/launchd.log"
```

停用:
```bash
launchctl bootout gui/$(id -u)/com.txotracker.fetchmarket
rm ~/Library/LaunchAgents/com.txotracker.fetchmarket.plist
```

## 3. 改完程式碼怎麼讓 launchd 用到

```bash
bash scripts/python/setup.sh   # 重 deploy (不需要再加 --launchd)
```

setup.sh 會 overwrite deploy 目錄裡的 .py / .env / serviceAccount.json,launchd 下次觸發時就用新版。
不需要 unload / load launchd (plist 沒變)。

## 4. 手動觸發

```bash
# 從 repo 直接跑 (開發模式,讀 repo .env)
"$HOME/Library/Application Support/TXOTracker/venv/bin/python" \
    scripts/python/fetch_market_fubon.py --slot all

# 模擬 launchd 環境 (從 deploy 位置跑)
"$HOME/Library/Application Support/TXOTracker/venv/bin/python" \
    "$HOME/Library/Application Support/TXOTracker/scripts/fetch_market_fubon.py" --slot all
```

`--slot` 參數: `auto` (依當前時間判斷) | `11` | `1325` | `close` | `all`(全抓,RunAtLoad / 手動補)

## 5. 跟 Node 版的關係

| 比較 | Node (GitHub Actions) | Python (本機 launchd) |
|---|---|---|
| 來源 | TAIFEX MIS/CSV + Fugle stock | 富邦 SDK (指數 + 期貨同源) |
| 永遠在跑 | ✅ | ❌ 電腦關機就漏 |
| 期貨範圍 | 受 Fugle plan 限制 | 完整 (五檔/分鐘 K/選擇權) |
| 資料 | 寫同一個 Firestore document | 同上 (merge:true) |
| `source` 欄位 | 沒寫 (預設 Node) | `"fubon"` |

過渡期建議跑 1-2 週,觀察 Python 那邊穩定後 (`source=="fubon"` 連續沒缺) 再砍 Node workflow。

## 6. 已知限制

- **fubon_neo 是 Python only** — 所以這份只能本機跑,GitHub Actions 用不了
- **Fubon login 一天可能有上限** — 排程 3 次/日 + RunAtLoad 應該安全
- **macOS 休眠/關機** — launchd 不會 catch-up 已過的排程,RunAtLoad 是唯一補抓機制
- **TCC 限制** — 這就是要 deploy 步驟的原因。如果你之後想取消 deploy,改設 Full Disk Access 給 venv python (`/Library/Developer/CommandLineTools/Library/Frameworks/Python3.framework/Versions/3.9/bin/python3.9`) 也行
