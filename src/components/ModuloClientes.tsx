import React, { useState, useMemo } from 'react'
import { useApp } from '@/context/AppContext'
import { Cliente, PedidoCliente, OrderStatus } from '@/types/app'
import {
  formatarMoeda,
  formatarDataPtBR,
  formatarTelefoneBR,
  validarTelefoneBR,
  validarEmail,
  criarLinkWhatsapp,
} from '@/lib/formatters'
import { exportarCsvClientes, exportarJson } from '@/lib/exportUtils'
import { useToast } from '@/hooks/use-toast'
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Phone,
  MessageCircle,
  Instagram,
  Facebook,
  Heart,
  Edit2,
  Trash2,
  ExternalLink,
  ShoppingBag,
  FileSpreadsheet,
  Download,
  AlertCircle,
  Plus,
  CheckCircle,
  Clock,
  Sparkles,
  MapPin,
} from 'lucide-react'

export const ModuloClientes: React.FC = () => {
  const {
    data,
    audit,
    addCliente,
    updateCliente,
    deleteCliente,
    addPedidoCliente,
    updatePedidoStatus,
    deletePedidoCliente,
    activeProduct,
  } = useApp()

  const { toast } = useToast()

  // Estados de busca e filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCanal, setFilterCanal] = useState<string>('todos')
  const [filterConsent, setFilterConsent] = useState<string>('todos')
  const [filterAtivos90d, setFilterAtivos90d] = useState(false)

  // Modais
  const [showAddEditModal, setShowAddEditModal] = useState(false)
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null)

  // Modal de Histórico de Compras do Cliente
  const [selectedClienteHistory, setSelectedClienteHistory] = useState<Cliente | null>(null)
  const [showManualOrderModal, setShowManualOrderModal] = useState(false)

  // Modal de Exclusão com confirmação
  const [deleteTargetCliente, setDeleteTargetCliente] = useState<Cliente | null>(null)

  // Formulário de Cliente (com validação estrita e LGPD obrigatório)
  const [nome, setNome] = useState('')
  const [endereco, setEndereco] = useState('')
  const [telefoneWhatsapp, setTelefoneWhatsapp] = useState('')
  const [telefoneRecado, setTelefoneRecado] = useState('')
  const [email, setEmail] = useState('')
  const [instagram, setInstagram] = useState('')
  const [facebook, setFacebook] = useState('')
  const [tiktok, setTiktok] = useState('')
  const [outrosCanais, setOutrosCanais] = useState('')
  const [consentimentoLgpd, setConsentimentoLgpd] = useState(true)

  // Erros de validação inline
  const [erros, setErros] = useState<Record<string, string>>({})

  // Formulário de compra manual para o cliente
  const [manualQtd, setManualQtd] = useState(4)
  const [manualPreco, setManualPreco] = useState(14.99)
  const [manualCusto, setManualCusto] = useState(3.2)
  const [manualStatus, setManualStatus] = useState<OrderStatus>('Fechado')
  const [manualData, setManualData] = useState(new Date().toISOString().split('T')[0])
  const [manualObs, setManualObs] = useState('')

  // Limite de 90 dias para clientes ativos
  const noventaDiasAtras = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 90)
    return d.toISOString().split('T')[0]
  }, [])

  // Filtragem e busca
  const clientesFiltrados = useMemo(() => {
    return data.clientes.filter((cli) => {
      // Busca por nome, telefone, email, instagram
      const termo = searchTerm.toLowerCase().trim()
      if (termo) {
        const bateuNome = cli.nome.toLowerCase().includes(termo)
        const bateuTel = cli.telefoneWhatsapp.includes(termo) || cli.telefoneRecado.includes(termo)
        const bateuEmail = cli.email.toLowerCase().includes(termo)
        const bateuInsta = cli.instagram.toLowerCase().includes(termo)
        if (!bateuNome && !bateuTel && !bateuEmail && !bateuInsta) {
          return false
        }
      }

      // Filtro de canal
      if (filterCanal !== 'todos') {
        if (filterCanal === 'instagram' && !cli.instagram) return false
        if (filterCanal === 'facebook' && !cli.facebook) return false
        if (filterCanal === 'tiktok' && !cli.tiktok) return false
        if (filterCanal === 'outros' && !cli.outrosCanais) return false
      }

      // Filtro de consentimento LGPD
      if (filterConsent === 'com' && !cli.consentimentoLgpd) return false
      if (filterConsent === 'sem' && cli.consentimentoLgpd) return false

      // Clientes ativos nos últimos 90 dias
      if (filterAtivos90d) {
        const comprouRecente = cli.pedidos.some((p) => p.data >= noventaDiasAtras)
        if (!comprouRecente) return false
      }

      return true
    })
  }, [data.clientes, searchTerm, filterCanal, filterConsent, filterAtivos90d, noventaDiasAtras])

  // Abrir Modal de Cadastro
  const openNewClienteModal = () => {
    setEditingCliente(null)
    setNome('')
    setEndereco('')
    setTelefoneWhatsapp('')
    setTelefoneRecado('')
    setEmail('')
    setInstagram('')
    setFacebook('')
    setTiktok('')
    setOutrosCanais('')
    setConsentimentoLgpd(true)
    setErros({})
    setShowAddEditModal(true)
  }

  // Abrir Modal de Edição
  const openEditClienteModal = (c: Cliente) => {
    setEditingCliente(c)
    setNome(c.nome)
    setEndereco(c.endereco || '')
    setTelefoneWhatsapp(c.telefoneWhatsapp || '')
    setTelefoneRecado(c.telefoneRecado || '')
    setEmail(c.email || '')
    setInstagram(c.instagram || '')
    setFacebook(c.facebook || '')
    setTiktok(c.tiktok || '')
    setOutrosCanais(c.outrosCanais || '')
    setConsentimentoLgpd(c.consentimentoLgpd)
    setErros({})
    setShowAddEditModal(true)
  }

  // Validação estrita
  const handleSaveCliente = () => {
    const novosErros: Record<string, string> = {}

    if (!nome.trim()) {
      novosErros.nome = 'O nome da cliente é obrigatório.'
    }

    if (telefoneWhatsapp.trim() && !validarTelefoneBR(telefoneWhatsapp)) {
      novosErros.telefoneWhatsapp = 'Informe um WhatsApp brasileiro válido (ex: (21) 98765-4321).'
    }

    if (email.trim() && !validarEmail(email)) {
      novosErros.email = 'E-mail inválido.'
    }

    if (!consentimentoLgpd) {
      novosErros.consentimentoLgpd =
        'É obrigatório que a cliente autorize o recebimento de divulgações (LGPD).'
    }

    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros)
      return
    }

    if (editingCliente) {
      updateCliente(editingCliente.id, {
        nome,
        endereco,
        telefoneWhatsapp,
        telefoneRecado,
        email,
        instagram: instagram.startsWith('@') || !instagram ? instagram : `@${instagram}`,
        facebook,
        tiktok: tiktok.startsWith('@') || !tiktok ? tiktok : `@${tiktok}`,
        outrosCanais,
        consentimentoLgpd,
      })
      toast({ title: 'Cliente atualizada com sucesso! 💖' })
    } else {
      addCliente({
        nome,
        endereco,
        telefoneWhatsapp,
        telefoneRecado,
        email,
        instagram: instagram.startsWith('@') || !instagram ? instagram : `@${instagram}`,
        facebook,
        tiktok: tiktok.startsWith('@') || !tiktok ? tiktok : `@${tiktok}`,
        outrosCanais,
        consentimentoLgpd,
      })
      toast({ title: 'Nova cliente cadastrada com sucesso! ✨' })
    }

    setShowAddEditModal(false)
  }

  // Excluir cliente
  const handleConfirmDelete = () => {
    if (!deleteTargetCliente) return
    deleteCliente(deleteTargetCliente.id)
    if (selectedClienteHistory?.id === deleteTargetCliente.id) {
      setSelectedClienteHistory(null)
    }
    setDeleteTargetCliente(null)
    toast({ title: 'Cliente excluída.' })
  }

  // Adicionar compra manual no histórico do cliente
  const handleAddManualOrder = () => {
    if (!selectedClienteHistory) return
    const qtd = Math.max(1, manualQtd)
    const receita = qtd * manualPreco
    const custo = qtd * manualCusto
    const lucro = Math.max(0, receita - custo)
    const margem = receita > 0 ? (lucro / receita) * 100 : 0

    addPedidoCliente(selectedClienteHistory.id, {
      produtoId: activeProduct.id,
      produtoNome: activeProduct.nome,
      data: manualData,
      quantidade: qtd,
      precoUnitario: manualPreco,
      custoUnitario: manualCusto,
      desconto: 0,
      impostosPct: 0,
      taxaCartaoPct: 0,
      frete: 0,
      receita,
      custoTotal: custo,
      lucroBruto: lucro,
      lucroLiquido: lucro,
      margemPct: margem,
      status: manualStatus,
      observacoes: manualObs,
    })

    setShowManualOrderModal(false)
    setManualObs('')
    // Atualiza estado do cliente selecionado no histórico
    const cliAtualizado = data.clientes.find((c) => c.id === selectedClienteHistory.id)
    if (cliAtualizado) {
      setSelectedClienteHistory(cliAtualizado)
    }
    toast({ title: 'Compra adicionada ao histórico da cliente!' })
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Barra Superior do Módulo */}
      <div className="bg-white rounded-2xl p-5 border border-[#F0E4E0] shadow-soft-pink flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#FF1493] uppercase tracking-wider block mb-1">
            Módulo 3 • Gestão de Clientes & CRM
          </span>
          <h2 className="text-2xl font-brand-serif font-bold text-[#4E342E]">
            Cadastro & Histórico de Clientes
          </h2>
          <p className="text-xs text-[#4E342E]/70 mt-1">
            Contatos, WhatsApp com 1 clique, consentimento LGPD e histórico de pedidos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Botão Exportar CSV */}
          <button
            onClick={() => {
              exportarCsvClientes(data)
              toast({ title: 'Planilha CSV de clientes exportada com sucesso!' })
            }}
            className="px-3.5 py-2 text-xs font-semibold text-[#4E342E] bg-[#F5EFEA] hover:bg-[#4E342E] hover:text-white rounded-full transition-colors flex items-center gap-1.5"
            title="Exportar clientes para CSV compatível com Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#FF1493]" />
            <span>Exportar CSV</span>
          </button>

          {/* Botão Cadastrar Novo Cliente */}
          <button
            onClick={openNewClienteModal}
            className="px-4 py-2 text-xs font-bold text-white bg-[#FF1493] hover:bg-[#E01284] rounded-full shadow-md transition-all flex items-center gap-1.5 active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nova Cliente</span>
          </button>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="bg-white rounded-2xl p-4 border border-[#F0E4E0] shadow-soft-pink flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Campo de Busca */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone, e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FAFAFA] border border-[#F0E4E0] rounded-xl focus:bg-white focus:ring-1 focus:ring-[#FF1493]"
          />
        </div>

        {/* Filtros em Linha */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          {/* Filtro por Canal */}
          <select
            value={filterCanal}
            onChange={(e) => setFilterCanal(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-[#F5EFEA] border border-[#F0E4E0] rounded-lg text-[#4E342E] focus:ring-1 focus:ring-[#FF1493]"
          >
            <option value="todos">Todos os canais</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="tiktok">TikTok</option>
            <option value="outros">Outros canais</option>
          </select>

          {/* Filtro Consentimento */}
          <select
            value={filterConsent}
            onChange={(e) => setFilterConsent(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-[#F5EFEA] border border-[#F0E4E0] rounded-lg text-[#4E342E] focus:ring-1 focus:ring-[#FF1493]"
          >
            <option value="todos">LGPD (Todos)</option>
            <option value="com">Com consentimento</option>
            <option value="sem">Sem consentimento</option>
          </select>

          {/* Toggle Clientes Ativos (últimos 90 dias) */}
          <button
            onClick={() => setFilterAtivos90d(!filterAtivos90d)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
              filterAtivos90d
                ? 'bg-[#FF1493] text-white border-[#FF1493]'
                : 'bg-white text-[#4E342E] border-[#F0E4E0] hover:border-[#FF1493]'
            }`}
          >
            🔥 Ativos (90d)
          </button>
        </div>
      </div>

      {/* Grid de Cards de Clientes */}
      {clientesFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 border border-[#F0E4E0] text-center shadow-soft-pink">
          <div className="w-14 h-14 rounded-full bg-[#FFF0F8] text-[#FF1493] text-2xl flex items-center justify-center mx-auto mb-3">
            💌
          </div>
          <h3 className="text-base font-bold font-brand-serif text-[#4E342E] mb-1">
            Nenhuma cliente encontrada
          </h3>
          <p className="text-xs text-[#4E342E]/70 mb-4 max-w-sm mx-auto">
            {searchTerm || filterCanal !== 'todos' || filterAtivos90d
              ? 'Tente ajustar os filtros ou termo de busca acima.'
              : 'Comece cadastrando sua primeira cliente de ímãs para salvar pedidos e manter contato.'}
          </p>
          <button
            onClick={openNewClienteModal}
            className="px-4 py-2 text-xs font-bold text-white bg-[#FF1493] hover:bg-[#E01284] rounded-full shadow-sm"
          >
            Cadastrar Primeira Cliente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientesFiltrados.map((cli) => {
            const totalGasto = cli.pedidos.reduce((acc, p) => acc + (p.receita || 0), 0)
            const comprouRecente = cli.pedidos.some((p) => p.data >= noventaDiasAtras)
            const linkZap = cli.telefoneWhatsapp
              ? criarLinkWhatsapp(
                  cli.telefoneWhatsapp,
                  `Olá, ${cli.nome}! Aqui é da Bru Memórias 💖 Tudo bem com os seus ímãs?`,
                )
              : '#'

            return (
              <div
                key={cli.id}
                className="bg-white rounded-2xl border border-[#F0E4E0] hover:border-[#FF1493]/40 p-4 transition-all duration-150 shadow-soft-pink flex flex-col justify-between"
              >
                <div>
                  {/* Cabeçalho do Card */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-base font-bold text-[#4E342E] truncate">{cli.nome}</h3>
                        {cli.consentimentoLgpd && (
                          <span
                            className="text-[#FF1493] flex-shrink-0"
                            title="Consentimento LGPD ativo"
                          >
                            <Heart className="w-3.5 h-3.5 fill-current" />
                          </span>
                        )}
                      </div>
                      {cli.endereco && (
                        <p className="text-[11px] text-[#4E342E]/60 truncate flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-[#FF1493] flex-shrink-0" />
                          <span>{cli.endereco}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => openEditClienteModal(cli)}
                        className="p-1.5 text-gray-400 hover:text-[#FF1493] rounded"
                        title="Editar cliente"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTargetCliente(cli)}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                        title="Excluir cliente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* WhatsApp e Redes */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {cli.telefoneWhatsapp ? (
                      <a
                        href={linkZap}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
                        title="Conversar no WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-current" />
                        <span>{cli.telefoneWhatsapp}</span>
                      </a>
                    ) : (
                      <span className="text-[11px] text-gray-400 italic">Sem WhatsApp</span>
                    )}

                    {cli.instagram && (
                      <a
                        href={`https://instagram.com/${cli.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium bg-[#FFF0F8] text-[#FF1493] hover:underline rounded-md"
                      >
                        <Instagram className="w-3 h-3" />
                        <span>{cli.instagram}</span>
                      </a>
                    )}

                    {cli.tiktok && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded">
                        TikTok: {cli.tiktok}
                      </span>
                    )}

                    {cli.facebook && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded">
                        FB
                      </span>
                    )}

                    {comprouRecente && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-rose-100 text-[#FF1493] font-bold rounded">
                        Ativa 🔥
                      </span>
                    )}
                  </div>
                </div>

                {/* Rodapé do Card: Total Gasto & Botão Histórico */}
                <div className="pt-3 border-t border-[#F0E4E0] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-gray-400 block uppercase">
                      Total Comprado ({cli.pedidos.length})
                    </span>
                    <span className="text-sm font-bold text-[#4E342E] tabular-nums">
                      {formatarMoeda(totalGasto)}
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedClienteHistory(cli)}
                    className="px-3 py-1.5 text-xs font-semibold text-[#FF1493] bg-[#FFF0F8] hover:bg-[#FF1493] hover:text-white rounded-full transition-colors flex items-center gap-1"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Ver Histórico</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Histórico Detalhado de Compras do Cliente */}
      {selectedClienteHistory && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#F0E4E0] max-h-[90vh] overflow-y-auto relative">
            <div className="flex items-start justify-between border-b border-[#F0E4E0] pb-3 mb-4">
              <div>
                <span className="text-[11px] font-bold text-[#FF1493] uppercase">
                  Histórico de Pedidos da Cliente
                </span>
                <h3 className="text-xl font-bold font-brand-serif text-[#4E342E]">
                  {selectedClienteHistory.nome}
                </h3>
                <p className="text-xs text-[#4E342E]/70">
                  {selectedClienteHistory.telefoneWhatsapp} • Cadastrada em{' '}
                  {formatarDataPtBR(selectedClienteHistory.dataCadastro)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowManualOrderModal(true)}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-[#FF1493] hover:bg-[#E01284] rounded-full shadow-sm flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Compra</span>
                </button>
                <button
                  onClick={() => setSelectedClienteHistory(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Lista de Pedidos */}
            {selectedClienteHistory.pedidos.length === 0 ? (
              <div className="py-10 text-center text-xs text-gray-400">
                Nenhuma compra registrada para esta cliente ainda.
              </div>
            ) : (
              <div className="space-y-3">
                {selectedClienteHistory.pedidos.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-xl border border-[#F0E4E0] bg-[#FAFAFA] text-xs hover:border-[#FF1493]/30 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-[#4E342E] text-sm">
                        {p.quantidade} un de {p.produtoNome}
                      </div>

                      {/* Seletor de Status do Pedido */}
                      <select
                        value={p.status}
                        onChange={(e) => {
                          updatePedidoStatus(
                            selectedClienteHistory.id,
                            p.id,
                            e.target.value as OrderStatus,
                          )
                          // atualiza localmente
                          setSelectedClienteHistory((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  pedidos: prev.pedidos.map((ped) =>
                                    ped.id === p.id
                                      ? { ...ped, status: e.target.value as OrderStatus }
                                      : ped,
                                  ),
                                }
                              : null,
                          )
                          toast({ title: 'Status do pedido alterado!' })
                        }}
                        className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                          p.status === 'Entregue'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : p.status === 'Pago'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : p.status === 'Fechado'
                                ? 'bg-purple-100 text-purple-800 border-purple-300'
                                : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        <option value="Orçamento">Orçamento</option>
                        <option value="Fechado">Fechado</option>
                        <option value="Pago">Pago</option>
                        <option value="Entregue">Entregue</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[#4E342E]/80">
                      <div>
                        <span className="text-gray-400 block">Data:</span>
                        <span>{formatarDataPtBR(p.data)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Receita:</span>
                        <span className="font-bold text-[#4E342E]">{formatarMoeda(p.receita)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Custo Total:</span>
                        <span>{formatarMoeda(p.custoTotal)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block">Lucro Líquido:</span>
                        <span className="font-bold text-emerald-700">
                          {formatarMoeda(p.lucroLiquido)} ({p.margemPct.toFixed(1)}%)
                        </span>
                      </div>
                    </div>

                    {p.observacoes && (
                      <div className="text-[11px] text-gray-500 italic bg-white p-2 rounded border border-gray-100">
                        {p.observacoes}
                      </div>
                    )}

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => {
                          deletePedidoCliente(selectedClienteHistory.id, p.id)
                          setSelectedClienteHistory((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  pedidos: prev.pedidos.filter((ped) => ped.id !== p.id),
                                }
                              : null,
                          )
                          toast({ title: 'Pedido removido do histórico.' })
                        }}
                        className="text-[11px] text-red-500 hover:underline"
                      >
                        Excluir este pedido
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Adicionar Compra Manual */}
      {showManualOrderModal && selectedClienteHistory && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-[#F0E4E0]">
            <h3 className="text-base font-bold font-brand-serif text-[#4E342E] mb-2">
              Adicionar Compra Manual
            </h3>
            <div className="space-y-2.5 text-xs mb-4">
              <div>
                <label className="block font-bold mb-1">Quantidade</label>
                <input
                  type="number"
                  min="1"
                  value={manualQtd}
                  onChange={(e) => setManualQtd(parseInt(e.target.value, 10) || 1)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Preço Unit. (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={manualPreco}
                    onChange={(e) => setManualPreco(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Custo Unit. (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={manualCusto}
                    onChange={(e) => setManualCusto(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold mb-1">Status</label>
                  <select
                    value={manualStatus}
                    onChange={(e) => setManualStatus(e.target.value as OrderStatus)}
                    className="w-full p-2 border rounded-lg font-medium"
                  >
                    <option value="Orçamento">Orçamento</option>
                    <option value="Fechado">Fechado</option>
                    <option value="Pago">Pago</option>
                    <option value="Entregue">Entregue</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Data</label>
                  <input
                    type="date"
                    value={manualData}
                    onChange={(e) => setManualData(e.target.value)}
                    className="w-full p-1.5 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold mb-1">Observações</label>
                <input
                  type="text"
                  placeholder="Ex: Ímãs com fotos de família"
                  value={manualObs}
                  onChange={(e) => setManualObs(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowManualOrderModal(false)}
                className="px-3 py-1.5 text-xs text-gray-600 bg-gray-100 rounded-full"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddManualOrder}
                className="px-4 py-1.5 text-xs font-bold text-white bg-[#FF1493] hover:bg-[#E01284] rounded-full shadow-sm"
              >
                Salvar Compra
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cadastro / Edição de Cliente (Com LGPD Obrigatório) */}
      {showAddEditModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#F0E4E0] max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold font-brand-serif text-[#4E342E] mb-1">
              {editingCliente ? 'Editar Cliente' : 'Nova Cliente'}
            </h3>
            <p className="text-xs text-[#4E342E]/70 mb-4">
              Preencha os dados de contato. O consentimento LGPD é obrigatório para salvar.
            </p>

            <div className="space-y-3">
              {/* Nome */}
              <div>
                <label className="block text-xs font-bold text-[#4E342E] mb-1">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => {
                    setNome(e.target.value)
                    if (erros.nome) setErros((prev) => ({ ...prev, nome: '' }))
                  }}
                  placeholder="Ex: Beatriz Albuquerque"
                  className={`w-full px-3 py-2 text-sm border rounded-xl ${
                    erros.nome ? 'border-red-500 bg-red-50' : 'border-[#F0E4E0]'
                  }`}
                  autoFocus
                />
                {erros.nome && <p className="text-[11px] text-red-500 mt-1">{erros.nome}</p>}
              </div>

              {/* Endereço */}
              <div>
                <label className="block text-xs font-bold text-[#4E342E] mb-1">
                  Endereço / Bairro (Ex: Recreio, Barra...)
                </label>
                <input
                  type="text"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Ex: Rua Benvindo de Novaes, Recreio dos Bandeirantes, RJ"
                  className="w-full px-3 py-2 text-xs border border-[#F0E4E0] rounded-xl"
                />
              </div>

              {/* Telefones (WhatsApp e Recado) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[#4E342E] mb-1">
                    Telefone WhatsApp
                  </label>
                  <input
                    type="text"
                    value={telefoneWhatsapp}
                    onChange={(e) => {
                      setTelefoneWhatsapp(formatarTelefoneBR(e.target.value))
                      if (erros.telefoneWhatsapp)
                        setErros((prev) => ({ ...prev, telefoneWhatsapp: '' }))
                    }}
                    placeholder="(21) 98765-4321"
                    className={`w-full px-3 py-2 text-xs border rounded-xl ${
                      erros.telefoneWhatsapp ? 'border-red-500 bg-red-50' : 'border-[#F0E4E0]'
                    }`}
                  />
                  {erros.telefoneWhatsapp && (
                    <p className="text-[11px] text-red-500 mt-1">{erros.telefoneWhatsapp}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4E342E] mb-1">
                    Telefone de Recado
                  </label>
                  <input
                    type="text"
                    value={telefoneRecado}
                    onChange={(e) => setTelefoneRecado(formatarTelefoneBR(e.target.value))}
                    placeholder="(21) 3411-0000"
                    className="w-full px-3 py-2 text-xs border border-[#F0E4E0] rounded-xl"
                  />
                </div>
              </div>

              {/* E-mail */}
              <div>
                <label className="block text-xs font-bold text-[#4E342E] mb-1">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (erros.email) setErros((prev) => ({ ...prev, email: '' }))
                  }}
                  placeholder="cliente@exemplo.com"
                  className={`w-full px-3 py-2 text-xs border rounded-xl ${
                    erros.email ? 'border-red-500 bg-red-50' : 'border-[#F0E4E0]'
                  }`}
                />
                {erros.email && <p className="text-[11px] text-red-500 mt-1">{erros.email}</p>}
              </div>

              {/* Redes Sociais */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-[#4E342E] mb-1">
                    Instagram
                  </label>
                  <input
                    type="text"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@usuario"
                    className="w-full px-2 py-1.5 text-xs border border-[#F0E4E0] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#4E342E] mb-1">
                    Facebook
                  </label>
                  <input
                    type="text"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    placeholder="usuario"
                    className="w-full px-2 py-1.5 text-xs border border-[#F0E4E0] rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#4E342E] mb-1">TikTok</label>
                  <input
                    type="text"
                    value={tiktok}
                    onChange={(e) => setTiktok(e.target.value)}
                    placeholder="@usuario"
                    className="w-full px-2 py-1.5 text-xs border border-[#F0E4E0] rounded-lg"
                  />
                </div>
              </div>

              {/* Outros Canais */}
              <div>
                <label className="block text-[11px] font-bold text-[#4E342E] mb-1">
                  Outros Canais / Como nos conheceu:
                </label>
                <input
                  type="text"
                  value={outrosCanais}
                  onChange={(e) => setOutrosCanais(e.target.value)}
                  placeholder="Ex: Indicação, Feirinha do Recreio, Google..."
                  className="w-full px-3 py-2 text-xs border border-[#F0E4E0] rounded-xl"
                />
              </div>

              {/* Checkbox de Consentimento LGPD Obrigatório */}
              <div className="p-3 bg-[#FFF0F8] rounded-xl border border-[#FF1493]/30">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentimentoLgpd}
                    onChange={(e) => {
                      setConsentimentoLgpd(e.target.checked)
                      if (erros.consentimentoLgpd) {
                        setErros((prev) => ({ ...prev, consentimentoLgpd: '' }))
                      }
                    }}
                    className="mt-0.5 w-4 h-4 text-[#FF1493] rounded focus:ring-[#FF1493]"
                  />
                  <span className="text-xs text-[#4E342E] leading-relaxed">
                    <strong>Termo LGPD Obrigatório:</strong> "Autorizo o recebimento de divulgações
                    e promoções da Bru Memórias pelo WhatsApp e redes sociais."
                  </span>
                </label>
                {erros.consentimentoLgpd && (
                  <p className="text-[11px] text-red-600 font-semibold mt-1 pl-6">
                    {erros.consentimentoLgpd}
                  </p>
                )}
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
                onClick={handleSaveCliente}
                className="px-5 py-2 text-xs font-bold text-white bg-[#FF1493] hover:bg-[#E01284] rounded-full shadow-sm"
              >
                Salvar Cliente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmação de Exclusão de Cliente */}
      {deleteTargetCliente && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-red-200">
            <h3 className="text-base font-bold font-brand-serif text-red-600 mb-2">
              Excluir Cliente?
            </h3>
            <p className="text-xs text-[#4E342E]/80 mb-4 leading-relaxed">
              Tem certeza que deseja remover <strong>{deleteTargetCliente.nome}</strong>? O
              histórico de {deleteTargetCliente.pedidos.length} compras também será removido.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTargetCliente(null)}
                className="px-4 py-2 text-xs font-semibold text-[#4E342E] bg-gray-100 rounded-full"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-full"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
