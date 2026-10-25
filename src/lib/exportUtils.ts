import { AppData } from '@/types/app'
import { formatarMoeda, formatarDataPtBR } from './formatters'

export function exportarJson(dados: AppData, audit: unknown[]): void {
  const payload = {
    app: 'Bru Memórias | Controle de Vendas',
    exportadoEm: new Date().toISOString(),
    versao: 1,
    dados,
    auditoria: audit,
  }
  const jsonStr = JSON.stringify(payload, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute(
    'download',
    `bru-memorias-backup-${new Date().toISOString().split('T')[0]}.json`,
  )
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportarCsvClientes(dados: AppData): void {
  // Cabeçalho e linhas em pt-BR com ponto e vírgula e BOM UTF-8
  const header = [
    'Nome',
    'Telefone WhatsApp',
    'Telefone Recado',
    'E-mail',
    'Instagram',
    'Endereço',
    'Data Cadastro',
    'Consentimento LGPD',
    'Total Gasto (R$)',
    'Total Pedidos',
  ]

  const rows = dados.clientes.map((cli) => {
    const totalGasto = cli.pedidos.reduce((acc, p) => acc + (p.receita || 0), 0)
    return [
      `"${cli.nome.replace(/"/g, '""')}"`,
      `"${cli.telefoneWhatsapp}"`,
      `"${cli.telefoneRecado || ''}"`,
      `"${cli.email || ''}"`,
      `"${cli.instagram || ''}"`,
      `"${(cli.endereco || '').replace(/"/g, '""')}"`,
      `"${formatarDataPtBR(cli.dataCadastro)}"`,
      `"${cli.consentimentoLgpd ? 'Sim' : 'Não'}"`,
      `"${formatarMoeda(totalGasto).replace('R$', '').trim()}"`,
      `"${cli.pedidos.length}"`,
    ].join(';')
  })

  const csvContent = '\uFEFF' + [header.join(';'), ...rows].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute(
    'download',
    `bru-memorias-clientes-${new Date().toISOString().split('T')[0]}.csv`,
  )
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportarCsvPedidos(dados: AppData): void {
  const header = [
    'ID Pedido',
    'Data',
    'Cliente',
    'Produto/Kit',
    'Quantidade',
    'Preço Unitário (R$)',
    'Receita Total (R$)',
    'Custo Total (R$)',
    'Lucro Líquido (R$)',
    'Margem (%)',
    'Status',
  ]

  const rows: string[] = []
  dados.clientes.forEach((cli) => {
    cli.pedidos.forEach((ped) => {
      rows.push(
        [
          `"${ped.id}"`,
          `"${formatarDataPtBR(ped.data)}"`,
          `"${cli.nome.replace(/"/g, '""')}"`,
          `"${ped.produtoNome.replace(/"/g, '""')}"`,
          `"${ped.quantidade}"`,
          `"${formatarMoeda(ped.precoUnitario).replace('R$', '').trim()}"`,
          `"${formatarMoeda(ped.receita).replace('R$', '').trim()}"`,
          `"${formatarMoeda(ped.custoTotal).replace('R$', '').trim()}"`,
          `"${formatarMoeda(ped.lucroLiquido).replace('R$', '').trim()}"`,
          `"${ped.margemPct.toFixed(1).replace('.', ',')}%"`,
          `"${ped.status}"`,
        ].join(';'),
      )
    })
  })

  const csvContent = '\uFEFF' + [header.join(';'), ...rows].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute(
    'download',
    `bru-memorias-pedidos-${new Date().toISOString().split('T')[0]}.csv`,
  )
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportarCsvFornecedores(dados: AppData): void {
  const header = [
    'Insumo',
    'Fornecedor',
    'Localização',
    'Preço Unitário (R$)',
    'Prazo',
    'Avaliação (1-5)',
    'Contato',
    'Link',
  ]

  const rows = dados.fornecedores.map((forn) => {
    return [
      `"${forn.insumoNome.replace(/"/g, '""')}"`,
      `"${forn.nome.replace(/"/g, '""')}"`,
      `"${forn.localizacao}"`,
      `"${formatarMoeda(forn.preco).replace('R$', '').trim()}"`,
      `"${forn.prazo}"`,
      `"${forn.avaliacao} estrelas"`,
      `"${forn.contato}"`,
      `"${forn.link || ''}"`,
    ].join(';')
  })

  const csvContent = '\uFEFF' + [header.join(';'), ...rows].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute(
    'download',
    `bru-memorias-fornecedores-${new Date().toISOString().split('T')[0]}.csv`,
  )
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportarCsvEstoque(dados: AppData): void {
  const insumos = dados.estoque?.insumos || []
  const header = [
    'Insumo',
    'Categoria',
    'Qtd Atual',
    'Unidade',
    'Custo Médio Unitário (R$)',
    'Valor Total em Estoque (R$)',
    'Estoque Mínimo',
    'Status Estoque',
  ]

  const rows = insumos.map((item) => {
    const valorTotal = item.quantidadeAtual * item.custoMedioUnitario
    const status = item.quantidadeAtual <= item.estoqueMinimo ? 'ALERTA BAIXO' : 'Normal'
    return [
      `"${item.nome.replace(/"/g, '""')}"`,
      `"${item.categoria || 'Geral'}"`,
      `"${item.quantidadeAtual}"`,
      `"${item.unidade}"`,
      `"${formatarMoeda(item.custoMedioUnitario).replace('R$', '').trim()}"`,
      `"${formatarMoeda(valorTotal).replace('R$', '').trim()}"`,
      `"${item.estoqueMinimo}"`,
      `"${status}"`,
    ].join(';')
  })

  const csvContent = '\uFEFF' + [header.join(';'), ...rows].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute(
    'download',
    `bru-memorias-estoque-${new Date().toISOString().split('T')[0]}.csv`,
  )
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportarCsvMovimentacoesEstoque(dados: AppData): void {
  const movs = dados.estoque?.movimentacoes || []
  const header = [
    'ID Movimentação',
    'Data',
    'Item / Insumo',
    'Tipo',
    'Quantidade',
    'Custo Unitário (R$)',
    'Valor Total Movimentado (R$)',
    'Motivo',
    'Observação',
  ]

  const rows = movs.map((m) => {
    const valorTotal = (m.custoUnitario || 0) * m.quantidade
    return [
      `"${m.id}"`,
      `"${formatarDataPtBR(m.data)}"`,
      `"${m.itemNome.replace(/"/g, '""')}"`,
      `"${m.tipo === 'entrada' ? 'Entrada' : 'Saída'}"`,
      `"${m.quantidade}"`,
      `"${m.custoUnitario ? formatarMoeda(m.custoUnitario).replace('R$', '').trim() : '-'}"`,
      `"${valorTotal > 0 ? formatarMoeda(valorTotal).replace('R$', '').trim() : '-'}"`,
      `"${m.motivo}"`,
      `"${(m.observacao || '').replace(/"/g, '""')}"`,
    ].join(';')
  })

  const csvContent = '\uFEFF' + [header.join(';'), ...rows].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute(
    'download',
    `bru-memorias-movimentacoes-estoque-${new Date().toISOString().split('T')[0]}.csv`,
  )
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
