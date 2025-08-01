#!/bin/bash

# =========================================================================
# Script para Aplicar Migrações VFINAL - AirPlus Aviation
# Aplica as migrações na ordem correta para evitar conflitos
# =========================================================================

echo "🚀 APLICANDO MIGRAÇÕES VFINAL - AIRPLUS AVIATION"
echo "================================================"
echo ""

# Verificar se estamos no diretório correto
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto (onde está o supabase/config.toml)"
    exit 1
fi

# Verificar se o Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Erro: Supabase CLI não encontrado"
    echo "   Instale com: npm install -g supabase"
    exit 1
fi

echo "📋 Verificando status atual do banco..."
supabase status

echo ""
echo "🔍 Listando migrações VFINAL..."
ls -la supabase/migrations/202412200000*

echo ""
echo "⚠️  ATENÇÃO: Este processo irá aplicar 5 migrações:"
echo "   1. 20241220000001_vfinal_production_schema.sql"
echo "   2. 20241220000002_vfinal_seed_data.sql" 
echo "   3. 20241220000003_vfinal_missing_tables.sql"
echo "   4. 20241220000004_vfinal_missing_tables_seed.sql"
echo "   5. 20241220000005_fix_function_conflicts.sql"
echo ""

read -p "🤔 Deseja continuar? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelado pelo usuário"
    exit 1
fi

echo ""
echo "🔄 Aplicando migrações VFINAL..."

# Aplicar todas as migrações
if supabase db push; then
    echo ""
    echo "✅ MIGRAÇÕES APLICADAS COM SUCESSO!"
    echo ""
    
    # Verificar se as tabelas foram criadas
    echo "🔍 Verificando tabelas criadas..."
    
    # Contar tabelas via psql se disponível
    if command -v psql &> /dev/null; then
        # Tentar conectar ao banco local
        SUPABASE_STATUS=$(supabase status --output json 2>/dev/null)
        if [ $? -eq 0 ]; then
            DB_URL=$(echo $SUPABASE_STATUS | grep -o '"DB URL": "[^"]*"' | cut -d'"' -f4)
            if [ ! -z "$DB_URL" ]; then
                echo "📊 Contando tabelas no banco..."
                TABLE_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" 2>/dev/null | tr -d ' ')
                
                if [ ! -z "$TABLE_COUNT" ] && [ "$TABLE_COUNT" -ge 18 ]; then
                    echo "✅ Encontradas $TABLE_COUNT tabelas (esperado: 18+)"
                else
                    echo "⚠️  Encontradas $TABLE_COUNT tabelas (pode estar incompleto)"
                fi
            fi
        fi
    fi
    
    echo ""
    echo "🎯 PRÓXIMOS PASSOS:"
    echo "   1. Execute: npm run validate:mobile"
    echo "   2. Execute: npm run build:production" 
    echo "   3. Execute: npx cap sync"
    echo "   4. Teste o sistema offline/online"
    echo ""
    echo "📱 Para gerar apps mobile:"
    echo "   • Android APK: npm run build:android"
    echo "   • iOS IPA: npm run build:ios"
    echo ""
    
else
    echo ""
    echo "❌ ERRO ao aplicar migrações!"
    echo ""
    echo "🔧 POSSÍVEIS SOLUÇÕES:"
    echo "   1. Verifique se o Supabase está rodando: supabase status"
    echo "   2. Se há conflitos, tente: supabase db reset --debug"
    echo "   3. Verifique os logs de erro acima"
    echo "   4. Se persistir, execute as migrações uma por uma"
    echo ""
    echo "📞 SUPORTE:"
    echo "   • Documentação: https://supabase.com/docs"
    echo "   • GitHub Issues: https://github.com/supabase/supabase/issues"
    echo ""
    exit 1
fi

echo "🎉 VFINAL MIGRAÇÕES COMPLETAS!"
echo "Sistema AirPlus Aviation pronto para produção 🚀"
