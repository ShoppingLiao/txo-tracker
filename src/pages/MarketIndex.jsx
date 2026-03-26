import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { subscribeMarketIndex } from '../services/marketIndexService'
import './MarketIndex.css'

const DOW_ZH = ['日', '一', '二', '三', '四', '五', '六']

function fmt(n) {
  if (n == null) return '—'
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function changeClass(val) {
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
                <th>日期</th>
                <th>星期</th>
                <th>開盤</th>
                <th>11 點</th>
                <th>收盤</th>
                <th>漲跌</th>
                <th>漲跌幅</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => {
                const d      = dayjs(r.date)
                const change = r.open != null && r.close != null
                  ? r.close - r.open : null
                const pct    = r.open != null && r.open !== 0 && change != null
                  ? (change / r.open * 100) : null
                const cls    = changeClass(change)
                return (
                  <tr key={r.date}>
                    <td className="mi-date">{d.format('MM/DD')}</td>
                    <td className="mi-dow">{DOW_ZH[d.day()]}</td>
                    <td>{fmt(r.open)}</td>
                    <td>{fmt(r.price11)}</td>
                    <td className={cls}>{fmt(r.close)}</td>
                    <td className={cls}>
                      {change != null ? (change > 0 ? '+' : '') + fmt(change) : '—'}
                    </td>
                    <td className={cls}>
                      {pct != null ? (pct > 0 ? '+' : '') + pct.toFixed(2) + '%' : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mi-note">資料來源：富果 API · 每交易日 14:00 後自動更新</p>
    </div>
  )
}
