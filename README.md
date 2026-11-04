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

## Executar localmente no Windows

A demonstracao local usa SQLite em `backend/database/petsystem_demo.sqlite`, com ambiente `demo`. O MySQL sera configurado em uma etapa posterior; nao e necessario instalar nem iniciar banco MySQL para esta demonstracao.

1. Dê dois cliques em `scripts\iniciar.bat`. O script verifica as ferramentas, instala dependencias ausentes, prepara somente o SQLite demo novo e inicia backend/frontend em janelas separadas.
2. Acesse `http://127.0.0.1:5173` no navegador; o script tambem tenta abrir essa pagina automaticamente.
3. Crie o usuario local escolhido com `scripts\criar-usuario.bat`. A senha e solicitada de forma interativa, fica oculta e nao existe senha padrao no repositorio.

O sistema possui perfis `admin`, `receptionist` e `veterinarian`. A API aplica as permissoes no backend. O Veterinario nao recebe valores financeiros; a Recepcao nao recebe evolucao clinica.

Para encerrar somente os servidores deste projeto, use `scripts\parar.bat`. O script de verificacao e `scripts\verificar.bat`.
## Testes disponíveis

O repositório contém testes de API, autenticação, autorização por perfil, atendimentos, métricas do Dashboard e funções do frontend. Os comandos e o isolamento do banco estão documentados em [`docs/setup.md`](docs/setup.md).

## Estado do projeto

O conflito de horario e verificado novamente dentro da transacao de gravacao. A aplicacao bloqueia a linha do pet com lock pessimista nos bancos que suportam esse recurso; essa garantia e de nivel de aplicacao e nao uma constraint de exclusao no banco.

O projeto continua em validação e não inclui neste repositório um processo de implantação de produção. Não há credencial de demonstração padrão: crie o primeiro administrador local seguindo o guia. O Dashboard soma valores registrados em atendimentos concluídos; pagamentos externos não são processados pela aplicação.

## Contato profissional

- [LinkedIn — Natan Da Luz](https://www.linkedin.com/in/natandaluz/)
