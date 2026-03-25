# UI 維護指南

## 顏色系統

### 主色盤

```css
/* 深色背景（生涯總覽大標、月/年結算 bar）*/
#2d4a6b

/* Sidebar 背景 */
#1f3347

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
.profit → #f87171   /* 正數，紅 */
.loss   → #4ade80   /* 負數，綠 */

/* 淺色背景上（表格、卡片）*/
.profit → #dc2626   /* 正數，深紅 */
.loss   → #16a34a   /* 負數，深綠 */

/* 邊框線（卡片頂部）*/
.profit → #ef4444
.loss   → #22c55e
```

### 使用方式

JSX 中搭配 `profitClass()` utility：

```jsx
import { profitClass } from '../utils/format'

<td className={profitClass(t.profit)}>{fmtMoney(t.profit)}</td>
```

---

## 頁面底色

```css
body { background: #eef1f5; }
```

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
border-radius: 14px;
box-shadow: 0 20px 60px rgba(0,0,0,0.2);
```

---

## 新增頁面 Checklist

1. 建立 `src/pages/MyPage.jsx` + `MyPage.css`
2. 在 `src/App.jsx` 加入 `<Route>`
3. 在 `src/components/Layout/Sidebar.jsx` 的 `navItems` 加入導覽項目
4. 頁面最外層使用 `<div className="my-page">`
5. 標題使用 `.page-title` / `.page-subtitle` class

---

## 常見維護情境

### 調整深色 bar 顏色
修改 `Dashboard.css` → `.career-hero`、`Monthly.css` → `.year-summary-bar`、`Yearly.css` → `.career-bar`

### 調整全站按鈕色
全域搜尋 `#1a5299` 替換

### 新增 Sidebar 項目
`Sidebar.jsx` 的 `navItems` 陣列加入 `{ path, label, icon }`
