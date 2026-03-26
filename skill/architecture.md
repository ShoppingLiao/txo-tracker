# 專案架構

## 技術棧

| 套件 | 版本 | 用途 |
|---|---|---|
| React | 19 | UI 框架 |
| Vite | 8 | 建置工具（`base: '/txo-tracker/'`） |
| Zustand | 5 | 前端狀態管理（in-memory cache，不使用 persist） |
| React Router | 7 | 路由（basename: `/txo-tracker/`） |
| Firebase | 12 | Auth（Google 登入）+ Firestore（雲端資料庫） |
| Recharts | — | 圖表（保留，尚未使用） |

## 部署

- **GitHub Pages**：https://shoppingliao.github.io/txo-tracker/
- **Repo**：https://github.com/ShoppingLiao/txo-tracker
- Push 到 `main` 自動觸發 GitHub Actions，Firebase config 透過 GitHub Secrets 注入

---

## 目錄結構

```
src/
├── App.jsx                      # AuthProvider + 路由（登入守衛）
├── main.jsx
├── index.css                    # 全域樣式、body 背景色
│
├── lib/
│   └── firebase.js              # Firebase app / auth / db 初始化
│
├── contexts/
│   └── AuthContext.jsx          # Google 登入狀態（user, loading, signIn, signOut）
│
├── services/
│   ├── tradeService.js          # Firestore CRUD（addTrade, updateTrade, deleteTrade,
│   │                            #   subscribeTrades, batchImport, deleteAllTrades）
│   └── marketIndexService.js    # 大盤行情 Firestore 讀取（subscribeMarketIndex）
│
├── store/
│   └── useTradeStore.js         # Zustand store（setTrades + 查詢方法，無 CRUD）
│
├── hooks/
│   ├── useFirestoreSync.js      # 訂閱 Firestore onSnapshot → 更新 store
│   ├── useTrades.js             # 統一 hook：讀取 store + 寫入 Firestore + 匯出/匯入
│   └── useFileStorage.js        # 舊版本機檔案 hook（保留，已不使用）
│
├── utils/
│   ├── fileStorage.js           # File System Access API 封裝（保留，已不使用）
│   └── format.js                # fmtMoney / fmtPct / profitClass / MONTH_NAMES
│
├── pages/
│   ├── Login.jsx/.css           # Google 登入頁（含 in-app 瀏覽器提示）
│   ├── Dashboard.jsx/.css       # 生涯總覽
│   ├── Records.jsx/.css         # 操作紀錄（表格，月份分組）
│   ├── Monthly.jsx/.css         # 月結算（12 張卡片）
│   ├── Yearly.jsx/.css          # 年結算（桌面橫向矩陣 / 手機轉置表格）
│   ├── CalendarPage.jsx/.css    # 結算行事曆（2026 年結算日 grid）
│   ├── MarketIndex.jsx/.css     # 大盤行情（每日開盤/11點/收盤歷史表格）
│   └── Guide.jsx/.css           # 匯入說明（渲染 docs/ai-import-guide.md）
│
└── components/
    ├── Layout/
    │   ├── MainLayout.jsx        # layout 容器（TopBar + Sidebar + Outlet + BottomNav）
    │   ├── MainLayout.css        # RWD：手機隱藏 Sidebar，main-content 底部留空
    │   ├── Sidebar.jsx           # 桌面導覽 + 用戶資訊 + 備份按鈕（桌面顯示）
    │   ├── Sidebar.css
    │   ├── TopBar.jsx            # 手機頂部 Bar：品牌名 + 用戶頭像選單（手機顯示）
    │   ├── TopBar.css
    │   ├── BottomNav.jsx         # 手機底部導覽列（手機顯示）
    │   └── BottomNav.css
    └── Records/
        ├── TradeForm.jsx         # 新增/編輯 Modal（使用 useTrades hook）
        └── TradeForm.css         # RWD：三欄在手機自動換行
```

