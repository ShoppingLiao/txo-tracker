請參考 `skill/add-data.md` 的格式規範，將使用者提供的交易資料建立成可匯入的 JSON 檔案。

步驟：
1. 解析使用者提供的資料（截圖文字、表格等）
2. 依 `skill/add-data.md` 格式建立 JSON
3. 將檔案儲存為 `seed-YYYYQX.json`（例：`seed-2026Q2.json`）
4. 告知使用者用 Sidebar 的「合併匯入」載入

注意：
- returnRate = profit / (contracts × 1250)
- id 用流水號，確保不與現有資料重複
- 備註欄的特殊說明（如「裸買夜盤」）保留在 note 欄
- 全為零的空白列跳過不加入
