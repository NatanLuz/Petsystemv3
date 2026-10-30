# Configuração local — PetSystem V3

Este guia configura uma instalação de desenvolvimento no Windows usando PowerShell. Os comandos de migration e criação de usuário escrevem no banco configurado; confirme que ele é um banco local descartável antes de executá-los.

## Requisitos

- Git.
- PHP 8.2 ou superior, com `pdo_mysql` habilitada.
- Composer 2.
- MySQL 8 ou compatível, iniciado localmente; MySQL Workbench é opcional.
- Node.js 18 ou superior e npm.

Confirme as ferramentas em um PowerShell:

```powershell
php -v
composer --version
node --version
npm --version
mysql --version
```

## 1. Baixar o projeto e criar um banco local vazio

Na raiz do clone, prepare um schema exclusivo de desenvolvimento pelo MySQL Workbench ou pela CLI do MySQL. A CLI pedirá a senha do usuário administrativo do MySQL:

```powershell
mysql -h 127.0.0.1 -u root -p
```

No prompt `mysql>`, crie o banco e um usuário local dedicado. Substitua o marcador por uma senha forte e única antes de executar; não reutilize senha de produção:

```sql
CREATE DATABASE petsystem_v3 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Crie também um usuário MySQL local dedicado chamado `petsystem_dev`, restrito ao host `127.0.0.1`, concedendo privilégios somente ao schema `petsystem_v3`. No Workbench, informe uma senha forte e única no campo de senha; não a coloque em comandos salvos, no README, no histórico do Git ou em capturas de tela. Se já existir um schema com esse nome, não o reutilize sem verificar seu conteúdo e fazer backup.

## 2. Configurar e iniciar o backend

Em um PowerShell na raiz do repositório:

```powershell
Set-Location backend
composer install
Copy-Item .env.example .env
```

Edite `backend/.env` localmente. Configure `DB_DATABASE=petsystem_v3`, `DB_USERNAME=petsystem_dev` e a senha que criou. Mantenha `APP_DEBUG=true` somente no ambiente local. Não compartilhe nem versiona esse arquivo.

O template já configura os hosts locais usados pela SPA:

- `SESSION_DRIVER=database`; a tabela `sessions` é criada pela migration inicial de usuários.
- `SANCTUM_STATEFUL_DOMAINS` recebe hosts e portas sem esquema, incluindo `localhost:5173` e `127.0.0.1:5173`.
- `CORS_ALLOWED_ORIGINS` recebe as origens completas, com `http://`, para esses hosts.
- `SESSION_DOMAIN` fica sem domínio explícito no desenvolvimento local.

Se mudar as portas ou hosts, atualize as variáveis correspondentes no `.env` local. Não altere globalmente o timezone Laravel: o Dashboard calcula o dia operacional da clínica em `America/Sao_Paulo`.

Gere uma chave de aplicação para esta instalação local e aplique as migrations **somente depois de confirmar que `.env` aponta para o banco de desenvolvimento vazio criado acima**:

```powershell
php artisan key:generate
php artisan migrate
```

`php artisan migrate` altera o schema e grava o histórico de migrations no banco selecionado. Não use `--force` como opção genérica de desenvolvimento. O `DatabaseSeeder` não cria usuários nem dados de demonstração; `php artisan db:seed` não provisiona um login.

### Criar o primeiro usuário ativo local

O login exige `active=true`. Não há conta padrão nem senha conhecida no repositório. Depois das migrations, abra o Tinker:

```powershell
php artisan tinker
```

No prompt do Tinker, execute o trecho abaixo. Ele cria um administrador local com senha aleatória de 32 caracteres e a mostra uma única vez no terminal. Guarde-a em um gerenciador de senhas. Use um e-mail ainda não cadastrado; não execute novamente para uma conta já existente.

```php
$name = readline('Nome: ');
$email = readline('E-mail: ');
$password = Illuminate\Support\Str::password(32);
$user = App\Models\User::create([
    'name' => $name,
    'email' => $email,
    'password' => $password,
]);
$user->forceFill([
    'role' => App\Models\User::ROLE_ADMIN,
    'active' => true,
])->save();
echo "E-mail: {$email}\nSenha local gerada: {$password}\n";
```

