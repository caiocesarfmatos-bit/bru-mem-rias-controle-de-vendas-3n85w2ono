# Dicionário de Dados — Bru Memórias

Tabelas, tipos de dados, obrigatoriedades e regras de validação.  
_Nota técnica:_ Valores monetários são armazenados como números inteiros de centavos (ex: R$ 59,90 = `5990`).

---

### 1. `tabela_valores` (Domínio Central de Listas)

| Campo         | Tipo      | Obr | Validação / Regra                                                      |
| ------------- | --------- | --- | ---------------------------------------------------------------------- |
| `id`          | text (PK) | Sim | ID padrão PocketBase (15 caracteres)                                   |
| `dominio`     | text      | Sim | Ex: `forma_pagamento`, `tipo_pessoa`, `papel_contato`, `status_pedido` |
| `codigo`      | text      | Sim | Ex: `PIX`, `CREDITO`, `DEBITO`, `LINK`, `DINHEIRO`                     |
| `rotulo`      | text      | Sim | Nome legível exibido em telas e relatórios (ex: "Pix")                 |
| `ordem`       | number    | Sim | Ordem de exibição na interface (inteiro)                               |
| `ativo`       | bool      | Não | Indicador se a opção está ativa para seleção                           |
| `regras_json` | json      | Não | Configurações adicionais (ex: exige comprovante, parcelamento)         |

### 2. `pessoas` (Base Unificada de Clientes e Fornecedores)

| Campo                | Tipo      | Obr | Validação / Regra                                      |
| -------------------- | --------- | --- | ------------------------------------------------------ |
| `id`                 | text (PK) | Sim | ID gerado pelo PocketBase                              |
| `tipo_pessoa`        | text      | Sim | `FISICA` ou `JURIDICA`                                 |
| `documento`          | text      | Sim | CPF (11 dígitos) ou CNPJ (14 dígitos), UNIQUE no banco |
| `nome_razao_social`  | text      | Sim | Nome da pessoa física ou razão social da PJ            |
| `nome_fantasia`      | text      | Não | Nome fantasia para PJ                                  |
| `inscricao_estadual` | text      | Não | Inscrição estadual (vazio para isento)                 |
| `status`             | text      | Sim | `ativo`, `inativo`, `bloqueado`                        |
| `data_cadastro`      | date      | Sim | Data do registro civil/comercial                       |
| `observacao_interna` | text      | Não | Notas internas de atendimento                          |

### 3. `papel_cliente`

| Campo                          | Tipo      | Obr | Validação / Regra                               |
| ------------------------------ | --------- | --- | ----------------------------------------------- |
| `id`                           | text (PK) | Sim | ID gerado pelo PocketBase                       |
| `pessoa`                       | relation  | Sim | FK para `pessoas`                               |
| `status`                       | text      | Sim | `ativo`, `bloqueado`, `em_avaliacao`            |
| `limite_credito_centavos`      | number    | Não | Limite para faturamento a prazo (em centavos)   |
| `forma_pagamento_preferencial` | text      | Não | Código da forma na `tabela_valores` (PIX, etc.) |
| `vendedor_responsavel`         | relation  | Não | FK para `users`                                 |

### 4. `papel_fornecedor`

| Campo                       | Tipo      | Obr | Validação / Regra                    |
| --------------------------- | --------- | --- | ------------------------------------ |
| `id`                        | text (PK) | Sim | ID gerado pelo PocketBase            |
| `pessoa`                    | relation  | Sim | FK para `pessoas`                    |
| `status`                    | text      | Sim | `ativo`, `bloqueado`, `em_avaliacao` |
| `prazo_padrao_entrega_dias` | number    | Não | Prazo médio em dias corridos         |
| `condicao_pagamento_padrao` | text      | Não | Descrição da condição comercial      |

### 5. `contatos`

