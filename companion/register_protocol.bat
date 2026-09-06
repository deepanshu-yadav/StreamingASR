@echo off
setlocal enabledelayedexpansion
title Register Voice Companion Protocol
cd /d "%~dp0"

echo ========================================================
echo   Registering voice-companion:// Protocol Handler
echo ========================================================
echo.

set "TARGET_BAT=%~dp0start_companion.bat"

if not exist "%TARGET_BAT%" (
    echo [ERROR] Could not locate: "%TARGET_BAT%"
    pause
    exit /b 1
)

echo Target script: "%TARGET_BAT%"
echo.

:: 1. Register base URL protocol in Current User (no admin rights required)
reg add "HKCU\Software\Classes\voice-companion" /ve /t REG_SZ /d "URL:Voice Companion Protocol" /f >nul
if %errorlevel% neq 0 goto ERROR
reg add "HKCU\Software\Classes\voice-companion" /v "URL Protocol" /t REG_SZ /d "" /f >nul
if %errorlevel% neq 0 goto ERROR

:: 2. Set command to execute start_companion.bat in an interactive console
reg add "HKCU\Software\Classes\voice-companion\shell\open\command" /ve /t REG_SZ /d "cmd.exe /k \"%TARGET_BAT%\"" /f >nul
if %errorlevel% neq 0 goto ERROR

echo ========================================================
echo [OK] voice-companion:// protocol successfully registered!
echo.
echo You can now launch the companion directly from the
echo Chrome Extension with a single click.
echo ========================================================
echo.
pause
exit /b 0

:ERROR
echo.
echo [ERROR] Failed to update Windows Registry.
pause
exit /b 1
