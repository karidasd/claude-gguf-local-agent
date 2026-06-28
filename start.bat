@echo off
title Local AI Studio
echo ==============================================
echo  Ksekinima Topikou AI Server (Llama.cpp)
echo  Ypomonh ligo mexri na fortwsei o server...
echo ==============================================

:: Anoigma tou browser sth selida mas
timeout /t 2 /nobreak >nul
start "" http://localhost:5000

:: Ksekinima tou node server
node server.mjs

pause
