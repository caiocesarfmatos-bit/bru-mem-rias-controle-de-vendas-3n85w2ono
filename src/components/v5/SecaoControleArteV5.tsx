import React, { useState } from 'react'
import { useAppV5 } from '@/context/AppV5Context'
import { ArquivoArte, StatusRecorteArte } from '@/types/appV5'
import {
  Image,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Scissors,
  Check,
  MessageSquare,
  Copy,
} from 'lucide-react'
import { formatarDataPtBR } from '@/lib/formatters'
import { useToast } from '@/hooks/use-toast'

export const SecaoControleArteV5: React.FC = () => {
  const { data, cadastrarOuAtualizarArte, aprovarArteCliente, navegarPara } = useAppV5()
  const { toast } = useToast()

  const [pedidoSelecionadoId, setPedidoSelecionadoId] = useState<string>(data.pedidos[0]?.id || '')
  const [origemArquivo, setOrigemArquivo] = useState<
    'WhatsApp' | 'E-mail' | 'Drive' | 'Upload local'
  >('WhatsApp')
  const [larguraPixels, setLarguraPixels] = useState<number>(800)
  const [alturaPixels, setAlturaPixels] = useState<number>(800)
  const [areaSegurancaOk, setAreaSegurancaOk] = useState(true)
  const [textoLegivelOk, setTextoLegivelOk] = useState(true)
  const [fotoEscuraOuTremida, setFotoEscuraOuTremida] = useState(false)
  const [observacaoQualidade, setObservacaoQualidade] = useState('')

  const pedidosPendentes = data.pedidos.filter(
    (p) => p.status !== 'Entregue' && p.status !== 'Cancelado',
  )
  const pedidoAtual = data.pedidos.find((p) => p.id === pedidoSelecionadoId)
  const clienteAtual = pedidoAtual
    ? data.clientes.find((c) => c.id === pedidoAtual.clienteId)
    : null

  const arteExistente = data.artes.find((a) => a.pedidoId === pedidoSelecionadoId)

  // Resolução segura para 5x5 cm: mínimo 700x700 pixels (300 DPI com margem de sangria)
  const resolucaoAtendida = larguraPixels >= 700 && alturaPixels >= 700
  const proporcaoQuadrada =
    larguraPixels > 0 && alturaPixels > 0 && Math.abs(larguraPixels - alturaPixels) <= 10

  const handleSalvarConferencia = (e: React.FormEvent) => {
    e.preventDefault()
    if (!pedidoSelecionadoId) {
      toast({ title: 'Selecione um pedido para conferência', variant: 'destructive' })
      return
    }

    const arte = cadastrarOuAtualizarArte({
      id: arteExistente?.id,
      pedidoId: pedidoSelecionadoId,
      nomeArquivo: `arte-pedido-${pedidoAtual?.numero || pedidoSelecionadoId}.jpg`,
      origemArquivo,
      larguraPixels,
      alturaPixels,
      resolucaoPixels: `${larguraPixels}x${alturaPixels}`,
      proporcao: proporcaoQuadrada ? '1:1' : `${larguraPixels}:${alturaPixels}`,
      proporcaoQuadrada,
      resolucaoMinimaAtendida: resolucaoAtendida,
      areaSegurancaOk,
      textoLegivelOk,
      fotoEscuraOuTremida,
      aprovacaoCliente: arteExistente?.aprovacaoCliente || false,
      dataAprovacao: arteExistente?.dataAprovacao,
      observacaoQualidade,
      statusRecorte: proporcaoQuadrada ? 'Adequado (1:1)' : 'Recorte necessário',
    })

    toast({
      title: 'Conferência técnica salva! 🎨',
      description: resolucaoAtendida
        ? 'Resolução e qualidade aprovadas para impressão 300 DPI.'
        : 'Alerta de baixa resolução ativado. Envie mensagem ao cliente.',
    })
  }

  const handleAprovarPeloCliente = () => {
    if (!arteExistente) {
      toast({
        title: 'Salve a conferência técnica antes de aprovar',
        variant: 'destructive',
      })
      return
    }

    if (!arteExistente.resolucaoMinimaAtendida) {
      toast({
        title: 'Bloqueio de Qualidade',
        description: 'Não é permitido liberar arte com resolução abaixo de 700x700 pixels.',
        variant: 'destructive',
      })
      return
    }

    aprovarArteCliente(arteExistente.id)
    toast({
      title: 'Arte formalmente aprovada! 🎉',
      description: 'Liberada para produção artesanal na Fila de Produção.',
    })
  }

  const handleCopiarMensagemCliente = () => {
    if (!arteExistente?.mensagemOrientacaoPronta) return
    navigator.clipboard.writeText(arteExistente.mensagemOrientacaoPronta)
    toast({ title: 'Mensagem pronta copiada para enviar no WhatsApp! 💖' })
  }

  return (
    <div className="space-y-6">
      {/* Topo Informativo dos Padrões Técnicos */}
      <div className="bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-2xs space-y-2">
        <div className="flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-[#FF1493]" />
          <h2 className="text-base font-bold font-brand-serif text-[#4E342E]">
            Controle de Qualidade de Arte (Padrão 5x5 cm - 300 DPI)
          </h2>
        </div>
        <p className="text-xs text-[#4E342E]/70 leading-relaxed">
          Para garantir impressão nítida e evitar bordas cortadas, o padrão de segurança é de no
          mínimo <strong>700 x 700 pixels</strong> em proporção <strong>1:1 (quadrada)</strong>.
          Nenhum pedido entra em produção sem aprovação da cliente registrada aqui.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Conferência Técnica */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-xs space-y-4">
          <form onSubmit={handleSalvarConferencia} className="space-y-4 text-xs">
            {/* Seleção do Pedido */}
            <div>
              <label className="block font-bold text-[#4E342E] mb-1">
                Selecione o Pedido em Andamento *
              </label>
              <select
                value={pedidoSelecionadoId}
                onChange={(e) => setPedidoSelecionadoId(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl bg-white"
                required
              >
                <option value="">Selecione o pedido...</option>
                {pedidosPendentes.map((ped) => {
                  const cli = data.clientes.find((c) => c.id === ped.clienteId)
                  return (
                    <option key={ped.id} value={ped.id}>
                      {ped.numero} - {cli?.nome} ({ped.quantidadeTotal} ímãs • Status: {ped.status})
                    </option>
                  )
                })}
              </select>
            </div>

            {/* Origem e Dimensões em Pixels */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-[#4E342E] mb-1">Canal de Recebimento</label>
                <select
                  value={origemArquivo}
                  onChange={(e) => setOrigemArquivo(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-xl bg-white"
                >
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="E-mail">E-mail</option>
                  <option value="Drive">Google Drive</option>
                  <option value="Upload local">Arquivo no celular/PC</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#4E342E] mb-1">Largura em Pixels *</label>
                <input
                  type="number"
                  min="1"
                  value={larguraPixels}
                  onChange={(e) => setLarguraPixels(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#4E342E] mb-1">Altura em Pixels *</label>
                <input
                  type="number"
                  min="1"
                  value={alturaPixels}
                  onChange={(e) => setAlturaPixels(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-xl"
                  required
                />
              </div>
            </div>

            {/* Alertas Automáticos de Resolução e Proporção */}
            <div className="space-y-2">
              {!resolucaoAtendida && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
                  <div>
                    <strong className="block">Alerta: Resolução abaixo do padrão seguro!</strong>
                    <span>
                      O arquivo informado possui {larguraPixels}x{alturaPixels} pixels. O mínimo
                      recomendado para corte sem perda de borda no ímã 5x5 cm é 700x700 pixels.
                    </span>
                  </div>
                </div>
              )}

              {!proporcaoQuadrada && (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 flex items-start gap-2">
                  <Scissors className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <strong className="block">Atenção: Proporção não é quadrada (1:1)</strong>
                    <span>
                      Será necessário enquadramento/recorte manual para caber no ímã 5x5 cm.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Checklist de Inspeção Visual Obrigatória */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
              <span className="font-bold text-[#4E342E] block">Inspeção Visual da Foto:</span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={areaSegurancaOk}
                    onChange={(e) => setAreaSegurancaOk(e.target.checked)}
                    className="rounded text-[#FF1493] focus:ring-[#FF1493]"
                  />
                  <span>Área de segurança OK (rostos longe da borda)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={textoLegivelOk}
                    onChange={(e) => setTextoLegivelOk(e.target.checked)}
                    className="rounded text-[#FF1493] focus:ring-[#FF1493]"
                  />
                  <span>Texto/data legível (&gt; 8 pt)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-amber-800">
                  <input
                    type="checkbox"
                    checked={fotoEscuraOuTremida}
                    onChange={(e) => setFotoEscuraOuTremida(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Foto escura ou tremida</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#4E342E] mb-1">Observações Técnicas</label>
              <textarea
                value={observacaoQualidade}
                onChange={(e) => setObservacaoQualidade(e.target.value)}
                placeholder="Ex: Foto de celular tratada com leve clareamento antes da impressão..."
                className="w-full px-3 py-2 border rounded-xl"
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-[#4E342E] hover:bg-[#3E2723] text-white font-bold rounded-full"
              >
                Salvar Conferência Técnica
              </button>
            </div>
          </form>
        </div>

        {/* Painel Lateral: Aprovação do Cliente e Mensagem Pronta */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-xs space-y-4">
            <h3 className="text-sm font-bold font-brand-serif text-[#4E342E]">
              Status de Aprovação da Cliente
            </h3>

            {arteExistente ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-[#FFF0F8] border border-[#FF1493]/20 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#4E342E]">Resolução:</span>
                    <span
                      className={
                        arteExistente.resolucaoMinimaAtendida
                          ? 'text-green-700 font-bold'
                          : 'text-red-600 font-bold'
                      }
                    >
                      {arteExistente.resolucaoPixels} px
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#4E342E]">Enquadramento:</span>
                    <span>{arteExistente.statusRecorte}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#4E342E]">Aprovado pela Cliente:</span>
                    <span
                      className={
                        arteExistente.aprovacaoCliente
                          ? 'text-green-700 font-bold'
                          : 'text-amber-700 font-bold'
                      }
                    >
                      {arteExistente.aprovacaoCliente ? 'SIM' : 'PENDENTE'}
                    </span>
                  </div>
                  {arteExistente.dataAprovacao && (
                    <div className="text-[10px] text-gray-500 pt-1 border-t border-[#FF1493]/10">
                      Registrado em: {formatarDataPtBR(arteExistente.dataAprovacao)}
                    </div>
                  )}
                </div>

                {/* Botão de Aprovação pelo Cliente */}
                {!arteExistente.aprovacaoCliente ? (
                  <button
                    onClick={handleAprovarPeloCliente}
                    disabled={!arteExistente.resolucaoMinimaAtendida}
                    className="w-full py-2.5 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>Registrar Aprovação da Cliente</span>
                  </button>
                ) : (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-800 text-center font-bold">
                    ✓ Arte liberada para entrar em produção!
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-500">
                Selecione um pedido e salve a conferência técnica para liberar o botão de aprovação.
              </p>
            )}
          </div>

          {/* Mensagem Pronta para WhatsApp (se houver ajuste) */}
          {arteExistente?.mensagemOrientacaoPronta && (
            <div className="bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#4E342E] flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5 text-[#FF1493]" />
                  Mensagem Pronta para a Cliente
                </h4>
                <button
                  onClick={handleCopiarMensagemCliente}
                  className="text-xs text-[#FF1493] hover:underline font-bold flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  Copiar
                </button>
              </div>
              <p className="p-3 bg-gray-50 rounded-xl text-[11px] text-[#4E342E]/80 leading-relaxed border border-gray-100 italic">
                "{arteExistente.mensagemOrientacaoPronta}"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
