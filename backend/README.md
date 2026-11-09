# PetSystem V3 — backend

API em PHP 8.2+, Laravel 12 e Sanctum 4. A demonstração local usa SQLite persistente; MySQL/MariaDB não foram homologados nesta finalização. O banco histórico não é necessário nem deve ser modificado.

Recursos: autenticação por sessão e CSRF, clientes, pets, serviços, agenda, atendimentos e métricas. Gates e validações limitam operações por perfil; middleware remove evolução clínica para recepção e campos financeiros para veterinários, inclusive nos históricos. Atendimentos não podem ser excluídos.

Siga o [guia de instalação](../docs/setup.md) para configurar `.env.demo`, confirmar a conexão e iniciar com `php artisan --env=demo serve --host=127.0.0.1 --port=8000`. O [README principal](../README.md) contém a matriz de permissões.

- `composer install`: instala dependências do lockfile. Não use `composer update` na entrega sem necessidade comprovada.
- `composer setup`: executa migrations e comandos de frontend; não use como preparação automática desta demonstração.
- `composer test`: limpa cache antes dos testes; prefira `scripts\verificar.bat` na raiz, que verifica isolamento e usa SQLite em memória.
- `php artisan --env=demo petsystem:create-user`: cria conta interativamente no SQLite demo; senha digitada pelo proprietário.

Os testes de feature usam `RefreshDatabase` e modificam somente o banco de testes quando executados conforme o guia. Nunca aponte testes ao SQLite persistente. Consulte [o relatório de homologação](../docs/homologacao.md) e [o procedimento de backup](../docs/backup.md).
