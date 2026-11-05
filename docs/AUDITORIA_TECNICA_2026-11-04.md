# PetSystem V3 — auditoria técnica e preparação para entrega

Data: 04/11/2026. Auditoria de leitura e verificações não destrutivas.

## 1. Parecer executivo e limites

**Entrega não aprovada com as evidências disponíveis.** O primeiro bloqueio é a identidade da versão em avaliação: o checkout acessível não corresponde ao sistema demo descrito. Há uma versão mais avançada em `origin/main`, examinada complementarmente sem trocar a branch.

| Referência | Estado verificado |
|---|---|
| Diretório acessível | `C:\Users\User\Petsystemv3` |
| Diretório informado no pedido | `C:\Users\mymy2\Petsystemv3` não existe neste ambiente |
| Branch/HEAD local | `main`, `91c84c2ec4c54f4f4c52ecdd7ca3e253ce4be8d6` |
| `origin/main` armazenado | `ffe20afca3f44df7ece4d9a6edc298a2058acf0a` |
| GitHub consultado com `git ls-remote` | Mesmo identificador `ffe20af…` para `refs/heads/main` |
| Divergência | 8 commits exclusivos locais e 146 exclusivos de `origin/main` |

Neste relatório, **local** significa arquivos atuais do workspace, incluindo alterações pendentes; **remoto** significa o conteúdo imutável do commit `ffe20af…`, lido por `git show`/`git ls-tree`. Uma implementação no remoto não comprova seu funcionamento no computador do cliente.

Nenhum código existente, configuração, usuário ou banco foi alterado. Não foram executados instalação, migrations, seeders, inicialização/parada de serviços, commit, push, fetch, merge, checkout, reset ou limpeza. Este relatório é um novo artefato documental. O MariaDB histórico não foi acessado.

## 2. Arquitetura

**Local:** monorepositório com Laravel 12/PHP em `backend`, React 19/TypeScript/Vite em `frontend`, documentação em `docs`. A API implementa login por token pessoal Sanctum, `/api/me`, logout e CRUD de clientes. Controllers delegam validação a Form Requests e serialização a Resources. Existe apenas `ClientPolicy`, que permite todas as ações a qualquer usuário autenticado. Models e migrations de pets, serviços e agendamentos não significam APIs prontas.

**Remoto:** Laravel com sessão web e Sanctum stateful, CSRF, CORS explícito, autenticação limitada por tentativas, usuário ativo obrigatório, Gates por operação e remoção de campos sensíveis. React 18/JavaScript, React Router, AuthContext, Axios com cookies/XSRF e timeout. Há CRUDs, fichas, agenda, atendimentos e métrica financeira. São arquiteturas de autenticação diferentes: não misturar configurações e serviços Axios entre as versões.

A organização geral é adequada para o porte descrito; não há motivo demonstrado para reestruturar o projeto ou introduzir Repository Pattern. No remoto há duplicação parcial de ocultação de dados entre `ClientController::show` e `RedactRoleSensitiveFields`; centralização é melhoria, não bloqueio por si só.

## 3. Estado dos módulos

| Módulo | Checkout local | Referência remota, por leitura |
|---|---|---|
| Login/logout | Backend implementado; frontend sem fluxo de autenticação | Sessão, login/logout e rota protegida implementados |
| Dashboard | Texto “Dashboard em preparacao” | Página e endpoint financeiro implementados |
| Clientes | CRUD API; formulário/listagem React; integração autenticada incompleta | CRUD, ficha, histórico e bloqueio de exclusão com pets |
| Pets | Model/migration; menu desabilitado | CRUD, ficha e bloqueio de exclusão com histórico |
| Serviços | Tela nova não rastreada chama API inexistente | CRUD; desativação em vez de exclusão quando existe histórico |
| Agendamentos | Model/migration; sem endpoint ou página | CRUD, estados, motivos e verificação de sobreposição por pet |
| Atendimentos | Ausente; menu desabilitado | Avulso ou por agenda confirmada; evolução, cobrança, conclusão e histórico permanente |
| Financeiro | Sem implementação | Soma de valores cobrados em atendimentos concluídos no mês local até o instante atual |
| Operação local | Sem scripts de entrega | Scripts iniciar/parar/verificar/criar usuário e `docs/setup.md` |

