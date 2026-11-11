# Backup e restauração — SQLite demo

Nos exemplos, substitua C:\caminho\Petsystemv3 pelo caminho da sua cópia do projeto.

Este procedimento vale para a demonstração local em Windows, com SQLite e sessões em arquivo. Não se aplica ao banco histórico MariaDB. Backups contêm dados sensíveis: guarde fora do repositório, com acesso restrito, proteção adequada e uma cópia separada do computador. Defina frequência e retenção com o proprietário antes de uso real.

## Backup consistente com aplicação parada

1. Identifique os terminais da cópia correta e interrompa o Laravel com Ctrl+C; suspenda acessos e outras tarefas que escrevam nesse SQLite. Não encerre processos desconhecidos. O frontend também pode ser parado no seu terminal. Confirme que ninguém usa o banco.
2. Confira `.env.demo`, ambiente `demo` e o caminho `backend/database/petsystem_demo.sqlite`. Crie uma pasta de backup nova, datada, fora do Git. Copie o SQLite com todas as conexões fechadas. Se existirem arquivos `-wal`/`-shm`/`-journal` ainda ativos, não faça cópia isolada do arquivo principal: resolva o fechamento/checkpoint com o responsável ou use uma ferramenta de backup SQLite consistente.
3. Preserve separadamente `.env.demo` com sua `APP_KEY` e, se houver arquivos do usuário, `backend/storage/app`. Não publique esses arquivos. Sessões temporárias não precisam ser restauradas; o usuário fará login novamente.
4. Registre data, commit (`git rev-parse HEAD`), tamanho e SHA-256 do SQLite copiado. Confirme que a cópia abre, retorna `PRAGMA quick_check = ok` e não tem violações em `PRAGMA foreign_key_check`, **usando conexão somente leitura e sem migrations**.

Exemplo PowerShell para a cópia offline, somente após os passos 1 e 2; adapte a unidade ao destino real e restrito:

```powershell
$projectPath = 'C:\caminho\Petsystemv3'
$backupPath = Join-Path 'D:\Backups\PetSystem' (Get-Date -Format 'yyyyMMdd-HHmmss')
New-Item -ItemType Directory -Path $backupPath -ErrorAction Stop
Copy-Item -LiteralPath (Join-Path $projectPath 'backend\database\petsystem_demo.sqlite') -Destination $backupPath -ErrorAction Stop
Copy-Item -LiteralPath (Join-Path $projectPath 'backend\.env.demo') -Destination $backupPath -ErrorAction Stop
Get-FileHash -LiteralPath (Join-Path $backupPath 'petsystem_demo.sqlite') -Algorithm SHA256
```

O destino é um exemplo; confirme sua existência e proteção. Não execute durante testes ou enquanto o proprietário cria contas. O arquivo de ambiente preserva a chave e os dados de configuração; nunca o envie em PR, chat ou portfólio.

## Ensaio de restauração sem sobrescrever a demonstração

1. Prepare outra cópia do código no commit anotado, em pasta separada, sem servidores ativos e com dependências instaladas.
2. Copie o backup para `backend/database/petsystem_demo.sqlite` dessa cópia, verificando antes que o destino não existe. Preserve a cópia original do backup.
3. Restaure a configuração de forma privada nessa instalação e ajuste **somente o caminho do banco da cópia**; mantenha a chave correta. Confirme que o destino é a cópia e `DB_URL` está vazio. Não aponte para o banco original.
4. Na raiz da cópia, execute `php scripts/inspecionar-demo.php --env=demo` para conferir readiness, integridade, vínculos e perfis. Consulte `migrate:status` sem aplicar mudanças; divergência de esquema exige investigar código/backup, não reconstruir o banco.
5. Inicie os servidores locais da cópia, faça login e confira registros e totais conhecidos, evolução e pagamento com os perfis autorizados. Registre o resultado e o tempo gasto. Faça logout e pare somente os processos dessa cópia.

A substituição de um banco usado pelo cliente é uma ação destrutiva: exige confirmação específica, janela de manutenção e backup adicional do estado atual. Não é executada por este guia automaticamente. Nunca use `migrate:fresh`, reset ou seeder para restaurar dados existentes.

## Evidência desta finalização

Foi executado um ensaio de cópia offline e abertura da restauração usando SQLite **sintético descartável**, com um registro fictício e `quick_check` aprovado. Isso valida a mecânica básica de cópia; não comprova recuperação do ambiente real, das contas ou de todos os dados. Backup e restauração reais com aceite do proprietário continuam pendentes para qualquer declaração de prontidão de produção.
