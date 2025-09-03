@echo off
echo ========================================
echo    ONBOARD HR System - Deployment
echo ========================================
echo.

:: Check if Node.js is installed
echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js found: 
node --version

:: Check if npm is installed
echo Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed or not in PATH
    pause
    exit /b 1
)
echo npm found:
npm --version

echo.
echo ========================================
echo Installing Dependencies...
echo ========================================

:: Install backend dependencies
echo Installing backend dependencies...
cd backend
if exist node_modules (
    echo Backend node_modules already exists, skipping installation
) else (
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install backend dependencies
        pause
        exit /b 1
    )
)
echo Backend dependencies installed successfully

:: Install frontend dependencies
echo Installing frontend dependencies...
cd ..\frontend
if exist node_modules (
    echo Frontend node_modules already exists, skipping installation
) else (
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install frontend dependencies
        pause
        exit /b 1
    )
)
echo Frontend dependencies installed successfully

:: Return to root directory
cd ..

echo.
echo ========================================
echo Database Setup...
echo ========================================

:: Check if PostgreSQL is available
echo Checking PostgreSQL connection...
cd backend
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'onboardd',
  user: 'postgres',
  password: 'your_password'
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.log('ERROR: Cannot connect to PostgreSQL');
    console.log('Please ensure PostgreSQL is running and credentials are correct');
    process.exit(1);
  } else {
    console.log('PostgreSQL connection successful');
    process.exit(0);
  }
});
" >nul 2>&1

if %errorlevel% neq 0 (
    echo WARNING: PostgreSQL connection failed
    echo Please ensure PostgreSQL is running and update config.env with correct credentials
    echo.
    echo You can still continue with the deployment, but database operations may fail
    echo.
    pause
)

:: Run database migration
echo Running database migration...
if exist migrations\001_initial_attendance_setup.sql (
    echo Migration file found, running...
    psql -d onboardd -f migrations\001_initial_attendance_setup.sql >nul 2>&1
    if %errorlevel% equ 0 (
        echo Database migration completed successfully
    ) else (
        echo WARNING: Database migration failed
        echo You may need to run the migration manually
    )
) else (
    echo WARNING: Migration file not found
    echo Please ensure migrations\001_initial_attendance_setup.sql exists
)

cd ..

echo.
echo ========================================
echo Building Frontend...
echo ========================================

:: Build frontend
echo Building frontend for production...
cd frontend
npm run build
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed
    pause
    exit /b 1
)
echo Frontend built successfully

cd ..

echo.
echo ========================================
echo Deployment Summary
echo ========================================
echo.
echo ✓ Node.js and npm verified
echo ✓ Backend dependencies installed
echo ✓ Frontend dependencies installed
echo ✓ Frontend built for production
echo ✓ Database migration attempted
echo.
echo ========================================
echo Deployment Completed Successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Update backend/config.env with your database credentials
echo 2. Run start-application.bat to start the application
echo 3. Access the application at http://localhost:3001
echo.
echo For development:
echo - Backend will run on http://localhost:5001
echo - Frontend will run on http://localhost:3001
echo.
pause
