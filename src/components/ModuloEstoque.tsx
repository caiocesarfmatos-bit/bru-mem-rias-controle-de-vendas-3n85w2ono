import React, { useState, useMemo } from 'react'
import { useApp } from '@/context/AppContext'
import {
  InsumoEstoque,
  MovimentacaoEstoque,
  ProdutoProntoItem,
  TipoMovimentacaoEstoque,
  MotivoMovimentacaoEstoque,
} from '@/types/app'
import { formatarMoeda, formatarDataPtBR, sanitizarTexto } from '@/lib/formatters'
import { exportarCsvEstoque, exportarCsvMovimentacoesEstoque } from '@/lib/exportUtils'
import { useToast } from '@/hooks/use-toast'
import {
  Boxes,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  History,
  Package,
  Layers,
  Edit2,
  Trash2,
  CheckCircle2,
  Filter,
  Search,
  FileSpreadsheet,
  X,
  Sparkles,
  RefreshCw,
  HelpCircle,
  Link,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

export const ModuloEstoque: React.FC = () => {
  const {
    data,
    activeProduct,
    addInsumoEstoque,
    updateInsumoEstoque,
    deleteInsumoEstoque,
    addMovimentacaoEstoque,
    editMovimentacaoEstoque,
    deleteMovimentacaoEstoque,
    updateProdutoPronto,
    addProdutoPronto,
    logAudit,
  } = useApp()

  const { toast } = useToast()

  // Sub-abas dentro do módulo de Estoque
  const [subAba, setSubAba] = useState<'insumos' | 'movimentacoes' | 'produtosProntos'>('insumos')

  // Filtros e busca de insumos
  const [buscaInsumo, setBuscaInsumo] = useState('')
  const [filtroAlerta, setFiltroAlerta] = useState<'todos' | 'baixo' | 'normal'>('todos')

  // Filtros de movimentações
  const [filtroTipoMov, setFiltroTipoMov] = useState<'todos' | 'entrada' | 'saida'>('todos')
  const [filtroItemMov, setFiltroItemMov] = useState<string>('todos')

  // Modais de Insumos
  const [showNovoInsumoModal, setShowNovoInsumoModal] = useState(false)
  const [editingInsumo, setEditingInsumo] = useState<InsumoEstoque | null>(null)
  const [deleteInsumoTarget, setDeleteInsumoTarget] = useState<InsumoEstoque | null>(null)

  // Campos do formulário de insumo
  const [formNomeInsumo, setFormNomeInsumo] = useState('')
  const [formCategoriaInsumo, setFormCategoriaInsumo] = useState('Geral')
  const [formUnidadeInsumo, setFormUnidadeInsumo] = useState('un')
  const [formQtdInsumo, setFormQtdInsumo] = useState<string>('0')
  const [formCustoInsumo, setFormCustoInsumo] = useState<string>('0')
  const [formMinimoInsumo, setFormMinimoInsumo] = useState<string>('10')
  const [formInsumoError, setFormInsumoError] = useState('')

  // Modais de Movimentação (Entrada / Saída)
  const [showMovModal, setShowMovModal] = useState(false)
  const [movTipo, setMovTipo] = useState<TipoMovimentacaoEstoque>('entrada')
  const [movItemId, setMovItemId] = useState<string>('')
  const [movQuantidade, setMovQuantidade] = useState<string>('')
  const [movCustoUnit, setMovCustoUnit] = useState<string>('')
  const [movMotivo, setMovMotivo] = useState<MotivoMovimentacaoEstoque>('compra')
  const [movData, setMovData] = useState(new Date().toISOString().split('T')[0])
  const [movObs, setMovObs] = useState('')
  const [movRefletirCustos, setMovRefletirCustos] = useState(false)
  const [movCustoItemId, setMovCustoItemId] = useState<string>('')
  const [editingMov, setEditingMov] = useState<MovimentacaoEstoque | null>(null)
  const [deleteMovTarget, setDeleteMovTarget] = useState<MovimentacaoEstoque | null>(null)
  const [movError, setMovError] = useState('')

  // Modais de Produtos Prontos (Ímãs acabados)
  const [showNovoProdutoProntoModal, setShowNovoProdutoProntoModal] = useState(false)
  const [editingPP, setEditingPP] = useState<ProdutoProntoItem | null>(null)
  const [ppNome, setPpNome] = useState('')
  const [ppProduzida, setPpProduzida] = useState<string>('')
  const [ppVendida, setPpVendida] = useState<string>('')
  const [ppCusto, setPpCusto] = useState<string>('')
  const [ppObs, setPpObs] = useState('')
  const [ppError, setPpError] = useState('')

  // Lista de insumos e movimentações seguras
  const insumos = useMemo(() => data.estoque?.insumos || [], [data.estoque])
  const movimentacoes = useMemo(() => data.estoque?.movimentacoes || [], [data.estoque])
  const produtosProntos = useMemo(() => data.estoque?.produtosProntos || [], [data.estoque])

  // Custo unitário atual do produto ativo do módulo Custos
  const custoUnitarioModuloCustos = useMemo(() => {
    const totalItens = activeProduct.itens.reduce((acc, item) => {
      const somaExtras = item.lancamentos.reduce((a, l) => a + l.valor, 0)
      return acc + item.custoBase + somaExtras
    }, 0)
    const lote = Math.max(1, activeProduct.unidadesLote || 100)
    return totalItens / lote
  }, [activeProduct])

  // KPIs DO RESUMO NO TOPO (STICKY BAR)
  const totalItensCadastrados = insumos.length

  const itensEmAlerta = useMemo(() => {
    return insumos.filter((item) => item.quantidadeAtual <= item.estoqueMinimo)
  }, [insumos])

  const totalItensAlertaCount = itensEmAlerta.length

  const valorTotalEstoque = useMemo(() => {
    return insumos.reduce((acc, item) => acc + item.quantidadeAtual * item.custoMedioUnitario, 0)
  }, [insumos])

  const totalImasProntosDisponiveis = useMemo(() => {
    return produtosProntos.reduce((acc, p) => acc + p.quantidadeDisponivel, 0)
  }, [produtosProntos])

  // Insumos filtrados
  const insumosFiltrados = useMemo(() => {
    return insumos.filter((item) => {
      const matchBusca =
        item.nome.toLowerCase().includes(buscaInsumo.toLowerCase()) ||
        (item.categoria || '').toLowerCase().includes(buscaInsumo.toLowerCase())

      if (!matchBusca) return false

      if (filtroAlerta === 'baixo') {
        return item.quantidadeAtual <= item.estoqueMinimo
      }
      if (filtroAlerta === 'normal') {
        return item.quantidadeAtual > item.estoqueMinimo
      }
      return true
    })
  }, [insumos, buscaInsumo, filtroAlerta])

  // Movimentações filtradas
  const movimentacoesFiltradas = useMemo(() => {
    return movimentacoes.filter((m) => {
      if (filtroTipoMov !== 'todos' && m.tipo !== filtroTipoMov) return false
      if (filtroItemMov !== 'todos' && m.itemId !== filtroItemMov) return false
      return true
    })
  }, [movimentacoes, filtroTipoMov, filtroItemMov])

  // Abrir modal de novo insumo
  const openNovoInsumoModal = (sugestaoNome?: string, sugestaoCusto?: number) => {
    setEditingInsumo(null)
    setFormNomeInsumo(sugestaoNome || '')
    setFormCategoriaInsumo('Geral')
    setFormUnidadeInsumo('un')
    setFormQtdInsumo('0')
    setFormCustoInsumo(sugestaoCusto !== undefined ? sugestaoCusto.toString() : '0')
    setFormMinimoInsumo('10')
    setFormInsumoError('')
    setShowNovoInsumoModal(true)
  }

  // Abrir modal de edição de insumo
  const openEditarInsumoModal = (insumo: InsumoEstoque) => {
    setEditingInsumo(insumo)
    setFormNomeInsumo(insumo.nome)
    setFormCategoriaInsumo(insumo.categoria || 'Geral')
    setFormUnidadeInsumo(insumo.unidade)
    setFormQtdInsumo(insumo.quantidadeAtual.toString())
    setFormCustoInsumo(insumo.custoMedioUnitario.toString())
    setFormMinimoInsumo(insumo.estoqueMinimo.toString())
    setFormInsumoError('')
    setShowNovoInsumoModal(true)
  }

  // Salvar insumo
  const handleSaveInsumo = () => {
    if (!formNomeInsumo.trim()) {
      setFormInsumoError('Informe o nome do insumo.')
      return
    }

    const qtd = parseFloat(formQtdInsumo.replace(',', '.'))
    const custo = parseFloat(formCustoInsumo.replace(',', '.'))
    const min = parseFloat(formMinimoInsumo.replace(',', '.'))

    if (isNaN(qtd) || qtd < 0) {
      setFormInsumoError('Quantidade deve ser um número maior ou igual a zero.')
      return
    }
    if (isNaN(custo) || custo < 0) {
      setFormInsumoError('Custo médio deve ser um número válido maior ou igual a zero.')
      return
    }
    if (isNaN(min) || min < 0) {
      setFormInsumoError('Estoque mínimo deve ser um número maior ou igual a zero.')
      return
    }

    if (editingInsumo) {
      updateInsumoEstoque(editingInsumo.id, {
        nome: formNomeInsumo.trim(),
        categoria: formCategoriaInsumo.trim() || 'Geral',
        unidade: formUnidadeInsumo.trim() || 'un',
        quantidadeAtual: qtd,
        custoMedioUnitario: custo,
        estoqueMinimo: min,
      })
      toast({ title: 'Insumo atualizado com sucesso! ✨' })
    } else {
      addInsumoEstoque({
        nome: formNomeInsumo.trim(),
        categoria: formCategoriaInsumo.trim() || 'Geral',
        unidade: formUnidadeInsumo.trim() || 'un',
        quantidadeAtual: qtd,
        custoMedioUnitario: custo,
        estoqueMinimo: min,
      })
      toast({ title: 'Novo insumo cadastrado no estoque! 💖' })
    }

    setShowNovoInsumoModal(false)
  }

  // Confirmar exclusão de insumo
  const handleConfirmDeleteInsumo = () => {
    if (!deleteInsumoTarget) return
    deleteInsumoEstoque(deleteInsumoTarget.id)
    toast({ title: 'Insumo excluído do estoque.' })
    setDeleteInsumoTarget(null)
  }

  // Abrir modal de movimentação rápida
  const openMovimentacaoModal = (
    tipo: TipoMovimentacaoEstoque,
    preItemId?: string,
    movEdit?: MovimentacaoEstoque,
  ) => {
    setMovError('')
    if (movEdit) {
      setEditingMov(movEdit)
      setMovTipo(movEdit.tipo)
      setMovItemId(movEdit.itemId)
      setMovQuantidade(movEdit.quantidade.toString())
      setMovCustoUnit(movEdit.custoUnitario !== undefined ? movEdit.custoUnitario.toString() : '')
      setMovMotivo(movEdit.motivo)
      setMovData(movEdit.data)
      setMovObs(movEdit.observacao || '')
      setMovRefletirCustos(false)
    } else {
      setEditingMov(null)
      setMovTipo(tipo)
      const targetId = preItemId || (insumos[0]?.id ?? '')
      setMovItemId(targetId)
      setMovQuantidade('')
      const targetItem = insumos.find((i) => i.id === targetId)
      setMovCustoUnit(targetItem ? targetItem.custoMedioUnitario.toString() : '')
      setMovMotivo(tipo === 'entrada' ? 'compra' : 'producao')
      setMovData(new Date().toISOString().split('T')[0])
      setMovObs('')
      setMovRefletirCustos(false)
      // Tentar pré-selecionar item de custos correspondente
      const correspondente = activeProduct.itens.find(
        (it) => it.nome.toLowerCase() === targetItem?.nome.toLowerCase(),
      )
      setMovCustoItemId(correspondente?.id || activeProduct.itens[0]?.id || '')
    }
    setShowMovModal(true)
  }

  // Salvar movimentação
  const handleSaveMovimentacao = () => {
    if (!movItemId) {
      setMovError('Selecione um insumo.')
      return
    }

    const qtd = parseFloat(movQuantidade.replace(',', '.'))
    if (isNaN(qtd) || qtd <= 0) {
      setMovError('A quantidade movimentada deve ser maior que zero.')
      return
    }

    const custoVal = movCustoUnit ? parseFloat(movCustoUnit.replace(',', '.')) : undefined
    if (custoVal !== undefined && (isNaN(custoVal) || custoVal < 0)) {
      setMovError('O custo unitário deve ser um número válido maior ou igual a zero.')
      return
    }

    const itemAlvo = insumos.find((i) => i.id === movItemId)
    if (!itemAlvo) {
      setMovError('Insumo não encontrado.')
      return
    }

    // Se for saída e quantidade for maior que saldo, alertar mas permitir se o usuário quiser ajuste
    if (movTipo === 'saida' && qtd > itemAlvo.quantidadeAtual && !editingMov) {
      // Aviso suave
    }

    if (editingMov) {
      editMovimentacaoEstoque(editingMov.id, {
        itemId: movItemId,
        itemNome: itemAlvo.nome,
        data: movData,
        tipo: movTipo,
        quantidade: qtd,
        custoUnitario: custoVal,
        motivo: movMotivo,
        observacao: sanitizarTexto(movObs),
      })
      toast({ title: 'Movimentação atualizada e saldos recalculados!' })
    } else {
      addMovimentacaoEstoque(
        {
          itemId: movItemId,
          itemNome: itemAlvo.nome,
          data: movData,
          tipo: movTipo,
          quantidade: qtd,
          custoUnitario: custoVal,
          motivo: movMotivo,
          observacao: sanitizarTexto(movObs),
        },
        {
          refletirEmCustos: movRefletirCustos && movTipo === 'entrada',
          custoItemId: movCustoItemId,
        },
      )

      if (movRefletirCustos && movTipo === 'entrada') {
        toast({
          title: 'Entrada registrada com sucesso! 💖',
          description: 'Valor refletido automaticamente no histórico do módulo Custos.',
        })
      } else {
        toast({
          title: 'Movimentação registrada!',
          description: `Saldo do item "${itemAlvo.nome}" atualizado automaticamente.`,
        })
      }
    }

    setShowMovModal(false)
  }

  // Confirmar exclusão de movimentação
  const handleConfirmDeleteMov = () => {
    if (!deleteMovTarget) return
    deleteMovimentacaoEstoque(deleteMovTarget.id)
    toast({ title: 'Movimentação excluída e saldos recalculados com sucesso.' })
    setDeleteMovTarget(null)
  }

  // Abrir modal de Produto Pronto (Ímã acabado)
  const openEditarPPModal = (item: ProdutoProntoItem) => {
    setEditingPP(item)
    setPpNome(item.produtoNome)
    setPpProduzida(item.quantidadeProduzida.toString())
    setPpVendida(item.quantidadeVendida.toString())
    setPpCusto(item.custoEstimadoUnitario.toString())
    setPpObs(item.observacao || '')
    setPpError('')
    setShowNovoProdutoProntoModal(true)
  }

  const openNovoPPModal = () => {
    setEditingPP(null)
    setPpNome(activeProduct.nome)
    setPpProduzida('100')
    setPpVendida('0')
    setPpCusto(Number(custoUnitarioModuloCustos.toFixed(2)).toString())
    setPpObs('')
    setPpError('')
    setShowNovoProdutoProntoModal(true)
  }

  // Salvar Produto Pronto
  const handleSavePP = () => {
    if (!ppNome.trim()) {
      setPpError('Informe o nome do modelo/produto.')
      return
    }

    const prod = parseInt(ppProduzida, 10)
    const vend = parseInt(ppVendida, 10)
    const custo = parseFloat(ppCusto.replace(',', '.'))

    if (isNaN(prod) || prod < 0) {
      setPpError('Quantidade produzida inválida.')
      return
    }
    if (isNaN(vend) || vend < 0) {
      setPpError('Quantidade vendida inválida.')
      return
    }
    if (isNaN(custo) || custo < 0) {
      setPpError('Custo unitário inválido.')
      return
    }

    const disp = Math.max(0, prod - vend)

    if (editingPP) {
      updateProdutoPronto(editingPP.id, {
        produtoNome: ppNome.trim(),
        quantidadeProduzida: prod,
        quantidadeVendida: vend,
        quantidadeDisponivel: disp,
        custoEstimadoUnitario: custo,
        observacao: sanitizarTexto(ppObs),
      })
      toast({ title: 'Controle de produto pronto atualizado! ✨' })
    } else {
      addProdutoPronto({
        produtoId: activeProduct.id,
        produtoNome: ppNome.trim(),
        quantidadeProduzida: prod,
        quantidadeVendida: vend,
        quantidadeDisponivel: disp,
        custoEstimadoUnitario: custo,
        observacao: sanitizarTexto(ppObs),
      })
      toast({ title: 'Novo produto pronto registrado! 💖' })
    }

    setShowNovoProdutoProntoModal(false)
  }

  // Sincronizar custo estimado do produto pronto com o módulo Custos
  const handleSincronizarCustoPP = (item: ProdutoProntoItem) => {
    updateProdutoPronto(item.id, {
      custoEstimadoUnitario: Number(custoUnitarioModuloCustos.toFixed(2)),
    })
    toast({
      title: 'Custo sincronizado! 🔄',
      description: `Atualizado para ${formatarMoeda(custoUnitarioModuloCustos)} baseado no módulo Custos.`,
    })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabeçalho do Módulo */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#F0E4E0] shadow-soft-pink flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#FF1493] uppercase tracking-wider block mb-1">
            Controle de Estoque
          </span>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-brand-serif font-bold text-[#4E342E]">
              Gestão de Estoque & Insumos
            </h2>
            {totalItensAlertaCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold bg-[#FF1493] text-white rounded-full shadow-sm animate-pulse">
                <AlertTriangle className="w-3 h-3" />
                <span>{totalItensAlertaCount} em alerta</span>
              </span>
            )}
          </div>
          <p className="text-xs text-[#4E342E]/70 mt-0.5">
            Controle de matéria-prima, alertas de reposição, histórico de entradas/saídas e produtos
            prontos para venda.
          </p>
        </div>

        {/* Botões de Ação Rápida */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => openMovimentacaoModal('entrada')}
            className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>+ Registrar Entrada</span>
          </button>
          <button
            onClick={() => openMovimentacaoModal('saida')}
            className="px-3.5 py-2 text-xs font-bold text-white bg-[#4E342E] hover:bg-black rounded-full shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>- Registrar Saída</span>
          </button>
          <button
            onClick={() => openNovoInsumoModal()}
            className="px-3.5 py-2 text-xs font-bold text-[#FF1493] bg-[#FFF0F8] border border-[#FF1493]/30 hover:bg-[#FF1493] hover:text-white rounded-full transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Insumo</span>
          </button>
        </div>
      </div>

      {/* Resumo no Topo (Barra Sticky com estilo do módulo Custos) */}
      <div className="sticky top-[108px] z-30 bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-[#FF1493]/30 shadow-md">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-center">
          {/* Card 1: Total de Itens */}
          <div className="flex items-center gap-2.5 sm:gap-3 bg-[#F5EFEA]/60 p-2.5 rounded-xl border border-[#F0E4E0]">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white text-[#FF1493] flex items-center justify-center font-bold shadow-2xs flex-shrink-0">
              <Boxes className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold text-[#4E342E]/70 block uppercase truncate">
                Itens Cadastrados
              </span>
              <span className="text-lg sm:text-xl font-bold font-brand-serif text-[#4E342E] tabular-nums">
                {totalItensCadastrados} insumos
              </span>
            </div>
          </div>

          {/* Card 2: Alerta Estoque Baixo */}
          <div
            className={`flex items-center gap-2.5 sm:gap-3 p-2.5 rounded-xl border transition-colors ${
              totalItensAlertaCount > 0
                ? 'bg-[#FFF0F8] border-[#FF1493]/40'
                : 'bg-emerald-50/60 border-emerald-200'
            }`}
          >
            <div
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold shadow-2xs flex-shrink-0 ${
                totalItensAlertaCount > 0 ? 'bg-[#FF1493] text-white' : 'bg-emerald-600 text-white'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold text-[#4E342E]/70 block uppercase truncate">
                Estoque Baixo
              </span>
              <span
                className={`text-lg sm:text-xl font-black font-brand-serif tabular-nums ${
                  totalItensAlertaCount > 0 ? 'text-[#FF1493]' : 'text-emerald-700'
                }`}
              >
                {totalItensAlertaCount === 0 ? 'Tudo OK ✨' : `${totalItensAlertaCount} itens ⚠️`}
              </span>
            </div>
          </div>

          {/* Card 3: Valor Total em Estoque */}
          <div className="flex items-center gap-2.5 sm:gap-3 bg-[#F5EFEA]/60 p-2.5 rounded-xl border border-[#F0E4E0]">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white text-[#4E342E] flex items-center justify-center font-bold shadow-2xs flex-shrink-0">
              💰
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold text-[#4E342E]/70 block uppercase truncate">
                Valor Total Insumos
              </span>
              <span className="text-lg sm:text-xl font-bold font-brand-serif text-[#4E342E] tabular-nums truncate block">
                {formatarMoeda(valorTotalEstoque)}
              </span>
            </div>
          </div>

          {/* Card 4: Ímãs Prontos Disponíveis */}
          <div className="flex items-center gap-2.5 sm:gap-3 bg-gradient-to-r from-[#FFF0F8] to-white p-2.5 rounded-xl border border-[#FF1493]/30">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#FF1493] text-white flex items-center justify-center font-bold shadow-2xs flex-shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] sm:text-[11px] font-bold text-[#FF1493] block uppercase truncate">
                Ímãs Prontos
              </span>
              <span className="text-lg sm:text-xl font-black font-brand-serif text-[#FF1493] tabular-nums">
                {totalImasProntosDisponiveis} un à pronta entrega
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navegação entre Sub-abas do Módulo de Estoque */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F0E4E0] pb-2">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setSubAba('insumos')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-150 flex items-center gap-2 ${
              subAba === 'insumos'
                ? 'bg-[#FF1493] text-white shadow-sm'
                : 'bg-[#F5EFEA] text-[#4E342E] hover:bg-[#FF1493]/10 hover:text-[#FF1493]'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Insumos & Matéria-Prima</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                subAba === 'insumos' ? 'bg-white text-[#FF1493]' : 'bg-black/10'
              }`}
            >
              {insumos.length}
            </span>
          </button>

          <button
            onClick={() => setSubAba('movimentacoes')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-150 flex items-center gap-2 ${
              subAba === 'movimentacoes'
                ? 'bg-[#FF1493] text-white shadow-sm'
                : 'bg-[#F5EFEA] text-[#4E342E] hover:bg-[#FF1493]/10 hover:text-[#FF1493]'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Histórico de Movimentações</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                subAba === 'movimentacoes' ? 'bg-white text-[#FF1493]' : 'bg-black/10'
              }`}
            >
              {movimentacoes.length}
            </span>
          </button>

          <button
            onClick={() => setSubAba('produtosProntos')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-150 flex items-center gap-2 ${
              subAba === 'produtosProntos'
                ? 'bg-[#FF1493] text-white shadow-sm'
                : 'bg-[#F5EFEA] text-[#4E342E] hover:bg-[#FF1493]/10 hover:text-[#FF1493]'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Produto Pronto (Acabados)</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                subAba === 'produtosProntos' ? 'bg-white text-[#FF1493]' : 'bg-black/10'
              }`}
            >
              {totalImasProntosDisponiveis}
            </span>
          </button>
        </div>

        {/* Botão de Exportação CSV contextual */}
        <div className="flex items-center gap-2">
          {subAba === 'insumos' && (
            <button
              onClick={() => {
                exportarCsvEstoque(data)
                logAudit('Estoque', 'Exportação CSV', 'Itens de estoque exportados para CSV.')
                toast({ title: 'Planilha de Estoque baixada com sucesso!' })
              }}
              className="px-3 py-1.5 text-xs font-semibold text-[#4E342E] bg-white border border-[#F0E4E0] hover:border-[#FF1493] hover:text-[#FF1493] rounded-full transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#FF1493]" />
              <span>Exportar Insumos (CSV)</span>
            </button>
          )}

          {subAba === 'movimentacoes' && (
            <button
              onClick={() => {
                exportarCsvMovimentacoesEstoque(data)
                logAudit(
                  'Estoque',
                  'Exportação CSV',
                  'Movimentações de estoque exportadas para CSV.',
                )
                toast({ title: 'Planilha de Movimentações baixada com sucesso!' })
              }}
              className="px-3 py-1.5 text-xs font-semibold text-[#4E342E] bg-white border border-[#F0E4E0] hover:border-[#FF1493] hover:text-[#FF1493] rounded-full transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#FF1493]" />
              <span>Exportar Movimentações (CSV)</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* SUB-ABA 1: INSUMOS EM ESTOQUE */}
      {/* ========================================================= */}
      {subAba === 'insumos' && (
        <div className="space-y-4">
          {/* Barra de Filtros e Busca de Insumos */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-[#F0E4E0] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between shadow-2xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={buscaInsumo}
                onChange={(e) => setBuscaInsumo(e.target.value)}
                placeholder="Buscar insumo por nome ou categoria (ex: placa, adesivo, organza)..."
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#F5EFEA]/50 border border-[#F0E4E0] rounded-xl text-[#4E342E] focus:outline-none focus:ring-1 focus:ring-[#FF1493]"
              />
              {buscaInsumo && (
                <button
                  onClick={() => setBuscaInsumo('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <span className="text-xs font-semibold text-[#4E342E]/70 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Status:
              </span>
              <button
                onClick={() => setFiltroAlerta('todos')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  filtroAlerta === 'todos'
                    ? 'bg-[#4E342E] text-white'
                    : 'bg-[#F5EFEA] text-[#4E342E] hover:bg-black/5'
                }`}
              >
                Todos ({insumos.length})
              </button>
              <button
                onClick={() => setFiltroAlerta('baixo')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
                  filtroAlerta === 'baixo'
                    ? 'bg-[#FF1493] text-white'
                    : 'bg-[#FFF0F8] text-[#FF1493] hover:bg-[#FF1493]/10'
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Estoque Baixo ({totalItensAlertaCount})</span>
              </button>
              <button
                onClick={() => setFiltroAlerta('normal')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  filtroAlerta === 'normal'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                Normal ({insumos.length - totalItensAlertaCount})
              </button>
            </div>
          </div>

          {/* Dica de reaproveitamento de nomes de insumos do módulo de Custos */}
          <div className="bg-[#FFF0F8]/60 p-3 rounded-xl border border-[#FF1493]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-[#4E342E]">
              <Sparkles className="w-4 h-4 text-[#FF1493] flex-shrink-0" />
              <span>
                <strong>Dica Bru:</strong> Seus insumos de estoque estão conectados aos itens do
                modelo <strong className="text-[#FF1493]">{activeProduct.nome}</strong>. Você pode
                adicionar outros insumos a qualquer momento!
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[11px] text-gray-500 font-semibold mr-1">
                Adicionar rápido:
              </span>
              {activeProduct.itens
                .filter(
                  (it) => !insumos.some((ins) => ins.nome.toLowerCase() === it.nome.toLowerCase()),
                )
                .slice(0, 3)
                .map((it) => (
                  <button
                    key={it.id}
                    onClick={() => openNovoInsumoModal(it.nome, it.custoBase)}
                    className="px-2 py-0.5 text-[11px] font-medium bg-white text-[#FF1493] border border-[#FF1493]/30 hover:bg-[#FF1493] hover:text-white rounded-md transition-colors"
                  >
                    + {it.nome}
                  </button>
                ))}
            </div>
          </div>

          {/* Grid de Cards de Insumos */}
          {insumosFiltrados.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 sm:p-12 border border-[#F0E4E0] text-center shadow-soft-pink">
              {/* Ilustração Polaroid vazia */}
              <div className="relative w-20 h-24 mx-auto mb-4">
                <div className="absolute inset-0 bg-white border-2 border-[#4E342E]/20 rounded-lg shadow-sm transform -rotate-6 p-1 flex flex-col">
                  <div className="w-full h-14 bg-[#FFF0F8] rounded flex items-center justify-center">
                    <Boxes className="w-6 h-6 text-[#FF1493]/40" />
                  </div>
                </div>
                <div className="absolute inset-0 bg-white border-2 border-[#FF1493]/40 rounded-lg shadow-md transform rotate-3 p-1 flex flex-col justify-between">
                  <div className="w-full h-14 bg-[#FF1493]/10 rounded flex items-center justify-center">
                    <span className="text-xl">📦</span>
                  </div>
                  <div className="h-1.5 bg-[#FF1493]/20 rounded-full w-2/3 mx-auto mb-1" />
                </div>
              </div>

              <h3 className="text-base sm:text-lg font-bold font-brand-serif text-[#4E342E] mb-1">
                Nenhum insumo encontrado no estoque
              </h3>
              <p className="text-xs text-[#4E342E]/70 mb-5 max-w-md mx-auto">
                {buscaInsumo || filtroAlerta !== 'todos'
                  ? 'Nenhum item corresponde aos critérios de busca ou filtro selecionados.'
                  : 'Cadastre seus insumos (placas magnéticas, folhas adesivas, impressões, organzas) para controlar quantidades e custos.'}
              </p>
              <button
                onClick={() => openNovoInsumoModal()}
                className="px-5 py-2.5 text-xs font-bold text-white bg-[#FF1493] hover:bg-[#E01284] rounded-full shadow-sm inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Primeiro Insumo</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {insumosFiltrados.map((item) => {
                const isBaixo = item.quantidadeAtual <= item.estoqueMinimo
                const valorTotalItem = item.quantidadeAtual * item.custoMedioUnitario
                const ultimasMovs = movimentacoes.filter((m) => m.itemId === item.id).slice(0, 2)

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl border transition-all duration-150 p-4 shadow-soft-pink flex flex-col justify-between ${
                      isBaixo
                        ? 'border-[#FF1493] ring-1 ring-[#FF1493]/20'
                        : 'border-[#F0E4E0] hover:border-[#FF1493]/40'
                    }`}
                  >
                    <div>
                      {/* Topo do card: Categoria, Nome e Badge Alerta */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#4E342E]/60 block mb-0.5">
                            {item.categoria || 'Insumo'}
                          </span>
                          <h3
                            className="text-base font-bold text-[#4E342E] truncate"
                            title={item.nome}
                          >
                            {item.nome}
                          </h3>
                        </div>

                        {/* Badge de Alerta ou Normal */}
                        {isBaixo ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold bg-[#FF1493] text-white rounded-full flex-shrink-0 animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Repor!</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex-shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>OK</span>
                          </span>
                        )}
                      </div>

                      {/* Métricas do Insumo (Quantidade Atual grande, Custo Médio e Mínimo) */}
                      <div className="grid grid-cols-3 gap-2 bg-[#F5EFEA]/40 p-2.5 rounded-xl border border-[#F0E4E0]/80 my-3 text-center">
                        <div>
                          <span className="text-[10px] font-semibold text-[#4E342E]/70 block uppercase">
                            Em Estoque
                          </span>
                          <span
                            className={`text-lg font-black font-brand-serif tabular-nums ${
                              isBaixo ? 'text-[#FF1493]' : 'text-[#4E342E]'
                            }`}
                          >
                            {item.quantidadeAtual}
                          </span>
                          <span className="text-[10px] text-gray-500 block">{item.unidade}</span>
                        </div>

                        <div>
                          <span className="text-[10px] font-semibold text-[#4E342E]/70 block uppercase">
                            Custo Médio
                          </span>
                          <span className="text-sm font-bold text-[#4E342E] tabular-nums block mt-1">
                            {formatarMoeda(item.custoMedioUnitario)}
                          </span>
                          <span className="text-[10px] text-gray-500 block">
                            por {item.unidade}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] font-semibold text-[#4E342E]/70 block uppercase">
                            Estoque Mín.
                          </span>
                          <span className="text-sm font-bold text-[#4E342E]/80 tabular-nums block mt-1">
                            {item.estoqueMinimo}
                          </span>
                          <span className="text-[10px] text-gray-500 block">{item.unidade}</span>
                        </div>
                      </div>

                      {/* Valor total e Última movimentação */}
                      <div className="space-y-1.5 text-xs mb-3">
                        <div className="flex items-center justify-between text-[#4E342E]/80">
                          <span className="text-[11px] text-gray-500">Valor em estoque:</span>
                          <span className="font-bold text-[#4E342E] tabular-nums">
                            {formatarMoeda(valorTotalItem)}
                          </span>
                        </div>

                        {ultimasMovs.length > 0 && (
                          <div className="text-[11px] text-gray-500 bg-gray-50 p-1.5 rounded-lg border border-gray-100 flex items-center justify-between">
                            <span className="truncate">
                              Última:{' '}
                              <strong>
                                {ultimasMovs[0].tipo === 'entrada' ? '+ ' : '- '}
                                {ultimasMovs[0].quantidade} {item.unidade}
                              </strong>{' '}
                              ({ultimasMovs[0].motivo})
                            </span>
                            <span className="text-[10px] text-gray-400 whitespace-nowrap ml-1">
                              {formatarDataPtBR(ultimasMovs[0].data)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Botões do Card de Insumo */}
                    <div className="pt-3 border-t border-[#F0E4E0] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditarInsumoModal(item)}
                          className="p-1.5 text-gray-400 hover:text-[#FF1493] rounded-md transition-colors"
                          title="Editar cadastro deste insumo"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteInsumoTarget(item)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-md transition-colors"
                          title="Excluir este insumo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openMovimentacaoModal('saida', item.id)}
                          className="px-2.5 py-1 text-xs font-bold text-[#4E342E] bg-[#F5EFEA] hover:bg-[#4E342E] hover:text-white rounded-lg transition-colors flex items-center gap-1"
                          title="Dar baixa / saída deste insumo"
                        >
                          <ArrowUpRight className="w-3 h-3" />
                          <span>Saída</span>
                        </button>
                        <button
                          onClick={() => openMovimentacaoModal('entrada', item.id)}
                          className="px-2.5 py-1 text-xs font-bold text-white bg-[#FF1493] hover:bg-[#E01284] rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
                          title="Registrar entrada / compra deste insumo"
                        >
                          <ArrowDownRight className="w-3 h-3" />
                          <span>Entrada</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-ABA 2: MOVIMENTAÇÕES DE ESTOQUE */}
      {/* ========================================================= */}
      {subAba === 'movimentacoes' && (
        <div className="space-y-4">
          {/* Barra de Filtros de Movimentações */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-[#F0E4E0] flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between shadow-2xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[#4E342E]/70 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Tipo:
              </span>
              <button
                onClick={() => setFiltroTipoMov('todos')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  filtroTipoMov === 'todos'
                    ? 'bg-[#4E342E] text-white'
                    : 'bg-[#F5EFEA] text-[#4E342E]'
                }`}
              >
                Todas ({movimentacoes.length})
              </button>
              <button
                onClick={() => setFiltroTipoMov('entrada')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
                  filtroTipoMov === 'entrada'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-800'
                }`}
              >
                <ArrowDownRight className="w-3 h-3" />
                <span>Entradas</span>
              </button>
              <button
                onClick={() => setFiltroTipoMov('saida')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
                  filtroTipoMov === 'saida'
                    ? 'bg-[#FF1493] text-white'
                    : 'bg-[#FFF0F8] text-[#FF1493]'
                }`}
              >
                <ArrowUpRight className="w-3 h-3" />
                <span>Saídas</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="filtro-item-select"
                className="text-xs font-semibold text-[#4E342E]/80"
              >
                Insumo:
              </label>
              <select
                id="filtro-item-select"
                value={filtroItemMov}
                onChange={(e) => setFiltroItemMov(e.target.value)}
                className="text-xs px-2.5 py-1.5 bg-[#F5EFEA] border border-[#F0E4E0] rounded-lg text-[#4E342E] focus:ring-1 focus:ring-[#FF1493]"
              >
                <option value="todos">Todos os Insumos</option>
                {insumos.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tabela de Histórico de Movimentações */}
          {movimentacoesFiltradas.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 sm:p-12 border border-[#F0E4E0] text-center shadow-soft-pink">
              <div className="w-14 h-14 rounded-full bg-[#FFF0F8] text-[#FF1493] text-2xl flex items-center justify-center mx-auto mb-3">
                📋
              </div>
              <h3 className="text-base font-bold font-brand-serif text-[#4E342E] mb-1">
                Nenhuma movimentação registrada
              </h3>
              <p className="text-xs text-[#4E342E]/70 mb-4 max-w-sm mx-auto">
                Registre compras de fornecedores ou saídas para produção de ímãs para ver o
                histórico e recálculo automático de saldos.
              </p>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => openMovimentacaoModal('entrada')}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-full shadow-sm"
                >
                  + Nova Entrada
                </button>
                <button
                  onClick={() => openMovimentacaoModal('saida')}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#4E342E] hover:bg-black rounded-full shadow-sm"
                >
                  - Nova Saída
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#F0E4E0] shadow-soft-pink overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#FAFAFA] border-b border-[#F0E4E0] text-[#4E342E]">
                    <tr>
                      <th className="p-3 font-bold w-24">Data</th>
                      <th className="p-3 font-bold w-24">Tipo</th>
                      <th className="p-3 font-bold">Item / Insumo</th>
                      <th className="p-3 font-bold w-24 text-right">Quantidade</th>
                      <th className="p-3 font-bold w-28 text-right">Custo Unit.</th>
                      <th className="p-3 font-bold w-28">Motivo</th>
                      <th className="p-3 font-bold">Observação</th>
                      <th className="p-3 font-bold w-20 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0E4E0]">
                    {movimentacoesFiltradas.map((m) => {
                      const isEntrada = m.tipo === 'entrada'
                      const motivoLabel =
                        m.motivo === 'compra'
                          ? 'Compra'
                          : m.motivo === 'producao'
                            ? 'Produção'
                            : m.motivo === 'venda'
                              ? 'Venda'
                              : m.motivo === 'ajuste_perda'
                                ? 'Ajuste / Perda'
                                : 'Devolução'

                      return (
                        <tr key={m.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="p-3 text-gray-600 whitespace-nowrap tabular-nums">
                            {formatarDataPtBR(m.data)}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                isEntrada
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-[#FF1493]'
                              }`}
                            >
                              {isEntrada ? (
                                <ArrowDownRight className="w-3 h-3" />
                              ) : (
                                <ArrowUpRight className="w-3 h-3" />
                              )}
                              <span>{isEntrada ? 'Entrada' : 'Saída'}</span>
                            </span>
                          </td>
                          <td className="p-3 font-bold text-[#4E342E] whitespace-nowrap">
                            {m.itemNome}
                          </td>
                          <td className="p-3 font-bold tabular-nums text-right whitespace-nowrap">
                            <span className={isEntrada ? 'text-emerald-700' : 'text-[#FF1493]'}>
                              {isEntrada ? '+' : '-'} {m.quantidade}
                            </span>
                          </td>
                          <td className="p-3 tabular-nums text-right whitespace-nowrap text-gray-700">
                            {m.custoUnitario !== undefined ? formatarMoeda(m.custoUnitario) : '-'}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-md bg-[#F5EFEA] text-[#4E342E] font-medium text-[11px]">
                              {motivoLabel}
                            </span>
                          </td>
                          <td
                            className="p-3 text-[#4E342E]/80 max-w-xs truncate"
                            title={m.observacao}
                          >
                            {m.observacao || <span className="text-gray-400 italic">Sem obs</span>}
                            {m.refletirEmCustos && (
                              <span
                                className="ml-1 text-[10px] font-bold text-[#FF1493]"
                                title="Refletido em Custos"
                              >
                                🔗 Em Custos
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => openMovimentacaoModal(m.tipo, m.itemId, m)}
                                className="p-1 text-gray-400 hover:text-[#FF1493] rounded"
                                title="Editar movimentação"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteMovTarget(m)}
                                className="p-1 text-gray-400 hover:text-red-500 rounded"
                                title="Excluir movimentação"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-ABA 3: PRODUTO PRONTO (Ímãs acabados) */}
      {/* ========================================================= */}
      {subAba === 'produtosProntos' && (
        <div className="space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#F0E4E0] shadow-soft-pink flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold font-brand-serif text-[#4E342E]">
                Estoque de Ímãs Acabados (Prontos para Venda)
              </h3>
              <p className="text-xs text-[#4E342E]/70 mt-0.5">
                Saiba exatamente quantos ímãs 5x5 cm você já tem confeccionados e disponíveis para
                envio ou retirada imediata no Recreio.
              </p>
            </div>
            <button
              onClick={openNovoPPModal}
              className="px-4 py-2 text-xs font-bold text-white bg-[#FF1493] hover:bg-[#E01284] rounded-full shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Modelo / Lote Pronto</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {produtosProntos.map((pp) => {
              const valorEstoqueAcabado = pp.quantidadeDisponivel * pp.custoEstimadoUnitario

              return (
                <div
                  key={pp.id}
                  className="bg-white rounded-2xl border border-[#F0E4E0] hover:border-[#FF1493]/40 p-5 shadow-soft-pink flex flex-col justify-between transition-all"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-[#FF1493] tracking-wider block">
                          Ímã Acabado
                        </span>
                        <h4 className="text-base font-bold text-[#4E342E]">{pp.produtoNome}</h4>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-[#FFF0F8] text-[#FF1493] flex items-center justify-center font-bold text-xs shadow-2xs">
                        5x5
                      </div>
                    </div>

                    {/* Destaque da Quantidade Disponível */}
                    <div className="bg-gradient-to-r from-[#FFF0F8] to-white p-3 rounded-xl border border-[#FF1493]/20 mb-3 text-center">
                      <span className="text-[10px] font-bold text-[#FF1493] uppercase block">
                        Disponível em Mãos
                      </span>
                      <span className="text-3xl font-black font-brand-serif text-[#FF1493] tabular-nums block my-0.5">
                        {pp.quantidadeDisponivel}
                      </span>
                      <span className="text-xs text-[#4E342E]/70 font-medium">ímãs prontos</span>
                    </div>

                    {/* Detalhamento Produzidos vs Vendidos */}
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3 bg-[#F5EFEA]/50 p-2.5 rounded-xl border border-[#F0E4E0]">
                      <div>
                        <span className="text-[10px] text-gray-500 block uppercase font-semibold">
                          Total Confeccionado
                        </span>
                        <span className="text-sm font-bold text-[#4E342E] tabular-nums">
                          {pp.quantidadeProduzida} un
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-gray-500 block uppercase font-semibold">
                          Já Vendidos / Entregues
                        </span>
                        <span className="text-sm font-bold text-emerald-700 tabular-nums">
                          {pp.quantidadeVendida} un
                        </span>
                      </div>
                    </div>

                    {/* Custo estimado vinculado ao módulo Custos */}
                    <div className="space-y-1 text-xs mb-3">
                      <div className="flex items-center justify-between text-[#4E342E]/80">
                        <span className="text-[11px] text-gray-500 flex items-center gap-1">
                          <span>Custo Unit. Estimado:</span>
                          <button
                            onClick={() => handleSincronizarCustoPP(pp)}
                            className="text-[#FF1493] hover:underline"
                            title="Sincronizar com custo unitário atual do módulo Custos"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </button>
                        </span>
                        <span className="font-bold text-[#4E342E] tabular-nums">
                          {formatarMoeda(pp.custoEstimadoUnitario)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[#4E342E]/80">
                        <span className="text-[11px] text-gray-500">Valor em estoque acabado:</span>
                        <span className="font-bold text-[#FF1493] tabular-nums">
                          {formatarMoeda(valorEstoqueAcabado)}
                        </span>
                      </div>
                      {pp.observacao && (
                        <p className="text-[11px] text-gray-500 italic bg-gray-50 p-1.5 rounded-lg border border-gray-100 mt-1">
                          {pp.observacao}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Ações do Produto Pronto */}
                  <div className="pt-3 border-t border-[#F0E4E0] flex items-center justify-between">
                    <button
                      onClick={() => openEditarPPModal(pp)}
                      className="px-3 py-1.5 text-xs font-semibold text-[#4E342E] bg-[#F5EFEA] hover:bg-[#4E342E] hover:text-white rounded-full transition-colors flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Atualizar Saldo</span>
                    </button>

                    <button
                      onClick={() => handleSincronizarCustoPP(pp)}
                      className="px-2.5 py-1.5 text-xs font-semibold text-[#FF1493] hover:bg-[#FFF0F8] rounded-full transition-colors flex items-center gap-1"
                      title="Sincronizar custo com módulo Custos"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Sincronizar Custo</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: NOVO / EDITAR INSUMO DE ESTOQUE */}
      {/* ========================================================= */}
      {showNovoInsumoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#F0E4E0] relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowNovoInsumoModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-[#4E342E] rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-[#FFF0F8] text-[#FF1493] flex items-center justify-center font-bold">
                <Boxes className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold font-brand-serif text-[#4E342E]">
                {editingInsumo ? 'Editar Insumo de Estoque' : 'Novo Insumo em Estoque'}
              </h3>
            </div>
            <p className="text-xs text-[#4E342E]/70 mb-4">
              Defina unidade de medida, saldo inicial e estoque mínimo para o alerta de reposição.
            </p>

            {formInsumoError && (
              <div className="p-2.5 mb-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{formInsumoError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#4E342E] mb-1">Nome do Insumo *</label>
                <input
                  type="text"
                  placeholder="Ex: Placa magnética, Papel adesivo 135g, Bolsinha..."
                  value={formNomeInsumo}
                  onChange={(e) => setFormNomeInsumo(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-[#FF1493]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#4E342E] mb-1">Categoria</label>
                  <select
                    value={formCategoriaInsumo}
                    onChange={(e) => setFormCategoriaInsumo(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-[#FF1493]"
                  >
                    <option value="Base">Base Magnética</option>
                    <option value="Impressão">Impressão / Tintas</option>
                    <option value="Papelaria">Papelaria / Adesivo</option>
                    <option value="Acabamento">Acabamento / Laminação</option>
                    <option value="Embalagem">Embalagem / Envio</option>
                    <option value="Geral">Geral</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#4E342E] mb-1">Unidade de Medida</label>
                  <select
                    value={formUnidadeInsumo}
                    onChange={(e) => setFormUnidadeInsumo(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-[#FF1493]"
                  >
                    <option value="un">un (Unidade)</option>
                    <option value="folha">folha (Folha / Placa)</option>
                    <option value="pacote">pacote (Pacote)</option>
                    <option value="metro">metro (Metro linear)</option>
                    <option value="rolo">rolo (Rolo)</option>
                    <option value="cento">cento (Cento)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-[#4E342E] mb-1">Qtd Atual</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={formQtdInsumo}
                    onChange={(e) => setFormQtdInsumo(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-bold focus:outline-none focus:ring-1 focus:ring-[#FF1493]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#4E342E] mb-1">Custo Médio (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formCustoInsumo}
                    onChange={(e) => setFormCustoInsumo(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-bold focus:outline-none focus:ring-1 focus:ring-[#FF1493]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#FF1493] mb-1">Estoque Mínimo</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formMinimoInsumo}
                    onChange={(e) => setFormMinimoInsumo(e.target.value)}
                    className="w-full px-3 py-2 border border-[#FF1493]/40 rounded-xl font-bold text-[#FF1493] focus:outline-none focus:ring-1 focus:ring-[#FF1493]"
                  />
                </div>
              </div>

              <div className="bg-[#F5EFEA]/60 p-2.5 rounded-xl text-[11px] text-[#4E342E]/70">
                Quando a quantidade atual ficar igual ou menor que o <strong>Estoque Mínimo</strong>
                , o item receberá o badge rosa choque de alerta de reposição.
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowNovoInsumoModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveInsumo}
                className="px-5 py-2 text-xs font-bold text-white bg-[#FF1493] hover:bg-[#E01284] rounded-full shadow-sm"
              >
                {editingInsumo ? 'Salvar Alterações' : 'Cadastrar Insumo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: REGISTRAR / EDITAR MOVIMENTAÇÃO DE ESTOQUE */}
      {/* ========================================================= */}
      {showMovModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#F0E4E0] relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowMovModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-[#4E342E] rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                  movTipo === 'entrada' ? 'bg-emerald-600' : 'bg-[#FF1493]'
                }`}
              >
                {movTipo === 'entrada' ? (
                  <ArrowDownRight className="w-4 h-4" />
                ) : (
                  <ArrowUpRight className="w-4 h-4" />
                )}
              </div>
              <h3 className="text-lg font-bold font-brand-serif text-[#4E342E]">
                {editingMov
                  ? 'Editar Movimentação de Estoque'
                  : movTipo === 'entrada'
                    ? 'Registrar Entrada / Compra'
                    : 'Registrar Saída de Estoque'}
              </h3>
            </div>
            <p className="text-xs text-[#4E342E]/70 mb-4">
              {movTipo === 'entrada'
                ? 'Ao dar entrada com custo pago, a quantidade aumentará e o custo médio unitário será recalculado automaticamente.'
                : 'Ao dar saída para produção ou venda, a quantidade do insumo será reduzida mantendo o custo médio.'}
            </p>

            {movError && (
              <div className="p-2.5 mb-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{movError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              {/* Seletor de Tipo (se não estiver editando) */}
              {!editingMov && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMovTipo('entrada')
                      setMovMotivo('compra')
                    }}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      movTipo === 'entrada'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-gray-600 border-[#F0E4E0]'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4" />
                    <span>Entrada (Adiciona)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMovTipo('saida')
                      setMovMotivo('producao')
                    }}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      movTipo === 'saida'
                        ? 'bg-[#FF1493] text-white border-[#FF1493]'
                        : 'bg-white text-gray-600 border-[#F0E4E0]'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>Saída (Baixa)</span>
                  </button>
                </div>
              )}

              {/* Item / Insumo */}
              <div>
                <label className="block font-bold text-[#4E342E] mb-1">Insumo Alvo *</label>
                <select
                  value={movItemId}
                  onChange={(e) => {
                    const id = e.target.value
                    setMovItemId(id)
                    const it = insumos.find((i) => i.id === id)
                    if (it && !movCustoUnit) {
                      setMovCustoUnit(it.custoMedioUnitario.toString())
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-[#FF1493]"
                >
                  {insumos.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nome} (Atual: {i.quantidadeAtual} {i.unidade})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantidade e Custo Unitário */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#4E342E] mb-1">Quantidade *</label>
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    placeholder="Ex: 50"
                    value={movQuantidade}
                    onChange={(e) => setMovQuantidade(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-bold focus:outline-none focus:ring-1 focus:ring-[#FF1493]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#4E342E] mb-1">
                    {movTipo === 'entrada' ? 'Custo Pago Unit. (R$)' : 'Custo Unit. (opcional)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Ex: 0.60"
                    value={movCustoUnit}
                    onChange={(e) => setMovCustoUnit(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-bold focus:outline-none focus:ring-1 focus:ring-[#FF1493]"
                  />
                </div>
              </div>

              {/* Data e Motivo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#4E342E] mb-1">Data *</label>
                  <input
                    type="date"
                    value={movData}
                    onChange={(e) => setMovData(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-[#FF1493]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#4E342E] mb-1">Motivo *</label>
                  <select
                    value={movMotivo}
                    onChange={(e) => setMovMotivo(e.target.value as MotivoMovimentacaoEstoque)}
                    className="w-full px-3 py-2 border rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-[#FF1493]"
                  >
                    {movTipo === 'entrada' ? (
                      <>
                        <option value="compra">Compra de Fornecedor</option>
                        <option value="devolucao">Devolução</option>
                        <option value="ajuste_perda">Ajuste de Saldo / Inventário</option>
                      </>
                    ) : (
                      <>
                        <option value="producao">Produção de Ímãs</option>
                        <option value="venda">Venda Direta</option>
                        <option value="ajuste_perda">Ajuste / Perda / Descarte</option>
                        <option value="devolucao">Devolução ao Fornecedor</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Observação */}
              <div>
                <label className="block font-bold text-[#4E342E] mb-1">Observação</label>
                <input
                  type="text"
                  placeholder="Ex: Comprado na Papelaria Barra Bonita / Lote lembrancinhas aniversário"
                  value={movObs}
                  onChange={(e) => setMovObs(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-[#FF1493]"
                />
              </div>

              {/* Integração leve: refletir valor em Custos ao registrar compra */}
              {movTipo === 'entrada' && !editingMov && (
                <div className="p-3 bg-[#FFF0F8] border border-[#FF1493]/30 rounded-xl space-y-2">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={movRefletirCustos}
                      onChange={(e) => setMovRefletirCustos(e.target.checked)}
                      className="mt-0.5 rounded text-[#FF1493] focus:ring-[#FF1493]"
                    />
                    <span className="text-[11px] font-semibold text-[#4E342E]">
                      Refletir esta compra como lançamento no histórico do módulo{' '}
                      <strong>Custos</strong>
                    </span>
                  </label>

                  {movRefletirCustos && (
                    <div className="pt-1">
                      <span className="text-[10px] text-gray-500 block mb-1">
                        Selecione o item de custo do produto ativo onde lançar:
                      </span>
                      <select
                        value={movCustoItemId}
                        onChange={(e) => setMovCustoItemId(e.target.value)}
                        className="w-full px-2 py-1 text-xs border rounded-lg bg-white"
                      >
                        {activeProduct.itens.map((it) => (
                          <option key={it.id} value={it.id}>
                            {it.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowMovModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveMovimentacao}
                className={`px-5 py-2 text-xs font-bold text-white rounded-full shadow-sm ${
                  movTipo === 'entrada'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-[#FF1493] hover:bg-[#E01284]'
                }`}
              >
                {editingMov ? 'Salvar Alterações' : 'Confirmar Movimentação'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: PRODUTO PRONTO (ACABADO) */}
      {/* ========================================================= */}
      {showNovoProdutoProntoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#F0E4E0] relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowNovoProdutoProntoModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-[#4E342E] rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-[#FFF0F8] text-[#FF1493] flex items-center justify-center font-bold">
                <Package className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold font-brand-serif text-[#4E342E]">
                {editingPP
                  ? 'Atualizar Estoque de Produto Pronto'
                  : 'Novo Modelo Pronto para Venda'}
              </h3>
            </div>
            <p className="text-xs text-[#4E342E]/70 mb-4">
              A quantidade disponível é calculada automaticamente (Produzida - Vendida) para pronta
              entrega.
            </p>

            {ppError && (
              <div className="p-2.5 mb-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{ppError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#4E342E] mb-1">
                  Nome do Modelo / Produto *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Ímã 5x5 Avulso, Kit 3 Ímãs, Lembrancinha Festa..."
                  value={ppNome}
                  onChange={(e) => setPpNome(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-[#FF1493]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#4E342E] mb-1">
                    Qtd Produzida (un) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={ppProduzida}
                    onChange={(e) => setPpProduzida(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-bold focus:outline-none focus:ring-1 focus:ring-[#FF1493]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#4E342E] mb-1">
                    Qtd Vendida/Entregue (un) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={ppVendida}
                    onChange={(e) => setPpVendida(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-bold focus:outline-none focus:ring-1 focus:ring-[#FF1493]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-[#4E342E]">
                    Custo Unitário Estimado (R$)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setPpCusto(Number(custoUnitarioModuloCustos.toFixed(2)).toString())
                    }
                    className="text-[11px] font-bold text-[#FF1493] hover:underline"
                  >
                    Usar do Módulo Custos ({formatarMoeda(custoUnitarioModuloCustos)})
                  </button>
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={ppCusto}
                  onChange={(e) => setPpCusto(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl font-bold focus:outline-none focus:ring-1 focus:ring-[#FF1493]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#4E342E] mb-1">Observações</label>
                <input
                  type="text"
                  placeholder="Ex: Embalados em saquinho transparente com tag de agradecimento"
                  value={ppObs}
                  onChange={(e) => setPpObs(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-1 focus:ring-[#FF1493]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowNovoProdutoProntoModal(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePP}
                className="px-5 py-2 text-xs font-bold text-white bg-[#FF1493] hover:bg-[#E01284] rounded-full shadow-sm"
              >
                Salvar Produto Pronto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL DE CONFIRMAÇÃO: EXCLUIR INSUMO */}
      {/* ========================================================= */}
      {deleteInsumoTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-red-200">
            <div className="flex items-center gap-2 text-red-600 mb-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <h3 className="text-base font-bold font-brand-serif">Excluir Insumo?</h3>
            </div>
            <p className="text-xs text-[#4E342E]/80 mb-4 leading-relaxed">
              Tem certeza que deseja excluir o insumo <strong>"{deleteInsumoTarget.nome}"</strong>?
              Todas as movimentações deste item também serão removidas do estoque.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteInsumoTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeleteInsumo}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-full shadow-sm"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL DE CONFIRMAÇÃO: EXCLUIR MOVIMENTAÇÃO */}
      {/* ========================================================= */}
      {deleteMovTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-red-200">
            <div className="flex items-center gap-2 text-red-600 mb-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <h3 className="text-base font-bold font-brand-serif">Excluir Movimentação?</h3>
            </div>
            <p className="text-xs text-[#4E342E]/80 mb-4 leading-relaxed">
              Excluir esta movimentação de <strong>{deleteMovTarget.tipo}</strong> (
              {deleteMovTarget.quantidade} un) de <strong>"{deleteMovTarget.itemNome}"</strong>? O
              saldo do insumo será recalculado automaticamente.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteMovTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeleteMov}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-full shadow-sm"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
