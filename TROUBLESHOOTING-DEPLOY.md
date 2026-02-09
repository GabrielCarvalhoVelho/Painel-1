# 🔧 Troubleshooting - Deploy

## ❌ Erro: "invalid JWT: unable to parse or verify signature"

### 🔍 Causa
Você está acessando a URL do Vercel direto, mas o sistema espera um token JWT válido que vem do n8n (via WhatsApp).

### ✅ Solução Rápida

**Opção 1: Limpar token inválido**

1. Abra o Console do navegador (F12)
2. Digite e execute:
```javascript
localStorage.removeItem('ze_safra_token')
location.reload()
```

Isso vai mostrar a tela de "Acesso Restrito" corretamente.

---

**Opção 2: Gerar token de teste**

Para testar o sistema completo localmente:

```bash
# 1. Configure o JWT Secret do Supabase
export SUPABASE_JWT_SECRET="sua_secret_do_supabase"

# 2. Gere o token
node scripts/generate-test-token.js c7f13743-67ef-45d4-807c-9f5de81d4999 "Seu Nome"

# 3. Use a URL gerada para acessar
```

**Como pegar o JWT Secret:**
1. Acesse: https://supabase.com/dashboard/project/vamvzjlbmbaxotdegrfb/settings/api
2. Role até "JWT Settings"
3. Copie o "JWT Secret"

---

**Opção 3: Usar em ambiente de desenvolvimento**

Se quiser testar sem token (apenas LOCAL):

1. Altere `.env.local` ou `.env.development`:
```bash
VITE_ZE_AMBIENTE=development
```

2. Execute localmente:
```bash
npm run dev
```

Isso ativa o bypass de desenvolvimento.

---

## ❌ Erro: "Multiple GoTrueClient instances"

### 🔍 Causa
Warning do Supabase sobre múltiplas instâncias do cliente de autenticação.

### ✅ Solução
**Não é um erro crítico**, apenas um aviso. O sistema funciona normalmente.

Para remover o warning, vamos garantir singleton do Supabase client:

```typescript
// src/lib/supabase.ts - já está implementado como singleton
```

---

## ❌ Página em Branco

### 🔍 Possíveis Causas

1. **Variáveis de ambiente faltando**
2. **Erro de build**
3. **Problemas de CORS**

### ✅ Checklist

- [ ] Todas as variáveis de ambiente estão configuradas na Vercel?
- [ ] Build local funciona? (`npm run build && npm run preview`)
- [ ] Console do navegador mostra erros? (F12)
- [ ] URL do Vercel está adicionada no Supabase?

### ✅ Passo a Passo

1. **Verificar variáveis de ambiente na Vercel:**
   - Settings > Environment Variables
   - Confirme que todas as 6 variáveis estão lá

2. **Adicionar URL no Supabase:**
   - Acesse: https://supabase.com/dashboard/project/vamvzjlbmbaxotdegrfb/settings/api
   - Em "Site URL", adicione: `https://seu-projeto.vercel.app`
   - Em "Redirect URLs", adicione: `https://seu-projeto.vercel.app/**`

3. **Verificar logs de build:**
   - Na Vercel, vá em "Deployments"
   - Clique no deployment
   - Veja os logs de erro

---

## ❌ Erro 403 no Supabase

### 🔍 Causa
RLS (Row Level Security) bloqueando acesso OU token inválido.

### ✅ Solução

**Opção 1: Verificar RLS Policies**

1. Acesse o Supabase Dashboard
2. Vá em "Authentication" > "Policies"
3. Verifique se as políticas permitem acesso com `auth.uid()`

**Opção 2: Verificar token**

Execute no console do navegador:
```javascript
const token = localStorage.getItem('ze_safra_token');
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('Token payload:', payload);
  console.log('Expira em:', new Date(payload.exp * 1000));
} else {
  console.log('Nenhum token encontrado');
}
```

Se o token expirou, limpe-o:
```javascript
localStorage.removeItem('ze_safra_token');
location.reload();
```

---

## ❌ Erro: "Failed to fetch"

### 🔍 Causa
Problemas de rede ou CORS.

### ✅ Solução

1. **Verificar se o Supabase está ativo:**
   - Acesse: https://status.supabase.com

2. **Configurar CORS no Supabase:**
   - Dashboard > Settings > API
   - Em "CORS Allowed Origins", adicione:
     - `https://seu-projeto.vercel.app`
     - `http://localhost:5173` (para dev)

---

## 🚨 Fluxo Normal de Autenticação

Entenda como o sistema **deveria** funcionar:

```
1. Usuário envia "PAINEL" no WhatsApp
   ↓
2. n8n gera um JWT assinado com secret do Supabase
   ↓
3. n8n envia link: https://painel.com?token=JWT_AQUI
   ↓
4. Usuário clica no link
   ↓
5. App captura token da URL e salva no localStorage
   ↓
6. App injeta token no Supabase client
   ↓
7. Usuário autenticado - Dashboard aparece ✅
```

**Se você acessar direto sem `?token=...`:**
- Sistema mostra tela "Acesso Restrito" ✅ (comportamento correto!)

---

## 🧪 Como Testar em Produção

### Método 1: Via n8n (Produção Real)

1. Configure o workflow do n8n
2. Envie "PAINEL" no WhatsApp
3. Clique no link recebido

### Método 2: Gerar token manualmente

```bash
# Instalar jq (se não tiver)
brew install jq  # macOS
# ou
sudo apt install jq  # Linux

# Gerar token
node scripts/generate-test-token.js

# Acessar com o token
# https://seu-projeto.vercel.app?token=COLE_TOKEN_AQUI
```

### Método 3: Bypass de DEV (apenas local)

```bash
# .env.development
VITE_ZE_AMBIENTE=development
VITE_SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

# Executar
npm run dev
```

---

## 📞 Ainda com Problemas?

1. **Verifique os logs da Vercel:**
   - Dashboard > Deployments > [seu deploy] > Function Logs

2. **Verifique os logs do Supabase:**
   - Dashboard > Logs > API Logs

3. **Execute localmente:**
   ```bash
   npm run build
   npm run preview
   # Acesse http://localhost:4173
   ```

4. **Teste o script de verificação:**
   ```bash
   npm run check-deploy
   ```

---

## ✅ Checklist de Deploy Correto

- [ ] Build sem erros
- [ ] 6 variáveis de ambiente configuradas
- [ ] URL adicionada no Supabase (Site URL)
- [ ] RLS ativo no Supabase
- [ ] Consegue acessar com `?token=...`
- [ ] Tela de "Acesso Restrito" aparece sem token
- [ ] Dashboard carrega com token válido

---

**Última atualização:** Fevereiro 2026
