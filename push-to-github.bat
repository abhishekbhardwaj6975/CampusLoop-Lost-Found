@echo off
title Push CampusLoop to GitHub
echo ===================================================
echo   Pushing CampusLoop to GitHub
echo   Repo: https://github.com/abhishekbhardwaj6975/Smart-lost-found
echo ===================================================
echo.
echo If prompted for credentials:
echo   Username: abhishekbhardwaj6975
echo   Password: Your GitHub Personal Access Token (PAT)
echo.
"%LOCALAPPDATA%\Programs\MinGit\cmd\git.exe" push -u origin main
echo.
echo ===================================================
echo   Done!
echo ===================================================
pause
