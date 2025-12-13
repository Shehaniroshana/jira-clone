@echo off
echo ========================================
echo   Jira Clone - Quick Setup Script
echo ========================================
echo.

REM Check if PostgreSQL is installed
echo [1/6] Checking PostgreSQL...
where psql >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] PostgreSQL not found in PATH
    echo Please ensure PostgreSQL is installed and running
) else (
    echo [OK] PostgreSQL found
)
echo.

REM Check if Go is installed
echo [2/6] Checking Go installation...
where go >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Go not found! Please install Go 1.21 or higher
    echo Download from: https://golang.org/dl/
    pause
    exit /b 1
) else (
    echo [OK] Go found
    go version
)
echo.

REM Check if Node.js is installed
echo [3/6] Checking Node.js installation...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found! Please install Node.js 18 or higher
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
) else (
    echo [OK] Node.js found
    node --version
)
echo.

REM Setup Backend
echo [4/6] Setting up Backend...
cd backend

if not exist .env (
    echo Creating .env file from template...
    copy ..\.env.example .env
    echo [INFO] Please edit backend\.env with your database credentials
)

echo Installing Go dependencies...
go mod download
if %errorlevel% neq 0 (
    echo [ERROR] Failed to download Go dependencies
    cd ..
    pause
    exit /b 1
)
echo [OK] Go dependencies installed
cd ..
echo.

REM Setup Frontend
echo [5/6] Setting up Frontend...
cd frontend

echo Installing npm dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install npm dependencies
    cd ..
    pause
    exit /b 1
)
echo [OK] npm dependencies installed
cd ..
echo.

REM Final instructions
echo [6/6] Setup Complete!
echo.
echo ========================================
echo   Next Steps:
echo ========================================
echo.
echo 1. Configure your database in backend\.env
echo 2. Ensure PostgreSQL is running
echo 3. Start the backend:
echo    cd backend
echo    go run cmd\api\main.go
echo.
echo 4. In a new terminal, start the frontend:
echo    cd frontend
echo    npm run dev
echo.
echo 5. Open http://localhost:5173 in your browser
echo.
echo ========================================
echo.
pause
