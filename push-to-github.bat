@echo off
chcp 65001 >nul
setlocal
title Push to GitHub - zt
cd /d "%~dp0"

echo.
echo ============================================
echo   Push prototype to GitHub
echo   repo: lpz2008138998-svg/zt
echo ============================================
echo.

where git >nul 2>nul
if errorlevel 1 (
  echo [ERROR] git not found. Install from https://git-scm.com/download/win
  echo.
  pause
  exit /b 1
)

echo [1/3] Checking repository ...
git rev-parse --is-inside-work-tree >nul 2>nul
if errorlevel 1 (
  echo [ERROR] This folder is not a git repository.
  pause
  exit /b 1
)

echo [2/3] Staging new changes (if any) ...
git add -A
git diff --cached --quiet
if errorlevel 1 (
  git commit -q -m "update prototype"
  echo       committed local changes
) else (
  echo       nothing new to commit
)

echo.
echo [3/3] Pushing to GitHub ...
echo       A login window may appear. Choose "Sign in with your browser".
echo.
git push -u origin main
if errorlevel 1 (
  echo.
  echo [FAILED] Push failed.
  echo.
  echo   If it asks for a password, do NOT use your GitHub password.
  echo   Use a Personal Access Token instead:
  echo     GitHub - Settings - Developer settings - Personal access tokens
  echo     - Tokens ^(classic^) - Generate new token ^(classic^) - check "repo"
  echo.
  pause
  exit /b 1
)

echo.
echo ============================================
echo   Done. Open:
echo   https://github.com/lpz2008138998-svg/zt
echo ============================================
echo.
pause
