import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTrades } from '../hooks/useTrades'
import TradeForm from '../components/Records/TradeForm'
import { fmtMoney, fmtPct, profitClass, MONTH_NAMES } from '../utils/format'
import './Records.css'

export default function Records() {
  const { trades, deleteTrade, getYears } = useTrades()
  const [urlParams] = useSearchParams()

  const currentYear = String(new Date().getFullYear())
  const initYear = urlParams.get('year') || currentYear
  const initMonth = urlParams.get('month') ? Number(urlParams.get('month')) : null
  const [selYear, setSelYear] = useState(initYear)
  const [selMonth, setSelMonth] = useState(initMonth) // null = 全年
  const [showForm, setShowForm] = useState(false)
  const [editTrade, setEditTrade] = useState(null)

  // 可選年份（含當前）
  const allYears = useMemo(() => {
    const set = new Set([...getYears(), currentYear])
    return Array.from(set).sort((a, b) => b - a)
  }, [trades])

  // 篩選資料
  const filtered = useMemo(() => {
    return trades.filter((t) => {
      if (!t.date.startsWith(selYear)) return false
      if (selMonth !== null) {
        const mm = String(selMonth).padStart(2, '0')
        return t.date.startsWith(`${selYear}-${mm}`)
      }
      return true
    })
  }, [trades, selYear, selMonth])

  // 月份小計（依月分組）
  const groups = useMemo(() => {
    const map = new Map()
    filtered.forEach((t) => {
      const m = parseInt(t.date.slice(5, 7))
      if (!map.has(m)) map.set(m, [])
      map.get(m).push(t)
    })
    return Array.from(map.entries()).sort(([a], [b]) => b - a)
  }, [filtered])

  function openEdit(trade) {
    setEditTrade(trade)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditTrade(null)
  }

  function handleDelete(id) {
    if (window.confirm('確定刪除此筆紀錄？')) deleteTrade(id)
  }

  return (
    <div className="records">
      <div className="page-header">
        <div>
          <h1 className="page-title">操作紀錄</h1>
          <p className="page-subtitle">Trading Records</p>
        </div>
        <button className="btn-add" onClick={() => setShowForm(true)}>＋ 新增紀錄</button>
      </div>

      {/* 年份 Tabs */}
      <div className="tabs">
        {allYears.map((y) => (
          <button
            key={y}
            className={`tab ${selYear === y ? 'active' : ''}`}
            onClick={() => { setSelYear(y); setSelMonth(null) }}
          >
            {y}
          </button>
        ))}
      </div>

      {/* 月份 Tabs */}
      <div className="month-tabs">
        <button
          className={`month-tab ${selMonth === null ? 'active' : ''}`}
          onClick={() => setSelMonth(null)}
        >
          全年
        </button>
        {MONTH_NAMES.map((name, i) => (
          <button
            key={i}
            className={`month-tab ${selMonth === i + 1 ? 'active' : ''}`}
            onClick={() => setSelMonth(i + 1)}
          >
            {name}
          </button>
        ))}
      </div>

      {/* 資料表格（依月分組） */}
      {groups.length === 0 ? (
        <div className="empty-hint">此期間無資料</div>
      ) : (
        groups.map(([month, rows]) => (
          <MonthGroup
            key={month}
            month={month}
            year={selYear}
            rows={rows}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        ))
      )}

      {showForm && <TradeForm trade={editTrade} onClose={closeForm} />}
    </div>
  )
}

function MonthGroup({ month, year, rows, onEdit, onDelete }) {
  const subtotal = rows.reduce((s, t) => s + (t.profit || 0), 0)
  const contracts = rows.reduce((s, t) => s + (t.contracts || 0), 0)

  return (
    <div className="month-group">
      <div className="month-group-header">
        <span className="month-group-title">{year} {MONTH_NAMES[month - 1]}</span>
        <span className={`month-subtotal ${profitClass(subtotal)}`}>
          小計 {fmtMoney(subtotal)} 元
        </span>
        <span className="month-contracts">{contracts} 口</span>
      </div>
      <div className="table-wrapper">
        <table className="trade-table">
          <thead>
            <tr>
              <th>日期</th>
              <th>星期</th>
              <th>總口數</th>
              <th>手續費</th>
              <th>期交稅</th>
              <th>實際獲利</th>
              <th>報酬率</th>
              <th>備註</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <td>{t.date.slice(5)}</td>
                <td>{t.dayOfWeek}</td>
                <td>{t.contracts}</td>
                <td>{t.commission?.toLocaleString()}</td>
                <td>{t.tax?.toLocaleString()}</td>
                <td className={profitClass(t.profit)}>
                  {fmtMoney(t.profit)}
                </td>
                <td className={typeof t.returnRate === 'number' ? profitClass(t.returnRate) : 'note-cell'}>
                  {typeof t.returnRate === 'number' ? fmtPct(t.returnRate) : (t.returnRate || '—')}
                </td>
                <td className="note-cell">{t.note}</td>
                <td className="action-cell">
                  <button className="btn-edit" onClick={() => onEdit(t)}>編輯</button>
                  <button className="btn-delete" onClick={() => onDelete(t.id)}>刪除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