---

## 資料流

### 交易紀錄（per-user）

```
Google 登入
    ↓
AuthContext（user, loading）
    ↓
useFirestoreSync（onSnapshot 訂閱 users/{uid}/trades）
    ↓
useTradeStore.setTrades(trades)    ← 即時更新 in-memory store
    ↓
所有頁面從 useTrades() / useTradeStore() 讀取資料

寫入路徑：
useTrades.addTrade(data)
    ↓
tradeService.addTrade(uid, data)   ← 寫入 Firestore
    ↓
onSnapshot 觸發 → store 自動更新   ← UI 自動重渲
```

### 大盤行情（共享資料，自動排程）

```
GitHub Actions (每日 14:00 台灣時間)
    ↓
scripts/fetchMarketData.mjs
    ↓  呼叫 Fugle API（IX0001 每日K棒 + 盤中1分鐘K棒）
    ↓
Firebase Admin SDK 寫入 marketIndex/{date}

前端：
marketIndexService.subscribeMarketIndex()
    ↓
onSnapshot → MarketIndex 頁面即時更新
```

### Firestore 結構

```
users/
  {uid}/
    trades/
      {tradeId}/    ← document ID = String(trade.id)
        id, date, dayOfWeek, contracts,
        commission, tax, profit, returnRate, note

marketIndex/
  {YYYY-MM-DD}/   ← 由 GitHub Actions 寫入（Admin SDK），前端唯讀
    date, open, price11, close, updatedAt
```

---

## useTrades Hook API

所有需要讀寫資料的元件都使用 `useTrades()`：

| 方法 | 說明 |
|---|---|
| `trades` | 目前所有交易（從 store 讀取） |
| `addTrade(data)` | 新增一筆（寫 Firestore） |
| `updateTrade(id, data)` | 更新一筆（寫 Firestore） |
| `deleteTrade(id)` | 刪除一筆（寫 Firestore） |
| `exportJSON()` | 下載備份 JSON |
| `importJSON()` | 合併匯入（依 id 去重） |
| `replaceJSON()` | 覆蓋匯入（清空後重寫） |
| `getYears()` | 有資料的年份清單 |
| `getMonthStats(year, month)` | 某月統計 |
| `getYearStats(year)` | 12 個月統計陣列 |
| `getYearTotal(year)` | 全年合計 |
| `getCareerStats()` | 生涯合計 |

---

## 顏色規範（台灣習慣：漲紅跌綠）

| 用途 | 色票 |
|---|---|
| 正數（獲利）淺色背景 | `#dc2626`（深紅）|
| 正數（獲利）深色背景 | `#f87171`（淺紅）|
| 負數（虧損）淺色背景 | `#16a34a`（深綠）|
| 負數（虧損）深色背景 | `#4ade80`（淺綠）|
| 卡片頂部邊框（正） | `#ef4444` |
| 卡片頂部邊框（負） | `#22c55e` |
| Sidebar / TopBar 背景 | `#1f3347` |
| 主要深色背景（hero bar）| `#2d4a6b` |
| 按鈕 / active | `#1a5299` |
| 深色文字 | `#2c3e50` |
| 淺色說明文字（深背景）| `#d0d8e4` |

---

## RWD 斷點

| 斷點 | 說明 |
|---|---|
| `> 768px` | 桌面：Sidebar 顯示，TopBar / BottomNav 隱藏 |
| `≤ 768px` | 手機：TopBar + BottomNav 顯示，Sidebar 隱藏 |

---

## 注意事項

- Zustand selector 取**函式 reference**，搭配 `useMemo` 計算，避免無限渲染
- `profitClass()` 回傳 `'profit'` / `'loss'` / `''`
- 報酬率公式：`profit / (contracts × 1250)`，存小數，`fmtPct()` 自動乘 100 顯示
- CSS 權重：`.trade-table td.profit` 需比 `.trade-table td` 更高才能覆蓋顏色
