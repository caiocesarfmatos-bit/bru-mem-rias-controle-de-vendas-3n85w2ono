// src/components/sistema/PainelMetricas.tsx
// Dashboard de Métricas Gerenciais — Bru Memórias Personalizados
// Regras: Valores monetários em centavos (R$ pt-BR), sem números decorativos,
// período selecionável, respeito à matriz de perfis e exportação CSV auditada.

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  BarChart3,
  Calendar,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Receipt,
  Package,
  AlertTriangle,
  Users,
  Wallet,
  Clock,
  RefreshCw,
  CreditCard,
  CheckCircle,
  FileSpreadsheet,
  ArrowRight,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { BrandEmblem } from '@/design/BrandEmblem'
import { BRAND_TOKENS } from '@/design/tokens'
import { useAuth } from '@/context/AuthContext'
import { PeriodoRelatorioTipo, paraYmd } from '@/lib/relatoriosUtils'
import { formatarCentavosParaReal, formatarNumero } from '@/lib/formatters'
import {
  obterMetricasGerenciais,
  gerarCsvResumoDashboard,
  MetricasGerenciaisResultado,
} from '@/services/dashboardMetricas'
import pb from '@/lib/pocketbase/client'

const OPCOES_PERIODO_DASHBOARD: Array<{ valor: PeriodoRelatorioTipo; rotulo: string }> = [
  { valor: 'hoje', rotulo: 'Hoje' },
  { valor: '7d', rotulo: 'Últimos 7 dias' },
  { valor: 'mes_atual', rotulo: 'Mês atual' },
  { valor: 'mes_anterior', rotulo: 'Mês anterior' },
  { valor: 'ano_atual', rotulo: 'Ano atual' },
  { valor: 'personalizado', rotulo: 'Personalizado' },
]

