import React, { useState } from 'react'
import { useAppV5 } from '@/context/AppV5Context'
import { Orcamento, Pedido, StatusOrcamento, MotivoPerda } from '@/types/appV5'
import {
  FileText,
  Plus,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  AlertTriangle,
  Eye,
  Check,
} from 'lucide-react'
import { formatarMoeda, formatarDataPtBR } from '@/lib/formatters'
import { useToast } from '@/hooks/use-toast'
import { ModalComprovantePedido, ComprovantePedidoDados } from '@/components/ModalComprovantePedido'

export const SecaoOrcamentosV5: React.FC = () => {
  const {
    data,
    criarOrcamento,
    enviarOrcamento,
    reemitirOrcamentoVencido,
    marcarOrcamentoPerdido,
    aprovarOrcamentoParaPedido,
    navegarPara,
  } = useAppV5()
  const { toast } = useToast()

  const [showModalNovo, setShowModalNovo] = useState(false)
  const [showModalAprovar, setShowModalAprovar] = useState<string | null>(null)
  const [showModalPerda, setShowModalPerda] = useState<string | null>(null)
  const [comprovanteAtivo, setComprovanteAtivo] = useState<ComprovantePedidoDados | null>(null)

  // Form novo orçamento
  const [formClienteId, setFormClienteId] = useState('')
  const [formProdutoId, setFormProdutoId] = useState(data.produtos[0]?.id || '')
  const [formQuantidade, setFormQuantidade] = useState<number>(12)
  const [formFrete, setFormFrete] = useState<number>(0)
  const [formDesconto, setFormDesconto] = useState<number>(0)
  const [formValidadeDias, setFormValidadeDias] = useState<number>(7)
  const [formObservacoes, setFormObservacoes] = useState('')

  // Form aprovação para venda
  const [formaPagamento, setFormaPagamento] = useState('PIX')
  const [exigeSinal, setExigeSinal] = useState(false)
  const [sinalRecebido, setSinalRecebido] = useState<number>(0)
  const [prazoPrometidoDias, setPrazoPrometidoDias] = useState<number>(5)

  // Form perda
  const [motivoPerda, setMotivoPerda] = useState<MotivoPerda>('Sem resposta após envio')

  const hojeStr = new Date().toISOString().split('T')[0]

  const handleSalvarOrcamento = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formClienteId) {
      toast({ title: 'Selecione um cliente para o orçamento', variant: 'destructive' })
      return
    }

    try {
      const orc = criarOrcamento({
        clienteId: formClienteId,
        produtoId: formProdutoId,
        quantidade: formQuantidade,
        frete: formFrete,
        desconto: formDesconto,
        validadeDias: formValidadeDias,
        observacoes: formObservacoes,
      })
      toast({
        title: 'Orçamento elaborado com sucesso! 💖',
        description: `${orc.numero} gerado com base na faixa oficial.`,
      })
      setShowModalNovo(false)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar orçamento'
      toast({ title: 'Erro', description: msg, variant: 'destructive' })
    }
  }

  const handleEnviar = (orcId: string) => {
    enviarOrcamento(orcId)
    toast({ title: 'Orçamento marcado como Enviado ao cliente!' })
  }

  const handleReemitir = (orcId: string) => {
    try {
      const reemitido = reemitirOrcamentoVencido(orcId, 7)
      toast({
        title: 'Orçamento reemitido com sucesso!',
        description: `Nova validade definida para ${formatarDataPtBR(reemitido.validade)}. Histórico preservado.`,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao reemitir'
      toast({ title: 'Erro', description: msg, variant: 'destructive' })
    }
  }

  const handleConfirmarAprovacao = () => {
    if (!showModalAprovar) return

    try {
      const pedido = aprovarOrcamentoParaPedido(showModalAprovar, {
        formaPagamento,
        exigeSinal,
        sinalRecebido: exigeSinal ? sinalRecebido : 0,
        prazoPrometidoDias,
      })
      toast({
        title: 'Venda aprovada com sucesso! 🎉',
        description: `Pedido ${pedido.numero} gerado. Próximo passo: Conferir e aprovar arquivo de arte.`,
      })
      setShowModalAprovar(null)
      navegarPara('produzir', 'controle-arte')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao aprovar orçamento'
      toast({ title: 'Atenção na Aprovação', description: msg, variant: 'destructive' })
    }
  }

  const handleConfirmarPerda = () => {
    if (!showModalPerda) return
    marcarOrcamentoPerdido(showModalPerda, motivoPerda)
    toast({ title: 'Orçamento arquivado como Perdido com motivo registrado.' })
    setShowModalPerda(null)
  }

  return (
    <div className="space-y-6">
      {/* Topo com Botão de Elaboração */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#F0E4E0] shadow-2xs flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold font-brand-serif text-[#4E342E]">
            Gestão de Orçamentos
          </h2>
          <p className="text-xs text-[#4E342E]/70 mt-0.5">
            Faixas de preço oficiais automáticas, histórico de reemissão e controle de validade.
          </p>
        </div>

        <button
          onClick={() => setShowModalNovo(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#FF1493] hover:bg-[#E01284] rounded-full shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Elaborar Orçamento</span>
        </button>
      </div>

      {/* Lista de Orçamentos */}
      <div className="space-y-3">
        {data.orcamentos.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-[#F0E4E0] text-gray-500 text-xs">
            Nenhum orçamento cadastrado ainda. Clique em "Elaborar Orçamento" para começar.
          </div>
        ) : (
          data.orcamentos.map((orc) => {
            const cliente = data.clientes.find((c) => c.id === orc.clienteId)
            const isVencido = orc.validade < hojeStr && orc.status !== 'Aprovado'

            return (
              <div
                key={orc.id}
                className="bg-white rounded-2xl p-4 sm:p-5 border border-[#F0E4E0] shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#FF1493] bg-[#FFF0F8] px-2.5 py-1 rounded-full border border-[#FF1493]/20">
                      {orc.numero}
                    </span>
                    <h3 className="text-sm font-bold text-[#4E342E]">
                      {cliente?.nome || 'Cliente não identificado'}
                    </h3>
                    <span className="text-xs text-gray-500">
                      ({cliente?.cidade}/{cliente?.estado})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                        orc.status === 'Aprovado'
                          ? 'bg-green-100 text-green-800'
                          : isVencido
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isVencido ? 'Vencido' : orc.status}
                    </span>
                  </div>
                </div>

                {/* Detalhes do Pedido e Preço */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-gray-50 rounded-xl text-xs">
                  <div>
                    <span className="text-gray-500 block text-[11px]">Quantidade Total</span>
                    <span className="font-bold text-[#4E342E]">{orc.quantidadeTotal} ímãs 5x5</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">Preço Unitário (Faixa)</span>
                    <span className="font-bold text-[#4E342E]">
                      {formatarMoeda(orc.precoUnitario)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">Frete + Desconto</span>
                    <span className="font-medium text-[#4E342E]">
                      Frete: {formatarMoeda(orc.frete)} | Desc: {formatarMoeda(orc.desconto)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">Valor Total</span>
                    <span className="font-bold text-[#FF1493] text-sm">
                      {formatarMoeda(orc.total)}
                    </span>
                  </div>
                </div>

                {/* Validade e Versão */}
                <div className="flex flex-wrap items-center justify-between text-xs text-[#4E342E]/70 pt-1">
                  <span>
                    Validade: <strong>{formatarDataPtBR(orc.validade)}</strong>
                    {isVencido && (
                      <span className="text-red-600 font-bold ml-1">
                        (Vencido - Exige reemissão antes de aprovar)
                      </span>
                    )}
                  </span>
                  <span>Histórico: Versão {orc.historicoVersoes.length}</span>
                </div>

                {/* Ações do Fluxo Comercial */}
                <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-end gap-2">
                  {orc.status === 'Orçamento elaborado' && (
                    <button
                      onClick={() => handleEnviar(orc.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-[#4E342E] bg-gray-100 hover:bg-gray-200 rounded-full flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5 text-[#FF1493]" />
                      <span>Marcar como Enviado</span>
                    </button>
                  )}

                  {isVencido && (
                    <button
                      onClick={() => handleReemitir(orc.id)}
                      className="px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-full flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reemitir com Nova Validade</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setComprovanteAtivo({
                        numero: orc.numero,
                        dataEmissao: orc.dataCriacao || new Date().toISOString(),
                        clienteNome: cliente?.nome || 'Cliente Cadastrada',
                        clienteDocumento: undefined,
                        clienteContato: cliente?.whatsapp || cliente?.telefoneRecado || undefined,
                        itens: [
                          {
                            descricao: `Ímãs Personalizados 5x5 (${orc.quantidadeTotal} unidades)`,
                            quantidade: orc.quantidadeTotal,
                            valorUnitarioCentavos: Math.round(orc.precoUnitario * 100),
                            subtotalCentavos: Math.round(
                              orc.quantidadeTotal * orc.precoUnitario * 100,
                            ),
                          },
                        ],
                        totalCentavos: Math.round(orc.total * 100),
                        formaPagamento: 'PIX / A Definir',
                        status: orc.status,
                        observacoes: orc.observacoes || undefined,
                      })
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-[#3D150B] bg-[#FFF8F4] border border-[#EEDFD7] hover:bg-[#FCE7F0] hover:text-[#E63980] rounded-full flex items-center gap-1"
                    title="Visualizar e imprimir comprovante oficial com emblema da marca"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#E63980]" />
                    <span>Comprovante</span>
                  </button>

                  {!isVencido && orc.status !== 'Aprovado' && orc.status !== 'Perdido' && (
                    <button
                      onClick={() => {
                        setShowModalAprovar(orc.id)
                        setExigeSinal(false)
                        setSinalRecebido(0)
                      }}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-full flex items-center gap-1 shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Aprovar Venda e Gerar Pedido</span>
                    </button>
                  )}

                  {orc.status !== 'Aprovado' && orc.status !== 'Perdido' && (
                    <button
                      onClick={() => setShowModalPerda(orc.id)}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-full"
                    >
                      Registrar Perda
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal Elaborar Novo Orçamento */}
      {showModalNovo && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#F0E4E0] max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold font-brand-serif text-[#4E342E] mb-3">
              Elaborar Novo Orçamento
            </h3>

            <form onSubmit={handleSalvarOrcamento} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#4E342E] mb-1">Cliente *</label>
                <select
                  value={formClienteId}
                  onChange={(e) => setFormClienteId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-white"
                  required
                >
                  <option value="">Selecione a cliente cadastrada...</option>
                  {data.clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} ({c.cidade} - {c.estado})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#4E342E] mb-1">Produto</label>
                  <select
                    value={formProdutoId}
                    onChange={(e) => setFormProdutoId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl bg-white"
                  >
                    {data.produtos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#4E342E] mb-1">Quantidade *</label>
                  <input
                    type="number"
                    min="1"
                    value={formQuantidade}
                    onChange={(e) => setFormQuantidade(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 border rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-[#4E342E] mb-1">Frete (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formFrete}
                    onChange={(e) => setFormFrete(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#4E342E] mb-1">Desconto (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formDesconto}
                    onChange={(e) => setFormDesconto(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#4E342E] mb-1">Validade (dias)</label>
                  <input
                    type="number"
                    min="1"
                    value={formValidadeDias}
                    onChange={(e) => setFormValidadeDias(parseInt(e.target.value) || 7)}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#4E342E] mb-1">Observações do Pedido</label>
                <textarea
                  value={formObservacoes}
                  onChange={(e) => setFormObservacoes(e.target.value)}
                  placeholder="Fotos de família, casamento, detalhes do envio..."
                  className="w-full px-3 py-2 border rounded-xl"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModalNovo(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#FF1493] hover:bg-[#E01284] text-white font-bold rounded-full"
                >
                  Gerar Orçamento Oficial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Aprovação de Venda (com Condição Explícita de Sinal) */}
      {showModalAprovar && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#F0E4E0] space-y-4">
            <h3 className="text-base font-bold font-brand-serif text-[#4E342E]">
              Aprovar Venda e Iniciar Pedido
            </h3>
            <p className="text-xs text-[#4E342E]/70 leading-relaxed">
              Ao aprovar, o orçamento vira um <strong>Pedido Oficial</strong> com monitoramento de
              prazo de entrega e necessidade de aprovação da arte.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#4E342E] mb-1">Forma de Pagamento</label>
                <select
                  value={formaPagamento}
                  onChange={(e) => setFormaPagamento(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl bg-white"
                >
                  <option value="PIX">PIX (Chave Ateliê)</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Dinheiro">Dinheiro na Entrega</option>
                </select>
              </div>

              {/* Regra de Negócio: Sinal combinado exige sinal_recebido > 0 */}
              <div className="p-3 bg-[#FFF0F8] rounded-xl border border-[#FF1493]/20 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="check-exige-sinal"
                    checked={exigeSinal}
                    onChange={(e) => setExigeSinal(e.target.checked)}
                    className="rounded text-[#FF1493] focus:ring-[#FF1493]"
                  />
                  <label
                    htmlFor="check-exige-sinal"
                    className="font-bold text-[#4E342E] cursor-pointer"
                  >
                    Foi combinado sinal prévio para iniciar?
                  </label>
                </div>

                {exigeSinal && (
                  <div>
                    <label className="block font-bold text-[#4E342E] mb-1">
                      Valor do Sinal Recebido (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={sinalRecebido}
                      onChange={(e) => setSinalRecebido(parseFloat(e.target.value) || 0)}
                      placeholder="Valor que o cliente já transferiu"
                      className="w-full px-3 py-2 border rounded-xl bg-white"
                      required
                    />
                    <span className="text-[10px] text-gray-500">
                      Regra obrigatória: A venda só conclui se o sinal recebido for maior que zero.
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-[#4E342E] mb-1">
                  Prazo Prometido ao Cliente (em dias)
                </label>
                <input
                  type="number"
                  min="1"
                  value={prazoPrometidoDias}
                  onChange={(e) => setPrazoPrometidoDias(parseInt(e.target.value) || 5)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowModalAprovar(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarAprovacao}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-full text-xs shadow-sm"
              >
                Confirmar Venda e Ir para Arte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Comprovante Oficial com Emblema da Marca */}
      <ModalComprovantePedido
        aberto={Boolean(comprovanteAtivo)}
        onFechar={() => setComprovanteAtivo(null)}
        pedido={comprovanteAtivo}
      />

      {/* Modal Registro de Motivo da Perda */}
      {showModalPerda && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-red-200 space-y-3">
            <h3 className="text-base font-bold font-brand-serif text-red-600">
              Registrar Perda do Orçamento
            </h3>
            <p className="text-xs text-[#4E342E]/70">
              Obrigatório registrar o motivo para análise de melhoria e conversão:
            </p>

            <select
              value={motivoPerda}
              onChange={(e) => setMotivoPerda(e.target.value as MotivoPerda)}
              className="w-full px-3 py-2 border rounded-xl bg-white text-xs"
            >
              <option value="Preço alto">Preço alto</option>
              <option value="Prazo longo">Prazo longo</option>
              <option value="Desistência do cliente">Desistência do cliente</option>
              <option value="Sem resposta após envio">Sem resposta após envio</option>
              <option value="Concorrente">Concorrente</option>
              <option value="Outro">Outro</option>
            </select>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowModalPerda(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarPerda}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full text-xs"
              >
                Confirmar Perda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
