import {
  AppData,
  AuditEntry,
  AppSettings,
  ProdutoKit,
  Fornecedor,
  Cliente,
  EstoqueData,
  InsumoEstoque,
  MovimentacaoEstoque,
  ProdutoProntoItem,
  MetaVendas,
} from '@/types/app'

export const STORAGE_KEYS = {
  DATA: 'bru-memorias.data.v1',
  AUDIT: 'bru-memorias.audit.v1',
  SETTINGS: 'bru-memorias.settings.v1',
} as const

// Itens base padrão para o ímã 5x5 cm (Recreio dos Bandeirantes, RJ)
export const ITENS_BASE_PADRAO = [
  {
    id: 'placa-magnetica',
    nome: 'Placa magnética',
    custoBase: 0.6,
    unidadesCobertas: 1,
    lancamentos: [],
  },
  {
    id: 'impressao-foto',
    nome: 'Impressão da foto',
    custoBase: 0.45,
    unidadesCobertas: 1,
    lancamentos: [],
  },
  {
    id: 'papel-adesivo',
    nome: 'Papel/adesivo fotográfico',
    custoBase: 0.25,
    unidadesCobertas: 1,
    lancamentos: [],
  },
  { id: 'laminacao', nome: 'Laminação', custoBase: 0.15, unidadesCobertas: 1, lancamentos: [] },
  {
    id: 'corte-acabamento',
    nome: 'Corte e acabamento',
    custoBase: 0.2,
    unidadesCobertas: 1,
    lancamentos: [],
  },
  {
    id: 'bolsinha-organza',
    nome: 'Bolsinha de organza',
    custoBase: 0.18,
    unidadesCobertas: 1,
    lancamentos: [],
  },
  { id: 'etiqueta', nome: 'Etiqueta', custoBase: 0.12, unidadesCobertas: 1, lancamentos: [] },
  { id: 'mao-de-obra', nome: 'Mão de obra', custoBase: 1.0, unidadesCobertas: 1, lancamentos: [] },
  {
    id: 'energia-depreciacao',
    nome: 'Energia e depreciação',
    custoBase: 0.1,
    unidadesCobertas: 1,
    lancamentos: [],
  },
  {
    id: 'embalagem-envio',
    nome: 'Embalagem de envio',
    custoBase: 0.35,
    unidadesCobertas: 1,
    lancamentos: [],
  },
]

export const PRODUTOS_PADRAO: ProdutoKit[] = [
  {
    id: 'prod-ima-5x5-avulso',
    nome: 'Ímã 5x5 Avulso',
    unidadesLote: 100,
    itens: ITENS_BASE_PADRAO.map((item) => ({ ...item, lancamentos: [] })),
    criadoEm: new Date().toISOString(),
  },
  {
    id: 'prod-kit-3-imas',
    nome: 'Kit 3 Ímãs',
    unidadesLote: 100,
    itens: ITENS_BASE_PADRAO.map((item) => ({
      ...item,
      custoBase: Number((item.custoBase * (item.id === 'embalagem-envio' ? 1 : 2.7)).toFixed(2)),
      lancamentos: [],
    })),
    criadoEm: new Date().toISOString(),
  },
  {
    id: 'prod-ima-festa',
    nome: 'Ímã Festa (Lembrancinha)',
    unidadesLote: 100,
    itens: ITENS_BASE_PADRAO.map((item) => ({
      ...item,
      custoBase: Number((item.custoBase * 0.85).toFixed(2)),
      lancamentos: [],
    })),
    criadoEm: new Date().toISOString(),
  },
]

