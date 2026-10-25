import React, { useState, useMemo } from 'react'
import { useApp } from '@/context/AppContext'
import { PedidoCliente } from '@/types/app'
import { formatarMoeda, formatarDataPtBR, formatarNumero } from '@/lib/formatters'
import {
  PeriodoRelatorioTipo,
  obterIntervalosPeriodo,
  filtrarPedidosPorIntervalo,
  calcularKPIsResumo,
  calcularVendasPorProduto,
  calcularRankingClientes,
  calcularVendasPorCanal,
  calcularVendasPorFaixaPreco,
  calcularEvolucaoTemporal,
  calcularMelhoresDiasSemana,
  calcularHorariosVenda,
  calcularProjecaoSimples,
  exportarCsvRelatorioCompleto,
  exportarCsvVendasProduto,
  exportarCsvRankingClientes,
  paraYmd,
} from '@/lib/relatoriosUtils'
import { useToast } from '@/hooks/use-toast'
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  ArrowUpRight,
  Trophy,
  PieChart,
  ShoppingBag,
  Clock,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  AlertCircle,
  Percent,
  CheckCircle2,
  Share2,
} from 'lucide-react'

export const ModuloRelatorios: React.FC = () => {
  const { data, settings, logAudit, navegarParaCliente } = useApp()
  const { toast } = useToast()

  // 1. FILTRO DE PERÍODO GLOBAL
  const [periodoTipo, setPeriodoTipo] = useState<PeriodoRelatorioTipo>('mes_atual')
  const hojeYmd = useMemo(() => paraYmd(new Date()), [])
  const [dataInicioCustom, setDataInicioCustom] = useState<string>(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return paraYmd(d)
  })
  const [dataFimCustom, setDataFimCustom] = useState<string>(hojeYmd)

  // Expandir / recolher listagem de lançamentos
  const [expandirLancamentos, setExpandirLancamentos] = useState<boolean>(true)
  const [filtroStatusLancamento, setFiltroStatusLancamento] = useState<string>('todos')
  const [buscaLancamento, setBuscaLancamento] = useState<string>('')

  // Intervalos de datas calculado
  const {
    atual: intervaloAtual,
    anterior: intervaloAnterior,
    label: labelPeriodo,
  } = useMemo(() => {
    return obterIntervalosPeriodo(periodoTipo, dataInicioCustom, dataFimCustom)
  }, [periodoTipo, dataInicioCustom, dataFimCustom])

  // Consolidar todos os pedidos registrados no sistema
  const todosOsPedidos: PedidoCliente[] = useMemo(() => {
    const list: PedidoCliente[] = []
    data.clientes.forEach((cli) => {
      cli.pedidos.forEach((p) => {
        list.push(p)
      })
    })
    return list.sort((a, b) => (b.data > a.data ? 1 : b.data < a.data ? -1 : 0))
  }, [data.clientes])

  // Pedidos filtrados para o período atual e período anterior
  const pedidosNoPeriodo = useMemo(() => {
    return filtrarPedidosPorIntervalo(todosOsPedidos, intervaloAtual)
  }, [todosOsPedidos, intervaloAtual])

  const pedidosNoPeriodoAnterior = useMemo(() => {
    return filtrarPedidosPorIntervalo(todosOsPedidos, intervaloAnterior)
  }, [todosOsPedidos, intervaloAnterior])

  // 2. CÁLCULO DOS RELATÓRIOS
  const kpis = useMemo(() => {
    return calcularKPIsResumo(pedidosNoPeriodo, pedidosNoPeriodoAnterior)
  }, [pedidosNoPeriodo, pedidosNoPeriodoAnterior])

  const vendasPorProduto = useMemo(() => {
    return calcularVendasPorProduto(pedidosNoPeriodo, data.produtos)
  }, [pedidosNoPeriodo, data.produtos])

  const rankingClientes = useMemo(() => {
    return calcularRankingClientes(pedidosNoPeriodo, data.clientes)
  }, [pedidosNoPeriodo, data.clientes])

  const vendasPorCanal = useMemo(() => {
    return calcularVendasPorCanal(pedidosNoPeriodo, data.clientes)
  }, [pedidosNoPeriodo, data.clientes])

  const vendasPorFaixaPreco = useMemo(() => {
    return calcularVendasPorFaixaPreco(pedidosNoPeriodo)
  }, [pedidosNoPeriodo])

  const evolucaoTemporal = useMemo(() => {
    return calcularEvolucaoTemporal(pedidosNoPeriodo, intervaloAtual)
  }, [pedidosNoPeriodo, intervaloAtual])

  const melhoresDias = useMemo(() => {
    return calcularMelhoresDiasSemana(pedidosNoPeriodo)
  }, [pedidosNoPeriodo])

  const horariosVenda = useMemo(() => {
    return calcularHorariosVenda(pedidosNoPeriodo)
  }, [pedidosNoPeriodo])

  const projecao = useMemo(() => {
    return calcularProjecaoSimples(pedidosNoPeriodo, intervaloAtual)
  }, [pedidosNoPeriodo, intervaloAtual])

  // Máximo para gráficos
  const maxEvolucaoReceita = useMemo(() => {
    return Math.max(...evolucaoTemporal.map((p) => p.receita), 1)
  }, [evolucaoTemporal])

  const maxDiasReceita = useMemo(() => {
    return Math.max(...melhoresDias.map((d) => d.receita), 1)
  }, [melhoresDias])

  // Filtragem da lista de lançamentos
  const lancamentosFiltrados = useMemo(() => {
    return pedidosNoPeriodo.filter((p) => {
      if (filtroStatusLancamento !== 'todos' && p.status !== filtroStatusLancamento) {
        return false
      }
      if (buscaLancamento.trim()) {
        const termo = buscaLancamento.toLowerCase().trim()
        const matchCliente = (p.clienteNome || '').toLowerCase().includes(termo)
        const matchProd = (p.produtoNome || '').toLowerCase().includes(termo)
        const matchId = (p.id || '').toLowerCase().includes(termo)
        if (!matchCliente && !matchProd && !matchId) return false
      }
      return true
    })
  }, [pedidosNoPeriodo, filtroStatusLancamento, buscaLancamento])

  // Margem mínima configurada (padrão 40%)
  const margemMinima = settings.margemMinimaPct || 40

  // 3. HANDLERS DE EXPORTAÇÃO
  const handleExportarRelatorioCompleto = () => {
    exportarCsvRelatorioCompleto(
      intervaloAtual,
      labelPeriodo,
      kpis,
      vendasPorProduto,
      rankingClientes,
      pedidosNoPeriodo,
    )
    logAudit(
      'Relatórios',
      'Exportação de relatório completo',
      `Relatório de vendas exportado — período ${formatarDataPtBR(intervaloAtual.inicio)} a ${formatarDataPtBR(intervaloAtual.fim)}.`,
    )
    toast({
      title: 'Relatório Completo exportado! 💖',
      description: 'Arquivo CSV em padrão pt-BR pronto para o Excel.',
    })
  }

  const handleExportarProdutos = () => {
    exportarCsvVendasProduto(vendasPorProduto, labelPeriodo)
    logAudit(
      'Relatórios',
      'Exportação vendas por produto',
      `Planilha de vendas por produto e Curva ABC exportada (${labelPeriodo}).`,
    )
    toast({ title: 'Planilha de Vendas por Produto baixada!' })
  }

  const handleExportarRanking = () => {
    exportarCsvRankingClientes(rankingClientes, labelPeriodo)
    logAudit(
      'Relatórios',
      'Exportação ranking de clientes',
      `Ranking de clientes do período exportado (${labelPeriodo}).`,
    )
    toast({ title: 'Planilha de Ranking de Clientes baixada!' })
  }

  const handleImprimirRelatorio = () => {
    logAudit(
      'Relatórios',
      'Impressão de relatório',
      `Relatório de vendas impresso/gerado PDF — período ${labelPeriodo}.`,
    )
    window.print()
  }

  // Componente auxiliar de Badge de Comparação
  const RenderVariacao = ({
    kpi,
  }: {
    kpi: { variacaoPct: number | null; tendencia: 'alta' | 'baixa' | 'estavel' }
  }) => {
    if (kpi.variacaoPct === null) {
      return (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
          <ArrowUpRight className="w-3 h-3 text-emerald-600" />
          Novo no período
        </span>
      )
    }

    if (kpi.tendencia === 'alta') {
      return (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
          <TrendingUp className="w-3 h-3 text-emerald-600" />+
          {kpi.variacaoPct.toFixed(1).replace('.', ',')}% vs anterior
        </span>
      )
    }

    if (kpi.tendencia === 'baixa') {
      return (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
          <TrendingDown className="w-3 h-3 text-rose-600" />
          {kpi.variacaoPct.toFixed(1).replace('.', ',')}% vs anterior
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-[#4E342E]/70 bg-gray-100 px-2 py-0.5 rounded-full">
        <Minus className="w-3 h-3 text-gray-500" />
        0,0% estável
      </span>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in print:space-y-4">
      {/* CABEÇALHO EXCLUSIVO PARA IMPRESSÃO (Oculto em tela normal, visível ao imprimir) */}
      <div className="hidden print:block border-b-2 border-[#FF1493] pb-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-brand-serif text-[#4E342E]">
              Bru Memórias | Relatório Executivo de Vendas
            </h1>
            <p className="text-xs text-[#4E342E]/80">
              Controle Especializado de Vendas • Ímãs Personalizados 5x5 cm • Recreio dos
              Bandeirantes, RJ
            </p>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold text-[#FF1493]">{labelPeriodo}</span>
            <p className="text-[10px] text-gray-500">
              Emitido em: {new Date().toLocaleDateString('pt-BR')} às{' '}
              {new Date().toLocaleTimeString('pt-BR')}
            </p>
          </div>
        </div>
      </div>

      {/* BARRA SUPERIOR DO MÓDULO (Em tela) */}
      <div className="bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-soft-pink flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <span className="text-xs font-bold text-[#FF1493] uppercase tracking-wider block mb-1">
            Módulo 7 • Inteligência Analítica & Exportação
          </span>
          <h2 className="text-2xl font-brand-serif font-bold text-[#4E342E] flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#FF1493]" />
            Relatórios Avançados de Vendas
          </h2>
          <p className="text-xs text-[#4E342E]/70 mt-1">
            Análises profundas, comparativo com período anterior, Curva ABC, canais e projeções
            executivas.
          </p>
        </div>

        {/* Botões de Ação de Exportação & Impressão */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleImprimirRelatorio}
            className="inline-flex items-center justify-center gap-1.5 min-w-[44px] min-h-[44px] px-3.5 py-2 text-xs font-semibold text-[#4E342E] bg-[#F5EFEA] hover:bg-[#4E342E] hover:text-white rounded-full transition-all duration-150 shadow-2xs active:scale-95"
            title="Imprimir relatório limpo ou salvar em PDF"
          >
            <Printer className="w-4 h-4 text-[#FF1493]" />
            <span>Imprimir / PDF</span>
          </button>

          <button
            onClick={handleExportarRelatorioCompleto}
            className="inline-flex items-center justify-center gap-1.5 min-w-[44px] min-h-[44px] px-4 py-2 text-xs font-bold text-white bg-[#FF1493] hover:bg-[#E01284] rounded-full shadow-md transition-all duration-150 active:scale-95"
            title="Exportar todas as seções para arquivo CSV completo"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV Completo</span>
          </button>
        </div>
      </div>

      {/* 1. SELETOR DE PERÍODO GLOBAL (Card Interativo) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#F0E4E0] shadow-soft-pink space-y-3 print:border-none print:shadow-none print:p-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0E4E0] pb-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#FF1493]" />
            <h3 className="text-sm font-bold text-[#4E342E]">Filtro de Período do Relatório</h3>
          </div>
          <span className="text-xs font-medium text-[#FF1493] bg-[#FFF0F8] px-3 py-1 rounded-full border border-[#FF1493]/20">
            Período Ativo: <strong>{labelPeriodo}</strong>
          </span>
        </div>

        {/* Botões rápidos de período */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 print:hidden">
          {(
            [
              { id: 'hoje', label: 'Hoje' },
              { id: '7d', label: 'Últimos 7 dias' },
              { id: 'mes_atual', label: 'Este mês' },
              { id: 'mes_anterior', label: 'Mês passado' },
              { id: 'ano_atual', label: 'Este ano' },
              { id: 'ano_anterior', label: 'Ano passado' },
              { id: 'personalizado', label: 'Personalizado' },
            ] as { id: PeriodoRelatorioTipo; label: string }[]
          ).map((item) => {
            const isSelected = periodoTipo === item.id
            return (
              <button
                key={item.id}
                onClick={() => setPeriodoTipo(item.id)}
                className={`min-h-[40px] px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all duration-150 select-none ${
                  isSelected
                    ? 'bg-[#FF1493] text-white shadow-xs font-bold'
                    : 'bg-[#F5EFEA] text-[#4E342E]/80 hover:bg-[#FF1493]/10 hover:text-[#FF1493]'
                }`}
              >
                {item.label}
              </button>
            )
          })}
        </div>

        {/* Seletor de Datas Personalizado */}
        {periodoTipo === 'personalizado' && (
          <div className="pt-2 flex flex-wrap items-center gap-3 bg-[#FFF0F8]/50 p-3 rounded-xl border border-[#FF1493]/20 print:hidden animate-fade-in">
            <div className="flex items-center gap-2">
              <label htmlFor="relatorio-data-inicio" className="text-xs font-bold text-[#4E342E]">
                De:
              </label>
              <input
                id="relatorio-data-inicio"
                type="date"
                value={dataInicioCustom}
                max={dataFimCustom || hojeYmd}
                onChange={(e) => setDataInicioCustom(e.target.value)}
                className="px-2.5 py-1 text-xs border border-[#F0E4E0] rounded-lg bg-white text-[#4E342E] focus:ring-1 focus:ring-[#FF1493]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="relatorio-data-fim" className="text-xs font-bold text-[#4E342E]">
                Até:
              </label>
              <input
                id="relatorio-data-fim"
                type="date"
                value={dataFimCustom}
                min={dataInicioCustom}
                max={hojeYmd}
                onChange={(e) => setDataFimCustom(e.target.value)}
                className="px-2.5 py-1 text-xs border border-[#F0E4E0] rounded-lg bg-white text-[#4E342E] focus:ring-1 focus:ring-[#FF1493]"
              />
            </div>
            <span className="text-[11px] text-[#4E342E]/70 italic">
              Comparativo automático com os mesmos dias anteriores imediatos (
              {formatarDataPtBR(intervaloAnterior.inicio)} a{' '}
              {formatarDataPtBR(intervaloAnterior.fim)}).
            </span>
          </div>
        )}
      </div>

      {/* 2. RESUMO DO PERÍODO COM COMPARATIVO (4 CARDS DE KPIS COM TENDÊNCIAS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Receita / Vendas */}
        <div className="bg-gradient-to-br from-white to-[#FFF0F8] p-4 sm:p-5 rounded-2xl border border-[#FF1493]/30 shadow-soft-pink flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] sm:text-xs font-bold text-[#4E342E]/70 uppercase">
              Vendas no Período
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FFF0F8] text-[#FF1493] flex items-center justify-center font-bold text-sm">
              💰
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-3xl font-black font-brand-serif text-[#FF1493] tabular-nums block">
              {formatarMoeda(kpis.receitaTotal.atual)}
            </span>
            <div className="mt-2 flex items-center flex-wrap gap-1">
              <RenderVariacao kpi={kpis.receitaTotal} />
            </div>
            <span className="block text-[10px] text-[#4E342E]/60 mt-1">
              Anterior: {formatarMoeda(kpis.receitaTotal.anterior)}
            </span>
          </div>
        </div>

        {/* Lucro Líquido */}
        <div className="bg-gradient-to-br from-white to-emerald-50/50 p-4 sm:p-5 rounded-2xl border border-emerald-200 shadow-soft-pink flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] sm:text-xs font-bold text-[#4E342E]/70 uppercase">
              Lucro Líquido
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
              📈
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-3xl font-black font-brand-serif text-emerald-700 tabular-nums block">
              {formatarMoeda(kpis.lucroTotal.atual)}
            </span>
            <div className="mt-2 flex items-center flex-wrap gap-1">
              <RenderVariacao kpi={kpis.lucroTotal} />
            </div>
            <span className="block text-[10px] text-emerald-800/70 mt-1">
              Margem média: <strong>{kpis.margemMedia.toFixed(1).replace('.', ',')}%</strong>
            </span>
          </div>
        </div>

        {/* Ticket Médio */}
        <div className="bg-gradient-to-br from-white to-[#F5EFEA] p-4 sm:p-5 rounded-2xl border border-[#F0E4E0] shadow-soft-pink flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] sm:text-xs font-bold text-[#4E342E]/70 uppercase">
              Ticket Médio
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#F5EFEA] text-[#4E342E] flex items-center justify-center font-bold text-sm">
              🎯
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-3xl font-black font-brand-serif text-[#4E342E] tabular-nums block">
              {formatarMoeda(kpis.ticketMedio.atual)}
            </span>
            <div className="mt-2 flex items-center flex-wrap gap-1">
              <RenderVariacao kpi={kpis.ticketMedio} />
            </div>
            <span className="block text-[10px] text-[#4E342E]/60 mt-1">
              {kpis.pedidosCount} {kpis.pedidosCount === 1 ? 'pedido fechado' : 'pedidos fechados'}
            </span>
          </div>
        </div>

        {/* Quantidade de Ímãs Vendidos */}
        <div className="bg-gradient-to-br from-white to-[#FFF0F8] p-4 sm:p-5 rounded-2xl border border-[#FF1493]/30 shadow-soft-pink flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] sm:text-xs font-bold text-[#4E342E]/70 uppercase">
              Ímãs Vendidos
            </span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FFF0F8] text-[#FF1493] flex items-center justify-center font-bold text-sm">
              ✨
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-3xl font-black font-brand-serif text-[#FF1493] tabular-nums block">
              {kpis.quantidadeTotal.atual}{' '}
              <span className="text-xs font-normal text-[#4E342E]/70">unidades</span>
            </span>
            <div className="mt-2 flex items-center flex-wrap gap-1">
              <RenderVariacao kpi={kpis.quantidadeTotal} />
            </div>
            <span className="block text-[10px] text-[#4E342E]/60 mt-1">
              Anterior: {kpis.quantidadeTotal.anterior} un
            </span>
          </div>
        </div>
      </div>

      {/* SEÇÃO GRÁFICO: EVOLUÇÃO TEMPORAL (RECEITA & LUCRO) */}
      <div className="bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-soft-pink">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-[#F0E4E0] pb-3">
          <div>
            <h3 className="text-base font-bold text-[#4E342E] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#FF1493]" />
              Evolução Temporal de Receita & Lucro
            </h3>
            <p className="text-xs text-[#4E342E]/70">
              Agregação automática ({evolucaoTemporal.length > 20 ? 'diária' : 'periódica'}) para o
              intervalo selecionado
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-[#FF1493]">
              <span className="w-3 h-3 rounded-sm bg-[#FF1493] inline-block" /> Receita
            </span>
            <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
              <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Lucro
            </span>
          </div>
        </div>

        {pedidosNoPeriodo.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#4E342E]/60">
            Nenhuma venda registrada no período ({labelPeriodo}) 💖
          </div>
        ) : (
          <div className="h-60 w-full flex items-end gap-1 sm:gap-2 pt-6 pb-2 px-1 border-b border-[#F0E4E0] overflow-x-auto">
            {evolucaoTemporal.map((item, idx) => {
              const pctReceita = Math.max(
                item.receita > 0 ? 5 : 0,
                Math.round((item.receita / maxEvolucaoReceita) * 100),
              )
              const pctLucro = Math.max(
                item.lucro > 0 ? 3 : 0,
                Math.round((item.lucro / maxEvolucaoReceita) * 100),
              )

              return (
                <div
                  key={idx}
                  className="flex-1 min-w-[24px] flex flex-col items-center h-full justify-end group relative"
                >
                  {/* Tooltip Hover */}
                  <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-[#4E342E] text-white text-[10px] py-1 px-2.5 rounded-lg pointer-events-none whitespace-nowrap z-20 shadow-lg text-center">
                    <strong>{item.label}</strong>
                    <br />
                    Receita: {formatarMoeda(item.receita)}
                    <br />
                    Lucro: {formatarMoeda(item.lucro)} ({item.pedidosCount} pedidos)
                  </div>

                  {/* Barras duplas lado a lado */}
                  <div className="flex items-end gap-0.5 h-full w-full justify-center">
                    {/* Barra Receita */}
                    <div
                      style={{ height: `${pctReceita}%` }}
                      className={`w-2.5 sm:w-3.5 rounded-t-sm transition-all duration-300 ${
                        item.receita > 0
                          ? 'bg-gradient-to-t from-[#B4006E] to-[#FF1493] shadow-2xs'
                          : 'bg-gray-100 h-1'
                      }`}
                      title={`Receita: ${formatarMoeda(item.receita)}`}
                    />
                    {/* Barra Lucro */}
                    <div
                      style={{ height: `${pctLucro}%` }}
                      className={`w-2.5 sm:w-3.5 rounded-t-sm transition-all duration-300 ${
                        item.lucro > 0
                          ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-2xs'
                          : 'bg-gray-100 h-1'
                      }`}
                      title={`Lucro: ${formatarMoeda(item.lucro)}`}
                    />
                  </div>

                  {/* Legenda X */}
                  <span className="text-[9px] text-[#4E342E]/70 mt-1 truncate max-w-full text-center">
                    {item.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* GRID DUPLO: 1. VENDAS POR PRODUTO & CURVA ABC | 2. RANKING DE CLIENTES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* TABELA: VENDAS POR PRODUTO / KIT & CURVA ABC (7 Colunas) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-soft-pink space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0E4E0] pb-2">
            <div>
              <h3 className="text-base font-bold text-[#4E342E] flex items-center gap-2">
                <PieChart className="w-4 h-4 text-[#FF1493]" />
                Vendas por Produto & Curva ABC
              </h3>
              <p className="text-[11px] text-[#4E342E]/70">
                Classificação <strong>A</strong> (até 80%), <strong>B</strong> (até 95%),{' '}
                <strong>C</strong> (resto)
              </p>
            </div>
            <button
              onClick={handleExportarProdutos}
              className="self-start sm:self-auto px-3 py-1 text-xs font-semibold text-[#4E342E] bg-[#F5EFEA] hover:bg-[#4E342E] hover:text-white rounded-full transition-colors flex items-center gap-1 print:hidden"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#FF1493]" />
              <span>CSV Produtos</span>
            </button>
          </div>

          {vendasPorProduto.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#4E342E]/60">
              Nenhum produto vendido no período selecionado 💖
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-[#F5EFEA]/80 text-[#4E342E] border-b border-[#F0E4E0]">
                    <th className="p-2.5 font-bold">Produto / Kit</th>
                    <th className="p-2.5 font-bold text-center">Curva ABC</th>
                    <th className="p-2.5 font-bold text-right">Qtd</th>
                    <th className="p-2.5 font-bold text-right">Receita (R$)</th>
                    <th className="p-2.5 font-bold text-right">Lucro Líquido</th>
                    <th className="p-2.5 font-bold text-right">Margem %</th>
                    <th className="p-2.5 font-bold text-right">Part. %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0E4E0]">
                  {vendasPorProduto.map((prod) => {
                    const isAbaixoMargem = prod.margemPct < margemMinima
                    return (
                      <tr key={prod.produtoId} className="hover:bg-[#FFF0F8]/30 transition-colors">
                        <td className="p-2.5 font-semibold text-[#4E342E]">
                          <div className="flex flex-col">
                            <span>{prod.produtoNome}</span>
                            <span className="text-[10px] text-gray-400">
                              Méd: {formatarMoeda(prod.precoMedioPraticado)}/un
                            </span>
                          </div>
                        </td>
                        <td className="p-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full font-black text-[10px] ${
                              prod.classeAbc === 'A'
                                ? 'bg-[#FF1493] text-white shadow-2xs'
                                : prod.classeAbc === 'B'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-gray-100 text-[#4E342E]'
                            }`}
                            title={`Acumulado: ${(prod.acumuladoPct || 0).toFixed(1)}%`}
                          >
                            Classe {prod.classeAbc}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-bold tabular-nums text-[#4E342E]">
                          {prod.quantidade}
                        </td>
                        <td className="p-2.5 text-right font-bold text-[#4E342E] tabular-nums">
                          {formatarMoeda(prod.receita)}
                        </td>
                        <td className="p-2.5 text-right font-bold text-emerald-700 tabular-nums">
                          {formatarMoeda(prod.lucro)}
                        </td>
                        <td className="p-2.5 text-right tabular-nums">
                          <span
                            className={`px-1.5 py-0.5 rounded font-bold ${
                              isAbaixoMargem
                                ? 'bg-[#FF1493] text-white animate-pulse'
                                : 'text-emerald-800 bg-emerald-50'
                            }`}
                            title={
                              isAbaixoMargem
                                ? `Atenção: Margem abaixo da meta de ${margemMinima}%!`
                                : 'Margem saudável'
                            }
                          >
                            {prod.margemPct.toFixed(1).replace('.', ',')}%
                          </span>
                        </td>
                        <td className="p-2.5 text-right tabular-nums font-semibold text-[#4E342E]">
                          <div className="flex items-center justify-end gap-1.5">
                            <span>{prod.participacaoPct.toFixed(1).replace('.', ',')}%</span>
                            <div className="w-10 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${Math.min(100, prod.participacaoPct)}%` }}
                                className="h-full bg-[#FF1493] rounded-full"
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* RANKING DE CLIENTES DO PERÍODO (5 Colunas) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-soft-pink space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0E4E0] pb-2">
            <div>
              <h3 className="text-base font-bold text-[#4E342E] flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                Ranking de Clientes
              </h3>
              <p className="text-[11px] text-[#4E342E]/70">Quem mais comprou no período</p>
            </div>
            <button
              onClick={handleExportarRanking}
              className="self-start sm:self-auto px-3 py-1 text-xs font-semibold text-[#4E342E] bg-[#F5EFEA] hover:bg-[#4E342E] hover:text-white rounded-full transition-colors flex items-center gap-1 print:hidden"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#FF1493]" />
              <span>CSV Ranking</span>
            </button>
          </div>

          {rankingClientes.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#4E342E]/60">
              Nenhuma compra registrada no período 💖
            </div>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {rankingClientes.map((cli, idx) => {
                const isTop1 = idx === 0
                const isTop3 = idx < 3
                return (
                  <div
                    key={cli.clienteId}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isTop1
                        ? 'bg-gradient-to-r from-[#FFF0F8] to-white border-[#FF1493]/30 shadow-2xs'
                        : 'bg-white border-[#F0E4E0] hover:border-[#FF1493]/30'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                          isTop1
                            ? 'bg-[#FF1493] text-white shadow-2xs'
                            : isTop3
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gray-100 text-[#4E342E]'
                        }`}
                      >
                        {isTop1 ? '👑' : `#${idx + 1}`}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-[#4E342E] truncate">
                            {cli.clienteNome}
                          </span>
                          {isTop3 && (
                            <span className="text-[10px] font-bold text-[#FF1493] bg-[#FFF0F8] px-1.5 py-0.2 rounded-full">
                              Top {idx + 1}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#4E342E]/60 truncate">
                          {cli.pedidosCount} {cli.pedidosCount === 1 ? 'pedido' : 'pedidos'} •{' '}
                          {cli.quantidadeTotal} ímãs • Ticket: {formatarMoeda(cli.ticketMedio)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 flex flex-col items-end">
                      <span className="text-sm font-black font-brand-serif text-[#FF1493] tabular-nums">
                        {formatarMoeda(cli.receitaTotal)}
                      </span>
                      <button
                        onClick={() => navegarParaCliente(cli.clienteId)}
                        className="text-[10px] font-semibold text-[#4E342E]/70 hover:text-[#FF1493] flex items-center gap-0.5 mt-0.5 print:hidden"
                        title="Ver histórico desta cliente no módulo Clientes"
                      >
                        <span>Ver cliente</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* GRID DE ANÁLISES COMPLEMENTARES:
          1. ANÁLISE DE MARGEM & FAIXAS DE PREÇO 
          2. VENDAS POR CANAL DE DIVULGAÇÃO 
          3. PREVISÃO & PROJEÇÃO SIMPLES 
      */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. ANÁLISE DE MARGEM & FAIXAS OFICIAIS */}
        <div className="bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-soft-pink space-y-3">
          <div className="border-b border-[#F0E4E0] pb-2">
            <h3 className="text-sm font-bold text-[#4E342E] flex items-center gap-1.5">
              <Percent className="w-4 h-4 text-[#FF1493]" />
              Margem por Faixa de Preço
            </h3>
            <p className="text-[11px] text-[#4E342E]/70">
              Desempenho por volume de compra (Tabela Oficial)
            </p>
          </div>

          <div className="space-y-2 pt-1">
            {vendasPorFaixaPreco.map((faixa) => (
              <div
                key={faixa.faixa}
                className="p-2.5 rounded-xl bg-gray-50/70 border border-[#F0E4E0]"
              >
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-[#4E342E]">{faixa.faixa}</span>
                  <span className="font-bold text-[#FF1493]">{formatarMoeda(faixa.receita)}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-[#4E342E]/70">
                  <span>{faixa.quantidade} ímãs vendidos</span>
                  <span
                    className={`font-bold px-1.5 py-0.5 rounded ${
                      faixa.receita > 0 && faixa.margemPct < margemMinima
                        ? 'bg-[#FF1493] text-white'
                        : 'text-emerald-700 bg-emerald-50'
                    }`}
                  >
                    Margem: {faixa.margemPct.toFixed(1).replace('.', ',')}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {vendasPorProduto.some((p) => p.margemPct < margemMinima) && (
            <div className="p-2.5 rounded-xl bg-[#FFF0F8] border border-[#FF1493]/30 text-[11px] text-[#FF1493] font-medium flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>
                Atenção: Existem produtos vendidos abaixo da meta de margem de {margemMinima}%.
              </span>
            </div>
          )}
        </div>

        {/* 2. VENDAS POR CANAL DE DIVULGAÇÃO */}
        <div className="bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-soft-pink space-y-3">
          <div className="border-b border-[#F0E4E0] pb-2">
            <h3 className="text-sm font-bold text-[#4E342E] flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-[#FF1493]" />
              Vendas por Canal / Origem
            </h3>
            <p className="text-[11px] text-[#4E342E]/70">
              Onde as clientes conheceram a Bru Memórias
            </p>
          </div>

          {vendasPorCanal.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-400">
              Nenhuma venda para análise de canais.
            </div>
          ) : (
            <div className="space-y-2.5 pt-1">
              {vendasPorCanal.map((c) => (
                <div key={c.canal} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-[#4E342E]">{c.canal}</span>
                    <span className="font-bold text-[#4E342E] tabular-nums">
                      {formatarMoeda(c.receita)} ({c.participacaoPct.toFixed(1).replace('.', ',')}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.min(100, c.participacaoPct)}%` }}
                      className="h-full bg-gradient-to-r from-purple-500 to-[#FF1493] rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 border-t border-gray-100 text-[10px] text-[#4E342E]/60 italic">
            Dica Bru: Registre o canal (Instagram, Indicação, Feira) ao cadastrar a cliente no CRM!
            💖
          </div>
        </div>

        {/* 3. PREVISÃO E PROJEÇÃO SIMPLES (ROTULADA COMO ESTIMATIVA) */}
        <div className="bg-gradient-to-br from-white to-[#FFF0F8]/50 rounded-2xl p-5 border border-[#FF1493]/30 shadow-soft-pink space-y-3 flex flex-col justify-between">
          <div>
            <div className="border-b border-[#FF1493]/20 pb-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#4E342E] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#FF1493]" />
                  Previsão & Estimativa Simples
                </h3>
                <span className="text-[9px] uppercase tracking-wider font-extrabold bg-[#FF1493] text-white px-2 py-0.5 rounded-full">
                  Estimativa
                </span>
              </div>
              <p className="text-[11px] text-[#4E342E]/70 mt-0.5">
                Média diária ponderada com projeção para o mês seguinte
              </p>
            </div>

            <div className="space-y-3 pt-3">
              <div className="p-3 bg-white rounded-xl border border-[#F0E4E0] shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-[#4E342E]/70 block">
                  Média de Vendas por Dia
                </span>
                <span className="text-xl font-bold font-brand-serif text-[#4E342E] tabular-nums">
                  {formatarMoeda(projecao.mediaDiariaReceita)} / dia
                </span>
                <span className="block text-[10px] text-gray-500">
                  Aprox. {projecao.mediaDiariaQuantidade.toFixed(1).replace('.', ',')} ímãs por dia
                </span>
              </div>

              <div className="p-3 bg-[#FFF0F8] rounded-xl border border-[#FF1493]/30 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-[#FF1493] block">
                  Projeção Estimada para o Mês Seguinte ({projecao.diasMesSeguinte} dias)
                </span>
                <span className="text-2xl font-black font-brand-serif text-[#FF1493] tabular-nums block">
                  {formatarMoeda(projecao.projecaoProximoMesReceita)}
                </span>
                <span className="block text-[10px] text-[#4E342E]/70 mt-0.5">
                  Previsão de <strong>{projecao.projecaoProximoMesQuantidade}</strong> ímãs vendidos
                </span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-gray-400 italic">
            * Cálculo estatístico linear com base no ritmo de vendas do período selecionado (
            {projecao.diasNoPeriodo} dias).
          </p>
        </div>
      </div>

      {/* MELHORES DIAS & HORÁRIOS DE VENDA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Melhores Dias da Semana */}
        <div className="bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-soft-pink space-y-3">
          <div className="border-b border-[#F0E4E0] pb-2">
            <h3 className="text-sm font-bold text-[#4E342E] flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#FF1493]" />
              Melhores Dias da Semana para Vendas
            </h3>
            <p className="text-[11px] text-[#4E342E]/70">Concentração de pedidos por dia</p>
          </div>

          <div className="h-44 flex items-end gap-2 pt-4 pb-2 border-b border-gray-100">
            {melhoresDias.map((d) => {
              const pct = Math.max(
                d.receita > 0 ? 8 : 2,
                Math.round((d.receita / maxDiasReceita) * 100),
              )
              const isForte = d.receita === maxDiasReceita && d.receita > 0

              return (
                <div
                  key={d.diaSemana}
                  className="flex-1 flex flex-col items-center h-full justify-end group relative"
                >
                  <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-[#4E342E] text-white text-[10px] py-0.5 px-2 rounded pointer-events-none whitespace-nowrap z-10">
                    {formatarMoeda(d.receita)} ({d.pedidosCount} ped)
                  </div>
                  <div
                    style={{ height: `${pct}%` }}
                    className={`w-full max-w-[28px] rounded-t-md transition-all ${
                      isForte
                        ? 'bg-[#FF1493] shadow-xs'
                        : d.receita > 0
                          ? 'bg-[#FF1493]/60'
                          : 'bg-gray-100'
                    }`}
                  />
                  <span className="text-[9px] text-[#4E342E] font-semibold mt-1">
                    {d.label.slice(0, 3)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Melhores Horários */}
        <div className="bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-soft-pink space-y-3">
          <div className="border-b border-[#F0E4E0] pb-2">
            <h3 className="text-sm font-bold text-[#4E342E] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#FF1493]" />
              Distribuição por Turno / Horário
            </h3>
            <p className="text-[11px] text-[#4E342E]/70">
              Horários de maior atividade de fechamento
            </p>
          </div>

          <div className="space-y-2.5 pt-2">
            {horariosVenda.map((h) => {
              const totalTurnos = horariosVenda.reduce((acc, it) => acc + it.pedidosCount, 0)
              const pct = totalTurnos > 0 ? Math.round((h.pedidosCount / totalTurnos) * 100) : 0
              return (
                <div key={h.faixa} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-[#4E342E]">{h.faixa}</span>
                    <span className="font-bold text-[#4E342E]">
                      {h.pedidosCount} pedidos ({formatarMoeda(h.receita)})
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className="h-full bg-gradient-to-r from-amber-400 to-[#FF1493] rounded-full"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 4. DETALHAMENTO EXPANDÍVEL DOS LANÇAMENTOS DO PERÍODO */}
      <div className="bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-soft-pink space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F0E4E0] pb-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#FF1493]" />
            <div>
              <h3 className="text-base font-bold text-[#4E342E]">
                Lançamentos de Vendas do Período ({pedidosNoPeriodo.length})
              </h3>
              <p className="text-[11px] text-[#4E342E]/70">
                Auditoria detalhada com link direto para a ficha do cliente
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={() => setExpandirLancamentos(!expandirLancamentos)}
              className="px-3 py-1.5 text-xs font-semibold text-[#4E342E] bg-[#F5EFEA] hover:bg-[#4E342E] hover:text-white rounded-lg transition-colors flex items-center gap-1"
            >
              {expandirLancamentos ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Recolher</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Expandir ({pedidosNoPeriodo.length})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {expandirLancamentos && (
          <div className="space-y-3 animate-fade-in">
            {/* Filtros da tabela de lançamentos (busca e status) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 print:hidden">
              <input
                type="text"
                placeholder="Filtrar por cliente, produto ou ID..."
                value={buscaLancamento}
                onChange={(e) => setBuscaLancamento(e.target.value)}
                className="px-3 py-1.5 text-xs border border-[#F0E4E0] rounded-lg bg-gray-50/50 w-full sm:w-64 focus:bg-white focus:ring-1 focus:ring-[#FF1493]"
              />

              <div className="flex items-center gap-2">
                <span className="text-xs text-[#4E342E]/70 font-semibold">Status:</span>
                <select
                  value={filtroStatusLancamento}
                  onChange={(e) => setFiltroStatusLancamento(e.target.value)}
                  className="text-xs px-2.5 py-1.5 bg-[#F5EFEA] border border-[#F0E4E0] rounded-lg text-[#4E342E] focus:ring-1 focus:ring-[#FF1493]"
                >
                  <option value="todos">Todos os status</option>
                  <option value="Fechado">Fechado</option>
                  <option value="Pago">Pago</option>
                  <option value="Entregue">Entregue</option>
                  <option value="Orçamento">Orçamento</option>
                </select>
              </div>
            </div>

            {lancamentosFiltrados.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#4E342E]/70">
                Nenhuma venda registrada neste período 💖
              </div>
            ) : (
              <div className="overflow-x-auto border border-[#F0E4E0] rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-[#F5EFEA]/80 text-[#4E342E] border-b border-[#F0E4E0]">
                      <th className="p-2.5 font-bold">Data</th>
                      <th className="p-2.5 font-bold">Cliente</th>
                      <th className="p-2.5 font-bold">Produto / Kit</th>
                      <th className="p-2.5 font-bold text-center">Qtd</th>
                      <th className="p-2.5 font-bold text-right">Valor Total</th>
                      <th className="p-2.5 font-bold text-right">Lucro</th>
                      <th className="p-2.5 font-bold text-right">Margem %</th>
                      <th className="p-2.5 font-bold text-center">Status</th>
                      <th className="p-2.5 font-bold text-center print:hidden">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0E4E0]">
                    {lancamentosFiltrados.map((ped) => {
                      const isAbaixo = (ped.margemPct || 0) < margemMinima
                      return (
                        <tr key={ped.id} className="hover:bg-[#FFF0F8]/30 transition-colors">
                          <td className="p-2.5 whitespace-nowrap text-gray-500 font-mono">
                            {formatarDataPtBR(ped.data)}
                          </td>
                          <td className="p-2.5 font-bold text-[#4E342E]">
                            <button
                              onClick={() => navegarParaCliente(ped.clienteId)}
                              className="hover:text-[#FF1493] text-left underline-offset-2 hover:underline transition-colors flex items-center gap-1"
                              title="Abrir no módulo Clientes"
                            >
                              <span>{ped.clienteNome}</span>
                              <ExternalLink className="w-3 h-3 text-[#FF1493] flex-shrink-0 print:hidden" />
                            </button>
                          </td>
                          <td className="p-2.5 text-[#4E342E]/90">{ped.produtoNome}</td>
                          <td className="p-2.5 text-center font-bold">{ped.quantidade}</td>
                          <td className="p-2.5 text-right font-bold text-[#4E342E] tabular-nums">
                            {formatarMoeda(ped.receita)}
                          </td>
                          <td className="p-2.5 text-right font-bold text-emerald-700 tabular-nums">
                            {formatarMoeda(ped.lucroLiquido)}
                          </td>
                          <td className="p-2.5 text-right tabular-nums">
                            <span
                              className={`px-1.5 py-0.5 rounded font-bold ${
                                isAbaixo
                                  ? 'bg-[#FF1493] text-white'
                                  : 'text-emerald-800 bg-emerald-50'
                              }`}
                            >
                              {(ped.margemPct || 0).toFixed(1).replace('.', ',')}%
                            </span>
                          </td>
                          <td className="p-2.5 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                ped.status === 'Entregue'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : ped.status === 'Pago'
                                    ? 'bg-[#FFF0F8] text-[#FF1493] border border-[#FF1493]/30'
                                    : ped.status === 'Fechado'
                                      ? 'bg-purple-100 text-purple-800'
                                      : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {ped.status}
                            </span>
                          </td>
                          <td className="p-2.5 text-center print:hidden">
                            <button
                              onClick={() => navegarParaCliente(ped.clienteId)}
                              className="px-2 py-1 text-[11px] font-semibold text-[#4E342E] bg-gray-100 hover:bg-[#FF1493] hover:text-white rounded transition-colors"
                              title="Ver ficha da cliente"
                            >
                              Ficha
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
