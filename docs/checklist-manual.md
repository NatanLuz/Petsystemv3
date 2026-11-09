# Homologação manual e capturas

Status inicial: **pendente**. Não há execução E2E de navegador nesta sessão. Os testes de API e de funções JavaScript não substituem este aceite visual. Registre data, perfil, navegador, resultado e evidência sanitizada de cada item.

## Ambiente descartável obrigatório

Para testar gravações e exclusões, use uma cópia separada do projeto e um SQLite novo. Não copie o SQLite persistente nem os `.env` locais. Exemplo: clone a branch de finalização em outra pasta, siga `setup.md`, configure `.env.demo` com chave própria e `DB_DATABASE` apontando para `backend/database/petsystem_demo.sqlite` **da nova pasta**, e inicialize somente esse banco novo com migrations e `DemoDataSeeder`. Crie as três contas pelo comando interativo, com senhas escolhidas no terminal. O script de criação exige o caminho demo dentro da própria cópia.

Use dados fictícios e e-mails `example.invalid`. Pare os servidores que você mesmo iniciou antes de iniciar a cópia descartável nas mesmas portas; confira a finalidade dos demais processos. Nunca use `migrate:fresh` na demonstração persistente. Não reutilize senhas do cliente. No DevTools, inspecione as respostas sem compartilhar cookies, tokens ou cabeçalhos de autenticação.

## Checklist de aceite

- [ ] Em cada perfil, login válido abre a aplicação; senha incorreta mostra erro; logout impede voltar a consultar dados protegidos.
- [ ] Atualizar a página mantém a sessão. Sessão expirada redireciona ao login. Requisição de escrita sem CSRF válido retorna 419 sem gravar.
- [ ] Admin: criar cliente fictício, rejeitar telefone/e-mail duplicado, cadastrar pet vinculado; atualizar e recarregar para conferir persistência e código público estável.
- [ ] Conferir ficha do cliente/pet, históricos, alergias e alertas; impedir exclusão de cliente/pet com vínculos. Testar exclusão somente em registros descartáveis sem vínculos.
- [ ] Admin: cadastrar serviço, editar preço/duração e desativar. Recepção/veterinário não podem alterar serviços por requisição direta; veterinário não recebe preço na resposta.
- [ ] Agendar pet com serviço ativo em data futura. Sobreposição para o mesmo pet deve ser recusada; horário adjacente é permitido. Reagendamento e cancelamento exigem motivo.
- [ ] Confirmar agendamento e iniciar atendimento; rejeitar início sem confirmação e segundo atendimento para o mesmo agendamento.
- [ ] Recepção: iniciar atendimento agendado com valor e forma de pagamento; reabrir e verificar que os valores foram preservados. Este é um cenário de regressão desta finalização.
- [ ] Veterinário: iniciar atendimento agendado com evolução; reabrir e conferir que foi preservada. Também é cenário de regressão.
- [ ] Atendimento avulso: escolher tutor, pet pertencente ao tutor e serviços ativos. Rejeitar vínculo incompatível.
- [ ] Veterinário: registrar evolução e concluir; recusar conclusão sem evolução. Recepção não pode registrar evolução nem concluir, mesmo por API direta.
- [ ] Admin: editar pagamento após conclusão sem erro 422 e sem alterar a data de conclusão. Recepção também pode ajustar pagamento; atendimento concluído não pode ser reaberto nem excluído.
- [ ] Recepção: respostas de atendimentos e históricos do pet/cliente não contêm `evolution`. Veterinário: não contêm `price`, `amount_charged`, `payment_method` ou preço em `pivot`; `/api/dashboard/metrics` retorna 403.
- [ ] Dashboard admin/recepção: conferir total de clientes/pets, agenda do dia e soma mensal apenas dos atendimentos concluídos. Veterinário não vê financeiro. Valor lançado é registro interno, sem transação bancária.
- [ ] Testar busca por cliente/pet/serviço/status, filtro de data, paginação, campos obrigatórios, mensagens de validação, lista vazia e botão de tentar novamente após falha de rede.
- [ ] Reiniciar somente os servidores da cópia descartável e confirmar persistência dos registros nela.
- [ ] Executar o ensaio de restauração de um backup em ambiente separado conforme `backup.md` e registrar o resultado.
- [ ] Capturar as cinco telas de `img/README.md` e obter aceite do proprietário para release.

Os testes de API já exercitam controle de acesso direto, sessão, CSRF, validações e persistência em SQLite em memória. Este checklist continua pendente até execução humana documentada; não marcar itens apenas porque há teste automatizado semelhante.
