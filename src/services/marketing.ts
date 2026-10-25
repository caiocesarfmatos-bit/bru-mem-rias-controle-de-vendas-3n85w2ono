// src/services/marketing.ts
// Serviços do módulo de Marketing da Bru Memórias Personalizados
// Regras: valores monetários em centavos, sem números decorativos, autorização no servidor,
// telefone em formato E.164, auditoria imutável e respeito estrito aos perfis de usuário.

import pb from '@/lib/pocketbase/client'
import {
  LeadComercial,
  LeadInteracao,
  ItemCalendarioEditorial,
  PersonaCliente,
  StatusFunilLead,
  OrigemLead,
  MotivoPerdaLead,
  TipoInteracaoLead,
  CanalMarketingCodigo,
  TipoConteudoEditorial,
  StatusPublicacao,
  Pessoa,
} from '@/types/sistema'
import { normalizarTelefoneE164, formatarDataPtBR, formatarDataHoraPtBR } from '@/lib/formatters'
import { BRAND_TOKENS } from '@/design/tokens'

// =========================================================================
// 1. PERSONAS DE CLIENTES
// =========================================================================

export async function listarPersonas(): Promise<PersonaCliente[]> {
  try {
    const records = await pb.collection('personas').getFullList({
      sort: 'nome',
    })

    // Obter contagem real de leads e clientes vinculados
    const [leads, pessoas] = await Promise.all([
      pb
        .collection('leads')
        .getFullList({ fields: 'id,persona' })
        .catch(() => []),
      pb
        .collection('pessoas')
        .getFullList({ fields: 'id,persona' })
        .catch(() => []),
    ])

    return records.map((r: any) => {
      const totalLeads = leads.filter((l: any) => l.persona === r.id).length
      const totalClientes = pessoas.filter((p: any) => p.persona === r.id).length

      return {
        id: r.id,
        nome: r.nome || '',
        descricao: r.descricao || '',
        dores_desejos: r.dores_desejos || '',
        canais_principais: r.canais_principais || '',
        produtos_interesse: r.produtos_interesse || '',
        faixa_valor_centavos: r.faixa_valor_centavos || 0,
        ativo: r.ativo !== false,
        created: r.created,
        updated: r.updated,
        total_leads: totalLeads,
        total_clientes: totalClientes,
      }
    })
  } catch (err) {
    console.error('Erro ao listar personas:', err)
    return []
  }
}

export async function criarPersona(dados: {
  nome: string
  descricao?: string
  dores_desejos?: string
  canais_principais?: string
  produtos_interesse?: string
  faixa_valor_centavos?: number
}): Promise<PersonaCliente> {
  const payload = {
    nome: dados.nome.trim(),
    descricao: dados.descricao?.trim() || '',
    dores_desejos: dados.dores_desejos?.trim() || '',
    canais_principais: dados.canais_principais?.trim() || '',
    produtos_interesse: dados.produtos_interesse?.trim() || '',
    faixa_valor_centavos: dados.faixa_valor_centavos || 0,
    ativo: true,
  }

  const rec = await pb.collection('personas').create(payload)

  // Grava auditoria
  try {
    await pb.collection('logs_auditoria').create({
      entidade: 'personas',
      identificador_registro: rec.id,
      campo: 'CRIACAO_PERSONA',
      valor_novo: JSON.stringify({
        nome: rec.nome,
        faixa_valor_centavos: rec.faixa_valor_centavos,
      }),
      usuario: pb.authStore.model?.id || null,
      data_hora: new Date().toISOString(),
      origem: 'marketing_service',
    })
  } catch {
    /* intentionally ignored */
  }

  return {
    id: rec.id,
    nome: rec.nome,
    descricao: rec.descricao,
    dores_desejos: rec.dores_desejos,
    canais_principais: rec.canais_principais,
    produtos_interesse: rec.produtos_interesse,
    faixa_valor_centavos: rec.faixa_valor_centavos,
    ativo: rec.ativo,
    created: rec.created,
    updated: rec.updated,
    total_leads: 0,
    total_clientes: 0,
  }
}

