import React, { useState } from 'react'
import { MetaVendas, PeriodoMetaTipo } from '@/types/app'
import { PeriodoRelatorioTipo, IntervaloDatas, ResumoPeriodoKPIs } from '@/lib/relatoriosUtils'
import {
  selecionarMetaParaPeriodo,
  calcularProgressoMetas,
  ItemProgressoMeta,
  RitmoStatus,
} from '@/lib/metasUtils'
import { formatarMoeda } from '@/lib/formatters'
import { ModalConfigurarMeta } from './ModalConfigurarMeta'
import {
  Target,
  Sparkles,
  Edit3,
  Plus,
  CheckCircle2,
  Clock,
  Zap,
  TrendingDown,
  Info,
  Calendar,
  Layers,
} from 'lucide-react'

interface SecaoMetasVendasProps {
  metas: MetaVendas[]
  kpis: ResumoPeriodoKPIs
  intervaloAtual: IntervaloDatas
  periodoRelatorioTipo: PeriodoRelatorioTipo
  labelPeriodo: string
  onSalvarMeta: (dados: {
    id?: string
    periodType: PeriodoMetaTipo
    metaReceita?: number
    metaLucro?: number
    metaQuantidade?: number
  }) => void
  onExcluirMeta: (id: string) => void
}

export const SecaoMetasVendas: React.FC<SecaoMetasVendasProps> = ({
  metas,
  kpis,
  intervaloAtual,
  periodoRelatorioTipo,
  labelPeriodo,
  onSalvarMeta,
  onExcluirMeta,
}) => {
  const [modalAberta, setModalAberta] = useState(false)
  const [tipoPeriodoParaConfigurar, setTipoPeriodoParaConfigurar] =
    useState<PeriodoMetaTipo>('mensal')

  // 1. Seleciona a meta mais condizente com o filtro do período compartilhado
  const { metaCalculada, tipoBase } = selecionarMetaParaPeriodo(
    metas,
    periodoRelatorioTipo,
    intervaloAtual,
  )

  // 2. Análise matemática de progresso, ritmo e projeção linear
  const analise = calcularProgressoMetas(metaCalculada, kpis, intervaloAtual)

  const handleAbrirEditar = () => {
    // Busca a meta original cadastrada pelo usuário (ou mensal/semanal base)
    const metaExistente = metas.find((m) => m.periodType === tipoBase) || metas[0] || null
    setTipoPeriodoParaConfigurar(metaExistente?.periodType || tipoBase)
    setModalAberta(true)
  }

  const handleAbrirCriar = (tipo: PeriodoMetaTipo = 'mensal') => {
    setTipoPeriodoParaConfigurar(tipo)
    setModalAberta(true)
  }

  // Renderizador do badge de ritmo
  const renderBadgeRitmo = (item: ItemProgressoMeta) => {
    if (analise.periodoFinalizado) {
      return (
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
            item.atingida
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : 'bg-amber-100 text-amber-900 border border-amber-300'
          }`}
        >
          {item.atingida ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          )}
          <span>{item.atingida ? 'Meta alcançada no fechamento' : 'Período encerrado'}</span>
        </span>
      )
    }

    if (item.ritmoStatus === 'a_frente') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Zap className="w-3.5 h-3.5 text-emerald-600" />
          <span>À frente do ritmo</span>
        </span>
      )
    }

    if (item.ritmoStatus === 'no_ritmo') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          <Target className="w-3.5 h-3.5 text-blue-600" />
          <span>No ritmo esperado</span>
        </span>
      )
    }

    if (item.ritmoStatus === 'atrasado') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
          <TrendingDown className="w-3.5 h-3.5 text-amber-600" />
          <span>Abaixo do ritmo</span>
        </span>
      )
    }

    return null
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-soft-pink space-y-4">
      {/* Topo da seção: Título, contextualização e botão de editar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F0E4E0] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FFF0F8] to-[#FFE4F3] border border-[#FF1493]/30 text-[#FF1493] flex items-center justify-center shadow-2xs">
            <Target className="w-5 h-5 text-[#FF1493]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-brand-serif font-bold text-[#4E342E]">
                Metas de Vendas do Período
              </h3>
              <span className="text-[10px] font-bold text-[#FF1493] bg-[#FFF0F8] px-2.5 py-0.5 rounded-full border border-[#FF1493]/20">
                {labelPeriodo}
              </span>
            </div>
            <p className="text-xs text-[#4E342E]/70">
              Acompanhamento em tempo real baseado nos pedidos filtrados
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {analise.temAlgumaMetaDefinida ? (
            <button
              onClick={handleAbrirEditar}
              className="min-h-[44px] px-3.5 py-1.5 text-xs font-bold text-[#4E342E] bg-[#F5EFEA] hover:bg-[#4E342E] hover:text-white rounded-xl transition-all flex items-center gap-1.5"
              title="Configurar metas de vendas"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#FF1493]" />
              <span>Ajustar Metas</span>
            </button>
          ) : (
            <button
              onClick={() => handleAbrirCriar('mensal')}
              className="min-h-[44px] px-4 py-2 text-xs font-bold text-white bg-[#FF1493] hover:bg-[#E01284] rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Primeira Meta</span>
            </button>
          )}
        </div>
      </div>

      {/* ESTADO VAZIO: Nenhuma meta definida */}
      {!analise.temAlgumaMetaDefinida ? (
        <div className="p-6 bg-gradient-to-br from-[#FFF0F8]/70 via-white to-[#F5EFEA]/60 border border-dashed border-[#FF1493]/30 rounded-2xl text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-[#FFF0F8] text-[#FF1493] flex items-center justify-center font-bold text-xl shadow-inner">
            🎯
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="text-sm font-bold text-[#4E342E]">
              Nenhuma meta de vendas configurada ainda
            </h4>
            <p className="text-xs text-[#4E342E]/70">
              Defina sua meta de receita, lucro líquido ou quantidade de ímãs para ver a barra de
              progresso, o percentual atingido e a projeção do ritmo de vendas!
            </p>
          </div>

          {/* Cards de sugestão rápida */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto pt-2 text-left">
            <div className="p-3 bg-white rounded-xl border border-[#F0E4E0] shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#4E342E]">Sugerir Meta Mensal</span>
                <span className="text-[10px] font-bold text-[#FF1493] bg-[#FFF0F8] px-2 py-0.5 rounded-full">
                  Mês
                </span>
              </div>
              <p className="text-[11px] text-[#4E342E]/75">
                Exemplo: R$ 2.000 de receita, R$ 1.200 de lucro e 150 ímãs no mês.
              </p>
              <button
                onClick={() => handleAbrirCriar('mensal')}
                className="w-full min-h-[44px] py-2 text-xs font-bold text-[#FF1493] bg-[#FFF0F8] hover:bg-[#FF1493] hover:text-white rounded-lg transition-all flex items-center justify-center gap-1 border border-[#FF1493]/20"
              >
                <span>Usar Sugestão Mensal</span>
              </button>
            </div>

            <div className="p-3 bg-white rounded-xl border border-[#F0E4E0] shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#4E342E]">Sugerir Meta Semanal</span>
                <span className="text-[10px] font-bold text-[#8E24AA] bg-purple-50 px-2 py-0.5 rounded-full">
                  Semana
                </span>
              </div>
              <p className="text-[11px] text-[#4E342E]/75">
                Exemplo: R$ 500 de receita, R$ 300 de lucro e 40 ímãs por semana.
              </p>
              <button
                onClick={() => handleAbrirCriar('semanal')}
                className="w-full min-h-[44px] py-2 text-xs font-bold text-[#8E24AA] bg-purple-50 hover:bg-[#8E24AA] hover:text-white rounded-lg transition-all flex items-center justify-center gap-1 border border-purple-200"
              >
                <span>Usar Sugestão Semanal</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* LISTA DE METAS ATIVAS E PROGRESSO */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analise.itens.map((item) => {
              const pctClamped = Math.min(100, item.percentual)
              const formatador =
                item.tipo === 'quantidade'
                  ? (v: number) => `${Math.round(v)} un`
                  : (v: number) => formatarMoeda(v)

              return (
                <div
                  key={item.tipo}
                  className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between space-y-3 ${
                    item.atingida
                      ? 'bg-gradient-to-br from-white via-[#FFF0F8]/30 to-emerald-50/40 border-emerald-300 shadow-soft-pink'
                      : 'bg-gradient-to-br from-white to-[#F5EFEA]/40 border-[#F0E4E0] shadow-2xs'
                  }`}
                >
                  {/* Cabeçalho do Card da Meta */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#4E342E]/70 uppercase tracking-wide">
                        {item.titulo}
                      </span>
                      {renderBadgeRitmo(item)}
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black font-brand-serif text-[#4E342E] tabular-nums">
                          {formatador(item.realizado)}
                        </span>
                        <span className="text-xs text-[#4E342E]/60 font-semibold">
                          / {formatador(item.meta)}
                        </span>
                      </div>
                      <span
                        className={`text-sm font-black tabular-nums ${
                          item.atingida ? 'text-[#FF1493]' : 'text-[#4E342E]'
                        }`}
                      >
                        {item.percentual.toFixed(1).replace('.', ',')}%
                      </span>
                    </div>
                  </div>

                  {/* Barra de Progresso Visual na Paleta da Marca */}
                  {/* Trilha: #4E342E/10 ou marrom escuro suave; Barra: Rosa Choque #FF1493 */}
                  <div className="space-y-1">
                    <div
                      className="w-full h-3.5 bg-[#4E342E]/10 rounded-full overflow-hidden p-0.5 border border-[#4E342E]/15"
                      role="progressbar"
                      aria-valuenow={item.percentual}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        style={{ width: `${pctClamped}%` }}
                        className={`h-full rounded-full transition-all duration-500 shadow-sm ${
                          item.atingida
                            ? 'bg-gradient-to-r from-[#FF1493] via-[#E01284] to-emerald-500'
                            : 'bg-gradient-to-r from-[#FF1493] to-[#E01284]'
                        }`}
                      />
                    </div>

                    {/* Mensagem amigável de status */}
                    <div className="flex items-center justify-between text-[11px] pt-0.5">
                      <span
                        className={`font-bold ${
                          item.atingida ? 'text-[#FF1493]' : 'text-[#4E342E]/80'
                        }`}
                      >
                        {item.textoAmigavel}
                      </span>
                    </div>
                  </div>

                  {/* Projeção Linear / Ritmo */}
                  <div className="pt-2 border-t border-[#F0E4E0]/80 text-[11px] text-[#4E342E]/70 space-y-1">
                    {analise.periodoFinalizado ? (
                      <div className="flex items-center justify-between text-[#4E342E]">
                        <span className="font-semibold">Resultado Final:</span>
                        <span className="font-bold tabular-nums">
                          {item.atingida
                            ? `Bateu a meta (${item.percentual.toFixed(0)}%)`
                            : `Ficou em ${item.percentual.toFixed(0)}% da meta`}
                        </span>
                      </div>
                    ) : item.projecaoLinear !== undefined ? (
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 font-medium">
                          <Sparkles className="w-3 h-3 text-[#FF1493]" />
                          <span>Ritmo previsto:</span>
                        </span>
                        <span className="font-bold text-[#4E342E] tabular-nums">
                          {formatador(item.projecaoLinear)}{' '}
                          <span className="text-[10px] text-gray-500 font-normal">
                            (estimativa)
                          </span>
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Ritmo:</span>
                        <span className="font-bold text-emerald-700">{item.ritmoTexto}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Rodapé Informativo: Contexto do Ritmo */}
          <div className="bg-[#F5EFEA]/60 rounded-xl p-3 border border-[#F0E4E0] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#4E342E]/80">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[#FF1493] flex-shrink-0" />
              <span>
                {analise.periodoFinalizado ? (
                  <span>
                    Período encerrado em{' '}
                    <strong>{intervaloAtual.fim.split('-').reverse().join('/')}</strong>. O
                    resultado acima reflete o consolidado definitivo.
                  </span>
                ) : (
                  <span>
                    O ritmo compara o realizado até hoje com os{' '}
                    <strong>
                      {analise.diasDecorridos} de {analise.diasTotaisPeriodo} dias
                    </strong>{' '}
                    do período. Estimativas consideram ritmo linear constante.
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAbrirEditar}
                className="text-xs font-bold text-[#FF1493] hover:underline whitespace-nowrap"
              >
                Configurar metas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Configuração de Metas */}
      <ModalConfigurarMeta
        aberto={modalAberta}
        onClose={() => setModalAberta(false)}
        metaAtual={
          metas.find((m) => m.periodType === tipoPeriodoParaConfigurar) || metas[0] || null
        }
        tipoPeriodoInicial={tipoPeriodoParaConfigurar}
        onSalvar={(dados) => {
          onSalvarMeta(dados)
        }}
        onExcluir={(id) => {
          onExcluirMeta(id)
        }}
      />
    </div>
  )
}
