# 🚀 Guia de Deploy - Painel Solos.ag

Este guia apresenta as melhores opções para fazer deploy do Painel Solos.ag em produção.

---

## 📊 Comparação Rápida de Plataformas

| Plataforma | Facilidade | Custo | CDN Global | SSL | CI/CD Automático |
|------------|-----------|-------|------------|-----|------------------|
| **Vercel** | ⭐⭐⭐⭐⭐ | Grátis (Hobby) | ✅ | ✅ | ✅ |
| **Netlify** | ⭐⭐⭐⭐⭐ | Grátis (Starter) | ✅ | ✅ | ✅ |
| **Cloudflare Pages** | ⭐⭐⭐⭐ | Grátis (ilimitado) | ✅ | ✅ | ✅ |
| **AWS Amplify** | ⭐⭐⭐ | Pago | ✅ | ✅ | ✅ |
| **Hostinger/VPS** | ⭐⭐ | Pago | ❌ | Manual | ❌ |

---

## 🎯 Opção Recomendada: Vercel (Deploy em 5 minutos)

### 1️⃣ Pré-requisitos

- Conta no GitHub (projeto já deve estar em um repositório)
- Conta na Vercel (gratuita): https://vercel.com

### 2️⃣ Passos para Deploy

#### A. Via Interface Web (Mais Fácil)

1. **Acesse:** https://vercel.com/new
2. **Importe o repositório:** 
   - Clique em "Import Git Repository"
   - Selecione seu repositório no GitHub
3. **Configure o projeto:**
   - **Framework Preset**: Vite
   - **Root Directory**: `.` (raiz)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Adicione as variáveis de ambiente:**

```env
VITE_SUPABASE_URL=https://vamvzjlbmbaxotdegrfb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhbXZ6amxibWJheG90ZGVncmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5ODI2MjUsImV4cCI6MjA2MDU1ODYyNX0.s_cxAWDXG_wOsaRTthcucHrL422lg2IWbLdgbR99Ea8
VITE_SIGNED_URL_SERVER_URL=https://vamvzjlbmbaxotdegrfb.supabase.co/functions/v1/signed-url
VITE_OPENWEATHER_API_KEY=cd702c01ccee49ef1aa9fdafae2201b3
VITE_ZE_AMBIENTE=production
VITE_WHATSAPP_WEBHOOK_URL=https://zedasafra.app.n8n.cloud/webhook/enviar-documento-whatsapp
```

5. **Clique em "Deploy"** e aguarde ~2 minutos

✅ **Pronto!** Seu site estará no ar em uma URL tipo: `https://seu-projeto.vercel.app`

#### B. Via CLI (Para Desenvolvedores)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Fazer login
vercel login

# Na raiz do projeto, executar
vercel

# Seguir os prompts:
# - Set up and deploy? Yes
# - Which scope? [sua conta]
# - Link to existing project? No
# - Project name? [painel-solos-ag]
# - Directory? ./
# - Override settings? No

# Deploy em produção
vercel --prod
```

### 3️⃣ Configuração Adicional (Opcional)

#### Domínio Personalizado

1. No dashboard da Vercel, vá em **Settings > Domains**
2. Adicione seu domínio (ex: `painel.solos.ag`)
3. Configure os DNS conforme instruções da Vercel

#### Configurar Redirects/Rewrites

Crie o arquivo `vercel.json` na raiz:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

---

## 🔵 Alternativa 2: Netlify

### Deploy Rápido

1. **Acesse:** https://app.netlify.com
2. **Clique em:** "Add new site" > "Import an existing project"
3. **Selecione:** GitHub e escolha o repositório
4. **Configure:**
   - Build command: `npm run build`
   - Publish directory: `dist`
5. **Adicione as variáveis de ambiente** (mesmo conteúdo acima)
6. **Deploy site**

### Via CLI

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

---

## 🟠 Alternativa 3: Cloudflare Pages

### Deploy via Dashboard

1. **Acesse:** https://dash.cloudflare.com
2. **Vá em:** Workers & Pages > Create application > Pages > Connect to Git
3. **Selecione** seu repositório
4. **Configure:**
   - Framework preset: Vite
   - Build command: `npm run build`
   - Build output directory: `dist`
5. **Adicione as variáveis de ambiente**
6. **Save and Deploy**

**Vantagem:** Cloudflare tem CDN global extremamente rápido e plano gratuito ilimitado!

---

## 🟡 Alternativa 4: AWS Amplify

### Deploy via Console AWS

1. **Acesse:** AWS Console > AWS Amplify
2. **Clique em:** "New app" > "Host web app"
3. **Conecte** ao GitHub
4. **Configure o build:**

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

5. **Adicione as variáveis de ambiente**
6. **Save and deploy**

---

## 🔴 Alternativa 5: Build Manual + VPS

Se você tem um VPS (Hostinger, DigitalOcean, AWS EC2, etc):

### 1. Build Local

```bash
# Na raiz do projeto
npm install
npm run build
```

Isso gera a pasta `dist/` com os arquivos estáticos.

### 2. Upload para Servidor

```bash
# Via SCP (exemplo)
scp -r dist/* usuario@seu-servidor.com:/var/www/html/
```

### 3. Configurar Nginx

Crie `/etc/nginx/sites-available/painel-solos`:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    root /var/www/html;
    index index.html;

    # Servir SPA corretamente
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache para assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/painel-solos /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. SSL com Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com
```

---

## 🔐 Checklist de Segurança Pré-Deploy

- [ ] **NUNCA expor** `VITE_SUPABASE_SERVICE_ROLE_KEY` em produção
- [ ] Verificar se RLS (Row Level Security) está ativo no Supabase
- [ ] Configurar CORS correto no Supabase (Settings > API)
- [ ] Usar apenas `VITE_SUPABASE_ANON_KEY` no frontend
- [ ] Revisar políticas de acesso do Supabase Storage
- [ ] Habilitar rate limiting no Supabase (se disponível)
- [ ] Configurar domínios permitidos no Supabase

---

## 🐛 Troubleshooting

### Erro: "Failed to load module"

**Solução:** Limpar cache do build

```bash
rm -rf node_modules dist
npm install
npm run build
```

### Erro: "Supabase client not initialized"

**Solução:** Verificar variáveis de ambiente no dashboard da plataforma

### Página em branco após deploy

**Solução:** Configurar SPA routing (ver seção de cada plataforma)

### Erro de CORS

**Solução:** Adicionar o domínio de produção no Supabase:
- Dashboard Supabase > Settings > API > Site URL

---

## 📊 Monitoramento Pós-Deploy

### Vercel Analytics (Gratuito)

```bash
npm i @vercel/analytics
```

```tsx
// src/main.tsx
import { inject } from '@vercel/analytics';
inject();
```

### Sentry (Erro Tracking)

```bash
npm i @sentry/react
```

```tsx
// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: import.meta.env.MODE
});
```

---

## ✅ Próximos Passos Após Deploy

1. [ ] Testar todas as funcionalidades em produção
2. [ ] Configurar domínio personalizado
3. [ ] Adicionar analytics (Google Analytics ou Vercel Analytics)
4. [ ] Configurar backups do Supabase
5. [ ] Implementar monitoring de erros (Sentry)
6. [ ] Documentar URL de produção no README.md
7. [ ] Configurar CI/CD para deploys automáticos

---

## 📞 Suporte

Em caso de dúvidas:
- 📧 Suporte Vercel: https://vercel.com/support
- 📚 Docs Supabase: https://supabase.com/docs
- 🐛 Issues: [Abrir issue no repositório]

---

**Boa sorte com o deploy! 🚀**
