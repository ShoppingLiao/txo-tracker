#!/usr/bin/env bash
# 一鍵建立 Python 環境 + deploy 程式碼 + 安裝 launchd 排程
#
# 用法:
#   bash scripts/python/setup.sh             # 建 venv + 裝相依 + deploy 程式碼
#   bash scripts/python/setup.sh --launchd   # 加上安裝/更新 launchd plist
#
# 為什麼要 deploy:macOS 14+ 對 ~/Documents 有 TCC 隱私保護,launchd context
# 不能讀 ~/Documents 內任何檔案 (venv / .py / .env / serviceAccount.json 都會被擋)。
# 所以 setup.sh 把所有 runtime 檔案複製到 ~/Library/Application Support/TXOTracker/
# (TCC 沒擋的位置),launchd 從那邊跑。
#
# 影響: 改完 .py / .env / serviceAccount.json 之後,要重跑 setup.sh 才會生效。
#
# fubon_neo 需另外從富邦官網下載 macOS .whl 後手動 install:
#   "$VENV_DIR/bin/pip" install /path/to/fubon_neo-*.whl

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
APP_BASE="$HOME/Library/Application Support/TXOTracker"
VENV_DIR="$APP_BASE/venv"
DEPLOY_DIR="$APP_BASE/scripts"
LOG_DIR="$APP_BASE/logs"
PLIST_NAME="com.txotracker.fetchmarket.plist"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"

echo "==> Repo root: $REPO_ROOT"
echo "==> App base:  $APP_BASE"

mkdir -p "$APP_BASE" "$DEPLOY_DIR" "$LOG_DIR"

# ---- 1. 建 venv ----
if [[ ! -d "$VENV_DIR" ]]; then
  echo "==> 建立 venv"
  python3 -m venv "$VENV_DIR"
fi

# ---- 2. 裝相依 ----
echo "==> 安裝 requirements.txt"
"$VENV_DIR/bin/pip" install --upgrade pip >/dev/null
"$VENV_DIR/bin/pip" install -r "$REPO_ROOT/scripts/python/requirements.txt"

if ! "$VENV_DIR/bin/python" -c "import fubon_neo" 2>/dev/null; then
  echo "⚠️  fubon_neo 尚未安裝。請從富邦官網下載 macOS .whl 後手動裝:"
  echo "    \"$VENV_DIR/bin/pip\" install /path/to/fubon_neo-*.whl"
  echo "    (https://www.fbs.com.tw/TradeAPI/docs/download/download-sdk)"
fi

# ---- 3. Deploy runtime 檔案到 AppSupport (避開 TCC) ----
echo "==> Deploy runtime 檔案到 $DEPLOY_DIR"
cp "$REPO_ROOT/scripts/python/fetch_market_fubon.py" "$DEPLOY_DIR/"
cp "$REPO_ROOT/scripts/python/fubon_login.py" "$DEPLOY_DIR/"

# .env (有就 copy,沒有就 warn)
if [[ -f "$REPO_ROOT/.env" ]]; then
  cp "$REPO_ROOT/.env" "$DEPLOY_DIR/.env"
  chmod 600 "$DEPLOY_DIR/.env"
elif [[ -f "$REPO_ROOT/.env.local" ]]; then
  cp "$REPO_ROOT/.env.local" "$DEPLOY_DIR/.env"
  chmod 600 "$DEPLOY_DIR/.env"
else
  echo "⚠️  $REPO_ROOT/.env 不存在,執行時會找不到 FUBON_* 帳密"
fi

# Firebase Admin SA
if [[ -f "$REPO_ROOT/scripts/serviceAccount.json" ]]; then
  cp "$REPO_ROOT/scripts/serviceAccount.json" "$DEPLOY_DIR/serviceAccount.json"
  chmod 600 "$DEPLOY_DIR/serviceAccount.json"
else
  echo "⚠️  $REPO_ROOT/scripts/serviceAccount.json 不存在,執行時會無法寫 Firestore"
fi

# ---- 4. (option) 安裝 launchd plist ----
if [[ "${1:-}" == "--launchd" ]]; then
  PLIST_SRC="$REPO_ROOT/scripts/python/launchd/$PLIST_NAME"
  PLIST_DST="$LAUNCH_AGENTS_DIR/$PLIST_NAME"

  if [[ ! -f "$PLIST_SRC" ]]; then
    echo "❌ 找不到 plist 模板: $PLIST_SRC"
    exit 1
  fi

  echo "==> 產生 plist → $PLIST_DST"
  mkdir -p "$LAUNCH_AGENTS_DIR"
  sed -e "s|__VENV_PYTHON__|$VENV_DIR/bin/python|g" \
      -e "s|__DEPLOY_DIR__|$DEPLOY_DIR|g" \
      -e "s|__LOG_DIR__|$LOG_DIR|g" \
      "$PLIST_SRC" > "$PLIST_DST"

  echo "==> 重新載入 launchd"
  launchctl bootout "gui/$(id -u)/com.txotracker.fetchmarket" 2>/dev/null || true
  launchctl bootstrap "gui/$(id -u)" "$PLIST_DST"

  echo "==> 已啟用,查看狀態:"
  echo "    launchctl list | grep com.txotracker"
  echo "    tail -f \"$LOG_DIR/launchd.log\""
fi

echo "==> 完成。手動測試 (本地開發,讀 repo .env):"
echo "    \"$VENV_DIR/bin/python\" $REPO_ROOT/scripts/python/fetch_market_fubon.py --slot all --dry-run"
echo "==> 模擬 launchd 執行 (從 deploy 位置):"
echo "    \"$VENV_DIR/bin/python\" \"$DEPLOY_DIR/fetch_market_fubon.py\" --slot all --dry-run"
