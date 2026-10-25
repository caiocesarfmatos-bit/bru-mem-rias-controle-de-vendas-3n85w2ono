// src/components/sistema/ModuloMateriaPrimaProducao.tsx
// Módulo de Matéria-Prima, Fichas de Rendimento e Calculadora Operacional de Produção

import React, { useState, useEffect } from 'react'
import {
  InsumoProducao,
  FichaProducao,
  ResultadoCalculoProducao,
  listarInsumosProducao,
  salvarInsumoProducao,
  listarFichasProducao,
  salvarFichaProducao,
  calcularConsumoProducao,
} from '@/services/producao'
import { formatarCentavosParaReal, parseRealParaCentavos } from '@/lib/formatters'
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
import {
  Boxes,
  Calculator,
  Plus,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Layers,
  Sparkles,
  BarChart3,
  DollarSign,
} from 'lucide-react'

export const ModuloMateriaPrimaProducao: React.FC = () => {
  const [insumos, setInsumos] = useState<InsumoProducao[]>([])
  const [fichas, setFichas] = useState<FichaProducao[]>([])
  const [loading, setLoading] = useState(false)
  const [modalInsumoAberto, setModalInsumoAberto] = useState(false)
  const [modalFichaAberta, setModalFichaAberta] = useState(false)

  // Calculadora operacional
  const [qtdSimulada, setQtdSimulada] = useState<string>('50')
  const [precoVendaSimuladoReais, setPrecoVendaSimuladoReais] = useState<string>('4,50')
  const [resultadoCalculo, setResultadoCalculo] = useState<ResultadoCalculoProducao | null>(null)

  // Form states insumo
  const [codigoInsumo, setCodigoInsumo] = useState('')
  const [nomeInsumo, setNomeInsumo] = useState('')
  const [categoriaInsumo, setCategoriaInsumo] = useState('Mantas')
  const [unidadeMedida, setUnidadeMedida] = useState('folha')
  const [custoReais, setCustoReais] = useState('1,80')
  const [estoqueAtual, setEstoqueAtual] = useState('100')
  const [estoqueMinimo, setEstoqueMinimo] = useState('20')
  const [fornecedorNome, setFornecedorNome] = useState('')
  const [observacaoInsumo, setObservacaoInsumo] = useState('')
  const [erroForm, setErroForm] = useState<string | null>(null)

  const carregarDados = async () => {
    setLoading(true)
    const [ins, fics] = await Promise.all([listarInsumosProducao(), listarFichasProducao()])
    setInsumos(ins)
    setFichas(fics)
    setLoading(false)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  // Recalcula sempre que a quantidade ou fichas/insumos mudarem
  useEffect(() => {
    const qtd = parseInt(qtdSimulada, 10) || 0
    const precoCent = parseRealParaCentavos(precoVendaSimuladoReais) || 450
    if (qtd > 0 && fichas.length > 0) {
      const calc = calcularConsumoProducao(qtd, fichas, insumos, precoCent)
      setResultadoCalculo(calc)
    } else {
      setResultadoCalculo(null)
    }
  }, [qtdSimulada, precoVendaSimuladoReais, fichas, insumos])

  const handleSalvarInsumo = async (e: React.FormEvent) => {
    e.preventDefault()
    setErroForm(null)
    try {
      const custoCent = parseRealParaCentavos(custoReais)
      await salvarInsumoProducao({
        codigo: codigoInsumo.trim().toUpperCase(),
        nome: nomeInsumo.trim(),
        categoria: categoriaInsumo.trim(),
        unidade_medida: unidadeMedida.trim(),
        custo_unitario_centavos: custoCent,
        estoque_atual: parseFloat(estoqueAtual) || 0,
        estoque_minimo: parseFloat(estoqueMinimo) || 0,
        fornecedor_nome: fornecedorNome.trim(),
        observacao: observacaoInsumo.trim(),
      })
      setModalInsumoAberto(false)
      setCodigoInsumo('')
      setNomeInsumo('')
      carregarDados()
    } catch (err: any) {
      setErroForm(err.message || 'Erro ao cadastrar insumo')
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#4E342E] flex items-center gap-2">
            <Boxes className="w-6 h-6 text-[#FF1493]" />
            Matéria-Prima & Produção
          </h2>
          <p className="text-sm text-[#4E342E]/70">
            Controle de insumos, cálculo de rendimento operacional e estimativa de consumo por lote
          </p>
        </div>

        <Dialog open={modalInsumoAberto} onOpenChange={setModalInsumoAberto}>
          <DialogTrigger asChild>
            <Button className="bg-[#FF1493] hover:bg-[#D8117E] text-white">
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Insumo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-serif font-bold text-[#4E342E]">
                Novo Insumo / Matéria-Prima
              </DialogTitle>
            </DialogHeader>

            {erroForm && (
              <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded border border-red-200">
                {erroForm}
              </div>
            )}

            <form onSubmit={handleSalvarInsumo} className="space-y-3 text-[#4E342E]">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Código / SKU</Label>
                  <Input
                    required
                    value={codigoInsumo}
                    onChange={(e) => setCodigoInsumo(e.target.value)}
                    placeholder="EX: MAN-MAG-03"
                  />
                </div>
                <div>
                  <Label className="text-xs">Unidade de Medida</Label>
                  <Input
                    required
                    value={unidadeMedida}
                    onChange={(e) => setUnidadeMedida(e.target.value)}
                    placeholder="folha, un, ml, m"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Nome do Insumo</Label>
                <Input
                  required
                  value={nomeInsumo}
                  onChange={(e) => setNomeInsumo(e.target.value)}
                  placeholder="Nome comercial da matéria-prima"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs">Custo Unitário (R$)</Label>
                  <Input
                    required
                    value={custoReais}
                    onChange={(e) => setCustoReais(e.target.value)}
                    placeholder="1,80"
                  />
                </div>
                <div>
                  <Label className="text-xs">Estoque Atual</Label>
                  <Input
                    required
                    type="number"
                    value={estoqueAtual}
                    onChange={(e) => setEstoqueAtual(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Estoque Mínimo</Label>
                  <Input
                    type="number"
                    value={estoqueMinimo}
                    onChange={(e) => setEstoqueMinimo(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Categoria</Label>
                  <Input
                    value={categoriaInsumo}
                    onChange={(e) => setCategoriaInsumo(e.target.value)}
                    placeholder="Papéis, Mantas, Embalagem"
                  />
                </div>
                <div>
                  <Label className="text-xs">Fornecedor</Label>
                  <Input
                    value={fornecedorNome}
                    onChange={(e) => setFornecedorNome(e.target.value)}
                    placeholder="Nome do fornecedor"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Observações Operacionais</Label>
                <Input
                  value={observacaoInsumo}
                  onChange={(e) => setObservacaoInsumo(e.target.value)}
                  placeholder="Instruções de corte ou armazenamento"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setModalInsumoAberto(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-[#FF1493] hover:bg-[#D8117E] text-white">
                  Gravar Insumo
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* CALCULADORA DE PRODUÇÃO (NECESSIDADE EXPRESSA DO ADMINISTRADOR) */}
      <Card className="border-2 border-[#FF1493]/30 bg-gradient-to-br from-white via-[#FFF8FA] to-[#FFF0F8] shadow-sm">
        <CardHeader className="p-4 pb-2 border-b border-[#FF1493]/15">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#FF1493]" />
              <CardTitle className="text-base font-bold text-[#4E342E]">
                Calculadora Operacional de Produção & Rendimento
              </CardTitle>
            </div>
            <span className="text-xs text-[#4E342E]/70">
              Produto Base: <strong>Ímãs Polaroid 5x5 cm (Lote Customizável)</strong>
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end bg-white/80 p-3 rounded-lg border border-[#F0E4E0]">
            <div>
              <Label className="text-xs font-semibold text-[#4E342E]">
                Quantos produtos deseja produzir?
              </Label>
              <Input
                type="number"
                min="1"
                value={qtdSimulada}
                onChange={(e) => setQtdSimulada(e.target.value)}
                className="text-lg font-bold text-[#FF1493] h-11"
                placeholder="Ex: 50"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-[#4E342E]">
                Preço de Venda Unitário Praticado (R$)
              </Label>
              <Input
                value={precoVendaSimuladoReais}
                onChange={(e) => setPrecoVendaSimuladoReais(e.target.value)}
                className="text-lg font-bold text-[#4E342E] h-11"
                placeholder="4,50"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQtdSimulada('24')}
                className="flex-1 text-xs h-11"
              >
                24 un
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQtdSimulada('50')}
                className="flex-1 text-xs h-11"
              >
                50 un
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQtdSimulada('100')}
                className="flex-1 text-xs h-11"
              >
                100 un
              </Button>
            </div>
          </div>

          {resultadoCalculo && (
            <div className="space-y-4 pt-1">
              {/* KPIs de Custo e Margem Operacional */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-white rounded-lg border border-[#F0E4E0] shadow-sm">
                  <span className="text-[11px] uppercase tracking-wider text-[#4E342E]/70 block font-medium">
                    Custo Total Matéria-Prima
                  </span>
                  <span className="text-lg font-bold text-[#4E342E]">
                    {formatarCentavosParaReal(resultadoCalculo.custoTotalInsumosCentavos)}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-lg border border-[#F0E4E0] shadow-sm">
                  <span className="text-[11px] uppercase tracking-wider text-[#4E342E]/70 block font-medium">
                    Custo Unitário por Ímã
                  </span>
                  <span className="text-lg font-bold text-[#4E342E]">
                    {formatarCentavosParaReal(resultadoCalculo.custoUnitarioPorProdutoCentavos)}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-lg border border-[#F0E4E0] shadow-sm">
                  <span className="text-[11px] uppercase tracking-wider text-[#4E342E]/70 block font-medium">
                    Margem Bruta Unitária
                  </span>
                  <span className="text-lg font-bold text-emerald-700">
                    {formatarCentavosParaReal(resultadoCalculo.margemBrutaUnitarioCentavos)}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-lg border border-[#F0E4E0] shadow-sm">
                  <span className="text-[11px] uppercase tracking-wider text-[#4E342E]/70 block font-medium">
                    Margem Operacional (%)
                  </span>
                  <span className="text-lg font-bold text-[#FF1493]">
                    {resultadoCalculo.margemBrutaPct}%
                  </span>
                </div>
              </div>

              {/* Status de Disponibilidade em Estoque */}
              <div
                className={`p-3 rounded-md flex items-center justify-between text-xs border ${
                  resultadoCalculo.todosInsumosDisponiveis
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {resultadoCalculo.todosInsumosDisponiveis ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  )}
                  <span>
                    {resultadoCalculo.todosInsumosDisponiveis
                      ? `Estoque suficiente para produzir as ${resultadoCalculo.quantidadeDesejada} unidades sem faltas.`
                      : `Atenção: há insumos insuficientes em estoque para atender este lote completo.`}
                  </span>
                </div>
              </div>

              {/* ANÁLISE GRÁFICA DE CONSUMO OPERACIONAL (REQUISITO DA ADMINISTRAÇÃO) */}
              <div className="p-4 bg-white rounded-lg border border-[#F0E4E0] space-y-3">
                <div className="flex items-center justify-between border-b border-[#F0E4E0] pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#4E342E] flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4 text-[#FF1493]" />
                    Análise Gráfica: Consumo de Insumos vs. Estoque Disponível
                  </h4>
                  <span className="text-[11px] text-[#4E342E]/60">
                    Lote: {resultadoCalculo.quantidadeDesejada} unidades
                  </span>
                </div>

                <div className="space-y-3 pt-1">
                  {resultadoCalculo.itens.map((item) => {
                    const pctConsumo =
                      item.estoqueAtual > 0
                        ? Math.min(
                            100,
                            Math.round((item.consumoComPerda / item.estoqueAtual) * 100),
                          )
                        : 100

                    return (
                      <div key={item.insumoId} className="space-y-1">
                        <div className="flex justify-between text-xs text-[#4E342E]">
                          <span className="font-semibold">
                            {item.insumoNome} ({item.insumoCodigo})
                          </span>
                          <span className="text-[#4E342E]/80">
                            Necessário:{' '}
                            <strong>
                              {item.consumoComPerda} {item.unidadeMedida}
                            </strong>{' '}
                            | Estoque:{' '}
                            <strong>
                              {item.estoqueAtual} {item.unidadeMedida}
                            </strong>{' '}
                            | Custo:{' '}
                            <strong>{formatarCentavosParaReal(item.custoTotalItemCentavos)}</strong>
                          </span>
                        </div>

                        {/* Barra Gráfica de Progresso */}
                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden flex">
                          <div
                            className={`h-full transition-all duration-300 ${
                              item.estoqueSuficiente ? 'bg-[#FF1493]' : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.max(5, pctConsumo)}%` }}
                          />
                        </div>

                        <div className="flex justify-between text-[10px] text-[#4E342E]/60">
                          <span>Consumo estimado: {pctConsumo}% do estoque atual</span>
                          <span
                            className={item.saldoAposProducao < 0 ? 'text-rose-600 font-bold' : ''}
                          >
                            Saldo projetado pós-produção: {item.saldoAposProducao}{' '}
                            {item.unidadeMedida}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabela de Insumos Cadastrados */}
      <Card className="border border-[#F0E4E0] shadow-sm">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base font-bold text-[#4E342E] flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#FF1493]" />
              Catálogo de Matérias-Primas ({insumos.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-1">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-[#4E342E]">
              <thead className="bg-[#FFF0F8] text-[#4E342E] uppercase font-bold text-[10px] border-b border-[#F0E4E0]">
                <tr>
                  <th className="p-2.5">Código / Nome</th>
                  <th className="p-2.5">Categoria</th>
                  <th className="p-2.5">Unidade</th>
                  <th className="p-2.5">Custo Unitário</th>
                  <th className="p-2.5">Estoque Atual</th>
                  <th className="p-2.5">Estoque Mínimo</th>
                  <th className="p-2.5">Fornecedor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0E4E0]">
                {insumos.map((ins) => (
                  <tr key={ins.id} className="hover:bg-gray-50/80">
                    <td className="p-2.5">
                      <div className="font-bold">{ins.nome}</div>
                      <span className="text-[10px] text-[#4E342E]/60 font-mono">{ins.codigo}</span>
                    </td>
                    <td className="p-2.5">{ins.categoria || '-'}</td>
                    <td className="p-2.5 uppercase font-medium">{ins.unidade_medida}</td>
                    <td className="p-2.5 font-bold text-[#FF1493]">
                      {formatarCentavosParaReal(ins.custo_unitario_centavos)}
                    </td>
                    <td className="p-2.5 font-semibold">
                      {ins.estoque_atual} {ins.unidade_medida}
                    </td>
                    <td className="p-2.5 text-[#4E342E]/70">
                      {ins.estoque_minimo || 0} {ins.unidade_medida}
                    </td>
                    <td className="p-2.5 text-[#4E342E]/80">{ins.fornecedor_nome || '-'}</td>
                  </tr>
                ))}
                {insumos.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-[#4E342E]/60">
                      Nenhuma matéria-prima cadastrada no momento.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