“Implementado” nesta tabela significa código encontrado, não aprovação por teste funcional. A métrica financeira remota representa valores cobrados em atendimentos concluídos; não há comprovação de conciliação de pagamentos, caixa ou recebimentos efetivos. O rótulo e a regra de negócio precisam corresponder a essa definição.

## 4. Matriz real de acesso

### Checkout local

`backend/app/Enums/UserRole.php:7` define `administrator`, não `admin`, e `receptionist`. Não define `veterinarian`. Não há atributo ativo/inativo nas migrations locais de usuários.

| Recurso | administrator | receptionist | admin/veterinarian |
|---|---|---|---|
| Clientes: criar, visualizar, editar, excluir | Permitido pela policy | Permitido pela policy | Não suportados pelo enum |
| Dashboard, pets, serviços, agenda, atendimentos, financeiro | Sem API implementada | Sem API implementada | Sem suporte |

`backend/app/Policies/ClientPolicy.php:10–32` retorna `true` para todas as ações. As rotas têm autenticação, mas não segregação efetiva por função. O frontend não consulta identidade nem aplica permissões; `Topbar.tsx:17` mostra Administrador estaticamente. Não se pode certificar bloqueio por perfil neste checkout.

### Referência remota

Legenda: C = criar, V = visualizar, E = editar, X = excluir. As permissões abaixo vêm dos Gates, Requests e Controllers, e não de uma definição proposta de negócio.

| Módulo/operação | admin | receptionist | veterinarian |
|---|---|---|---|
| Dashboard geral | Acesso autenticado | Acesso autenticado | Acesso autenticado sem finanças |
| Dashboard financeiro | V | V | Negado |
| Clientes | C/V/E/X | C/V/E/X | C/V/E; X negado |
| Pets | C/V/E/X | C/V/E/X | C/V/E; X negado |
| Serviços | C/V/E/X | V | V sem preços |
| Agendamentos | C/V/E/X | C/V/E; X negado | C/V/E; X negado, sem preços |
| Atendimentos | C/V/E; X retorna 409 | C/V; E apenas cobrança/pagamento; X negado | C/V; E clínica/serviços/status; X negado |
| Evolução clínica | V/E | Removida das respostas; gravação negada | V/E |
| Valores e pagamento | V/E conforme endpoint | V/E conforme endpoint | Campos removidos; gravação financeira negada |

Restrições adicionais observadas:

- Todos devem estar autenticados e ativos. Perfil desconhecido não pertence às listas dos Gates.
- Exclusão de cliente com pets e de pet com histórico retorna 409. Serviço com histórico é desativado.
- Atendimento não pode ser excluído nem pelo administrador: o Gate administrativo permite chegar ao Controller, que retorna 409.
- Recepção pode iniciar atendimento, mas na atualização apenas `amount_charged` e `payment_method` são aceitos. Não conclui atendimento.
- Veterinário não pode enviar campos financeiros. A conclusão por veterinário exige evolução clínica; a mesma exigência não é aplicada ao administrador.
- Não foi encontrada restrição de edição ao veterinário responsável pelo registro. Isso descreve a regra atual; exigir autoria exclusiva seria decisão de negócio adicional.
- A sobreposição da agenda é verificada por pet, não por disponibilidade de profissional/sala. Não classificada como falha sem requisito correspondente.

Evidências remotas: `backend/app/Providers/AppServiceProvider.php:23–53`, `backend/routes/api.php:29` em diante, `frontend/src/features/auth/permissions.js`, `StoreAttendanceRequest`, `UpdateAttendanceRequest` e `RedactRoleSensitiveFields`.

