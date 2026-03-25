# 新增交易資料

## 方式一：UI 手動新增
操作紀錄頁面 → 右上角「＋ 新增紀錄」

## 方式二：匯入 JSON 檔案（批量）

### 格式規範

```json
{
  "trades": [
    {
      "id": 1749000001,
      "date": "2026-01-02",
      "dayOfWeek": "Fri",
      "contracts": 360,
      "commission": 5040,
      "tax": 3547,
      "profit": -182287,
      "returnRate": -0.4051,
      "note": ""
    }
  ]
}
```

### 欄位說明

| 欄位 | 型別 | 說明 |
|---|---|---|
| `id` | number | 唯一識別碼，用 Unix timestamp（Date.now()）或流水號皆可 |
| `date` | string | `YYYY-MM-DD` 格式 |
| `dayOfWeek` | string | `Mon` / `Tue` / `Wed` / `Thur` / `Fri` / `Sat` / `Sun` |
| `contracts` | number | 總口數 |
| `commission` | number | 手續費（元） |
| `tax` | number | 期交稅（元） |
| `profit` | number | 實際獲利（元，負數為虧損） |
| `returnRate` | number \| null | `profit / (contracts × 1250)`，存小數 |
| `note` | string | 備註，可空字串 |

### 報酬率計算

```
returnRate = profit / (contracts × 1250)
範例：1390 / (30 × 1250) = 0.037066...
```

### 星期對照

| 英文 | 中文 |
|---|---|
| Mon | 一 |
| Tue | 二 |
| Wed | 三 |
| Thur | 四 |
| Fri | 五 |
| Sat | 六 |
| Sun | 日 |

---

## 匯入操作

1. 準備好 JSON 檔案（參考上方格式）
2. Sidebar → **合併匯入**（保留現有資料，依 id 去重）
3. 或 **覆蓋匯入**（取代全部，會彈出確認）

## 匯出備份

Sidebar → **匯出** → 下載 `txo-trades.json`

---

## 請 AI 幫忙建立 JSON

把 Excel/截圖資料提供給 AI，請求格式：

> 請依照 `skill/add-data.md` 的格式，將以下資料建立成可匯入的 JSON 檔案：
> [貼上資料]
