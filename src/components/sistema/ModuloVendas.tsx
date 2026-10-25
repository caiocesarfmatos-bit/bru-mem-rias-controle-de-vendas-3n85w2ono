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
import {
  ShoppingCart,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Truck,
} from 'lucide-react'
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

  // Integração de Frete Automático no Pedido
  const [cepEntrega, setCepEntrega] = useState('')
  const [cidadeDestino, setCidadeDestino] = useState('Rio de Janeiro')
  const [ufDestino, setUfDestino] = useState('RJ')
  const [consultandoCepFrete, setConsultandoCepFrete] = useState(false)
  const [opcoesFrete, setOpcoesFrete] = useState<any[]>([])
  const [opcaoFreteSelecionada, setOpcaoFreteSelecionada] = useState<string>('SEM_FRETE')
  const [valorFreteCentavos, setValorFreteCentavos] = useState<number>(0)
  const [freteManualAtivo, setFreteManualAtivo] = useState(false)
  const [valorFreteManualReais, setValorFreteManualReais] = useState('')
  const [justificativaFreteManual, setJustificativaFreteManual] = useState('')
  const [avisoFrete, setAvisoFrete] = useState<string | null>(null)

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

  // Recalcular opções de frete quando destino ou quantidade mudarem
  const dispararCalculoFrete = async (ufAlvo: string, cidAlvo?: string, qtdItens?: number) => {
    try {
      const { calcularOpcoesFrete } = await import('@/services/frete')
      const qtd = qtdItens ?? (parseInt(quantidade, 10) || 1)
      const res = await calcularOpcoesFrete({
        uf: ufAlvo,
        cidade: cidAlvo,
        quantidadeItens: qtd,
      })
      setOpcoesFrete(res.opcoes)
      if (res.opcoes.length > 0) {
        // Seleciona a primeira opção mais econômica por padrão
        const primeira = res.opcoes[0]
        setOpcaoFreteSelecionada(primeira.faixa_id || primeira.nome)
        setValorFreteCentavos(primeira.preco_centavos)
        setFreteManualAtivo(false)
        setAvisoFrete(null)
      } else {
        setOpcaoFreteSelecionada('MANUAL')
        setFreteManualAtivo(true)
        setAvisoFrete(
          'Nenhuma faixa tarifária cobre o destino informado. Informe o frete manual com justificativa.',
        )
      }
    } catch {
      /* Cálculo silencioso */
    }
  }

  // Preenche dados do cliente ao selecionar
  useEffect(() => {
    const c = clientes.find((item) => item.id === clienteId)
    if (c) {
      const end = c.enderecos?.[0]
      if (end?.cep) {
        setCepEntrega(end.cep)
        setCidadeDestino(end.cidade || 'Rio de Janeiro')
        setUfDestino(end.uf || 'RJ')
        dispararCalculoFrete(end.uf || 'RJ', end.cidade, parseInt(quantidade, 10) || 1)
      }
    }
  }, [clienteId])

  // Atualiza valor de pagamento sugerido conforme quantidade * preco + frete
  useEffect(() => {
    const qtd = parseInt(quantidade, 10) || 0
    const precoCent = parseRealParaCentavos(precoUnitarioReais)
    const subtotal = qtd * precoCent
    const frete = freteManualAtivo
      ? parseRealParaCentavos(valorFreteManualReais)
      : valorFreteCentavos
    const tot = subtotal + frete
    setValorPag1Reais((tot / 100).toFixed(2).replace('.', ','))
  }, [quantidade, precoUnitarioReais, valorFreteCentavos, freteManualAtivo, valorFreteManualReais])

  const handleCriarPedido = async (e: React.FormEvent) => {
    e.preventDefault()
    setErroForm(null)
    try {
      const qtd = parseInt(quantidade, 10)
      const precoCent = parseRealParaCentavos(precoUnitarioReais)
      const valorPagCent = parseRealParaCentavos(valorPag1Reais)
      const freteEfetivoCentavos = freteManualAtivo
        ? parseRealParaCentavos(valorFreteManualReais)
        : valorFreteCentavos

      // Se manual, exige justificativa
      if (freteManualAtivo && freteEfetivoCentavos > 0 && !justificativaFreteManual.trim()) {
        setErroForm('Justificativa obrigatória para frete manual ou exceção tarifária.')
        return
      }

      // Constrói snapshot estático
      const optAtual = opcoesFrete.find((o) => (o.faixa_id || o.nome) === opcaoFreteSelecionada)
      const snapshotFrete = {
        faixa_id: optAtual?.faixa_id,
        nome_opcao:
          optAtual?.nome || (freteManualAtivo ? 'Frete Manual (Exceção)' : 'Retirada / Sem frete'),
        modalidade: optAtual?.modalidade || 'TRANSPORTADORA',
        preco_centavos: freteEfetivoCentavos,
        prazo_dias_estimado: optAtual?.prazo_dias_estimado || 0,
        cep_destino: cepEntrega,
        regiao_destino: ufDestino,
        uf_destino: ufDestino,
        cidade_destino: cidadeDestino,
        is_excecao_manual: freteManualAtivo,
        justificativa_excecao: freteManualAtivo ? justificativaFreteManual.trim() : undefined,
        calculado_em: new Date().toISOString(),
      }

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
        acrescimoCentavos: freteEfetivoCentavos,
        snapshotFrete,
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

              {/* Bloco de Frete e Destino (ViaCEP + Tabela Própria) */}
              <div className="p-3.5 bg-gray-50 border border-[#F0E4E0] rounded-md space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#FF1493] flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" />
                    Cálculo Automático de Frete (ViaCEP + Tabela Própria)
                  </span>
                  {consultandoCepFrete && (
                    <span className="text-xs text-[#FF1493] animate-pulse">Buscando CEP...</span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">CEP Destino (8 dígitos)</Label>
                    <Input
                      value={cepEntrega}
                      onChange={async (e) => {
                        const val = e.target.value
                        setCepEntrega(val)
                        const limpo = val.replace(/\D/g, '')
                        if (limpo.length === 8) {
                          setConsultandoCepFrete(true)
                          try {
                            const { consultarCep } = await import('@/services/viaCep')
                            const res = await consultarCep(limpo)
                            setCidadeDestino(res.cidade)
                            setUfDestino(res.uf)
                            await dispararCalculoFrete(
                              res.uf,
                              res.cidade,
                              parseInt(quantidade, 10) || 1,
                            )
                          } catch (err: any) {
                            setAvisoFrete(err.message || 'Erro ao consultar CEP.')
                          } finally {
                            setConsultandoCepFrete(false)
                          }
                        }
                      }}
                      placeholder="22790-700"
                      maxLength={9}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Cidade Destino</Label>
                    <Input
                      value={cidadeDestino}
                      onChange={(e) => setCidadeDestino(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">UF</Label>
                    <Input
                      value={ufDestino}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase()
                        setUfDestino(val)
                        if (val.length === 2) {
                          dispararCalculoFrete(val, cidadeDestino, parseInt(quantidade, 10) || 1)
                        }
                      }}
                      maxLength={2}
                    />
                  </div>
                </div>

                {/* Opções Sugeridas pela Tabela */}
                {opcoesFrete.length > 0 && (
                  <div className="space-y-1.5 pt-1 border-t border-gray-200">
                    <Label className="text-xs font-semibold text-[#4E342E]">
                      Modalidades Disponíveis para o Destino:
                    </Label>
                    <div className="space-y-1">
                      {opcoesFrete.map((opt) => {
                        const key = opt.faixa_id || opt.nome
                        const isSel = opcaoFreteSelecionada === key && !freteManualAtivo
                        return (
                          <div
                            key={key}
                            onClick={() => {
                              setOpcaoFreteSelecionada(key)
                              setValorFreteCentavos(opt.preco_centavos)
                              setFreteManualAtivo(false)
                            }}
                            className={`p-2 rounded border cursor-pointer flex items-center justify-between text-xs transition-colors ${
                              isSel
                                ? 'bg-pink-50 border-[#FF1493] text-[#4E342E] font-medium'
                                : 'bg-white border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                checked={isSel}
                                onChange={() => {}}
                                className="text-[#FF1493]"
                              />
                              <span>{opt.nome}</span>
                              <span className="text-[11px] text-gray-500">
                                ({opt.prazo_dias_estimado}d úteis)
                              </span>
                            </div>
                            <span className="font-bold">
                              {opt.preco_centavos === 0
                                ? 'Grátis'
                                : formatarCentavosParaReal(opt.preco_centavos)}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Opção Manual / Exceção com Justificativa */}
                <div className="pt-1 border-t border-gray-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs cursor-pointer font-medium text-[#4E342E]">
                      <input
                        type="checkbox"
                        checked={freteManualAtivo}
                        onChange={(e) => {
                          const ativo = e.target.checked
                          setFreteManualAtivo(ativo)
                          if (!ativo && opcoesFrete.length > 0) {
                            const primeira = opcoesFrete[0]
                            setOpcaoFreteSelecionada(primeira.faixa_id || primeira.nome)
                            setValorFreteCentavos(primeira.preco_centavos)
                          }
                        }}
                        className="text-[#FF1493] rounded"
                      />
                      Informar Frete Manual / Exceção Tarifária
                    </label>
                  </div>

                  {freteManualAtivo && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 bg-amber-50/70 border border-amber-200 rounded">
                      <div>
                        <Label className="text-[11px]">Valor do Frete Manual (R$)</Label>
                        <Input
                          value={valorFreteManualReais}
                          onChange={(e) => setValorFreteManualReais(e.target.value)}
                          placeholder="0,00"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px]">Justificativa Obrigatória</Label>
                        <Input
                          value={justificativaFreteManual}
                          onChange={(e) => setJustificativaFreteManual(e.target.value)}
                          placeholder="Ex: Entrega expressa atípica acordada com cliente"
                        />
                      </div>
                    </div>
                  )}

                  {avisoFrete && (
                    <p className="text-xs text-amber-800 bg-amber-50 p-2 rounded border border-amber-200">
                      {avisoFrete}
                    </p>
                  )}
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
                      (parseInt(quantidade, 10) || 0) * parseRealParaCentavos(precoUnitarioReais) +
                        (freteManualAtivo
                          ? parseRealParaCentavos(valorFreteManualReais)
                          : valorFreteCentavos),
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
