// Utilitários de cálculo, filtros temporais e exportação CSV para Relatórios Avançados de Vendas
// Fonte única de verdade compartilhada entre os módulos Painel e Relatórios.
import { PedidoCliente, Cliente, ProdutoKit } from '@/types/app'
import { formatarMoeda, formatarDataPtBR } from './formatters'

export type PeriodoFocoRelatorio = 'produtos' | 'clientes' | 'canais' | 'resumo'

export type PeriodoRelatorioTipo =
  | 'hoje'
  | '7d'
  | 'mes_atual'
  | 'mes_anterior'
  | 'ano_atual'
  | 'ano_anterior'
  | 'personalizado'

export interface IntervaloDatas {
  inicio: string // YYYY-MM-DD
  fim: string // YYYY-MM-DD
}

export interface KpiComComparativo {
  atual: number
  anterior: number
  variacaoPct: number | null // null se anterior for 0
  tendencia: 'alta' | 'baixa' | 'estavel'
}

export interface ResumoPeriodoKPIs {
  receitaTotal: KpiComComparativo
  lucroTotal: KpiComComparativo
  ticketMedio: KpiComComparativo
  quantidadeTotal: KpiComComparativo
  margemMedia: number
  pedidosCount: number
}

export interface VendaProdutoReport {
  produtoId: string
  produtoNome: string
  quantidade: number
  receita: number
  custo: number
  lucro: number
  margemPct: number
  participacaoPct: number
  pedidosCount: number
  precoMedioPraticado: number
  classeAbc?: 'A' | 'B' | 'C'
  acumuladoPct?: number
}

export interface RankingClienteReport {
  clienteId: string
  clienteNome: string
  telefoneWhatsapp: string
  cidadeOuBairro: string
  receitaTotal: number
  quantidadeTotal: number
  pedidosCount: number
  ticketMedio: number
  lucroTotal: number
  ultimaCompraData: string
  diasSemComprar: number
  canalPrincipal: string
}

export interface CanalVendaReport {
  canal: string
  receita: number
  quantidade: number
  pedidosCount: number
  participacaoPct: number
}

export interface FaixaPrecoReport {
  faixa: string
  quantidade: number
  receita: number
  custo: number
  lucro: number
  margemPct: number
}

export interface SerieTemporalPonto {
  chave: string
  label: string
  dataCompleta: string
  receita: number
  lucro: number
  quantidade: number
  pedidosCount: number
}

export interface DiaSemanaReport {
  diaSemana: number // 0 (Domingo) a 6 (Sábado)
  label: string
  receita: number
  pedidosCount: number
  quantidade: number
}

export interface HorarioReport {
  faixa: string // '08h - 12h', '12h - 18h', '18h - 22h', '22h - 08h'
  pedidosCount: number
  receita: number
}

export interface ProjecaoVendas {
  mediaDiariaReceita: number
  mediaDiariaQuantidade: number
  diasNoPeriodo: number
  diasDecorridosOuTotais: number
  projecaoProximoMesReceita: number
  projecaoProximoMesQuantidade: number
  diasMesSeguinte: number
}

