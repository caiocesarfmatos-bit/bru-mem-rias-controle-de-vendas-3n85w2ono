// src/services/backupLegadoV5.ts
// Rotina de detecção, exportação bruta e importação assistida de dados legados (v5 / localStorage)

import pb from '@/lib/pocketbase/client'
import { STORAGE_KEYS_V5 } from '@/lib/storageV5'
import { STORAGE_KEYS } from '@/lib/storage'
import { normalizarDocumento, validarCpf, validarCnpj } from '@/lib/formatters'

export interface ItemRelatorioMigracao {
  colecao: string
  identificador: string
  status: 'importado' | 'ignorado_existente' | 'ignorado_invalido'
  motivo: string
}

export interface RelatorioMigracaoLegado {
  totalLidos: number
  totalImportados: number
  totalIgnorados: number
  detalhes: ItemRelatorioMigracao[]
  executadoEm: string
}

export interface BackupLegadoDetectado {
  possuiDados: boolean
  chavesEncontradas: string[]
  dadosBrutos: Record<string, any>
  resumo: {
    clientes: number
    fornecedores: number
    produtos: number
    orcamentos: number
    pedidos: number
    outrasChaves: number
  }
}

/**
 * Varrer o localStorage do navegador no mesmo origin procurando dados da v5 e versões anteriores
 */
export function detectarDadosLegadosNavegador(): BackupLegadoDetectado {
  const chavesEncontradas: string[] = []
  const dadosBrutos: Record<string, any> = {}

  // Chaves conhecidas do projeto
  const chavesAlvo = [
    STORAGE_KEYS_V5.DATA,
    STORAGE_KEYS_V5.AUTH,
    STORAGE_KEYS_V5.SESSAO,
    STORAGE_KEYS.DATA,
    STORAGE_KEYS.AUDIT,
    STORAGE_KEYS.SETTINGS,
  ]

  // Também varre qualquer chave do origin com prefixo bru-memorias
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && (chavesAlvo.includes(k as any) || k.startsWith('bru-memorias'))) {
      if (!chavesEncontradas.includes(k)) {
        chavesEncontradas.push(k)
      }
    }
  }

  let totalClientes = 0
  let totalFornecedores = 0
  let totalProdutos = 0
  let totalOrcamentos = 0
  let totalPedidos = 0
  let outrasChaves = 0

  for (const k of chavesEncontradas) {
    const val = localStorage.getItem(k)
    if (val) {
      try {
        const parsed = JSON.parse(val)
        dadosBrutos[k] = parsed

        if (k === STORAGE_KEYS_V5.DATA || k === STORAGE_KEYS.DATA) {
          if (Array.isArray(parsed.clientes)) totalClientes += parsed.clientes.length
          if (Array.isArray(parsed.fornecedores)) totalFornecedores += parsed.fornecedores.length
          if (Array.isArray(parsed.produtos)) totalProdutos += parsed.produtos.length
          if (Array.isArray(parsed.orcamentos)) totalOrcamentos += parsed.orcamentos.length
          if (Array.isArray(parsed.pedidos)) totalPedidos += parsed.pedidos.length
        } else {
          outrasChaves++
        }
      } catch {
        dadosBrutos[k] = val
        outrasChaves++
      }
    }
  }

  const possuiDados =
    totalClientes > 0 ||
    totalFornecedores > 0 ||
    totalProdutos > 0 ||
    totalOrcamentos > 0 ||
    totalPedidos > 0 ||
    chavesEncontradas.length > 0

  return {
    possuiDados,
    chavesEncontradas,
    dadosBrutos,
    resumo: {
      clientes: totalClientes,
      fornecedores: totalFornecedores,
      produtos: totalProdutos,
      orcamentos: totalOrcamentos,
      pedidos: totalPedidos,
      outrasChaves,
    },
  }
}

/**
 * Exportar arquivo JSON de backup legado cru para download
 */
