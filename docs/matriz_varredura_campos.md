# Matriz de Varredura Campo a Campo — Bru Memórias

Auditoria de rastreabilidade completa conforme Seção 14:  
**Banco de Dados (PocketBase) -> API/Servidor (Hooks) -> Tela/Frontend -> Relatórios -> Exportação**

---

| Camada         | Tela / Módulo | Entidade e Campo                                  | Verificações Aprovadas                                       | Não Conformidade Detectada                       | Correção Aplicada                                                                      |
| -------------- | ------------- | ------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------- |
| Banco -> Tela  | Pessoas       | `pessoas.documento`                               | Unicidade no banco, sem máscara no banco, validação CPF/CNPJ | Nenhuma                                          | Normalização para apenas números antes de gravar e máscara aplicada apenas na exibição |
| Banco -> Tela  | Pessoas       | `pessoas.tipo_pessoa`                             | Domínio restrito (FISICA/JURIDICA), select obrigatório       | Nenhuma                                          | Validado na criação com tipos de documento correspondentes                             |
| Banco -> API   | Contatos      | `contatos.papel` = 'recado'                       | Nome próprio obrigatório                                     | Usuário poderia deixar em branco                 | Hook `contatos.pb.js` rejeita com erro se não houver nome com >= 2 caracteres          |
| Banco -> API   | Contatos      | `contatos.whatsapp`                               | Formato E.164 com DDI                                        | Possibilidade de formato com parênteses e traços | Função `normalizarTelefoneE164` adiciona prefixo `+55` e remove máscaras               |
| Banco -> Tela  | Endereços     | `enderecos.cep`                                   | Apenas 8 dígitos                                             | Digitação com hífen                              | Normalização automática `replace(/\D/g, '')`                                           |
| Banco -> API   | Produtos      | `produtos.sku`                                    | Unicidade no banco, alfanumérico                             | Nenhuma                                          | Índice UNIQUE criado na migração `0001`                                                |
| Regra          | Produtos      | Preço de venda                                    | Proibição de preço no produto                                | Campo não pode existir na tabela `produtos`      | Preço segregado na tabela `precos_produto` com histórico e vigência (R4)               |
| Regra          | Produtos      | Fornecedor                                        | Proibição de fornecedor no produto                           | Não deve ser coluna de `produtos`                | Relação N:N segregada na tabela `produto_fornecedor`                                   |
| Banco -> API   | Preços        | `precos_produto.data_fim_vigencia`                | Sem duplicidade de vigência                                  | Podia haver 2 preços vigentes                    | Hook server-side `precos_produto` bloqueia novo preço sem encerrar anterior (R4)       |
| Banco -> Tela  | Formas Pagto  | `pagamentos_pedido.forma_pagamento`               | Lista restrita da `tabela_valores`                           | Proibido texto livre                             | Restrito a `PIX`, `CREDITO`, `DEBITO`, `LINK`, `DINHEIRO`                              |
| Banco -> API   | Vendas        | Fechamento de Pagamentos                          | Tolerância zero R11                                          | Risco de arredondamento                          | Hook `confirmar-venda` compara a soma exata de centavos com o total do pedido          |
| Banco -> API   | Vendas        | Estoque na Venda                                  | Baixa atômica e bloqueio de negativo                         | Risco de estoque negativo                        | Verificação dentro de `txApp.runInTransaction` no hook de confirmação de venda         |
| Banco -> Tela  | Itens Pedido  | Snapshot de Preço e Custo                         | Imutabilidade após gravação                                  | Consulta ao cadastro posterior                   | Preço unitário e custo do momento gravados diretamente no item (R12)                   |
| Banco -> Tela  | Financeiro    | `lancamentos.data_competencia` e `data_pagamento` | Proibido fundir                                              | Não podem ser a mesma coluna                     | Campos segregados em tela e no banco com visões de caixa realizado e projetado         |
| API -> Tela    | Financeiro    | Idempotência de Baixa                             | Chave anti-duplicação                                        | Duplo clique no cliente                          | Chave de idempotência única gerada e indexada no banco                                 |
| Banco -> API   | Estoque       | `movimento_estoque`                               | Imutabilidade e vínculo a documento                          | Proibido edição/exclusão direta                  | `updateRule: null`, `deleteRule: null` nas regras da coleção (R5/R6)                   |
| Tela -> Export | Relatórios    | Exportação CSV                                    | Permissão por perfil e separação                             | Nenhuma                                          | Exportação formatada em ponto e vírgula com dados consolidados                         |

---

_Status da Varredura:_ 100% dos campos críticos auditados e conformes com a arquitetura relacional.
