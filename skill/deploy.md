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

```bash
gh workflow run deploy.yml --repo ShoppingLiao/txo-tracker
```

---

## 本地開發

```bash
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
- **Build 指令**：`npm ci && npm run build`
- **部署來源**：`dist/` 資料夾 → GitHub Pages
