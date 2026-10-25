// src/services/backupServidor.ts
// Serviço para acionar o endpoint administrativo de exportação de backup integral do servidor

import pb from '@/lib/pocketbase/client'

export interface ResumoBackupServidor {
  totalColecoes: number
  totalRegistros: number
  contagensPorColecao: Record<string, number>
}

export interface RespostaBackupServidor {
  correlationId: string
  versaoSistema: string
  ambiente: string
  geradoEm: string
  solicitadoPor: {
    id: string
    perfil: string
  }
  resumo: ResumoBackupServidor
  dados: Record<string, any[]>
}

/**
 * Dispara exportação de backup integral restrito ao perfil Administrador
 */
export async function solicitarBackupIntegralServidor(): Promise<RespostaBackupServidor> {
  const resp = await pb.send('/backend/v1/sistema/exportar-backup', {
    method: 'POST',
    body: {},
  })
  return resp as RespostaBackupServidor
}

/**
 * Faz download do arquivo JSON com timestamp oficial
 */
export function baixarArquivoBackupServidor(backup: RespostaBackupServidor): void {
  const nomeArquivo = `backup_completo_servidor_bru_memorias_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', nomeArquivo)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
