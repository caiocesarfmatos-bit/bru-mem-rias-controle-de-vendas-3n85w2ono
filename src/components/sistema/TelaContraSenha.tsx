import React, { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { KeyRound, ShieldAlert, LogOut } from 'lucide-react'
import { BrandEmblem } from '@/design/BrandEmblem'
import { BRAND_TOKENS } from '@/design/tokens'

export const TelaContraSenha: React.FC = () => {
  const { validarContraSenha, logout, usuario } = useAuth()
  const [codigo, setCodigo] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [bloqueadoSegundos, setBloqueadoSegundos] = useState<number>(0)

  // Contagem regressiva do bloqueio progressivo caso ocorra rate limit
  useEffect(() => {
    if (bloqueadoSegundos <= 0) return
    const timer = setInterval(() => {
      setBloqueadoSegundos((prev) => (prev > 1 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [bloqueadoSegundos])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (bloqueadoSegundos > 0 || loading) return

    setErro(null)
    setLoading(true)

    const res = await validarContraSenha(codigo)
    if (!res.sucesso) {
      setErro(res.erro || 'Código incorreto.')
      if (res.bloqueadoSegundos && res.bloqueadoSegundos > 0) {
        setBloqueadoSegundos(res.bloqueadoSegundos)
      }
      setCodigo('')
    }
    setLoading(false)
  }

  const isBloqueado = bloqueadoSegundos > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8F4] via-white to-[#FCE7F0]/40 flex flex-col justify-center items-center p-4 text-[#3D150B] safe-area-inset-bottom">
      <div className="w-full max-w-sm">
        {/* Identidade Visual Oficial da Marca */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="transition-transform duration-300 hover:scale-[1.02]">
            <BrandEmblem
              variant="main"
              size={120}
              withPadding={true}
              surface="light"
              alt="Bru Memórias Personalizados - Emblema Oficial"
            />
          </div>
          <p className="text-xs font-semibold tracking-wider text-[#5C2214] mt-1">
            {BRAND_TOKENS.subtagline}
          </p>
          {usuario?.email && (
            <p className="text-[11px] text-[#3D150B]/60 font-medium mt-0.5 truncate max-w-[280px]">
              {usuario.email}
            </p>
          )}
        </div>

        <Card className="border border-[#EEDFD7] shadow-xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-3 text-center">
            <CardTitle className="text-lg font-bold flex items-center justify-center gap-2 text-[#3D150B]">
              <KeyRound className="w-5 h-5 text-[#E63980]" />
              Digite a contra senha
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {erro && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700 animate-fade-in">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="flex-1">{erro}</span>
              </div>
            )}

            {isBloqueado && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 text-center font-medium">
                Acesso bloqueado temporariamente. Aguarde {bloqueadoSegundos}s.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <div className="relative">
                  <Input
                    id="contra-senha-input"
                    type="password"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    required
                    autoFocus
                    disabled={loading || isBloqueado}
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    placeholder="Digite a contra senha"
                    className="text-center tracking-widest text-base min-h-[44px] h-12 border-[#E0D0CC] focus-visible:ring-[#E63980]"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || isBloqueado || !codigo.trim()}
                className="w-full min-h-[44px] h-11 bg-[#E63980] hover:bg-[#D1256E] text-white font-medium shadow-md transition-all active:scale-[0.99] touch-manipulation"
              >
                {loading ? 'Verificando...' : 'Confirmar'}
              </Button>
            </form>

            <div className="pt-2 border-t border-[#F0E4E0] flex justify-center">
              <button
                type="button"
                onClick={() => logout()}
                className="inline-flex items-center gap-1.5 text-xs text-[#5C2214]/70 hover:text-red-600 transition-colors py-2 px-3 min-h-[44px] touch-manipulation"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
