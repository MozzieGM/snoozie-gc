@echo off
cd /d "%~dp0"
echo === MozzieGM GC ===
where node >nul 2>nul
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado. Instale em https://nodejs.org/
  pause
  exit /b 1
)
if not exist "node_modules" (
  echo Instalando dependencias...
  call npm install
)
echo.
echo 1 - Build (uma vez)
echo 2 - Dev (watch, rebuilda sozinho)
set /p OP=Escolha [1/2, padrao 1]:
if "%OP%"=="2" (
  echo Rodando em modo dev... (CTRL+C para parar)
  call npm run dev
) else (
  call npm run build
  echo.
  echo Pronto! No Chrome: chrome://extensions -^> Modo desenvolvedor -^> Carregar sem compactacao -^> pasta dist
  start "" "dist"
)
pause