| Campo             | Tipo      | Obr | Validação / Regra                                       |
| ----------------- | --------- | --- | ------------------------------------------------------- |
| `id`              | text (PK) | Sim | ID gerado pelo PocketBase                               |
| `pessoa`          | relation  | Sim | FK para `pessoas`                                       |
| `nome_contato`    | text      | Sim | Nome da pessoa de contato (obrigatório se recado)       |
| `papel`           | text      | Sim | `comercial`, `financeiro`, `recado`, `entrega`, `outro` |
| `telefone_fixo`   | text      | Não | Formato E.164                                           |
| `celular`         | text      | Não | Formato E.164                                           |
| `whatsapp`        | text      | Não | Formato E.164 com DDI (+55...)                          |
| `email`           | text      | Não | E-mail corporativo/pessoal válido                       |
| `is_preferencial` | bool      | Não | Máximo de 1 preferencial por papel                      |

### 6. `enderecos`

| Campo          | Tipo      | Obr | Validação / Regra                        |
| -------------- | --------- | --- | ---------------------------------------- |
| `id`           | text (PK) | Sim | ID gerado pelo PocketBase                |
| `pessoa`       | relation  | Sim | FK para `pessoas`                        |
| `tipo`         | text      | Sim | `fiscal`, `entrega`, `cobranca`          |
| `cep`          | text      | Sim | 8 dígitos numéricos (sem hífen)          |
| `logradouro`   | text      | Sim | Rua, Avenida, etc.                       |
| `numero`       | text      | Sim | Número do imóvel ou S/N                  |
| `complemento`  | text      | Não | Apto, Sala, Bloco                        |
| `bairro`       | text      | Sim | Bairro                                   |
| `cidade`       | text      | Sim | Município                                |
| `uf`           | text      | Sim | 2 letras maiúsculas                      |
| `pais`         | text      | Sim | Padrão: "Brasil"                         |
| `is_principal` | bool      | Não | Indicador de endereço principal por tipo |

### 7. `redes_sociais`

| Campo           | Tipo      | Obr | Validação / Regra                                          |
| --------------- | --------- | --- | ---------------------------------------------------------- |
| `id`            | text (PK) | Sim | ID gerado pelo PocketBase                                  |
| `pessoa`        | relation  | Sim | FK para `pessoas`                                          |
| `tipo_rede`     | text      | Sim | `instagram`, `facebook`, `tiktok`, `pinterest`, `linkedin` |
| `identificador` | text      | Sim | Handle (ex: `@brumemorias`)                                |
| `url_completa`  | text      | Sim | URL HTTP/HTTPS validada                                    |
| `is_oficial`    | bool      | Não | Indicador de canal oficial                                 |

### 8. `categorias_produto`

| Campo           | Tipo      | Obr | Validação / Regra            |
| --------------- | --------- | --- | ---------------------------- |
| `id`            | text (PK) | Sim | ID gerado pelo PocketBase    |
| `nome`          | text      | Sim | Nome da categoria de produto |
| `categoria_pai` | relation  | Não | Hierarquia auto-referenciada |
| `descricao`     | text      | Não | Detalhamento                 |

### 9. `produtos`

| Campo               | Tipo      | Obr | Validação / Regra                           |
| ------------------- | --------- | --- | ------------------------------------------- |
| `id`                | text (PK) | Sim | ID gerado pelo PocketBase                   |
| `sku`               | text      | Sim | Código alfanumérico único (UNIQUE no banco) |
| `codigo_barras`     | text      | Não | EAN-13 quando existente                     |
| `nome`              | text      | Sim | Nome do produto                             |
| `descricao_curta`   | text      | Não | Descrição sucinta                           |
| `categoria`         | relation  | Não | FK para `categorias_produto`                |
| `unidade_compra`    | text      | Sim | Ex: UN, CX, KG, M2, FL                      |
| `unidade_venda`     | text      | Sim | Ex: UN, KIT, PACOTE                         |
| `fator_conversao`   | number    | Sim | Fator > 0 (ex: 1 CX = 100 UN)               |
| `estoque_minimo`    | number    | Não | Ponto de reposição                          |
| `controla_lote`     | bool      | Não | Booleano para rastreio de lote/validade     |
| `status`            | text      | Sim | `ativo`, `inativo`, `descontinuado`         |
| `campo_fiscal_ncm`  | text      | Não | Reservado e vazio na v1                     |
| `campo_fiscal_cfop` | text      | Não | Reservado e vazio na v1                     |

