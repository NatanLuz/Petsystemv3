# PetSystem V3 | Sistema Web para Pet Shop e Clínica Veterinária

Sistema freelancer para apoiar cadastros, agenda e atendimentos de um pet shop e clínica veterinária. A versão de demonstração local usa SQLite persistente. A entrega está em homologação; o resultado e as pendências estão em [docs/homologacao.md](docs/homologacao.md).

## Tecnologias

- PHP 8.2+, Laravel 12 e Laravel Sanctum 4 (autenticação por sessão e CSRF).
- React 18, React Router 6, Axios e Vite 6.
- SQLite na demonstração; PHPUnit 11 e `node:test` nos testes.
- Data operacional da clínica: `America/Sao_Paulo`.

## Funcionalidades disponíveis

- Login, logout, sessão, bloqueio de contas inativas e autorização por perfil na API.
- Clientes, pets com código público de seis dígitos, ficha e histórico.
- Serviços com preço, duração e ativação/desativação pelo administrador.
- Agendamentos, confirmação, cancelamento e reagendamento com motivo; detecção de sobreposição para o mesmo pet.
- Atendimentos avulsos ou iniciados por agendamento confirmado, evolução clínica, conclusão e registro de valor e forma de pagamento.
- Dashboard com contagens, próximos agendamentos de hoje e faturamento de atendimentos concluídos no mês; gráfico dos últimos sete dias.
- Busca, filtros e paginação local nas telas pertinentes, validações e estados de carregamento, erro e lista vazia.

O registro de pagamento é interno: não há integração com banco, adquirente ou emissão fiscal. Faturamento soma valores de atendimentos concluídos, sem conciliação de recebimentos.

## Perfis reais

| Operação | admin | receptionist | veterinarian |
| --- | --- | --- | --- |
| Consultar, criar e editar clientes e pets | Sim | Sim | Sim |
| Excluir clientes/pets sem vínculos impeditivos | Sim | Sim | Não |
| Consultar serviços | Sim | Sim | Sim, sem preço |
| Criar, editar e excluir/desativar serviços | Sim | Não | Não |
| Consultar, criar e editar agendamentos | Sim | Sim | Sim |
| Excluir agendamentos | Sim | Não | Não |
| Consultar e iniciar atendimentos | Sim | Sim | Sim |
| Editar evolução clínica e concluir atendimento | Sim | Não | Sim |
| Registrar valores e pagamento; consultar faturamento | Sim | Sim | Não |
| Excluir atendimentos | Não | Não | Não |

A conclusão pelo veterinário exige evolução clínica. O administrador pode concluir sem essa exigência na regra atual. Atendimentos são permanentes; a API também recusa sua exclusão pelo administrador. A API remove valores financeiros das respostas do veterinário e a evolução clínica das respostas da recepção, inclusive nos históricos aninhados. A ficha básica do pet, alergias e alertas operacionais são compartilhados entre os três perfis. Os controles visuais acompanham as permissões da API.

## Instalação e execução

Requisitos: Windows, Git, PHP 8.2+ com extensões exigidas pelo Composer e `pdo_sqlite`, Composer 2, Node.js compatível com Vite 6 (validado com Node 24) e npm. Os scripts `.bat` esperam PHP em `C:\xampp\php\php.exe` e Node/npm no PATH.

Siga [docs/setup.md](docs/setup.md) para instalar dependências, preparar `.env.demo` com chave própria e iniciar Laravel e React em **dois terminais CMD**. O script `scripts\iniciar.bat` é um atalho após essa configuração. Ele preserva bancos existentes, mas pode aplicar migrations pendentes: faça backup antes de atualizar uma demonstração com dados importantes.

Acesse `http://127.0.0.1:5173`. Crie contas com `scripts\criar-usuario.bat`: nome, e-mail, perfil e senha são informados no terminal. Não há senha padrão. Nunca envie senhas pelo chat nem pela linha de comando.

## Validação e entrega

Execute `scripts\verificar.bat`: PHPUnit usa SQLite em memória, seguido dos testes frontend e build Vite. Não use o SQLite persistente em testes destrutivos. Veja [o checklist manual](docs/checklist-manual.md), [backup e restauração](docs/backup.md) e [as cinco capturas necessárias](docs/img/README.md).

Não versionar `.env`, bancos SQLite, backups, senhas ou dados reais. O `.env.demo` é local e não acompanha o repositório; [o modelo sem segredos](backend/.env.demo.example) permite prepará-lo. O `.env` original e o banco histórico MariaDB não são necessários à demonstração.

## Limitações e status

A demonstração não equivale a um ambiente de produção homologado. Instalação pública, HTTPS, cookies seguros, debug desabilitado, infraestrutura e restauração real de backup precisam de validação própria. Listagens e paginação local não foram homologadas para grandes volumes ou alta concorrência. A agenda verifica conflitos por pet, sem agenda por profissional. Notificações e gestão de funcionários pela interface ficam para versão futura.

A release `v1.0.0` depende da homologação final dos três perfis e do aceite do proprietário. Não há implantação de produção incluída.

[LinkedIn — Natan Da Luz](https://www.linkedin.com/in/natandaluz/)
