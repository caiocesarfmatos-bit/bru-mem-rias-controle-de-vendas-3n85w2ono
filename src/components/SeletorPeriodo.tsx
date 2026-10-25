import React from 'react'
import { Calendar } from 'lucide-react'
import { PeriodoRelatorioTipo, paraYmd, IntervaloDatas } from '@/lib/relatoriosUtils'
import { formatarDataPtBR } from '@/lib/formatters'

interface SeletorPeriodoProps {
  periodoTipo: PeriodoRelatorioTipo
  onChangePeriodoTipo: (tipo: PeriodoRelatorioTipo) => void
  dataInicioCustom: string
  onChangeDataInicioCustom: (data: string) => void
  dataFimCustom: string
  onChangeDataFimCustom: (data: string) => void
  labelPeriodo: string
  intervaloAnterior?: IntervaloDatas
  subtitulo?: string
  modoCompacto?: boolean
}

export const OPCOES_PERIODO: { id: PeriodoRelatorioTipo; label: string }[] = [
  { id: 'hoje', label: 'Hoje' },
  { id: '7d', label: 'Últimos 7 dias' },
  { id: 'mes_atual', label: 'Este mês' },
  { id: 'mes_anterior', label: 'Mês passado' },
  { id: 'ano_atual', label: 'Este ano' },
  { id: 'ano_anterior', label: 'Ano passado' },
  { id: 'personalizado', label: 'Personalizado' },
]

export const SeletorPeriodo: React.FC<SeletorPeriodoProps> = ({
  periodoTipo,
  onChangePeriodoTipo,
  dataInicioCustom,
  onChangeDataInicioCustom,
  dataFimCustom,
  onChangeDataFimCustom,
  labelPeriodo,
  intervaloAnterior,
  subtitulo = 'Filtro de período sincronizado entre Painel e Relatórios',
  modoCompacto = false,
}) => {
  const hojeYmd = paraYmd(new Date())

  return (
    <div
      className={`bg-white rounded-2xl p-4 sm:p-5 border border-[#F0E4E0] shadow-soft-pink space-y-3 print:border-none print:shadow-none print:p-0 ${
        modoCompacto ? 'p-3 sm:p-4' : ''
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0E4E0] pb-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#FF1493] flex-shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-[#4E342E]">Período de Análise</h3>
            {subtitulo && <p className="text-[11px] text-[#4E342E]/70">{subtitulo}</p>}
          </div>
        </div>
        <span className="text-xs font-medium text-[#FF1493] bg-[#FFF0F8] px-3 py-1 rounded-full border border-[#FF1493]/20 self-start sm:self-auto">
          Período Ativo: <strong>{labelPeriodo}</strong>
        </span>
      </div>

      {/* Botões rápidos de período com rolagem horizontal no mobile e alvos de toque >= 44px */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 print:hidden">
        {OPCOES_PERIODO.map((item) => {
          const isSelected = periodoTipo === item.id
          return (
            <button
              key={item.id}
              onClick={() => onChangePeriodoTipo(item.id)}
              className={`min-h-[44px] px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all duration-150 select-none ${
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
            <label htmlFor="periodo-data-inicio" className="text-xs font-bold text-[#4E342E]">
              De:
            </label>
            <input
              id="periodo-data-inicio"
              type="date"
              value={dataInicioCustom}
              max={dataFimCustom || hojeYmd}
              onChange={(e) => onChangeDataInicioCustom(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-[#F0E4E0] rounded-lg bg-white text-[#4E342E] focus:ring-1 focus:ring-[#FF1493]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="periodo-data-fim" className="text-xs font-bold text-[#4E342E]">
              Até:
            </label>
            <input
              id="periodo-data-fim"
              type="date"
              value={dataFimCustom}
              min={dataInicioCustom}
              max={hojeYmd}
              onChange={(e) => onChangeDataFimCustom(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-[#F0E4E0] rounded-lg bg-white text-[#4E342E] focus:ring-1 focus:ring-[#FF1493]"
            />
          </div>
          {intervaloAnterior && (
            <span className="text-[11px] text-[#4E342E]/70 italic">
              Comparativo automático com os mesmos dias anteriores imediatos (
              {formatarDataPtBR(intervaloAnterior.inicio)} a{' '}
              {formatarDataPtBR(intervaloAnterior.fim)}).
            </span>
          )}
        </div>
      )}
    </div>
  )
}
