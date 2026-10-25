// src/services/produtos.ts
import pb from '@/lib/pocketbase/client'
import { Produto, CategoriaProduto, TabelaPreco, PrecoProduto, LocalEstoque } from '@/types/sistema'

export async function listarCategorias(): Promise<CategoriaProduto[]> {
  try {
    const records = await pb.collection('categorias_produto').getFullList({ sort: 'nome' })
    return records.map((r) => ({
      id: r.id,
      nome: r.getString('nome'),
      descricao: r.getString('descricao'),
    }))
  } catch (err) {
    console.error('Erro ao listar categorias:', err)
    return []
  }
}

export async function listarLocaisEstoque(): Promise<LocalEstoque[]> {
  try {
    const records = await pb.collection('locais_estoque').getFullList({ sort: 'nome' })
    return records.map((r) => ({
      id: r.id,
      nome: r.getString('nome'),
      tipo: r.getString('tipo') as any,
    }))
  } catch (err) {
    console.error('Erro ao listar locais de estoque:', err)
    return []
  }
}

export async function listarTabelasPreco(): Promise<TabelaPreco[]> {
  try {
    const records = await pb.collection('tabelas_preco').getFullList({
      filter: "status = 'ativo'",
      sort: 'nome',
    })
    return records.map((r) => ({
      id: r.id,
      nome: r.getString('nome'),
      moeda: r.getString('moeda'),
      publico_alvo: r.getString('publico_alvo') as any,
      status: r.getString('status') as any,
    }))
  } catch (err) {
    console.error('Erro ao listar tabelas de preço:', err)
    return []
  }
}

export async function listarProdutosComPrecoESaldo(): Promise<Produto[]> {
  try {
    const produtosRec = await pb.collection('produtos').getFullList({
      sort: 'nome',
    })

    // Tabelas de preço ativas
    const tabelas = await listarTabelasPreco()
    const tabelaPadraoId = tabelas.length > 0 ? tabelas[0].id : ''

    const produtos: Produto[] = []

    for (const p of produtosRec) {
      let precoCentavos = 0
      // Buscar preço vigente (R4)
      if (tabelaPadraoId) {
        try {
          const precos = await pb.collection('precos_produto').getList(1, 1, {
            filter: `produto = '${p.id}' && tabela_preco = '${tabelaPadraoId}' && data_fim_vigencia = ''`,
            sort: '-data_inicio_vigencia',
          })
          if (precos.items.length > 0) {
            precoCentavos = precos.items[0].getInt('valor_centavos')
          }
        } catch {
          /* intentionally ignored */
        }
      }

      // Calcular saldo real a partir dos movimentos (R3, R6)
      let saldo = 0
      try {
        const movs = await pb.collection('movimento_estoque').getFullList({
          filter: `produto = '${p.id}'`,
        })
        for (const m of movs) {
          saldo += m.getInt('quantidade')
        }
      } catch {
        /* intentionally ignored */
      }

      produtos.push({
        id: p.id,
        sku: p.getString('sku'),
        codigo_barras: p.getString('codigo_barras'),
        nome: p.getString('nome'),
        descricao_curta: p.getString('descricao_curta'),
        categoria: p.getString('categoria'),
        unidade_compra: p.getString('unidade_compra'),
        unidade_venda: p.getString('unidade_venda'),
        fator_conversao: p.getInt('fator_conversao') || 1,
        estoque_minimo: p.getInt('estoque_minimo'),
        controla_lote: p.getBool('controla_lote'),
        status: p.getString('status') as any,
        preco_vigente_centavos: precoCentavos,
        saldo_estoque: saldo,
      })
    }

    return produtos
  } catch (err) {
    console.error('Erro ao listar produtos:', err)
    return []
  }
}

export async function cadastrarProduto(dados: {
  sku: string
  nome: string
  descricao_curta?: string
  categoria?: string
  unidade_compra: string
  unidade_venda: string
  fator_conversao: number
  estoque_minimo?: number
  controla_lote?: boolean
  preco_inicial_centavos: number
  preco_minimo_centavos: number
}): Promise<Produto> {
  if (!dados.sku || !dados.nome) {
    throw new Error('SKU e Nome são obrigatórios.')
  }
  if (dados.fator_conversao <= 0) {
    throw new Error('Fator de conversão deve ser estritamente maior que zero.')
  }

  // 1. Criar Produto (Sem preço direto conforme regra de negócio)
  const prodRec = await pb.collection('produtos').create({
    sku: dados.sku.toUpperCase().trim(),
    nome: dados.nome.trim(),
    descricao_curta: dados.descricao_curta || '',
    categoria: dados.categoria || '',
    unidade_compra: dados.unidade_compra || 'UN',
    unidade_venda: dados.unidade_venda || 'UN',
    fator_conversao: dados.fator_conversao,
    estoque_minimo: dados.estoque_minimo || 0,
    controla_lote: !!dados.controla_lote,
    status: 'ativo',
  })

  // 2. Criar Preço na Tabela Padrão (R4)
  const tabelas = await listarTabelasPreco()
  const tabelaId = tabelas.length > 0 ? tabelas[0].id : ''
  if (tabelaId && dados.preco_inicial_centavos > 0) {
    await pb.collection('precos_produto').create({
      produto: prodRec.id,
      tabela_preco: tabelaId,
      valor_centavos: dados.preco_inicial_centavos,
      preco_minimo_centavos: dados.preco_minimo_centavos || dados.preco_inicial_centavos,
      data_inicio_vigencia: new Date().toISOString(),
      usuario_responsavel: pb.authStore.model?.id || '',
      motivo_alteracao: 'Preço inicial de cadastro',
    })
  }

  return {
    id: prodRec.id,
    sku: prodRec.sku,
    nome: prodRec.nome,
    unidade_compra: prodRec.unidade_compra,
    unidade_venda: prodRec.unidade_venda,
    fator_conversao: prodRec.fator_conversao,
    status: 'ativo',
    preco_vigente_centavos: dados.preco_inicial_centavos,
    saldo_estoque: 0,
  }
}
