# Roadmap Tecnico

Este roadmap organiza o PetSystem V3 como um projeto profissional incremental.

## Principio Principal

Cada fase deve entregar uma base funcional e compreensivel antes de avancar para a proxima. A ideia e aprender arquitetura com profundidade, nao apenas acumular funcionalidades.

## Fase 0 - Preparacao do Projeto

### Objetivo

Definir o que sera construido, quais entidades existem, como elas se relacionam e quais decisoes arquiteturais guiam o projeto.

### Entregaveis

- Estrutura base do repositorio
- Documentacao inicial
- Modelagem inicial do banco
- Roadmap do MVP
- Decisao sobre autenticacao

## Fase 1 - Fundacao

### Objetivo

Criar backend e frontend separados, com um fluxo real de autenticacao e o primeiro modulo funcionando de ponta a ponta.

### Entregaveis

- Laravel API em `backend/`
- React SPA em `frontend/`
- Banco MySQL configurado
- Login
- Logout
- Endpoint `GET /api/me`
- Perfis de usuario
- Protecao de rotas
- CRUD de clientes
- Integracao via Axios

## Fase 2 - CRUDs Principais

### Objetivo

Construir os modulos centrais do sistema.

### Entregaveis

- Clientes
- Pets
- Servicos
- Agendamentos
- Validacoes
- Resources
- Form Requests
- Policies quando fizer sentido

## Fase 3 - Consolidacao

### Objetivo

Melhorar robustez, experiencia de uso e qualidade tecnica.

### Entregaveis

- Dashboard
- Tratamento padronizado de erros
- Logs
- Testes automatizados
- Refatoracoes pontuais

## Fase 4 - Producao

### Objetivo

Preparar o projeto para publicacao profissional.

### Entregaveis

- Docker
- Docker Compose
- Deploy
- CI/CD
- Documentacao da API
- README final

## Decisoes Importantes

### Backend e Frontend Separados

O backend sera uma API REST em Laravel. O frontend sera uma SPA em React.

Vantagens:

- Separacao clara de responsabilidades
- Mais proximo de arquiteturas usadas em empresas
- Facilita evolucao futura para mobile ou integracoes externas

Desvantagens:

- Mais configuracao inicial
- Exige lidar com CORS, tokens e variaveis de ambiente separadas
- Deploy mais trabalhoso que uma aplicacao monolitica simples

### Repository Pattern

Nao sera usado automaticamente.

Em Laravel, Eloquent ja funciona como uma camada rica de acesso a dados. Criar repositories para todo model desde o inicio pode gerar abstracao desnecessaria.

Usaremos Repository Pattern apenas se surgir uma necessidade real, como:

- multiplas fontes de dados;
- consultas complexas reutilizadas em varios pontos;
- isolamento claro de uma regra de persistencia;
- troca futura de mecanismo de armazenamento.

### Service Layer

Sera usado quando uma regra de negocio nao pertencer claramente ao Controller nem ao Model.

Exemplos:

- criar agendamento validando disponibilidade;
- cancelar agendamento com regra de horario;
- gerar metricas do dashboard;
- coordenar multiplas operacoes de banco.
