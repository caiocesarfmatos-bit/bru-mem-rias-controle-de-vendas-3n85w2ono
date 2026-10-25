/**
 * BRU MEMÓRIAS | CONTROLE DE VENDAS
 * Tipos e Modelos de Dados - Especificação v5 (Etapas 0 a 3)
 *
 * Persistência 100% local (localStorage). Sistema de uso interno do Administrador.
 * Empresa: Bru Memórias Personalizados LTDA (Simples Nacional).
 */

// ==========================================
// 1. NAVEGAÇÃO EM DOIS NÍVEIS
// ==========================================
export type AbaPrincipalId = 'hoje' | 'vender' | 'produzir' | 'dinheiro' | 'crescer'

export type SubsecaoHojeId = 'painel' | 'alertas'
export type SubsecaoVenderId = 'clientes' | 'orcamentos' | 'vendas' | 'leads'
export type SubsecaoProduzirId = 'producao' | 'controle-arte'
export type SubsecaoDinheiroId =
  | 'custos'
  | 'produtos-precos'
  | 'receitas'
  | 'despesas'
  | 'compras'
  | 'financeiro'
  | 'fiscal'
  | 'frete'
export type SubsecaoCrescerId = 'regioes' | 'marketing' | 'planejamento' | 'configuracoes'

export type SubsecaoId =
  | SubsecaoHojeId
  | SubsecaoVenderId
  | SubsecaoProduzirId
  | SubsecaoDinheiroId
  | SubsecaoCrescerId

// Retrocompatibilidade temporária com telas antigas
export type TabId =
  | 'custos'
  | 'calculadora'
  | 'clientes'
  | 'fornecedores'
  | 'estoque'
  | 'painel'
  | 'relatorios'
  | 'diagnostico'

// ==========================================
// 2. PARÂMETROS DE NEGÓCIO (PARAMETRO)
// Fonte única de todo limite numérico do sistema
// ==========================================
export interface Parametro {
  chave: string
  valor: number
  unidade: string
  descricao: string
  valorMinimo: number
  valorMaximo: number
}

// Chaves canônicas de parâmetros
export const CHAVES_PARAMETROS = {
  MARGEM_MINIMA_PCT: 'margem_minima_percentual',
  FRETE_MAXIMO_PCT: 'frete_maximo_percentual_pedido',
  QTD_MINIMA_FRETE_ALTO: 'quantidade_minima_frete_alto',
  PESO_UNITARIO_IMA_G: 'peso_unitario_ima_gramas',
  TEMPO_MEDIO_PRODUCAO_MIN: 'tempo_medio_producao_minutos_por_ima',
  LIMITE_ANUAL_SIMPLES: 'limite_anual_simples',
  SUBLIMITE_ICMS_ISS: 'sublimite_icms_iss_simples',
  DIAS_ALERTA_BACKUP: 'dias_alerta_backup',
  PCT_ALERTA_FISCAL_80: 'percentual_alerta_limite_fiscal_80',
  PCT_ALERTA_FISCAL_95: 'percentual_alerta_limite_fiscal_95',
  PCT_RETENCAO_AUDITORIA: 'percentual_retencao_auditoria',
  TEMPO_BLOQUEIO_SEGUNDOS: 'tempo_bloqueio_tentativas_segundos',
  TEMPO_EXPIRACAO_MINUTOS: 'tempo_expiracao_sessao_minutos',
  PCT_CONCENTRACAO_CLIENTE: 'percentual_concentracao_cliente',
} as const

// ==========================================
// 3. PRODUTOS, PREÇOS E COMPOSIÇÃO
// ==========================================
export interface Produto {
  id: string
  nome: string
  dimensao: string // Ex: "5x5 cm"
  descricao: string
  custoUnitarioCalculado: number // Sempre calculado dos insumos / composição
  ativo: boolean
  ehKit: boolean
  criadoEm: string
  atualizadoEm?: string
}

export interface FaixaPreco {
  id: string
  produtoId: string // Produto ao qual a faixa se aplica (ou 'todos')
  nomeComercial: string // Ex: "Mimo Revelado"
  nomeReferencia: string // Ex: "avulso"
  quantidadeMinima: number
  quantidadeMaxima: number // Infinity para atacado
  precoUnitario: number
  ativo: boolean
}

export interface ComposicaoItem {
  id: string
  produtoKitId: string
  produtoComponenteId: string
  quantidade: number
  custoCalculado: number // quantidade * custoUnitarioCalculado do componente
}

// ==========================================
// 4. INSUMOS, FORNECEDORES E CUSTOS
// ==========================================
export interface Insumo {
  id: string
  nome: string
  unidade: string // un, folha, metro, pct
  custoMedio: number
  estoqueAtual: number
  estoqueMinimo: number
  fornecedorPreferencialId?: string
  consumoPorIma: number // fração de consumo por ímã (ex: 1 folha faz X ímãs)
  categoria?: string
  criadoEm: string
}

