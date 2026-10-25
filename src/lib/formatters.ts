// Utilitários de formatação pt-BR, sanitização e cálculos

const formatterMoeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatarMoeda(valor: number | undefined | null): string {
  if (valor === undefined || valor === null || isNaN(valor)) return 'R$ 0,00'
  return formatterMoeda.format(valor)
}

export function formatarNumero(valor: number, decimais = 2): string {
  if (isNaN(valor)) return '0'
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimais,
    maximumFractionDigits: decimais,
  }).format(valor)
}

export function formatarDataPtBR(dataIsoOuYmd: string | undefined | null): string {
  if (!dataIsoOuYmd) return '-'
  try {
    const limpa = dataIsoOuYmd.split('T')[0]
    const partes = limpa.split('-')
    if (partes.length === 3) {
      const [ano, mes, dia] = partes
      return `${dia.padStart(2, '0')}/${mes.padStart(2, '0')}/${ano}`
    }
    const d = new Date(dataIsoOuYmd)
    if (isNaN(d.getTime())) return dataIsoOuYmd
    return d.toLocaleDateString('pt-BR')
  } catch {
    return dataIsoOuYmd
  }
}

export function formatarDataHoraPtBR(iso: string): string {
  if (!iso) return '-'
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return iso
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return iso
  }
}

// Sanitização estrita de texto contra XSS e injeção
export function sanitizarTexto(input: string | undefined | null): string {
  if (!input) return ''
  // Remove tags HTML perigosas e caracteres de controle via filtragem segura de char codes
  return input
    .replace(/[<>]/g, '')
    .split('')
    .filter((char) => {
      const code = char.charCodeAt(0)
      return (code >= 32 && code !== 127) || code === 10 || code === 13 // permite caracteres normais e quebras de linha
    })
    .join('')
    .trim()
}

// Máscara e validação de telefone brasileiro
export function formatarTelefoneBR(valor: string): string {
  const digits = valor.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) {
    return digits.length > 0 ? `(${digits}` : ''
  }
  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

export function validarTelefoneBR(valor: string): boolean {
  const digits = valor.replace(/\D/g, '')
  return digits.length >= 10 && digits.length <= 11
}

export function validarEmail(valor: string): boolean {
  if (!valor) return true // campo opcional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim())
}

// Tabela oficial de preços da Bru Memórias
export interface FaixaPrecoOficial {
  min: number
  max: number
  preco: number
  descricao: string
}

export const TABELA_PRECOS_OFICIAL: FaixaPrecoOficial[] = [
  { min: 1, max: 4, preco: 14.99, descricao: '1 a 4 un' },
  { min: 5, max: 25, preco: 12.5, descricao: '5 a 25 un' },
  { min: 26, max: 50, preco: 11.5, descricao: '26 a 50 un' },
  { min: 51, max: 100, preco: 10.5, descricao: '51 a 100 un' },
  { min: 101, max: Infinity, preco: 9.99, descricao: 'acima de 100 un' },
]

export function obterPrecoOficial(quantidade: number): number {
  if (quantidade <= 0) return 14.99
  const faixa = TABELA_PRECOS_OFICIAL.find((f) => quantidade >= f.min && quantidade <= f.max)
  return faixa ? faixa.preco : 14.99
}

// Criação de link limpo para WhatsApp
export function criarLinkWhatsapp(telefone: string, mensagem?: string): string {
  const digits = telefone.replace(/\D/g, '')
  if (!digits) return '#'
  // Se não começar com 55 (Brasil), adiciona
  const comDDI = digits.startsWith('55') ? digits : `55${digits}`
  const baseUrl = `https://wa.me/${comDDI}`
  if (mensagem) {
    return `${baseUrl}?text=${encodeURIComponent(mensagem)}`
  }
  return baseUrl
}
