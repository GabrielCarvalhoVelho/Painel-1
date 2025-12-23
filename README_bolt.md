# Deploy do `replace-attachment` e configuração do frontend no Bolt

Este documento descreve, passo-a-passo, como publicar o serviço `server/replace-attachment` no Bolt e como configurar a variável de ambiente `VITE_SIGNED_URL_SERVER_URL` para o build do frontend (Painel). Use HTTPS nos valores e confirme CORS/ALLOWED_ORIGIN.

---

## 1) Objetivo

- Disponibilizar publicamente o endpoint `/signed-url` que usa a `service_role` do Supabase para gerar signed URLs;
- Configurar o frontend para apontar para esse serviço via `VITE_SIGNED_URL_SERVER_URL` (valor só é injetado em tempo de build pelo Vite).

## 2) Preparar o service `replace-attachment`

Arquivos relevantes: `server/replace-attachment/index.js` (Express).

- Variáveis obrigatórias que o service precisa no Bolt:
  - `SUPABASE_URL` = ex.: `https://vamvzjlbmbaxotdegrfb.supabase.co`
  - `SUPABASE_SERVICE_ROLE_KEY` = sua chave service_role (NUNCA expor no frontend)
  - `ALLOWED_ORIGIN` = `https://app.solos.ag` (ou domínio do frontend)
  - `PORT` = `3001` (opcional, Bolt pode sobrescrever)

## 3) Deploy do service no Bolt (UI)

1. Acesse o dashboard do Bolt e selecione o projeto/repositório do Painel.
2. Adicione um novo Service (ou App) apontando para a pasta `server/replace-attachment` do repo.
3. Configure o comando de start:
   - Start command: `node index.js`
   - (Opcional) Build command: deixe em branco, ou `npm install` se necessário.
4. Adicione as environment variables listadas na seção 2 (marque-as como *secret* quando possível).
5. Deploy/Publish.
6. Copie a Production URL pública gerada pelo Bolt (ex.: `https://replace-attachment-xyz.bolt.run` ou seu custom domain).

## 4) Testes do service (antes de alterar o frontend)

Substitua `<SERVICE_URL>` pela URL pública que o Bolt gerou.

- Health-check:
```bash
curl -sS <SERVICE_URL>/health | jq .
# deve responder: { "ok": true, "service": "replace-attachment" }
```

- Geração de signed-url (teste rápido):
```bash
curl -s -X POST <SERVICE_URL>/signed-url \
  -H "Content-Type: application/json" \
  -d '{"path":"c7f13743-.../file.jpg","bucket":"notas_fiscais","expires":120}' | jq .
```

- Validar `signedUrl` retornado:
```bash
curl -I "PASTE_SIGNED_URL_AQUI"
# deve retornar HTTP/2 200
```

## 5) Configurar frontend no Bolt (Build env)

1. No Bolt abra o serviço do frontend (Painel) → Settings → Environment Variables (Build env).
2. Adicione a variável:
   - Key: `VITE_SIGNED_URL_SERVER_URL`
   - Value: `https://replace-attachment-xyz.bolt.run` (use a URL pública do serviço)
3. Salve e dispare um novo deploy do frontend (importantíssimo: Vite injeta `import.meta.env` apenas no build).

## 6) CORS e ALLOWED_ORIGIN

- No `server/replace-attachment` o código usa `ALLOWED_ORIGIN` para o `cors` middleware. Ajuste esse valor para incluir `https://app.solos.ag` ou o domínio do seu frontend e redeploy do service.

## 7) Validação final (após redeploy do frontend)

- Abra o app em produção (`https://app.solos.ag`), clique no botão de anexo e abra DevTools → Console. Procure pelos logs de verificação e pela `console.table` que mostra `signedStatus` (deve ser `200`).
- Alternativa: usar o script `./scripts/check-attachment.sh` apontando para a URL pública do service:
```bash
./scripts/check-attachment.sh "c7f13743-.../file.jpg" notas_fiscais https://replace-attachment-xyz.bolt.run
```

## 8) Alternativas e notas de segurança

- Não deixar `SUPABASE_SERVICE_ROLE_KEY` no frontend. Mantenha a chave como secret no Bolt.
- Se você precisa testar rapidamente sem deploy, pode usar um túnel (ngrok):
  ```bash
  ngrok http 3001
  # use a URL https:// gerada por ngrok como VITE_SIGNED_URL_SERVER_URL temporariamente
  ```
- Não recomendo tornar o bucket `notas_fiscais` público em produção — prefere-se signed URLs.

---

Se quiser, eu posso gerar um `Procfile`/`package.json` snippet para o service ou um passo-a-passo com screenshots do Bolt (me diga se prefere screenshots do painel Bolt em particular). 
