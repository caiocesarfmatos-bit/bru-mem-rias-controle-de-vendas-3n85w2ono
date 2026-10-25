import React, { useMemo } from 'react'
import { useApp } from '@/context/AppContext'
import { PedidoCliente } from '@/types/app'
import { formatarMoeda, formatarDataHoraPtBR } from '@/lib/formatters'
import { exportarCsvPedidos } from '@/lib/exportUtils'
import {
  PeriodoRelatorioTipo,
  obterIntervalosPeriodo,
  filtrarPedidosPorIntervalo,
  calcularKPIsResumo,
  calcularVendasPorProduto,
  calcularVendasPorCanal,
  calcularEvolucaoTemporal,
  calcularMelhoresDiasSemana,
  extrairTodosOsPedidos,
  calcularClientesAtivasNoPeriodo,
} from '@/lib/relatoriosUtils'
import { BadgeVariacao } from '@/components/BadgeVariacao'
import { SeletorPeriodo } from '@/components/SeletorPeriodo'
import { useToast } from '@/hooks/use-toast'
import {
  Activity,
  Trophy,
  Filter,
  DollarSign,
  ShieldCheck,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  PieChart,
  Share2,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react'

export const ModuloPainel: React.FC = () => {
  const {
    data,
    audit,
    navegarParaRelatorio,
    navegarParaCliente,
    periodoRelatorioTipo,
    setPeriodoRelatorioTipo,
    periodoCustomInicio,
    setPeriodoCustomInicio,
    periodoCustomFim,
    setPeriodoCustomFim,
  } = useApp()
  const { toast } = useToast()

  // Filtro da trilha de auditoria
  const [auditModuloFiltro, setAuditModuloFiltro] = React.useState<string>('todos')

  // 1. Obter intervalo compartilhado unificado com Relatórios
  const tipoAtual = (periodoRelatorioTipo || 'mes_atual') as PeriodoRelatorioTipo
  const {
    atual: intervaloAtual,
    anterior: intervaloAnterior,
    label: labelPeriodo,
  } = useMemo(() => {
    return obterIntervalosPeriodo(tipoAtual, periodoCustomInicio, periodoCustomFim)
  }, [tipoAtual, periodoCustomInicio, periodoCustomFim])

  // 2. Base de pedidos unificada via helper compartilhado
  const todosOsPedidos: PedidoCliente[] = useMemo(() => {
    return extrairTodosOsPedidos(data.clientes)
  }, [data.clientes])

  // 3. Filtrar pedidos do período ativo e do período anterior
  const pedidosNoPeriodo = useMemo(() => {
    return filtrarPedidosPorIntervalo(todosOsPedidos, intervaloAtual)
  }, [todosOsPedidos, intervaloAtual])

  const pedidosNoPeriodoAnterior = useMemo(() => {
    return filtrarPedidosPorIntervalo(todosOsPedidos, intervaloAnterior)
  }, [todosOsPedidos, intervaloAnterior])

  // 4. Cálculos analíticos compartilhados (MESMA lógica de agregação de Relatórios)
  const kpis = useMemo(() => {
    return calcularKPIsResumo(pedidosNoPeriodo, pedidosNoPeriodoAnterior)
  }, [pedidosNoPeriodo, pedidosNoPeriodoAnterior])

  const vendasPorProduto = useMemo(() => {
    return calcularVendasPorProduto(pedidosNoPeriodo, data.produtos)
  }, [pedidosNoPeriodo, data.produtos])

  const vendasPorCanal = useMemo(() => {
    return calcularVendasPorCanal(pedidosNoPeriodo, data.clientes)
  }, [pedidosNoPeriodo, data.clientes])

  const evolucaoTemporal = useMemo(() => {
    return calcularEvolucaoTemporal(pedidosNoPeriodo, intervaloAtual)
  }, [pedidosNoPeriodo, intervaloAtual])

  const melhoresDias = useMemo(() => {
    return calcularMelhoresDiasSemana(pedidosNoPeriodo)
  }, [pedidosNoPeriodo])

  // Clientes ativas no período selecionado (e contagem geral de 90d para contexto)
  const clientesAtivasNoPeriodo = useMemo(() => {
    return calcularClientesAtivasNoPeriodo(data.clientes, intervaloAtual)
  }, [data.clientes, intervaloAtual])

  // Máximo para escala do gráfico temporal
  const maxEvolucaoReceita = useMemo(() => {
    return Math.max(...evolucaoTemporal.map((p) => p.receita), 1)
  }, [evolucaoTemporal])

  // Top 3 Curva ABC para o card de destaque do Painel
  const top3ProdutosAbc = useMemo(() => {
    return vendasPorProduto.slice(0, 3)
  }, [vendasPorProduto])

  // Top 3 Canais de Venda para o card de destaque
  const top3Canais = useMemo(() => {
    return vendasPorCanal.slice(0, 3)
  }, [vendasPorCanal])

  // Ranking geral de produtos do período (para as barras horizontais clássicas do painel)
  const rankingProdutosPeriodo = useMemo(() => {
    return [...vendasPorProduto].sort((a, b) => b.quantidade - a.quantidade)
  }, [vendasPorProduto])

  const maiorReceitaProduto = useMemo(() => {
    return Math.max(...rankingProdutosPeriodo.map((p) => p.receita), 1)
  }, [rankingProdutosPeriodo])

  // DADOS DO FUNIL DE VENDAS NO PERÍODO SELECIONADO
  // Estágios: Orçamento → Fechado → Pago → Entregue
  const funilVendas = useMemo(() => {
    const orcamentos = pedidosNoPeriodo.filter((p) => p.status === 'Orçamento').length
    const fechados = pedidosNoPeriodo.filter((p) => p.status === 'Fechado').length
    const pagos = pedidosNoPeriodo.filter((p) => p.status === 'Pago').length
    const entregues = pedidosNoPeriodo.filter((p) => p.status === 'Entregue').length

    const estagios = [
      {
        nome: '1. Orçamento Solicitado',
        status: 'Orçamento',
        count: orcamentos + fechados + pagos + entregues,
        cor: '#FB8C00', // Laranja
      },
      {
        nome: '2. Pedido Fechado',
        status: 'Fechado',
        count: fechados + pagos + entregues,
        cor: '#8E24AA', // Roxo
      },
      {
        nome: '3. Pagamento Confirmado',
        status: 'Pago',
        count: pagos + entregues,
        cor: '#FF1493', // Rosa Choque
      },
      {
        nome: '4. Ímãs Entregues ✨',
        status: 'Entregue',
        count: entregues,
        cor: '#2E7D32', // Verde
      },
    ]

    const baseFunil = Math.max(estagios[0].count, 1)

    return estagios.map((est) => ({
      ...est,
      pct: Math.round((est.count / baseFunil) * 100),
    }))
  }, [pedidosNoPeriodo])

  // FLUXO DE CAIXA: CONTEXTO TEMPORAL (entradas de pedidos vs saídas de custos)
  // Calcula os meses relevantes considerando o período (se este ano/ano passado ou últimos 6 meses)
  const fluxoCaixaMeses = useMemo(() => {
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

    const chavesSet = new Set<string>()
    // Pelo menos os últimos 6 meses
    const hoje = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
      const mesStr = (d.getMonth() + 1).toString().padStart(2, '0')
      chavesSet.add(`${d.getFullYear()}-${mesStr}`)
    }

    // Incluir meses abrangidos pelo intervalo do período selecionado
    if (intervaloAtual.inicio && intervaloAtual.fim) {
      const iniAno = parseInt(intervaloAtual.inicio.slice(0, 4), 10)
      const iniMes = parseInt(intervaloAtual.inicio.slice(5, 7), 10)
      const fimAno = parseInt(intervaloAtual.fim.slice(0, 4), 10)
      const fimMes = parseInt(intervaloAtual.fim.slice(5, 7), 10)

      let a = iniAno
      let m = iniMes
      while (a < fimAno || (a === fimAno && m <= fimMes)) {
        chavesSet.add(`${a}-${m.toString().padStart(2, '0')}`)
        m++
        if (m > 12) {
          m = 1
          a++
        }
      }
    }

    const chavesOrdenadas = Array.from(chavesSet).sort()
    // Limitar para não estourar a tabela (últimos 12 meses no máximo)
    const chavesFinais = chavesOrdenadas.slice(-12)

    const resultado = chavesFinais.map((chave) => {
      const [anoStr, mesStr] = chave.split('-')
      const mesNum = parseInt(mesStr, 10)
      return {
        chave,
        label: `${mesesNomes[mesNum - 1]}/${anoStr}`,
        entradas: 0,
        saidas: 0,
        saldo: 0,
        estaNoPeriodoAtivo:
          chave >= intervaloAtual.inicio.slice(0, 7) && chave <= intervaloAtual.fim.slice(0, 7),
      }
    })

    // Entradas: Pedidos
    todosOsPedidos.forEach((ped) => {
      const chaveMes = ped.data.slice(0, 7)
      const mesItem = resultado.find((r) => r.chave === chaveMes)
      if (mesItem) {
        mesItem.entradas += ped.receita
      }
    })

    // Saídas: Custos registrados
    data.produtos.forEach((prod) => {
      prod.itens.forEach((it) => {
        it.lancamentos.forEach((l) => {
          const chaveMes = l.data.slice(0, 7)
          const mesItem = resultado.find((r) => r.chave === chaveMes)
          if (mesItem) {
            mesItem.saidas += l.valor
          }
        })
      })
    })

    // Saldo
    resultado.forEach((r) => {
      r.saldo = r.entradas - r.saidas
    })

    return resultado
  }, [todosOsPedidos, data.produtos, intervaloAtual])

  // FILTRAGEM DA TRILHA DE AUDITORIA
  const auditoriaFiltrada = useMemo(() => {
    if (auditModuloFiltro === 'todos') {
      return audit
    }
    return audit.filter((a) => a.modulo.toLowerCase() === auditModuloFiltro.toLowerCase())
  }, [audit, auditModuloFiltro])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabeçalho do Painel Integrado */}
      <div className="bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-soft-pink flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#FF1493] uppercase tracking-wider block mb-1">
            Módulo 5 • Painel Integrado de Gestão
          </span>
          <h2 className="text-2xl font-brand-serif font-bold text-[#4E342E]">
            Painel Executivo Bru Memórias
          </h2>
          <p className="text-xs text-[#4E342E]/70 mt-1">
            Visão consolidada sincronizada em tempo real com o módulo de Relatórios.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navegarParaRelatorio('resumo')}
            className="min-h-[44px] px-4 py-2 text-xs font-bold text-white bg-[#FF1493] hover:bg-[#E01284] rounded-full shadow-md transition-all duration-150 flex items-center gap-1.5 active:scale-95"
            title="Ir para o Módulo de Relatórios Avançados com o mesmo período ativo"
          >
            <span>Ver Relatórios Completos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              exportarCsvPedidos(data)
              toast({ title: 'Relatório CSV de Pedidos baixado!' })
            }}
            className="min-h-[44px] px-3.5 py-2 text-xs font-semibold text-[#4E342E] bg-[#F5EFEA] hover:bg-[#4E342E] hover:text-white rounded-full transition-colors flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#FF1493]" />
            <span>Exportar Pedidos</span>
          </button>
        </div>
      </div>

      {/* 1. SELETOR DE PERÍODO COMPARTILHADO COM RELATÓRIOS */}
      <SeletorPeriodo
        periodoTipo={tipoAtual}
        onChangePeriodoTipo={(t) => setPeriodoRelatorioTipo(t)}
        dataInicioCustom={periodoCustomInicio}
        onChangeDataInicioCustom={(d) => setPeriodoCustomInicio(d)}
        dataFimCustom={periodoCustomFim}
        onChangeDataFimCustom={(d) => setPeriodoCustomFim(d)}
        labelPeriodo={labelPeriodo}
        intervaloAnterior={intervaloAnterior}
        subtitulo="Período compartilhado: mantido automaticamente ao navegar para Relatórios"
      />

      {/* 2. 4 CARDS DE KPIS UNIFICADOS COM COMPARATIVO % VS. PERÍODO ANTERIOR */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total de Vendas */}
        <div className="bg-gradient-to-br from-white to-[#FFF0F8] p-4 sm:p-5 rounded-2xl border border-[#FF1493]/30 shadow-soft-pink flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold text-[#4E342E]/70 uppercase">
              Total de Vendas
            </span>
            <div className="w-8 h-8 rounded-full bg-[#FFF0F8] text-[#FF1493] flex items-center justify-center font-bold text-sm">
              💰
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-3xl font-black font-brand-serif text-[#FF1493] tabular-nums block">
              {formatarMoeda(kpis.receitaTotal.atual)}
            </span>
            <div className="mt-1.5 flex items-center flex-wrap gap-1">
              <BadgeVariacao kpi={kpis.receitaTotal} />
            </div>
            <span className="block text-[11px] text-[#4E342E]/70 mt-1">
              {kpis.pedidosCount}{' '}
              {kpis.pedidosCount === 1 ? 'pedido no período' : 'pedidos no período'}
            </span>
          </div>
        </div>

        {/* Lucro Líquido */}
        <div className="bg-gradient-to-br from-white to-emerald-50/50 p-4 sm:p-5 rounded-2xl border border-emerald-200 shadow-soft-pink flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold text-[#4E342E]/70 uppercase">
              Lucro Líquido
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
              📈
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-3xl font-black font-brand-serif text-emerald-700 tabular-nums block">
              {formatarMoeda(kpis.lucroTotal.atual)}
            </span>
            <div className="mt-1.5 flex items-center flex-wrap gap-1">
              <BadgeVariacao kpi={kpis.lucroTotal} />
            </div>
            <span className="block text-[11px] text-emerald-800/80 mt-1">
              Margem média: {kpis.margemMedia.toFixed(1).replace('.', ',')}%
            </span>
          </div>
        </div>

        {/* Ticket Médio */}
        <div className="bg-gradient-to-br from-white to-[#F5EFEA] p-4 sm:p-5 rounded-2xl border border-[#F0E4E0] shadow-soft-pink flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold text-[#4E342E]/70 uppercase">
              Ticket Médio
            </span>
            <div className="w-8 h-8 rounded-full bg-[#F5EFEA] text-[#4E342E] flex items-center justify-center font-bold text-sm">
              🎯
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-3xl font-black font-brand-serif text-[#4E342E] tabular-nums block">
              {formatarMoeda(kpis.ticketMedio.atual)}
            </span>
            <div className="mt-1.5 flex items-center flex-wrap gap-1">
              <BadgeVariacao kpi={kpis.ticketMedio} />
            </div>
            <span className="block text-[11px] text-[#4E342E]/70 mt-1">
              Por pedido no período ativo
            </span>
          </div>
        </div>

        {/* Clientes Ativas */}
        <div className="bg-gradient-to-br from-white to-[#FFF0F8] p-4 sm:p-5 rounded-2xl border border-[#FF1493]/30 shadow-soft-pink flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-bold text-[#4E342E]/70 uppercase">
              Clientes Ativas
            </span>
            <div className="w-8 h-8 rounded-full bg-[#FFF0F8] text-[#FF1493] flex items-center justify-center font-bold text-sm">
              💖
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-3xl font-black font-brand-serif text-[#4E342E] tabular-nums block">
              {clientesAtivasNoPeriodo}
            </span>
            <div className="mt-1.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#FF1493] bg-[#FFF0F8] px-2 py-0.5 rounded-full border border-[#FF1493]/20">
                <Sparkles className="w-3 h-3 flex-shrink-0" />
                <span>No período selecionado</span>
              </span>
            </div>
            <span className="block text-[11px] text-[#4E342E]/70 mt-1">
              De {data.clientes.length} cadastradas no total
            </span>
          </div>
        </div>
      </div>

      {/* 3. WIDGETS DE RELATÓRIO NO PAINEL (DESTAQUES RESUMIDOS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Widget 1: Resumo do Período & Comparativo */}
        <div className="bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-soft-pink flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between border-b border-[#F0E4E0] pb-2">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#FF1493]" />
                <h3 className="text-sm font-bold text-[#4E342E]">Resumo do Período</h3>
              </div>
              <span className="text-[10px] font-bold text-[#FF1493] bg-[#FFF0F8] px-2 py-0.5 rounded-full border border-[#FF1493]/20">
                {labelPeriodo}
              </span>
            </div>

            <div className="space-y-2 pt-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#F5EFEA]/60">
                <span className="text-[#4E342E]/80">Ímãs Produzidos/Vendidos:</span>
                <span className="font-bold text-[#4E342E] tabular-nums">
                  {kpis.quantidadeTotal.atual} un
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#F5EFEA]/60">
                <span className="text-[#4E342E]/80">Receita Período Anterior:</span>
                <span className="font-semibold text-[#4E342E]/70 tabular-nums">
                  {formatarMoeda(kpis.receitaTotal.anterior)}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/70 border border-emerald-100">
                <span className="text-emerald-900 font-medium">Margem Líquida Real:</span>
                <span className="font-bold text-emerald-800 tabular-nums">
                  {kpis.margemMedia.toFixed(1).replace('.', ',')}%
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navegarParaRelatorio('resumo')}
            className="w-full min-h-[44px] mt-2 py-2 px-3 text-xs font-bold text-[#FF1493] bg-[#FFF0F8] hover:bg-[#FF1493] hover:text-white rounded-xl transition-all duration-150 flex items-center justify-center gap-1.5 border border-[#FF1493]/20"
          >
            <span>Ver detalhes em Relatórios</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Widget 2: Curva ABC — Top Produtos */}
        <div className="bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-soft-pink flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between border-b border-[#F0E4E0] pb-2">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-[#FF1493]" />
                <h3 className="text-sm font-bold text-[#4E342E]">Curva ABC • Top Produtos</h3>
              </div>
              <span className="text-[10px] text-gray-400">Classe A</span>
            </div>

            <div className="space-y-2 pt-2">
              {top3ProdutosAbc.length === 0 ? (
                <div className="py-5 text-center text-xs text-gray-400">
                  Nenhuma venda no período selecionado.
                </div>
              ) : (
                top3ProdutosAbc.map((prod, idx) => (
                  <div
                    key={prod.produtoId}
                    className="p-2 rounded-xl bg-[#F5EFEA]/60 flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-[#FF1493] text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-[#4E342E] truncate">{prod.produtoNome}</p>
                        <p className="text-[10px] text-gray-500">
                          {prod.quantidade} un • {prod.participacaoPct.toFixed(1).replace('.', ',')}
                          % do total
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-[#FF1493] tabular-nums flex-shrink-0">
                      {formatarMoeda(prod.receita)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => navegarParaRelatorio('produtos')}
            className="w-full min-h-[44px] mt-2 py-2 px-3 text-xs font-bold text-[#FF1493] bg-[#FFF0F8] hover:bg-[#FF1493] hover:text-white rounded-xl transition-all duration-150 flex items-center justify-center gap-1.5 border border-[#FF1493]/20"
          >
            <span>Ver Curva ABC completa</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Widget 3: Canais de Venda Resumido */}
        <div className="bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-soft-pink flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between border-b border-[#F0E4E0] pb-2">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#FF1493]" />
                <h3 className="text-sm font-bold text-[#4E342E]">Canais de Venda</h3>
              </div>
              <span className="text-[10px] text-gray-400">Origem</span>
            </div>

            <div className="space-y-2 pt-2">
              {top3Canais.length === 0 ? (
                <div className="py-5 text-center text-xs text-gray-400">
                  Nenhum canal registrado no período.
                </div>
              ) : (
                top3Canais.map((c) => (
                  <div key={c.canal} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-[#4E342E]">{c.canal}</span>
                      <span className="font-bold text-[#4E342E] tabular-nums">
                        {formatarMoeda(c.receita)} ({c.participacaoPct.toFixed(1).replace('.', ',')}
                        %)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, c.participacaoPct)}%` }}
                        className="h-full bg-gradient-to-r from-purple-500 to-[#FF1493] rounded-full"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => navegarParaRelatorio('canais')}
            className="w-full min-h-[44px] mt-2 py-2 px-3 text-xs font-bold text-[#FF1493] bg-[#FFF0F8] hover:bg-[#FF1493] hover:text-white rounded-xl transition-all duration-150 flex items-center justify-center gap-1.5 border border-[#FF1493]/20"
          >
            <span>Ver análise de canais</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. GRÁFICO: EVOLUÇÃO DAS VENDAS NO PERÍODO SELECIONADO */}
      <div className="bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-soft-pink">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-[#4E342E] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#FF1493]" />
              Evolução das Vendas no Período ({labelPeriodo})
            </h3>
            <p className="text-xs text-[#4E342E]/70">
              Receita e pedidos reais respondendo dinamicamente ao filtro de período selecionado
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-[#FF1493]">
                <span className="w-3 h-3 rounded-sm bg-[#FF1493] inline-block" /> Receita
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
                <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Lucro
              </span>
            </div>
            <button
              onClick={() => navegarParaRelatorio('resumo')}
              className="text-xs font-bold text-[#FF1493] hover:underline flex items-center gap-1 pl-2 border-l border-gray-200"
            >
              <span>Detalhar</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Gráfico puro em SVG/CSS */}
        {evolucaoTemporal.length === 0 || pedidosNoPeriodo.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#4E342E]/60 bg-[#FFF0F8]/20 rounded-xl border border-dashed border-[#FF1493]/20">
            Nenhuma venda registrada no período selecionado ({labelPeriodo}) 💖
          </div>
        ) : (
          <div className="h-56 w-full flex items-end gap-1 sm:gap-2 pt-6 pb-2 px-1 border-b border-[#F0E4E0] overflow-x-auto">
            {evolucaoTemporal.map((item, idx) => {
              const pctReceita = Math.max(
                item.receita > 0 ? 6 : 0,
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
                    Lucro: {formatarMoeda(item.lucro)} ({item.pedidosCount} ped)
                  </div>

                  {/* Barras duplas lado a lado */}
                  <div className="flex items-end gap-0.5 h-full w-full justify-center">
                    <div
                      style={{ height: `${pctReceita}%` }}
                      className={`w-2.5 sm:w-3.5 rounded-t-sm transition-all duration-300 ${
                        item.receita > 0
                          ? 'bg-gradient-to-t from-[#B4006E] to-[#FF1493] shadow-2xs'
                          : 'bg-gray-100 h-1'
                      }`}
                    />
                    <div
                      style={{ height: `${pctLucro}%` }}
                      className={`w-2.5 sm:w-3.5 rounded-t-sm transition-all duration-300 ${
                        item.lucro > 0
                          ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-2xs'
                          : 'bg-gray-100 h-1'
                      }`}
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

      {/* 5. GRIDS: PRODUTOS (Gráfico / Ranking) & FUNIL DE VENDAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Vendas por Produto & Ranking (7 Colunas) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-soft-pink space-y-4">
          <div className="flex items-center justify-between border-b border-[#F0E4E0] pb-2">
            <div>
              <h3 className="text-base font-bold text-[#4E342E] flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                Ranking de Vendas por Produto / Kit
              </h3>
              <span className="text-xs text-gray-400">No período selecionado</span>
            </div>
            <button
              onClick={() => navegarParaRelatorio('produtos')}
              className="text-xs font-bold text-[#FF1493] hover:underline flex items-center gap-1"
            >
              <span>Ver relatório completo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Barras Horizontais */}
          <div className="space-y-3 pt-1">
            {rankingProdutosPeriodo.length === 0 ? (
              <div className="py-6 text-center text-xs text-gray-400">
                Nenhum produto vendido no período selecionado.
              </div>
            ) : (
              rankingProdutosPeriodo.map((prod, idx) => {
                const pct = Math.max(5, Math.round((prod.receita / maiorReceitaProduto) * 100))
                const cores = ['#FF1493', '#8E24AA', '#FB8C00', '#2E7D32', '#0097A7']
                const cor = cores[idx % cores.length]

                return (
                  <div key={prod.produtoId} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-[#4E342E] flex items-center gap-1.5">
                        <span className="text-xs font-black" style={{ color: cor }}>
                          #{idx + 1}
                        </span>
                        <span>{prod.produtoNome}</span>
                        <span className="text-[11px] text-gray-400 font-normal">
                          ({prod.quantidade} un • Margem{' '}
                          {prod.margemPct.toFixed(1).replace('.', ',')}%)
                        </span>
                      </span>
                      <span className="font-bold text-[#4E342E] tabular-nums">
                        {formatarMoeda(prod.receita)}
                      </span>
                    </div>

                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${pct}%`, backgroundColor: cor }}
                        className="h-full rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Funil de Vendas de 4 Etapas (5 Colunas) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-soft-pink space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#F0E4E0] pb-2">
              <div>
                <h3 className="text-base font-bold text-[#4E342E] flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#FF1493]" />
                  Funil de Vendas (Conversão)
                </h3>
                <p className="text-[11px] text-[#4E342E]/70">
                  Etapas no período selecionado ({pedidosNoPeriodo.length} pedidos)
                </p>
              </div>
              <button
                onClick={() => navegarParaRelatorio('resumo')}
                className="text-xs font-bold text-[#FF1493] hover:underline flex items-center gap-1"
              >
                <span>Auditar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 pt-3">
              {funilVendas.map((estagio) => (
                <div key={estagio.nome} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#4E342E]">{estagio.nome}</span>
                    <span className="text-[11px] font-bold text-[#4E342E]">
                      {estagio.count} {estagio.count === 1 ? 'pedido' : 'pedidos'} ({estagio.pct}%)
                    </span>
                  </div>

                  <div className="w-full h-4 bg-gray-100 rounded-lg overflow-hidden p-0.5">
                    <div
                      style={{ width: `${estagio.pct}%`, backgroundColor: estagio.cor }}
                      className="h-full rounded-md transition-all duration-500 shadow-2xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-gray-400 italic pt-2 border-t border-gray-100">
            Dica Bru: Acompanhe pedidos em "Orçamento" e envie fotos de amostra no WhatsApp para
            acelerar o fechamento! 💖
          </p>
        </div>
      </div>

      {/* 6. FLUXO DE CAIXA DOS MESES (Entradas vs Saídas) */}
      <div className="bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-soft-pink">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-[#F0E4E0] pb-3">
          <div>
            <h3 className="text-base font-bold text-[#4E342E] flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Fluxo de Caixa Consolidado
            </h3>
            <p className="text-xs text-[#4E342E]/70">
              Comparativo entre entradas de pedidos e saídas de custos/despesas (meses destacados
              pertencem ao período ativo)
            </p>
          </div>
          <span className="text-xs font-medium text-[#FF1493] bg-[#FFF0F8] px-3 py-1 rounded-full border border-[#FF1493]/20 self-start sm:self-auto">
            Período: {labelPeriodo}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-[#F5EFEA]/80 text-[#4E342E] border-b border-[#F0E4E0]">
                <th className="p-3 font-bold">Mês/Ano</th>
                <th className="p-3 font-bold text-right text-emerald-800">Entradas (Vendas)</th>
                <th className="p-3 font-bold text-right text-red-700">Saídas (Custos/Extras)</th>
                <th className="p-3 font-bold text-right">Saldo do Mês</th>
                <th className="p-3 font-bold text-center">Status no Filtro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0E4E0]">
              {fluxoCaixaMeses.map((linha) => {
                const isPositivo = linha.saldo >= 0
                return (
                  <tr
                    key={linha.chave}
                    className={`transition-colors ${
                      linha.estaNoPeriodoAtivo
                        ? 'bg-[#FFF0F8]/50 font-medium'
                        : 'hover:bg-[#FFF0F8]/30'
                    }`}
                  >
                    <td className="p-3 font-semibold text-[#4E342E] flex items-center gap-2">
                      {linha.estaNoPeriodoAtivo && (
                        <span
                          className="w-2 h-2 rounded-full bg-[#FF1493]"
                          title="Dentro do período filtrado"
                        />
                      )}
                      <span>{linha.label}</span>
                    </td>
                    <td className="p-3 text-right font-bold text-emerald-700 tabular-nums">
                      {formatarMoeda(linha.entradas)}
                    </td>
                    <td className="p-3 text-right font-semibold text-red-600 tabular-nums">
                      {linha.saidas > 0 ? `-${formatarMoeda(linha.saidas)}` : 'R$ 0,00'}
                    </td>
                    <td
                      className={`p-3 text-right font-black tabular-nums ${
                        isPositivo ? 'text-[#FF1493]' : 'text-red-700'
                      }`}
                    >
                      {formatarMoeda(linha.saldo)}
                    </td>
                    <td className="p-3 text-center">
                      {linha.estaNoPeriodoAtivo ? (
                        <span className="text-[10px] font-bold text-[#FF1493] bg-[#FFF0F8] px-2 py-0.5 rounded-full border border-[#FF1493]/30">
                          Período Selecionado
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400">Histórico</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. TRILHA DE AUDITORIA (LOG IMUTÁVEL APPEND-ONLY) */}
      <div className="bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-soft-pink">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-[#F0E4E0] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#FFF0F8] text-[#FF1493] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#4E342E]">
                Trilha de Auditoria Imutável (Audit Trail)
              </h3>
              <p className="text-[11px] text-[#4E342E]/70">
                Log seguro append-only de todas as ações no sistema (sem edição pela interface)
              </p>
            </div>
          </div>

          {/* Filtro por Módulo */}
          <div className="flex items-center gap-2">
            <label htmlFor="audit-modulo-select" className="text-xs font-semibold text-[#4E342E]">
              Módulo:
            </label>
            <select
              id="audit-modulo-select"
              value={auditModuloFiltro}
              onChange={(e) => setAuditModuloFiltro(e.target.value)}
              className="text-xs px-2.5 py-1.5 bg-[#F5EFEA] border border-[#F0E4E0] rounded-lg text-[#4E342E] focus:ring-1 focus:ring-[#FF1493]"
            >
              <option value="todos">Todos os Módulos</option>
              <option value="Custos">Custos</option>
              <option value="Calculadora">Calculadora</option>
              <option value="Clientes">Clientes</option>
              <option value="Fornecedores">Fornecedores</option>
              <option value="Estoque">Estoque</option>
              <option value="Relatórios">Relatórios</option>
              <option value="Sistema">Sistema</option>
            </select>
          </div>
        </div>

        {/* Tabela de Logs com rolagem */}
        <div className="max-h-72 overflow-y-auto border border-[#F0E4E0] rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#FAFAFA] sticky top-0 border-b border-[#F0E4E0] text-[#4E342E]">
              <tr>
                <th className="p-2.5 font-bold w-36">Data / Hora</th>
                <th className="p-2.5 font-bold w-24">Módulo</th>
                <th className="p-2.5 font-bold w-40">Ação</th>
                <th className="p-2.5 font-bold">Detalhe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0E4E0]">
              {auditoriaFiltrada.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 text-[11px]">
                  <td className="p-2.5 text-gray-500 whitespace-nowrap tabular-nums">
                    {formatarDataHoraPtBR(log.dataHora)}
                  </td>
                  <td className="p-2.5 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        log.modulo === 'Custos'
                          ? 'bg-amber-100 text-amber-800'
                          : log.modulo === 'Calculadora'
                            ? 'bg-blue-100 text-blue-800'
                            : log.modulo === 'Clientes'
                              ? 'bg-rose-100 text-[#FF1493]'
                              : log.modulo === 'Fornecedores'
                                ? 'bg-purple-100 text-purple-800'
                                : log.modulo === 'Estoque'
                                  ? 'bg-[#FFF0F8] text-[#FF1493] border border-[#FF1493]/30'
                                  : log.modulo === 'Relatórios'
                                    ? 'bg-pink-100 text-[#FF1493] font-black'
                                    : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {log.modulo}
                    </span>
                  </td>
                  <td className="p-2.5 font-bold text-[#4E342E] whitespace-nowrap">{log.acao}</td>
                  <td className="p-2.5 text-[#4E342E]/80">{log.detalhe}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
