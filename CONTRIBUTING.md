## Guia de Contribuição — PETSYSTEM V3

Obrigado por contribuir com o **PETSYSTEM V3**! Este documento feito para orientar o fluxo de trabalho e as boas práticas aceitas no repositório.

## 📌 Regras Principais

1. **Stack do Frontend**:
   - Desenvolvido exclusivamente em **JavaScript** e **JSX** (`.js`, `.jsx`).
   - **NÃO utilizar TypeScript** (`.ts` ou `.tsx`).
   - Framework principal: React com Vite e React Router.

2. **Stack do Backend**:
   - PHP com Laravel (API REST).
   - Eloquent ORM.
   - Banco de dados principal: **PostgreSQL**.

3. **Arquitetura**:
   - Manter `backend/` e `frontend/` independentes.

---

## 🔀 Fluxo Git e Commits

Utilizamos o padrão de **Commits Semânticos**:

- `feat:` — Nova funcionalidade
- `fix:` — Correção de bug
- `docs:` — Alterações na documentação
- `style:` — Ajustes de formatação ou estilo sem alterar comportamento
- `refactor:` — Refatoração de código sem alterar funcionalidade
- `test:` — Adição ou ajuste de testes
- `chore:` — Tarefas de manutenção geral

## Regras de Versionamento:
- **NUNCA** fazer commit de arquivos `.env` ou credenciais de acesso.
- **NUNCA** utilizar `git push --force`.
- Sempre testar localmente antes de abrir Pull Requests.

---

## 🚀 Como Rodar o Ambiente Local

Consulte a documentação em [`docs/setup.md`](file:///c:/Users/User/Desktop/Petsystemv3/docs/setup.md) para instruções detalhadas de configuração.
