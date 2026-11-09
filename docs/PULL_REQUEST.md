# Finalização do PetSystem V3 — candidato à homologação

## Problema e resultado

O formulário de atendimento por agendamento descartava pagamento/evolução preenchidos, e a edição de um atendimento concluído pelo administrador reenviava uma transição de status rejeitada com 422. O payload agora preserva os campos autorizados e envia status apenas quando mudou, mantendo as regras da API.

Atualizados os lockfiles com correções de segurança direcionadas dentro das versões principais existentes. Revisados README, instalação demo, matriz de permissões e limites de privacidade; adicionados modelo demo sem segredos, inspeção somente leitura, backup/restauração, checklist e orientação para cinco capturas reais.

## Validação

- 217 testes backend / 1.509 asserções, usando SQLite em memória.
- 96 testes frontend e build Vite aprovados; script integrado com `TUDO OK`.
- SHA-256 do SQLite persistente igual antes/depois dos testes finais.
- HTTP local: liveness, readiness e frontend com 200. Nenhuma migration aplicada.
- Composer sem avisos após patches; npm com dois pacotes moderados ligados ao React Router, sem avisos altos/críticos.

## Pendências antes do aceite e da release

Faltam contas demo ativas de recepção/veterinário, aceite manual por perfil, análise dos avisos moderados do Router, restauração real de backup e capturas. Não houve E2E de navegador nesta sessão. Nenhum dado histórico MariaDB, senha, `.env` local ou SQLite foi publicado.

Consulte [o relatório de homologação](homologacao.md) para evidências e limitações. Esta branch prepara a revisão; não inclui merge na main, release v1.0.0 ou declaração de prontidão de produção.
