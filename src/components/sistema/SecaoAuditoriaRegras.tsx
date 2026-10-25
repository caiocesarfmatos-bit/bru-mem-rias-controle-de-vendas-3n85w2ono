import React, { useState } from 'react'
import { executarSuiteR1aR14, ResultadoRegra } from '@/lib/suiteRegrasIntegridade'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Play, ShieldAlert } from 'lucide-react'

export const SecaoAuditoriaRegras: React.FC = () => {
  const [resultados, setResultados] = useState<ResultadoRegra[]>([])
  const [executando, setExecutando] = useState(false)

  const handleRodarSuite = async () => {
    setExecutando(true)
    const res = await executarSuiteR1aR14()
    setResultados(res)
    setExecutando(false)
  }

  return (
    <Card className="border border-[#F0E4E0] shadow-sm mt-6">
      <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold text-[#4E342E]">
            Auditoria Automatizada de Regras de Integridade (R1–R14)
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
          {executando ? 'Testando...' : 'Executar Testes R1-R14'}
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
            Clique no botão acima para submeter as regras R1–R14 a testes reais no servidor e
            validar os bloqueios.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
