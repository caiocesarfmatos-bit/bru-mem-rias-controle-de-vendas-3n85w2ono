// src/services/backupServidor.ts
// Serviço para acionar endpoints administrativos de backup integral do servidor
// e consultar histórico de execuções automáticas (10h, 17h, 23h Brasília) e manuais.

import pb from '@/lib/pocketbase/client'

export interface RegistroBackupHistorico {
  id: string
  tipo: 'automatico' | 'manual'
  status: 'ok' | 'falha'
  horario_agendado: string
  data_hora: string
  total_colecoes: number
  total_registros: number
  tamanho_bytes: number
  resumo_contagens: Record<string, number>
  detalhe_erro: string
  correlation_id: string
  created: string
}

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
  const resp = await pb.send('/backend/v1/sistema/executar-backup-agora', {
    method: 'POST',
    body: {},
  })

  if (!resp || !resp.sucesso) {
    throw new Error(resp?.erro || 'Falha ao executar backup no servidor.')
  }

  return {
    correlationId: resp.resultado.correlationId,
    versaoSistema: '0.0.16',
    ambiente: 'Skip Cloud PocketBase v0.36',
    geradoEm: resp.resultado.dataHora,
    solicitadoPor: {
      id: pb.authStore.model?.id || 'admin',
      perfil: pb.authStore.model?.perfil || 'administrador',
    },
    resumo: {
      totalColecoes: resp.resultado.totalColecoes,
      totalRegistros: resp.resultado.totalRegistros,
      contagensPorColecao: resp.resultado.resumoContagens,
    },
    dados: resp.resultado.dados,
  }
}

/**
 * Lista histórico de backups executados (robô automático e manual)
 */
export async function listarHistoricoBackups(): Promise<RegistroBackupHistorico[]> {
  try {
    const records = await pb.collection('backups_sistema').getList(1, 30, {
      sort: '-created',
      fields:
        'id,tipo,status,horario_agendado,data_hora,total_colecoes,total_registros,tamanho_bytes,resumo_contagens,detalhe_erro,correlation_id,created',
    })
    return records.items.map((r) => ({
      id: r.id,
      tipo: r.tipo,
      status: r.status,
      horario_agendado: r.horario_agendado,
      data_hora: r.data_hora,
      total_colecoes: r.total_colecoes,
      total_registros: r.total_registros,
      tamanho_bytes: r.tamanho_bytes,
      resumo_contagens: r.resumo_contagens || {},
      detalhe_erro: r.detalhe_erro || '',
      correlation_id: r.correlation_id,
      created: r.created,
    }))
  } catch (err) {
    console.warn('Erro ao carregar histórico de backups:', err)
    return []
  }
}

/**
 * Baixa snapshot completo de um backup existente pelo ID
 */
export async function baixarSnapshotPorId(
  backupId: string,
  nomeArquivoSugerido?: string,
): Promise<void> {
  const res = await pb.send(`/backend/v1/sistema/backup-download/${backupId}`, {
    method: 'GET',
  })
  const nomeArquivo =
    nomeArquivoSugerido ||
    `backup_servidor_${backupId}_${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', nomeArquivo)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
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
