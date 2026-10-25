import React, { useState } from 'react'
import { Copy, Check, Share2, ExternalLink } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const APP_PRODUCTION_URL = 'https://bru-memorias-controle-de-vendas-e3d25.goskip.app'

export const Footer: React.FC = () => {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const handleCopyLink = async () => {
    let success = false
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(APP_PRODUCTION_URL)
        success = true
      } catch {
        success = false
      }
    }

    if (!success) {
      try {
        const textArea = document.createElement('textarea')
        textArea.value = APP_PRODUCTION_URL
        textArea.style.position = 'fixed'
        textArea.style.opacity = '0'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        success = document.execCommand('copy')
        document.body.removeChild(textArea)
      } catch {
        success = false
      }
    }

    setCopied(true)
    setTimeout(() => setCopied(false), 2000)

    toast({
      title: 'Link copiado! Envie para quem quiser usar o app 💖',
      description: APP_PRODUCTION_URL,
    })
  }

  return (
    <footer className="mt-auto border-t border-[#F0E4E0] bg-white py-6 text-xs text-[#4E342E]/80">
      <div className="max-w-[1200px] mx-auto px-4 flex flex-col items-center gap-4 text-center sm:text-left">
        {/* Linha de Compartilhamento do App */}
        <div className="w-full flex flex-wrap items-center justify-center sm:justify-between gap-2.5 pb-3 border-b border-[#F0E4E0]/70 text-[11px] sm:text-xs">
          <div className="flex flex-wrap items-center justify-center gap-1.5 font-medium">
            <Share2 className="w-3.5 h-3.5 text-[#FF1493] flex-shrink-0" />
            <span className="text-[#4E342E]/80">Compartilhe este app:</span>
            <a
              href={APP_PRODUCTION_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#FF1493] hover:underline font-semibold break-all inline-flex items-center gap-1"
              title="Abrir aplicativo em nova aba"
            >
              <span>{APP_PRODUCTION_URL}</span>
              <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-70" />
            </a>
          </div>

          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 min-h-[32px] px-3 py-1 rounded-full text-xs font-semibold text-[#FF1493] bg-[#FFF0F8] border border-[#FF1493]/20 hover:bg-[#FF1493] hover:text-white transition-all duration-150 active:scale-95 shadow-2xs"
            title="Copiar link do app"
            aria-label="Copiar link do app"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-600" />
                <span className="text-green-700 font-bold">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar link</span>
              </>
            )}
          </button>
        </div>

        {/* Linha Principal com Créditos e Nota de Privacidade */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 font-medium">
            <span className="font-brand-script text-base text-[#FF1493]">Bru Memórias</span>
            <span>© {new Date().getFullYear()} • Ímãs Personalizados</span>
            <span className="text-[#FF1493]">•</span>
            <span>Recreio dos Bandeirantes, RJ</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#4E342E]/70 bg-[#F5EFEA]/60 px-3 py-1.5 rounded-full border border-[#F0E4E0]">
            <span className="text-sm">🔒</span>
            <span>
              Seus dados ficam salvos apenas neste dispositivo. Nada é enviado a terceiros.
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
