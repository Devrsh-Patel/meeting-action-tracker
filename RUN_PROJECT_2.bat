@echo off
title Scalezix - Project 2: Meeting-to-Action Tracker
echo ======================================================================
echo  SCALEZIX - PROJECT 2: CLIENT MEETING-TO-ACTION TRACKER
echo ======================================================================
echo.
echo Starting Django Backend Server on http://127.0.0.1:8000 ...
start "Scalezix Project 2 - Backend" cmd /k "cd /d "%~dp0backend" && python manage.py runserver 127.0.0.1:8000"

timeout /t 3 /nobreak > nul

echo Starting React Frontend on http://localhost:5175 ...
start "Scalezix Project 2 - Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 2 /nobreak > nul

echo Opening browser at http://localhost:5175 ...
start http://localhost:5175

echo.
echo ======================================================================
echo  Both servers are running!
echo  Backend:  http://127.0.0.1:8000/api/
echo  Frontend: http://localhost:5175/
echo ======================================================================
pause

