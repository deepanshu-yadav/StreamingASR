#!/usr/bin/env bash
# ========================================================
#   Unregister voice-companion:// Protocol Handler
#   Supports Linux and macOS
# ========================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================================"
echo "  Removing voice-companion:// Protocol Handler"
echo "========================================================"
echo ""

OS_NAME="$(uname -s)"

if [ "$OS_NAME" = "Darwin" ]; then
    APP_DIR="$SCRIPT_DIR/VoiceCompanion.app"
    LSREGISTER="/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister"
    if [ -x "$LSREGISTER" ] && [ -d "$APP_DIR" ]; then
        "$LSREGISTER" -u "$APP_DIR" 2>/dev/null || true
    fi
    rm -rf "$APP_DIR"
    echo "[OK] macOS protocol handler removed."

elif [ "$OS_NAME" = "Linux" ]; then
    DESKTOP_FILE="$HOME/.local/share/applications/voice-companion.desktop"
    if [ -f "$DESKTOP_FILE" ]; then
        rm -f "$DESKTOP_FILE"
    fi
    if command -v update-desktop-database >/dev/null 2>&1; then
        update-desktop-database "$HOME/.local/share/applications" 2>/dev/null || true
    fi
    echo "[OK] Linux protocol handler removed."
fi

echo "========================================================"
