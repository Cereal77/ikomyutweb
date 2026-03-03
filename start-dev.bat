@echo off
echo.
echo ============================================
echo   Starting iKomyut Development Environment
echo ============================================
echo.

cd /d C:\Users\ADMIN\Desktop\ikomyutweb\booking-backend

echo [1/2] Starting Backend Server on port 5000...
echo.
start "Backend - Node Server" node src/server.js

timeout /t 3 /nobreak

cd /d C:\Users\ADMIN\Desktop\ikomyutweb\ikomyutweb

echo [2/2] Starting Frontend Dev Server...
echo.
start "Frontend - Vite Dev" npm run dev

echo.
echo ============================================
echo   Both servers are starting!
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:5173 (or shown in console)
echo ============================================
echo.
pause
