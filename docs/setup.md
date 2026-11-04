# Configuracao local — PetSystem V3

Este guia prepara a demonstracao local no Windows. O ambiente usa SQLite; o MySQL fica para uma etapa futura. Nao sao necessarios dados antigos, servidor MySQL ou credenciais padrao.

## Requisitos

- Windows e Git.
- PHP 8.2 em `C:\xampp\php\php.exe`.
- Composer disponivel no `PATH` caso `backend\vendor\autoload.php` ainda nao exista.
- `node.exe` e `npm.cmd` no `PATH` caso `frontend\node_modules\.bin\vite.cmd` ainda nao exista.

## Como rodar em 3 passos

1. Na pasta do projeto, de dois cliques em `scripts\iniciar.bat`. Ele pode ser chamado de qualquer diretorio. O script abre janelas separadas para backend e frontend, aguarda a API pronta e abre o navegador.
2. Acesse `http://127.0.0.1:5173`. O frontend usa a API em `http://127.0.0.1:8000/api`.
3. De dois cliques em `scripts\criar-usuario.bat` e informe nome, e-mail, perfil e senha no terminal. A senha fica oculta; o projeto nao fornece contas ou senhas padrao.

O comando cria usuarios apenas quando o ambiente efetivo e `demo` e a conexao SQLite aponta para `backend\database\petsystem_demo.sqlite`. Nao passe a senha como argumento. Os perfis aceitos sao `admin`, `receptionist` e `veterinarian`.

## Banco SQLite da demonstracao

O ambiente selecionado e `backend\.env.demo`, carregado por `php artisan --env=demo`. A demonstracao persiste em `backend\database\petsystem_demo.sqlite`; ambos os arquivos locais sao ignorados pelo Git.

Ao iniciar, `scripts\iniciar.bat` confere o ambiente e o caminho efetivos sem exibir credenciais. Se o arquivo SQLite nao existir, cria um arquivo vazio, aplica as migrations com `--force` somente nesse SQLite novo e roda `DemoDataSeeder`. O seeder usa registros ficticios e operacoes `firstOrCreate`. Se o banco ja existe, o script consulta o status e executa `migrate --force` apenas quando encontra migrations pendentes; nao recria nem apaga o banco.

O script nao inicia nem altera MySQL/MariaDB. A configuracao para MySQL sera feita posteriormente, em uma etapa separada. O banco historico nao e usado pela demonstracao.

## Perfis e privacidade

As permissoes sao conferidas pela API Laravel, alem dos controles visuais do frontend.

- `admin`: operacoes administrativas permitidas pela API, incluindo financeiro e informacoes clinicas.
- `receptionist`: rotina de cadastro, agenda e atendimento conforme as regras do backend; pode consultar o financeiro, mas nao recebe evolucao clinica.
- `veterinarian`: rotina de pacientes e atendimento clinico conforme as regras do backend; nao recebe precos, valores cobrados nem dados financeiros.

Nao ha senha predefinida. Para criar outra conta local, execute `scripts\criar-usuario.bat`; a unicidade do e-mail e validada pelo comando Artisan.

## Verificacao

De dois cliques em `scripts\verificar.bat`. Antes dos testes PHP, o script interrompe se houver `backend\bootstrap\cache\config.php` ou `backend\.env.testing`; define explicitamente `APP_ENV=testing`, `DB_CONNECTION=sqlite` e `DB_DATABASE=:memory:` para que a suite nunca use o SQLite persistente da demonstracao.

O script roda `php artisan test`, `node.exe --test` e `npm.cmd run verify` (testes frontend e build Vite). Ele mostra uma linha por etapa e, em falha, apenas as ultimas linhas do log temporario. O resultado final e `TUDO OK` ou `FALHOU em: ...`.

## Encerrar

Use `scripts\parar.bat`. Ele consulta os listeners nas portas 8000 e 5173 e encerra somente um processo cuja linha de comando identifica esta copia do PetSystem demo. Processos nao identificados sao ignorados.