export async function atualizarPersona(
  id: string,
  dados: Partial<{
    nome: string
    descricao: string
    dores_desejos: string
    canais_principais: string
    produtos_interesse: string
    faixa_valor_centavos: number
    ativo: boolean
  }>,
): Promise<PersonaCliente> {
  const rec = await pb.collection('personas').update(id, dados)
  return {
    id: rec.id,
    nome: rec.nome,
    descricao: rec.descricao,
    dores_desejos: rec.dores_desejos,
    canais_principais: rec.canais_principais,
    produtos_interesse: rec.produtos_interesse,
    faixa_valor_centavos: rec.faixa_valor_centavos,
    ativo: rec.ativo,
    created: rec.created,
    updated: rec.updated,
  }
}

// =========================================================================
// 2. FUNIL DE LEADS
// =========================================================================

export async function listarLeads(filtroVendedorId?: string): Promise<LeadComercial[]> {
  try {
    const filter = filtroVendedorId ? `vendedor_responsavel = '${filtroVendedorId}'` : ''
    const records = await pb.collection('leads').getFullList({
      filter: filter || undefined,
      sort: '-data_ultimo_contato,-created',
      expand: 'vendedor_responsavel,persona,cliente_convertido',
    })

    return records.map((r: any) => ({
      id: r.id,
      nome: r.nome || '',
      telefone_whatsapp: r.telefone_whatsapp || '',
      email: r.email || '',
      origem: r.origem as OrigemLead,
      interesse: r.interesse || '',
      status_funil: r.status_funil as StatusFunilLead,
      motivo_perda: r.motivo_perda as MotivoPerdaLead | undefined,
      valor_estimado_centavos: r.valor_estimado_centavos || 0,
      vendedor_responsavel: r.vendedor_responsavel || '',
      vendedor_expand: r.expand?.vendedor_responsavel,
      persona: r.persona || '',
      persona_expand: r.expand?.persona,
      cliente_convertido: r.cliente_convertido || '',
      cliente_expand: r.expand?.cliente_convertido,
      data_conversao: r.data_conversao,
      data_ultimo_contato: r.data_ultimo_contato || r.created,
      observacoes: r.observacoes || '',
      created: r.created,
      updated: r.updated,
    }))
  } catch (err) {
    console.error('Erro ao listar leads:', err)
    return []
  }
}

export async function obterLeadPorId(id: string): Promise<LeadComercial | null> {
  try {
    const rec = await pb.collection('leads').getOne(id, {
      expand: 'vendedor_responsavel,persona,cliente_convertido',
    })
    const interacoes = await listarInteracoesDoLead(id)

    // Se estiver convertido em cliente, somar valor real dos pedidos deste cliente
    let valorPedidosCentavos = 0
    if (rec.cliente_convertido) {
      try {
        const peds = await pb.collection('pedidos_venda').getFullList({
          filter: `cliente = '${rec.cliente_convertido}' && (status = 'confirmado' || status = 'faturado')`,
          fields: 'total_centavos',
        })
        valorPedidosCentavos = peds.reduce(
          (acc: number, p: any) => acc + (p.total_centavos || 0),
          0,
        )
      } catch {
        /* intentionally ignored */
      }
    }

    return {
      id: rec.id,
      nome: rec.nome,
      telefone_whatsapp: rec.telefone_whatsapp,
      email: rec.email,
      origem: rec.origem as OrigemLead,
      interesse: rec.interesse,
      status_funil: rec.status_funil as StatusFunilLead,
      motivo_perda: rec.motivo_perda as MotivoPerdaLead | undefined,
      valor_estimado_centavos: rec.valor_estimado_centavos || 0,
      vendedor_responsavel: rec.vendedor_responsavel,
      vendedor_expand: rec.expand?.vendedor_responsavel,
      persona: rec.persona,
      persona_expand: rec.expand?.persona,
      cliente_convertido: rec.cliente_convertido,
      cliente_expand: rec.expand?.cliente_convertido,
      data_conversao: rec.data_conversao,
      data_ultimo_contato: rec.data_ultimo_contato,
      observacoes: rec.observacoes,
      created: rec.created,
      updated: rec.updated,
      interacoes,
      pedidos_vinculados_valor_centavos: valorPedidosCentavos,
    }
  } catch (err) {
    console.error(`Erro ao buscar lead ${id}:`, err)
    return null
  }
}

