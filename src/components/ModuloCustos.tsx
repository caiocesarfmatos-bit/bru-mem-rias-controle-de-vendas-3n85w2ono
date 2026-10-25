import React, { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { CustoItem, CustoLancamento } from '@/types/app'
import { formatarMoeda, formatarDataPtBR } from '@/lib/formatters'
import { useToast } from '@/hooks/use-toast'
import {
  Plus,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  Package,
  Layers,
  Sparkles,
  TrendingDown,
  HelpCircle,
  AlertCircle,
} from 'lucide-react'

export const ModuloCustos: React.FC = () => {
  const {
    data,
    activeProduct,
    setActiveProductId,
    updateProdutoLote,
    updateCustoBase,
    addCustoLancamento,
    editCustoLancamento,
    deleteCustoLancamento,
    createProduto,
    renameProduto,
    deleteProduto,
  } = useApp()

  const { toast } = useToast()

  // Estados de produto / kit
  const [showNewProdModal, setShowNewProdModal] = useState(false)
  const [newProdName, setNewProdName] = useState('')
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [renameText, setRenameText] = useState('')
  const [deleteProdTargetId, setDeleteProdTargetId] = useState<string | null>(null)

  // Estado de lançamento extra ativo (para abrir formulário em um item específico)
  const [addingToItemId, setAddingToItemId] = useState<string | null>(null)
  const [editingLancamento, setEditingLancamento] = useState<{
    itemId: string
    lancamento: CustoLancamento
  } | null>(null)

  // Campos do formulário de lançamento extra
  const [extraData, setExtraData] = useState(new Date().toISOString().split('T')[0])
  const [extraDesc, setExtraDesc] = useState('')
  const [extraValor, setExtraValor] = useState<string>('')
  const [formError, setFormError] = useState('')

  // Expandir / recolher histórico por item
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})

  // Confirmação de exclusão de lançamento
  const [deleteLancTarget, setDeleteLancTarget] = useState<{
    itemId: string
    lancId: string
    desc: string
  } | null>(null)

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }))
  }

  // Cálculos automáticos de custos
  // Item Total = custoBase + soma dos lançamentos extras
  const itensCalculados = activeProduct.itens.map((item) => {
    const somaExtras = item.lancamentos.reduce((acc, l) => acc + l.valor, 0)
    const itemTotal = item.custoBase + somaExtras
    const custoUnidadeItem = itemTotal / Math.max(1, item.unidadesCobertas || 1)
    return {
      ...item,
      somaExtras,
      itemTotal,
      custoUnidadeItem,
    }
  })

  // Custo total do lote = soma de todos os itens totais
  const custoTotalLote = itensCalculados.reduce((acc, it) => acc + it.itemTotal, 0)
  // Custo por unidade = Custo total / unidades do lote
  const unidadesLote = Math.max(1, activeProduct.unidadesLote || 100)
  const custoPorUnidade = custoTotalLote / unidadesLote

  // Manipular abertura do form de lançamento
  const openAddForm = (itemId: string) => {
    setAddingToItemId(itemId)
    setEditingLancamento(null)
    setExtraData(new Date().toISOString().split('T')[0])
    setExtraDesc('')
    setExtraValor('')
    setFormError('')
  }

  const openEditForm = (itemId: string, lanc: CustoLancamento) => {
    setEditingLancamento({ itemId, lancamento: lanc })
    setAddingToItemId(itemId)
    setExtraData(lanc.data)
    setExtraDesc(lanc.descricao)
    setExtraValor(lanc.valor.toString())
    setFormError('')
  }

  const cancelForm = () => {
    setAddingToItemId(null)
    setEditingLancamento(null)
    setFormError('')
  }

  const handleSaveLancamento = (itemId: string) => {
    if (!extraDesc.trim()) {
      setFormError('Informe a descrição do gasto.')
      return
    }
    const val = parseFloat(extraValor.replace(',', '.'))
    if (isNaN(val) || val <= 0) {
      setFormError('Informe um valor numérico válido maior que zero.')
      return
    }

    if (editingLancamento) {
      editCustoLancamento(activeProduct.id, itemId, editingLancamento.lancamento.id, {
        data: extraData,
        descricao: extraDesc,
        valor: val,
      })
      toast({ title: 'Gasto extra atualizado!' })
    } else {
      addCustoLancamento(activeProduct.id, itemId, {
        data: extraData,
        descricao: extraDesc,
        valor: val,
      })
      toast({ title: 'Gasto extra adicionado com sucesso! ✨' })
      // Auto-expandir histórico do item para mostrar
      setExpandedItems((prev) => ({ ...prev, [itemId]: true }))
    }

    cancelForm()
  }

  const handleConfirmDeleteLancamento = () => {
    if (!deleteLancTarget) return
    deleteCustoLancamento(activeProduct.id, deleteLancTarget.itemId, deleteLancTarget.lancId)
    toast({ title: 'Lançamento excluído com sucesso.' })
    setDeleteLancTarget(null)
  }

  // Criar novo Produto / Kit
  const handleCreateProd = () => {
    if (!newProdName.trim()) return
    createProduto(newProdName.trim(), 100)
    setNewProdName('')
    setShowNewProdModal(false)
    toast({ title: `Produto "${newProdName.trim()}" criado com sucesso! 💖` })
  }

  // Renomear Produto
  const handleRenameProd = () => {
    if (!renameText.trim()) return
    renameProduto(activeProduct.id, renameText.trim())
    setShowRenameModal(false)
    toast({ title: 'Produto renomeado!' })
  }

  // Excluir Produto
  const handleConfirmDeleteProd = () => {
    if (!deleteProdTargetId) return
    deleteProduto(deleteProdTargetId)
    setDeleteProdTargetId(null)
    toast({ title: 'Produto excluído.' })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Barra de Seleção de Produtos / Kits */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#F0E4E0] shadow-soft-pink flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#FF1493] uppercase tracking-wider block mb-1">
            Módulo 1 • Controle de Custos
          </span>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-brand-serif font-bold text-[#4E342E]">
              {activeProduct.nome}
            </h2>
            <button
              onClick={() => {
                setRenameText(activeProduct.nome)
                setShowRenameModal(true)
              }}
              className="p-1.5 text-gray-400 hover:text-[#FF1493] rounded-md transition-colors"
              title="Renomear produto atual"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            {data.produtos.length > 1 && (
              <button
                onClick={() => setDeleteProdTargetId(activeProduct.id)}
                className="p-1.5 text-gray-400 hover:text-red-500 rounded-md transition-colors"
                title="Excluir este produto/kit"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-xs text-[#4E342E]/70 mt-0.5">
            10 insumos base do ímã 5x5 cm • Adicione compras reais e gastos extras
          </p>
        </div>

        {/* Chips de troca de produto e botão criar */}
        <div className="flex flex-wrap items-center gap-2">
          {data.produtos.map((p) => {
            const isSelected = p.id === activeProduct.id
            return (
              <button
                key={p.id}
                onClick={() => setActiveProductId(p.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all duration-150 ${
                  isSelected
                    ? 'bg-[#FF1493] text-white shadow-sm'
                    : 'bg-[#F5EFEA] text-[#4E342E] hover:bg-[#FF1493]/10 hover:text-[#FF1493]'
                }`}
              >
                {p.nome}
              </button>
            )
          })}
          <button
            onClick={() => setShowNewProdModal(true)}
            className="px-3 py-1.5 text-xs font-semibold text-[#FF1493] bg-[#FFF0F8] border border-[#FF1493]/30 hover:bg-[#FF1493] hover:text-white rounded-full transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Kit/Produto</span>
          </button>
        </div>
      </div>

      {/* Resumo Fixo / Sticky Bar no Topo do Módulo */}
      <div className="sticky top-[108px] z-30 bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-[#FF1493]/30 shadow-md">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          {/* Custo Total do Lote */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFF0F8] text-[#FF1493] flex items-center justify-center font-bold">
              💰
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#4E342E]/70 block uppercase">
                Custo Total (Lote)
              </span>
              <span className="text-xl sm:text-2xl font-bold font-brand-serif text-[#4E342E] tabular-nums">
                {formatarMoeda(custoTotalLote)}
              </span>
            </div>
          </div>

          {/* Campo Editável de Unidades do Lote */}
          <div className="flex items-center gap-2 bg-[#F5EFEA]/70 px-3 py-2 rounded-xl border border-[#F0E4E0]">
            <Package className="w-5 h-5 text-[#FF1493] flex-shrink-0" />
            <div className="flex-1">
              <label
                htmlFor="unidades-lote-input"
                className="text-[11px] font-bold text-[#4E342E]/80 block"
              >
                Unidades do Lote:
              </label>
              <div className="flex items-center gap-1 mt-0.5">
                <input
                  id="unidades-lote-input"
                  type="number"
                  min="1"
                  max="10000"
                  value={activeProduct.unidadesLote || 100}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10)
                    if (!isNaN(val)) {
                      updateProdutoLote(activeProduct.id, val)
                    }
                  }}
                  className="w-20 px-2 py-0.5 text-sm font-bold bg-white border border-[#F0E4E0] rounded-md focus:outline-none focus:ring-1 focus:ring-[#FF1493]"
                />
                <span className="text-xs text-[#4E342E]/70 font-medium">ímãs 5x5</span>
              </div>
            </div>
          </div>

          {/* Custo Por Unidade (Destacado) */}
          <div className="flex items-center gap-3 sm:justify-end bg-gradient-to-r from-[#FFF0F8] to-white p-2.5 rounded-xl border border-[#FF1493]/20">
            <div className="text-right flex-1 sm:flex-initial">
              <span className="text-[11px] font-bold text-[#FF1493] uppercase block">
                Custo por Unidade
              </span>
              <span className="text-2xl font-black text-[#FF1493] tabular-nums">
                {formatarMoeda(custoPorUnidade)}
              </span>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#FF1493] text-white flex items-center justify-center font-bold text-xs shadow-sm">
              un
            </div>
          </div>
        </div>
      </div>

      {/* Grid com os 10 Itens Base */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {itensCalculados.map((item, index) => {
          const isExpanded = Boolean(expandedItems[item.id])
          const isAdding = addingToItemId === item.id
          const hasLancamentos = item.lancamentos.length > 0

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-[#F0E4E0] hover:border-[#FF1493]/40 p-4 transition-all duration-150 shadow-soft-pink flex flex-col justify-between"
            >
              <div>
                {/* Cabeçalho do Card */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#FFF0F8] text-[#FF1493] text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-[#4E342E]">{item.nome}</h3>
                      <span className="text-[11px] text-[#4E342E]/70">
                        Custo unitário do item:{' '}
                        <strong className="text-[#FF1493]">
                          {formatarMoeda(item.custoUnidadeItem)}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Botão "+" Rosa Choque Circular */}
                  <button
                    onClick={() => (isAdding ? cancelForm() : openAddForm(item.id))}
                    className="w-8 h-8 rounded-full bg-[#FF1493] hover:bg-[#E01284] text-white flex items-center justify-center shadow-sm transition-transform active:scale-95 flex-shrink-0"
                    title="Adicionar gasto ou compra extra neste item"
                    aria-label={`Adicionar gasto em ${item.nome}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Custo Base Editável Inline + Soma dos Extras */}
                <div className="grid grid-cols-2 gap-2 bg-[#F5EFEA]/40 p-2.5 rounded-xl border border-[#F0E4E0]/80 mb-3 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-[#4E342E]/80 block mb-1">
                      Custo Base (R$)
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500 font-medium">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.custoBase}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value)
                          if (!isNaN(val)) {
                            updateCustoBase(activeProduct.id, item.id, val)
                          }
                        }}
                        className="w-20 px-2 py-1 bg-white border border-[#F0E4E0] rounded-md font-bold text-[#4E342E] focus:outline-none focus:ring-1 focus:ring-[#FF1493]"
                      />
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-semibold text-[#4E342E]/80 block mb-1">
                      Total deste Item
                    </span>
                    <span className="text-base font-bold text-[#4E342E] tabular-nums">
                      {formatarMoeda(item.itemTotal)}
                    </span>
                    {item.somaExtras > 0 && (
                      <span className="block text-[10px] text-emerald-700 font-medium">
                        +{formatarMoeda(item.somaExtras)} extras
                      </span>
                    )}
                  </div>
                </div>

                {/* Formulário Inline de Lançamento Extra (quando clicado no + ou edit) */}
                {isAdding && (
                  <div className="mb-3 p-3 bg-[#FFF0F8] border border-[#FF1493]/30 rounded-xl animate-fade-in">
                    <h4 className="text-xs font-bold text-[#FF1493] mb-2">
                      {editingLancamento ? 'Editar Gasto Extra' : 'Novo Lançamento / Compra Real'}
                    </h4>
                    {formError && (
                      <div className="p-2 mb-2 bg-red-50 text-red-700 text-xs rounded-lg flex items-center gap-1.5 border border-red-200">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{formError}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                      <div>
                        <label className="text-[10px] font-bold text-[#4E342E] block">Data</label>
                        <input
                          type="date"
                          value={extraData}
                          onChange={(e) => setExtraData(e.target.value)}
                          className="w-full text-xs px-2 py-1.5 bg-white border border-[#F0E4E0] rounded-md focus:ring-1 focus:ring-[#FF1493]"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-bold text-[#4E342E] block">
                          Descrição
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Compra Kalunga 100 folhas"
                          value={extraDesc}
                          onChange={(e) => setExtraDesc(e.target.value)}
                          className="w-full text-xs px-2 py-1.5 bg-white border border-[#F0E4E0] rounded-md focus:ring-1 focus:ring-[#FF1493]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="w-36">
                        <label className="text-[10px] font-bold text-[#4E342E] block">
                          Valor (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0,00"
                          value={extraValor}
                          onChange={(e) => setExtraValor(e.target.value)}
                          className="w-full text-xs px-2 py-1.5 bg-white border border-[#F0E4E0] rounded-md font-bold focus:ring-1 focus:ring-[#FF1493]"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 pt-3">
                        <button
                          type="button"
                          onClick={cancelForm}
                          className="px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-gray-800"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveLancamento(item.id)}
                          className="px-3 py-1 text-xs font-bold text-white bg-[#FF1493] hover:bg-[#E01284] rounded-full shadow-sm"
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Histórico Colapsável de Lançamentos Extras */}
              <div className="border-t border-[#F0E4E0]/80 pt-2 mt-1">
                <button
                  type="button"
                  onClick={() => toggleExpand(item.id)}
                  className="w-full flex items-center justify-between text-xs text-[#4E342E]/80 hover:text-[#FF1493] py-1 font-medium"
                >
                  <span className="flex items-center gap-1.5">
                    <span>Histórico de compras e gastos</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-gray-100 text-[10px] font-bold">
                      {item.lancamentos.length}
                    </span>
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {isExpanded && (
                  <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {item.lancamentos.length === 0 ? (
                      <p className="text-[11px] text-gray-400 italic py-1 text-center">
                        Nenhum gasto extra lançado para este item ainda.
                      </p>
                    ) : (
                      item.lancamentos.map((lanc) => (
                        <div
                          key={lanc.id}
                          className="flex items-center justify-between p-2 bg-[#FAFAFA] rounded-lg border border-gray-100 text-xs hover:bg-[#FFF0F8]/40 transition-colors"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="font-medium text-[#4E342E] truncate">
                              {lanc.descricao}
                            </div>
                            <span className="text-[10px] text-gray-400">
                              {formatarDataPtBR(lanc.data)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="font-bold text-[#4E342E] tabular-nums">
                              {formatarMoeda(lanc.valor)}
                            </span>
                            <button
                              onClick={() => openEditForm(item.id, lanc)}
                              className="p-1 text-gray-400 hover:text-[#FF1493] rounded"
                              title="Editar gasto"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() =>
                                setDeleteLancTarget({
                                  itemId: item.id,
                                  lancId: lanc.id,
                                  desc: lanc.descricao,
                                })
                              }
                              className="p-1 text-gray-400 hover:text-red-500 rounded"
                              title="Excluir gasto"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Criar Novo Kit/Produto */}
      {showNewProdModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#F0E4E0]">
            <h3 className="text-lg font-bold font-brand-serif text-[#4E342E] mb-2">
              Novo Produto ou Kit
            </h3>
            <p className="text-xs text-[#4E342E]/70 mb-4">
              O novo produto herdará a estrutura dos 10 insumos padrão para você personalizar os
              valores.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-bold text-[#4E342E] mb-1">
                Nome do Produto/Kit
              </label>
              <input
                type="text"
                placeholder="Ex: Kit 5 Ímãs Polaroids"
                value={newProdName}
                onChange={(e) => setNewProdName(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1493]"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNewProdModal(false)}
                className="px-4 py-2 text-xs font-semibold text-[#4E342E] bg-gray-100 hover:bg-gray-200 rounded-full"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateProd}
                disabled={!newProdName.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#FF1493] hover:bg-[#E01284] disabled:opacity-50 rounded-full"
              >
                Criar Produto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Renomear Produto */}
      {showRenameModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#F0E4E0]">
            <h3 className="text-lg font-bold font-brand-serif text-[#4E342E] mb-2">
              Renomear Produto
            </h3>
            <div className="mb-4">
              <input
                type="text"
                value={renameText}
                onChange={(e) => setRenameText(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1493]"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRenameModal(false)}
                className="px-4 py-2 text-xs font-semibold text-[#4E342E] bg-gray-100 rounded-full"
              >
                Cancelar
              </button>
              <button
                onClick={handleRenameProd}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#FF1493] rounded-full"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmação de Exclusão de Produto */}
      {deleteProdTargetId && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-red-200">
            <h3 className="text-lg font-bold font-brand-serif text-red-600 mb-2">
              Excluir Produto?
            </h3>
            <p className="text-xs text-[#4E342E]/80 mb-4">
              Tem certeza que deseja remover este produto/kit e todos os seus custos personalizados?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteProdTargetId(null)}
                className="px-4 py-2 text-xs font-semibold text-[#4E342E] bg-gray-100 rounded-full"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeleteProd}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-full"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmação de Exclusão de Lançamento */}
      {deleteLancTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#F0E4E0]">
            <h3 className="text-base font-bold text-[#4E342E] mb-2">Excluir este lançamento?</h3>
            <p className="text-xs text-[#4E342E]/80 mb-4">
              Confirma a exclusão de <strong>"{deleteLancTarget.desc}"</strong>? O custo total será
              recalculado imediatamente.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteLancTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-[#4E342E] bg-gray-100 rounded-full"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeleteLancamento}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-full"
              >
                Excluir Lançamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
