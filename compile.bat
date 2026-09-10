@echo off
setlocal
cd /d "%~dp0"
powershell.exe -ExecutionPolicy Bypass -NoProfile -File "%~dp0scripts\build-exe.ps1"
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Process exited with code %ERRORLEVEL%
    pause
    exit /b %ERRORLEVEL%
)