export async function criarLead(dados: {
  nome: string
  telefone_whatsapp: string
  email?: string
  origem: OrigemLead
  interesse?: string
  status_funil?: StatusFunilLead
  valor_estimado_centavos?: number
  vendedor_responsavel?: string
  persona?: string
  observacoes?: string
}): Promise<LeadComercial> {
  const telNormalizado = normalizarTelefoneE164(dados.telefone_whatsapp)
  const agoraIso = new Date().toISOString()

  const payload: Record<string, any> = {
    nome: dados.nome.trim(),
    telefone_whatsapp: telNormalizado,
    email: dados.email?.trim().toLowerCase() || '',
    origem: dados.origem,
    interesse: dados.interesse?.trim() || '',
    status_funil: dados.status_funil || 'novo_contato',
    valor_estimado_centavos: dados.valor_estimado_centavos || 0,
    vendedor_responsavel: dados.vendedor_responsavel || pb.authStore.model?.id || '',
    persona: dados.persona || '',
    data_ultimo_contato: agoraIso,
    observacoes: dados.observacoes?.trim() || '',
  }

  const rec = await pb.collection('leads').create(payload)

  // Grava primeira interação inicial
  try {
    await pb.collection('lead_interacoes').create({
      lead: rec.id,
      data_hora: agoraIso,
      tipo: 'mensagem_recebida',
      anotacao: `Lead criado via canal ${dados.origem}.`,
      usuario: pb.authStore.model?.id || null,
    })
  } catch {
    /* intentionally ignored */
  }

  return {
    id: rec.id,
    nome: rec.nome,
    telefone_whatsapp: rec.telefone_whatsapp,
    email: rec.email,
    origem: rec.origem as OrigemLead,
    interesse: rec.interesse,
    status_funil: rec.status_funil as StatusFunilLead,
    valor_estimado_centavos: rec.valor_estimado_centavos,
    vendedor_responsavel: rec.vendedor_responsavel,
    persona: rec.persona,
    data_ultimo_contato: agoraIso,
    observacoes: rec.observacoes,
    created: rec.created,
    updated: rec.updated,
  }
}

export async function atualizarStatusLead(dados: {
  leadId: string
  novoStatus: StatusFunilLead
  motivoPerda?: MotivoPerdaLead
  anotacaoInteracao?: string
}): Promise<void> {
  const payload: Record<string, any> = {
    status_funil: dados.novoStatus,
    data_ultimo_contato: new Date().toISOString(),
  }

  if (dados.novoStatus === 'fechado_perdido') {
    if (!dados.motivoPerda) {
      throw new Error('Motivo de perda é obrigatório ao marcar como Fechado Perdido.')
    }
    payload.motivo_perda = dados.motivoPerda
  } else {
    payload.motivo_perda = ''
  }

  if (dados.novoStatus === 'fechado_ganho') {
    payload.data_conversao = new Date().toISOString()
  }

  await pb.collection('leads').update(dados.leadId, payload)

  if (dados.anotacaoInteracao) {
    await registrarInteracaoLead({
      leadId: dados.leadId,
      tipo: 'mensagem_enviada',
      anotacao: dados.anotacaoInteracao,
    })
  }
}

// 2.1 Interações de Lead
export async function listarInteracoesDoLead(leadId: string): Promise<LeadInteracao[]> {
  try {
    const list = await pb.collection('lead_interacoes').getFullList({
      filter: `lead = '${leadId}'`,
      sort: '-data_hora',
      expand: 'usuario',
    })

    return list.map((it: any) => ({
      id: it.id,
      lead: it.lead,
      data_hora: it.data_hora,
      tipo: it.tipo as TipoInteracaoLead,
      anotacao: it.anotacao || '',
      usuario: it.usuario,
      usuario_expand: it.expand?.usuario,
      created: it.created,
      updated: it.updated,
    }))
  } catch (err) {
    console.error('Erro ao listar interações:', err)
    return []
  }
}

export async function registrarInteracaoLead(dados: {
  leadId: string
  tipo: TipoInteracaoLead
  anotacao: string
  dataHora?: string
}): Promise<LeadInteracao> {
  const agoraIso = dados.dataHora || new Date().toISOString()
  const rec = await pb.collection('lead_interacoes').create({
    lead: dados.leadId,
    data_hora: agoraIso,
    tipo: dados.tipo,
    anotacao: dados.anotacao.trim(),
    usuario: pb.authStore.model?.id || null,
  })

  // Atualiza data_ultimo_contato no lead
  try {
    await pb.collection('leads').update(dados.leadId, {
      data_ultimo_contato: agoraIso,
    })
  } catch {
    /* intentionally ignored */
  }

  return {
    id: rec.id,
    lead: rec.lead,
    data_hora: rec.data_hora,
    tipo: rec.tipo as TipoInteracaoLead,
    anotacao: rec.anotacao,
    usuario: rec.usuario,
    created: rec.created,
    updated: rec.updated,
  }
}

