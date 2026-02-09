# 🎭 Modo Demo em Produção - Guia Rápido

## 🎯 O que foi feito?

Implementei um **modo demo** que permite acessar o painel em produção **sem precisar do token do n8n**. Isso é útil para:

- ✅ Demonstrações para clientes
- ✅ Testes em produção
- ✅ Desenvolvimento/homologação

---

## 🚀 Como Ativar

### 1️⃣ Adicione as variáveis na Vercel

Vá em: **Settings > Environment Variables**

Adicione estas **2 novas variáveis**:

```bash
VITE_ALLOW_DEMO_USER
true

VITE_SUPABASE_SERVICE_ROLE_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhbXZ6amxibWJheG90ZGVncmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDk4MjYyNSwiZXhwIjoyMDYwNTU4NjI1fQ.2jCUPwSEmvgf4w7_PNUqOFFPt1tsEEKezeaMO4ZreLE
```

### 2️⃣ Fazer redeploy

Depois de adicionar as variáveis:

1. Vá em **Deployments**
2. Clique nos **3 pontinhos** do último deploy
3. Clique em **"Redeploy"**
4. Aguarde ~1-2 minutos

### 3️⃣ Testar

Acesse a URL do Vercel direto (sem token):

```
https://seu-projeto.vercel.app
```

✅ **Deve entrar automaticamente com "Usuário Demo"!**

---

## 🔍 Como Funciona

### Comportamento Normal (Produção):
```
URL sem token → Tela "Acesso Restrito" ❌
URL com token → Dashboard com dados do usuário ✅
```

### Comportamento com Modo Demo:
```
URL sem token → Dashboard com "Usuário Demo" ✅
URL com token → Dashboard com dados do usuário ✅
```

---

## ⚠️ SEGURANÇA - IMPORTANTE

### O que acontece quando ativa o modo demo:

- ✅ Sistema usa `VITE_SUPABASE_SERVICE_ROLE_KEY` (bypass de RLS)
- ⚠️ A service role key fica **exposta** no bundle JavaScript
- ⚠️ Qualquer pessoa pode inspecionar e pegar a chave

### 🔒 É seguro?

**Depende do seu caso de uso:**

| Cenário | Seguro? | Recomendação |
|---------|---------|--------------|
| Homologação/Staging | ✅ SIM | Perfeito para testes |
| Demo para clientes | ⚠️ MÉDIO | OK se dados não são sensíveis |
| Produção com dados reais | ❌ NÃO | Use autenticação via token |
| MVP/Teste de conceito | ✅ SIM | Ideal para validação rápida |

### 🛡️ Recomendações de Segurança:

1. **Para produção real:** Desative o modo demo
2. **Para homologação:** Pode deixar ativo
3. **Para demos:** Use dados fictícios/mockados
4. **Monitore:** Verifique logs do Supabase regularmente

---

## 🔧 Como Desativar (Produção Real)

Quando quiser desativar o modo demo:

### Na Vercel:

1. **Settings > Environment Variables**
2. **DELETE** a variável `VITE_ALLOW_DEMO_USER`
3. **DELETE** a variável `VITE_SUPABASE_SERVICE_ROLE_KEY`
4. **Redeploy**

Ou simplesmente mude para:

```bash
VITE_ALLOW_DEMO_USER=false
```

---

## 📊 Comparação: Dev vs Demo vs Produção

| Modo | Token Necessário? | RLS Ativo? | Service Role? |
|------|-------------------|------------|---------------|
| **Development** | ❌ Não | ❌ Bypass | ✅ Sim (local) |
| **Demo (Prod)** | ❌ Não | ❌ Bypass | ✅ Sim (exposto) |
| **Production** | ✅ Sim | ✅ Ativo | ❌ Não |

---

## 🎯 Modo Recomendado por Ambiente

