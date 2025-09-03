@echo off
REM NXZEN HR Employee Onboarding & Attendance Management
REM Start Application Script for Windows
REM Version: 1.0.0
REM Date: 2025-09-03

echo ========================================
echo   ONBOARD HR System - Start Application
echo ========================================
echo.

REM Set colors for output
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "BLUE=[94m"
set "NC=[0m"

REM Configuration
set "PROJECT_NAME=ONDOARD"
set "BACKEND_PORT=5001"
set "FRONTEND_PORT=3001"
set "DB_NAME=onboardd"
set "DB_USER=postgres"
set "DB_HOST=localhost"
set "DB_PORT=5432"

echo %BLUE%🚀 Starting %PROJECT_NAME% application...%NC%
echo.

REM Check if Node.js is installed
echo %GREEN%✅ Checking Node.js installation...%NC%
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%❌ Node.js is not installed or not in PATH%NC%
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js found: 
node --version

REM Check if npm is installed
echo %GREEN%✅ Checking npm installation...%NC%
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo %RED%❌ npm is not installed or not in PATH%NC%
    pause
    exit /b 1
)
echo npm found:
npm --version
echo.

REM Check if PostgreSQL is available
echo %GREEN%✅ Checking PostgreSQL connection...%NC%
psql -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -d %DB_NAME% -c "SELECT 1;" >nul 2>&1
if %errorlevel% neq 0 (
    echo %YELLOW%⚠️  Warning: Cannot connect to PostgreSQL%NC%
    echo Please ensure PostgreSQL is running and database '%DB_NAME%' exists
    echo.
    set /p "CONTINUE=Do you want to continue anyway? (y/N): "
    if /i not "%CONTINUE%"=="y" (
        echo Deployment cancelled.
        pause
        exit /b 1
    )
) else (
    echo %GREEN%✅ Database connection successful%NC%
)
echo.

REM Kill existing processes
echo %GREEN%✅ Stopping existing processes...%NC%
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.cmd >nul 2>&1
timeout /t 2 >nul

REM Install backend dependencies if needed
if not exist "backend\node_modules" (
    echo %GREEN%✅ Installing backend dependencies...%NC%
    cd backend
    call npm install
    if %errorlevel% neq 0 (
        echo %RED%❌ Failed to install backend dependencies%NC%
        pause
        exit /b 1
    )
    cd ..
    echo %GREEN%✅ Backend dependencies installed%NC%
) else (
    echo %GREEN%✅ Backend dependencies already installed%NC%
)

REM Install frontend dependencies if needed
if not exist "frontend\node_modules" (
    echo %GREEN%✅ Installing frontend dependencies...%NC%
    cd frontend
    call npm install
    if %errorlevel% neq 0 (
        echo %RED%❌ Failed to install frontend dependencies%NC%
        pause
        exit /b 1
    )
    cd ..
    echo %GREEN%✅ Frontend dependencies installed%NC%
) else (
    echo %GREEN%✅ Frontend dependencies already installed%NC%
)

echo.

REM Start backend server
echo %GREEN%✅ Starting backend server on port %BACKEND_PORT%...%NC%
cd backend
start "Backend Server" cmd /k "npm start"
cd ..
timeout /t 5 >nul

REM Check if backend is running
echo %GREEN%✅ Checking backend server...%NC%
curl -s http://localhost:%BACKEND_PORT%/api/attendance/settings >nul 2>&1
if %errorlevel% neq 0 (
    echo %YELLOW%⚠️  Backend server may still be starting up%NC%
) else (
    echo %GREEN%✅ Backend server is running%NC%
)

REM Start frontend server
echo %GREEN%✅ Starting frontend server on port %FRONTEND_PORT%...%NC%
cd frontend
start "Frontend Server" cmd /k "npm start"
cd ..
timeout /t 10 >nul

REM Check if frontend is running
echo %GREEN%✅ Checking frontend server...%NC%
curl -s http://localhost:%FRONTEND_PORT% >nul 2>&1
if %errorlevel% neq 0 (
    echo %YELLOW%⚠️  Frontend server may still be starting up%NC%
) else (
    echo %GREEN%✅ Frontend server is running%NC%
)

echo.
echo ========================================
echo   🎉 Application Started Successfully!
echo ========================================
echo.
echo %BLUE%📋 Application Information:%NC%
echo    Project: %PROJECT_NAME%
echo    Backend: http://localhost:%BACKEND_PORT%
echo    Frontend: http://localhost:%FRONTEND_PORT%
echo    Database: %DB_NAME%
echo.
echo %BLUE%🔑 Default Login Credentials:%NC%
echo    HR Admin: hr@nxzen.com / test123
echo    Test HR: testhr@nxzen.com / test123
echo    Manager: manager@company.com / test123
echo    Test Employee: test@test.com / test123
echo.
echo %BLUE%🛠️  Management Commands:%NC%
echo    Stop all services: stop-application.bat
echo    Restart services: restart-application.bat
echo    View logs: Check the command windows that opened
echo.
echo %GREEN%✅ Opening application in browser...%NC%
timeout /t 3 >nul
start http://localhost:%FRONTEND_PORT%

echo.
echo %GREEN%✅ Application is now running!%NC%
echo Press any key to close this window...
pause >nul
