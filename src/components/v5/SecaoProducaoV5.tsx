import React, { useState } from 'react'
import { useAppV5 } from '@/context/AppV5Context'
import { Pedido, StatusPedido, ChecklistFinalizacao, MotivoPerda } from '@/types/appV5'
import {
  Hammer,
  Clock,
  AlertCircle,
  CheckCircle2,
  Package,
  Truck,
  CheckSquare,
  Square,
  Calendar,
  Layers,
  Scissors,
  Printer,
  Sparkles,
} from 'lucide-react'
import { formatarMoeda, formatarDataPtBR } from '@/lib/formatters'
import { useToast } from '@/hooks/use-toast'

export const SecaoProducaoV5: React.FC = () => {
  const {
    data,
    atualizarStatusPedido,
    atualizarChecklistFinalizacao,
    cancelarPedido,
    navegarPara,
  } = useAppV5()
  const { toast } = useToast()

  const [pedidoFocoId, setPedidoFocoId] = useState<string>(data.pedidos[0]?.id || '')
  const [showModalChecklist, setShowModalChecklist] = useState<string | null>(null)
  const [showModalCancelar, setShowModalCancelar] = useState<string | null>(null)
  const [motivoCancelamento, setMotivoCancelamento] = useState('')

  // Fila de produção ordenada por data prometida (mais urgente primeiro)
  const pedidosFila = [...data.pedidos]
    .filter((p) => p.status !== 'Entregue' && p.status !== 'Cancelado' && p.status !== 'Perdido')
    .sort((a, b) => (a.prazoPrometido > b.prazoPrometido ? 1 : -1))

  const pedidoFoco = data.pedidos.find((p) => p.id === pedidoFocoId) || pedidosFila[0]
  const clienteFoco = pedidoFoco ? data.clientes.find((c) => c.id === pedidoFoco.clienteId) : null
  const arteFoco = pedidoFoco ? data.artes.find((a) => a.pedidoId === pedidoFoco.id) : null

  // Cálculo de dias restantes para o prazo prometido
  const hoje = new Date().toISOString().split('T')[0]
  const calcularDiasRestantes = (prazo: string): number => {
    const d1 = new Date(hoje).getTime()
    const d2 = new Date(prazo).getTime()
    return Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24))
  }

  // Avançar pedido de etapa com validação estrita
  const handleAvancarEtapa = (pedidoId: string, proximoStatus: StatusPedido) => {
    const res = atualizarStatusPedido(pedidoId, proximoStatus)
    if (!res.sucesso) {
      toast({
        title: 'Bloqueio de Fluxo!',
        description: res.erro,
        variant: 'destructive',
      })
    } else {
      toast({
        title: 'Status atualizado com sucesso! ✨',
        description: `Pedido avançou para "${proximoStatus}". Trilha de auditoria registrada.`,
      })
    }
  }

  const handleToggleChecklistItem = (
    pedidoId: string,
    itemKey: keyof ChecklistFinalizacao,
    valorAtual: boolean,
  ) => {
    atualizarChecklistFinalizacao(pedidoId, { [itemKey]: !valorAtual })
  }

  const handleConfirmarCancelamento = () => {
    if (!showModalCancelar) return
    cancelarPedido(showModalCancelar, motivoCancelamento || 'Solicitação do cliente')
    toast({ title: 'Pedido cancelado com motivo mantido em auditoria.' })
    setShowModalCancelar(null)
  }

  return (
    <div className="space-y-6">
      {/* Topo: Capacidade e Alerta Geral */}
      <div className="bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold font-brand-serif text-[#4E342E]">
            Fila de Produção e Prazo de Entrega
          </h2>
          <p className="text-xs text-[#4E342E]/70 mt-0.5">
            Pedidos ordenados por urgência de entrega. Arte aprovada obrigatória antes da impressão.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-full bg-[#FFF0F8] text-[#FF1493] font-bold text-xs border border-[#FF1493]/20">
            {pedidosFila.length} na fila ativa
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1 e 2: Cartões de Pedidos na Fila */}
        <div className="lg:col-span-2 space-y-3">
          {pedidosFila.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-[#F0E4E0] text-gray-500 text-xs">
              Nenhum pedido aguardando produção no momento. Todos foram finalizados ou entregues! 💖
            </div>
          ) : (
            pedidosFila.map((ped) => {
              const cli = data.clientes.find((c) => c.id === ped.clienteId)
              const arte = data.artes.find((a) => a.pedidoId === ped.id)
              const diasRestantes = calcularDiasRestantes(ped.prazoPrometido)
              const isAtrasado = diasRestantes < 0
              const isHoje = diasRestantes === 0

              const arteLiberada = arte && arte.aprovacaoCliente && arte.resolucaoMinimaAtendida

              return (
                <div
                  key={ped.id}
                  onClick={() => setPedidoFocoId(ped.id)}
                  className={`bg-white rounded-2xl p-4 sm:p-5 border cursor-pointer transition-all ${
                    pedidoFoco?.id === ped.id
                      ? 'border-[#FF1493] ring-1 ring-[#FF1493]/30 shadow-xs'
                      : 'border-[#F0E4E0] hover:border-[#FF1493]/40'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#FF1493] bg-[#FFF0F8] px-2.5 py-0.5 rounded-full">
                        {ped.numero}
                      </span>
                      <h3 className="text-sm font-bold text-[#4E342E]">{cli?.nome}</h3>
                      <span className="text-xs text-gray-500">
                        ({cli?.cidade} - {cli?.estado})
                      </span>
                    </div>

                    {/* Alerta de Dias Restantes */}
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                          isAtrasado
                            ? 'bg-red-100 text-red-800'
                            : isHoje
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {isAtrasado
                          ? `Atrasado há ${Math.abs(diasRestantes)} dia(s)`
                          : isHoje
                            ? 'Entrega HOJE!'
                            : `${diasRestantes} dia(s) restantes`}
                      </span>
                    </div>
                  </div>

                  {/* Resumo da Produção */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-3 text-xs">
                    <div>
                      <span className="text-gray-500 block text-[11px]">Quantidade</span>
                      <span className="font-bold text-[#4E342E]">
                        {ped.quantidadeTotal} ímãs 5x5
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[11px]">Status Atual</span>
                      <span className="font-bold text-[#FF1493]">{ped.status}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[11px]">Arte Técnica</span>
                      <span
                        className={
                          arteLiberada ? 'text-green-700 font-bold' : 'text-amber-700 font-bold'
                        }
                      >
                        {arteLiberada ? 'Liberada' : 'Aguardando Aprovação'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[11px]">Prazo Prometido</span>
                      <span className="font-semibold text-[#4E342E]">
                        {formatarDataPtBR(ped.prazoPrometido)}
                      </span>
                    </div>
                  </div>

                  {/* Fluxo de Transição de Etapas */}
                  <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowModalChecklist(ped.id)
                        }}
                        className="px-3 py-1.5 bg-[#FFF0F8] hover:bg-[#FF1493]/15 text-[#FF1493] font-bold rounded-full flex items-center gap-1"
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>Checklist de Finalização</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {ped.status === 'Venda concluída' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAvancarEtapa(ped.id, 'Pedido em andamento')
                          }}
                          className="px-3.5 py-1.5 bg-[#FF1493] hover:bg-[#E01284] text-white font-bold rounded-full shadow-xs"
                        >
                          Iniciar Produção
                        </button>
                      )}

                      {ped.status === 'Pedido em andamento' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAvancarEtapa(ped.id, 'Prazo de entrega')
                          }}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full"
                        >
                          Marcar como Produzido
                        </button>
                      )}

                      {ped.status === 'Prazo de entrega' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAvancarEtapa(ped.id, 'Finalização')
                          }}
                          className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-full"
                        >
                          Ir para Finalização (Embalagem)
                        </button>
                      )}

                      {ped.status === 'Finalização' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAvancarEtapa(ped.id, 'Entregue')
                          }}
                          className="px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full shadow-xs"
                        >
                          Marcar como Entregue
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Coluna 3: Painel Lateral com Checklist do Pedido Ativo */}
        <div>
          {pedidoFoco ? (
            <div className="bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-xs space-y-4">
              <div className="pb-3 border-b border-gray-100">
                <span className="text-[10px] font-bold text-[#FF1493] block uppercase tracking-wide">
                  Conferência do Pedido em Foco
                </span>
                <h3 className="text-sm font-bold text-[#4E342E]">
                  {pedidoFoco.numero} • {clienteFoco?.nome}
                </h3>
              </div>

              {/* Status da Arte */}
              <div className="p-3 rounded-xl bg-gray-50 border text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#4E342E]">Arte Aprovada:</span>
                  <span
                    className={
                      arteFoco?.aprovacaoCliente
                        ? 'text-green-700 font-bold'
                        : 'text-red-600 font-bold'
                    }
                  >
                    {arteFoco?.aprovacaoCliente ? 'SIM' : 'NÃO (Bloqueado)'}
                  </span>
                </div>
                {!arteFoco?.aprovacaoCliente && (
                  <button
                    onClick={() => navegarPara('produzir', 'controle-arte')}
                    className="text-[11px] text-[#FF1493] font-bold hover:underline block pt-1"
                  >
                    Abrir Controle de Arte para aprovar →
                  </button>
                )}
              </div>

              {/* Checklist de Qualidade Obrigatório para Finalização */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-[#4E342E] block">
                  Checklist de Qualidade Artesanal:
                </span>

                <div className="space-y-2 bg-gray-50 p-3 rounded-xl border">
                  {[
                    { key: 'arteConferida', label: 'Arte conferida em proporção 1:1' },
                    { key: 'impressaoVerificada', label: 'Impressão sem listras ou falhas' },
                    { key: 'laminacaoSemBolhas', label: 'Laminação perfeita sem bolhas' },
                    { key: 'corteAlinhado5x5', label: 'Corte artesanal alinhado 5x5 cm' },
                    { key: 'mantaMagneticaAderente', label: 'Manta magnética adesivada firme' },
                    { key: 'bolsinhaOrganzaIncluida', label: 'Bolsinha de organza incluída' },
                    { key: 'etiquetaAfixada', label: 'Etiqueta com a marca Bru Memórias' },
                    { key: 'embalagemEnvioSegura', label: 'Embalagem de envio protegida' },
                  ].map((item) => {
                    const checked = Boolean((pedidoFoco.checklist as any)?.[item.key])
                    return (
                      <div
                        key={item.key}
                        onClick={() =>
                          handleToggleChecklistItem(
                            pedidoFoco.id,
                            item.key as keyof ChecklistFinalizacao,
                            checked,
                          )
                        }
                        className="flex items-center gap-2 cursor-pointer text-[11px] text-[#4E342E]"
                      >
                        {checked ? (
                          <CheckSquare className="w-4 h-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        )}
                        <span className={checked ? 'line-through text-gray-400' : ''}>
                          {item.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Cancelamento com Motivo Obrigatório */}
              <div className="pt-2 border-t border-gray-100">
                <button
                  onClick={() => setShowModalCancelar(pedidoFoco.id)}
                  className="w-full py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  Cancelar Pedido
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 text-center border border-[#F0E4E0] text-gray-500 text-xs">
              Selecione um pedido para visualizar o checklist de produção.
            </div>
          )}
        </div>
      </div>

      {/* Modal de Cancelamento de Pedido com Justificativa */}
      {showModalCancelar && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-red-200 space-y-3">
            <h3 className="text-base font-bold font-brand-serif text-red-600">
              Cancelar Pedido em Produção
            </h3>
            <p className="text-xs text-[#4E342E]/70 leading-relaxed">
              O cancelamento mantém o registro com justificativa salva na auditoria e libera a fila.
            </p>

            <textarea
              value={motivoCancelamento}
              onChange={(e) => setMotivoCancelamento(e.target.value)}
              placeholder="Digite o motivo do cancelamento..."
              className="w-full px-3 py-2 border rounded-xl text-xs"
              rows={3}
              required
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowModalCancelar(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-medium"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirmarCancelamento}
                disabled={!motivoCancelamento.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full text-xs disabled:opacity-50"
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
