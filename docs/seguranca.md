# Segurança, Contra Senha de Login e Código Restrito de Acesso do Administrador

## 1. Contra Senha Obrigatória no Login de Acesso

Para proteger o acesso ao painel contra acessos indevidos e credenciais vazadas, o sistema adota uma etapa obrigatória de **Contra Senha** após a autenticação de primeiro nível (e-mail + senha):

- **Código Oficial do Sistema:** O código mestre padrão configurado no servidor é `501698`.
- **Abrangência Total:** Todos os perfis cadastrados no sistema (`administrador`, `gestor`, `vendedor`, `operador_caixa`, `estoquista` e `consulta`) passam obrigatoriamente por essa verificação ao realizar login. Nenhum perfil possui bypass automático.
- **Armazenamento Seguro:** A contra senha **NUNCA** fica gravada no código do cliente (front-end) nem em texto puro no bundle da aplicação. No servidor Skip Cloud (PocketBase), ela é armazenada na coleção de controle restrito `parametros_seguranca` sob a chave `CONTRA_SENHA_LOGIN` em formato **Hash SHA-256 irreversível**.
- **Validação 100% Server-Side:** A validação é realizada exclusivamente pelo hook autenticado em `/backend/v1/sistema/auth/validar-contra-senha`. O servidor calcula o hash SHA-256 do código recebido e efetua a verificação por meio de **comparação em tempo constante (bitwise XOR)** para prevenir ataques de temporização (timing attacks).
- **Rate Limit Progressivo e Bloqueio:** O servidor conta as tentativas falhas consecutivas:
  - 3 tentativas incorretas: bloqueio temporário por 30 segundos.
  - 5 tentativas incorretas: bloqueio temporário por 60 segundos.
  - 7 ou mais tentativas incorretas: bloqueio por 300 segundos (5 minutos).
    Tentativas durante o período de bloqueio são rejeitadas com status HTTP `429 Too Many Requests`.
- **Trilha de Auditoria Obrigatória:** Toda tentativa de validação da contra senha — seja autorizada com sucesso (`CONTRA_SENHA_ACEITA`) ou recusada por código inválido (`CONTRA_SENHA_INCORRETA`) — é registrada de forma imutável na coleção `logs_auditoria` com e-mail, perfil, timestamp ISO, IP de origem e contagem de tentativas.
- **Proteção contra Bypass no Servidor:** O status de liberação da sessão do usuário é gerenciado pelo campo restrito `contra_senha_liberada` na coleção `users`. As regras de API (RLS) de todas as coleções de negócio impedem consultas de clientes sem a sessão devidamente liberada. Adicionalmente, chamadas diretas de atualização ao campo `contra_senha_liberada` são bloqueadas por regra de API (`@request.body.contra_senha_liberada:changed = false`).
- **Encerramento da Sessão:** A opção "Sair" na tela de contra senha aciona o endpoint `/backend/v1/sistema/auth/resetar-contra-senha-sessao`, limpa a sessão local e remove o token de autenticação do PocketBase, exigindo e-mail, senha e contra senha novamente no próximo acesso.
- **Design e Experiência do Usuário:** Tela minimalista e centrada na identidade visual oficial da marca Bru Memórias (emblema oficial e tokens de cor), teclado numérico padrão (`inputmode="numeric"`), botões com alvo de toque mínimo de 44px otimizados para Safari/iPhone e texto exato: _"Digite a contra senha"_. Sem números decorativos desnecessários.

## 2. Código Restrito de Acesso do ADM (Criação de Usuários)

Para impedir criação indevida de novos usuários, bypass e elevação não autorizada de privilégios, o sistema exige um Código Restrito de Acesso exclusivo do Administrador.

- **Armazenamento Seguro:** O código restrito **NUNCA** fica gravado no código do cliente (front-end) nem em texto puro. No banco de dados, ele é protegido na coleção de acesso restrito `parametros_seguranca` em formato Hash **SHA-256** não reversível. As regras de API da coleção `parametros_seguranca` são totalmente travadas (`listRule: null`, `viewRule: null`, `createRule: null`, `updateRule: null`, `deleteRule: null`), impedindo qualquer leitura ou escrita direta por requisições de clientes comuns.
- **Validação no Servidor (pb_hooks):** A validação ocorre 100% no servidor através do endpoint autenticado `/backend/v1/sistema/usuarios/criar-com-codigo`. O servidor calcula o hash SHA-256 do código informado e efetua a verificação utilizando **comparação em tempo constante** (mitigação de timing attacks).
- **Trilha de Auditoria Obrigatória:** Toda e qualquer tentativa de uso do código restrito (seja autorizada ou recusada por código inválido, ausente ou por usuário não-administrador) é gravada na coleção `logs_auditoria` com status, IP/origem, identificador do usuário e timestamp.
- **Proteção contra Bypass:** Caso um usuário tente disparar chamadas diretas ao endpoint de cadastro sem o código ou com credenciais insuficientes, a requisição é barrada no servidor com código HTTP `403 Forbidden` e a tentativa de bypass fica auditada.

## 3. Como o Administrador Troca o Código Restrito no Futuro

O Administrador pode atualizar o código restrito a qualquer momento com total segurança:

1. No painel web: acesse a aba **"Usuários e Acesso"** e clique no botão **"Alterar Código Restrito ADM"**.
2. O sistema exige a confirmação do código restrito atual e o preenchimento do novo código (mínimo de 6 dígitos).
3. A requisição é enviada ao endpoint seguro `/backend/v1/sistema/usuarios/alterar-codigo-restrito`, que valida o código atual em tempo constante e recalcula o hash SHA-256 do novo código, atualizando o registro no servidor sem expor o valor.
4. O evento de troca do código é auditado na trilha de segurança do sistema.
