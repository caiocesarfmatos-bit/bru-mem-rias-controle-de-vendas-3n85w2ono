import React, { useState, useRef } from 'react'
import { useApp } from '@/context/AppContext'
import { TabId } from '@/types/app'
import { BrandLogo } from './BrandLogo'
import {
  exportarJson,
  exportarCsvClientes,
  exportarCsvPedidos,
  exportarCsvFornecedores,
} from '@/lib/exportUtils'
import { useToast } from '@/hooks/use-toast'
import {
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  Calculator,
  Users,
  Truck,
  LayoutDashboard,
  Coins,
  Share2,
  FileSpreadsheet,
  X,
  AlertTriangle,
} from 'lucide-react'

export const Header: React.FC = () => {
  const { activeTab, setActiveTab, data, audit, restoreDataFromJson, resetAllData, logAudit } =
    useApp()
  const { toast } = useToast()

  const [showBackupModal, setShowBackupModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetConfirmWord, setResetConfirmWord] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const tabs: { id: TabId; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'custos', label: 'Custos', icon: <Coins className="w-4 h-4" /> },
    { id: 'calculadora', label: 'Calculadora', icon: <Calculator className="w-4 h-4" /> },
    {
      id: 'clientes',
      label: 'Clientes',
      icon: <Users className="w-4 h-4" />,
      badge: data.clientes.length,
    },
    {
      id: 'fornecedores',
      label: 'Fornecedores',
      icon: <Truck className="w-4 h-4" />,
      badge: data.fornecedores.length,
    },
    { id: 'painel', label: 'Painel', icon: <LayoutDashboard className="w-4 h-4" /> },
  ]

  const handleExportJson = () => {
    exportarJson(data, audit)
    logAudit('Sistema', 'Exportação realizada', 'Backup completo baixado em JSON.')
    toast({
      title: 'Backup concluído! 💖',
      description: 'Arquivo JSON salvo com todos os custos, clientes e pedidos.',
    })
  }

  const handleShareApp = async () => {
    const shareData = {
      title: 'Bru Memórias | Ímãs Personalizados 5x5',
      text: 'Bru Memórias - Ímãs personalizados artesanais 5x5 cm direto do Recreio dos Bandeirantes, RJ.',
      url: window.location.href,
    }
    if (navigator.share) {
      try {
        await navigator.share(shareData)
        toast({ title: 'Compartilhado com sucesso! ✨' })
      } catch {
        // Usuário cancelou ou navegador não permitiu
      }
    } else {
      await navigator.clipboard.writeText(window.location.href)
      toast({
        title: 'Link copiado!',
        description: 'Link do Bru Memórias copiado para a área de transferência.',
      })
    }
  }

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string)
        const importedData = parsed.dados || parsed
        const importedAudit = parsed.auditoria || []

        if (!importedData.produtos || !Array.isArray(importedData.produtos)) {
          throw new Error('Arquivo não possui o formato esperado do Bru Memórias.')
        }

        restoreDataFromJson(importedData, importedAudit)
        setShowBackupModal(false)
        toast({
          title: 'Dados restaurados com sucesso! 💖',
          description: 'Todos os produtos, clientes e configurações foram atualizados.',
        })
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Arquivo inválido'
        toast({
          title: 'Erro na importação',
          description: errorMsg,
          variant: 'destructive',
        })
      }
    }
    reader.readAsText(file)
    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleConfirmReset = () => {
    if (resetConfirmWord.trim().toUpperCase() !== 'RESETAR') {
      toast({
        title: 'Confirmação incorreta',
        description: 'Digite exatamente "RESETAR" para prosseguir.',
        variant: 'destructive',
      })
      return
    }
    resetAllData()
    setShowResetModal(false)
    setResetConfirmWord('')
    toast({
      title: 'Dados restaurados!',
      description: 'O aplicativo foi reiniciado com os dados de fábrica.',
    })
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#F0E4E0] shadow-sm">
      {/* Barra Superior */}
      <div className="max-w-[1200px] mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Logo */}
        <BrandLogo />

        {/* Botões de Ação Rápida */}
        <div className="flex items-center gap-2">
          {/* Compartilhar */}
          <button
            onClick={handleShareApp}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#4E342E] bg-[#F5EFEA] hover:bg-[#FF1493]/10 hover:text-[#FF1493] rounded-full transition-colors"
            title="Compartilhar aplicativo"
            aria-label="Compartilhar aplicativo"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Divulgar</span>
          </button>

          {/* Backup / Exportar Dados */}
          <button
            onClick={() => setShowBackupModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#FF1493] bg-[#FFF0F8] border border-[#FF1493]/20 hover:bg-[#FF1493] hover:text-white rounded-full transition-all duration-150 shadow-sm"
            title="Exportar, importar ou fazer backup dos dados"
            aria-label="Backup e dados"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Backup & Dados</span>
            <span className="xs:hidden">Dados</span>
          </button>
        </div>
      </div>

      {/* Navegação por Abas (Mobile-first rolável com alvos >= 44px) */}
      <nav
        aria-label="Abas de navegação do aplicativo"
        className="max-w-[1200px] mx-auto px-4 flex items-center gap-1 overflow-x-auto scrollbar-none border-t border-[#F0E4E0]/60"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 py-3 min-h-[44px] text-sm font-semibold whitespace-nowrap transition-all duration-150 rounded-t-lg select-none outline-none focus-visible:ring-2 focus-visible:ring-[#FF1493] ${
                isActive
                  ? 'text-[#FF1493] bg-[#FFF0F8]/80 font-bold border-b-2 border-[#FF1493]'
                  : 'text-[#4E342E]/80 hover:text-[#FF1493] hover:bg-black/5'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {typeof tab.badge === 'number' && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-[#FF1493] text-white' : 'bg-[#4E342E]/10 text-[#4E342E]'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Modal de Backup / Importação / Exportação */}
      {showBackupModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-backup-title"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#F0E4E0] relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowBackupModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-[#4E342E] rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Fechar modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-full bg-[#FFF0F8] flex items-center justify-center text-[#FF1493]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2
                id="modal-backup-title"
                className="text-xl font-brand-serif font-bold text-[#4E342E]"
              >
                Central de Dados & Backup
              </h2>
            </div>

            <p className="text-xs text-[#4E342E]/70 mb-5">
              Seus dados ficam 100% salvos no navegador deste aparelho. Faça downloads regulares
              para garantir sua segurança ou transferir para outro dispositivo.
            </p>

            <div className="space-y-4">
              {/* Seção Download Backup Completo */}
              <div className="p-4 rounded-xl border border-[#FF1493]/20 bg-[#FFF0F8]/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#4E342E]">Backup Completo (JSON)</h3>
                    <p className="text-xs text-[#4E342E]/70">
                      Inclui custos, lançamentos, produtos, clientes, pedidos e auditoria.
                    </p>
                  </div>
                  <button
                    onClick={handleExportJson}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-[#FF1493] hover:bg-[#E01284] rounded-full shadow-sm flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Baixar JSON
                  </button>
                </div>
              </div>

              {/* Seção Planilhas CSV */}
              <div className="p-4 rounded-xl border border-[#F0E4E0] bg-gray-50/50 space-y-3">
                <h3 className="text-sm font-bold text-[#4E342E] flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-[#FF1493]" />
                  Exportar Planilhas (CSV Excel pt-BR)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      exportarCsvClientes(data)
                      logAudit('Sistema', 'Exportação CSV', 'Clientes exportados para CSV.')
                      toast({ title: 'Planilha de Clientes exportada!' })
                    }}
                    className="p-2.5 text-xs font-medium text-[#4E342E] bg-white border border-[#F0E4E0] hover:border-[#FF1493] hover:text-[#FF1493] rounded-lg text-center transition-colors shadow-2xs"
                  >
                    Clientes ({data.clientes.length})
                  </button>
                  <button
                    onClick={() => {
                      exportarCsvPedidos(data)
                      logAudit('Sistema', 'Exportação CSV', 'Pedidos exportados para CSV.')
                      toast({ title: 'Planilha de Pedidos exportada!' })
                    }}
                    className="p-2.5 text-xs font-medium text-[#4E342E] bg-white border border-[#F0E4E0] hover:border-[#FF1493] hover:text-[#FF1493] rounded-lg text-center transition-colors shadow-2xs"
                  >
                    Pedidos
                  </button>
                  <button
                    onClick={() => {
                      exportarCsvFornecedores(data)
                      logAudit('Sistema', 'Exportação CSV', 'Fornecedores exportados para CSV.')
                      toast({ title: 'Planilha de Fornecedores exportada!' })
                    }}
                    className="p-2.5 text-xs font-medium text-[#4E342E] bg-white border border-[#F0E4E0] hover:border-[#FF1493] hover:text-[#FF1493] rounded-lg text-center transition-colors shadow-2xs"
                  >
                    Fornecedores ({data.fornecedores.length})
                  </button>
                </div>
              </div>

              {/* Seção Restaurar Backup */}
              <div className="p-4 rounded-xl border border-[#F0E4E0] bg-white space-y-2">
                <h3 className="text-sm font-bold text-[#4E342E] flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-[#4E342E]" />
                  Restaurar Backup (JSON)
                </h3>
                <p className="text-xs text-[#4E342E]/70">
                  Atenção: A restauração substituirá todos os dados atuais pelos contidos no
                  arquivo.
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  onChange={handleImportJson}
                  className="hidden"
                  id="import-backup-input"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 text-xs font-semibold text-[#4E342E] bg-[#F5EFEA] hover:bg-[#4E342E] hover:text-white rounded-full transition-colors flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Selecionar arquivo JSON
                </button>
              </div>

              {/* Seção Limpeza Geral de Dados */}
              <div className="pt-2 border-t border-[#F0E4E0] flex justify-between items-center">
                <button
                  onClick={() => {
                    setShowBackupModal(false)
                    setShowResetModal(true)
                  }}
                  className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 py-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Resetar para padrões de fábrica
                </button>
                <button
                  onClick={() => setShowBackupModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#4E342E] bg-gray-100 hover:bg-gray-200 rounded-full"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Reset Geral */}
      {showResetModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-200">
            <div className="flex items-center gap-2 text-red-600 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h2 className="text-lg font-bold font-brand-serif">Zerar e Restaurar Padrões?</h2>
            </div>
            <p className="text-xs text-[#4E342E]/80 mb-4 leading-relaxed">
              Esta ação <strong className="text-red-600">excluirá permanentemente</strong> todos os
              novos clientes, lançamentos de custos e pedidos adicionados por você, restaurando os
              dados iniciais do sistema Bru Memórias.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-bold text-[#4E342E] mb-1">
                Para confirmar, digite <span className="text-red-600">RESETAR</span>:
              </label>
              <input
                type="text"
                value={resetConfirmWord}
                onChange={(e) => setResetConfirmWord(e.target.value)}
                placeholder="RESETAR"
                className="w-full px-3 py-2 text-sm border rounded-lg uppercase tracking-wider font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowResetModal(false)
                  setResetConfirmWord('')
                }}
                className="px-4 py-2 text-xs font-semibold text-[#4E342E] bg-gray-100 hover:bg-gray-200 rounded-full"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmReset}
                disabled={resetConfirmWord.trim().toUpperCase() !== 'RESETAR'}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full shadow-sm"
              >
                Confirmar Reset Total
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
