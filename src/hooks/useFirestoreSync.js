import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { subscribeTrades } from '../services/tradeService'
import { subscribeMarketIndex } from '../services/marketIndexService'
import useTradeStore from '../store/useTradeStore'
import useMarketStore from '../store/useMarketStore'

const CACHE_KEY = 'txo_marketIndex'
const CACHE_TTL = 2 * 60 * 60 * 1000  // 2 小時

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { data, cachedAt } = JSON.parse(raw)
    if (Date.now() - cachedAt < CACHE_TTL) return data
  } catch {}
  return null
}

function saveCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, cachedAt: Date.now() }))
  } catch {}
}

/** App 啟動後自動訂閱 Firestore，保持 store 與雲端同步 */
export function useFirestoreSync() {
  const { user } = useAuth()
  const setTrades        = useTradeStore((s) => s.setTrades)
  const setMarketRecords = useMarketStore((s) => s.setMarketRecords)

  // ── 交易紀錄（per-user，不快取） ──────────────────────────────
  useEffect(() => {
    if (!user) {
      setTrades([])
      return
    }
    return subscribeTrades(user.uid, setTrades)
  }, [user])

  // ── 大盤行情（全域共用，localStorage 快取 2 小時） ─────────────
  useEffect(() => {
    const cached = loadCache()
    if (cached) {
      // 快取有效：直接用，不打 Firestore
      setMarketRecords(cached)
      return
    }
    // 快取過期：訂閱 Firestore，拿到後存快取
    return subscribeMarketIndex((records) => {
      setMarketRecords(records)
      saveCache(records)
    })

  }, [])
}
