import React, { useState, useRef } from 'react'
import { useAppV5 } from '@/context/AppV5Context'
import {
  AbaPrincipalId,
  SubsecaoId,
  SubsecaoHojeId,
  SubsecaoVenderId,
  SubsecaoProduzirId,
  SubsecaoDinheiroId,
  SubsecaoCrescerId,
} from '@/types/appV5'
import {
  Calendar,
  ShoppingBag,
  Hammer,
  Coins,
  TrendingUp,
  LogOut,
  Download,
  Upload,
  Shield,
  X,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { BrandLogo } from '@/components/BrandLogo'

interface SubsecaoItem {
  id: SubsecaoId
  label: string
}

const SUBSECOES_POR_ABA: Record<AbaPrincipalId, SubsecaoItem[]> = {
  hoje: [
    { id: 'painel', label: 'Painel do Dia' },
    { id: 'alertas', label: 'Alertas' },
  ],
  vender: [
    { id: 'clientes', label: 'Clientes' },
    { id: 'orcamentos', label: 'Orçamentos' },
    { id: 'vendas', label: 'Vendas e Pedidos' },
    { id: 'leads', label: 'Leads e Prospecção' },
  ],
  produzir: [
    { id: 'producao', label: 'Fila de Produção' },
    { id: 'controle-arte', label: 'Controle de Arte' },
  ],
  dinheiro: [
    { id: 'custos', label: 'Custos da Produção' },
    { id: 'produtos-precos', label: 'Produtos e Faixas' },
    { id: 'receitas', label: 'Receitas' },
    { id: 'despesas', label: 'Despesas' },
    { id: 'compras', label: 'Compras & Insumos' },
    { id: 'financeiro', label: 'Financeiro' },
    { id: 'fiscal', label: 'Fiscal (Simples)' },
    { id: 'frete', label: 'Tabela de Frete' },
  ],
  crescer: [
    { id: 'planejamento', label: 'Metas e Planejamento' },
    { id: 'regioes', label: 'Regiões Atendidas' },
    { id: 'marketing', label: 'Marketing' },
    { id: 'configuracoes', label: 'Parâmetros e Ajustes' },
  ],
}

export const HeaderV5: React.FC = () => {
  const {
    abaAtiva,
    subsecaoAtiva,
    navegarPara,
    sairDoSistema,
    exportarBackupCompletoJson,
    importarBackupCompletoJson,
    data,
  } = useAppV5()

  const { toast } = useToast()
  const [showBackupModal, setShowBackupModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const abasPrincipais: { id: AbaPrincipalId; label: string; icon: React.ReactNode }[] = [
    { id: 'hoje', label: 'HOJE', icon: <Calendar className="w-4 h-4" /> },
    { id: 'vender', label: 'VENDER', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'produzir', label: 'PRODUZIR', icon: <Hammer className="w-4 h-4" /> },
    { id: 'dinheiro', label: 'DINHEIRO', icon: <Coins className="w-4 h-4" /> },
    { id: 'crescer', label: 'CRESCER', icon: <TrendingUp className="w-4 h-4" /> },
  ]

  const subsecoesAtuais = SUBSECOES_POR_ABA[abaAtiva] || []

  const handleDownloadBackup = () => {
    const jsonStr = exportarBackupCompletoJson()
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `bru-memorias-backup-v5-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast({
      title: 'Backup exportado! 🔒',
      description: 'Arquivo JSON completo com parâmetros, clientes, custos e auditoria.',
    })
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const conteudo = event.target?.result as string
      const res = importarBackupCompletoJson(conteudo)
      if (res.sucesso) {
        setShowBackupModal(false)
        toast({
          title: 'Backup restaurado com sucesso!',
          description: `Versão confirmada. Clientes: ${res.contagemDepois?.clientes}, Pedidos: ${res.contagemDepois?.pedidos}`,
        })
      } else {
        toast({
          title: 'Erro ao restaurar backup',
          description: res.mensagem,
          variant: 'destructive',
        })
      }
    }
    reader.readAsText(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#F0E4E0] shadow-sm">
      {/* Nível Superior: Logo, Identificação do Administrador, Backup e Sair */}
      <div className="max-w-[1200px] mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        {/* Logo Oficial: Emblema Tipográfico Secundário + Tagline */}
        <div className="flex items-center">
          <BrandLogo mode="header" size="sm" showTagline={true} />
        </div>

        {/* Ações: Backup e Botão Sair Sempre Visível */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBackupModal(true)}
            className="inline-flex items-center justify-center gap-1.5 min-w-[44px] min-h-[44px] px-3 py-1.5 text-xs font-semibold text-[#4E342E] bg-[#F5EFEA] hover:bg-[#FF1493]/10 hover:text-[#FF1493] rounded-full transition-all border border-[#4E342E]/10"
            title="Backup e dados locais"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Backup</span>
          </button>

          {/* Botão Sair Sempre Visível (Seção 3 do spec) */}
          <button
            onClick={sairDoSistema}
            className="inline-flex items-center justify-center gap-1.5 min-w-[44px] min-h-[44px] px-3.5 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition-all border border-red-200"
            title="Sair do sistema e bloquear tela"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </div>

      {/* NÍVEL 1 DE NAVEGAÇÃO: As 5 Abas Principais (Mobile-friendly, alvos >= 44px) */}
      <nav
        aria-label="Abas Principais"
        className="max-w-[1200px] mx-auto px-4 flex items-center gap-1 overflow-x-auto scrollbar-none border-t border-[#F0E4E0]/60"
      >
        {abasPrincipais.map((tab) => {
          const isActive = abaAtiva === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => navegarPara(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 min-h-[44px] text-xs sm:text-sm font-bold whitespace-nowrap transition-all rounded-t-lg select-none outline-none ${
                isActive
                  ? 'text-[#FF1493] bg-[#FFF0F8] border-b-2 border-[#FF1493]'
                  : 'text-[#4E342E]/70 hover:text-[#FF1493] hover:bg-black/5'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          )
        })}
      </nav>

      {/* NÍVEL 2 DE NAVEGAÇÃO: Subseções da Aba Ativa (Máximo 8 itens visíveis por subseção) */}
      <div className="bg-[#FFF0F8]/40 border-t border-b border-[#F0E4E0]/80">
        <div className="max-w-[1200px] mx-auto px-4 py-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {subsecoesAtuais.map((sub) => {
            const isSubActive = subsecaoAtiva === sub.id
            return (
              <button
                key={sub.id}
                onClick={() => navegarPara(abaAtiva, sub.id)}
                className={`px-3 py-1.5 min-h-[36px] text-xs font-semibold rounded-full whitespace-nowrap transition-all ${
                  isSubActive
                    ? 'bg-[#FF1493] text-white shadow-2xs font-bold'
                    : 'text-[#4E342E]/80 hover:bg-white hover:text-[#FF1493]'
                }`}
              >
                {sub.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Modal de Backup / Importação */}
      {showBackupModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#F0E4E0] relative">
            <button
              onClick={() => setShowBackupModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-[#4E342E] rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-[#FF1493]" />
              <h2 className="text-lg font-bold font-brand-serif text-[#4E342E]">
                Backup & Restauração (v5)
              </h2>
            </div>

            <p className="text-xs text-[#4E342E]/70 mb-4">
              Seus dados nunca saem deste aparelho. Exporte arquivos de backup periodicamente para
              garantir total controle dos seus registros comerciais.
            </p>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-[#FFF0F8] border border-[#FF1493]/20 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-[#4E342E]">Backup Completo (JSON)</h3>
                  <p className="text-[11px] text-[#4E342E]/70">
                    Inclui parâmetros, custos, clientes, pedidos e auditoria.
                  </p>
                </div>
                <button
                  onClick={handleDownloadBackup}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-[#FF1493] hover:bg-[#E01284] rounded-full flex items-center gap-1 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Baixar
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                <h3 className="text-xs font-bold text-[#4E342E] flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5 text-[#4E342E]" />
                  Restaurar de Arquivo JSON
                </h3>
                <p className="text-[11px] text-[#4E342E]/70">
                  O sistema valida a versão do schema antes de aplicar.
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  onChange={handleImportFile}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 text-xs font-semibold text-[#4E342E] bg-white border border-gray-300 hover:bg-gray-100 rounded-full flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Selecionar Arquivo JSON
                </button>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowBackupModal(false)}
                className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-full"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
