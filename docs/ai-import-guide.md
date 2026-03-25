# 使用 AI 輔助匯入交易資料

本指南說明如何利用 ChatGPT、Gemini 等 AI 工具，將你的操作紀錄快速轉換為可匯入的 JSON 格式。

---

## 你的資料是哪種形式？

- [📸 截圖（看圖）](#方式一截圖直接給-ai-看圖辨識)
- [📊 Excel / Numbers 試算表](#方式二excel--numbers-匯出-csv)
- [📝 純文字 / 手打數字](#方式三直接貼文字給-ai)

---

## 方式一：截圖直接給 AI 看圖辨識

適合：有操作紀錄的截圖（如券商 App 截圖、Excel 截圖）

### 步驟

1. 截取包含操作紀錄的畫面（日期、口數、損益等欄位）
2. 開啟 ChatGPT 或 Gemini（需要支援圖片上傳的版本）
3. 上傳截圖，並貼上以下指令：

```
請從這張截圖中辨識台指選擇權操作紀錄，並轉換為以下 JSON 格式：

{
  "trades": [
    {
      "id": 1000001,
      "date": "YYYY-MM-DD",
      "dayOfWeek": "Mon/Tue/Wed/Thur/Fri/Sat/Sun",
      "contracts": 口數（數字）,
      "commission": 手續費（數字，沒有就填 0）,
      "tax": 期交稅（數字，沒有就填 0）,
      "profit": 實際獲利（正數獲利，負數虧損）,
      "returnRate": 獲利 / (口數 × 1250)（計算結果為小數，沒有口數就填 null）,
      "note": ""
    }
  ]
}

規則：
- id 用流水號 1000001、1000002... 依序填入
- dayOfWeek 用英文縮寫：Mon Tue Wed Thur Fri Sat Sun
- returnRate 計算公式：profit / (contracts × 1250)，結果保留 4 位小數
- 如果截圖中沒有手續費或期交稅欄位，填 0
- 輸出純 JSON，不要加其他說明文字
```

4. 複製 AI 回傳的 JSON
5. 儲存為 `.json` 檔案（如 `txo-2025.json`）
6. 進入 App → 右上角頭像（手機）或 Sidebar（桌面）→ **合併匯入**

---

## 方式二：Excel / Numbers 匯出 CSV

適合：已有試算表整理好的紀錄

### 步驟

1. 開啟 Excel / Numbers / Google Sheets
2. 確認欄位順序（建議格式）：

   | 日期 | 口數 | 手續費 | 期交稅 | 實際損益 | 備註 |
   |---|---|---|---|---|---|
   | 2025-11-01 | 50 | 700 | 55 | +12500 | |

3. 匯出為 **CSV 格式**（Excel：另存新檔 → CSV UTF-8）
4. 開啟 ChatGPT 或 Gemini，上傳 CSV 檔案（或複製貼上內容），並貼上以下指令：

```
以下是我的台指選擇權操作紀錄（CSV 格式），請轉換為以下 JSON 格式：

[貼上 CSV 內容]

輸出格式：
{
  "trades": [
    {
      "id": 1000001,
      "date": "YYYY-MM-DD",
      "dayOfWeek": "Mon/Tue/Wed/Thur/Fri/Sat/Sun",
      "contracts": 口數（數字）,
      "commission": 手續費（數字）,
      "tax": 期交稅（數字）,
      "profit": 實際獲利（正整數獲利，負數虧損）,
      "returnRate": profit / (contracts × 1250)（小數，4位）,
      "note": ""
    }
  ]
}

規則：
- id 從 1000001 開始流水號
- dayOfWeek 依日期自動計算英文縮寫（Mon Tue Wed Thur Fri Sat Sun）
- returnRate = profit / (contracts × 1250)，保留 4 位小數
- 輸出純 JSON
```

---

## 方式三：直接貼文字給 AI

適合：少量資料，可以手打或複製貼上

### 步驟

1. 整理你的資料，例如：

```
2025-11-15 Fri 30口 手續費420 期交稅33 獲利+1390
2025-11-22 Fri 40口 手續費560 期交稅44 獲利-2800
2025-12-06 Fri 25口 手續費350 期交稅0 獲利+3200
```

2. 開啟任何 AI（ChatGPT / Gemini / Claude），貼上以下指令：

```
請將以下台指選擇權操作紀錄轉換為 JSON 格式：

[貼上你的資料]

輸出格式：
{
  "trades": [
    {
      "id": 流水號從 1000001 開始,
      "date": "YYYY-MM-DD",
      "dayOfWeek": "Mon/Tue/Wed/Thur/Fri/Sat/Sun",
      "contracts": 口數,
      "commission": 手續費,
      "tax": 期交稅,
      "profit": 獲利（正獲利負虧損的整數）,
      "returnRate": profit / (contracts × 1250) 的小數,
      "note": ""
    }
  ]
}

只輸出 JSON，不要其他說明。
```

---

## 取得 JSON 後如何匯入

1. 將 AI 產生的 JSON 複製到文字編輯器，儲存為 `.json` 檔案
2. 開啟 [台指選擇權損益紀錄](https://shoppingliao.github.io/txo-tracker/)
3. 登入後：
   - **手機**：右上角頭像 → 合併匯入
   - **桌面**：左側 Sidebar → 合併匯入
4. 選擇剛才儲存的 `.json` 檔案
5. 資料匯入完成！

> 💡 **合併匯入**：只新增還沒有的紀錄，不會覆蓋已有資料（依 id 判斷）
> 💡 **覆蓋匯入**：清空全部，以 JSON 檔案內容取代（適合從零開始）

---

## JSON 格式驗證

匯入前可以用 [jsonlint.com](https://jsonlint.com) 驗證 JSON 格式是否正確。
常見錯誤：最後一筆資料後面多了逗號，或數字欄位用了字串（加了引號）。

---

## returnRate 計算範例

| 獲利 | 口數 | returnRate 計算 | 結果 |
|---|---|---|---|
| +12,500 | 30 | 12500 / (30 × 1250) | 0.3333 |
| -2,800 | 40 | -2800 / (40 × 1250) | -0.0560 |
| +1,390 | 25 | 1390 / (25 × 1250) | 0.0445 |

> 沒有口數資料時，`returnRate` 填 `null`
