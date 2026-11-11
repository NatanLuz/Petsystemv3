# Homologação técnica — PetSystem V3

Registro inicial: **08/11/2026**. Atualização documental: **09/11/2026**, referência do proprietário em BRASIL/RS. Status: **candidato para revisão e homologação, ainda sem aceite final de entrega**. Os resultados iniciais abaixo mantêm sua data; as verificações posteriores são discriminadas na atualização ao final.

## Estado real

- Raiz confirmada: `C:\Users\mymy2\Petsystemv3`; remoto `https://github.com/NatanLuz/Petsystemv3`.
- Estado inicial: branch `main`, HEAD `ffe20af`; nenhum arquivo rastreado modificado. Único não rastreado: `rcpagesHomePage.jsx`, preservado e excluído dos commits de finalização.
- Após `git fetch origin`, `origin/main` estava em `87fc1eb`, com dois commits à frente da main local, alterando README. A branch `finalizacao/homologacao-v3` foi criada a partir dessa referência. A main local permaneceu em `ffe20af`.
- PHP 8.2.12 e Composer 2.10.3 disponíveis. Node 24.20.0 e npm 11.19.0 funcionam em `C:\Program Files\nodejs`; o PATH inicial resolvia arquivos em System32 com acesso negado. O guia inclui o ajuste local de PATH.
- Nenhum listener nas portas 8000/5173 na consulta inicial com permissão suficiente. Dois servidores temporários foram iniciados para verificação HTTP e encerrados pelas próprias sessões ao terminar. Nenhum processo desconhecido foi encerrado.
- `.env.demo` e SQLite persistente existem. Laravel reconhece `demo`, conexão `sqlite`, arquivo esperado e chave configurada, sem exibir a chave. Sessão em arquivo; debug local habilitado. O `.env` original foi preservado.
- `quick_check = ok`, nenhuma violação de chave estrangeira e 12 migrations já aplicadas. Não houve migration, seeder ou recriação do banco persistente; MariaDB não foi acessado.
- Readiness retornou 200 na inspeção e por HTTP. O 503 não foi reproduzido com a configuração demo; não há causa histórica comprovada. O guia explica como verificar ambiente, cache e banco antes de corrigir.

## Funcionalidades e testes executados

| Verificação | Resultado e alcance |
| --- | --- |
| Backend PHPUnit | 217 testes aprovados, 1.509 asserções, em SQLite `:memory:` |
| Frontend `node:test` | 96 testes aprovados, incluindo cinco regressões novas |
| Build Vite | Aprovado com Vite 6.4.5 após patches |
| Script integrado `scripts/verificar.bat` | `Backend: OK`, `Frontend testes: OK`, `Build: OK`, `TUDO OK` |
| Proteção do banco | SHA-256 do SQLite persistente igual antes/depois da verificação integrada final |
| Requisitos Composer de execução | `composer check-platform-reqs --no-dev` aprovado |
| HTTP local | Liveness 200, readiness 200 e página inicial Vite 200 |
| Auditoria Composer | Sem avisos após patches direcionados |
| Auditoria npm | Dois pacotes moderados do React Router; zero altos/críticos após patches |
| Backup/restauração | Ensaio aprovado apenas com SQLite sintético descartável; restauração real pendente |
| E2E e capturas em 08/11 | Não executados naquela etapa; capturas e verificação isolada da Sidebar adicionadas em 09/11, conforme atualização abaixo |

A suíte backend cobre login/logout, regeneração e invalidação de sessão, CSRF real sem o bypass de testes, conta inativa, permissões por requisição direta, clientes, pets, serviços, conflitos por pet, transições de agenda, evolução, conclusão, pagamento, métricas, erros e persistência no banco de teste. A suíte frontend cobre permissões, sessão expirada, busca, paginação, datas, formatação, métricas e payload de atendimentos. Os formulários completos e a navegação visual aguardam o checklist manual.

O sandbox impediu inicialmente o esbuild de ler caminhos necessários. Repetidos fora do sandbox, os testes frontend, o build e a verificação integrada passaram. Não foi necessário alterar Babel, arquivos em node_modules ou o parser aberto no IDE manualmente. Dependências foram instaladas pelos gerenciadores.

## Três perfis

Na inspeção inicial de 08/11 havia somente um administrador ativo. Em 09/11 foram confirmadas exatamente três contas ativas, uma por perfil: `admin`, `receptionist` e `veterinarian`. A criação dos perfis faltantes deixou de ser pendência. As senhas foram informadas pelo proprietário somente no terminal privado; não há credenciais de acesso publicadas.

Os três perfis foram exercitados nos testes isolados. Gates do backend e permissões do frontend correspondem à matriz do README. Respostas aninhadas também são verificadas: veterinário não recebe `price`, `amount_charged` ou `payment_method`; recepção não recebe `evolution`. Escrita de campos sensíveis pelo perfil indevido é recusada. A ficha do pet, alergias e alertas operacionais são compartilhados pela implementação atual. Isso precisa ser conhecido no aceite de privacidade do proprietário.