### 10. `tabelas_preco`

| Campo          | Tipo      | Obr | Validação / Regra                           |
| -------------- | --------- | --- | ------------------------------------------- |
| `id`           | text (PK) | Sim | ID gerado pelo PocketBase                   |
| `nome`         | text      | Sim | Ex: "Varejo Oficial", "Atacado & Parcerias" |
| `moeda`        | text      | Sim | Padrão: "BRL"                               |
| `publico_alvo` | text      | Sim | `varejo`, `atacado`, `contrato`             |
| `status`       | text      | Sim | `ativo`, `inativo`                          |

### 11. `precos_produto`

| Campo                   | Tipo      | Obr | Validação / Regra                       |
| ----------------------- | --------- | --- | --------------------------------------- |
| `id`                    | text (PK) | Sim | ID gerado pelo PocketBase               |
| `produto`               | relation  | Sim | FK para `produtos`                      |
| `tabela_preco`          | relation  | Sim | FK para `tabelas_preco`                 |
| `valor_centavos`        | number    | Sim | Preço oficial de venda em centavos      |
| `preco_minimo_centavos` | number    | Sim | Preço piso com margem de segurança      |
| `data_inicio_vigencia`  | date      | Sim | Início da vigência do preço             |
| `data_fim_vigencia`     | date      | Não | Data final (nula se atualmente vigente) |
| `usuario_responsavel`   | relation  | Sim | FK para `users`                         |
| `motivo_alteracao`      | text      | Não | Justificativa do reajuste               |

### 12. `produto_fornecedor` (N:N)

| Campo                      | Tipo      | Obr | Validação / Regra                       |
| -------------------------- | --------- | --- | --------------------------------------- |
| `id`                       | text (PK) | Sim | ID gerado pelo PocketBase               |
| `produto`                  | relation  | Sim | FK para `produtos`                      |
| `fornecedor`               | relation  | Sim | FK para `papel_fornecedor` ou `pessoas` |
| `codigo_item_fornecedor`   | text      | Não | Código do catálogo do fornecedor        |
| `custo_acordado_centavos`  | number    | Sim | Custo unitário de compra em centavos    |
| `prazo_entrega_dias`       | number    | Não | Prazo do fornecedor                     |
| `quantidade_minima_pedido` | number    | Não | Lote mínimo                             |
| `is_preferencial`          | bool      | Não | Indicador de fornecedor primário        |

### 13. `locais_estoque`

| Campo  | Tipo      | Obr | Validação / Regra                              |
| ------ | --------- | --- | ---------------------------------------------- |
| `id`   | text (PK) | Sim | ID gerado pelo PocketBase                      |
| `nome` | text      | Sim | Ex: "Ateliê Principal Recreio", "Mostruário"   |
| `tipo` | text      | Sim | `deposito_principal`, `mostruario`, `defeitos` |

### 14. `movimento_estoque` (IMUTÁVEL)

| Campo                      | Tipo      | Obr | Validação / Regra                                                   |
| -------------------------- | --------- | --- | ------------------------------------------------------------------- |
| `id`                       | text (PK) | Sim | ID gerado pelo PocketBase                                           |
| `produto`                  | relation  | Sim | FK para `produtos`                                                  |
| `local`                    | relation  | Sim | FK para `locais_estoque`                                            |
| `tipo`                     | text      | Sim | `entrada`, `saida`, `ajuste`, `devolucao`, `transferencia`, `perda` |
| `quantidade`               | number    | Sim | Quantidade com sinal (+/-)                                          |
| `custo_unitario_centavos`  | number    | Sim | Custo unitário do momento                                           |
| `lote`                     | text      | Não | Identificador de lote                                               |
| `data_validade`            | date      | Não | Validade do insumo/produto                                          |
| `documento_origem_tipo`    | text      | Não | `pedido_venda`, `pedido_compra`, `ajuste_inventario`                |
| `documento_origem_id`      | text      | Não | ID do documento de origem                                           |
| `movimento_origem_estorno` | text      | Não | Vínculo ao movimento original caso seja estorno                     |
| `usuario`                  | relation  | Sim | FK para `users`                                                     |
| `data_hora`                | date      | Sim | Timestamp                                                           |
| `observacao`               | text      | Não | Justificativa do movimento                                          |

