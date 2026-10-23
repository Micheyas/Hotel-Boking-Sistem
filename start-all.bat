@echo off
echo ========================================================
echo   Starting Hotel Booking Management System
echo ========================================================
echo.

set "PATH=%LOCALAPPDATA%\Programs\nodejs;%PATH%"

echo Starting Backend Server on port 5000...
start "Hotel Backend (Port 5000)" cmd /k "cd backend && node server.js"

echo Starting Frontend Server on port 3000...
start "Hotel Frontend (Port 3000)" cmd /k "node serve-frontend.js"

echo.
echo Both servers started!
echo - Frontend: http://localhost:3000
echo - Backend:  http://localhost:5000
echo - Admin:    http://localhost:3000/admin (admin@hotel.com / admin123)
echo.
pause
