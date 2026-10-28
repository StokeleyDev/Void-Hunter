@echo off
chcp 65001 >nul
title VOID HUNTER - GAME LAUNCHER
color 0B

echo ===================================================
echo             VOID HUNTER LAUNCHER (1-CLICK)
echo ===================================================
echo.

:: Navigate to game directory
cd /d "%~dp0void" 2>nul
if not exist "package.json" (
  cd /d "%~dp0"
)

if not exist "package.json" (
  color 0C
  echo [ERROR] Game directory (package.json) not found!
  pause
  exit /b
)

echo [1/2] Opening game in browser...
start http://localhost:3000

echo [2/2] Starting Vite development server on port 3000...
echo.
echo ===================================================
echo  Game running at: http://localhost:3000
echo  To exit, simply close this window.
echo ===================================================
echo.

call npm run dev
pause
