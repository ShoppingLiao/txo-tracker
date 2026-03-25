import { useAuth } from '../contexts/AuthContext'
import useTradeStore from '../store/useTradeStore'
import * as svc from '../services/tradeService'

/**
 * 統一的交易資料 hook：
 * - 讀取：直接從 Zustand store（已由 useFirestoreSync 保持同步）
 * - 寫入：先寫 Firestore，onSnapshot 再更新 store
 */
export function useTrades() {
  const { user } = useAuth()
  const trades        = useTradeStore((s) => s.trades)
  const getYears      = useTradeStore((s) => s.getYears)
  const getMonthTrades = useTradeStore((s) => s.getMonthTrades)
  const getMonthStats  = useTradeStore((s) => s.getMonthStats)
  const getYearStats   = useTradeStore((s) => s.getYearStats)
  const getYearTotal   = useTradeStore((s) => s.getYearTotal)
  const getCareerStats = useTradeStore((s) => s.getCareerStats)

  const addTrade = (data) => svc.addTrade(user.uid, data)

  const updateTrade = (id, data) => svc.updateTrade(user.uid, id, data)

  const deleteTrade = (id) => svc.deleteTrade(user.uid, id)

  /** 下載當前資料為 JSON 備份 */
  const exportJSON = () => {
    const blob = new Blob(
      [JSON.stringify({ trades }, null, 2)],
      { type: 'application/json' }
    )
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `txo-trades-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  /** 從 JSON 檔案合併匯入（依 id 去重，不覆蓋已有資料） */
  const importJSON = () => _pickAndImport(false)

  /** 從 JSON 檔案覆蓋匯入（清空後重新寫入） */
  const replaceJSON = () => _pickAndImport(true)

  function _pickAndImport(replace) {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      try {
        const parsed = JSON.parse(await file.text())
        const incoming = Array.isArray(parsed) ? parsed : (parsed.trades ?? [])
        if (replace) {
          await svc.deleteAllTrades(user.uid, trades)
          await svc.batchImport(user.uid, incoming)
        } else {
          const existing = new Set(trades.map((t) => t.id))
          await svc.batchImport(user.uid, incoming.filter((t) => !existing.has(t.id)))
        }
      } catch {
        alert('匯入失敗：請確認檔案格式正確')
      }
    }
    input.click()
  }

  return {
    trades,
    getYears,
    getMonthTrades,
    getMonthStats,
    getYearStats,
    getYearTotal,
    getCareerStats,
    addTrade,
    updateTrade,
    deleteTrade,
    exportJSON,
    importJSON,
    replaceJSON,
  }
}
