import React, { useState, useEffect } from 'react'
import {
  detectarDadosLegadosNavegador,
  baixarArquivoBackupLegado,
  importarDadosLegadosParaServidor,
  BackupLegadoDetectado,
  RelatorioMigracaoLegado,
} from '@/services/backupLegadoV5'
import {
  solicitarBackupIntegralServidor,
  baixarArquivoBackupServidor,
  listarHistoricoBackups,
  baixarSnapshotPorId,
  RespostaBackupServidor,
  RegistroBackupHistorico,
} from '@/services/backupServidor'
import { useAuth } from '@/context/AuthContext'
import { formatarDataHoraPtBR } from '@/lib/formatters'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Download,
  Database,
  Archive,
  RefreshCw,
  CheckCircle2,
  Server,
  FileJson,
  UploadCloud,
  Check,
  Clock,
  Cpu,
  XCircle,
} from 'lucide-react'

export const SecaoCentroBackup: React.FC = () => {
  const { usuario } = useAuth()
  const isAdm = usuario?.perfil === 'administrador'

  // Estado Legado (v5 / localStorage)
  const [dadosLegados, setDadosLegados] = useState<BackupLegadoDetectado | null>(null)
  const [importandoLegado, setImportandoLegado] = useState(false)
  const [relatorioMigracao, setRelatorioMigracao] = useState<RelatorioMigracaoLegado | null>(null)

  // Estado Servidor (Skip Cloud / PocketBase)
  const [gerandoBackupServidor, setGerandoBackupServidor] = useState(false)
  const [ultimoBackupServidor, setUltimoBackupServidor] = useState<RespostaBackupServidor | null>(
    null,
  )
  const [erroServidor, setErroServidor] = useState<string | null>(null)

  // Histórico de Backups Robotizados e Manuais
  const [historico, setHistorico] = useState<RegistroBackupHistorico[]>([])
  const [carregandoHistorico, setCarregandoHistorico] = useState(false)
  const [baixandoId, setBaixandoId] = useState<string | null>(null)

  const varrerLegado = () => {
    const det = detectarDadosLegadosNavegador()
    setDadosLegados(det)
  }

  const carregarHistorico = async () => {
    setCarregandoHistorico(true)
    const list = await listarHistoricoBackups()
    setHistorico(list)
    setCarregandoHistorico(false)
  }

  useEffect(() => {
    varrerLegado()
    carregarHistorico()
  }, [])

  const handleExportarLegado = () => {
    if (!dadosLegados) return
    baixarArquivoBackupLegado(dadosLegados.dadosBrutos)
  }

  const handleImportarLegadoServidor = async () => {
    if (!dadosLegados || !isAdm) return
    setImportandoLegado(true)
    try {
      const rel = await importarDadosLegadosParaServidor(dadosLegados.dadosBrutos)
      setRelatorioMigracao(rel)
      varrerLegado()
      carregarHistorico()
    } catch (err: any) {
      alert('Erro na migração: ' + (err.message || 'Falha ao comunicar com o servidor.'))
    } finally {
      setImportandoLegado(false)
    }
  }

  const handleExportarServidor = async () => {
    if (!isAdm) return
    setGerandoBackupServidor(true)
    setErroServidor(null)
    try {
      const res = await solicitarBackupIntegralServidor()
      setUltimoBackupServidor(res)
      baixarArquivoBackupServidor(res)
      carregarHistorico()
    } catch (err: any) {
      setErroServidor(err.message || 'Falha ao solicitar backup ao servidor.')
    } finally {
      setGerandoBackupServidor(false)
    }
  }

  const handleBaixarHistorico = async (item: RegistroBackupHistorico) => {
    setBaixandoId(item.id)
    try {
      const dataFormatada = item.data_hora.replace(/[:.]/g, '-')
      const nome = `backup_${item.tipo}_${dataFormatada}.json`
      await baixarSnapshotPorId(item.id, nome)
    } catch (err: any) {
      alert('Falha ao baixar backup: ' + (err.message || 'Erro no servidor.'))
    } finally {
      setBaixandoId(null)
    }
  }

  const formatarBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  if (!isAdm) {
    return (
      <Card className="border border-[#F0E4E0] shadow-sm">
        <CardContent className="p-4 text-xs text-[#4E342E]/70 text-center">
          O Centro de Backup e Restauração é restrito a administradores.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Topo do Módulo de Backup */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#4E342E] flex items-center gap-2">
            <Archive className="w-6 h-6 text-[#FF1493]" />
            Centro de Backup e Preservação de Dados
          </h2>
          <p className="text-sm text-[#4E342E]/70">
            Rotina robotizada no servidor (10h, 17h, 23h Brasília) e exportação integral de 21
            coleções
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={carregarHistorico}
            disabled={carregandoHistorico}
            className="border-[#E0D0CC] text-[#4E342E]"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 mr-1.5 ${carregandoHistorico ? 'animate-spin' : ''}`}
            />
            Atualizar Status
          </Button>
        </div>
      </div>

      {/* BLOCO DESTAQUE: ROTINA ROBOTIZADA AUTOMÁTICA */}
      <Card className="border border-[#FF1493]/30 bg-gradient-to-r from-[#FFF0F5]/60 to-white shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[#FF1493] text-white shadow-sm flex-shrink-0">
                <Cpu className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-[#4E342E]">
                    Robô de Backup Automático no Servidor Ativo
                  </h3>
                  <Badge className="bg-green-100 text-green-800 border-green-300 text-[10px]">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Online / Offline
                  </Badge>
                </div>
                <p className="text-xs text-[#4E342E]/80">
                  Execução autônoma 3 vezes ao dia nos horários de Brasília (America/Sao_Paulo):{' '}
                  <span className="font-semibold text-[#FF1493]">10:00</span>,{' '}
                  <span className="font-semibold text-[#FF1493]">17:00</span> e{' '}
                  <span className="font-semibold text-[#FF1493]">23:00</span>.
                </p>
                <p className="text-[11px] text-[#4E342E]/60">
                  Roda diretamente no servidor PocketBase via cron robotizado sem necessidade de
                  comando manual, registrando snapshot de todas as 21 coleções na trilha de
                  auditoria.
                </p>
              </div>
            </div>

            <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-[#F0E4E0]">
              <span className="text-[11px] text-[#4E342E]/70 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#FF1493]" />
                Horário oficial de Brasília
              </span>
              <span className="text-xs font-bold text-[#4E342E] mt-0.5">3 rotinas diárias</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* BLOCO 1: BACKUP INTEGRAL DO SERVIDOR (SKIP CLOUD) */}
        <Card className="border border-[#F0E4E0] shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="p-4 pb-2 border-b border-[#F0E4E0]/60">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base font-bold text-[#4E342E] flex items-center gap-2">
                    <Server className="w-4 h-4 text-[#FF1493]" />
                    Backup Integral Sob Demanda
                  </CardTitle>
                  <p className="text-xs text-[#4E342E]/70 mt-0.5">
                    Snapshot JSON autenticado de 21 coleções do PocketBase
                  </p>
                </div>
                <Badge className="bg-[#FFF0F5] text-[#FF1493] border border-[#FF1493]/30">
                  Servidor Oficial
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3 text-xs text-[#4E342E]">
              <p>
                Dispara manualmente um snapshot completo agora, salvando o registro em histórico e
                disponibilizando o download imediato do arquivo JSON.
              </p>

              <div className="bg-[#FAF7F6] p-3 rounded border border-[#F0E4E0] space-y-1.5">
                <div className="flex justify-between">
                  <span className="font-semibold text-[#4E342E]">Segurança:</span>
                  <span className="text-green-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verificação Server-Side
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-[#4E342E]">Auditoria:</span>
                  <span>Registrado na coleção logs_auditoria</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-[#4E342E]">Privacidade:</span>
                  <span>Sem dados pessoais gravados no log</span>
                </div>
              </div>

              {erroServidor && (
                <div className="p-2.5 rounded bg-red-50 text-red-700 border border-red-200">
                  {erroServidor}
                </div>
              )}

              {ultimoBackupServidor && (
                <div className="p-3 bg-green-50 rounded border border-green-200 text-green-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Check className="w-4 h-4 text-green-700" />
                    Backup Gerado e Baixado com Sucesso!
                  </div>
                  <div>
                    Total de coleções:{' '}
                    <span className="font-bold">{ultimoBackupServidor.resumo.totalColecoes}</span> |
                    Registros exportados:{' '}
                    <span className="font-bold">{ultimoBackupServidor.resumo.totalRegistros}</span>
                  </div>
                  <div className="text-[11px] text-green-800">
                    Protocolo: {ultimoBackupServidor.correlationId}
                  </div>
                </div>
              )}
            </CardContent>
          </div>

          <div className="p-4 pt-0">
            <Button
              onClick={handleExportarServidor}
              disabled={gerandoBackupServidor}
              className="w-full bg-[#FF1493] hover:bg-[#D8117E] text-white"
            >
              {gerandoBackupServidor ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Gerando Snapshot Imediato...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Executar Backup Agora e Baixar (JSON)
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* BLOCO 2: BACKUP DOS DADOS DA V5 (LEGADO / LOCALSTORAGE) */}
        <Card className="border border-[#F0E4E0] shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="p-4 pb-2 border-b border-[#F0E4E0]/60">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base font-bold text-[#4E342E] flex items-center gap-2">
                    <Database className="w-4 h-4 text-amber-600" />
                    Dados do Legado v5 (Navegador)
                  </CardTitle>
                  <p className="text-xs text-[#4E342E]/70 mt-0.5">
                    Varredura segura das chaves locais salvas na versão anterior
                  </p>
                </div>
                <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                  {dadosLegados?.possuiDados ? 'Chaves Detectadas' : 'Sem Dados Locais'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-3 text-xs text-[#4E342E]">
              <p>
                A versão 5 do sistema utilizava armazenamento 100% no navegador (localStorage). Esta
                ferramenta permite exportar as chaves intactas em JSON e opcionalmente importar para
                a nova base na nuvem de forma idempotente.
              </p>

              <div className="bg-[#FAF7F6] p-3 rounded border border-[#F0E4E0] space-y-1">
                <div className="flex justify-between font-semibold">
                  <span>Chaves encontradas neste navegador:</span>
                  <span className="text-[#FF1493]">
                    {dadosLegados?.chavesEncontradas.length || 0}
                  </span>
                </div>
                {dadosLegados?.chavesEncontradas.map((k) => (
                  <div key={k} className="text-[11px] text-[#4E342E]/70 font-mono">
                    • {k}
                  </div>
                ))}

                {dadosLegados?.resumo && (
                  <div className="pt-2 border-t border-[#F0E4E0] grid grid-cols-2 gap-1 text-[11px]">
                    <div>
                      Clientes legado:{' '}
                      <span className="font-bold">{dadosLegados.resumo.clientes}</span>
                    </div>
                    <div>
                      Fornecedores:{' '}
                      <span className="font-bold">{dadosLegados.resumo.fornecedores}</span>
                    </div>
                    <div>
                      Produtos legado:{' '}
                      <span className="font-bold">{dadosLegados.resumo.produtos}</span>
                    </div>
                    <div>
                      Orçamentos/Pedidos:{' '}
                      <span className="font-bold">
                        {dadosLegados.resumo.orcamentos + dadosLegados.resumo.pedidos}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {relatorioMigracao && (
                <div className="p-3 bg-blue-50 rounded border border-blue-200 text-blue-900 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />
                    Relatório de Migração Idempotente:
                  </div>
                  <div>
                    Lidos: <span className="font-bold">{relatorioMigracao.totalLidos}</span> |
                    Importados novos:{' '}
                    <span className="font-bold text-green-700">
                      {relatorioMigracao.totalImportados}
                    </span>{' '}
                    | Ignorados/Duplicados:{' '}
                    <span className="font-bold text-amber-700">
                      {relatorioMigracao.totalIgnorados}
                    </span>
                  </div>
                  <div className="max-h-24 overflow-y-auto text-[10px] space-y-0.5 pt-1 border-t border-blue-200">
                    {relatorioMigracao.detalhes.map((d, i) => (
                      <div key={i} className="truncate">
                        • {d.colecao} [{d.identificador}]: {d.motivo}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </div>

          <div className="p-4 pt-0 space-y-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportarLegado}
                disabled={!dadosLegados?.chavesEncontradas.length}
                className="flex-1 border-[#E0D0CC] text-[#4E342E]"
              >
                <FileJson className="w-3.5 h-3.5 mr-1" />
                Baixar JSON da v5
              </Button>

              <Button
                size="sm"
                onClick={handleImportarLegadoServidor}
                disabled={!dadosLegados?.possuiDados || importandoLegado}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
              >
                <UploadCloud className="w-3.5 h-3.5 mr-1" />
                {importandoLegado ? 'Importando...' : 'Importar p/ Servidor'}
              </Button>
            </div>
            <p className="text-[10px] text-[#4E342E]/60 text-center">
              Requisito: abrir o app no mesmo navegador onde utilizava a v5 para detecção.
            </p>
          </div>
        </Card>
      </div>

      {/* BLOCO 3: HISTÓRICO DE EXECUÇÕES DE BACKUPS (ROBOTIZADO & MANUAL) */}
      <Card className="border border-[#F0E4E0] shadow-sm">
        <CardHeader className="p-4 border-b border-[#F0E4E0]">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-base font-bold text-[#4E342E] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#FF1493]" />
                Histórico de Execuções e Snapshots Salvos
              </CardTitle>
              <p className="text-xs text-[#4E342E]/70 mt-0.5">
                Registro de cada execução automática e manual com status, tamanho e download do
                arquivo
              </p>
            </div>
            <Badge variant="outline" className="text-xs text-[#4E342E]">
              {historico.length} execuções registradas
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {historico.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#4E342E]/60 space-y-2">
              <p>Nenhum snapshot de backup salvo ainda no histórico.</p>
              <p className="text-[11px] text-[#4E342E]/40">
                Os backups do robô (10h, 17h e 23h Brasília) e manuais aparecerão listados aqui com
                opção de download.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#F0E4E0] overflow-x-auto">
              <table className="w-full text-xs text-left text-[#4E342E]">
                <thead className="bg-[#FAF7F6] text-[#4E342E]/80 uppercase text-[10px] font-semibold">
                  <tr>
                    <th className="px-4 py-2.5">Data / Hora</th>
                    <th className="px-4 py-2.5">Tipo</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Horário / Origem</th>
                    <th className="px-4 py-2.5 text-right">Coleções</th>
                    <th className="px-4 py-2.5 text-right">Registros</th>
                    <th className="px-4 py-2.5 text-right">Tamanho</th>
                    <th className="px-4 py-2.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0E4E0]">
                  {historico.map((item) => (
                    <tr key={item.id} className="hover:bg-[#FFF0F5]/30 transition-colors">
                      <td className="px-4 py-3 font-medium">
                        {formatarDataHoraPtBR(item.data_hora || item.created)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            item.tipo === 'automatico'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}
                        >
                          {item.tipo === 'automatico' ? 'Robô Automático' : 'Manual ADM'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {item.status === 'ok' ? (
                          <span className="inline-flex items-center text-green-700 font-semibold gap-1 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                            OK
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-red-700 font-semibold gap-1 text-[11px]">
                            <XCircle className="w-3.5 h-3.5 text-red-600" />
                            Falha
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[#4E342E]/80">
                        {item.horario_agendado || 'Sob demanda'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{item.total_colecoes}</td>
                      <td className="px-4 py-3 text-right font-medium">{item.total_registros}</td>
                      <td className="px-4 py-3 text-right text-[#4E342E]/70 font-mono">
                        {formatarBytes(item.tamanho_bytes)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleBaixarHistorico(item)}
                          disabled={baixandoId === item.id}
                          className="h-7 px-2 text-[11px] text-[#FF1493] hover:text-[#D8117E] hover:bg-[#FFF0F5]"
                        >
                          {baixandoId === item.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin mr-1" />
                          ) : (
                            <Download className="w-3 h-3 mr-1" />
                          )}
                          Baixar Snapshot
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
