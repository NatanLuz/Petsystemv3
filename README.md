## PetSystem V3 | Sistema Web

Aplicação web para apoiar a rotina de uma clínica veterinária, com API Laravel e frontend React. O projeto demonstra autenticação, autorização por perfil, cadastros, agenda, atendimentos e integração entre frontend e backend.

## Funcionalidades

- Autenticação de sessão com Laravel Sanctum e bloqueio de usuários inativos.
- Acesso por perfil: administrador, recepção e veterinário; as permissões também são aplicadas pela API.
- Cadastro e consulta de clientes, pets, serviços, agendamentos e atendimentos, com histórico de clientes e pets.
- Identificador público de seis dígitos para pets.
- Busca com debounce e paginação local nas listagens principais, validação de formulários pela API e estados de carregamento, erro e lista vazia.
- Agendamentos com verificação de conflito, transições de status, cancelamento e reagendamento.
- Atendimentos vinculados a agendamentos ou avulsos.
- Dashboard com contagens, próximos atendimentos do dia e faturamento de atendimentos concluídos no mês local. A data operacional usa `America/Sao_Paulo`.
- Privacidade por perfil aplicada no backend: veterinários não recebem valores financeiros; recepcionistas não recebem evolução clínica.

## Stack

- Backend: PHP , Laravel 12+ e Laravel.
- Frontend: React e Vite.
- Demonstração local: SQLite. A configuração MySQL é uma etapa futura.
- Testes: PHPUnit no backend e `node:test` no frontend.

## Como Executar Localmente

1. Dê dois cliques em `scripts\iniciar.bat`. O script prepara o ambiente demo e abre backend e frontend em janelas separadas.
2. Acesse `http://127.0.0.1:5173` no navegador.
3. Crie uma conta local com `scripts\criar-usuario.bat`; a senha é solicitada de forma interativa e não há senha padrão no repositório.

A demonstração usa `backend\.env.demo` e `backend\database\petsystem_demo.sqlite`. Os perfis são `admin`, `receptionist` e `veterinarian`. O Veterinário não recebe valores financeiros e a Recepção não recebe evolução clínica. Para parar os servidores do projeto, use `scripts\parar.bat`.

## Testes e Verificação

Dê dois cliques em `scripts\verificar.bat` para executar PHPUnit em SQLite em memória, os testes `node:test` e o build de produção do Vite. O script apresenta `TUDO OK` ou identifica a etapa que falhou.

## Contato Profissional

- [LinkedIn — Natan Da Luz](https://www.linkedin.com/in/natandaluz/)
