@echo off
setlocal EnableExtensions EnableDelayedExpansion
for %%I in ("%~dp0..") do set "ROOT=%%~fI"
set "BACKEND=%ROOT%\backend"
set "FRONTEND=%ROOT%\frontend"
set "PHP=C:\xampp\php\php.exe"
set "DATABASE=%BACKEND%\database\petsystem_demo.sqlite"

if not exist "%PHP%" (
  echo ERRO: PHP nao encontrado em C:\xampp\php\php.exe.
  echo Instale ou ajuste o caminho do PHP antes de iniciar.
  exit /b 1
)
where node.exe >nul 2>&1 || (echo ERRO: node.exe nao encontrado no PATH. & exit /b 1)
where npm.cmd >nul 2>&1 || (echo ERRO: npm.cmd nao encontrado no PATH. & exit /b 1)
if not exist "%BACKEND%\artisan" (echo ERRO: backend\artisan nao encontrado. & exit /b 1)
if not exist "%FRONTEND%\package.json" (echo ERRO: frontend\package.json nao encontrado. & exit /b 1)
if not exist "%BACKEND%\.env.demo" (echo ERRO: backend\.env.demo nao existe. & exit /b 1)

if not exist "%FRONTEND%\node_modules\.bin\vite.cmd" (
  echo Instalando dependencias do frontend com npm ci...
  pushd "%FRONTEND%"
  call npm.cmd ci
  if errorlevel 1 (popd & echo ERRO: npm ci falhou. & exit /b 1)
  popd
)
if not exist "%BACKEND%\vendor\autoload.php" (
  where composer >nul 2>&1 || (echo ERRO: Composer nao encontrado e backend\vendor esta ausente. & exit /b 1)
  echo Instalando dependencias do backend com Composer...
  pushd "%BACKEND%"
  call composer install
  if errorlevel 1 (popd & echo ERRO: composer install falhou. & exit /b 1)
  popd
)

pushd "%BACKEND%"
"%PHP%" artisan --env=demo config:show app.env | findstr /I /C:"demo" >nul
if errorlevel 1 (popd & echo ERRO: Laravel nao reconheceu APP_ENV=demo. & exit /b 1)
"%PHP%" artisan --env=demo config:show database.default | findstr /I /C:"sqlite" >nul
if errorlevel 1 (popd & echo ERRO: a conexao efetiva nao e SQLite. Nenhum banco foi alterado. & exit /b 1)
"%PHP%" artisan --env=demo config:show database.connections.sqlite.database | findstr /I /C:"%DATABASE%" >nul
if errorlevel 1 (popd & echo ERRO: o SQLite efetivo nao e o banco petsystem_demo esperado. & exit /b 1)

set "NEW_DATABASE=0"
if not exist "%DATABASE%" (
  echo Criando o arquivo SQLite vazio da demonstracao.
  type nul > "%DATABASE%"
  if errorlevel 1 (popd & echo ERRO: nao foi possivel criar o arquivo SQLite. & exit /b 1)
  set "NEW_DATABASE=1"
  echo Aplicando as migrations no SQLite demo novo...
  call "%PHP%" artisan --env=demo migrate --force
  if errorlevel 1 (popd & echo ERRO: migrations do SQLite demo falharam. & exit /b 1)
  echo Carregando dados ficticios no SQLite demo novo...
  call "%PHP%" artisan --env=demo db:seed --class=DemoDataSeeder --force
  if errorlevel 1 (popd & echo ERRO: DemoDataSeeder falhou. & exit /b 1)
) else (
  set "STATUS_FILE=%TEMP%\petsystem-migration-status-%RANDOM%.txt"
  "%PHP%" artisan --env=demo migrate:status --no-ansi > "!STATUS_FILE!" 2>&1
  if errorlevel 1 (type "!STATUS_FILE!" & del "!STATUS_FILE!" >nul 2>&1 & popd & echo ERRO: nao foi possivel verificar o estado das migrations. & exit /b 1)
  findstr /I /C:"Pending" "!STATUS_FILE!" >nul
  if not errorlevel 1 (
    echo Migrations pendentes encontradas; aplicando somente as pendentes.
    del "!STATUS_FILE!" >nul 2>&1
    call "%PHP%" artisan --env=demo migrate --force
    if errorlevel 1 (popd & echo ERRO: migrations pendentes falharam. & exit /b 1)
  ) else (
    echo Banco SQLite demo atualizado; nenhuma migration pendente.
    del "!STATUS_FILE!" >nul 2>&1
  )
)
popd

