# Segurança e Código Restrito de Acesso do Administrador

## 1. Código Restrito de Acesso do ADM

Para impedir criação indevida de usuários, bypass e elevação não autorizada de privilégios, o sistema exige um Código Restrito de Acesso exclusivo do Administrador.

- **Armazenamento Seguro:** O código restrito **NUNCA** fica gravado no código do cliente (front-end) nem em texto puro. No banco de dados, ele é protegido na coleção de acesso restrito `parametros_seguranca` em formato Hash **SHA-256** não reversível. As regras de API da coleção `parametros_seguranca` são totalmente travadas (`listRule: null`, `viewRule: null`, `createRule: null`, `updateRule: null`, `deleteRule: null`), impedindo qualquer leitura ou escrita direta por requisições de clientes comuns.
- **Validação no Servidor (pb_hooks):** A validação ocorre 100% no servidor através do endpoint autenticado `/backend/v1/sistema/usuarios/criar-com-codigo`. O servidor calcula o hash SHA-256 do código informado e efetua a verificação utilizando **comparação em tempo constante** (mitigação de timing attacks).
- **Trilha de Auditoria Obrigatória:** Toda e qualquer tentativa de uso do código restrito (seja autorizada ou recusada por código inválido, ausente ou por usuário não-administrador) é gravada na coleção `logs_auditoria` com status, IP/origem, identificador do usuário e timestamp.
- **Proteção contra Bypass:** Caso um usuário tente disparar chamadas diretas ao endpoint de cadastro sem o código ou com credenciais insuficientes, a requisição é barrada no servidor com código HTTP `403 Forbidden` e a tentativa de bypass fica auditada.

## 2. Como o Administrador Troca o Código Restrito no Futuro

O Administrador pode atualizar o código restrito a qualquer momento com total segurança:

1. No painel web: acesse a aba **"Usuários e Acesso"** e clique no botão **"Alterar Código Restrito ADM"**.
2. O sistema exige a confirmação do código restrito atual e o preenchimento do novo código (mínimo de 6 dígitos).
3. A requisição é enviada ao endpoint seguro `/backend/v1/sistema/usuarios/alterar-codigo-restrito`, que valida o código atual em tempo constante e recalcula o hash SHA-256 do novo código, atualizando o registro no servidor sem expor o valor.
4. O evento de troca do código é auditado na trilha de segurança do sistema.
