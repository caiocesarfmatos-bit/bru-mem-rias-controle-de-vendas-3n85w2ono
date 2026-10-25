import React from 'react'
import { useAppV5 } from '@/context/AppV5Context'
import { SubsecaoId } from '@/types/appV5'
import { Clock, Hammer, Coins, TrendingUp, Sparkles, ArrowRight } from 'lucide-react'

interface SecaoEstruturaProntaProps {
  titulo: string
  subtitulo: string
  oQueFazer: string
  proximaEtapa: string
  subsecaoId: SubsecaoId
}

export const SecaoEstruturaProntaV5: React.FC<SecaoEstruturaProntaProps> = ({
  titulo,
  subtitulo,
  oQueFazer,
  proximaEtapa,
}) => {
  const { navegarPara } = useAppV5()

  return (
    <div className="bg-white rounded-3xl p-8 border border-[#F0E4E0] shadow-sm max-w-2xl mx-auto my-6 text-center space-y-4">
      <div className="w-14 h-14 mx-auto rounded-full bg-[#FFF0F8] text-[#FF1493] flex items-center justify-center shadow-inner">
        <Sparkles className="w-7 h-7" />
      </div>

      <h2 className="text-lg font-bold font-brand-serif text-[#4E342E]">{titulo}</h2>
      <p className="text-xs text-[#4E342E]/70 max-w-md mx-auto leading-relaxed">{subtitulo}</p>

      {/* Caixa Informativa "O que fazer" */}
      <div className="p-4 rounded-2xl bg-[#F5EFEA]/80 border border-[#F0E4E0] text-left text-xs text-[#4E342E]/80 space-y-2">
        <span className="font-bold text-[#4E342E] block">O que fazer nesta seção:</span>
        <p className="leading-relaxed">{oQueFazer}</p>
        <div className="pt-1 text-[11px] text-[#FF1493] font-semibold">
          Status: Estrutura de dados declarada na entidade; telas analíticas completas na Rodada 2.
        </div>
      </div>

      <div className="pt-2 flex justify-center gap-3">
        <button
          onClick={() => navegarPara('hoje', 'painel')}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#4E342E] font-medium text-xs rounded-full transition-colors"
        >
          Voltar ao Painel
        </button>
        <button
          onClick={() => navegarPara('dinheiro', 'custos')}
          className="px-4 py-2 bg-[#FF1493] hover:bg-[#E01284] text-white font-bold text-xs rounded-full shadow-sm flex items-center gap-1.5 transition-all"
        >
          <span>Ir para Custos & Precificação</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