set "PORT8000_STATE=UNKNOWN"
set "PORT5173_STATE=UNKNOWN"
for /f "tokens=1,2 delims=:" %%A in ('powershell -NoProfile -Command "$root=[IO.Path]::GetFullPath('%ROOT%'); $all=Get-CimInstance Win32_Process -ErrorAction Stop; foreach($port in @(8000,5173)){try{$ls=@(Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction Stop)}catch{Write-Output ('UNKNOWN:'+ $port);continue}; if($ls.Count -eq 0){Write-Output ('FREE:'+ $port);continue}; $bad=$false; foreach($l in $ls){$p=$all|Where-Object {$_.ProcessId -eq $l.OwningProcess}; $parts=@(); for($i=0;$p -and $i -lt 6;$i++){$parts += [string]$p.CommandLine; $parent=$p.ParentProcessId; $p=$all|Where-Object {$_.ProcessId -eq $parent}}; $line=$parts -join ' '; $same=$line.IndexOf($root,[StringComparison]::OrdinalIgnoreCase) -ge 0; if($port -eq 8000){$app=($line -match 'artisan.*serve') -and ($line -match '--env=demo') -and ($line -match '--port=8000')}else{$app=($line -match 'vite|npm(\.cmd)? run dev') -and ($line -match '5173')}; if(-not($same -and $app)){$bad=$true}}; if($bad){Write-Output ('BUSY:'+ $port)}else{Write-Output ('OWN:'+ $port)}}"') do (
  if "%%B"=="8000" set "PORT8000_STATE=%%A"
  if "%%B"=="5173" set "PORT5173_STATE=%%A"
)
if "!PORT8000_STATE!"=="BUSY" (echo ERRO: porta 8000 ocupada por processo nao confirmado como PetSystem demo. & exit /b 1)
if "!PORT5173_STATE!"=="BUSY" (echo ERRO: porta 5173 ocupada por processo nao confirmado como Vite deste projeto. & exit /b 1)
if "!PORT8000_STATE!"=="UNKNOWN" (echo ERRO: nao foi possivel inspecionar a porta 8000 com seguranca. & exit /b 1)
if "!PORT5173_STATE!"=="UNKNOWN" (echo ERRO: nao foi possivel inspecionar a porta 5173 com seguranca. & exit /b 1)

if "!PORT8000_STATE!"=="OWN" (echo Backend PetSystem demo ja esta ativo na porta 8000.) else (
  echo Iniciando backend em uma nova janela...
  start "PetSystem V3 Backend" "%ComSpec%" /k "cd /d ""%BACKEND%"" ^&^& ""%PHP%"" artisan --env=demo serve --host=127.0.0.1 --port=8000"
)
if "!PORT5173_STATE!"=="OWN" (echo Frontend Vite deste projeto ja esta ativo na porta 5173.) else (
  echo Iniciando frontend em uma nova janela...
  start "PetSystem V3 Frontend" "%ComSpec%" /k "cd /d ""%FRONTEND%"" ^&^& call npm.cmd run dev -- --host 127.0.0.1 --port 5173"
)

echo Aguardando a API pronta e o frontend...
powershell -NoProfile -Command "$limit=(Get-Date).AddSeconds(60); do { try {$r=Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 'http://127.0.0.1:8000/api/health/ready'; if($r.StatusCode -eq 200){break}} catch {}; Start-Sleep -Seconds 2 } while((Get-Date) -lt $limit); if((Get-Date) -ge $limit){exit 1}; $limit=(Get-Date).AddSeconds(60); do { try {$r=Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 'http://127.0.0.1:5173/'; if($r.StatusCode -eq 200){exit 0}} catch {}; Start-Sleep -Seconds 2 } while((Get-Date) -lt $limit); exit 1"
if errorlevel 1 (echo ERRO: API ou frontend nao respondeu em ate 60 segundos. Confira as duas janelas abertas. & exit /b 1)
echo PetSystem V3 pronto. Abrindo http://127.0.0.1:5173 ...
start "" "http://127.0.0.1:5173"
exit /b 0
