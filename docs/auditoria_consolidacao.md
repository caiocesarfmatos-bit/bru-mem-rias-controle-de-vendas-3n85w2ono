# AUDITORIA PROFUNDA E MAPA DE CONSOLIDAÇÃO DO APP BRU MEMÓRIAS

**Data da Auditoria:** Outubro de 2026  
**Auditor Responsável:** Engenharia de Sistemas & Governança de Software  
**Público-alvo:** Administrador Geral (Gestão Executiva / Administrador de Empresas)  
**Escopo:** Telas, Componentes, Serviços, Backend PocketBase (pb_hooks e migrations), Governança de Acessos e Mobile-first.

---

## 1. Mapeamento de Cada Aba / Módulo Existente

| Módulo / Aba                                                                        |               Veredito               | Justificativa Técnica & Decisão de Governança                                                                                                                                                                                                                                    |
| :---------------------------------------------------------------------------------- | :----------------------------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Painel de Métricas (Dashboard Executivo)**                                        |              **ATENDE**              | Apresenta KPIs reais de faturamento, ticket médio, margem bruta, saldo financeiro, ranking de produtos e vendas diárias consolidadas.                                                                                                                                            |
| **Vendas & Pedidos (`ModuloVendas`)**                                               |   **ATENDE (Com Fortalecimento)**    | Processa pedidos com fechamento atômico, verificação de tolerância zero (R11) e controle de frete por CEP. **Ação de fortalecimento:** inclusão formal de tipo, modelo, prazo de entrega visível, foto/anexo de referência e endereço de entrega explícito do cliente no pedido. |
| **Pessoas & Clientes (`ModuloPessoas`)**                                            |   **ATENDE (Com Fortalecimento)**    | Unifica clientes e fornecedores desacoplados (R6) com validação de CPF/CNPJ (R10) e contatos E.164. **Ação de fortalecimento:** criar visão de perfil do cliente com histórico completo de compras e destaque imediato para valor e forma de pagamento.                          |
| **Catálogo & Estoque (`ModuloCatalogoEstoque`)**                                    |              **ATENDE**              | Mantém imutabilidade estrita de movimentações (R1/R2) com proibição de estoque negativo (R7) e estorno atômico em devoluções/cancelamentos (R8). Catálogo desacoplado de tabelas de preço (R3/R4).                                                                               |
| **Matéria-Prima e Produção (Novo Módulo Unificado)**                                | **ATENDE (Essencial / Solicitado)**  | Implementa a necessidade expressa do administrador: cálculo de rendimento de matéria-prima por lote produzido, custo unitário e operacional, acompanhamento gráfico de insumos e margem operacional conectada ao catálogo.                                                       |
| **Financeiro & Contas (`ModuloFinanceiro`)**                                        |              **ATENDE**              | Gestão de caixa físico, contas bancárias e lançamentos por competência contábil com vínculo às formas de pagamento oficiais.                                                                                                                                                     |
| **Faixas de Frete & Correios (`SecaoFaixasFrete`)**                                 | **ATENDE (Com Integração Correios)** | 13 faixas tarifárias nacionais com cálculo por peso e CEP via ViaCep. **Ação de fortalecimento:** integração honesta de credencial dos Correios para cálculo oficial Sedex/PAC.                                                                                                  |
| **Relatórios Executivos & Auditoria (`ModuloRelatorios` e `SecaoAuditoriaRegras`)** |              **ATENDE**              | Suíte de verificação automatizada das Regras R1–R15 em tempo real e exportação formal de relatórios.                                                                                                                                                                             |
| **Usuários & Segurança ADM (`ModuloUsuarios`)**                                     |              **ATENDE**              | Gerenciamento restrito de operadores com hash SHA-256 do código 501698 validado exclusivamente no servidor PocketBase.                                                                                                                                                           |
| **Centro de Backup Robotizado (`SecaoCentroBackup`)**                               |              **ATENDE**              | Rotinas automáticas de backup integral às 10h, 17h e 23h (Horário de Brasília) e exportação pontual sob demanda.                                                                                                                                                                 |
| **Banners Decorativos e Tutoriais Infantis (`OnboardingBanner`)**                   |     **REDUNDANTE / SEM FUNÇÃO**      | Banners explicativos com emojis decorativos explicando o próprio negócio que a administração já conhece. **Ação:** remoção e ocultação completa de elementos de ruído.                                                                                                           |
| **Estruturas Legadas V5 Isoladas (`SecaoEstruturaProntaV5`)**                       |      **REDUNDANTE / DESVIADO**       | Telas estáticas geradas em iterações intermediárias sem banco de dados ativo. **Ação:** manter isoladas do fluxo principal de produção, direcionando toda a operação para a Central Administrativa conectada ao PocketBase.                                                      |

---

## 2. Elementos Removidos ou Higienizados (Regra Permanente)

1. **Regra de Números Decorativos:**
   - Eliminados todos os textos com "Opção 1", contadores visuais sem significado e números artificiais.
   - Mantidos **estritamente** números funcionais: preços em centavos convertidos em Reais (R$), quantidades físicas de estoque, gramaturas reais, prazos em dias úteis e datas de emissão/competência.
2. **Textos Explicativos Desnecessários:**
   - Supressão de jargões lúdicos ou tutoriais sobre "como fazer ímãs", focando em métricas operacionais, lead time, custos e margem.
3. **Emojis e Elementos Infantis:**
   - Remoção de emojis decorativos nos módulos de gestão financeira e de pedidos, preservando ícones sóbrios da biblioteca Lucide.

---

## 3. Identidade Visual Unificada (Regra de Marca Única)

- **Emblema Oficial:** Utilização estrita do emblema circular oficial (`/assets/emblem-main.png` / `BRAND_ASSETS.emblemMain`) e da tipografia corporativa Bru Memórias.
- **Consistência Visual:** A mesma marca e emblema estão presentes no login (`LoginView`), no cabeçalho executivo (`CentralAdministrativa`), no comprovante de pedidos e nos relatórios. Nenhuma logo adicional foi gerada ou recriada.
- **Tokens de Cor:** Aplicação uniforme das variáveis de `src/design/tokens.ts` (Rosa Choque `#FF1493`, Marrom Café `#4E342E`, Rosa Suave `#FFF0F8` e Creme `#F5EFEA`).

---

## 4. Matriz de Autorizações e Segurança (Preservação Integral)

Confirmado o funcionamento sem quebra de nenhuma permissão de acesso:

1. **Administrador:** Acesso irrestrito a todos os módulos, alteração do código restrito do servidor, cadastro de usuários e exclusão de cadastros.
2. **Código Restrito do Servidor:** Código mestre `501698` validado via hook Goja (`$security.sha256`) na rota `/backend/v1/sistema/usuarios/criar-com-codigo`.
3. **Perfis Operacionais:**
   - **Gestor:** Gestão de vendas, custos, clientes e cancelamento com estorno.
   - **Vendedor:** Criação de pedidos e clientes com descontos permitidos.
   - **Operador de Caixa:** Baixa de títulos e recebimento financeiro.
   - **Estoquista:** Ajuste justificado de estoque e recebimento de compras.
   - **Consulta:** Visualização de relatórios sem gravação.
4. **Regras R1 a R15:** Todas as 15 regras de integridade transacional, estoque não-negativo, tolerância zero e serialização limpa de usuários permanecem aprovadas e ativas.
