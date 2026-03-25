# 專案架構

## 技術棧
- **React 19** + **Vite 8**
- **Zustand 5** — 狀態管理（含 localStorage 持久化）
- **React Router 7** — 路由（basename: `/txo-tracker/`）
- **Recharts** — 圖表（目前保留，尚未使用）

## 部署
- **GitHub Pages**：https://shoppingliao.github.io/txo-tracker/
- **Repo**：https://github.com/ShoppingLiao/txo-tracker
- Push 到 `main` 自動觸發 GitHub Actions 部署

---

## 目錄結構

```
src/
├── App.jsx                    # 路由設定（BrowserRouter basename）
├── main.jsx
├── index.css                  # 全域樣式、body 背景色
│
├── store/
│   └── useTradeStore.js       # 唯一資料來源（Zustand + persist）
│
├── hooks/
│   └── useFileStorage.js      # 本機 JSON 檔案讀寫 + 匯出/匯入邏輯
│
├── utils/
│   ├── fileStorage.js         # File System Access API 封裝
│   └── format.js              # fmtMoney / fmtPct / profitClass
│
├── pages/
│   ├── Dashboard.jsx/.css     # 生涯總覽
│   ├── Records.jsx/.css       # 操作紀錄（表格，月份分組）
│   ├── Monthly.jsx/.css       # 月結算（12 張卡片）
│   └── Yearly.jsx/.css        # 年結算（跨年月份矩陣）
│
└── components/
    ├── Layout/
    │   ├── MainLayout.jsx     # Sidebar + <Outlet>
    │   ├── Sidebar.jsx        # 導覽列 + 資料儲存區
    │   └── Sidebar.css
    └── Records/
        ├── TradeForm.jsx      # 新增/編輯 Modal
        └── TradeForm.css
```

---

## 顏色規範（台灣習慣）

| 用途 | 色票 |
|---|---|
| 正數（獲利） | `#dc2626`（深紅）/ `#f87171`（深色背景） |
| 負數（虧損） | `#16a34a`（深綠）/ `#4ade80`（深色背景） |
| 主要深色背景 | `#2d4a6b` |
| Sidebar 背景 | `#1f3347` |
| 按鈕/active  | `#1a5299` |
| 深色文字 | `#2c3e50` |
| 淺色說明文字（深背景）| `#d0d8e4` |

---

## 資料流

```
useTradeStore (Zustand)
  ├── 讀寫 localStorage（key: txo-trades-v2）
  └── useFileStorage hook
        ├── 連結本機 JSON → auto-save on trades 變更
        ├── 合併匯入 (mergeTrades)
        └── 覆蓋匯入 (importTrades)
```

### Store Actions

| Action | 說明 |
|---|---|
| `addTrade(trade)` | 新增一筆，依日期排序 |
| `updateTrade(id, data)` | 更新 |
| `deleteTrade(id)` | 刪除 |
| `importTrades(arr)` | 覆蓋全部資料 |
| `mergeTrades(arr)` | 合併（依 id 去重） |
| `getMonthTrades(year, month)` | 取某月資料 |
| `getMonthStats(year, month)` | 某月統計 |
| `getYearStats(year)` | 12 個月統計陣列 |
| `getYearTotal(year)` | 全年合計 |
| `getYears()` | 有資料的年份清單 |
| `getCareerStats()` | 生涯合計 |

---

## 注意事項

- Zustand selector 內**不可直接呼叫 `getXxx()`**（會回傳新陣列/物件，觸發無限渲染）
  - 正確做法：取函式 reference，搭配 `useMemo` 計算
- `profitClass()` 回傳 `'profit'` / `'loss'` / `''`，CSS class 對應台灣習慣（漲紅跌綠）
- 報酬率公式：`profit / (contracts × 1250)`，存小數（例：`0.0733`），`fmtPct()` 自動乘 100 顯示
