# Replace Attachment service

Small Express service to safely replace attachment files using the Supabase `service_role` key.

Usage:

1. Create a minimal Node process (Heroku, Render, DigitalOcean App, or a small VPS).
2. Set env vars `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (never expose service role in frontend).
3. Start the service:

```bash
cd server/replace-attachment
npm install express body-parser @supabase/supabase-js
node index.js
```

The frontend should call POST `/replace-attachment` with JSON:

```json
{
  "transactionId": "...",
  "fileBase64": "...",
  "fileName": "1234.jpg"
}
```

Response: `{ success: true, url: 'https://.../storage/v1/object/public/notas_fiscais/1234.jpg' }`

Security: keep this service private (behind auth or IP allowlist) in production.