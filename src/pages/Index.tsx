import { useAuth } from '@/context/AuthContext'
import { LoginView } from '@/components/sistema/LoginView'
import { TelaContraSenha } from '@/components/sistema/TelaContraSenha'
import { CentralAdministrativa } from '@/components/sistema/CentralAdministrativa'

export default function Index() {
  const { isAutenticado, aguardandoContraSenha, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFF0F5] text-[#4E342E]">
        <div className="animate-pulse font-serif text-lg">Carregando Bru Memórias...</div>
      </div>
    )
  }

  if (aguardandoContraSenha) {
    return <TelaContraSenha />
  }

  if (!isAutenticado) {
    return <LoginView />
  }

  return <CentralAdministrativa />
}
