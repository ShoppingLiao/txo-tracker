# 大盤行情資料指南

## 概覽

透過 **富果（Fugle）Market Data API** 每日自動抓取台灣加權指數（IX0001）三個時間點的資料，儲存至 Firestore `marketIndex` 集合，前端從 Firestore 讀取顯示，使用者不直接呼叫 Fugle API。

```
GitHub Actions (每日 14:00)
    ↓
scripts/fetchMarketData.mjs  ← Fugle API
    ↓
Firestore: marketIndex/{date}
    ↓
前端 MarketIndex 頁面（唯讀）
```

---

## 資料結構

### Firestore 文件：`marketIndex/{YYYY-MM-DD}`

| 欄位 | 型別 | 說明 |
|---|---|---|
| `date` | string | 日期，格式 `YYYY-MM-DD` |
| `open` | number | 開盤價（09:00） |
| `price11` | number \| null | 11:00 整的現價（可能為 null） |
| `close` | number | 收盤價（13:30） |
| `updatedAt` | string | ISO 8601 寫入時間 |

---

## GitHub Actions 排程

**檔案**：`.github/workflows/fetch-market-data.yml`

- **觸發時間**：UTC 06:00（台灣時間 14:00），週一至週五
- **手動觸發**：GitHub → Actions → Fetch Market Data → Run workflow
- **執行邏輯**：
  1. 抓今日 IX0001 每日 K 棒（open、close）
  2. 抓今日盤中 1 分鐘 K 棒，找 11:00 那根的 open
  3. 寫入 Firestore `marketIndex/{date}`
  4. 若今日無交易（假日），script 自動跳過

---

## 必要的 GitHub Secrets

| Secret 名稱 | 說明 |
|---|---|
| `FUGLE_API_KEY` | 富果 Market Data API Token（UUID 格式） |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase Admin SDK 服務帳號 JSON（整個 JSON 字串） |

### 取得 FIREBASE_SERVICE_ACCOUNT

1. Firebase Console → Project Settings → Service accounts
2. 點「Generate new private key」→ 下載 JSON
3. 把整個 JSON 內容貼入 GitHub Secret

---

## Fugle API 端點

- **每日 K 棒**：`GET https://api.fugle.tw/marketdata/v1.0/stock/historical/candles/IX0001?timeframe=D&from=YYYY-MM-DD&to=YYYY-MM-DD&fields=open,close`
- **盤中 1 分鐘 K**：`GET https://api.fugle.tw/marketdata/v1.0/stock/intraday/candles/IX0001?timeframe=1`
- **認證**：Header `X-API-KEY: {token}`

---

## 手動補資料

### 方法一：Firebase Console（最快）

1. Firebase Console → Firestore → 選 `marketIndex` 集合
2. 新增文件，ID 填日期（如 `2026-03-26`）
3. 填入欄位：`date`、`open`、`price11`、`close`、`updatedAt`

### 方法二：手動觸發 GitHub Actions

若 script 當天因故未執行（假日誤判等），可手動觸發：
GitHub → Actions → Fetch Market Data → Run workflow

---

## 前端 Firestore 規則

```
match /marketIndex/{date} {
  allow read: if request.auth != null;
  // 寫入由 Admin SDK 處理，client 端不需要 write 權限
}
```

---

## 常見問題

| 問題 | 原因 | 解法 |
|---|---|---|
| `price11` 為 null | 11:00 分鐘 K 棒找不到（holiday 誤判或 API 資料缺失） | Firebase Console 手動補值 |
| GitHub Actions 失敗 | Fugle API 回傳空資料（當日假日）| 檢查 Actions log，確認是否為台灣假日 |
| 前端讀不到資料 | Firestore rules 未設定 read | 確認規則含 `match /marketIndex/{date}` |
| `Firebase Admin` 認證失敗 | `FIREBASE_SERVICE_ACCOUNT` Secret 格式錯誤 | 確認貼入的是完整 JSON（含 `{` `}` 和所有欄位）|
