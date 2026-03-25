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

| Secret 名稱 | 說明 |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase App ID |

> ⚠️ Secrets 缺少時 build 會成功但 Firebase 功能無法使用（顯示 `auth/invalid-api-key` 錯誤）

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

`.github/workflows/deploy.yml`

- **觸發條件**：push to `main` 或手動執行
- **Node 版本**：20
- **Build 指令**：`npm ci && npm run build`（注入 Firebase Secrets 作為環境變數）
- **部署來源**：`dist/` 資料夾 → GitHub Pages
