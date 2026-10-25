// src/services/pessoas.ts
import pb from '@/lib/pocketbase/client'
import {
  Pessoa,
  PapelCliente,
  PapelFornecedor,
  Contato,
  Endereco,
  RedeSocial,
} from '@/types/sistema'
import {
  normalizarDocumento,
  validarCpf,
  validarCnpj,
  normalizarCep,
  normalizarTelefoneE164,
} from '@/lib/formatters'

export async function listarPessoas(filtroTipo?: 'cliente' | 'fornecedor'): Promise<Pessoa[]> {
  try {
    const records = await pb.collection('pessoas').getFullList({
      sort: 'nome_razao_social',
    })

    const pessoas: Pessoa[] = []
    for (const r of records) {
      const p: Pessoa = {
        id: r.id,
        tipo_pessoa: r.tipo_pessoa,
        documento: r.documento,
        nome_razao_social: r.nome_razao_social,
        nome_fantasia: r.nome_fantasia,
        inscricao_estadual: r.inscricao_estadual,
        status: r.status,
        data_cadastro: r.data_cadastro,
        observacao_interna: r.observacao_interna,
      }

      // Buscar papel cliente
      try {
        const cli = await pb.collection('papel_cliente').getFirstListItem(`pessoa = '${r.id}'`)
        p.papel_cliente = {
          id: cli.id,
          pessoa: r.id,
          status: cli.status,
          limite_credito_centavos: cli.limite_credito_centavos,
          forma_pagamento_preferencial: cli.forma_pagamento_preferencial,
          vendedor_responsavel: cli.vendedor_responsavel,
        }
      } catch {
        /* intentionally ignored */
      }

      // Buscar papel fornecedor
      try {
        const forn = await pb.collection('papel_fornecedor').getFirstListItem(`pessoa = '${r.id}'`)
        p.papel_fornecedor = {
          id: forn.id,
          pessoa: r.id,
          status: forn.status,
          prazo_padrao_entrega_dias: forn.prazo_padrao_entrega_dias,
          condicao_pagamento_padrao: forn.condicao_pagamento_padrao,
        }
      } catch {
        /* intentionally ignored */
      }

      // Buscar contatos
      try {
        const contatosRec = await pb.collection('contatos').getFullList({
          filter: `pessoa = '${r.id}'`,
        })
        p.contatos = contatosRec.map((c) => ({
          id: c.id,
          pessoa: r.id,
          nome_contato: c.nome_contato,
          papel: c.papel,
          telefone_fixo: c.telefone_fixo,
          celular: c.celular,
          whatsapp: c.whatsapp,
          email: c.email,
          is_preferencial: c.is_preferencial,
        }))
      } catch {
        /* intentionally ignored */
      }

      // Buscar endereços
      try {
        const endRec = await pb.collection('enderecos').getFullList({
          filter: `pessoa = '${r.id}'`,
        })
        p.enderecos = endRec.map((e) => ({
          id: e.id,
          pessoa: r.id,
          tipo: e.tipo,
          cep: e.cep,
          logradouro: e.logradouro,
          numero: e.numero,
          complemento: e.complemento,
          bairro: e.bairro,
          cidade: e.cidade,
          uf: e.uf,
          pais: e.pais,
          is_principal: e.is_principal,
        }))
      } catch {
        /* intentionally ignored */
      }

      // Filtrar conforme papel solicitado
      if (filtroTipo === 'cliente' && !p.papel_cliente) continue
      if (filtroTipo === 'fornecedor' && !p.papel_fornecedor) continue

      pessoas.push(p)
    }

    return pessoas
  } catch (err) {
    console.error('Erro ao listar pessoas:', err)
    return []
  }
}

