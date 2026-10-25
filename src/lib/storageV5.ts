import {
  AppDataV5,
  Parametro,
  CHAVES_PARAMETROS,
  Produto,
  FaixaPreco,
  ComposicaoItem,
  Insumo,
  Fornecedor,
  CustoItem,
  Cliente,
  Orcamento,
  Pedido,
  ArquivoArte,
  LancamentoFinanceiro,
  MovimentoEstoque,
  CompromissoFiscal,
  RegiaoAtendimento,
  Lead,
  CampanhaMarketing,
  ConteudoPlanejamento,
  AuditEntry,
} from '@/types/appV5'

export const STORAGE_KEYS_V5 = {
  DATA: 'bru-memorias.v5.data',
  AUTH: 'bru-memorias.v5.auth',
  SESSAO: 'bru-memorias.v5.sessao',
} as const

// 1. PARAMETROS OBRIGATÓRIOS (Fonte única de todos os limites numéricos do negócio)
export const PARAMETROS_PADRAO: Parametro[] = [
  {
    chave: CHAVES_PARAMETROS.MARGEM_MINIMA_PCT,
    valor: 30,
    unidade: '%',
    descricao: 'Margem mínima de lucro permitida para os produtos e faixas',
    valorMinimo: 5,
    valorMaximo: 90,
  },
  {
    chave: CHAVES_PARAMETROS.FRETE_MAXIMO_PCT,
    valor: 20,
    unidade: '%',
    descricao: 'Percentual máximo que o frete pode representar sobre o valor do pedido',
    valorMinimo: 5,
    valorMaximo: 50,
  },
  {
    chave: CHAVES_PARAMETROS.QTD_MINIMA_FRETE_ALTO,
    valor: 40,
    unidade: 'un',
    descricao: 'Quantidade mínima de ímãs para amortizar o frete em envios distantes',
    valorMinimo: 10,
    valorMaximo: 200,
  },
  {
    chave: CHAVES_PARAMETROS.PESO_UNITARIO_IMA_G,
    valor: 18,
    unidade: 'g',
    descricao: 'Peso unitário médio de 1 ímã 5x5 cm com embalagem de organza',
    valorMinimo: 5,
    valorMaximo: 100,
  },
  {
    chave: CHAVES_PARAMETROS.TEMPO_MEDIO_PRODUCAO_MIN,
    valor: 3.5,
    unidade: 'min',
    descricao: 'Tempo médio de produção artesanal por ímã (impressão, laminação, corte)',
    valorMinimo: 0.5,
    valorMaximo: 30,
  },
  {
    chave: CHAVES_PARAMETROS.LIMITE_ANUAL_SIMPLES,
    valor: 4800000,
    unidade: 'R$',
    descricao: 'Limite máximo anual de faturamento do Simples Nacional (R$ 4,8 milhões)',
    valorMinimo: 1000000,
    valorMaximo: 10000000,
  },
  {
    chave: CHAVES_PARAMETROS.SUBLIMITE_ICMS_ISS,
    valor: 3600000,
    unidade: 'R$',
    descricao: 'Sublimite de ICMS e ISS no Simples Nacional (R$ 3,6 milhões)',
    valorMinimo: 1000000,
    valorMaximo: 5000000,
  },
  {
    chave: CHAVES_PARAMETROS.DIAS_ALERTA_BACKUP,
    valor: 7,
    unidade: 'dias',
    descricao: 'Intervalo em dias para lembrar o administrador de exportar backup JSON',
    valorMinimo: 1,
    valorMaximo: 30,
  },
  {
    chave: CHAVES_PARAMETROS.PCT_ALERTA_FISCAL_80,
    valor: 80,
    unidade: '%',
    descricao: 'Primeiro alerta de aproximação do sublimite fiscal do Simples Nacional',
    valorMinimo: 50,
    valorMaximo: 90,
  },
  {
    chave: CHAVES_PARAMETROS.PCT_ALERTA_FISCAL_95,
    valor: 95,
    unidade: '%',
    descricao: 'Alerta crítico de aproximação do teto anual do Simples Nacional',
    valorMinimo: 85,
    valorMaximo: 99,
  },
  {
    chave: CHAVES_PARAMETROS.PCT_RETENCAO_AUDITORIA,
    valor: 70,
    unidade: '%',
    descricao: 'Percentual máximo de espaço de armazenamento local alocado à auditoria',
    valorMinimo: 10,
    valorMaximo: 90,
  },
  {
    chave: CHAVES_PARAMETROS.TEMPO_BLOQUEIO_SEGUNDOS,
    valor: 60,
    unidade: 'segundos',
    descricao: 'Tempo de bloqueio temporário após 5 tentativas de senha incorretas',
    valorMinimo: 15,
    valorMaximo: 600,
  },
  {
    chave: CHAVES_PARAMETROS.TEMPO_EXPIRACAO_MINUTOS,
    valor: 30,
    unidade: 'minutos',
    descricao: 'Tempo de inatividade no aparelho para exigir a senha do administrador novamente',
    valorMinimo: 1,
    valorMaximo: 240,
  },
  {
    chave: CHAVES_PARAMETROS.PCT_CONCENTRACAO_CLIENTE,
    valor: 30,
    unidade: '%',
    descricao: 'Alerta quando um único cliente responde por mais deste percentual da receita',
    valorMinimo: 10,
    valorMaximo: 80,
  },
]

