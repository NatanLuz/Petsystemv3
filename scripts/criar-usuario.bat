@echo off
setlocal EnableExtensions
for %%I in ("%~dp0..") do set "ROOT=%%~fI"
set "BACKEND=%ROOT%\backend"
set "PHP=C:\xampp\php\php.exe"
if not exist "%PHP%" (echo ERRO: PHP nao encontrado em C:\xampp\php\php.exe. & exit /b 1)
if not exist "%BACKEND%\artisan" (echo ERRO: backend\artisan nao encontrado. & exit /b 1)
if not exist "%BACKEND%\.env.demo" (echo ERRO: backend\.env.demo nao existe. & exit /b 1)
if not exist "%BACKEND%\vendor\autoload.php" (echo ERRO: dependencias do backend ausentes. Execute scripts\iniciar.bat primeiro. & exit /b 1)
pushd "%BACKEND%"
"%PHP%" artisan --env=demo config:show app.env | findstr /I /C:"demo" >nul
if errorlevel 1 (popd & echo ERRO: o ambiente efetivo nao e demo. & exit /b 1)
"%PHP%" artisan --env=demo config:show database.default | findstr /I /C:"sqlite" >nul
if errorlevel 1 (popd & echo ERRO: a conexao efetiva nao e SQLite. & exit /b 1)
"%PHP%" artisan --env=demo config:show database.connections.sqlite.database | findstr /I /C:"petsystem_demo.sqlite" >nul
if errorlevel 1 (popd & echo ERRO: o SQLite efetivo nao e o banco demo esperado. & exit /b 1)
echo Informe os dados no terminal. A senha sera oculta e nao e argumento do comando.
"%PHP%" artisan --env=demo petsystem:create-user
set "RESULT=%ERRORLEVEL%"
popd
exit /b %RESULT%
