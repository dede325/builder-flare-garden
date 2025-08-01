# Supabase Database Setup

Este diretório contém as migrations e configurações do Supabase para o sistema AviationOps.

## Estrutura

```
supabase/
├── config.toml              # Configuração local do Supabase
├── migrations/              # Migrations SQL
│   ├── 20240101000001_initial_schema.sql  # Schema inicial
│   ├── 20240101000002_seed_data.sql       # Dados de demonstração
│   ├── 20240101000003_auth_system.sql     # Sistema de autenticação
│   ├── 20240101000004_auth_seeds.sql      # Roles e permissões
│   ├── 20240101000005_specific_employees.sql # Funcionários específicos
│   └── 20240101000006_verify_integrity.sql   # Verificação de integridade
└── README.md               # Este arquivo
```

## Setup

### 1. Instalar Supabase CLI

```bash
npm install -g supabase
```

### 2. Inicializar projeto

```bash
supabase init
```

### 3. Fazer login no Supabase

```bash
supabase login
```

### 4. Conectar com projeto existente (opcional)

```bash
supabase link --project-ref <project-id>
```

### 5. Executar migrations localmente

```bash
supabase db start
supabase db push
```

### 6. Deploy para produção

```bash
# Deploy das migrations para produção
supabase db push --linked

# Verificar status do deploy
supabase db status --linked

# Backup antes do deploy (recomendado)
supabase db dump --linked --file backup-$(date +%Y%m%d).sql
```

### 7. Configuração de Produção Ativa

O projeto está atualmente configurado com o ambiente de produção:

- **Project ID**: `fyngvoojdfjexbzasgiz`
- **URL**: `https://fyngvoojdfjexbzasgiz.supabase.co`
- **Region**: East US (us-east-1)
- **Database**: PostgreSQL 15
- **Storage**: Configurado para ficheiros e imagens
- **Auth**: Sistema de autenticação ativo
- **Real-time**: Subscriptions ativas para tabelas principais

## Estrutura do Banco

### Tabelas Principais

**Operacionais:**

1. **aircraft** - Aeronaves da frota
2. **employees** - Funcionários e pilotos
3. **tasks** - Tarefas de manutenção
4. **flight_sheets** - Fichas de voo
5. **cleaning_forms** - Formulários de limpeza
6. **cleaning_form_employees** - Relacionamento funcionários/limpeza
7. **system_settings** - Configurações do sistema
8. **file_attachments** - Anexos de arquivos

**Autenticação e Autorização:** 9. **roles** - Roles do sistema (8 roles) 10. **permissions** - Permissões granulares (40+ permissões) 11. **role_permissions** - Relacionamento roles/permissões 12. **user_profiles** - Perfis estendidos de utilizadores 13. **user_roles** - Atribuição de roles aos utilizadores 14. **user_activity_log** - Log de atividades 15. **user_sessions** - Gestão de sessões 16. **password_reset_tokens** - Tokens de reset de senha

### Dados Demo

As migrations incluem dados de demonstração para:

- **4 aeronaves** (PT-ABC, PT-XYZ, PT-DEF, PT-GHI)
- **14 funcionários específicos** de Angola com dados reais
- **8 roles** (Super Admin → Viewer) com níveis hierárquicos
- **40+ permissões** granulares por recurso/ação
- **Tarefas** de manutenção e limpeza atribuídas
- **Fichas de voo** histórico
- **Formulários de limpeza** completos
- **Configurações** do sistema para Angola

### Funcionários Específicos

Os seguintes funcionários foram criados com dados reais:

**Diretores:**

- Amizanguel da Silva (001023626BA037)
- Jaime da Graça (000821215LA035)

**Chefes de Departamento:**

- Evandra dos Santos - D. Comercial e Marketing (005280783LA047)
- Liliana dos Santos - D. Recursos Humanos (005259127LA042)

**Técnicos Auxiliares de Placa:**

- Augusto Tomás (000862944ME035)
- Celestino Domingos (000951540HA036)
- Daniel Segunda (003557571HO034)
- Joaquim Cumbando João (001141347LA031)
- José Garrido (003588004ME037)
- José João (000040089LA035)
- Manuel Coelho (000650503LN039)
- Mário Quiluange (000062106LA017)
- Reginaldo Golveia (000195323LA017)
- Wilson Hongolo (000161916LA015)

### Características

- **UUIDs**: Todas as tabelas usam UUID como chave primária
- **Timestamps**: Campos created_at e updated_at automáticos
- **Triggers**: Auto-atualização de updated_at
- **Índices**: Otimização para consultas frequentes
- **Constraints**: Validação de dados e integridade referencial
- **JSONB**: Campos flexíveis para configurações e certificações
- **RLS**: Row Level Security configurado
- **Auditoria**: Log completo de atividades dos utilizadores

## Variáveis de Ambiente

### 🚀 Produção (Atual)

```env
# Configuração de Produção AirPlus Aviation
VITE_SUPABASE_URL=https://fyngvoojdfjexbzasgiz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5bmd2b29qZGZqZXhiemFzZ2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MTM3MTAsImV4cCI6MjA2OTQ4OTcxMH0.0v2M2L2K1EbSXh6gx1ywdz8q7TxaNqW3fq3-fRx1mh0

# Configuração da Aplicação
VITE_APP_NAME=AirPlus Aviation
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production

# Branding da Empresa
VITE_COMPANY_NAME=AirPlus
VITE_COMPANY_LOGO_URL=/airplus-logo.png

# Features
VITE_ENABLE_DEMO_MODE=false
VITE_ENABLE_OFFLINE_MODE=true
VITE_ENABLE_ANALYTICS=true
```

### 🔧 Desenvolvimento Local

```env
# Para desenvolvimento local
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key
VITE_APP_ENVIRONMENT=development
VITE_ENABLE_DEMO_MODE=true
```

## Comandos Úteis

```bash
# Ver status das migrations
supabase db status

# Reset do banco local
supabase db reset

# Ver diferenças
supabase db diff

# Gerar nova migration
supabase migration new <name>

# Backup do banco
supabase db dump --file backup.sql

# Ver logs
supabase logs
```

## RLS (Row Level Security)

As políticas de segurança devem ser configuradas manualmente no Supabase Dashboard após o deploy das migrations.

## Storage

Para configurar storage de arquivos (fotos, PDFs), use:

```bash
supabase storage create-bucket <bucket-name>
```

## 🎯 Resultado Final

Após o deploy bem-sucedido, você terá:

- **Banco PostgreSQL** configurado com 16 tabelas
- **Sistema de autenticação** completo com RLS
- **14 funcionários específicos** de Angola criados
- **8 roles hierárquicas** com permissões granulares
- **40+ permissões** específicas por recurso/ação
- **Dados de demonstração** completos inseridos
- **API REST** automática via Supabase
- **Dashboard web** para administração
- **Sincronização offline→online** funcional
- **Auditoria completa** de atividades

**Total de registros**: ~100+ registros distribuídos em 16 tabelas
**Compatibilidade**: 100% com dados offline existentes
**Segurança**: RLS configurado em todas as tabelas sensíveis
**Performance**: Índices otimizados para consultas frequentes
**Escalabilidade**: Sistema preparado para crescimento
