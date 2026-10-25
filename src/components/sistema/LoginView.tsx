import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, Mail, ShieldAlert } from 'lucide-react'
import { BrandEmblem } from '@/design/BrandEmblem'
import { BRAND_TOKENS } from '@/design/tokens'

export const LoginView: React.FC = () => {
  const { login } = useAuth()
  const [email, setEmail] = useState('caiocesarfmatos@gmail.com')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)
    setLoading(true)

    const res = await login(email, senha)
    if (!res.sucesso) {
      setErro(res.erro || 'Falha ao autenticar')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8F4] via-white to-[#FCE7F0]/40 flex flex-col justify-center items-center p-4 text-[#3D150B]">
      <div className="w-full max-w-md">
        {/* Emblema Oficial da Marca Bru Memórias Personalizados */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="transition-transform duration-300 hover:scale-[1.02]">
            <BrandEmblem
              variant="main"
              size={140}
              withPadding={true}
              surface="light"
              alt="Bru Memórias Personalizados - Emblema Oficial"
            />
          </div>
          <p className="text-xs font-semibold tracking-wider text-[#5C2214] mt-1">
            {BRAND_TOKENS.subtagline}
          </p>
          <p className="text-[11px] uppercase tracking-widest text-[#3D150B]/60 font-medium mt-0.5">
            Central do Administrador
          </p>
        </div>

        <Card className="border border-[#EEDFD7] shadow-xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold flex items-center gap-2 text-[#3D150B]">
              <Lock className="w-5 h-5 text-[#E63980]" />
              Acesso Restrito
            </CardTitle>
            <CardDescription className="text-[#5C2214]/80 text-sm">
              Entre com suas credenciais autorizadas pelo Administrador
            </CardDescription>
          </CardHeader>
          <CardContent>
            {erro && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2 text-sm text-red-700">
                <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{erro}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-xs font-semibold uppercase tracking-wider text-[#4E342E]/80"
                >
                  E-mail Corporativo
                </Label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#4E342E]/40 absolute left-3 top-3" />
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu.email@brumemorias.com.br"
                    className="pl-9 border-[#E0D0CC] focus-visible:ring-[#E63980]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="senha"
                  className="text-xs font-semibold uppercase tracking-wider text-[#3D150B]/80"
                >
                  Senha de Acesso
                </Label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#3D150B]/40 absolute left-3 top-3" />
                  <Input
                    id="senha"
                    type="password"
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9 border-[#E0D0CC] focus-visible:ring-[#E63980]"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#E63980] hover:bg-[#D1256E] text-white font-medium py-2.5 shadow-md hover:shadow-lg transition-all"
              >
                {loading ? 'Validando Acesso...' : 'Entrar no Sistema'}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-[#F0E4E0] text-center text-xs text-[#4E342E]/60">
              Uso interno restrito. Tentativas não autorizadas são registradas com IP e data/hora.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
