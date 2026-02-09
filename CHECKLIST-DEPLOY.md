# ✅ Checklist de Deploy - Painel Solos.ag

## 📋 Pré-Deploy (faça isso ANTES)

- [ ] Código commitado no GitHub
- [ ] Testes locais funcionando (`npm run dev`)
- [ ] Build local sem erros (`npm run build`)
- [ ] Lint sem erros críticos (`npm run lint`)
- [ ] Arquivo `.env.production` configurado
- [ ] RLS (Row Level Security) ativo no Supabase
- [ ] Políticas de acesso do Supabase revisadas
- [ ] Storage buckets configurados no Supabase

## 🚀 Deploy Rápido (Vercel - 5 minutos)

- [ ] Conta criada em https://vercel.com
- [ ] Repositório importado na Vercel
- [ ] Variáveis de ambiente configuradas:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
  - [ ] `VITE_SIGNED_URL_SERVER_URL`
  - [ ] `VITE_OPENWEATHER_API_KEY`
  - [ ] `VITE_ZE_AMBIENTE=production`
  - [ ] `VITE_WHATSAPP_WEBHOOK_URL`
- [ ] Build settings configurados:
  - [ ] Framework: Vite
  - [ ] Build Command: `npm run build`
  - [ ] Output Directory: `dist`
- [ ] Deploy iniciado
- [ ] Deploy concluído com sucesso
- [ ] URL de produção funcionando

## ✅ Pós-Deploy (faça isso DEPOIS)

- [ ] Testar login na URL de produção
- [ ] Testar todas as funções principais:
  - [ ] Dashboard carrega
  - [ ] Financeiro funciona
  - [ ] Estoque funciona
  - [ ] Manejo Agrícola funciona
  - [ ] Upload de anexos funciona
- [ ] Adicionar URL de produção no Supabase:
  - [ ] Settings > API > Site URL
  - [ ] Settings > Authentication > Redirect URLs
- [ ] Configurar domínio personalizado (opcional)
- [ ] Configurar analytics (opcional)
- [ ] Documentar URL de produção no README
- [ ] Enviar URL para stakeholders

## 🔐 Segurança

- [ ] `VITE_SUPABASE_SERVICE_ROLE_KEY` **NÃO** está nas variáveis de ambiente de produção
- [ ] Certificado SSL ativo (HTTPS)
- [ ] Headers de segurança configurados
- [ ] CORS configurado no Supabase
- [ ] Rate limiting ativo (se disponível)

## 🐛 Se algo der errado

### Página em branco
→ Verificar console do navegador (F12) para erros
→ Conferir variáveis de ambiente na plataforma
→ Verificar se o output directory está como `dist`

### Erro 404 ao navegar
→ Adicionar rewrite rules (já está em `vercel.json`)
→ Verificar se SPA routing está configurado

### Erro de autenticação
→ Verificar `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
→ Adicionar URL da aplicação no Supabase

### Build falhou
→ Executar `npm run build` localmente
→ Verificar logs de erro na plataforma
→ Garantir que Node.js >= 16

## 📞 Links Úteis

- 📖 Guia Completo: `DEPLOY.md`
- 🔍 Script de Verificação: `./scripts/check-deploy.sh`
- 🌐 Vercel Docs: https://vercel.com/docs
- 🔧 Supabase Docs: https://supabase.com/docs

---

**Tempo estimado:** 10-15 minutos para deploy completo
