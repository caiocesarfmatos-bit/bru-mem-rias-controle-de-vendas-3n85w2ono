# Especificação das Transações e Falha Parcial — Bru Memórias

Todas as operações sensíveis do sistema operam sob atomicidade estrita (`app.runInTransaction`). Se qualquer passo falhar ou se uma regra de integridade for violada, o banco é revertido integralmente ao estado anterior e a resposta devolve um código de erro padronizado com identificador de correlação (`correlationId`).

---

## 1. Transação de Confirmação de Venda (`confirmar_venda`)

- **Objetivo:** Transformar um pedido de venda em status `rascunho` para `confirmado` e executar seus reflexos contábeis e de estoque.
- **Passos atômicos:**
  1. Bloqueio e leitura do `pedidos_venda` e de todos os seus `itens_pedido`.
  2. Validação da tolerância zero de pagamento: a soma de todos os `pagamentos_pedido` vinculados deve ser exatamente igual ao `total_centavos` do pedido. Divergência de até 1 centavo interrompe a transação.
  3. Verificação de estoque disponível: para cada item, valida se o saldo no `local_estoque` atende à quantidade. Se saldo insuficiente e política for bloquear estoque negativo (padrão), cancela a operação.
  4. Gravação de movimento de estoque de `saida` (`movimento_estoque`) para cada item, imutável, com `documento_origem_tipo = 'pedido_venda'` e `documento_origem_id = pedido.id`.
  5. Criação de lançamentos financeiros (`lancamento_financeiro`) em contas a receber para pagamentos pendentes, ou realizados caso já liquidado.
  6. Atualização do status do pedido para `confirmado`.
  7. Gravação de registro imutável em `logs_auditoria`.
- **Tratamento de falha parcial:** Caso ocorra erro de concorrência ou falta de saldo em qualquer item, todos os movimentos de estoque e lançamentos financeiros criados são descartados pelo rollback da transação SQLite.

---

## 2. Transação de Cancelamento de Pedido (`cancelar_venda`)

- **Objetivo:** Reverter os efeitos de um pedido previamente `confirmado` sem exclusão física.
- **Regra de Imutabilidade:** Proibido `DELETE` ou edição direta no histórico.
- **Passos atômicos:**
  1. Busca de todos os movimentos de saída associados ao pedido.
  2. Inserção de movimentos de estoque inversos vinculados (`tipo = 'devolucao'` ou `ajuste`), referenciando `movimento_origem_estorno = movimento_original.id`, recompondo o saldo do produto.
  3. Estorno de lançamentos financeiros: criação de lançamento inverso (estorno) com referência a `lancamento_origem_estorno`.
  4. Atualização do status do pedido para `cancelado` com justificativa obrigatória e autor.
  5. Gravação em `logs_auditoria`.

---

## 3. Transação de Ajuste de Inventário (`ajustar_estoque`)

- **Objetivo:** Corrigir contagem física de estoque.
- **Condições:**
  - Exige justificativa explícita (mínimo 5 caracteres).
  - Exige usuário autenticado com permissão `lancar_ajuste_estoque`.
  - Proibida alteração do saldo diretamente no cadastro do produto.
- **Passos atômicos:**
  1. Cálculo da diferença entre a contagem física informada e o saldo apurado da soma de movimentos.
  2. Criação de novo registro em `movimento_estoque` com `tipo = 'ajuste'`, quantidade com sinal (+/-) e justificativa.
  3. Registro em `logs_auditoria`.

---

## 4. Transação de Movimentação Financeira e Baixa (`baixar_lancamento`)

- **Objetivo:** Efetivar recebimento ou pagamento.
- **Passos atômicos:**
  1. Validação de data de pagamento informada (mantendo a data de competência original inalterada).
  2. Mudança de status para `realizado`.
  3. Validação de idempotência através da `chave_idempotencia` para prevenir duplicidade de clique ou repetição de requisição.
  4. Registro em `logs_auditoria`.
