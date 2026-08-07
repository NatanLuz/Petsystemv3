# Modelagem Inicial do Banco

Este documento descreve a modelagem inicial do MVP do PetSystem V3.

## Entidades Iniciais

- users
- clients
- pets
- services
- appointments

## Relacionamentos

```text
users
  └── gerenciam dados do sistema

clients
  └── possuem muitos pets

pets
  └── pertencem a um client

services
  └── podem aparecer em muitos appointments

appointments
  ├── pertencem a um client
  ├── pertencem a um pet
  └── pertencem a um service
```

## Tabelas

### users

Responsavel por representar usuarios autenticados no sistema.

Campos iniciais:

- id
- name
- email
- role
- password
- timestamps

Perfis iniciais:

- `administrator`
- `receptionist`

Observacao: a tabela `users` continua sendo criada pelo Laravel, com uma coluna adicional de role para suportar autorizacao por perfil no MVP.

### clients

Responsavel por representar tutores/responsaveis pelos pets.

Campos iniciais:

- id
- name
- email
- phone
- document
- address
- notes
- timestamps

Boas praticas:

- `email` pode ser nullable, porque nem todo cliente informa email.
- `phone` tende a ser mais importante no contexto de pet shop.
- `document` deve ser pensado com cuidado para nao expor dado sensivel sem necessidade.

### pets

Responsavel por representar os animais vinculados aos clientes.

Campos iniciais:

- id
- client_id
- name
- species
- breed
- birth_date
- weight
- notes
- timestamps

Relacionamento:

- Um pet pertence a um cliente.
- Um cliente pode ter muitos pets.

### services

Responsavel por representar servicos oferecidos pela loja/clinica.

Campos iniciais:

- id
- name
- description
- price
- duration_minutes
- is_active
- timestamps

Boas praticas:

- `price` deve usar tipo decimal, nao float.
- `duration_minutes` ajuda no agendamento.
- `is_active` permite desativar um servico sem apagar historico.

### appointments

Responsavel por representar agendamentos.

Campos iniciais:

- id
- client_id
- pet_id
- service_id
- scheduled_at
- status
- notes
- timestamps

Status iniciais:

- scheduled
- completed
- canceled

Decisao importante:

Inicialmente o status pode ser uma string validada pela aplicacao. Futuramente, podemos avaliar enum nativo no PHP/Laravel se fizer sentido.

## Regras de Negocio Iniciais

- Um cliente pode ter varios pets.
- Um pet sempre deve pertencer a um cliente.
- Um agendamento deve estar vinculado a cliente, pet e servico.
- Um servico inativo nao deve ser usado em novos agendamentos.
- O preco do servico deve ser armazenado com precisao decimal.
- Nao devemos apagar registros historicos importantes sem avaliar impacto.

## Pontos para Evolucao

- Permissoes por usuario
- Historico de atendimentos
- Prontuario veterinario
- Pagamentos
- Notificacoes
- Auditoria/logs
