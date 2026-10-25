# Procedimentos de Backup e Restauração — Bru Memórias

**Projeto:** Bru Memórias | Controle de Vendas  
**Versão Atual:** 0.0.12  
**Infraestrutura:** Frontend React (Vite + TS + Tailwind + shadcn/ui) / Backend Skip Cloud (PocketBase v0.36)  
**Ambiente de Produção:** https://bru-memorias-controle-de-vendas-e3d25.goskip.app

---

## 1. Princípio Fundamental de Engenharia

> **"Backup sem teste de restauração não conta como backup."**  
> _(Regra mandatória do projeto Bru Memórias)_

Ter um arquivo `.zip` ou `.json` gerado não comprova que a operação poderá ser continuada após um desastre. Um backup só é considerado válido após ser restaurado em ambiente isolado (staging ou local) e submetido aos testes de integridade referencial e às regras transacionais do negócio (R1–R14).

---

## 2. Níveis de Backup Disponíveis no Sistema

O sistema conta com três níveis complementares de proteção:

| Nível                                    | Escopo                                                                                                  | Ferramenta                                            | Frequência Recomendada                    |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------- |
| **Nível 1: Snapshot Físico Skip Cloud**  | Arquivo SQLite completo (`data.db`), coleções, registros e arquivos de mídia.                           | Painel Administrativo Skip Cloud / PocketBase         | Diário / Semanal (antes de upgrades)      |
| **Nível 2: Snapshot Lógico JSON do App** | 21 coleções operacionais completas via endpoint autenticado `POST /backend/v1/sistema/exportar-backup`. | Módulo "Backup & Legado v5" na Central Administrativa | Diário / Sob demanda do Administrador     |
| **Nível 3: Backup do Legado v5**         | Chaves do navegador (`localStorage`) da versão anterior 100% local.                                     | Assistente de importação na Central Administrativa    | Execução única pré-implantação definitiva |

---

## 3. Procedimento de Backup pelo Painel Skip Cloud (Snapshot Físico)

1. Acesse o painel de administração da instância Skip Cloud PocketBase.
2. Navegue até a aba **Settings (Configurações)** > **Backups**.
3. Clique em **Create Backup (Criar Backup)**.
4. O sistema gera um arquivo compactado contendo:
   - `data.db` (banco de dados SQLite com todas as tabelas, índices e triggers);
   - Diretório de uploads e mídias (`pb_data/storage`).
5. Faça o download imediato do arquivo gerado para armazenamento externo seguro (Google Drive institucional ou cofre de arquivos criptografado).

---

## 4. Procedimento de Backup Lógico JSON pelo Aplicativo

1. Faça login no aplicativo com uma conta de perfil **Administrador** (ex.: `caiocesarfmatos@gmail.com`).
2. No menu superior da **Central Administrativa**, clique em **Backup & Legado v5**.
3. No cartão **Backup Integral do Servidor**, clique em **Exportar Backup Completo do Servidor (JSON)**.
4. O backend Skip Cloud executa a função server-side (`/backend/v1/sistema/exportar-backup`), que:
   - Valida a autenticação e o perfil do usuário no servidor;
   - Varre as 21 coleções operacionais: `tabela_valores`, `pessoas`, `papel_cliente`, `papel_fornecedor`, `contatos`, `enderecos`, `redes_sociais`, `categorias_produto`, `produtos`, `tabelas_preco`, `precos_produto`, `produto_fornecedor`, `locais_estoque`, `movimento_estoque`, `pedidos_venda`, `itens_pedido`, `pagamentos_pedido`, `contas_financeiras`, `categorias_financeiras`, `lancamentos_financeiros`, `logs_auditoria`;
   - Registra o evento na trilha de auditoria (`logs_auditoria`) preservando a privacidade (sem gravar dados pessoais no log);
   - Dispara o download automático do arquivo nomeado com timestamp:  
     `backup_completo_servidor_bru_memorias_YYYY-MM-DDTHH-mm-ss.json`.

---

## 5. Procedimento de Teste de Restauração Passo a Passo

Para cumprir a regra mandatória, execute este teste no mínimo a cada 30 dias ou antes de qualquer manutenção estrutural:

### Passo 1: Preparação do Ambiente de Teste

- Nunca realize o teste de restauração diretamente no banco principal de produção sem snapshot prévio.
- Utilize uma cópia da base ou crie uma instância de teste no Skip Cloud.

### Passo 2: Aplicação da Restauração

- **Para backup físico (`.zip` do PocketBase):**  
  Acesse **Settings > Backups**, faça upload do arquivo e clique em **Restore**. O PocketBase substitui o `data.db` e recarrega a aplicação.
- **Para backup lógico (`.json` do aplicativo):**  
  Pode ser importado via script de carga ou inspecionado para verificação de registros específicos.

### Passo 3: Checklist de Verificação Pós-Restauração

1. **Contagens de Registros:** Verifique se as contagens batem com o resumo gravado no momento da exportação:
   - Produtos e Preços vigentes
   - Pessoas (Clientes e Fornecedores)
   - Movimentos de Estoque
   - Pedidos de Venda
   - Lançamentos Financeiros
2. **Integridade de Sessão:** Realize login com a conta de Administrador e com uma conta de Vendedor.
3. **Execução da Suíte R1–R14:**
   - Acesse **Relatórios Gerenciais** > **Auditoria Automatizada de Regras**.
   - Clique em **Executar Testes R1-R14**.
   - Confirme que todas as 14 regras retornam status **APROVADO**.
4. **Ciclo de Aceite Ponta a Ponta:**
   - Clique em **Rodar Ciclo de Aceite** e confirme os 9 passos operacionais.
5. **Atestado de Validade:** Registre na planilha técnica de conformidade que o backup de data X foi restaurado e testado com sucesso.

---

## 6. Procedimento de Backup e Importação do Legado v5 (localStorage)

A versão 5 antiga do app salvava informações de clientes, custos, produtos e orçamentos exclusivamente no navegador da proprietária.

### Como a usuária deve executar:

1. A usuária deve abrir o novo aplicativo no **mesmo navegador e computador** onde costumava utilizar a v5.
2. Acessar a **Central Administrativa** com login de Administrador.
3. Entrar na aba **Backup & Legado v5**.
4. O sistema fará a varredura automática no `localStorage` procurando as chaves conhecidas (`bru-memorias.v5.data`, `bru-memorias.data.v1`, etc.).
5. Se houver dados detectados:
   - Clicar em **Baixar JSON da v5** para guardar uma cópia bruta intocada do histórico local.
   - Clicar em **Importar p/ Servidor** para transferir clientes e fornecedores para o modelo oficial do PocketBase. A rotina é **estritamente idempotente** (se rodar mais de uma vez, detecta registros já existentes por documento ou nome e não cria duplicatas).
6. Se o navegador não contiver dados (ex.: computador novo ou cache limpo), a tela informará "Sem Dados Locais", confirmando que nada do origin foi sobrescrito ou perdido.
