# Supabase Database Setup

Este diretório contém as migrations e configurações do Supabase para o sistema AviationOps.

## Estrutura

```
supabase/
├── config.toml              # Configuração local do Supabase
├── migrations/              # Migrations SQL
│   ├── 20240101000001_initial_schema.sql  # Schema inicial
│   └── 20240101000002_seed_data.sql       # Dados de demonstração
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

1. **aircraft** - Aeronaves da frota
2. **employees** - Funcionários e pilotos
3. **tasks** - Tarefas de manutenção
4. **flight_sheets** - Fichas de voo
5. **cleaning_forms** - Formulários de limpeza
6. **cleaning_form_employees** - Relacionamento funcionários/limpeza
7. **system_settings** - Configurações do sistema
8. **file_attachments** - Anexos de arquivos

### Dados Demo

As migrations incluem dados de demonstração para:

- 4 aeronaves (PT-ABC, PT-XYZ, PT-DEF, PT-GHI)
- 6 funcionários com diferentes roles
- Tarefas de manutenção e limpeza
- Fichas de voo histórico
- Formulários de limpeza completos
- Configurações do sistema

### Características

- **UUIDs**: Todas as tabelas usam UUID como chave primária
- **Timestamps**: Campos created_at e updated_at automáticos
- **Triggers**: Auto-atualização de updated_at
- **Índices**: Otimização para consultas frequentes
- **Constraints**: Validação de dados e integridade referencial
- **JSONB**: Campos flexíveis para configurações e certificações

## Variáveis de Ambiente

Configure no arquivo `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Comandos ��teis

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
