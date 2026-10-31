# PetSystem V3 — backend

API REST desenvolvida em PHP 8.2+ e Laravel 12. O backend usa Laravel Sanctum para autenticação de sessão da SPA, MySQL para persistência e gates aplicados às rotas para autorizar os perfis `admin`, `receptionist` e `veterinarian`. Usuários inativos não podem autenticar nem acessar recursos protegidos.

Os recursos de API incluem clientes, pets, serviços, agendamentos, atendimentos e métricas do Dashboard. As permissões e validações são aplicadas na API. A configuração local do CORS, Sanctum, sessão, MariaDB isolado, primeiro usuário, dados fictícios e testes seguros está no [guia de instalação](../docs/setup.md).

## Scripts Composer importantes

- `composer install` instala as dependências listadas no lockfile; não cria nem migra o banco.
- `composer setup` **não é um atalho seguro para qualquer ambiente**: o script executa `php artisan migrate --force`, instala dependências Node e gera o build. Use-o somente depois de configurar e confirmar explicitamente o banco alvo; para desenvolvimento, siga o guia passo a passo.
- `composer test` executa `php artisan config:clear` antes dos testes. O guia recomenda configurar um ambiente SQLite em memória e chamar `php artisan test` diretamente.

## Testes

Os testes backend estão em `tests/Feature` e `tests/Unit`. Antes de executá-los, siga a seção “Testes sem atingir o MySQL local” do [guia](../docs/setup.md), que configura a conexão SQLite em memória no processo do PowerShell e evita configuração Laravel em cache. Os testes de feature usam `RefreshDatabase` e alteram o banco de teste.
