#!/bin/bash

# Script para deploy do banco Supabase
echo "🚀 Iniciando deploy do banco Supabase..."

# Verificar se Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não encontrado. Instalando..."
    npm install -g supabase
fi

# Verificar se está logado
echo "📋 Verificando login no Supabase..."
if ! supabase projects list &> /dev/null; then
    echo "🔐 Fazendo login no Supabase..."
    supabase login
fi

# Verificar se existe projeto linkado
if [ ! -f "./.git/supabase-project-ref" ]; then
    echo "🔗 Nenhum projeto linkado encontrado."
    echo "Para linkar um projeto existente, execute:"
    echo "supabase link --project-ref <your-project-id>"
    echo ""
    echo "Para criar um novo projeto, execute:"
    echo "supabase projects create aviationops"
    echo ""
    read -p "Deseja continuar com deploy local? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    
    echo "🐳 Iniciando Supabase local..."
    supabase start
    
    echo "📊 Aplicando migrations..."
    supabase db push --local
    
    echo "✅ Deploy local concluído!"
    echo "🌐 Dashboard: http://localhost:54323"
    echo "🔑 API URL: http://localhost:54321"
    echo ""
    echo "Para obter as chaves de API:"
    echo "supabase status"
    
else
    echo "🔗 Projeto linkado encontrado."
    echo "📊 Aplicando migrations..."
    supabase db push
    
    echo "✅ Deploy para produção concluído!"
fi

echo ""
echo "📝 Não esqueça de:"
echo "1. Configurar as variáveis de ambiente:"
echo "   VITE_SUPABASE_URL=sua-url"
echo "   VITE_SUPABASE_ANON_KEY=sua-chave"
echo "2. Configurar Row Level Security (RLS) no Dashboard"
echo "3. Configurar Storage buckets se necessário"
echo ""
echo "🎉 Deploy concluído com sucesso!"
