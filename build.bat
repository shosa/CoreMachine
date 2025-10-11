@echo off
echo ============================================
echo Building CoreMachine
echo ============================================
docker-compose -p coremachine build %*
echo.
echo Build completed!
