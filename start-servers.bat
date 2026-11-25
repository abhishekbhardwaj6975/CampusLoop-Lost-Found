@echo off
title CampusLoop Server Starter
echo ===================================================
echo   CampusLoop - Smart Lost & Found Management
echo ===================================================
echo.
echo Starting Backend API (Port 5000)...
start "CampusLoop Backend (Port 5000)" cmd /k "node server/src/index.js"

timeout /t 2 /nobreak >nul

echo Starting Frontend Dev Server (Port 5173)...
start "CampusLoop Frontend (Port 5173)" cmd /k "npm.cmd --prefix client run dev"

echo.
echo ===================================================
echo   SERVERS ARE RUNNING!
echo   PC Browser:    http://localhost:5173
echo   Check your Wi-Fi IPv4 address for phone access!
echo ===================================================
echo.
pause
