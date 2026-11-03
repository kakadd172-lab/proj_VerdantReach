@echo off
setlocal
cd /d "%~dp0"
set "PYTHON_CMD="
where py >nul 2>nul && set "PYTHON_CMD=py"
if not defined PYTHON_CMD (
  where python >nul 2>nul
  if not errorlevel 1 set "PYTHON_CMD=python"
)
if not defined PYTHON_CMD (
  echo Python 3 was not found.
  echo Install Python 3 from https://www.python.org/downloads/ and try again.
  echo During installation, enable "Add Python to PATH".
  pause
  exit /b 1
)
echo Starting Wildrift at http://127.0.0.1:8000
echo A small server window will stay open while you play.
start "Wildrift local server" /min cmd /k "%PYTHON_CMD% -m http.server 8000 --bind 127.0.0.1"
timeout /t 2 /nobreak >nul
start "" http://127.0.0.1:8000