export const PainelMetricas: React.FC = () => {
  const { usuario, temPermissao } = useAuth()
  const perfil = usuario?.perfil || 'consulta'

  // Permissões
  const podeExportar = temPermissao('relatorios.exportar')
  const isVendedor = perfil === 'vendedor'
  const isGestorOuAdmin = perfil === 'administrador' || perfil === 'gestor'

  // Estados do seletor de período
  const [tipoPeriodo, setTipoPeriodo] = useState<PeriodoRelatorioTipo>('mes_atual')
  const [dataInicioCustom, setDataInicioCustom] = useState<string>(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  })
  const [dataFimCustom, setDataFimCustom] = useState<string>(() => paraYmd(new Date()))

  // Estados de dados
  const [metricas, setMetricas] = useState<MetricasGerenciaisResultado | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [erro, setErro] = useState<string | null>(null)
  const [exportandoCsv, setExportandoCsv] = useState<boolean>(false)

  // Carregar métricas
  const carregarMetricas = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const res = await obterMetricasGerenciais({
        tipoPeriodo,
        customInicio: dataInicioCustom,
        customFim: dataFimCustom,
        usuarioAtualId: usuario?.id,
        perfilUsuario: perfil,
      })
      setMetricas(res)
    } catch (err: any) {
      console.error('Falha ao carregar métricas:', err)
      setErro(err?.message || 'Erro ao carregar dados do dashboard.')
    } finally {
      setLoading(false)
    }
  }, [tipoPeriodo, dataInicioCustom, dataFimCustom, usuario?.id, perfil])

  useEffect(() => {
    carregarMetricas()
  }, [carregarMetricas])

  // Exportar CSV do período
  const handleExportarCsv = async () => {
    if (!metricas) return
    setExportandoCsv(true)
    try {
      const csvConteudo = gerarCsvResumoDashboard(metricas)
      const blob = new Blob([csvConteudo], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      link.href = url
      link.setAttribute(
        'download',
        `bru_memorias_metricas_${metricas.periodo.inicio}_a_${metricas.periodo.fim}_${timestamp}.csv`,
      )
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      // Trilha de auditoria no servidor
      try {
        await pb.collection('logs_auditoria').create({
          entidade: 'DASHBOARD_METRICAS',
          identificador_registro: `${metricas.periodo.inicio}_${metricas.periodo.fim}`,
          campo: 'EXPORTACAO_CSV',
          valor_novo: JSON.stringify({
            evento: 'EXPORTACAO_CSV_DASHBOARD',
            periodo: metricas.periodo.label,
            inicio: metricas.periodo.inicio,
            fim: metricas.periodo.fim,
            faturamentoCentavos: metricas.vendas.faturamentoPeriodoCentavos,
            pedidos: metricas.vendas.numeroPedidos,
            usuarioId: usuario?.id,
            perfil: usuario?.perfil,
          }),
          usuario: usuario?.id || 'sistema',
          data_hora: new Date().toISOString(),
          origem: 'dashboard_metricas_csv',
        })
      } catch (auditErr) {
        console.warn('Falha silenciosa ao registrar auditoria de exportação CSV:', auditErr)
      }
    } catch (err: any) {
      alert(`Falha ao exportar CSV: ${err.message || 'Erro desconhecido'}`)
    } finally {
      setExportandoCsv(false)
    }
  }

  // Encontrar valor máximo para dimensionar barras visuais
  const maxVendaDiariaCentavos = useMemo(() => {
    if (!metricas?.vendas.serieDiaria.length) return 1
    const max = Math.max(...metricas.vendas.serieDiaria.map((d) => d.totalCentavos))
    return max > 0 ? max : 1
  }, [metricas])

  const maxFormaPagamentoCentavos = useMemo(() => {
    if (!metricas?.comercial.pedidosPorFormaPagamento.length) return 1
    const max = Math.max(...metricas.comercial.pedidosPorFormaPagamento.map((f) => f.totalCentavos))
    return max > 0 ? max : 1
  }, [metricas])

  return (
    <div className="space-y-6">
      {/* Cabeçalho Oficial com Emblema da Marca */}
      <div className="bg-[#FFF8F4] border border-[#EEDFD7] rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <BrandEmblem variant="main" size={56} withPadding={false} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-semibold text-[#D49B42]">
                  {BRAND_TOKENS.name} • {BRAND_TOKENS.tagline}
                </span>
                <Badge
                  variant="outline"
                  className="border-[#E63980] text-[#E63980] bg-[#FCE7F0]/40 text-xs font-medium"
                >
                  {isVendedor ? 'Visão do Vendedor' : 'Visão Gerencial'}
                </Badge>
              </div>
              <h1 className="text-2xl font-serif font-bold text-[#3D150B] flex items-center gap-2 mt-0.5">
                <BarChart3 className="w-6 h-6 text-[#E63980]" />
                Dashboard de Métricas
              </h1>
              <p className="text-sm text-[#3D150B]/75 mt-0.5">
                {isVendedor
                  ? 'Acompanhamento do seu desempenho de vendas e orçamentos em tempo real.'
                  : 'Visão consolidada de vendas, faturamento, recebimentos, estoque e conversão comercial.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={carregarMetricas}
              disabled={loading}
              className="border-[#EEDFD7] text-[#3D150B] hover:bg-white"
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>

            {podeExportar && (
              <Button
                size="sm"
                onClick={handleExportarCsv}
                disabled={loading || !metricas || exportandoCsv}
                className="bg-[#3D150B] hover:bg-[#240B05] text-white"
              >
                <Download className="w-4 h-4 mr-1.5" />
                {exportandoCsv ? 'Gerando CSV...' : 'Exportar CSV do Período'}
              </Button>
            )}
          </div>
        </div>

        {/* Barra de Filtro de Período de Competência */}
        <div className="mt-5 pt-4 border-t border-[#EEDFD7]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-[#3D150B]/80 flex items-center gap-1 mr-1">
              <Calendar className="w-3.5 h-3.5 text-[#E63980]" />
              Período:
            </span>
            {OPCOES_PERIODO_DASHBOARD.map((op) => (
              <button
                key={op.valor}
                type="button"
                onClick={() => setTipoPeriodo(op.valor)}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                  tipoPeriodo === op.valor
                    ? 'bg-[#E63980] text-white shadow-xs'
                    : 'bg-white text-[#3D150B] border border-[#EEDFD7] hover:bg-[#FFF8F4]'
                }`}
              >
                {op.rotulo}
              </button>
            ))}
          </div>

          {tipoPeriodo === 'personalizado' && (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-[#EEDFD7]">
              <div className="flex items-center gap-1">
                <Label className="text-xs text-[#3D150B]/70">De:</Label>
                <Input
                  type="date"
                  value={dataInicioCustom}
                  onChange={(e) => setDataInicioCustom(e.target.value)}
                  className="h-7 text-xs w-32 border-[#EEDFD7]"
                />
              </div>
              <div className="flex items-center gap-1">
                <Label className="text-xs text-[#3D150B]/70">Até:</Label>
                <Input
                  type="date"
                  value={dataFimCustom}
                  onChange={(e) => setDataFimCustom(e.target.value)}
                  className="h-7 text-xs w-32 border-[#EEDFD7]"
                />
              </div>
            </div>
          )}

          {metricas && (
            <span className="text-xs text-[#3D150B]/70 font-mono">
              Competência: {metricas.periodo.inicio} até {metricas.periodo.fim}
            </span>
          )}
        </div>
      </div>

      {/* Alerta de erro */}
      {erro && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {/* Skeleton / Loading */}
      {loading && !metricas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 bg-[#FFF8F4] border border-[#EEDFD7] rounded-xl animate-pulse"
            />
          ))}
        </div>
      )}

      {/* CONTEÚDO DO DASHBOARD */}
      {metricas && (
        <>
          {/* 1. CARTÕES PRINCIPAIS DE VENDAS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Faturamento */}
            <Card className="border-[#EEDFD7] bg-white shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-semibold text-[#3D150B]/60 tracking-wider">
                    Faturamento no Período
                  </span>
                  <div className="w-8 h-8 rounded-full bg-[#FCE7F0] flex items-center justify-center text-[#E63980]">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-[#3D150B]">
                    {formatarCentavosParaReal(metricas.vendas.faturamentoPeriodoCentavos)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-[#3D150B]/70 pt-2 border-t border-[#F0E4E0]">
                  <span>
                    Anterior:{' '}
                    {formatarCentavosParaReal(metricas.vendas.faturamentoAnteriorCentavos)}
                  </span>
                  {metricas.vendas.variacaoFaturamentoPct !== null ? (
                    <span
                      className={`inline-flex items-center gap-0.5 font-semibold ${
                        metricas.vendas.variacaoFaturamentoPct >= 0
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {metricas.vendas.variacaoFaturamentoPct >= 0 ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5" />
                      )}
                      {metricas.vendas.variacaoFaturamentoPct >= 0 ? '+' : ''}
                      {formatarNumero(metricas.vendas.variacaoFaturamentoPct)}%
                    </span>
                  ) : (
                    <span className="text-[#3D150B]/50 font-mono">Sem base</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pedidos Confirmados */}
            <Card className="border-[#EEDFD7] bg-white shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-semibold text-[#3D150B]/60 tracking-wider">
                    Pedidos Confirmados
                  </span>
                  <div className="w-8 h-8 rounded-full bg-[#FFF8F4] border border-[#EEDFD7] flex items-center justify-center text-[#3D150B]">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-[#3D150B]">
                    {metricas.vendas.numeroPedidos}
                  </span>
                  <span className="text-xs text-[#3D150B]/60">pedidos</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-[#3D150B]/70 pt-2 border-t border-[#F0E4E0]">
                  <span>Anterior: {metricas.vendas.numeroPedidosAnterior}</span>
                  {metricas.vendas.variacaoPedidosPct !== null ? (
                    <span
                      className={`inline-flex items-center gap-0.5 font-semibold ${
                        metricas.vendas.variacaoPedidosPct >= 0
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {metricas.vendas.variacaoPedidosPct >= 0 ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5" />
                      )}
                      {metricas.vendas.variacaoPedidosPct >= 0 ? '+' : ''}
                      {formatarNumero(metricas.vendas.variacaoPedidosPct)}%
                    </span>
                  ) : (
                    <span className="text-[#3D150B]/50 font-mono">Sem base</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Ticket Médio */}
            <Card className="border-[#EEDFD7] bg-white shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-semibold text-[#3D150B]/60 tracking-wider">
                    Ticket Médio
                  </span>
                  <div className="w-8 h-8 rounded-full bg-[#FDF6E8] flex items-center justify-center text-[#D49B42]">
                    <Receipt className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-[#3D150B]">
                    {formatarCentavosParaReal(metricas.vendas.ticketMedioCentavos)}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-[#3D150B]/70 pt-2 border-t border-[#F0E4E0]">
                  <span>
                    Anterior:{' '}
                    {formatarCentavosParaReal(metricas.vendas.ticketMedioAnteriorCentavos)}
                  </span>
                  {metricas.vendas.variacaoTicketPct !== null ? (
                    <span
                      className={`inline-flex items-center gap-0.5 font-semibold ${
                        metricas.vendas.variacaoTicketPct >= 0
                          ? 'text-emerald-600'
                          : 'text-rose-600'
                      }`}
                    >
                      {metricas.vendas.variacaoTicketPct >= 0 ? (
                        <TrendingUp className="w-3.5 h-3.5" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5" />
                      )}
                      {metricas.vendas.variacaoTicketPct >= 0 ? '+' : ''}
                      {formatarNumero(metricas.vendas.variacaoTicketPct)}%
                    </span>
                  ) : (
                    <span className="text-[#3D150B]/50 font-mono">Sem base</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Conversão Comercial */}
            <Card className="border-[#EEDFD7] bg-white shadow-xs">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-semibold text-[#3D150B]/60 tracking-wider">
                    Taxa de Conversão
                  </span>
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-[#3D150B]">
                    {metricas.comercial.taxaConversaoOrcamentosPct !== null
                      ? `${formatarNumero(metricas.comercial.taxaConversaoOrcamentosPct)}%`
                      : 'N/A'}
                  </span>
                  <span className="text-xs text-[#3D150B]/60">orçamentos</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-[#3D150B]/70 pt-2 border-t border-[#F0E4E0]">
                  <span>Emitidos: {metricas.comercial.orcamentosEmitidosPeriodo}</span>
                  <span className="font-semibold text-emerald-700">
                    Aprovados: {metricas.comercial.orcamentosAprovadosPeriodo}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 2. GRÁFICO DIÁRIO DE VENDAS & FORMAS DE PAGAMENTO */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gráfico de Barras: Vendas Diárias no Período */}
            <Card className="border-[#EEDFD7] bg-white lg:col-span-2 shadow-xs">
              <CardHeader className="pb-3 border-b border-[#F0E4E0]">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-serif font-bold text-[#3D150B] flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#E63980]" />
                    Faturamento Diário no Período
                  </CardTitle>
                  <span className="text-xs text-[#3D150B]/60 font-mono">
                    Total: {formatarCentavosParaReal(metricas.vendas.faturamentoPeriodoCentavos)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {metricas.vendas.serieDiaria.length === 0 ||
                metricas.vendas.faturamentoPeriodoCentavos === 0 ? (
                  <div className="py-12 text-center text-[#3D150B]/60 text-sm">
                    Sem vendas confirmadas no período selecionado.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="h-44 flex items-end gap-1 sm:gap-2 pt-6 px-1 overflow-x-auto">
                      {metricas.vendas.serieDiaria.map((dia) => {
                        const alturaPct =
                          dia.totalCentavos > 0
                            ? Math.max(
                                12,
                                Math.round((dia.totalCentavos / maxVendaDiariaCentavos) * 100),
                              )
                            : 4
                        return (
                          <div
                            key={dia.data}
                            className="flex-1 min-w-[28px] max-w-[48px] flex flex-col items-center group relative h-full justify-end"
                          >
                            {/* Tooltip simples */}
                            <div className="absolute -top-10 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                              <div className="bg-[#3D150B] text-white text-[10px] py-1 px-2 rounded shadow-md whitespace-nowrap font-mono">
                                {dia.dataLabel}: {formatarCentavosParaReal(dia.totalCentavos)} (
                                {dia.quantidadePedidos} ped.)
                              </div>
                            </div>
                            <div
                              style={{ height: `${alturaPct}%` }}
                              className={`w-full rounded-t-sm transition-all duration-300 ${
                                dia.totalCentavos > 0
                                  ? 'bg-[#E63980] hover:bg-[#D1256E]'
                                  : 'bg-gray-100'
                              }`}
                            />
                            <span className="text-[10px] text-[#3D150B]/60 mt-1 font-mono">
                              {dia.dataLabel}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                    <p className="text-[11px] text-[#3D150B]/50 text-right">
                      Barras dimensionadas pelo faturamento real diário em centavos.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Distribuição por Forma de Pagamento */}
            <Card className="border-[#EEDFD7] bg-white shadow-xs">
              <CardHeader className="pb-3 border-b border-[#F0E4E0]">
                <CardTitle className="text-base font-serif font-bold text-[#3D150B] flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#D49B42]" />
                  Formas de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                {metricas.comercial.pedidosPorFormaPagamento.length === 0 ? (
                  <div className="py-8 text-center text-[#3D150B]/60 text-sm">
                    Nenhum pagamento registrado no período.
                  </div>
                ) : (
                  metricas.comercial.pedidosPorFormaPagamento.map((f) => {
                    const larguraPct =
                      f.totalCentavos > 0
                        ? Math.max(
                            8,
                            Math.round((f.totalCentavos / maxFormaPagamentoCentavos) * 100),
                          )
                        : 0
                    return (
                      <div key={f.codigo} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-[#3D150B]">{f.rotulo}</span>
                          <span className="font-mono text-[#3D150B]/80">
                            {formatarCentavosParaReal(f.totalCentavos)} (
                            {formatarNumero(f.percentual)}%)
                          </span>
                        </div>
                        <div className="h-2 w-full bg-[#FFF8F4] rounded-full overflow-hidden border border-[#EEDFD7]">
                          <div
                            style={{ width: `${larguraPct}%` }}
                            className="h-full bg-[#D49B42] rounded-full"
                          />
                        </div>
                        <div className="text-[10px] text-[#3D150B]/50">
                          {f.quantidade} {f.quantidade === 1 ? 'transação' : 'transações'}
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* 3. RANKINGS DE PRODUTOS MAIS VENDIDOS & STATUS DE PEDIDOS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Ranking por Faturamento */}
            <Card className="border-[#EEDFD7] bg-white shadow-xs">
              <CardHeader className="pb-3 border-b border-[#F0E4E0]">
                <CardTitle className="text-base font-serif font-bold text-[#3D150B] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#E63980]" />
                  Top Produtos por Faturamento
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                {metricas.vendas.rankingMaisVendidosValor.length === 0 ? (
                  <div className="py-8 text-center text-[#3D150B]/60 text-sm">
                    Sem vendas de produtos no período.
                  </div>
                ) : (
                  <div className="divide-y divide-[#F0E4E0]">
                    {metricas.vendas.rankingMaisVendidosValor.slice(0, 5).map((p) => (
                      <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold text-[#3D150B] truncate">{p.nome}</p>
                          <p className="text-[11px] text-[#3D150B]/60 font-mono">
                            SKU: {p.sku} • {p.quantidade} un.
                          </p>
                        </div>
                        <span className="font-bold font-mono text-[#3D150B] whitespace-nowrap">
                          {formatarCentavosParaReal(p.valorTotalCentavos)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ranking por Quantidade */}
            <Card className="border-[#EEDFD7] bg-white shadow-xs">
              <CardHeader className="pb-3 border-b border-[#F0E4E0]">
                <CardTitle className="text-base font-serif font-bold text-[#3D150B] flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#D49B42]" />
                  Top Produtos por Quantidade
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                {metricas.vendas.rankingMaisVendidosQtd.length === 0 ? (
                  <div className="py-8 text-center text-[#3D150B]/60 text-sm">
                    Sem produtos vendidos no período.
                  </div>
                ) : (
                  <div className="divide-y divide-[#F0E4E0]">
                    {metricas.vendas.rankingMaisVendidosQtd.slice(0, 5).map((p) => (
                      <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold text-[#3D150B] truncate">{p.nome}</p>
                          <p className="text-[11px] text-[#3D150B]/60 font-mono">
                            {formatarCentavosParaReal(p.valorTotalCentavos)}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className="bg-[#FFF8F4] border border-[#EEDFD7] text-[#3D150B] font-mono"
                        >
                          {p.quantidade} un.
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pedidos por Status no Período */}
            <Card className="border-[#EEDFD7] bg-white shadow-xs">
              <CardHeader className="pb-3 border-b border-[#F0E4E0]">
                <CardTitle className="text-base font-serif font-bold text-[#3D150B] flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-[#3D150B]" />
                  Distribuição por Status
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="divide-y divide-[#F0E4E0]">
                  {metricas.vendas.pedidosPorStatus.map((s) => (
                    <div key={s.status} className="py-2 flex items-center justify-between text-xs">
                      <span className="font-medium text-[#3D150B]">{s.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[#3D150B]/70 font-semibold">
                          {s.quantidade} {s.quantidade === 1 ? 'pedido' : 'pedidos'}
                        </span>
                        <span className="font-mono text-[#3D150B]/90 text-[11px]">
                          ({formatarCentavosParaReal(s.totalCentavos)})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 4. MÉTRICAS FINANCEIRAS (Administrador e Gestor) */}
          {isGestorOuAdmin && metricas.financeiro && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#EEDFD7] pb-2">
                <h3 className="text-lg font-serif font-bold text-[#3D150B] flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-[#D49B42]" />
                  Métricas Financeiras & Fluxo de Caixa
                </h3>
                <span className="text-xs text-[#3D150B]/60">Competência e liquidação contábil</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Recebimentos Realizados */}
                <Card className="border-[#EEDFD7] bg-white">
                  <CardContent className="p-4">
                    <span className="text-xs uppercase font-semibold text-[#3D150B]/60">
                      Recebimentos Realizados
                    </span>
                    <p className="text-xl font-bold font-mono text-emerald-700 mt-1">
                      {formatarCentavosParaReal(metricas.financeiro.recebimentosRealizadosCentavos)}
                    </p>
                    <p className="text-[11px] text-[#3D150B]/60 mt-1">
                      Liquidados na conta no período
                    </p>
                  </CardContent>
                </Card>

                {/* Recebimentos Previstos */}
                <Card className="border-[#EEDFD7] bg-white">
                  <CardContent className="p-4">
                    <span className="text-xs uppercase font-semibold text-[#3D150B]/60">
                      Recebimentos Projetados
                    </span>
                    <p className="text-xl font-bold font-mono text-[#D49B42] mt-1">
                      {formatarCentavosParaReal(metricas.financeiro.recebimentosPrevistosCentavos)}
                    </p>
                    <p className="text-[11px] text-[#3D150B]/60 mt-1">
                      Previsão de entrada no período
                    </p>
                  </CardContent>
                </Card>

                {/* Contas a Receber Vencidas */}
                <Card className="border-[#EEDFD7] bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase font-semibold text-[#3D150B]/60">
                        A Receber Vencidas
                      </span>
                      {metricas.financeiro.quantidadeReceberVencidas > 0 && (
                        <Badge variant="destructive" className="text-[10px] h-5">
                          {metricas.financeiro.quantidadeReceberVencidas} títulos
                        </Badge>
                      )}
                    </div>
                    <p className="text-xl font-bold font-mono text-rose-700 mt-1">
                      {formatarCentavosParaReal(metricas.financeiro.contasReceberVencidasCentavos)}
                    </p>
                    <p className="text-[11px] text-[#3D150B]/60 mt-1">
                      Abertas com vencimento ultrapassado
                    </p>
                  </CardContent>
                </Card>

                {/* Contas a Pagar em Aberto */}
                <Card className="border-[#EEDFD7] bg-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase font-semibold text-[#3D150B]/60">
                        Contas a Pagar em Aberto
                      </span>
                      {metricas.financeiro.quantidadePagarVencidas > 0 && (
                        <Badge variant="destructive" className="text-[10px] h-5">
                          {metricas.financeiro.quantidadePagarVencidas} vencidas
                        </Badge>
                      )}
                    </div>
                    <p className="text-xl font-bold font-mono text-[#3D150B] mt-1">
                      {formatarCentavosParaReal(metricas.financeiro.contasPagarAbertasCentavos)}
                    </p>
                    <p className="text-[11px] text-[#3D150B]/60 mt-1">
                      Obrigações operacionais pendentes
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Saldo de Caixa por Conta & Despesas por Categoria */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Saldo de Caixa por Conta Financeira */}
                <Card className="border-[#EEDFD7] bg-white">
                  <CardHeader className="pb-3 border-b border-[#F0E4E0]">
                    <CardTitle className="text-base font-serif font-bold text-[#3D150B] flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-[#D49B42]" />
                      Saldo Atual por Conta Financeira
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3">
                    <div className="divide-y divide-[#F0E4E0]">
                      {metricas.financeiro.saldosPorConta.map((conta) => (
                        <div
                          key={conta.contaId}
                          className="py-2.5 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-semibold text-[#3D150B]">{conta.nome}</span>
                            <span className="ml-2 text-[11px] text-[#3D150B]/60">
                              {conta.tipo === 'caixa_fisico' ? 'Caixa Físico' : 'Banco'}
                            </span>
                          </div>
                          <span
                            className={`font-mono font-bold ${
                              conta.saldoCentavos >= 0 ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {formatarCentavosParaReal(conta.saldoCentavos)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Despesas por Categoria no Período */}
                <Card className="border-[#EEDFD7] bg-white">
                  <CardHeader className="pb-3 border-b border-[#F0E4E0]">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-serif font-bold text-[#3D150B] flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-rose-600" />
                        Despesas por Categoria no Período
                      </CardTitle>
                      <span className="text-xs text-[#3D150B]/70 font-mono">
                        Total:{' '}
                        {formatarCentavosParaReal(metricas.financeiro.totalDespesasPeriodoCentavos)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-3">
                    {metricas.financeiro.despesasPorCategoria.length === 0 ? (
                      <div className="py-8 text-center text-[#3D150B]/60 text-sm">
                        Sem despesas liquidadas no período selecionado.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {metricas.financeiro.despesasPorCategoria.map((cat) => (
                          <div key={cat.categoriaId} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-[#3D150B]">
                                {cat.categoriaNome}
                              </span>
                              <span className="font-mono text-[#3D150B]/80">
                                {formatarCentavosParaReal(cat.totalCentavos)} (
                                {formatarNumero(cat.percentual)}%)
                              </span>
                            </div>
                            <div className="h-2 w-full bg-[#FFF8F4] rounded-full overflow-hidden border border-[#EEDFD7]">
                              <div
                                style={{ width: `${cat.percentual}%` }}
                                className="h-full bg-rose-500 rounded-full"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* 5. MÉTRICAS DE PRODUÇÃO / ESTOQUE & CLIENTES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Estoque e Produção */}
            <Card className="border-[#EEDFD7] bg-white shadow-xs">
              <CardHeader className="pb-3 border-b border-[#F0E4E0]">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-serif font-bold text-[#3D150B] flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#D49B42]" />
                    Estoque & Produção
                  </CardTitle>
                  <span className="text-xs text-[#3D150B]/70 font-mono">
                    Valor a Custo:{' '}
                    {formatarCentavosParaReal(metricas.estoque.valorTotalEstoqueCustoCentavos)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-3 space-y-4">
                {/* Alertas de Estoque Mínimo */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-[#3D150B] mb-2">
                    <span className="flex items-center gap-1.5 text-amber-700">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Produtos Abaixo do Estoque Mínimo
                    </span>
                    <Badge
                      variant="outline"
                      className="border-amber-300 bg-amber-50 text-amber-800 text-[11px]"
                    >
                      {metricas.estoque.produtosAbaixoMinimo.length} alerta(s)
                    </Badge>
                  </div>
                  {metricas.estoque.produtosAbaixoMinimo.length === 0 ? (
                    <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded text-xs border border-emerald-200">
                      Nenhum produto com saldo inferior ao estoque mínimo.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {metricas.estoque.produtosAbaixoMinimo.map((p) => (
                        <div
                          key={p.id}
                          className="p-2 bg-amber-50/70 border border-amber-200/60 rounded flex items-center justify-between text-xs"
                        >
                          <span className="font-medium text-[#3D150B] truncate">{p.nome}</span>
                          <span className="font-mono text-rose-700 whitespace-nowrap ml-2">
                            Saldo: {p.saldo} / Mín: {p.estoqueMinimo}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Itens Sem Movimentação */}
                <div className="pt-2 border-t border-[#F0E4E0]">
                  <div className="flex items-center justify-between text-xs text-[#3D150B]/80 mb-2">
                    <span className="font-medium flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#3D150B]/50" />
                      Itens sem Movimentação no Período
                    </span>
                    <span className="font-mono font-semibold">
                      {metricas.estoque.itensSemMovimentoNoPeriodo.length} itens
                    </span>
                  </div>
                  {metricas.estoque.itensSemMovimentoNoPeriodo.length > 0 && (
                    <div className="text-[11px] text-[#3D150B]/60 truncate">
                      Exemplo:{' '}
                      {metricas.estoque.itensSemMovimentoNoPeriodo
                        .slice(0, 3)
                        .map((i) => i.nome)
                        .join(', ')}
                      {metricas.estoque.itensSemMovimentoNoPeriodo.length > 3 ? '...' : ''}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Comercial & Clientes */}
            <Card className="border-[#EEDFD7] bg-white shadow-xs">
              <CardHeader className="pb-3 border-b border-[#F0E4E0]">
                <CardTitle className="text-base font-serif font-bold text-[#3D150B] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#E63980]" />
                  Métricas Comerciais & Clientes
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#FFF8F4] border border-[#EEDFD7] rounded-lg">
                    <span className="text-[11px] uppercase font-semibold text-[#3D150B]/60">
                      Clientes Ativos no Período
                    </span>
                    <p className="text-xl font-bold font-mono text-[#3D150B] mt-1">
                      {metricas.comercial.clientesAtivosNoPeriodo}
                    </p>
                    <p className="text-[10px] text-[#3D150B]/60">Com compras faturadas</p>
                  </div>

                  <div className="p-3 bg-[#FFF8F4] border border-[#EEDFD7] rounded-lg">
                    <span className="text-[11px] uppercase font-semibold text-[#3D150B]/60">
                      Novos Clientes Cadastrados
                    </span>
                    <p className="text-xl font-bold font-mono text-[#E63980] mt-1">
                      {metricas.comercial.novosClientesNoPeriodo}
                    </p>
                    <p className="text-[10px] text-[#3D150B]/60">Cadastros no período</p>
                  </div>
                </div>

                <div className="divide-y divide-[#F0E4E0] pt-1">
                  <div className="py-2 flex items-center justify-between text-xs">
                    <span className="text-[#3D150B]">Orçamentos em Aberto (Rascunhos):</span>
                    <span className="font-mono font-bold text-[#3D150B]">
                      {metricas.comercial.orcamentosAbertos}
                    </span>
                  </div>
                  <div className="py-2 flex items-center justify-between text-xs">
                    <span className="text-[#3D150B]">Orçamentos Vencidos sem Resposta:</span>
                    <span
                      className={`font-mono font-bold ${metricas.comercial.orcamentosVencidosNaoRespondidos > 0 ? 'text-amber-700' : 'text-[#3D150B]'}`}
                    >
                      {metricas.comercial.orcamentosVencidosNaoRespondidos}
                    </span>
                  </div>
                  <div className="py-2 flex items-center justify-between text-xs">
                    <span className="text-[#3D150B]">Taxa de Conversão Aprovados / Emitidos:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {metricas.comercial.taxaConversaoOrcamentosPct !== null
                        ? `${formatarNumero(metricas.comercial.taxaConversaoOrcamentosPct)}%`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
export default PainelMetricas
