# PetSystem V3

Sistema de gestao para pet shops e clinicas veterinarias, desenvolvido como projeto de portfolio profissional.

O objetivo do PetSystem V3 nao e apenas reproduzir a versao anterior em uma stack nova. Este projeto sera construido modulo por modulo para praticar arquitetura moderna, API REST, Laravel, React, TypeScript, modelagem de banco, boas praticas e evolucao gradual ate producao.

## Stack Planejada

### Backend

- Laravel 12
- PHP 8.3+ como alvo do projeto
- API REST
- Eloquent ORM
- Form Requests
- Policies
- API Resources
- Service Layer quando fizer sentido

### Frontend

- React
- TypeScript
- Vite
- React Router
- Axios

### Banco de Dados

- MySQL

## Estrutura

```text
pet-system-v3/
|-- backend/
|-- frontend/
|-- docs/
|-- .editorconfig
|-- .gitignore
|-- CHANGELOG.md
|-- CONTRIBUTING.md
|-- LICENSE
`-- README.md
```

## Organizacao Inicial

- `backend/`: aplicacao Laravel, API REST, regras de backend, banco, testes PHP e configuracoes do Laravel.
- `frontend/`: aplicacao React com TypeScript e Vite.
- `docs/`: documentacao tecnica, modelagem, guias de API e roadmap.

## Roadmap

### Fase 0 - Preparacao

- Definir escopo do MVP
- Definir entidades principais
- Definir relacionamentos
- Definir regras de negocio iniciais
- Definir estrategia de autenticacao
- Definir estrutura backend/frontend

### Fase 1 - Fundacao

- Criar projeto Laravel em `backend/`
- Criar projeto React em `frontend/`
- Configurar MySQL
- Implementar autenticacao
- Criar os CRUDs principais
- Integrar React com a API

### Fase 2 - Consolidacao

- Dashboard
- Validacoes mais completas
- Tratamento padronizado de erros
- Testes automatizados
- Logs

### Fase 3 - Producao

- Docker
- Docker Compose
- Deploy
- Documentacao da API
- README profissional final
- Publicacao do projeto

## Modulos do MVP

1. Autenticacao
2. Usuarios
3. Clientes
4. Pets
5. Servicos
6. Agendamentos
7. Dashboard simples

## Status Atual

Modulo 1 - Autenticacao implementado como fundacao da API, com login, logout, `GET /api/me`, perfis de usuario e protecao de rotas via Sanctum.

Os proximos modulos devem ser construidos sobre essa base, mantendo o fluxo de documentacao, modelagem, implementacao e testes.

Observacao de ambiente local: no inicio do projeto, o PHP encontrado foi `8.2.12`, Composer esta instalado, mas Node.js/npm nao foram encontrados no PATH. Antes de criar o frontend React, sera necessario instalar ou configurar Node.js.