O model não permite atribuir `role` e `active` por mass assignment; o trecho os define explicitamente com `forceFill` apenas para essa conta local. O model armazena a senha usando seu cast `hashed`. Esse procedimento é para desenvolvimento local. Não use uma credencial local em produção; o provisionamento de administradores de produção depende do processo operacional do ambiente e não é automatizado pelo projeto.

`UserFactory` é uma fixture de testes: por padrão ela cria usuários inativos e não é usada pelo seeder para contas operacionais. Não use factories para provisionar usuários da aplicação.

Inicie o backend em um terminal dedicado:

```powershell
php artisan serve --host=127.0.0.1 --port=8000
```

A API fica em `http://127.0.0.1:8000/api`. Os endpoints de verificação são `/api/health/live` e `/api/health/ready`.

## 3. Instalar e iniciar o frontend

Abra outro PowerShell na raiz do clone:

```powershell
Set-Location frontend
npm ci
Copy-Item .env.example .env
```

O valor de `VITE_API_URL` deve apontar para `http://127.0.0.1:8000/api`. Inicie o Vite:

```powershell
npm run dev
```

Abra a URL informada pelo Vite, normalmente `http://localhost:5173`. A autenticação SPA usa cookie de sessão, fluxo CSRF e requisições com credenciais; os hosts locais do template precisam corresponder ao endereço aberto no navegador.

## 4. Testes sem atingir o MySQL local

Os testes backend usam `RefreshDatabase`. O `phpunit.xml` declara SQLite em memória, mas variáveis herdadas do processo podem prevalecer. Execute os testes em um PowerShell dedicado, a partir de `backend`, definindo explicitamente a conexão. O caminho de configuração Laravel abaixo é único e inexistente para não usar um eventual cache local:

```powershell
$env:APP_ENV = 'testing'
$env:APP_CONFIG_CACHE = Join-Path $env:TEMP ("petsystem-test-config-" + [guid]::NewGuid().ToString('N') + '.php')
$env:DB_CONNECTION = 'sqlite'
$env:DB_DATABASE = ':memory:'
$env:DB_URL = ''
$env:SESSION_DRIVER = 'array'
php artisan test
```

Esse comando roda migrations apenas no SQLite em memória do processo de teste; não usa o MySQL de desenvolvimento. Não use esse bloco se tiver substituído as variáveis ou se o projeto estiver apontando para outra configuração. Não use `composer test` para esse procedimento: o script também executa `config:clear` e não declara o isolamento no comando.

Os testes de frontend usam o runner nativo `node:test` e não acessam banco de dados. Para executar todos os arquivos `*.test.js` descobertos pelo Node, abra outro PowerShell na pasta `frontend` e rode:

```powershell
node --test
```

Para executar testes individuais:

```powershell
node --test src/features/auth/permissions.test.js
node --test src/pages/dashboardMetrics.test.js
node --test src/features/appointments/appointmentDateTime.test.js
```

Os arquivos de teste também cobrem busca de clientes, pets, serviços e agendamentos. O build de produção grava arquivos em `frontend/dist` e é independente da suíte de testes.

## 5. Perfis e permissões

As permissões da API são aplicadas no backend a cada operação. A interface pode ocultar ações que o perfil não pode executar, mas essa apresentação visual não substitui a autorização do backend.

| Perfil | Clientes | Pets | Serviços | Agendamentos |
|---|---|---|---|---|
| `admin` | Ver, criar, editar e excluir | Ver, criar, editar e excluir | Ver, criar, editar e excluir | Ver, criar, editar e excluir |
| `receptionist` | Ver, criar, editar e excluir | Ver, criar, editar e excluir | Ver | Ver, criar e editar |
| `veterinarian` | Ver, criar e editar | Ver, criar e editar | Ver | Ver, criar e editar |

Excluir serviços e ativar ou desativar serviços são operações exclusivas de `admin`. `receptionist` pode excluir clientes e pets conforme a permissão, mas o backend pode impedir a exclusão quando houver registros relacionados, por integridade referencial.
