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
  RespostaBackupServidor,
} from '@/services/backupServidor'
import { useAuth } from '@/context/AuthContext'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Download,
  Database,
  Archive,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Server,
  FileJson,
  UploadCloud,
  Check,
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

  const varrerLegado = () => {
    const det = detectarDadosLegadosNavegador()
    setDadosLegados(det)
  }

  useEffect(() => {
    varrerLegado()
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
    } catch (err: any) {
      setErroServidor(err.message || 'Falha ao solicitar backup ao servidor.')
    } finally {
      setGerandoBackupServidor(false)
    }
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
            Exportação do banco oficial na nuvem e rotina de recuperação do legado v5 (localStorage)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* BLOCO 1: BACKUP INTEGRAL DO SERVIDOR (SKIP CLOUD) */}
        <Card className="border border-[#F0E4E0] shadow-sm flex flex-col justify-between">
          <div>
            <CardHeader className="p-4 pb-2 border-b border-[#F0E4E0]/60">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base font-bold text-[#4E342E] flex items-center gap-2">
                    <Server className="w-4 h-4 text-[#FF1493]" />
                    Backup Integral do Servidor
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
                Gera um arquivo JSON contendo todos os dados operacionais (produtos, preços
                vigentes, pessoas, pedidos de venda, lançamentos contábeis, estoque e trilha de
                auditoria).
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
                  Gerando Snapshot...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Backup Completo do Servidor (JSON)
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
              Requisito: a usuária precisa abrir o app no mesmo navegador onde utilizava a v5 para a
              detecção automática das chaves locais.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
