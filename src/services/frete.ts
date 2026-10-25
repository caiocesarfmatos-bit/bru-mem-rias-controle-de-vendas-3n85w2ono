// src/services/frete.ts
// Serviço de faixas de frete próprias, cálculo automático, snapshot de pedido e auditoria

import pb from '@/lib/pocketbase/client'
import { obterRegiaoPorUfECidade } from './viaCep'

export type RegiaoFrete =
  | 'RJ_CAPITAL'
  | 'RJ_INTERIOR'
  | 'SUDESTE'
  | 'SUL'
  | 'CENTRO_OESTE'
  | 'NORDESTE'
  | 'NORTE'
  | 'NACIONAL'

export type ModalidadeFrete =
  | 'RETIRADA_ATELIE'
  | 'MOTOBOY_LOCAL'
  | 'PAC'
  | 'SEDEX'
  | 'TRANSPORTADORA'

export type TipoFaixaFrete = 'peso_gramas' | 'valor_pedido_centavos' | 'quantidade_itens'

export interface StatusIntegracaoCorreios {
  configurado: boolean
  descricao: string
  modo: 'OFICIAL_CORREIOS' | 'TABELA_LOCAL_FAIXAS'
  mensagem: string
}

/**
 * Consulta status da credencial dos Correios no servidor
 */
export async function consultarStatusCorreios(): Promise<StatusIntegracaoCorreios> {
  try {
    const res = await pb.send<StatusIntegracaoCorreios>('/backend/v1/sistema/correios-config', {
      method: 'GET',
    })
    return res
  } catch (err) {
    return {
      configurado: false,
      descricao: 'Cálculo por Faixas Locais (ViaCep)',
      modo: 'TABELA_LOCAL_FAIXAS',
      mensagem:
        'Credencial Correios não configurada no servidor. Usando tabela de 13 faixas com CEP.',
    }
  }
}

/**
 * Salva ou remove token dos Correios no servidor (somente Administrador)
 */
export async function salvarCredencialCorreios(
  token: string,
  usuarioCorreios?: string,
  remover?: boolean,
): Promise<{ sucesso: boolean; mensagem: string }> {
  const res = await pb.send<{ sucesso: boolean; mensagem: string }>(
    '/backend/v1/sistema/correios-config',
    {
      method: 'POST',
      body: { token, usuarioCorreios, remover },
    },
  )
  return res
}

export interface FaixaFreteRegistro {
  id: string
  nome: string
  regiao_destino: RegiaoFrete
  uf_destino?: string
  modalidade: ModalidadeFrete
  tipo_faixa: TipoFaixaFrete
  faixa_minima: number
  faixa_maxima: number
  preco_centavos: number
  prazo_dias_estimado: number
  ativo: boolean
  observacao?: string
  created?: string
  updated?: string
}

export interface OpcaoFreteCalculada {
  faixa_id?: string
  nome: string
  modalidade: ModalidadeFrete
  modalidade_rotulo: string
  preco_centavos: number
  prazo_dias_estimado: number
  observacao?: string
  is_gratis: boolean
  is_excecao_manual?: boolean
  justificativa?: string
}

export interface SnapshotFretePedido {
  faixa_id?: string
  nome_opcao: string
  modalidade: ModalidadeFrete
  preco_centavos: number
  prazo_dias_estimado: number
  cep_destino: string
  regiao_destino: string
  uf_destino: string
  cidade_destino: string
  peso_estimado_gramas?: number
  is_excecao_manual: boolean
  justificativa_excecao?: string
  calculado_em: string
}

export const MODALIDADE_ROTULOS: Record<ModalidadeFrete, string> = {
  RETIRADA_ATELIE: 'Retirada no Ateliê (Recreio)',
  MOTOBOY_LOCAL: 'Motoboy Expresso Local',
  PAC: 'PAC Econômico',
  SEDEX: 'Sedex Expresso',
  TRANSPORTADORA: 'Transportadora',
}

