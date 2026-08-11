@echo off
setlocal

:: Get the directory of the batch file
set "DIR=%~dp0"
cd /d "%DIR%"

echo Starting Paladins Pass Concept...

:: Check if node_modules exists
if not exist "node_modules\" (
    echo node_modules folder not found. Running npm install...
    call npm install
    if errorlevel 1 (
        echo Error: npm install failed. Please make sure Node.js is installed.
        pause
        exit /b 1
    )
)

echo Starting Vite development server...
:: Using --open flag to automatically open in default browser
call npm run dev -- --open

:: If the server crashes or exits, pause so the user can see the error
pause
