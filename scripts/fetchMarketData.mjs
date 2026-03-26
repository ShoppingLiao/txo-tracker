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
  console.log(`[${new Date().toISOString()}] 抓取 ${date} 大盤與期貨行情...`)

  // 1. 每日 K 棒（開盤、收盤）
  const histUrl = `${BASE}/historical/candles/${SYMBOL}` +
    `?timeframe=D&from=${date}&to=${date}&fields=open,close&sort=asc`
  const hist = await get(histUrl)
  const day = hist.data?.[0]

  if (!day) {
    console.log('今日無交易資料（假日或盤後資料尚未更新），結束。')
    return
  }

  const open  = day.open
  const close = day.close

  // 2. 盤中 1 分鐘 K 棒 → 找 11:00 那根的 open（即 11 點整的現價）
  const intradayUrl = `${BASE}/intraday/candles/${SYMBOL}?timeframe=1`
  const intraday = await get(intradayUrl)

  const candle11 = intraday.data?.find(c =>
    c.date.startsWith(`${date}T11:00:00`)
  )
  const price11 = candle11?.open ?? null

  if (price11 === null) {
    console.warn('找不到 11:00 分鐘 K 棒，price11 記為 null')
  }

  // 3. 抓取台指期（一般交易時段，近月合約）開盤及收盤價
  let futuresOpen = null
  let futuresClose = null
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
      
      // 找尋 'TX' & '一般'，且到期月份不能有 '/'（長度為 6 的純月份，像是 202604）
      let txGeneralRows = dataLines.map(l => l.split(','))
        .filter(r => r[1] === 'TX' && r[17] === '一般' && r[2].trim().length === 6)
      
      if (txGeneralRows.length > 0) {
        // 以到期月份排序，確保拿最近的月份
        txGeneralRows.sort((a,b) => a[2].trim().localeCompare(b[2].trim()))
        const r = txGeneralRows[0]
        futuresOpen = parseInt(r[3], 10)
        futuresClose = parseInt(r[6], 10)
      } else {
        console.warn('TAIFEX CSV 有回傳，但未找到 TX 一般時段的近月合約資料。')
      }
    } else {
      console.warn(`TAIFEX API 錯誤：${taifexRes.status}`)
    }
  } catch (e) {
    console.error('抓取台指期資料時發生異常：', e)
  }

  // 4. 寫入 Firestore  marketIndex/{date}
  // 取出現有資料（以便推算 futuresPrice11）
  const docRef = db.collection('marketIndex').doc(date)
  const docSnap = await docRef.get()
  const existingData = docSnap.exists ? docSnap.data() : {}
  
  let futuresPrice11 = existingData.futuresPrice11 ?? null
  const futuresDiff11 = existingData.futuresDiff11 ?? null
  
  // 若我們有 futuresClose 且已有手動補好的 futuresDiff11，則自動推算出 11:00 的價格
  if (futuresClose !== null && futuresDiff11 !== null && futuresPrice11 === null) {
    futuresPrice11 = futuresClose - futuresDiff11
  }

  // 5. 即時抓取期貨現價（若於 11:00 執行則可作為 futuresPrice11）
  const currentUTC = new Date().getUTCHours()
  // 檢查是否大約在台灣時間 11:00 (UTC 03:xx)
  if (currentUTC === 3) {
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

  const record = { 
    ...existingData,
    date, 
    open, 
    price11, 
    close,
    ...(futuresOpen !== null && { futuresOpen }),
    ...(futuresClose !== null && { futuresClose }),
    ...(futuresPrice11 !== null && { futuresPrice11 }),
    updatedAt: new Date().toISOString() 
  }
  await docRef.set(record)

  console.log('已儲存：', JSON.stringify(record))
}

main().catch(err => {
  console.error('執行失敗：', err)
  process.exit(1)
})