// Formata data Date -> YYYY-MM-DD local
export function paraYmd(d: Date): string {
  const ano = d.getFullYear()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

// Parse YYYY-MM-DD em objeto Date local
export function deYmd(ymd: string): Date {
  const [ano, mes, dia] = ymd.split('-').map(Number)
  return new Date(ano, (mes || 1) - 1, dia || 1, 12, 0, 0)
}

// Obtém intervalo atual e intervalo anterior de mesma duração
export function obterIntervalosPeriodo(
  tipo: PeriodoRelatorioTipo,
  customInicio?: string,
  customFim?: string,
): { atual: IntervaloDatas; anterior: IntervaloDatas; label: string } {
  const agora = new Date()
  const hojeYmd = paraYmd(agora)

  let atual: IntervaloDatas = { inicio: hojeYmd, fim: hojeYmd }
  let label = 'Hoje'

  if (tipo === 'hoje') {
    atual = { inicio: hojeYmd, fim: hojeYmd }
    label = `Hoje (${formatarDataPtBR(hojeYmd)})`
  } else if (tipo === '7d') {
    const inicio = new Date(agora)
    inicio.setDate(agora.getDate() - 6)
    atual = { inicio: paraYmd(inicio), fim: hojeYmd }
    label = 'Última semana'
  } else if (tipo === 'mes_atual') {
    const inicio = new Date(agora.getFullYear(), agora.getMonth(), 1)
    const fim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0)
    atual = { inicio: paraYmd(inicio), fim: paraYmd(fim) }
    const nomeMes = agora.toLocaleString('pt-BR', { month: 'long' })
    label = `Este mês (${nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)}/${agora.getFullYear()})`
  } else if (tipo === 'mes_anterior') {
    const inicio = new Date(agora.getFullYear(), agora.getMonth() - 1, 1)
    const fim = new Date(agora.getFullYear(), agora.getMonth(), 0)
    atual = { inicio: paraYmd(inicio), fim: paraYmd(fim) }
    const nomeMes = inicio.toLocaleString('pt-BR', { month: 'long' })
    label = `Mês passado (${nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)}/${inicio.getFullYear()})`
  } else if (tipo === 'ano_atual') {
    const inicio = new Date(agora.getFullYear(), 0, 1)
    const fim = new Date(agora.getFullYear(), 11, 31)
    atual = { inicio: paraYmd(inicio), fim: paraYmd(fim) }
    label = `Este ano (${agora.getFullYear()})`
  } else if (tipo === 'ano_anterior') {
    const anoAnt = agora.getFullYear() - 1
    const inicio = new Date(anoAnt, 0, 1)
    const fim = new Date(anoAnt, 11, 31)
    atual = { inicio: paraYmd(inicio), fim: paraYmd(fim) }
    label = `Ano passado (${anoAnt})`
  } else if (tipo === 'personalizado') {
    const ini = customInicio || hojeYmd
    const fim = customFim || hojeYmd
    // Garante ordem correta
    if (ini <= fim) {
      atual = { inicio: ini, fim }
    } else {
      atual = { inicio: fim, fim: ini }
    }
    label = `Personalizado (${formatarDataPtBR(atual.inicio)} até ${formatarDataPtBR(atual.fim)})`
  }

  // Calcular período anterior imediato com a mesma duração exata em dias
  const dataIniAtual = deYmd(atual.inicio)
  const dataFimAtual = deYmd(atual.fim)
  const diffTime = Math.abs(dataFimAtual.getTime() - dataIniAtual.getTime())
  const diffDias = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1

  const dataFimAnterior = new Date(dataIniAtual)
  dataFimAnterior.setDate(dataIniAtual.getDate() - 1)

  const dataIniAnterior = new Date(dataFimAnterior)
  dataIniAnterior.setDate(dataFimAnterior.getDate() - diffDias + 1)

  const anterior: IntervaloDatas = {
    inicio: paraYmd(dataIniAnterior),
    fim: paraYmd(dataFimAnterior),
  }

  return { atual, anterior, label }
}

// Filtra pedidos pertencentes a um intervalo
export function filtrarPedidosPorIntervalo(
  pedidos: PedidoCliente[],
  intervalo: IntervaloDatas,
): PedidoCliente[] {
  return pedidos.filter((p) => p.data >= intervalo.inicio && p.data <= intervalo.fim)
}

// Calcula variação percentual
export function calcularVariacao(
  atual: number,
  anterior: number,
): {
  variacaoPct: number | null
  tendencia: 'alta' | 'baixa' | 'estavel'
} {
  if (anterior === 0) {
    if (atual === 0) return { variacaoPct: 0, tendencia: 'estavel' }
    return { variacaoPct: null, tendencia: 'alta' }
  }
  const variacao = ((atual - anterior) / Math.abs(anterior)) * 100
  let tendencia: 'alta' | 'baixa' | 'estavel' = 'estavel'
  if (variacao > 0.05) tendencia = 'alta'
  else if (variacao < -0.05) tendencia = 'baixa'
  return { variacaoPct: variacao, tendencia }
}

