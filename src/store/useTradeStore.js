import { create } from 'zustand'

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

const useTradeStore = create((set, get) => ({
  trades: [],

  /** 由 useFirestoreSync 呼叫，將 Firestore 資料同步到 store */
  setTrades: (trades) => set({ trades }),

  // ── 聚合計算（唯讀，供各頁面直接使用） ────────────────────
  getMonthTrades: (year, month) => {
    const prefix = `${year}-${String(month).padStart(2, '0')}`
    return get().trades.filter((t) => t.date.startsWith(prefix))
  },

  getMonthStats: (year, month) => calcStats(get().getMonthTrades(year, month)),

  getYearStats: (year) =>
    Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      ...get().getMonthStats(year, i + 1),
    })),

  getYears: () => {
    const years = new Set(get().trades.map((t) => t.date.slice(0, 4)))
    return Array.from(years).sort((a, b) => b - a)
  },

  getYearTotal: (year) =>
    calcStats(get().trades.filter((t) => t.date.startsWith(year))),

  getCareerStats: () => calcStats(get().trades),
}))

export default useTradeStore
