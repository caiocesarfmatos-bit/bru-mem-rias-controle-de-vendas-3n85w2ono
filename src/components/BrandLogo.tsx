import React from 'react'
import { cn } from '@/lib/utils'
import { BRAND_ASSETS } from '@/design/brandAssets'
import { BRAND_TOKENS } from '@/design/tokens'

interface BrandLogoProps {
  /**
   * Tamanho do componente:
   * - sm: cabeçalhos compactos / mobile
   * - md: cabeçalhos padrão
   * - lg: cabeçalhos expandidos / login
   * - xl: destaque máximo (tela de login)
   */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /**
   * Se exibe a tagline textual oficial "Ímãs Personalizados 5x5 • Rio de Janeiro"
   */
  showTagline?: boolean
  /**
   * Se exibe o slogan oficial "Pequenos detalhes. Grandes lembranças."
   */
  showSlogan?: boolean
  /**
   * Modo visual:
   * - 'header': usa o emblema tipográfico secundário (fundo transparente ou branco) + tagline em texto
   * - 'emblem': usa o emblema principal circular completo
   * - 'compact': somente a marca tipográfica
   */
  mode?: 'header' | 'emblem' | 'compact'
  className?: string
  onClick?: () => void
  surface?: 'light' | 'dark' | 'pink' | 'transparent'
}

const SIZE_CONFIGS = {
  sm: {
    logoHeight: 32,
    emblemHeight: 44,
    padding: 8,
    titleSize: 'text-base',
    taglineSize: 'text-[10px]',
  },
  md: {
    logoHeight: 42,
    emblemHeight: 58,
    padding: 11,
    titleSize: 'text-lg',
    taglineSize: 'text-xs',
  },
  lg: {
    logoHeight: 54,
    emblemHeight: 76,
    padding: 14,
    titleSize: 'text-xl',
    taglineSize: 'text-sm',
  },
  xl: {
    logoHeight: 72,
    emblemHeight: 120,
    padding: 24,
    titleSize: 'text-2xl',
    taglineSize: 'text-sm',
  },
} as const

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showTagline = true,
  showSlogan = false,
  mode = 'header',
  className,
  onClick,
  surface = 'light',
}) => {
  const config = SIZE_CONFIGS[size]

  // Regra de contraste e seleção de ativo da marca:
  // - Para mode === 'emblem', usamos o Emblema Principal circular completo.
  // - Para mode === 'header' ou 'compact', usamos a Logomarca Tipográfica Secundária.
  // - Em superfícies escuras ou rosas, usamos a versão transparente com contraste garantido.
  const isDarkOrPink = surface === 'dark' || surface === 'pink'

  const logoSrc = (() => {
    if (mode === 'emblem') {
      return BRAND_ASSETS.emblemMain
    }
    return isDarkOrPink
      ? BRAND_ASSETS.logoSecondaryTransparent
      : BRAND_ASSETS.logoSecondaryTransparent
  })()

  const height = mode === 'emblem' ? config.emblemHeight : config.logoHeight
  // Área de respiro mínima = 1/4 (25%) da altura da marca
  const respiro = Math.round(height * 0.25)

  return (
    <div
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-3 select-none transition-opacity',
        onClick && 'cursor-pointer hover:opacity-95',
        className,
      )}
      style={{
        paddingTop: `${respiro}px`,
        paddingBottom: `${respiro}px`,
      }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label="Bru Memórias Personalizados"
    >
      {/* Imagem oficial da marca (sem distorção, sem filtros, proporção estrita) */}
      <div
        className="shrink-0 flex items-center justify-center"
        style={{
          paddingLeft: `${respiro}px`,
          paddingRight: `${respiro}px`,
        }}
      >
        <img
          src={logoSrc}
          alt={
            mode === 'emblem'
              ? 'Emblema Bru Memórias Personalizados'
              : 'Bru Memórias Personalizados'
          }
          style={{
            height: `${height}px`,
            width: 'auto',
            maxWidth: '100%',
            objectFit: 'contain',
          }}
          className="block pointer-events-none drop-shadow-none"
          loading="eager"
        />
      </div>

      {/* Textos auxiliares mantidos em tipografia textual (tagline / slogan) */}
      {(showTagline || showSlogan) && (
        <div className="flex flex-col justify-center leading-tight">
          {showSlogan && (
            <span
              className="font-serif italic font-medium tracking-tight text-[#3D150B]"
              style={{ fontSize: config.titleSize.replace('text-', '') }}
            >
              {BRAND_TOKENS.tagline}
            </span>
          )}
          {showTagline && (
            <span
              className={cn(
                'font-medium tracking-wide flex items-center gap-1.5',
                isDarkOrPink ? 'text-white/90' : 'text-[#5C2214]',
                config.taglineSize,
              )}
            >
              <span>{BRAND_TOKENS.subtagline}</span>
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default BrandLogo
