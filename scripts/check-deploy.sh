#!/bin/bash

# 🚀 Script de Pré-Deploy - Painel Solos.ag
# Verifica se o projeto está pronto para deploy

set -e

echo "🔍 Verificando pré-requisitos para deploy..."
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não encontrado! Instale: https://nodejs.org${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v)${NC}"

# Verificar npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm não encontrado!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm $(npm -v)${NC}"

# Verificar arquivo .env ou .env.production
if [ ! -f .env ] && [ ! -f .env.production ]; then
    echo -e "${YELLOW}⚠️  Nenhum arquivo .env encontrado!${NC}"
    echo "   Crie um arquivo .env.production com as variáveis necessárias."
    echo "   Veja .env.example para referência."
    exit 1
fi
echo -e "${GREEN}✅ Arquivo de ambiente encontrado${NC}"

# Verificar variáveis críticas
if [ -f .env.production ]; then
    if ! grep -q "VITE_SUPABASE_URL" .env.production; then
        echo -e "${RED}❌ VITE_SUPABASE_URL não encontrada em .env.production${NC}"
        exit 1
    fi
    if ! grep -q "VITE_SUPABASE_ANON_KEY" .env.production; then
        echo -e "${RED}❌ VITE_SUPABASE_ANON_KEY não encontrada em .env.production${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Variáveis de ambiente configuradas${NC}"
fi

echo ""
echo "📦 Instalando dependências..."
npm install

echo ""
echo "🔨 Executando lint..."
npm run lint || {
    echo -e "${YELLOW}⚠️  Erros de lint encontrados. Corrija antes do deploy.${NC}"
    read -p "Deseja continuar mesmo assim? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
}

echo ""
echo "🏗️  Testando build de produção..."
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build falhou! Pasta dist não foi criada.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Build concluído com sucesso!${NC}"
echo ""
echo "📊 Estatísticas do build:"
du -sh dist
echo ""

echo "🎉 Projeto pronto para deploy!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Escolha uma plataforma de deploy (Vercel, Netlify, etc)"
echo "   2. Siga o guia em DEPLOY.md"
echo "   3. Configure as variáveis de ambiente na plataforma"
echo "   4. Faça o deploy!"
echo ""
echo "💡 Comando rápido para preview local:"
echo "   npm run preview"
echo ""
