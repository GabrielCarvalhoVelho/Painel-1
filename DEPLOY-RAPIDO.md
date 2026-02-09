# ⚡ Deploy em 5 Minutos - Guia Rápido

> **Objetivo:** Colocar o Painel Solos.ag no ar o mais rápido possível.

---

## 🚀 Passo a Passo (Vercel - Mais Fácil)

### 1. Criar conta (30 segundos)

1. Acesse: https://vercel.com/signup
2. Clique em "Continue with GitHub"
3. Autorize a Vercel

✅ **Pronto! Conta criada.**

---

### 2. Importar projeto (1 minuto)

1. Clique em: **"Add New..." > "Project"**
2. Encontre o repositório `NovoPainel`
3. Clique em **"Import"**

✅ **Projeto importado!**

---

### 3. Configurar build (30 segundos)

Na tela de configuração:

- **Framework Preset:** Vite ✅ (auto-detectado)
- **Root Directory:** `./` ✅ (já está correto)
- **Build Command:** `npm run build` ✅ (já está correto)
- **Output Directory:** `dist` ✅ (já está correto)

**→ NÃO mude nada!** Já está tudo certo.

✅ **Build configurado!**

---

### 4. Adicionar variáveis de ambiente (2 minutos)

Clique em **"Environment Variables"** e adicione:

**🎭 MODO DEMO (para testes sem token):**

Se você quer acessar o painel direto em produção **sem precisar do token do WhatsApp**, adicione estas variáveis:

```bash
VITE_SUPABASE_URL
https://vamvzjlbmbaxotdegrfb.supabase.co

VITE_SUPABASE_ANON_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhbXZ6amxibWJheG90ZGVncmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5ODI2MjUsImV4cCI6MjA2MDU1ODYyNX0.s_cxAWDXG_wOsaRTthcucHrL422lg2IWbLdgbR99Ea8

VITE_ALLOW_DEMO_USER
true

VITE_SUPABASE_SERVICE_ROLE_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhbXZ6amxibWJheG90ZGVncmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDk4MjYyNSwiZXhwIjoyMDYwNTU4NjI1fQ.2jCUPwSEmvgf4w7_PNUqOFFPt1tsEEKezeaMO4ZreLE

VITE_SIGNED_URL_SERVER_URL
https://vamvzjlbmbaxotdegrfb.supabase.co/functions/v1/signed-url

VITE_OPENWEATHER_API_KEY
cd702c01ccee49ef1aa9fdafae2201b3

VITE_ZE_AMBIENTE
production

VITE_WHATSAPP_WEBHOOK_URL
https://zedasafra.app.n8n.cloud/webhook/enviar-documento-whatsapp
```

**⚠️ IMPORTANTE:**
- `VITE_ALLOW_DEMO_USER=true` ativa o acesso direto (sem token)
- `VITE_SUPABASE_SERVICE_ROLE_KEY` é necessária para o modo demo funcionar
- **Modo demo é ideal para homologação/testes** - veja detalhes em [MODO-DEMO-PRODUCAO.md](./MODO-DEMO-PRODUCAO.md)

**Dica:** Cole cada nome no campo "Key" e o valor no campo "Value".

✅ **Variáveis configuradas!**

---

### 5. Fazer deploy (1 minuto)

1. Clique em **"Deploy"**
2. Aguarde ~1-2 minutos

✅ **DEPLOY CONCLUÍDO! 🎉**

---

## 🌐 Acessar seu site

Após o deploy, você verá:

```
🎉 Congratulations!
Your project is now live at: https://seu-projeto.vercel.app
```

**Clique no link e teste seu painel!**

---

## ✅ Checklist Final (30 segundos)

Teste no site:

- [ ] Site carrega?
- [ ] Dashboard aparece automaticamente (modo demo)?
- [ ] Dados aparecem no dashboard?

✅ **Tudo funcionando? Parabéns! 🚀**

**💡 Nota:** Se você ativou o modo demo (`VITE_ALLOW_DEMO_USER=true`), o painel abre automaticamente. Se não ativou, verá a tela "Acesso Restrito" - isso é normal!

---

## 🔧 Se algo deu errado

### Página em branco?

1. Abra o console do navegador (F12)
2. Procure por erros em vermelho
3. Provavelmente é variável de ambiente errada

### Erro de build?

1. Na Vercel, clique em **"Deployments"**
2. Clique no deploy que falhou
3. Veja o log do erro
4. Geralmente é falta de variável de ambiente

### Ainda não funciona?

Leia o guia completo: [DEPLOY.md](./DEPLOY.md)

---

## 🎯 Próximos Passos

Agora que está no ar:

1. **Adicione um domínio personalizado** (opcional)
   - Na Vercel: Settings > Domains
   
2. **Configure o Supabase**
   - Adicione a URL do Vercel em: Supabase > Settings > API > Site URL
   
3. **Compartilhe com o time!**

---

## ⏱️ Tempo Total

- ✅ Criar conta: 30s
- ✅ Importar: 1min
- ✅ Configurar: 30s
- ✅ Variáveis: 2min
- ✅ Deploy: 1min

**TOTAL: ~5 minutos** ⚡

---

**Dúvidas?** Veja o guia completo em [DEPLOY.md](./DEPLOY.md)

**Quer escolher outra plataforma?** Veja [PLATAFORMAS-DEPLOY.md](./PLATAFORMAS-DEPLOY.md)
