# Guia de Configuração de Ambiente — PETSYSTEM V3

Este documento instrui a preparação do ambiente de desenvolvimento local para o backend Laravel e frontend React.

## 🛠️ Requisitos de Software

- **PHP**: 8.2 ou superior (com extensão `pdo_pgsql` habilitada no `php.ini`)
- **Composer**: 2.x
- **Node.js**: 18+ (recomendado 20+)
- **PostgreSQL**: 14+ rodando na porta 5432
- **Git**

---

## 🐘 ETAPA 1: Configuração do Backend (Laravel)

1. Entre no diretório do backend:
   ```bash
   cd backend
   ```
2. Instale as dependências do Composer:
   ```bash
   composer install
   ```
3. Configure o arquivo `.env`:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```
4. Ajuste as credenciais do PostgreSQL no `.env`:
   ```env
   DB_CONNECTION=pgsql
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_DATABASE=petsystem_v3
   DB_USERNAME=postgres
   DB_PASSWORD=sua_senha
   ```
5. Execute as migrations para criar as tabelas no PostgreSQL:
   ```bash
   php artisan migrate
   ```
6. Inicie o servidor do backend:
   ```bash
   php artisan serve --port=8000
   ```
   A API ficará acessível em `http://127.0.0.1:8000/api`.

---

## ⚛️ ETAPA 2: Configuração do Frontend (React + Vite)

1. Entre no diretório do frontend:
   ```bash
   cd frontend
   ```
2. Instale as dependências do Node:
   ```bash
   npm install
   ```
3. Configure a URL da API:
   ```bash
   cp .env.example .env
   ```
   O valor local padrão é:
   ```env
   VITE_API_URL=http://127.0.0.1:8000/api
   ```
4. Inicie o servidor de desenvolvimento Vite:
   ```bash
   npm run dev
   ```
   A aplicação React estará acessível em `http://localhost:5173`.

---

## 🔍 Teste de Integração Health Check

Para confirmar que a comunicação entre React e Laravel está funcionando:
1. Com o backend rodando na porta 8000, verifique se a aplicação está viva:
   `GET http://127.0.0.1:8000/api/health/live`
2. Verifique se a aplicação está pronta e conectada ao PostgreSQL:
   `GET http://127.0.0.1:8000/api/health/ready`
3. No frontend, navegue até a tela de verificação de status para observar o consumo da API via Axios em tempo real.
