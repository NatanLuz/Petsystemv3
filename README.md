# PetSystem V3

Aplicação web para apoiar a rotina de uma clínica veterinária, com API Laravel e frontend React. O projeto demonstra autenticação, autorização por perfil, operações de cadastro e integração com MariaDB.

## Funcionalidades

- Autenticação de sessão com Laravel Sanctum e bloqueio de usuários inativos.
- Acesso por perfil: administrador, recepção e veterinário; a API valida as operações autorizadas.
- Cadastro e consulta de clientes, pets, serviços, agendamentos e atendimentos.
- Busca com debounce e paginação local nas listagens principais, validação de API nos formulários e confirmação para ações de remoção ou cancelamento.
- Fichas de clientes e pets com histórico, serviços desativáveis quando possuem histórico e agendamentos com verificação de conflito e transições de status.
- Dashboard com próximos atendimentos do dia e faturamento de atendimentos concluídos no mês local. A data operacional usa `America/Sao_Paulo`; a API limita a informação financeira aos perfis autorizados.
- Estados de carregamento, falha, tentativa novamente e ausência de registros nas telas pertinentes.

## Stack

- Backend: PHP 8.2+, Laravel 12, Laravel Sanctum e MariaDB.
- Frontend: React 18, React Router, Axios e Vite 6.
- Testes: PHPUnit no backend e `node:test` nos testes unitários do frontend.

## Executar localmente

Consulte [`docs/setup.md`](docs/setup.md) para requisitos, banco local, configuração Sanctum/CORS, instalação, provisionamento do primeiro usuário, dados fictícios opcionais e testes. Na demonstração Windows, use somente a instância MariaDB isolada na porta `3307` e o schema `petsystem_v3`; nunca use `C:\xampp\mysql\data`.

## Testes disponíveis

O repositório contém testes de API, autenticação, autorização por perfil, atendimentos, métricas do Dashboard e funções do frontend. Os comandos e o isolamento do banco estão documentados em [`docs/setup.md`](docs/setup.md).

## Estado do projeto

O conflito de horario e verificado novamente dentro da transacao de gravacao. A aplicacao bloqueia a linha do pet com lock pessimista nos bancos que suportam esse recurso; essa garantia e de nivel de aplicacao e nao uma constraint de exclusao no banco.

O projeto continua em validação e não inclui neste repositório um processo de implantação de produção. Não há credencial de demonstração padrão: crie o primeiro administrador local seguindo o guia. O Dashboard soma valores registrados em atendimentos concluídos; pagamentos externos não são processados pela aplicação.

## Contato profissional

- [LinkedIn — Natan Da Luz](https://www.linkedin.com/in/natandaluz/)
