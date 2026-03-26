import { useMemo } from 'react'
import dayjs from 'dayjs'
import { SETTLEMENTS_2026 as SETTLEMENTS } from '../utils/settlements'
import './CalendarPage.css'

const YEAR = 2026

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_ZH = ['一月','二月','三月','四月','五月','六月',
                  '七月','八月','九月','十月','十一月','十二月']
const DOW = ['日', '一', '二', '三', '四', '五', '六']

/** 取某月全部日期格子（含補空格） */
function buildCalendarCells(year, month) {
  const firstDay = new Date(year, month - 1, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return cells
}

/** 找下一個結算日 */
function getNextSettlement(today) {
  const todayStr = today.format('YYYY-MM-DD')
  for (let m = 1; m <= 12; m++) {
    for (const d of (SETTLEMENTS[m] || [])) {
      const s = dayjs(`${YEAR}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`)
      if (!s.isBefore(today)) return s
    }
  }
  return null
}

function MonthCard({ month, todayM, todayD, year }) {
  const cells = buildCalendarCells(year, month)
  const settlements = SETTLEMENTS[month] || []
  const settlementSet = new Set(settlements)

  return (
    <div className="cal-card">
      <div className="cal-card-header">
        <span className="cal-month-zh">{MONTH_ZH[month - 1]}</span>
        <span className="cal-month-en">{MONTH_NAMES[month - 1]}</span>
        <span className="cal-count">{settlements.length} 筆</span>
      </div>

      <div className="cal-grid">
        {DOW.map((d) => (
          <div key={d} className="cal-dow">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />
          const isSettlement = settlementSet.has(day)
          const isToday = month === todayM && day === todayD && year === YEAR
          return (
            <div
              key={day}
              className={[
                'cal-day',
                isSettlement ? 'settlement' : '',
                isToday ? 'today' : '',
              ].join(' ')}
            >
              {day}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function CalendarPage() {
  const today = useMemo(() => dayjs(), [])
  const next  = useMemo(() => getNextSettlement(today), [today])
  const diff  = next ? next.startOf('day').diff(today.startOf('day'), 'day') : null

  return (
    <div className="cal-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">台指期選擇權結算行事曆</h1>
          <p className="page-subtitle">{YEAR} Settlement Calendar</p>
        </div>
      </div>

      {/* 下一個結算日提示 */}
      {next && (
        <div className="cal-next-bar">
          <span className="cal-next-label">下一個結算日</span>
          <span className="cal-next-date">
            {next.format('MM/DD')}
            <span className="cal-next-dow">（{DOW[next.day()]}）</span>
          </span>
          <span className="cal-next-diff">
            {diff === 0 ? '就是今天！' : `${diff} 天後`}
          </span>
        </div>
      )}

      {/* 圖例 */}
      <div className="cal-legend">
        <span className="legend-item"><span className="dot settlement-dot" />結算日</span>
        <span className="legend-item"><span className="dot today-dot" />今日</span>
      </div>

      {/* 月份卡片 */}
      <div className="cal-months">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
          <MonthCard
            key={m}
            month={m}
            year={YEAR}
            todayM={today.month() + 1}
            todayD={today.date()}
          />
        ))}
      </div>
    </div>
  )
}
