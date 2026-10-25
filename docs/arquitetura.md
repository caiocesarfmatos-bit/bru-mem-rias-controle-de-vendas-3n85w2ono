# Arquitetura do Sistema — Bru Memórias | Controle de Vendas

**Empresa:** Bru Memórias Personalizados LTDA  
**Regime Tributário:** Simples Nacional (não MEI)  
**Atividade:** Ateliê de ímãs fotográficos personalizados (5x5 cm) e papelaria afetiva  
**Localização:** Recreio dos Bandeirantes, Rio de Janeiro - RJ  
**Natureza do Sistema:** Sistema Administrativo Interno (Sem autocadastro público, uso restrito a colaboradores autorizados)  
**Moeda & Localização:** BRL (R$ com precisão decimal exata em centavos inteiros), fuso `America/Sao_Paulo` (Horário de Brasília)

---

## 1. Princípios de Arquitetura e Decisões de Design

1. **Autenticação e Autorização no Servidor:**
   - PocketBase v0.36 (Skip Cloud) operando como backend autoritativo.
   - Nenhuma autorização baseia-se exclusivamente em ocultação visual de botões.
   - Perfis de usuário com matriz granular de permissões avaliada nas coleções e em `pb_hooks`.
   - Bloqueio progressivo de tentativas inválidas e expiração de sessão por inatividade.
2. **Proibição de Dados em Ponto Flutuante:**
   - Todo valor monetário (preços, subtotais, descontos, acréscimos, totais, custos, parcelas, saldos) é armazenado em centavos inteiros (`integer`), eliminando dízimas e imprecisões binárias.
   - Multiplicações e divisões utilizam arredondamento monetário estrito (meio para cima) com tolerância zero em somatórios.
3. **Imutabilidade e Trilha Contábil/Estoque Reversa:**
   - Movimentações de estoque (`movimento_estoque`) e lançamentos financeiros (`lancamento_financeiro`) realizados são imutáveis.
   - Correções e estornos são efetuados exclusivamente via registros inversos vinculados com justificativa e autor.
   - Nenhuma exclusão física de entidades com histórico transacional.
4. **Desacoplamento de Pessoas e Papéis:**
   - Tabela unificada `pessoas` com papéis `papel_cliente` e `papel_fornecedor`. Uma mesma entidade jurídica ou física pode atuar simultaneamente em ambos os papéis sem duplicar cadastro civil/fiscal.
5. **Normalização de Contatos e Documentos:**
   - CPF/CNPJ limpos (apenas dígitos) validados pelo algoritmo oficial dos dígitos verificadores.
   - Telefones em padrão E.164 (`+55...`).
   - CEP apenas dígitos (8 dígitos).
6. **Centralização de Domínios na TabelaDeValores:**
   - Nenhuma lista restritiva ou enum espalhado em strings soltas no código. A coleção `tabela_valores` gerencia domínios como formas de pagamento, tipos de pessoa, tipos de documento, status e papéis de contato.

---

## 2. Exclusões Conscientes

As seguintes funcionalidades foram expressamente excluídas do escopo de código por decisão de arquitetura e especificação de negócio, devendo ser mantidas fora de implementações automatizadas:

1. **Processamento Direto de Meios de Pagamento:**
   - O sistema registra e concilia pagamentos, mas não se comunica com adquirentes para captura direta de cartão de crédito nem emite ordens de transferência bancária automática.
2. **Geração Nativa de Link de Pagamento:**
   - A forma "LINK" armazena o identificador e a URL emitidos externamente pela adquirente/gateway parceiro (ex: Mercado Pago, InfinitePay, PagBank), sem geração direta de cobrança via API bancária.
3. **Emissão de Documentos Fiscais (NF-e / NFS-e / SEFAZ):**
   - Os campos fiscais em produtos e pessoas estão reservados e vazios. O cálculo tributário e emissão de notas é realizado pelo emissor contábil externo do escritório de contabilidade do Simples Nacional.
4. **Portal Público de Clientes e Autocadastro:**
   - O sistema é puramente administrativo interno. Não há área deslogada para clientes finais nem catálogo público.
5. **Demonstrações Contábeis Formais (Balanço Patrimonial / DRE Contábil com Livros Fiscais):**
   - O módulo financeiro entrega fluxo de caixa realizado e fluxo de caixa projetado com base em competência e liquidação. Relatórios fiscais contábeis formais cabem à contabilidade contratada.
6. **Publicação em Lojas de Aplicativos (Google Play / App Store / PWA Nativo):**
   - A entrega foca na aplicação web responsiva. Manuais de empacotamento e checklists de publicação constam como documentação técnica (`docs/checklist_envio_lojas.md`).
7. **Migração Automática de Dados Legados:**
   - Sem carga cega de bancos desnormalizados anteriores; especificou-se o roteiro de deduplicação e saneamento de cadastros.
8. **Segundo Fator de Autenticação (2FA / TOTP) via Hardware/App:**
   - Devido às restrições nativas do ambiente da plataforma, a segurança compensatória foi estabelecida com: política de senhas fortes, bloqueio progressivo por tentativas falhas, expiração por inatividade, autorização server-side em todas as rotas e log de auditoria imutável.

---

## 3. Pendência de Asset de Marca

- **Registro de Pendência:** Os arquivos de emblema citados na especificação (`adapta-image-1792942222020-1.png` e `37C9FB9F-D32A-43C0-B43B-75C069F4E7CA.png`) **não foram recebidos no repositório**.
- **Ação Tomada:** Preservada rigorosamente a identidade visual estabelecida da marca:
  - Rosa Choque (`#FF1493`)
  - Marrom Escuro (`#4E342E`)
  - Branco Puro (`#FFFFFF`) e Rosa Claro (`#FFF0F5`)
  - Logotipo em tipografia cursiva ("Bru") + serifada elegante ("Memórias") e ícone vetorial de polaroids sobrepostas com coração.
- **Regra:** Não inventar emblemas não fornecidos nem substituir a identidade oficial da Bru Memórias.

---

## 4. Limites Operacionais e Otimização de Recursos

1. **Volume de Armazenamento:**
   - Índices SQLite com cardinalidade específica cobrindo foreign keys, documentos de pessoa e chaves de idempotência.
2. **Ponto Flutuante:**
   - Sem tipos `float` para cálculo financeiro; todos os cálculos multiplicam `quantidade * preco_centavos` e consolidam arredondamento inteiro.
3. **Segurança OWASP ASVS:**
   - Todas as regras de API das coleções do PocketBase exigem autenticação ativa (`@request.auth.id != ''`) e verificação do perfil do usuário em coleções críticas.
