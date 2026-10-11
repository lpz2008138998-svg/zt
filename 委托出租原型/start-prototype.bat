@echo off
setlocal
title Prototype Server - WeiTuo ChuZu
cd /d "%~dp0"

set "PORT=8932"
if not "%~1"=="" set "PORT=%~1"

set "PS=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
if not exist "%PS%" set "PS=powershell.exe"

echo.
echo   Starting prototype server ...
echo   URL : http://127.0.0.1:%PORT%/index.html
echo.

"%PS%" -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1" -Port %PORT%

echo.
echo   Server stopped. Press any key to close.
pause >nul