export const FORNECEDORES_PADRAO: Fornecedor[] = [
  // Placa magnética
  {
    id: 'forn-pm-1',
    insumoId: 'placa-magnetica',
    insumoNome: 'Placa magnética',
    nome: 'Papelaria & Bazar Barra Bonita',
    contato: '(21) 98844-1234',
    preco: 0.65,
    prazo: 'Retirada imediata',
    avaliacao: 5,
    link: 'https://maps.google.com/?q=Recreio+dos+Bandeirantes',
    localizacao: '📍 Recreio dos Bandeirantes',
    criadoEm: new Date().toISOString(),
  },
  {
    id: 'forn-pm-2',
    insumoId: 'placa-magnetica',
    insumoNome: 'Placa magnética',
    nome: 'Manta Magnética Brasil (Mercado Livre)',
    contato: 'sac@mercadolivre.com.br',
    preco: 0.52,
    prazo: '3 dias úteis',
    avaliacao: 5,
    link: 'https://www.mercadolivre.com.br',
    localizacao: 'Online',
    criadoEm: new Date().toISOString(),
  },
  {
    id: 'forn-pm-3',
    insumoId: 'placa-magnetica',
    insumoNome: 'Placa magnética',
    nome: 'Gráfica Rápida Américas (Barra da Tijuca)',
    contato: '(21) 99123-5566',
    preco: 0.7,
    prazo: '1 dia útil',
    avaliacao: 4,
    link: 'https://maps.google.com/?q=Barra+da+Tijuca',
    localizacao: 'Rio de Janeiro',
    criadoEm: new Date().toISOString(),
  },

  // Impressão da foto
  {
    id: 'forn-if-1',
    insumoId: 'impressao-foto',
    insumoNome: 'Impressão da foto',
    nome: 'Foto & Cópias Recreio Shopping',
    contato: '(21) 97120-4321',
    preco: 0.48,
    prazo: 'Mesmo dia',
    avaliacao: 5,
    link: 'https://maps.google.com/?q=Recreio+Shopping',
    localizacao: '📍 Recreio dos Bandeirantes',
    criadoEm: new Date().toISOString(),
  },
  {
    id: 'forn-if-2',
    insumoId: 'impressao-foto',
    insumoNome: 'Impressão da foto',
    nome: 'Gráfica Printi Online',
    contato: 'contato@printi.com.br',
    preco: 0.39,
    prazo: '4 dias úteis',
    avaliacao: 4,
    link: 'https://www.printi.com.br',
    localizacao: 'Online',
    criadoEm: new Date().toISOString(),
  },
  {
    id: 'forn-if-3',
    insumoId: 'impressao-foto',
    insumoNome: 'Impressão da foto',
    nome: 'Laboratório Fotográfico Barra Point',
    contato: '(21) 98222-7890',
    preco: 0.55,
    prazo: '1 dia útil',
    avaliacao: 5,
    link: 'https://maps.google.com/?q=Barra+Point',
    localizacao: 'Rio de Janeiro',
    criadoEm: new Date().toISOString(),
  },

  // Papel/adesivo fotográfico
  {
    id: 'forn-pa-1',
    insumoId: 'papel-adesivo',
    insumoNome: 'Papel/adesivo fotográfico',
    nome: 'Kalunga Américas Shopping (Recreio)',
    contato: '(21) 3500-1200',
    preco: 0.28,
    prazo: 'Pronta entrega',
    avaliacao: 5,
    link: 'https://www.kalunga.com.br',
    localizacao: '📍 Recreio dos Bandeirantes',
    criadoEm: new Date().toISOString(),
  },
  {
    id: 'forn-pa-2',
    insumoId: 'papel-adesivo',
    insumoNome: 'Papel/adesivo fotográfico',
    nome: 'Masterprint Oficial (Shopee)',
    contato: 'shopee.com.br/masterprint',
    preco: 0.21,
    prazo: '5 dias úteis',
    avaliacao: 4,
    link: 'https://shopee.com.br',
    localizacao: 'Online',
    criadoEm: new Date().toISOString(),
  },
  {
    id: 'forn-pa-3',
    insumoId: 'papel-adesivo',
    insumoNome: 'Papel/adesivo fotográfico',
    nome: 'Caçula Tijuca / Madureira Centro RJ',
    contato: '(21) 2100-3300',
    preco: 0.24,
    prazo: '2 dias úteis',
    avaliacao: 4,
    link: 'https://cacula.com.br',
    localizacao: 'Rio de Janeiro',
    criadoEm: new Date().toISOString(),
  },

  // Laminação
  {
    id: 'forn-lam-1',
    insumoId: 'laminacao',
    insumoNome: 'Laminação',
    nome: 'BOPP & Vinil Recreio Estúdio',
    contato: '(21) 99345-0987',
    preco: 0.17,
    prazo: '1 dia útil',
    avaliacao: 5,
    link: '',
    localizacao: '📍 Recreio dos Bandeirantes',
    criadoEm: new Date().toISOString(),
  },
  {
    id: 'forn-lam-2',
    insumoId: 'laminacao',
    insumoNome: 'Laminação',
    nome: 'Plásticos & Filmes Brasil (Elo7)',
    contato: 'elo7.com.br/loja-bopp',
    preco: 0.13,
    prazo: '4 dias úteis',
    avaliacao: 4,
    link: 'https://www.elo7.com.br',
    localizacao: 'Online',
    criadoEm: new Date().toISOString(),
  },
  {
    id: 'forn-lam-3',
    insumoId: 'laminacao',
    insumoNome: 'Laminação',
    nome: 'Suprimentos Gráficos São Cristóvão RJ',
    contato: '(21) 98777-6543',
    preco: 0.15,
    prazo: '2 dias úteis',
    avaliacao: 4,
    link: '',
    localizacao: 'Rio de Janeiro',
    criadoEm: new Date().toISOString(),
  },

  // Corte e acabamento
  {
    id: 'forn-ca-1',
    insumoId: 'corte-acabamento',
    insumoNome: 'Corte e acabamento',
    nome: 'Oficina Artesanal Recreio (Lâminas e Bases)',
    contato: '(21) 99888-4321',
    preco: 0.2,
    prazo: 'Pronta entrega',
    avaliacao: 5,
    link: '',
    localizacao: '📍 Recreio dos Bandeirantes',
    criadoEm: new Date().toISOString(),
  },
  {
    id: 'forn-ca-2',
    insumoId: 'corte-acabamento',
    insumoNome: 'Corte e acabamento',
    nome: 'Suprimentos Silhouette & Mimo (Amazon)',
    contato: 'amazon.com.br',
    preco: 0.18,
    prazo: '2 dias úteis',
    avaliacao: 5,
    link: 'https://www.amazon.com.br',
    localizacao: 'Online',
    criadoEm: new Date().toISOString(),
  },
  {
    id: 'forn-ca-3',
    insumoId: 'corte-acabamento',
    insumoNome: 'Corte e acabamento',
    nome: 'Ferragens & Cortadores Barra Sul',
    contato: '(21) 98111-2233',
    preco: 0.23,
    prazo: '1 dia útil',
    avaliacao: 4,
    link: '',
    localizacao: 'Rio de Janeiro',
    criadoEm: new Date().toISOString(),
  },

  // Bolsinha de organza
  {
    id: 'forn-bo-1',
    insumoId: 'bolsinha-organza',
    insumoNome: 'Bolsinha de organza',
    nome: 'Fitas & Embalagens Terreirão (Recreio)',
    contato: '(21) 99654-7890',
    preco: 0.22,
    prazo: 'Pronta entrega',
    avaliacao: 4,
    link: '',
    localizacao: '📍 Recreio dos Bandeirantes',
    criadoEm: new Date().toISOString(),
  },
  {
    id: 'forn-bo-2',
    insumoId: 'bolsinha-organza',
    insumoNome: 'Bolsinha de organza',
    nome: 'Atacado das Embalagens RJ (Saara Centro)',
    contato: '(21) 2232-1010',
    preco: 0.14,
    prazo: '1 dia útil',
    avaliacao: 5,
    link: 'https://www.saararj.com.br',
    localizacao: 'Rio de Janeiro',
    criadoEm: new Date().toISOString(),
  },
  {
    id: 'forn-bo-3',
    insumoId: 'bolsinha-organza',
    insumoNome: 'Bolsinha de organza',
    nome: 'Organza & Mimos Brasil (Shopee)',
    contato: 'shopee.com.br/organzamimos',
    preco: 0.12,
    prazo: '6 dias úteis',
    avaliacao: 5,
    link: 'https://shopee.com.br',
    localizacao: 'Online',
    criadoEm: new Date().toISOString(),
  },

  // Etiqueta
  {
    id: 'forn-et-1',
    insumoId: 'etiqueta',
    insumoNome: 'Etiqueta',
    nome: 'Gráfica Express Posto 9 (Recreio)',
    contato: '(21) 99100-3344',
    preco: 0.14,
    prazo: 'Mesmo dia',
    avaliacao: 5,
    link: '',
    localizacao: '📍 Recreio dos Bandeirantes',
    criadoEm: new Date().toISOString(),
  },
  {
    id: 'forn-et-2',
    insumoId: 'etiqueta',
    insumoNome: 'Etiqueta',
    nome: 'Pimaco Etiquetas Adesivas (Amazon Prime)',
    contato: 'amazon.com.br',
    preco: 0.1,
    prazo: '1 dia útil',
    avaliacao: 5,
    link: 'https://www.amazon.com.br',
    localizacao: 'Online',
    criadoEm: new Date().toISOString(),
  },
  {
    id: 'forn-et-3',
    insumoId: 'etiqueta',
    insumoNome: 'Etiqueta',
    nome: 'Rótulos & Tags Personalizadas (Elo7)',
    contato: 'elo7.com.br/rotulostags',
    preco: 0.13,
    prazo: '4 dias úteis',
    avaliacao: 4,
    link: 'https://www.elo7.com.br',
    localizacao: 'Online',
    criadoEm: new Date().toISOString(),
  },

  // Embalagem de envio
  {
    id: 'forn-ee-1',
    insumoId: 'embalagem-envio',
    insumoNome: 'Embalagem de envio',
    nome: 'Correios Recreio Av. das Américas',
    contato: '(21) 3411-8800',
    preco: 0.45,
    prazo: 'Imediato',
    avaliacao: 4,
    link: 'https://correios.com.br',
    localizacao: '📍 Recreio dos Bandeirantes',
    criadoEm: new Date().toISOString(),
  },
  {
    id: 'forn-ee-2',
    insumoId: 'embalagem-envio',
    insumoNome: 'Embalagem de envio',
    nome: 'Caixas & Envelopes Bolha (Mercado Livre)',
    contato: 'mercadolivre.com.br',
    preco: 0.29,
    prazo: '2 dias úteis',
    avaliacao: 5,
    link: 'https://www.mercadolivre.com.br',
    localizacao: 'Online',
    criadoEm: new Date().toISOString(),
  },
  {
    id: 'forn-ee-3',
    insumoId: 'embalagem-envio',
    insumoNome: 'Embalagem de envio',
    nome: 'Distribuidora Papelão Rio (Zona Oeste)',
    contato: '(21) 98333-2211',
    preco: 0.32,
    prazo: '1 dia útil',
    avaliacao: 4,
    link: '',
    localizacao: 'Rio de Janeiro',
    criadoEm: new Date().toISOString(),
  },
]

