import React, { useState } from 'react'
import { useAppV5 } from '@/context/AppV5Context'
import { Parametro, CHAVES_PARAMETROS } from '@/types/appV5'
import { Sliders, Save, ShieldAlert, AlertTriangle, FileText, CheckCircle2 } from 'lucide-react'
import { formatarNumero, formatarDataPtBR } from '@/lib/formatters'
import { useToast } from '@/hooks/use-toast'

export const SecaoParametrosAjustesV5: React.FC = () => {
  const { data, atualizarParametro } = useAppV5()
  const { toast } = useToast()

  const [valoresEditados, setValoresEditados] = useState<Record<string, number>>({})

  const handleChange = (chave: string, val: number) => {
    setValoresEditados((prev) => ({ ...prev, [chave]: val }))
  }

  const handleSalvarParametro = (chave: string) => {
    const novoValor = valoresEditados[chave]
    if (novoValor === undefined) return

    const res = atualizarParametro(chave, novoValor)
    if (res.sucesso) {
      toast({
        title: 'Parâmetro atualizado! ⚙️',
        description: 'Novo valor salvo e registrado na trilha de auditoria.',
      })
    } else {
      toast({
        title: 'Valor inválido',
        description: res.erro,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Topo Informativo */}
      <div className="bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-2xs space-y-2">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-[#FF1493]" />
          <h2 className="text-base font-bold font-brand-serif text-[#4E342E]">
            Parâmetros Globais do Negócio (Entidade PARAMETRO)
          </h2>
        </div>
        <p className="text-xs text-[#4E342E]/70 leading-relaxed">
          <strong>Regra de Precisão:</strong> Nenhum limite numérico está fixado de forma oculta no
          código. Todos os percentuais de alerta, margens mínimas, prazos de expiração e limites do
          Simples Nacional vivem nesta tabela central e governam as validações em tempo real.
        </p>
      </div>

      {/* Grid de Parâmetros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.parametros.map((param) => {
          const valorAtual =
            valoresEditados[param.chave] !== undefined ? valoresEditados[param.chave] : param.valor

          const alterado =
            valoresEditados[param.chave] !== undefined &&
            valoresEditados[param.chave] !== param.valor

          return (
            <div
              key={param.chave}
              className="bg-white rounded-2xl p-4 border border-[#F0E4E0] shadow-2xs space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-gray-100">
                  <div>
                    <h3 className="text-xs font-bold text-[#4E342E]">{param.descricao}</h3>
                    <code className="text-[10px] text-gray-400 block font-mono">{param.chave}</code>
                  </div>
                  <span className="text-xs font-bold text-[#FF1493] px-2 py-0.5 rounded-full bg-[#FFF0F8]">
                    {param.unidade}
                  </span>
                </div>

                <div className="pt-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={valorAtual}
                      onChange={(e) => handleChange(param.chave, parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-xs border rounded-xl font-bold text-[#4E342E] bg-gray-50 focus:bg-white focus:ring-1 focus:ring-[#FF1493]"
                    />
                    {alterado && (
                      <button
                        onClick={() => handleSalvarParametro(param.chave)}
                        className="px-3 py-2 bg-[#FF1493] hover:bg-[#E01284] text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                      >
                        Salvar
                      </button>
                    )}
                  </div>

                  <span className="text-[10px] text-gray-500 block mt-1.5">
                    Faixa aceita: {param.valorMinimo} a {param.valorMaximo} {param.unidade}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Trilha de Auditoria Segura Recente */}
      <div className="bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#FF1493]" />
            <h3 className="text-sm font-bold font-brand-serif text-[#4E342E]">
              Trilha de Auditoria Segura (Sem Dados Pessoais)
            </h3>
          </div>
          <span className="text-[10px] text-gray-500">Últimos registros gravados localmente</span>
        </div>

        <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
          {data.auditoria.slice(0, 15).map((aud) => (
            <div
              key={aud.id}
              className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-[11px] text-[#4E342E]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1"
            >
              <div>
                <span className="font-bold text-[#FF1493]">[{aud.entidade}]</span>{' '}
                <span className="font-semibold">{aud.acao}</span>
                {aud.detalhe && <span className="text-gray-500 ml-1">• {aud.detalhe}</span>}
              </div>
              <div className="text-[10px] text-gray-400 whitespace-nowrap">
                {formatarDataPtBR(aud.dataHora)} • ID: {aud.entidadeId.slice(-6)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
