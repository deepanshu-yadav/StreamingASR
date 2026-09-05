@echo off
setlocal enabledelayedexpansion
title Companion Orchestrator & Proxy Server
cd /d "%~dp0"

echo ========================================================
echo   Companion Orchestrator & Proxy Server
echo ========================================================
echo.

:: 1. Check if node is already on PATH
where.exe node >nul 2>&1
if %errorlevel% equ 0 goto START_SERVER

:: 2. Check if node is installed in standard Program Files location
if exist "%ProgramFiles%\nodejs\node.exe" (
    set "PATH=%ProgramFiles%\nodejs;%PATH%"
    goto START_SERVER
)
if exist "%ProgramFiles(x86)%\nodejs\node.exe" (
    set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"
    goto START_SERVER
)

:: 3. Node.js is missing - check for winget to auto-install
echo [!] Node.js is not detected on this machine.
echo [!] The Companion Orchestrator requires Node.js to manage local AI services.
echo.

where.exe winget >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Windows Package Manager (winget) was not found.
    echo Please download and install Node.js manually from: https://nodejs.org/
    echo Once installed, run this script again.
    echo.
    pause
    exit /b 1
)

echo [*] Automatically installing Node.js LTS via winget...
echo [*] If prompted, please allow administrator permissions in the Windows UAC popup.
echo.
winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements

if %errorlevel% neq 0 (
    echo.
    echo [X] Winget installation encountered an issue or was cancelled.
    echo Please install Node.js manually from: https://nodejs.org/
    pause
    exit /b 1
)

:: Refresh PATH for the newly installed Node
if exist "%ProgramFiles%\nodejs\node.exe" (
    set "PATH=%ProgramFiles%\nodejs;%PATH%"
)
if exist "%ProgramFiles(x86)%\nodejs\node.exe" (
    set "PATH=%ProgramFiles(x86)%\nodejs;%PATH%"
)

where.exe node >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo [!] Node.js was installed successfully!
    echo [!] Please close this window and double-click start_companion.bat to launch.
    echo.
    pause
    exit /b 0
)

:START_SERVER
echo [OK] Node.js detected:
node -v
echo.
echo ========================================================
echo   Starting Companion Server (http://127.0.0.1:8000)...
echo ========================================================
node server.js
if %errorlevel% neq 0 (
    echo.
    echo [!] Companion process exited with code %errorlevel%.
    pause
)