export interface Fornecedor {
  id: string
  nome: string
  contato: string
  cidade: string
  estado: string
  prazoMedioDias: string
  avaliacao: number // 1 a 5
  link?: string
  insumosAtendidos: string[] // nomes ou IDs de insumos
  condicaoPagamento?: string
  pedidoMinimo?: number
  criadoEm: string
}

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
  isPadrao?: boolean // se for item padrão do ímã 5x5, não pode ser excluído
}

// ==========================================
// 5. CLIENTES E PRIVACIDADE (LGPD)
// ==========================================
export type OrigemCliente =
  | 'WhatsApp'
  | 'Instagram'
  | 'Indicação'
  | 'Tráfego Pago'
  | 'Mala Direta'
  | 'Marketplace'
  | 'Outro'

export type BaseLegalLgpd = 'Execução de contrato' | 'Consentimento do titular'

export interface Cliente {
  id: string
  nome: string
  whatsapp: string
  telefoneRecado: string
  email: string
  instagram: string
  cidade: string
  estado: string
  cep: string
  endereco: string
  origem: OrigemCliente
  consentimento: boolean // sim/não
  dataHoraConsentimento?: string // ISO
  baseLegal: BaseLegalLgpd
  observacoes: string
  ativo: boolean
  dataCadastro: string // YYYY-MM-DD
}

// ==========================================
// 6. FLUXO COMERCIAL: ORÇAMENTOS E PEDIDOS
// ==========================================
export type StatusOrcamento =
  | 'Contato recebido'
  | 'Orçamento elaborado'
  | 'Orçamento enviado'
  | 'Aprovado'
  | 'Vencido'
  | 'Perdido'

export type MotivoPerda =
  | 'Preço alto'
  | 'Prazo longo'
  | 'Desistência do cliente'
  | 'Sem resposta após envio'
  | 'Concorrente'
  | 'Outro'

export interface ItemOrcamentoPedido {
  produtoId: string
  produtoNome: string
  quantidade: number
  precoUnitario: number
  custoUnitario: number
  total: number
}

export interface VersaoHistoricoOrcamento {
  versao: number
  dataHora: string
  quantidadeTotal: number
  total: number
  validade: string
  motivoAlteracao?: string
}

export interface Orcamento {
  id: string
  numero: string // Ex: "ORC-2025-001"
  clienteId: string
  itens: ItemOrcamentoPedido[]
  quantidadeTotal: number
  faixaAplicadaId: string
  precoUnitario: number
  desconto: number
  frete: number
  total: number
  validade: string // YYYY-MM-DD
  status: StatusOrcamento
  dataCriacao: string
  dataEnvio?: string
  historicoVersoes: VersaoHistoricoOrcamento[]
  observacoes?: string
}

export type StatusPedido =
  | 'Venda concluída' // Pedido confirmado, pagamento acertado
  | 'Pedido em andamento' // Arte aprovada, em produção
  | 'Prazo de entrega' // Produzido, aguardando envio/retirada dentro do prazo
  | 'Finalização' // Conferido e embalado com checklist completo
  | 'Entregue' // Entregue ao cliente com data e rastreio
  | 'Atrasado' // Prazo prometido ultrapassado
  | 'Perdido' // Perda comercial
  | 'Cancelado' // Cancelado com justificativa

export interface ChecklistFinalizacao {
  arteConferida: boolean
  impressaoVerificada: boolean
  laminacaoSemBolhas: boolean
  corteAlinhado5x5: boolean
  mantaMagneticaAderente: boolean
  bolsinhaOrganzaIncluida: boolean
  etiquetaAfixada: boolean
  embalagemEnvioSegura: boolean
  dataFinalizacao?: string
}

export interface Pedido {
  id: string
  numero: string // Ex: "PED-2025-001"
  clienteId: string
  orcamentoOrigemId?: string
  itens: ItemOrcamentoPedido[]
  quantidadeTotal: number
  valor: number // soma dos itens - desconto
  desconto: number
  frete: number
  totalGeral: number // valor + frete
  formaPagamento: string
  exigeSinal: boolean
  sinalRecebido: number
  saldoRestante: number
  status: StatusPedido
  dataAprovacao: string // ISO
  prazoPrometido: string // YYYY-MM-DD
  dataEntregaReal?: string // YYYY-MM-DD
  codigoRastreio?: string
  motivoPerda?: MotivoPerda
  motivoCancelamento?: string
  checklist: ChecklistFinalizacao
  criadoEm: string
  atualizadoEm?: string
}

// ==========================================
// 7. ARQUIVO DE ARTE E CONTROLE DE QUALIDADE
// ==========================================
export type StatusRecorteArte = 'Adequado (1:1)' | 'Recorte necessário' | 'Recortado'

