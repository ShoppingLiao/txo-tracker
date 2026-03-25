import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import useTradeStore from '../store/useTradeStore'
import { fmtMoney, profitClass } from '../utils/format'
import './Dashboard.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const trades = useTradeStore((s) => s.trades)
  const getCareerStats = useTradeStore((s) => s.getCareerStats)
  const getYears = useTradeStore((s) => s.getYears)
  const getYearTotal = useTradeStore((s) => s.getYearTotal)
  const career = useMemo(() => getCareerStats(), [trades])
  const years = useMemo(() => getYears(), [trades])

  const winRate = career.count ? ((career.wins / career.count) * 100).toFixed(1) : 0

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1 className="page-title">生涯總覽</h1>
        <p className="page-subtitle">Career Overview</p>
      </div>

      {/* 生涯大數字 */}
      <div className="career-hero">
        <div className="career-pnl-label">生涯累計損益</div>
        <div className={`career-pnl ${profitClass(career.profit)}`}>
          {fmtMoney(career.profit)}
          <span className="career-unit">元</span>
        </div>
        <div className="career-meta">
          <span>共 {career.count} 筆操作</span>
          <span className="dot">·</span>
          <span>總口數 {career.contracts.toLocaleString()} 口</span>
          <span className="dot">·</span>
          <span>勝率 {winRate}%</span>
          <span className="dot">·</span>
          <span>手續費 {career.commission.toLocaleString()}</span>
          <span className="dot">·</span>
          <span>期交稅 {career.tax.toLocaleString()}</span>
        </div>
      </div>

      {/* 年度卡片 */}
      {years.length > 0 && (
        <div className="section">
          <h2 className="section-title">年度結算</h2>
          <div className="year-cards">
            {years.map((year) => {
              const s = getYearTotal(year)
              const wr = s.count ? ((s.wins / s.count) * 100).toFixed(1) : 0
              return (
                <div
                  key={year}
                  className={`year-card ${profitClass(s.profit)}`}
                  onClick={() => navigate(`/yearly?year=${year}`)}
                >
                  <div className="year-label">{year}</div>
                  <div className="year-pnl">{fmtMoney(s.profit)}</div>
                  <div className="year-detail">
                    <span>{s.count} 筆</span>
                    <span>{s.contracts} 口</span>
                    <span>勝率 {wr}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {career.count === 0 && (
        <div className="empty-hint">
          尚無交易紀錄，請前往「操作紀錄」新增資料
        </div>
      )}
    </div>
  )
}
