# Pull request — PetSystem V3

## Resumo

Este pull request reúne a aplicação de gestão veterinária PetSystem V3, com backend Laravel, frontend React e controle de acesso por perfil. A demonstração local utiliza SQLite; a configuração e validação do MySQL permanecem como trabalho futuro.

## Funcionalidades incluídas

- Autenticação de sessão com Laravel Sanctum e bloqueio de usuários inativos.
- Cadastros de clientes, pets e serviços, além de agendamentos e atendimentos.
- Identificador público de seis dígitos para pets e histórico de clientes e pacientes.
- Agendamentos com detecção de conflito, status, cancelamento e reagendamento.
- Atendimentos vinculados a agendamentos ou registrados como avulsos.
- Dashboard com indicadores, próximos atendimentos do dia e faturamento baseado em atendimentos concluídos.
- Pesquisa com debounce, paginação local e estados de carregamento, erro e lista vazia nas telas pertinentes.
- Scripts locais para iniciar e encerrar os servidores, criar contas de demonstração e verificar o projeto.

## Correções e segurança

- A API aplica as permissões por perfil. O Veterinário não recebe campos de valores financeiros e a Recepção não recebe evolução clínica.
- O tratamento de sessão expirada inclui as chamadas de atendimentos e dashboard, redirecionando o usuário para autenticação quando a sessão deixa de ser válida.
- A verificação de conflito do agendamento é refeita durante a transação de gravação, com bloqueio pessimista nos drivers que oferecem suporte.
- Os scripts de verificação protegem o SQLite persistente da demonstração ao executar PHPUnit em SQLite `:memory:`.

## Testes e verificação

O projeto inclui PHPUnit no backend e `node:test` no frontend. `npm.cmd run verify` executa os testes frontend e o build Vite. Antes desta integração, o usuário confirmou que `scripts\verificar.bat` terminou com `TUDO OK`; a verificação deve ser repetida após o merge.

## Como executar

1. Dê dois cliques em `scripts\iniciar.bat`.
2. Abra `http://127.0.0.1:5173`.
3. Use `scripts\criar-usuario.bat` para criar uma conta local com senha digitada interativamente.

O ambiente de demonstração usa `backend\.env.demo` e `backend\database\petsystem_demo.sqlite`. Consulte [`setup.md`](setup.md) para requisitos, perfis, scripts de execução e verificação. `scripts\parar.bat` encerra os servidores identificados como pertencentes a esta demonstração.

## Limitações conhecidas e próximos passos

- Configurar e validar o ambiente MySQL separado da demonstração SQLite.
- Avaliar gestão de usuários pela interface administrativa.
- Avaliar carteira de vacinação e vermífugos.
- Avaliar uma agenda visual semanal.
- Avaliar auditoria de ações.
- Validar os fluxos funcionais no navegador por perfil e preparar capturas com dados fictícios.

Não há implantação de produção incluída neste pull request. A aplicação não processa pagamentos externos.