export interface ArquivoArte {
  id: string
  pedidoId: string
  nomeArquivo: string
  origemArquivo: 'WhatsApp' | 'E-mail' | 'Drive' | 'Upload local'
  larguraPixels: number
  alturaPixels: number
  resolucaoPixels: string // Ex: "800x800"
  proporcao: string // Ex: "1:1"
  proporcaoQuadrada: boolean
  resolucaoMinimaAtendida: boolean // >= 700x700 px (300 DPI seguro para 5x5 cm)
  areaSegurancaOk: boolean
  textoLegivelOk: boolean
  fotoEscuraOuTremida: boolean
  aprovacaoCliente: boolean
  dataAprovacao?: string // ISO
  observacaoQualidade?: string
  statusRecorte: StatusRecorteArte
  referenciaArquivo?: string // hash, nome ou dataUrl local
  mensagemOrientacaoPronta?: string
  criadoEm: string
}

// ==========================================
// 8. ENTIDADES DA RODADA 2 (ESTRUTURADAS NESTA RODADA)
// ==========================================
export interface LancamentoFinanceiro {
  id: string
  data: string // YYYY-MM-DD
  tipo: 'receita' | 'despesa'
  categoria: string
  descricao: string
  valor: number
  pedidoId?: string
  comprovante?: string
  criadoEm: string
}

export interface MovimentoEstoque {
  id: string
  insumoId: string
  insumoNome: string
  data: string // YYYY-MM-DD
  tipo: 'entrada' | 'saida'
  quantidade: number
  custoUnitario?: number
  motivo: 'compra' | 'producao' | 'venda' | 'ajuste_perda' | 'devolucao'
  observacao?: string
  criadoEm: string
}

export interface CompromissoFiscal {
  id: string
  competencia: string // YYYY-MM
  descricao: string // Ex: DAS Simples Nacional
  dataVencimento: string // YYYY-MM-DD
  valor: number
  pago: boolean
  dataPagamento?: string
}

export interface RegiaoAtendimento {
  id: string
  cidade: string
  estado: string
  prazoMedioEnvioDias: number
  custoMedioFrete: number
  ativo: boolean
}

export interface Lead {
  id: string
  nome: string
  contato: string
  cidade: string
  estado: string
  origem: OrigemCliente
  interesse: string
  dataContato: string
  convertidoEmCliente: boolean
  clienteId?: string
  observacoes?: string
}

export interface CampanhaMarketing {
  id: string
  nome: string
  canal: string
  dataInicio: string
  dataFim?: string
  orcamento: number
  gastoReal: number
  retornoReceita: number
  ativo: boolean
}

export interface ConteudoPlanejamento {
  id: string
  titulo: string
  dataPublicacao: string
  canal: string
  status: 'ideia' | 'produzindo' | 'agendado' | 'publicado'
  tema: string
}

// ==========================================
// 9. AUDITORIA (SEM DADOS PESSOAIS)
// Proibido gravar nome, telefone, e-mail, endereço ou documento
// ==========================================
export type ModuloAuditoria =
  | 'Acesso'
  | 'Parametros'
  | 'Custos'
  | 'Produtos'
  | 'Clientes'
  | 'Orcamentos'
  | 'Pedidos'
  | 'Producao'
  | 'Arte'
  | 'Estoque'
  | 'Financeiro'
  | 'Sistema'

export interface AuditEntry {
  id: string
  dataHora: string // ISO
  entidade: string
  entidadeId: string // Apenas o identificador interno
  acao: string
  campoAlterado?: string
  valorAnterior?: string // APENAS IDs, valores numéricos ou enums - NUNCA dados pessoais
  valorNovo?: string // APENAS IDs, valores numéricos ou enums - NUNCA dados pessoais
  usuario: string // 'Administrador'
  modulo?: ModuloAuditoria
  detalhe?: string
}

// ==========================================
// 10. SEGURANÇA E ACESSO DO ADMINISTRADOR
// ==========================================
export interface AuthState {
  isConfigurado: boolean // Se senha já foi criada no primeiro uso
  isAutenticado: boolean // Se a sessão atual está desbloqueada
  senhaHash?: string // Hash derivado PBKDF2
  senhaSal?: string // Sal criptográfico
  tentativasFalhas: number
  bloqueadoAte?: number // Timestamp milissegundos
  ultimoAcessoTimestamp: number // Para expiração de inatividade
}

// ==========================================
// 11. BASE DE DADOS GLOBAL E BACKUP
// ==========================================
export interface AppDataV5 {
  schemaVersion: 5
  versaoApp: string // '5.0.0'
  dataHora: string // ISO
  parametros: Parametro[]
  produtos: Produto[]
  faixasPreco: FaixaPreco[]
  composicoes: ComposicaoItem[]
  insumos: Insumo[]
  fornecedores: Fornecedor[]
  custosItens: CustoItem[] // Histórico detalhado de custos
  clientes: Cliente[]
  orcamentos: Orcamento[]
  pedidos: Pedido[]
  artes: ArquivoArte[]
  lancamentosFinanceiros: LancamentoFinanceiro[]
  movimentosEstoque: MovimentoEstoque[]
  compromissosFiscais: CompromissoFiscal[]
  regioes: RegiaoAtendimento[]
  leads: Lead[]
  campanhas: CampanhaMarketing[]
  conteudos: ConteudoPlanejamento[]
  auditoria: AuditEntry[]
  auth: {
    isConfigurado: boolean
    senhaHash?: string
    senhaSal?: string
  }
}
