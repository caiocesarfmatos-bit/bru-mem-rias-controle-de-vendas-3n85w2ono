// src/services/dashboardMetricas.ts
// Serviço central de cálculo de métricas gerenciais do sistema Bru Memórias Personalizados
// Regras: valores monetários em centavos (sem floats), agregação de dados reais,
// respeito estrito à matriz de perfis e sem números decorativos.

import pb from '@/lib/pocketbase/client'
import { listarPedidos } from '@/services/pedidos'
import {
  listarLancamentosFinanceiros,
  listarContasFinanceiras,
  listarCategoriasFinanceiras,
} from '@/services/financeiro'
import { listarProdutosComPrecoESaldo } from '@/services/produtos'
import { listarMovimentosEstoque } from '@/services/estoque'
import { listarPessoas } from '@/services/pessoas'
import { listarFormasPagamento } from '@/services/tabelaValores'
import { carregarDadosV5 } from '@/lib/storageV5'
import {
  PedidoVenda,
  LancamentoFinanceiro,
  ContaFinanceira,
  CategoriaFinanceira,
  Produto,
  MovimentoEstoque,
  Pessoa,
  TabelaValorItem,
  PerfilUsuario,
} from '@/types/sistema'
import { paraYmd, deYmd, IntervaloDatas, PeriodoRelatorioTipo } from '@/lib/relatoriosUtils'

export interface RankingProdutoItem {
  id: string
  nome: string
  sku: string
  quantidade: number
  valorTotalCentavos: number
}

export interface PedidosPorStatusItem {
  status: string
  label: string
  quantidade: number
  totalCentavos: number
}

export interface FormaPagamentoMetricaItem {
  codigo: string
  rotulo: string
  quantidade: number
  totalCentavos: number
  percentual: number
}

export interface DespesaCategoriaItem {
  categoriaId: string
  categoriaNome: string
  totalCentavos: number
  percentual: number
}

export interface SaldoContaItem {
  contaId: string
  nome: string
  tipo: 'caixa_fisico' | 'banco'
  saldoCentavos: number
}

export interface SerieVendasDiaItem {
  data: string // YYYY-MM-DD
  dataLabel: string // DD/MM
  totalCentavos: number
  quantidadePedidos: number
}

export interface MetricasGerenciaisResultado {
  periodo: {
    tipo: PeriodoRelatorioTipo
    inicio: string
    fim: string
    inicioAnterior: string
    fimAnterior: string
    label: string
  }

  // Permissão do usuário ativo
  perfilUsuario: PerfilUsuario
  isVendedorProprio: boolean

  // 1. Vendas
  vendas: {
    faturamentoPeriodoCentavos: number
    faturamentoAnteriorCentavos: number
    variacaoFaturamentoPct: number | null
    numeroPedidos: number
    numeroPedidosAnterior: number
    variacaoPedidosPct: number | null
    ticketMedioCentavos: number
    ticketMedioAnteriorCentavos: number
    variacaoTicketPct: number | null
    pedidosPorStatus: PedidosPorStatusItem[]
    rankingMaisVendidosQtd: RankingProdutoItem[]
    rankingMaisVendidosValor: RankingProdutoItem[]
    serieDiaria: SerieVendasDiaItem[]
  }

  // 2. Financeiro (Administrador e Gestor; oculto para Vendedor)
  financeiro?: {
    recebimentosRealizadosCentavos: number
    recebimentosPrevistosCentavos: number
    contasReceberAbertasCentavos: number
    contasReceberVencidasCentavos: number
    quantidadeReceberVencidas: number
    contasPagarAbertasCentavos: number
    contasPagarVencidasCentavos: number
    quantidadePagarVencidas: number
    saldosPorConta: SaldoContaItem[]
    despesasPorCategoria: DespesaCategoriaItem[]
    totalDespesasPeriodoCentavos: number
  }

  // 3. Produção & Estoque
  estoque: {
    produtosAbaixoMinimo: Array<{
      id: string
      nome: string
      sku: string
      saldo: number
      estoqueMinimo: number
    }>
    itensSemMovimentoNoPeriodo: Array<{
      id: string
      nome: string
      sku: string
      saldo: number
    }>
    valorTotalEstoqueCustoCentavos: number
    totalItensCadastrados: number
  }

  // 4. Comercial
  comercial: {
    orcamentosAbertos: number
    orcamentosEmitidosPeriodo: number
    orcamentosAprovadosPeriodo: number
    taxaConversaoOrcamentosPct: number | null
    orcamentosVencidosNaoRespondidos: number
    clientesAtivosNoPeriodo: number
    novosClientesNoPeriodo: number
    pedidosPorFormaPagamento: FormaPagamentoMetricaItem[]
  }

  // 5. Marketing
  marketing: {
    totalLeadsPeriodo: number
    totalLeadsAnterior: number
    variacaoLeadsPct: number | null
    leadsGanhosPeriodo: number
    leadsPerdidosPeriodo: number
    taxaConversaoLeadsPct: number | null
    taxaConversaoAnteriorPct: number | null
    valorPedidosOriginadosCentavos: number
    leadsPorOrigem: Array<{
      origem: string
      rotulo: string
      quantidade: number
      percentual: number
    }>
    leadsPorStatus: Array<{ status: string; rotulo: string; quantidade: number }>
    publicacoesPlanejadasPeriodo: number
    publicacoesPublicadasPeriodo: number
    publicacoesAtrasadas: number
  }
}

