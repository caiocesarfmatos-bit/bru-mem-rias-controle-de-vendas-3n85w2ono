import React, { useState, useEffect } from 'react'
import { MetaVendas, PeriodoMetaTipo } from '@/types/app'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Target, DollarSign, TrendingUp, Package, Trash2, Check, AlertCircle } from 'lucide-react'
import { formatarMoeda } from '@/lib/formatters'

interface ModalConfigurarMetaProps {
  aberto: boolean
  onClose: () => void
  metaAtual?: MetaVendas | null
  tipoPeriodoInicial?: PeriodoMetaTipo
  onSalvar: (dados: {
    id?: string
    periodType: PeriodoMetaTipo
    metaReceita?: number
    metaLucro?: number
    metaQuantidade?: number
  }) => void
  onExcluir?: (id: string) => void
}

export const ModalConfigurarMeta: React.FC<ModalConfigurarMetaProps> = ({
  aberto,
  onClose,
  metaAtual,
  tipoPeriodoInicial = 'mensal',
  onSalvar,
  onExcluir,
}) => {
  const [periodType, setPeriodType] = useState<PeriodoMetaTipo>(tipoPeriodoInicial)
  const [metaReceita, setMetaReceita] = useState<string>('')
  const [metaLucro, setMetaLucro] = useState<string>('')
  const [metaQuantidade, setMetaQuantidade] = useState<string>('')
  const [erro, setErro] = useState<string | null>(null)

  // Preenche formulário quando a modal abrir ou a metaAtual mudar
  useEffect(() => {
    if (aberto) {
      if (metaAtual) {
        setPeriodType(metaAtual.periodType)
        setMetaReceita(metaAtual.metaReceita !== undefined ? String(metaAtual.metaReceita) : '')
        setMetaLucro(metaAtual.metaLucro !== undefined ? String(metaAtual.metaLucro) : '')
        setMetaQuantidade(
          metaAtual.metaQuantidade !== undefined ? String(metaAtual.metaQuantidade) : '',
        )
      } else {
        setPeriodType(tipoPeriodoInicial)
        // Valores de sugestão padrão amigáveis para ímãs 5x5
        if (tipoPeriodoInicial === 'semanal') {
          setMetaReceita('500')
          setMetaLucro('300')
          setMetaQuantidade('40')
        } else {
          setMetaReceita('2000')
          setMetaLucro('1200')
          setMetaQuantidade('150')
        }
      }
      setErro(null)
    }
  }, [aberto, metaAtual, tipoPeriodoInicial])

  const handleMudarTipoPeriodo = (novoTipo: PeriodoMetaTipo) => {
    setPeriodType(novoTipo)
    // Se não tiver valores ou valores default, ajusta sugestão
    if (!metaAtual) {
      if (novoTipo === 'semanal') {
        setMetaReceita('500')
        setMetaLucro('300')
        setMetaQuantidade('40')
      } else {
        setMetaReceita('2000')
        setMetaLucro('1200')
        setMetaQuantidade('150')
      }
    }
  }

  const handleSalvar = (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)

    const parseNum = (val: string) => {
      if (!val || val.trim() === '') return undefined
      const limpo = val.replace(',', '.').trim()
      const n = Number(limpo)
      return isNaN(n) ? undefined : n
    }

    const rec = parseNum(metaReceita)
    const luc = parseNum(metaLucro)
    const qtd = parseNum(metaQuantidade)

    if (rec !== undefined && rec < 0) {
      setErro('A meta de receita deve ser maior ou igual a zero.')
      return
    }
    if (luc !== undefined && luc < 0) {
      setErro('A meta de lucro deve ser maior ou igual a zero.')
      return
    }
    if (qtd !== undefined && qtd < 0) {
      setErro('A meta de quantidade deve ser maior ou igual a zero.')
      return
    }

    if (rec === undefined && luc === undefined && qtd === undefined) {
      setErro('Defina ao menos uma meta (Receita, Lucro ou Quantidade de ímãs).')
      return
    }

    onSalvar({
      id: metaAtual?.id,
      periodType,
      metaReceita: rec,
      metaLucro: luc,
      metaQuantidade: qtd !== undefined ? Math.round(qtd) : undefined,
    })

    onClose()
  }

  return (
    <Dialog open={aberto} onOpenChange={(ab) => !ab && onClose()}>
      <DialogContent className="max-w-md bg-white border border-[#F0E4E0] rounded-2xl p-6 shadow-2xl">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-[#F0E4E0]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#FFF0F8] text-[#FF1493] flex items-center justify-center font-bold">
              <Target className="w-4 h-4" />
            </div>
            <DialogTitle className="text-xl font-brand-serif font-bold text-[#4E342E]">
              {metaAtual ? 'Editar Meta de Vendas' : 'Definir Meta de Vendas'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-[#4E342E]/75">
            Configure suas metas para acompanhar seu desempenho e o ritmo das vendas de ímãs no
            painel.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSalvar} className="space-y-4 pt-2">
          {erro && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{erro}</span>
            </div>
          )}

          {/* Tipo de Período (Mensal / Semanal) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#4E342E] block">
              Tipo de Período da Meta
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleMudarTipoPeriodo('mensal')}
                className={`min-h-[44px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                  periodType === 'mensal'
                    ? 'bg-[#FF1493] text-white border-[#FF1493] shadow-md shadow-[#FF1493]/20'
                    : 'bg-[#F5EFEA] text-[#4E342E] border-[#F0E4E0] hover:bg-[#ebdcd5]'
                }`}
              >
                <span>Meta Mensal</span>
                {periodType === 'mensal' && <Check className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => handleMudarTipoPeriodo('semanal')}
                className={`min-h-[44px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                  periodType === 'semanal'
                    ? 'bg-[#FF1493] text-white border-[#FF1493] shadow-md shadow-[#FF1493]/20'
                    : 'bg-[#F5EFEA] text-[#4E342E] border-[#F0E4E0] hover:bg-[#ebdcd5]'
                }`}
              >
                <span>Meta Semanal</span>
                {periodType === 'semanal' && <Check className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-[11px] text-[#4E342E]/60 italic">
              A meta será comparada automaticamente no filtro do painel (ex: mês atual ou semana).
            </p>
          </div>

          {/* Campo: Meta de Receita */}
          <div className="space-y-1">
            <label
              htmlFor="input-meta-receita"
              className="text-xs font-bold text-[#4E342E] flex items-center gap-1.5"
            >
              <DollarSign className="w-3.5 h-3.5 text-[#FF1493]" />
              <span>Meta de Receita Bruta (R$)</span>
              <span className="text-[10px] text-gray-400 font-normal">(opcional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#4E342E]/60">
                R$
              </span>
              <input
                id="input-meta-receita"
                type="number"
                step="0.01"
                min="0"
                placeholder={periodType === 'mensal' ? '2000,00' : '500,00'}
                value={metaReceita}
                onChange={(e) => setMetaReceita(e.target.value)}
                className="w-full min-h-[44px] pl-9 pr-3 text-sm bg-[#F5EFEA]/60 border border-[#F0E4E0] rounded-xl text-[#4E342E] focus:outline-none focus:ring-2 focus:ring-[#FF1493]/40 focus:border-[#FF1493]"
              />
            </div>
            {metaReceita && !isNaN(Number(metaReceita)) && (
              <span className="text-[10px] text-gray-500 block text-right font-medium">
                {formatarMoeda(Number(metaReceita))}
              </span>
            )}
          </div>

          {/* Campo: Meta de Lucro Líquido */}
          <div className="space-y-1">
            <label
              htmlFor="input-meta-lucro"
              className="text-xs font-bold text-[#4E342E] flex items-center gap-1.5"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Meta de Lucro Líquido (R$)</span>
              <span className="text-[10px] text-gray-400 font-normal">(opcional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#4E342E]/60">
                R$
              </span>
              <input
                id="input-meta-lucro"
                type="number"
                step="0.01"
                min="0"
                placeholder={periodType === 'mensal' ? '1200,00' : '300,00'}
                value={metaLucro}
                onChange={(e) => setMetaLucro(e.target.value)}
                className="w-full min-h-[44px] pl-9 pr-3 text-sm bg-[#F5EFEA]/60 border border-[#F0E4E0] rounded-xl text-[#4E342E] focus:outline-none focus:ring-2 focus:ring-[#FF1493]/40 focus:border-[#FF1493]"
              />
            </div>
            {metaLucro && !isNaN(Number(metaLucro)) && (
              <span className="text-[10px] text-gray-500 block text-right font-medium">
                {formatarMoeda(Number(metaLucro))}
              </span>
            )}
          </div>

          {/* Campo: Meta de Quantidade de Ímãs */}
          <div className="space-y-1">
            <label
              htmlFor="input-meta-qtd"
              className="text-xs font-bold text-[#4E342E] flex items-center gap-1.5"
            >
              <Package className="w-3.5 h-3.5 text-[#8E24AA]" />
              <span>Meta de Ímãs 5x5 Vendidos (unidades)</span>
              <span className="text-[10px] text-gray-400 font-normal">(opcional)</span>
            </label>
            <input
              id="input-meta-qtd"
              type="number"
              step="1"
              min="0"
              placeholder={periodType === 'mensal' ? '150' : '40'}
              value={metaQuantidade}
              onChange={(e) => setMetaQuantidade(e.target.value)}
              className="w-full min-h-[44px] px-3 text-sm bg-[#F5EFEA]/60 border border-[#F0E4E0] rounded-xl text-[#4E342E] focus:outline-none focus:ring-2 focus:ring-[#FF1493]/40 focus:border-[#FF1493]"
            />
          </div>

          <DialogFooter className="pt-2 border-t border-[#F0E4E0] flex flex-row items-center justify-between gap-2">
            {metaAtual && onExcluir ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Deseja realmente remover esta meta de vendas?')) {
                    onExcluir(metaAtual.id)
                    onClose()
                  }
                }}
                className="min-h-[44px] px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1"
                title="Excluir meta"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-4 py-2 text-xs font-semibold text-[#4E342E] hover:bg-[#F5EFEA] rounded-xl transition-colors"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="min-h-[44px] px-5 py-2 text-xs font-bold text-white bg-[#FF1493] hover:bg-[#E01284] rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Meta</span>
              </button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
