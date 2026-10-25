import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { ModuloPessoas } from './ModuloPessoas'
import { ModuloCatalogoEstoque } from './ModuloCatalogoEstoque'
import { ModuloVendas } from './ModuloVendas'
import { ModuloFinanceiro } from './ModuloFinanceiro'
import { ModuloRelatorios } from './ModuloRelatorios'
import { ModuloUsuarios } from './ModuloUsuarios'
import { SecaoCentroBackup } from './SecaoCentroBackup'
import {
  Users,
  Package,
  ShoppingCart,
  Landmark,
  BarChart3,
  Shield,
  LogOut,
  Sparkles,
  Archive,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

type ModuloId =
  | 'vendas'
  | 'pessoas'
  | 'estoque'
  | 'financeiro'
  | 'relatorios'
  | 'usuarios'
  | 'backup'

export const CentralAdministrativa: React.FC = () => {
  const { usuario, logout, temPermissao } = useAuth()
  const [moduloAtivo, setModuloAtivo] = useState<ModuloId>('vendas')

  const renderConteudo = () => {
    switch (moduloAtivo) {
      case 'vendas':
        return <ModuloVendas />
      case 'pessoas':
        return <ModuloPessoas />
      case 'estoque':
        return <ModuloCatalogoEstoque />
      case 'financeiro':
        return <ModuloFinanceiro />
      case 'relatorios':
        return <ModuloRelatorios />
      case 'usuarios':
        return <ModuloUsuarios />
      case 'backup':
        return <SecaoCentroBackup />
      default:
        return <ModuloVendas />
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col text-[#4E342E]">
      {/* Topo Institucional Bru Memórias */}
      <header className="bg-white border-b border-[#F0E4E0] sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1240px] mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#FF1493]/10 border border-[#FF1493]/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#FF1493]" />
            </div>
            <div>
              <h1 className="text-xl font-serif font-bold text-[#4E342E] leading-none">
                <span className="text-[#FF1493] italic font-serif">Bru</span> Memórias
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-[#4E342E]/70 font-semibold mt-0.5">
                Ateliê de Ímãs Personalizados • Recreio dos Bandeirantes / RJ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-[#4E342E] block">
                {usuario?.name || usuario?.email}
              </span>
              <span className="text-[10px] uppercase font-semibold text-[#FF1493] bg-[#FFF0F5] px-2 py-0.5 rounded-full border border-[#FF1493]/20">
                {usuario?.perfil}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="text-xs text-[#4E342E] border-[#E0D0CC] hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" />
              Sair
            </Button>
          </div>
        </div>

        {/* Barra de Navegação Funcional (Regra: sem numeração decorativa de módulos) */}
        <div className="border-t border-[#F0E4E0] bg-[#FFF0F5]/30">
          <div className="max-w-[1240px] mx-auto px-4 flex gap-1 overflow-x-auto py-1.5 scrollbar-none">
            <button
              onClick={() => setModuloAtivo('vendas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                moduloAtivo === 'vendas'
                  ? 'bg-[#FF1493] text-white shadow-sm'
                  : 'text-[#4E342E]/80 hover:bg-white hover:text-[#4E342E]'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Vendas & Pedidos
            </button>

            <button
              onClick={() => setModuloAtivo('pessoas')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                moduloAtivo === 'pessoas'
                  ? 'bg-[#FF1493] text-white shadow-sm'
                  : 'text-[#4E342E]/80 hover:bg-white hover:text-[#4E342E]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Pessoas (Clientes e Fornecedores)
            </button>

            <button
              onClick={() => setModuloAtivo('estoque')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                moduloAtivo === 'estoque'
                  ? 'bg-[#FF1493] text-white shadow-sm'
                  : 'text-[#4E342E]/80 hover:bg-white hover:text-[#4E342E]'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              Catálogo & Estoque
            </button>

            <button
              onClick={() => setModuloAtivo('financeiro')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                moduloAtivo === 'financeiro'
                  ? 'bg-[#FF1493] text-white shadow-sm'
                  : 'text-[#4E342E]/80 hover:bg-white hover:text-[#4E342E]'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              Financeiro & Fluxo de Caixa
            </button>

            <button
              onClick={() => setModuloAtivo('relatorios')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                moduloAtivo === 'relatorios'
                  ? 'bg-[#FF1493] text-white shadow-sm'
                  : 'text-[#4E342E]/80 hover:bg-white hover:text-[#4E342E]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Relatórios Gerenciais
            </button>

            {usuario?.perfil === 'administrador' && (
              <>
                <button
                  onClick={() => setModuloAtivo('usuarios')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                    moduloAtivo === 'usuarios'
                      ? 'bg-[#FF1493] text-white shadow-sm'
                      : 'text-[#4E342E]/80 hover:bg-white hover:text-[#4E342E]'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  Usuários & Acesso
                </button>

                <button
                  onClick={() => setModuloAtivo('backup')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                    moduloAtivo === 'backup'
                      ? 'bg-[#FF1493] text-white shadow-sm'
                      : 'text-[#4E342E]/80 hover:bg-white hover:text-[#4E342E]'
                  }`}
                >
                  <Archive className="w-3.5 h-3.5" />
                  Backup & Legado v5
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 py-6">{renderConteudo()}</main>

      {/* Rodapé Informativo */}
      <footer className="py-4 border-t border-[#F0E4E0] text-center text-xs text-[#4E342E]/60 bg-white">
        Bru Memórias Personalizados LTDA • CNPJ 12.345.678/0001-95 • Simples Nacional • Sistema
        Administrativo Interno
      </footer>
    </div>
  )
}