// 2. ITENS DE CUSTO PADRÃO DO ÍMÃ 5x5 CM (com botão + por item e itens não catalogados)
export const ITENS_CUSTO_PADRAO: CustoItem[] = [
  {
    id: 'placa-magnetica',
    nome: 'Placa magnética',
    custoBase: 0.6,
    unidadesCobertas: 1,
    lancamentos: [],
    isPadrao: true,
  },
  {
    id: 'impressao-foto',
    nome: 'Impressão da foto',
    custoBase: 0.45,
    unidadesCobertas: 1,
    lancamentos: [],
    isPadrao: true,
  },
  {
    id: 'papel-adesivo',
    nome: 'Papel/adesivo fotográfico',
    custoBase: 0.25,
    unidadesCobertas: 1,
    lancamentos: [],
    isPadrao: true,
  },
  {
    id: 'laminacao',
    nome: 'Laminação',
    custoBase: 0.15,
    unidadesCobertas: 1,
    lancamentos: [],
    isPadrao: true,
  },
  {
    id: 'corte-acabamento',
    nome: 'Corte e acabamento',
    custoBase: 0.2,
    unidadesCobertas: 1,
    lancamentos: [],
    isPadrao: true,
  },
  {
    id: 'bolsinha-organza',
    nome: 'Bolsinha de organza',
    custoBase: 0.18,
    unidadesCobertas: 1,
    lancamentos: [],
    isPadrao: true,
  },
  {
    id: 'etiqueta',
    nome: 'Etiqueta',
    custoBase: 0.12,
    unidadesCobertas: 1,
    lancamentos: [],
    isPadrao: true,
  },
  {
    id: 'mao-de-obra',
    nome: 'Mão de obra',
    custoBase: 1.0,
    unidadesCobertas: 1,
    lancamentos: [],
    isPadrao: true,
  },
  {
    id: 'energia-depreciacao',
    nome: 'Energia e depreciação',
    custoBase: 0.1,
    unidadesCobertas: 1,
    lancamentos: [],
    isPadrao: true,
  },
  {
    id: 'embalagem-envio',
    nome: 'Embalagem de envio',
    custoBase: 0.35,
    unidadesCobertas: 1,
    lancamentos: [],
    isPadrao: true,
  },
]

export function calcularCustoTotalUnitario(itens: CustoItem[]): number {
  return itens.reduce((soma, it) => {
    const totalLancamentos = it.lancamentos.reduce((acc, l) => acc + (l.valor || 0), 0)
    const baseSegura = it.custoBase || 0
    const unidades = Math.max(1, it.unidadesCobertas || 1)
    return soma + (baseSegura + totalLancamentos) / unidades
  }, 0)
}

