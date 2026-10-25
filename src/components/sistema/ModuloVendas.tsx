import React, { useState, useEffect } from 'react'
import { listarPedidos, criarPedidoCompleto, cancelarPedidoVenda } from '@/services/pedidos'
import { listarPessoas } from '@/services/pessoas'
import { listarProdutosComPrecoESaldo, listarLocaisEstoque } from '@/services/produtos'
import { listarFormasPagamento } from '@/services/tabelaValores'
import {
  PedidoVenda,
  Pessoa,
  Produto,
  LocalEstoque,
  TabelaValorItem,
  FormaPagamentoCodigo,
} from '@/types/sistema'
import {
  formatarCentavosParaReal,
  formatarDataHoraPtBR,
  parseRealParaCentavos,
} from '@/lib/formatters'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ShoppingCart, Plus, CheckCircle2, XCircle, AlertCircle, FileText } from 'lucide-react'
import { ModalComprovantePedido, ComprovantePedidoDados } from '@/components/ModalComprovantePedido'

export const ModuloVendas: React.FC = () => {
  const [pedidos, setPedidos] = useState<PedidoVenda[]>([])
  const [clientes, setClientes] = useState<Pessoa[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [locais, setLocais] = useState<LocalEstoque[]>([])
  const [formasPag, setFormasPag] = useState<TabelaValorItem[]>([])
  const [loading, setLoading] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)
  const [comprovanteAtivo, setComprovanteAtivo] = useState<ComprovantePedidoDados | null>(null)

  // Form states do novo pedido
  const [clienteId, setClienteId] = useState('')
  const [produtoId, setProdutoId] = useState('')
  const [localEstoqueId, setLocalEstoqueId] = useState('')
  const [quantidade, setQuantidade] = useState('10')
  const [precoUnitarioReais, setPrecoUnitarioReais] = useState('')
  const [formaPag1, setFormaPag1] = useState<FormaPagamentoCodigo>('PIX')
  const [valorPag1Reais, setValorPag1Reais] = useState('')
  const [observacao, setObservacao] = useState('')
  const [erroForm, setErroForm] = useState<string | null>(null)

  const carregarDados = async () => {
    setLoading(true)
    const [peds, clis, prods, locs, fps] = await Promise.all([
      listarPedidos(),
      listarPessoas('cliente'),
      listarProdutosComPrecoESaldo(),
      listarLocaisEstoque(),
      listarFormasPagamento(),
    ])
    setPedidos(peds)
    setClientes(clis)
    setProdutos(prods)
    setLocais(locs)
    setFormasPag(fps)

    if (locs.length > 0) setLocalEstoqueId(locs[0].id)
    if (prods.length > 0) {
      setProdutoId(prods[0].id)
      setPrecoUnitarioReais(
        ((prods[0].preco_vigente_centavos || 450) / 100).toFixed(2).replace('.', ','),
      )
    }
    setLoading(false)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  // Atualiza preço quando produto muda
  useEffect(() => {
    const p = produtos.find((item) => item.id === produtoId)
    if (p && p.preco_vigente_centavos) {
      setPrecoUnitarioReais((p.preco_vigente_centavos / 100).toFixed(2).replace('.', ','))
    }
  }, [produtoId, produtos])

  // Atualiza valor de pagamento sugerido conforme quantidade * preco
  useEffect(() => {
    const qtd = parseInt(quantidade, 10) || 0
    const precoCent = parseRealParaCentavos(precoUnitarioReais)
    const tot = qtd * precoCent
    setValorPag1Reais((tot / 100).toFixed(2).replace('.', ','))
  }, [quantidade, precoUnitarioReais])

  const handleCriarPedido = async (e: React.FormEvent) => {
    e.preventDefault()
    setErroForm(null)
    try {
      const qtd = parseInt(quantidade, 10)
      const precoCent = parseRealParaCentavos(precoUnitarioReais)
      const valorPagCent = parseRealParaCentavos(valorPag1Reais)
      const prod = produtos.find((p) => p.id === produtoId)

      await criarPedidoCompleto({
        clienteId,
        itens: [
          {
            produtoId,
            localEstoqueId,
            quantidade: qtd,
            precoUnitarioCentavos: precoCent,
            custoUnitarioCentavos: 120,
          },
        ],
        pagamentos: [
          {
            formaPagamento: formaPag1,
            valorCentavos: valorPagCent,
            status: 'aprovado',
          },
        ],
        observacao,
        confirmarImediatamente: true,
      })

      setModalAberto(false)
      setObservacao('')
      carregarDados()
    } catch (err: any) {
      setErroForm(err.message || 'Erro ao processar pedido')
    }
  }

  const handleCancelar = async (p: PedidoVenda) => {
    if (
      !window.confirm(
        `Deseja cancelar o Pedido #${p.numero_sequencial} e estornar estoque e financeiro?`,
      )
    )
      return
    try {
      await cancelarPedidoVenda(p.id, 'Cancelado via painel do administrador')
      carregarDados()
    } catch (err: any) {
      alert(err.message || 'Falha ao cancelar')
    }
  }

  return (
    <div className="space-y-6">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#4E342E] flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-[#FF1493]" />
            Vendas & Pedidos
          </h2>
          <p className="text-sm text-[#4E342E]/70">
            Pedidos confirmados com fechamento de pagamento estrito (R11) e baixa atômica de estoque
            (R7/R9)
          </p>
        </div>

        <Dialog open={modalAberto} onOpenChange={setModalAberto}>
          <DialogTrigger asChild>
            <Button className="bg-[#FF1493] hover:bg-[#D8117E] text-white">
              <Plus className="w-4 h-4 mr-2" />
              Novo Pedido de Venda
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-serif font-bold text-[#4E342E]">
                Lançar Pedido de Venda com Confirmação Imediata
              </DialogTitle>
            </DialogHeader>

            {erroForm && (
              <div className="p-3 bg-red-50 text-red-700 text-sm border border-red-200 rounded flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{erroForm}</span>
              </div>
            )}

            <form onSubmit={handleCriarPedido} className="space-y-4 text-[#4E342E]">
              <div>
                <Label>Cliente</Label>
                <Select value={clienteId} onValueChange={setClienteId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome_razao_social} ({c.documento})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <Label>Produto</Label>
                  <Select value={produtoId} onValueChange={setProdutoId} required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {produtos.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nome} (Saldo: {p.saldo_estoque || 0})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Quantidade</Label>
                  <Input
                    required
                    type="number"
                    min="1"
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Preço Unitário Praticado (R$)</Label>
                  <Input
                    required
                    value={precoUnitarioReais}
                    onChange={(e) => setPrecoUnitarioReais(e.target.value)}
                  />
                  <span className="text-[11px] text-[#4E342E]/60">
                    Gravado no item do pedido (R12).
                  </span>
                </div>
                <div>
                  <Label>Local de Estoque</Label>
                  <Select value={localEstoqueId} onValueChange={setLocalEstoqueId} required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {locais.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Seção Fechamento de Pagamento R11 */}
              <div className="p-4 bg-[#FFF0F5]/50 border border-[#F0E4E0] rounded-md space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#FF1493]">
                    Fechamento de Pagamento (Tolerância Zero R11)
                  </span>
                  <span className="text-xs font-mono font-bold text-[#4E342E]">
                    Total Esperado:{' '}
                    {formatarCentavosParaReal(
                      (parseInt(quantidade, 10) || 0) * parseRealParaCentavos(precoUnitarioReais),
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Forma de Pagamento (TabelaDeValores)</Label>
                    <Select value={formaPag1} onValueChange={(v: any) => setFormaPag1(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {formasPag.map((fp) => (
                          <SelectItem key={fp.codigo} value={fp.codigo}>
                            {fp.rotulo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Valor Informado (R$)</Label>
                    <Input
                      required
                      value={valorPag1Reais}
                      onChange={(e) => setValorPag1Reais(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label>Observação</Label>
                <Input
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Ex: Fotos recebidas via WhatsApp para ímãs de aniversário"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setModalAberto(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-[#FF1493] hover:bg-[#D8117E] text-white">
                  Confirmar e Baixar Estoque
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Listagem de Pedidos */}
      <div className="space-y-3">
        {pedidos.map((p) => {
          const isCancelado = p.status === 'cancelado'
          const isConfirmado = p.status === 'confirmado'

          return (
            <Card key={p.id} className="border border-[#F0E4E0] shadow-sm">
              <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#FF1493] text-base">
                      #{p.numero_sequencial}
                    </span>
                    <span
                      className={`text-xs font-semibold uppercase px-2 py-0.5 rounded-full ${
                        isConfirmado
                          ? 'bg-green-100 text-green-800'
                          : isCancelado
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {p.status}
                    </span>
                    <span className="text-xs text-[#4E342E]/60">
                      {formatarDataHoraPtBR(p.data_emissao)}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-[#4E342E]">
                    Cliente: {p.cliente_expand?.nome_razao_social || 'Carregando...'}
                  </p>

                  <div className="text-xs text-[#4E342E]/70 space-x-2">
                    <span>Itens: {p.itens?.length || 0}</span>
                    <span>•</span>
                    <span>
                      Pagamento:{' '}
                      {p.pagamentos && p.pagamentos.length > 0
                        ? p.pagamentos.map((pag) => pag.forma_pagamento).join(', ')
                        : '-'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-right">
                    <span className="text-lg font-bold text-[#4E342E] block">
                      {formatarCentavosParaReal(p.total_centavos)}
                    </span>
                    <span className="text-[10px] text-[#4E342E]/60 uppercase">Total Liquidado</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const contatoPref =
                          p.cliente_expand?.contatos?.find((c) => c.is_preferencial) ||
                          p.cliente_expand?.contatos?.[0]
                        const telefoneCliente =
                          contatoPref?.celular ||
                          contatoPref?.whatsapp ||
                          contatoPref?.telefone_fixo

                        setComprovanteAtivo({
                          numero: p.numero_sequencial,
                          dataEmissao: p.data_emissao,
                          clienteNome: p.cliente_expand?.nome_razao_social || 'Cliente Registrada',
                          clienteDocumento: p.cliente_expand?.documento || undefined,
                          clienteContato: telefoneCliente || undefined,
                          itens:
                            p.itens && p.itens.length > 0
                              ? p.itens.map((it: any) => ({
                                  descricao: it.descricao || 'Ímãs Personalizados 5x5',
                                  quantidade: it.quantidade || 1,
                                  valorUnitarioCentavos:
                                    it.preco_unitario_centavos || p.total_centavos,
                                  subtotalCentavos: it.subtotal_centavos || p.total_centavos,
                                }))
                              : [
                                  {
                                    descricao: 'Pacote de Ímãs Personalizados 5x5',
                                    quantidade: 1,
                                    valorUnitarioCentavos: p.total_centavos,
                                    subtotalCentavos: p.total_centavos,
                                  },
                                ],
                          totalCentavos: p.total_centavos,
                          formaPagamento:
                            p.pagamentos && p.pagamentos.length > 0
                              ? p.pagamentos.map((pag: any) => pag.forma_pagamento).join(', ')
                              : 'PIX / À Vista',
                          status: p.status,
                          observacoes: p.observacao || undefined,
                        })
                      }}
                      className="text-xs text-[#3D150B] border-[#EEDFD7] hover:bg-[#FFF8F4] hover:text-[#E63980]"
                      title="Visualizar e imprimir comprovante oficial com o emblema da marca"
                    >
                      <FileText className="w-3.5 h-3.5 mr-1 text-[#E63980]" />
                      Comprovante
                    </Button>

                    {isConfirmado && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelar(p)}
                        className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <XCircle className="w-3.5 h-3.5 mr-1" />
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {/* Modal de Comprovante Oficial com Emblema da Marca */}
        <ModalComprovantePedido
          aberto={Boolean(comprovanteAtivo)}
          onFechar={() => setComprovanteAtivo(null)}
          pedido={comprovanteAtivo}
        />

        {pedidos.length === 0 && !loading && (
          <div className="text-center py-12 text-[#4E342E]/60">
            Nenhum pedido de venda registrado até o momento.
          </div>
        )}
      </div>
    </div>
  )
}