### 15. `pedidos_venda`

| Campo                  | Tipo      | Obr | Validação / Regra                                              |
| ---------------------- | --------- | --- | -------------------------------------------------------------- |
| `id`                   | text (PK) | Sim | ID gerado pelo PocketBase                                      |
| `numero_sequencial`    | number    | Sim | Sequencial incremental                                         |
| `cliente`              | relation  | Sim | FK para `pessoas`                                              |
| `data_emissao`         | date      | Sim | Data e hora da criação                                         |
| `vendedor_responsavel` | relation  | Sim | FK para `users`                                                |
| `status`               | text      | Sim | `rascunho`, `confirmado`, `faturado`, `cancelado`, `devolvido` |
| `subtotal_centavos`    | number    | Sim | Soma de itens em centavos                                      |
| `desconto_centavos`    | number    | Sim | Desconto total em centavos                                     |
| `acrescimo_centavos`   | number    | Sim | Frete/outros em centavos                                       |
| `total_centavos`       | number    | Sim | `subtotal - desconto + acrescimo`                              |
| `observacao`           | text      | Não | Observação do pedido                                           |
| `usuario`              | relation  | Sim | FK para `users` que operou                                     |

### 16. `itens_pedido`

| Campo                               | Tipo      | Obr | Validação / Regra                 |
| ----------------------------------- | --------- | --- | --------------------------------- |
| `id`                                | text (PK) | Sim | ID gerado pelo PocketBase         |
| `pedido`                            | relation  | Sim | FK para `pedidos_venda`           |
| `produto`                           | relation  | Sim | FK para `produtos`                |
| `local_estoque`                     | relation  | Sim | FK para `locais_estoque`          |
| `quantidade`                        | number    | Sim | Quantidade do item (> 0)          |
| `preco_unitario_praticado_centavos` | number    | Sim | Preço gravado imutável            |
| `custo_unitario_momento_centavos`   | number    | Sim | Custo gravado imutável            |
| `desconto_item_centavos`            | number    | Não | Desconto específico               |
| `total_item_centavos`               | number    | Sim | `(quantidade * preco) - desconto` |

### 17. `pagamentos_pedido`

| Campo                     | Tipo      | Obr | Validação / Regra                                              |
| ------------------------- | --------- | --- | -------------------------------------------------------------- |
| `id`                      | text (PK) | Sim | ID gerado pelo PocketBase                                      |
| `pedido`                  | relation  | Sim | FK para `pedidos_venda`                                        |
| `forma_pagamento`         | text      | Sim | Código estrito: `PIX`, `CREDITO`, `DEBITO`, `LINK`, `DINHEIRO` |
| `valor_centavos`          | number    | Sim | Valor desta parcela/forma em centavos                          |
| `quantidade_parcelas`     | number    | Não | Parcelas no cartão de crédito (mínimo 1)                       |
| `identificador_transacao` | text      | Não | ID de link, NSU ou comprovante                                 |
| `status`                  | text      | Sim | `pendente`, `aprovado`, `estornado`, `cancelado`               |
| `data_previsao`           | date      | Sim | Data esperada de liquidação                                    |
| `data_efetivacao`         | date      | Não | Data da confirmação bancária                                   |
| `usuario`                 | relation  | Sim | FK para `users`                                                |

### 18. `contas_financeiras`

