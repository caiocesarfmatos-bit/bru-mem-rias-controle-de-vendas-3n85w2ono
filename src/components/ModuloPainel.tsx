import React, { useState, useMemo } from 'react'
import { useApp } from '@/context/AppContext'
import { PedidoCliente, AuditModulo } from '@/types/app'
import { formatarMoeda, formatarDataPtBR, formatarDataHoraPtBR } from '@/lib/formatters'
import { exportarJson, exportarCsvPedidos } from '@/lib/exportUtils'
import { useToast } from '@/hooks/use-toast'
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Trophy,
  Filter,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  FileSpreadsheet,
  Download,
  Activity,
} from 'lucide-react'

type PeriodoVendas = '7d' | '30d' | '90d' | 'ano'

export const ModuloPainel: React.FC = () => {
  const { data, audit } = useApp()
  const { toast } = useToast()

  // Seletor de período para o gráfico de vendas
  const [periodo, setPeriodo] = useState<PeriodoVendas>('30d')
  // Filtro da trilha de auditoria
  const [auditModuloFiltro, setAuditModuloFiltro] = useState<string>('todos')

  // Limite de 90 dias atrás para clientes ativos
  const hoje = new Date()
  const data90dAtras = new Date()
  data90dAtras.setDate(hoje.getDate() - 90)
  const iso90dAtras = data90dAtras.toISOString().split('T')[0]

  // Consolidar todos os pedidos de todos os clientes
  const todosOsPedidos: PedidoCliente[] = useMemo(() => {
    const list: PedidoCliente[] = []
    data.clientes.forEach((cli) => {
      cli.pedidos.forEach((p) => {
        list.push(p)
      })
    })
    return list.sort((a, b) => (b.data > a.data ? 1 : -1))
  }, [data.clientes])

  // KPIs GERAIS
  const totalVendasGeral = todosOsPedidos.reduce((acc, p) => acc + (p.receita || 0), 0)
  const totalLucroGeral = todosOsPedidos.reduce((acc, p) => acc + (p.lucroLiquido || 0), 0)
  const totalPedidosGeral = todosOsPedidos.length
  const ticketMedioGeral = totalPedidosGeral > 0 ? totalVendasGeral / totalPedidosGeral : 0

  // Clientes ativos (com pelo menos uma compra nos últimos 90 dias)
  const clientesAtivosCount = useMemo(() => {
    return data.clientes.filter((cli) => cli.pedidos.some((p) => p.data >= iso90dAtras)).length
  }, [data.clientes, iso90dAtras])

  // DADOS DO GRÁFICO 1: VENDAS POR PERÍODO
  const dadosGraficoPeriodo = useMemo(() => {
    let diasAtras = 30
    if (periodo === '7d') diasAtras = 7
    if (periodo === '30d') diasAtras = 30
    if (periodo === '90d') diasAtras = 90
    if (periodo === 'ano') diasAtras = 365

    const cutoff = new Date()
    cutoff.setDate(hoje.getDate() - diasAtras)
    const cutoffStr = cutoff.toISOString().split('T')[0]

    const pedidosNoPeriodo = todosOsPedidos.filter((p) => p.data >= cutoffStr)

    // Agrupamento
    if (periodo === '7d' || periodo === '30d') {
      // Agrupar por dia
      const mapaDias: Record<string, number> = {}
      for (let i = diasAtras - 1; i >= 0; i--) {
        const d = new Date()
        d.setDate(hoje.getDate() - i)
        const key = d.toISOString().split('T')[0]
        mapaDias[key] = 0
      }
      pedidosNoPeriodo.forEach((p) => {
        if (mapaDias[p.data] !== undefined) {
          mapaDias[p.data] += p.receita
        }
      })
      const itens = Object.entries(mapaDias).map(([chaveData, total]) => {
        const [, mes, dia] = chaveData.split('-')
        return {
          label: `${dia}/${mes}`,
          valor: total,
          dataCompleta: chaveData,
        }
      })
      return itens
    } else {
      // Agrupar por mês
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
      const mapaMeses: Record<string, { label: string; valor: number }> = {}

      pedidosNoPeriodo.forEach((p) => {
        const [ano, mes] = p.data.split('-')
        const key = `${ano}-${mes}`
        if (!mapaMeses[key]) {
          mapaMeses[key] = {
            label: `${mesesNomes[parseInt(mes, 10) - 1]}/${ano.slice(2)}`,
            valor: 0,
          }
        }
        mapaMeses[key].valor += p.receita
      })

      return Object.values(mapaMeses)
    }
  }, [todosOsPedidos, periodo])

  const maiorValorPeriodo = useMemo(() => {
    const max = Math.max(...dadosGraficoPeriodo.map((d) => d.valor), 1)
    return max
  }, [dadosGraficoPeriodo])

  // DADOS DO GRÁFICO 2: VENDAS POR PRODUTO & RANKING
  const { vendasPorProduto, rankingProdutos } = useMemo(() => {
    const mapa: Record<string, { nome: string; receita: number; quantidade: number }> = {}

    // Inicializa com os produtos do catálogo
    data.produtos.forEach((prod) => {
      mapa[prod.id] = { nome: prod.nome, receita: 0, quantidade: 0 }
    })

    todosOsPedidos.forEach((p) => {
      if (!mapa[p.produtoId]) {
        mapa[p.produtoId] = { nome: p.produtoNome, receita: 0, quantidade: 0 }
      }
      mapa[p.produtoId].receita += p.receita
      mapa[p.produtoId].quantidade += p.quantidade
    })

    const lista = Object.values(mapa)
    const ranking = [...lista].sort((a, b) => b.quantidade - a.quantidade)
    return { vendasPorProduto: lista, rankingProdutos: ranking }
  }, [data.produtos, todosOsPedidos])

  const maiorReceitaProduto = useMemo(() => {
    return Math.max(...vendasPorProduto.map((p) => p.receita), 1)
  }, [vendasPorProduto])

  // DADOS DO FUNIL DE VENDAS
  // Estágios: Orçamento → Fechado → Pago → Entregue
  const funilVendas = useMemo(() => {
    const orcamentos = todosOsPedidos.filter((p) => p.status === 'Orçamento').length
    const fechados = todosOsPedidos.filter((p) => p.status === 'Fechado').length
    const pagos = todosOsPedidos.filter((p) => p.status === 'Pago').length
    const entregues = todosOsPedidos.filter((p) => p.status === 'Entregue').length

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
  }, [todosOsPedidos])

  // FLUXO DE CAIXA: ÚLTIMOS 6 MESES (Entradas vs Saídas de custos/despesas)
  const fluxoCaixa6Meses = useMemo(() => {
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
    const resultado: {
      chave: string
      label: string
      entradas: number
      saidas: number
      saldo: number
    }[] = []

    for (let i = 5; i >= 0; i--) {
      const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
      const ano = d.getFullYear()
      const mesNum = d.getMonth() + 1
      const mesStr = mesNum.toString().padStart(2, '0')
      const chave = `${ano}-${mesStr}`

      resultado.push({
        chave,
        label: `${mesesNomes[mesNum - 1]}/${ano}`,
        entradas: 0,
        saidas: 0,
        saldo: 0,
      })
    }

    // Entradas: Pedidos cuja data começa com o mês
    todosOsPedidos.forEach((ped) => {
      const chaveMes = ped.data.slice(0, 7)
      const mesItem = resultado.find((r) => r.chave === chaveMes)
      if (mesItem) {
        mesItem.entradas += ped.receita
      }
    })

    // Saídas: Lançamentos de custos dos produtos registrados naquele mês
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

    // Calcular saldos
    resultado.forEach((r) => {
      r.saldo = r.entradas - r.saidas
    })

    return resultado
  }, [todosOsPedidos, data.produtos, hoje])

  // FILTRAGEM DA TRILHA DE AUDITORIA
  const auditoriaFiltrada = useMemo(() => {
    if (auditModuloFiltro === 'todos') {
      return audit
    }
    return audit.filter((a) => a.modulo.toLowerCase() === auditModuloFiltro.toLowerCase())
  }, [audit, auditModuloFiltro])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabeçalho do Painel */}
      <div className="bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-soft-pink flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#FF1493] uppercase tracking-wider block mb-1">
            Módulo 5 • Inteligência de Negócio & Auditoria
          </span>
          <h2 className="text-2xl font-brand-serif font-bold text-[#4E342E]">
            Painel de Desempenho Bru Memórias
          </h2>
          <p className="text-xs text-[#4E342E]/70 mt-1">
            Visão consolidada de vendas, lucratividade, funil de pedidos e fluxo de caixa.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              exportarCsvPedidos(data)
              toast({ title: 'Relatório CSV de Pedidos baixado!' })
            }}
            className="px-3.5 py-2 text-xs font-semibold text-[#4E342E] bg-[#F5EFEA] hover:bg-[#4E342E] hover:text-white rounded-full transition-colors flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#FF1493]" />
            <span>Exportar Pedidos (CSV)</span>
          </button>
        </div>
      </div>

      {/* 4 CARDS DE KPIS (2x2 no mobile, 4 em linha no desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Vendas */}
        <div className="bg-gradient-to-br from-white to-[#FFF0F8] p-4 sm:p-5 rounded-2xl border border-[#FF1493]/30 shadow-soft-pink flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#4E342E]/70 uppercase">Total de Vendas</span>
            <div className="w-8 h-8 rounded-full bg-[#FFF0F8] text-[#FF1493] flex items-center justify-center font-bold">
              💰
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black font-brand-serif text-[#FF1493] tabular-nums">
              {formatarMoeda(totalVendasGeral)}
            </span>
            <span className="block text-[11px] text-[#4E342E]/70 mt-1">
              {totalPedidosGeral}{' '}
              {totalPedidosGeral === 1 ? 'pedido registrado' : 'pedidos registrados'}
            </span>
          </div>
        </div>

        {/* Lucro Total */}
        <div className="bg-gradient-to-br from-white to-emerald-50/50 p-4 sm:p-5 rounded-2xl border border-emerald-200 shadow-soft-pink flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#4E342E]/70 uppercase">
              Lucro Líquido Total
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              📈
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black font-brand-serif text-emerald-700 tabular-nums">
              {formatarMoeda(totalLucroGeral)}
            </span>
            <span className="block text-[11px] text-emerald-800/80 mt-1">
              Margem média:{' '}
              {totalVendasGeral > 0 ? ((totalLucroGeral / totalVendasGeral) * 100).toFixed(1) : '0'}
              %
            </span>
          </div>
        </div>

        {/* Ticket Médio */}
        <div className="bg-gradient-to-br from-white to-[#F5EFEA] p-4 sm:p-5 rounded-2xl border border-[#F0E4E0] shadow-soft-pink flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#4E342E]/70 uppercase">Ticket Médio</span>
            <div className="w-8 h-8 rounded-full bg-[#F5EFEA] text-[#4E342E] flex items-center justify-center font-bold">
              🎯
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black font-brand-serif text-[#4E342E] tabular-nums">
              {formatarMoeda(ticketMedioGeral)}
            </span>
            <span className="block text-[11px] text-[#4E342E]/70 mt-1">Por pedido da marca</span>
          </div>
        </div>

        {/* Clientes Ativos (90d) */}
        <div className="bg-gradient-to-br from-white to-[#FFF0F8] p-4 sm:p-5 rounded-2xl border border-[#FF1493]/30 shadow-soft-pink flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#4E342E]/70 uppercase">
              Clientes Ativas (90d)
            </span>
            <div className="w-8 h-8 rounded-full bg-[#FFF0F8] text-[#FF1493] flex items-center justify-center font-bold">
              💖
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black font-brand-serif text-[#4E342E] tabular-nums">
              {clientesAtivosCount}
            </span>
            <span className="block text-[11px] text-[#4E342E]/70 mt-1">
              De {data.clientes.length} cadastradas no total
            </span>
          </div>
        </div>
      </div>

      {/* GRÁFICO 1: VENDAS POR PERÍODO (CSS/SVG PURO) */}
      <div className="bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-soft-pink">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-[#4E342E] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#FF1493]" />
              Evolução das Vendas por Período
            </h3>
            <p className="text-xs text-[#4E342E]/70">
              Gráfico puro em SVG/CSS alimentado pelos pedidos reais
            </p>
          </div>

          {/* Seletor de Período (7 dias / 30 dias / 90 dias / Este ano) */}
          <div className="flex items-center gap-1 bg-[#F5EFEA] p-1 rounded-xl self-start sm:self-auto">
            {(['7d', '30d', '90d', 'ano'] as PeriodoVendas[]).map((p) => {
              const labels: Record<PeriodoVendas, string> = {
                '7d': '7 dias',
                '30d': '30 dias',
                '90d': '90 dias',
                ano: 'Este ano',
              }
              const isSelected = periodo === p
              return (
                <button
                  key={p}
                  onClick={() => setPeriodo(p)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    isSelected
                      ? 'bg-[#FF1493] text-white shadow-xs'
                      : 'text-[#4E342E]/80 hover:text-[#FF1493]'
                  }`}
                >
                  {labels[p]}
                </button>
              )
            })}
          </div>
        </div>

        {/* Gráfico de Barras Responsivo */}
        {dadosGraficoPeriodo.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            Nenhuma venda registrada no período selecionado.
          </div>
        ) : (
          <div className="h-56 w-full flex items-end gap-1 sm:gap-2 pt-6 pb-2 px-1 border-b border-[#F0E4E0]">
            {dadosGraficoPeriodo.map((item, idx) => {
              const pct = Math.max(4, Math.round((item.valor / maiorValorPeriodo) * 100))
              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center h-full justify-end group relative"
                >
                  {/* Tooltip ao passar o mouse */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-[#4E342E] text-white text-[10px] py-1 px-2 rounded-md pointer-events-none whitespace-nowrap z-10 shadow-md">
                    <strong>{formatarMoeda(item.valor)}</strong> em {item.label}
                  </div>

                  {/* Barra Colorida Rosa Choque para Roxo */}
                  <div
                    style={{ height: `${pct}%` }}
                    className={`w-full max-w-[28px] rounded-t-md transition-all duration-300 ${
                      item.valor > 0
                        ? 'bg-gradient-to-t from-[#B4006E] to-[#FF1493] hover:brightness-110 shadow-2xs'
                        : 'bg-gray-100'
                    }`}
                  />
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

      {/* GRIDS: PRODUTOS (Gráfico / Ranking) & FUNIL DE VENDAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Vendas por Produto & Ranking (7 Colunas) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-soft-pink space-y-4">
          <div className="flex items-center justify-between border-b border-[#F0E4E0] pb-2">
            <h3 className="text-base font-bold text-[#4E342E] flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Ranking de Vendas por Produto / Kit
            </h3>
            <span className="text-xs text-gray-400">Por volume e receita</span>
          </div>

          {/* Barras Horizontais com Cores Distintas */}
          <div className="space-y-3 pt-1">
            {rankingProdutos.map((prod, idx) => {
              const pct = Math.max(5, Math.round((prod.receita / maiorReceitaProduto) * 100))
              const cores = ['#FF1493', '#8E24AA', '#FB8C00', '#2E7D32', '#0097A7']
              const cor = cores[idx % cores.length]

              return (
                <div key={prod.nome} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-[#4E342E] flex items-center gap-1.5">
                      <span className="text-xs font-black" style={{ color: cor }}>
                        #{idx + 1}
                      </span>
                      <span>{prod.nome}</span>
                      <span className="text-[11px] text-gray-400 font-normal">
                        ({prod.quantidade} unidades)
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
            })}
          </div>
        </div>

        {/* Funil de Vendas de 4 Etapas (5 Colunas) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-soft-pink space-y-4">
          <div className="border-b border-[#F0E4E0] pb-2">
            <h3 className="text-base font-bold text-[#4E342E] flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#FF1493]" />
              Funil de Vendas (Conversão)
            </h3>
            <p className="text-[11px] text-[#4E342E]/70">
              Evolução dos orçamentos até a entrega final
            </p>
          </div>

          <div className="space-y-2.5 pt-1">
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

          <p className="text-[11px] text-gray-400 italic pt-2 border-t border-gray-100">
            Dica Bru: Acompanhe pedidos em "Orçamento" e envie fotos de amostra no WhatsApp para
            acelerar o fechamento! 💖
          </p>
        </div>
      </div>

      {/* FLUXO DE CAIXA DOS ÚLTIMOS 6 MESES */}
      <div className="bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-soft-pink">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-[#F0E4E0] pb-3">
          <div>
            <h3 className="text-base font-bold text-[#4E342E] flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Fluxo de Caixa Consolidado (Últimos 6 Meses)
            </h3>
            <p className="text-xs text-[#4E342E]/70">
              Comparativo entre entradas (pedidos) e saídas (compras de insumos e gastos extras)
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-[#F5EFEA]/80 text-[#4E342E] border-b border-[#F0E4E0]">
                <th className="p-3 font-bold">Mês/Ano</th>
                <th className="p-3 font-bold text-right text-emerald-800">Entradas (Vendas)</th>
                <th className="p-3 font-bold text-right text-red-700">Saídas (Custos/Extras)</th>
                <th className="p-3 font-bold text-right">Saldo do Mês</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0E4E0]">
              {fluxoCaixa6Meses.map((linha) => {
                const isPositivo = linha.saldo >= 0
                return (
                  <tr key={linha.chave} className="hover:bg-[#FFF0F8]/30 transition-colors">
                    <td className="p-3 font-semibold text-[#4E342E]">{linha.label}</td>
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
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* TRILHA DE AUDITORIA (LOG IMUTÁVEL APPEND-ONLY) */}
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
