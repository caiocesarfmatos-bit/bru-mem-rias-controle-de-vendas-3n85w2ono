// src/types/sistema.ts
// Tipos unificados do modelo relacional Skip Cloud / PocketBase

export type PerfilUsuario =
  | 'administrador'
  | 'gestor'
  | 'vendedor'
  | 'operador_caixa'
  | 'estoquista'
  | 'consulta'

export type FormaPagamentoCodigo = 'PIX' | 'CREDITO' | 'DEBITO' | 'LINK' | 'DINHEIRO'

export type TipoPessoa = 'FISICA' | 'JURIDICA'
export type StatusPessoa = 'ativo' | 'inativo' | 'bloqueado'
export type StatusPapel = 'ativo' | 'bloqueado' | 'em_avaliacao'

export type PapelContato = 'comercial' | 'financeiro' | 'recado' | 'entrega' | 'outro'
export type TipoEndereco = 'fiscal' | 'entrega' | 'cobranca'
export type TipoRedeSocial =
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'pinterest'
  | 'linkedin'
  | 'outro'

export type StatusPedido = 'rascunho' | 'confirmado' | 'faturado' | 'cancelado' | 'devolvido'
export type StatusPagamento = 'pendente' | 'aprovado' | 'estornado' | 'cancelado'

export type TipoMovimentoEstoque =
  | 'entrada'
  | 'saida'
  | 'ajuste'
  | 'devolucao'
  | 'transferencia'
  | 'perda'
export type TipoContaFinanceira = 'caixa_fisico' | 'banco'
export type NaturezaCategoriaFin = 'receita' | 'despesa' | 'transferencia'
export type TipoLancamentoFin = 'entrada' | 'saida' | 'transferencia'
export type StatusLancamentoFin = 'previsto' | 'realizado' | 'cancelado'

export interface UsuarioSistema {
  id: string
  email: string
  name: string
  perfil: PerfilUsuario
  ativo: boolean
  bloqueado_ate?: string
  tentativas_falhas?: number
  created: string
  updated: string
}

export interface TabelaValorItem {
  id: string
  dominio: string
  codigo: string
  rotulo: string
  ordem: number
  ativo: boolean
  regras_json?: Record<string, unknown>
}

export interface Pessoa {
  id: string
  tipo_pessoa: TipoPessoa
  documento: string
  nome_razao_social: string
  nome_fantasia?: string
  inscricao_estadual?: string
  status: StatusPessoa
  data_cadastro?: string
  observacao_interna?: string
  created?: string
  updated?: string
  // Relações agregadas
  papel_cliente?: PapelCliente
  papel_fornecedor?: PapelFornecedor
  contatos?: Contato[]
  enderecos?: Endereco[]
  redes_sociais?: RedeSocial[]
}

export interface PapelCliente {
  id: string
  pessoa: string
  status: StatusPapel
  limite_credito_centavos?: number
  forma_pagamento_preferencial?: FormaPagamentoCodigo
  vendedor_responsavel?: string
}

export interface PapelFornecedor {
  id: string
  pessoa: string
  status: StatusPapel
  prazo_padrao_entrega_dias?: number
  condicao_pagamento_padrao?: string
}

export interface Contato {
  id: string
  pessoa: string
  nome_contato: string
  papel: PapelContato
  telefone_fixo?: string
  celular?: string
  whatsapp?: string
  email?: string
  is_preferencial?: boolean
}

export interface Endereco {
  id: string
  pessoa: string
  tipo: TipoEndereco
  cep: string
  logradouro: string
  numero: string
  complemento?: string
  bairro: string
  cidade: string
  uf: string
  pais?: string
  is_principal?: boolean
}

export interface RedeSocial {
  id: string
  pessoa: string
  tipo_rede: TipoRedeSocial
  identificador: string
  url_completa: string
  is_oficial?: boolean
}

export interface CategoriaProduto {
  id: string
  nome: string
  descricao?: string
}