### 🟢 Ambiente de Desenvolvimento (Local)
```bash
# .env.development
VITE_ZE_AMBIENTE=development
VITE_SUPABASE_SERVICE_ROLE_KEY=... # OK, está só local
# Não precisa VITE_ALLOW_DEMO_USER
```

### 🟡 Ambiente de Homologação/Staging (Vercel)
```bash
# Variáveis da Vercel
VITE_ALLOW_DEMO_USER=true
VITE_SUPABASE_SERVICE_ROLE_KEY=... # OK para homologação
VITE_ZE_AMBIENTE=production
```

### 🔴 Ambiente de Produção (Vercel)
```bash
# Variáveis da Vercel
VITE_ZE_AMBIENTE=production
# Não incluir VITE_ALLOW_DEMO_USER
# Não incluir VITE_SUPABASE_SERVICE_ROLE_KEY
# Apenas VITE_SUPABASE_ANON_KEY
```

---

## 💡 Alternativa: Deploy Separado para Demo

A **melhor prática** é ter 2 deploys:

### 1️⃣ Deploy de Produção (Real)
```
URL: https://painel.solos.ag
Modo: Autenticação via token
Service Role: NÃO exposta
```

### 2️⃣ Deploy de Demo (Homologação)
```
URL: https://demo-painel.vercel.app
Modo: VITE_ALLOW_DEMO_USER=true
Service Role: Exposta (OK para demo)
Dados: Mockados ou de teste
```

**Como fazer:**
1. Faça outro deploy na Vercel do mesmo repositório
2. Configure `VITE_ALLOW_DEMO_USER=true` só no deploy de demo
3. Use dados diferentes (banco de homologação)

---

## 🧪 Testando Localmente

Para testar o modo demo localmente antes de fazer deploy:

```bash
# 1. Criar .env.demo
cat > .env.demo << 'EOF'
VITE_SUPABASE_URL=https://vamvzjlbmbaxotdegrfb.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_ALLOW_DEMO_USER=true
VITE_SUPABASE_SERVICE_ROLE_KEY=...
VITE_ZE_AMBIENTE=production
EOF

# 2. Build com .env.demo
cp .env.demo .env.production
npm run build

# 3. Testar
npm run preview
# Acesse http://localhost:4173
```

---

## ✅ Checklist de Ativação

- [ ] Adicionada variável `VITE_ALLOW_DEMO_USER=true` na Vercel
- [ ] Adicionada variável `VITE_SUPABASE_SERVICE_ROLE_KEY` na Vercel
- [ ] Feito redeploy
- [ ] Testado acesso direto (sem token)
- [ ] Dashboard carrega com "Usuário Demo"
- [ ] Dados do usuário c7f13743-67ef-45d4-807c-9f5de81d4999 aparecem

---

## 🐛 Troubleshooting

### Ainda pede token

**Solução:**
1. Verifique se as variáveis foram adicionadas corretamente
2. Confirme que fez **Redeploy** (não basta adicionar variáveis)
3. Limpe cache do navegador (Ctrl + Shift + R)

### Erro 403 ou dados não carregam

**Solução:**
1. Verifique se `VITE_SUPABASE_SERVICE_ROLE_KEY` está correta
2. Abra o console (F12) e veja se aparece "🎭 MODO DEMO ATIVO"
3. Verifique se o log mostra "SERVICE_ROLE (⚠️ BYPASS RLS)"

### Console mostra erros de autenticação

**Solução:**
1. Limpe localStorage:
```javascript
localStorage.removeItem('ze_safra_token')
location.reload()
```

---

## 📞 Resumo Executivo

**Para ativar modo demo em produção:**

1. ➕ Adicionar `VITE_ALLOW_DEMO_USER=true` na Vercel
2. ➕ Adicionar `VITE_SUPABASE_SERVICE_ROLE_KEY=...` na Vercel
3. 🔄 Redeploy
4. ✅ Pronto! Acesso direto funciona

**Tempo estimado:** 2 minutos

---

**Última atualização:** Fevereiro 2026
