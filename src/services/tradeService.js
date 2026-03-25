import {
  collection, doc, setDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, writeBatch,
} from 'firebase/firestore'
import { db } from '../lib/firebase'

function tradesRef(uid) {
  return collection(db, 'users', uid, 'trades')
}

/** 即時監聽該用戶的所有交易紀錄 */
export function subscribeTrades(uid, callback) {
  const q = query(tradesRef(uid), orderBy('date', 'desc'))
  return onSnapshot(q, (snap) => {
    const trades = snap.docs.map((d) => d.data())
    callback(trades)
  })
}

/** 新增一筆交易（用 Date.now() 作為 id 和文件 key） */
export async function addTrade(uid, trade) {
  const id = Date.now()
  await setDoc(doc(tradesRef(uid), String(id)), { ...trade, id })
  return id
}

/** 更新一筆交易 */
export async function updateTrade(uid, id, data) {
  await updateDoc(doc(tradesRef(uid), String(id)), data)
}

/** 刪除一筆交易 */
export async function deleteTrade(uid, id) {
  await deleteDoc(doc(tradesRef(uid), String(id)))
}

/** 批次匯入（每批最多 400 筆） */
export async function batchImport(uid, trades) {
  for (let i = 0; i < trades.length; i += 400) {
    const chunk = trades.slice(i, i + 400)
    const batch = writeBatch(db)
    chunk.forEach((t) => {
      const id = t.id || Date.now() + Math.random()
      batch.set(doc(tradesRef(uid), String(id)), { ...t, id })
    })
    await batch.commit()
  }
}

/** 批次刪除所有交易 */
export async function deleteAllTrades(uid, trades) {
  for (let i = 0; i < trades.length; i += 400) {
    const chunk = trades.slice(i, i + 400)
    const batch = writeBatch(db)
    chunk.forEach((t) => batch.delete(doc(tradesRef(uid), String(t.id))))
    await batch.commit()
  }
}