// 3. PRODUTOS PADRÃO (Sem campos de faixa em PRODUTO — preço só em FAIXA DE PREÇO)
const custoCalculadoBase = Number(calcularCustoTotalUnitario(ITENS_CUSTO_PADRAO).toFixed(2)) // ~3.40

export const PRODUTOS_PADRAO_V5: Produto[] = [
  {
    id: 'prod-ima-5x5',
    nome: 'Ímã Personalizado 5x5 cm',
    dimensao: '5x5 cm',
    descricao:
      'Ímã fotográfico artesanal sob demanda com laminação fosca/brilho e bolsinha de organza.',
    custoUnitarioCalculado: custoCalculadoBase,
    ativo: true,
    ehKit: false,
    criadoEm: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'prod-kit-3-imas',
    nome: 'Kit Lembrança (3 ímãs 5x5)',
    dimensao: '5x5 cm cada',
    descricao: 'Conjunto com 3 fotos em ímãs 5x5 cm montados em bolsinha de organza premium.',
    custoUnitarioCalculado: Number((custoCalculadoBase * 3).toFixed(2)),
    ativo: true,
    ehKit: true,
    criadoEm: '2025-01-01T00:00:00.000Z',
  },
]

// 4. COMPOSIÇÃO DE KITS (Custo do kit = soma dos componentes)
export const COMPOSICOES_PADRAO_V5: ComposicaoItem[] = [
  {
    id: 'comp-kit-3',
    produtoKitId: 'prod-kit-3-imas',
    produtoComponenteId: 'prod-ima-5x5',
    quantidade: 3,
    custoCalculado: Number((custoCalculadoBase * 3).toFixed(2)),
  },
]

// 5. FAIXAS DE PREÇO OFICIAIS PRÉ-CARREGADAS (Fonte única do preço comercial)
export const FAIXAS_PRECO_PADRAO: FaixaPreco[] = [
  {
    id: 'faixa-1',
    produtoId: 'prod-ima-5x5',
    nomeComercial: 'Mimo Revelado',
    nomeReferencia: 'avulso',
    quantidadeMinima: 1,
    quantidadeMaxima: 4,
    precoUnitario: 14.99,
    ativo: true,
  },
  {
    id: 'faixa-2',
    produtoId: 'prod-ima-5x5',
    nomeComercial: 'Rolo de Lembranças',
    nomeReferencia: 'kit',
    quantidadeMinima: 5,
    quantidadeMaxima: 25,
    precoUnitario: 12.5,
    ativo: true,
  },
  {
    id: 'faixa-3',
    produtoId: 'prod-ima-5x5',
    nomeComercial: 'Álbum de Festa',
    nomeReferencia: 'festa',
    quantidadeMinima: 26,
    quantidadeMaxima: 50,
    precoUnitario: 11.5,
    ativo: true,
  },
  {
    id: 'faixa-4',
    produtoId: 'prod-ima-5x5',
    nomeComercial: 'Baú de Memórias',
    nomeReferencia: 'festa grande',
    quantidadeMinima: 51,
    quantidadeMaxima: 100,
    precoUnitario: 10.5,
    ativo: true,
  },
  {
    id: 'faixa-5',
    produtoId: 'prod-ima-5x5',
    nomeComercial: 'Edição de Ateliê',
    nomeReferencia: 'atacado',
    quantidadeMinima: 101,
    quantidadeMaxima: Infinity,
    precoUnitario: 9.99,
    ativo: true,
  },
]

export function buscarFaixaPreco(quantidade: number, faixas: FaixaPreco[]): FaixaPreco {
  const qtd = Math.max(1, quantidade)
  const encontrada = faixas
    .filter((f) => f.ativo)
    .find((f) => qtd >= f.quantidadeMinima && qtd <= f.quantidadeMaxima)
  if (encontrada) return encontrada
  return faixas[0] || FAIXAS_PRECO_PADRAO[0]
}