Frontend e Gates remotos apresentam a mesma matriz. A API aplica autorização nas rotas, além de restrições de campos nos Requests: não depende apenas de esconder botões. Existem testes de chamadas diretas em `RoleAuthorizationTest.php` e `AttendanceApiTest.php`, mas **não foram executados**. Portanto, o bloqueio está demonstrado por leitura, não confirmado experimentalmente.

## 5. Contas de demonstração

`backend/.env.demo` e `backend/database/petsystem_demo.sqlite` não existem no workspace acessível. Não foi aberto outro banco como substituto.

Quantidade de usuários, perfis cadastrados, situação ativo/inativo e existência de contas dos três perfis: **não verificáveis**. Ausência do arquivo não significa zero usuários no ambiente original. Nenhuma credencial existente foi procurada ou utilizada para login.

O comando solicitado não existe no checkout local. Ele existe no remoto em `backend/app/Console/Commands/CreateDemoUser.php`. Quando a versão e o ambiente demo corretos estiverem disponíveis, o responsável poderá executar, dentro de `backend`:

```powershell
php artisan petsystem:create-user --env=demo
```

O comando remoto exige ambiente demo, conexão SQLite sem URL externa e o caminho real do arquivo demo; solicita nome, e-mail, perfil e senha oculta com confirmação. Usá-lo somente depois de confirmar quais contas faltam. Não foi executado e não deve ser substituído por seeder ou senha fixa.

## 6. Testes e verificações executadas

| Comando/verificação | Resultado |
|---|---|
| `php -v` e `php -m` | PHP 8.2.12; PDO SQLite disponível |
| `php -l` sobre cada PHP local | 52 arquivos; nenhuma falha de sintaxe |
| `git show origin/main:<arquivo>` enviado a `php -l` via stdin | 81 arquivos PHP remotos; nenhuma falha de sintaxe; sem materializar checkout |
| `composer validate --no-check-publish --no-plugins` em backend | Válido |
| `composer check-platform-reqs --lock` em backend | Requisitos do lock atendidos pelo PHP/extensões disponíveis |
| `composer --no-cache audit --locked --no-plugins --format=json` em backend | Exit 1 por avisos de segurança; consulta pública concluída após liberação de rede |
| `git status`, `branch -vv`, `log`, `rev-list`, `ls-files` | Estado e divergência registrados |
| `git ls-remote origin refs/heads/main` | Consulta remota concluída após liberação de rede; hash coincide com `origin/main` local |
| Conexão TCP a 127.0.0.1:8000 e :5173, timeout de 2 s | Ambas expiraram; nenhuma resposta acessível desta sessão |
| Inventário de automação de navegador | Nenhum navegador/app acessível; host do navegador e pipe nativo indisponíveis |

Ocorrências operacionais sem efeito no projeto: a primeira validação Composer foi chamada na raiz, onde não existe `composer.json`, e depois repetida corretamente em `backend`. A primeira leitura Python do lock usou a codificação padrão do Windows e falhou; foi repetida com UTF-8. As primeiras consultas de rede falharam no sandbox e foram repetidas com a permissão da ferramenta. Esses episódios não são defeitos da aplicação.

### Testes não executados

- PHPUnit/Artisan: `backend/vendor/autoload.php` ausente. Não houve instalação.
- A configuração local de testes comenta `DB_CONNECTION=sqlite` e `DB_DATABASE=:memory:` em `phpunit.xml:25–26`. `RefreshDatabase` está presente nos testes funcionais. Rodá-los sem corrigir/forçar isolamento poderia atingir outra conexão.
- No remoto, `phpunit.xml` define SQLite em memória e zera `DB_URL`; `scripts/verificar.bat` documenta barreiras adicionais contra cache de configuração e `.env.testing`. Isso melhora a segurança prevista, mas não comprova configuração efetiva de um processo que não foi iniciado.
- Build/testes frontend: Node/npm não encontrados no PATH e `node_modules` ausente. Local não tem script de testes nem lockfile frontend; remoto tem `verify`, lockfile e 11 arquivos `.test.js`.
- API direta, CRUD, autenticação/logout, cálculos financeiros, validações e erros: não executados dinamicamente.
- E2E, responsividade visual, sessão expirada e três perfis: não executados.
- Nenhuma migration ou seeder foi executado, inclusive para preparar testes. A futura execução de `RefreshDatabase` deverá ser restrita ao banco em memória confirmado.

