# PetSystem V3

**Status:** Em desenvolvimento

O PetSystem V3 está passando por uma reconstrução completa, com uma nova arquitetura moderna que separa backend, frontend e banco de dados. O projeto está sendo desenvolvido de forma incremental, e este README será atualizado conforme novas funcionalidades forem implementadas.

## Descrição

O PetSystem V3 será um sistema de gerenciamento para PetShops e/ou clínicas veterinárias, desenvolvido com uma arquitetura separada entre backend e frontend.

O objetivo é permitir o gerenciamento de informações como clientes, pets, serviços e agendamentos, além de autenticação e controle de acesso.

Este projeto também é utilizado como projeto de estudo e portfólio, com o propósito de demonstrar conhecimentos em desenvolvimento backend, APIs REST, frontend React, banco de dados relacional, autenticação, arquitetura de software, Git e boas práticas de desenvolvimento.

## Stack

### Backend

| Tecnologia | Finalidade |
|---|---|
| PHP | Linguagem principal do backend |
| Laravel | Framework backend |
| API REST | Comunicação entre frontend e backend |
| Eloquent ORM | Mapeamento objeto-relacional |
| Laravel Sanctum | Autenticação da API |

### Frontend

| Tecnologia | Finalidade |
|---|---|
| React | Biblioteca para construção da interface |
| JavaScript | Linguagem principal do frontend |
| Vite | Build tool e ambiente de desenvolvimento |
| React Router | Roteamento entre páginas |
| Axios | Consumo da API REST |

### Banco de dados

| Tecnologia | Finalidade |
|---|---|
| PostgreSQL | Banco de dados relacional |

> O frontend é desenvolvido exclusivamente com JavaScript e JSX.

## Arquitetura

```
PetSystem V3
│
├── backend/
│   └── Laravel + PHP
│       ├── API REST
│       ├── Eloquent ORM
│       └── Laravel Sanctum
│
├── frontend/
│   └── React + JavaScript
│       ├── Vite
│       ├── React Router
│       └── Axios
│
├── docs/
│   └── documentação
│
└── PostgreSQL
```

**Responsabilidade de cada camada:**

- **Backend (Laravel/PHP):** responsável por expor a API REST, aplicar as regras de negócio, gerenciar autenticação e realizar a comunicação com o banco de dados através do Eloquent ORM.
- **Frontend (React):** responsável pela interface do usuário, consumindo os dados fornecidos pela API através de requisições HTTP feitas com Axios.
- **Banco de dados (PostgreSQL):** responsável pelo armazenamento persistente das informações do sistema.
- **docs/:** reúne a documentação técnica do projeto.

## Comunicação entre as camadas

O fluxo principal de comunicação do sistema segue o seguinte caminho:

```
React
  ↓
Axios
  ↓
Laravel REST API
  ↓
Eloquent ORM
  ↓
PostgreSQL
```

O frontend React consome os endpoints disponibilizados pela API Laravel através de requisições HTTP feitas com Axios. O Laravel processa essas requisições, aplica as regras de negócio e utiliza o Eloquent ORM para interagir com o banco de dados PostgreSQL.

## Funcionalidades

### Em desenvolvimento

- Estrutura inicial do projeto
- Backend Laravel
- Frontend React
- Configuração da API
- Configuração do PostgreSQL

### Planejado

- Autenticação de usuários
- Login e logout
- Controle de acesso
- Dashboard
- Gerenciamento de clientes
- Gerenciamento de pets
- Gerenciamento de serviços
- Gerenciamento de agendamentos
- Relacionamentos entre clientes e pets
- Integração completa entre frontend e backend
- Validações
- Tratamento de erros
- Testes automatizados

> As funcionalidades listadas em "Planejado" ainda não foram implementadas.

## Estrutura do projeto

```
pet-system-v3/
├── backend/
├── frontend/
├── docs/
├── README.md
├── CONTRIBUTING.md
├── CHANGELOG.md
└── .gitignore
```

- **backend/:** código-fonte da API desenvolvida em Laravel.
- **frontend/:** código-fonte da aplicação React.
- **docs/:** documentação técnica do projeto.
- **README.md:** apresentação geral do projeto.
- **CONTRIBUTING.md:** diretrizes de contribuição.
- **CHANGELOG.md:** histórico de alterações do projeto.
- **.gitignore:** arquivos e pastas ignorados pelo Git.

## Objetivos técnicos

O PetSystem V3 busca aplicar, ao longo do seu desenvolvimento:

- Arquitetura organizada
- API REST
- Separação de responsabilidades
- Padrão MVC no backend Laravel
- Uso do Eloquent ORM
- Autenticação e autorização
- Validação de dados
- Boas práticas de segurança
- Componentização no React
- Organização modular do frontend
- Banco de dados relacional
- Versionamento com Git e GitHub
- Testes automatizados
- Documentação técnica

## Roadmap

- [ ] Definição da arquitetura
- [ ] Configuração do Laravel
- [ ] Configuração do PostgreSQL
- [ ] Estrutura inicial da API
- [ ] Autenticação com Sanctum
- [ ] Módulo de usuários
- [ ] Módulo de clientes
- [ ] Módulo de pets
- [ ] Módulo de serviços
- [ ] Módulo de agendamentos
- [ ] Estrutura inicial do React
- [ ] Rotas do frontend
- [ ] Integração React + Laravel
- [ ] Dashboard
- [ ] Testes
- [ ] Revisão de segurança
- [ ] Documentação final
- [ ] Deploy

## Instalação

> Os comandos específicos de instalação e execução serão atualizados conforme a estrutura definitiva do projeto for implementada.

### Backend

Será necessário ter instalado:

- PHP
- Composer
- PostgreSQL

### Frontend

Será necessário ter instalado:

- Node.js
- npm

## Desenvolvimento

O projeto será desenvolvido de maneira incremental, seguindo as seguintes etapas:

1. Arquitetura
2. Banco de dados
3. Backend/API
4. Autenticação
5. Frontend
6. Integração
7. Testes
8. Segurança
9. Documentação
10. Deploy

## Versionamento (Git)

O projeto utiliza Git e GitHub para controle de versão, seguindo o padrão de commits semânticos, por exemplo:

- `feat:` — nova funcionalidade
- `fix:` — correção de bug
- `refactor:` — refatoração de código
- `docs:` — alterações na documentação
- `test:` — adição ou ajuste de testes
- `chore:` — tarefas de manutenção geral

## Autor

**Natan Da Luz**

Linkedin: https://www.linkedin.com/in/natandaluz/

Email: Natandaluz01@gmail.com
