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
supabase db push --linked
```

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

**Autenticação e Autorização:**
9. **roles** - Roles do sistema (8 roles)
10. **permissions** - Permissões granulares (40+ permissões)
11. **role_permissions** - Relacionamento roles/permissões
12. **user_profiles** - Perfis estendidos de utilizadores
13. **user_roles** - Atribuição de roles aos utilizadores
14. **user_activity_log** - Log de atividades
15. **user_sessions** - Gestão de sessões
16. **password_reset_tokens** - Tokens de reset de senha

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

Configure no arquivo `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
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
