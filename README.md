# PetSystem V3 Sistema Web 

Aplicação Web para apoiar a rotina de uma clínica veterinária, com API Laravel e frontend React. O projeto demonstra autenticação, autorização por perfil, operações de cadastro e integração com MySQL.

## Funcionalidades

- Autenticação de sessão com Laravel Sanctum e bloqueio de usuários inativos.
- Acesso por perfil: administrador, recepção e veterinário; a API valida as operações autorizadas.
- Cadastro e consulta de clientes, pets, serviços e agendamentos.
- Dashboard com contagens de clientes e pets e agendamentos de hoje. A contagem diária usa o horário local da clínica em `America/Sao_Paulo` e considera agendamentos `scheduled` e `confirmed`; cancelamentos não entram. O Dashboard não apresenta faturamento.
- Estados de carregamento, falha, tentativa novamente e ausência de registros nas telas pertinentes.

## Stack

- Backend: PHP 8.2+, Laravel 12, Laravel Sanctum e MySQL.
- Frontend: React 18, React Router, Axios e Vite 6.
- Testes: PHPUnit no backend e `node:test` nos testes unitários do frontend.

## Executar localmente

Consulte [`docs/setup.md`](docs/setup.md) para requisitos, criação do banco local, configuração Sanctum/CORS, instalação, primeiro usuário ativo e execução segura dos testes. O guia separa os comandos que alteram o banco.

## Testes disponíveis da aplicação

O repositório contém testes de API, autenticação, autorização por perfil, permissões do frontend e funções de métricas do Dashboard. Os comandos e o isolamento do banco estão documentados em [`docs/setup.md`](docs/setup.md). Não há aqui uma declaração de que os testes passaram no estado atual do repositório.

## Estado do projeto

As áreas listadas acima estão implementadas no código. O projeto continua em validação e não inclui neste repositório um processo de implantação de produção. Não há sistema de pagamentos ou métrica de receita confirmada.

## Contato profissional

- [LinkedIn — Natan Da Luz](https://www.linkedin.com/in/natandaluz/)
