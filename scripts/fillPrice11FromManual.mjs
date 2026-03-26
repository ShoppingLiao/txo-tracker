/**
 * 用手動記錄的「11點-收盤」差值，回推並補寫 price11
 *
 * 公式：price11 = close - diff11
 *
 * 只補寫 price11 為 null 的記錄，不覆蓋已有的 Fugle API 資料。
 *
 * 使用方式：
 *   FIREBASE_SA=./scripts/serviceAccount.json node scripts/fillPrice11FromManual.mjs
 */

import { readFileSync }        from 'fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore }        from 'firebase-admin/firestore'

// ── Firebase 初始化 ──────────────────────────────────────────────
const saPath = process.env.FIREBASE_SA || './scripts/serviceAccount.json'
const serviceAccount = JSON.parse(readFileSync(saPath, 'utf8'))
initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

// ── 手動記錄：加權指數「11點→收盤」差值（close - price11）────────
// 正值 = 收盤高於11點；負值 = 收盤低於11點
const MANUAL_DIFFS = {
  '2026-02-23': -355,
  '2026-02-24':  201,
  '2026-02-25': -179,
  '2026-02-26':  -76,
  '2026-03-02': -154,
  '2026-03-03': -202,
  '2026-03-04': -276,
  '2026-03-05':  -25,
  '2026-03-06': -104,
  '2026-03-09':   92,
  '2026-03-10': -127,
  '2026-03-11':  207,
  '2026-03-12':  -23,
  '2026-03-13':  -82,
  '2026-03-16':  -13,
  '2026-03-17':   54,
  '2026-03-18':  -44,
  '2026-03-19': -228,
  '2026-03-20': -211,
  '2026-03-23':  133,
  '2026-03-24':    1,
  '2026-03-25':  125,
  '2026-03-26':  -73,
}

// ── 主程式 ─────────────────────────────────────────────────────
async function main() {
  const dates = Object.keys(MANUAL_DIFFS).sort()
  console.log(`共 ${dates.length} 筆手動資料，開始處理...\n`)

  let updated = 0, skipped = 0, missing = 0

  for (const date of dates) {
    const diff = MANUAL_DIFFS[date]
    const ref  = db.collection('marketIndex').doc(date)
    const snap = await ref.get()

    if (!snap.exists) {
      console.log(`  ${date}  ⚠️  Firestore 無此文件，跳過`)
      missing++
      continue
    }

    const data = snap.data()

    if (data.price11 != null) {
      console.log(`  ${date}  ✓  price11 已有值 ${data.price11}，略過`)
      skipped++
      continue
    }

    if (data.close == null) {
      console.log(`  ${date}  ⚠️  close 為 null，無法計算，跳過`)
      missing++
      continue
    }

    const price11 = Math.round(data.close - diff)
    await ref.update({ price11, updatedAt: new Date().toISOString() })
    console.log(`  ${date}  ✏️  close=${data.close}  diff=${diff}  → price11=${price11}`)
    updated++
  }

  console.log(`\n完成！更新 ${updated} 筆　略過(已有值) ${skipped} 筆　缺資料 ${missing} 筆`)
}

main().catch(err => { console.error('失敗：', err); process.exit(1) })
