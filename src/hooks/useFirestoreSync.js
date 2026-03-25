import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { subscribeTrades } from '../services/tradeService'
import useTradeStore from '../store/useTradeStore'

/** App 啟動後自動訂閱 Firestore，保持 store 與雲端同步 */
export function useFirestoreSync() {
  const { user } = useAuth()
  const setTrades = useTradeStore((s) => s.setTrades)

  useEffect(() => {
    if (!user) {
      setTrades([])
      return
    }
    const unsub = subscribeTrades(user.uid, (trades) => {
      setTrades(trades)
    })
    return unsub
  }, [user])
}
