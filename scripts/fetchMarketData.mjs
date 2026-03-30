/**
 * 每日自動抓取台股大盤（加權指數 IX0001）行情
 * 透過 GitHub Actions 在台灣時間 14:00 執行
 *
 * 需要的 GitHub Secrets：
 *   FUGLE_API_KEY          — 富果 Market Data API Token
 *   FIREBASE_SERVICE_ACCOUNT — Firebase Admin SDK 服務帳號 JSON（字串）
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore }        from 'firebase-admin/firestore'

// ── Firebase Admin 初始化 ──────────────────────────────────────
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

// ── 設定 ──────────────────────────────────────────────────────
const FUGLE_KEY = process.env.FUGLE_API_KEY
const BASE      = 'https://api.fugle.tw/marketdata/v1.0/stock'
const SYMBOL    = 'IX0001'  // 發行量加權股價指數

// ── 工具 ──────────────────────────────────────────────────────
async function get(url) {
  const res = await fetch(url, { headers: { 'X-API-KEY': FUGLE_KEY } })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Fugle API ${res.status}: ${text}`)
  }
  return res.json()
}

/** 取台灣時間的今日日期字串 YYYY-MM-DD */
function todayTW() {
  return new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10)
}

// ── 主程式 ────────────────────────────────────────────────────
async function main() {
  const date = todayTW()
  const currentUTC = new Date().getUTCHours()
  // 使用 currentUTC < 5 來判定為早盤 11:00 的排程（因為 GitHub Action 可能延遲到 04:xx 甚至更晚，只要在 13:00 以前都視為早盤）
  const is11AM = currentUTC < 5

  console.log(`[${new Date().toISOString()}] 抓取 ${date} 大盤與期貨行情 (is11AM: ${is11AM}, UTC Hour: ${currentUTC})...`)

  // 先拿資料庫現有資料
  const docRef = db.collection('marketIndex').doc(date)
  let docSnap;
  try {
    docSnap = await docRef.get()
  } catch (e) {
    console.error("無法讀取 Firestore:", e)
  }
  const existingData = docSnap && docSnap.exists ? docSnap.data() : {}

  let open = existingData.open ?? null
  let close = existingData.close ?? null
  let price11 = existingData.price11 ?? null
  let futuresOpen = existingData.futuresOpen ?? null
  let futuresClose = existingData.futuresClose ?? null
  let futuresPrice11 = existingData.futuresPrice11 ?? null

  // 1. 若不是 11 點，就代表是盤後 (14:00)，去抓日 K (開盤、收盤)
  if (!is11AM) {
    try {
      const histUrl = `${BASE}/historical/candles/${SYMBOL}` +
        `?timeframe=D&from=${date}&to=${date}&fields=open,close&sort=asc`
      const hist = await get(histUrl)
      const day = hist.data?.[0]
      if (day) {
        open = day.open
        close = day.close
      } else {
        console.log('今日無 Fugle 日 K 資料（可能假日或尚未更新）')
      }
    } catch (e) {
      console.log('抓取 Fugle 日 K 失敗（若遇假日常為 404）:', e.message)
    }
  }

  // 2. 盤中 1 分鐘 K 棒 → 找 11:00 那根的 open 
  // (不論 11:00 或 14:00 都可以嘗試抓，只要缺資料)
  if (price11 === null) {
    try {
      const intradayUrl = `${BASE}/intraday/candles/${SYMBOL}?timeframe=1`
      const intraday = await get(intradayUrl)
      const candle11 = intraday.data?.find(c => c.date.startsWith(`${date}T11:00:00`))
      if (candle11) {
        price11 = candle11.open
      }
    } catch (e) {
      console.log('抓取 Fugle 盤中 11:00 K 棒失敗:', e.message)
    }
  }

  // 3. 抓取台指期（一般交易時段，近月合約）開盤及收盤價 (盤後 14:00 才抓)
  if (!is11AM) {
    try {
      const ymd = date.replace(/-/g, '%2F')
      const taifexRes = await fetch('https://www.taifex.com.tw/cht/3/futDataDown', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: `down_type=1&queryStartDate=${ymd}&queryEndDate=${ymd}&commodity_id=TX`
      })
      if (taifexRes.ok) {
        const buf = await taifexRes.arrayBuffer()
        const txt = new TextDecoder('big5').decode(buf)
        const lines = txt.split('\n')
        const dataLines = lines.slice(1).filter(l => l.trim() !== '')
        let txGeneralRows = dataLines.map(l => l.split(','))
          .filter(r => r[1] === 'TX' && r[17] === '一般' && r[2].trim().length === 6)
        if (txGeneralRows.length > 0) {
          txGeneralRows.sort((a,b) => a[2].trim().localeCompare(b[2].trim()))
          const r = txGeneralRows[0]
          futuresOpen = parseInt(r[3], 10)
          futuresClose = parseInt(r[6], 10)
        }
      }
    } catch (e) {
      console.error('抓取 TAIFEX 盤後 CSV 資料時發生異常：', e)
    }
  }

  // 若我們有 futuresClose 且已有手動補好的 futuresDiff11，則自動推算出 11:00 的價格
  const futuresDiff11 = existingData.futuresDiff11 ?? null
  if (futuresClose !== null && futuresDiff11 !== null && futuresPrice11 === null) {
    futuresPrice11 = futuresClose - futuresDiff11
  }

  // 4. 即時抓取期貨現價（若於 11:00 執行則可作為 futuresPrice11）
  if (is11AM && futuresPrice11 === null) {
    try {
      const misRes = await fetch('https://mis.taifex.com.tw/futures/api/getQuoteList', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({"MarketType":"0","SymbolType":"F","KindID":"1","CID":"TXF","ExpireCode":"","SortColumn":"","SortType":"A"})
      });
      const misData = await misRes.json();
      const tx = misData.RtData.QuoteList.find(q => q.DispEName.startsWith('TX') && q.DispEName.length === 5);
      if (tx && tx.CLastPrice) {
        futuresPrice11 = parseFloat(tx.CLastPrice);
        console.log(`[Futures] 成功即時抓取 11:00 台指期報價: ${futuresPrice11}`);
      }
    } catch (e) {
      console.error('抓取 MIS 即時期貨行情失敗:', e);
    }
  }

  // 5. 寫入資料庫
  const record = { 
    ...existingData,
    date, 
    ...(open !== null && { open }),
    ...(close !== null && { close }),
    ...(price11 !== null && { price11 }),
    ...(futuresOpen !== null && { futuresOpen }),
    ...(futuresClose !== null && { futuresClose }),
    ...(futuresPrice11 !== null && { futuresPrice11 }),
    updatedAt: new Date().toISOString() 
  }
  
  // 只有在真的有抓到任何新資料，或是本來就沒這份 document 的時候才存
  // 避免假日空轉寫入
  const hasMarketData = open || close || price11 || futuresOpen || futuresClose || futuresPrice11;
  if (hasMarketData) {
    await docRef.set(record)
    console.log('已儲存：', JSON.stringify(record))
  } else {
    console.log('沒有抓到任何盤中/盤後資料，可能是假日。不進行儲存。')
  }
} // end main

main().catch(err => {
  console.error('執行失敗：', err)
  process.exit(1)
})
