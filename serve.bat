@echo off
REM ============================================================
REM  Cannon Quack — local dev server (Windows)
REM  Double-click this file to launch the game at localhost:8000
REM ============================================================

cd /d "%~dp0"

echo.
echo ===============================================
echo   CANNON QUACK - local dev server
echo ===============================================
echo.

REM --- Try Python first (most likely already installed) ---
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Using Python to serve at http://localhost:8000
    echo Press Ctrl+C to stop.
    echo.
    start "" http://localhost:8000
    python -m http.server 8000
    goto :eof
)

REM --- Try py launcher (alternate Python install) ---
where py >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Using py launcher to serve at http://localhost:8000
    echo Press Ctrl+C to stop.
    echo.
    start "" http://localhost:8000
    py -m http.server 8000
    goto :eof
)

REM --- Fall back to Node ---
where npx >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Using npx serve at http://localhost:3000
    echo Press Ctrl+C to stop.
    echo.
    start "" http://localhost:3000
    npx --yes serve . -l 3000
    goto :eof
)

REM --- Nothing found ---
echo ERROR: Neither Python nor Node was found on PATH.
echo.
echo Install one of:
echo   - Python:  https://www.python.org/downloads/
echo   - Node.js: https://nodejs.org/
echo.
echo Then re-run this script.
pause
