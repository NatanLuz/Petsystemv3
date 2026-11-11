# Revisão técnica final — PetSystem V3

Data da execução: 11/11/2026. A revisão partiu de `origin/main` em `250ac3ec191c226a99dd611b4f0927e3325f718e`, na branch `revisao/final-pos-v1.0.0`. A `main` local, a tag `v1.0.0` e o banco demo original não foram modificados.

## Metodologia e segurança

Foram lidos o verificador oficial, `phpunit.xml`, rotas, controllers, requests, models, middleware, configurações, migrations, componentes React, testes e documentação. Os testes PHP foram executados com SQLite em memória e chave efêmera de processo. A instância de acompanhamento usou uma cópia temporária do demo, `.env.review` ignorado pelo Git, `localhost:8001` e `localhost:5174`; seus processos foram encerrados e os artefatos temporários removidos.

O SHA-256 do `backend/database/petsystem_demo.sqlite` foi `2d0b3408867000922f60af19eb0da570343f4a20068b1210450e8d8a48c317ec` antes e depois. Na cópia temporária: `PRAGMA quick_check = ok`, zero violações em `foreign_key_check`, foreign keys ativas, journal `delete` e busy timeout efetivo de 60000 ms. O ensaio de backup/restauração em cópia retornou `quick_check=ok` e hashes iguais.

## Testes executados

| Momento | Comando | Resultado |
|---|---|---|
| Linha de base sem chave | PHPUnit direto | 101 falhas, 757 asserções; falha ambiental por `MissingAppKeyException` |
| Linha de base isolada | `scripts\\verificar.bat` com chave efêmera | 217 testes PHP, 1.509 asserções; 96 testes frontend; build aprovado; 34,57 s |
| Após R01 | testes de agendamento | 44 testes, 165 asserções |
| Após R02 | testes direcionados de sessão | 12 testes, todos aprovados |
| Final | `scripts\\verificar.bat` | 219 testes PHP, 1.512 asserções; 98 testes frontend; build aprovado; 19,24 s |
| Final frontend | `node.exe --test` e `npm.cmd run build` | 98 testes aprovados; Vite 6.4.5, 132 módulos |
| Dependências | `composer audit --locked --format=json` | 0 avisos, 0 abandonados |
| Dependências | `npm.cmd audit --json` | 2 moderados: `react-router` e `react-router-dom`; correção indicada exige v7, upgrade major não aplicado |

## Achados e ações

| ID | Prioridade | Eixo | Evidência | Impacto | Ação |
|---|---|---|---|---|---|
| R01 | P1 | Integridade | `UpdateAppointmentRequest.php:75-82`; dois testes de regressão reproduziam 422 após mudança de duração do serviço e ao editar cancelado com horário reutilizado | Edições válidas eram recusadas | Corrigido no commit `eacd00b` usando a duração histórica e ignorando conflitos para status não reserváveis |
| R02 | P1 | Frontend/sessão | `dashboardMetrics.js:2-5`, `AuthContext.jsx:23-131`; teste reproduziu resposta financeira pendente reutilizada por nova sessão | Dados de dashboard de outro perfil podiam permanecer em estado compartilhado | Corrigido no commit `d6e0b5a`, limpando requisições e remontando a árvore por identidade |
| R03 | P2 | Testes | `scripts/verificar.bat:23-26`; checkout sem `.env` falhava por chave ausente | Verificador não era reproduzível em checkout novo | Corrigido no commit `fdecc72`, com chave efêmera somente no processo |
| R04 | P2 | Documentação | Caminhos `C:\Users\...` em README, setup e backup | Guias dependiam do computador do autor | Corrigido no commit `5f80ab9` |
| R05 | P2 | Dashboard | `HomePage.jsx` usa horário local no filtro de próximos atendimentos, mas o `useMemo` depende de `[appointments, clinicDate]` | Atualização do relógio não recalcula imediatamente a lista | Proposto; não implementado por não ser necessário para os P1 |
| R06 | P2 | Documentação/status | README diz que a release `v1.0.0` depende de homologação e aceite, embora a tag exista | Status documental exige decisão do proprietário | Proposto; não alterado |

## Itens descartados

- P0 de autorização: descartado. Todas as rotas de recursos usam `auth:sanctum`, `EnsureUserIsActive` e Gate por operação; os testes de matriz passaram.
- Vazamento financeiro ao veterinário ou evolução à recepção: descartado. `RedactRoleSensitiveFields` faz filtragem recursiva e `AttendanceApiTest` cobre listagens, relações aninhadas, pets, clientes, agendamentos e serviços.
- Mass assignment de `role`, `active`, valores financeiros ou status: descartado. Requests proíbem campos de autoridade e modelos não os incluem nos payloads indevidos; testes de autorização passaram.
- Exclusão de atendimentos: descartado. O endpoint retorna 409 e os testes confirmam permanência do registro.
- Código público do pet: descartado. A migration impõe unicidade e o model limita tentativas; testes cobrem geração e colisões básicas.
- SQLite inadequado por definição: descartado. A cópia apresentou integridade, foreign keys ativas e migrations completas; concorrência real continua não validada.

## Backlog P3 e limitações

Avaliar migração direcionada do React Router para a versão corrigida, sem aplicar upgrade major nesta revisão. Validar concorrência real sob múltiplos escritores, volume operacional, hospedagem, HTTPS, cookies seguros em produção, debug e restauração no ambiente definitivo. Não foram validados aceite operacional, produção, notificações, agenda por veterinário ou gestão de funcionários, pois não fazem parte do escopo declarado.

## Pendências para o proprietário

Decidir o texto oficial sobre o estado da release e aceite, preservando a distinção entre revisão técnica e homologação operacional. Decidir se R05 merece correção futura. A autenticação foi verificada no navegador com respostas sintéticas e contra a API real para CSRF/visitante; não foram usadas nem registradas senhas das contas do demo.

## Commits desta revisão

- `eacd00b fix(agenda): respeite duração histórica e status na validação`
- `d6e0b5a fix(sessao): isole dados pendentes ao trocar de usuário`
- `fdecc72 test(verificacao): gere chave efêmera para testes isolados`
- `5f80ab9 docs(guias): substitua caminhos pessoais por exemplos`
