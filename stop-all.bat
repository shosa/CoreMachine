@echo off
echo ============================================
echo Stopping Core Suite
echo ============================================
echo.
echo [1/2] Stopping CoreMachine...
cd CoreMachine
call stop.bat
cd ..
echo.
echo [2/2] Stopping CoreServices...
cd CoreServices
call stop.bat
cd ..
echo.
echo ============================================
echo Core Suite stopped successfully!
echo ============================================
