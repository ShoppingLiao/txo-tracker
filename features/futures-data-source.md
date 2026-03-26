# 台指期貨資料自動化

**狀態**：🔍 調查中
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
| **TAIFEX CSV 下載** | ⚠️ 技術可行，有障礙 | 需要 session cookie + Big5 轉碼；目前測試只回傳 header，缺資料列；值得繼續研究 |

### 11點即時報價（盤中快照）

| 來源 | 可行性 | 備註 |
|---|---|---|
| Fugle API | ❌ 不支援 | 同上 |
| **TAIFEX MIS WebSocket** | ⚠️ 技術可行，複雜 | mis.taifex.com.tw 使用 SockJS + STOMP 協議；公開無需登入；需用 Node.js `stompjs` + `sockjs-client` 連線；在 11:05 訂閱台指期近月合約即可拿到即時報價 |
| 鉅亨網 API | ❌ Symbol 格式未知 | ws.api.cnyes.com 回傳 invalid，正確 symbol 尚未找到 |

---

## 可行方案比較

### 方案 A：14:00 排程，TAIFEX CSV 抓開盤 + 收盤

- **優點**：穩定、盤後資料完整
- **缺點**：11點無解（市場已關閉，分鐘 K 無免費 API）
- **工程量**：中（需解決 session/cookie 問題）
- **結果**：可以填 `futuresOpen`、`futuresClose`；`futuresPrice11` 仍需手動

### 方案 B：11:05 排程，TAIFEX MIS WebSocket 抓即時報價

- **優點**：可以拿到開盤 + 11:00 現價；前一日收盤可用歷史 CSV 補
- **缺點**：WebSocket 在 CI 環境較脆弱；TAIFEX 改版可能失效；維護成本高
- **工程量**：高
- **結果**：可以填三個欄位，但穩定性風險

### 方案 C（現狀維持）：手動維護 futuresDiff11

- 繼續每天手動記錄「11點-收盤差值」
- 若方案 A 完成後，可自動推算：`futuresPrice11 = futuresClose - futuresDiff11`
- **工程量**：零
- **結果**：開盤/收盤空白，11點-收盤欄有值

---

## 決策待定

目前尚未選定方案。下次開發時的建議切入點：

1. **先試方案 A**：解決 TAIFEX CSV session 問題（curl 加上 cookie + 正確 form 參數），成本最低
2. **若 A 成功**：方案 B 才值得投入（因為有了 close，11點才能推算）
3. **若 A 失敗**：考慮 `puppeteer` headless browser 作為備案（GitHub Actions 支援）

---

## 相關程式碼

| 檔案 | 說明 |
|---|---|
| `scripts/fetchMarketData.mjs` | 現有加權指數排程（可參考擴充） |
| `scripts/fillFuturesDiff11.mjs` | 手動補寫台指期差值 |
| `scripts/fillPrice11FromManual.mjs` | 手動補寫加權 price11 |
| `.github/workflows/fetch-market-data.yml` | 現有 14:00 排程 |
| `src/pages/MarketIndex.jsx` | 前端顯示（台指期 tab 已建立） |
