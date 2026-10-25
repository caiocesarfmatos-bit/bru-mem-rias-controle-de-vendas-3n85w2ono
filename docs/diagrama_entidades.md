# Diagrama e Modelo de Entidades — Bru Memórias

## 1. Visão Geral das Entidades

O modelo de dados implementa a segregação entre pessoas físicas/jurídicas e seus respectivos papéis contratuais, histórico de vigência de preços, controle de estoques com rastreabilidade imutável, pedidos com pagamento misto estrito e lançamentos financeiros com segregação entre competência e liquidação.

```
+--------------------+        1:N       +----------------------+
|      pessoas       |------------------|   papel_cliente      |
|--------------------|                  +----------------------+
| id (PK)            |        1:N       +----------------------+
| tipo_pessoa (F/J)  |------------------|   papel_fornecedor   |
| documento (UNIQUE) |                  +----------------------+
| nome_razao_social  |        1:N       +----------------------+
| nome_fantasia      |------------------|   contatos           |
| status (ativo/...) |                  +----------------------+
| observacao_interna |        1:N       +----------------------+
+--------------------+------------------|   enderecos          |
         |                              +----------------------+
         | 1:N                          +----------------------+
         +------------------------------|   redes_sociais      |
                                        +----------------------+

+--------------------+        1:N       +----------------------+
|  categorias_prod   |------------------|      produtos        |
+--------------------+                  |----------------------|
                                        | id (PK)              |
+--------------------+                  | sku (UNIQUE)         |
| tabelas_preco      |                  | nome                 |
+--------------------+                  | unidade_venda        |
         | 1:N                          | fator_conversao      |
         v                              | controla_lote        |
+--------------------+        N:1       | status               |
|   precos_produto   |------------------+----------------------+
| (par prod+tabela   |                             | 1:N
| vigência única)    |                             v
+--------------------+                  +----------------------+
                                        |  produto_fornecedor  |
+--------------------+                  +----------------------+
|   locais_estoque   |                             | 1:N
+--------------------+                             v
         | 1:N                          +----------------------+
         +------------------------------|  movimento_estoque   |
                                        | (IMUTÁVEL)           |
                                        +----------------------+

+--------------------+        1:N       +----------------------+
|   pedidos_venda    |------------------|     itens_pedido     |
|--------------------|                  |----------------------|
| id (PK)            |                  | preco_unit_gravado   |
| numero_sequencial  |                  | custo_unit_gravado   |
| status (R/C/F/X/D) |                  +----------------------+
| subtotal_centavos  |        1:N       +----------------------+
| total_centavos     |------------------|   pagamentos_pedido  |
+--------------------+                  | (soma == total)      |
                                        +----------------------+

+--------------------+        1:N       +----------------------+
| contas_financeiras |------------------| lancamentos_fin      |
+--------------------+                  | (competencia !=      |
                                        |  pagamento)          |
+--------------------+                  +----------------------+
| categorias_fin     |
+--------------------+

+--------------------+                  +----------------------+
|  tabela_valores    |                  |    logs_auditoria    |
| (domínio central)  |                  |     (IMUTÁVEL)       |
+--------------------+                  +----------------------+
```

## 2. Cardinalidades e Regras de Integridade Relacional

1. **`pessoas` -> `papel_cliente` (1:0..1)**: Uma pessoa pode não ser cliente ou possuir um único papel ativo de cliente.
2. **`pessoas` -> `papel_fornecedor` (1:0..1)**: Uma pessoa pode ser fornecedora de insumos/serviços.
3. **`pessoas` -> `contatos` (1:N)**: Contatos tipados por papel (comercial, financeiro, recado, entrega). No máximo um canal preferencial por papel. Recado com nome próprio obrigatório.
4. **`pessoas` -> `enderecos` (1:N)**: Endereços com CEP padronizado em 8 dígitos, classificados por tipo (fiscal, entrega, cobrança). No máximo um principal por tipo.
5. **`produtos` -> `precos_produto` (1:N)**: Histórico de preços por tabela. Nunca há dois preços vigentes simultaneamente para a mesma combinação `produto + tabela_preco`.
6. **`produtos` -> `produto_fornecedor` (1:N)**: Relação N:N mapeando múltiplos fornecedores com códigos de item, custos e prazos de entrega.
7. **`pedidos_venda` -> `itens_pedido` (1:N)**: Cada item registra o preço unitário praticado e o custo unitário histórico no momento da venda.
8. **`pedidos_venda` -> `pagamentos_pedido` (1:N)**: Divisão de formas de pagamento estritamente da `tabela_valores` (PIX, CREDITO, DEBITO, LINK, DINHEIRO). A soma dos pagamentos fecha com tolerância zero com o total do pedido.
9. **`movimento_estoque`**: Cada registro referencia um produto, local, tipo e documento de origem (ou justificativa com autor). Imutável.
10. **`lancamento_financeiro`**: Registra data de competência e data de pagamento de forma segregada, com vínculo a documento de origem e idempotência.