// Calcula KPIs do período com comparação direta
export function calcularKPIsResumo(
  pedidosAtual: PedidoCliente[],
  pedidosAnterior: PedidoCliente[],
): ResumoPeriodoKPIs {
  const receitaAtual = pedidosAtual.reduce((acc, p) => acc + (p.receita || 0), 0)
  const lucroAtual = pedidosAtual.reduce((acc, p) => acc + (p.lucroLiquido || 0), 0)
  const qtdAtual = pedidosAtual.reduce((acc, p) => acc + (p.quantidade || 0), 0)
  const pedCountAtual = pedidosAtual.length
  const ticketAtual = pedCountAtual > 0 ? receitaAtual / pedCountAtual : 0
  const margemMedia = receitaAtual > 0 ? (lucroAtual / receitaAtual) * 100 : 0

  const receitaAnt = pedidosAnterior.reduce((acc, p) => acc + (p.receita || 0), 0)
  const lucroAnt = pedidosAnterior.reduce((acc, p) => acc + (p.lucroLiquido || 0), 0)
  const qtdAnt = pedidosAnterior.reduce((acc, p) => acc + (p.quantidade || 0), 0)
  const pedCountAnt = pedidosAnterior.length
  const ticketAnt = pedCountAnt > 0 ? receitaAnt / pedCountAnt : 0

  const varReceita = calcularVariacao(receitaAtual, receitaAnt)
  const varLucro = calcularVariacao(lucroAtual, lucroAnt)
  const varTicket = calcularVariacao(ticketAtual, ticketAnt)
  const varQtd = calcularVariacao(qtdAtual, qtdAnt)

  return {
    receitaTotal: {
      atual: receitaAtual,
      anterior: receitaAnt,
      variacaoPct: varReceita.variacaoPct,
      tendencia: varReceita.tendencia,
    },
    lucroTotal: {
      atual: lucroAtual,
      anterior: lucroAnt,
      variacaoPct: varLucro.variacaoPct,
      tendencia: varLucro.tendencia,
    },
    ticketMedio: {
      atual: ticketAtual,
      anterior: ticketAnt,
      variacaoPct: varTicket.variacaoPct,
      tendencia: varTicket.tendencia,
    },
    quantidadeTotal: {
      atual: qtdAtual,
      anterior: qtdAnt,
      variacaoPct: varQtd.variacaoPct,
      tendencia: varQtd.tendencia,
    },
    margemMedia,
    pedidosCount: pedCountAtual,
  }
}

// Calcula Curva ABC e vendas por produto
export function calcularVendasPorProduto(
  pedidos: PedidoCliente[],
  produtosCatalogo: ProdutoKit[],
): VendaProdutoReport[] {
  const mapa: Record<string, VendaProdutoReport> = {}

  // Inicializa produtos do catálogo para manter histórico coerente
  produtosCatalogo.forEach((p) => {
    mapa[p.id] = {
      produtoId: p.id,
      produtoNome: p.nome,
      quantidade: 0,
      receita: 0,
      custo: 0,
      lucro: 0,
      margemPct: 0,
      participacaoPct: 0,
      pedidosCount: 0,
      precoMedioPraticado: 0,
    }
  })

  // Agrega dados dos pedidos
  pedidos.forEach((p) => {
    const id = p.produtoId || p.produtoNome || 'outro'
    if (!mapa[id]) {
      mapa[id] = {
        produtoId: id,
        produtoNome: p.produtoNome || 'Produto Avulso',
        quantidade: 0,
        receita: 0,
        custo: 0,
        lucro: 0,
        margemPct: 0,
        participacaoPct: 0,
        pedidosCount: 0,
        precoMedioPraticado: 0,
      }
    }
    mapa[id].quantidade += p.quantidade || 0
    mapa[id].receita += p.receita || 0
    mapa[id].custo += p.custoTotal || 0
    mapa[id].lucro += p.lucroLiquido || 0
    mapa[id].pedidosCount += 1
  })

  const lista = Object.values(mapa).filter((item) => item.quantidade > 0 || item.receita > 0)
  const totalReceitaGeral = lista.reduce((acc, it) => acc + it.receita, 0)

  // Ordena por receita decrescente para cálculo da Curva ABC
  lista.sort((a, b) => b.receita - a.receita)

  let acumulado = 0
  lista.forEach((item) => {
    item.margemPct = item.receita > 0 ? (item.lucro / item.receita) * 100 : 0
    item.participacaoPct = totalReceitaGeral > 0 ? (item.receita / totalReceitaGeral) * 100 : 0
    item.precoMedioPraticado = item.quantidade > 0 ? item.receita / item.quantidade : 0

    acumulado += item.participacaoPct
    item.acumuladoPct = acumulado

    if (acumulado <= 80 || lista.indexOf(item) === 0) {
      item.classeAbc = 'A'
    } else if (acumulado <= 95) {
      item.classeAbc = 'B'
    } else {
      item.classeAbc = 'C'
    }
  })

  return lista
}

