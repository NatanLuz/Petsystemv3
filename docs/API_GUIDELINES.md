# Padroes da API

O backend do PetSystem V3 sera uma API REST.

## Principios

- Controllers devem ser finos.
- Validacao deve ficar em Form Requests.
- Transformacao de resposta deve usar API Resources.
- Regras de negocio mais complexas podem ir para Services.
- Policies devem proteger acoes sensiveis quando houver autorizacao por usuario/perfil.

## Padrao de Rotas

Exemplos do MVP atual:

```text
POST   /api/login
POST   /api/logout
GET    /api/me

GET    /api/clients
POST   /api/clients
GET    /api/clients/{client}
PUT    /api/clients/{client}
DELETE /api/clients/{client}

GET    /api/pets
POST   /api/pets
GET    /api/pets/{pet}
PUT    /api/pets/{pet}
DELETE /api/pets/{pet}

GET    /api/services
POST   /api/services
GET    /api/services/{service}
PUT    /api/services/{service}
DELETE /api/services/{service}

GET    /api/appointments
POST   /api/appointments
GET    /api/appointments/{appointment}
PUT    /api/appointments/{appointment}
DELETE /api/appointments/{appointment}
```

## Padrao de Resposta

Para recursos individuais:

```json
{
  "data": {}
}
```

Para listas:

```json
{
  "data": [],
  "meta": {}
}
```

## Tratamento de Erros

Erros de validacao devem retornar HTTP 422.

Erros de autenticacao devem retornar HTTP 401.

Erros de permissao devem retornar HTTP 403.

Recursos nao encontrados devem retornar HTTP 404.

## Autenticacao

O MVP usa Laravel Sanctum com tokens pessoais para a API.

Justificativa tecnica:

- Mantem a implementacao simples e profissional para a fase inicial.
- Evita JWT e refresh token, que nao fazem parte do escopo.
- Permite autenticar o frontend React com `Authorization: Bearer TOKEN`.

Fluxo implementado:

1. `POST /api/login` valida email e senha.
2. Laravel gera um token pessoal do Sanctum.
3. O frontend usa o token nas requisicoes autenticadas.
4. `GET /api/me` retorna o usuario autenticado.
5. `POST /api/logout` revoga o token atual.

Perfis de usuario suportados no MVP:

- `administrator`
- `receptionist`

Observacao:

- O modulo de autenticacao deve ser a base para a protecao dos demais recursos da API.
- A resposta de login segue o padrao `data.user`, `data.token` e `data.token_type`.
