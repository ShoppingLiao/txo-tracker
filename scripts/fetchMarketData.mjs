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
  console.log(`[${new Date().toISOString()}] 抓取 ${date} 大盤行情...`)

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

  // 3. 寫入 Firestore  marketIndex/{date}
  const record = { date, open, price11, close, updatedAt: new Date().toISOString() }
  await db.collection('marketIndex').doc(date).set(record)

  console.log('已儲存：', JSON.stringify(record))
}

main().catch(err => {
  console.error('執行失敗：', err)
  process.exit(1)
})
