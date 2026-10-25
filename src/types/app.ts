// Tipos e modelos de dados para o Bru Memórias | Controle de Vendas

export type TabId = 'custos' | 'calculadora' | 'clientes' | 'fornecedores' | 'estoque' | 'painel'

export interface CustoLancamento {
  id: string
  data: string // YYYY-MM-DD
  descricao: string
  valor: number
  criadoEm: string // ISO
}

export interface CustoItem {
  id: string
  nome: string
  custoBase: number
  unidadesCobertas: number // padrão 1
  lancamentos: CustoLancamento[]
}

export interface ProdutoKit {
  id: string
  nome: string
  unidadesLote: number // padrão 100
  itens: CustoItem[]
  criadoEm: string
}

export type OrderStatus = 'Orçamento' | 'Fechado' | 'Pago' | 'Entregue'

export interface PedidoCliente {
  id: string
  clienteId: string
  clienteNome: string
  produtoId: string
  produtoNome: string
  data: string // YYYY-MM-DD
  quantidade: number
  precoUnitario: number
  custoUnitario: number
  desconto: number
  impostosPct: number
  taxaCartaoPct: number
  frete: number
  receita: number
  custoTotal: number
  lucroBruto: number
  lucroLiquido: number
  margemPct: number
  status: OrderStatus
  observacoes?: string
  criadoEm: string
}

export interface Cliente {
  id: string
  nome: string
  endereco: string
  telefoneWhatsapp: string
  telefoneRecado: string
  email: string
  instagram: string
  facebook: string
  tiktok: string
  outrosCanais: string
  consentimentoLgpd: boolean
  dataCadastro: string // YYYY-MM-DD
  pedidos: PedidoCliente[]
}

export type LocalizacaoFornecedor = '📍 Recreio dos Bandeirantes' | 'Rio de Janeiro' | 'Online'

export interface Fornecedor {
  id: string
  insumoId: string // correspondente ao nome/id do insumo de custos
  insumoNome: string
  nome: string
  contato: string
  preco: number
  prazo: string
  avaliacao: number // 1 a 5
  link?: string
  localizacao: LocalizacaoFornecedor
  criadoEm: string
}

export type AuditModulo =
  | 'Custos'
  | 'Calculadora'
  | 'Clientes'
  | 'Fornecedores'
  | 'Estoque'
  | 'Painel'
  | 'Sistema'

export interface AuditEntry {
  id: string
  dataHora: string // ISO
  modulo: AuditModulo
  acao: string
  detalhe: string
}

export interface AppSettings {
  margemMinimaPct: number // padrão 40
  produtoAtivoId: string
  onboardingDispensado: boolean
  abaAtiva: TabId
}

export type TipoMovimentacaoEstoque = 'entrada' | 'saida'
export type MotivoMovimentacaoEstoque =
  | 'compra'
  | 'producao'
  | 'venda'
  | 'ajuste_perda'
  | 'devolucao'

export interface MovimentacaoEstoque {
  id: string
  itemId: string // id do insumo em estoque
  itemNome: string
  data: string // YYYY-MM-DD
  tipo: TipoMovimentacaoEstoque
  quantidade: number
  custoUnitario?: number // custo pago por unidade em caso de compra/entrada
  motivo: MotivoMovimentacaoEstoque
  observacao?: string
  refletirEmCustos?: boolean // se refletiu ou pode refletir no histórico de custos
  criadoEm: string // ISO
}

export interface InsumoEstoque {
  id: string
  nome: string
  categoria?: string
  unidade: string // un, pacote, folha, metro, pct, kit, etc.
  quantidadeAtual: number
  custoMedioUnitario: number
  estoqueMinimo: number
  criadoEm: string
}

export interface ProdutoProntoItem {
  id: string
  produtoId: string // vínculo com produto de custos se houver
  produtoNome: string
  quantidadeProduzida: number
  quantidadeVendida: number // calculada ou informada
  quantidadeDisponivel: number // produzida - vendida
  custoEstimadoUnitario: number // espelho/sincronizado do módulo Custos
  observacao?: string
  atualizadoEm: string
}

export interface EstoqueData {
  insumos: InsumoEstoque[]
  movimentacoes: MovimentacaoEstoque[]
  produtosProntos: ProdutoProntoItem[]
}

export interface AppData {
  produtos: ProdutoKit[]
  clientes: Cliente[]
  fornecedores: Fornecedor[]
  estoque?: EstoqueData
  version: number
}
