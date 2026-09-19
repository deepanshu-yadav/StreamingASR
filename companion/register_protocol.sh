#!/usr/bin/env bash
# ========================================================
#   Register voice-companion:// Protocol Handler
#   Supports Linux (xdg-mime / desktop file) and macOS (LaunchServices)
# ========================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_SCRIPT="$SCRIPT_DIR/start_companion.sh"

chmod +x "$TARGET_SCRIPT" 2>/dev/null || true

echo "========================================================"
echo "  Registering voice-companion:// Protocol Handler"
echo "========================================================"
echo ""

OS_NAME="$(uname -s)"

if [ "$OS_NAME" = "Darwin" ]; then
    echo "[*] Detected macOS. Creating helper Application bundle..."

    APP_DIR="$SCRIPT_DIR/VoiceCompanion.app"
    CONTENTS_DIR="$APP_DIR/Contents"
    MACOS_DIR="$CONTENTS_DIR/MacOS"
    RESOURCES_DIR="$CONTENTS_DIR/Resources"

    mkdir -p "$MACOS_DIR" "$RESOURCES_DIR"

    # 1. Write Info.plist with CFBundleURLTypes for voice-companion
    cat <<EOF > "$CONTENTS_DIR/Info.plist"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleIdentifier</key>
    <string>com.voiceformfill.companion</string>
    <key>CFBundleName</key>
    <string>VoiceCompanion</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleURLTypes</key>
    <array>
        <dict>
            <key>CFBundleURLName</key>
            <string>Voice Companion Protocol</string>
            <key>CFBundleURLSchemes</key>
            <array>
                <string>voice-companion</string>
            </array>
        </dict>
    </array>
</dict>
</plist>
EOF

    # 2. Write executable launcher script that opens Terminal with start_companion.sh
    cat <<EOF > "$MACOS_DIR/VoiceCompanion"
#!/usr/bin/env bash
osascript -e 'tell application "Terminal" to do script "$TARGET_SCRIPT"'
EOF

    chmod +x "$MACOS_DIR/VoiceCompanion"

    # 3. Register bundle with LaunchServices
    LSREGISTER="/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister"
    if [ -x "$LSREGISTER" ]; then
        "$LSREGISTER" -R -f "$APP_DIR"
    fi

    echo ""
    echo "[OK] voice-companion:// protocol handler registered on macOS!"
    echo "     App bundle created at: $APP_DIR"

elif [ "$OS_NAME" = "Linux" ]; then
    echo "[*] Detected Linux. Creating XDG desktop entry..."

    APPS_DIR="$HOME/.local/share/applications"
    mkdir -p "$APPS_DIR"
    DESKTOP_FILE="$APPS_DIR/voice-companion.desktop"

    cat <<EOF > "$DESKTOP_FILE"
[Desktop Entry]
Name=Voice Companion Orchestrator
Comment=Local AI Voice Assistant Companion Server
Exec=$TARGET_SCRIPT %u
Type=Application
Terminal=true
MimeType=x-scheme-handler/voice-companion;
Categories=Utility;Development;
EOF

    chmod +x "$DESKTOP_FILE"

    # Register MIME type handler
    if command -v xdg-mime >/dev/null 2>&1; then
        xdg-mime default voice-companion.desktop x-scheme-handler/voice-companion
    fi

    if command -v update-desktop-database >/dev/null 2>&1; then
        update-desktop-database "$APPS_DIR" 2>/dev/null || true
    fi

    echo ""
    echo "[OK] voice-companion:// protocol handler registered on Linux!"
    echo "     Desktop entry created at: $DESKTOP_FILE"

else
    echo "[X] Unsupported operating system: $OS_NAME"
    exit 1
fi

echo ""
echo "You can now launch the companion directly from the Chrome Extension with a single click."
echo "========================================================"
