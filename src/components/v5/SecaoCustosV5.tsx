import React, { useState } from 'react'
import { useAppV5 } from '@/context/AppV5Context'
import { CustoItem, CustoLancamento, CHAVES_PARAMETROS } from '@/types/appV5'
import {
  Coins,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  Percent,
  Layers,
  ArrowRight,
  Sliders,
} from 'lucide-react'
import { formatarMoeda, formatarNumero } from '@/lib/formatters'
import { useToast } from '@/hooks/use-toast'

export const SecaoCustosV5: React.FC = () => {
  const {
    data,
    custoTotalUnitarioAtual,
    adicionarLancamentoCusto,
    editarLancamentoCusto,
    excluirLancamentoCusto,
    adicionarItemCustoNaoCatalogado,
    atualizarCustoBaseItem,
    getParametro,
    navegarPara,
  } = useAppV5()
  const { toast } = useToast()

  const [itemSelecionadoId, setItemSelecionadoId] = useState<string>(data.custosItens[0]?.id || '')
  const [showModalNovoLancamento, setShowModalNovoLancamento] = useState<string | null>(null)
  const [showModalItemNaoCatalogado, setShowModalItemNaoCatalogado] = useState(false)
  const [showModalAjuda, setShowModalAjuda] = useState(false)

  // Form lançamento extra no item
  const [formLancData, setFormLancData] = useState(new Date().toISOString().split('T')[0])
  const [formLancDesc, setFormLancDesc] = useState('')
  const [formLancValor, setFormLancValor] = useState<number>(0)

  // Form item não catalogado
  const [formNovoItemNome, setFormNovoItemNome] = useState('')
  const [formNovoItemValor, setFormNovoItemValor] = useState<number>(0)
  const [formNovoItemDesc, setFormNovoItemDesc] = useState('')

  // Simulador de Sensibilidade da Margem
  const [simInsumoAumentoPct, setSimInsumoAumentoPct] = useState<number>(0) // Ex: +10%
  const [simDescontoReais, setSimDescontoReais] = useState<number>(0)
  const [simFreteAumentoReais, setSimFreteAumentoReais] = useState<number>(0)
  const [simTaxaCartaoPct, setSimTaxaCartaoPct] = useState<number>(3.5)

  const margemMinimaParam = getParametro(CHAVES_PARAMETROS.MARGEM_MINIMA_PCT) || 30

  // Preço de venda padrão de referência (Faixa 2: Rolo de Lembranças R$ 12,50)
  const precoReferenciaVenda = 12.5
  const custoUnitarioBase = custoTotalUnitarioAtual

  // Custo simulado
  const custoSimulado = custoUnitarioBase * (1 + simInsumoAumentoPct / 100)
  const precoEfetivoSimulado = Math.max(0.1, precoReferenciaVenda - simDescontoReais)
  const descontoCartaoReais = (precoEfetivoSimulado * simTaxaCartaoPct) / 100
  const lucroBrutoSimulado = precoEfetivoSimulado - custoSimulado - descontoCartaoReais
  const margemBrutaSimuladaPct = (lucroBrutoSimulado / precoEfetivoSimulado) * 100
  const markupSimulado = precoEfetivoSimulado / custoSimulado

  // Ponto de Equilíbrio (Custos Fixos Médios estimados / Margem de Contribuição)
  const custosFixosMensaisEstimados = 600.0 // Aluguel/energia/internet aproximados
  const margemContribuicaoPorIma = precoReferenciaVenda - custoUnitarioBase
  const pontoEquilibrioQuantidade =
    margemContribuicaoPorIma > 0
      ? Math.ceil(custosFixosMensaisEstimados / margemContribuicaoPorIma)
      : 0
  const pontoEquilibrioReais = pontoEquilibrioQuantidade * precoReferenciaVenda

  const handleSalvarLancamento = (e: React.FormEvent) => {
    e.preventDefault()
    if (!showModalNovoLancamento) return
    adicionarLancamentoCusto(showModalNovoLancamento, {
      data: formLancData,
      descricao: formLancDesc || 'Lançamento de insumo',
      valor: formLancValor,
    })
    toast({ title: 'Lançamento adicionado com sucesso! Custo total recalculado.' })
    setShowModalNovoLancamento(null)
    setFormLancDesc('')
    setFormLancValor(0)
  }

  const handleSalvarItemNaoCatalogado = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formNovoItemNome.trim()) {
      toast({ title: 'Nome do item obrigatório', variant: 'destructive' })
      return
    }
    adicionarItemCustoNaoCatalogado(formNovoItemNome, formNovoItemValor, formNovoItemDesc)
    toast({ title: 'Novo item de custo incluído na planilha!' })
    setShowModalItemNaoCatalogado(false)
    setFormNovoItemNome('')
    setFormNovoItemValor(0)
    setFormNovoItemDesc('')
  }

  return (
    <div className="space-y-6">
      {/* Topo com Custo Total por Unidade e Botões */}
      <div className="bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-[#FF1493]" />
            <h2 className="text-base font-bold font-brand-serif text-[#4E342E]">
              Custos de Produção do Ímã 5x5 cm
            </h2>
          </div>
          <p className="text-xs text-[#4E342E]/70 mt-0.5">
            Custo unitário sempre calculado automaticamente a partir dos insumos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Card Destacado do Custo Total */}
          <div className="px-4 py-2 bg-[#FFF0F8] rounded-xl border border-[#FF1493]/20 text-center">
            <span className="text-[10px] text-gray-500 block">Custo por Ímã</span>
            <span className="text-base font-bold text-[#FF1493]">
              {formatarMoeda(custoTotalUnitarioAtual)}
            </span>
          </div>

          <button
            onClick={() => setShowModalItemNaoCatalogado(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-[#4E342E] bg-gray-100 hover:bg-gray-200 rounded-full transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Incluir Item de Custo</span>
          </button>

          <button
            onClick={() => setShowModalAjuda(true)}
            className="p-2 text-gray-400 hover:text-[#FF1493] rounded-full hover:bg-[#FFF0F8] transition-colors"
            title="Explicação das Fórmulas de Precificação"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Grid de Itens de Custo com Botão "+" por Item */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.custosItens.map((item) => {
          const totalLancamentos = item.lancamentos.reduce((acc, l) => acc + (l.valor || 0), 0)
          const custoEfetivoItem =
            (item.custoBase + totalLancamentos) / (item.unidadesCobertas || 1)

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-4 border border-[#F0E4E0] shadow-2xs space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-gray-100">
                  <div>
                    <h3 className="text-xs font-bold text-[#4E342E]">{item.nome}</h3>
                    <span className="text-[10px] text-gray-500">
                      {item.isPadrao ? 'Insumo Base' : 'Item Adicional'}
                    </span>
                  </div>

                  <span className="text-xs font-bold text-[#FF1493]">
                    {formatarMoeda(custoEfetivoItem)}
                  </span>
                </div>

                {/* Histórico dos Lançamentos do Item */}
                <div className="pt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-gray-600">
                    <span>Base unitária:</span>
                    <span className="font-semibold">{formatarMoeda(item.custoBase)}</span>
                  </div>

                  {item.lancamentos.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] text-gray-400 block uppercase font-bold">
                        Extras ({item.lancamentos.length}):
                      </span>
                      {item.lancamentos.slice(0, 2).map((lanc) => (
                        <div
                          key={lanc.id}
                          className="flex items-center justify-between text-[10px] text-[#4E342E]/80 bg-gray-50 p-1.5 rounded-lg"
                        >
                          <span className="truncate max-w-[140px]">{lanc.descricao}</span>
                          <span className="font-bold">{formatarMoeda(lanc.valor)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Botão "+" por item para lançamentos extras */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={() => {
                    setShowModalNovoLancamento(item.id)
                    setFormLancDesc('')
                    setFormLancValor(0)
                  }}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#FF1493] hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Gasto</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Ponto de Equilíbrio e Margem vs Markup */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel Margem vs Markup */}
        <div className="bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-[#FF1493]" />
            <h3 className="text-sm font-bold font-brand-serif text-[#4E342E]">
              Margem de Lucro vs Markup (Lado a Lado)
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3.5 bg-[#FFF0F8] rounded-xl border border-[#FF1493]/20">
            <div>
              <span className="text-[11px] text-gray-500 block">Margem de Lucro Bruta</span>
              <span className="text-lg font-bold text-[#FF1493]">
                {formatarNumero(margemBrutaSimuladaPct, 1)}%
              </span>
              <span className="text-[10px] text-gray-500 block mt-0.5">
                Mínimo obrigatório: {margemMinimaParam}%
              </span>
            </div>

            <div>
              <span className="text-[11px] text-gray-500 block">Markup Multiplicador</span>
              <span className="text-lg font-bold text-[#4E342E]">
                {formatarNumero(markupSimulado, 2)}x
              </span>
              <span className="text-[10px] text-gray-500 block mt-0.5">Preço ÷ Custo Real</span>
            </div>
          </div>

          <p className="text-xs text-[#4E342E]/70 leading-relaxed">
            Margem mede a porcentagem que sobra do preço de venda após pagar o custo direto. Markup
            indica por quanto multiplicar o custo para atingir o valor cobrado da cliente.
          </p>
        </div>

        {/* Ponto de Equilíbrio Operacional */}
        <div className="bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="text-sm font-bold font-brand-serif text-[#4E342E]">
              Ponto de Equilíbrio Operacional
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3.5 bg-green-50 rounded-xl border border-green-200">
            <div>
              <span className="text-[11px] text-gray-500 block">Meta Mínima em Ímãs</span>
              <span className="text-lg font-bold text-green-800">
                {pontoEquilibrioQuantidade} unidades
              </span>
              <span className="text-[10px] text-gray-500 block mt-0.5">
                Para cobrir custos fixos
              </span>
            </div>

            <div>
              <span className="text-[11px] text-gray-500 block">Faturamento de Equilíbrio</span>
              <span className="text-lg font-bold text-green-800">
                {formatarMoeda(pontoEquilibrioReais)}
              </span>
              <span className="text-[10px] text-gray-500 block mt-0.5">Base R$ 600/mês fixos</span>
            </div>
          </div>

          <p className="text-xs text-[#4E342E]/70 leading-relaxed">
            Ao vender {pontoEquilibrioQuantidade} ímãs 5x5 cm no mês, você paga todas as despesas do
            ateliê e insumos. A partir deste número, todo pedido gera lucro limpo.
          </p>
        </div>
      </div>

      {/* Simulador de Sensibilidade da Margem */}
      <div className="bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-[#FF1493]" />
          <h3 className="text-sm font-bold font-brand-serif text-[#4E342E]">
            Simulador de Cenários e Sensibilidade da Margem
          </h3>
        </div>

        <p className="text-xs text-[#4E342E]/70">
          Altere as variáveis abaixo para testar o impacto de aumentos de insumos, frete e desconto
          na sua margem de lucro real:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-bold text-[#4E342E] mb-1">Insumo +%</label>
            <input
              type="number"
              value={simInsumoAumentoPct}
              onChange={(e) => setSimInsumoAumentoPct(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded-xl"
              placeholder="Ex: 10"
            />
          </div>

          <div>
            <label className="block font-bold text-[#4E342E] mb-1">Desconto no Pedido (R$)</label>
            <input
              type="number"
              step="0.5"
              value={simDescontoReais}
              onChange={(e) => setSimDescontoReais(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded-xl"
              placeholder="Ex: 1.00"
            />
          </div>

          <div>
            <label className="block font-bold text-[#4E342E] mb-1">Taxa de Cartão (%)</label>
            <input
              type="number"
              step="0.1"
              value={simTaxaCartaoPct}
              onChange={(e) => setSimTaxaCartaoPct(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded-xl"
            />
          </div>

          <div className="p-3 bg-gray-50 rounded-xl border flex flex-col justify-center">
            <span className="text-[10px] text-gray-500">Resultado da Margem:</span>
            <span
              className={`text-sm font-bold ${
                margemBrutaSimuladaPct < margemMinimaParam ? 'text-red-600' : 'text-green-700'
              }`}
            >
              {formatarNumero(margemBrutaSimuladaPct, 1)}%
              {margemBrutaSimuladaPct < margemMinimaParam && ' (Abaixo do Mínimo!)'}
            </span>
          </div>
        </div>
      </div>

      {/* Modal Adicionar Lançamento Extra por Item */}
      {showModalNovoLancamento && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#F0E4E0] space-y-4">
            <h3 className="text-base font-bold font-brand-serif text-[#4E342E]">
              Adicionar Lançamento de Gasto
            </h3>

            <form onSubmit={handleSalvarLancamento} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#4E342E] mb-1">Data</label>
                <input
                  type="date"
                  value={formLancData}
                  onChange={(e) => setFormLancData(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#4E342E] mb-1">Descrição</label>
                <input
                  type="text"
                  value={formLancDesc}
                  onChange={(e) => setFormLancDesc(e.target.value)}
                  placeholder="Ex: Compra de lote com reajuste"
                  className="w-full px-3 py-2 border rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#4E342E] mb-1">Valor Total Pago (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formLancValor}
                  onChange={(e) => setFormLancValor(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-xl"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModalNovoLancamento(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#FF1493] hover:bg-[#E01284] text-white font-bold rounded-full"
                >
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Item de Custo Não Catalogado */}
      {showModalItemNaoCatalogado && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#F0E4E0] space-y-4">
            <h3 className="text-base font-bold font-brand-serif text-[#4E342E]">
              Incluir Item de Custo Não Catalogado
            </h3>

            <form onSubmit={handleSalvarItemNaoCatalogado} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#4E342E] mb-1">Nome do Item *</label>
                <input
                  type="text"
                  value={formNovoItemNome}
                  onChange={(e) => setFormNovoItemNome(e.target.value)}
                  placeholder="Ex: Fita decorativa personalizada"
                  className="w-full px-3 py-2 border rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#4E342E] mb-1">
                  Custo Unitário Base (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formNovoItemValor}
                  onChange={(e) => setFormNovoItemValor(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#4E342E] mb-1">Descrição Opcional</label>
                <input
                  type="text"
                  value={formNovoItemDesc}
                  onChange={(e) => setFormNovoItemDesc(e.target.value)}
                  placeholder="Detalhes ou finalidade"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModalItemNaoCatalogado(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#FF1493] hover:bg-[#E01284] text-white font-bold rounded-full"
                >
                  Incluir no Cálculo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ajuda / Fórmulas Oficiais Obrigatórias */}
      {showModalAjuda && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#F0E4E0] space-y-4">
            <h3 className="text-base font-bold font-brand-serif text-[#4E342E]">
              Fórmulas e Conceitos de Precificação
            </h3>

            <div className="space-y-3 text-xs text-[#4E342E]/80 leading-relaxed">
              <div className="p-3 bg-[#FFF0F8] rounded-xl border border-[#FF1493]/20 space-y-1">
                <strong className="text-[#FF1493] block">Margem de Lucro (%):</strong>
                <code>Margem = (Lucro Bruto ÷ Preço de Venda) × 100</code>
                <p className="text-[11px] text-gray-600">
                  Exemplo: Um ímã vendido a R$ 12,50 com custo de R$ 3,40 gera R$ 9,10 de lucro
                  bruto. Margem = (9,10 ÷ 12,50) × 100 = 72,8%.
                </p>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl border space-y-1">
                <strong className="text-[#4E342E] block">Markup Multiplicador:</strong>
                <code>Markup = Preço de Venda ÷ Custo</code>
                <p className="text-[11px] text-gray-600">
                  Exemplo: R$ 12,50 ÷ R$ 3,40 = 3,67x sobre o custo.
                </p>
              </div>

              <div className="p-3 bg-green-50 rounded-xl border border-green-200 space-y-1">
                <strong className="text-green-800 block">Ponto de Equilíbrio (Break-Even):</strong>
                <code>Ponto de Equilíbrio = Custos Fixos ÷ Margem de Contribuição</code>
                <p className="text-[11px] text-green-900">
                  Indica quantos ímãs precisam ser produzidos no mês para pagar todas as despesas
                  básicas antes de lucrar.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowModalAjuda(false)}
                className="px-4 py-2 bg-[#4E342E] text-white font-bold rounded-full text-xs"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
