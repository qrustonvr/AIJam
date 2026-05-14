# ============================================================
#  Cannon Quack — local dev server (PowerShell)
#  Run with:  .\serve.ps1
# ============================================================

Set-Location $PSScriptRoot

Write-Host ""
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  CANNON QUACK - local dev server" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

function Start-WithPython {
    Write-Host "Using Python to serve at http://localhost:8000" -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop." -ForegroundColor Gray
    Write-Host ""
    Start-Process "http://localhost:8000"
    python -m http.server 8000
}

function Start-WithPy {
    Write-Host "Using py launcher at http://localhost:8000" -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop." -ForegroundColor Gray
    Write-Host ""
    Start-Process "http://localhost:8000"
    py -m http.server 8000
}

function Start-WithNode {
    Write-Host "Using npx serve at http://localhost:3000" -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop." -ForegroundColor Gray
    Write-Host ""
    Start-Process "http://localhost:3000"
    npx --yes serve . -l 3000
}

if (Get-Command python -ErrorAction SilentlyContinue) {
    Start-WithPython
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
    Start-WithPy
} elseif (Get-Command npx -ErrorAction SilentlyContinue) {
    Start-WithNode
} else {
    Write-Host "ERROR: Neither Python nor Node was found on PATH." -ForegroundColor Red
    Write-Host ""
    Write-Host "Install one of:"
    Write-Host "  - Python:  https://www.python.org/downloads/"
    Write-Host "  - Node.js: https://nodejs.org/"
    Write-Host ""
    Write-Host "Then re-run this script."
    Read-Host "Press Enter to exit"
}