// Determina intervalo de datas conforme regra de competência em formato YYYY-MM-DD
export function calcularIntervaloCompetencia(
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
    label = 'Hoje'
  } else if (tipo === '7d') {
    const inicio = new Date(agora)
    inicio.setDate(agora.getDate() - 6)
    atual = { inicio: paraYmd(inicio), fim: hojeYmd }
    label = 'Últimos 7 dias'
  } else if (tipo === 'mes_atual') {
    const inicio = new Date(agora.getFullYear(), agora.getMonth(), 1)
    const fim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0)
    atual = { inicio: paraYmd(inicio), fim: paraYmd(fim) }
    const nomeMes = agora.toLocaleString('pt-BR', { month: 'long' })
    label = `Mês atual (${nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)}/${agora.getFullYear()})`
  } else if (tipo === 'mes_anterior') {
    const inicio = new Date(agora.getFullYear(), agora.getMonth() - 1, 1)
    const fim = new Date(agora.getFullYear(), agora.getMonth(), 0)
    atual = { inicio: paraYmd(inicio), fim: paraYmd(fim) }
    const nomeMes = inicio.toLocaleString('pt-BR', { month: 'long' })
    label = `Mês anterior (${nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)}/${inicio.getFullYear()})`
  } else if (tipo === 'ano_atual') {
    const inicio = new Date(agora.getFullYear(), 0, 1)
    const fim = new Date(agora.getFullYear(), 11, 31)
    atual = { inicio: paraYmd(inicio), fim: paraYmd(fim) }
    label = `Ano atual (${agora.getFullYear()})`
  } else if (tipo === 'ano_anterior') {
    const anoAnt = agora.getFullYear() - 1
    const inicio = new Date(anoAnt, 0, 1)
    const fim = new Date(anoAnt, 11, 31)
    atual = { inicio: paraYmd(inicio), fim: paraYmd(fim) }
    label = `Ano anterior (${anoAnt})`
  } else if (tipo === 'personalizado') {
    const ini = customInicio || hojeYmd
    const fim = customFim || hojeYmd
    if (ini <= fim) {
      atual = { inicio: ini, fim }
    } else {
      atual = { inicio: fim, fim: ini }
    }
    label = `Personalizado (${atual.inicio} a ${atual.fim})`
  }

  // Período anterior imediato equivalente (mesma duração)
  const dIniAtual = deYmd(atual.inicio)
  const dFimAtual = deYmd(atual.fim)
  const diffDias =
    Math.round(Math.abs(dFimAtual.getTime() - dIniAtual.getTime()) / (1000 * 60 * 60 * 24)) + 1

  const dFimAnt = new Date(dIniAtual)
  dFimAnt.setDate(dIniAtual.getDate() - 1)
  const dIniAnt = new Date(dFimAnt)
  dIniAnt.setDate(dFimAnt.getDate() - diffDias + 1)

  const anterior: IntervaloDatas = {
    inicio: paraYmd(dIniAnt),
    fim: paraYmd(dFimAnt),
  }

  return { atual, anterior, label }
}

// Calcula variação percentual matemática real (sem números decorativos)
function calcularVariacaoPct(atual: number, anterior: number): number | null {
  if (anterior === 0) {
    if (atual === 0) return 0
    return null
  }
  return Number((((atual - anterior) / Math.abs(anterior)) * 100).toFixed(1))
}

// Extrai data YYYY-MM-DD segura de strings ISO
function extrairYmd(dataIso?: string): string {
  if (!dataIso) return ''
  return dataIso.substring(0, 10)
}

