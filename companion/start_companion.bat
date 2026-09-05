@echo off
title Companion Orchestrator & Proxy Server
cd /d "%~dp0"
echo ========================================================
echo   Starting Companion Orchestrator & Proxy Server...
echo ========================================================
node server.js
pause
