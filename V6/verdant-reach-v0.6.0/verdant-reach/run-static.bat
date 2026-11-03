@echo off
cd /d "%~dp0"
echo Starting Verdant Reach at http://localhost:8000
py -m http.server 8000
pause
