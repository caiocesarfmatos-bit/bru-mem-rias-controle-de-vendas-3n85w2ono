import React, { useState, useEffect } from 'react'
import {
  listarContasFinanceiras,
  listarCategoriasFinanceiras,
  listarLancamentosFinanceiros,
  criarLancamentoAvulso,
} from '@/services/financeiro'
import { listarFormasPagamento } from '@/services/tabelaValores'
import {
  ContaFinanceira,
  CategoriaFinanceira,
  LancamentoFinanceiro,
  TabelaValorItem,
  FormaPagamentoCodigo,
  TipoLancamentoFin,
} from '@/types/sistema'
import { formatarCentavosParaReal, formatarDataPtBR, parseRealParaCentavos } from '@/lib/formatters'
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
import { Landmark, ArrowUpRight, ArrowDownLeft, Plus, CheckCircle2, Clock } from 'lucide-react'

export const ModuloFinanceiro: React.FC = () => {
  const [contas, setContas] = useState<ContaFinanceira[]>([])
  const [categorias, setCategorias] = useState<CategoriaFinanceira[]>([])
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>([])
  const [formasPag, setFormasPag] = useState<TabelaValorItem[]>([])
  const [visao, setVisao] = useState<'todos' | 'realizado' | 'projetado'>('todos')
  const [loading, setLoading] = useState(false)
  const [modalAberto, setModalAberto] = useState(false)

  // Form states
  const [tipo, setTipo] = useState<TipoLancamentoFin>('saida')
  const [valorReais, setValorReais] = useState('')
  const [contaId, setContaId] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [competencia, setCompetencia] = useState(new Date().toISOString().substring(0, 10))
  const [vencimento, setVencimento] = useState(new Date().toISOString().substring(0, 10))
  const [pagamento, setPagamento] = useState(new Date().toISOString().substring(0, 10))
  const [status, setStatus] = useState<'previsto' | 'realizado'>('realizado')
  const [formaPag, setFormaPag] = useState<FormaPagamentoCodigo>('PIX')
  const [observacao, setObservacao] = useState('')
  const [erroForm, setErroForm] = useState<string | null>(null)

  const carregarDados = async () => {
    setLoading(true)
    const [cts, cats, lancs, fps] = await Promise.all([
      listarContasFinanceiras(),
      listarCategoriasFinanceiras(),
      listarLancamentosFinanceiros(visao),
      listarFormasPagamento(),
    ])
    setContas(cts)
    setCategorias(cats)
    setLancamentos(lancs)
    setFormasPag(fps)

    if (cts.length > 0 && !contaId) setContaId(cts[0].id)
    if (cats.length > 0 && !categoriaId) setCategoriaId(cats[0].id)
    setLoading(false)
  }

  useEffect(() => {
    carregarDados()
  }, [visao])

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErroForm(null)
    try {
      const centavos = parseRealParaCentavos(valorReais)
      await criarLancamentoAvulso({
        tipo,
        valorCentavos: centavos,
        contaId,
        categoriaId,
        dataCompetencia: new Date(competencia).toISOString(),
        dataVencimento: new Date(vencimento).toISOString(),
        dataPagamento: status === 'realizado' ? new Date(pagamento).toISOString() : undefined,
        status,
        formaPagamento: formaPag,
        observacao,
      })
      setModalAberto(false)
      setValorReais('')
      setObservacao('')
      carregarDados()
    } catch (err: any) {
      setErroForm(err.message || 'Erro ao lançar movimentação financeira')
    }
  }

  // Totais
  let totalEntradasCentavos = 0
  let totalSaidasCentavos = 0
  for (const l of lancamentos) {
    if (l.status === 'realizado') {
      if (l.tipo === 'entrada') totalEntradasCentavos += l.valor_centavos
      if (l.tipo === 'saida') totalSaidasCentavos += l.valor_centavos
    }
  }

  return (
    <div className="space-y-6">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl font-serif font-bold text-[#4E342E] flex items-center gap-2">
          <Landmark className="w-5 h-5 text-[#FF1493]" />
          Financeiro & Fluxo de Caixa
        </h2>

        <Dialog open={modalAberto} onOpenChange={setModalAberto}>
          <DialogTrigger asChild>
            <Button className="bg-[#FF1493] hover:bg-[#D8117E] text-white">
              <Plus className="w-4 h-4 mr-2" />
              Novo Lançamento Avulso
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-serif font-bold text-[#4E342E]">
                Lançamento Financeiro Avulso
              </DialogTitle>
            </DialogHeader>

            {erroForm && (
              <div className="p-3 bg-red-50 text-red-700 text-sm border border-red-200 rounded">
                {erroForm}
              </div>
            )}

            <form onSubmit={handleSalvar} className="space-y-4 text-[#4E342E]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo de Natureza</Label>
                  <Select value={tipo} onValueChange={(v: any) => setTipo(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Receita / Entrada (+)</SelectItem>
                      <SelectItem value="saida">Despesa / Saída (-)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Valor (R$)</Label>
                  <Input
                    required
                    value={valorReais}
                    onChange={(e) => setValorReais(e.target.value)}
                    placeholder="150,00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Conta Financeira</Label>
                  <Select value={contaId} onValueChange={setContaId} required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {contas.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Categoria do Plano</Label>
                  <Select value={categoriaId} onValueChange={setCategoriaId} required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Competência vs Liquidação */}
              <div className="p-3 bg-[#FFF0F5]/50 border border-[#F0E4E0] rounded-md grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Data Competência</Label>
                  <Input
                    required
                    type="date"
                    value={competencia}
                    onChange={(e) => setCompetencia(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Vencimento</Label>
                  <Input
                    required
                    type="date"
                    value={vencimento}
                    onChange={(e) => setVencimento(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Pagamento/Efetivação</Label>
                  <Input
                    type="date"
                    value={pagamento}
                    onChange={(e) => setPagamento(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Status do Título</Label>
                  <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realizado">Realizado (Compensado)</SelectItem>
                      <SelectItem value="previsto">Previsto (A pagar/receber)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Forma de Pagamento</Label>
                  <Select value={formaPag} onValueChange={(v: any) => setFormaPag(v)}>
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
              </div>

              <div>
                <Label>Observação / Justificativa</Label>
                <Input
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Ex: Compra de rolos de manta magnética no distribuidor"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setModalAberto(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-[#FF1493] hover:bg-[#D8117E] text-white">
                  Gravar Lançamento
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Contas & Saldo Atual */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {contas.map((c) => (
          <Card key={c.id} className="border border-[#F0E4E0] shadow-sm">
            <CardContent className="p-4">
              <span className="text-xs text-[#4E342E]/60 uppercase font-semibold block mb-1">
                {c.nome} ({c.tipo === 'caixa_fisico' ? 'Caixa Físico' : 'Banco'})
              </span>
              <span className="text-2xl font-bold text-[#4E342E]">
                {formatarCentavosParaReal(c.saldo_atual_centavos || 0)}
              </span>
            </CardContent>
          </Card>
        ))}

        <Card className="border border-[#F0E4E0] shadow-sm bg-gradient-to-br from-[#FFF0F5] to-white">
          <CardContent className="p-4">
            <span className="text-xs text-[#FF1493] uppercase font-semibold block mb-1">
              Resultado em Caixa (Realizado)
            </span>
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-bold text-[#4E342E]">
                {formatarCentavosParaReal(totalEntradasCentavos - totalSaidasCentavos)}
              </span>
              <span className="text-xs text-[#4E342E]/70">
                + {formatarCentavosParaReal(totalEntradasCentavos)} / -{' '}
                {formatarCentavosParaReal(totalSaidasCentavos)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtro de Visão: Realizado vs Projetado */}
      <div className="flex gap-2">
        <Button
          variant={visao === 'todos' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setVisao('todos')}
          className={visao === 'todos' ? 'bg-[#FF1493] text-white' : ''}
        >
          Todos os Títulos
        </Button>
        <Button
          variant={visao === 'realizado' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setVisao('realizado')}
          className={visao === 'realizado' ? 'bg-[#FF1493] text-white' : ''}
        >
          Caixa Realizado (Compensados)
        </Button>
        <Button
          variant={visao === 'projetado' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setVisao('projetado')}
          className={visao === 'projetado' ? 'bg-[#FF1493] text-white' : ''}
        >
          Caixa Projetado (A Vencer)
        </Button>
      </div>

      {/* Lista de Lançamentos */}
      <div className="space-y-2">
        {lancamentos.map((l) => {
          const isEntrada = l.tipo === 'entrada'
          const isRealizado = l.status === 'realizado'

          return (
            <div
              key={l.id}
              className="p-3 bg-white rounded border border-[#F0E4E0] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`p-1 rounded ${
                      isEntrada ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {isEntrada ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                    )}
                  </span>
                  <span className="font-semibold text-sm text-[#4E342E]">
                    {l.categoria_expand?.nome || 'Sem Categoria'}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      isRealizado ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {l.status}
                  </span>
                  {l.forma_pagamento && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#FFF0F5] text-[#FF1493] border border-[#FF1493]/20">
                      {l.forma_pagamento}
                    </span>
                  )}
                </div>

                <p className="text-[#4E342E]/70">{l.observacao || 'Lançamento sem observação'}</p>

                <div className="text-[11px] text-[#4E342E]/50 space-x-3">
                  <span>Competência: {formatarDataPtBR(l.data_competencia)}</span>
                  <span>Vencimento: {formatarDataPtBR(l.data_vencimento)}</span>
                  {l.data_pagamento && <span>Pago: {formatarDataPtBR(l.data_pagamento)}</span>}
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`text-base font-bold font-mono ${
                    isEntrada ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {isEntrada ? '+' : '-'} {formatarCentavosParaReal(l.valor_centavos)}
                </span>
                <span className="text-[10px] text-[#4E342E]/60 block uppercase">
                  {l.conta_expand?.nome}
                </span>
              </div>
            </div>
          )
        })}

        {lancamentos.length === 0 && !loading && (
          <div className="text-center py-12 text-[#4E342E]/60">
            Nenhum lançamento financeiro para o filtro selecionado.
          </div>
        )}
      </div>
    </div>
  )
}
