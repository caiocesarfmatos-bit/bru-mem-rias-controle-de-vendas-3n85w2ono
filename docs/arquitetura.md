# Arquitetura e Decisões de Sistema — Bru Memórias Controle de Vendas

## 1. Autenticação e Perfis de Acesso

- O sistema opera conectado ao backend Skip Cloud (PocketBase v0.36) na coleção `_pb_users_auth_` (alias `users`).
- O usuário Administrador principal é `caiocesarfmatos@gmail.com`.
- Perfis suportados: `administrador`, `gestor`, `vendedor`, `operador_caixa`, `estoquista`, `consulta`.

## 2. Exclusão Consciente: Remoção de Desligamento Automático por Inatividade

- **Decisão:** Conforme solicitação direta e explícita do usuário, o sistema **NÃO** desloga nem bloqueia a tela por inatividade.
- **Motivação:** O Administrador e os operadores frequentemente deixam tarefas em aberto e precisam retornar sem perda de contexto ou risco de bloqueio intempestivo. Os dados são persistidos atomicamente no ato de cada operação no servidor, eliminando o risco de perda.
- **Implementação:** Foi removido qualquer timer de inatividade ou bloqueio de tela automático no front-end (`AppV5Context.tsx` e fluxos correlatos). A sessão é mantida até que o usuário clique ativamente em "Sair" ou encerre o navegador.

## 3. Rotina de Backup Automático e Robotizado

- **Agendamento:** 3 vezes ao dia nos horários oficiais de Brasília (America/Sao_Paulo / UTC-3):
  - **10:00 Brasília** (13:00 UTC)
  - **17:00 Brasília** (20:00 UTC)
  - **23:00 Brasília** (02:00 UTC do dia seguinte)
- **Mecanismo:** Registrado diretamente no servidor via PocketBase pb_hooks com a função `cronAdd`. Executa de forma robotizada tanto com o app online quanto offline.
- **Abrangência:** Cobre 21 coleções vitais do sistema:
  1. `tabela_valores`
  2. `pessoas`
  3. `papel_cliente`
  4. `papel_fornecedor`
  5. `contatos`
  6. `enderecos`
  7. `redes_sociais`
  8. `categorias_produto`
  9. `produtos`
  10. `tabelas_preco`
  11. `precos_produto`
  12. `produto_fornecedor`
  13. `locais_estoque`
  14. `movimento_estoque`
  15. `pedidos_venda`
  16. `itens_pedido`
  17. `pagamentos_pedido`
  18. `contas_financeiras`
  19. `categorias_financeiras`
  20. `lancamentos_financeiros`
  21. `logs_auditoria`
- **Persistência e Histórico:** Cada execução gera um snapshot integral gravado na coleção `backups_sistema` com data/hora, status (`ok` ou `falha`), contagens por coleção e tamanho em bytes.
- **Auditoria:** Toda execução (automática ou manual) é registrada de forma imutável na coleção `logs_auditoria`. Em caso de erro, a falha é registrada com detalhes e nunca é silenciada.
- **Disponibilidade:** Na Central Administrativa (aba "Centro de Backup"), o Administrador visualiza o histórico de todas as execuções e pode baixar o arquivo JSON de qualquer snapshot salvo com 1 clique.
