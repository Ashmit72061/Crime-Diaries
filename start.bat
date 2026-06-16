@echo off
title Delhi Police Portal Starter
echo ===================================================
echo   Starting Delhi Police Daily Operational Reporting Portal
echo ===================================================
echo.

:: Check if root node_modules exists, if not, run installer
if not exist "node_modules" (
    echo [INFO] Root dependencies not found. Installing...
    call npm run install:all
    goto START_DEV
)

:: Check if backend node_modules exists
if not exist "backend\node_modules" (
    echo [INFO] Backend dependencies not found. Installing...
    call npm run install:all
    goto START_DEV
)

:: Check if frontend node_modules exists
if not exist "frontend\node_modules" (
    echo [INFO] Frontend dependencies not found. Installing...
    call npm run install:all
    goto START_DEV
)

:START_DEV
echo.
echo [SUCCESS] Dependencies checked. Starting dev servers...
echo [INFO] Frontend: http://localhost:5173/
echo [INFO] Backend API: http://localhost:5000/api/v1
echo.
call npm run dev
pause
