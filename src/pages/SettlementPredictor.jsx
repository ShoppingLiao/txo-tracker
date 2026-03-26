import { useState } from 'react'
import './SettlementPredictor.css'

// 歷史估算區間（暫定，後續可調整）
const RANGES = {
  taiex:   { up: [150, 250],  down: [-250, -350] },
  futures: { up: [100, 200],  down: [-200, -300] },
}

function fmt(n) {
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function Thermometer({ taiex, futures }) {
  const t = RANGES.taiex
  const f = RANGES.futures

  // 加權指數邊界
  const tUpOuter  = taiex   + t.up[1]    // 上方外緣（安全區起點）
  const tUpInner  = taiex   + t.up[0]    // 上方內緣（危險區起點）
  const tDnInner  = taiex   + t.down[0]  // 下方內緣（危險區終點）
  const tDnOuter  = taiex   + t.down[1]  // 下方外緣（安全區終點）

  // 台指期貨邊界
  const fUpOuter  = futures + f.up[1]
  const fUpInner  = futures + f.up[0]
  const fDnInner  = futures + f.down[0]
  const fDnOuter  = futures + f.down[1]

  return (
    <div className="thermo">

      {/* ── 上方安全區 ── */}
      <div className="thermo-zone safe">
        <span className="thermo-zone-label">安全區</span>
      </div>

      {/* ── 上方邊界帶 ── */}
      <div className="thermo-band">
        <div className="thermo-band-line top">
          <span className="thermo-val taiex">{fmt(tUpOuter)}</span>
          <span className="thermo-col-label">加權 ｜ 台指期</span>
          <span className="thermo-val futures">{fmt(fUpOuter)}</span>
        </div>
        <div className="thermo-band-inner">
          <span className="thermo-val taiex dim">{fmt(tUpInner)}</span>
          <span className="thermo-band-arrow">▼ 估算區間 ▼</span>
          <span className="thermo-val futures dim">{fmt(fUpInner)}</span>
        </div>
        <div className="thermo-band-line bottom">
          <div className="thermo-line" />
        </div>
      </div>

      {/* ── 危險區 ── */}
      <div className="thermo-zone danger">
        <span className="thermo-zone-label">危險區</span>
        <span className="thermo-zone-sub">收盤點數未明顯離開 11:00</span>
      </div>

      {/* ── 下方邊界帶 ── */}
      <div className="thermo-band">
        <div className="thermo-band-line top">
          <div className="thermo-line" />
        </div>
        <div className="thermo-band-inner">
          <span className="thermo-val taiex dim">{fmt(tDnInner)}</span>
          <span className="thermo-band-arrow">▼ 估算區間 ▼</span>
          <span className="thermo-val futures dim">{fmt(fDnInner)}</span>
        </div>
        <div className="thermo-band-line bottom">
          <span className="thermo-val taiex">{fmt(tDnOuter)}</span>
          <span className="thermo-col-label">加權 ｜ 台指期</span>
          <span className="thermo-val futures">{fmt(fDnOuter)}</span>
        </div>
      </div>

      {/* ── 下方安全區 ── */}
      <div className="thermo-zone safe">
        <span className="thermo-zone-label">安全區</span>
      </div>

    </div>
  )
}

export default function SettlementPredictor() {
  const [taiex,   setTaiex]   = useState('')
  const [futures, setFutures] = useState('')
  const [result,  setResult]  = useState(null)

  function handleSubmit(e) {
    e.preventDefault()
    const t = parseFloat(taiex)
    const f = parseFloat(futures)
    if (isNaN(t) || isNaN(f)) return
    setResult({ taiex: t, futures: f })
  }

  return (
    <div className="sp-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">結算預測小助手</h1>
          <p className="page-subtitle">輸入結算日 11:00 的指數點數，粗估收盤安全區間</p>
        </div>
      </div>

      <div className="sp-card">
        <form onSubmit={handleSubmit} className="sp-form">
          <div className="sp-field">
            <label className="sp-label">
              加權指數
              <span className="sp-hint">結算日 11:00 的現貨點數</span>
            </label>
            <input
              className="sp-input"
              type="number"
              placeholder="例：33000"
              value={taiex}
              onChange={e => setTaiex(e.target.value)}
              required
            />
          </div>

          <div className="sp-field">
            <label className="sp-label">
              台指期貨
              <span className="sp-hint">結算日 11:00 的期貨點數</span>
            </label>
            <input
              className="sp-input"
              type="number"
              placeholder="例：33050"
              value={futures}
              onChange={e => setFutures(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="sp-submit">試算安全區間</button>
        </form>
      </div>

      {result && (
        <div className="sp-results">
          <div className="sp-results-title">預估收盤區間</div>
          <Thermometer taiex={result.taiex} futures={result.futures} />
          <p className="sp-note">
            ※ 以上數據為歷史粗估，僅供參考，不構成投資建議
          </p>
        </div>
      )}
    </div>
  )
}
