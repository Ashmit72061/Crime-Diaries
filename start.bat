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

echo [2/6] Installing backend dependencies...
cd backend
call npm install
echo.

echo [3/6] Running database migrations...
call npm run db:migrate
echo.

echo [4/6] Seeding essential data (fields, users, config)...
call npm run db:seed
echo.

echo [4.5/6] Seeding dev test data (fresh dummy records)...
call node scripts/seed-test-data.js
echo.

echo [5/6] Starting frontend in a new terminal...
start "PHAROS Frontend" cmd /k "cd ../frontend && npm run dev"
echo.

echo [5.5/6] Starting Python report worker in a new terminal...
start "PHAROS Python Worker" cmd /k "cd ../python_worker && pip install -r requirements.txt && python main.py"
echo.

echo [6/6] Launching local backend server...
echo Server running on http://localhost:5000
npm run dev