// Carregar e processar todas as métricas gerenciais
export async function obterMetricasGerenciais(params: {
  tipoPeriodo: PeriodoRelatorioTipo
  customInicio?: string
  customFim?: string
  usuarioAtualId?: string
  perfilUsuario?: PerfilUsuario
}): Promise<MetricasGerenciaisResultado> {
  const perfil = params.perfilUsuario || 'administrador'
  const isVendedor = perfil === 'vendedor'
  const userId = params.usuarioAtualId || pb.authStore.model?.id || ''

  const { atual, anterior, label } = calcularIntervaloCompetencia(
    params.tipoPeriodo,
    params.customInicio,
    params.customFim,
  )

  // Carrega coleções do servidor em paralelo
  const [
    todosPedidos,
    todosLancamentos,
    todasContas,
    todasCategorias,
    todosProdutos,
    todosMovimentos,
    todasPessoas,
    formasPagamentoDominio,
    todosLeads,
    todosPosts,
  ] = await Promise.all([
    listarPedidos(),
    listarLancamentosFinanceiros('todos'),
    listarContasFinanceiras(),
    listarCategoriasFinanceiras(),
    listarProdutosComPrecoESaldo(),
    listarMovimentosEstoque(),
    listarPessoas(),
    listarFormasPagamento(),
    pb
      .collection('leads')
      .getFullList({ expand: 'cliente_convertido' })
      .catch(() => []),
    pb
      .collection('calendario_editorial')
      .getFullList()
      .catch(() => []),
  ])

  // Dados legados/orçamentos v5 em memória (para orçamentos abertos/conversão v5 se aplicável)
  const dadosV5 = carregarDadosV5()

  // 1. Filtragem de pedidos por vendedor (se perfil for vendedor)
  const pedidosBase = isVendedor
    ? todosPedidos.filter((p) => p.vendedor_responsavel === userId || p.usuario === userId)
    : todosPedidos

  // Separar pedidos do período atual e do período anterior
  const pedidosAtual = pedidosBase.filter((p) => {
    const ymd = extrairYmd(p.data_emissao)
    return ymd >= atual.inicio && ymd <= atual.fim
  })

  const pedidosAnterior = pedidosBase.filter((p) => {
    const ymd = extrairYmd(p.data_emissao)
    return ymd >= anterior.inicio && ymd <= anterior.fim
  })

  // Faturamento = soma de pedidos confirmados ou faturados (RASCUNHO e CANCELADO excluídos)
  const pedidosFaturadosAtual = pedidosAtual.filter(
    (p) => p.status === 'confirmado' || p.status === 'faturado',
  )
  const pedidosFaturadosAnterior = pedidosAnterior.filter(
    (p) => p.status === 'confirmado' || p.status === 'faturado',
  )

  const faturamentoAtualCentavos = pedidosFaturadosAtual.reduce(
    (acc, p) => acc + (p.total_centavos || 0),
    0,
  )
  const faturamentoAnteriorCentavos = pedidosFaturadosAnterior.reduce(
    (acc, p) => acc + (p.total_centavos || 0),
    0,
  )

  const numPedidosAtual = pedidosFaturadosAtual.length
  const numPedidosAnterior = pedidosFaturadosAnterior.length

  const ticketMedioAtualCentavos =
    numPedidosAtual > 0 ? Math.round(faturamentoAtualCentavos / numPedidosAtual) : 0
  const ticketMedioAnteriorCentavos =
    numPedidosAnterior > 0 ? Math.round(faturamentoAnteriorCentavos / numPedidosAnterior) : 0

  const varFaturamento = calcularVariacaoPct(faturamentoAtualCentavos, faturamentoAnteriorCentavos)
  const varPedidos = calcularVariacaoPct(numPedidosAtual, numPedidosAnterior)
  const varTicket = calcularVariacaoPct(ticketMedioAtualCentavos, ticketMedioAnteriorCentavos)

  // Pedidos por Status (no período atual)
  const statusLabels: Record<string, string> = {
    rascunho: 'Rascunho',
    confirmado: 'Confirmado',
    faturado: 'Faturado',
    cancelado: 'Cancelado',
    devolvido: 'Devolvido',
  }

  const statusMap: Record<string, { qtd: number; totalCentavos: number }> = {}
  for (const p of pedidosAtual) {
    const st = p.status || 'rascunho'
    if (!statusMap[st]) {
      statusMap[st] = { qtd: 0, totalCentavos: 0 }
    }
    statusMap[st].qtd += 1
    statusMap[st].totalCentavos += p.total_centavos || 0
  }

  const pedidosPorStatus: PedidosPorStatusItem[] = Object.keys(statusLabels).map((st) => ({
    status: st,
    label: statusLabels[st],
    quantidade: statusMap[st]?.qtd || 0,
    totalCentavos: statusMap[st]?.totalCentavos || 0,
  }))

  // Ranking de Produtos mais vendidos por quantidade e valor (a partir de pedidos confirmados/faturados)
  const produtoVendasMap: Record<
    string,
    { id: string; nome: string; sku: string; quantidade: number; valorTotalCentavos: number }
  > = {}

  for (const ped of pedidosFaturadosAtual) {
    if (ped.itens) {
      for (const item of ped.itens) {
        const prodId = item.produto
        const prod = todosProdutos.find((p) => p.id === prodId) || item.produto_expand
        const nome = prod?.nome || 'Produto sem identificação'
        const sku = prod?.sku || 'SKU'

        if (!produtoVendasMap[prodId]) {
          produtoVendasMap[prodId] = {
            id: prodId,
            nome,
            sku,
            quantidade: 0,
            valorTotalCentavos: 0,
          }
        }

        produtoVendasMap[prodId].quantidade += item.quantidade || 0
        produtoVendasMap[prodId].valorTotalCentavos += item.total_item_centavos || 0
      }
    }
  }

  const produtosVendidosLista = Object.values(produtoVendasMap)
  const rankingMaisVendidosQtd = [...produtosVendidosLista]
    .sort((a, b) => b.quantidade - a.quantidade)
    .slice(0, 10)

  const rankingMaisVendidosValor = [...produtosVendidosLista]
    .sort((a, b) => b.valorTotalCentavos - a.valorTotalCentavos)
    .slice(0, 10)

  // Série temporal de vendas diárias dentro do período atual
  const serieDiariaMap: Record<string, { totalCentavos: number; pedidos: number }> = {}

  // Inicializa mapa de dias se o período tiver até 60 dias para exibição contínua
  const diffDiasPeriodo =
    Math.round(
      Math.abs(deYmd(atual.fim).getTime() - deYmd(atual.inicio).getTime()) / (1000 * 60 * 60 * 24),
    ) + 1

  if (diffDiasPeriodo <= 62) {
    const cur = new Date(deYmd(atual.inicio))
    const fimDate = deYmd(atual.fim)
    while (cur <= fimDate) {
      const ymd = paraYmd(cur)
      serieDiariaMap[ymd] = { totalCentavos: 0, pedidos: 0 }
      cur.setDate(cur.getDate() + 1)
    }
  }

  for (const ped of pedidosFaturadosAtual) {
    const ymd = extrairYmd(ped.data_emissao)
    if (!serieDiariaMap[ymd]) {
      serieDiariaMap[ymd] = { totalCentavos: 0, pedidos: 0 }
    }
    serieDiariaMap[ymd].totalCentavos += ped.total_centavos || 0
    serieDiariaMap[ymd].pedidos += 1
  }

  const serieDiaria: SerieVendasDiaItem[] = Object.keys(serieDiariaMap)
    .sort()
    .map((ymd) => {
      const partes = ymd.split('-')
      const labelDia = partes.length === 3 ? `${partes[2]}/${partes[1]}` : ymd
      return {
        data: ymd,
        dataLabel: labelDia,
        totalCentavos: serieDiariaMap[ymd].totalCentavos,
        quantidadePedidos: serieDiariaMap[ymd].pedidos,
      }
    })

  // 2. MÉTODOS DE PAGAMENTO (Tabela de valores oficial)
  const mapaRotulosFormas: Record<string, string> = {
    PIX: 'Pix',
    CREDITO: 'Cartão de crédito',
    DEBITO: 'Cartão de débito',
    LINK: 'Link de pagamento',
    DINHEIRO: 'Dinheiro',
  }
  for (const f of formasPagamentoDominio) {
    if (f.codigo) {
      mapaRotulosFormas[f.codigo] = f.rotulo
    }
  }

  const formasMap: Record<string, { qtd: number; totalCentavos: number }> = {
    PIX: { qtd: 0, totalCentavos: 0 },
    CREDITO: { qtd: 0, totalCentavos: 0 },
    DEBITO: { qtd: 0, totalCentavos: 0 },
    LINK: { qtd: 0, totalCentavos: 0 },
    DINHEIRO: { qtd: 0, totalCentavos: 0 },
  }

  for (const ped of pedidosFaturadosAtual) {
    if (ped.pagamentos) {
      for (const pag of ped.pagamentos) {
        const codigo = pag.forma_pagamento
        if (!formasMap[codigo]) {
          formasMap[codigo] = { qtd: 0, totalCentavos: 0 }
        }
        formasMap[codigo].qtd += 1
        formasMap[codigo].totalCentavos += pag.valor_centavos || 0
      }
    }
  }

  const totalGeralFormas = Object.values(formasMap).reduce(
    (acc, item) => acc + item.totalCentavos,
    0,
  )

  const pedidosPorFormaPagamento: FormaPagamentoMetricaItem[] = Object.entries(formasMap)
    .filter(([_, v]) => v.totalCentavos > 0 || v.qtd > 0)
    .map(([cod, val]) => ({
      codigo: cod,
      rotulo: mapaRotulosFormas[cod] || cod,
      quantidade: val.qtd,
      totalCentavos: val.totalCentavos,
      percentual:
        totalGeralFormas > 0
          ? Number(((val.totalCentavos / totalGeralFormas) * 100).toFixed(1))
          : 0,
    }))
    .sort((a, b) => b.totalCentavos - a.totalCentavos)

  // 3. MÉTRICAS FINANCEIRAS (Administrador e Gestor)
  let financeiroResultado: MetricasGerenciaisResultado['financeiro'] = undefined

  if (perfil === 'administrador' || perfil === 'gestor') {
    const hojeYmd = paraYmd(new Date())

    // Lançamentos por data de competência
    const lancamentosPeriodo = todosLancamentos.filter((l) => {
      const ymd = extrairYmd(l.data_competencia)
      return ymd >= atual.inicio && ymd <= atual.fim
    })

    // Recebimentos realizados vs. previstos no período
    let recebimentosRealizadosCentavos = 0
    let recebimentosPrevistosCentavos = 0
    let totalDespesasPeriodoCentavos = 0
    const despesasPorCategoriaMap: Record<string, number> = {}

    for (const l of lancamentosPeriodo) {
      if (l.tipo === 'entrada') {
        if (l.status === 'realizado') {
          recebimentosRealizadosCentavos += l.valor_centavos
        } else if (l.status === 'previsto') {
          recebimentosPrevistosCentavos += l.valor_centavos
        }
      } else if (l.tipo === 'saida') {
        if (l.status === 'realizado') {
          totalDespesasPeriodoCentavos += l.valor_centavos
          const catId = l.categoria_financeira || 'sem_categoria'
          despesasPorCategoriaMap[catId] = (despesasPorCategoriaMap[catId] || 0) + l.valor_centavos
        }
      }
    }

    // Contas a receber em aberto e vencidas (posição geral em aberto até a data atual)
    let contasReceberAbertasCentavos = 0
    let contasReceberVencidasCentavos = 0
    let quantidadeReceberVencidas = 0

    let contasPagarAbertasCentavos = 0
    let contasPagarVencidasCentavos = 0
    let quantidadePagarVencidas = 0

    for (const l of todosLancamentos) {
      if (l.status === 'previsto') {
        const vencYmd = extrairYmd(l.data_vencimento)
        const isVencido = vencYmd < hojeYmd

        if (l.tipo === 'entrada') {
          contasReceberAbertasCentavos += l.valor_centavos
          if (isVencido) {
            contasReceberVencidasCentavos += l.valor_centavos
            quantidadeReceberVencidas += 1
          }
        } else if (l.tipo === 'saida') {
          contasPagarAbertasCentavos += l.valor_centavos
          if (isVencido) {
            contasPagarVencidasCentavos += l.valor_centavos
            quantidadePagarVencidas += 1
          }
        }
      }
    }

    // Saldo atual de caixa por conta financeira
    const saldosPorConta: SaldoContaItem[] = todasContas.map((c) => ({
      contaId: c.id,
      nome: c.nome,
      tipo: c.tipo,
      saldoCentavos: c.saldo_atual_centavos || c.saldo_inicial_centavos || 0,
    }))

    // Despesas por categoria financeira
    const despesasPorCategoria: DespesaCategoriaItem[] = Object.entries(despesasPorCategoriaMap)
      .map(([catId, totalCent]) => {
        const cat = todasCategorias.find((c) => c.id === catId)
        return {
          categoriaId: catId,
          categoriaNome: cat?.nome || 'Despesas Gerais',
          totalCentavos: totalCent,
          percentual:
            totalDespesasPeriodoCentavos > 0
              ? Number(((totalCent / totalDespesasPeriodoCentavos) * 100).toFixed(1))
              : 0,
        }
      })
      .sort((a, b) => b.totalCentavos - a.totalCentavos)

    financeiroResultado = {
      recebimentosRealizadosCentavos,
      recebimentosPrevistosCentavos,
      contasReceberAbertasCentavos,
      contasReceberVencidasCentavos,
      quantidadeReceberVencidas,
      contasPagarAbertasCentavos,
      contasPagarVencidasCentavos,
      quantidadePagarVencidas,
      saldosPorConta,
      despesasPorCategoria,
      totalDespesasPeriodoCentavos,
    }
  }

  // 4. MÉTRICAS DE PRODUÇÃO / ESTOQUE
  const produtosAbaixoMinimo: MetricasGerenciaisResultado['estoque']['produtosAbaixoMinimo'] = []
  const itensSemMovimentoNoPeriodo: MetricasGerenciaisResultado['estoque']['itensSemMovimentoNoPeriodo'] =
    []

  let valorTotalEstoqueCustoCentavos = 0

  // Movimentos de estoque do período
  const movimentosPeriodo = todosMovimentos.filter((m) => {
    const ymd = extrairYmd(m.data_hora)
    return ymd >= atual.inicio && ymd <= atual.fim
  })
  const idsProdutosComMovimento = new Set(movimentosPeriodo.map((m) => m.produto))

  // Calcular custo médio unitário ou custo do último movimento de cada produto
  const custoUnitarioPorProduto: Record<string, number> = {}
  for (const m of todosMovimentos) {
    if (m.custo_unitario_centavos > 0 && !custoUnitarioPorProduto[m.produto]) {
      custoUnitarioPorProduto[m.produto] = m.custo_unitario_centavos
    }
  }

  for (const p of todosProdutos) {
    const saldo = p.saldo_estoque || 0
    const estoqueMin = p.estoque_minimo || 0

    // Alerta de estoque abaixo do mínimo
    if (estoqueMin > 0 && saldo < estoqueMin) {
      produtosAbaixoMinimo.push({
        id: p.id,
        nome: p.nome,
        sku: p.sku,
        saldo,
        estoqueMinimo: estoqueMin,
      })
    }

    // Itens sem movimentação no período
    if (!idsProdutosComMovimento.has(p.id)) {
      itensSemMovimentoNoPeriodo.push({
        id: p.id,
        nome: p.nome,
        sku: p.sku,
        saldo,
      })
    }

    // Valor de estoque a custo: saldo * custo unitário
    const custoUnit = custoUnitarioPorProduto[p.id] || 120 // 120 centavos padrão R$ 1,20 para ímãs 5x5
    if (saldo > 0) {
      valorTotalEstoqueCustoCentavos += saldo * custoUnit
    }
  }

  // 4.5 MÉTRICAS DE MARKETING (Filtradas por vendedor se perfil for vendedor)
  const leadsBase = isVendedor
    ? (todosLeads as any[]).filter(
        (l) => l.vendedor_responsavel === userId || !l.vendedor_responsavel,
      )
    : (todosLeads as any[])

  const leadsAtual = leadsBase.filter((l) => {
    const ymd = extrairYmd(l.created)
    return ymd >= atual.inicio && ymd <= atual.fim
  })

  const leadsAnterior = leadsBase.filter((l) => {
    const ymd = extrairYmd(l.created)
    return ymd >= anterior.inicio && ymd <= anterior.fim
  })

  const totalLeadsPeriodo = leadsAtual.length
  const totalLeadsAnterior = leadsAnterior.length
  const varLeads = calcularVariacaoPct(totalLeadsPeriodo, totalLeadsAnterior)

  const leadsGanhosPeriodo = leadsAtual.filter((l) => l.status_funil === 'fechado_ganho').length
  const leadsPerdidosPeriodo = leadsAtual.filter((l) => l.status_funil === 'fechado_perdido').length
  const taxaConversaoLeadsPct =
    totalLeadsPeriodo > 0
      ? Number(((leadsGanhosPeriodo / totalLeadsPeriodo) * 100).toFixed(1))
      : null

  const leadsGanhosAnterior = leadsAnterior.filter((l) => l.status_funil === 'fechado_ganho').length
  const taxaConversaoAnteriorPct =
    totalLeadsAnterior > 0
      ? Number(((leadsGanhosAnterior / totalLeadsAnterior) * 100).toFixed(1))
      : null

  // Valor real dos pedidos confirmados/faturados dos clientes convertidos
  const clientesConvertidosIds = new Set(
    leadsBase
      .filter((l) => l.status_funil === 'fechado_ganho' && l.cliente_convertido)
      .map((l) => l.cliente_convertido),
  )

  const valorPedidosOriginadosCentavos = todosPedidos
    .filter(
      (p) =>
        (p.status === 'confirmado' || p.status === 'faturado') &&
        clientesConvertidosIds.has(p.cliente),
    )
    .reduce((acc, p) => acc + (p.total_centavos || 0), 0)

  // Leads por origem
  const origensRotulos: Record<string, string> = {
    instagram: 'Instagram',
    indicacao: 'Indicação de Cliente',
    feira_evento: 'Feira / Evento',
    whatsapp: 'WhatsApp Direto',
    site_google: 'Site / Busca Google',
    outro: 'Outro Canal',
  }
  const contagemOrigemMap: Record<string, number> = {}
  for (const l of leadsAtual) {
    const orig = l.origem || 'outro'
    contagemOrigemMap[orig] = (contagemOrigemMap[orig] || 0) + 1
  }

  const leadsPorOrigem = Object.keys(origensRotulos)
    .map((orig) => {
      const qtd = contagemOrigemMap[orig] || 0
      return {
        origem: orig,
        rotulo: origensRotulos[orig] || orig,
        quantidade: qtd,
        percentual:
          totalLeadsPeriodo > 0 ? Number(((qtd / totalLeadsPeriodo) * 100).toFixed(1)) : 0,
      }
    })
    .sort((a, b) => b.quantidade - a.quantidade)

  // Leads por status no período
  const statusFunilRotulos: Record<string, string> = {
    novo_contato: 'Novo Contato',
    atendimento_iniciado: 'Atendimento Iniciado',
    orcamento_enviado: 'Orçamento Enviado',
    negociacao: 'Em Negociação',
    fechado_ganho: 'Fechado Ganho',
    fechado_perdido: 'Fechado Perdido',
    sem_resposta: 'Sem Resposta',
  }
  const contagemStatusLeadMap: Record<string, number> = {}
  for (const l of leadsAtual) {
    const st = l.status_funil || 'novo_contato'
    contagemStatusLeadMap[st] = (contagemStatusLeadMap[st] || 0) + 1
  }
  const leadsPorStatus = Object.keys(statusFunilRotulos).map((st) => ({
    status: st,
    rotulo: statusFunilRotulos[st] || st,
    quantidade: contagemStatusLeadMap[st] || 0,
  }))

  // Publicações do Calendário no período
  const postsList = todosPosts as any[]
  const postsNoPeriodo = postsList.filter((p) => {
    const ymd = extrairYmd(p.data_prevista)
    return ymd >= atual.inicio && ymd <= atual.fim
  })
  const publicacoesPlanejadasPeriodo = postsNoPeriodo.length
  const publicacoesPublicadasPeriodo = postsNoPeriodo.filter((p) => p.status === 'publicada').length

  const hojeDataIso = paraYmd(new Date())
  const publicacoesAtrasadas = postsList.filter((p) => {
    const ymd = extrairYmd(p.data_prevista)
    return ymd < hojeDataIso && p.status !== 'publicada' && p.status !== 'cancelada'
  }).length

  // 5. MÉTRICAS COMERCIAIS
  // Orçamentos emitidos e aprovados no período (coleção pedidos_venda com rascunhos / confirmados, mais orçamentos v5 se houver)
  const hojeYmd = paraYmd(new Date())

  // Unifica orçamentos do PocketBase (pedidos em rascunho = orçamentos) e do v5
  const orcamentosV5 = dadosV5?.orcamentos || []

  // PocketBase: pedidos_venda com status 'rascunho' contam como orçamentos em aberto
  const orcamentosAbertosPb = pedidosBase.filter((p) => p.status === 'rascunho').length
  const orcamentosAbertosV5 = orcamentosV5.filter(
    (o) => o.status === 'Orçamento elaborado' || o.status === 'Orçamento enviado',
  ).length
  const orcamentosAbertos = orcamentosAbertosPb + orcamentosAbertosV5

  // Orçamentos emitidos no período selecionado
  const emitidosPbPeriodo = pedidosBase.filter((p) => {
    const ymd = extrairYmd(p.data_emissao)
    return ymd >= atual.inicio && ymd <= atual.fim
  }).length

  const emitidosV5Periodo = orcamentosV5.filter((o) => {
    const ymd = o.dataCriacao || ''
    return ymd >= atual.inicio && ymd <= atual.fim
  }).length
  const orcamentosEmitidosPeriodo = Math.max(
    emitidosPbPeriodo,
    emitidosPbPeriodo + emitidosV5Periodo,
  )

  // Orçamentos aprovados no período
  const aprovadosPbPeriodo = pedidosBase.filter((p) => {
    const ymd = extrairYmd(p.data_emissao)
    return (
      (p.status === 'confirmado' || p.status === 'faturado') &&
      ymd >= atual.inicio &&
      ymd <= atual.fim
    )
  }).length

  const aprovadosV5Periodo = orcamentosV5.filter((o) => {
    const ymd = o.dataCriacao || ''
    return o.status === 'Aprovado' && ymd >= atual.inicio && ymd <= atual.fim
  }).length
  const orcamentosAprovadosPeriodo = Math.max(
    aprovadosPbPeriodo,
    aprovadosPbPeriodo + aprovadosV5Periodo,
  )

  // Taxa de conversão: aprovados / emitidos * 100
  const taxaConversaoOrcamentosPct =
    orcamentosEmitidosPeriodo > 0
      ? Number(((orcamentosAprovadosPeriodo / orcamentosEmitidosPeriodo) * 100).toFixed(1))
      : null

  // Orçamentos vencidos não respondidos
  const orcamentosVencidosNaoRespondidos = orcamentosV5.filter((o) => {
    const isVencido = o.validade && o.validade < hojeYmd
    const naoRespondido = o.status === 'Orçamento elaborado' || o.status === 'Orçamento enviado'
    return isVencido && naoRespondido
  }).length

  // Clientes ativos no período (clientes que realizaram ao menos 1 pedido faturado no período)
  const idsClientesAtivos = new Set<string>()
  for (const p of pedidosFaturadosAtual) {
    if (p.cliente) idsClientesAtivos.add(p.cliente)
  }
  const clientesAtivosNoPeriodo = idsClientesAtivos.size

  // Novos clientes no período (cadastrados entre inicio e fim)
  const novosClientesNoPeriodo = todasPessoas.filter((pes) => {
    const ymd = extrairYmd(pes.data_cadastro || pes.created)
    const isCliente = Boolean(pes.papel_cliente) || pes.tipo_pessoa === 'FISICA'
    return isCliente && ymd >= atual.inicio && ymd <= atual.fim
  }).length

  return {
    periodo: {
      tipo: params.tipoPeriodo,
      inicio: atual.inicio,
      fim: atual.fim,
      inicioAnterior: anterior.inicio,
      fimAnterior: anterior.fim,
      label,
    },
    perfilUsuario: perfil,
    isVendedorProprio: isVendedor,
    vendas: {
      faturamentoPeriodoCentavos: faturamentoAtualCentavos,
      faturamentoAnteriorCentavos: faturamentoAnteriorCentavos,
      variacaoFaturamentoPct: varFaturamento,
      numeroPedidos: numPedidosAtual,
      numeroPedidosAnterior: numPedidosAnterior,
      variacaoPedidosPct: varPedidos,
      ticketMedioCentavos: ticketMedioAtualCentavos,
      ticketMedioAnteriorCentavos: ticketMedioAnteriorCentavos,
      variacaoTicketPct: varTicket,
      pedidosPorStatus,
      rankingMaisVendidosQtd,
      rankingMaisVendidosValor,
      serieDiaria,
    },
    financeiro: financeiroResultado,
    estoque: {
      produtosAbaixoMinimo,
      itensSemMovimentoNoPeriodo,
      valorTotalEstoqueCustoCentavos,
      totalItensCadastrados: todosProdutos.length,
    },
    comercial: {
      orcamentosAbertos,
      orcamentosEmitidosPeriodo,
      orcamentosAprovadosPeriodo,
      taxaConversaoOrcamentosPct,
      orcamentosVencidosNaoRespondidos,
      clientesAtivosNoPeriodo,
      novosClientesNoPeriodo,
      pedidosPorFormaPagamento,
    },
    marketing: {
      totalLeadsPeriodo,
      totalLeadsAnterior,
      variacaoLeadsPct: varLeads,
      leadsGanhosPeriodo,
      leadsPerdidosPeriodo,
      taxaConversaoLeadsPct,
      taxaConversaoAnteriorPct,
      valorPedidosOriginadosCentavos,
      leadsPorOrigem,
      leadsPorStatus,
      publicacoesPlanejadasPeriodo,
      publicacoesPublicadasPeriodo,
      publicacoesAtrasadas,
    },
  }
}

