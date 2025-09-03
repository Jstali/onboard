@echo off
REM NXZEN HR Employee Onboarding & Attendance Management
REM Restart Application Script for Windows
REM Version: 1.0.0
REM Date: 2025-09-03

echo ========================================
echo   ONBOARD HR System - Restart Application
echo ========================================
echo.

REM Set colors for output
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "BLUE=[94m"
set "NC=[0m"

echo %BLUE%🔄 Restarting ONDOARD application...%NC%
echo.

REM Stop the application first
echo %GREEN%✅ Stopping existing services...%NC%
call stop-application.bat

REM Wait a moment
echo %GREEN%✅ Waiting for services to stop...%NC%
timeout /t 3 >nul

REM Start the application
echo %GREEN%✅ Starting services...%NC%
call start-application.bat

echo.
echo ========================================
echo   🎉 Application Restarted Successfully!
echo ========================================
echo.
echo %GREEN%✅ Application has been restarted%NC%
echo.
echo Press any key to close this window...
pause >nul
