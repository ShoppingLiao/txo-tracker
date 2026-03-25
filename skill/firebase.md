# Firebase 設定與維護指南

## 專案資訊

- **Firebase 專案**：txo-tracker
- **Auth 方式**：Google Sign-In（signInWithPopup）
- **資料庫**：Cloud Firestore（Standard 版，asia-east1）

---

## 初次設定（新環境）

### 1. 複製環境變數

```bash
cp .env.local.example .env.local
```

從 Firebase Console → 專案設定 → 您的應用程式 取得 config，填入 `.env.local`：

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

> ⚠️ `.env.local` 已在 `.gitignore` 中，**不會被 commit**。

### 2. GitHub Secrets（CI/CD 必要）

前往 `github.com/ShoppingLiao/txo-tracker` → Settings → Secrets and variables → Actions

新增與 `.env.local` 相同的 6 個 Secrets（名稱完全一致）。

### 3. Firebase Auth 授權網域

Firebase Console → Authentication → Settings → 已授權的網域

確認以下網域已加入：
- `localhost`
- `shoppingliao.github.io`

---

## Firestore 安全規則

Firebase Console → Firestore → 規則

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/trades/{tradeId} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

**說明**：只允許已登入的用戶讀寫自己的資料，其他用戶無法存取。

---

## Firestore 資料結構

```
users/
  {uid}/                          ← Google 用戶 UID
    trades/
      {tradeId}/                  ← document ID = String(trade.id)
        id:          number       ← Date.now() 產生的 Unix timestamp
        date:        string       ← "YYYY-MM-DD"
        dayOfWeek:   string       ← "Mon" / "Tue" / "Wed" / "Thur" / "Fri"
        contracts:   number       ← 總口數
        commission:  number       ← 手續費（元）
        tax:         number       ← 期交稅（元）
        profit:      number       ← 實際獲利（元，負數為虧損）
        returnRate:  number|null  ← profit / (contracts × 1250)
        note:        string       ← 備註
```

---

## 常見維護操作

### 查看某用戶資料

Firebase Console → Firestore → 資料 → users → {uid} → trades

### 費用管理

免費 Spark 方案限制（個人使用完全足夠）：
- 每天讀取：50,000 次
- 每天寫入：20,000 次
- 儲存：1 GB

### in-app 瀏覽器限制

LINE / FB / Instagram 等 App 內建瀏覽器封鎖 popup，導致 Google 登入失敗。
已在 `Login.jsx` 偵測並提示用戶改用 Safari 或 Chrome。

偵測邏輯（`Login.jsx`）：
```javascript
/Line|FBAN|FBAV|Instagram|Twitter|MicroMessenger/i.test(navigator.userAgent)
```

---

## 相關原始碼

| 檔案 | 說明 |
|---|---|
| `src/lib/firebase.js` | Firebase 初始化 |
| `src/contexts/AuthContext.jsx` | Auth 狀態、登入/登出方法 |
| `src/services/tradeService.js` | Firestore CRUD + 批次匯入 |
| `src/hooks/useFirestoreSync.js` | onSnapshot 即時同步 |
| `src/hooks/useTrades.js` | 統一 CRUD hook（元件使用） |
| `src/pages/Login.jsx` | 登入頁面（含 in-app 偵測） |
| `.github/workflows/deploy.yml` | CI/CD（注入 Firebase Secrets） |
