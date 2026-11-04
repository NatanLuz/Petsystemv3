@echo off
setlocal EnableExtensions EnableDelayedExpansion
for %%I in ("%~dp0..") do set "ROOT=%%~fI"
set "BACKEND=%ROOT%\backend"
set "FRONTEND=%ROOT%\frontend"
set "PHP=C:\xampp\php\php.exe"
set "FAILED="
set "BACKEND_LOG=%TEMP%\petsystem-backend-test-%RANDOM%-%RANDOM%.log"
set "NODE_LOG=%TEMP%\petsystem-node-test-%RANDOM%-%RANDOM%.log"
set "VERIFY_LOG=%TEMP%\petsystem-verify-%RANDOM%-%RANDOM%.log"
set "BUILD_LOG=%TEMP%\petsystem-build-%RANDOM%-%RANDOM%.log"
set "NODE_FAILURE_LOG=%NODE_LOG%"

if not exist "%PHP%" (echo ERRO: PHP nao encontrado em C:\xampp\php\php.exe. & exit /b 1)
where node.exe >nul 2>&1 || (echo ERRO: node.exe nao encontrado no PATH. & exit /b 1)
where npm.cmd >nul 2>&1 || (echo ERRO: npm.cmd nao encontrado no PATH. & exit /b 1)
if exist "%BACKEND%\bootstrap\cache\config.php" (echo ERRO: existe cache de configuracao. Testes nao iniciados para proteger o banco. & exit /b 1)
if exist "%BACKEND%\.env.testing" (echo ERRO: existe .env.testing. Testes nao iniciados para proteger o isolamento. & exit /b 1)
if not exist "%BACKEND%\vendor\autoload.php" (echo ERRO: backend\vendor ausente. Execute scripts\iniciar.bat primeiro. & exit /b 1)
if not exist "%FRONTEND%\node_modules\.bin\vite.cmd" (echo ERRO: dependencias frontend ausentes. Execute scripts\iniciar.bat primeiro. & exit /b 1)

pushd "%BACKEND%"
set "APP_ENV=testing"
set "DB_CONNECTION=sqlite"
set "DB_DATABASE=:memory:"
set "DB_URL="
set "SESSION_DRIVER=array"
set "CACHE_STORE=array"
set "APP_CONFIG_CACHE=%TEMP%\petsystem-test-config-%RANDOM%-%RANDOM%.php"
if exist "%APP_CONFIG_CACHE%" (echo ERRO: caminho temporario de configuracao ja existe; testes nao iniciados. & popd & exit /b 1)
"%PHP%" artisan test > "%BACKEND_LOG%" 2>&1
set "BACKEND_RESULT=!ERRORLEVEL!"
popd
if "!BACKEND_RESULT!"=="0" (echo Backend: OK) else (
  echo Backend: FALHOU
  powershell -NoProfile -Command "Get-Content -LiteralPath '%BACKEND_LOG%' -Tail 10"
  set "FAILED=Backend"
)

pushd "%FRONTEND%"
node.exe --test > "%NODE_LOG%" 2>&1
set "NODE_RESULT=!ERRORLEVEL!"
call npm.cmd run verify > "%VERIFY_LOG%" 2>&1
set "VERIFY_RESULT=!ERRORLEVEL!"
if "!VERIFY_RESULT!"=="0" (
  set "BUILD_RESULT=0"
) else (
  findstr /I /C:"vite v" "%VERIFY_LOG%" >nul
  if errorlevel 1 (
    set "NODE_RESULT=1"
    set "NODE_FAILURE_LOG=%VERIFY_LOG%"
    call npm.cmd run build > "%BUILD_LOG%" 2>&1
    set "BUILD_RESULT=!ERRORLEVEL!"
  ) else (
    set "BUILD_RESULT=1"
    copy /y "%VERIFY_LOG%" "%BUILD_LOG%" >nul
  )
)
popd

if "!NODE_RESULT!"=="0" (echo Frontend testes: OK) else (
  echo Frontend testes: FALHOU
  powershell -NoProfile -Command "Get-Content -LiteralPath '!NODE_FAILURE_LOG!' -Tail 10"
  if defined FAILED (set "FAILED=!FAILED!, Frontend testes") else set "FAILED=Frontend testes"
)
if "!BUILD_RESULT!"=="0" (echo Build: OK) else (
  echo Build: FALHOU
  powershell -NoProfile -Command "Get-Content -LiteralPath '%BUILD_LOG%' -Tail 10"
  if defined FAILED (set "FAILED=!FAILED!, Build") else set "FAILED=Build"
)

del "%BACKEND_LOG%" "%NODE_LOG%" "%VERIFY_LOG%" "%BUILD_LOG%" >nul 2>&1
if defined FAILED (echo FALHOU em: !FAILED! & exit /b 1)
echo TUDO OK
exit /b 0