Cobertura encontrada localmente: 4 arquivos de teste, cobrindo exemplos, autenticação e clientes. Não há cobertura local de segregação por perfil, pets, serviços, agenda, atendimentos ou finanças. No remoto há 15 arquivos PHP de testes, incluindo autenticação/CSRF, permissões, CRUDs, atendimentos, métricas, health check, seeders e comando de criação. Existência não significa aprovação.

### DashboardMetricsTest.php e a linha 54

O arquivo não existe no checkout local. A cópia no commit remoto tem 58 linhas, passou em `php -l` e a linha 54 integra a cadeia válida da requisição do teste de recepção. **O erro anterior não foi reproduzido; não há correção sintática justificável para esta cópia.** Para propor um patch mínimo, será necessário comparar o arquivo exato do ambiente original e a mensagem do parser. Não se deve substituir o teste inteiro pela versão remota nem presumir que o erro esteja na linha apontada; um delimitador anterior também pode causar esse diagnóstico.

## 7. Achados priorizados e correções mínimas

P0 = bloqueio de uso ou risco grave; P1 = corrigir antes da entrega; P2 = melhoria recomendada; P3 = evolução futura. Gravidade de advisory de biblioteca não é automaticamente gravidade de exploração da aplicação.

| ID/prioridade/versão | Arquivo e localização | Evidência e impacto | Correção mínima recomendada |
|---|---|---|---|
| A01 — P0, ambiente | HEAD, `origin/main`, diretório e arquivos demo | Checkout não corresponde ao cenário; dependências, demo e módulos esperados ausentes. Não há pacote executável validável nesta sessão. | Identificar a cópia de entrega correta e preservar as alterações atuais antes de qualquer sincronização. Não fazer merge automático. |
| A02 — P1, local | `ClientPolicy.php:10–32`; `UserRole.php:7–8` | Todas as ações de clientes permitidas; só dois perfis, administrador com outro identificador. Não atende aos três papéis solicitados. | Na versão a entregar, usar a matriz real de negócio, aplicar autorização backend e testes de negação. O remoto já contém uma base; evitar reconstruir no checkout antigo. |
| A03 — P1, local | `frontend/src/lib/api.ts:3–8`; `App.tsx:16–38`; `Sidebar.tsx:56`; `Topbar.tsx:17` | Sem login, identidade, token/cookie integrado, tratamento global de 401 ou logout; usuário administrativo fixo. Interface não consegue cumprir o fluxo protegido. | Adotar o fluxo de autenticação coerente com o backend da versão escolhida. |
| A04 — P1, local | `frontend/src/features/services/serviceService.ts`; `backend/routes/api.php:13`; `App.tsx:27` | UI de serviços sem endpoint; Dashboard placeholder e outros módulos ausentes. | Consolidar a versão correta e validar endpoints reais; não considerar a abertura de uma tela como CRUD aprovado. |
| A05 — P1, local | `backend/phpunit.xml:25–26` | SQLite em memória comentado; testes usam `RefreshDatabase`. Risco de testes destrutivos na conexão herdada. | Configurar e confirmar isolamento efetivo, incluindo DB_URL, configuração em cache, ambiente e conexões alternativas, antes da execução. |
| A06 — P1, remoto | `frontend/src/features/attendances/AttendancesPage.jsx:135–136` | Na criação com agendamento, payload contém somente `appointment_id`; campos financeiros/clínicos visíveis e preenchidos são descartados. A API aceita esses campos autorizados. | Construir a base do payload conforme vínculo e acrescentar os campos permitidos por perfil também nesse ramo. Verificar persistência na resposta e no banco isolado. |
| A07 — P1, remoto | `AttendancesPage.jsx:133,210`; `UpdateAttendanceRequest.php:53–55` | Admin pode abrir edição de concluído; formulário sempre envia `status=completed`. Request rejeita conclusão quando estado atual já não é `in_progress`. Salvar cobrança pelo formulário administrativo retorna 422. | Omitir status inalterado no frontend ou aceitar explicitamente manutenção de `completed`, preservando proibição de reabrir. Testar admin editando pagamento de concluído. |
| A08 — P1, remoto | `AttendancesPage.jsx:210`; `UpdateAttendanceRequest.php:48–62` | UI esconde edição clínica de concluídos para veterinário, mas PATCH direto somente com `evolution`/`notes` é permitido. Regra visual e backend divergem. | Definir se clínico concluído é imutável ou recebe adendo. Aplicar a mesma decisão na API; se admitir correção, registrar autoria e histórico. |
| A09 — P1, dependências locais | `backend/composer.lock`, versões na seção 8 | Auditoria retornou avisos, inclusive crítico do Laravel e altos em transitivas. | Atualizar de forma controlada na etapa de correção e repetir auditoria/testes no lock da versão efetivamente entregue. Não executado nesta auditoria. |
| A10 — P1, operação | Documentação local/remota; ausência de procedimento de backup/restauração encontrado | Sem evidência de backup verificável ou restauração ensaiada; perda do SQLite comprometeria operação e histórico clínico. | Documentar destino, frequência, retenção, responsáveis e restauração; testar com cópia descartável e definir tolerância de perda/parada com o cliente. |
| A11 — P1, local | `backend/database/seeders/UserSeeder.php:13–28` | Seeder usa credenciais fixas e `updateOrCreate`; execução pode redefinir contas correspondentes. Nenhum seeder foi executado. | Impedir uso em entrega real; manter criação interativa e contas existentes. Não reproduzir credenciais na documentação. |
| A12 — P1, local | `backend/routes/api.php:7`; `AuthController.php:28` | Login sem throttle explícito; emissão de tokens sem expiração explícita. | Limitar tentativas e definir ciclo de vida/revogação. O remoto usa sessão e throttle; não transplantar configuração sem considerar essa diferença. |
| A13 — P2, local | `ClientController.php:36`; `useClients.ts`; `ClientsPage.tsx` | Backend pagina, UI ignora meta/links; apenas primeiros 15 registros acessíveis. `per_page` não tem limite validado. Buscas concorrentes podem sobrescrever resposta mais recente. | Adicionar controles de paginação, limites backend e cancelamento/identificação de requisições. |
| A14 — P2, remoto | `ClientController::index`, `PetController::index`, `ServiceController::index`, `AppointmentController::index`, `AttendanceController::index` | Listas completas carregadas; paginação/busca frontend não reduz transferência. | Medir com volume esperado e paginar no servidor quando necessário. |
| A15 — P2, remoto | `AttendanceController.php:86–104` | Atualização transacional sem reler/bloquear o atendimento; validação ocorre antes da transação. Risco de sobrescrita por dois operadores, não reproduzido. | Testar duas sessões concorrentes; reler estado sob controle apropriado ao banco e/ou usar versão otimista. |
| A16 — P2, remoto | `AttendanceController.php:37–50`; `DashboardController::metrics` | Valores persistidos em decimal, mas soma usa float e métrica converte para float. Risco de precisão em cenários/volumes específicos. | Calcular em centavos ou representação decimal e verificar arredondamento com limites relevantes. |
| A17 — P2, local | `ClientForm.tsx`, `ClientsPage.tsx`, `App.tsx` | Erros genéricos ocultam mensagens 422; filtros sem rótulos dedicados; rota desconhecida cai em Dashboard. | Exibir validação por campo, rotular filtros e criar página de não encontrado. |
| A18 — P2, local | `README.md`; `backend/README.md`; `frontend/package.json` | README descreve stack planejada/MySQL e não instalação atual; backend tem README padrão; falta lock/teste frontend. | Documentar versão consolidada, instalação/execução, variáveis sem valores secretos, testes isolados e entrega reproduzível. O remoto já oferece guia melhor. |
| A19 — P3, evolução | Agenda/prontuário/auditoria | Não há requisito confirmado de agenda por profissional/sala, adendos clínicos ou trilha completa de alterações. | Definir essas necessidades com o cliente e priorizar somente após corrigir os bloqueios confirmados. |

