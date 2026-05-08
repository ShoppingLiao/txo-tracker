# 🤝 HANDOFF — txo-tracker 接手指南

> 從另一個 session 過來的接手文件。目的:讓你接手後立即知道專案狀態 +
> 跟姊妹專案 stock-tracker 的關係 + 可以做哪些事。
>
> 寫於 2026-05-08。

---

## 1. 專案是什麼

**台指選擇權(TXO)損益記錄工具**,React + Firebase + Vite。
個人用 + 可能分享給其他交易者。

線上版:https://shoppingliao.github.io/txo-tracker/

技術棧:
- React 19 + Vite 6
- Firebase Auth(Google 登入) + Firestore(資料儲存)
- Zustand 5(in-memory state)
- 純前端 SPA,GitHub Pages 部署

---

## 2. 姊妹專案 — stock-tracker(極重要)

`~/Documents/code/stock-tracker/` 是 **同一個用戶的台股全功能系統**(Python + Streamlit + 富邦 SDK)。

兩個專案的關係:

| 維度 | stock-tracker | txo-tracker |
|---|---|---|
| 範疇 | 個股 / ETF / 黑飛舞 / 紅爆策略 / DDMD / 富邦持股 | 純 TXO 選擇權交易紀錄 |
| 技術 | Python + Streamlit + Cron | React + Firebase + GitHub Actions |
| 部署 | 本機 dashboard + MkDocs 公開站 | GitHub Pages SPA |
| 富邦 SDK | ✅ Python fubon_neo (login + accounting + marketdata) | ❌ 純前端用不了 SDK |
| Fugle API | 透過 fubon_neo 封裝 | ✅ 直接 REST(有 FUGLE_API_KEY) |

**共享資料源**:都用 Fugle marketdata(同一個富邦集團 backend),只是接入方式不同。

---

## 3. 必讀文件

| 文件 | 目的 |
|---|---|
| **`docs/data-sources-priority.md`** | ⭐ 從 stock-tracker 摘錄整合的資料源指南 — **新加的,先讀** |
| `CLAUDE.md` | 專案架構 + 關鍵技術決策(Fugle / Firestore / Zustand)|
| `README.md` | 用戶向功能介紹 |
| `skill/architecture.md` | 目錄結構 + 資料流 + API |
| `skill/firebase.md` | Firestore schema + rules |
| `skill/market-data.md` | 大盤行情怎麼抓(Fugle GitHub Actions) |
| `scripts/fetchMarketData.mjs` | 加權指數 daily cron 範例(Fugle REST 模式)|

---

## 4. 現有自動化

### 大盤行情(已實作)
- GitHub Actions 14:00 跑 `scripts/fetchMarketData.mjs`
- Fugle API 抓加權指數(IX0001)→ 寫 Firestore `marketIndex`
- 前端從 Firestore 讀,localStorage 2 小時 cache

### 期貨手動補填(workaround)
- Fugle stock REST endpoint 不含期貨,所以 `futuresDiff11` 欄位用 `scripts/fillFuturesDiff11.mjs` 手動補
- **這個應該可以自動化** — 見下方優先 4

---

## 5. 接手後可以做的事(由易到難)

### 優先 1:把 data-sources-priority doc 真的讀過

新加的 `docs/data-sources-priority.md` 摘錄了 stock-tracker 一年的踩坑經驗。
特別注意:
- TPEx daily API swap 延遲(對 daily 報價 cron 有影響)
- 富邦 / Fugle / TWSE MIS 的對照
- 前端打 TWSE MIS 會被 CORS 擋

### 優先 2:Fugle 期貨 endpoint 試打

`scripts/fetchMarketData.mjs` 的 base URL 是 `api.fugle.tw/marketdata/v1.0/stock`(只 stock)。
應該改成 `api.fugle.tw/marketdata/v1.0/futopt/intraday/quote/TXFE6` 試試打台指期。

如果通,自動化 `futuresDiff11` 欄位填寫(取代 manual script)。

**參考**:stock-tracker `docs/fubon-marketdata-api.md` 有完整 Python SDK 範例,
Fugle REST 應該對應同樣 endpoint。

### 優先 3:結算行事曆強化

