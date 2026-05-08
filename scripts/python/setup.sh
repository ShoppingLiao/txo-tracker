#!/usr/bin/env bash
# 一鍵建立 Python 環境 + 安裝 launchd 排程
#
# 用法:
#   bash scripts/python/setup.sh             # 建 venv + 裝相依
#   bash scripts/python/setup.sh --launchd   # 加上安裝 launchd plist (需 fubon_neo wheel 已先裝好)
#
# fubon_neo 需另外從富邦官網下載 macOS .whl 後手動 install:
#   ./scripts/python/.venv/bin/pip install /path/to/fubon_neo-X.Y.Z-cp311-cp311-macosx_*.whl

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
VENV_DIR="$REPO_ROOT/scripts/python/.venv"
PLIST_NAME="com.txotracker.fetchmarket.plist"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"

echo "==> Repo root: $REPO_ROOT"

# ---- 1. 建 venv ----
if [[ ! -d "$VENV_DIR" ]]; then
  echo "==> 建立 venv: $VENV_DIR"
  python3 -m venv "$VENV_DIR"
fi

# ---- 2. 裝相依 ----
echo "==> 安裝 requirements.txt"
"$VENV_DIR/bin/pip" install --upgrade pip >/dev/null
"$VENV_DIR/bin/pip" install -r "$REPO_ROOT/scripts/python/requirements.txt"

if ! "$VENV_DIR/bin/python" -c "import fubon_neo" 2>/dev/null; then
  echo "⚠️  fubon_neo 尚未安裝。請從富邦官網下載 macOS .whl 後手動裝:"
  echo "    $VENV_DIR/bin/pip install /path/to/fubon_neo-X.Y.Z-cp311-cp311-macosx_*.whl"
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

  echo "==> 產生 plist (替換路徑佔位符) → $PLIST_DST"
  mkdir -p "$LAUNCH_AGENTS_DIR"
  sed -e "s|__REPO_ROOT__|$REPO_ROOT|g" \
      -e "s|__VENV_PYTHON__|$VENV_DIR/bin/python|g" \
      "$PLIST_SRC" > "$PLIST_DST"

  echo "==> 重新載入 launchd"
  launchctl unload "$PLIST_DST" 2>/dev/null || true
  launchctl load "$PLIST_DST"

  echo "==> 已啟用排程,查看狀態:"
  echo "    launchctl list | grep com.txotracker"
  echo "    tail -f $REPO_ROOT/scripts/python/.launchd.log"
fi

echo "==> 完成。手動測試:"
echo "    $VENV_DIR/bin/python $REPO_ROOT/scripts/python/fetch_market_fubon.py --slot all --dry-run"
