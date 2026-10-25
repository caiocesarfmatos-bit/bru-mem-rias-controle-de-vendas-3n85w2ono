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
import { Users, UserPlus, Search, Phone, MapPin, Building, UserCheck } from 'lucide-react'

export const ModuloPessoas: React.FC = () => {
  const [pessoas, setPessoas] = useState<Pessoa[]>([])
  const [filtro, setFiltro] = useState('')
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
  const [formaPref, setFormaPref] = useState('PIX')
  const [erroForm, setErroForm] = useState<string | null>(null)

  const carregarDados = async () => {
    setLoading(true)
    const papelFiltro = filtroPapel === 'todos' ? undefined : filtroPapel
    const data = await listarPessoas(papelFiltro)
    setPessoas(data)
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#4E342E] flex items-center gap-2">
            <Users className="w-6 h-6 text-[#FF1493]" />
            Clientes e Fornecedores
          </h2>
          <p className="text-sm text-[#4E342E]/70">
            Base unificada de pessoas físicas e jurídicas com papéis e contatos oficiais
          </p>
        </div>

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

              {/* Endereço */}
              <div className="space-y-3 pt-2 border-t border-[#F0E4E0]">
                <h4 className="text-sm font-semibold flex items-center gap-2 text-[#4E342E]">
                  <MapPin className="w-4 h-4 text-[#FF1493]" />
                  Endereço Principal
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs">CEP</Label>
                    <Input
                      value={cep}
                      onChange={(e) => setCep(e.target.value)}
                      placeholder="22790700"
                    />
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
              </CardContent>
            </Card>
          )
        })}

        {pessoasFiltradas.length === 0 && !loading && (
          <div className="col-span-full text-center py-12 text-[#4E342E]/60">
            Nenhuma pessoa encontrada com os filtros aplicados.
          </div>
        )}
      </div>
    </div>
  )
}
