import React, { useState, useEffect } from 'react'
import {
  listarProdutosComPrecoESaldo,
  cadastrarProduto,
  listarCategorias,
} from '@/services/produtos'
import { lancarAjusteEstoque, listarMovimentosEstoque } from '@/services/estoque'
import { Produto, CategoriaProduto, MovimentoEstoque } from '@/types/sistema'
import {
  formatarCentavosParaReal,
  parseRealParaCentavos,
  formatarDataHoraPtBR,
} from '@/lib/formatters'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Package, Plus, SlidersHorizontal, History, AlertTriangle } from 'lucide-react'

export const ModuloCatalogoEstoque: React.FC = () => {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<CategoriaProduto[]>([])
  const [loading, setLoading] = useState(false)
  const [modalProdutoAberto, setModalProdutoAberto] = useState(false)
  const [modalAjusteAberto, setModalAjusteAberto] = useState(false)
  const [modalHistoricoAberto, setModalHistoricoAberto] = useState(false)
  const [historico, setHistorico] = useState<MovimentoEstoque[]>([])
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null)

  // Form states Produto
  const [sku, setSku] = useState('')
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [precoReais, setPrecoReais] = useState('')
  const [erroForm, setErroForm] = useState<string | null>(null)

  // Form states Ajuste
  const [qtdAjuste, setQtdAjuste] = useState('')
  const [justificativaAjuste, setJustificativaAjuste] = useState('')
  const [erroAjuste, setErroAjuste] = useState<string | null>(null)

  const carregarDados = async () => {
    setLoading(true)
    const [pData, cData] = await Promise.all([listarProdutosComPrecoESaldo(), listarCategorias()])
    setProdutos(pData)
    setCategorias(cData)
    setLoading(false)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  const handleCadastrarProduto = async (e: React.FormEvent) => {
    e.preventDefault()
    setErroForm(null)
    try {
      const centavos = parseRealParaCentavos(precoReais)
      await cadastrarProduto({
        sku,
        nome,
        descricao_curta: descricao,
        categoria: categoriaId,
        unidade_compra: 'UN',
        unidade_venda: 'UN',
        fator_conversao: 1,
        estoque_minimo: 20,
        preco_inicial_centavos: centavos,
        preco_minimo_centavos: Math.round(centavos * 0.8),
      })
      setModalProdutoAberto(false)
      setSku('')
      setNome('')
      setDescricao('')
      setPrecoReais('')
      carregarDados()
    } catch (err: any) {
      setErroForm(err.message || 'Erro ao cadastrar produto')
    }
  }

  const handleSalvarAjuste = async (e: React.FormEvent) => {
    e.preventDefault()
    setErroAjuste(null)
    if (!produtoSelecionado) return

    try {
      const qtd = parseInt(qtdAjuste, 10)
      if (isNaN(qtd) || qtd === 0) {
        throw new Error(
          'Informe uma quantidade válida (positiva para entrada ou negativa para saída).',
        )
      }

      await lancarAjusteEstoque({
        produtoId: produtoSelecionado.id,
        localId: 'pbc_3091176505', // Local padrão semeado
        quantidadeComSinal: qtd,
        custoUnitarioCentavos: 120,
        justificativa: justificativaAjuste,
      })

      setModalAjusteAberto(false)
      setQtdAjuste('')
      setJustificativaAjuste('')
      carregarDados()
    } catch (err: any) {
      setErroAjuste(err.message || 'Falha ao lançar ajuste')
    }
  }

  const abrirHistorico = async (p: Produto) => {
    setProdutoSelecionado(p)
    const movs = await listarMovimentosEstoque(p.id)
    setHistorico(movs)
    setModalHistoricoAberto(true)
  }

  return (
    <div className="space-y-6">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#4E342E] flex items-center gap-2">
            <Package className="w-6 h-6 text-[#FF1493]" />
            Catálogo & Estoque
          </h2>
          <p className="text-sm text-[#4E342E]/70">
            Produtos, tabela de preços vigentes e saldo calculado por movimentações imutáveis
          </p>
        </div>

        <Dialog open={modalProdutoAberto} onOpenChange={setModalProdutoAberto}>
          <DialogTrigger asChild>
            <Button className="bg-[#FF1493] hover:bg-[#D8117E] text-white">
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-xl font-serif font-bold text-[#4E342E]">
                Cadastrar Novo Item no Catálogo
              </DialogTitle>
            </DialogHeader>

            {erroForm && (
              <div className="p-3 bg-red-50 text-red-700 text-sm border border-red-200 rounded">
                {erroForm}
              </div>
            )}

            <form onSubmit={handleCadastrarProduto} className="space-y-4 text-[#4E342E]">
              <div>
                <Label>SKU (Código Único)</Label>
                <Input
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="EX: IMA-POL-7X7"
                />
              </div>

              <div>
                <Label>Nome do Produto</Label>
                <Input
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ímã Polaroid Grande 7x7 cm"
                />
              </div>

              <div>
                <Label>Preço de Venda Inicial (R$)</Label>
                <Input
                  required
                  value={precoReais}
                  onChange={(e) => setPrecoReais(e.target.value)}
                  placeholder="5,50"
                />
                <span className="text-[11px] text-[#4E342E]/60">
                  Armazenado na Tabela de Preço oficial vigente (R4).
                </span>
              </div>

              <div>
                <Label>Descrição Curta</Label>
                <Input
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Detalhes do corte e acabamento"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalProdutoAberto(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="bg-[#FF1493] hover:bg-[#D8117E] text-white">
                  Gravar Produto
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grid de Produtos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {produtos.map((p) => (
          <Card
            key={p.id}
            className="border border-[#F0E4E0] shadow-sm hover:shadow-md transition-shadow"
          >
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <CardTitle className="text-base font-bold text-[#4E342E]">{p.nome}</CardTitle>
                  <p className="text-xs font-mono text-[#FF1493] font-semibold">{p.sku}</p>
                </div>
                <div className="text-right">
                  <span className="text-base font-bold text-[#4E342E]">
                    {formatarCentavosParaReal(p.preco_vigente_centavos || 0)}
                  </span>
                  <p className="text-[10px] text-[#4E342E]/60 uppercase">Tabela Vigente</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 pt-2 space-y-3">
              <p className="text-xs text-[#4E342E]/70 line-clamp-2">
                {p.descricao_curta || 'Sem descrição cadastrada'}
              </p>

              <div className="p-3 bg-[#FAF7F6] rounded border border-[#F0E4E0] flex justify-between items-center">
                <div>
                  <span className="text-xs text-[#4E342E]/60 block">Saldo em Estoque</span>
                  <span className="text-lg font-bold text-[#4E342E]">
                    {p.saldo_estoque || 0} {p.unidade_venda}
                  </span>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setProdutoSelecionado(p)
                      setModalAjusteAberto(true)
                    }}
                    className="h-8 text-xs text-[#4E342E] border-[#E0D0CC]"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 mr-1 text-[#FF1493]" />
                    Ajustar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => abrirHistorico(p)}
                    className="h-8 text-xs text-[#4E342E]"
                  >
                    <History className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal Ajuste Manual de Estoque (R1) */}
      <Dialog open={modalAjusteAberto} onOpenChange={setModalAjusteAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-serif font-bold text-[#4E342E]">
              Ajuste de Inventário — {produtoSelecionado?.nome}
            </DialogTitle>
          </DialogHeader>

          {erroAjuste && (
            <div className="p-3 bg-red-50 text-red-700 text-sm border border-red-200 rounded flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{erroAjuste}</span>
            </div>
          )}

          <form onSubmit={handleSalvarAjuste} className="space-y-4 text-[#4E342E]">
            <div>
              <Label>Quantidade do Ajuste (com sinal)</Label>
              <Input
                required
                type="number"
                value={qtdAjuste}
                onChange={(e) => setQtdAjuste(e.target.value)}
                placeholder="Ex: +10 para sobra física ou -5 para perda"
              />
              <span className="text-[11px] text-[#4E342E]/60">
                Saldo atual: {produtoSelecionado?.saldo_estoque || 0}. O movimento será gravado de
                forma imutável (R1/R6).
              </span>
            </div>

            <div>
              <Label>Justificativa Obrigatória (R1)</Label>
              <Input
                required
                value={justificativaAjuste}
                onChange={(e) => setJustificativaAjuste(e.target.value)}
                placeholder="Ex: Contagem física quinzenal de conferência"
              />
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setModalAjusteAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#FF1493] hover:bg-[#D8117E] text-white">
                Registrar Movimento
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Histórico Imutável */}
      <Dialog open={modalHistoricoAberto} onOpenChange={setModalHistoricoAberto}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif font-bold text-[#4E342E]">
              Trilha de Movimentações — {produtoSelecionado?.nome}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            {historico.map((m) => (
              <div
                key={m.id}
                className="p-3 bg-[#FAF7F6] rounded border border-[#F0E4E0] text-xs space-y-1"
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold uppercase px-1.5 py-0.5 rounded bg-white border border-[#F0E4E0]">
                    {m.tipo}
                  </span>
                  <span
                    className={`font-bold font-mono text-sm ${m.quantidade > 0 ? 'text-green-700' : 'text-red-700'}`}
                  >
                    {m.quantidade > 0 ? `+${m.quantidade}` : m.quantidade}
                  </span>
                </div>
                <p className="text-[#4E342E]/80">{m.observacao || 'Sem observação'}</p>
                <div className="text-[11px] text-[#4E342E]/50 flex justify-between">
                  <span>{formatarDataHoraPtBR(m.data_hora)}</span>
                  <span>Doc: {m.documento_origem_tipo || 'Ajuste'}</span>
                </div>
              </div>
            ))}

            {historico.length === 0 && (
              <p className="text-center py-6 text-[#4E342E]/60 text-sm">
                Nenhuma movimentação registrada para este item.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
