# 資料源優先度 + 使用指南(txo-tracker 版)

> 從姊妹專案 [stock-tracker](https://github.com/ShoppingLiao/stock-tracker) 摘錄整合 — 這份是給 txo-tracker(React 前端 + Firestore)的精簡版,聚焦**台指選擇權 / 期貨 / 加權現貨**。
>
> 完整版(含個股 / ETF / 籌碼 / DDMD 等)見 stock-tracker 內的 `docs/data-sources-priority.md`。

---

## 🎯 一句話原則

| 場景 | 推薦來源 | 直接前端可用? |
|---|---|---|
| **加權指數即時** | TWSE MIS REST | ✅ 純 fetch |
| **加權指數日 K 歷史** | TWSE 官方 daily / yfinance(後端代抓) | TWSE 直接 / yfinance 要 backend |
| **台指期(TXF)即時** | 富邦 marketdata REST | ❌ 需 Python backend bridge |
| **台指選擇權(TXO)即時** | 富邦 marketdata REST | ❌ 需 Python backend bridge |
| **TXO 結算日 / 月份代碼** | 自算 / TAIFEX 官方公告 | ✅ |
| **個人 TXO 交易紀錄** | Firebase Firestore(用戶手動輸入)| ✅ 已實作 |

---

## 1. 純前端可用 — 推薦這 3 個

### 1.1 TWSE MIS REST(加權即時,免登入)

```javascript
// 前端 fetch — 注意 CORS
const url = 'https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=tse_t00.tw';
const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
const data = await r.json();
// data.msgArray: [{c, n, z=成交價, y=昨收, o=開, h=最高, l=最低, ...}]
```

**Channel 對照**:
- 加權指數:`tse_t00.tw`(成交價在 `z`)
- 櫃買指數:`otc_o00.tw`
- 不含金融:`tse_t01.tw`
- 不含電子:`tse_t02.tw`

⚠️ **前端踩坑**:
- **CORS**:`mis.twse.com.tw` 沒給 CORS header,瀏覽器會擋。生產環境要 proxy 或寫 backend
- **訂閱式**:第一次 GET 只訂閱,要等 ~0.5 秒第二次才有資料
- **z = '-'** 代表沒成交 / 未訂閱

### 1.2 TWSE 官方歷史 daily(指數日 K)

```javascript
// 加權指數 N 個月歷史 (date YYYYMMDD)
const url = `https://www.twse.com.tw/rwd/zh/afterTrading/MI_INDEX?date=20260507&type=ALLBUT0999&response=json`;
```

⚠️ **CORS 同樣**:前端要 proxy。

### 1.3 TAIFEX 結算日(自算就好)

台指期 + 選擇權結算日 = **每月第三個週三**(若遇假日順延)。
不用打 API,用 dayjs 或自寫 helper:

```javascript
// 第三個週三
function thirdWednesday(year, month) {
  const d = new Date(year, month - 1, 1);
  const offset = (3 - d.getDay() + 7) % 7;  // 第一個週三
  return new Date(year, month - 1, 1 + offset + 14);
}
```

---

## 2. 富邦 marketdata REST(完整即時)

⚠️ **富邦 fubon_neo SDK 只有 Python / C# / Node.js / C++ / Golang,React 前端用不到**。

### 兩個整合方案

#### 方案 A:Python backend bridge(推薦)
- 在 stock-tracker 那邊寫個 endpoint(FastAPI / Flask)
- 富邦 SDK 抓 → cache 到 Firestore → React 從 Firestore 讀
- **stock-tracker 跟 txo-tracker 共享同一個 Firestore 集合**

#### 方案 B:txo-tracker 自己跑 Node SDK(複雜)
- fubon_neo Node.js SDK 存在,但需要憑證 + login
- React 前端 + Node SDK 的整合過於 heavy(背端要分開)

### 富邦能拿到什麼

| 資料 | endpoint | symbol 格式 |
|---|---|---|
| 加權指數即時 | `reststock.intraday.quote('IX0001')` | `IX0001` |
| 櫃買指數 | `reststock.intraday.quote('IX0043')` | `IX0043` |
| **台指期** | `restfut.intraday.quote('TXFE6')` | **`TXF` + 月碼(A-L) + 年末位** |
| **TXO 選擇權** | `restfut.intraday.quote(...)` 或 `sdk.marketdata.rest_client.options` | 標的型: `TXO20260521C18000` 之類 |

#### 期貨 / 選擇權 symbol 月碼
- A=1月, B=2, C=3, D=4, **E=5**, **F=6**, G=7, H=8, I=9, J=10, K=11, L=12
- 年份取末位:2026 → 6

例:
- `TXFE6` = 台指期 2026-05
- `TXFF6` = 台指期 2026-06
- `MXFE6` = 小台 2026-05

### 完整 marketdata API 文件

stock-tracker 內 `docs/fubon-marketdata-api.md` 有完整 endpoint + response schema + Python 範例。

---

## 3. 跟 stock-tracker 整合的可能性

| 共用點 | 怎麼整合 |
|---|---|
| **Firestore 集合** | stock-tracker Python 寫,txo-tracker React 讀 |
| **加權指數歷史** | stock-tracker cron 每天抓,寫 firestore;txo-tracker 直接讀 |
| **台指期 / TXO 即時** | stock-tracker 開個輕量 API endpoint(FastAPI),txo-tracker fetch |
| **結算行事曆** | 各自實作,純算式不用 API |
| **大盤指數行情** | TWSE MIS 直接 / 經 stock-tracker proxy |

---

## 4. 富邦帳務(交易紀錄自動化的可能性)

如果想從富邦自動拉「TXO 交易紀錄」自動填 txo-tracker:

```python
# stock-tracker 那邊跑(Python)
sdk.futopt_accounting.unrealized_gains_and_loses(acc)   # 期權未實現
sdk.futopt.filled_history(acc, start, end)               # 成交歷史
```

→ 寫進 Firestore → React 讀並顯示。

⚠️ 這需要 stock-tracker 端開放 endpoint 或寫 cron + Firestore SDK。**目前 stock-tracker 沒做**(只用 Python 本機 + GitHub Pages 公開站,不打 Firestore)。

---

## 📁 對照 stock-tracker 的關鍵檔(供參考)

| stock-tracker 檔 | 做什麼 | txo-tracker 借鑒方式 |
|---|---|---|
| `src/data/fubon_account.py` | 富邦 SDK login + 帳務 | 若做 backend bridge,直接 import |
| `src/data/market_overview.py` | 富邦 marketdata 大盤 + 持股走勢 | 同上 |
| `src/data/realtime.py` | TWSE MIS REST | **參考實作**(換 JS 重寫前端版)|
| `docs/fubon-marketdata-api.md` | 完整 API 參考 | 必讀 |
| `docs/data-sources-priority.md` | 完整版資料源指南 | 必讀 |

---

## 🚨 踩過的坑(stock-tracker 經驗)

1. **TPEx daily API**:query date 不準,response 永遠回最新 swap 快照
2. **富邦 cash query**:他行交割會 Rust panic → 用 BaseException catch
3. **TWSE MIS 訂閱式**:第一次 GET 只訂閱,要等 0.5s 第二次才有資料
4. **CORS**:TWSE / 富邦 都沒 CORS header,**前端直連會被擋**,需 proxy
5. **富邦憑證每年要更新**:CATool 只支援 Windows,macOS 用戶要借電腦跑
6. **PyO3 PanicException 不繼承 Exception**:Python 端要 BaseException
