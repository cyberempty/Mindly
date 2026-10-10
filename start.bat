@echo off
chcp 65001 >nul
title Mindly
cd /d "%~dp0"
set PYTHONDONTWRITEBYTECODE=1
set "PY="
py -3 --version >nul 2>nul && set "PY=py -3"
if not defined PY python --version >nul 2>nul && set "PY=python"
if not defined PY (
  echo.
  echo [Mindly] Python is not installed.
  echo Download it from: https://www.python.org/downloads/
  echo During installation, enable "Add Python to PATH".
  echo.
  pause
  exit /b 1
)
if not exist "projects" mkdir "projects"
echo Mindly is running at http://127.0.0.1:8765 - close this window to stop the server.
%PY% server.py --open
if errorlevel 1 pause