A08 é uma divergência real entre interface e API; sua correção depende da regra de negócio. Não se afirma que qualquer veterinário deva ser proibido de corrigir registros apenas por pertencer a esse perfil.

## 8. Segurança e dependências

Pontos positivos locais: `Hash::check`, cast de senha `hashed`, campos secretos ocultos no User, dados validados antes de mass assignment e rotas de clientes autenticadas. No remoto, login exige usuário ativo e regenera sessão; logout invalida sessão e regenera CSRF; sessão usa o stack web; frontend envia cookies/XSRF; campos financeiros/clínicos são filtrados recursivamente no backend. O modelo User remoto não permite atribuição em massa de role/active.

Não há `.env` efetivo disponível para certificar `APP_DEBUG`, HTTPS, cookies seguros, domínio de sessão, CORS ou hosts Sanctum. O default remoto de `SANCTUM_STATEFUL_DOMAINS` não lista a origem Vite `:5173`; deve ser conferida no ambiente demo/produção. Isso é requisito de configuração, não prova de falha no `.env.demo` ausente. A autenticação por Bearer local e a autenticação por cookie remota exigem avaliações diferentes de CSRF.

Auditoria pública via Composer foi feita **sobre o lock local**, sem pacotes instalados. Exemplos retornados:

- `laravel/framework v12.64.0`: CVE-2026-114509, severidade crítica declarada, referente a TokenGuard e credenciais não string. O fluxo local observado usa Sanctum e valida string; não foi demonstrada exploração desse advisory na aplicação. Também foram retornados avisos de inclusão de relacionamentos e XSS em debug.
- `guzzlehttp/guzzle 7.15.0`: alertas de host/cookies/redirecionamento, incluindo CVE-2026-69246.
- `league/commonmark 2.8.3`: avisos de XSS e negação de serviço em extensões/processamento Markdown.
- `symfony/http-foundation v7.4.14`: avisos sobre cabeçalhos, URLs/proxies e ReDoS, incluindo CVE-2026-108082.
- Outros avisos retornados para componentes Symfony HTTP Kernel, Mime, Routing e YAML. A auditoria não retornou pacotes abandonados.

