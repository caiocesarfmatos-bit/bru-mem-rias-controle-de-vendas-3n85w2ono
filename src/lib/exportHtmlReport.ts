import {
  IntervaloDatas,
  ResumoPeriodoKPIs,
  VendaProdutoReport,
  RankingClienteReport,
  paraYmd,
} from '@/lib/relatoriosUtils'
import { PedidoCliente } from '@/types/app'
import { formatarMoeda, formatarDataPtBR } from '@/lib/formatters'
import { BRAND_TOKENS } from '@/design/tokens'

/**
 * Gera e baixa o Relatório Oficial em HTML com layout de impressão premium contendo o
 * EMBLEMA OFICIAL DA MARCA BRU MEMÓRIAS incorporado no cabeçalho.
 */
export function exportarHtmlRelatorioCompleto(
  intervalo: IntervaloDatas,
  labelPeriodo: string,
  kpis: ResumoPeriodoKPIs,
  produtos: VendaProdutoReport[],
  clientesRanking: RankingClienteReport[],
  pedidos: PedidoCliente[],
): void {
  const dataEmissao = formatarDataPtBR(paraYmd(new Date()))

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <title>Relatório Oficial de Vendas - ${BRAND_TOKENS.fullName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: ${BRAND_TOKENS.colors.chocolate.primary};
      background: #FFFFFF;
      padding: 32px;
      line-height: 1.5;
    }
    .container { max-width: 960px; margin: 0 auto; }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 3px solid ${BRAND_TOKENS.colors.pink.primary};
      padding-bottom: 20px;
      margin-bottom: 28px;
    }
    .header-brand {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .header-logo {
      height: 90px;
      width: auto;
      object-fit: contain;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 800;
      color: ${BRAND_TOKENS.colors.chocolate.primary};
      letter-spacing: -0.5px;
    }
    .brand-tagline {
      font-style: italic;
      color: ${BRAND_TOKENS.colors.pink.primary};
      font-size: 13px;
      font-weight: 600;
    }
    .brand-subtagline {
      color: ${BRAND_TOKENS.colors.chocolate.medium};
      font-size: 11px;
      margin-top: 2px;
    }
    .header-meta {
      text-align: right;
      font-size: 12px;
      color: ${BRAND_TOKENS.colors.chocolate.medium};
    }
    .period-badge {
      display: inline-block;
      background: ${BRAND_TOKENS.colors.pink.light};
      color: ${BRAND_TOKENS.colors.pink.deep};
      font-weight: bold;
      padding: 4px 12px;
      border-radius: 9999px;
      margin-top: 6px;
      font-size: 11px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 28px;
    }
    .kpi-card {
      background: ${BRAND_TOKENS.colors.cream.primary};
      border: 1px solid ${BRAND_TOKENS.colors.cream.border};
      padding: 14px;
      border-radius: 12px;
      text-align: center;
    }
    .kpi-label {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      color: ${BRAND_TOKENS.colors.chocolate.medium};
      margin-bottom: 4px;
    }
    .kpi-value {
      font-size: 20px;
      font-weight: 800;
      color: ${BRAND_TOKENS.colors.pink.primary};
    }
    h2 {
      font-size: 16px;
      font-weight: 800;
      margin: 24px 0 10px;
      color: ${BRAND_TOKENS.colors.chocolate.primary};
      border-left: 4px solid ${BRAND_TOKENS.colors.gold.primary};
      padding-left: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-bottom: 24px;
    }
    th {
      background: ${BRAND_TOKENS.colors.cream.primary};
      color: ${BRAND_TOKENS.colors.chocolate.primary};
      text-align: left;
      padding: 8px 10px;
      border-bottom: 2px solid ${BRAND_TOKENS.colors.cream.border};
      font-weight: 700;
    }
    td {
      padding: 8px 10px;
      border-bottom: 1px solid #F0E4E0;
    }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .footer {
      border-top: 1px solid ${BRAND_TOKENS.colors.cream.border};
      margin-top: 32px;
      padding-top: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: ${BRAND_TOKENS.colors.chocolate.medium};
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- CABEÇALHO DO RELATÓRIO COM O EMBLEMA OFICIAL DA MARCA -->
    <header class="header">
      <div class="header-brand">
        <img
          src="/assets/emblem-main.png"
          alt="Emblema Oficial Bru Memórias Personalizados"
          class="header-logo"
        />
        <div>
          <div class="brand-title">${BRAND_TOKENS.fullName}</div>
          <div class="brand-tagline">"${BRAND_TOKENS.tagline}"</div>
          <div class="brand-subtagline">${BRAND_TOKENS.subtagline} • Central do Administrador</div>
        </div>
      </div>
      <div class="header-meta">
        <div><strong>Emissão:</strong> ${dataEmissao}</div>
        <div class="period-badge">Período: ${labelPeriodo}</div>
      </div>
    </header>

    <!-- RESUMO DE KPIS -->
    <section class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Receita Total</div>
        <div class="kpi-value">${formatarMoeda(kpis.receitaTotal.atual)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Lucro Líquido</div>
        <div class="kpi-value">${formatarMoeda(kpis.lucroTotal.atual)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Ticket Médio</div>
        <div class="kpi-value">${formatarMoeda(kpis.ticketMedio.atual)}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Ímãs Vendidos</div>
        <div class="kpi-value">${kpis.quantidadeTotal.atual}</div>
      </div>
    </section>

    <!-- CURVA ABC DE PRODUTOS -->
    <h2>Vendas por Produto / Curva ABC</h2>
    <table>
      <thead>
        <tr>
          <th>Produto</th>
          <th class="text-center">Classe</th>
          <th class="text-center">Qtd</th>
          <th class="text-right">Receita</th>
          <th class="text-right">Lucro</th>
          <th class="text-right">Margem</th>
        </tr>
      </thead>
      <tbody>
        ${produtos
          .map(
            (p) => `
          <tr>
            <td><strong>${p.produtoNome}</strong></td>
            <td class="text-center">${p.classeAbc || '-'}</td>
            <td class="text-center">${p.quantidade}</td>
            <td class="text-right">${formatarMoeda(p.receita)}</td>
            <td class="text-right">${formatarMoeda(p.lucro)}</td>
            <td class="text-right">${p.margemPct.toFixed(1).replace('.', ',')}%</td>
          </tr>
        `,
          )
          .join('')}
      </tbody>
    </table>

    <!-- TOP CLIENTES -->
    <h2>Top Clientes do Período</h2>
    <table>
      <thead>
        <tr>
          <th class="text-center">Pos</th>
          <th>Cliente</th>
          <th>Bairro / Local</th>
          <th class="text-center">Qtd Ímãs</th>
          <th class="text-right">Total Gasto</th>
        </tr>
      </thead>
      <tbody>
        ${clientesRanking
          .slice(0, 15)
          .map(
            (c, i) => `
          <tr>
            <td class="text-center">#${i + 1}</td>
            <td><strong>${c.clienteNome}</strong></td>
            <td>${c.cidadeOuBairro || '-'}</td>
            <td class="text-center">${c.quantidadeTotal}</td>
            <td class="text-right">${formatarMoeda(c.receitaTotal)}</td>
          </tr>
        `,
          )
          .join('')}
      </tbody>
    </table>

    <!-- RODAPÉ INSTITUCIONAL -->
    <footer class="footer">
      <div>Bru Memórias Personalizados • Sistema de Controle Administrativo de Vendas</div>
      <div>Página oficial de relatório gerencial com garantia de autenticidade</div>
    </footer>
  </div>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `relatorio-oficial-bru-memorias-${paraYmd(new Date())}.html`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
