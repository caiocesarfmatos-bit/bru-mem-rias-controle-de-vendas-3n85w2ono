// src/services/viaCep.ts
// Integração pública com ViaCEP (HTTPS apenas, cache local em memória + localStorage, normalização R10)

import { normalizarCep } from '@/lib/formatters'

export interface ViaCepResultado {
  cep: string
  logradouro: string
  complemento: string
  bairro: string
  localidade: string // Cidade
  uf: string
  ibge?: string
  gia?: string
  ddd?: string
  siafi?: string
  erro?: boolean
}

export interface EnderecoCepFormatado {
  cep: string
  logradouro: string
  bairro: string
  cidade: string
  uf: string
  complemento?: string
  regiao:
    | 'RJ_CAPITAL'
    | 'RJ_INTERIOR'
    | 'SUDESTE'
    | 'SUL'
    | 'CENTRO_OESTE'
    | 'NORDESTE'
    | 'NORTE'
    | 'BRASIL'
}

// Mapeamento de UF para Macrorregião Brasileira
export function obterRegiaoPorUfECidade(
  uf: string,
  cidade?: string,
): EnderecoCepFormatado['regiao'] {
  const ufNormal = (uf || '').toUpperCase().trim()
  const cidadeNormal = (cidade || '').toLowerCase().trim()

  if (ufNormal === 'RJ') {
    if (
      cidadeNormal.includes('rio de janeiro') ||
      cidadeNormal === 'rio de janeiro' ||
      cidadeNormal === 'rj'
    ) {
      return 'RJ_CAPITAL'
    }
    return 'RJ_INTERIOR'
  }

  if (['SP', 'MG', 'ES'].includes(ufNormal)) return 'SUDESTE'
  if (['PR', 'SC', 'RS'].includes(ufNormal)) return 'SUL'
  if (['DF', 'GO', 'MT', 'MS'].includes(ufNormal)) return 'CENTRO_OESTE'
  if (['BA', 'PE', 'CE', 'MA', 'PB', 'RN', 'AL', 'SE', 'PI'].includes(ufNormal)) return 'NORDESTE'
  if (['AM', 'PA', 'AC', 'RO', 'RR', 'AP', 'TO'].includes(ufNormal)) return 'NORTE'

  return 'BRASIL'
}

// Cache em memória (LRU simples) para evitar requisições repetidas
const cacheMemoria = new Map<string, EnderecoCepFormatado>()
const STORAGE_CACHE_KEY = 'bru_viacep_cache_v1'

function carregarCacheStorage(): void {
  try {
    const salvo = localStorage.getItem(STORAGE_CACHE_KEY)
    if (salvo) {
      const parsed = JSON.parse(salvo)
      if (typeof parsed === 'object' && parsed !== null) {
        Object.entries(parsed).forEach(([cep, dados]) => {
          cacheMemoria.set(cep, dados as EnderecoCepFormatado)
        })
      }
    }
  } catch {
    /* Cache silencioso */
  }
}

function salvarCacheStorage(): void {
  try {
    const obj: Record<string, EnderecoCepFormatado> = {}
    let count = 0
    // Mantém no máximo 200 CEPs no storage
    for (const [k, v] of cacheMemoria.entries()) {
      obj[k] = v
      count++
      if (count > 200) break
    }
    localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(obj))
  } catch {
    /* Cache silencioso */
  }
}

// Inicializa o cache
carregarCacheStorage()

/**
 * Consulta CEP na API pública ViaCEP com HTTPS obrigatório.
 * Normaliza para 8 dígitos (regra R10).
 * Retorna mensagem amigável em caso de erro ou CEP não encontrado.
 */
export async function consultarCep(cepEntrada: string): Promise<EnderecoCepFormatado> {
  const cepNormalizado = normalizarCep(cepEntrada)

  if (!cepNormalizado || cepNormalizado.length !== 8) {
    throw new Error('CEP deve conter exatamente 8 dígitos numéricos.')
  }

  // Verifica cache
  if (cacheMemoria.has(cepNormalizado)) {
    return cacheMemoria.get(cepNormalizado)!
  }

  const url = `https://viacep.com.br/ws/${cepNormalizado}/json/`

  try {
    const resposta = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!resposta.ok) {
      throw new Error(
        `Falha na consulta ao serviço de CEP (HTTP ${resposta.status}). Tente novamente.`,
      )
    }

    const dados: ViaCepResultado = await resposta.json()

    if (dados.erro) {
      throw new Error(
        `CEP ${cepNormalizado} não foi encontrado na base dos Correios. Verifique os dígitos informados.`,
      )
    }

    const formatado: EnderecoCepFormatado = {
      cep: cepNormalizado,
      logradouro: dados.logradouro || '',
      bairro: dados.bairro || '',
      cidade: dados.localidade || '',
      uf: (dados.uf || '').toUpperCase(),
      complemento: dados.complemento || '',
      regiao: obterRegiaoPorUfECidade(dados.uf, dados.localidade),
    }

    cacheMemoria.set(cepNormalizado, formatado)
    salvarCacheStorage()

    return formatado
  } catch (err: any) {
    if (err.message && err.message.includes('CEP')) {
      throw err
    }
    throw new Error(
      'Não foi possível conectar ao serviço público de CEP. Verifique sua conexão com a internet.',
    )
  }
}

/**
 * Busca reversa de CEP por UF, Cidade e Logradouro (mínimo 3 caracteres no logradouro).
 */
export async function buscarCepPorEndereco(
  uf: string,
  cidade: string,
  logradouro: string,
): Promise<EnderecoCepFormatado[]> {
  const ufLimpa = (uf || '').trim().toUpperCase()
  const cidadeLimpa = (cidade || '').trim()
  const logradouroLimpo = (logradouro || '').trim()

  if (!ufLimpa || ufLimpa.length !== 2) {
    throw new Error('Informe a sigla da UF com 2 letras (ex: RJ, SP).')
  }
  if (!cidadeLimpa || cidadeLimpa.length < 3) {
    throw new Error('Informe o nome da cidade com ao menos 3 caracteres.')
  }
  if (!logradouroLimpo || logradouroLimpo.length < 3) {
    throw new Error('Informe o nome da rua/logradouro com ao menos 3 caracteres para a busca.')
  }

  const url = `https://viacep.com.br/ws/${encodeURIComponent(ufLimpa)}/${encodeURIComponent(
    cidadeLimpa,
  )}/${encodeURIComponent(logradouroLimpo)}/json/`

  try {
    const resposta = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!resposta.ok) {
      throw new Error(`Falha na busca de logradouro (HTTP ${resposta.status}).`)
    }

    const lista: ViaCepResultado[] = await resposta.json()

    if (!Array.isArray(lista) || lista.length === 0) {
      return []
    }

    return lista.map((item) => {
      const cepLimpo = normalizarCep(item.cep)
      const formatado: EnderecoCepFormatado = {
        cep: cepLimpo,
        logradouro: item.logradouro || '',
        bairro: item.bairro || '',
        cidade: item.localidade || '',
        uf: (item.uf || '').toUpperCase(),
        complemento: item.complemento || '',
        regiao: obterRegiaoPorUfECidade(item.uf, item.localidade),
      }
      if (cepLimpo.length === 8) {
        cacheMemoria.set(cepLimpo, formatado)
      }
      return formatado
    })
  } catch (err: any) {
    if (err.message && err.message.includes('Informe')) throw err
    throw new Error('Erro ao buscar CEPs por endereço. Verifique sua conexão.')
  }
}
