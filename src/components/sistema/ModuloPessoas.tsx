import React, { useState, useEffect } from 'react'
import { listarPessoas, criarPessoaComPapel } from '@/services/pessoas'
import { Pessoa } from '@/types/sistema'
import { formatarDocumento, formatarTelefoneBR, formatarCentavosParaReal } from '@/lib/formatters'
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
import {
  Users,
  UserPlus,
  Search,
  Phone,
  MapPin,
  Building,
  UserCheck,
  ShoppingBag,
  Eye,
  Calendar,
  DollarSign,
  CreditCard,
  ChevronRight,
} from 'lucide-react'
import { PedidoVenda } from '@/types/sistema'
import { listarPedidos } from '@/services/pedidos'

export const ModuloPessoas: React.FC = () => {
  const [pessoas, setPessoas] = useState<Pessoa[]>([])
  const [pedidos, setPedidos] = useState<PedidoVenda[]>([])
  const [filtro, setFiltro] = useState('')
  const [pessoaSelecionada, setPessoaSelecionada] = useState<Pessoa | null>(null)
  const [modalPerfilAberto, setModalPerfilAberto] = useState(false)
  const [filtroPapel, setFiltroPapel] = useState<'todos' | 'cliente' | 'fornecedor'>('todos')
  const [modalAberto, setModalAberto] = useState(false)
  const [loading, setLoading] = useState(false)

  // Form states
  const [tipoPessoa, setTipoPessoa] = useState<'FISICA' | 'JURIDICA'>('FISICA')
  const [documento, setDocumento] = useState('')
  const [nome, setNome] = useState('')
  const [nomeFantasia, setNomeFantasia] = useState('')
  const [isCliente, setIsCliente] = useState(true)
  const [isFornecedor, setIsFornecedor] = useState(false)
  const [contatoNome, setContatoNome] = useState('')
  const [contatoWhatsapp, setContatoWhatsapp] = useState('')
  const [contatoEmail, setContatoEmail] = useState('')
  const [cep, setCep] = useState('')
  const [logradouro, setLogradouro] = useState('')
  const [numero, setNumero] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [uf, setUf] = useState('')
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [avisoCep, setAvisoCep] = useState<string | null>(null)
  const [formaPref, setFormaPref] = useState('PIX')
  const [erroForm, setErroForm] = useState<string | null>(null)

  const carregarDados = async () => {
    setLoading(true)
    const papelFiltro = filtroPapel === 'todos' ? undefined : filtroPapel
    const [dataPessoas, dataPedidos] = await Promise.all([
      listarPessoas(papelFiltro),
      listarPedidos(),
    ])
    setPessoas(dataPessoas)
    setPedidos(dataPedidos)
    setLoading(false)
  }

  useEffect(() => {
    carregarDados()
  }, [filtroPapel])

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault()
    setErroForm(null)
    try {
      await criarPessoaComPapel({
        tipo_pessoa: tipoPessoa,
        documento,
        nome_razao_social: nome,
        nome_fantasia: nomeFantasia,
        status: 'ativo',
        is_cliente: isCliente,
        forma_pagamento_preferencial: formaPref,
        is_fornecedor: isFornecedor,
        contato_nome: contatoNome,
        contato_whatsapp: contatoWhatsapp,
        contato_email: contatoEmail,
        endereco_cep: cep,
        endereco_logradouro: logradouro,
        endereco_numero: numero,
        endereco_bairro: bairro,
        endereco_cidade: cidade,
        endereco_uf: uf,
      })
      setModalAberto(false)
      // Limpa campos
      setDocumento('')
      setNome('')
      setNomeFantasia('')
      setContatoWhatsapp('')
      setContatoEmail('')
      setCep('')
      setLogradouro('')
      setNumero('')
      setBairro('')
      setCidade('')
      setUf('')
      setAvisoCep(null)
      carregarDados()
    } catch (err: any) {
      setErroForm(err.message || 'Erro ao cadastrar pessoa')
    }
  }

  const pessoasFiltradas = pessoas.filter((p) => {
    const termo = filtro.toLowerCase()
    return (
      p.nome_razao_social.toLowerCase().includes(termo) ||
      (p.nome_fantasia && p.nome_fantasia.toLowerCase().includes(termo)) ||
      p.documento.includes(termo)
    )
  })

  return (
    <div className="space-y-6">
      {/* Topo com Título e Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-xl font-serif font-bold text-[#4E342E] flex items-center gap-2">
          <Users className="w-5 h-5 text-[#FF1493]" />
          Clientes & Fornecedores
        </h2>

        <Dialog open={modalAberto} onOpenChange={setModalAberto}>
          <DialogTrigger asChild>
            <Button className="bg-[#FF1493] hover:bg-[#D8117E] text-white">
              <UserPlus className="w-4 h-4 mr-2" />
              Cadastrar Pessoa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-serif font-bold text-[#4E342E]">
                Novo Cadastro de Pessoa
              </DialogTitle>
            </DialogHeader>

            {erroForm && (
              <div className="p-3 bg-red-50 text-red-700 text-sm border border-red-200 rounded">
                {erroForm}
              </div>
            )}

            <form onSubmit={handleSalvar} className="space-y-4 text-[#4E342E]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Pessoa</Label>
                  <Select value={tipoPessoa} onValueChange={(v: any) => setTipoPessoa(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FISICA">Pessoa Física (CPF)</SelectItem>
                      <SelectItem value="JURIDICA">Pessoa Jurídica (CNPJ)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>
                    {tipoPessoa === 'FISICA' ? 'CPF (apenas números)' : 'CNPJ (apenas números)'}
                  </Label>
                  <Input
                    required
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value)}
                    placeholder={tipoPessoa === 'FISICA' ? '00000000000' : '00000000000000'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>{tipoPessoa === 'FISICA' ? 'Nome Completo' : 'Razão Social'}</Label>
                  <Input
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Nome da pessoa ou empresa"
                  />
                </div>
                {tipoPessoa === 'JURIDICA' && (
                  <div>
                    <Label>Nome Fantasia</Label>
                    <Input
                      value={nomeFantasia}
                      onChange={(e) => setNomeFantasia(e.target.value)}
                      placeholder="Nome de marca/fantasia"
                    />
                  </div>
                )}
              </div>

              {/* Papéis */}
              <div className="p-3 bg-[#FFF0F5]/50 border border-[#F0E4E0] rounded-md space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#FF1493]">
                  Papéis na Empresa
                </span>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCliente}
                      onChange={(e) => setIsCliente(e.target.checked)}
                      className="rounded text-[#FF1493] focus:ring-[#FF1493]"
                    />
                    Cliente (pode comprar)
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFornecedor}
                      onChange={(e) => setIsFornecedor(e.target.checked)}
                      className="rounded text-[#FF1493] focus:ring-[#FF1493]"
                    />
                    Fornecedor (fornece insumos)
                  </label>
                </div>
              </div>

              {/* Contato Comercial */}
              <div className="space-y-3 pt-2 border-t border-[#F0E4E0]">
                <h4 className="text-sm font-semibold flex items-center gap-2 text-[#4E342E]">
                  <Phone className="w-4 h-4 text-[#FF1493]" />
                  Contato Comercial
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Nome do Contato</Label>
                    <Input
                      value={contatoNome}
                      onChange={(e) => setContatoNome(e.target.value)}
                      placeholder="Nome para recado/comercial"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">WhatsApp / Celular</Label>
                    <Input
                      value={contatoWhatsapp}
                      onChange={(e) => setContatoWhatsapp(e.target.value)}
                      placeholder="(21) 99999-9999"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">E-mail</Label>
                    <Input
                      type="email"
                      value={contatoEmail}
                      onChange={(e) => setContatoEmail(e.target.value)}
                      placeholder="contato@email.com"
                    />
                  </div>
                </div>
              </div>

              {/* Endereço com Busca Automática ViaCEP */}
              <div className="space-y-3 pt-2 border-t border-[#F0E4E0]">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold flex items-center gap-2 text-[#4E342E]">
                    <MapPin className="w-4 h-4 text-[#FF1493]" />
                    Endereço Principal
                  </h4>
                  {buscandoCep && (
                    <span className="text-xs text-[#FF1493] animate-pulse">
                      Consultando ViaCEP...
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs">CEP (8 dígitos)</Label>
                    <div className="flex gap-1.5">
                      <Input
                        value={cep}
                        onChange={async (e) => {
                          const val = e.target.value
                          setCep(val)
                          setAvisoCep(null)
                          const limpo = val.replace(/\D/g, '')
                          if (limpo.length === 8) {
                            setBuscandoCep(true)
                            try {
                              const { consultarCep } = await import('@/services/viaCep')
                              const res = await consultarCep(limpo)
                              setLogradouro(res.logradouro || '')
                              setBairro(res.bairro || '')
                              setCidade(res.cidade || '')
                              setUf(res.uf || '')
                              setAvisoCep(`Encontrado: ${res.cidade}/${res.uf}`)
                            } catch (errCep: any) {
                              setAvisoCep(errCep.message || 'CEP não localizado.')
                            } finally {
                              setBuscandoCep(false)
                            }
                          }
                        }}
                        placeholder="22790700"
                        maxLength={9}
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Logradouro</Label>
                    <Input
                      value={logradouro}
                      onChange={(e) => setLogradouro(e.target.value)}
                      placeholder="Avenida, Rua, etc."
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Número</Label>
                    <Input
                      value={numero}
                      onChange={(e) => setNumero(e.target.value)}
                      placeholder="123"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Bairro</Label>
                    <Input
                      value={bairro}
                      onChange={(e) => setBairro(e.target.value)}
                      placeholder="Bairro"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Cidade</Label>
                    <Input
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                      placeholder="Rio de Janeiro"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">UF</Label>
                    <Input
                      value={uf}
                      onChange={(e) => setUf(e.target.value.toUpperCase())}
                      placeholder="RJ"
                      maxLength={2}
                    />
                  </div>
                </div>

                {avisoCep && <p className="text-xs text-[#FF1493] italic">{avisoCep}</p>}
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setModalAberto(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-[#FF1493] hover:bg-[#D8117E] text-white">
                  Gravar Cadastro
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Barra de Filtros */}
      <Card className="border border-[#F0E4E0] shadow-sm">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#4E342E]/40 absolute left-3 top-3" />
            <Input
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Buscar por nome ou CPF/CNPJ..."
              className="pl-9"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant={filtroPapel === 'todos' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroPapel('todos')}
              className={filtroPapel === 'todos' ? 'bg-[#FF1493] text-white' : ''}
            >
              Todos
            </Button>
            <Button
              variant={filtroPapel === 'cliente' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroPapel('cliente')}
              className={filtroPapel === 'cliente' ? 'bg-[#FF1493] text-white' : ''}
            >
              Apenas Clientes
            </Button>
            <Button
              variant={filtroPapel === 'fornecedor' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFiltroPapel('fornecedor')}
              className={filtroPapel === 'fornecedor' ? 'bg-[#FF1493] text-white' : ''}
            >
              Apenas Fornecedores
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Registros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pessoasFiltradas.map((p) => {
          const contatoPrimario = p.contatos && p.contatos.length > 0 ? p.contatos[0] : null
          const endPrimario = p.enderecos && p.enderecos.length > 0 ? p.enderecos[0] : null

          return (
            <Card
              key={p.id}
              className="border border-[#F0E4E0] shadow-sm hover:shadow-md transition-shadow"
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <CardTitle className="text-base font-bold text-[#4E342E]">
                      {p.nome_razao_social}
                    </CardTitle>
                    {p.nome_fantasia && (
                      <p className="text-xs text-[#4E342E]/70 italic">{p.nome_fantasia}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-[#FFF0F5] text-[#FF1493] border border-[#FF1493]/20">
                      {p.tipo_pessoa}
                    </span>
                    <span className="text-xs text-[#4E342E]/60 font-mono">
                      {formatarDocumento(p.documento)}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-2 space-y-2 text-xs text-[#4E342E]/80">
                <div className="flex gap-2">
                  {p.papel_cliente && (
                    <span className="px-2 py-0.5 rounded bg-pink-100 text-[#FF1493] font-medium flex items-center gap-1">
                      <UserCheck className="w-3 h-3" /> Cliente
                    </span>
                  )}
                  {p.papel_fornecedor && (
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-medium flex items-center gap-1">
                      <Building className="w-3 h-3" /> Fornecedor
                    </span>
                  )}
                </div>

                {contatoPrimario && (
                  <div className="pt-2 border-t border-[#F0E4E0] space-y-1">
                    {contatoPrimario.whatsapp && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-[#FF1493]" />
                        <span>{formatarTelefoneBR(contatoPrimario.whatsapp)}</span>
                      </div>
                    )}
                    {contatoPrimario.email && (
                      <div className="text-[#4E342E]/70 truncate">{contatoPrimario.email}</div>
                    )}
                  </div>
                )}

                {endPrimario && (
                  <div className="flex items-center gap-1 text-[#4E342E]/60 truncate pt-1">
                    <MapPin className="w-3 h-3 text-[#4E342E]/40 flex-shrink-0" />
                    <span>
                      {endPrimario.logradouro}, {endPrimario.numero} - {endPrimario.bairro} (
                      {endPrimario.cidade}/{endPrimario.uf})
                    </span>
                  </div>
                )}

                <div className="pt-3 border-t border-[#F0E4E0] flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs h-8 text-[#FF1493] border-[#FF1493]/30 hover:bg-[#FFF0F8]"
                    onClick={() => {
                      setPessoaSelecionada(p)
                      setModalPerfilAberto(true)
                    }}
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    Ver Perfil & Pedidos
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {/* DIALOG DE PERFIL COMPLETO DO CLIENTE */}
        <Dialog open={modalPerfilAberto} onOpenChange={setModalPerfilAberto}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {pessoaSelecionada &&
              (() => {
                const pedidosCliente = pedidos.filter((ped) => ped.cliente === pessoaSelecionada.id)
                const totalGastoCentavos = pedidosCliente.reduce(
                  (acc, curr) => acc + (curr.total_centavos || 0),
                  0,
                )

                return (
                  <div className="space-y-5 text-[#4E342E]">
                    <DialogHeader className="border-b border-[#F0E4E0] pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <DialogTitle className="text-xl font-serif font-bold text-[#4E342E]">
                            {pessoaSelecionada.nome_razao_social}
                          </DialogTitle>
                          {pessoaSelecionada.nome_fantasia && (
                            <p className="text-xs text-[#4E342E]/70 italic">
                              {pessoaSelecionada.nome_fantasia}
                            </p>
                          )}
                          <p className="text-xs text-[#4E342E]/60 font-mono mt-1">
                            Documento: {formatarDocumento(pessoaSelecionada.documento)} •{' '}
                            {pessoaSelecionada.tipo_pessoa}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] uppercase tracking-wider text-[#4E342E]/60">
                            Total Comprado
                          </span>
                          <div className="text-lg font-bold text-[#FF1493]">
                            {formatarCentavosParaReal(totalGastoCentavos)}
                          </div>
                        </div>
                      </div>
                    </DialogHeader>

                    {/* Informações de Endereços Cadastrados */}
                    <div className="p-3 bg-[#FFF0F8] border border-[#FF1493]/20 rounded-md">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-[#FF1493] flex items-center gap-1.5 mb-2">
                        <MapPin className="w-3.5 h-3.5" /> Endereços do Cliente
                      </h4>
                      {pessoaSelecionada.enderecos && pessoaSelecionada.enderecos.length > 0 ? (
                        <div className="space-y-1 text-xs">
                          {pessoaSelecionada.enderecos.map((end, idx) => (
                            <div
                              key={idx}
                              className="bg-white/80 p-2 rounded border border-[#F0E4E0]"
                            >
                              <span className="font-semibold">
                                {end.tipo
                                  ? end.tipo === 'entrega'
                                    ? 'Entrega'
                                    : end.tipo === 'cobranca'
                                      ? 'Cobrança'
                                      : 'Fiscal'
                                  : 'Principal'}
                                :
                              </span>{' '}
                              {end.logradouro}, {end.numero}
                              {end.complemento ? ` (${end.complemento})` : ''} - {end.bairro},{' '}
                              {end.cidade}/{end.uf} • CEP: {end.cep}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[#4E342E]/60 italic">
                          Nenhum endereço formal cadastrado.
                        </p>
                      )}
                    </div>

                    {/* HISTÓRICO DE PEDIDOS COM VALOR E FORMA DE PAGAMENTO EM DESTAQUE */}
                    <div>
                      <h4 className="text-sm font-bold text-[#4E342E] flex items-center gap-2 mb-3">
                        <ShoppingBag className="w-4 h-4 text-[#FF1493]" />
                        Histórico de Pedidos ({pedidosCliente.length})
                      </h4>

                      {pedidosCliente.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-md border border-[#F0E4E0] text-xs text-[#4E342E]/60">
                          Nenhum pedido registrado para este cliente até o momento.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {pedidosCliente.map((ped) => {
                            const formaNome =
                              ped.pagamentos && ped.pagamentos.length > 0
                                ? ped.pagamentos[0].forma_pagamento
                                : 'À Vista'

                            return (
                              <div
                                key={ped.id}
                                className="p-3 border border-[#F0E4E0] rounded-lg bg-white shadow-sm space-y-2 hover:border-[#FF1493]/40 transition-colors"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0E4E0] pb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-[#4E342E]">
                                      Pedido #{ped.numero_sequencial}
                                    </span>
                                    <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-[#4E342E]/70 font-mono">
                                      {ped.data_emissao
                                        ? new Date(ped.data_emissao).toLocaleDateString('pt-BR')
                                        : '-'}
                                    </span>
                                    <span
                                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                                        ped.status === 'confirmado'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : ped.status === 'cancelado'
                                            ? 'bg-rose-100 text-rose-800'
                                            : 'bg-amber-100 text-amber-800'
                                      }`}
                                    >
                                      {ped.status}
                                    </span>
                                  </div>

                                  {/* EM DESTAQUE O VALOR E A FORMA DE PAGAMENTO */}
                                  <div className="flex items-center gap-3 bg-[#FFF0F8] px-3 py-1.5 rounded-md border border-[#FF1493]/30">
                                    <div>
                                      <span className="text-[10px] block text-[#4E342E]/60 uppercase font-medium">
                                        Forma de Pagamento
                                      </span>
                                      <span className="text-xs font-bold text-[#4E342E] flex items-center gap-1">
                                        <CreditCard className="w-3.5 h-3.5 text-[#FF1493]" />
                                        {formaNome}
                                      </span>
                                    </div>
                                    <div className="border-l border-[#FF1493]/20 pl-3">
                                      <span className="text-[10px] block text-[#4E342E]/60 uppercase font-medium">
                                        Valor Total
                                      </span>
                                      <span className="text-sm font-bold text-[#FF1493]">
                                        {formatarCentavosParaReal(ped.total_centavos)}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Detalhes operacionais do pedido: Prazo, Endereço e Itens */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 text-[#4E342E]/80">
                                  <div>
                                    <span className="font-semibold text-[#4E342E]">
                                      Prazo de Entrega:{' '}
                                    </span>
                                    {ped.prazo_entrega_dias
                                      ? `${ped.prazo_entrega_dias} dias úteis`
                                      : 'A combinar'}
                                  </div>
                                  {ped.endereco_entrega_texto && (
                                    <div className="truncate">
                                      <span className="font-semibold text-[#4E342E]">
                                        Entrega em:{' '}
                                      </span>
                                      {ped.endereco_entrega_texto}
                                    </div>
                                  )}
                                </div>

                                {/* Lista resumida de itens do pedido */}
                                {ped.itens && ped.itens.length > 0 && (
                                  <div className="pt-2 border-t border-[#F0E4E0]/60 space-y-1">
                                    <span className="text-[11px] font-semibold text-[#4E342E]/70 uppercase">
                                      Itens Produzidos:
                                    </span>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                      {ped.itens.map((it, idxIt) => (
                                        <div
                                          key={idxIt}
                                          className="text-[11px] bg-gray-50 p-1.5 rounded border border-gray-100 flex justify-between items-center"
                                        >
                                          <span>
                                            <strong>{it.quantidade}x</strong>{' '}
                                            {it.produto_expand?.nome || 'Produto'}
                                            {it.tipo_item ? ` • Tipo: ${it.tipo_item}` : ''}
                                            {it.modelo_item ? ` • Mod: ${it.modelo_item}` : ''}
                                          </span>
                                          <span className="font-medium text-[#4E342E]">
                                            {formatarCentavosParaReal(it.total_item_centavos)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}
          </DialogContent>
        </Dialog>

        {pessoasFiltradas.length === 0 && !loading && (
          <div className="col-span-full text-center py-12 text-[#4E342E]/60">
            Nenhuma pessoa encontrada com os filtros aplicados.
          </div>
        )}
      </div>
    </div>
  )
}