export const CLIENTES_PADRAO: Cliente[] = [
  {
    id: 'cli-1',
    nome: 'Camila Mendonça Rocha',
    endereco: 'Rua Gilka Machado, 450 - Recreio dos Bandeirantes, Rio de Janeiro - RJ',
    telefoneWhatsapp: '(21) 98765-4321',
    telefoneRecado: '(21) 3411-9000',
    email: 'camila.mendonca@gmail.com',
    instagram: '@camilamendonca.rio',
    facebook: 'camila.mendonca',
    tiktok: '@camila_recreio',
    outrosCanais: 'Indicação da amiga Paula',
    consentimentoLgpd: true,
    dataConsentimentoLgpd: '2025-01-15T10:00:00.000Z',
    dataCadastro: '2025-01-15',
    pedidos: [
      {
        id: 'ped-101',
        clienteId: 'cli-1',
        clienteNome: 'Camila Mendonça Rocha',
        produtoId: 'prod-ima-5x5-avulso',
        produtoNome: 'Ímã 5x5 Avulso',
        data: '2025-02-10',
        quantidade: 12,
        precoUnitario: 12.5,
        custoUnitario: 3.2,
        desconto: 0,
        impostosPct: 0,
        taxaCartaoPct: 3.5,
        frete: 0,
        receita: 150.0,
        custoTotal: 38.4,
        lucroBruto: 111.6,
        lucroLiquido: 106.35,
        margemPct: 70.9,
        status: 'Entregue',
        observacoes: 'Fotos de viagem a Arraial do Cabo',
        criadoEm: '2025-02-10T14:30:00.000Z',
      },
    ],
  },
  {
    id: 'cli-2',
    nome: 'Juliana Siqueira Prado',
    endereco: 'Av. Lúcio Costa, 16000 - Barra da Tijuca, Rio de Janeiro - RJ',
    telefoneWhatsapp: '(21) 99123-8899',
    telefoneRecado: '',
    email: 'ju.prado@outlook.com',
    instagram: '@ju.prado.rj',
    facebook: '',
    tiktok: '',
    outrosCanais: 'Instagram Direct',
    consentimentoLgpd: true,
    dataConsentimentoLgpd: '2025-02-01T11:20:00.000Z',
    dataCadastro: '2025-02-01',
    pedidos: [
      {
        id: 'ped-102',
        clienteId: 'cli-2',
        clienteNome: 'Juliana Siqueira Prado',
        produtoId: 'prod-ima-festa',
        produtoNome: 'Ímã Festa (Lembrancinha)',
        data: '2025-02-18',
        quantidade: 40,
        precoUnitario: 11.5,
        custoUnitario: 2.72,
        desconto: 20.0,
        impostosPct: 0,
        taxaCartaoPct: 4.0,
        frete: 15.0,
        receita: 460.0,
        custoTotal: 108.8,
        lucroBruto: 331.2,
        lucroLiquido: 312.8,
        margemPct: 68.0,
        status: 'Pago',
        observacoes: 'Lembrancinhas de 1 ano do Theo',
        criadoEm: '2025-02-18T10:15:00.000Z',
      },
    ],
  },
  {
    id: 'cli-3',
    nome: 'Mariana Duarte Fontes',
    endereco: 'Rua Benvindo de Novaes, 880 - Recreio dos Bandeirantes, RJ',
    telefoneWhatsapp: '(21) 98444-5566',
    telefoneRecado: '',
    email: 'mari.fontes@gmail.com',
    instagram: '@marianafontes_',
    facebook: '',
    tiktok: '@mariduarte',
    outrosCanais: '',
    consentimentoLgpd: true,
    dataConsentimentoLgpd: '2025-02-20T14:45:00.000Z',
    dataCadastro: '2025-02-20',
    pedidos: [
      {
        id: 'ped-103',
        clienteId: 'cli-3',
        clienteNome: 'Mariana Duarte Fontes',
        produtoId: 'prod-kit-3-imas',
        produtoNome: 'Kit 3 Ímãs',
        data: '2025-02-25',
        quantidade: 3,
        precoUnitario: 39.9,
        custoUnitario: 8.64,
        desconto: 0,
        impostosPct: 0,
        taxaCartaoPct: 3.5,
        frete: 0,
        receita: 119.7,
        custoTotal: 25.92,
        lucroBruto: 93.78,
        lucroLiquido: 89.59,
        margemPct: 74.8,
        status: 'Fechado',
        observacoes: 'Fotos com o noivo',
        criadoEm: '2025-02-25T16:00:00.000Z',
      },
    ],
  },
]

