import React, { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { ModuloPessoas } from './ModuloPessoas'
import { ModuloCatalogoEstoque } from './ModuloCatalogoEstoque'
import { ModuloVendas } from './ModuloVendas'
import { ModuloFinanceiro } from './ModuloFinanceiro'
import { ModuloRelatorios } from './ModuloRelatorios'
import { PainelMetricas } from './PainelMetricas'
import { ModuloUsuarios } from './ModuloUsuarios'
import { SecaoCentroBackup } from './SecaoCentroBackup'
import { SecaoFaixasFrete } from './SecaoFaixasFrete'
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Package,
  Landmark,
  BarChart3,
  Shield,
  LogOut,
  Archive,
  Truck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/BrandLogo'
type ModuloId =
  | 'dashboard'
  | 'vendas'
  | 'pessoas'
  | 'estoque'
  | 'frete'
  | 'financeiro'
  | 'relatorios'
  | 'usuarios'
  | 'backup'

export const CentralAdministrativa: React.FC = () => {
  const { usuario, logout, temPermissao } = useAuth()
  const [moduloAtivo, setModuloAtivo] = useState<ModuloId>('dashboard')

  // Controle de permissão de visualização das abas:
  // Administrador e Gestor: veem tudo
  // Vendedor: vê Dashboard (métricas próprias), Vendas e Pessoas
  // Caixa: Vendas, Financeiro e Dashboard
  // Estoquista: Estoque, Frete e Dashboard
  // Consulta: Relatórios, Dashboard
  const podeAcessarDashboard =
    temPermissao('relatorios.ver') ||
    usuario?.perfil === 'vendedor' ||
    usuario?.perfil === 'operador_caixa' ||
    usuario?.perfil === 'estoquista' ||
    usuario?.perfil === 'administrador' ||
    usuario?.perfil === 'gestor'
  const podeAcessarVendas = temPermissao('pedidos.ver')
  const podeAcessarPessoas = temPermissao('pessoas.ver')
  const podeAcessarEstoque = temPermissao('produtos.ver')
  const podeAcessarFrete =
    temPermissao('faixas_frete.gerenciar') ||
    usuario?.perfil === 'administrador' ||
    usuario?.perfil === 'gestor' ||
    usuario?.perfil === 'estoquista'
  const podeAcessarFinanceiro = temPermissao('financeiro.ver')
  const podeAcessarRelatorios = temPermissao('relatorios.ver')

  const renderConteudo = () => {
    switch (moduloAtivo) {
      case 'dashboard':
        return <PainelMetricas />
      case 'vendas':
        return <ModuloVendas />
      case 'pessoas':
        return <ModuloPessoas />
      case 'estoque':
        return <ModuloCatalogoEstoque />
      case 'frete':
        return <SecaoFaixasFrete />
      case 'financeiro':
        return <ModuloFinanceiro />
      case 'relatorios':
        return <ModuloRelatorios />
      case 'usuarios':
        return <ModuloUsuarios />
      case 'backup':
        return <SecaoCentroBackup />
      default:
        return <PainelMetricas />
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col text-[#4E342E] pb-20 md:pb-0">
      {/* Topo Institucional Bru Memórias */}
      <header className="bg-white border-b border-[#F0E4E0] sticky top-0 z-30 shadow-sm pt-safe">
        <div className="max-w-[1240px] mx-auto px-4 py-2.5 flex justify-between items-center">
          {/* Logo Oficial: Emblema Tipográfico Secundário + Tagline */}
          <div className="flex items-center">
            <BrandLogo mode="header" size="md" showTagline={true} />
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
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
              className="text-xs text-[#4E342E] border-[#E0D0CC] hover:bg-red-50 hover:text-red-700 min-h-[44px] sm:min-h-[36px] px-3"
            >
              <LogOut className="w-4 h-4 sm:w-3.5 sm:h-3.5 mr-1" />
              Sair
            </Button>
          </div>
        </div>

        {/* Barra de Navegação Horizontal no Desktop (Oculta no Mobile para priorizar Bottom Bar) */}
        <div className="hidden md:block border-t border-[#F0E4E0] bg-[#FFF0F5]/30">
          <div className="max-w-[1240px] mx-auto px-4 flex gap-1 overflow-x-auto py-1.5 scrollbar-none">
            {podeAcessarDashboard && (
              <button
                onClick={() => setModuloAtivo('dashboard')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-colors min-h-[40px] ${
                  moduloAtivo === 'dashboard'
                    ? 'bg-[#E63980] text-white shadow-sm'
                    : 'text-[#4E342E]/80 hover:bg-white hover:text-[#4E342E]'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Dashboard de Métricas
              </button>
            )}

            {podeAcessarVendas && (
              <button
                onClick={() => setModuloAtivo('vendas')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-colors min-h-[40px] ${
                  moduloAtivo === 'vendas'
                    ? 'bg-[#FF1493] text-white shadow-sm'
                    : 'text-[#4E342E]/80 hover:bg-white hover:text-[#4E342E]'
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Vendas & Pedidos
              </button>
            )}

            {podeAcessarPessoas && (
              <button
                onClick={() => setModuloAtivo('pessoas')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-colors min-h-[40px] ${
                  moduloAtivo === 'pessoas'
                    ? 'bg-[#FF1493] text-white shadow-sm'
                    : 'text-[#4E342E]/80 hover:bg-white hover:text-[#4E342E]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Pessoas (Clientes e Fornecedores)
              </button>
            )}

            {podeAcessarEstoque && (
              <button
                onClick={() => setModuloAtivo('estoque')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-colors min-h-[40px] ${
                  moduloAtivo === 'estoque'
                    ? 'bg-[#FF1493] text-white shadow-sm'
                    : 'text-[#4E342E]/80 hover:bg-white hover:text-[#4E342E]'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                Catálogo & Produção
              </button>
            )}

            {podeAcessarFrete && (
              <button
                onClick={() => setModuloAtivo('frete')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-colors min-h-[40px] ${
                  moduloAtivo === 'frete'
                    ? 'bg-[#FF1493] text-white shadow-sm'
                    : 'text-[#4E342E]/80 hover:bg-white hover:text-[#4E342E]'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                Tabela de Frete
              </button>
            )}

            {podeAcessarFinanceiro && (
              <button
                onClick={() => setModuloAtivo('financeiro')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-colors min-h-[40px] ${
                  moduloAtivo === 'financeiro'
                    ? 'bg-[#FF1493] text-white shadow-sm'
                    : 'text-[#4E342E]/80 hover:bg-white hover:text-[#4E342E]'
                }`}
              >
                <Landmark className="w-3.5 h-3.5" />
                Financeiro & Caixa
              </button>
            )}

            {podeAcessarRelatorios && (
              <button
                onClick={() => setModuloAtivo('relatorios')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-colors min-h-[40px] ${
                  moduloAtivo === 'relatorios'
                    ? 'bg-[#FF1493] text-white shadow-sm'
                    : 'text-[#4E342E]/80 hover:bg-white hover:text-[#4E342E]'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Relatórios Gerenciais
              </button>
            )}

            {usuario?.perfil === 'administrador' && (
              <>
                <button
                  onClick={() => setModuloAtivo('usuarios')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-colors min-h-[40px] ${
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
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-colors min-h-[40px] ${
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
      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 py-4 md:py-6">
        {renderConteudo()}
      </main>

      {/* NAVEGAÇÃO INFERIOR EXCLUSIVA PARA CELULAR / IPHONE (BOTTOM NAVIGATION BAR) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#F0E4E0] z-40 pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        <div className="grid grid-cols-5 h-16 items-center px-1">
          {podeAcessarDashboard && (
            <button
              onClick={() => setModuloAtivo('dashboard')}
              className={`flex flex-col items-center justify-center h-full min-h-[48px] rounded transition-colors ${
                moduloAtivo === 'dashboard'
                  ? 'text-[#FF1493] font-bold'
                  : 'text-[#4E342E]/70 hover:text-[#4E342E]'
              }`}
            >
              <LayoutDashboard className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">Painel</span>
            </button>
          )}

          {podeAcessarVendas && (
            <button
              onClick={() => setModuloAtivo('vendas')}
              className={`flex flex-col items-center justify-center h-full min-h-[48px] rounded transition-colors ${
                moduloAtivo === 'vendas'
                  ? 'text-[#FF1493] font-bold'
                  : 'text-[#4E342E]/70 hover:text-[#4E342E]'
              }`}
            >
              <ShoppingCart className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">Vendas</span>
            </button>
          )}

          {podeAcessarPessoas && (
            <button
              onClick={() => setModuloAtivo('pessoas')}
              className={`flex flex-col items-center justify-center h-full min-h-[48px] rounded transition-colors ${
                moduloAtivo === 'pessoas'
                  ? 'text-[#FF1493] font-bold'
                  : 'text-[#4E342E]/70 hover:text-[#4E342E]'
              }`}
            >
              <Users className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">Clientes</span>
            </button>
          )}

          {podeAcessarEstoque && (
            <button
              onClick={() => setModuloAtivo('estoque')}
              className={`flex flex-col items-center justify-center h-full min-h-[48px] rounded transition-colors ${
                moduloAtivo === 'estoque'
                  ? 'text-[#FF1493] font-bold'
                  : 'text-[#4E342E]/70 hover:text-[#4E342E]'
              }`}
            >
              <Package className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] tracking-tight">Produção</span>
            </button>
          )}

          <button
            onClick={() => {
              if (moduloAtivo === 'financeiro') setModuloAtivo('relatorios')
              else if (moduloAtivo === 'relatorios') setModuloAtivo('frete')
              else setModuloAtivo('financeiro')
            }}
            className={`flex flex-col items-center justify-center h-full min-h-[48px] rounded transition-colors ${
              ['financeiro', 'relatorios', 'frete', 'usuarios', 'backup'].includes(moduloAtivo)
                ? 'text-[#FF1493] font-bold'
                : 'text-[#4E342E]/70 hover:text-[#4E342E]'
            }`}
          >
            <Landmark className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] tracking-tight">Gestão</span>
          </button>
        </div>
      </nav>

      {/* Rodapé Informativo (Visível no desktop) */}
      <footer className="hidden md:block py-4 border-t border-[#F0E4E0] text-center text-xs text-[#4E342E]/60 bg-white">
        Bru Memórias Personalizados LTDA • CNPJ 12.345.678/0001-95 • Simples Nacional • Sistema
        Administrativo Interno
      </footer>
    </div>
  )
}
