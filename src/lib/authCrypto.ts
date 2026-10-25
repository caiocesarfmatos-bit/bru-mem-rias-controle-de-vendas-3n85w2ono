/**
 * BRU MEMÓRIAS | CONTROLE DE VENDAS
 * Utilitário de Criptografia WebCrypto e Controle de Sessão
 *
 * COMENTÁRIO DE ARQUITETURA OBRIGATÓRIO (Seção 3 do spec):
 * O controle de acesso por senha neste aplicativo local é uma barreira de conveniência
 * para impedir visualização acidental por terceiros no aparelho físico do administrador.
 * Ele NÃO constitui segurança criptográfica de nível militar ou servidor remoto, uma vez
 * que dados em localStorage residem no navegador do dispositivo. Para segurança absoluta,
 * utilize o bloqueio de tela com biometria ou código de acesso do próprio sistema operacional.
 */

// Derivação de chave usando WebCrypto PBKDF2 (SHA-256, 100.000 iterações)
export async function derivarSenhaPbkdf2(
  senhaPura: string,
  salHex?: string,
): Promise<{ hashHex: string; salHex: string }> {
  const enc = new TextEncoder()
  const salBytes = salHex ? hexParaUint8(salHex) : crypto.getRandomValues(new Uint8Array(16))

  const chaveMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(senhaPura),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey'],
  )

  const chaveDerivada = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salBytes.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    chaveMaterial,
    { name: 'HMAC', hash: 'SHA-256', length: 256 },
    true,
    ['sign'],
  )

  const exportada = await crypto.subtle.exportKey('raw', chaveDerivada)
  const hashHex = uint8ParaHex(new Uint8Array(exportada))
  const novoSalHex = uint8ParaHex(salBytes)

  return { hashHex, salHex: novoSalHex }
}

export async function verificarSenhaPbkdf2(
  senhaDigitada: string,
  hashEsperado: string,
  salHex: string,
): Promise<boolean> {
  try {
    const { hashHex } = await derivarSenhaPbkdf2(senhaDigitada, salHex)
    return hashHex === hashEsperado
  } catch {
    return false
  }
}

function uint8ParaHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function hexParaUint8(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}