export const REGIAO_ROTULOS: Record<RegiaoFrete, string> = {
  RJ_CAPITAL: 'Rio de Janeiro (Capital)',
  RJ_INTERIOR: 'Rio de Janeiro (Interior/Metropolitana)',
  SUDESTE: 'Sudeste (SP, MG, ES)',
  SUL: 'Sul (PR, SC, RS)',
  CENTRO_OESTE: 'Centro-Oeste (DF, GO, MT, MS)',
  NORDESTE: 'Nordeste (BA, PE, CE, MA, PB, RN, AL, SE, PI)',
  NORTE: 'Norte (AM, PA, AC, RO, RR, AP, TO)',
  NACIONAL: 'Brasil (Todas as Regiões)',
}

/**
 * Peso médio de referência por ímã personalizado 5x5 cm (25 gramas, incluindo embalagem)
 */
export const PESO_MEDIO_IMA_GRAMAS = 25

/**
 * Listar todas as faixas cadastradas
 */
export async function listarFaixasFrete(
  apenasAtivas: boolean = false,
): Promise<FaixaFreteRegistro[]> {
  const filter = apenasAtivas ? 'ativo = true' : ''
  const records = await pb.collection('faixas_frete').getFullList<FaixaFreteRegistro>({
    filter,
    sort: 'regiao_destino,tipo_faixa,faixa_minima,preco_centavos',
  })
  return records
}

/**
 * Criar faixa de frete com registro de auditoria
 */
export async function criarFaixaFrete(
  dados: Omit<FaixaFreteRegistro, 'id' | 'created' | 'updated'>,
  usuarioNome: string = 'Administrador',
): Promise<FaixaFreteRegistro> {
  const record = await pb.collection('faixas_frete').create<FaixaFreteRegistro>({
    nome: dados.nome,
    regiao_destino: dados.regiao_destino,
    uf_destino: (dados.uf_destino || '').toUpperCase().trim(),
    modalidade: dados.modalidade,
    tipo_faixa: dados.tipo_faixa,
    faixa_minima: Number(dados.faixa_minima),
    faixa_maxima: Number(dados.faixa_maxima),
    preco_centavos: Number(dados.preco_centavos),
    prazo_dias_estimado: Number(dados.prazo_dias_estimado),
    ativo: dados.ativo ?? true,
    observacao: dados.observacao || '',
  })

  // Auditoria
  try {
    await pb.collection('auditoria').create({
      acao: 'criacao_faixa_frete',
      modulo: 'frete',
      usuario_id: pb.authStore.record?.id || '',
      detalhes_json: {
        faixa_id: record.id,
        nome: record.nome,
        regiao: record.regiao_destino,
        preco_centavos: record.preco_centavos,
        usuario_nome: usuarioNome,
      },
    })
  } catch {
    /* Não bloqueia a criação */
  }

  return record
}

/**
 * Atualizar faixa de frete existente com registro de auditoria
 */
export async function atualizarFaixaFrete(
  id: string,
  dados: Partial<FaixaFreteRegistro>,
  usuarioNome: string = 'Administrador',
): Promise<FaixaFreteRegistro> {
  const antes = await pb.collection('faixas_frete').getOne<FaixaFreteRegistro>(id)

  const record = await pb.collection('faixas_frete').update<FaixaFreteRegistro>(id, {
    ...dados,
    uf_destino: dados.uf_destino !== undefined ? dados.uf_destino.toUpperCase().trim() : undefined,
  })

  // Auditoria
  try {
    await pb.collection('auditoria').create({
      acao: 'edicao_faixa_frete',
      modulo: 'frete',
      usuario_id: pb.authStore.record?.id || '',
      detalhes_json: {
        faixa_id: id,
        antes: {
          nome: antes.nome,
          preco_centavos: antes.preco_centavos,
          ativo: antes.ativo,
        },
        depois: {
          nome: record.nome,
          preco_centavos: record.preco_centavos,
          ativo: record.ativo,
        },
        usuario_nome: usuarioNome,
      },
    })
  } catch {
    /* Não bloqueia atualização */
  }

  return record
}

/**
 * Excluir faixa de frete (apenas administrador)
 */