export const AUDIT_PADRAO: AuditEntry[] = [
  {
    id: 'aud-seed-1',
    dataHora: new Date(Date.now() - 3600 * 24 * 5 * 1000).toISOString(),
    modulo: 'Sistema',
    acao: 'Inicialização',
    detalhe:
      'Sistema Bru Memórias inicializado com produtos, custos base e fornecedores do Recreio dos Bandeirantes/online.',
  },
  {
    id: 'aud-seed-2',
    dataHora: new Date(Date.now() - 3600 * 24 * 3 * 1000).toISOString(),
    modulo: 'Clientes',
    acao: 'Cliente cadastrado',
    detalhe: 'Cliente Camila Mendonça Rocha cadastrado com consentimento LGPD.',
  },
  {
    id: 'aud-seed-3',
    dataHora: new Date(Date.now() - 3600 * 24 * 2 * 1000).toISOString(),
    modulo: 'Calculadora',
    acao: 'Pedido salvo',
    detalhe: 'Pedido de 12 un para Camila Mendonça Rocha no valor de R$ 150,00.',
  },
]

// Insumos iniciais de estoque derivados dos itens de custo padrão
export const INSUMOS_ESTOQUE_PADRAO: InsumoEstoque[] = [
  {
    id: 'est-placa-magnetica',
    nome: 'Placa magnética',
    categoria: 'Base',
    unidade: 'folha',
    quantidadeAtual: 85,
    custoMedioUnitario: 0.6,
    estoqueMinimo: 30,
    criadoEm: '2025-01-10T10:00:00.000Z',
  },
  {
    id: 'est-impressao-foto',
    nome: 'Impressão da foto',
    categoria: 'Impressão',
    unidade: 'un',
    quantidadeAtual: 140,
    custoMedioUnitario: 0.45,
    estoqueMinimo: 50,
    criadoEm: '2025-01-10T10:00:00.000Z',
  },
  {
    id: 'est-papel-adesivo',
    nome: 'Papel/adesivo fotográfico',
    categoria: 'Papelaria',
    unidade: 'folha',
    quantidadeAtual: 18, // Estoque baixo para demonstração inicial do alerta
    custoMedioUnitario: 0.25,
    estoqueMinimo: 25,
    criadoEm: '2025-01-10T10:00:00.000Z',
  },
  {
    id: 'est-laminacao',
    nome: 'Laminação',
    categoria: 'Acabamento',
    unidade: 'metro',
    quantidadeAtual: 50,
    custoMedioUnitario: 0.15,
    estoqueMinimo: 20,
    criadoEm: '2025-01-10T10:00:00.000Z',
  },
  {
    id: 'est-corte-acabamento',
    nome: 'Corte e acabamento',
    categoria: 'Acabamento',
    unidade: 'un',
    quantidadeAtual: 200,
    custoMedioUnitario: 0.2,
    estoqueMinimo: 40,
    criadoEm: '2025-01-10T10:00:00.000Z',
  },
  {
    id: 'est-bolsinha-organza',
    nome: 'Bolsinha de organza',
    categoria: 'Embalagem',
    unidade: 'un',
    quantidadeAtual: 12, // Estoque baixo
    custoMedioUnitario: 0.18,
    estoqueMinimo: 30,
    criadoEm: '2025-01-10T10:00:00.000Z',
  },
  {
    id: 'est-etiqueta',
    nome: 'Etiqueta',
    categoria: 'Embalagem',
    unidade: 'un',
    quantidadeAtual: 95,
    custoMedioUnitario: 0.12,
    estoqueMinimo: 30,
    criadoEm: '2025-01-10T10:00:00.000Z',
  },
  {
    id: 'est-embalagem-envio',
    nome: 'Embalagem de envio',
    categoria: 'Embalagem',
    unidade: 'un',
    quantidadeAtual: 35,
    custoMedioUnitario: 0.35,
    estoqueMinimo: 20,
    criadoEm: '2025-01-10T10:00:00.000Z',
  },
]

