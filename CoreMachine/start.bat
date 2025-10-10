@echo off
echo ============================================
echo Starting CoreMachine
echo ============================================
echo.
docker-compose -p coremachine up -d
echo.
echo ============================================
echo CoreMachine started!
echo ============================================
echo.
echo Application available at:
echo   - Frontend:    http://localhost
echo   - Backend API: http://localhost/api
echo.
docker-compose -p coremachine ps
