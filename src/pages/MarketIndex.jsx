import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { subscribeMarketIndex } from '../services/marketIndexService'
import { isSettlementDay } from '../utils/settlements'
import './MarketIndex.css'

const DOW_ZH = ['日', '一', '二', '三', '四', '五', '六']

function fmt(n) {
  if (n == null) return '—'
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function diffClass(val) {
  if (val == null) return ''
  return val > 0 ? 'up' : val < 0 ? 'down' : ''
}

export default function MarketIndex() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = subscribeMarketIndex((data) => {
      setRecords(data)
      setLoading(false)
    })
    return unsub
  }, [])

  return (
    <div className="mi-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">大盤歷史行情</h1>
          <p className="page-subtitle">台灣加權指數 · 每日自動更新</p>
        </div>
      </div>

      {loading ? (
        <div className="mi-loading">載入中...</div>
      ) : records.length === 0 ? (
        <div className="mi-empty">尚無資料，等待 GitHub Actions 首次執行後顯示</div>
      ) : (
        <div className="mi-table-wrap">
          <table className="mi-table">
            <thead>
              <tr>
                <th className="mi-th-flag"></th>
                <th>日期</th>
                <th>星期</th>
                <th>開盤</th>
                <th>11 點</th>
                <th>收盤</th>
                <th>11點-收盤</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => {
                const d          = dayjs(r.date)
                const settlement = isSettlementDay(r.date)
                const diff11     = r.price11 != null && r.close != null
                  ? r.price11 - r.close : null
                const diffCls    = diffClass(diff11)
                return (
                  <tr key={r.date} className={settlement ? 'mi-row-settlement' : ''}>
                    <td className="mi-flag">
                      {settlement && <span className="mi-settlement-icon" title="結算日">🔔</span>}
                    </td>
                    <td className="mi-date">{d.format('MM/DD')}</td>
                    <td className="mi-dow">{DOW_ZH[d.day()]}</td>
                    <td>{fmt(r.open)}</td>
                    <td>{fmt(r.price11)}</td>
                    <td>{fmt(r.close)}</td>
                    <td className={diffCls}>
                      {diff11 != null ? (diff11 > 0 ? '+' : '') + fmt(diff11) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mi-note">資料來源：富果 API · 每交易日 14:00 後自動更新　🔔 = 結算日</p>
    </div>
  )
}