// 6. INSUMOS PADRÃO
export const INSUMOS_PADRAO_V5: Insumo[] = [
  {
    id: 'ins-placa-magnetica',
    nome: 'Placa magnética adesivada 0.3mm',
    unidade: 'folha',
    custoMedio: 0.6,
    estoqueAtual: 85,
    estoqueMinimo: 30,
    consumoPorIma: 1,
    categoria: 'Base',
    criadoEm: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'ins-impressao-foto',
    nome: 'Impressão fotográfica pigmentada',
    unidade: 'un',
    custoMedio: 0.45,
    estoqueAtual: 140,
    estoqueMinimo: 50,
    consumoPorIma: 1,
    categoria: 'Impressão',
    criadoEm: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'ins-papel-adesivo',
    nome: 'Papel fotográfico adesivo glossy',
    unidade: 'folha',
    custoMedio: 0.25,
    estoqueAtual: 45,
    estoqueMinimo: 25,
    consumoPorIma: 1,
    categoria: 'Papelaria',
    criadoEm: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'ins-laminacao-bopp',
    nome: 'Filme térmico BOPP fosco/brilho',
    unidade: 'metro',
    custoMedio: 0.15,
    estoqueAtual: 60,
    estoqueMinimo: 20,
    consumoPorIma: 0.05,
    categoria: 'Acabamento',
    criadoEm: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'ins-bolsinha-organza',
    nome: 'Bolsinha de organza 7x9 cm',
    unidade: 'un',
    custoMedio: 0.18,
    estoqueAtual: 90,
    estoqueMinimo: 30,
    consumoPorIma: 1,
    categoria: 'Embalagem',
    criadoEm: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'ins-embalagem-envio',
    nome: 'Envelope bolha segurança correios',
    unidade: 'un',
    custoMedio: 0.35,
    estoqueAtual: 40,
    estoqueMinimo: 20,
    consumoPorIma: 0.1,
    categoria: 'Embalagem',
    criadoEm: '2025-01-01T00:00:00.000Z',
  },
]

// 7. FORNECEDORES PADRÃO (Alcance nacional / Cidade e Estado)
export const FORNECEDORES_PADRAO_V5: Fornecedor[] = [
  {
    id: 'forn-1',
    nome: 'Manta Magnética Brasil Distribuidora',
    contato: '(11) 98765-1122',
    cidade: 'São Paulo',
    estado: 'SP',
    prazoMedioDias: '3 dias úteis',
    avaliacao: 5,
    link: 'https://www.mercadolivre.com.br',
    insumosAtendidos: ['Placa magnética', 'ins-placa-magnetica'],
    condicaoPagamento: 'PIX com 5% de desconto',
    pedidoMinimo: 100,
    criadoEm: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'forn-2',
    nome: 'Papelaria & Gráfica Barra Bonita',
    contato: '(21) 98844-1234',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    prazoMedioDias: 'Pronta entrega',
    avaliacao: 5,
    link: 'https://maps.google.com',
    insumosAtendidos: ['Impressão da foto', 'Papel/adesivo fotográfico'],
    condicaoPagamento: 'Cartão ou PIX',
    pedidoMinimo: 0,
    criadoEm: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'forn-3',
    nome: 'Atacado das Embalagens & Organza',
    contato: '(21) 2232-1010',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    prazoMedioDias: '1 dia útil',
    avaliacao: 5,
    link: 'https://www.saararj.com.br',
    insumosAtendidos: ['Bolsinha de organza', 'Embalagem de envio'],
    condicaoPagamento: 'Boleto 14 dias',
    pedidoMinimo: 50,
    criadoEm: '2025-01-01T00:00:00.000Z',
  },
]