O lock remoto é diferente: Laravel v12.66.0, Sanctum v4.3.3, Guzzle 7.15.3, CommonMark 2.9.2 e HttpFoundation v7.4.16. Não foi executado Composer audit sobre esse segundo lock; os resultados locais não podem ser transferidos integralmente para ele. A faixa Laravel `<12.68.0` do aviso crítico retornado também inclui a versão remota, sem provar uso do componente vulnerável.

Fontes identificadas pela ferramenta: [aviso Laravel TokenGuard](https://github.com/advisories/GHSA-f9x3-7vq9-cph6), [aviso Guzzle](https://github.com/advisories/GHSA-v5mv-p594-2x33), [Symfony HeaderUtils](https://symfony.com/cve-2026-108082). Não foi realizado ataque ou teste de exploração. Npm audit não foi executado: ferramenta e instalação frontend indisponíveis, e falta lock local. Não há parecer de ausência de vulnerabilidades no frontend.

## 9. Banco, persistência e operação

Não houve conexão com banco de dados da aplicação. Não é possível confirmar integridade do demo, dados persistidos, migrations aplicadas ou `PRAGMA foreign_key_check` sem o arquivo solicitado.

Na configuração local e remota, SQLite é suportado, foreign keys são ativadas por padrão, e opções de busy timeout/journal não são fixadas pela aplicação. Não se inferiu o modo real do banco a partir desses defaults. Schema local contém FKs de pets/agendamentos, mas migrations com o mesmo timestamp ordenam `appointments` antes das tabelas relacionadas: conferir instalação limpa para cada banco de entrega. Isso não foi tratado como falha comprovada do SQLite.

No remoto, pets e atendimentos preservam dependências com restrict; atendimento por agendamento possui vínculo único; itens guardam preço/duração; FKs protegem histórico. Transações existem em criação/atualização de agenda e atendimento. `lockForUpdate` não deve ser considerado, isoladamente, prova de proteção adequada no SQLite; testar contenção no banco de entrega.

SQLite pode ser adequado para uma operação local com poucos escritores. Não há dados suficientes sobre simultaneidade, volume, acesso por rede, disponibilidade ou infraestrutura para aprovar produção ou impor migração. Definir esses requisitos e medir no ambiente real. Backup deve usar mecanismo consistente do SQLite ou janela sem escrita; copiar um arquivo em uso sem considerar journal/WAL não é procedimento validado. Restauração deve ocorrer em cópia descartável com checagem de integridade e amostras funcionais.

## 10. Navegador e avaliação de UX

**Nenhum teste E2E foi realizado.** A ferramenta reportou host de navegador indisponível e falha de conexão do pipe nativo. As portas esperadas também não responderam à sondagem TCP. Não foi possível afirmar se existe um processo em execução fora do alcance desta sessão; nenhum serviço foi alterado para investigar.

A avaliação visual é exclusivamente estática: CSS local oferece adaptação em 760 px, foco de inputs e rolagem horizontal de tabela. Há estados de carregamento, vazio, sucesso, erro e confirmação de exclusão. Não há evidência de contraste medido, navegação por teclado completa ou layout realmente renderizado em celular. Há landmarks `main` aninhados no layout/páginas locais e identidade estática. Prioridade operacional: login real, acesso a todos os registros, mensagens de validação e consistência de permissões.

No remoto, componentes de feedback, labels, erros por campo, paginação visual e tratamento de 401/403/419 estão implementados. O AuthContext não repete automaticamente operações de escrita após renovar CSRF, reduzindo duplicação. Ainda falta validação real dos fluxos de recepção, veterinário e administração, em especial os achados A06–A08.

## 11. Git/GitHub e preservação

Foram encontrados 33 arquivos rastreados modificados, 2 exclusões pendentes (`CHANGELOG.md`, `CONTRIBUTING.md`) e 8 arquivos não rastreados. Entre os novos: Sidebar/Topbar, MainLayout e três arquivos de serviços; também `ersUserPetsystemv3` e `tatus --short`. Não foram apagados nem interpretados como artefatos seguros para limpeza.

Commits locais recentes: `91c84c2` (readme novo), `8f7650c` (organização do README), `08500de` (README/título), `588f2fe` (licença), `758030b` (estrutura inicial frontend). Remoto configurado: `https://github.com/NatanLuz/Petsystemv3.git`.

O GitHub foi efetivamente consultado; seu main coincide com o `origin/main` armazenado, mas **o código de trabalho local não está atualizado nem equivalente a esse main**. A contagem 8/146 foi feita entre os commits, não inclui alterações sem commit.

Busca de caminhos sensíveis no índice e no histórico alcançável não encontrou `.env`, SQLite, PEM, KEY ou `auth.json` rastreados; existe somente `backend/.env.example` entre os arquivos de ambiente listados. Essa busca por nomes não é uma varredura de todo conteúdo e não certifica ausência de segredos embutidos. Regras de ignore cobrem ambientes, dependências e SQLite. Nenhum banco/segredo foi publicado.

`DashboardMetricsTest.php` e `rcpagesHomePage.jsx` não existem no checkout atual. Há `frontend/src/pages/HomePage.jsx` e o teste de métricas no remoto; não se presumiu que o nome incomum informado fosse um erro a corrigir. Nenhum arquivo foi substituído por conteúdo remoto.

## 12. Plano de conclusão e critérios de aceite

1. **Fixar a versão de entrega:** localizar a cópia funcional descrita pelo responsável e reconciliar a divergência em uma etapa posterior autorizada, preservando alterações e arquivos locais. Não há base para realizar essa reconciliação automaticamente nesta auditoria.
2. **Preparar QA isolado:** disponibilizar dependências já aprovadas e uma cópia descartável do demo. Confirmar caminho real, configuração efetiva e ausência de qualquer conexão ao histórico. Para testes automatizados, SQLite em memória e variáveis forçadas no processo; validar que cache/configurações não substituem o isolamento.
3. **Corrigir os achados P1 aplicáveis à versão consolidada:** priorizar os fluxos de atendimento, consistência clínica/UI/API, isolamento e dependências. Não reconstruir módulos que já existem no remoto antes de definir qual versão será entregue.
4. **Executar suítes:** backend completo e testes de negação por perfil; frontend `node --test`/`npm run verify` na versão remota consolidada; build de produção. Auditar os locks efetivos. Registrar comando, ambiente, exit code e falhas.
5. **Validar E2E:** usar dados marcados `QA-AUDITORIA-<data>-<caso>` apenas na cópia descartável. Se contas adicionais forem necessárias, o responsável as cria interativamente, com senha própria, após confirmar a necessidade; não extrair credenciais atuais.
6. **Ensaiar operação:** backup/restauração, simultaneidade compatível com número de operadores, inicialização/parada, persistência após reinício e configuração de entrega.
7. **Aceite:** nenhum P0/P1 aberto sem decisão explícita; matriz backend confirmada por chamadas diretas; testes/build aprovados; backup restaurado com sucesso; fluxos reais dos três perfis aprovados pelo responsável; README correspondente à versão entregue.

### Roteiro manual/E2E pendente

| Fluxo | Evidência esperada no ambiente isolado |
|---|---|
| Login, credencial inválida e logout | Sessão criada/regenerada, mensagens corretas, recurso protegido negado após logout |
| Cada perfil e usuário inativo | UI coerente; API direta retorna 401/403; dados permanecem inalterados após negação |
| Clientes/pets/serviços | Criar, buscar, visualizar, editar, cancelar, excluir quando permitido; 422 e 409 úteis |
| Agenda | Datas inválidas/passadas, sobreposição, confirmação, motivo de alteração/cancelamento e exclusão por perfil |
| Atendimento avulso | Cliente/pet compatíveis, serviços ativos, evolução e financeiro por perfil |
| Atendimento por agenda | Somente confirmado; campos digitados persistem; vínculo não duplica; estados sincronizados |
| Conclusão e correção | Evolução exigida conforme regra; não reabre; pagamento de concluído funciona para admin/recepção; proteção clínica consistente na API |
| Financeiro | Valor calculado sobre concluídos, fronteiras do mês/fuso, nulos/zero/centavos e ausência de campos para veterinário |
| Erros/estado vazio | Falha de rede, ausência de resultados, tentativa novamente e preservação de formulário |
| Sessão expirada | 401 volta ao login; 403 mantém sessão; 419 renova proteção sem repetir escrita |
| Layout/acessibilidade | 320/760/desktop, zoom 200%, teclado, foco, labels, legibilidade e feedback anunciado |
| Persistência/restauração | Registros sobrevivem reinício na cópia; backup restaurado em outro arquivo conserva relacionamentos |

O diagnóstico permite orientar correções com baixo retrabalho, mas não substitui a validação do banco demo e da cópia funcional original, indisponíveis nesta sessão.
