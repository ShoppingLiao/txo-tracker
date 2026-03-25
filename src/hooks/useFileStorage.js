import { useState, useEffect, useRef, useCallback } from 'react'
import * as fs from '../utils/fileStorage'
import useTradeStore from '../store/useTradeStore'

/**
 * status:
 *   'disconnected' — 未連結檔案
 *   'saving'       — 儲存中
 *   'saved'        — 已儲存
 *   'error'        — 儲存失敗
 */
export function useFileStorage() {
  const [fileName, setFileName] = useState(null)
  const [status, setStatus] = useState('disconnected')
  const trades = useTradeStore((s) => s.trades)
  const importTrades = useTradeStore((s) => s.importTrades)
  const mergeTrades  = useTradeStore((s) => s.mergeTrades)

  // 初次 mount 不觸發自動儲存
  const initialMount = useRef(true)
  useEffect(() => {
    initialMount.current = true
  }, [])

  // 每當 trades 改變，自動存到連結的檔案
  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false
      return
    }
    if (!fs.getFileName()) return

    setStatus('saving')
    fs.save(trades).then((result) => {
      setStatus(result === 'ok' ? 'saved' : 'error')
    })
  }, [trades])

  /** 開啟現有 JSON 檔案並載入資料 */
  const connect = useCallback(async () => {
    const data = await fs.openFile()
    if (data === null) return // 使用者取消
    importTrades(data)
    setFileName(fs.getFileName())
    setStatus('saved')
  }, [importTrades])

  /** 建立新的 JSON 檔案，把目前資料寫入 */
  const createNew = useCallback(async () => {
    const ok = await fs.createFile()
    if (!ok) return
    const result = await fs.save(trades)
    setFileName(fs.getFileName())
    setStatus(result === 'ok' ? 'saved' : 'error')
  }, [trades])

  /** 中斷連結 */
  const disconnect = useCallback(() => {
    fs.clearHandle()
    setFileName(null)
    setStatus('disconnected')
  }, [])

  /** 匯出 JSON（下載，跨瀏覽器） */
  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify({ trades }, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'txo-trades.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [trades])

  /** 匯入 JSON（合併，跨瀏覽器） */
  const importJSON = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        const arr = Array.isArray(data) ? data : (data.trades ?? [])
        mergeTrades(arr)
      } catch {
        alert('JSON 格式錯誤，請確認檔案內容')
      }
    }
    input.click()
  }, [mergeTrades])

  /** 覆蓋匯入（取代全部資料，用於初次或完整還原） */
  const replaceJSON = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        const arr = Array.isArray(data) ? data : (data.trades ?? [])
        if (window.confirm(`確定要以此檔案取代全部資料？（${arr.length} 筆）`)) {
          importTrades(arr)
        }
      } catch {
        alert('JSON 格式錯誤，請確認檔案內容')
      }
    }
    input.click()
  }, [importTrades])

  return {
    fileName,
    status,
    isSupported: fs.isSupported(),
    connect,
    createNew,
    disconnect,
    exportJSON,
    importJSON,
    replaceJSON,
  }
}
