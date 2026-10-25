import React from 'react'

interface BrandLogoProps {
  showTagline?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  showTagline = true,
  className = '',
  size = 'md',
}) => {
  const isSm = size === 'sm'
  const isLg = size === 'lg'

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Ícone de duas polaroids sobrepostas com coração rosa no centro */}
      <div className="relative flex-shrink-0 w-11 h-11">
        {/* Polaroid de trás levemente rotacionada para a esquerda */}
        <div
          className="absolute inset-0 bg-white border border-[#4E342E]/20 rounded-md shadow-sm transform -rotate-6 transition-transform hover:-rotate-12 duration-200 p-[3px] flex flex-col"
          aria-hidden="true"
        >
          <div className="w-full h-6 bg-[#FFF0F8] rounded-sm flex items-center justify-center">
            <span className="text-[9px] opacity-40">✨</span>
          </div>
        </div>

        {/* Polaroid da frente levemente rotacionada para a direita com coração rosa */}
        <div
          className="absolute inset-0 bg-white border border-[#FF1493]/30 rounded-md shadow-md transform rotate-3 transition-transform hover:rotate-6 duration-200 p-[3px] flex flex-col justify-between"
          aria-hidden="true"
        >
          <div className="w-full h-6 bg-[#FF1493]/10 rounded-sm flex items-center justify-center">
            {/* Coração rosa */}
            <svg className="w-4 h-4 text-[#FF1493] fill-current animate-pulse" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>
          <div className="h-1 bg-[#4E342E]/10 rounded-full w-2/3 mx-auto mb-0.5" />
        </div>
      </div>

      {/* Tipografia da Marca */}
      <div className="flex flex-col">
        <div className="flex items-baseline gap-1.5 leading-none">
          <span
            className={`font-brand-script text-[#FF1493] tracking-wide ${
              isSm ? 'text-2xl' : isLg ? 'text-4xl' : 'text-3xl'
            }`}
          >
            Bru
          </span>
          <span
            className={`font-brand-serif font-bold text-[#4E342E] tracking-tight ${
              isSm ? 'text-lg' : isLg ? 'text-2xl' : 'text-xl'
            }`}
          >
            Memórias
          </span>
        </div>
        {showTagline && (
          <span className="text-[11px] font-medium text-[#4E342E]/80 tracking-wide mt-1 flex items-center gap-1">
            <span>Ímãs Personalizados</span>
            <span className="text-[#FF1493] font-bold">•</span>
            <span>Rio de Janeiro</span>
          </span>
        )}
      </div>
    </div>
  )
}
