#!/bin/bash

# AirPlus Aviation - Deploy para Vercel
# Script para configurar e fazer deploy no Vercel

set -e

echo "🚀 Iniciando deploy para Vercel - AirPlus Aviation"

# Verificar se as variáveis de ambiente estão configuradas
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "⚠️  Variáveis de ambiente Supabase não configuradas localmente"
    echo "Configure no painel Vercel: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY"
fi

# Limpar build anterior e diretório vercel
echo "🧹 Limpando builds anteriores..."
rm -rf dist/
rm -rf .vercel/

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

echo "✅ Build concluído com sucesso!"
echo "📁 Arquivos disponíveis em: dist/spa/"
echo ""
echo "🌐 Para fazer deploy no Vercel:"
echo "1. Abra o painel Vercel: https://vercel.com/dashboard"
echo "2. Clique em 'Add New Project'"
echo "3. Importe este repositório ou arraste a pasta dist/spa"
echo "4. Configure as variáveis de ambiente:"
echo "   - VITE_SUPABASE_URL=https://fyngvoojdfjexbzasgiz.supabase.co"
echo "   - VITE_SUPABASE_ANON_KEY=[sua chave]"
echo "5. Faça o deploy!"
echo ""
echo "📋 Alternativamente, use o MCP do Vercel no Builder.io"
