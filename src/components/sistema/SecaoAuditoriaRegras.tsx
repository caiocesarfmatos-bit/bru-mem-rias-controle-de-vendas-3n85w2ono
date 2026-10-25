import React, { useState } from 'react'
import { executarSuiteR1aR14, ResultadoRegra } from '@/lib/suiteRegrasIntegridade'
import { executarCicloAceitePontaAPonta, ResultadoCicloAceite } from '@/lib/cicloAceitePontaAPonta'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Play, ShieldAlert, Check, RefreshCw, Workflow } from 'lucide-react'

export const SecaoAuditoriaRegras: React.FC = () => {
  const [resultados, setResultados] = useState<ResultadoRegra[]>([])
  const [executando, setExecutando] = useState(false)

  // Estado do Ciclo de Aceite Ponta a Ponta
  const [resultadoCiclo, setResultadoCiclo] = useState<ResultadoCicloAceite | null>(null)
  const [executandoCiclo, setExecutandoCiclo] = useState(false)

  const handleRodarSuite = async () => {
    setExecutando(true)
    const res = await executarSuiteR1aR14()
    setResultados(res)
    setExecutando(false)
  }

  const handleRodarCicloAceite = async () => {
    setExecutandoCiclo(true)
    try {
      const res = await executarCicloAceitePontaAPonta()
      setResultadoCiclo(res)
    } catch (err: any) {
      alert('Erro ao executar ciclo de aceite: ' + (err.message || 'Falha'))
    } finally {
      setExecutandoCiclo(false)
    }
  }

  return (
    <Card className="border border-[#F0E4E0] shadow-sm mt-6">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold text-[#4E342E]">
            Auditoria Automatizada de Regras de Integridade (R1–R15)
          </CardTitle>
          <p className="text-xs text-[#4E342E]/70">
            Validação ativa com casos de teste positivos e negativos contra o backend Skip Cloud
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleRodarSuite}
          disabled={executando}
          className="bg-[#FF1493] hover:bg-[#D8117E] text-white"
        >
          <Play className="w-3.5 h-3.5 mr-1" />
          {executando ? 'Testando...' : 'Executar Testes R1-R15'}
        </Button>
      </CardHeader>

      <CardContent className="p-4 pt-2 space-y-3">
        {resultados.map((r) => (
          <div
            key={r.regra}
            className="p-3 bg-[#FAF7F6] rounded border border-[#F0E4E0] text-xs space-y-1.5"
          >
            <div className="flex justify-between items-center">
              <span className="font-bold text-[#FF1493]">
                {r.regra} — {r.descricao}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> {r.statusFinal}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-[#F0E4E0]/60">
              <div className="text-[11px] text-green-700 bg-green-50/50 p-2 rounded">
                <span className="font-bold block">Caminho Positivo:</span>
                {r.detalhePositivo}
              </div>
              <div className="text-[11px] text-blue-700 bg-blue-50/50 p-2 rounded">
                <span className="font-bold block">Caminho Negativo (Bloqueio Esperado):</span>
                {r.detalheNegativo}
              </div>
            </div>
          </div>
        ))}

        {resultados.length === 0 && (
          <div className="text-center py-6 text-xs text-[#4E342E]/60">
            Clique no botão acima para submeter as regras R1–R15 a testes reais no servidor e
            validar os bloqueios.
          </div>
        )}

        {/* Ciclo de Aceite Funcional Ponta a Ponta */}
        <div className="pt-6 border-t border-[#F0E4E0] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-[#4E342E] flex items-center gap-1.5">
                <Workflow className="w-4 h-4 text-[#FF1493]" />
                Ciclo Funcional de Aceite Ponta a Ponta
              </h3>
              <p className="text-[11px] text-[#4E342E]/70">
                Cadastro de produto → fornecedor → compra → estoque → caixa → cliente → pedido com 2
                itens e pagamento misto → baixa atômica → recebimento → devolução com estorno
              </p>
            </div>

            <Button
              size="sm"
              onClick={handleRodarCicloAceite}
              disabled={executandoCiclo}
              className="bg-[#4E342E] hover:bg-[#3D2823] text-white text-xs"
            >
              {executandoCiclo ? (
                <>
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  Executando Ciclo...
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 mr-1" />
                  Rodar Ciclo de Aceite
                </>
              )}
            </Button>
          </div>

          {resultadoCiclo && (
            <div className="space-y-2 pt-2">
              <div
                className={`p-3 rounded text-xs font-bold flex items-center justify-between ${
                  resultadoCiclo.todasAprovadas
                    ? 'bg-green-100 text-green-900 border border-green-300'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}
              >
                <span>
                  {resultadoCiclo.todasAprovadas
                    ? 'CICLO DE ACEITE APROVADO COM SUCESSO'
                    : 'CICLO DE ACEITE COM ETAPAS REQUERENDO ATENÇÃO'}
                </span>
                <span>
                  {resultadoCiclo.passosAprovados} de {resultadoCiclo.totalPassos} passos concluídos
                </span>
              </div>

              <div className="grid grid-cols-1 gap-1.5 text-xs">
                {resultadoCiclo.etapas.map((et) => (
                  <div
                    key={et.passo}
                    className="p-2.5 bg-[#FAF7F6] rounded border border-[#F0E4E0] flex items-start gap-2"
                  >
                    {et.sucesso ? (
                      <Check className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="font-semibold text-[#4E342E]">
                        Passo {et.passo}: {et.titulo}
                      </div>
                      <div className="text-[11px] text-[#4E342E]/70 mt-0.5">{et.detalhe}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
