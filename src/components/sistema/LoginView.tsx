import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Lock, Mail, ShieldAlert, Sparkles } from 'lucide-react'

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
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-white to-[#F9EBEA] flex flex-col justify-center items-center p-4 text-[#4E342E]">
      <div className="w-full max-w-md">
        {/* Identidade Visual Bru Memórias */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FF1493]/10 border-2 border-[#FF1493]/30 mb-3 shadow-inner">
            <Sparkles className="w-8 h-8 text-[#FF1493]" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#4E342E]">
            <span className="text-[#FF1493] italic font-serif">Bru</span> Memórias
          </h1>
          <p className="text-xs uppercase tracking-widest text-[#4E342E]/70 font-semibold mt-1">
            Controle Administrativo de Vendas • Ateliê Recreio
          </p>
        </div>

        <Card className="border border-[#F0E4E0] shadow-xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl font-bold flex items-center gap-2 text-[#4E342E]">
              <Lock className="w-5 h-5 text-[#FF1493]" />
              Acesso Restrito
            </CardTitle>
            <CardDescription className="text-[#4E342E]/70 text-sm">
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
                    className="pl-9 border-[#E0D0CC] focus-visible:ring-[#FF1493]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="senha"
                  className="text-xs font-semibold uppercase tracking-wider text-[#4E342E]/80"
                >
                  Senha de Acesso
                </Label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#4E342E]/40 absolute left-3 top-3" />
                  <Input
                    id="senha"
                    type="password"
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                    className="pl-9 border-[#E0D0CC] focus-visible:ring-[#FF1493]"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FF1493] hover:bg-[#D8117E] text-white font-medium py-2.5 shadow-md hover:shadow-lg transition-all"
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