現有「結算行事曆」用第三個週三規則。可以加:
- 週結算(每週三)— 2024 開始有週選擇權
- 結算前 5 / 1 天提醒
- 連動 Firestore 推 push notification(Firebase Cloud Messaging)

### 優先 4:整合 stock-tracker 的富邦帳務

如果想自動拉「TXO 交易紀錄」取代手動輸入:

**方案 A:stock-tracker 寫 endpoint(複雜但乾淨)**
- 在 stock-tracker Python 端加 FastAPI / Cloud Function
- 跑 `sdk.futopt.filled_history(acc, start, end)` 拿成交歷史
- 寫進 Firestore,txo-tracker React 讀

**方案 B:stock-tracker cron 直接寫 Firestore(最簡)**
- stock-tracker 的本機 cron 加一個 wrapper
- 用 firebase-admin Python SDK 寫進 Firestore `trades_auto` 集合
- txo-tracker 顯示時 merge `trades` (手動) + `trades_auto` (自動)

兩個都需要在 stock-tracker 那邊加程式碼。要做的話跟 stock-tracker session 協調。

### 優先 5:加台指期 / TXO 即時 quote 顯示

可以在 txo-tracker 加一個「行情」分頁:
- 加權指數(已有 cron)
- 台指期近月(用優先 2 的 Fugle 期貨 endpoint)
- TXO 主要履約價(at-the-money + 上下 N 檔)

完整指數 / 期貨 / 選擇權 symbol 對照表見 `docs/data-sources-priority.md` §2。

---

## 6. 重要 invariants(別動)

| 規則 | 為什麼 |
|---|---|
| `.env.local` 永遠 gitignore | Firebase config 不能洩漏 |
| 台灣色彩慣例:**正數紅 / 負數綠** | 用戶習慣,跟 css `.profit / .loss` 嚴格對應 |
| Zustand 用 `useTrades()` hook 統一存取 | 元件**不直接呼叫** tradeService |
| in-app 瀏覽器(LINE/FB)不支援 signInWithPopup | Login.jsx 已有偵測提示,不要拿掉 |
| `useMarketStore` 全域共用,**不要各自訂閱 Firestore** | MarketIndex / SettlementPredictor 共用 |

---

## 7. 環境設定

```bash
cd ~/Documents/code/txo-tracker
npm install
cp .env.example .env.local   # 填 Firebase config
npm run dev                  # http://localhost:5173
```

部署 = push 到 main(GitHub Actions 自動 build + deploy 到 Pages)。

---

## 8. 跟 stock-tracker session 怎麼協調

如果你要做的事**需要 stock-tracker 配合**(例如 backend bridge / 共享 Firestore 集合),
建議:

1. 先在 txo-tracker 設計好 schema(Firestore collection + 欄位)
2. 寫進 `docs/integration-plan.md`(新檔)
3. 用戶會在另一個 session 拿這份計畫去 stock-tracker 那邊實作 backend
4. txo-tracker 只負責讀

---

## 9. 已知問題 / 限制

- **CORS**:TWSE MIS / Fugle 直接前端打可能被擋(看是否走 backend proxy 解決)
- **Firestore 費用**:每次寫入 / 讀取都計費,localStorage cache TTL 2 小時是節流
- **Fugle stock-only**:期貨需另外打 futopt endpoint,可能要 token 範圍授權
- **手動 vs 自動**:目前 TXO 交易紀錄純手動,自動化是「優先 4」工程量最大

---

## 10. 上次 stock-tracker session 的成果(可借鑒)

stock-tracker 在 2026-05-08 做完:
- 富邦 marketdata REST 整合(指數 / ETF / 期貨即時 quote + intraday candles)
- Streamlit dashboard 加「📊 大盤指數」+「🎯 持股走勢」分頁(每行 3 widget × 4 row,左字右圖)
- 完整 API 文件 `docs/fubon-marketdata-api.md` + skill `.claude/skills/fubon-marketdata/SKILL.md`

如果要在 txo-tracker 加類似「大盤指數」widget,可以**直接複製 layout 思路**(只是要從 React 重寫)。

實作參考:`stock-tracker/src/dashboard/app.py` 的 `_render_quote_row` 函數。

---

> 有問題去看 `docs/data-sources-priority.md` 跟 stock-tracker 的 commits。
> 用戶習慣:**做完就 commit**,不要批次累積。
