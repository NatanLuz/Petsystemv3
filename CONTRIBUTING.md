# Contribuindo com o PetSystem V3

Este projeto deve evoluir modulo por modulo, com organizacao clara entre planejamento, documentacao, backend, API, frontend e testes.

## Padrao de Branches

- `main`: versao estavel do projeto.
- `develop`: integracao das proximas entregas.
- `feature/nome-do-modulo`: novas funcionalidades planejadas.
- `fix/descricao-do-ajuste`: correcoes pontuais.
- `docs/descricao`: documentacao.
- `chore/descricao`: organizacao, configuracao e manutencao sem regra de negocio.

## Convencao de Commits

Use commits curtos, objetivos e no imperativo:

- `feat: adicionar cadastro de clientes`
- `fix: corrigir validacao de telefone`
- `docs: atualizar guia da API`
- `test: cobrir criacao de agendamento`
- `chore: organizar estrutura do repositorio`
- `refactor: simplificar servico de clientes`

## Organizacao Das Pastas

- `backend/`: Laravel, API, models, controllers, requests, policies, migrations, seeders e testes de backend.
- `frontend/`: React, TypeScript, Vite, componentes, paginas, servicos HTTP e estilos.
- `docs/`: planejamento, modelagem, padroes de API, decisoes tecnicas e roadmap.

Arquivos gerados, dependencias, caches, logs, ambientes locais e builds nao devem ser versionados.

## Fluxo De Desenvolvimento

1. Planejamento
2. Documentacao
3. Banco
4. Backend
5. API
6. Frontend
7. Testes
8. Atualizacao da documentacao
9. Commit

## Checklist De Modulo Concluido

- O escopo do modulo esta documentado.
- A modelagem necessaria foi revisada.
- Migrations, models e relacionamentos foram implementados quando aplicavel.
- Requests, policies e resources foram criados quando aplicavel.
- Endpoints da API foram documentados.
- A interface foi integrada sem regra de negocio duplicada.
- Testes relevantes foram adicionados ou atualizados.
- Logs, caches, `.env`, banco local e dependencias nao foram incluidos no Git.
- O README, o roadmap ou a documentacao tecnica foram atualizados quando necessario.
- O commit descreve claramente a entrega.
