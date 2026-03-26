import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'

/** 即時監聽最近 N 筆大盤行情（預設 60 筆，約 3 個月） */
export function subscribeMarketIndex(callback, n = 60) {
  const q = query(
    collection(db, 'marketIndex'),
    orderBy('date', 'desc'),
    limit(n)
  )
  return onSnapshot(q, (snap) => {
    const records = snap.docs.map((d) => d.data())
    callback(records)
  })
}
