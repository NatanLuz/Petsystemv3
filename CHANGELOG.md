# Changelog PETSYSTEM V3

Todas as alterações relevantes neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/), e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

## Adicionado
- Módulos de negócio (a serem implementados incrementalmente nas próximas etapas).

## [0.1.0] - 2026-08-11

### Adicionado
- Estrutura inicial do Monorepo (`backend/`, `frontend/`, `docs/`).
- Fundação técnica do backend Laravel (API REST, Eloquent ORM, suporte PostgreSQL).
- Endpoint de verificação `/api/health`.
- Fundação técnica do frontend React (Vite, JavaScript, JSX, React Router, Axios).
- Cliente Axios centralizado (`src/services/api.js`).
- Componente/página de verificação de status da API no frontend.
- Documentação inicial do projeto (`docs/setup.md`, `CONTRIBUTING.md`, `CHANGELOG.md`).
