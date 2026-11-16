@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo eFootball Arena ishga tushmoqda...
start "" http://localhost:8000
py server.py 2>nul || python server.py
pause
