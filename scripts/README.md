# 🚀 Scripts de Deploy e Automação - AirPlus Aviation

<div align="center">

**Scripts de Automação para Build, Deploy e Manutenção**

[![Bash](https://img.shields.io/badge/Bash-5.0+-green.svg)](https://www.gnu.org/software/bash/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-blue.svg)](https://nodejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-CLI-green.svg)](https://supabase.com/docs/guides/cli)
[![Netlify](https://img.shields.io/badge/Netlify-Functions-blue.svg)](https://www.netlify.com/)

</div>

## 📋 Índice

- [🎯 Visão Geral](#-visão-geral)
- [📁 Estrutura dos Scripts](#-estrutura-dos-scripts)
- [🏗️ Scripts de Build](#️-scripts-de-build)
- [🚀 Scripts de Deploy](#-scripts-de-deploy)
- [💾 Scripts de Base de Dados](#-scripts-de-base-de-dados)
- [📱 Scripts Mobile](#-scripts-mobile)
- [🔍 Scripts de Verificação](#-scripts-de-verificação)
- [⚙️ Scripts de Configuração](#️-scripts-de-configuração)
- [🛠️ Como Usar](#️-como-usar)
- [🔧 Personalização](#-personalização)

## 🎯 Visão Geral

Este diretório contém uma coleção completa de scripts de automação para facilitar o desenvolvimento, build, deploy e manutenção do sistema AirPlus Aviation. Os scripts são escritos em Bash e Node.js, proporcionando automação robusta e confiável.

### ✨ Características Principais

- **🏗️ Build Automatizado** - Scripts para build de produção e staging
- **🚀 Deploy Simplificado** - Deploy automático para produção
- **💾 Gestão de BD** - Scripts para Supabase e migrations
- **📱 Mobile Build** - Automação para iOS e Android
- **🔍 Verificação** - Scripts de teste e validação
- **⚙️ Configuração** - Setup e configuração automática
- **📊 Monitorização** - Scripts de health check e métricas

## 📁 Estrutura dos Scripts

```
scripts/
├── 🏗️ build/                          # Scripts de build
│   ├── build-production.sh            # Build completo de produção
│   ├── build-staging.sh               # Build para staging
│   └── build-client.sh                # Build apenas frontend
│
├── 🚀 deploy/                         # Scripts de deploy
│   ├── deploy-production.sh           # Deploy para produção
│   ├── deploy-staging.sh              # Deploy para staging
│   └── netlify-deploy.sh              # Deploy específico Netlify
│
├── 💾 database/                       # Scripts de base de dados
│   ├── supabase-deploy.sh             # Deploy BD produção
│   ├── supabase-deploy-production.sh  # Deploy BD produção (avançado)
│   ├── apply-vfinal-migrations.sh     # Aplicar migrations finais
│   └── backup-database.sh             # Backup da base de dados
│
├── 📱 mobile/                         # Scripts mobile
│   ├── build-ios.sh                   # Build iOS
│   ├── build-android.sh               # Build Android
│   ├── validate-mobile-sync.js        # Validar sincronização mobile
│   └── prepare-mobile-release.sh      # Preparar release mobile
│
├── 🔍 verification/                   # Scripts de verificação
│   ├── final-verification.cjs         # Verificação completa do sistema
│   ├── final-verification.js          # Verificação Node.js
│   ├── validate-production-data.js    # Validar dados de produção
│   └── health-check.sh                # Health check geral
│
├── ⚙️ setup/                          # Scripts de configuração
│   ├── setup-environment.sh           # Setup ambiente desenvolvimento
│   ├── setup-production.sh            # Setup ambiente produção
│   └── install-dependencies.sh        # Instalar dependências
│
└── 📊 monitoring/                     # Scripts de monitorização
    ├── check-services.sh              # Verificar serviços
    ├── performance-check.sh           # Verificar performance
    └── log-analysis.sh                # Análise de logs
```

## 🏗️ Scripts de Build

### 🎯 build-production.sh

```bash
#!/bin/bash
# Build completo para produção

set -e

echo "🚀 Iniciando build de produção..."

# Verificar Node.js e npm
echo "📋 Verificando dependências..."
node --version
npm --version

# Instalar dependências
echo "📦 Instalando dependências..."
npm ci

# Build do cliente
echo "🎨 Building frontend..."
npm run build:client

# Build do servidor
echo "🔧 Building backend..."
npm run build:server

# Verificar build
echo "🔍 Verificando build..."
if [ -d "dist/spa" ] && [ -f "dist/server/node-build.mjs" ]; then
    echo "✅ Build de produção concluído com sucesso!"
else
    echo "❌ Erro no build de produção!"
    exit 1
fi

# Estatísticas do build
echo "📊 Estatísticas do build:"
du -sh dist/spa
du -sh dist/server
echo "Build finalizado: $(date)"
```

### 🎯 build-staging.sh

```bash
#!/bin/bash
# Build para ambiente de staging

set -e

echo "🔄 Iniciando build de staging..."

# Configurar ambiente staging
export NODE_ENV=staging
export VITE_APP_ENVIRONMENT=staging

# Build com configurações de staging
npm run build:staging

echo "✅ Build de staging concluído!"
```

## 🚀 Scripts de Deploy

### 🌐 deploy-production.sh

```bash
#!/bin/bash
# Deploy completo para produção

set -e

echo "🚀 Iniciando deploy de produção..."

# Verificações pré-deploy
echo "🔍 Executando verificações pré-deploy..."
npm run verify:system

# Build de produção
echo "🏗️ Executando build de produção..."
./scripts/build-production.sh

# Deploy da base de dados
echo "💾 Deploy da base de dados..."
./scripts/supabase-deploy-production.sh

# Deploy do frontend/backend
echo "🌐 Deploy da aplicação..."
if command -v netlify &> /dev/null; then
    netlify deploy --prod --dir=dist/spa
else
    echo "⚠️ Netlify CLI não encontrado. Deploy manual necessário."
fi

# Verificações pós-deploy
echo "✅ Executando verificações pós-deploy..."
sleep 30  # Aguardar propagação
npm run test:production

echo "🎉 Deploy de produção concluído com sucesso!"
```

### 📡 netlify-deploy.sh

```bash
#!/bin/bash
# Deploy específico para Netlify

set -e

echo "📡 Deploy Netlify iniciado..."

# Verificar se está logado no Netlify
if ! netlify status &> /dev/null; then
    echo "❌ Não está logado no Netlify. Execute: netlify login"
    exit 1
fi

# Build e deploy
npm run build:production
netlify deploy --prod --dir=dist/spa

# Verificar deploy
SITE_URL=$(netlify status --json | jq -r '.site.url')
echo "🌐 Site deployado em: $SITE_URL"

# Health check
if curl -f "$SITE_URL/api/health" > /dev/null 2>&1; then
    echo "✅ Deploy verificado com sucesso!"
else
    echo "⚠️ Aviso: Health check falhou. Verificar logs."
fi
```

## 💾 Scripts de Base de Dados

### 🗄️ supabase-deploy-production.sh

```bash
#!/bin/bash
# Deploy da base de dados para produção

set -e

echo "💾 Deploy Supabase produção iniciado..."

# Verificar Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI não encontrado. Instale com: npm install -g supabase"
    exit 1
fi

# Verificar login
if ! supabase projects list &> /dev/null; then
    echo "❌ Não está logado no Supabase. Execute: supabase login"
    exit 1
fi

# Backup antes do deploy
echo "📋 Criando backup da base de dados..."
BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).sql"
supabase db dump --linked --file "backups/$BACKUP_FILE"
echo "💾 Backup criado: backups/$BACKUP_FILE"

# Deploy das migrations
echo "🔄 Aplicando migrations..."
supabase db push --linked

# Verificar integridade
echo "🔍 Verificando integridade da base de dados..."
supabase db status --linked

# Executar verificações de produção
echo "✅ Executando verificações finais..."
node scripts/validate-production-data.js

echo "🎉 Deploy da base de dados concluído!"
```

### 🔄 apply-vfinal-migrations.sh

```bash
#!/bin/bash
# Aplicar migrations finais do sistema

set -e

echo "🔄 Aplicando migrations finais..."

# Migrations específicas para versão final
MIGRATIONS=(
    "20240101000007_performance_indexes.sql"
    "20240101000008_security_policies.sql"
    "20240101000009_data_cleanup.sql"
)

for migration in "${MIGRATIONS[@]}"; do
    echo "📝 Aplicando migration: $migration"
    if [ -f "supabase/migrations/$migration" ]; then
        supabase db reset --linked
        supabase db push --linked
    else
        echo "⚠️ Migration não encontrada: $migration"
    fi
done

echo "✅ Migrations finais aplicadas!"
```

## 📱 Scripts Mobile

### 🍎 build-ios.sh

```bash
#!/bin/bash
# Build da aplicação iOS

set -e

echo "🍎 Iniciando build iOS..."

# Verificar macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ Build iOS requer macOS"
    exit 1
fi

# Verificar Xcode
if ! command -v xcodebuild &> /dev/null; then
    echo "❌ Xcode não encontrado"
    exit 1
fi

# Build da web app
npm run build:production

# Sincronizar com Capacitor
npx cap sync ios

# Build iOS
cd ios/App
xcodebuild -workspace App.xcworkspace \
           -scheme App \
           -configuration Release \
           -destination generic/platform=iOS \
           clean archive

echo "✅ Build iOS concluído!"
```

### 🤖 build-android.sh

```bash
#!/bin/bash
# Build da aplicação Android

set -e

echo "🤖 Iniciando build Android..."

# Verificar Java
if ! command -v java &> /dev/null; then
    echo "❌ Java não encontrado"
    exit 1
fi

# Build da web app
npm run build:production

# Sincronizar com Capacitor
npx cap sync android

# Build Android
cd android
./gradlew assembleRelease

echo "📦 APK gerado em: android/app/build/outputs/apk/release/"
echo "✅ Build Android concluído!"
```

## 🔍 Scripts de Verificação

### ✅ final-verification.cjs

```javascript
// Verificação completa do sistema
const { execSync } = require("child_process");
const fs = require("fs");

console.log("🔍 Iniciando verificação final do sistema...");

const checks = [
  {
    name: "Build Frontend",
    test: () => fs.existsSync("dist/spa/index.html"),
    message: "Frontend build existe",
  },
  {
    name: "Build Backend",
    test: () => fs.existsSync("dist/server/node-build.mjs"),
    message: "Backend build existe",
  },
  {
    name: "Configuração Supabase",
    test: () => {
      const config = process.env.VITE_SUPABASE_URL;
      return config && config.includes("supabase.co");
    },
    message: "Supabase configurado",
  },
  {
    name: "Mobile iOS",
    test: () => fs.existsSync("ios/App/App.xcworkspace"),
    message: "Projeto iOS configurado",
  },
  {
    name: "Mobile Android",
    test: () => fs.existsSync("android/app/build.gradle"),
    message: "Projeto Android configurado",
  },
];

let passed = 0;
let failed = 0;

checks.forEach((check) => {
  try {
    if (check.test()) {
      console.log(`✅ ${check.name}: ${check.message}`);
      passed++;
    } else {
      console.log(`❌ ${check.name}: FALHOU`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${check.name}: ERRO - ${error.message}`);
    failed++;
  }
});

console.log(`\n📊 Resultado: ${passed} passaram, ${failed} falharam`);

if (failed === 0) {
  console.log("🎉 Todas as verificações passaram!");
  process.exit(0);
} else {
  console.log("⚠️ Algumas verificações falharam!");
  process.exit(1);
}
```

### 📊 validate-production-data.js

```javascript
// Validação de dados de produção
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY,
);

console.log("📊 Validando dados de produção...");

async function validateData() {
  try {
    // Verificar tabelas principais
    const tables = [
      "aircraft",
      "employees",
      "tasks",
      "cleaning_forms",
      "flight_sheets",
      "roles",
    ];

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });

      if (error) throw error;

      console.log(`✅ ${table}: ${count} registos`);
    }

    // Verificar funcionários específicos
    const { data: employees } = await supabase
      .from("employees")
      .select("name")
      .limit(5);

    console.log("👥 Funcionários:", employees?.map((e) => e.name).join(", "));

    console.log("🎉 Validação de dados concluída!");
  } catch (error) {
    console.error("❌ Erro na validação:", error.message);
    process.exit(1);
  }
}

validateData();
```

## ⚙️ Scripts de Configuração

### 🔧 setup-environment.sh

```bash
#!/bin/bash
# Setup completo do ambiente de desenvolvimento

set -e

echo "🔧 Configurando ambiente de desenvolvimento..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale Node.js 18+ primeiro."
    exit 1
fi

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Setup Supabase local (opcional)
if command -v supabase &> /dev/null; then
    echo "🗄️ Configurando Supabase local..."
    supabase start
else
    echo "⚠️ Supabase CLI não encontrado. Instale com: npm install -g supabase"
fi

# Configurar Git hooks (opcional)
echo "🔗 Configurando Git hooks..."
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
npm run typecheck
npm run format.fix
EOF
chmod +x .git/hooks/pre-commit

# Criar arquivos de ambiente
if [ ! -f ".env" ]; then
    echo "📄 Criando arquivo .env..."
    cp .env.example .env
    echo "⚠️ Edite o arquivo .env com suas configurações"
fi

echo "✅ Ambiente configurado com sucesso!"
echo "🚀 Execute 'npm run dev' para iniciar o desenvolvimento"
```

## 🛠️ Como Usar

### 🚀 Uso Básico

```bash
# Desenvolvimento
npm run dev

# Build de produção
./scripts/build-production.sh

# Deploy completo
./scripts/deploy-production.sh

# Verificação do sistema
npm run verify:system

# Build mobile
./scripts/build-ios.sh
./scripts/build-android.sh
```

### 📋 Fluxo de Deploy Completo

```bash
# 1. Verificações pré-deploy
npm run typecheck
npm test

# 2. Build e deploy
./scripts/build-production.sh
./scripts/deploy-production.sh

# 3. Verificações pós-deploy
npm run test:production
```

### 🔧 Scripts NPM Integration

```json
{
  "scripts": {
    "deploy": "./scripts/deploy-production.sh",
    "deploy:staging": "./scripts/deploy-staging.sh",
    "db:deploy": "./scripts/supabase-deploy-production.sh",
    "mobile:build": "./scripts/build-ios.sh && ./scripts/build-android.sh",
    "verify:system": "node scripts/final-verification.cjs",
    "setup:env": "./scripts/setup-environment.sh"
  }
}
```

## 🔧 Personalização

### 📝 Variáveis de Configuração

```bash
# Configurações globais (início dos scripts)
PROJECT_NAME="AirPlus Aviation"
PRODUCTION_URL="https://airplus-aviation.netlify.app"
SUPABASE_PROJECT_ID="fyngvoojdfjexbzasgiz"
BACKUP_RETENTION_DAYS=30
BUILD_TIMEOUT=600  # 10 minutos
```

### 🎯 Hooks Personalizados

```bash
# Adicionar hooks personalizados
# scripts/hooks/pre-deploy.sh
#!/bin/bash
echo "🔍 Executando verificações personalizadas..."
# Suas verificações aqui

# scripts/hooks/post-deploy.sh
#!/bin/bash
echo "📧 Enviando notificação de deploy..."
# Notificações personalizadas
```

### 📊 Logging Personalizado

```bash
# Função de log personalizada
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

error() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1" >&2
}

success() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1"
}
```

---

<div align="center">

**🚀 Scripts de Automação AirPlus Aviation**

_Automação robusta para desenvolvimento, build e deploy_

[⬅️ Voltar ao README principal](../README.md)

</div>
