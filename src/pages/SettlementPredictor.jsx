import { useState, useMemo } from 'react'
import useMarketStore from '../store/useMarketStore'
import { isSettlementDay } from '../utils/settlements'
import './SettlementPredictor.css'

// 手動估算區間（暫定）
const MANUAL_RANGES = {
  taiex:   { up: 250, down: -350 },
  futures: { up: 200, down: -300 },
}

function fmt(n) {
  return Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
}

// ── 溫度計元件（共用） ─────────────────────────────────────────
function Thermometer({ taiexBase, futuresBase, taiexRange, futuresRange, showInnerBand = true }) {
  // taiexRange.up 和 taiexRange.down 可以是陣列 [inner, outer] 或是單一數字 outer
  const getOuter = (val) => Array.isArray(val) ? val[1] : val

  const tUpOuter  = taiexBase   + getOuter(taiexRange.up)
  const tDnOuter  = taiexBase   + getOuter(taiexRange.down)

  const fUpOuter  = futuresBase + getOuter(futuresRange.up)
  const fDnOuter  = futuresBase + getOuter(futuresRange.down)

  return (
    <div className="thermo">
      <div className="thermo-zone safe">
        <span className="thermo-zone-label">安全區</span>
      </div>

      <div className="thermo-band">
        <div className="thermo-band-line">
          <span className="thermo-val taiex">{fmt(tUpOuter)}</span>
          <span className="thermo-col-label">加權 ｜ 台指期</span>
          <span className="thermo-val futures">{fmt(fUpOuter)}</span>
        </div>
        {showInnerBand && (
          <div className="thermo-band-inner">
            <span className="thermo-band-arrow">▲ 估算區間 ▲</span>
          </div>
        )}
        <div className="thermo-band-line">
          <div className="thermo-line" />
        </div>
      </div>

      <div className="thermo-zone danger">
        <div className="thermo-danger-row">
          <span className="thermo-base-val taiex">{fmt(taiexBase)}</span>
          <div className="thermo-danger-center">
            <span className="thermo-zone-label">危險區</span>
            <span className="thermo-zone-sub">收盤點數未明顯離開 11:00</span>
          </div>
          <span className="thermo-base-val futures">{fmt(futuresBase)}</span>
        </div>
      </div>

      <div className="thermo-band">
        <div className="thermo-band-line">
          <div className="thermo-line" />
        </div>
        {showInnerBand && (
          <div className="thermo-band-inner">
            <span className="thermo-band-arrow">▼ 估算區間 ▼</span>
          </div>
        )}
        <div className="thermo-band-line">
          <span className="thermo-val taiex">{fmt(tDnOuter)}</span>
          <span className="thermo-col-label">加權 ｜ 台指期</span>
          <span className="thermo-val futures">{fmt(fDnOuter)}</span>
        </div>
      </div>

      <div className="thermo-zone safe">
        <span className="thermo-zone-label">安全區</span>
      </div>
    </div>
  )
}

// ── 主頁面 ────────────────────────────────────────────────────
export default function SettlementPredictor() {
  const [taiex,   setTaiex]   = useState('')
  const [futures, setFutures] = useState('')
  const [result,  setResult]  = useState(null)
  const records = useMarketStore((s) => s.marketRecords)

  // 整理有效資料
  const validRecords = useMemo(() => {
    return records.filter(r => r.price11 != null && r.close != null)
  }, [records])

  // 2. 所有結算日的歷史極值
  const settlementRange = useMemo(() => {
    const diffs = validRecords
      .filter(r => isSettlementDay(r.date))
      .map(r => Math.round(r.close - r.price11))

    if (diffs.length === 0) return null

    const maxUp   = Math.max(...diffs)
    const maxDown = Math.min(...diffs)
    
    return {
      taiex:   { up: [0, maxUp],   down: [0, maxDown] },
      futures: { up: [0, maxUp],   down: [0, maxDown] },
      count: diffs.length,
    }
  }, [validRecords])

  // 3. 近60個交易日的歷史極值
  const recent60Range = useMemo(() => {
    const diffs = validRecords
      .slice(-60)
      .map(r => Math.round(r.close - r.price11))

    if (diffs.length === 0) return null

    const maxUp   = Math.max(...diffs)
    const maxDown = Math.min(...diffs)
    
    return {
      taiex:   { up: [0, maxUp],   down: [0, maxDown] },
      futures: { up: [0, maxUp],   down: [0, maxDown] },
      count: diffs.length,
    }
  }, [validRecords])

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

      <div className="sp-content">
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

          {/* 卡片一：手動估算 */}
          <div className="sp-result-item">
            <div className="sp-card-label">估算區間（手動設定）</div>
            <Thermometer
              taiexBase={result.taiex}
              futuresBase={result.futures}
              taiexRange={MANUAL_RANGES.taiex}
              futuresRange={MANUAL_RANGES.futures}
              showInnerBand={true}
            />
          </div>

          {/* 卡片二：所有結算日歷史極值 */}
          <div className="sp-result-item">
            {settlementRange ? (
              <>
                <div className="sp-card-label">
                  結算日極值
                  <span className="sp-card-sub">有紀錄以來</span>
                </div>
                <Thermometer
                  taiexBase={result.taiex}
                  futuresBase={result.futures}
                  taiexRange={settlementRange.taiex}
                  futuresRange={settlementRange.futures}
                  showInnerBand={true}
                />
              </>
            ) : (
              <div className="sp-loading">結算日歷史資料載入中...</div>
            )}
          </div>

          {/* 卡片三：近60交易日歷史極值 */}
          <div className="sp-result-item">
            {recent60Range ? (
              <>
                <div className="sp-card-label">
                  近期極值
                  <span className="sp-card-sub">近60個交易日</span>
                </div>
                <Thermometer
                  taiexBase={result.taiex}
                  futuresBase={result.futures}
                  taiexRange={recent60Range.taiex}
                  futuresRange={recent60Range.futures}
                  showInnerBand={true}
                />
              </>
            ) : (
              <div className="sp-loading">近期歷史資料載入中...</div>
            )}
          </div>

          <div className="sp-note-full">
            <p className="sp-note">
              ※ 以上數據為歷史粗估，僅供參考，不構成投資建議
            </p>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