// Ranking de clientes que mais compraram no período
export function calcularRankingClientes(
  pedidos: PedidoCliente[],
  clientes: Cliente[],
): RankingClienteReport[] {
  const mapa: Record<string, RankingClienteReport> = {}
  const agora = new Date()

  // Mapeia canais do cliente
  const clienteCanalMap: Record<
    string,
    { canal: string; cidadeOuBairro: string; whatsapp: string }
  > = {}
  clientes.forEach((cli) => {
    let canal = 'Direto'
    if (cli.instagram) canal = 'Instagram'
    else if (cli.outrosCanais) canal = cli.outrosCanais
    else if (cli.facebook) canal = 'Facebook'
    else if (cli.tiktok) canal = 'TikTok'

    let cidadeOuBairro = 'Rio de Janeiro'
    if (cli.endereco) {
      const matchBairro = cli.endereco.match(/Recreio|Barra|Tijuca|Zona Oeste|Zona Sul/i)
      cidadeOuBairro = matchBairro ? matchBairro[0] : cli.endereco.split('-')[0] || 'RJ'
    }

    clienteCanalMap[cli.id] = {
      canal,
      cidadeOuBairro,
      whatsapp: cli.telefoneWhatsapp || '',
    }
  })

  pedidos.forEach((p) => {
    const cid = p.clienteId || 'desconhecido'
    const extra = clienteCanalMap[cid] || {
      canal: 'Outros',
      cidadeOuBairro: 'RJ',
      whatsapp: '',
    }

    if (!mapa[cid]) {
      mapa[cid] = {
        clienteId: cid,
        clienteNome: p.clienteNome || 'Cliente Não Identificado',
        telefoneWhatsapp: extra.whatsapp,
        cidadeOuBairro: extra.cidadeOuBairro,
        receitaTotal: 0,
        quantidadeTotal: 0,
        pedidosCount: 0,
        ticketMedio: 0,
        lucroTotal: 0,
        ultimaCompraData: p.data,
        diasSemComprar: 0,
        canalPrincipal: extra.canal,
      }
    }

    mapa[cid].receitaTotal += p.receita || 0
    mapa[cid].quantidadeTotal += p.quantidade || 0
    mapa[cid].lucroTotal += p.lucroLiquido || 0
    mapa[cid].pedidosCount += 1

    if (p.data > mapa[cid].ultimaCompraData) {
      mapa[cid].ultimaCompraData = p.data
    }
  })

  const lista = Object.values(mapa)
  lista.forEach((item) => {
    item.ticketMedio = item.pedidosCount > 0 ? item.receitaTotal / item.pedidosCount : 0
    const dataUlt = deYmd(item.ultimaCompraData)
    const diff = Math.max(
      0,
      Math.floor((agora.getTime() - dataUlt.getTime()) / (1000 * 60 * 60 * 24)),
    )
    item.diasSemComprar = diff
  })

  // Ordena por maior valor gasto
  lista.sort((a, b) => b.receitaTotal - a.receitaTotal)
  return lista
}

// Vendas por canal de origem do cliente
export function calcularVendasPorCanal(
  pedidos: PedidoCliente[],
  clientes: Cliente[],
): CanalVendaReport[] {
  const canalPorCliente: Record<string, string> = {}
  clientes.forEach((cli) => {
    let canal = 'WhatsApp / Direto'
    const outros = (cli.outrosCanais || '').toLowerCase()
    if (outros.includes('feira') || outros.includes('evento')) {
      canal = 'Feiras & Eventos'
    } else if (outros.includes('indica') || outros.includes('amig')) {
      canal = 'Indicação'
    } else if (cli.instagram || outros.includes('insta')) {
      canal = 'Instagram'
    } else if (cli.facebook || outros.includes('face')) {
      canal = 'Facebook'
    } else if (cli.tiktok) {
      canal = 'TikTok'
    } else if (cli.outrosCanais) {
      canal = cli.outrosCanais
    }
    canalPorCliente[cli.id] = canal
  })

  const mapa: Record<string, CanalVendaReport> = {}

  pedidos.forEach((p) => {
    const canal = canalPorCliente[p.clienteId] || 'Outros'
    if (!mapa[canal]) {
      mapa[canal] = {
        canal,
        receita: 0,
        quantidade: 0,
        pedidosCount: 0,
        participacaoPct: 0,
      }
    }
    mapa[canal].receita += p.receita || 0
    mapa[canal].quantidade += p.quantidade || 0
    mapa[canal].pedidosCount += 1
  })

  const lista = Object.values(mapa)
  const totalReceita = lista.reduce((acc, c) => acc + c.receita, 0)
  lista.forEach((c) => {
    c.participacaoPct = totalReceita > 0 ? (c.receita / totalReceita) * 100 : 0
  })

  lista.sort((a, b) => b.receita - a.receita)
  return lista
}

