/**
 * 一次性補抓歷史大盤資料
 *
 * 使用方式（在專案根目錄執行）：
 *   FUGLE_API_KEY=你的token \
 *   FIREBASE_SA=./scripts/serviceAccount.json \
 *   node scripts/backfill.mjs
 *
 * 可選：指定日期範圍（預設近 30 天）
 *   FROM=2026-03-01 TO=2026-03-25 FUGLE_API_KEY=xxx FIREBASE_SA=./scripts/serviceAccount.json node scripts/backfill.mjs
 */

import { readFileSync }          from 'fs'
import { initializeApp, cert }   from 'firebase-admin/app'
import { getFirestore }          from 'firebase-admin/firestore'

// ── Firebase 初始化 ────────────────────────────────────────────
const saPath = process.env.FIREBASE_SA || './scripts/serviceAccount.json'
const serviceAccount = JSON.parse(readFileSync(saPath, 'utf8'))
initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

// ── 設定 ──────────────────────────────────────────────────────
const FUGLE_KEY = process.env.FUGLE_API_KEY
const BASE      = 'https://api.fugle.tw/marketdata/v1.0/stock'
const SYMBOL    = 'IX0001'

if (!FUGLE_KEY) { console.error('請設定 FUGLE_API_KEY'); process.exit(1) }

// ── 日期範圍 ──────────────────────────────────────────────────
function todayTW() {
  return new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10)
}
function daysAgo(n) {
  return new Date(Date.now() + 8 * 3600_000 - n * 86400_000).toISOString().slice(0, 10)
}

const FROM = process.env.FROM || daysAgo(30)
const TO   = process.env.TO   || daysAgo(1)   // 不包含今天（今天由排程處理）

console.log(`補資料範圍：${FROM} ～ ${TO}`)

// ── API ───────────────────────────────────────────────────────
async function get(url) {
  const res = await fetch(url, { headers: { 'X-API-KEY': FUGLE_KEY } })
  if (!res.ok) throw new Error(`Fugle ${res.status}: ${await res.text()}`)
  return res.json()
}

// ── 主程式 ────────────────────────────────────────────────────
async function main() {
  // 1. 一次抓整段每日 K 棒（含 open、close）
  const histUrl = `${BASE}/historical/candles/${SYMBOL}` +
    `?timeframe=D&from=${FROM}&to=${TO}&fields=open,close&sort=asc`
  const hist = await get(histUrl)
  const dayMap = {}
  for (const c of (hist.data || [])) {
    dayMap[c.date] = { open: c.open, close: c.close }
  }
  console.log(`歷史 K 棒：共 ${Object.keys(dayMap).length} 筆`)

  // 2. 一次抓盤中 1 分鐘 K（涵蓋近 30 天）
  const intradayUrl = `${BASE}/intraday/candles/${SYMBOL}?timeframe=1`
  const intraday = await get(intradayUrl)
  const price11Map = {}
  for (const c of (intraday.data || [])) {
    if (c.date.includes('T11:00:00')) {
      const date = c.date.slice(0, 10)
      price11Map[date] = c.open
    }
  }
  console.log(`11 點資料：共 ${Object.keys(price11Map).length} 筆`)

  // 3. 合併寫入 Firestore
  const batch = db.batch()
  let count = 0
  for (const [date, { open, close }] of Object.entries(dayMap)) {
    const price11  = price11Map[date] ?? null
    const ref      = db.collection('marketIndex').doc(date)
    batch.set(ref, { date, open, price11, close, updatedAt: new Date().toISOString() })
    console.log(`  ${date}  開${open}  11點${price11 ?? '—'}  收${close}`)
    count++
  }
  await batch.commit()
  console.log(`\n✅ 完成！共寫入 ${count} 筆資料`)
}

main().catch(err => { console.error('失敗：', err); process.exit(1) })