// 8. CLIENTES PADRÃO (Com cidade, estado, consentimento e base legal)
export const CLIENTES_PADRAO_V5: Cliente[] = [
  {
    id: 'cli-1',
    nome: 'Camila Mendonça Rocha',
    whatsapp: '(21) 98765-4321',
    telefoneRecado: '(21) 3411-9000',
    email: 'camila.mendonca@gmail.com',
    instagram: '@camilamendonca.rio',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    cep: '22790-000',
    endereco: 'Rua Gilka Machado, 450 - Recreio dos Bandeirantes',
    origem: 'Indicação',
    consentimento: true,
    dataHoraConsentimento: '2025-01-15T10:00:00.000Z',
    baseLegal: 'Consentimento do titular',
    observacoes: 'Preferência por acabamento fosco e entrega via Sedex ou retirada.',
    ativo: true,
    dataCadastro: '2025-01-15',
  },
  {
    id: 'cli-2',
    nome: 'Juliana Siqueira Prado',
    whatsapp: '(21) 99123-8899',
    telefoneRecado: '',
    email: 'ju.prado@outlook.com',
    instagram: '@ju.prado.rj',
    cidade: 'Niterói',
    estado: 'RJ',
    cep: '24230-000',
    endereco: 'Rua Coronel Moreira César, 200 - Icaraí',
    origem: 'Instagram',
    consentimento: true,
    dataHoraConsentimento: '2025-02-01T11:20:00.000Z',
    baseLegal: 'Consentimento do titular',
    observacoes: 'Lembrancinhas de aniversário de 1 ano.',
    ativo: true,
    dataCadastro: '2025-02-01',
  },
  {
    id: 'cli-3',
    nome: 'Mariana Duarte Fontes',
    whatsapp: '(11) 98444-5566',
    telefoneRecado: '',
    email: 'mari.fontes@gmail.com',
    instagram: '@marianafontes_',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '04538-133',
    endereco: 'Rua Joaquim Floriano, 100 - Itaim Bibi',
    origem: 'WhatsApp',
    consentimento: false, // Exemplo sem consentimento para testar filtro LGPD
    baseLegal: 'Execução de contrato',
    observacoes: 'Cliente comprou pelo WhatsApp. Não autorizou envio de mala direta ou campanhas.',
    ativo: true,
    dataCadastro: '2025-02-20',
  },
]

// 9. ORÇAMENTOS E PEDIDOS PADRÃO DO FLUXO COMERCIAL
export const ORCAMENTOS_PADRAO_V5: Orcamento[] = [
  {
    id: 'orc-1',
    numero: 'ORC-2025-001',
    clienteId: 'cli-1',
    itens: [
      {
        produtoId: 'prod-ima-5x5',
        produtoNome: 'Ímã Personalizado 5x5 cm',
        quantidade: 12,
        precoUnitario: 12.5,
        custoUnitario: custoCalculadoBase,
        total: 150.0,
      },
    ],
    quantidadeTotal: 12,
    faixaAplicadaId: 'faixa-2',
    precoUnitario: 12.5,
    desconto: 0,
    frete: 0,
    total: 150.0,
    validade: '2025-02-28',
    status: 'Aprovado',
    dataCriacao: '2025-02-10',
    dataEnvio: '2025-02-10T14:00:00.000Z',
    historicoVersoes: [
      {
        versao: 1,
        dataHora: '2025-02-10T14:00:00.000Z',
        quantidadeTotal: 12,
        total: 150.0,
        validade: '2025-02-28',
      },
    ],
    observacoes: 'Fotos de viagem',
  },
]

export const PEDIDOS_PADRAO_V5: Pedido[] = [
  {
    id: 'ped-1',
    numero: 'PED-2025-001',
    clienteId: 'cli-1',
    orcamentoOrigemId: 'orc-1',
    itens: [
      {
        produtoId: 'prod-ima-5x5',
        produtoNome: 'Ímã Personalizado 5x5 cm',
        quantidade: 12,
        precoUnitario: 12.5,
        custoUnitario: custoCalculadoBase,
        total: 150.0,
      },
    ],
    quantidadeTotal: 12,
    valor: 150.0,
    desconto: 0,
    frete: 0,
    totalGeral: 150.0,
    formaPagamento: 'PIX',
    exigeSinal: false,
    sinalRecebido: 150.0,
    saldoRestante: 0,
    status: 'Entregue',
    dataAprovacao: '2025-02-10T14:30:00.000Z',
    prazoPrometido: '2025-02-15',
    dataEntregaReal: '2025-02-14',
    codigoRastreio: 'BRU-ENTREGA-LOCAL-01',
    checklist: {
      arteConferida: true,
      impressaoVerificada: true,
      laminacaoSemBolhas: true,
      corteAlinhado5x5: true,
      mantaMagneticaAderente: true,
      bolsinhaOrganzaIncluida: true,
      etiquetaAfixada: true,
      embalagemEnvioSegura: true,
      dataFinalizacao: '2025-02-13T17:00:00.000Z',
    },
    criadoEm: '2025-02-10T14:30:00.000Z',
  },
]

