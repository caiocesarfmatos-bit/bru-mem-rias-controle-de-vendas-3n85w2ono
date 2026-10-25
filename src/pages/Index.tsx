import React from 'react'
import { useApp } from '@/context/AppContext'
import { OnboardingBanner } from '@/components/OnboardingBanner'
import { ModuloCustos } from '@/components/ModuloCustos'
import { ModuloCalculadora } from '@/components/ModuloCalculadora'
import { ModuloClientes } from '@/components/ModuloClientes'
import { ModuloFornecedores } from '@/components/ModuloFornecedores'
import { ModuloPainel } from '@/components/ModuloPainel'

const Index: React.FC = () => {
  const { activeTab } = useApp()

  return (
    <div className="space-y-6">
      {/* Banner de Boas-Vindas da Bru (dispensável) */}
      <OnboardingBanner />

      {/* Renderização condicional do módulo ativo (apenas o módulo ativo é montado) */}
      {activeTab === 'custos' && <ModuloCustos />}
      {activeTab === 'calculadora' && <ModuloCalculadora />}
      {activeTab === 'clientes' && <ModuloClientes />}
      {activeTab === 'fornecedores' && <ModuloFornecedores />}
      {activeTab === 'painel' && <ModuloPainel />}
    </div>
  )
}

export default Index
