#!/bin/bash

# AirPlus Aviation - Deploy para Vercel
# Script para configurar e fazer deploy no Vercel

set -e

echo "🚀 Iniciando deploy para Vercel - AirPlus Aviation"

# Verificar se as variáveis de ambiente estão configuradas
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "❌ Variáveis de ambiente Supabase não configuradas"
    echo "Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY"
    exit 1
fi

# Limpar build anterior
echo "🧹 Limpando builds anteriores..."
rm -rf dist/

# Build da aplicação
echo "🔧 Executando build de produção..."
npm run build:production

# Verificar se o build foi bem-sucedido
if [ ! -d "dist/spa" ]; then
    echo "❌ Build falhou - diretório dist/spa não encontrado"
    exit 1
fi

# Verificar arquivos essenciais
echo "✅ Verificando arquivos de build..."
if [ ! -f "dist/spa/index.html" ]; then
    echo "❌ Arquivo index.html não encontrado"
    exit 1
fi

# Verificar se Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    echo "📦 Instalando Vercel CLI..."
    npm install -g vercel
fi

# Deploy para Vercel
echo "🚀 Fazendo deploy para Vercel..."
vercel --prod

echo "✅ Deploy concluído com sucesso!"
echo "🌐 Aplicação disponível em produção no Vercel"