export async function excluirFaixaFrete(
  id: string,
  usuarioNome: string = 'Administrador',
): Promise<void> {
  const antes = await pb.collection('faixas_frete').getOne<FaixaFreteRegistro>(id)
  await pb.collection('faixas_frete').delete(id)

  try {
    await pb.collection('auditoria').create({
      acao: 'exclusao_faixa_frete',
      modulo: 'frete',
      usuario_id: pb.authStore.record?.id || '',
      detalhes_json: {
        faixa_id: id,
        nome: antes.nome,
        preco_centavos: antes.preco_centavos,
        usuario_nome: usuarioNome,
      },
    })
  } catch {
    /* Não bloqueia exclusão */
  }
}

export interface CalculoFreteParametros {
  uf: string
  cidade?: string
  pesoGramas?: number
  valorPedidoCentavos?: number
  quantidadeItens?: number
}

/**
 * Sugere automaticamente opções de frete a partir do destino (UF/Cidade) e dados do pedido
 */
export async function calcularOpcoesFrete(
  params: CalculoFreteParametros,
): Promise<{ regiao: RegiaoFrete; opcoes: OpcaoFreteCalculada[] }> {
  const regiao = obterRegiaoPorUfECidade(params.uf, params.cidade) as RegiaoFrete
  const ufNormal = (params.uf || '').toUpperCase().trim()
  const peso =
    params.pesoGramas ??
    (params.quantidadeItens ? params.quantidadeItens * PESO_MEDIO_IMA_GRAMAS : 100)
  const valorCentavos = params.valorPedidoCentavos ?? 0
  const quantidade = params.quantidadeItens ?? 1

  const todasFaixas = await listarFaixasFrete(true)

  // Filtra faixas que atendem a região (ou UF específica)
  const compativeis = todasFaixas.filter((faixa) => {
    if (!faixa.ativo) return false

    // Se a faixa tem UF específica, deve bater
    if (faixa.uf_destino && faixa.uf_destino !== ufNormal) {
      return false
    }

    // Região de destino ou cobertura NACIONAL
    const coincideRegiao = faixa.regiao_destino === regiao || faixa.regiao_destino === 'NACIONAL'
    if (!coincideRegiao) return false

    // Checa limites da faixa conforme o tipo
    if (faixa.tipo_faixa === 'peso_gramas') {
      return peso >= faixa.faixa_minima && peso <= faixa.faixa_maxima
    }
    if (faixa.tipo_faixa === 'valor_pedido_centavos') {
      return valorCentavos >= faixa.faixa_minima && valorCentavos <= faixa.faixa_maxima
    }
    if (faixa.tipo_faixa === 'quantidade_itens') {
      return quantidade >= faixa.faixa_minima && quantidade <= faixa.faixa_maxima
    }
    return true
  })

  // Transforma em opções de frete
  const opcoes: OpcaoFreteCalculada[] = compativeis.map((f) => ({
    faixa_id: f.id,
    nome: f.nome,
    modalidade: f.modalidade,
    modalidade_rotulo: MODALIDADE_ROTULOS[f.modalidade] || f.modalidade,
    preco_centavos: f.preco_centavos,
    prazo_dias_estimado: f.prazo_dias_estimado,
    observacao: f.observacao,
    is_gratis: f.preco_centavos === 0,
    is_excecao_manual: false,
  }))

  // Ordena por preço crescente
  opcoes.sort((a, b) => a.preco_centavos - b.preco_centavos)

  return { regiao, opcoes }
}

/**
 * Constrói snapshot estático para ser salvo no pedido (não recalcula depois, imutável)
 */
export function gerarSnapshotFrete(
  opcao: OpcaoFreteCalculada,
  dadosDestino: {
    cep: string
    cidade: string
    uf: string
    regiao: string
    pesoEstimadoGramas?: number
  },
): SnapshotFretePedido {
  return {
    faixa_id: opcao.faixa_id,
    nome_opcao: opcao.nome,
    modalidade: opcao.modalidade,
    preco_centavos: opcao.preco_centavos,
    prazo_dias_estimado: opcao.prazo_dias_estimado,
    cep_destino: dadosDestino.cep,
    regiao_destino: dadosDestino.regiao,
    uf_destino: dadosDestino.uf,
    cidade_destino: dadosDestino.cidade,
    peso_estimado_gramas: dadosDestino.pesoEstimadoGramas,
    is_excecao_manual: !!opcao.is_excecao_manual,
    justificativa_excecao: opcao.justificativa,
    calculado_em: new Date().toISOString(),
  }
}
