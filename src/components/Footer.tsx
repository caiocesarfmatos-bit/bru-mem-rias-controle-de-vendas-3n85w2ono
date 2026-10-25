import React from 'react'

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-[#F0E4E0] bg-white py-6 text-center text-xs text-[#4E342E]/80">
      <div className="max-w-[1200px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="font-brand-script text-base text-[#FF1493]">Bru Memórias</span>
          <span>© {new Date().getFullYear()} • Ímãs Personalizados 5x5 cm</span>
          <span className="text-[#FF1493]">•</span>
          <span>Recreio dos Bandeirantes, RJ</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[#4E342E]/70 bg-[#F5EFEA]/60 px-3 py-1.5 rounded-full border border-[#F0E4E0]">
          <span className="text-sm">🔒</span>
          <span>Seus dados ficam salvos apenas neste dispositivo. Nada é enviado a terceiros.</span>
        </div>
      </div>
    </footer>
  )
}
