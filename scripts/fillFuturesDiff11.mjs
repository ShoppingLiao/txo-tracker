/**
 * 補寫台指期「11點-收盤」差值至 Firestore marketIndex
 *
 * 欄位：futuresDiff11（number）= 台指期收盤 - 台指期11點價
 * 正值 = 收盤高於11點；負值 = 收盤低於11點
 *
 * 使用方式：
 *   FIREBASE_SA=./scripts/serviceAccount.json node scripts/fillFuturesDiff11.mjs
 */

import { readFileSync }        from 'fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore }        from 'firebase-admin/firestore'

// ── Firebase 初始化 ──────────────────────────────────────────────
const saPath = process.env.FIREBASE_SA || './scripts/serviceAccount.json'
const serviceAccount = JSON.parse(readFileSync(saPath, 'utf8'))
initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

// ── 手動記錄：台指期「11點→收盤」差值 ──────────────────────────
const FUTURES_DIFFS = {
  '2026-02-23': -264,
  '2026-02-24':   51,
  '2026-02-25': -288,
  '2026-02-26': -123,
  '2026-03-02': -195,
  '2026-03-03': -269,
  '2026-03-04': -297,
  '2026-03-05':  -90,
  '2026-03-06':   79,
  '2026-03-09':  249,
  '2026-03-10':  -62,
  '2026-03-11':   56,
  '2026-03-12':   41,
  '2026-03-13':  -50,
  '2026-03-16':    5,
  '2026-03-17':  137,
  '2026-03-18':  -24,
  '2026-03-19': -257,
  '2026-03-20': -144,
  '2026-03-23':   60,
  '2026-03-24':   26,
  '2026-03-25':  181,
  '2026-03-26':  -76,
}

// ── 主程式 ─────────────────────────────────────────────────────
async function main() {
  const dates = Object.keys(FUTURES_DIFFS).sort()
  console.log(`共 ${dates.length} 筆台指期資料，開始寫入...\n`)

  let updated = 0, missing = 0

  for (const date of dates) {
    const futuresDiff11 = FUTURES_DIFFS[date]
    const ref  = db.collection('marketIndex').doc(date)
    const snap = await ref.get()

    if (!snap.exists) {
      console.log(`  ${date}  ⚠️  Firestore 無此文件，跳過`)
      missing++
      continue
    }

    await ref.update({ futuresDiff11, updatedAt: new Date().toISOString() })
    const sign = futuresDiff11 >= 0 ? '+' : ''
    console.log(`  ${date}  ✏️  台指期 11點-收盤 = ${sign}${futuresDiff11}`)
    updated++
  }

  console.log(`\n完成！寫入 ${updated} 筆　找不到文件 ${missing} 筆`)
}

main().catch(err => { console.error('失敗：', err); process.exit(1) })