// Vendas e lucros por faixa de preço oficial (avulso, kit, lembrancinha/festa, atacado)
export function calcularVendasPorFaixaPreco(pedidos: PedidoCliente[]): FaixaPrecoReport[] {
  const faixas: { nome: string; min: number; max: number }[] = [
    { nome: '1 a 4 un (Avulso)', min: 1, max: 4 },
    { nome: '5 a 25 un (Kits pequenos)', min: 5, max: 25 },
    { nome: '26 a 50 un (Festas)', min: 26, max: 50 },
    { nome: '51 a 100 un (Lembrancinhas)', min: 51, max: 100 },
    { nome: 'Acima de 100 un (Atacado)', min: 101, max: Infinity },
  ]

  const resultados: Record<string, FaixaPrecoReport> = {}
  faixas.forEach((f) => {
    resultados[f.nome] = {
      faixa: f.nome,
      quantidade: 0,
      receita: 0,
      custo: 0,
      lucro: 0,
      margemPct: 0,
    }
  })

  pedidos.forEach((p) => {
    const qtd = p.quantidade || 1
    const faixaObj = faixas.find((f) => qtd >= f.min && qtd <= f.max) || faixas[0]
    const r = resultados[faixaObj.nome]
    r.quantidade += qtd
    r.receita += p.receita || 0
    r.custo += p.custoTotal || 0
    r.lucro += p.lucroLiquido || 0
  })

  return Object.values(resultados).map((f) => ({
    ...f,
    margemPct: f.receita > 0 ? (f.lucro / f.receita) * 100 : 0,
  }))
}

// Evolução temporal agregada por dia ou mês conforme extensão do período
export function calcularEvolucaoTemporal(
  pedidos: PedidoCliente[],
  intervalo: IntervaloDatas,
): SerieTemporalPonto[] {
  const dIni = deYmd(intervalo.inicio)
  const dFim = deYmd(intervalo.fim)
  const diffDias = Math.round((dFim.getTime() - dIni.getTime()) / (1000 * 60 * 60 * 24)) + 1

  const mesesNomes = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
  ]

  // Se período <= 35 dias, agrega por DIA
  if (diffDias <= 35) {
    const mapaDias: Record<string, SerieTemporalPonto> = {}
    const cur = new Date(dIni)
    while (cur <= dFim) {
      const chave = paraYmd(cur)
      const [, mes, dia] = chave.split('-')
      mapaDias[chave] = {
        chave,
        label: `${dia}/${mes}`,
        dataCompleta: chave,
        receita: 0,
        lucro: 0,
        quantidade: 0,
        pedidosCount: 0,
      }
      cur.setDate(cur.getDate() + 1)
    }

    pedidos.forEach((p) => {
      if (mapaDias[p.data]) {
        mapaDias[p.data].receita += p.receita || 0
        mapaDias[p.data].lucro += p.lucroLiquido || 0
        mapaDias[p.data].quantidade += p.quantidade || 0
        mapaDias[p.data].pedidosCount += 1
      }
    })

    return Object.values(mapaDias)
  }

  // Se período > 35 dias, agrega por MÊS
  const mapaMeses: Record<string, SerieTemporalPonto> = {}
  const cur = new Date(dIni.getFullYear(), dIni.getMonth(), 1)
  const limiteFim = new Date(dFim.getFullYear(), dFim.getMonth() + 1, 0)

  while (cur <= limiteFim) {
    const ano = cur.getFullYear()
    const mesNum = cur.getMonth() + 1
    const mesStr = String(mesNum).padStart(2, '0')
    const chave = `${ano}-${mesStr}`
    mapaMeses[chave] = {
      chave,
      label: `${mesesNomes[mesNum - 1]}/${String(ano).slice(2)}`,
      dataCompleta: `${chave}-01`,
      receita: 0,
      lucro: 0,
      quantidade: 0,
      pedidosCount: 0,
    }
    cur.setMonth(cur.getMonth() + 1)
  }

  pedidos.forEach((p) => {
    const chaveMes = p.data.slice(0, 7)
    if (mapaMeses[chaveMes]) {
      mapaMeses[chaveMes].receita += p.receita || 0
      mapaMeses[chaveMes].lucro += p.lucroLiquido || 0
      mapaMeses[chaveMes].quantidade += p.quantidade || 0
      mapaMeses[chaveMes].pedidosCount += 1
    }
  })

  return Object.values(mapaMeses)
}

// Melhores dias da semana para vendas
export function calcularMelhoresDiasSemana(pedidos: PedidoCliente[]): DiaSemanaReport[] {
  const nomesDias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
  const reports: DiaSemanaReport[] = nomesDias.map((label, diaSemana) => ({
    diaSemana,
    label,
    receita: 0,
    pedidosCount: 0,
    quantidade: 0,
  }))

  pedidos.forEach((p) => {
    const d = deYmd(p.data)
    const dia = d.getDay()
    reports[dia].receita += p.receita || 0
    reports[dia].quantidade += p.quantidade || 0
    reports[dia].pedidosCount += 1
  })

  return reports
}