export const MOVIMENTACOES_ESTOQUE_PADRAO: MovimentacaoEstoque[] = [
  {
    id: 'mov-1',
    itemId: 'est-placa-magnetica',
    itemNome: 'Placa magnética',
    data: '2025-02-05',
    tipo: 'entrada',
    quantidade: 100,
    custoUnitario: 0.6,
    motivo: 'compra',
    observacao: 'Compra Bazar Barra Bonita - Recreio',
    criadoEm: '2025-02-05T14:00:00.000Z',
  },
  {
    id: 'mov-2',
    itemId: 'est-placa-magnetica',
    itemNome: 'Placa magnética',
    data: '2025-02-10',
    tipo: 'saida',
    quantidade: 15,
    motivo: 'producao',
    observacao: 'Produção pedido Camila Mendonça',
    criadoEm: '2025-02-10T15:30:00.000Z',
  },
  {
    id: 'mov-3',
    itemId: 'est-papel-adesivo',
    itemNome: 'Papel/adesivo fotográfico',
    data: '2025-02-12',
    tipo: 'saida',
    quantidade: 32,
    motivo: 'producao',
    observacao: 'Produção lembrancinhas aniversário',
    criadoEm: '2025-02-12T11:00:00.000Z',
  },
  {
    id: 'mov-4',
    itemId: 'est-bolsinha-organza',
    itemNome: 'Bolsinha de organza',
    data: '2025-02-18',
    tipo: 'saida',
    quantidade: 40,
    motivo: 'venda',
    observacao: 'Envio pedido Juliana Siqueira',
    criadoEm: '2025-02-18T16:00:00.000Z',
  },
]

