#!/bin/bash

echo "🚀 Deploy Supabase - Modo Produção"
echo "=================================="

# Verificar se as variáveis de ambiente estão configuradas
if [ -z "$SUPABASE_ACCESS_TOKEN" ] || [ -z "$SUPABASE_PROJECT_REF" ]; then
    echo "❌ Variáveis de ambiente não configuradas!"
    echo ""
    echo "Configure as seguintes variáveis:"
    echo "export SUPABASE_ACCESS_TOKEN='seu-token-de-acesso'"
    echo "export SUPABASE_PROJECT_REF='seu-project-ref'"
    echo ""
    echo "Para obter essas informações:"
    echo "1. Acesse https://supabase.com/dashboard"
    echo "2. Crie um novo projeto ou use um existente"
    echo "3. Vá em Settings > API para obter o Project Reference"
    echo "4. Vá em Settings > Access Tokens para criar um token"
    echo ""
    echo "📋 Como executar as migrations manualmente:"
    echo "1. Copie o conteúdo de supabase/migrations/20240101000001_initial_schema.sql"
    echo "2. Cole no SQL Editor do Dashboard Supabase"
    echo "3. Execute a query"
    echo "4. Repita para 20240101000002_seed_data.sql"
    echo ""
    exit 1
fi

echo "✅ Variáveis de ambiente configuradas"
echo "📡 Projeto: $SUPABASE_PROJECT_REF"

# Usar npx para executar comandos
echo "🔗 Fazendo login no Supabase..."
echo "$SUPABASE_ACCESS_TOKEN" | npx supabase auth login --token

echo "🔗 Linkando projeto..."
npx supabase link --project-ref "$SUPABASE_PROJECT_REF"

echo "📊 Executando migrations..."
npx supabase db push

echo "✅ Deploy concluído!"
echo ""
echo "🔑 Para obter as chaves da API:"
echo "npx supabase projects api-keys --project-ref $SUPABASE_PROJECT_REF"
echo ""
echo "📝 Configure no .env:"
echo "VITE_SUPABASE_URL=https://$SUPABASE_PROJECT_REF.supabase.co"
echo "VITE_SUPABASE_ANON_KEY=sua-chave-anonima"
