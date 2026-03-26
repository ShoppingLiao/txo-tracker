# 大盤行情資料指南

## 概覽

透過 **富果（Fugle）Market Data API** 每日自動抓取台灣加權指數（IX0001）三個時間點的資料，儲存至 Firestore `marketIndex` 集合，前端從 Firestore 讀取顯示，使用者不直接呼叫 Fugle API。

台指期貨（`futuresDiff11`）因 Fugle API 不支援期貨商品，**只能手動維護**。

```
GitHub Actions (每日 14:00)
    ↓
scripts/fetchMarketData.mjs  ← Fugle API（僅加權指數）
    ↓
Firestore: marketIndex/{date}
    ↓
前端 useFirestoreSync → useMarketStore（localStorage 快取 2 小時）
    ↓
MarketIndex 頁面 / SettlementPredictor 頁面（唯讀）
```

---

## 資料結構

### Firestore 文件：`marketIndex/{YYYY-MM-DD}`

| 欄位 | 型別 | 來源 | 說明 |
|---|---|---|---|
| `date` | string | 自動 | 日期，格式 `YYYY-MM-DD` |
| `open` | number | Fugle API | 加權指數開盤價（09:00） |
| `price11` | number \| null | Fugle API / 手動 | 加權指數 11:00 現價 |
| `close` | number | Fugle API | 加權指數收盤價（13:30） |
| `futuresDiff11` | number \| null | **手動維護** | 台指期貨 11點-收盤差值（close - price11） |
| `updatedAt` | string | 自動 | ISO 8601 寫入時間 |

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

> ⚠️ `futuresDiff11` 不在自動排程中，需手動補寫（見下方）

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
- **注意**：Fugle API 僅支援現貨（IX0001），**不支援台指期貨**

---

## 手動補資料

### 方法一：Firebase Console（個別欄位）

1. Firebase Console → Firestore → 選 `marketIndex` 集合
2. 新增或選取目標文件（ID = 日期，如 `2026-03-26`）
3. 填入欄位：`date`、`open`、`price11`、`close`、`updatedAt`
4. 台指期貨差值另填：`futuresDiff11`（number）

### 方法二：補寫加權 price11（script）

當 Fugle 盤中 API 缺少 11:00 資料時，可用手動記錄的「11點-收盤差值」回推：

```bash
FIREBASE_SA=./scripts/serviceAccount.json node scripts/fillPrice11FromManual.mjs
```

- 公式：`price11 = close - diff11`
- 只補 `price11 == null` 的記錄，不覆蓋已有值
- 差值資料需手動維護在 `scripts/fillPrice11FromManual.mjs` 的 `MANUAL_DIFFS` 物件

### 方法三：補寫台指期貨 futuresDiff11（script）

```bash
FIREBASE_SA=./scripts/serviceAccount.json node scripts/fillFuturesDiff11.mjs
```

- 每次補新資料：在 `scripts/fillFuturesDiff11.mjs` 的 `FUTURES_DIFFS` 物件新增日期與差值，再執行
- 會覆蓋已有值（因為沒有自動化來源）

### 方法四：手動觸發 GitHub Actions

若排程當天因故未執行（假日誤判等），可手動觸發：
GitHub → Actions → Fetch Market Data → Run workflow

---

## 前端快取機制

`useFirestoreSync` 在 App 啟動時處理 `marketIndex` 讀取：

1. 檢查 `localStorage['txo_marketIndex']` 快取（TTL = 2 小時）
2. **快取有效**：直接寫入 `useMarketStore`，不打 Firestore
3. **快取過期**：訂閱 Firestore `onSnapshot`，取得資料後更新快取

結果：同一 session 切換頁面不重複讀取；2 小時內重開 App 也不打 Firestore。

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
| `price11` 為 null | 11:00 分鐘 K 棒找不到（holiday 誤判或 API 資料缺失） | 執行 `fillPrice11FromManual.mjs` 或 Firebase Console 手動補值 |
| `futuresDiff11` 全為 null | 未執行補寫 script | 執行 `fillFuturesDiff11.mjs` |
| 頁面資料沒更新 | localStorage 快取仍有效（2 小時內） | 清除 `txo_marketIndex` 快取或等候自動過期 |
| GitHub Actions 失敗 | Fugle API 回傳空資料（當日假日）| 檢查 Actions log，確認是否為台灣假日 |
| 前端讀不到資料 | Firestore rules 未設定 read | 確認規則含 `match /marketIndex/{date}` |
| `Firebase Admin` 認證失敗 | `FIREBASE_SERVICE_ACCOUNT` Secret 格式錯誤 | 確認貼入的是完整 JSON（含 `{` `}` 和所有欄位）|
