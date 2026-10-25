import React from 'react'
import { TrendingUp, TrendingDown, Minus, ArrowUpRight } from 'lucide-react'

interface BadgeVariacaoProps {
  kpi: {
    variacaoPct: number | null
    tendencia: 'alta' | 'baixa' | 'estavel'
  }
  sufixo?: string
  tamanho?: 'sm' | 'md'
}

export const BadgeVariacao: React.FC<BadgeVariacaoProps> = ({
  kpi,
  sufixo = 'vs anterior',
  tamanho = 'sm',
}) => {
  const padraoClasses = tamanho === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'

  if (kpi.variacaoPct === null) {
    return (
      <span
        className={`inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200/60 ${padraoClasses}`}
      >
        <ArrowUpRight className="w-3 h-3 text-emerald-600 flex-shrink-0" />
        <span>Novo no período</span>
      </span>
    )
  }

  if (kpi.tendencia === 'alta') {
    return (
      <span
        className={`inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200/60 ${padraoClasses}`}
      >
        <TrendingUp className="w-3 h-3 text-emerald-600 flex-shrink-0" />
        <span>
          +{kpi.variacaoPct.toFixed(1).replace('.', ',')}% {sufixo}
        </span>
      </span>
    )
  }

  if (kpi.tendencia === 'baixa') {
    return (
      <span
        className={`inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 rounded-full border border-rose-200/60 ${padraoClasses}`}
      >
        <TrendingDown className="w-3 h-3 text-rose-600 flex-shrink-0" />
        <span>
          {kpi.variacaoPct.toFixed(1).replace('.', ',')}% {sufixo}
        </span>
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold text-[#4E342E]/70 bg-gray-100 rounded-full border border-gray-200/60 ${padraoClasses}`}
    >
      <Minus className="w-3 h-3 text-gray-500 flex-shrink-0" />
      <span>0,0% estável</span>
    </span>
  )
}