// Melhores faixas de horário (usando criadoEm quando disponível)
export function calcularHorariosVenda(pedidos: PedidoCliente[]): HorarioReport[] {
  const faixas: Record<string, HorarioReport> = {
    manha: { faixa: 'Manhã (08h às 12h)', pedidosCount: 0, receita: 0 },
    tarde: { faixa: 'Tarde (12h às 18h)', pedidosCount: 0, receita: 0 },
    noite: { faixa: 'Noite (18h às 23h)', pedidosCount: 0, receita: 0 },
    madrugada: { faixa: 'Madrugada (23h às 08h)', pedidosCount: 0, receita: 0 },
  }

  pedidos.forEach((p) => {
    let hora = 14 // padrão tarde se não houver horário ISO
    if (p.criadoEm) {
      try {
        const d = new Date(p.criadoEm)
        if (!isNaN(d.getTime())) {
          hora = d.getHours()
        }
      } catch {
        hora = 14
      }
    }

    if (hora >= 8 && hora < 12) {
      faixas.manha.pedidosCount += 1
      faixas.manha.receita += p.receita || 0
    } else if (hora >= 12 && hora < 18) {
      faixas.tarde.pedidosCount += 1
      faixas.tarde.receita += p.receita || 0
    } else if (hora >= 18 && hora < 23) {
      faixas.noite.pedidosCount += 1
      faixas.noite.receita += p.receita || 0
    } else {
      faixas.madrugada.pedidosCount += 1
      faixas.madrugada.receita += p.receita || 0
    }
  })

  return Object.values(faixas)
}

// Previsão simples: média diária e projeção para o mês seguinte
export function calcularProjecaoSimples(
  pedidos: PedidoCliente[],
  intervalo: IntervaloDatas,
): ProjecaoVendas {
  const dIni = deYmd(intervalo.inicio)
  const dFim = deYmd(intervalo.fim)
  const diffDias = Math.max(
    1,
    Math.round((dFim.getTime() - dIni.getTime()) / (1000 * 60 * 60 * 24)) + 1,
  )

  const receitaTotal = pedidos.reduce((acc, p) => acc + (p.receita || 0), 0)
  const qtdTotal = pedidos.reduce((acc, p) => acc + (p.quantidade || 0), 0)

  const mediaDiariaReceita = receitaTotal / diffDias
  const mediaDiariaQuantidade = qtdTotal / diffDias

  // Dias do mês subsequente
  const proximoMesData = new Date(dFim.getFullYear(), dFim.getMonth() + 1, 1)
  const diasMesSeguinte = new Date(
    proximoMesData.getFullYear(),
    proximoMesData.getMonth() + 1,
    0,
  ).getDate()

  const projecaoProximoMesReceita = mediaDiariaReceita * diasMesSeguinte
  const projecaoProximoMesQuantidade = Math.round(mediaDiariaQuantidade * diasMesSeguinte)

  return {
    mediaDiariaReceita,
    mediaDiariaQuantidade,
    diasNoPeriodo: diffDias,
    diasDecorridosOuTotais: diffDias,
    projecaoProximoMesReceita,
    projecaoProximoMesQuantidade,
    diasMesSeguinte,
  }
}

// ---------------- EXPORTAÇÕES CSV PT-BR FORMATADAS COM BOM ----------------

