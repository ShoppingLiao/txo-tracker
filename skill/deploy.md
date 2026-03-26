# 部署指南

## 自動部署（推薦）

每次 push 到 `main` 分支，GitHub Actions 自動執行 build + deploy。

```bash
git add .
git commit -m "說明修改內容"
git push
```

部署完成約需 **1~2 分鐘**，可在以下網址查看進度：
https://github.com/ShoppingLiao/txo-tracker/actions

---

## 線上網址

https://shoppingliao.github.io/txo-tracker/

---

## 手動觸發部署

GitHub → Actions → Deploy to GitHub Pages → Run workflow → 選 `main` → Run workflow

---

## GitHub Secrets（必要設定）

Build 時需要 Firebase config，必須在 GitHub Secrets 中設定：

前往 `github.com/ShoppingLiao/txo-tracker` → **Settings** → **Secrets and variables** → **Actions**

| Secret 名稱 | 說明 | 用於 |
|---|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase API Key | 前端 build |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | 前端 build |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | 前端 build |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | 前端 build |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID | 前端 build |
| `VITE_FIREBASE_APP_ID` | Firebase App ID | 前端 build |
| `FUGLE_API_KEY` | 富果 Market Data API Token（UUID） | 大盤行情排程 |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase Admin SDK 服務帳號 JSON | 大盤行情排程 |

> ⚠️ 前六個 Secrets 缺少時 build 會成功但 Firebase 功能無法使用（顯示 `auth/invalid-api-key`）
> ⚠️ `FIREBASE_SERVICE_ACCOUNT` 需貼入完整 JSON 字串（含大括號）

---

## 本地開發

```bash
# 確認 .env.local 已填入 Firebase config（見 skill/firebase.md）
npm run dev
# 開啟 http://localhost:5173/txo-tracker/
```

> ⚠️ dev server 入口是 `/txo-tracker/`（不是 `/`），因為 `vite.config.js` 設定了 `base: '/txo-tracker/'`

---

## Build 產物

```bash
npm run build
# 輸出到 dist/ 資料夾
```

---

## GitHub Actions 設定檔

### `.github/workflows/deploy.yml`（前端部署）

- **觸發條件**：push to `main` 或手動執行
- **Node 版本**：20
- **Build 指令**：`npm ci && npm run build`（注入 Firebase Secrets 作為環境變數）
- **部署來源**：`dist/` 資料夾 → GitHub Pages

### `.github/workflows/fetch-market-data.yml`（大盤行情排程）

- **觸發條件**：每日 UTC 06:00（台灣時間 14:00），週一至週五；或手動執行
- **執行腳本**：`scripts/fetchMarketData.mjs`
- **相依套件**：`scripts/package.json`（firebase-admin）
- **寫入目標**：Firestore `marketIndex/{YYYY-MM-DD}`
- 詳見 [skill/market-data.md](market-data.md)
