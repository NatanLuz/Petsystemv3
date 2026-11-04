# Configuração local — PetSystem V3

Este guia prepara a demonstração local no Windows. Ela usa SQLite; o MySQL será configurado em uma etapa futura. Não são necessários banco histórico nem credenciais padrão.

## Requisitos

- Windows e Git.
- PHP 8.2 em `C:\xampp\php\php.exe`.
- Composer no `PATH` se `backend\vendor\autoload.php` não existir.
- `node.exe` e `npm.cmd` no `PATH` se `frontend\node_modules\.bin\vite.cmd` não existir.

## Como rodar em 3 passos

1. Dê dois cliques em `scripts\iniciar.bat`. Ele pode ser chamado de qualquer diretório, inicia backend e frontend em janelas separadas, aguarda a API ficar pronta e abre o navegador.
2. Acesse `http://127.0.0.1:5173`. O frontend consome a API em `http://127.0.0.1:8000/api`.
3. Dê dois cliques em `scripts\criar-usuario.bat` e informe nome, e-mail, perfil e senha no terminal. A senha fica oculta e não há conta ou senha padrão.

O comando de criação aceita os perfis `admin`, `receptionist` e `veterinarian`, e só opera no ambiente demo com conexão SQLite.

## Banco SQLite da demonstração

O ambiente usa `backend\.env.demo`, carregado com `php artisan --env=demo`, e persiste em `backend\database\petsystem_demo.sqlite`. Esses arquivos são locais e ignorados pelo Git.

Na inicialização, `scripts\iniciar.bat` verifica ambiente e conexão sem mostrar credenciais. Se o arquivo SQLite ainda não existir, cria um arquivo vazio, aplica migrations nesse banco novo e executa `DemoDataSeeder`. Se o banco já existir, verifica o status e executa migrations somente quando houver pendências; não recria nem apaga o banco. O seeder usa dados fictícios.

O script não inicia nem modifica MySQL/MariaDB. A instância MySQL será configurada depois, separadamente. O banco histórico não é usado pela demonstração.

## Perfis e privacidade

As permissões são aplicadas pela API Laravel, além dos controles da interface.

- `admin`: operações administrativas permitidas pela API, incluindo informações financeiras e clínicas.
- `receptionist`: rotina de cadastros, agenda e atendimento conforme as regras do backend; pode consultar dados financeiros, mas não recebe evolução clínica.
- `veterinarian`: rotina de pacientes e atendimento clínico conforme as regras do backend; não recebe preços, valores cobrados nem outros dados financeiros.

Não há senha predefinida. Para criar uma conta local, use `scripts\criar-usuario.bat`; o e-mail precisa ser único.

## Verificação

Dê dois cliques em `scripts\verificar.bat`. Antes dos testes PHP, o script interrompe se detectar `backend\bootstrap\cache\config.php` ou `backend\.env.testing` e define explicitamente o ambiente de testes com SQLite em memória (`DB_DATABASE=:memory:`), separado do SQLite persistente da demonstração.

O script executa `php artisan test`, `node.exe --test` e `npm.cmd run verify` (testes frontend e build Vite). Mostra uma linha por etapa e, em caso de falha, apenas as últimas linhas do log temporário. O resultado final é `TUDO OK` ou `FALHOU em: ...`.

## Encerrar

Use `scripts\parar.bat`. Ele consulta os listeners nas portas 8000 e 5173 e encerra somente um processo cuja linha de comando identifica esta cópia do PetSystem demo. Processos não identificados são ignorados.
