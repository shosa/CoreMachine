@echo off
echo ============================================
echo Starting Core Suite
echo ============================================
echo.
echo [1/2] Starting CoreServices...
cd CoreServices
call start.bat
cd ..
echo.
echo [2/2] Starting CoreMachine...
cd CoreMachine
call start.bat
cd ..
echo.
echo ============================================
echo Core Suite started successfully!
echo ============================================
