import { useState, useMemo } from 'react'
import './IndexCalculator.css'

// 前十大權值股 — 基準：2026/04/23 收盤，大盤 37,714.15 點
// impactPerTwd = 佔比 × 大盤點數 ÷ 股價
const STOCKS = [
  { code: '2330', name: '台積電',     impactPerTwd: 5.71 },
  { code: '2317', name: '鴻海',       impactPerTwd: 5.44 },
  { code: '2454', name: '聯發科',     impactPerTwd: 0.51 },
  { code: '2382', name: '廣達',       impactPerTwd: 2.07 },
  { code: '2412', name: '中華電',     impactPerTwd: 4.23 },
  { code: '2881', name: '富邦金',     impactPerTwd: 6.04 },
  { code: '2308', name: '台達電',     impactPerTwd: 0.26 },
  { code: '2882', name: '國泰金',     impactPerTwd: 5.61 },
  { code: '3711', name: '日月光投控', impactPerTwd: 0.89 },
  { code: '6505', name: '台塑化',     impactPerTwd: 7.54 },
]

function fmtImpact(n) {
  if (n === 0) return '—'
  return (n > 0 ? '+' : '') + n.toFixed(2)
}

function impactClass(n) {
  if (n > 0) return 'positive'
  if (n < 0) return 'negative'
  return ''
}

export default function IndexCalculator() {
  const [changes, setChanges] = useState(() =>
    Object.fromEntries(STOCKS.map(s => [s.code, '']))
  )
  const [baseIndex, setBaseIndex] = useState('')

  const rowImpacts = useMemo(() =>
    STOCKS.map(s => {
      const delta = parseFloat(changes[s.code]) || 0
      return { ...s, delta, impact: delta * s.impactPerTwd }
    })
  , [changes])

  const totalImpact = useMemo(() =>
    rowImpacts.reduce((sum, r) => sum + r.impact, 0)
  , [rowImpacts])

  const base = parseFloat(baseIndex) || 0
  const hasBase = baseIndex.trim() !== '' && !isNaN(base)
  const estimated = base + totalImpact

  function handleChange(code, val) {
    setChanges(prev => ({ ...prev, [code]: val }))
  }

  return (
    <div className="ic-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">大盤權值計算機</h1>
          <p className="page-subtitle">輸入各權值股漲跌點數，估算對大盤的總影響</p>
        </div>
      </div>

      <div className="ic-content">
        <div className="ic-card">
          <div className="ic-table-wrap">
            <table className="ic-table">
              <thead>
                <tr>
                  <th>股票</th>
                  <th className="th-center">漲跌點（元）</th>
                  <th className="th-right">漲1元影響</th>
                  <th className="th-right">本股影響點數</th>
                </tr>
              </thead>
              <tbody>
                {rowImpacts.map(r => (
                  <tr key={r.code}>
                    <td>
                      <span className="ic-stock-name">{r.name}</span>
                      <span className="ic-stock-code">{r.code}</span>
                    </td>
                    <td className="td-input">
                      <input
                        className="ic-input"
                        type="number"
                        placeholder="0"
                        value={changes[r.code]}
                        onChange={e => handleChange(r.code, e.target.value)}
                      />
                    </td>
                    <td className="td-right ic-fixed">{r.impactPerTwd} 點</td>
                    <td className={`td-right ic-result ${impactClass(r.impact)}`}>
                      {fmtImpact(r.impact)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ic-base-row">
            <label className="ic-base-label">大盤基準點數</label>
            <input
              className="ic-base-input"
              type="number"
              placeholder="例：37714"
              value={baseIndex}
              onChange={e => setBaseIndex(e.target.value)}
            />
          </div>

          <div className="ic-summary">
            <div className="ic-summary-row">
              <span className="ic-summary-label">合計影響點數</span>
              <span className={`ic-summary-val ${impactClass(totalImpact)}`}>
                {totalImpact === 0 ? '—' : `${fmtImpact(totalImpact)} 點`}
              </span>
            </div>
            {hasBase && (
              <div className="ic-estimated">
                <span className="ic-estimated-label">估算大盤點數</span>
                <span className={`ic-estimated-val ${impactClass(estimated - base)}`}>
                  {Math.round(estimated).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        <p className="ic-note">
          ※ 影響點數基準：2026/04/23 收盤（大盤 37,714 點），每月建議重新試算
        </p>
      </div>
    </div>
  )
}
