#!/usr/bin/env node

/**
 * Gera um token JWT de teste para acessar o Painel Solos.ag
 * 
 * Uso:
 *   node scripts/generate-test-token.js <user_id>
 * 
 * Exemplo:
 *   node scripts/generate-test-token.js c7f13743-67ef-45d4-807c-9f5de81d4999
 */

const crypto = require('crypto');

// Pegar user_id do argumento ou usar padrão
const userId = process.argv[2] || 'c7f13743-67ef-45d4-807c-9f5de81d4999';
const nome = process.argv[3] || 'Usuário Teste';

// IMPORTANTE: Use a mesma JWT_SECRET do seu Supabase
// Você encontra em: Supabase Dashboard > Settings > API > JWT Settings > JWT Secret
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET || 'SUA_SECRET_AQUI';

if (JWT_SECRET === 'SUA_SECRET_AQUI') {
  console.error('❌ Erro: Configure SUPABASE_JWT_SECRET antes de executar!');
  console.log('\n📝 Como fazer:');
  console.log('1. Acesse: https://supabase.com/dashboard/project/vamvzjlbmbaxotdegrfb/settings/api');
  console.log('2. Copie o "JWT Secret"');
  console.log('3. Execute: SUPABASE_JWT_SECRET="sua_secret" node scripts/generate-test-token.js');
  process.exit(1);
}

// Criar payload
const now = Math.floor(Date.now() / 1000);
const payload = {
  sub: userId,
  nome: nome,
  email: 'teste@solos.ag',
  role: 'authenticated',
  aud: 'authenticated',
  iat: now,
  exp: now + (30 * 24 * 60 * 60) // 30 dias
};

// Encodar Base64URL
function base64urlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Header
const header = {
  alg: 'HS256',
  typ: 'JWT'
};

const headerEncoded = base64urlEncode(JSON.stringify(header));
const payloadEncoded = base64urlEncode(JSON.stringify(payload));

// Criar assinatura
const signatureInput = `${headerEncoded}.${payloadEncoded}`;
const signature = crypto
  .createHmac('sha256', JWT_SECRET)
  .update(signatureInput)
  .digest('base64')
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=/g, '');

// Token final
const token = `${headerEncoded}.${payloadEncoded}.${signature}`;

console.log('\n✅ Token JWT gerado com sucesso!\n');
console.log('👤 User ID:', userId);
console.log('👤 Nome:', nome);
console.log('\n🔑 Token:');
console.log(token);
console.log('\n📋 URL de acesso:');
console.log(`https://seu-projeto.vercel.app?token=${token}`);
console.log('\n💡 Para usar:');
console.log('1. Copie a URL completa acima');
console.log('2. Cole no navegador');
console.log('3. O painel abrirá automaticamente!');
console.log('');