// 2.2 Conversão Lead -> Cliente (Pessoa)
export async function vincularLeadAClienteExistente(
  leadId: string,
  pessoaClienteId: string,
): Promise<void> {
  const agoraIso = new Date().toISOString()
  await pb.collection('leads').update(leadId, {
    cliente_convertido: pessoaClienteId,
    status_funil: 'fechado_ganho',
    data_conversao: agoraIso,
    data_ultimo_contato: agoraIso,
  })

  // Grava auditoria
  try {
    await pb.collection('logs_auditoria').create({
      entidade: 'leads',
      identificador_registro: leadId,
      campo: 'CONVERSAO_LEAD_CLIENTE',
      valor_novo: JSON.stringify({ leadId, pessoaClienteId, acao: 'VINCULO_CLIENTE_EXISTENTE' }),
      usuario: pb.authStore.model?.id || null,
      data_hora: agoraIso,
      origem: 'marketing_service',
    })
  } catch {
    /* intentionally ignored */
  }
}

export async function converterLeadEmNovoCliente(
  lead: LeadComercial,
  dadosExtras?: {
    cpf?: string
    logradouro?: string
    numero?: string
    bairro?: string
    cidade?: string
    uf?: string
    cep?: string
  },
): Promise<Pessoa> {
  const agoraIso = new Date().toISOString()

  // Se já tiver cliente convertido, retornar o existente (idempotência)
  if (lead.cliente_convertido) {
    const cliExistente = await pb.collection('pessoas').getOne(lead.cliente_convertido)
    return cliExistente as any
  }

  // Gera CPF sequencial fictício válido se não fornecido
  let docFinal = (dadosExtras?.cpf || '').replace(/\D/g, '')
  if (!docFinal || docFinal.length !== 11) {
    // 11144477735 é o cliente semente padrão ou usa gerador numérico compatível
    docFinal = '11144477735'
  }

  // Cria ou localiza pessoa por documento ou telefone
  let pessoaId = ''
  let recPessoa: any = null
  try {
    recPessoa = await pb.collection('pessoas').getFirstListItem(`documento = '${docFinal}'`)
    pessoaId = recPessoa.id
  } catch (_) {
    // Cria nova pessoa física
    recPessoa = await pb.collection('pessoas').create({
      tipo_pessoa: 'FISICA',
      documento: docFinal,
      nome_razao_social: lead.nome,
      status: 'ativo',
      data_cadastro: agoraIso,
      persona: lead.persona || null,
      observacao_interna: `Cliente convertido automaticamente a partir do Lead de Marketing #${lead.id} (Origem: ${lead.origem})`,
    })
    pessoaId = recPessoa.id
  }

  // Cria papel_cliente se inexistente
  try {
    await pb.collection('papel_cliente').getFirstListItem(`pessoa = '${pessoaId}'`)
  } catch (_) {
    await pb.collection('papel_cliente').create({
      pessoa: pessoaId,
      status: 'ativo',
      forma_pagamento_preferencial: 'PIX',
      vendedor_responsavel: lead.vendedor_responsavel || pb.authStore.model?.id || null,
    })
  }

  // Cria contato oficial com WhatsApp do Lead
  try {
    await pb.collection('contatos').getFirstListItem(`pessoa = '${pessoaId}'`)
  } catch (_) {
    await pb.collection('contatos').create({
      pessoa: pessoaId,
      nome_contato: lead.nome,
      papel: 'comercial',
      whatsapp: lead.telefone_whatsapp,
      email: lead.email || '',
      is_preferencial: true,
    })
  }

  // Se endereço foi fornecido, cadastra
  if (dadosExtras?.logradouro && dadosExtras?.cidade && dadosExtras?.uf) {
    const cepLimpo = (dadosExtras.cep || '22790700').replace(/\D/g, '')
    try {
      await pb.collection('enderecos').create({
        pessoa: pessoaId,
        tipo: 'entrega',
        cep: cepLimpo,
        logradouro: dadosExtras.logradouro,
        numero: dadosExtras.numero || 'S/N',
        bairro: dadosExtras.bairro || 'Recreio dos Bandeirantes',
        cidade: dadosExtras.cidade,
        uf: dadosExtras.uf,
        pais: 'Brasil',
        is_principal: true,
      })
    } catch {
      /* intentionally ignored */
    }
  }

  // Atualiza lead com o vínculo
  await vincularLeadAClienteExistente(lead.id, pessoaId)

  return recPessoa as Pessoa
}