export const ARTES_PADRAO_V5: ArquivoArte[] = [
  {
    id: 'arte-1',
    pedidoId: 'ped-1',
    nomeArquivo: 'foto-viagem-arraial-01.jpg',
    origemArquivo: 'WhatsApp',
    larguraPixels: 1200,
    alturaPixels: 1200,
    resolucaoPixels: '1200x1200',
    proporcao: '1:1',
    proporcaoQuadrada: true,
    resolucaoMinimaAtendida: true,
    areaSegurancaOk: true,
    textoLegivelOk: true,
    fotoEscuraOuTremida: false,
    aprovacaoCliente: true,
    dataAprovacao: '2025-02-10T15:00:00.000Z',
    statusRecorte: 'Adequado (1:1)',
    observacaoQualidade: 'Excelente resolução para 5x5 cm',
    criadoEm: '2025-02-10T14:45:00.000Z',
  },
]

// 10. AUDITORIA PADRÃO (Sem dados pessoais em valorAnterior/valorNovo)
export const AUDITORIA_PADRAO_V5: AuditEntry[] = [
  {
    id: 'aud-v5-1',
    dataHora: '2025-01-01T00:00:00.000Z',
    entidade: 'PARAMETRO',
    entidadeId: 'margem_minima_percentual',
    acao: 'Inicialização do sistema',
    campoAlterado: 'valor',
    valorAnterior: '',
    valorNovo: '30',
    usuario: 'Administrador',
    modulo: 'Parametros',
    detalhe: 'Inicialização oficial do sistema Bru Memórias v5.',
  },
]

// 11. BASE COMPLETA PADRÃO
export const DADOS_PADRAO_V5: AppDataV5 = {
  schemaVersion: 5,
  versaoApp: '5.0.0',
  dataHora: new Date().toISOString(),
  parametros: PARAMETROS_PADRAO,
  produtos: PRODUTOS_PADRAO_V5,
  faixasPreco: FAIXAS_PRECO_PADRAO,
  composicoes: COMPOSICOES_PADRAO_V5,
  insumos: INSUMOS_PADRAO_V5,
  fornecedores: FORNECEDORES_PADRAO_V5,
  custosItens: ITENS_CUSTO_PADRAO,
  clientes: CLIENTES_PADRAO_V5,
  orcamentos: ORCAMENTOS_PADRAO_V5,
  pedidos: PEDIDOS_PADRAO_V5,
  artes: ARTES_PADRAO_V5,
  lancamentosFinanceiros: [],
  movimentosEstoque: [],
  compromissosFiscais: [],
  regioes: [],
  leads: [],
  campanhas: [],
  conteudos: [],
  auditoria: AUDITORIA_PADRAO_V5,
  auth: {
    isConfigurado: false,
  },
}

// ==========================================
// FUNÇÕES DE PERSISTÊNCIA E VALIDAÇÃO DE SCHEMA
// ==========================================

