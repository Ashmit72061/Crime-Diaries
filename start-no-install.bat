@echo off
echo ===================================================
echo     PHAROS Application Startup Script
echo ===================================================
echo.

echo [1/6] Starting Docker services (PostgreSQL, RabbitMQ, Redis)...
docker compose up -d
if %ERRORLEVEL% neq 0 (
    echo [Warning] Failed to start Docker services. Make sure Docker Desktop is running!
)
echo.

cd backend

echo [3/6] Running database migrations...
call npm run db:migrate
echo.

echo [4/6] Seeding database, running scripts, and verifying...
call npm run db:seed
call node scripts/seed-fields.js
call node scripts/seed-mock-data.js
call node scripts/verify_pharos.js
call node scripts/verify_p2_filters_contracts.js
@REM call node scripts/verify_reports.js
call node scripts/seed-dummy-data.js
echo.

echo [5/6] Starting frontend in a new terminal...
start "PHAROS Frontend" cmd /k "cd ../frontend && npm run dev"
echo.

echo [6/6] Launching local backend server...
echo Server running on http://localhost:3000
npm run dev
