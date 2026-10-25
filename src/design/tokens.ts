/**
 * Tokens de Design da Marca Oficial
 * Bru Memórias | Bru Memórias Personalizados
 * "Pequenos detalhes. Grandes lembranças."
 * Ímãs Personalizados 5x5 • Rio de Janeiro
 *
 * Cores extraídas diretamente dos ativos oficiais da marca:
 * - Emblema Principal: Collage ímãs fotográficos 5x5, laço e câmera rosa, tipografia BRU rosa com borda dourada/marrom chocolate, selo off-white.
 * - Logomarca Secundária: "BRU MEMÓRIAS PERSONALIZADOS" com coração e letras em degradê ouro/chocolate e rosa vibrante (fundo transparente e fundo branco).
 */

export const BRAND_TOKENS = {
  name: 'Bru Memórias',
  fullName: 'Bru Memórias Personalizados',
  tagline: 'Pequenos detalhes. Grandes lembranças.',
  subtagline: 'Ímãs Personalizados 5x5 • Rio de Janeiro',

  colors: {
    // Rosa Choque / Rosa Vibrante da marca (coração, palavra "BRU", laço, câmera)
    pink: {
      primary: '#E63980', // Rosa vibrante principal
      deep: '#D1256E', // Tom mais intenso / magenta
      soft: '#F678A7', // Tom suave do degradê
      light: '#FCE7F0', // Fundo suave de destaque
      border: '#F8B4D0', // Borda rosada
    },

    // Marrom Escuro / Chocolate (letra B de BRU, palavra MEMÓRIAS, contornos escuros)
    chocolate: {
      primary: '#3D150B', // Marrom chocolate profundo
      medium: '#5C2214', // Marrom quente
      dark: '#240B05', // Tom de sombra e alto contraste
      text: '#3D150B', // Texto escuro da marca
    },

    // Dourado / Ouro Nobre (filetes metálicos, contornos externos da logo tipográfica)
    gold: {
      primary: '#D49B42', // Dourado metálico principal
      light: '#F5CE7A', // Destaque dourado claro
      dark: '#9E6A1B', // Dourado escuro / âmbar
      subtle: '#FDF6E8', // Fundo creme dourado
    },

    // Off-White / Creme / Nude (fundo do medalhão do emblema e área de respiro)
    cream: {
      primary: '#FFF8F4', // Off-white rosado quente
      pure: '#FFFFFF', // Branco sólido
      canvas: '#FBF5F1', // Fundo neutro acolhedor
      border: '#EEDFD7', // Borda neutra suave
    },
  },

  // Área de respiro regulamentar: MÍNIMO 1/4 (25%) da altura do emblema em todos os lados
  spacing: {
    respiroRatio: 0.25, // 25% da altura
  },

  // Contraste mínimo exigido: 4.5:1 (WCAG AA)
  contrast: {
    minRatio: 4.5,
  },
} as const

export type BrandColors = typeof BRAND_TOKENS.colors
