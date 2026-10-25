import React, { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { BrandEmblem } from '@/design/BrandEmblem'
import { Sparkles, X, Heart, Shield, HelpCircle, ArrowRight } from 'lucide-react'

export const OnboardingBanner: React.FC = () => {
  const { settings, updateSettings, setActiveTab } = useApp()
  const [minimized, setMinimized] = useState(false)

  if (settings.onboardingDispensado) {
    return null
  }

  const dismiss = () => {
    updateSettings({ onboardingDispensado: true })
  }

  if (minimized) {
    return (
      <div className="bg-[#FFF0F8] border border-[#FF1493]/20 rounded-xl px-4 py-2 flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-xs text-[#4E342E]">
          <span className="text-base">💖</span>
          <span>
            Boas-vindas ao <strong>Bru Memórias</strong>! Precisa de ajuda com o aplicativo?
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMinimized(false)}
            className="text-xs font-semibold text-[#FF1493] hover:underline"
          >
            Ver instruções
          </button>
          <button
            onClick={dismiss}
            className="text-[#4E342E]/60 hover:text-[#4E342E] p-1"
            title="Fechar de vez"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-[#FFF0F8] via-white to-[#F5EFEA] border-2 border-[#FF1493]/30 rounded-2xl p-5 sm:p-6 mb-6 shadow-soft-pink animate-fade-in">
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 p-1.5 text-[#4E342E]/60 hover:text-[#FF1493] rounded-full hover:bg-white/80 transition-colors"
        title="Dispensar boas-vindas"
        aria-label="Dispensar boas-vindas"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
        <div className="shrink-0 bg-white rounded-2xl p-1 shadow-sm border border-[#EEDFD7]">
          <BrandEmblem variant="main" size={56} withPadding={false} alt="Emblema Bru Memórias" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-brand-serif font-bold text-[#3D150B]">
              Bem-vinda à Central Bru Memórias Personalizados!
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#E63980] text-white">
              Rio de Janeiro • Recreio
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#5C2214]/90 mt-1">
            Gestão oficial e controle independente de vendas para os lindos ímãs fotográficos
            personalizados 5x5 cm.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2">
        <div
          onClick={() => setActiveTab('custos')}
          className="cursor-pointer bg-white/80 hover:bg-white p-3 rounded-xl border border-[#F0E4E0] hover:border-[#FF1493] transition-all duration-150 group"
        >
          <div className="text-[#FF1493] font-bold text-xs mb-1 flex items-center justify-between">
            <span>Custos</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-[11px] text-[#4E342E]/75 leading-tight">
            Insumos base do ímã 5x5, despesas extras e custo exato por unidade.
          </p>
        </div>

        <div
          onClick={() => setActiveTab('calculadora')}
          className="cursor-pointer bg-white/80 hover:bg-white p-3 rounded-xl border border-[#F0E4E0] hover:border-[#FF1493] transition-all duration-150 group"
        >
          <div className="text-[#FF1493] font-bold text-xs mb-1 flex items-center justify-between">
            <span>Calculadora</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-[11px] text-[#4E342E]/75 leading-tight">
            Cálculo ao vivo de lucro, margem, presets e tabela oficial da marca.
          </p>
        </div>

        <div
          onClick={() => setActiveTab('clientes')}
          className="cursor-pointer bg-white/80 hover:bg-white p-3 rounded-xl border border-[#F0E4E0] hover:border-[#FF1493] transition-all duration-150 group"
        >
          <div className="text-[#FF1493] font-bold text-xs mb-1 flex items-center justify-between">
            <span>Clientes</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-[11px] text-[#4E342E]/75 leading-tight">
            Contatos, WhatsApp direto, Instagram, termo LGPD e compras feitas.
          </p>
        </div>

        <div
          onClick={() => setActiveTab('fornecedores')}
          className="cursor-pointer bg-white/80 hover:bg-white p-3 rounded-xl border border-[#F0E4E0] hover:border-[#FF1493] transition-all duration-150 group"
        >
          <div className="text-[#FF1493] font-bold text-xs mb-1 flex items-center justify-between">
            <span>Fornecedores</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-[11px] text-[#4E342E]/75 leading-tight">
            Opções no Recreio, Barra e online, menor preço e avaliações.
          </p>
        </div>

        <div
          onClick={() => setActiveTab('painel')}
          className="cursor-pointer bg-white/80 hover:bg-white p-3 rounded-xl border border-[#F0E4E0] hover:border-[#FF1493] transition-all duration-150 group"
        >
          <div className="text-[#FF1493] font-bold text-xs mb-1 flex items-center justify-between">
            <span>Painel</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-[11px] text-[#4E342E]/75 leading-tight">
            KPIs de vendas, gráficos puros, funil, fluxo de caixa e auditoria.
          </p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-[#FF1493]/15 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-[#4E342E]/75">
          <Shield className="w-3.5 h-3.5 text-[#FF1493]" />
          <span>
            Privacidade total: Seus dados estão salvos <strong>localmente neste navegador</strong>.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMinimized(true)}
            className="text-xs text-[#4E342E]/70 hover:text-[#4E342E]"
          >
            Minimizar
          </button>
          <button onClick={dismiss} className="text-xs font-bold text-[#FF1493] hover:underline">
            Entendido, começar! ✨
          </button>
        </div>
      </div>
    </div>
  )
}
