@echo off
setlocal enabledelayedexpansion

:: ================================================
::  Recruiting Sales Coach - Grok API Proxy (One-Click Launcher)
:: ================================================

echo.
echo ================================================
echo   Recruiting Sales Coach - Grok API Proxy
echo ================================================
echo.

:: Change to the folder where this .bat file lives (very important)
cd /d "%~dp0" 2>nul

:: WSL path detection
echo %CD% | findstr /i "\\wsl.localhost\\" >nul
if %ERRORLEVEL% equ 0 (
    echo [WARNING] Detected WSL path. Please run from a normal Windows folder.
    echo.
    echo Recommended:
    echo   Open WSL terminal and run:  bash start-proxy.sh
    echo.
    pause
    exit /b 1
)

if not exist "proxy.js" (
    echo.
    echo [ERROR] proxy.js was NOT found in the current folder.
    echo.
    echo The script thinks it is running from this location:
    echo %CD%
    echo.
    echo Here are the files it can see in this folder:
    dir /b
    echo.
    echo ============================================================
    echo   HOW TO FIX THIS
    echo ============================================================
    echo.
    echo 1. Make sure the file "start-proxy.bat" lives in the SAME folder
    echo    as "proxy.js" and "index.html".
    echo.
    echo 2. Right-click on start-proxy.bat → "Open file location"
    echo    and verify that proxy.js is sitting right next to it.
    echo.
    echo 3. Double-click the .bat file from that folder.
    echo.
    echo If you are using WSL (Ubuntu), it is often better to run:
    echo     bash start-proxy.sh
    echo from inside your WSL terminal instead.
    echo ============================================================
    echo.
    pause
    exit /b 1
)

:: Check for Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed.
    echo.
    echo Please download and install Node.js from:
    echo https://nodejs.org (LTS version recommended)
    echo.
    echo After installing, restart your computer and try again.
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js found

:: Check if node_modules is missing OR if critical packages are missing
if not exist "node_modules\express" (
    echo.
    echo [INFO] Installing required packages (this may take 1-2 minutes)...
    echo.
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo.
        echo [ERROR] npm install failed.
        echo.
        echo Please try this manually:
        echo   1. Open Command Prompt in this folder
        echo   2. Type: npm install
        echo   3. Press Enter and wait for it to finish
        echo.
        pause
        exit /b 1
    )
    echo [OK] Packages installed.
    echo.
) else (
    echo [OK] Dependencies look good.
)

if not defined PORT set PORT=3002
echo [OK] Starting Grok Proxy on http://localhost:%PORT%
echo.
echo ================================================
echo   IMPORTANT INSTRUCTIONS
echo ================================================
echo.
echo 1. Keep this black window OPEN while using the app (runs proxy for API).
echo 2. Recommended: open http://localhost:3002 in browser.
echo    (Or use your own server e.g. on 8080 for the HTML; API calls will still hit the proxy on 3000.)
echo 3. When you use any AI feature (Weekly Recruiting Plan, scripts, etc.),
echo    the app will ask for your Grok API key the first time.
echo.
echo To stop the proxy later, just close this window.
echo.
echo ================================================
echo.

:: Finally start the proxy
echo.
echo [OK] Launching proxy server...
echo.

set PORT=%PORT%
node proxy.js

echo.
echo ================================================
echo   Proxy has stopped (or failed to start).
echo   Please read any error messages above.
echo ================================================
echo.
echo Press any key to close this window...
pause >nul 2>&1