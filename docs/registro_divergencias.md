# Registro de Divergências de Decisões — Bru Memórias

Conforme orientação do Prompt de Reconstrução, registram-se abaixo as decisões padrão assumidas e a justificativa para cada item:

1. **Venda a prazo incluída com contas a receber:**  
   _Justificativa:_ Fundamental para o ateliê permitir faturamento para eventos e parcerias corporativas com pagamento pós-entrega ou parcelado.

2. **Emissão fiscal fora da v1 (campos reservados e vazios):**  
   _Justificativa:_ O ateliê opera sob o Simples Nacional e realiza a emissão consolidada diretamente no emissor contratado da contabilidade, evitando complexidade de certificados digitais A1 no navegador.

3. **Produto com múltiplos fornecedores (relação N:N):**  
   _Justificativa:_ Insumos gráficos fundamentais (papel fotográfico glossy e mantas magnéticas) possuem múltiplos distribuidores com custos e prazos distintos.

4. **Controle de lote e validade opcional por produto:**  
   _Justificativa:_ Ímãs finalizados não possuem validade curta, mas tintas e papéis químicos exigem rastreio de lote para controle de qualidade da cor.

5. **Múltiplos locais de estoque com padrão semeado ("Ateliê Principal Recreio"):**  
   _Justificativa:_ Atende à operação atual em endereço único permitindo expansão futura para quiosques ou mostruários em eventos.

6. **Caixa realizado e caixa projetado em visões separadas:**  
   _Justificativa:_ Atende ao princípio contábil de competência vs. liquidação, permitindo prever inadimplência ou fluxo futuro sem contaminar o saldo físico atual.

7. **Uma tabela de preço padrão semeada com suporte a múltiplas:**  
   _Justificativa:_ O ateliê pratica preços para consumidor final no varejo e preços diferenciados para fotógrafos e cerimonialistas parceiros.

8. **Pessoa física e jurídica na mesma base com validação estrita:**  
   _Justificativa:_ Clientes corporativos contratam brindes para empresas e clientes finais contratam lembranças de família; unificar evita duplicidade e permite ao parceiro atuar como cliente e fornecedor.

9. **Estoque negativo bloqueado por padrão:**  
   _Justificativa:_ Garante consistência física real das peças produzidas e impede promessas de entrega sem insumo em bancada.

10. **Migração de legados fora da v1:**  
    _Justificativa:_ Os dados anteriores em localStorage careciam de integridade referencial de CPF/CNPJ; o saneamento deve ser assistido para não corromper o banco relacional.

11. **Forma de pagamento no cliente como preferência:**  
    _Justificativa:_ Facilita o atendimento pré-preenchendo a opção usual do cliente sem engessar caso ele decida alterar na hora da conclusão do pedido.

12. **Pendência de asset de marca:**  
    _Justificativa:_ Os arquivos referidos na especificação não foram transferidos no repositório; manteve-se a identidade visual original sem criar elementos falsos.
