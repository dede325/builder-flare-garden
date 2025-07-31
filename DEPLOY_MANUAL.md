# 🚀 Deploy Manual - Supabase Dashboard

Como Docker não está disponível neste ambiente, aqui estão as instruções para deploy manual:

## Opção 1: MCP Supabase (Recomendado)

1. **Conecte o MCP Supabase**:

   - [Clique aqui para abrir MCP Servers](#open-mcp-popover)
   - Conecte com **Supabase**

2. **Use o MCP para fazer deploy**:
   - O MCP permitirá criar tabelas e inserir dados diretamente

## Opção 2: Dashboard Web

### 1. Acesse o Supabase Dashboard

- Vá para: https://supabase.com/dashboard
- Faça login ou crie uma conta
- Crie um novo projeto: "AviationOps"

### 2. Execute o Schema SQL

1. No Dashboard, vá em **SQL Editor**
2. Copie todo o conteúdo de `supabase/migrations/20240101000001_initial_schema.sql`
3. Cole no editor e clique **Run**

### 3. Execute os Seeds

1. Copie todo o conteúdo de `supabase/migrations/20240101000002_seed_data.sql`
2. Cole no editor e clique **Run**

### 4. Configure Variáveis de Ambiente

1. Vá em **Settings > API**
2. Copie a **URL** e **anon public key**
3. Configure no arquivo `.env`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

## Opção 3: Usando DevServerControl

Configure as variáveis de ambiente usando a ferramenta DevServerControl:

```javascript
// Configurar URL do Supabase
setEnvVariable(["VITE_SUPABASE_URL", "https://seu-projeto.supabase.co"]);

// Configurar chave anônima
setEnvVariable(["VITE_SUPABASE_ANON_KEY", "sua-chave-anonima"]);
```

## ✅ Verificação

Após o deploy, verifique:

1. **8 tabelas criadas** no Dashboard > Table Editor
2. **~30 registros** inseridos nas tabelas
3. **Aplicação conecta** sem erros
4. **Sincronização offline→online** funciona

## 📊 Status do Deploy

- ✅ Migrations SQL criadas e prontas
- ✅ Seeds SQL com todos os dados
- ✅ Configuração pronta
- ⏳ **Aguardando execução manual** (Docker não disponível)

Execute uma das opções acima para completar o deploy.
