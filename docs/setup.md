# Configuração local — PetSystem V3

Nos exemplos, substitua C:\caminho\Petsystemv3 pelo caminho da sua cópia do projeto.

## Requisitos e dependências

Use CMD no Windows. Verifique `git --version`, `C:\xampp\php\php.exe --version`, `composer --version`, `node.exe --version` e `npm.cmd --version`. PHP mínimo: 8.2, com `pdo_sqlite`, `mbstring`, OpenSSL e demais extensões verificadas pelo Composer. Não é necessário iniciar MySQL/MariaDB.

Nesta estação, o PATH encontra arquivos em System32 que falham com acesso negado. Se acontecer, execute em cada CMD:

```bat
set "PATH=C:\Program Files\nodejs;%PATH%"
```

Instale as versões dos lockfiles, sem atualizar dependências:

```bat
cd /d C:\caminho\Petsystemv3\backend
composer install
composer check-platform-reqs
cd ..\frontend
npm.cmd ci
```

Dependências já instaladas podem ser reutilizadas quando correspondem aos lockfiles. Não use `composer setup`: ele executa migrations no banco configurado e não é apropriado para essa preparação segura.

## Preparar o ambiente demo

Se `backend\.env.demo` já existe, preserve-o. Para uma instalação nova, a partir da pasta backend:

```bat
if not exist .env.demo copy .env.demo.example .env.demo
notepad .env.demo
```

Ajuste `DB_DATABASE` para o caminho absoluto desta cópia, usando barras normais, por exemplo `C:/caminho/Petsystemv3/backend/database/petsystem_demo.sqlite`. Use `APP_ENV=demo`, `DB_CONNECTION=sqlite`, `DB_URL=` vazio, sessões e cache em arquivo e URLs `127.0.0.1`. O exemplo está preparado para HTTP local com debug desabilitado; não é uma configuração de hospedagem pública.

Gere uma chave **somente se APP_KEY estiver vazio**:

```bat
C:\xampp\php\php.exe artisan --env=demo key:generate
```

Não substitua chaves existentes. Não altere o `.env` original. Não execute `config:show` sem selecionar uma chave: a saída completa pode revelar segredos. Antes de acessar o banco, confirme somente estas opções:

```bat
C:\xampp\php\php.exe artisan --env=demo config:show app.env
C:\xampp\php\php.exe artisan --env=demo config:show database.default
C:\xampp\php\php.exe artisan --env=demo config:show database.connections.sqlite.database
```

Devem indicar `demo`, `sqlite` e o arquivo esperado. Havendo cache de configuração ou variáveis externas divergentes, pare a inicialização e confira a origem. `--env=demo` seleciona o arquivo, mas não elimina variáveis já definidas no processo nem substitui configuração em cache. Limpe cache apenas após confirmar que pertence a esta demonstração e reinicie seu servidor.

Para banco existente: faça [backup](backup.md) antes de qualquer migration pendente; não execute `migrate:fresh`, `refresh`, rollback ou seeder sobre dados do cliente. `migrate:status --env=demo` apenas consulta o estado. O script `iniciar.bat` aplica migrations pendentes no SQLite confirmado; não recria o banco existente e só executa `DemoDataSeeder` quando criou um banco novo.

Para banco novo, `scripts\iniciar.bat` cria o arquivo SQLite e aplica migrations e dados fictícios. Como alternativa, crie o arquivo vazio somente se ausente, aplique `artisan --env=demo migrate` e execute `artisan --env=demo db:seed --class=DemoDataSeeder` somente nessa instalação descartável nova. Esses comandos pressupõem conexão e caminho já confirmados. O seeder não cria contas ou senhas padrão.

## Dois terminais CMD

Depois da preparação do banco, terminal 1:

```bat
cd /d C:\caminho\Petsystemv3\backend
C:\xampp\php\php.exe artisan --env=demo serve --host=127.0.0.1 --port=8000
```

Terminal 2:

```bat
cd /d C:\caminho\Petsystemv3\frontend
set "PATH=C:\Program Files\nodejs;%PATH%"
npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Abra `http://127.0.0.1:5173`. A API padrão é `http://127.0.0.1:8000/api`. O `frontend/.env` é opcional; o modelo `frontend/.env.example` mostra `VITE_API_URL`. Não misture `localhost` com `127.0.0.1` na mesma sessão. Sanctum/CORS precisam incluir a origem usada. Mantenha os servidores restritos ao computador local.

Reutilize servidores existentes se forem desta cópia e deste ambiente. Não encerre listeners sem identificar a finalidade. Para os servidores iniciados nos terminais acima, use Ctrl+C no respectivo terminal. `scripts\parar.bat` tenta identificar processos desta cópia e ignora os não reconhecidos.

## Contas e inspeção sem segredos

No CMD da raiz, execute `scripts\criar-usuario.bat` uma vez para cada perfil necessário: `admin`, `receptionist`, `veterinarian`. O comando real é `php artisan --env=demo petsystem:create-user`, executado dentro de backend. Ele exige SQLite demo, e-mail único, senha com pelo menos oito caracteres e confirmação. A senha deve ser digitada pelo proprietário diretamente no terminal. Não há gestão de funcionários pela interface.

Na raiz, `php scripts\inspecionar-demo.php --env=demo` confere o ambiente, caminho esperado, disponibilidade, integridade e apenas contagens de contas ativas por perfil. Não mostra nomes, e-mails, senhas ou chaves. Usa `PRAGMA query_only` e recusa conexão divergente. Precisa de banco já existente e migrado.

A matriz real de permissões está no [README](../README.md). A recepção pode registrar pagamentos, mas não editar evolução nem concluir atendimento. Veterinários podem concluir com evolução, sem visualizar finanças. Alergias e alertas operacionais da ficha do pet são compartilhados.

## Diagnosticar readiness 503

Consulte `http://127.0.0.1:8000/api/health/live` e `/api/health/ready`. Readiness retorna 503 quando falha a consulta de conexão; não significa automaticamente banco corrompido. Confira o comando que iniciou o servidor, `--env=demo`, caminho SQLite, permissão de acesso, `DB_URL`, variáveis externas e cache. O `.env` original pode apontar a outro banco quando o servidor inicia sem `--env=demo`. Não troque configurações por suposição. Readiness 200 comprova conexão, não valida todo o esquema; confira também migrations e testes.

## Testes seguros

Na raiz:

```bat
set "PATH=C:\Program Files\nodejs;%PATH%"
scripts\verificar.bat
```

O script recusa `backend\bootstrap\cache\config.php` ou `.env.testing`, força `APP_ENV=testing`, `DB_CONNECTION=sqlite`, `DB_DATABASE=:memory:`, URL vazia, sessão/cache em array e caminho de cache temporário antes do PHPUnit. Executa testes frontend e `npm.cmd run verify` (testes e build). O banco demo não é usado nos testes. `composer test` limpa cache; prefira o script seguro. A repetição dos testes frontend no script é comportamento atual, sem alteração funcional.

O build é gerado em `frontend/dist`, ignorado pelo Git. Build aprovado não valida hospedagem ou autenticação em produção. Para o aceite dos fluxos completos, execute e registre o [checklist manual em cópia descartável](checklist-manual.md), mesmo quando houver verificações automatizadas isoladas no navegador. Consulte também [backup e restauração](backup.md).