| Campo                    | Tipo      | Obr | Validação / Regra                            |
| ------------------------ | --------- | --- | -------------------------------------------- |
| `id`                     | text (PK) | Sim | ID gerado pelo PocketBase                    |
| `nome`                   | text      | Sim | Ex: "Caixa Físico Ateliê", "Conta Santander" |
| `tipo`                   | text      | Sim | `caixa_fisico`, `banco`                      |
| `saldo_inicial_centavos` | number    | Sim | Saldo de abertura em centavos                |
| `data_saldo_inicial`     | date      | Sim | Data base do saldo inicial                   |
| `status`                 | text      | Sim | `ativo`, `inativo`                           |

### 19. `categorias_financeiras`

| Campo           | Tipo      | Obr | Validação / Regra                     |
| --------------- | --------- | --- | ------------------------------------- |
| `id`            | text (PK) | Sim | ID gerado pelo PocketBase             |
| `nome`          | text      | Sim | Nome do plano de contas               |
| `natureza`      | text      | Sim | `receita`, `despesa`, `transferencia` |
| `categoria_pai` | relation  | Não | Subcategoria hierárquica              |

### 20. `lancamentos_financeiros`

| Campo                       | Tipo      | Obr | Validação / Regra                            |
| --------------------------- | --------- | --- | -------------------------------------------- |
| `id`                        | text (PK) | Sim | ID gerado pelo PocketBase                    |
| `tipo`                      | text      | Sim | `entrada`, `saida`, `transferencia`          |
| `valor_centavos`            | number    | Sim | Valor absoluto em centavos                   |
| `moeda`                     | text      | Sim | "BRL"                                        |
| `conta_financeira`          | relation  | Sim | FK para `contas_financeiras`                 |
| `categoria_financeira`      | relation  | Sim | FK para `categorias_financeiras`             |
| `centro_custo`              | text      | Não | Opcional                                     |
| `data_competencia`          | date      | Sim | Data do fato gerador (SEPARADO)              |
| `data_vencimento`           | date      | Sim | Data de vencimento do título                 |
| `data_pagamento`            | date      | Não | Data da efetivação (SEPARADO)                |
| `status`                    | text      | Sim | `previsto`, `realizado`, `cancelado`         |
| `parte_envolvida`           | relation  | Não | FK para `pessoas`                            |
| `documento_origem_tipo`     | text      | Não | `pedido_venda`, `pedido_compra`, `avulso`    |
| `documento_origem_id`       | text      | Não | ID do documento de origem                    |
| `lancamento_origem_estorno` | text      | Não | Vínculo ao lançamento original se estorno    |
| `forma_pagamento`           | text      | Não | Forma utilizada (da `tabela_valores`)        |
| `chave_idempotencia`        | text      | Não | Chave anti-duplicação (UNIQUE se preenchida) |
| `usuario`                   | relation  | Sim | FK para `users`                              |
| `observacao`                | text      | Não | Justificativa                                |

### 21. `logs_auditoria` (IMUTÁVEL)

| Campo                    | Tipo      | Obr | Validação / Regra                                    |
| ------------------------ | --------- | --- | ---------------------------------------------------- |
| `id`                     | text (PK) | Sim | ID gerado pelo PocketBase                            |
| `entidade`               | text      | Sim | Nome da tabela/coleção auditada                      |
| `identificador_registro` | text      | Sim | ID do registro afetado                               |
| `campo`                  | text      | Não | Campo modificado (ou `REGISTRO_COMPLETO`)            |
| `valor_anterior`         | text      | Não | JSON ou valor texto anterior                         |
| `valor_novo`             | text      | Não | JSON ou valor texto novo                             |
| `usuario`                | relation  | Não | FK para `users`                                      |
| `data_hora`              | date      | Sim | Carimbo de data/hora oficial                         |
| `origem`                 | text      | Sim | `tela`, `importacao`, `integracao`, `transacao_hook` |
| `endereco_ip`            | text      | Não | IP registrado na requisição                          |
