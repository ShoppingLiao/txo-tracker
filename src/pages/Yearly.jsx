import { useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import useTradeStore from '../store/useTradeStore'
import { fmtMoney, profitClass, MONTH_NAMES } from '../utils/format'
import './Yearly.css'

export default function Yearly() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const highlightYear = params.get('year')

  const trades = useTradeStore((s) => s.trades)
  const getYears = useTradeStore((s) => s.getYears)
  const getYearStats = useTradeStore((s) => s.getYearStats)
  const getYearTotal = useTradeStore((s) => s.getYearTotal)
  const getCareerStats = useTradeStore((s) => s.getCareerStats)
  const years = useMemo(() => getYears(), [trades])
  const career = useMemo(() => getCareerStats(), [trades])

  if (years.length === 0) {
    return (
      <div className="yearly">
        <div className="page-header">
          <h1 className="page-title">年結算</h1>
          <p className="page-subtitle">Yearly Settlement</p>
        </div>
        <div className="empty-hint">尚無資料</div>
      </div>
    )
  }

  return (
    <div className="yearly">
      <div className="page-header">
        <div>
          <h1 className="page-title">年結算</h1>
          <p className="page-subtitle">Yearly Settlement</p>
        </div>
      </div>

      {/* 生涯總計列 */}
      <div className="career-bar">
        <span className="cb-label">生涯總計</span>
        <span className={`cb-pnl ${profitClass(career.profit)}`}>{fmtMoney(career.profit)} 元</span>
        <span className="cb-meta">{career.count} 筆 ／ {career.contracts} 口</span>
      </div>

      {/* 年度 × 月份彙整表 */}
      <div className="table-wrapper">
        <table className="yearly-table">
          <thead>
            <tr>
              <th>年份</th>
              <th className="total-col">年合計</th>
              {MONTH_NAMES.map((m) => <th key={m}>{m}</th>)}
            </tr>
          </thead>
          <tbody>
            {years.map((year) => {
              const monthStats = getYearStats(year)
              const yearTotal = getYearTotal(year)
              const isHighlight = year === highlightYear

              return (
                <tr key={year} className={isHighlight ? 'highlighted' : ''}>
                  <td className="year-col">{year}</td>
                  <td
                    className={`total-col cell-pnl ${profitClass(yearTotal.profit)}`}
                    onClick={() => navigate(`/monthly?year=${year}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    {fmtMoney(yearTotal.profit)}
                    <div className="cell-sub">{yearTotal.contracts} 口</div>
                  </td>
                  {monthStats.map(({ month, profit, contracts, count }) => (
                    <td
                      key={month}
                      className={`cell-pnl ${count > 0 ? profitClass(profit) : 'empty-cell'}`}
                      onClick={() => count > 0 && navigate(`/records?year=${year}&month=${month}`)}
                      style={{ cursor: count > 0 ? 'pointer' : 'default' }}
                    >
                      {count > 0 ? (
                        <>
                          {fmtMoney(profit)}
                          <div className="cell-sub">{contracts} 口</div>
                        </>
                      ) : '—'}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
