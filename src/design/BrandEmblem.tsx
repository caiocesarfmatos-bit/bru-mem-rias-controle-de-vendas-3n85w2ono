import React from 'react'
import { BRAND_ASSETS } from '@/design/brandAssets'
import { cn } from '@/lib/utils'

export type BrandEmblemVariant = 'main' | 'secondary-transparent' | 'secondary-white'

interface BrandEmblemProps {
  /**
   * Variante da marca:
   * - 'main': Emblema Principal circular completo (com colagem de fotos, laço, câmera, slogan)
   * - 'secondary-transparent': Logomarca tipográfica com coração (fundo transparente)
   * - 'secondary-white': Logomarca tipográfica com coração (fundo branco sólido)
   */
  variant?: BrandEmblemVariant
  /**
   * Altura do emblema (em pixels ou classe CSS).
   * O redimensionamento é estritamente proporcional.
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number
  /**
   * Se verdadeiro, aplica a área de respiro regulamentar (mínimo 25% da altura em todos os lados).
   * Default: true
   */
  withPadding?: boolean
  /**
   * Tipo de superfície/fundo onde o emblema está pousado.
   * Usado para garantir contraste mínimo 4.5:1.
   * No caso de fundos escuros ou rosa vibrante, seleciona automaticamente a versão transparente.
   */
  surface?: 'light' | 'dark' | 'pink' | 'transparent'
  /**
   * Rótulo de acessibilidade (alt)
   */
  alt?: string
  className?: string
}

const SIZE_MAP = {
  xs: { height: 28, paddingClass: 'p-2' },
  sm: { height: 40, paddingClass: 'p-2.5' },
  md: { height: 56, paddingClass: 'p-3.5' },
  lg: { height: 80, paddingClass: 'p-5' },
  xl: { height: 120, paddingClass: 'p-7' },
  '2xl': { height: 180, paddingClass: 'p-11' },
} as const

export const BrandEmblem: React.FC<BrandEmblemProps> = ({
  variant,
  size = 'md',
  withPadding = true,
  surface = 'light',
  alt = 'Bru Memórias Personalizados',
  className,
}) => {
  // Resolução inteligente da imagem baseada na superfície para garantir contraste mínimo 4.5:1
  const effectiveVariant: BrandEmblemVariant = (() => {
    if (variant) return variant
    if (surface === 'dark' || surface === 'pink') {
      return 'secondary-transparent'
    }
    return 'main'
  })()

  const src = (() => {
    switch (effectiveVariant) {
      case 'secondary-transparent':
        return BRAND_ASSETS.logoSecondaryTransparent
      case 'secondary-white':
        return BRAND_ASSETS.logoSecondaryWhite
      case 'main':
      default:
        return BRAND_ASSETS.emblemMain
    }
  })()

  // Respiro regulamentar de no mínimo 1/4 (25%) da altura
  const isPresetSize = typeof size === 'string' && size in SIZE_MAP
  const heightPx = isPresetSize
    ? SIZE_MAP[size as keyof typeof SIZE_MAP].height
    : typeof size === 'number'
      ? size
      : 56
  const paddingPx = withPadding ? Math.round(heightPx * 0.25) : 0

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center shrink-0 select-none transition-transform duration-200',
        className,
      )}
      style={withPadding ? { padding: `${paddingPx}px` } : undefined}
      data-brand-variant={effectiveVariant}
      data-brand-surface={surface}
    >
      <img
        src={src}
        alt={alt}
        style={{
          height: `${heightPx}px`,
          width: 'auto',
          maxWidth: '100%',
          objectFit: 'contain',
        }}
        className="block pointer-events-none"
        loading="eager"
        decoding="async"
      />
    </div>
  )
}

export default BrandEmblem
