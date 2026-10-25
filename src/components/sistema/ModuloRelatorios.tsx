import React, { useState, useEffect } from 'react'
import { listarPedidos } from '@/services/pedidos'
import { listarLancamentosFinanceiros } from '@/services/financeiro'
import { PedidoVenda, LancamentoFinanceiro } from '@/types/sistema'
import { formatarCentavosParaReal, formatarDataHoraPtBR } from '@/lib/formatters'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, Download, PieChart, TrendingUp, ShieldCheck } from 'lucide-react'
import { SecaoAuditoriaRegras } from './SecaoAuditoriaRegras'

export const ModuloRelatorios: React.FC = () => {
  const [pedidos, setPedidos] = useState<PedidoVenda[]>([])
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>([])

  useEffect(() => {
    Promise.all([listarPedidos(), listarLancamentosFinanceiros('todos')]).then(([p, l]) => {
      setPedidos(p)
      setLancamentos(l)
    })
  }, [])

  // Consolidar Vendas por Forma de Pagamento
  const vendasPorForma: Record<string, number> = {}
  let totalFaturadoCentavos = 0

  for (const ped of pedidos) {
    if (ped.status === 'confirmado' || ped.status === 'faturado') {
      totalFaturadoCentavos += ped.total_centavos
      if (ped.pagamentos) {
        for (const pag of ped.pagamentos) {
          vendasPorForma[pag.forma_pagamento] =
            (vendasPorForma[pag.forma_pagamento] || 0) + pag.valor_centavos
        }
      }
    }
  }

  // Exportação CSV segura com todos os campos auditados e cabeçalho institucional com marca
  const exportarCsvVendas = () => {
    const topoInstitucional =
      'BRU MEMÓRIAS PERSONALIZADOS - "Pequenos detalhes. Grandes lembranças."\n' +
      'EMBLEMA OFICIAL: Ímãs Personalizados 5x5 • Rio de Janeiro • Central do Administrador\n' +
      `Exportado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}\n\n`
    const cabecalho =
      'Numero;Data;Cliente;Documento_Cliente;Status;Subtotal_Reais;Desconto_Reais;Acrescimo_Reais;Total_Reais;Qtd_Itens;Formas_Pagamento;Observacao\n'
    const linhas = pedidos
      .map((p) => {
        const formas = (p.pagamentos || []).map((pag) => pag.forma_pagamento).join('+')
        const clienteNome = (p.cliente_expand?.nome_razao_social || p.cliente || '').replace(
          /"/g,
          '""',
        )
        const clienteDoc = (p.cliente_expand?.documento || '').replace(/"/g, '""')
        const obs = (p.observacao || '').replace(/"/g, '""')
        const subtotal = (p.subtotal_centavos / 100).toFixed(2).replace('.', ',')
        const desconto = (p.desconto_centavos / 100).toFixed(2).replace('.', ',')
        const acrescimo = (p.acrescimo_centavos / 100).toFixed(2).replace('.', ',')
        const total = (p.total_centavos / 100).toFixed(2).replace('.', ',')
        const qtdItens = p.itens ? p.itens.reduce((acc, i) => acc + i.quantidade, 0) : 0

        return `${p.numero_sequencial};"${p.data_emissao}";"${clienteNome}";"${clienteDoc}";${p.status};${subtotal};${desconto};${acrescimo};${total};${qtdItens};${formas};"${obs}"`
      })
      .join('\n')

    const blob = new Blob(['\uFEFF' + topoInstitucional + cabecalho + linhas], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `relatorio_vendas_bru_memorias_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#4E342E] flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#FF1493]" />
            Relatórios Gerenciais
          </h2>
          <p className="text-sm text-[#4E342E]/70">
            Faturamento auditado, distribuição de receitas por meio de pagamento e conciliação
          </p>
        </div>

        <Button onClick={exportarCsvVendas} className="bg-[#FF1493] hover:bg-[#D8117E] text-white">
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV de Vendas
        </Button>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-[#F0E4E0] shadow-sm">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs text-[#4E342E]/60 uppercase font-semibold block mb-1">
                  Total Faturado Confirmado
                </span>
                <span className="text-2xl font-bold text-[#4E342E]">
                  {formatarCentavosParaReal(totalFaturadoCentavos)}
                </span>
              </div>
              <div className="p-2 rounded-full bg-green-100 text-green-700">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#F0E4E0] shadow-sm">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs text-[#4E342E]/60 uppercase font-semibold block mb-1">
                  Pedidos Registrados
                </span>
                <span className="text-2xl font-bold text-[#4E342E]">{pedidos.length}</span>
              </div>
              <div className="p-2 rounded-full bg-pink-100 text-[#FF1493]">
                <PieChart className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#F0E4E0] shadow-sm">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs text-[#4E342E]/60 uppercase font-semibold block mb-1">
                  Conformidade Simples Nacional
                </span>
                <span className="text-sm font-bold text-green-700 block mt-1">
                  Faixa 1 — Alíquota Nominal 4,00%
                </span>
                <span className="text-[11px] text-[#4E342E]/60">Bru Memórias LTDA</span>
              </div>
              <div className="p-2 rounded-full bg-blue-100 text-blue-700">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por Forma de Pagamento */}
      <Card className="border border-[#F0E4E0] shadow-sm">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-base font-bold text-[#4E342E]">
            Receitas por Forma de Pagamento (TabelaDeValores)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Object.entries(vendasPorForma).map(([forma, valorCent]) => (
              <div
                key={forma}
                className="p-3 bg-[#FAF7F6] rounded border border-[#F0E4E0] text-center"
              >
                <span className="text-xs font-semibold text-[#FF1493] block uppercase mb-1">
                  {forma}
                </span>
                <span className="text-sm font-bold text-[#4E342E]">
                  {formatarCentavosParaReal(valorCent)}
                </span>
              </div>
            ))}
            {Object.keys(vendasPorForma).length === 0 && (
              <div className="col-span-full text-center py-6 text-[#4E342E]/60 text-xs">
                Nenhum pagamento faturado no período.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Auditoria Integrada de Regras R1-R14 */}
      <SecaoAuditoriaRegras />
    </div>
  )
}
