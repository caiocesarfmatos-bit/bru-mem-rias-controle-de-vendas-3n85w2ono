import React, { useState, useMemo } from 'react'
import { useApp } from '@/context/AppContext'
import { Fornecedor, LocalizacaoFornecedor } from '@/types/app'
import { formatarMoeda, formatarTelefoneBR, criarLinkWhatsapp } from '@/lib/formatters'
import { exportarCsvFornecedores } from '@/lib/exportUtils'
import { useToast } from '@/hooks/use-toast'
import {
  Truck,
  Star,
  ExternalLink,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  TrendingDown,
  Sparkles,
  Phone,
  Clock,
  ArrowUpDown,
  FileSpreadsheet,
} from 'lucide-react'

type PrioridadeOrdenacao = 'proximo-recreio' | 'menor-preco' | 'melhor-avaliacao'

export const ModuloFornecedores: React.FC = () => {
  const { data, activeProduct, addFornecedor, updateFornecedor, deleteFornecedor } = useApp()
  const { toast } = useToast()

  // Lista de insumos derivados dos itens de custo do Módulo 1
  const insumosDisponiveis = useMemo(() => {
    return activeProduct.itens.map((it) => ({
      id: it.id,
      nome: it.nome,
    }))
  }, [activeProduct.itens])

  // Insumo selecionado atualmente
  const [selectedInsumoId, setSelectedInsumoId] = useState<string>(
    insumosDisponiveis[0]?.id || 'placa-magnetica',
  )

  // Priorizar por: Próximo do Recreio / Menor preço / Melhor avaliação
  const [prioridade, setPrioridade] = useState<PrioridadeOrdenacao>('proximo-recreio')

  // Modais
  const [showAddEditModal, setShowAddEditModal] = useState(false)
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Fornecedor | null>(null)

  // Campos do formulário
  const [formNome, setFormNome] = useState('')
  const [formContato, setFormContato] = useState('')
  const [formPreco, setFormPreco] = useState('')
  const [formPrazo, setFormPrazo] = useState('')
  const [formAvaliacao, setFormAvaliacao] = useState(5)
  const [formLink, setFormLink] = useState('')
  const [formLocalizacao, setFormLocalizacao] = useState<LocalizacaoFornecedor>(
    '📍 Recreio dos Bandeirantes',
  )
  const [formErro, setFormErro] = useState('')

  const insumoAtualObj =
    insumosDisponiveis.find((i) => i.id === selectedInsumoId) || insumosDisponiveis[0]

  // Todos os fornecedores cadastrados para o insumo selecionado
  const fornecedoresDoInsumo = useMemo(() => {
    return data.fornecedores.filter(
      (f) =>
        f.insumoId === selectedInsumoId ||
        f.insumoNome.toLowerCase() === insumoAtualObj?.nome.toLowerCase(),
    )
  }, [data.fornecedores, selectedInsumoId, insumoAtualObj])

  // Estatísticas de preço (Menor, Média e Maior preço)
  const statsPreco = useMemo(() => {
    if (fornecedoresDoInsumo.length === 0) {
      return { menor: 0, media: 0, maior: 0, fornecedorMenor: null }
    }
    const precos = fornecedoresDoInsumo.map((f) => f.preco)
    const menor = Math.min(...precos)
    const maior = Math.max(...precos)
    const media = precos.reduce((a, b) => a + b, 0) / precos.length
    const fornecedorMenor = fornecedoresDoInsumo.find((f) => f.preco === menor) || null
    return { menor, media, maior, fornecedorMenor }
  }, [fornecedoresDoInsumo])

  // Ordenar e selecionar exatamente as TOP 3 opções de fornecedor conforme a prioridade
  const top3Fornecedores = useMemo(() => {
    const ordenados = [...fornecedoresDoInsumo].sort((a, b) => {
      if (prioridade === 'proximo-recreio') {
        const score = (f: Fornecedor) => {
          if (f.localizacao.includes('Recreio')) return 1
          if (f.localizacao.includes('Rio de Janeiro')) return 2
          return 3 // Online
        }
        if (score(a) !== score(b)) return score(a) - score(b)
        // Desempate por preço
        return a.preco - b.preco
      }
      if (prioridade === 'menor-preco') {
        return a.preco - b.preco
      }
      if (prioridade === 'melhor-avaliacao') {
        return b.avaliacao - a.avaliacao
      }
      return 0
    })

    return ordenados.slice(0, 3)
  }, [fornecedoresDoInsumo, prioridade])

  // Abrir modal de criação
  const openNewFornecedorModal = () => {
    setEditingFornecedor(null)
    setFormNome('')
    setFormContato('')
    setFormPreco('')
    setFormPrazo('2 dias úteis')
    setFormAvaliacao(5)
    setFormLink('')
    setFormLocalizacao('📍 Recreio dos Bandeirantes')
    setFormErro('')
    setShowAddEditModal(true)
  }

  // Abrir modal de edição
  const openEditFornecedorModal = (f: Fornecedor) => {
    setEditingFornecedor(f)
    setFormNome(f.nome)
    setFormContato(f.contato)
    setFormPreco(f.preco.toString())
    setFormPrazo(f.prazo)
    setFormAvaliacao(f.avaliacao)
    setFormLink(f.link || '')
    setFormLocalizacao(f.localizacao)
    setFormErro('')
    setShowAddEditModal(true)
  }

  const handleSaveFornecedor = () => {
    if (!formNome.trim()) {
      setFormErro('Informe o nome do fornecedor.')
      return
    }
    const valPreco = parseFloat(formPreco.replace(',', '.'))
    if (isNaN(valPreco) || valPreco < 0) {
      setFormErro('Informe um preço unitário válido.')
      return
    }

    if (editingFornecedor) {
      updateFornecedor(editingFornecedor.id, {
        nome: formNome,
        contato: formContato,
        preco: valPreco,
        prazo: formPrazo,
        avaliacao: formAvaliacao,
        link: formLink,
        localizacao: formLocalizacao,
      })
      toast({ title: 'Fornecedor atualizado com sucesso! 💖' })
    } else {
      addFornecedor({
        insumoId: selectedInsumoId,
        insumoNome: insumoAtualObj?.nome || 'Insumo',
        nome: formNome,
        contato: formContato,
        preco: valPreco,
        prazo: formPrazo,
        avaliacao: formAvaliacao,
        link: formLink,
        localizacao: formLocalizacao,
      })
      toast({ title: 'Novo fornecedor cadastrado! ✨' })
    }

    setShowAddEditModal(false)
  }

  const handleConfirmDelete = () => {
    if (!deleteTarget) return
    deleteFornecedor(deleteTarget.id)
    setDeleteTarget(null)
    toast({ title: 'Fornecedor removido.' })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cabeçalho do Módulo */}
      <div className="bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-soft-pink flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#FF1493] uppercase tracking-wider block mb-1">
            Compras & Suprimentos
          </span>
          <h2 className="text-2xl font-brand-serif font-bold text-[#4E342E]">
            Gestão de Fornecedores dos Ímãs
          </h2>
          <p className="text-xs text-[#4E342E]/70 mt-1">
            Opções por insumo, priorizando Recreio dos Bandeirantes, RJ e lojas online.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              exportarCsvFornecedores(data)
              toast({ title: 'Planilha de Fornecedores exportada!' })
            }}
            className="px-3.5 py-2 text-xs font-semibold text-[#4E342E] bg-[#F5EFEA] hover:bg-[#4E342E] hover:text-white rounded-full transition-colors flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#FF1493]" />
            <span>Exportar Fornecedores</span>
          </button>
          <button
            onClick={openNewFornecedorModal}
            className="px-4 py-2 text-xs font-bold text-white bg-[#FF1493] hover:bg-[#E01284] rounded-full shadow-md flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Fornecedor</span>
          </button>
        </div>
      </div>

      {/* Seletor de Insumos (Chips de rolagem horizontal) */}
      <div className="bg-white rounded-2xl p-4 border border-[#F0E4E0] shadow-soft-pink">
        <span className="text-xs font-bold text-[#4E342E]/70 block mb-2 uppercase">
          Selecione o Insumo para Comparar:
        </span>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          {insumosDisponiveis.map((insumo) => {
            const isSelected = selectedInsumoId === insumo.id
            const count = data.fornecedores.filter(
              (f) =>
                f.insumoId === insumo.id ||
                f.insumoNome.toLowerCase() === insumo.nome.toLowerCase(),
            ).length

            return (
              <button
                key={insumo.id}
                onClick={() => setSelectedInsumoId(insumo.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 flex-shrink-0 ${
                  isSelected
                    ? 'bg-[#FF1493] text-white shadow-sm'
                    : 'bg-[#F5EFEA] text-[#4E342E] hover:bg-[#FF1493]/10 hover:text-[#FF1493]'
                }`}
              >
                <span>{insumo.nome}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white text-[#FF1493]' : 'bg-[#4E342E]/10'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Faixa de Comparação de Custos e Ordenação */}
      <div className="bg-gradient-to-r from-[#FFF0F8] via-white to-[#F5EFEA] rounded-2xl p-4 border border-[#FF1493]/30 shadow-soft-pink flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Faixa de Preços (Menor, Média, Maior) */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div>
            <span className="text-[10px] text-gray-500 uppercase block font-bold">Menor Preço</span>
            <span className="text-base font-bold text-emerald-700 tabular-nums">
              {formatarMoeda(statsPreco.menor)}
            </span>
          </div>

          <div className="h-7 w-px bg-gray-200" />

          <div>
            <span className="text-[10px] text-gray-500 uppercase block font-bold">Preço Médio</span>
            <span className="text-base font-bold text-[#4E342E] tabular-nums">
              {formatarMoeda(statsPreco.media)}
            </span>
          </div>

          <div className="h-7 w-px bg-gray-200" />

          <div>
            <span className="text-[10px] text-gray-500 uppercase block font-bold">Maior Preço</span>
            <span className="text-base font-bold text-gray-600 tabular-nums">
              {formatarMoeda(statsPreco.maior)}
            </span>
          </div>

          {statsPreco.fornecedorMenor && (
            <div className="bg-white px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 shadow-2xs">
              <span className="text-sm">🏆</span>
              <span>
                Mais barato: <strong>{statsPreco.fornecedorMenor.nome}</strong> (
                {formatarMoeda(statsPreco.fornecedorMenor.preco)})
              </span>
            </div>
          )}
        </div>

        {/* Seletor "Priorizar por" */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#F0E4E0] shadow-2xs">
          <ArrowUpDown className="w-3.5 h-3.5 text-[#FF1493]" />
          <label htmlFor="select-priorizar" className="text-xs font-bold text-[#4E342E]">
            Priorizar por:
          </label>
          <select
            id="select-priorizar"
            value={prioridade}
            onChange={(e) => setPrioridade(e.target.value as PrioridadeOrdenacao)}
            className="text-xs font-semibold text-[#FF1493] bg-transparent border-none focus:outline-none cursor-pointer"
          >
            <option value="proximo-recreio">📍 Próximo do Recreio</option>
            <option value="menor-preco">💰 Menor Preço</option>
            <option value="melhor-avaliacao">⭐ Melhor Avaliação</option>
          </select>
        </div>
      </div>

      {/* Grid: SEMPRE Exatamente 3 Opções de Fornecedores Visíveis */}
      {top3Fornecedores.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-[#F0E4E0] text-center shadow-soft-pink">
          <Truck className="w-12 h-12 text-[#FF1493]/40 mx-auto mb-3" />
          <h3 className="text-base font-bold font-brand-serif text-[#4E342E]">
            Nenhum fornecedor registrado para {insumoAtualObj?.nome}
          </h3>
          <p className="text-xs text-[#4E342E]/70 mb-4">
            Adicione opções de papelarias e gráficas do Recreio dos Bandeirantes ou lojas online.
          </p>
          <button
            onClick={openNewFornecedorModal}
            className="px-4 py-2 text-xs font-bold text-white bg-[#FF1493] hover:bg-[#E01284] rounded-full shadow-sm"
          >
            Cadastrar Fornecedor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {top3Fornecedores.map((forn, index) => {
            const isMenorPreco = forn.preco === statsPreco.menor
            const isRecreio = forn.localizacao.includes('Recreio')

            return (
              <div
                key={forn.id}
                className={`relative bg-white rounded-2xl p-5 border transition-all duration-150 shadow-soft-pink flex flex-col justify-between ${
                  isMenorPreco
                    ? 'border-[#FF1493] ring-1 ring-[#FF1493]/30'
                    : 'border-[#F0E4E0] hover:border-[#FF1493]/40'
                }`}
              >
                {/* Badge Destaque Opção */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#FF1493]" />
                    <span className="text-[11px] font-bold text-[#4E342E]/70 uppercase">
                      Fornecedor
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditFornecedorModal(forn)}
                      className="p-1 text-gray-400 hover:text-[#FF1493] rounded"
                      title="Editar fornecedor"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(forn)}
                      className="p-1 text-gray-400 hover:text-red-500 rounded"
                      title="Excluir fornecedor"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  {/* Badge de Localização */}
                  <div className="mb-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        isRecreio
                          ? 'bg-rose-100 text-[#FF1493] border border-[#FF1493]/30'
                          : forn.localizacao === 'Rio de Janeiro'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      <MapPin className="w-3 h-3" />
                      <span>{forn.localizacao}</span>
                    </span>
                  </div>

                  {/* Nome do Fornecedor */}
                  <h3 className="text-base font-bold text-[#4E342E] mb-2 leading-snug">
                    {forn.nome}
                  </h3>

                  {/* Preço Unitário Destacado */}
                  <div className="p-3 bg-[#F5EFEA]/60 rounded-xl border border-[#F0E4E0] mb-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] text-gray-500 font-bold uppercase">
                        Preço por Insumo
                      </span>
                      {isMenorPreco && (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                          Mais Econômico
                        </span>
                      )}
                    </div>
                    <div className="text-2xl font-black font-brand-serif text-[#FF1493] tabular-nums mt-0.5">
                      {formatarMoeda(forn.preco)}
                    </div>
                  </div>

                  {/* Prazo e Avaliação */}
                  <div className="space-y-1.5 text-xs text-[#4E342E]/80 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Prazo de entrega:</span>
                      </span>
                      <span className="font-semibold">{forn.prazo || 'Pronta entrega'}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Avaliação:</span>
                      <div className="flex items-center text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < forn.avaliacao ? 'fill-current' : 'text-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contato & Link */}
                <div className="pt-3 border-t border-[#F0E4E0] flex items-center justify-between gap-2 text-xs">
                  <div className="truncate text-[#4E342E]/70 font-medium">
                    {forn.contato ? (
                      <span className="flex items-center gap-1 truncate" title={forn.contato}>
                        <Phone className="w-3 h-3 text-[#FF1493] flex-shrink-0" />
                        <span className="truncate">{forn.contato}</span>
                      </span>
                    ) : (
                      <span className="italic text-gray-400">Sem telefone</span>
                    )}
                  </div>

                  {forn.link && (
                    <a
                      href={forn.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 text-xs font-bold text-[#FF1493] bg-[#FFF0F8] hover:bg-[#FF1493] hover:text-white rounded-lg transition-colors flex items-center gap-1 flex-shrink-0"
                    >
                      <span>Acessar</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Adicionar / Editar Fornecedor */}
      {showAddEditModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#F0E4E0] max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold font-brand-serif text-[#4E342E] mb-1">
              {editingFornecedor ? 'Editar Fornecedor' : 'Cadastrar Fornecedor'}
            </h3>
            <p className="text-xs text-[#4E342E]/70 mb-4">
              Insumo: <strong>{insumoAtualObj?.nome}</strong>
            </p>

            {formErro && (
              <div className="p-2.5 mb-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {formErro}
              </div>
            )}

            <div className="space-y-3">
              {/* Nome */}
              <div>
                <label className="block text-xs font-bold text-[#4E342E] mb-1">
                  Nome do Fornecedor / Loja
                </label>
                <input
                  type="text"
                  placeholder="Ex: Kalunga Américas Shopping, Printi..."
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-xl"
                  autoFocus
                />
              </div>

              {/* Localização (Recreio / RJ / Online) */}
              <div>
                <label className="block text-xs font-bold text-[#4E342E] mb-1">
                  Localização / Região
                </label>
                <select
                  value={formLocalizacao}
                  onChange={(e) => setFormLocalizacao(e.target.value as LocalizacaoFornecedor)}
                  className="w-full px-3 py-2 text-xs border rounded-xl font-semibold"
                >
                  <option value="📍 Recreio dos Bandeirantes">📍 Recreio dos Bandeirantes</option>
                  <option value="Rio de Janeiro">Rio de Janeiro (Barra, Centro, etc.)</option>
                  <option value="Online">Online (Shopee, Mercado Livre, Amazon...)</option>
                </select>
              </div>

              {/* Preço e Prazo */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[#4E342E] mb-1">
                    Preço Unitário (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={formPreco}
                    onChange={(e) => setFormPreco(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#4E342E] mb-1">
                    Prazo de Entrega
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 3 dias úteis"
                    value={formPrazo}
                    onChange={(e) => setFormPrazo(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-xl"
                  />
                </div>
              </div>

              {/* Contato (Telefone/Zap) */}
              <div>
                <label className="block text-xs font-bold text-[#4E342E] mb-1">
                  Contato (WhatsApp, telefone ou e-mail)
                </label>
                <input
                  type="text"
                  placeholder="(21) 98844-1234"
                  value={formContato}
                  onChange={(e) => setFormContato(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-xl"
                />
              </div>

              {/* Avaliação (1 a 5 estrelas) */}
              <div>
                <label className="block text-xs font-bold text-[#4E342E] mb-1">
                  Avaliação: {formAvaliacao} estrelas
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setFormAvaliacao(star)}
                      className="p-1 focus:outline-none"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= formAvaliacao ? 'text-amber-500 fill-current' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Link / URL */}
              <div>
                <label className="block text-xs font-bold text-[#4E342E] mb-1">
                  Link / Loja Online (Opcional)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formLink}
                  onChange={(e) => setFormLink(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-[#F0E4E0]">
              <button
                onClick={() => setShowAddEditModal(false)}
                className="px-4 py-2 text-xs font-semibold text-[#4E342E] bg-gray-100 hover:bg-gray-200 rounded-full"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveFornecedor}
                className="px-5 py-2 text-xs font-bold text-white bg-[#FF1493] hover:bg-[#E01284] rounded-full shadow-sm"
              >
                Salvar Fornecedor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmação de Exclusão */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-red-200">
            <h3 className="text-base font-bold font-brand-serif text-red-600 mb-2">
              Excluir Fornecedor?
            </h3>
            <p className="text-xs text-[#4E342E]/80 mb-4">
              Confirma a exclusão de <strong>{deleteTarget.nome}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-[#4E342E] bg-gray-100 rounded-full"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-full"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
