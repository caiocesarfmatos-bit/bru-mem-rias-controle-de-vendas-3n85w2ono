import React from 'react'
import { useAppV5 } from '@/context/AppV5Context'
import { HeaderV5 } from '@/components/v5/HeaderV5'
import { TelaBloqueioAdministrador } from '@/components/v5/TelaBloqueioAdministrador'
import { SecaoPainelHojeV5 } from '@/components/v5/SecaoPainelHojeV5'
import { SecaoClientesV5 } from '@/components/v5/SecaoClientesV5'
import { SecaoOrcamentosV5 } from '@/components/v5/SecaoOrcamentosV5'
import { SecaoProducaoV5 } from '@/components/v5/SecaoProducaoV5'
import { SecaoControleArteV5 } from '@/components/v5/SecaoControleArteV5'
import { SecaoCustosV5 } from '@/components/v5/SecaoCustosV5'
import { SecaoProdutosPrecosV5 } from '@/components/v5/SecaoProdutosPrecosV5'
import { SecaoParametrosAjustesV5 } from '@/components/v5/SecaoParametrosAjustesV5'
import { SecaoEstruturaProntaV5 } from '@/components/v5/SecaoEstruturaProntaV5'

export const CentralDoAdministradorV5: React.FC = () => {
  const { isAutenticado, abaAtiva, subsecaoAtiva } = useAppV5()

  // Bloqueio de acesso do Administrador (Seção 3 do spec)
  if (!isAutenticado) {
    return <TelaBloqueioAdministrador />
  }

  // Renderizador das telas por subseção (Navegação em Dois Níveis)
  const renderConteudoSubsecao = () => {
    switch (subsecaoAtiva) {
      // ABA HOJE
      case 'painel':
        return <SecaoPainelHojeV5 />
      case 'alertas':
        return (
          <SecaoEstruturaProntaV5
            subsecaoId="alertas"
            titulo="Central de Alertas & Diagnóstico"
            subtitulo="Alertas de estoque mínimo de insumos, backup pendente e proximidade de prazo."
            oQueFazer="Monitore avisos proativos e limites fiscais do Simples Nacional."
            proximaEtapa="Consolidação completa de alertas na Rodada 2."
          />
        )

      // ABA VENDER
      case 'clientes':
        return <SecaoClientesV5 />
      case 'orcamentos':
        return <SecaoOrcamentosV5 />
      case 'vendas':
        return <SecaoProducaoV5 /> // Pedidos e vendas compartilhados
      case 'leads':
        return (
          <SecaoEstruturaProntaV5
            subsecaoId="leads"
            titulo="Leads e Prospecção Comercial"
            subtitulo="Gestão de contatos recebidos em feiras, bazares e redes sociais antes de virarem clientes."
            oQueFazer="Cadastre contatos prospectados em eventos presenciais e redes sociais."
            proximaEtapa="Funil de conversão de leads para clientes na Rodada 2."
          />
        )

      // ABA PRODUZIR
      case 'producao':
        return <SecaoProducaoV5 />
      case 'controle-arte':
        return <SecaoControleArteV5 />

      // ABA DINHEIRO
      case 'custos':
        return <SecaoCustosV5 />
      case 'produtos-precos':
        return <SecaoProdutosPrecosV5 />
      case 'compras':
        return (
          <SecaoEstruturaProntaV5
            subsecaoId="compras"
            titulo="Compras & Fornecedores Nacionais"
            subtitulo="Histórico de cotações, compras de insumos e avaliação de fornecedores de qualquer estado."
            oQueFazer="Gerencie prazos de entrega e compras de papel fotográfico, manta magnética e embalagens."
            proximaEtapa="Lançamentos integrados de entrada de estoque na Rodada 2."
          />
        )
      case 'receitas':
      case 'despesas':
      case 'financeiro':
        return (
          <SecaoEstruturaProntaV5
            subsecaoId={subsecaoAtiva}
            titulo="Fluxo Financeiro & DRE do Simples"
            subtitulo="Demonstrativo de resultado, receitas por meio de pagamento e despesas fixas do ateliê."
            oQueFazer="Acompanhe entradas e saídas do mês com base nos pedidos faturados."
            proximaEtapa="Relatórios DRE e gráficos analíticos em SVG puro na Rodada 2."
          />
        )
      case 'fiscal':
        return (
          <SecaoEstruturaProntaV5
            subsecaoId="fiscal"
            titulo="Gestão Fiscal do Simples Nacional"
            subtitulo="Bru Memórias Personalizados LTDA — Acompanhamento do limite de R$ 4,8 milhões e sublimite de R$ 3,6 milhões."
            oQueFazer="Registre o pagamento mensal do DAS e acompanhe os alertas de 80% e 95% do teto."
            proximaEtapa="Controle de competências e compromissos fiscais na Rodada 2."
          />
        )
      case 'frete':
        return (
          <SecaoEstruturaProntaV5
            subsecaoId="frete"
            titulo="Tabela de Fretes Nacionais"
            subtitulo="Origem do ateliê para qualquer cidade do Brasil via Sedex, PAC ou transportadora."
            oQueFazer="Configure faixas de peso e regras de frete com teto percentual."
            proximaEtapa="Simulador integrado de fretes por CEP na Rodada 2."
          />
        )

      // ABA CRESCER
      case 'configuracoes':
        return <SecaoParametrosAjustesV5 />
      case 'planejamento':
        return (
          <SecaoEstruturaProntaV5
            subsecaoId="planejamento"
            titulo="Planejamento de Metas & Crescimento"
            subtitulo="Definição de metas mensais de faturamento e volume de ímãs produzidos."
            oQueFazer="Defina a meta de faturamento e acompanhe o ritmo de vendas diário."
            proximaEtapa="Gráficos de ritmo de vendas na Rodada 2."
          />
        )
      case 'regioes':
        return (
          <SecaoEstruturaProntaV5
            subsecaoId="regioes"
            titulo="Mapeamento de Regiões de Atendimento"
            subtitulo="Cobertura nacional de envios com prazo e custo médio por estado/região."
            oQueFazer="Cadastre prazos médios de envio para capitais e interior."
            proximaEtapa="Mapa interativo de abrangência nacional na Rodada 2."
          />
        )
      case 'marketing':
        return (
          <SecaoEstruturaProntaV5
            subsecaoId="marketing"
            titulo="Campanhas & Marketing do Ateliê"
            subtitulo="Controle de campanhas de datas comemorativas (Dia das Mães, Pais, Natal)."
            oQueFazer="Planeje cronograma de postagens e retorno financeiro de anúncios."
            proximaEtapa="Painel de ROI de campanhas na Rodada 2."
          />
        )

      default:
        return <SecaoPainelHojeV5 />
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col text-[#4E342E]">
      <HeaderV5 />
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 py-6">
        {renderConteudoSubsecao()}
      </main>
      <footer className="py-4 border-t border-[#F0E4E0] text-center text-xs text-[#4E342E]/60 bg-white">
        Bru Memórias Personalizados LTDA • Central do Administrador v5.0 • Simples Nacional
      </footer>
    </div>
  )
}
