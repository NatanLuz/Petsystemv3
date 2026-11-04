@echo off
setlocal EnableExtensions
for %%I in ("%~dp0..") do set "ROOT=%%~fI"
powershell -NoProfile -Command "$root=[IO.Path]::GetFullPath('%ROOT%'); $all=Get-CimInstance Win32_Process -ErrorAction Stop; foreach($port in @(8000,5173)){try{$ls=@(Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction Stop)}catch{Write-Output ('NAO_VERIFICADO:'+ $port);continue}; foreach($l in $ls){$p=$all|Where-Object {$_.ProcessId -eq $l.OwningProcess}; $parts=@(); for($i=0;$p -and $i -lt 6;$i++){$parts += [string]$p.CommandLine; $parent=$p.ParentProcessId; $p=$all|Where-Object {$_.ProcessId -eq $parent}}; $line=$parts -join ' '; $same=$line.IndexOf($root,[StringComparison]::OrdinalIgnoreCase) -ge 0; if($port -eq 8000){$app=($line -match 'artisan.*serve') -and ($line -match '--env=demo') -and ($line -match '--port=8000')}else{$app=($line -match 'vite|npm(\.cmd)? run dev') -and ($line -match '5173')}; if($same -and $app){try{Stop-Process -Id $l.OwningProcess -ErrorAction Stop; Write-Output ('ENCERRADO:'+ $port)}catch{Write-Output ('FALHA_AO_ENCERRAR:'+ $port)}}else{Write-Output ('IGNORADO:'+ $port)}}}"
if errorlevel 1 (echo Nao foi possivel inspecionar os servidores com seguranca. Nenhum outro processo foi encerrado. & exit /b 1)
echo Verificacao concluida. Somente listeners identificados como PetSystem demo foram encerrados.
exit /b 0
