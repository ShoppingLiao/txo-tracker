import { create } from 'zustand'
import { persist } from 'zustand/middleware'

function calcStats(trades) {
  return {
    contracts: trades.reduce((s, t) => s + (t.contracts || 0), 0),
    commission: trades.reduce((s, t) => s + (t.commission || 0), 0),
    tax: trades.reduce((s, t) => s + (t.tax || 0), 0),
    profit: trades.reduce((s, t) => s + (t.profit || 0), 0),
    count: trades.length,
    wins: trades.filter((t) => t.profit > 0).length,
  }
}

const useTradeStore = create(
  persist(
    (set, get) => ({
      trades: [],

      // ── CRUD ──────────────────────────────────────────────
      addTrade: (trade) =>
        set((s) => ({
          trades: [...s.trades, { ...trade, id: Date.now() }].sort((a, b) =>
            a.date < b.date ? 1 : -1
          ),
        })),

      updateTrade: (id, updated) =>
        set((s) => ({
          trades: s.trades
            .map((t) => (t.id === id ? { ...t, ...updated } : t))
            .sort((a, b) => (a.date < b.date ? 1 : -1)),
        })),

      deleteTrade: (id) =>
        set((s) => ({ trades: s.trades.filter((t) => t.id !== id) })),

      // ── 聚合計算 ──────────────────────────────────────────
      getMonthTrades: (year, month) => {
        const prefix = `${year}-${String(month).padStart(2, '0')}`
        return get().trades.filter((t) => t.date.startsWith(prefix))
      },

      getMonthStats: (year, month) => {
        return calcStats(get().getMonthTrades(year, month))
      },

      getYearStats: (year) => {
        return Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          ...get().getMonthStats(year, i + 1),
        }))
      },

      getYears: () => {
        const years = new Set(get().trades.map((t) => t.date.slice(0, 4)))
        return Array.from(years).sort((a, b) => b - a)
      },

      getYearTotal: (year) => {
        return calcStats(get().trades.filter((t) => t.date.startsWith(year)))
      },

      getCareerStats: () => calcStats(get().trades),

      // 覆蓋匯入（取代全部）
      importTrades: (trades) =>
        set({
          trades: Array.isArray(trades)
            ? [...trades].sort((a, b) => (a.date < b.date ? 1 : -1))
            : [],
        }),

      // 合併匯入（依 id 去重，舊資料保留）
      mergeTrades: (incoming) => {
        if (!Array.isArray(incoming)) return
        set((s) => {
          const existingIds = new Set(s.trades.map((t) => t.id))
          const newOnes = incoming.filter((t) => !existingIds.has(t.id))
          const merged = [...s.trades, ...newOnes].sort((a, b) =>
            a.date < b.date ? 1 : -1
          )
          return { trades: merged }
        })
      },
    }),
    { name: 'txo-trades-v2' }
  )
)

export default useTradeStore
