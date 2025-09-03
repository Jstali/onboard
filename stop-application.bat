@echo off
REM NXZEN HR Employee Onboarding & Attendance Management
REM Stop Application Script for Windows
REM Version: 1.0.0
REM Date: 2025-09-03

echo ========================================
echo   ONBOARD HR System - Stop Application
echo ========================================
echo.

REM Set colors for output
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "BLUE=[94m"
set "NC=[0m"

echo %BLUE%🛑 Stopping ONDOARD application...%NC%
echo.

REM Kill Node.js processes
echo %GREEN%✅ Stopping Node.js processes...%NC%
taskkill /f /im node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo %GREEN%✅ Node.js processes stopped%NC%
) else (
    echo %YELLOW%⚠️  No Node.js processes found%NC%
)

REM Kill npm processes
echo %GREEN%✅ Stopping npm processes...%NC%
taskkill /f /im npm.cmd >nul 2>&1
if %errorlevel% equ 0 (
    echo %GREEN%✅ npm processes stopped%NC%
) else (
    echo %YELLOW%⚠️  No npm processes found%NC%
)

REM Kill processes on specific ports
echo %GREEN%✅ Stopping processes on ports 5001 and 3001...%NC%
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5001') do (
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do (
    taskkill /f /pid %%a >nul 2>&1
)

REM Wait a moment
timeout /t 2 >nul

REM Verify processes are stopped
echo %GREEN%✅ Verifying processes are stopped...%NC%
netstat -aon | findstr :5001 >nul 2>&1
if %errorlevel% equ 0 (
    echo %YELLOW%⚠️  Port 5001 may still be in use%NC%
) else (
    echo %GREEN%✅ Port 5001 is free%NC%
)

netstat -aon | findstr :3001 >nul 2>&1
if %errorlevel% equ 0 (
    echo %YELLOW%⚠️  Port 3001 may still be in use%NC%
) else (
    echo %GREEN%✅ Port 3001 is free%NC%
)

echo.
echo ========================================
echo   🎉 Application Stopped Successfully!
echo ========================================
echo.
echo %GREEN%✅ All services have been stopped%NC%
echo.
echo Press any key to close this window...
pause >nul