export function carregarDadosV5(): AppDataV5 {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS_V5.DATA)
    if (!raw) {
      salvarDadosV5(DADOS_PADRAO_V5)
      return DADOS_PADRAO_V5
    }
    const parsed = JSON.parse(raw) as Partial<AppDataV5>

    // Validação de schemaVersion
    if (!parsed.schemaVersion || parsed.schemaVersion < 5) {
      // Migração automática v1 -> v5
      const migrado = migrarDadosParaV5(parsed)
      salvarDadosV5(migrado)
      return migrado
    }

    if (parsed.schemaVersion > 5) {
      console.warn('Backup com schemaVersion superior desconhecida. Mantendo dados atuais.')
      return DADOS_PADRAO_V5
    }

    // Garante que todas as coleções existam
    return {
      ...DADOS_PADRAO_V5,
      ...parsed,
      parametros: parsed.parametros || PARAMETROS_PADRAO,
      produtos: parsed.produtos || PRODUTOS_PADRAO_V5,
      faixasPreco: parsed.faixasPreco || FAIXAS_PRECO_PADRAO,
      composicoes: parsed.composicoes || COMPOSICOES_PADRAO_V5,
      insumos: parsed.insumos || INSUMOS_PADRAO_V5,
      fornecedores: parsed.fornecedores || FORNECEDORES_PADRAO_V5,
      custosItens: parsed.custosItens || ITENS_CUSTO_PADRAO,
      clientes: parsed.clientes || CLIENTES_PADRAO_V5,
      orcamentos: parsed.orcamentos || ORCAMENTOS_PADRAO_V5,
      pedidos: parsed.pedidos || PEDIDOS_PADRAO_V5,
      artes: parsed.artes || ARTES_PADRAO_V5,
      auditoria: parsed.auditoria || AUDITORIA_PADRAO_V5,
      auth: parsed.auth || { isConfigurado: false },
    }
  } catch (err) {
    console.error('Falha ao carregar dados v5. Restaurando padrão seguro.', err)
    return DADOS_PADRAO_V5
  }
}

export function salvarDadosV5(data: AppDataV5): void {
  try {
    const dataComDataHora = { ...data, dataHora: new Date().toISOString() }
    localStorage.setItem(STORAGE_KEYS_V5.DATA, JSON.stringify(dataComDataHora))
  } catch (err) {
    console.error('Falha ao salvar dados v5 no localStorage', err)
  }
}

// Migração declarada de versões antigas (v1) para a v5
export function migrarDadosParaV5(dadosAntigos: any): AppDataV5 {
  const base = { ...DADOS_PADRAO_V5 }

  try {
    if (dadosAntigos && typeof dadosAntigos === 'object') {
      // Migrar clientes antigos
      if (Array.isArray(dadosAntigos.clientes)) {
        base.clientes = dadosAntigos.clientes.map((c: any) => ({
          id: c.id || 'cli-' + Date.now(),
          nome: c.nome || 'Cliente',
          whatsapp: c.telefoneWhatsapp || '',
          telefoneRecado: c.telefoneRecado || '',
          email: c.email || '',
          instagram: c.instagram || '',
          cidade: 'Rio de Janeiro',
          estado: 'RJ',
          cep: '',
          endereco: c.endereco || '',
          origem: 'Outro',
          consentimento: Boolean(c.consentimentoLgpd),
          dataHoraConsentimento: c.dataConsentimentoLgpd,
          baseLegal: c.consentimentoLgpd ? 'Consentimento do titular' : 'Execução de contrato',
          observacoes: '',
          ativo: true,
          dataCadastro: c.dataCadastro || new Date().toISOString().split('T')[0],
        }))
      }

      // Migrar itens de custo antigos se existirem no primeiro produto
      if (
        Array.isArray(dadosAntigos.produtos) &&
        dadosAntigos.produtos[0]?.itens &&
        Array.isArray(dadosAntigos.produtos[0].itens)
      ) {
        base.custosItens = dadosAntigos.produtos[0].itens.map((it: any) => ({
          id: it.id,
          nome: it.nome,
          custoBase: it.custoBase || 0,
          unidadesCobertas: it.unidadesCobertas || 1,
          lancamentos: it.lancamentos || [],
          isPadrao: ITENS_CUSTO_PADRAO.some((p) => p.id === it.id),
        }))
      }
    }
  } catch (e) {
    console.warn('Erro ao processar migração para v5, usando valores padrão.', e)
  }

  return base
}