function baixarCsv(nomeArquivo: string, csvConteudo: string): void {
  const blob = new Blob(['\uFEFF' + csvConteudo], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', nomeArquivo)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Exporta Resumo Completo do Relatório
export function exportarCsvRelatorioCompleto(
  intervalo: IntervaloDatas,
  labelPeriodo: string,
  kpis: ResumoPeriodoKPIs,
  produtos: VendaProdutoReport[],
  clientesRanking: RankingClienteReport[],
  pedidos: PedidoCliente[],
): void {
  const linhas: string[] = []

  linhas.push('BRU MEMÓRIAS PERSONALIZADOS - "Pequenos detalhes. Grandes lembranças."')
  linhas.push(
    'EMBLEMA OFICIAL: Ímãs Personalizados 5x5 • Rio de Janeiro • Central do Administrador',
  )
  linhas.push(
    `Período Selecionado;${labelPeriodo};De;${formatarDataPtBR(intervalo.inicio)};Até;${formatarDataPtBR(intervalo.fim)}`,
  )
  linhas.push(`Gerado em;${formatarDataPtBR(paraYmd(new Date()))}`)
  linhas.push('')

  linhas.push('1. RESUMO GERAL DO PERÍODO')
  linhas.push('Métrica;Valor Atual;Valor Período Anterior;Variação %')
  linhas.push(
    `Receita Total;${formatarMoeda(kpis.receitaTotal.atual)};${formatarMoeda(kpis.receitaTotal.anterior)};${kpis.receitaTotal.variacaoPct !== null ? kpis.receitaTotal.variacaoPct.toFixed(1).replace('.', ',') + '%' : '-'}`,
  )
  linhas.push(
    `Lucro Líquido;${formatarMoeda(kpis.lucroTotal.atual)};${formatarMoeda(kpis.lucroTotal.anterior)};${kpis.lucroTotal.variacaoPct !== null ? kpis.lucroTotal.variacaoPct.toFixed(1).replace('.', ',') + '%' : '-'}`,
  )
  linhas.push(
    `Ticket Médio;${formatarMoeda(kpis.ticketMedio.atual)};${formatarMoeda(kpis.ticketMedio.anterior)};${kpis.ticketMedio.variacaoPct !== null ? kpis.ticketMedio.variacaoPct.toFixed(1).replace('.', ',') + '%' : '-'}`,
  )
  linhas.push(
    `Ímãs Vendidos;${kpis.quantidadeTotal.atual};${kpis.quantidadeTotal.anterior};${kpis.quantidadeTotal.variacaoPct !== null ? kpis.quantidadeTotal.variacaoPct.toFixed(1).replace('.', ',') + '%' : '-'}`,
  )
  linhas.push(`Margem Média;${kpis.margemMedia.toFixed(1).replace('.', ',')}%;;`)
  linhas.push(`Total de Pedidos;${kpis.pedidosCount};;`)
  linhas.push('')

  linhas.push('2. VENDAS POR PRODUTO / CURVA ABC')
  linhas.push(
    'Produto;Classe ABC;Qtd Vendida;Receita (R$);Custo (R$);Lucro (R$);Margem %;Participação %;Acumulado %',
  )
  produtos.forEach((p) => {
    linhas.push(
      [
        `"${p.produtoNome.replace(/"/g, '""')}"`,
        p.classeAbc || '-',
        p.quantidade,
        formatarMoeda(p.receita).replace('R$', '').trim(),
        formatarMoeda(p.custo).replace('R$', '').trim(),
        formatarMoeda(p.lucro).replace('R$', '').trim(),
        `${p.margemPct.toFixed(1).replace('.', ',')}%`,
        `${p.participacaoPct.toFixed(1).replace('.', ',')}%`,
        `${(p.acumuladoPct || 0).toFixed(1).replace('.', ',')}%`,
      ].join(';'),
    )
  })
  linhas.push('')

  linhas.push('3. TOP CLIENTES DO PERÍODO')
  linhas.push(
    'Posição;Cliente;WhatsApp;Local;Total Gasto (R$);Qtd Ímãs;Pedidos;Ticket Médio (R$);Última Compra',
  )
  clientesRanking.slice(0, 50).forEach((cli, idx) => {
    linhas.push(
      [
        idx + 1,
        `"${cli.clienteNome.replace(/"/g, '""')}"`,
        `"${cli.telefoneWhatsapp}"`,
        `"${cli.cidadeOuBairro}"`,
        formatarMoeda(cli.receitaTotal).replace('R$', '').trim(),
        cli.quantidadeTotal,
        cli.pedidosCount,
        formatarMoeda(cli.ticketMedio).replace('R$', '').trim(),
        formatarDataPtBR(cli.ultimaCompraData),
      ].join(';'),
    )
  })
  linhas.push('')

  linhas.push('4. DETALHAMENTO DOS PEDIDOS DO PERÍODO')
  linhas.push(
    'ID Pedido;Data;Cliente;Produto;Qtd;Preço Unit (R$);Receita (R$);Custo (R$);Lucro (R$);Margem %;Status',
  )
  pedidos.forEach((ped) => {
    linhas.push(
      [
        `"${ped.id}"`,
        formatarDataPtBR(ped.data),
        `"${(ped.clienteNome || '').replace(/"/g, '""')}"`,
        `"${(ped.produtoNome || '').replace(/"/g, '""')}"`,
        ped.quantidade,
        formatarMoeda(ped.precoUnitario).replace('R$', '').trim(),
        formatarMoeda(ped.receita).replace('R$', '').trim(),
        formatarMoeda(ped.custoTotal).replace('R$', '').trim(),
        formatarMoeda(ped.lucroLiquido).replace('R$', '').trim(),
        `${(ped.margemPct || 0).toFixed(1).replace('.', ',')}%`,
        ped.status,
      ].join(';'),
    )
  })

  const nomeArquivo = `bru-memorias-relatorio-vendas-${intervalo.inicio}-a-${intervalo.fim}.csv`
  baixarCsv(nomeArquivo, linhas.join('\r\n'))
}

// Exporta Vendas por Produto isolado em CSV
export function exportarCsvVendasProduto(
  produtos: VendaProdutoReport[],
  periodoLabel: string,
): void {
  const header = [
    'Produto',
    'Classe ABC',
    'Qtd Vendida',
    'Receita Total (R$)',
    'Custo Total (R$)',
    'Lucro Líquido (R$)',
    'Margem (%)',
    'Participação (%)',
  ]
  const rows = produtos.map((p) =>
    [
      `"${p.produtoNome.replace(/"/g, '""')}"`,
      p.classeAbc || '-',
      p.quantidade,
      formatarMoeda(p.receita).replace('R$', '').trim(),
      formatarMoeda(p.custo).replace('R$', '').trim(),
      formatarMoeda(p.lucro).replace('R$', '').trim(),
      `${p.margemPct.toFixed(1).replace('.', ',')}%`,
      `${p.participacaoPct.toFixed(1).replace('.', ',')}%`,
    ].join(';'),
  )
  const conteudo = [
    `Relatório de Vendas por Produto - Período: ${periodoLabel}`,
    'BRU MEMÓRIAS PERSONALIZADOS - "Pequenos detalhes. Grandes lembranças."',
    'EMBLEMA OFICIAL: Ímãs Personalizados 5x5 • Rio de Janeiro',
    header.join(';'),
    ...rows,
  ].join('\r\n')
  baixarCsv(`bru-memorias-vendas-produtos-${paraYmd(new Date())}.csv`, conteudo)
}

// Exporta Ranking de Clientes isolado em CSV
export function exportarCsvRankingClientes(
  ranking: RankingClienteReport[],
  periodoLabel: string,
): void {
  const header = [
    'Posição',
    'Cliente',
    'WhatsApp',
    'Bairro/Cidade',
    'Total Comprado (R$)',
    'Qtd de Ímãs',
    'Nº de Pedidos',
    'Ticket Médio (R$)',
    'Lucro Gerado (R$)',
    'Última Compra',
    'Canal',
  ]
  const rows = ranking.map((c, idx) =>
    [
      idx + 1,
      `"${c.clienteNome.replace(/"/g, '""')}"`,
      `"${c.telefoneWhatsapp}"`,
      `"${c.cidadeOuBairro}"`,
      formatarMoeda(c.receitaTotal).replace('R$', '').trim(),
      c.quantidadeTotal,
      c.pedidosCount,
      formatarMoeda(c.ticketMedio).replace('R$', '').trim(),
      formatarMoeda(c.lucroTotal).replace('R$', '').trim(),
      formatarDataPtBR(c.ultimaCompraData),
      `"${c.canalPrincipal}"`,
    ].join(';'),
  )
  const conteudo = [
    `Ranking de Clientes - Período: ${periodoLabel}`,
    'BRU MEMÓRIAS PERSONALIZADOS - "Pequenos detalhes. Grandes lembranças."',
    'EMBLEMA OFICIAL: Ímãs Personalizados 5x5 • Rio de Janeiro',
    header.join(';'),
    ...rows,
  ].join('\r\n')
  baixarCsv(`bru-memorias-ranking-clientes-${paraYmd(new Date())}.csv`, conteudo)
}

// ---------------- HELPERS UNIFICADOS COMPARTILHADOS ENTRE PAINEL E RELATÓRIOS ----------------

/**
 * Consolida todos os pedidos de todos os clientes em uma lista única ordenada por data desc.
 * Usada pelo Painel e pelos Relatórios para garantir exatamente a mesma base de dados.
 */
export function extrairTodosOsPedidos(clientes: Cliente[]): PedidoCliente[] {
  const list: PedidoCliente[] = []
  clientes.forEach((cli) => {
    cli.pedidos.forEach((p) => {
      list.push(p)
    })
  })
  return list.sort((a, b) => (b.data > a.data ? 1 : b.data < a.data ? -1 : 0))
}

/**
 * Contabiliza clientes ativas considerando o intervalo informado (ou corte de 90 dias padrão).
 * Quando intervalo é fornecido, checa se a cliente tem compras dentro desse intervalo.
 */
export function calcularClientesAtivasNoPeriodo(
  clientes: Cliente[],
  intervalo?: IntervaloDatas,
): number {
  if (intervalo) {
    return clientes.filter((cli) =>
      cli.pedidos.some((p) => p.data >= intervalo.inicio && p.data <= intervalo.fim),
    ).length
  }
  // Fallback 90 dias padrão
  const d = new Date()
  d.setDate(d.getDate() - 90)
  const corte = paraYmd(d)
  return clientes.filter((cli) => cli.pedidos.some((p) => p.data >= corte)).length
}
