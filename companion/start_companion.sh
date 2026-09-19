#!/usr/bin/env bash
# ========================================================
#   Companion Orchestrator & Proxy Server Launcher
#   Supports Linux & macOS
# ========================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================================"
echo "  Companion Orchestrator & Proxy Server"
echo "========================================================"
echo ""

# 1. Locate Node.js executable
NODE_BIN=""

if command -v node >/dev/null 2>&1; then
    NODE_BIN="$(command -v node)"
elif [ -x "/opt/homebrew/bin/node" ]; then
    NODE_BIN="/opt/homebrew/bin/node"
elif [ -x "/usr/local/bin/node" ]; then
    NODE_BIN="/usr/local/bin/node"
elif [ -x "/usr/bin/node" ]; then
    NODE_BIN="/usr/bin/node"
elif [ -s "$HOME/.nvm/nvm.sh" ]; then
    # shellcheck source=/dev/null
    . "$HOME/.nvm/nvm.sh"
    NODE_BIN="$(command -v node || true)"
fi

if [ -z "$NODE_BIN" ]; then
    echo "[!] Node.js is not detected on this system."
    echo "[!] The Companion Orchestrator requires Node.js (v18+) to run local AI services."
    echo ""
    OS_NAME="$(uname -s)"
    if [ "$OS_NAME" = "Darwin" ]; then
        echo "Install Node.js on macOS using Homebrew:"
        echo "    brew install node"
    elif command -v apt-get >/dev/null 2>&1; then
        echo "Install Node.js on Debian/Ubuntu:"
        echo "    sudo apt-get update && sudo apt-get install -y nodejs npm"
    elif command -v dnf >/dev/null 2>&1; then
        echo "Install Node.js on Fedora/RHEL:"
        echo "    sudo dnf install -y nodejs"
    elif command -v pacman >/dev/null 2>&1; then
        echo "Install Node.js on Arch Linux:"
        echo "    sudo pacman -S nodejs npm"
    fi
    echo ""
    echo "Or download from: https://nodejs.org/"
    echo ""
    exit 1
fi

echo "[OK] Node.js detected at: $NODE_BIN ($("$NODE_BIN" -v))"
echo ""

# Ensure bin directory has executable permissions for local binaries
if [ -d "$SCRIPT_DIR/bin" ]; then
    chmod +x "$SCRIPT_DIR"/bin/* 2>/dev/null || true
fi

# Clean up any stale companion or backend processes on ports 8000, 8089, 8084, 8081, 8080
for PORT in 8000 8089 8084 8081 8080; do
    if command -v lsof >/dev/null 2>&1; then
        PIDS="$(lsof -ti :$PORT 2>/dev/null || true)"
        if [ -n "$PIDS" ]; then
            kill -9 $PIDS 2>/dev/null || true
        fi
    elif command -v fuser >/dev/null 2>&1; then
        fuser -k -n tcp $PORT 2>/dev/null || true
    fi
done

echo "========================================================"
echo "  Starting Companion Server (http://127.0.0.1:8000)..."
echo "========================================================"
exec "$NODE_BIN" server.js
