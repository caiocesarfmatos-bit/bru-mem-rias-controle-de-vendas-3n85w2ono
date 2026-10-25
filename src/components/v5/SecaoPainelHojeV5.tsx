import React, { useState } from 'react'
import { useAppV5 } from '@/context/AppV5Context'
import {
  Calendar,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  Package,
  CheckCircle2,
  Users,
  Coins,
  ChevronRight,
} from 'lucide-react'
import { formatarMoeda, formatarDataPtBR } from '@/lib/formatters'

export const SecaoPainelHojeV5: React.FC = () => {
  const { data, navegarPara, concluirPassoPrimeiroUso, passoAbertoPrimeiroUso } = useAppV5()

  // 1. Decisão do dia: pedidos que vencem hoje ou estão atrasados
  const hojeStr = new Date().toISOString().split('T')[0]
  const pedidosUrgentes = data.pedidos.filter((p) => {
    if (p.status === 'Entregue' || p.status === 'Cancelado' || p.status === 'Perdido') return false
    return p.prazoPrometido <= hojeStr
  })

  // 2. Orçamentos que vencem hoje ou já venceram sem aprovação
  const orcamentosVencidosOuPrestes = data.orcamentos.filter((o) => {
    return o.status !== 'Aprovado' && o.status !== 'Perdido' && o.validade <= hojeStr
  })

  // 3. Indicadores do Dia
  const totalPedidosAtivos = data.pedidos.filter(
    (p) => p.status !== 'Entregue' && p.status !== 'Cancelado' && p.status !== 'Perdido',
  ).length
  const totalImasEmProducao = data.pedidos
    .filter((p) => p.status === 'Pedido em andamento')
    .reduce((acc, p) => acc + p.quantidadeTotal, 0)
  const totalReceitaMesAtual = data.pedidos
    .filter((p) => p.status !== 'Cancelado' && p.status !== 'Perdido')
    .reduce((acc, p) => acc + p.totalGeral, 0)

  // Onboarding guiado de 1ª configuração (Custos -> Produtos -> Clientes -> Orçamento)
  const [etapaOnboarding, setEtapaOnboarding] = useState<number>(() => {
    if (data.orcamentos.length > 1) return 5 // Já passou
    return 1
  })

  return (
    <div className="space-y-6">
      {/* Ordem Obrigatória de 1ª Configuração (Seção 4 do spec) */}
      {etapaOnboarding <= 4 && (
        <div className="bg-[#FFF0F8] rounded-3xl p-5 sm:p-6 border border-[#FF1493]/30 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#FF1493] uppercase tracking-wider">
              Passo a Passo de Primeira Configuração Obrigatória
            </span>
            <button
              onClick={() => setEtapaOnboarding(5)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Dispensar
            </button>
          </div>

          <p className="text-xs text-[#4E342E] leading-relaxed">
            O custo precisa existir antes do preço, porque o preço é calculado a partir dele:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
            <div
              onClick={() => navegarPara('dinheiro', 'custos')}
              className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                etapaOnboarding === 1
                  ? 'bg-white border-[#FF1493] font-bold text-[#FF1493] shadow-xs'
                  : 'bg-white/70 border-gray-200 text-[#4E342E]'
              }`}
            >
              <span className="block text-[10px] text-gray-500">1º Passo</span>
              <span>1. Custos</span>
            </div>

            <div
              onClick={() => navegarPara('dinheiro', 'produtos-precos')}
              className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                etapaOnboarding === 2
                  ? 'bg-white border-[#FF1493] font-bold text-[#FF1493] shadow-xs'
                  : 'bg-white/70 border-gray-200 text-[#4E342E]'
              }`}
            >
              <span className="block text-[10px] text-gray-500">2º Passo</span>
              <span>2. Produtos & Preços</span>
            </div>

            <div
              onClick={() => navegarPara('vender', 'clientes')}
              className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                etapaOnboarding === 3
                  ? 'bg-white border-[#FF1493] font-bold text-[#FF1493] shadow-xs'
                  : 'bg-white/70 border-gray-200 text-[#4E342E]'
              }`}
            >
              <span className="block text-[10px] text-gray-500">3º Passo</span>
              <span>3. Clientes</span>
            </div>

            <div
              onClick={() => navegarPara('vender', 'orcamentos')}
              className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                etapaOnboarding === 4
                  ? 'bg-white border-[#FF1493] font-bold text-[#FF1493] shadow-xs'
                  : 'bg-white/70 border-gray-200 text-[#4E342E]'
              }`}
            >
              <span className="block text-[10px] text-gray-500">4º Passo</span>
              <span>4. Primeiro Orçamento</span>
            </div>
          </div>
        </div>
      )}

      {/* BLOCO DECISÃO DO DIA: O que exige ação imediata */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#F0E4E0] shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#FF1493]" />
            <h2 className="text-base font-bold font-brand-serif text-[#4E342E]">
              Decisões Prioritárias de Hoje
            </h2>
          </div>
          <span className="text-xs text-gray-500">{formatarDataPtBR(hojeStr)}</span>
        </div>

        {pedidosUrgentes.length === 0 && orcamentosVencidosOuPrestes.length === 0 ? (
          <div className="p-4 rounded-2xl bg-green-50 border border-green-200 text-green-900 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <strong className="block">Tudo em dia no ateliê!</strong>
              Nenhum pedido atrasado e nenhum orçamento pendente de resposta com prazo estourado.
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-xs">
            {pedidosUrgentes.map((ped) => {
              const cli = data.clientes.find((c) => c.id === ped.clienteId)
              return (
                <div
                  key={ped.id}
                  className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-300 flex items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-950">
                        {ped.numero} • Entrega URGENTE: {cli?.nome}
                      </span>
                      <p className="text-[11px] text-amber-800">
                        {ped.quantidadeTotal} ímãs • Status atual: {ped.status} • Prazo prometido:{' '}
                        {formatarDataPtBR(ped.prazoPrometido)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => navegarPara('produzir', 'producao')}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-full text-xs shadow-xs"
                  >
                    Abrir Fila
                  </button>
                </div>
              )
            })}

            {orcamentosVencidosOuPrestes.map((orc) => {
              const cli = data.clientes.find((c) => c.id === orc.clienteId)
              return (
                <div
                  key={orc.id}
                  className="p-3.5 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-between gap-3"
                >
                  <div>
                    <span className="font-bold text-red-950">
                      {orc.numero} • Orçamento Vencido: {cli?.nome}
                    </span>
                    <p className="text-[11px] text-red-800">
                      Total: {formatarMoeda(orc.total)} • Reemissão obrigatória para poder aprovar
                    </p>
                  </div>

                  <button
                    onClick={() => navegarPara('vender', 'orcamentos')}
                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full text-xs"
                  >
                    Reemitir
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Indicadores do Dia (Métricas Reais, Sem Números Decorativos) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-2xs space-y-1">
          <span className="text-xs text-gray-500 font-medium">Pedidos em Aberto</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-brand-serif text-[#4E342E]">
              {totalPedidosAtivos}
            </span>
            <span className="text-xs text-[#FF1493] font-bold">Na Fila</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-2xs space-y-1">
          <span className="text-xs text-gray-500 font-medium">Ímãs em Produção</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-brand-serif text-[#FF1493]">
              {totalImasEmProducao}
            </span>
            <span className="text-xs text-gray-500">Unidades 5x5 cm</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-2xs space-y-1">
          <span className="text-xs text-gray-500 font-medium">Faturamento Acumulado</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-brand-serif text-green-700">
              {formatarMoeda(totalReceitaMesAtual)}
            </span>
            <span className="text-xs text-gray-500">Pedidos Confirmados</span>
          </div>
        </div>
      </div>

      {/* Acesso Rápido de Dois Toques para as Ações Mais Usadas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <button
          onClick={() => navegarPara('vender', 'orcamentos')}
          className="p-4 bg-white rounded-2xl border border-[#F0E4E0] hover:border-[#FF1493] shadow-2xs text-left space-y-1 transition-all"
        >
          <span className="font-bold text-[#4E342E] block">+ Novo Orçamento</span>
          <span className="text-[11px] text-gray-500 block">Com faixas oficiais</span>
        </button>

        <button
          onClick={() => navegarPara('produzir', 'controle-arte')}
          className="p-4 bg-white rounded-2xl border border-[#F0E4E0] hover:border-[#FF1493] shadow-2xs text-left space-y-1 transition-all"
        >
          <span className="font-bold text-[#4E342E] block">Conferir Arte</span>
          <span className="text-[11px] text-gray-500 block">Mínimo 700x700 px</span>
        </button>

        <button
          onClick={() => navegarPara('vender', 'clientes')}
          className="p-4 bg-white rounded-2xl border border-[#F0E4E0] hover:border-[#FF1493] shadow-2xs text-left space-y-1 transition-all"
        >
          <span className="font-bold text-[#4E342E] block">Cadastrar Cliente</span>
          <span className="text-[11px] text-gray-500 block">Com aceite LGPD</span>
        </button>

        <button
          onClick={() => navegarPara('dinheiro', 'custos')}
          className="p-4 bg-white rounded-2xl border border-[#F0E4E0] hover:border-[#FF1493] shadow-2xs text-left space-y-1 transition-all"
        >
          <span className="font-bold text-[#4E342E] block">Ajustar Custos</span>
          <span className="text-[11px] text-gray-500 block">Preço unitário automático</span>
        </button>
      </div>
    </div>
  )
}
