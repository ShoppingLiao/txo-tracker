import { useState, useMemo } from 'react'
import dayjs from 'dayjs'
import useMarketStore from '../store/useMarketStore'
import { isSettlementDay } from '../utils/settlements'
import { MONTH_NAMES } from '../utils/format'
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

function fmtDiff(val) {
  if (val == null) return '—'
  return (val > 0 ? '+' : '') + fmt(val)
}

export default function MarketIndex() {
  const records = useMarketStore((s) => s.marketRecords)
  const loading = records.length === 0
  const currentYear = String(new Date().getFullYear())
  const currentMonth = new Date().getMonth() + 1

  const [view,     setView]     = useState('taiex')   // 'taiex' | 'futures'
  const [selYear,  setSelYear]  = useState(currentYear)
  const [selMonth, setSelMonth] = useState(currentMonth)
  const [onlySettlement, setOnlySettlement] = useState(true)

  const allYears = useMemo(() => {
    const set = new Set(records.map(r => r.date.slice(0, 4)))
    set.add(currentYear)
    return Array.from(set).sort((a, b) => b - a)
  }, [records, currentYear])

  const filtered = useMemo(() => {
    return records.filter(r => {
      if (!r.date.startsWith(selYear)) return false
      if (selMonth !== null) {
        const mm = String(selMonth).padStart(2, '0')
        if (!r.date.startsWith(`${selYear}-${mm}`)) return false
      }
      if (onlySettlement && !isSettlementDay(r.date)) return false
      return true
    })
  }, [records, selYear, selMonth, onlySettlement])

  return (
    <div className="mi-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">大盤歷史行情</h1>
          <p className="page-subtitle">台灣加權指數 · 每日自動更新</p>
        </div>
      </div>

      {/* 頂部控制列：現貨/期貨切換 & 結算日勾選 */}
      <div className="mi-top-controls">
        <div className="mi-view-tabs">
          <button
            className={`mi-view-tab ${view === 'taiex' ? 'active' : ''}`}
            onClick={() => setView('taiex')}
          >大盤現貨</button>
          <button
            className={`mi-view-tab ${view === 'futures' ? 'active' : ''}`}
            onClick={() => setView('futures')}
          >台指期貨</button>
        </div>

        <label className="mi-filter-label">
          <input
            type="checkbox"
            checked={onlySettlement}
            onChange={(e) => setOnlySettlement(e.target.checked)}
          />
          結算日
        </label>
      </div>

      {/* 年份 Tabs */}
      <div className="tabs">
        {allYears.map(y => (
          <button key={y} className={`tab ${selYear === y ? 'active' : ''}`}
            onClick={() => { setSelYear(y); setSelMonth(null) }}>
            {y}
          </button>
        ))}
      </div>

      {/* 月份 Tabs */}
      <div className="month-tabs">
        <button className={`month-tab ${selMonth === null ? 'active' : ''}`}
          onClick={() => setSelMonth(null)}>全年</button>
        {MONTH_NAMES.map((name, i) => (
          <button key={i} className={`month-tab ${selMonth === i + 1 ? 'active' : ''}`}
            onClick={() => setSelMonth(i + 1)}>{name}</button>
        ))}
      </div>

      {loading ? (
        <div className="mi-loading">載入中...</div>
      ) : filtered.length === 0 ? (
        <div className="mi-empty">此期間無資料</div>
      ) : (
        <div className="mi-table-wrap">
          <table className="mi-table">
            <thead>
              <tr>
                <th className="mi-th-flag">結算日</th>
                <th>日期</th>
                <th>星期</th>
                <th>開盤</th>
                <th>11 點</th>
                <th>收盤</th>
                <th>尾盤落差</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const d          = dayjs(r.date)
                const settlement = isSettlementDay(r.date)

                if (view === 'taiex') {
                  const diff11  = r.price11 != null && r.close != null
                    ? r.close - r.price11 : null
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
                      <td className={diffClass(diff11)}>{fmtDiff(diff11)}</td>
                    </tr>
                  )
                }

                // 台指期貨 view
                const fo = r.futuresOpen ?? null
                const fc = r.futuresClose ?? null
                const fp11 = r.futuresPrice11 ?? null
                
                // 優先使用從資料庫抓到的 / 推算出的 diff
                let fd = r.futuresDiff11 ?? null
                if (fd === null && fc !== null && fp11 !== null) {
                  fd = fc - fp11
                }
                
                return (
                  <tr key={r.date} className={settlement ? 'mi-row-settlement' : ''}>
                    <td className="mi-flag">
                      {settlement && <span className="mi-settlement-icon" title="結算日">🔔</span>}
                    </td>
                    <td className="mi-date">{d.format('MM/DD')}</td>
                    <td className="mi-dow">{DOW_ZH[d.day()]}</td>
                    <td>{fmt(fo)}</td>
                    <td>{fmt(fp11)}</td>
                    <td>{fmt(fc)}</td>
                    <td className={diffClass(fd)}>{fmtDiff(fd)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mi-note">資料來源：富果 API ． 每交易日 14:00 後自動更新 🔔 = 結算日</p>
    </div>
  )
}
