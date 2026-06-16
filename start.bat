@echo off
echo ===================================================
echo     PHAROS Backend Startup & Test Suite Launcher
echo ===================================================
echo.

echo [1/3] Spinning up RabbitMQ and Redis Docker containers...
docker compose up -d
if %ERRORLEVEL% neq 0 (
    echo [Warning] Failed to start Docker services. Make sure Docker Desktop is running!
)
echo.

echo [2/3] Checking backend node dependencies...
cd pharos-backend
call npm install
echo.

echo [3/3] Launching local backend server...
echo Server running on http://localhost:3000
echo Run "npm test" in another terminal to run verification tests.
echo.
npm run dev