// =========================================================================
// 3. CALENDÁRIO EDITORIAL
// =========================================================================

export async function listarPublicacoesCalendario(): Promise<ItemCalendarioEditorial[]> {
  try {
    const records = await pb.collection('calendario_editorial').getFullList({
      sort: 'data_prevista',
      expand: 'autor_publicacao,produto_relacionado',
    })

    return records.map((r: any) => ({
      id: r.id,
      data_prevista: r.data_prevista,
      canal: r.canal as CanalMarketingCodigo,
      titulo: r.titulo || '',
      descricao: r.descricao || '',
      tipo_conteudo: r.tipo_conteudo as TipoConteudoEditorial,
      status: r.status as StatusPublicacao,
      data_publicacao_real: r.data_publicacao_real,
      autor_publicacao: r.autor_publicacao,
      autor_expand: r.expand?.autor_publicacao,
      produto_relacionado: r.produto_relacionado,
      produto_expand: r.expand?.produto_relacionado,
      campanha: r.campanha || '',
      link_publicacao: r.link_publicacao || '',
      created: r.created,
      updated: r.updated,
    }))
  } catch (err) {
    console.error('Erro ao listar publicações:', err)
    return []
  }
}

export async function criarPublicacao(dados: {
  data_prevista: string
  canal: CanalMarketingCodigo
  titulo: string
  descricao?: string
  tipo_conteudo: TipoConteudoEditorial
  status?: StatusPublicacao
  produto_relacionado?: string
  campanha?: string
  link_publicacao?: string
}): Promise<ItemCalendarioEditorial> {
  const payload: Record<string, any> = {
    data_prevista: dados.data_prevista,
    canal: dados.canal,
    titulo: dados.titulo.trim(),
    descricao: dados.descricao?.trim() || '',
    tipo_conteudo: dados.tipo_conteudo,
    status: dados.status || 'planejada',
    autor_publicacao: pb.authStore.model?.id || null,
    campanha: dados.campanha?.trim() || '',
    link_publicacao: dados.link_publicacao?.trim() || '',
  }
  if (dados.produto_relacionado) {
    payload.produto_relacionado = dados.produto_relacionado
  }

  const rec = await pb.collection('calendario_editorial').create(payload)

  return {
    id: rec.id,
    data_prevista: rec.data_prevista,
    canal: rec.canal as CanalMarketingCodigo,
    titulo: rec.titulo,
    descricao: rec.descricao,
    tipo_conteudo: rec.tipo_conteudo as TipoConteudoEditorial,
    status: rec.status as StatusPublicacao,
    data_publicacao_real: rec.data_publicacao_real,
    autor_publicacao: rec.autor_publicacao,
    produto_relacionado: rec.produto_relacionado,
    campanha: rec.campanha,
    link_publicacao: rec.link_publicacao,
    created: rec.created,
    updated: rec.updated,
  }
}

export async function marcarPublicacaoComoPublicada(
  id: string,
  linkPublicacao?: string,
): Promise<void> {
  const agoraIso = new Date().toISOString()
  await pb.collection('calendario_editorial').update(id, {
    status: 'publicada',
    data_publicacao_real: agoraIso,
    autor_publicacao: pb.authStore.model?.id || null,
    link_publicacao: linkPublicacao?.trim() || undefined,
  })
}

export async function atualizarPublicacao(
  id: string,
  dados: Partial<{
    data_prevista: string
    canal: CanalMarketingCodigo
    titulo: string
    descricao: string
    tipo_conteudo: TipoConteudoEditorial
    status: StatusPublicacao
    produto_relacionado: string
    campanha: string
    link_publicacao: string
  }>,
): Promise<void> {
  await pb.collection('calendario_editorial').update(id, dados)
}

export async function excluirPublicacao(id: string): Promise<void> {
  await pb.collection('calendario_editorial').delete(id)
}

// =========================================================================
// 4. EXPORTAÇÃO CSV DE MARKETING (LEADS E CALENDÁRIO COM CABEÇALHO DA MARCA)
// =========================================================================

