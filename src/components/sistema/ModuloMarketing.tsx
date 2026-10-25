// src/components/sistema/ModuloMarketing.tsx
// Módulo de Marketing da Bru Memórias Personalizados
// Quatro seções:
// 1. Painel Resumo (Métricas Reais de Marketing e Funil)
// 2. Calendário Editorial (Publicações planejadas, filtros, status, atrasadas, publicação com 1 clique)
// 3. Funil de Leads (Pipeline de estágios no mobile, interações, conversão com 1 clique Lead -> Cliente)
// 4. Personas (Perfis de clientes ideais com vínculo e contagem real)
// Regras: Mobile-first para iPhone (alvos de toque >=44px), valores em centavos, sem números decorativos,
// marca oficial e permissões verificadas.

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Megaphone,
  Calendar,
  Users,
  Target,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  Phone,
  Mail,
  UserCheck,
  Download,
  Trash2,
  Edit2,
  ExternalLink,
  ChevronRight,
  RefreshCw,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useAuth } from '@/context/AuthContext'
import {
  LeadComercial,
  LeadInteracao,
  ItemCalendarioEditorial,
  PersonaCliente,
  CanalMarketingCodigo,
  TipoConteudoEditorial,
  StatusPublicacao,
  OrigemLead,
  StatusFunilLead,
  MotivoPerdaLead,
  TipoInteracaoLead,
  Pessoa,
} from '@/types/sistema'
import {
  listarPersonas,
  criarPersona,
  listarLeads,
  criarLead,
  atualizarStatusLead,
  listarInteracoesDoLead,
  registrarInteracaoLead,
  converterLeadEmNovoCliente,
  vincularLeadAClienteExistente,
  listarPublicacoesCalendario,
  criarPublicacao,
  marcarPublicacaoComoPublicada,
  excluirPublicacao,
  exportarCsvLeads,
  exportarCsvCalendarioEditorial,
} from '@/services/marketing'
import { listarPessoas } from '@/services/pessoas'
import { listarProdutosComPrecoESaldo } from '@/services/produtos'
import {
  formatarCentavosParaReal,
  formatarNumero,
  formatarDataPtBR,
  formatarDataHoraPtBR,
  formatarTelefoneBR,
  normalizarTelefoneE164,
} from '@/lib/formatters'
import { BRAND_TOKENS } from '@/design/tokens'

type SecaoMarketing = 'resumo' | 'calendario' | 'funil' | 'personas'

const CANAIS_MARKETING: Array<{ codigo: CanalMarketingCodigo; rotulo: string }> = [
  { codigo: 'instagram', rotulo: 'Instagram' },
  { codigo: 'whatsapp_status', rotulo: 'WhatsApp Status' },
  { codigo: 'whatsapp_direto', rotulo: 'WhatsApp Direto' },
  { codigo: 'facebook', rotulo: 'Facebook' },
  { codigo: 'tiktok', rotulo: 'TikTok' },
  { codigo: 'email', rotulo: 'E-mail' },
  { codigo: 'feira_evento', rotulo: 'Feira / Evento' },
]

const TIPOS_CONTEUDO: Array<{ codigo: TipoConteudoEditorial; rotulo: string }> = [
  { codigo: 'promocao', rotulo: 'Promoção' },
  { codigo: 'novidade_produto', rotulo: 'Novidade de Produto' },
  { codigo: 'bastidor_atelie', rotulo: 'Bastidor do Ateliê' },
  { codigo: 'depoimento_cliente', rotulo: 'Depoimento de Cliente' },
  { codigo: 'data_comemorativa', rotulo: 'Data Comemorativa' },
  { codigo: 'conteudo_educativo', rotulo: 'Conteúdo Educativo' },
]

const STATUS_PUBLICACAO: Array<{ codigo: StatusPublicacao; rotulo: string; badgeCls: string }> = [
  { codigo: 'ideia', rotulo: 'Ideia', badgeCls: 'bg-zinc-100 text-zinc-700 border-zinc-200' },
  {
    codigo: 'planejada',
    rotulo: 'Planejada',
    badgeCls: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    codigo: 'producao',
    rotulo: 'Em Produção',
    badgeCls: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    codigo: 'pronta',
    rotulo: 'Pronta',
    badgeCls: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    codigo: 'publicada',
    rotulo: 'Publicada',
    badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    codigo: 'cancelada',
    rotulo: 'Cancelada',
    badgeCls: 'bg-rose-50 text-rose-700 border-rose-200',
  },
]

const ORIGENS_LEAD: Array<{ codigo: OrigemLead; rotulo: string }> = [
  { codigo: 'instagram', rotulo: 'Instagram' },
  { codigo: 'indicacao', rotulo: 'Indicação de Cliente' },
  { codigo: 'feira_evento', rotulo: 'Feira / Evento Presencial' },
  { codigo: 'whatsapp', rotulo: 'WhatsApp Direto' },
  { codigo: 'site_google', rotulo: 'Site / Busca Google' },
  { codigo: 'outro', rotulo: 'Outro Canal' },
]

const ESTAGIOS_FUNIL: Array<{ codigo: StatusFunilLead; rotulo: string; cor: string }> = [
  { codigo: 'novo_contato', rotulo: 'Novo Contato', cor: 'border-blue-400 bg-blue-50/50' },
  {
    codigo: 'atendimento_iniciado',
    rotulo: 'Atendimento Iniciado',
    cor: 'border-amber-400 bg-amber-50/50',
  },
  {
    codigo: 'orcamento_enviado',
    rotulo: 'Orçamento Enviado',
    cor: 'border-purple-400 bg-purple-50/50',
  },
  { codigo: 'negociacao', rotulo: 'Em Negociação', cor: 'border-orange-400 bg-orange-50/50' },
  { codigo: 'fechado_ganho', rotulo: 'Fechado Ganho', cor: 'border-emerald-500 bg-emerald-50/50' },
  { codigo: 'fechado_perdido', rotulo: 'Fechado Perdido', cor: 'border-rose-400 bg-rose-50/50' },
  { codigo: 'sem_resposta', rotulo: 'Sem Resposta', cor: 'border-zinc-400 bg-zinc-50/50' },
]

const MOTIVOS_PERDA: Array<{ codigo: MotivoPerdaLead; rotulo: string }> = [
  { codigo: 'preco', rotulo: 'Preço / Orçamento' },
  { codigo: 'prazo', rotulo: 'Prazo de Entrega' },
  { codigo: 'desistiu', rotulo: 'Desistiu da Compra' },
  { codigo: 'sem_resposta', rotulo: 'Sem Resposta' },
  { codigo: 'outro', rotulo: 'Outro Motivo' },
]

