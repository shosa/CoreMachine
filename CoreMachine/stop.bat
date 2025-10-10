@echo off
echo ============================================
echo Stopping CoreMachine
echo ============================================
docker-compose -p coremachine down
echo.
echo CoreMachine stopped!