export interface Produto {
  id: string
  sku: string
  codigo_barras?: string
  nome: string
  descricao_curta?: string
  categoria?: string
  unidade_compra: string
  unidade_venda: string
  fator_conversao: number
  estoque_minimo?: number
  controla_lote?: boolean
  status: 'ativo' | 'inativo' | 'descontinuado'
  campo_fiscal_ncm?: string
  campo_fiscal_cfop?: string
  preco_vigente_centavos?: number
  saldo_estoque?: number
}

export interface TabelaPreco {
  id: string
  nome: string
  moeda: string
  publico_alvo: 'varejo' | 'atacado' | 'contrato'
  status: 'ativo' | 'inativo'
}

export interface PrecoProduto {
  id: string
  produto: string
  tabela_preco: string
  valor_centavos: number
  preco_minimo_centavos: number
  data_inicio_vigencia: string
  data_fim_vigencia?: string
  usuario_responsavel: string
  motivo_alteracao?: string
}

export interface ProdutoFornecedor {
  id: string
  produto: string
  fornecedor: string
  codigo_item_fornecedor?: string
  custo_acordado_centavos: number
  prazo_entrega_dias?: number
  quantidade_minima_pedido?: number
  is_preferencial?: boolean
}

export interface LocalEstoque {
  id: string
  nome: string
  tipo: 'deposito_principal' | 'mostruario' | 'defeitos'
}

export interface MovimentoEstoque {
  id: string
  produto: string
  local: string
  tipo: TipoMovimentoEstoque
  quantidade: number
  custo_unitario_centavos: number
  lote?: string
  data_validade?: string
  documento_origem_tipo?: string
  documento_origem_id?: string
  movimento_origem_estorno?: string
  usuario: string
  data_hora: string
  observacao?: string
}

export interface PedidoVenda {
  id: string
  numero_sequencial: number
  cliente: string
  data_emissao: string
  vendedor_responsavel?: string
  status: StatusPedido
  subtotal_centavos: number
  desconto_centavos: number
  acrescimo_centavos: number
  total_centavos: number
  observacao?: string
  usuario?: string
  prazo_entrega_dias?: number
  data_limite_entrega?: string
  endereco_entrega_texto?: string
  foto_referencia?: string
  itens?: ItemPedido[]
  pagamentos?: PagamentoPedido[]
  cliente_expand?: Pessoa
}

export interface ItemPedido {
  id: string
  pedido: string
  produto: string
  local_estoque: string
  quantidade: number
  preco_unitario_praticado_centavos: number
  custo_unitario_momento_centavos: number
  desconto_item_centavos: number
  total_item_centavos: number
  tipo_item?: string
  modelo_item?: string
  foto_item?: string
  produto_expand?: Produto
}
export interface PagamentoPedido {
  id: string
  pedido: string
  forma_pagamento: FormaPagamentoCodigo
  valor_centavos: number
  quantidade_parcelas?: number
  identificador_transacao?: string
  status: StatusPagamento
  data_previsao: string
  data_efetivacao?: string
  usuario: string
}

export interface ContaFinanceira {
  id: string
  nome: string
  tipo: TipoContaFinanceira
  saldo_inicial_centavos: number
  data_saldo_inicial: string
  status: 'ativo' | 'inativo'
  saldo_atual_centavos?: number
}

export interface CategoriaFinanceira {
  id: string
  nome: string
  natureza: NaturezaCategoriaFin
}

export interface LancamentoFinanceiro {
  id: string
  tipo: TipoLancamentoFin
  valor_centavos: number
  moeda: string
  conta_financeira: string
  categoria_financeira: string
  centro_custo?: string
  data_competencia: string
  data_vencimento: string
  data_pagamento?: string
  status: StatusLancamentoFin
  parte_envolvida?: string
  documento_origem_tipo?: string
  documento_origem_id?: string
  lancamento_origem_estorno?: string
  forma_pagamento?: FormaPagamentoCodigo
  chave_idempotencia?: string
  usuario: string
  observacao?: string
  conta_expand?: ContaFinanceira
  categoria_expand?: CategoriaFinanceira
  parte_expand?: Pessoa
}

export interface LogAuditoria {
  id: string
  entidade: string
  identificador_registro: string
  campo?: string
  valor_anterior?: string
  valor_novo?: string
  usuario?: string
  data_hora: string
  origem: string
  endereco_ip?: string
}