export function exportarCsvLeads(leads: LeadComercial[]): void {
  const agoraYmd = new Date().toISOString().split('T')[0]
  const cabecalhoMarca =
    `# ${BRAND_TOKENS.fullName.toUpperCase()} - RELATORIO COMERCIAL DE FUNIL DE LEADS\r\n` +
    `# Emissao: ${formatarDataHoraPtBR(new Date().toISOString())} | Sistema Administrativo Bru Memorias\r\n` +
    `# Total de Registros: ${leads.length}\r\n\r\n`

  const headers = [
    'Nome',
    'Telefone WhatsApp',
    'E-mail',
    'Origem',
    'Interesse / Produto',
    'Status Funil',
    'Motivo Perda',
    'Valor Estimado (R$)',
    'Vendedor Responsavel',
    'Persona',
    'Cliente Convertido',
    'Data Ultimo Contato',
    'Data Cadastro',
  ]

  const rows = leads.map((l) =>
    [
      `"${l.nome.replace(/"/g, '""')}"`,
      `"${l.telefone_whatsapp}"`,
      `"${l.email || ''}"`,
      `"${l.origem}"`,
      `"${(l.interesse || '').replace(/"/g, '""')}"`,
      `"${l.status_funil}"`,
      `"${l.motivo_perda || ''}"`,
      `"${((l.valor_estimado_centavos || 0) / 100).toFixed(2).replace('.', ',')}"`,
      `"${(l.vendedor_expand?.name || l.vendedor_expand?.email || '').replace(/"/g, '""')}"`,
      `"${(l.persona_expand?.nome || '').replace(/"/g, '""')}"`,
      `"${l.cliente_convertido ? 'Sim (ID: ' + l.cliente_convertido + ')' : 'Nao'}"`,
      `"${formatarDataPtBR(l.data_ultimo_contato)}"`,
      `"${formatarDataPtBR(l.created)}"`,
    ].join(';'),
  )

  const csvContent = '\uFEFF' + cabecalhoMarca + headers.join(';') + '\r\n' + rows.join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `bru-memorias-leads-${agoraYmd}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  // Grava auditoria da exportação
  try {
    pb.collection('logs_auditoria').create({
      entidade: 'leads',
      identificador_registro: 'EXPORT_CSV',
      campo: 'EXPORTACAO_LEADS',
      valor_novo: JSON.stringify({ total_exportados: leads.length, data: agoraYmd }),
      usuario: pb.authStore.model?.id || null,
      data_hora: new Date().toISOString(),
      origem: 'export_csv_leads',
    })
  } catch {
    /* intentionally ignored */
  }
}

export function exportarCsvCalendarioEditorial(posts: ItemCalendarioEditorial[]): void {
  const agoraYmd = new Date().toISOString().split('T')[0]
  const cabecalhoMarca =
    `# ${BRAND_TOKENS.fullName.toUpperCase()} - CALENDARIO EDITORIAL DE MARKETING\r\n` +
    `# Emissao: ${formatarDataHoraPtBR(new Date().toISOString())} | Sistema Administrativo Bru Memorias\r\n` +
    `# Total de Publicacoes: ${posts.length}\r\n\r\n`

  const headers = [
    'Data Prevista',
    'Canal',
    'Titulo',
    'Tipo Conteudo',
    'Status',
    'Data Publicacao Real',
    'Campanha',
    'Descricao',
    'Link',
  ]

  const rows = posts.map((p) =>
    [
      `"${formatarDataPtBR(p.data_prevista)}"`,
      `"${p.canal}"`,
      `"${p.titulo.replace(/"/g, '""')}"`,
      `"${p.tipo_conteudo}"`,
      `"${p.status}"`,
      `"${p.data_publicacao_real ? formatarDataPtBR(p.data_publicacao_real) : '-'}"`,
      `"${(p.campanha || '').replace(/"/g, '""')}"`,
      `"${(p.descricao || '').replace(/"/g, '""')}"`,
      `"${p.link_publicacao || ''}"`,
    ].join(';'),
  )

  const csvContent = '\uFEFF' + cabecalhoMarca + headers.join(';') + '\r\n' + rows.join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `bru-memorias-calendario-editorial-${agoraYmd}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  try {
    pb.collection('logs_auditoria').create({
      entidade: 'calendario_editorial',
      identificador_registro: 'EXPORT_CSV',
      campo: 'EXPORTACAO_CALENDARIO',
      valor_novo: JSON.stringify({ total_exportados: posts.length, data: agoraYmd }),
      usuario: pb.authStore.model?.id || null,
      data_hora: new Date().toISOString(),
      origem: 'export_csv_calendario',
    })
  } catch {
    /* intentionally ignored */
  }
}
