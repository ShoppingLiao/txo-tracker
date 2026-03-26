import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../lib/firebase'

/** 即時監聽所有大盤行情（有記錄以來全部） */
export function subscribeMarketIndex(callback) {
  const q = query(
    collection(db, 'marketIndex'),
    orderBy('date', 'desc')
  )
  return onSnapshot(q, (snap) => {
    const records = snap.docs.map((d) => d.data())
    callback(records)
  })
}