export function baixarArquivoBackupLegado(dados: Record<string, any>): void {
  const payload = {
    origem: 'Bru Memórias - Backup Legado localStorage (v5 / Prompt Mestre)',
    dataExportacao: new Date().toISOString(),
    ambienteNavegador: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    dados: dados,
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute(
    'download',
    `backup_legado_v5_bru_memorias_${new Date().toISOString().split('T')[0]}.json`,
  )
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Importar com idempotência para o servidor (pessoas, clientes, fornecedores e produtos)
 */
export async function importarDadosLegadosParaServidor(
  dadosBrutos: Record<string, any>,
): Promise<RelatorioMigracaoLegado> {
  const relatorio: ItemRelatorioMigracao[] = []
  let totalLidos = 0
  let totalImportados = 0
  let totalIgnorados = 0

  const userAtualId = pb.authStore.model?.id || ''

  // 1. Extrair coleções unificadas
  const v5Data = dadosBrutos[STORAGE_KEYS_V5.DATA] || {}
  const v1Data = dadosBrutos[STORAGE_KEYS.DATA] || {}

  const clientesLegado: any[] = [
    ...(Array.isArray(v5Data.clientes) ? v5Data.clientes : []),
    ...(Array.isArray(v1Data.clientes) ? v1Data.clientes : []),
  ]

  const fornecedoresLegado: any[] = [
    ...(Array.isArray(v5Data.fornecedores) ? v5Data.fornecedores : []),
    ...(Array.isArray(v1Data.fornecedores) ? v1Data.fornecedores : []),
  ]

  const produtosLegado: any[] = [
    ...(Array.isArray(v5Data.produtos) ? v5Data.produtos : []),
    ...(Array.isArray(v1Data.produtos) ? v1Data.produtos : []),
  ]

  // 2. Importar Clientes (Idempotente por documento ou nome normalizado)
  for (const c of clientesLegado) {
    totalLidos++
    const nome = (c.nome || '').trim()
    if (!nome) {
      totalIgnorados++
      relatorio.push({
        colecao: 'pessoas (cliente)',
        identificador: c.id || 'sem_id',
        status: 'ignorado_invalido',
        motivo: 'Registro sem nome',
      })
      continue
    }

    // Documento sanitizado ou provisório único
    let docLimpo = normalizarDocumento(c.documento || c.cpf || '')
    if (docLimpo && !validarCpf(docLimpo) && !validarCnpj(docLimpo)) {
      docLimpo = ''
    }

    try {
      // Verificar se já existe no PocketBase
      let existente = false
      if (docLimpo) {
        const achados = await pb.collection('pessoas').getList(1, 1, {
          filter: `documento = '${docLimpo}'`,
        })
        if (achados.items.length > 0) existente = true
      } else {
        const achados = await pb.collection('pessoas').getList(1, 1, {
          filter: `nome_razao_social = "${nome.replace(/"/g, '\\"')}"`,
        })
        if (achados.items.length > 0) existente = true
      }

      if (existente) {
        totalIgnorados++
        relatorio.push({
          colecao: 'pessoas (cliente)',
          identificador: nome,
          status: 'ignorado_existente',
          motivo: 'Já cadastrado na base de dados oficial (idempotência preservada)',
        })
        continue
      }

      // Se não possui CPF real na v5, gera código provisório controlado
      const docFinal =
        docLimpo || `LEGADO-${(c.id || Math.random().toString(36).substring(2, 8)).toUpperCase()}`

      const novaPessoa = await pb.collection('pessoas').create({
        tipo_pessoa: 'FISICA',
        documento: docFinal,
        nome_razao_social: nome,
        status: 'ativo',
        data_cadastro: c.dataCadastro || new Date().toISOString(),
        observacao_interna: `Migrado da v5 legada em ${new Date().toISOString().split('T')[0]}. Origem: ${c.origem || 'Legado'}.`,
      })

      // Papel Cliente
      await pb.collection('papel_cliente').create({
        pessoa: novaPessoa.id,
        status: 'ativo',
        forma_pagamento_preferencial: 'PIX',
        vendedor_responsavel: userAtualId || null,
      })

      // Contato preferencial
      const wpp = c.whatsapp || c.telefoneWhatsapp || ''
      if (wpp) {
        await pb.collection('contatos').create({
          pessoa: novaPessoa.id,
          nome_contato: nome,
          papel: 'comercial',
          whatsapp: wpp,
          email: c.email || '',
          is_preferencial: true,
        })
      }

      totalImportados++
      relatorio.push({
        colecao: 'pessoas (cliente)',
        identificador: nome,
        status: 'importado',
        motivo: `Pessoa e papel criados com id=${novaPessoa.id}`,
      })
    } catch (err: any) {
      totalIgnorados++
      relatorio.push({
        colecao: 'pessoas (cliente)',
        identificador: nome,
        status: 'ignorado_invalido',
        motivo: err.message || 'Erro ao persistir no PocketBase',
      })
    }
  }

  // 3. Importar Fornecedores
  for (const f of fornecedoresLegado) {
    totalLidos++
    const nome = (f.nome || '').trim()
    if (!nome) {
      totalIgnorados++
      relatorio.push({
        colecao: 'pessoas (fornecedor)',
        identificador: f.id || 'sem_id',
        status: 'ignorado_invalido',
        motivo: 'Registro sem nome',
      })
      continue
    }

    try {
      const achados = await pb.collection('pessoas').getList(1, 1, {
        filter: `nome_razao_social = "${nome.replace(/"/g, '\\"')}"`,
      })

      if (achados.items.length > 0) {
        totalIgnorados++
        relatorio.push({
          colecao: 'pessoas (fornecedor)',
          identificador: nome,
          status: 'ignorado_existente',
          motivo: 'Já cadastrado na base de dados (idempotente)',
        })
        continue
      }

      const docFinal = `FORN-LEGADO-${(f.id || Math.random().toString(36).substring(2, 8)).toUpperCase()}`

      const novaPessoa = await pb.collection('pessoas').create({
        tipo_pessoa: 'JURIDICA',
        documento: docFinal,
        nome_razao_social: nome,
        status: 'ativo',
        data_cadastro: f.criadoEm || new Date().toISOString(),
        observacao_interna: `Fornecedor importado do legado v5. Prazo informado: ${f.prazoMedioDias || f.prazo || 'N/A'}.`,
      })

      await pb.collection('papel_fornecedor').create({
        pessoa: novaPessoa.id,
        status: 'ativo',
        prazo_padrao_entrega_dias: 3,
        condicao_pagamento_padrao: f.condicaoPagamento || 'PIX',
      })

      if (f.contato) {
        await pb.collection('contatos').create({
          pessoa: novaPessoa.id,
          nome_contato: nome,
          papel: 'comercial',
          telefone_fixo: f.contato,
          is_preferencial: true,
        })
      }

      totalImportados++
      relatorio.push({
        colecao: 'pessoas (fornecedor)',
        identificador: nome,
        status: 'importado',
        motivo: `Fornecedor criado com id=${novaPessoa.id}`,
      })
    } catch (err: any) {
      totalIgnorados++
      relatorio.push({
        colecao: 'pessoas (fornecedor)',
        identificador: nome,
        status: 'ignorado_invalido',
        motivo: err.message || 'Erro ao persistir fornecedor',
      })
    }
  }

  // 4. Registrar auditoria da migração
  try {
    await pb.collection('logs_auditoria').create({
      entidade: 'MIGRACAO_LEGADO_V5',
      identificador_registro: `MIG-${Date.now()}`,
      campo: 'IMPORTACAO_LOCALSTORAGE',
      valor_anterior: '',
      valor_novo: JSON.stringify({
        totalLidos,
        totalImportados,
        totalIgnorados,
      }),
      usuario: userAtualId || null,
      data_hora: new Date().toISOString(),
      origem: 'assistente_migracao_front',
    })
  } catch (err) {
    console.warn('Falha ao auditar migração legado:', err)
  }

  return {
    totalLidos,
    totalImportados,
    totalIgnorados,
    detalhes: relatorio,
    executadoEm: new Date().toISOString(),
  }
}
