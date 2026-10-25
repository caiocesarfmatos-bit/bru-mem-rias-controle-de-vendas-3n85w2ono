# Checklist de Envio para Lojas de Aplicativos (Google Play & Apple App Store)

_Nota de Arquitetura:_ O projeto atual é uma aplicação web responsiva (SaaS Interno Administrativo). A distribuição em lojas mobile está fora do escopo de compilação da v1 e encontra-se documentada aqui para etapas futuras.

---

## 1. Google Play Store (Android TWA / Capacitor)

- [ ] Criar conta Google Play Developer Console (taxa única de US$ 25).
- [ ] Configurar Chave de Assinatura (Keystore JKS / PKCS12) armazenada de forma segura em cofre de chaves.
- [ ] Gerar arquivo `assetlinks.json` no domínio com a hash SHA-256 do certificado de assinatura para habilitar Digital Asset Links (navegação sem barra do navegador no TWA).
- [ ] Definir ícones adaptativos (512x512 png sem transparência) e splash screen com fundo rosa `#FF1493`.
- [ ] Preencher questionário de classificação etária (livre para software de produtividade corporativa).
- [ ] Declaração de Política de Privacidade pública acessível via URL HTTPS.
- [ ] Criação de credenciais de teste para a equipe de revisão do Google.

---

## 2. Apple App Store (iOS via Capacitor / WKWebView)

- [ ] Assinar o Apple Developer Program corporativo (US$ 99/ano).
- [ ] Configurar Bundle Identifier (ex: `br.com.brumemorias.admin`).
- [ ] Gerar Certificados de Distribuição iOS e Provisioning Profiles no portal da Apple.
- [ ] Configurar `apple-app-site-association` (AASA) para Universal Links.
- [ ] Adequar App Sandbox, permissões no `Info.plist` (câmera apenas se houver leitor de código de barras futuro).
- [ ] Respeitar diretrizes da Seção 4.2 das App Store Review Guidelines (fornecer valor nativo além de simples encapsulamento web).
- [ ] Fornecer usuário e senha de demonstração no formulário App Review Information.

---

## 3. Requisitos PWA (Progressive Web App)

- [ ] Arquivo `manifest.json` com `name`, `short_name`, `start_url`, `display: standalone`, `background_color: #FFFFFF` e `theme_color: #FF1493`.
- [ ] Service Worker para cache de assets estáticos (HTML/CSS/JS/SVGs) e tela offline informativa ("Sem conexão com a nuvem Skip").
- [ ] Ícones nas resoluções 192x192 e 512x512 com `purpose: any maskable`.
