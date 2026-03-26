# 台指期貨資料自動化

**狀態**：✅ 已完成
**建立日期**：2026-03-26
**關聯欄位**：Firestore `marketIndex/{date}` 的 `futuresOpen`、`futuresClose`、`futuresPrice11`

---

## 背景

目前 MarketIndex 頁面有「台指期貨」tab，但欄位資料幾乎都是 `—`。
只有 `futuresDiff11`（11點-收盤差值）是手動維護的。
目標是讓**開盤、11點、收盤**三個欄位也能自動填入，減少手動作業。

---

## 現有資料流（加權指數，已自動化）

```
GitHub Actions 14:00
    ↓
Fugle API（IX0001）
    ├── 每日 K 棒 → open, close
    └── 盤中 1分鐘 K → price11（11:00 那根的 open）
    ↓
TAIFEX API
    ├── futuresOpen
    └── futuresClose
    └── 計算出的 futuresPrice11（需 futuresDiff11）
    ↓
Firestore marketIndex/{date}
```

---

## 調查結論：各資料來源

### 開盤 + 收盤（日 K 資料）

| 來源 | 可行性 | 備註 |
|---|---|---|
| Fugle API | ❌ 不支援 | 測試確認，期貨 symbol 全部 404 |
| Yahoo Finance | ❌ 不支援 | TW 期貨 symbol 不存在 |
| Stooq.com | ❌ 無資料 | 查無台指期 |
| **TAIFEX CSV 下載** | ✅ 技術可行 | 已經整合至每日腳本中，可以成功拉到資料 |

### 11點即時報價（盤中快照）

目前採用策略是利用現有手動維護的 `futuresDiff11` 結合每日爬取的 `futuresClose` 自動反推 `futuresPrice11`。

---

## 決策（方案 A）

完成更新 `scripts/fetchMarketData.mjs`，結合現有的加權指數爬取進程：
1. 從 TAIFEX FutDataDown API 以 POST 方式下載 CSV，透過 `big5` 解碼。
2. 過濾找出標的為 `TX`、時段為 `一般` 且為近月合約的資料列，提取出 `futuresOpen`（開盤價）與 `futuresClose`（收盤價）。
3. 根據手續已鍵入 Firestore 中的 `futuresDiff11` 資料，如果有值而無 `futuresPrice11`，則可以自動藉由 `futuresClose - futuresDiff11` 反推 11:00 點價格。
4. 在前端頁面 `src/pages/MarketIndex.jsx` 將台指期貨的視圖更新，補入這些變數與如果欄位有短缺便推算的機制。
