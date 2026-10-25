import React, { useState, useEffect } from 'react'
import { useApp } from '@/context/AppContext'
import {
  formatarMoeda,
  formatarNumero,
  TABELA_PRECOS_OFICIAL,
  obterPrecoOficial,
} from '@/lib/formatters'
import { OrderStatus } from '@/types/app'
import { useToast } from '@/hooks/use-toast'
import {
  Calculator,
  AlertTriangle,
  CheckCircle2,
  BookmarkPlus,
  Sparkles,
  ArrowRight,
  Percent,
  Sliders,
  DollarSign,
  TrendingUp,
  Tag,
} from 'lucide-react'

export const ModuloCalculadora: React.FC = () => {
  const {
    data,
    activeProduct,
    setActiveProductId,
    settings,
    updateSettings,
    addPedidoCliente,
    setActiveTab,
  } = useApp()

  const { toast } = useToast()

  // Calcular custo unitário padrão a partir do produto selecionado no Módulo 1
  const loteUnidades = Math.max(1, activeProduct.unidadesLote || 100)
  const custoTotalLote = activeProduct.itens.reduce((acc, it) => {
    const somaExtras = it.lancamentos.reduce((s, l) => s + l.valor, 0)
    return acc + it.custoBase + somaExtras
  }, 0)
  const custoUnitarioCalculado = Number((custoTotalLote / loteUnidades).toFixed(2))

  // Estados principais da calculadora de pedido
  const [quantidade, setQuantidade] = useState<number>(2)
  const [precoUnitario, setPrecoUnitario] = useState<number>(14.99)
  const [custoUnitario, setCustoUnitario] = useState<number>(custoUnitarioCalculado)

  // Atualizar custoUnitario sempre que o produto selecionado mudar
  useEffect(() => {
    setCustoUnitario(custoUnitarioCalculado)
  }, [activeProduct.id, custoUnitarioCalculado])

  // Deduções adicionais
  const [desconto, setDesconto] = useState<number>(0)
  const [impostosPct, setImpostosPct] = useState<number>(0)
  const [taxaCartaoPct, setTaxaCartaoPct] = useState<number>(3.5) // Padrão típico maquininha cartão
  const [frete, setFrete] = useState<number>(0)

  // Configuração de Margem Mínima
  const margemMinimaConfig = settings.margemMinimaPct || 40

  // Estado para Modal "Salvar Pedido no Cliente"
  const [showSalvarModal, setShowSalvarModal] = useState(false)
  const [clienteSelecionadoId, setClienteSelecionadoId] = useState<string>(
    data.clientes[0]?.id || '',
  )
  const [statusPedido, setStatusPedido] = useState<OrderStatus>('Fechado')
  const [dataPedido, setDataPedido] = useState<string>(new Date().toISOString().split('T')[0])
  const [observacoesPedido, setObservacoesPedido] = useState<string>('')

  // CÁLCULOS AO VIVO
  const qtdSegura = Math.max(1, Math.round(quantidade || 1))
  const precoSeguro = Math.max(0, precoUnitario || 0)
  const custoSeguro = Math.max(0, custoUnitario || 0)

  const receitaBruta = qtdSegura * precoSeguro
  const custoTotalProdutos = qtdSegura * custoSeguro
  const lucroBruto = Math.max(0, receitaBruta - custoTotalProdutos)
  const margemBrutaPct = receitaBruta > 0 ? (lucroBruto / receitaBruta) * 100 : 0

  // Deduções detalhadas
  const valorDesconto = Math.max(0, Math.min(receitaBruta, desconto || 0))
  const receitaAposDesconto = Math.max(0, receitaBruta - valorDesconto)
  const valorImpostos = (receitaAposDesconto * Math.max(0, impostosPct || 0)) / 100
  const valorTaxaCartao = (receitaAposDesconto * Math.max(0, taxaCartaoPct || 0)) / 100
  const valorFrete = Math.max(0, frete || 0)

  const deducoesTotais = valorDesconto + valorImpostos + valorTaxaCartao + valorFrete
  const lucroLiquido = Math.max(0, receitaBruta - custoTotalProdutos - deducoesTotais)
  const margemLiquidaPct = receitaBruta > 0 ? (lucroLiquido / receitaBruta) * 100 : 0

  // Ponto de equilíbrio em unidades (Breakeven)
  // Ponto de equilíbrio = custo unitário / preço unitário (ou despesas fixas / margem de contribuição)
  const pontoEquilibrioUnidades = precoSeguro > 0 ? Math.ceil(custoTotalProdutos / precoSeguro) : 0

  // Margem abaixo do alerta
  const alertaMargemBaixa = margemLiquidaPct < margemMinimaConfig

  // Preço oficial correspondente à quantidade atual
  const precoOficialSugerido = obterPrecoOficial(qtdSegura)
  const faixaOficialAtual = TABELA_PRECOS_OFICIAL.find(
    (f) => qtdSegura >= f.min && qtdSegura <= f.max,
  )

  // Presets de Cenários (Avulso, Kit, Festa, Atacado)
  const aplicarPreset = (tipo: 'avulso' | 'kit' | 'festa' | 'atacado') => {
    switch (tipo) {
      case 'avulso':
        setQuantidade(2)
        setPrecoUnitario(14.99)
        setDesconto(0)
        setFrete(0)
        break
      case 'kit':
        setQuantidade(3)
        setPrecoUnitario(13.3) // kit de 3 por ~39,90 total
        setDesconto(0)
        setFrete(0)
        break
      case 'festa':
        setQuantidade(20)
        setPrecoUnitario(12.5)
        setDesconto(10)
        setFrete(15)
        break
      case 'atacado':
        setQuantidade(50)
        setPrecoUnitario(10.5)
        setDesconto(25)
        setFrete(20)
        break
    }
    toast({
      title: `Preset ${tipo.toUpperCase()} aplicado!`,
      description: 'Valores atualizados na calculadora.',
    })
  }

  // Ação de Salvar Pedido no Cliente
  const handleSalvarPedido = () => {
    if (!clienteSelecionadoId) {
      toast({
        title: 'Nenhum cliente cadastrado',
        description: 'Cadastre um cliente primeiro no Módulo 3.',
        variant: 'destructive',
      })
      return
    }

    addPedidoCliente(clienteSelecionadoId, {
      produtoId: activeProduct.id,
      produtoNome: activeProduct.nome,
      data: dataPedido,
      quantidade: qtdSegura,
      precoUnitario: precoSeguro,
      custoUnitario: custoSeguro,
      desconto: valorDesconto,
      impostosPct: impostosPct || 0,
      taxaCartaoPct: taxaCartaoPct || 0,
      frete: valorFrete,
      receita: receitaBruta,
      custoTotal: custoTotalProdutos,
      lucroBruto,
      lucroLiquido,
      margemPct: margemLiquidaPct,
      status: statusPedido,
      observacoes: observacoesPedido.trim(),
    })

    setShowSalvarModal(false)
    setObservacoesPedido('')
    toast({
      title: 'Pedido salvo com sucesso! 💖',
      description: `Registrado no histórico do cliente com status "${statusPedido}".`,
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabeçalho do Módulo */}
      <div className="bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-soft-pink flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#FF1493] uppercase tracking-wider block mb-1">
            Módulo 2 • Precificação & Rentabilidade
          </span>
          <h2 className="text-2xl font-brand-serif font-bold text-[#4E342E]">
            Calculadora Avançada de Ganhos
          </h2>
          <p className="text-xs text-[#4E342E]/70 mt-1">
            Simule pedidos de ímãs 5x5, aplique taxas, compare com a tabela oficial e salve no
            histórico.
          </p>
        </div>

        {/* Configuração de Margem Mínima Alerta */}
        <div className="flex items-center gap-2 bg-[#FFF0F8] px-3.5 py-2 rounded-xl border border-[#FF1493]/20">
          <Sliders className="w-4 h-4 text-[#FF1493]" />
          <div>
            <label
              htmlFor="margem-minima-input"
              className="text-[10px] font-bold text-[#4E342E] block leading-none mb-1"
            >
              Margem Mínima Alerta
            </label>
            <div className="flex items-center gap-1">
              <input
                id="margem-minima-input"
                type="number"
                min="0"
                max="100"
                value={margemMinimaConfig}
                onChange={(e) => {
                  const val = parseFloat(e.target.value)
                  if (!isNaN(val)) {
                    updateSettings({ margemMinimaPct: Math.min(100, Math.max(0, val)) })
                  }
                }}
                className="w-14 px-1.5 py-0.5 text-xs font-bold bg-white border border-[#FF1493]/30 rounded text-center focus:ring-1 focus:ring-[#FF1493]"
              />
              <span className="text-xs font-bold text-[#FF1493]">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Banner Pulsante de Alerta de Margem Baixa */}
      {alertaMargemBaixa && (
        <div className="p-4 bg-gradient-to-r from-red-500/10 via-[#FFF0F8] to-orange-500/10 border-2 border-red-400 rounded-2xl shadow-sm flex items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-red-700">
                Atenção: Margem líquida abaixo do limite desejado!
              </h3>
              <p className="text-xs text-red-600/90">
                A margem calculada ({margemLiquidaPct.toFixed(1)}%) está menor que a margem mínima
                configurada ({margemMinimaConfig}%). Considere aumentar o preço unitário ou negociar
                insumos.
              </p>
            </div>
          </div>
          <button
            onClick={() => setPrecoUnitario(precoOficialSugerido)}
            className="hidden sm:inline-flex px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-full shadow-sm whitespace-nowrap"
          >
            Usar Preço Oficial
          </button>
        </div>
      )}

      {/* Presets de Cenários (Avulso, Kit, Festa, Atacado) */}
      <div className="bg-white rounded-2xl p-4 border border-[#F0E4E0] shadow-soft-pink">
        <span className="text-xs font-bold text-[#4E342E]/70 block mb-2 uppercase">
          Simulação Rápida de Cenários da Bru:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            onClick={() => aplicarPreset('avulso')}
            className="p-3 bg-[#FFF0F8] hover:bg-[#FF1493] hover:text-white rounded-xl border border-[#FF1493]/20 text-left transition-all duration-150 group"
          >
            <span className="text-xs font-bold text-[#FF1493] group-hover:text-white block">
              1. Avulso
            </span>
            <span className="text-xs font-medium text-[#4E342E]/80 group-hover:text-white">
              2 un × R$ 14,99
            </span>
          </button>

          <button
            onClick={() => aplicarPreset('kit')}
            className="p-3 bg-[#FFF0F8] hover:bg-[#FF1493] hover:text-white rounded-xl border border-[#FF1493]/20 text-left transition-all duration-150 group"
          >
            <span className="text-xs font-bold text-[#FF1493] group-hover:text-white block">
              2. Kit Lembrança
            </span>
            <span className="text-xs font-medium text-[#4E342E]/80 group-hover:text-white">
              3 un × R$ 13,30 (R$ 39,90)
            </span>
          </button>

          <button
            onClick={() => aplicarPreset('festa')}
            className="p-3 bg-[#FFF0F8] hover:bg-[#FF1493] hover:text-white rounded-xl border border-[#FF1493]/20 text-left transition-all duration-150 group"
          >
            <span className="text-xs font-bold text-[#FF1493] group-hover:text-white block">
              3. Festa Infantil
            </span>
            <span className="text-xs font-medium text-[#4E342E]/80 group-hover:text-white">
              20 un × R$ 12,50
            </span>
          </button>

          <button
            onClick={() => aplicarPreset('atacado')}
            className="p-3 bg-[#FFF0F8] hover:bg-[#FF1493] hover:text-white rounded-xl border border-[#FF1493]/20 text-left transition-all duration-150 group"
          >
            <span className="text-xs font-bold text-[#FF1493] group-hover:text-white block">
              4. Atacado / Evento
            </span>
            <span className="text-xs font-medium text-[#4E342E]/80 group-hover:text-white">
              50 un × R$ 10,50
            </span>
          </button>
        </div>
      </div>

      {/* Grid Principal: Entradas do Pedido (Esquerda) vs Resultados & Margem (Direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Lado Esquerdo: Formulário do Pedido (7 Colunas) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-soft-pink space-y-4">
          <div className="flex items-center justify-between border-b border-[#F0E4E0] pb-3">
            <h3 className="text-base font-bold text-[#4E342E] flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#FF1493]" />
              Dados do Pedido
            </h3>

            {/* Seletor de Produto do Módulo 1 */}
            <select
              value={activeProduct.id}
              onChange={(e) => setActiveProductId(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1 bg-[#F5EFEA] border border-[#F0E4E0] rounded-lg text-[#4E342E] focus:ring-1 focus:ring-[#FF1493]"
            >
              {data.produtos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Quantidade */}
            <div>
              <label
                htmlFor="input-quantidade"
                className="text-xs font-bold text-[#4E342E] block mb-1"
              >
                Quantidade (unidades)
              </label>
              <input
                id="input-quantidade"
                type="number"
                min="1"
                max="10000"
                value={quantidade}
                onChange={(e) => setQuantidade(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full px-3 py-2 text-sm font-bold bg-[#FAFAFA] border border-[#F0E4E0] rounded-xl focus:bg-white focus:ring-2 focus:ring-[#FF1493]"
              />
            </div>

            {/* Preço Unitário */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="input-preco-unitario" className="text-xs font-bold text-[#4E342E]">
                  Preço Unitário (R$)
                </label>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-gray-400">R$</span>
                <input
                  id="input-preco-unitario"
                  type="number"
                  step="0.01"
                  min="0"
                  value={precoUnitario}
                  onChange={(e) => setPrecoUnitario(parseFloat(e.target.value) || 0)}
                  className="w-full pl-9 pr-3 py-2 text-sm font-bold bg-[#FAFAFA] border border-[#F0E4E0] rounded-xl focus:bg-white focus:ring-2 focus:ring-[#FF1493]"
                />
              </div>
            </div>

            {/* Custo Unitário (Pré-preenchido do Módulo 1, editável) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="input-custo-unitario" className="text-xs font-bold text-[#4E342E]">
                  Custo Unit. (Módulo 1)
                </label>
                <button
                  type="button"
                  onClick={() => setCustoUnitario(custoUnitarioCalculado)}
                  className="text-[10px] text-[#FF1493] font-semibold hover:underline"
                  title="Restaurar custo calculado no Módulo 1"
                >
                  Recarregar
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-gray-400">R$</span>
                <input
                  id="input-custo-unitario"
                  type="number"
                  step="0.01"
                  min="0"
                  value={custoUnitario}
                  onChange={(e) => setCustoUnitario(parseFloat(e.target.value) || 0)}
                  className="w-full pl-9 pr-3 py-2 text-sm font-bold bg-[#FAFAFA] border border-[#F0E4E0] rounded-xl focus:bg-white focus:ring-2 focus:ring-[#FF1493]"
                />
              </div>
            </div>
          </div>

          {/* Deduções e Taxas (Desconto, Impostos, Cartão, Frete) */}
          <div className="pt-2 border-t border-[#F0E4E0]/80">
            <span className="text-xs font-bold text-[#4E342E]/80 block mb-2">
              Deduções, Taxas e Despesas Adicionais:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-[#4E342E] block mb-1">
                  Desconto (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={desconto}
                  onChange={(e) => setDesconto(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#F0E4E0] rounded-lg focus:ring-1 focus:ring-[#FF1493]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#4E342E] block mb-1">
                  Taxa Cartão (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={taxaCartaoPct}
                  onChange={(e) => setTaxaCartaoPct(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#F0E4E0] rounded-lg focus:ring-1 focus:ring-[#FF1493]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#4E342E] block mb-1">
                  Impostos / MEI (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={impostosPct}
                  onChange={(e) => setImpostosPct(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#F0E4E0] rounded-lg focus:ring-1 focus:ring-[#FF1493]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#4E342E] block mb-1">
                  Frete / Entrega (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={frete}
                  onChange={(e) => setFrete(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#F0E4E0] rounded-lg focus:ring-1 focus:ring-[#FF1493]"
                />
              </div>
            </div>
          </div>

          {/* Comparação com a Tabela de Preços Oficial da Bru Memórias */}
          <div className="p-3.5 bg-[#F5EFEA]/60 rounded-xl border border-[#F0E4E0] space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#4E342E] block">
                  Tabela Oficial de Preços da Marca
                </span>
                <span className="text-[11px] text-[#4E342E]/70">
                  Preço sugerido para {qtdSegura} un:{' '}
                  <strong className="text-[#FF1493]">{formatarMoeda(precoOficialSugerido)}</strong>
                </span>
              </div>
              <button
                onClick={() => setPrecoUnitario(precoOficialSugerido)}
                className="px-3 py-1.5 text-xs font-bold text-[#FF1493] bg-white border border-[#FF1493]/30 hover:bg-[#FF1493] hover:text-white rounded-full transition-colors shadow-2xs"
              >
                Usar Preço Oficial
              </button>
            </div>

            {/* Faixas da tabela com destaque na faixa atual */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1 pt-1">
              {TABELA_PRECOS_OFICIAL.map((faixa) => {
                const isSelected = faixaOficialAtual?.descricao === faixa.descricao
                return (
                  <div
                    key={faixa.descricao}
                    className={`p-2 rounded-lg text-center transition-colors ${
                      isSelected
                        ? 'bg-[#FF1493] text-white shadow-sm font-bold'
                        : 'bg-white text-[#4E342E] border border-gray-100 text-[11px]'
                    }`}
                  >
                    <div className="text-[10px] opacity-90">{faixa.descricao}</div>
                    <div className="text-xs font-bold">{formatarMoeda(faixa.preco)}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Lado Direito: Resultados ao Vivo & Margem (5 Colunas) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-soft-pink space-y-4">
            <h3 className="text-base font-bold text-[#4E342E] border-b border-[#F0E4E0] pb-2 flex items-center justify-between">
              <span>Resultado do Pedido</span>
              <span className="text-xs font-normal text-gray-500">Cálculo ao vivo</span>
            </h3>

            {/* Receita e Custo */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center text-[#4E342E]">
                <span>Receita Bruta ({qtdSegura} un)</span>
                <span className="font-bold tabular-nums">{formatarMoeda(receitaBruta)}</span>
              </div>
              <div className="flex justify-between items-center text-[#4E342E]/80">
                <span>Custo dos Ímãs</span>
                <span className="font-semibold text-red-600 tabular-nums">
                  -{formatarMoeda(custoTotalProdutos)}
                </span>
              </div>
              {deducoesTotais > 0 && (
                <div className="flex justify-between items-center text-xs text-[#4E342E]/70 pt-1 border-t border-dashed border-gray-200">
                  <span>Deduções (desconto, taxas, frete)</span>
                  <span className="font-medium text-red-500 tabular-nums">
                    -{formatarMoeda(deducoesTotais)}
                  </span>
                </div>
              )}
            </div>

            {/* Lucro Líquido em Destaque */}
            <div
              className={`p-4 rounded-xl border transition-colors ${
                alertaMargemBaixa
                  ? 'bg-red-50 border-red-200 text-red-900'
                  : 'bg-gradient-to-br from-[#FFF0F8] to-emerald-50/50 border-[#FF1493]/30 text-[#4E342E]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#4E342E]/70">
                  Lucro Líquido Estimado
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    alertaMargemBaixa
                      ? 'bg-red-200 text-red-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {alertaMargemBaixa ? 'Abaixo do Alerta' : 'Saudável'}
                </span>
              </div>
              <div className="text-3xl font-black font-brand-serif tabular-nums text-[#FF1493]">
                {formatarMoeda(lucroLiquido)}
              </div>

              {/* Margem Líquida % */}
              <div className="mt-3 pt-2 border-t border-black/5 flex items-center justify-between text-xs">
                <span className="font-semibold">Margem Líquida:</span>
                <span
                  className={`text-base font-black tabular-nums ${
                    alertaMargemBaixa ? 'text-red-600' : 'text-emerald-700'
                  }`}
                >
                  {margemLiquidaPct.toFixed(1)}%
                </span>
              </div>

              {/* Margem Bruta (referência) */}
              <div className="flex items-center justify-between text-[11px] text-[#4E342E]/70 mt-0.5">
                <span>Margem Bruta (s/ taxas):</span>
                <span>{margemBrutaPct.toFixed(1)}%</span>
              </div>
            </div>

            {/* Ponto de Equilíbrio */}
            <div className="p-3 bg-[#F5EFEA]/70 rounded-xl border border-[#F0E4E0] text-xs space-y-1">
              <div className="flex items-center justify-between text-[#4E342E] font-semibold">
                <span>Ponto de Equilíbrio:</span>
                <span className="font-bold text-[#FF1493]">
                  a partir de {pontoEquilibrioUnidades}{' '}
                  {pontoEquilibrioUnidades === 1 ? 'unidade' : 'unidades'}
                </span>
              </div>
              <p className="text-[11px] text-[#4E342E]/70">
                Quantidade mínima para cobrir o custo total direto deste lote.
              </p>
            </div>

            {/* Botão de Salvar Pedido no Cliente */}
            <button
              onClick={() => {
                if (data.clientes.length === 0) {
                  toast({
                    title: 'Nenhum cliente cadastrado',
                    description: 'Vá para a aba "Clientes" e cadastre o primeiro cliente.',
                    variant: 'destructive',
                  })
                  setActiveTab('clientes')
                  return
                }
                setShowSalvarModal(true)
              }}
              className="w-full py-3 px-4 bg-[#FF1493] hover:bg-[#E01284] text-white font-bold text-sm rounded-full shadow-md transition-all duration-150 flex items-center justify-center gap-2 group active:scale-98"
            >
              <BookmarkPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Salvar Pedido no Cliente</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Salvar Pedido no Cliente */}
      {showSalvarModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#F0E4E0]">
            <h3 className="text-lg font-bold font-brand-serif text-[#4E342E] mb-1">
              Salvar Pedido no Cliente
            </h3>
            <p className="text-xs text-[#4E342E]/70 mb-4">
              O pedido entrará no histórico de compras do cliente e alimentará os gráficos do
              Painel.
            </p>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-bold text-[#4E342E] mb-1">
                  Selecione o Cliente:
                </label>
                <select
                  value={clienteSelecionadoId}
                  onChange={(e) => setClienteSelecionadoId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#FF1493]"
                >
                  {data.clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} {c.telefoneWhatsapp ? `(${c.telefoneWhatsapp})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[#4E342E] mb-1">
                    Status do Pedido:
                  </label>
                  <select
                    value={statusPedido}
                    onChange={(e) => setStatusPedido(e.target.value as OrderStatus)}
                    className="w-full px-3 py-2 text-xs border rounded-lg font-semibold"
                  >
                    <option value="Orçamento">Orçamento</option>
                    <option value="Fechado">Fechado</option>
                    <option value="Pago">Pago</option>
                    <option value="Entregue">Entregue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#4E342E] mb-1">
                    Data do Pedido:
                  </label>
                  <input
                    type="date"
                    value={dataPedido}
                    onChange={(e) => setDataPedido(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4E342E] mb-1">
                  Observações (Fotos, tema, entrega):
                </label>
                <input
                  type="text"
                  placeholder="Ex: 10 fotos viagem Arraial, entregar no Recreio"
                  value={observacoesPedido}
                  onChange={(e) => setObservacoesPedido(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-lg"
                />
              </div>

              {/* Resumo visual do pedido que será salvo */}
              <div className="p-3 bg-[#FFF0F8] rounded-xl text-xs space-y-1">
                <div className="flex justify-between font-bold text-[#4E342E]">
                  <span>Item:</span>
                  <span>
                    {qtdSegura} un de {activeProduct.nome}
                  </span>
                </div>
                <div className="flex justify-between text-[#4E342E]">
                  <span>Total a Receber:</span>
                  <span className="font-bold text-[#FF1493]">{formatarMoeda(receitaBruta)}</span>
                </div>
                <div className="flex justify-between text-[#4E342E]">
                  <span>Lucro Líquido:</span>
                  <span className="font-bold text-emerald-700">{formatarMoeda(lucroLiquido)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSalvarModal(false)}
                className="px-4 py-2 text-xs font-semibold text-[#4E342E] bg-gray-100 hover:bg-gray-200 rounded-full"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvarPedido}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#FF1493] hover:bg-[#E01284] rounded-full shadow-sm"
              >
                Confirmar e Salvar Pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