export const PRODUTOS_PRONTOS_PADRAO: ProdutoProntoItem[] = [
  {
    id: 'pp-ima-5x5-avulso',
    produtoId: 'prod-ima-5x5-avulso',
    produtoNome: 'Ímã 5x5 Avulso',
    quantidadeProduzida: 65,
    quantidadeVendida: 52,
    quantidadeDisponivel: 13,
    custoEstimadoUnitario: 3.2,
    observacao: 'Prontos para pronta entrega na feirinha ou direct',
    atualizadoEm: new Date().toISOString(),
  },
  {
    id: 'pp-kit-3-imas',
    produtoId: 'prod-kit-3-imas',
    produtoNome: 'Kit 3 Ímãs',
    quantidadeProduzida: 15,
    quantidadeVendida: 9,
    quantidadeDisponivel: 6,
    custoEstimadoUnitario: 8.64,
    observacao: 'Montados em bolsinhas de organza',
    atualizadoEm: new Date().toISOString(),
  },
  {
    id: 'pp-ima-festa',
    produtoId: 'prod-ima-festa',
    produtoNome: 'Ímã Festa (Lembrancinha)',
    quantidadeProduzida: 120,
    quantidadeVendida: 100,
    quantidadeDisponivel: 20,
    custoEstimadoUnitario: 2.72,
    observacao: 'Sobras de lote para mostruário',
    atualizadoEm: new Date().toISOString(),
  },
]