## Defeitos e correções desta finalização

1. **Campos descartados no atendimento por agendamento.** A página montava apenas `appointment_id`, embora mostrasse pagamento e evolução no formulário. O payload agora preserva os campos preenchidos conforme o perfil. Regressões JavaScript verificam recepção, veterinário e atendimento avulso; testes de API confirmam persistência e privacidade.
2. **Erro 422 ao administrador editar atendimento já concluído.** A interface reenviava `status=completed`; a API aceita essa transição somente a partir de `in_progress`. A interface agora envia status apenas quando mudou, mantendo a regra do backend. Testes verificam o payload e o pagamento após conclusão sem mudar a data de conclusão.
3. **Dependências com avisos publicados.** Oito pacotes PHP e dependências frontend receberam patches direcionados dentro das restrições existentes. Não houve migração de versão principal. Veja [segurança das dependências](seguranca-dependencias.md) para versões e pendência moderada.
4. **Documentação inconsistente.** Corrigidos stack incompleta, afirmações de MySQL como persistência local e referência a seção de teste inexistente no README do backend. Incluídos modelo demo sem segredos, inspeção somente leitura, dois terminais CMD, permissões exatas, limitações, backup/restauração e checklist de aceite.

Não foram adicionados módulos, notificações, gestão de funcionários pela interface ou agenda por profissional.

## Pendências impeditivas de homologação final

- Executar e registrar o [checklist manual](checklist-manual.md) por perfil em cópia descartável, incluindo as duas regressões.
- Resolver ou concluir avaliação formal dos avisos moderados do React Router antes da release, sem upgrade forçado indiscriminado.
- Validar backup e restauração reais em cópia separada, sem sobrescrever a demonstração persistente.
- Revisar ambiente de hospedagem, debug, HTTPS, cookies, acesso e backup antes de qualquer afirmação de produção.
- Obter aceite funcional final do proprietário; as cinco capturas já foram recebidas e revisadas.

## Documentação, GitHub e próximos passos

README principal, README do backend e `docs/setup.md` revisados; adicionados `backup.md`, `checklist-manual.md`, `seguranca-dependencias.md` e `img/README.md`. A pasta `docs/img` contém as cinco capturas reais, com nomes padronizados: `dashboard.png`, `agendamentos.png`, `atendimentos.png`, `pets.png` e `veterinario.png`.

Foram registrados os commits `25ad446` (atendimentos e regressões), `429888e` (patches de segurança) e `315426a` (documentação e inspeção). A branch `finalizacao/homologacao-v3` foi publicada com push normal e passou a acompanhar `origin/finalizacao/homologacao-v3`. Esta atualização registra a publicação no próprio relatório. Consulte `git log --oneline origin/main..HEAD` para o histórico completo. Não houve merge na main, implantação ou publicação de release/tag `v1.0.0`.

A versão é tecnicamente verificável e está preparada para revisão; **a entrega homologada e a prontidão de produção ainda dependem dos itens acima**. Após o aceite: revisar o diff/PR, repetir checks se houver mudanças, integrar a branch conforme o fluxo do proprietário e só então preparar a release. LinkedIn e portfólio devem usar apenas capturas fictícias revisadas e descrever o escopo efetivamente entregue, sem anunciar produção ou novas funções que não foram validadas.

## Atualização de 09/11/2026

- Autenticação administrativa validada por HTTP real, com credenciais digitadas em terminal privado: CSRF 204, login 200, consulta autenticada 200 e logout 204. O servidor estava em `demo` no SQLite esperado. Os demais campos do administrador e os outros dois usuários foram preservados. Isso não equivale ao aceite integral da aplicação por perfil.
- Sidebar com seis opções somente textuais, validada em Chrome headless isolado com autenticação fictícia nas larguras 1280, 760, 390 e 320 px. Foram conferidos links, seleção ativa, foco por teclado, abertura/fechamento móvel e ausência de overflow horizontal. Não foi um E2E completo com dados do sistema.
- Cinco screenshots fornecidas pelo proprietário, revisadas visualmente e verificadas quanto à integridade PNG. Nomes padronizados sem alterar o conteúdo binário. As legendas refletem as capturas: atendimentos em lista vazia e veterinário no dashboard sem financeiro. Veja [o índice das imagens](img/README.md).
- README reorganizado para apresentação pública, com contexto da evolução do V2, instalação em dois terminais CMD, permissões, testes e limitações. Removido o resumo temporário de pull request, sem referências pelo projeto e redundante com este relatório. Guias e scripts necessários à operação foram preservados.
- Nesta revisão documental, `npm.cmd run verify` aprovou os 96 testes frontend e o build de produção Vite. Os testes backend de 217 casos permanecem como evidência da execução inicial, sem nova execução nesta alteração exclusivamente documental.
- Esta etapa não inclui push, merge, release, alteração de código funcional ou modificação do banco. O aceite manual completo, a restauração real de backup e a avaliação de segurança continuam pendentes.
