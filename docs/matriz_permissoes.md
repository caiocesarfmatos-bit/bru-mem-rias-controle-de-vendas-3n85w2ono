# Matriz de Permissões por Perfil — Bru Memórias

## 1. Definição dos Perfis de Acesso

O sistema administrativo conta com 6 perfis padronizados de colaboradores:

1. **Administrador:** Acesso irrestrito a todas as funções, incluindo governança de usuários, auditoria e tabelas estruturais.
2. **Gestor:** Gestão operacional, relatórios, aprovação de descontos, ajustes de inventário e compras.
3. **Vendedor:** Criação de orçamentos, pedidos de venda e cadastro de clientes; restrito para descontos especiais e cancelamento.
4. **Operador de Caixa:** Efetivação de pagamentos, baixa de recebimentos em caixa físico e emissão de recibos.
5. **Estoquista:** Conferência de inventário, registro de entradas de compras e requisições de insumos.
6. **Consulta:** Leitura restrita sem permissão de gravação, alteração de preço ou baixa financeira.

---

## 2. Matriz de Autorização por Operação

| Operação                | Administrador | Gestor | Vendedor | Operador Caixa | Estoquista | Consulta |
| ----------------------- | :-----------: | :----: | :------: | :------------: | :--------: | :------: |
| `administrar_usuarios`  |      SIM      |  NÃO   |   NÃO    |      NÃO       |    NÃO     |   NÃO    |
| `alterar_preco`         |      SIM      |  SIM   |   NÃO    |      NÃO       |    NÃO     |   NÃO    |
| `conceder_desconto`     |      SIM      |  SIM   | LIMITADO |      NÃO       |    NÃO     |   NÃO    |
| `cadastrar_cliente`     |      SIM      |  SIM   |   SIM    |      NÃO       |    NÃO     |   NÃO    |
| `cadastrar_fornecedor`  |      SIM      |  SIM   |   NÃO    |      NÃO       |    SIM     |   NÃO    |
| `lancar_ajuste_estoque` |      SIM      |  SIM   |   NÃO    |      NÃO       |    SIM     |   NÃO    |
| `dar_baixa_caixa`       |      SIM      |  SIM   |   NÃO    |      SIM       |    NÃO     |   NÃO    |
| `cancelar_pedido`       |      SIM      |  SIM   |   NÃO    |      NÃO       |    NÃO     |   NÃO    |
| `cancelar_lancamento`   |      SIM      |  SIM   |   NÃO    |      NÃO       |    NÃO     |   NÃO    |
| `exportar_relatorio`    |      SIM      |  SIM   |   NÃO    |      NÃO       |    NÃO     |   NÃO    |
| `visualizar_auditoria`  |      SIM      |  SIM   |   NÃO    |      NÃO       |    NÃO     |   NÃO    |

_Regra de Segurança:_ Esta matriz é avaliada tanto na interface quanto nas regras de coleção e hooks de autorização do PocketBase.