export const ModuloMarketing: React.FC = () => {
  const { usuario, temPermissao } = useAuth()
  const perfil = usuario?.perfil || 'consulta'
  const isVendedor = perfil === 'vendedor'

  // Permissões
  const podeGerenciarMarketing =
    temPermissao('gerenciar_marketing') || perfil === 'administrador' || perfil === 'gestor'
  const podeExportarLeads =
    temPermissao('exportar_leads') || perfil === 'administrador' || perfil === 'gestor'
  const podeGerenciarPersonas =
    temPermissao('gerenciar_personas') || perfil === 'administrador' || perfil === 'gestor'
  const podeEditarCalendario =
    temPermissao('gerenciar_calendario') ||
    perfil === 'administrador' ||
    perfil === 'gestor' ||
    perfil === 'vendedor'

  // Subseção ativa
  const [secaoAtiva, setSecaoAtiva] = useState<SecaoMarketing>('resumo')

  // Dados
  const [leads, setLeads] = useState<LeadComercial[]>([])
  const [publicacoes, setPublicacoes] = useState<ItemCalendarioEditorial[]>([])
  const [personas, setPersonas] = useState<PersonaCliente[]>([])
  const [pessoasBase, setPessoasBase] = useState<Pessoa[]>([])
  const [produtosCatalogo, setProdutosCatalogo] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [erroMsg, setErroMsg] = useState<string | null>(null)

  // Filtros Calendário
  const [filtroCanalCal, setFiltroCanalCal] = useState<string>('todos')
  const [filtroStatusCal, setFiltroStatusCal] = useState<string>('todos')

  // Filtros Funil
  const [buscaLead, setBuscaLead] = useState<string>('')
  const [filtroOrigemLead, setFiltroOrigemLead] = useState<string>('todos')
  const [filtroEstagioLead, setFiltroEstagioLead] = useState<string>('todos')

  // Modais
  const [modalNovoLead, setModalNovoLead] = useState<boolean>(false)
  const [modalNovaPublicacao, setModalNovaPublicacao] = useState<boolean>(false)
  const [modalNovaPersona, setModalNovaPersona] = useState<boolean>(false)
  const [modalInteracao, setModalInteracao] = useState<boolean>(false)
  const [modalConverterCliente, setModalConverterCliente] = useState<boolean>(false)

  // Estados dos formulários
  const [leadSelecionado, setLeadSelecionado] = useState<LeadComercial | null>(null)
  const [interacoesLeadSel, setInteracoesLeadSel] = useState<LeadInteracao[]>([])
  const [novaInteracaoTipo, setNovaInteracaoTipo] = useState<TipoInteracaoLead>('mensagem_enviada')
  const [novaInteracaoTexto, setNovaInteracaoTexto] = useState<string>('')

  // Formulário Novo Lead
  const [formLeadNome, setFormLeadNome] = useState<string>('')
  const [formLeadTelefone, setFormLeadTelefone] = useState<string>('')
  const [formLeadEmail, setFormLeadEmail] = useState<string>('')
  const [formLeadOrigem, setFormLeadOrigem] = useState<OrigemLead>('instagram')
  const [formLeadInteresse, setFormLeadInteresse] = useState<string>('')
  const [formLeadValorReais, setFormLeadValorReais] = useState<string>('')
  const [formLeadPersona, setFormLeadPersona] = useState<string>('')
  const [formLeadObs, setFormLeadObs] = useState<string>('')

  // Formulário Conversão Lead -> Cliente
  const [tipoConversao, setTipoConversao] = useState<'novo' | 'vincular'>('novo')
  const [clienteExistenteSelecionado, setClienteExistenteSelecionado] = useState<string>('')
  const [convLogradouro, setConvLogradouro] = useState<string>('')
  const [convNumero, setConvNumero] = useState<string>('')
  const [convBairro, setConvBairro] = useState<string>('Recreio dos Bandeirantes')
  const [convCidade, setConvCidade] = useState<string>('Rio de Janeiro')
  const [convUf, setConvUf] = useState<string>('RJ')
  const [convCep, setConvCep] = useState<string>('22790700')

  // Formulário Nova Publicação
  const [formCalTitulo, setFormCalTitulo] = useState<string>('')
  const [formCalDataPrevista, setFormCalDataPrevista] = useState<string>(
    () => new Date().toISOString().split('T')[0],
  )
  const [formCalCanal, setFormCalCanal] = useState<CanalMarketingCodigo>('instagram')
  const [formCalTipoConteudo, setFormCalTipoConteudo] =
    useState<TipoConteudoEditorial>('bastidor_atelie')
  const [formCalStatus, setFormCalStatus] = useState<StatusPublicacao>('planejada')
  const [formCalDescricao, setFormCalDescricao] = useState<string>('')
  const [formCalCampanha, setFormCalCampanha] = useState<string>('')
  const [formCalProduto, setFormCalProduto] = useState<string>('')

  // Formulário Nova Persona
  const [formPerNome, setFormPerNome] = useState<string>('')
  const [formPerDescricao, setFormPerDescricao] = useState<string>('')
  const [formPerDores, setFormPerDores] = useState<string>('')
  const [formPerCanais, setFormPerCanais] = useState<string>('Instagram, WhatsApp')
  const [formPerProdutos, setFormPerProdutos] = useState<string>('')
  const [formPerValorReais, setFormPerValorReais] = useState<string>('')

  // Carregar dados iniciais
  const carregarDados = useCallback(async () => {
    setLoading(true)
    setErroMsg(null)
    try {
      const filtroVendedorId = isVendedor ? usuario?.id : undefined
      const [leadsRes, postsRes, personasRes, pessoasRes, produtosRes] = await Promise.all([
        listarLeads(filtroVendedorId),
        listarPublicacoesCalendario(),
        listarPersonas(),
        listarPessoas(),
        listarProdutosComPrecoESaldo(),
      ])
      setLeads(leadsRes)
      setPublicacoes(postsRes)
      setPersonas(personasRes)
      setPessoasBase(pessoasRes)
      setProdutosCatalogo(produtosRes)
    } catch (err: any) {
      console.error('Erro ao carregar dados do marketing:', err)
      setErroMsg(err?.message || 'Falha ao carregar dados de marketing.')
    } finally {
      setLoading(false)
    }
  }, [isVendedor, usuario?.id])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  // Abertura do histórico de interações do lead
  const abrirInteracoesLead = async (lead: LeadComercial) => {
    setLeadSelecionado(lead)
    const list = await listarInteracoesDoLead(lead.id)
    setInteracoesLeadSel(list)
    setModalInteracao(true)
  }

  // Registrar nova interação
  const handleAdicionarInteracao = async () => {
    if (!leadSelecionado || !novaInteracaoTexto.trim()) return
    try {
      const nova = await registrarInteracaoLead({
        leadId: leadSelecionado.id,
        tipo: novaInteracaoTipo,
        anotacao: novaInteracaoTexto.trim(),
      })
      setInteracoesLeadSel((prev) => [nova, ...prev])
      setNovaInteracaoTexto('')
      // Atualiza data_ultimo_contato no lead local
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadSelecionado.id ? { ...l, data_ultimo_contato: nova.data_hora } : l,
        ),
      )
    } catch (err: any) {
      alert(`Falha ao registrar interação: ${err.message}`)
    }
  }

  // Mudança de status do Lead
  const handleMudarStatusLead = async (
    lead: LeadComercial,
    novoStatus: StatusFunilLead,
    motivoPerda?: MotivoPerdaLead,
  ) => {
    try {
      if (novoStatus === 'fechado_perdido' && !motivoPerda) {
        const motivoEscolhido = prompt(
          'Informe o motivo da perda do lead (preco, prazo, desistiu, sem_resposta, outro):',
          'preco',
        ) as MotivoPerdaLead
        if (!motivoEscolhido) return
        await atualizarStatusLead({
          leadId: lead.id,
          novoStatus,
          motivoPerda: motivoEscolhido,
          anotacaoInteracao: `Status alterado para Fechado Perdido (Motivo: ${motivoEscolhido}).`,
        })
      } else {
        await atualizarStatusLead({
          leadId: lead.id,
          novoStatus,
          motivoPerda,
          anotacaoInteracao: `Status alterado para ${novoStatus.replace('_', ' ')}.`,
        })
      }

      // Se virou fechado_ganho, oferece conversão imediata para cliente
      if (novoStatus === 'fechado_ganho' && !lead.cliente_convertido) {
        setLeadSelecionado(lead)
        setModalConverterCliente(true)
      }

      await carregarDados()
    } catch (err: any) {
      alert(`Falha ao alterar status do lead: ${err.message}`)
    }
  }

  // Conversão de Lead em Cliente
  const handleEfetivarConversao = async () => {
    if (!leadSelecionado) return
    try {
      if (tipoConversao === 'vincular') {
        if (!clienteExistenteSelecionado) {
          alert('Selecione um cliente cadastrado para vincular.')
          return
        }
        await vincularLeadAClienteExistente(leadSelecionado.id, clienteExistenteSelecionado)
      } else {
        await converterLeadEmNovoCliente(leadSelecionado, {
          logradouro: convLogradouro,
          numero: convNumero,
          bairro: convBairro,
          cidade: convCidade,
          uf: convUf,
          cep: convCep,
        })
      }
      setModalConverterCliente(false)
      await carregarDados()
      alert('Lead convertido com sucesso em cliente cadastrado!')
    } catch (err: any) {
      alert(`Falha na conversão do lead: ${err.message}`)
    }
  }

  // Criação de Novo Lead
  const handleCriarLead = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formLeadNome.trim() || !formLeadTelefone.trim()) {
      alert('Nome e Telefone/WhatsApp são obrigatórios.')
      return
    }

    try {
      const valorCentavos = formLeadValorReais
        ? Math.round(parseFloat(formLeadValorReais.replace(',', '.')) * 100)
        : 0

      await criarLead({
        nome: formLeadNome,
        telefone_whatsapp: formLeadTelefone,
        email: formLeadEmail,
        origem: formLeadOrigem,
        interesse: formLeadInteresse,
        status_funil: 'novo_contato',
        valor_estimado_centavos: valorCentavos,
        vendedor_responsavel: isVendedor ? usuario?.id : undefined,
        persona: formLeadPersona || undefined,
        observacoes: formLeadObs,
      })

      setModalNovoLead(false)
      // Limpa campos
      setFormLeadNome('')
      setFormLeadTelefone('')
      setFormLeadEmail('')
      setFormLeadInteresse('')
      setFormLeadValorReais('')
      setFormLeadPersona('')
      setFormLeadObs('')
      await carregarDados()
    } catch (err: any) {
      alert(`Falha ao cadastrar lead: ${err.message}`)
    }
  }

  // Criação de Nova Publicação Editorial
  const handleCriarPublicacao = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formCalTitulo.trim() || !formCalDataPrevista) {
      alert('Título e Data Prevista são obrigatórios.')
      return
    }

    try {
      await criarPublicacao({
        data_prevista: formCalDataPrevista + ' 12:00:00.000Z',
        canal: formCalCanal,
        titulo: formCalTitulo,
        descricao: formCalDescricao,
        tipo_conteudo: formCalTipoConteudo,
        status: formCalStatus,
        produto_relacionado: formCalProduto || undefined,
        campanha: formCalCampanha,
      })

      setModalNovaPublicacao(false)
      setFormCalTitulo('')
      setFormCalDescricao('')
      setFormCalCampanha('')
      setFormCalProduto('')
      await carregarDados()
    } catch (err: any) {
      alert(`Falha ao criar publicação: ${err.message}`)
    }
  }

  // Marcar publicação como publicada
  const handlePublicarAgora = async (pub: ItemCalendarioEditorial) => {
    const link = prompt(
      'Link da publicação postada (opcional, ex: https://instagram.com/p/...):',
      '',
    )
    try {
      await marcarPublicacaoComoPublicada(pub.id, link || undefined)
      await carregarDados()
    } catch (err: any) {
      alert(`Falha ao registrar publicação: ${err.message}`)
    }
  }

  // Excluir publicação
  const handleExcluirPub = async (id: string) => {
    if (!confirm('Deseja realmente remover esta publicação do calendário?')) return
    try {
      await excluirPublicacao(id)
      await carregarDados()
    } catch (err: any) {
      alert(`Falha ao excluir publicação: ${err.message}`)
    }
  }

  // Criação de Nova Persona
  const handleCriarPersona = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formPerNome.trim()) {
      alert('Nome da persona é obrigatório.')
      return
    }

    try {
      const faixaCentavos = formPerValorReais
        ? Math.round(parseFloat(formPerValorReais.replace(',', '.')) * 100)
        : 0

      await criarPersona({
        nome: formPerNome,
        descricao: formPerDescricao,
        dores_desejos: formPerDores,
        canais_principais: formPerCanais,
        produtos_interesse: formPerProdutos,
        faixa_valor_centavos: faixaCentavos,
      })

      setModalNovaPersona(false)
      setFormPerNome('')
      setFormPerDescricao('')
      setFormPerDores('')
      setFormPerProdutos('')
      setFormPerValorReais('')
      await carregarDados()
    } catch (err: any) {
      alert(`Falha ao cadastrar persona: ${err.message}`)
    }
  }

  // Cálculo das Métricas Gerais Reais
  const hojeYmd = new Date().toISOString().split('T')[0]
  const leadsValidos = leads
  const totalLeads = leadsValidos.length
  const leadsGanhos = leadsValidos.filter((l) => l.status_funil === 'fechado_ganho').length
  const leadsPerdidos = leadsValidos.filter((l) => l.status_funil === 'fechado_perdido').length
  const taxaConversaoGeralPct =
    totalLeads > 0 ? Number(((leadsGanhos / totalLeads) * 100).toFixed(1)) : 0

  // Publicações atrasadas (data prevista anterior a hoje e não publicada/cancelada)
  const pubsAtrasadas = publicacoes.filter((p) => {
    const ymd = (p.data_prevista || '').substring(0, 10)
    return ymd < hojeYmd && p.status !== 'publicada' && p.status !== 'cancelada'
  })

  // Publicações desta semana (próximos 7 dias)
  const dHoje = new Date()
  const dSeteDias = new Date()
  dSeteDias.setDate(dHoje.getDate() + 7)
  const ymdSeteDias = dSeteDias.toISOString().split('T')[0]

  const pubsDestaSemana = publicacoes.filter((p) => {
    const ymd = (p.data_prevista || '').substring(0, 10)
    return ymd >= hojeYmd && ymd <= ymdSeteDias
  })

  // Leads com mais de 7 dias sem contato (alerta de follow-up)
  const leadsSemFollowUp = leadsValidos.filter((l) => {
    if (l.status_funil === 'fechado_ganho' || l.status_funil === 'fechado_perdido') return false
    const dContato = new Date(l.data_ultimo_contato || l.created || '')
    const diffDias = Math.floor((new Date().getTime() - dContato.getTime()) / (1000 * 60 * 60 * 24))
    return diffDias >= 7
  })

  // Filtros aplicados em Publicações
  const publicacoesFiltradas = useMemo(() => {
    return publicacoes.filter((p) => {
      if (filtroCanalCal !== 'todos' && p.canal !== filtroCanalCal) return false
      if (filtroStatusCal !== 'todos' && p.status !== filtroStatusCal) return false
      return true
    })
  }, [publicacoes, filtroCanalCal, filtroStatusCal])

  // Filtros aplicados em Leads
  const leadsFiltrados = useMemo(() => {
    return leadsValidos.filter((l) => {
      if (buscaLead) {
        const termo = buscaLead.toLowerCase()
        const bateu =
          l.nome.toLowerCase().includes(termo) ||
          l.telefone_whatsapp.includes(termo) ||
          (l.email && l.email.toLowerCase().includes(termo)) ||
          (l.interesse && l.interesse.toLowerCase().includes(termo))
        if (!bateu) return false
      }
      if (filtroOrigemLead !== 'todos' && l.origem !== filtroOrigemLead) return false
      if (filtroEstagioLead !== 'todos' && l.status_funil !== filtroEstagioLead) return false
      return true
    })
  }, [leadsValidos, buscaLead, filtroOrigemLead, filtroEstagioLead])

  return (
    <div className="space-y-6">
      {/* Topo do Módulo com Identidade Bru Memórias */}
      <div className="bg-[#FFF8F4] border border-[#EEDFD7] rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E63980] to-[#D1256E] flex items-center justify-center text-white shadow-xs flex-shrink-0">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-semibold text-[#D49B42]">
                  {BRAND_TOKENS.name}
                </span>
                <Badge
                  variant="outline"
                  className="border-[#E63980] text-[#E63980] bg-[#FCE7F0]/40 text-xs"
                >
                  Módulo de Marketing & Comercial
                </Badge>
              </div>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#3D150B] mt-0.5">
                Marketing, Calendário & Funil de Leads
              </h1>
              <p className="text-xs sm:text-sm text-[#3D150B]/75 mt-0.5">
                Gestão integrada de postagens, contatos comerciais, pipeline de conversão e personas
                do ateliê.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={carregarDados}
              disabled={loading}
              className="border-[#EEDFD7] text-[#3D150B] hover:bg-white min-h-[44px] sm:min-h-[36px]"
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>

            {podeExportarLeads && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportarCsvLeads(leadsValidos)}
                className="border-[#EEDFD7] text-[#3D150B] hover:bg-white min-h-[44px] sm:min-h-[36px]"
              >
                <Download className="w-4 h-4 mr-1.5 text-[#E63980]" />
                Exportar Leads
              </Button>
            )}

            {podeEditarCalendario && (
              <Button
                size="sm"
                onClick={() => setModalNovoLead(true)}
                className="bg-[#E63980] hover:bg-[#D1256E] text-white min-h-[44px] sm:min-h-[36px]"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Novo Lead
              </Button>
            )}
          </div>
        </div>

        {/* Abas Internas de Navegação (Mobile-First Touch Target >=44px) */}
        <div className="mt-4 pt-3 border-t border-[#EEDFD7] flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setSecaoAtiva('resumo')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap min-h-[44px] transition-colors ${
              secaoAtiva === 'resumo'
                ? 'bg-[#3D150B] text-white'
                : 'bg-white text-[#3D150B] border border-[#EEDFD7] hover:bg-[#FFF8F4]'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Painel Resumo
          </button>

          <button
            onClick={() => setSecaoAtiva('calendario')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap min-h-[44px] transition-colors ${
              secaoAtiva === 'calendario'
                ? 'bg-[#3D150B] text-white'
                : 'bg-white text-[#3D150B] border border-[#EEDFD7] hover:bg-[#FFF8F4]'
            }`}
          >
            <Calendar className="w-4 h-4 text-[#E63980]" />
            Calendário Editorial
            {pubsAtrasadas.length > 0 && <span className="w-2 h-2 rounded-full bg-rose-500" />}
          </button>

          <button
            onClick={() => setSecaoAtiva('funil')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap min-h-[44px] transition-colors ${
              secaoAtiva === 'funil'
                ? 'bg-[#3D150B] text-white'
                : 'bg-white text-[#3D150B] border border-[#EEDFD7] hover:bg-[#FFF8F4]'
            }`}
          >
            <Users className="w-4 h-4 text-[#D49B42]" />
            Funil de Leads
            {leadsSemFollowUp.length > 0 && (
              <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] px-1 py-0">
                {leadsSemFollowUp.length}
              </Badge>
            )}
          </button>

          <button
            onClick={() => setSecaoAtiva('personas')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap min-h-[44px] transition-colors ${
              secaoAtiva === 'personas'
                ? 'bg-[#3D150B] text-white'
                : 'bg-white text-[#3D150B] border border-[#EEDFD7] hover:bg-[#FFF8F4]'
            }`}
          >
            <Target className="w-4 h-4 text-purple-600" />
            Personas do Ateliê
          </button>
        </div>
      </div>

      {/* Erro */}
      {erroMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{erroMsg}</span>
        </div>
      )}

      {/* =========================================================================
          SEÇÃO 1: PAINEL RESUMO DE MARKETING
          ========================================================================= */}
      {secaoAtiva === 'resumo' && (
        <div className="space-y-6">
          {/* Métricas Reais do Funil e Produção de Conteúdo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <Card className="border-[#EEDFD7] bg-white shadow-xs">
              <CardContent className="p-4">
                <span className="text-[11px] uppercase font-semibold text-[#3D150B]/60 tracking-wider">
                  Total de Leads Ativos
                </span>
                <p className="text-2xl font-bold font-mono text-[#3D150B] mt-1">{totalLeads}</p>
                <p className="text-[10px] text-[#3D150B]/60 mt-1">
                  {isVendedor ? 'Sob sua responsabilidade' : 'Total acumulado na base'}
                </p>
              </CardContent>
            </Card>

            <Card className="border-[#EEDFD7] bg-white shadow-xs">
              <CardContent className="p-4">
                <span className="text-[11px] uppercase font-semibold text-[#3D150B]/60 tracking-wider">
                  Taxa de Conversão Real
                </span>
                <p className="text-2xl font-bold font-mono text-emerald-700 mt-1">
                  {formatarNumero(taxaConversaoGeralPct)}%
                </p>
                <p className="text-[10px] text-[#3D150B]/60 mt-1">
                  {leadsGanhos} fechado(s) ganho(s)
                </p>
              </CardContent>
            </Card>

            <Card className="border-[#EEDFD7] bg-white shadow-xs">
              <CardContent className="p-4">
                <span className="text-[11px] uppercase font-semibold text-[#3D150B]/60 tracking-wider">
                  Publicações da Semana
                </span>
                <p className="text-2xl font-bold font-mono text-[#D49B42] mt-1">
                  {pubsDestaSemana.length}
                </p>
                <p className="text-[10px] text-[#3D150B]/60 mt-1">Próximos 7 dias no calendário</p>
              </CardContent>
            </Card>

            <Card className="border-[#EEDFD7] bg-white shadow-xs">
              <CardContent className="p-4">
                <span className="text-[11px] uppercase font-semibold text-[#3D150B]/60 tracking-wider">
                  Atrasadas / Pendentes
                </span>
                <p
                  className={`text-2xl font-bold font-mono mt-1 ${pubsAtrasadas.length > 0 ? 'text-rose-600' : 'text-emerald-700'}`}
                >
                  {pubsAtrasadas.length}
                </p>
                <p className="text-[10px] text-[#3D150B]/60 mt-1">
                  {pubsAtrasadas.length > 0
                    ? 'Data passada sem publicação'
                    : 'Calendário editorial em dia'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Alertas de Follow-up do WhatsApp Comercial */}
          {leadsSemFollowUp.length > 0 && (
            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  Alerta Comercial: Leads sem follow-up há mais de 7 dias ({leadsSemFollowUp.length}
                  )
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSecaoAtiva('funil')}
                  className="h-7 text-xs border-amber-300 text-amber-900 bg-white hover:bg-amber-100"
                >
                  Abrir Funil
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                {leadsSemFollowUp.slice(0, 6).map((lead) => (
                  <div
                    key={lead.id}
                    className="p-2 bg-white rounded border border-amber-200 text-xs flex items-center justify-between"
                  >
                    <div className="truncate mr-2">
                      <p className="font-semibold text-[#3D150B] truncate">{lead.nome}</p>
                      <p className="text-[10px] text-[#3D150B]/60">
                        Último: {formatarDataPtBR(lead.data_ultimo_contato)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => abrirInteracoesLead(lead)}
                      className="h-7 px-2 text-[#E63980]"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gráfico / Distribuição por Origem e por Estágio */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Origens dos Leads */}
            <Card className="border-[#EEDFD7] bg-white shadow-xs">
              <CardHeader className="pb-3 border-b border-[#F0E4E0]">
                <CardTitle className="text-sm font-serif font-bold text-[#3D150B] flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-[#E63980]" />
                  Origem dos Contatos Comerciais
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 space-y-2">
                {ORIGENS_LEAD.map((orig) => {
                  const qtd = leadsValidos.filter((l) => l.origem === orig.codigo).length
                  const pct = totalLeads > 0 ? Number(((qtd / totalLeads) * 100).toFixed(1)) : 0
                  return (
                    <div key={orig.codigo} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[#3D150B]">{orig.rotulo}</span>
                        <span className="font-mono text-[#3D150B]/80">
                          {qtd} ({formatarNumero(pct)}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-[#FFF8F4] rounded-full overflow-hidden border border-[#EEDFD7]">
                        <div
                          style={{ width: `${pct}%` }}
                          className="h-full bg-[#E63980] rounded-full transition-all"
                        />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Estágios do Funil */}
            <Card className="border-[#EEDFD7] bg-white shadow-xs">
              <CardHeader className="pb-3 border-b border-[#F0E4E0]">
                <CardTitle className="text-sm font-serif font-bold text-[#3D150B] flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#D49B42]" />
                  Distribuição por Estágio no Funil
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 space-y-2">
                {ESTAGIOS_FUNIL.map((st) => {
                  const qtd = leadsValidos.filter((l) => l.status_funil === st.codigo).length
                  const pct = totalLeads > 0 ? Number(((qtd / totalLeads) * 100).toFixed(1)) : 0
                  return (
                    <div key={st.codigo} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[#3D150B]">{st.rotulo}</span>
                        <span className="font-mono text-[#3D150B]/80">
                          {qtd} ({formatarNumero(pct)}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-[#FFF8F4] rounded-full overflow-hidden border border-[#EEDFD7]">
                        <div
                          style={{ width: `${pct}%` }}
                          className={`h-full rounded-full transition-all ${
                            st.codigo === 'fechado_ganho'
                              ? 'bg-emerald-500'
                              : st.codigo === 'fechado_perdido'
                                ? 'bg-rose-500'
                                : 'bg-[#D49B42]'
                          }`}
                        />
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* =========================================================================
          SEÇÃO 2: CALENDÁRIO EDITORIAL
          ========================================================================= */}
      {secaoAtiva === 'calendario' && (
        <div className="space-y-4">
          {/* Barra de Filtros e Ações */}
          <div className="p-3 bg-white border border-[#EEDFD7] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1">
                <Label className="text-xs text-[#3D150B]/70">Canal:</Label>
                <select
                  value={filtroCanalCal}
                  onChange={(e) => setFiltroCanalCal(e.target.value)}
                  className="h-8 text-xs border border-[#EEDFD7] rounded px-2 bg-white text-[#3D150B]"
                >
                  <option value="todos">Todos os canais</option>
                  {CANAIS_MARKETING.map((c) => (
                    <option key={c.codigo} value={c.codigo}>
                      {c.rotulo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1">
                <Label className="text-xs text-[#3D150B]/70">Status:</Label>
                <select
                  value={filtroStatusCal}
                  onChange={(e) => setFiltroStatusCal(e.target.value)}
                  className="h-8 text-xs border border-[#EEDFD7] rounded px-2 bg-white text-[#3D150B]"
                >
                  <option value="todos">Todos os status</option>
                  {STATUS_PUBLICACAO.map((s) => (
                    <option key={s.codigo} value={s.codigo}>
                      {s.rotulo}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportarCsvCalendarioEditorial(publicacoesFiltradas)}
                className="h-8 text-xs border-[#EEDFD7]"
              >
                <Download className="w-3.5 h-3.5 mr-1 text-[#E63980]" />
                Exportar CSV
              </Button>

              {podeEditarCalendario && (
                <Button
                  size="sm"
                  onClick={() => setModalNovaPublicacao(true)}
                  className="h-8 text-xs bg-[#E63980] hover:bg-[#D1256E] text-white"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Planejar Post
                </Button>
              )}
            </div>
          </div>

          {/* Lista Ordenada de Publicações */}
          {publicacoesFiltradas.length === 0 ? (
            <div className="p-8 text-center bg-white border border-[#EEDFD7] rounded-xl text-xs text-[#3D150B]/60">
              Nenhuma publicação encontrada para os filtros selecionados.
            </div>
          ) : (
            <div className="space-y-2.5">
              {publicacoesFiltradas.map((pub) => {
                const ymd = (pub.data_prevista || '').substring(0, 10)
                const isAtrasada =
                  ymd < hojeYmd && pub.status !== 'publicada' && pub.status !== 'cancelada'
                const isSemana = ymd >= hojeYmd && ymd <= ymdSeteDias

                const canalInfo =
                  CANAIS_MARKETING.find((c) => c.codigo === pub.canal)?.rotulo || pub.canal
                const statusInfo =
                  STATUS_PUBLICACAO.find((s) => s.codigo === pub.status) || STATUS_PUBLICACAO[0]

                return (
                  <div
                    key={pub.id}
                    className={`p-4 bg-white border rounded-xl transition-all shadow-2xs ${
                      isAtrasada
                        ? 'border-rose-300 bg-rose-50/20'
                        : isSemana
                          ? 'border-[#E63980]/40 bg-[#FFF8F4]'
                          : 'border-[#EEDFD7]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-[#3D150B] flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[#E63980]" />
                            {formatarDataPtBR(pub.data_prevista)}
                          </span>

                          <Badge variant="outline" className="text-[11px] border-[#EEDFD7]">
                            {canalInfo}
                          </Badge>

                          <Badge variant="outline" className={`text-[11px] ${statusInfo.badgeCls}`}>
                            {statusInfo.rotulo}
                          </Badge>

                          {isAtrasada && (
                            <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-[10px]">
                              Atrasada
                            </Badge>
                          )}

                          {isSemana && (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px]">
                              Esta Semana
                            </Badge>
                          )}
                        </div>

                        <h3 className="font-serif font-bold text-sm text-[#3D150B]">
                          {pub.titulo}
                        </h3>

                        {pub.descricao && (
                          <p className="text-xs text-[#3D150B]/75 line-clamp-2">{pub.descricao}</p>
                        )}

                        <div className="flex items-center gap-3 text-[11px] text-[#3D150B]/60 pt-1 flex-wrap">
                          {pub.campanha && <span>Campanha: {pub.campanha}</span>}
                          {pub.produto_expand && <span>Produto: {pub.produto_expand.nome}</span>}
                          {pub.data_publicacao_real && (
                            <span className="text-emerald-700 font-medium">
                              Publicado em: {formatarDataHoraPtBR(pub.data_publicacao_real)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Ações da Publicação */}
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {pub.status !== 'publicada' && podeEditarCalendario && (
                          <Button
                            size="sm"
                            onClick={() => handlePublicarAgora(pub)}
                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white min-h-[44px] sm:min-h-[32px]"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Marcar Publicada
                          </Button>
                        )}

                        {pub.link_publicacao && (
                          <a
                            href={pub.link_publicacao}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 border border-[#EEDFD7] rounded-md text-[#3D150B] hover:bg-[#FFF8F4]"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {podeGerenciarMarketing && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExcluirPub(pub.id)}
                            className="h-8 px-2 text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          SEÇÃO 3: FUNIL DE LEADS (PIPELINE VISUAL NO MOBILE)
          ========================================================================= */}
      {secaoAtiva === 'funil' && (
        <div className="space-y-4">
          {/* Barra de Filtro de Leads */}
          <div className="p-3 bg-white border border-[#EEDFD7] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-[#3D150B]/40 absolute left-2.5 top-2.5" />
                <Input
                  type="text"
                  placeholder="Buscar lead por nome, WhatsApp ou e-mail..."
                  value={buscaLead}
                  onChange={(e) => setBuscaLead(e.target.value)}
                  className="pl-8 h-9 text-xs border-[#EEDFD7]"
                />
              </div>

              <select
                value={filtroOrigemLead}
                onChange={(e) => setFiltroOrigemLead(e.target.value)}
                className="h-9 text-xs border border-[#EEDFD7] rounded px-2 bg-white text-[#3D150B]"
              >
                <option value="todos">Todas origens</option>
                {ORIGENS_LEAD.map((o) => (
                  <option key={o.codigo} value={o.codigo}>
                    {o.rotulo}
                  </option>
                ))}
              </select>

              <select
                value={filtroEstagioLead}
                onChange={(e) => setFiltroEstagioLead(e.target.value)}
                className="h-9 text-xs border border-[#EEDFD7] rounded px-2 bg-white text-[#3D150B]"
              >
                <option value="todos">Todos estágios</option>
                {ESTAGIOS_FUNIL.map((st) => (
                  <option key={st.codigo} value={st.codigo}>
                    {st.rotulo}
                  </option>
                ))}
              </select>
            </div>

            <Button
              size="sm"
              onClick={() => setModalNovoLead(true)}
              className="h-9 text-xs bg-[#E63980] hover:bg-[#D1256E] text-white min-h-[44px] md:min-h-[36px]"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Novo Lead
            </Button>
          </div>

          {/* Pipeline Comercial em Colunas / Cards Mobile-First */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {ESTAGIOS_FUNIL.map((estagio) => {
              const leadsDesteEstagio = leadsFiltrados.filter(
                (l) => l.status_funil === estagio.codigo,
              )
              const valorSomaCentavos = leadsDesteEstagio.reduce(
                (acc, l) => acc + (l.valor_estimado_centavos || 0),
                0,
              )

              return (
                <div
                  key={estagio.codigo}
                  className={`border rounded-xl p-3 flex flex-col h-full bg-white shadow-2xs ${estagio.cor}`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#EEDFD7]/80 mb-3">
                    <span className="font-serif font-bold text-xs text-[#3D150B]">
                      {estagio.rotulo}
                    </span>
                    <Badge variant="outline" className="border-[#3D150B]/30 text-[11px] font-mono">
                      {leadsDesteEstagio.length}
                    </Badge>
                  </div>

                  {valorSomaCentavos > 0 && (
                    <div className="text-[11px] font-mono text-[#3D150B]/70 mb-2">
                      Estimado: {formatarCentavosParaReal(valorSomaCentavos)}
                    </div>
                  )}

                  {/* Lista de Leads do Estágio */}
                  <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[500px] pr-1">
                    {leadsDesteEstagio.length === 0 ? (
                      <div className="py-6 text-center text-[11px] text-[#3D150B]/40 italic">
                        Nenhum contato
                      </div>
                    ) : (
                      leadsDesteEstagio.map((lead) => {
                        const dContato = new Date(lead.data_ultimo_contato || lead.created || '')
                        const diffDias = Math.floor(
                          (new Date().getTime() - dContato.getTime()) / (1000 * 60 * 60 * 24),
                        )
                        const alertaSemContato =
                          diffDias >= 7 &&
                          estagio.codigo !== 'fechado_ganho' &&
                          estagio.codigo !== 'fechado_perdido'

                        return (
                          <div
                            key={lead.id}
                            className={`p-3 bg-white rounded-lg border shadow-2xs space-y-2 transition-all ${
                              alertaSemContato ? 'border-amber-300' : 'border-[#EEDFD7]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div>
                                <h4 className="font-bold text-xs text-[#3D150B] line-clamp-1">
                                  {lead.nome}
                                </h4>
                                <span className="text-[11px] font-mono text-[#E63980]">
                                  {formatarTelefoneBR(lead.telefone_whatsapp)}
                                </span>
                              </div>
                              {lead.valor_estimado_centavos ? (
                                <span className="text-[11px] font-mono font-bold text-[#3D150B]">
                                  {formatarCentavosParaReal(lead.valor_estimado_centavos)}
                                </span>
                              ) : null}
                            </div>

                            {lead.interesse && (
                              <p className="text-[11px] text-[#3D150B]/75 line-clamp-2 bg-[#FFF8F4] p-1.5 rounded">
                                {lead.interesse}
                              </p>
                            )}

                            {lead.persona_expand && (
                              <div className="text-[10px] text-purple-700 font-medium">
                                Persona: {lead.persona_expand.nome}
                              </div>
                            )}

                            {alertaSemContato && (
                              <div className="text-[10px] text-amber-800 font-medium flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                Sem contato há {diffDias} dias
                              </div>
                            )}

                            {lead.cliente_convertido && (
                              <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                                <UserCheck className="w-3 h-3" />
                                Cliente Vinculado
                              </div>
                            )}

                            {/* Ações do Card de Lead */}
                            <div className="pt-2 border-t border-[#F0E4E0] flex items-center justify-between gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => abrirInteracoesLead(lead)}
                                className="h-7 text-[11px] px-2 border-[#EEDFD7]"
                              >
                                <MessageSquare className="w-3 h-3 mr-1 text-[#E63980]" />
                                Histórico
                              </Button>

                              <div className="flex items-center gap-1">
                                {/* Seletor rápido de transição */}
                                <select
                                  value={lead.status_funil}
                                  onChange={(e) =>
                                    handleMudarStatusLead(lead, e.target.value as StatusFunilLead)
                                  }
                                  className="h-7 text-[10px] border border-[#EEDFD7] rounded bg-white text-[#3D150B] px-1"
                                >
                                  {ESTAGIOS_FUNIL.map((s) => (
                                    <option key={s.codigo} value={s.codigo}>
                                      {s.rotulo}
                                    </option>
                                  ))}
                                </select>

                                {lead.status_funil === 'fechado_ganho' &&
                                  !lead.cliente_convertido && (
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        setLeadSelecionado(lead)
                                        setModalConverterCliente(true)
                                      }}
                                      className="h-7 text-[10px] px-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                      Vincular
                                    </Button>
                                  )}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          SEÇÃO 4: PERSONAS DO ATELIÊ
          ========================================================================= */}
      {secaoAtiva === 'personas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#3D150B]/70">
              Perfis de clientes ideais da Bru Memórias para guiar campanhas e segmentar
              atendimentos.
            </p>
            {podeGerenciarPersonas && (
              <Button
                size="sm"
                onClick={() => setModalNovaPersona(true)}
                className="bg-[#E63980] hover:bg-[#D1256E] text-white min-h-[44px] sm:min-h-[36px]"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Nova Persona
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {personas.map((per) => (
              <Card key={per.id} className="border-[#EEDFD7] bg-white shadow-xs">
                <CardHeader className="pb-2 border-b border-[#F0E4E0]">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-serif font-bold text-[#3D150B]">
                      {per.nome}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="border-[#D49B42] text-[#D49B42] text-[10px]"
                    >
                      Ticket: {formatarCentavosParaReal(per.faixa_valor_centavos || 0)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-3 space-y-3 text-xs">
                  {per.descricao && <p className="text-[#3D150B]/80">{per.descricao}</p>}

                  {per.dores_desejos && (
                    <div className="p-2 bg-[#FFF8F4] rounded border border-[#EEDFD7]">
                      <span className="font-semibold text-[#3D150B] block text-[11px]">
                        Dores & Desejos:
                      </span>
                      <p className="text-[#3D150B]/75 mt-0.5">{per.dores_desejos}</p>
                    </div>
                  )}

                  {per.produtos_interesse && (
                    <div>
                      <span className="font-semibold text-[#3D150B] text-[11px]">
                        Produtos Preferidos:
                      </span>
                      <p className="text-[#3D150B]/75">{per.produtos_interesse}</p>
                    </div>
                  )}

                  {per.canais_principais && (
                    <div className="text-[11px] text-[#3D150B]/60">
                      Canais: {per.canais_principais}
                    </div>
                  )}

                  {/* Contagem Real de Clientes e Leads */}
                  <div className="pt-2 border-t border-[#F0E4E0] flex items-center justify-between text-[11px] font-mono">
                    <span>Leads: {per.total_leads || 0}</span>
                    <span className="text-emerald-700 font-bold">
                      Clientes Reais: {per.total_clientes || 0}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: NOVO LEAD
          ========================================================================= */}
      <Dialog open={modalNovoLead} onOpenChange={setModalNovoLead}>
        <DialogContent className="max-w-md bg-white p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-serif font-bold text-[#3D150B]">
              Cadastrar Novo Lead Comercial
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCriarLead} className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">Nome do Contato / Cliente *</Label>
              <Input
                required
                value={formLeadNome}
                onChange={(e) => setFormLeadNome(e.target.value)}
                placeholder="Ex: Mariana Silveira"
                className="h-9 text-xs border-[#EEDFD7]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Telefone / WhatsApp *</Label>
                <Input
                  required
                  type="tel"
                  value={formLeadTelefone}
                  onChange={(e) => setFormLeadTelefone(e.target.value)}
                  placeholder="(21) 99999-9999"
                  className="h-9 text-xs border-[#EEDFD7]"
                />
              </div>

              <div>
                <Label className="text-xs">Origem do Contato</Label>
                <select
                  value={formLeadOrigem}
                  onChange={(e) => setFormLeadOrigem(e.target.value as OrigemLead)}
                  className="w-full h-9 text-xs border border-[#EEDFD7] rounded px-2 bg-white text-[#3D150B]"
                >
                  {ORIGENS_LEAD.map((o) => (
                    <option key={o.codigo} value={o.codigo}>
                      {o.rotulo}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">E-mail (opcional)</Label>
                <Input
                  type="email"
                  value={formLeadEmail}
                  onChange={(e) => setFormLeadEmail(e.target.value)}
                  placeholder="mariana@gmail.com"
                  className="h-9 text-xs border-[#EEDFD7]"
                />
              </div>

              <div>
                <Label className="text-xs">Valor Estimado (R$)</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={formLeadValorReais}
                  onChange={(e) => setFormLeadValorReais(e.target.value)}
                  placeholder="150,00"
                  className="h-9 text-xs border-[#EEDFD7]"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Persona Relacionada</Label>
              <select
                value={formLeadPersona}
                onChange={(e) => setFormLeadPersona(e.target.value)}
                className="w-full h-9 text-xs border border-[#EEDFD7] rounded px-2 bg-white text-[#3D150B]"
              >
                <option value="">Nenhuma / Não identificada</option>
                {personas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs">Interesse / Produto Desejado</Label>
              <Input
                value={formLeadInteresse}
                onChange={(e) => setFormLeadInteresse(e.target.value)}
                placeholder="Ex: 50 ímãs Polaroid para lembrança de batizado"
                className="h-9 text-xs border-[#EEDFD7]"
              />
            </div>

            <div>
              <Label className="text-xs">Observações Internas</Label>
              <Input
                value={formLeadObs}
                onChange={(e) => setFormLeadObs(e.target.value)}
                placeholder="Ex: Entrega solicitada para Barra da Tijuca"
                className="h-9 text-xs border-[#EEDFD7]"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalNovoLead(false)}
                className="border-[#EEDFD7]"
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#E63980] hover:bg-[#D1256E] text-white">
                Cadastrar Lead
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL: HISTÓRICO DE INTERAÇÕES DO LEAD
          ========================================================================= */}
      <Dialog open={modalInteracao} onOpenChange={setModalInteracao}>
        <DialogContent className="max-w-lg bg-white p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-serif font-bold text-[#3D150B] flex items-center justify-between">
              <span>Histórico: {leadSelecionado?.nome}</span>
            </DialogTitle>
          </DialogHeader>

          {leadSelecionado && (
            <div className="space-y-3 mt-2">
              <div className="p-2.5 bg-[#FFF8F4] border border-[#EEDFD7] rounded-lg text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#3D150B]">
                    {formatarTelefoneBR(leadSelecionado.telefone_whatsapp)}
                  </span>
                  <span className="text-[#3D150B]/60 block">
                    Origem: {leadSelecionado.origem} | Status: {leadSelecionado.status_funil}
                  </span>
                </div>
                <a
                  href={`https://wa.me/${leadSelecionado.telefone_whatsapp.replace(/\+/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center gap-1"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Abrir WhatsApp
                </a>
              </div>

              {/* Registro de nova interação */}
              <div className="space-y-2 pt-2 border-t border-[#F0E4E0]">
                <span className="text-xs font-bold text-[#3D150B]">Nova Interação</span>
                <div className="flex gap-2">
                  <select
                    value={novaInteracaoTipo}
                    onChange={(e) => setNovaInteracaoTipo(e.target.value as TipoInteracaoLead)}
                    className="h-8 text-xs border border-[#EEDFD7] rounded px-2 bg-white text-[#3D150B]"
                  >
                    <option value="mensagem_enviada">Mensagem Enviada</option>
                    <option value="mensagem_recebida">Mensagem Recebida</option>
                    <option value="ligacao">Ligação</option>
                    <option value="reuniao_visita">Reunião / Atendimento</option>
                    <option value="outro">Outro</option>
                  </select>

                  <Input
                    value={novaInteracaoTexto}
                    onChange={(e) => setNovaInteracaoTexto(e.target.value)}
                    placeholder="Anotação da conversa..."
                    className="h-8 text-xs flex-1 border-[#EEDFD7]"
                  />

                  <Button
                    size="sm"
                    onClick={handleAdicionarInteracao}
                    className="h-8 text-xs bg-[#3D150B] text-white"
                  >
                    Gravar
                  </Button>
                </div>
              </div>

              {/* Linha do tempo das interações */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 pt-2">
                {interacoesLeadSel.length === 0 ? (
                  <p className="text-xs text-[#3D150B]/50 italic text-center py-4">
                    Nenhuma interação registrada ainda.
                  </p>
                ) : (
                  interacoesLeadSel.map((it) => (
                    <div
                      key={it.id}
                      className="p-2.5 bg-white border border-[#EEDFD7] rounded-lg text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px] text-[#3D150B]/60">
                        <span className="font-semibold uppercase text-[#E63980]">
                          {it.tipo.replace('_', ' ')}
                        </span>
                        <span>{formatarDataHoraPtBR(it.data_hora)}</span>
                      </div>
                      <p className="text-[#3D150B]">{it.anotacao}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL: CONVERSÃO LEAD -> CLIENTE COMERCIAL
          ========================================================================= */}
      <Dialog open={modalConverterCliente} onOpenChange={setModalConverterCliente}>
        <DialogContent className="max-w-md bg-white p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-serif font-bold text-[#3D150B]">
              Conversão de Lead: Fechado Ganho
            </DialogTitle>
          </DialogHeader>

          {leadSelecionado && (
            <div className="space-y-3 mt-2 text-xs">
              <p className="text-[#3D150B]/80">
                Parabéns pelo fechamento! Escolha como cadastrar{' '}
                <strong>{leadSelecionado.nome}</strong> na base oficial de clientes:
              </p>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={tipoConversao === 'novo' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTipoConversao('novo')}
                  className={
                    tipoConversao === 'novo'
                      ? 'bg-[#E63980] text-white flex-1'
                      : 'border-[#EEDFD7] flex-1'
                  }
                >
                  Criar Novo Cliente
                </Button>
                <Button
                  type="button"
                  variant={tipoConversao === 'vincular' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTipoConversao('vincular')}
                  className={
                    tipoConversao === 'vincular'
                      ? 'bg-[#E63980] text-white flex-1'
                      : 'border-[#EEDFD7] flex-1'
                  }
                >
                  Vincular Existente
                </Button>
              </div>

              {tipoConversao === 'vincular' ? (
                <div>
                  <Label className="text-xs">Selecione o Cliente Cadastrado:</Label>
                  <select
                    value={clienteExistenteSelecionado}
                    onChange={(e) => setClienteExistenteSelecionado(e.target.value)}
                    className="w-full h-9 text-xs border border-[#EEDFD7] rounded px-2 bg-white text-[#3D150B] mt-1"
                  >
                    <option value="">Selecione...</option>
                    {pessoasBase.map((pes) => (
                      <option key={pes.id} value={pes.id}>
                        {pes.nome_razao_social} ({pes.documento || 'Sem doc'})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-2 p-3 bg-[#FFF8F4] border border-[#EEDFD7] rounded-lg">
                  <span className="font-semibold text-[#3D150B] block">
                    Endereço de Entrega (Rio de Janeiro):
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <Label className="text-[10px]">Logradouro / Rua</Label>
                      <Input
                        value={convLogradouro}
                        onChange={(e) => setConvLogradouro(e.target.value)}
                        placeholder="Av. das Américas"
                        className="h-8 text-xs border-[#EEDFD7]"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px]">Número</Label>
                      <Input
                        value={convNumero}
                        onChange={(e) => setConvNumero(e.target.value)}
                        placeholder="1000"
                        className="h-8 text-xs border-[#EEDFD7]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px]">Bairro</Label>
                      <Input
                        value={convBairro}
                        onChange={(e) => setConvBairro(e.target.value)}
                        className="h-8 text-xs border-[#EEDFD7]"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px]">CEP</Label>
                      <Input
                        value={convCep}
                        onChange={(e) => setConvCep(e.target.value)}
                        className="h-8 text-xs border-[#EEDFD7]"
                      />
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalConverterCliente(false)}
                  className="border-[#EEDFD7]"
                >
                  Depois
                </Button>
                <Button
                  onClick={handleEfetivarConversao}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Confirmar Conversão
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL: PLANEJAR PUBLICAÇÃO NO CALENDÁRIO
          ========================================================================= */}
      <Dialog open={modalNovaPublicacao} onOpenChange={setModalNovaPublicacao}>
        <DialogContent className="max-w-md bg-white p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-serif font-bold text-[#3D150B]">
              Planejar Publicação Editorial
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCriarPublicacao} className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">Título / Tema da Postagem *</Label>
              <Input
                required
                value={formCalTitulo}
                onChange={(e) => setFormCalTitulo(e.target.value)}
                placeholder="Ex: Como escolher fotos nítidas para seus ímãs"
                className="h-9 text-xs border-[#EEDFD7]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Data Prevista *</Label>
                <Input
                  required
                  type="date"
                  value={formCalDataPrevista}
                  onChange={(e) => setFormCalDataPrevista(e.target.value)}
                  className="h-9 text-xs border-[#EEDFD7]"
                />
              </div>

              <div>
                <Label className="text-xs">Canal</Label>
                <select
                  value={formCalCanal}
                  onChange={(e) => setFormCalCanal(e.target.value as CanalMarketingCodigo)}
                  className="w-full h-9 text-xs border border-[#EEDFD7] rounded px-2 bg-white text-[#3D150B]"
                >
                  {CANAIS_MARKETING.map((c) => (
                    <option key={c.codigo} value={c.codigo}>
                      {c.rotulo}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Tipo de Conteúdo</Label>
                <select
                  value={formCalTipoConteudo}
                  onChange={(e) => setFormCalTipoConteudo(e.target.value as TipoConteudoEditorial)}
                  className="w-full h-9 text-xs border border-[#EEDFD7] rounded px-2 bg-white text-[#3D150B]"
                >
                  {TIPOS_CONTEUDO.map((t) => (
                    <option key={t.codigo} value={t.codigo}>
                      {t.rotulo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs">Status Inicial</Label>
                <select
                  value={formCalStatus}
                  onChange={(e) => setFormCalStatus(e.target.value as StatusPublicacao)}
                  className="w-full h-9 text-xs border border-[#EEDFD7] rounded px-2 bg-white text-[#3D150B]"
                >
                  {STATUS_PUBLICACAO.map((s) => (
                    <option key={s.codigo} value={s.codigo}>
                      {s.rotulo}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label className="text-xs">Produto Relacionado (opcional)</Label>
              <select
                value={formCalProduto}
                onChange={(e) => setFormCalProduto(e.target.value)}
                className="w-full h-9 text-xs border border-[#EEDFD7] rounded px-2 bg-white text-[#3D150B]"
              >
                <option value="">Nenhum produto específico</option>
                {produtosCatalogo.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs">Campanha (opcional)</Label>
              <Input
                value={formCalCampanha}
                onChange={(e) => setFormCalCampanha(e.target.value)}
                placeholder="Ex: Dia das Mães, Qualidade do Ateliê"
                className="h-9 text-xs border-[#EEDFD7]"
              />
            </div>

            <div>
              <Label className="text-xs">Descrição / Roteiro</Label>
              <Input
                value={formCalDescricao}
                onChange={(e) => setFormCalDescricao(e.target.value)}
                placeholder="Detalhes visuais, texto da legenda ou pontos de foco"
                className="h-9 text-xs border-[#EEDFD7]"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalNovaPublicacao(false)}
                className="border-[#EEDFD7]"
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#E63980] hover:bg-[#D1256E] text-white">
                Salvar Publicação
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL: NOVA PERSONA
          ========================================================================= */}
      <Dialog open={modalNovaPersona} onOpenChange={setModalNovaPersona}>
        <DialogContent className="max-w-md bg-white p-5">
          <DialogHeader>
            <DialogTitle className="text-base font-serif font-bold text-[#3D150B]">
              Cadastrar Perfil de Persona
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCriarPersona} className="space-y-3 mt-2">
            <div>
              <Label className="text-xs">Nome da Persona *</Label>
              <Input
                required
                value={formPerNome}
                onChange={(e) => setFormPerNome(e.target.value)}
                placeholder="Ex: Mãe do Aniversariante"
                className="h-9 text-xs border-[#EEDFD7]"
              />
            </div>

            <div>
              <Label className="text-xs">Descrição Geral</Label>
              <Input
                value={formPerDescricao}
                onChange={(e) => setFormPerDescricao(e.target.value)}
                placeholder="Quem é ela, contexto da festa ou compra"
                className="h-9 text-xs border-[#EEDFD7]"
              />
            </div>

            <div>
              <Label className="text-xs">Dores e Desejos</Label>
              <Input
                value={formPerDores}
                onChange={(e) => setFormPerDores(e.target.value)}
                placeholder="O que ela busca evitar e o que mais valoriza"
                className="h-9 text-xs border-[#EEDFD7]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Canais Principais</Label>
                <Input
                  value={formPerCanais}
                  onChange={(e) => setFormPerCanais(e.target.value)}
                  placeholder="Instagram, WhatsApp"
                  className="h-9 text-xs border-[#EEDFD7]"
                />
              </div>

              <div>
                <Label className="text-xs">Faixa de Ticket Médio (R$)</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={formPerValorReais}
                  onChange={(e) => setFormPerValorReais(e.target.value)}
                  placeholder="120,00"
                  className="h-9 text-xs border-[#EEDFD7]"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Produtos de Interesse</Label>
              <Input
                value={formPerProdutos}
                onChange={(e) => setFormPerProdutos(e.target.value)}
                placeholder="Ímãs Polaroid 5x5 cm com solapa personalizada"
                className="h-9 text-xs border-[#EEDFD7]"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalNovaPersona(false)}
                className="border-[#EEDFD7]"
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#E63980] hover:bg-[#D1256E] text-white">
                Salvar Persona
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
export default ModuloMarketing
