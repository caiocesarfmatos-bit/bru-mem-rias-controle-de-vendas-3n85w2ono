import emblemMainImg from '@/assets/37c9fb9f-d32a-43c0-b43b-75c069f4e7ca-7fcbd.png'
import logoSecondaryTransparentImg from '@/assets/67a966ee-3939-4dc4-a707-7b39fab5870e-3b523.png'
import logoSecondaryWhiteImg from '@/assets/4043b879-1dd9-4bf9-a4e9-0b79878a2e1d-c5ae1.png'

/**
 * Mapeamento e exportação oficial dos ativos da marca Bru Memórias:
 *
 * 1. EMBLEMA PRINCIPAL:
 *    emblemMain - circular completo sobre fundo branco / collage de ímãs 5x5 fotográficos
 *    (família, golden retriever, casal ao pôr do sol, menina com laço), laço rosa, câmera rosa,
 *    palavra BRU em rosa com contorno dourado/marrom, "MEMÓRIAS PERSONALIZADOS" e slogan
 *    "Pequenos detalhes. Grandes lembranças."
 *
 * 2. LOGOMARCA SECUNDÁRIA (Fundo Transparente):
 *    logoSecondaryTransparent - tipografia "BRU MEMÓRIAS PERSONALIZADOS" com coração rosa
 *    em fundo transparente. Ideal para sobreposições em superfícies escuras, coloridas ou degradês.
 *
 * 3. LOGOMARCA SECUNDÁRIA (Fundo Branco):
 *    logoSecondaryWhite - mesma tipografia sobre fundo branco sólido.
 *    Ideal para documentos, comprovantes impressos e fundos claros.
 */
export const BRAND_ASSETS = {
  // 1. Emblema Principal
  emblemMain: emblemMainImg,

  // 2. Logomarca Secundária (Fundo Transparente)
  logoSecondaryTransparent: logoSecondaryTransparentImg,

  // 3. Logomarca Secundária (Fundo Branco Sólido)
  logoSecondaryWhite: logoSecondaryWhiteImg,
} as const

export default BRAND_ASSETS
