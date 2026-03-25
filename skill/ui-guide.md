# UI 維護指南

## 顏色系統

### 主色盤

```css
/* 深色背景（生涯總覽大標、月/年結算 bar、Sidebar、TopBar）*/
#1f3347   /* Sidebar / TopBar 背景 */
#2d4a6b   /* hero bar / summary bar */

/* 按鈕、active nav、primary 操作 */
#1a5299

/* 深色文字（標題、表格重要欄位）*/
#2c3e50

/* 淺色說明文字（用於深色背景上）*/
#d0d8e4
```

### 損益顏色（台灣習慣：漲紅跌綠）

```css
/* 深色背景上（career-hero、summary bar）*/
.profit → #f87171   /* 正數，淺紅 */
.loss   → #4ade80   /* 負數，淺綠 */

/* 淺色背景上（表格、卡片）*/
.profit → #dc2626   /* 正數，深紅 */
.loss   → #16a34a   /* 負數，深綠 */

/* 卡片頂部邊框線 */
.profit → #ef4444
.loss   → #22c55e
```

### 使用方式

JSX 中搭配 `profitClass()` utility：

```jsx
import { profitClass } from '../utils/format'

<td className={profitClass(t.profit)}>{fmtMoney(t.profit)}</td>
```

> ⚠️ CSS 權重注意：若元素同時有父層高權重選擇器（如 `.trade-table td`），
> 需使用 `.trade-table td.profit` 才能覆蓋顏色。

---

## 頁面底色

```css
body { background: #f0f2f5; }
```

---

## RWD 架構

### 斷點

- **桌面（> 768px）**：Sidebar 顯示，TopBar / BottomNav 隱藏
- **手機（≤ 768px）**：TopBar + BottomNav 顯示，Sidebar 隱藏，`main-content` 底部加 80px padding

### Layout 元件

| 元件 | 顯示時機 | 功能 |
|---|---|---|
| `Sidebar.jsx` | 桌面 | 導覽 + 用戶資訊 + 備份按鈕 |
| `TopBar.jsx` | 手機 | 品牌名稱 + 用戶頭像選單（含備份操作） |
| `BottomNav.jsx` | 手機 | 固定底部的四頁導覽列 |

### 新增頁面時的 RWD checklist

1. 手機版是否需要調整 grid 欄數？（參考 `Dashboard.css`、`Monthly.css`）
2. 表格是否需要 `overflow-x: auto`？
3. 手機版是否需要不同版面？（參考 `Yearly.jsx` 的雙表格方案）

---

## 卡片 / 表格通用樣式

```css
background: #fff;
border-radius: 12px;
box-shadow: 0 2px 8px rgba(0,0,0,0.06);
```

---

## Modal（TradeForm）

```css
width: 580px;
max-width: 96vw;
border-radius: 14px;
box-shadow: 0 20px 60px rgba(0,0,0,0.2);
```

手機版表單欄位：三欄 `.form-row` 在 ≤ 540px 自動換行為兩欄。

---

## 新增頁面 Checklist

1. 建立 `src/pages/MyPage.jsx` + `MyPage.css`
2. 在 `src/App.jsx` 加入 `<Route>`
3. 在 `src/components/Layout/Sidebar.jsx` 的 `navItems` 加入導覽項目
4. 在 `src/components/Layout/BottomNav.jsx` 的 `navItems` 加入導覽項目
5. 頁面最外層使用 `<div className="my-page">`
6. 標題使用 `.page-title` / `.page-subtitle` class
7. 使用 `useTrades()` 讀取資料（不要直接用 `useTradeStore`）

---

## 常見維護情境

### 調整深色 bar 顏色
修改 `Dashboard.css` → `.career-hero`、`Monthly.css` → `.year-summary-bar`、`Yearly.css` → `.career-bar`

### 調整全站按鈕色
全域搜尋 `#1a5299` 替換

### 新增 Sidebar + BottomNav 項目
`Sidebar.jsx` 和 `BottomNav.jsx` 各有一個 `navItems` 陣列，加入 `{ path, label, icon }`

### 修改 TopBar 標題
`TopBar.jsx` → `.topbar-title` 內的文字
