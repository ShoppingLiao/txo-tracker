# 台指選擇權損益紀錄

個人用的台指選擇權（TXO）交易紀錄工具，支援 Google 帳號登入、雲端同步、手機操作。

🔗 **線上版本**：https://shoppingliao.github.io/txo-tracker/

---

## 功能

- **生涯總覽** — 累計損益、勝率、各年度快速概覽
- **操作紀錄** — 依年份 / 月份篩選，支援新增、編輯、刪除
- **月結算** — 12 個月損益卡片，點擊跳轉明細
- **年結算** — 跨年月份矩陣，一眼掌握歷史績效
- **手機 RWD** — 底部導覽列，支援行動裝置操作

### 資料儲存

| 方式 | 說明 |
|---|---|
| Firebase Firestore | 雲端即時同步，依 Google 帳號隔離資料 |
| 匯出 JSON | 手動下載備份 |
| 合併匯入 | 載入 JSON，依 id 去重合併，不覆蓋現有資料 |
| 覆蓋匯入 | 載入 JSON，清空後取代全部資料 |

---

## 使用方式

### 登入

使用 **Google 帳號**登入，資料自動儲存至雲端，可多裝置同步。

> ⚠️ 如果透過 LINE / FB 等 App 內建瀏覽器開啟，請複製網址到 **Safari 或 Chrome** 再登入。

### 新增紀錄

1. 前往「操作紀錄」頁面
2. 點右上角「＋ 新增紀錄」
3. 填入日期、口數、手續費、期交稅、實際獲利
4. 報酬率自動計算（`獲利 ÷ 口數 × 1250`）

### 資料備份 / 匯入

- **匯出 JSON** — 下載完整備份檔
- **合併匯入** — 從舊備份補入資料（不覆蓋已有紀錄）
- **覆蓋匯入** — 以備份完整取代當前資料

> 💡 使用 ChatGPT / Gemini 將截圖或 Excel 資料轉為可匯入的 JSON：
> 請參考 [AI 輔助匯入指南](docs/ai-import-guide.md)

---

## 本地開發

```bash
# 1. 複製環境變數設定
cp .env.local.example .env.local
# 填入 Firebase config（見 skill/firebase.md）

# 2. 安裝依賴
npm install

# 3. 啟動開發伺服器
npm run dev
# 開啟 http://localhost:5173/txo-tracker/
```

---

## 技術棧

React 19 · Vite 8 · Zustand 5 · React Router 7 · Firebase 12（Auth + Firestore）

---

## 維護文件

| 文件 | 內容 |
|---|---|
| [skill/architecture.md](skill/architecture.md) | 專案架構、目錄結構、資料流 |
| [skill/firebase.md](skill/firebase.md) | Firebase 設定與維護指南 |
| [skill/deploy.md](skill/deploy.md) | 部署流程、GitHub Actions |
| [skill/ui-guide.md](skill/ui-guide.md) | UI 顏色規範、RWD、新增頁面指引 |
| [skill/add-data.md](skill/add-data.md) | 資料格式規範、匯入說明 |
| [docs/ai-import-guide.md](docs/ai-import-guide.md) | 使用 AI 輔助建立 JSON 資料 |