export const ESTOQUE_PADRAO: EstoqueData = {
  insumos: INSUMOS_ESTOQUE_PADRAO,
  movimentacoes: MOVIMENTACOES_ESTOQUE_PADRAO,
  produtosProntos: PRODUTOS_PRONTOS_PADRAO,
}

export const METAS_PADRAO: MetaVendas[] = [
  {
    id: 'meta-mensal-padrao',
    periodType: 'mensal',
    metaReceita: 2000,
    metaLucro: 1200,
    metaQuantidade: 150,
    criadoEm: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'meta-semanal-padrao',
    periodType: 'semanal',
    metaReceita: 500,
    metaLucro: 300,
    metaQuantidade: 40,
    criadoEm: '2025-01-01T00:00:00.000Z',
  },
]

export const SETTINGS_PADRAO: AppSettings = {
  margemMinimaPct: 40,
  produtoAtivoId: 'prod-ima-5x5-avulso',
  onboardingDispensado: false,
  abaAtiva: 'custos',
}

// Carregar e persistir dados locais
export function carregarDados(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DATA)
    if (!raw) {
      const inicial: AppData = {
        produtos: PRODUTOS_PADRAO,
        clientes: CLIENTES_PADRAO,
        fornecedores: FORNECEDORES_PADRAO,
        estoque: ESTOQUE_PADRAO,
        metasVendas: METAS_PADRAO,
        version: 1,
      }
      salvarDados(inicial)
      return inicial
    }
    const parsed = JSON.parse(raw) as AppData
    if (!parsed.produtos || !Array.isArray(parsed.produtos)) {
      throw new Error('Formato inválido')
    }
    let precisaSalvar = false
    // Garante retrocompatibilidade se a propriedade estoque ainda não existir no localStorage existente
    if (!parsed.estoque || !Array.isArray(parsed.estoque.insumos)) {
      parsed.estoque = ESTOQUE_PADRAO
      precisaSalvar = true
    }
    // Garante retrocompatibilidade se metasVendas não existir no localStorage
    if (!parsed.metasVendas || !Array.isArray(parsed.metasVendas)) {
      parsed.metasVendas = METAS_PADRAO
      precisaSalvar = true
    }
    if (precisaSalvar) {
      salvarDados(parsed)
    }
    return parsed
  } catch (err) {
    console.warn('Dados corrompidos no localStorage. Restaurando padrões.', err)
    const defaults: AppData = {
      produtos: PRODUTOS_PADRAO,
      clientes: CLIENTES_PADRAO,
      fornecedores: FORNECEDORES_PADRAO,
      estoque: ESTOQUE_PADRAO,
      metasVendas: METAS_PADRAO,
      version: 1,
    }
    salvarDados(defaults)
    return defaults
  }
}

