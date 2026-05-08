#!/usr/bin/env bash
# 一鍵建立 Python 環境 + 安裝 launchd 排程
#
# 用法:
#   bash scripts/python/setup.sh             # 建 venv + 裝相依
#   bash scripts/python/setup.sh --launchd   # 加上安裝 launchd plist (需 fubon_neo wheel 已先裝好)
#
# venv 故意建在 ~/Library/Application Support/TXOTracker/venv,不在 repo 內。
# 原因: macOS 14+ 對 ~/Documents 有 TCC 隱私保護,launchd context 不能存取,
# 把 venv 放 ~/Library/Application Support 可避開,免設 Full Disk Access。
#
# fubon_neo 需另外從富邦官網下載 macOS .whl 後手動 install:
#   "$VENV_DIR/bin/pip" install /path/to/fubon_neo-*.whl

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
VENV_BASE="$HOME/Library/Application Support/TXOTracker"
VENV_DIR="$VENV_BASE/venv"
LOG_DIR="$VENV_BASE/logs"
PLIST_NAME="com.txotracker.fetchmarket.plist"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"

echo "==> Repo root: $REPO_ROOT"
echo "==> Venv:      $VENV_DIR"

mkdir -p "$VENV_BASE" "$LOG_DIR"

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

# ---- 3. (option) 安裝 launchd plist ----
if [[ "${1:-}" == "--launchd" ]]; then
  PLIST_SRC="$REPO_ROOT/scripts/python/launchd/$PLIST_NAME"
  PLIST_DST="$LAUNCH_AGENTS_DIR/$PLIST_NAME"

  if [[ ! -f "$PLIST_SRC" ]]; then
    echo "❌ 找不到 plist 模板: $PLIST_SRC"
    exit 1
  fi

  echo "==> 產生 plist → $PLIST_DST"
  mkdir -p "$LAUNCH_AGENTS_DIR"
  # 用 | 當 sed 分隔避免路徑中 / 衝突;路徑中的空格交給 plist XML 處理
  sed -e "s|__REPO_ROOT__|$REPO_ROOT|g" \
      -e "s|__VENV_PYTHON__|$VENV_DIR/bin/python|g" \
      -e "s|__LOG_DIR__|$LOG_DIR|g" \
      "$PLIST_SRC" > "$PLIST_DST"

  echo "==> 重新載入 launchd (bootout + bootstrap,新 macOS 推薦語法)"
  launchctl bootout "gui/$(id -u)/com.txotracker.fetchmarket" 2>/dev/null || true
  launchctl bootstrap "gui/$(id -u)" "$PLIST_DST"

  echo "==> 已啟用,查看狀態:"
  echo "    launchctl list | grep com.txotracker"
  echo "    tail -f \"$LOG_DIR/launchd.log\""
fi

echo "==> 完成。手動測試:"
echo "    \"$VENV_DIR/bin/python\" $REPO_ROOT/scripts/python/fetch_market_fubon.py --slot all --dry-run"
