# 🗄️ Plano Estruturado - 50 Migrations AirPlus Aviation

## 📋 Organização Lógica das Migrations

### 🎯 Fase 1: Fundações (Migrations 01-10)
**Objetivo**: Estabelecer bases fundamentais do sistema

1. **20250101000001** - Extensões e configurações base
2. **20250101000002** - Sistema de autenticação básico
3. **20250101000003** - Perfis de utilizador
4. **20250101000004** - Sistema de roles hierárquico
5. **20250101000005** - Permissões granulares
6. **20250101000006** - Relacionamento roles-permissões
7. **20250101000007** - Atribuição de roles aos utilizadores
8. **20250101000008** - Logs de atividade do sistema
9. **20250101000009** - Gest��o de sessões
10. **20250101000010** - Tokens de segurança

### ✈️ Fase 2: Entidades Operacionais (Migrations 11-20)
**Objetivo**: Criar tabelas principais do negócio

11. **20250101000011** - Aeronaves (aircraft)
12. **20250101000012** - Funcionários (employees)
13. **20250101000013** - Tarefas de manutenção (tasks)
14. **20250101000014** - Formulários de limpeza (cleaning_forms)
15. **20250101000015** - Tarefas de limpeza (cleaning_tasks)
16. **20250101000016** - Relacionamento funcionários-limpeza
17. **20250101000017** - Fichas de voo (flight_sheets)
18. **20250101000018** - Anexos de ficheiros (file_attachments)
19. **20250101000019** - Configurações do sistema (system_settings)
20. **20250101000020** - Histórico de alterações (change_log)

### 🔗 Fase 3: Relacionamentos e Integridade (Migrations 21-30)
**Objetivo**: Estabelecer foreign keys e constraints

21. **20250101000021** - FK: Aircraft → Tasks
22. **20250101000022** - FK: Aircraft → Cleaning Forms
23. **20250101000023** - FK: Aircraft → Flight Sheets
24. **20250101000024** - FK: Employees → Tasks
25. **20250101000025** - FK: Employees → Flight Sheets
26. **20250101000026** - FK: Users → Employee Profiles
27. **20250101000027** - Constraints de integridade
28. **20250101000028** - Validações de dados
29. **20250101000029** - Políticas de cascade
30. **20250101000030** - Verificações de consistência

### ⚡ Fase 4: Performance e Otimização (Migrations 31-40)
**Objetivo**: Índices, triggers e otimizações

31. **20250101000031** - Índices primários
32. **20250101000032** - Índices de busca
33. **20250101000033** - Índices compostos
34. **20250101000034** - Triggers de auditoria
35. **20250101000035** - Triggers de timestamp
36. **20250101000036** - Functions de utilidade
37. **20250101000037** - Views otimizadas
38. **20250101000038** - Políticas RLS (Row Level Security)
39. **20250101000039** - Configurações de performance
40. **20250101000040** - Otimizações de queries

### 📊 Fase 5: Dados e Validação (Migrations 41-50)
**Objetivo**: Dados iniciais, seeds e validações finais

41. **20250101000041** - Roles iniciais do sistema
42. **20250101000042** - Permissões padrão
43. **20250101000043** - Configurações padrão
44. **20250101000044** - Aeronaves de demonstração
45. **20250101000045** - Funcionários Angola (14 específicos)
46. **20250101000046** - Dados de demonstração
47. **20250101000047** - Validações finais
48. **20250101000048** - Verificações de integridade
49. **20250101000049** - Compatibilidade mobile
50. **20250101000050** - Sistema pronto para produção

## 🎯 Critérios de Compatibilidade Mobile/Offline

### 📱 Requisitos para Sincronização
1. **Timestamps**: Todas as tabelas têm `created_at` e `updated_at`
2. **UUIDs**: Chaves primárias UUID para evitar conflitos
3. **Soft Deletes**: Campo `deleted_at` para sincronização
4. **Sync Metadata**: Campos `sync_version` e `last_synced`
5. **Conflict Resolution**: Estratégias para resolução de conflitos

### 🔄 Estrutura de Sincronização
```sql
-- Campos obrigatórios em todas as tabelas
id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW(),
deleted_at TIMESTAMPTZ,
sync_version INTEGER DEFAULT 1,
last_synced TIMESTAMPTZ
```

### 📊 Tabelas Offline-First
- **aircraft** - Sincronização bidirecional
- **employees** - Sincronização bidirecional  
- **tasks** - Sincronização bidirecional
- **cleaning_forms** - Sincronização bidirecional
- **flight_sheets** - Sincronização bidirecional
- **file_attachments** - Upload assíncrono
- **sync_queue** - Fila de sincronização

## 🛡️ Estratégias de Segurança

### 🔐 Row Level Security (RLS)
- **user_profiles**: Acesso próprio perfil
- **employees**: Baseado em departamento
- **aircraft**: Baseado em role
- **tasks**: Atribuição pessoal + supervisão
- **cleaning_forms**: Criador + supervisores

### 🔑 Políticas de Acesso
1. **Super Admin**: Acesso total
2. **Admin**: Gestão de dados
3. **Manager**: Supervisão de departamento
4. **Supervisor**: Gestão de equipa
5. **Technician**: Execução de tarefas
6. **Operator**: Operações básicas
7. **Client**: Visualização limitada
8. **Viewer**: Apenas leitura

## 📈 Métricas de Validação

### ✅ Checklist de Migração
- [ ] Extensões PostgreSQL instaladas
- [ ] Todas as tabelas criadas sem erro
- [ ] Foreign keys funcionais
- [ ] Índices criados corretamente
- [ ] Triggers ativos
- [ ] RLS configurado
- [ ] Seeds inseridos
- [ ] Validações passando
- [ ] Compatibilidade mobile verificada
- [ ] Performance otimizada

### 🧪 Testes de Integridade
```sql
-- Verificar todas as tabelas
SELECT schemaname, tablename, tableowner 
FROM pg_tables 
WHERE schemaname = 'public';

-- Verificar constraints
SELECT conname, contype 
FROM pg_constraint 
WHERE connamespace = 'public'::regnamespace;

-- Verificar índices
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public';
```

## 🎯 Resultado Esperado

### 📊 Base de Dados Final
- **20 Tabelas**: Estrutura completa
- **100+ Constraints**: Integridade garantida
- **50+ Índices**: Performance otimizada
- **8 Roles**: Sistema hierárquico
- **40+ Permissões**: Controlo granular
- **200+ Registos**: Dados demonstração
- **Mobile Ready**: Sincronização offline
- **Production Ready**: Sistema completo

### 🔄 Funcionalidades Garantidas
- ✅ CRUD completo todas as entidades
- ✅ Sistema autenticação robusto
- ✅ Sincronização offline/online
- ✅ Auditoria completa
- ✅ Performance otimizada
- ✅ Segurança empresarial
- ✅ Escalabilidade garantida
- ✅ Dados Angola específicos
