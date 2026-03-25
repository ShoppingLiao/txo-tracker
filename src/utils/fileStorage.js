/**
 * File System Access API 封裝
 * 讓 app 讀寫使用者指定的本機 JSON 檔案
 */

let fileHandle = null

export function isSupported() {
  return typeof window !== 'undefined' && 'showOpenFilePicker' in window
}

export function getFileName() {
  return fileHandle?.name ?? null
}

export function clearHandle() {
  fileHandle = null
}

/** 開啟現有的 JSON 檔案，回傳 { trades } 或 null（使用者取消） */
export async function openFile() {
  try {
    ;[fileHandle] = await window.showOpenFilePicker({
      types: [{ description: 'JSON 資料檔', accept: { 'application/json': ['.json'] } }],
      excludeAcceptAllOption: true,
    })
    const file = await fileHandle.getFile()
    const text = await file.text()
    const data = JSON.parse(text)
    return Array.isArray(data) ? data : (data.trades ?? [])
  } catch (e) {
    if (e.name === 'AbortError') return null
    throw e
  }
}

/** 新建一個 JSON 檔案，回傳 true 或 null（使用者取消） */
export async function createFile() {
  try {
    fileHandle = await window.showSaveFilePicker({
      suggestedName: 'txo-trades.json',
      types: [{ description: 'JSON 資料檔', accept: { 'application/json': ['.json'] } }],
    })
    return true
  } catch (e) {
    if (e.name === 'AbortError') return null
    throw e
  }
}

/** 將 trades 寫入目前連結的檔案，回傳 'ok' | 'no-file' | 'error' */
export async function save(trades) {
  if (!fileHandle) return 'no-file'
  try {
    const writable = await fileHandle.createWritable()
    await writable.write(JSON.stringify({ trades }, null, 2))
    await writable.close()
    return 'ok'
  } catch {
    return 'error'
  }
}
