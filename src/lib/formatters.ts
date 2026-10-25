// src/lib/formatters.ts
// Utilitários de normalização e validação (R10) com precisão monetária em centavos

export function normalizarDocumento(doc: string): string {
  return (doc || '').replace(/\D/g, '')
}

export function validarCpf(cpfRaw: string): boolean {
  const cpf = normalizarDocumento(cpfRaw)
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false

  let soma = 0
  for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i), 10) * (10 - i)
  let resto = 11 - (soma % 11)
  const dv1 = resto === 10 || resto === 11 ? 0 : resto

  if (dv1 !== parseInt(cpf.charAt(9), 10)) return false

  soma = 0
  for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i), 10) * (11 - i)
  resto = 11 - (soma % 11)
  const dv2 = resto === 10 || resto === 11 ? 0 : resto

  return dv2 === parseInt(cpf.charAt(10), 10)
}

export function validarCnpj(cnpjRaw: string): boolean {
  const cnpj = normalizarDocumento(cnpjRaw)
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false

  const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  let soma = 0
  for (let i = 0; i < 12; i++) soma += parseInt(cnpj.charAt(i), 10) * pesos1[i]
  let resto = soma % 11
  const dv1 = resto < 2 ? 0 : 11 - resto

  if (dv1 !== parseInt(cnpj.charAt(12), 10)) return false

  soma = 0
  for (let i = 0; i < 13; i++) soma += parseInt(cnpj.charAt(i), 10) * pesos2[i]
  resto = soma % 11
  const dv2 = resto < 2 ? 0 : 11 - resto

  return dv2 === parseInt(cnpj.charAt(13), 10)
}

export function formatarDocumento(docRaw: string): string {
  const limpo = normalizarDocumento(docRaw)
  if (limpo.length === 11) {
    return limpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  if (limpo.length === 14) {
    return limpo.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }
  return docRaw || ''
}

export function normalizarCep(cepRaw: string): string {
  return (cepRaw || '').replace(/\D/g, '').slice(0, 8)
}

export function formatarCep(cepRaw: string): string {
  const limpo = normalizarCep(cepRaw)
  if (limpo.length === 8) {
    return limpo.replace(/(\d{5})(\d{3})/, '$1-$2')
  }
  return cepRaw || ''
}

export function normalizarTelefoneE164(telRaw: string): string {
  let limpo = (telRaw || '').replace(/\D/g, '')
  if (limpo.startsWith('55') && (limpo.length === 12 || limpo.length === 13)) {
    return `+${limpo}`
  }
  if (limpo.length === 10 || limpo.length === 11) {
    return `+55${limpo}`
  }
  if (limpo.length > 0 && !limpo.startsWith('+')) {
    return `+${limpo}`
  }
  return telRaw
}

export function formatarTelefoneBR(telRaw: string): string {
  const limpo = normalizarDocumento(telRaw)
  const ddiRemovido = limpo.startsWith('55') ? limpo.substring(2) : limpo
  if (ddiRemovido.length === 11) {
    return ddiRemovido.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  if (ddiRemovido.length === 10) {
    return ddiRemovido.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  return telRaw || ''
}

export function validarEmail(emailRaw: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((emailRaw || '').trim())
}

// Moeda: Trabalha com centavos inteiros (Zero float bug)
export function formatarCentavosParaReal(centavos: number): string {
  const valor = (centavos || 0) / 100
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// Para manter retrocompatibilidade com código existente
export function formatarMoeda(valorReais: number, casasDecimais?: number): string {
  const decimais = typeof casasDecimais === 'number' ? casasDecimais : 2
  return (valorReais || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: decimais,
    maximumFractionDigits: decimais,
  })
}

export function formatarNumero(num: number, casasDecimais?: number): string {
  if (typeof casasDecimais === 'number') {
    return (num || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: casasDecimais,
      maximumFractionDigits: casasDecimais,
    })
  }
  return (num || 0).toLocaleString('pt-BR')
}

export function validarTelefoneBR(tel: string): boolean {
  const limpo = normalizarDocumento(tel)
  return limpo.length === 10 || limpo.length === 11
}

export function criarLinkWhatsapp(tel: string, mensagem?: string): string {
  const limpo = normalizarDocumento(tel)
  const ddi = limpo.startsWith('55') ? limpo : `55${limpo}`
  const textoEncoded = mensagem ? encodeURIComponent(mensagem) : ''
  return `https://wa.me/${ddi}${textoEncoded ? `?text=${textoEncoded}` : ''}`
}

export interface FaixaPrecoOficial {
  min: number
  max: number
  preco: number
  descricao: string
}

export const TABELA_PRECOS_OFICIAL: FaixaPrecoOficial[] = [
  { min: 1, max: 19, preco: 4.5, descricao: '1 a 19 unidades' },
  { min: 20, max: 49, preco: 4.0, descricao: '20 a 49 unidades' },
  { min: 50, max: 999999, preco: 3.5, descricao: 'A partir de 50 unidades' },
]
export function obterPrecoOficial(quantidade: number): number {
  if (quantidade >= 50) return 3.5
  if (quantidade >= 20) return 4.0
  return 4.5
}
export function parseRealParaCentavos(valorTexto: string | number): number {
  if (typeof valorTexto === 'number') {
    return Math.round(valorTexto * 100)
  }
  if (!valorTexto) return 0
  const limpo = valorTexto
    .replace('R$', '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim()
  const num = parseFloat(limpo)
  return isNaN(num) ? 0 : Math.round(num * 100)
}

export function formatarDataPtBR(isoString?: string): string {
  if (!isoString) return '-'
  try {
    const data = new Date(isoString)
    return data.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  } catch (_) {
    return isoString
  }
}

export function formatarDataHoraPtBR(isoString?: string): string {
  if (!isoString) return '-'
  try {
    const data = new Date(isoString)
    return data.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  } catch (_) {
    return isoString
  }
}

export function sanitizarTexto(texto?: string): string {
  if (!texto) return ''
  return texto.trim()
}