export async function criarPessoaComPapel(dados: {
  tipo_pessoa: 'FISICA' | 'JURIDICA'
  documento: string
  nome_razao_social: string
  nome_fantasia?: string
  status: 'ativo' | 'inativo' | 'bloqueado'
  observacao_interna?: string
  is_cliente?: boolean
  forma_pagamento_preferencial?: string
  is_fornecedor?: boolean
  prazo_padrao_entrega_dias?: number
  condicao_pagamento_padrao?: string
  contato_nome?: string
  contato_whatsapp?: string
  contato_email?: string
  endereco_cep?: string
  endereco_logradouro?: string
  endereco_numero?: string
  endereco_bairro?: string
  endereco_cidade?: string
  endereco_uf?: string
}): Promise<Pessoa> {
  // Normalização e validação R10
  const docLimpo = normalizarDocumento(dados.documento)
  if (dados.tipo_pessoa === 'FISICA' && !validarCpf(docLimpo)) {
    throw new Error('R10: CPF inválido. Verifique o número digitado.')
  }
  if (dados.tipo_pessoa === 'JURIDICA' && !validarCnpj(docLimpo)) {
    throw new Error('R10: CNPJ inválido. Verifique o número digitado.')
  }

  // 1. Criar Pessoa
  const pessoaRec = await pb.collection('pessoas').create({
    tipo_pessoa: dados.tipo_pessoa,
    documento: docLimpo,
    nome_razao_social: dados.nome_razao_social.trim(),
    nome_fantasia: dados.nome_fantasia ? dados.nome_fantasia.trim() : '',
    status: dados.status || 'ativo',
    data_cadastro: new Date().toISOString(),
    observacao_interna: dados.observacao_interna || '',
  })

  // 2. Criar Papel Cliente
  let papelCli: PapelCliente | undefined
  if (dados.is_cliente) {
    const cRec = await pb.collection('papel_cliente').create({
      pessoa: pessoaRec.id,
      status: 'ativo',
      forma_pagamento_preferencial: dados.forma_pagamento_preferencial || 'PIX',
      vendedor_responsavel: pb.authStore.model?.id || '',
    })
    papelCli = {
      id: cRec.id,
      pessoa: pessoaRec.id,
      status: 'ativo',
      forma_pagamento_preferencial: cRec.forma_pagamento_preferencial,
    }
  }

  // 3. Criar Papel Fornecedor
  let papelForn: PapelFornecedor | undefined
  if (dados.is_fornecedor) {
    const fRec = await pb.collection('papel_fornecedor').create({
      pessoa: pessoaRec.id,
      status: 'ativo',
      prazo_padrao_entrega_dias: dados.prazo_padrao_entrega_dias || 5,
      condicao_pagamento_padrao: dados.condicao_pagamento_padrao || '',
    })
    papelForn = {
      id: fRec.id,
      pessoa: pessoaRec.id,
      status: 'ativo',
      prazo_padrao_entrega_dias: fRec.prazo_padrao_entrega_dias,
    }
  }

  // 4. Criar Contato se fornecido
  const contatos: Contato[] = []
  if (dados.contato_nome || dados.contato_whatsapp || dados.contato_email) {
    const wpp = dados.contato_whatsapp ? normalizarTelefoneE164(dados.contato_whatsapp) : ''
    const contRec = await pb.collection('contatos').create({
      pessoa: pessoaRec.id,
      nome_contato: (dados.contato_nome || dados.nome_razao_social).trim(),
      papel: 'comercial',
      whatsapp: wpp,
      email: (dados.contato_email || '').trim(),
      is_preferencial: true,
    })
    contatos.push({
      id: contRec.id,
      pessoa: pessoaRec.id,
      nome_contato: contRec.nome_contato,
      papel: 'comercial',
      whatsapp: contRec.whatsapp,
      email: contRec.email,
      is_preferencial: true,
    })
  }

  // 5. Criar Endereço se fornecido
  const enderecos: Endereco[] = []
  if (dados.endereco_cep && dados.endereco_logradouro) {
    const cepLimpo = normalizarCep(dados.endereco_cep)
    const endRec = await pb.collection('enderecos').create({
      pessoa: pessoaRec.id,
      tipo: 'entrega',
      cep: cepLimpo,
      logradouro: dados.endereco_logradouro.trim(),
      numero: dados.endereco_numero || 'S/N',
      bairro: dados.endereco_bairro || '',
      cidade: dados.endereco_cidade || 'Rio de Janeiro',
      uf: dados.endereco_uf || 'RJ',
      pais: 'Brasil',
      is_principal: true,
    })
    enderecos.push({
      id: endRec.id,
      pessoa: pessoaRec.id,
      tipo: 'entrega',
      cep: endRec.cep,
      logradouro: endRec.logradouro,
      numero: endRec.numero,
      bairro: endRec.bairro,
      cidade: endRec.cidade,
      uf: endRec.uf,
      pais: 'Brasil',
      is_principal: true,
    })
  }

  return {
    id: pessoaRec.id,
    tipo_pessoa: pessoaRec.tipo_pessoa,
    documento: pessoaRec.documento,
    nome_razao_social: pessoaRec.nome_razao_social,
    nome_fantasia: pessoaRec.nome_fantasia,
    status: pessoaRec.status,
    papel_cliente: papelCli,
    papel_fornecedor: papelForn,
    contatos: contatos,
    enderecos: enderecos,
  }
}
