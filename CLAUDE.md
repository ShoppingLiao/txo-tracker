# TXO Tracker — Claude 專案指引

## 專案簡介

個人用的台指選擇權（TXO）損益記錄工具。
使用者：Shopping Liao（個人使用 + 可能分享給其他交易者）

線上版本：https://shoppingliao.github.io/txo-tracker/

---

## 關鍵技術決策

- **Firebase Auth + Firestore**：Google 登入，資料依 UID 隔離儲存於雲端
- **Zustand**：純 in-memory cache，**不使用 persist**（資料來源是 Firestore）
  - `useTradeStore`：交易紀錄（per-user）
  - `useMarketStore`：大盤行情（全域共用，所有頁面從此讀取）
- **useTrades() hook**：所有元件的統一資料 hook，不要讓元件直接呼叫 tradeService
- **雙版面（桌面/手機）**：部分頁面有兩套 HTML（如 Yearly），用 CSS media query 切換顯示
- **台灣色彩習慣**：正數（獲利）用紅色，負數（虧損）用綠色
- **大盤行情雙來源**：(1) GitHub Actions Node 版用 Fugle stock + TAIFEX，每日 11:00/13:25/14:00 跑；(2) 本機 launchd Python 版用富邦 fubon_neo SDK，同樣三個時點 + 開機 RunAtLoad 補抓。兩邊寫同一份 Firestore `marketIndex` 文件 + `merge:true`，過渡期並存，Python 版穩定後再砍 Node。前端只讀
- **大盤行情快取**：`useFirestoreSync` 在 App 啟動時訂閱 Firestore，資料存入 localStorage（TTL 2 小時）；快取有效時不打 Firestore
- **台指期貨**：Fugle stock-only plan 不含期貨，盤中 11:00 / 13:25 用 TAIFEX MIS 抓即時價，盤後 14:00 用 TAIFEX CSV 抓 open/close；`futuresDiff11/1325 = futuresClose - futuresPrice` 由 cron 自動算，`scripts/fillFuturesDiff11.mjs` 改為歷史補資料專用 legacy 工具

## 重要注意事項

- `.env.local` 在 gitignore 中，**不要 commit**。Firebase config 透過 GitHub Secrets 注入 CI/CD
- CSS 權重陷阱：`.trade-table td { color: #333 }` 會蓋過 `.profit`，需用 `.trade-table td.profit`
- Zustand selector 取函式 reference，搭配 `useMemo` 計算，避免無限渲染
- in-app 瀏覽器（LINE/FB）不支援 signInWithPopup，Login.jsx 已有偵測提示
- **MarketIndex 和 SettlementPredictor 共用 `useMarketStore` 資料，不各自訂閱 Firestore**

---

## 維護文件索引

| 文件 | 查詢時機 |
|---|---|
| `skill/architecture.md` | 目錄結構、資料流、API |
| `skill/firebase.md` | Firebase 設定、Firestore 規則、費用 |
| `skill/deploy.md` | 部署流程、GitHub Secrets |
| `skill/ui-guide.md` | 顏色規範、RWD、新增頁面 |
| `skill/add-data.md` | 資料格式、匯入/匯出 |
| `skill/market-data.md` | 大盤行情排程、Fugle API、手動補資料、快取機制 |
| `scripts/python/README.md` | 本機 Python + 富邦 SDK 抓行情（launchd 排程）|
| `docs/ai-import-guide.md` | 使用者 AI 輔助匯入指南 |

---

## 常見任務快速參考

### 新增功能頁面
1. 建立 `src/pages/NewPage.jsx` + `.css`
2. `App.jsx` 加 `<Route>`
3. `Sidebar.jsx` + `BottomNav.jsx` 加 navItem
4. 使用 `useTrades()` 讀取交易資料；使用 `useMarketStore` 讀取大盤資料

### 修改資料結構
1. 更新 `src/services/tradeService.js`（Firestore 寫入邏輯）
2. 更新 `src/store/useTradeStore.js`（查詢方法）
3. 更新 `skill/add-data.md`（格式文件）

### 部署失敗排查
- `auth/invalid-api-key` → GitHub Secrets 未設定或有誤
- Build 失敗 → 查 GitHub Actions log，通常是缺少 import 或語法錯誤
- Google 登入失敗 → 確認網域在 Firebase Auth 授權清單內

### 資料備份與遷移
- 使用者可從 Sidebar（桌面）或 TopBar 選單（手機）匯出/匯入 JSON
- 批次寫入使用 `tradeService.batchImport(uid, trades)`（每批 400 筆）

### 大盤行情手動補資料
- **加權指數 price11**：`FIREBASE_SA=./scripts/serviceAccount.json node scripts/fillPrice11FromManual.mjs`
- **台指期貨 futuresDiff11**：在 `scripts/fillFuturesDiff11.mjs` 的 `FUTURES_DIFFS` 加新資料，再執行 `FIREBASE_SA=./scripts/serviceAccount.json node scripts/fillFuturesDiff11.mjs`
- Firebase Console 直接補：`marketIndex/{YYYY-MM-DD}` 文件，欄位見 `skill/market-data.md`
- 或手動觸發 GitHub Actions → Fetch Market Data

### 大盤行情快取問題
- 若更新資料後前端沒反應：清除 localStorage `txo_marketIndex` 快取，或等 2 小時自動過期
- 快取 key：`txo_marketIndex`，格式：`{ data: [...], cachedAt: timestamp }`
