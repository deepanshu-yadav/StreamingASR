@echo off
title Unregister Voice Companion Protocol
cd /d "%~dp0"

echo ========================================================
echo   Removing voice-companion:// Protocol Handler
echo ========================================================
echo.

reg delete "HKCU\Software\Classes\voice-companion" /f >nul 2>&1

echo [OK] voice-companion:// protocol handler removed.
pause
