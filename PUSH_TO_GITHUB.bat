@echo off
title Scalezix - Push Project 2 to GitHub
echo ======================================================================
echo  SCALEZIX: PUSH PROJECT 2 TO GITHUB REPOSITORY
echo ======================================================================
echo Repository: https://github.com/Devrsh-Patel/meeting-action-tracker.git
echo.

set "PATH=C:\Program Files\Microsoft Visual Studio\18\Community\Common7\IDE\CommonExtensions\Microsoft\TeamFoundation\Team Explorer\Git\cmd;C:\Program Files\Microsoft Visual Studio\18\Community\Common7\IDE\CommonExtensions\Microsoft\TeamFoundation\Team Explorer\Git\mingw64\bin;%PATH%"
cd /d "%~dp0"

echo Git Version:
git --version
echo.
echo Current Git Status:
git status
echo.
echo ======================================================================
echo  Pushing 'main' branch to https://github.com/Devrsh-Patel/meeting-action-tracker.git
echo  (If Git Credential Manager prompts in your browser, click 'Authorize')
echo ======================================================================
echo.

git push -u origin main

echo.
if %ERRORLEVEL% equ 0 (
    echo ======================================================================
    echo  SUCCESS: Project 2 is uploaded to GitHub!
    echo  URL: https://github.com/Devrsh-Patel/meeting-action-tracker
    echo ======================================================================
) else (
    echo ======================================================================
    echo  Push encountered an issue. See details above.
    echo ======================================================================
)
pause