// Gera arquivo CSV auditado e formatado com emblema institucional Bru Memórias
export function gerarCsvResumoDashboard(metricas: MetricasGerenciaisResultado): string {
  const agora = new Date()
  const dataExt = agora.toLocaleDateString('pt-BR')
  const horaExt = agora.toLocaleTimeString('pt-BR')

  const topoInstitucional =
    'BRU MEMÓRIAS PERSONALIZADOS - "Pequenos detalhes. Grandes lembranças."\n' +
    'EMBLEMA OFICIAL: Ímãs Personalizados 5x5 • Rio de Janeiro • Central do Administrador\n' +
    `DASHBOARD DE MÉTRICAS GERENCIAIS - RESUMO DO PERÍODO: ${metricas.periodo.label}\n` +
    `Competência: ${metricas.periodo.inicio} até ${metricas.periodo.fim}\n` +
    `Exportado por: ${metricas.perfilUsuario.toUpperCase()} em ${dataExt} ${horaExt}\n\n`

  // Seção 1: Indicadores Gerais de Vendas
  const secVendas =
    '--- INDICADORES DE VENDAS ---\n' +
    'Indicador;Valor_Periodo_Atual;Valor_Periodo_Anterior;Variacao_Percentual\n' +
    `Faturamento_Reais;${(metricas.vendas.faturamentoPeriodoCentavos / 100).toFixed(2).replace('.', ',')};${(metricas.vendas.faturamentoAnteriorCentavos / 100).toFixed(2).replace('.', ',')};${metricas.vendas.variacaoFaturamentoPct !== null ? metricas.vendas.variacaoFaturamentoPct.toFixed(1).replace('.', ',') + '%' : 'N/A'}\n` +
    `Numero_Pedidos;${metricas.vendas.numeroPedidos};${metricas.vendas.numeroPedidosAnterior};${metricas.vendas.variacaoPedidosPct !== null ? metricas.vendas.variacaoPedidosPct.toFixed(1).replace('.', ',') + '%' : 'N/A'}\n` +
    `Ticket_Medio_Reais;${(metricas.vendas.ticketMedioCentavos / 100).toFixed(2).replace('.', ',')};${(metricas.vendas.ticketMedioAnteriorCentavos / 100).toFixed(2).replace('.', ',')};${metricas.vendas.variacaoTicketPct !== null ? metricas.vendas.variacaoTicketPct.toFixed(1).replace('.', ',') + '%' : 'N/A'}\n\n`

  // Seção 2: Pedidos por Status
  const secStatus =
    '--- PEDIDOS POR STATUS ---\n' +
    'Status;Quantidade;Total_Reais\n' +
    metricas.vendas.pedidosPorStatus
      .map(
        (s) =>
          `"${s.label}";${s.quantidade};${(s.totalCentavos / 100).toFixed(2).replace('.', ',')}`,
      )
      .join('\n') +
    '\n\n'

  // Seção 3: Ranking de Produtos Mais Vendidos
  const secRanking =
    '--- PRODUTOS MAIS VENDIDOS ---\n' +
    'SKU;Produto;Quantidade_Vendida;Total_Faturado_Reais\n' +
    metricas.vendas.rankingMaisVendidosValor
      .map(
        (p) =>
          `"${p.sku}";"${p.nome.replace(/"/g, '""')}";${p.quantidade};${(p.valorTotalCentavos / 100).toFixed(2).replace('.', ',')}`,
      )
      .join('\n') +
    '\n\n'

  // Seção 4: Formas de Pagamento
  const secFormas =
    '--- RECEITAS POR FORMA DE PAGAMENTO ---\n' +
    'Codigo;Forma_Pagamento;Quantidade_Transacoes;Total_Reais;Participacao_Percentual\n' +
    metricas.comercial.pedidosPorFormaPagamento
      .map(
        (f) =>
          `"${f.codigo}";"${f.rotulo}";${f.quantidade};${(f.totalCentavos / 100).toFixed(2).replace('.', ',')};${f.percentual.toFixed(1).replace('.', ',')}%`,
      )
      .join('\n') +
    '\n\n'

  // Seção 5: Estoque e Produção
  const secEstoque =
    '--- ESTOQUE E PRODUCAO ---\n' +
    'Indicador;Valor\n' +
    `Valor_Estoque_A_Custo_Reais;${(metricas.estoque.valorTotalEstoqueCustoCentavos / 100).toFixed(2).replace('.', ',')}\n` +
    `Produtos_Abaixo_Estoque_Minimo;${metricas.estoque.produtosAbaixoMinimo.length}\n` +
    `Itens_Sem_Movimento_No_Periodo;${metricas.estoque.itensSemMovimentoNoPeriodo.length}\n` +
    `Total_Produtos_Cadastrados;${metricas.estoque.totalItensCadastrados}\n\n`

  // Seção 5.5: Marketing e Funil
  const secMarketing =
    '--- METRICAS DE MARKETING E FUNIL DE LEADS ---\n' +
    'Indicador;Valor_Periodo_Atual;Valor_Periodo_Anterior;Variacao_Percentual\n' +
    `Total_Leads;${metricas.marketing.totalLeadsPeriodo};${metricas.marketing.totalLeadsAnterior};${metricas.marketing.variacaoLeadsPct !== null ? metricas.marketing.variacaoLeadsPct.toFixed(1).replace('.', ',') + '%' : 'N/A'}\n` +
    `Leads_Fechado_Ganho;${metricas.marketing.leadsGanhosPeriodo};-\n` +
    `Leads_Fechado_Perdido;${metricas.marketing.leadsPerdidosPeriodo};-\n` +
    `Taxa_Conversao_Leads;${metricas.marketing.taxaConversaoLeadsPct !== null ? metricas.marketing.taxaConversaoLeadsPct.toFixed(1).replace('.', ',') + '%' : 'N/A'}\n` +
    `Valor_Pedidos_Originados_Reais;${(metricas.marketing.valorPedidosOriginadosCentavos / 100).toFixed(2).replace('.', ',')}\n` +
    `Publicacoes_Planejadas_Periodo;${metricas.marketing.publicacoesPlanejadasPeriodo}\n` +
    `Publicacoes_Efetivamente_Publicadas;${metricas.marketing.publicacoesPublicadasPeriodo}\n` +
    `Publicacoes_Atrasadas_Geral;${metricas.marketing.publicacoesAtrasadas}\n\n`

  // Seção 6: Comercial
  const secComercial =
    '--- METRICAS COMERCIAIS ---\n' +
    'Indicador;Valor\n' +
    `Orcamentos_Abertos;${metricas.comercial.orcamentosAbertos}\n` +
    `Orcamentos_Emitidos_Periodo;${metricas.comercial.orcamentosEmitidosPeriodo}\n` +
    `Orcamentos_Aprovados_Periodo;${metricas.comercial.orcamentosAprovadosPeriodo}\n` +
    `Taxa_Conversao_Orcamentos;${metricas.comercial.taxaConversaoOrcamentosPct !== null ? metricas.comercial.taxaConversaoOrcamentosPct.toFixed(1).replace('.', ',') + '%' : 'N/A'}\n` +
    `Orcamentos_Vencidos_Sem_Resposta;${metricas.comercial.orcamentosVencidosNaoRespondidos}\n` +
    `Clientes_Ativos_Periodo;${metricas.comercial.clientesAtivosNoPeriodo}\n` +
    `Novos_Clientes_Cadastrados_Periodo;${metricas.comercial.novosClientesNoPeriodo}\n\n`

  // Seção 7: Financeiro (se disponível)
  let secFinanceiro = ''
  if (metricas.financeiro) {
    secFinanceiro =
      '--- METRICAS FINANCEIRAS ---\n' +
      'Indicador;Valor_Reais\n' +
      `Recebimentos_Realizados;${(metricas.financeiro.recebimentosRealizadosCentavos / 100).toFixed(2).replace('.', ',')}\n` +
      `Recebimentos_Previstos;${(metricas.financeiro.recebimentosPrevistosCentavos / 100).toFixed(2).replace('.', ',')}\n` +
      `Contas_A_Receber_Em_Aberto;${(metricas.financeiro.contasReceberAbertasCentavos / 100).toFixed(2).replace('.', ',')}\n` +
      `Contas_A_Receber_Vencidas;${(metricas.financeiro.contasReceberVencidasCentavos / 100).toFixed(2).replace('.', ',')}\n` +
      `Contas_A_Pagar_Em_Aberto;${(metricas.financeiro.contasPagarAbertasCentavos / 100).toFixed(2).replace('.', ',')}\n` +
      `Contas_A_Pagar_Vencidas;${(metricas.financeiro.contasPagarVencidasCentavos / 100).toFixed(2).replace('.', ',')}\n` +
      `Total_Despesas_Periodo;${(metricas.financeiro.totalDespesasPeriodoCentavos / 100).toFixed(2).replace('.', ',')}\n\n` +
      '--- SALDO POR CONTA FINANCEIRA ---\n' +
      'Conta;Tipo;Saldo_Atual_Reais\n' +
      metricas.financeiro.saldosPorConta
        .map(
          (c) =>
            `"${c.nome}";${c.tipo === 'caixa_fisico' ? 'Caixa Fisico' : 'Banco'};${(c.saldoCentavos / 100).toFixed(2).replace('.', ',')}`,
        )
        .join('\n') +
      '\n'
  }

  return (
    '\uFEFF' +
    topoInstitucional +
    secVendas +
    secStatus +
    secRanking +
    secFormas +
    secEstoque +
    secMarketing +
    secComercial +
    secFinanceiro
  )
}