export function salvarDados(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DATA, JSON.stringify(data))
  } catch (e) {
    console.error('Falha ao salvar dados no localStorage', e)
  }
}

export function carregarAuditoria(): AuditEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT)
    if (!raw) {
      salvarAuditoria(AUDIT_PADRAO)
      return AUDIT_PADRAO
    }
    return JSON.parse(raw) as AuditEntry[]
  } catch (e) {
    console.warn('Auditoria corrompida, reinicializando', e)
    salvarAuditoria(AUDIT_PADRAO)
    return AUDIT_PADRAO
  }
}

export function salvarAuditoria(audit: AuditEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(audit))
  } catch (e) {
    console.error('Falha ao salvar auditoria', e)
  }
}

export function registrarAuditoria(
  modulo: AuditEntry['modulo'],
  acao: string,
  detalhe: string,
): void {
  try {
    const atual = carregarAuditoria()
    const novaEntrada: AuditEntry = {
      id: 'aud-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      dataHora: new Date().toISOString(),
      modulo,
      acao,
      detalhe,
    }
    const atualizado = [novaEntrada, ...atual]
    salvarAuditoria(atualizado)
  } catch (e) {
    console.error('Erro ao registrar auditoria', e)
  }
}

export function carregarConfiguracoes(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS)
    if (!raw) {
      salvarConfiguracoes(SETTINGS_PADRAO)
      return SETTINGS_PADRAO
    }
    return { ...SETTINGS_PADRAO, ...JSON.parse(raw) }
  } catch {
    return SETTINGS_PADRAO
  }
}

export function salvarConfiguracoes(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
  } catch (e) {
    console.error('Falha ao salvar configurações', e)
  }
}
