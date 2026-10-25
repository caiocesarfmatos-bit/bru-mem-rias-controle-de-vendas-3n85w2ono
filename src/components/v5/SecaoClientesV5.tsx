import React, { useState } from 'react'
import { useAppV5 } from '@/context/AppV5Context'
import { Cliente, OrigemCliente, BaseLegalLgpd } from '@/types/appV5'
import {
  Users,
  UserPlus,
  Search,
  Filter,
  ShieldCheck,
  Trash2,
  Download,
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  XCircle,
  FileText,
} from 'lucide-react'
import { formatarMoeda, formatarDataPtBR, formatarTelefoneBR } from '@/lib/formatters'
import { useToast } from '@/hooks/use-toast'

export const SecaoClientesV5: React.FC = () => {
  const {
    data,
    adicionarCliente,
    atualizarCliente,
    excluirDadosClienteLgpd,
    exportarDadosTitularLgpd,
    navegarPara,
  } = useAppV5()
  const { toast } = useToast()

  const [busca, setBusca] = useState('')
  const [filtroOrigem, setFiltroOrigem] = useState<string>('todos')
  const [filtroConsentimento, setFiltroConsentimento] = useState<string>('todos')
  const [filtroInativos90d, setFiltroInativos90d] = useState(false)
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')

  const [clienteSelecionadoId, setClienteSelecionadoId] = useState<string | null>(null)
  const [showModalNovo, setShowModalNovo] = useState(false)
  const [showModalExcluirLgpd, setShowModalExcluirLgpd] = useState<string | null>(null)

  // Formulário de cliente
  const [formNome, setFormNome] = useState('')
  const [formWhatsapp, setFormWhatsapp] = useState('')
  const [formTelefoneRecado, setFormTelefoneRecado] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formInstagram, setFormInstagram] = useState('')
  const [formCidade, setFormCidade] = useState('Rio de Janeiro')
  const [formEstado, setFormEstado] = useState('RJ')
  const [formCep, setFormCep] = useState('')
  const [formEndereco, setFormEndereco] = useState('')
  const [buscandoCepV5, setBuscandoCepV5] = useState(false)
  const [avisoCepV5, setAvisoCepV5] = useState<string | null>(null)
  const [formOrigem, setFormOrigem] = useState<OrigemCliente>('WhatsApp')
  const [formConsentimento, setFormConsentimento] = useState(false)
  const [formBaseLegal, setFormBaseLegal] = useState<BaseLegalLgpd>('Consentimento do titular')
  const [formObservacoes, setFormObservacoes] = useState('')

  // Clientes filtrados
  const hoje = new Date().getTime()
  const noventaDiasAtras = hoje - 90 * 24 * 60 * 60 * 1000

  const clientesFiltrados = data.clientes.filter((cli) => {
    // Busca por nome, cidade ou estado
    const textoMatch =
      cli.nome.toLowerCase().includes(busca.toLowerCase()) ||
      cli.cidade.toLowerCase().includes(busca.toLowerCase()) ||
      cli.estado.toLowerCase().includes(busca.toLowerCase())

    if (!textoMatch) return false
    if (filtroOrigem !== 'todos' && cli.origem !== filtroOrigem) return false
    if (filtroEstado !== 'todos' && cli.estado !== filtroEstado) return false
    if (filtroConsentimento === 'com' && !cli.consentimento) return false
    if (filtroConsentimento === 'sem' && cli.consentimento) return false

    // Filtro sem compra há mais de 90 dias
    if (filtroInativos90d) {
      const pedidosDoCliente = data.pedidos.filter((p) => p.clienteId === cli.id)
      if (pedidosDoCliente.length === 0) return true
      const ultimaData = Math.max(...pedidosDoCliente.map((p) => new Date(p.criadoEm).getTime()))
      if (ultimaData > noventaDiasAtras) return false
    }

    return true
  })

  const clienteFoco = data.clientes.find((c) => c.id === clienteSelecionadoId)
  const pedidosFoco = clienteFoco ? data.pedidos.filter((p) => p.clienteId === clienteFoco.id) : []
  const totalCompradoFoco = pedidosFoco.reduce((acc, p) => acc + (p.totalGeral || 0), 0)
  const ticketMedioFoco = pedidosFoco.length > 0 ? totalCompradoFoco / pedidosFoco.length : 0

  const handleSalvarNovoCliente = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formNome.trim()) {
      toast({ title: 'Nome obrigatório', variant: 'destructive' })
      return
    }

    const novo = adicionarCliente({
      nome: formNome,
      whatsapp: formWhatsapp,
      telefoneRecado: formTelefoneRecado,
      email: formEmail,
      instagram: formInstagram,
      cidade: formCidade,
      estado: formEstado,
      cep: formCep,
      endereco: formEndereco,
      origem: formOrigem,
      consentimento: formConsentimento,
      baseLegal: formConsentimento ? 'Consentimento do titular' : 'Execução de contrato',
      observacoes: formObservacoes,
    })

    toast({ title: 'Cliente cadastrado com sucesso! 💖' })
    setShowModalNovo(false)
    setClienteSelecionadoId(novo.id)
    // Limpar form
    setFormNome('')
    setFormWhatsapp('')
    setFormTelefoneRecado('')
    setFormEmail('')
    setFormInstagram('')
    setFormCep('')
    setFormEndereco('')
    setFormObservacoes('')
  }

  const handleExecutarExclusaoLgpd = () => {
    if (!showModalExcluirLgpd) return
    excluirDadosClienteLgpd(showModalExcluirLgpd)
    toast({
      title: 'Dados pessoais eliminados (LGPD)',
      description: 'Nome e contatos foram anonimizados. Histórico contábil preservado.',
    })
    setShowModalExcluirLgpd(null)
  }

  const handleExportarTitular = (id: string) => {
    const jsonStr = exportarDadosTitularLgpd(id)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `dados-titular-lgpd-${id}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast({ title: 'Dados do titular exportados com sucesso!' })
  }

  return (
    <div className="space-y-6">
      {/* Aviso Obrigatório LGPD (Seção 7 do spec) */}
      <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-900 text-xs leading-relaxed flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-amber-950 mb-0.5">Conformidade e Privacidade (LGPD):</p>
          <p>
            "Empresa pequena tem regra simplificada de LGPD, mas continua sujeita a sanção. Guardar
            contato de quem não autorizou divulgação é risco jurídico. Registre sempre a origem e o
            aceite."
          </p>
        </div>
      </div>

      {/* Topo: Barra de Ações e Filtros */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#F0E4E0] shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#FF1493]" />
            <h2 className="text-base font-bold font-brand-serif text-[#4E342E]">
              Carteira de Clientes (Alcance Nacional)
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#FFF0F8] text-[#FF1493] font-bold">
              {clientesFiltrados.length} clientes
            </span>
          </div>

          <button
            onClick={() => setShowModalNovo(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#FF1493] hover:bg-[#E01284] rounded-full shadow-sm transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar Cliente</span>
          </button>
        </div>

        {/* Linha de Busca e Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
          {/* Busca por texto */}
          <div className="relative sm:col-span-1">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar nome, cidade, UF..."
              className="w-full pl-8 pr-3 py-2 border rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF1493]"
            />
          </div>

          {/* Filtro Origem */}
          <select
            value={filtroOrigem}
            onChange={(e) => setFiltroOrigem(e.target.value)}
            className="px-3 py-2 border rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF1493]"
          >
            <option value="todos">Todas as origens</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Instagram">Instagram</option>
            <option value="Indicação">Indicação</option>
            <option value="Tráfego Pago">Tráfego Pago</option>
            <option value="Mala Direta">Mala Direta</option>
            <option value="Marketplace">Marketplace</option>
            <option value="Outro">Outro</option>
          </select>

          {/* Filtro Consentimento */}
          <select
            value={filtroConsentimento}
            onChange={(e) => setFiltroConsentimento(e.target.value)}
            className="px-3 py-2 border rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF1493]"
          >
            <option value="todos">Todos consentimentos</option>
            <option value="com">Com consentimento (Divulgação OK)</option>
            <option value="sem">Sem consentimento (Apenas contrato)</option>
          </select>

          {/* Filtro Inativos */}
          <button
            type="button"
            onClick={() => setFiltroInativos90d(!filtroInativos90d)}
            className={`px-3 py-2 border rounded-xl font-medium flex items-center justify-center gap-1.5 transition-colors ${
              filtroInativos90d
                ? 'bg-[#FF1493] text-white border-[#FF1493]'
                : 'bg-gray-50 text-[#4E342E] hover:bg-gray-100'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Sem compra há mais de 90 dias</span>
          </button>
        </div>
      </div>

      {/* Grid Principal: Lista de Clientes e Detalhes da Titular */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Clientes */}
        <div className="lg:col-span-1 space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {clientesFiltrados.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-[#F0E4E0] text-xs text-gray-500">
              Nenhum cliente encontrado com os filtros atuais.
            </div>
          ) : (
            clientesFiltrados.map((cli) => {
              const isSelected = clienteSelecionadoId === cli.id
              const pedidosCount = data.pedidos.filter((p) => p.clienteId === cli.id).length

              return (
                <div
                  key={cli.id}
                  onClick={() => setClienteSelecionadoId(cli.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#FFF0F8] border-[#FF1493] shadow-xs'
                      : 'bg-white border-[#F0E4E0] hover:border-[#FF1493]/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-bold text-[#4E342E]">{cli.nome}</h3>
                      <p className="text-[11px] text-[#4E342E]/70 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#FF1493]" />
                        <span>
                          {cli.cidade} - {cli.estado}
                        </span>
                      </p>
                    </div>

                    <div className="text-right">
                      {cli.consentimento ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full border border-green-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Divulgação OK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded-full">
                          Contrato apenas
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-[#4E342E]/70">
                    <span>Origem: {cli.origem}</span>
                    <span className="font-semibold">{pedidosCount} pedido(s)</span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Visão Detalhada da Titular Selecionada */}
        <div className="lg:col-span-2">
          {clienteFoco ? (
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#F0E4E0] shadow-sm space-y-6">
              {/* Cabeçalho do Cliente */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-bold font-brand-serif text-[#4E342E]">
                    {clienteFoco.nome}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#4E342E]/80 mt-1">
                    {clienteFoco.whatsapp && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-[#FF1493]" />
                        {formatarTelefoneBR(clienteFoco.whatsapp)}
                      </span>
                    )}
                    {clienteFoco.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-[#FF1493]" />
                        {clienteFoco.email}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#FF1493]" />
                      {clienteFoco.cidade}/{clienteFoco.estado}
                    </span>
                  </div>
                </div>

                {/* Ações LGPD */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExportarTitular(clienteFoco.id)}
                    className="p-2 text-xs font-semibold text-[#4E342E] bg-gray-100 hover:bg-gray-200 rounded-full flex items-center gap-1"
                    title="Exportar dados do titular (LGPD)"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Exportar Titular</span>
                  </button>

                  <button
                    onClick={() => setShowModalExcluirLgpd(clienteFoco.id)}
                    className="p-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-full flex items-center gap-1"
                    title="Excluir dados do cliente (LGPD)"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Excluir Dados</span>
                  </button>
                </div>
              </div>

              {/* Status de Consentimento & Base Legal */}
              <div className="p-3.5 rounded-xl bg-[#F5EFEA]/60 border border-[#F0E4E0] flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-bold text-[#4E342E]">Base Legal Registrada: </span>
                  <span className="text-[#4E342E]/80">{clienteFoco.baseLegal}</span>
                </div>
                <div>
                  <span className="font-bold text-[#4E342E]">Consentimento para Divulgação: </span>
                  <span
                    className={
                      clienteFoco.consentimento ? 'text-green-700 font-bold' : 'text-gray-600'
                    }
                  >
                    {clienteFoco.consentimento ? 'SIM (Registrado)' : 'NÃO AUTORIZADO'}
                  </span>
                  {clienteFoco.dataHoraConsentimento && (
                    <span className="text-[10px] text-gray-500 ml-1">
                      em {formatarDataPtBR(clienteFoco.dataHoraConsentimento)}
                    </span>
                  )}
                </div>
              </div>

              {/* Indicadores do Cliente (Total Comprado, Ticket Médio, Pedidos) */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-gray-50 border text-center">
                  <span className="text-[11px] text-gray-500 block">Total Comprado</span>
                  <span className="text-sm font-bold text-[#4E342E]">
                    {formatarMoeda(totalCompradoFoco)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border text-center">
                  <span className="text-[11px] text-gray-500 block">Ticket Médio</span>
                  <span className="text-sm font-bold text-[#4E342E]">
                    {formatarMoeda(ticketMedioFoco)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-gray-50 border text-center">
                  <span className="text-[11px] text-gray-500 block">Total de Pedidos</span>
                  <span className="text-sm font-bold text-[#FF1493]">{pedidosFoco.length}</span>
                </div>
              </div>

              {/* Histórico de Pedidos e Orçamentos da Titular */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-[#4E342E]">
                    Histórico Comercial da Titular
                  </h4>
                  <button
                    onClick={() => navegarPara('vender', 'orcamentos')}
                    className="text-xs text-[#FF1493] font-bold hover:underline"
                  >
                    + Novo Orçamento
                  </button>
                </div>

                {pedidosFoco.length === 0 ? (
                  <p className="text-xs text-gray-500 p-4 bg-gray-50 rounded-xl text-center">
                    Nenhum pedido finalizado ainda para esta cliente.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {pedidosFoco.map((ped) => (
                      <div
                        key={ped.id}
                        className="p-3 rounded-xl border border-gray-100 bg-gray-50/70 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-[#4E342E]">{ped.numero}</span>
                          <span className="text-gray-500 ml-2">
                            {formatarDataPtBR(ped.criadoEm)} • {ped.quantidadeTotal} ímãs
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-[#4E342E]">
                            {formatarMoeda(ped.totalGeral)}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF0F8] text-[#FF1493]">
                            {ped.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-10 text-center border border-[#F0E4E0] text-gray-500 text-xs">
              Selecione um cliente ao lado para ver sua ficha completa e histórico de pedidos.
            </div>
          )}
        </div>
      </div>

      {/* Modal Cadastro de Novo Cliente */}
      {showModalNovo && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#F0E4E0] max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold font-brand-serif text-[#4E342E] mb-4">
              Novo Cliente (Cadastro Nacional)
            </h3>

            <form onSubmit={handleSalvarNovoCliente} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#4E342E] mb-1">Nome Completo *</label>
                <input
                  type="text"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder="Nome da cliente"
                  className="w-full px-3 py-2 border rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#4E342E] mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={formWhatsapp}
                    onChange={(e) => setFormWhatsapp(e.target.value)}
                    placeholder="(21) 98765-4321"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#4E342E] mb-1">Telefone Recado</label>
                  <input
                    type="text"
                    value={formTelefoneRecado}
                    onChange={(e) => setFormTelefoneRecado(e.target.value)}
                    placeholder="(21) 3411-9000"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#4E342E] mb-1">E-mail</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="cliente@email.com"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#4E342E] mb-1">Instagram</label>
                  <input
                    type="text"
                    value={formInstagram}
                    onChange={(e) => setFormInstagram(e.target.value)}
                    placeholder="@perfil"
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              {/* Endereço Nacional com Consulta ViaCEP */}
              <div className="space-y-2 p-3 bg-gray-50/70 rounded-2xl border border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#4E342E] text-[11px]">
                    Endereço & Localidade
                  </span>
                  {buscandoCepV5 && (
                    <span className="text-[10px] text-[#FF1493] animate-pulse">
                      Buscando CEP...
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-bold text-[#4E342E] mb-1">CEP (8 dígitos)</label>
                    <input
                      type="text"
                      value={formCep}
                      onChange={async (e) => {
                        const val = e.target.value
                        setFormCep(val)
                        setAvisoCepV5(null)
                        const limpo = val.replace(/\D/g, '')
                        if (limpo.length === 8) {
                          setBuscandoCepV5(true)
                          try {
                            const { consultarCep } = await import('@/services/viaCep')
                            const res = await consultarCep(limpo)
                            setFormCidade(res.cidade)
                            setFormEstado(res.uf)
                            if (res.logradouro) {
                              setFormEndereco(
                                `${res.logradouro}${res.bairro ? ` - ${res.bairro}` : ''}`,
                              )
                            }
                            setAvisoCepV5(`Localizado: ${res.cidade}/${res.uf}`)
                          } catch (err: any) {
                            setAvisoCepV5(err.message || 'CEP não encontrado.')
                          } finally {
                            setBuscandoCepV5(false)
                          }
                        }
                      }}
                      placeholder="22790-000"
                      maxLength={9}
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block font-bold text-[#4E342E] mb-1">Endereço Completo</label>
                    <input
                      type="text"
                      value={formEndereco}
                      onChange={(e) => setFormEndereco(e.target.value)}
                      placeholder="Rua, número, complemento"
                      className="w-full px-3 py-2 border rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block font-bold text-[#4E342E] mb-1">Cidade *</label>
                    <input
                      type="text"
                      value={formCidade}
                      onChange={(e) => setFormCidade(e.target.value)}
                      placeholder="Ex: Rio de Janeiro, Niterói, São Paulo"
                      className="w-full px-3 py-2 border rounded-xl"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#4E342E] mb-1">Estado (UF) *</label>
                    <input
                      type="text"
                      value={formEstado}
                      onChange={(e) => setFormEstado(e.target.value.toUpperCase())}
                      maxLength={2}
                      placeholder="RJ"
                      className="w-full px-3 py-2 border rounded-xl uppercase font-mono"
                      required
                    />
                  </div>
                </div>

                {avisoCepV5 && <p className="text-[10px] text-[#FF1493] italic">{avisoCepV5}</p>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[#4E342E] mb-1">Origem do Contato</label>
                  <select
                    value={formOrigem}
                    onChange={(e) => setFormOrigem(e.target.value as OrigemCliente)}
                    className="w-full px-3 py-2 border rounded-xl bg-white"
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Indicação">Indicação</option>
                    <option value="Tráfego Pago">Tráfego Pago</option>
                    <option value="Mala Direta">Mala Direta</option>
                    <option value="Marketplace">Marketplace</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#4E342E] mb-1">Base Legal LGPD</label>
                  <select
                    value={formBaseLegal}
                    onChange={(e) => setFormBaseLegal(e.target.value as BaseLegalLgpd)}
                    className="w-full px-3 py-2 border rounded-xl bg-white"
                  >
                    <option value="Consentimento do titular">Consentimento do titular</option>
                    <option value="Execução de contrato">Execução de contrato</option>
                  </select>
                </div>
              </div>

              {/* Consentimento explícito */}
              <div className="p-3 bg-[#FFF0F8] rounded-xl border border-[#FF1493]/20 flex items-start gap-2">
                <input
                  type="checkbox"
                  id="consentimento-check"
                  checked={formConsentimento}
                  onChange={(e) => setFormConsentimento(e.target.checked)}
                  className="mt-0.5 rounded text-[#FF1493] focus:ring-[#FF1493]"
                />
                <label
                  htmlFor="consentimento-check"
                  className="text-[11px] text-[#4E342E] leading-tight cursor-pointer"
                >
                  <strong>Consentimento para divulgação:</strong> A cliente autorizou expressamente
                  o envio de novidades e fotos de mostruário dos seus ímãs.
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModalNovo(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#FF1493] hover:bg-[#E01284] text-white font-bold rounded-full"
                >
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Exclusão LGPD (Apaga dados pessoais mantendo lançamento contábil) */}
      {showModalExcluirLgpd && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-red-500">
            <div className="flex items-center gap-2 text-red-600 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold font-brand-serif">
                Excluir Dados do Cliente (Direito LGPD)
              </h3>
            </div>
            <p className="text-xs text-[#4E342E]/80 mb-3 leading-relaxed">
              Em conformidade com a LGPD, esta ação <strong>apagará permanentemente</strong> o nome,
              telefone, e-mail e endereço da titular no armazenamento local.
            </p>
            <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-xs text-red-800 mb-4">
              <p>
                Os lançamentos de vendas continuarão registrados com o identificador interno
                anonimizado para fins fiscais e contábeis do Simples Nacional, sem qualquer dado que
                identifique a pessoa.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowModalExcluirLgpd(null)}
                className="px-4 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-full font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecutarExclusaoLgpd}
                className="px-4 py-2 text-xs bg-red-600 hover:bg-red-700 text-white font-bold rounded-full shadow-sm"
              >
                Confirmar Anonimização dos Dados
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
