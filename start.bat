@echo off
chcp 65001 >nul
title Mindly
cd /d "%~dp0"
set "PY="
py -3 --version >nul 2>nul && set "PY=py -3"
if not defined PY python --version >nul 2>nul && set "PY=python"
if not defined PY (
  echo.
  echo [Mindly] Python non e' installato / Python is not installed.
  echo Scaricalo da / Download it from: https://www.python.org/downloads/
  echo Durante l'installazione seleziona "Add Python to PATH" / enable "Add Python to PATH".
  echo.
  pause
  exit /b 1
)
if not exist "projects" mkdir "projects"
echo Mindly: http://127.0.0.1:8765  -  chiudi questa finestra per fermare il server / close this window to stop.
%PY% server.py --open
if errorlevel 1 pause
