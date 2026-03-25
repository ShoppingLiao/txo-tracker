import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import useTradeStore from '../store/useTradeStore'
import { fmtMoney, profitClass, MONTH_NAMES } from '../utils/format'
import './Monthly.css'

export default function Monthly() {
  const navigate = useNavigate()
  const trades = useTradeStore((s) => s.trades)
  const getYears = useTradeStore((s) => s.getYears)
  const getYearStats = useTradeStore((s) => s.getYearStats)
  const getYearTotal = useTradeStore((s) => s.getYearTotal)

  const [urlParams] = useSearchParams()
  const currentYear = String(new Date().getFullYear())
  const allYears = useMemo(() => {
    const set = new Set([...getYears(), currentYear])
    return Array.from(set).sort((a, b) => b - a)
  }, [trades])

  const [selYear, setSelYear] = useState(urlParams.get('year') || currentYear)
  const stats = getYearStats(selYear)
  const yearTotal = getYearTotal(selYear)

  return (
    <div className="monthly">
      <div className="page-header">
        <div>
          <h1 className="page-title">月結算</h1>
          <p className="page-subtitle">Monthly Settlement</p>
        </div>
        <div className="year-select-group">
          {allYears.map((y) => (
            <button
              key={y}
              className={`tab ${selYear === y ? 'active' : ''}`}
              onClick={() => setSelYear(y)}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      {/* 年度小計 */}
      <div className="year-summary-bar">
        <span className="ysb-label">{selYear} 年度合計</span>
        <span className={`ysb-pnl ${profitClass(yearTotal.profit)}`}>
          {fmtMoney(yearTotal.profit)} 元
        </span>
        <span className="ysb-meta">{yearTotal.contracts} 口 ／ {yearTotal.count} 筆</span>
      </div>

      {/* 月份卡片 */}
      <div className="month-grid">
        {stats.map(({ month, profit, contracts, commission, tax, count, wins }) => {
          const wr = count ? ((wins / count) * 100).toFixed(0) : null
          const isEmpty = count === 0

          return (
            <div
              key={month}
              className={`month-card ${isEmpty ? 'empty' : profitClass(profit)}`}
              onClick={() => !isEmpty && navigate(`/records?year=${selYear}&month=${month}`)}
            >
              <div className="mc-header">
                <span className="mc-month">{MONTH_NAMES[month - 1]}</span>
                {!isEmpty && <span className="mc-count">{count} 筆</span>}
              </div>
              <div className="mc-pnl">
                {isEmpty ? '—' : fmtMoney(profit)}
              </div>
              {!isEmpty && (
                <div className="mc-detail">
                  <span>{contracts} 口</span>
                  <span>勝率 {wr}%</span>
                </div>
              )}
              {!isEmpty && (
                <div className="mc-cost">
                  手續費 {commission.toLocaleString()} ／ 稅 {tax.toLocaleString()}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
