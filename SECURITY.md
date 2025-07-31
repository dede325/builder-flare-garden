# Sistema de Segurança - Aviation Cleaning Management

## Visão Geral

Este sistema implementa um conjunto robusto de medidas de segurança para garantir a proteção e rastreabilidade de todas as folhas de limpeza de aeronaves.

## 🛡️ Funcionalidades de Segurança Implementadas

### 1. Geração de ID Único Seguro

**Formato:** `AP-PS-SNR##-DDMMAAHHMMSS`

- **AP**: Aviation Portugal (identificador da empresa)
- **PS**: Pátio de Serviços (departamento)
- **SNR##**: Serial Number com código único (4 dígitos)
- **DDMMAAHHMMSS**: Data e hora completa da criação

**Exemplo:** `AP-PS-SNR0123-31071625143052`

### 2. Criptografia AES-256-GCM

- **Algoritmo**: AES-256-GCM (Advanced Encryption Standard - Galois/Counter Mode)
- **Tamanho da Chave**: 256 bits
- **IV (Initialization Vector)**: 12 bytes aleatórios
- **Autenticação**: AEAD (Authenticated Encryption with Associated Data)
- **Dados Adicionais**: `aviation-cleaning-form` (para verificação de contexto)

### 3. Verificação de Integridade

- **Hash**: SHA-256 para verificação de integridade dos dados
- **Verificação Automática**: Executada sempre que os dados são descriptografados
- **Detecção de Corrupção**: Sistema alerta sobre dados corrompidos ou alterados

### 4. Armazenamento Seguro Offline

#### IndexedDB com Criptografia
```typescript
// Estrutura do armazenamento seguro
interface SecureFormPackage {
  metadata: {
    id: string;
    hash: string;
    encryptionVersion: string;
    createdAt: string;
    lastModified: string;
  };
  encryptedData: {
    encryptedData: string;    // Dados criptografados em Base64
    iv: string;               // IV em Base64
    authTag: string;          // Tag de autenticação em Base64
    timestamp: string;        // Timestamp da criptografia
  };
  syncStatus: 'pending' | 'synced' | 'error';
  retryCount: number;
}
```

### 5. Sincronização Segura com Supabase

#### Processo de Sincronização
1. **Criptografia Local**: Dados são criptografados antes do envio
2. **Verificação de Integridade**: Hash SHA-256 é calculado e verificado
3. **Retry Logic**: Sistema tenta até 3 vezes em caso de falha
4. **Status Tracking**: Acompanhamento completo do status de sincronização
5. **Conflict Resolution**: Resolução automática de conflitos baseada em timestamp

#### Edge Functions (Supabase)
- Descriptografia segura no servidor
- Validação de dados antes do armazenamento
- Logs de auditoria automáticos
- Rate limiting e proteção contra ataques

### 6. QR Code Seguro

#### Geração de Links Protegidos
```typescript
// Estrutura do QR Code seguro
interface SecureQRData {
  url: string;           // URL base do documento
  token: string;         // Token de autenticação (16 caracteres)
  timestamp: number;     // Timestamp de geração
  signature: string;     // Assinatura digital
}
```

**Formato do URL**: `{baseUrl}/storage/v1/object/sign/cleaning-forms/{formId}.pdf?token={token}&qr={shortToken}&t={timestamp}`

### 7. Armazenamento PDF no Supabase Storage

- **Bucket**: `cleaning-forms` (configurado com RLS)
- **Nomenclatura**: `{formId}.pdf`
- **URLs Assinados**: Links temporários com expiração
- **Políticas de Acesso**: Baseadas em autenticação e autorização

## 🔒 Configurações de Segurança

### Variáveis de Ambiente

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Encryption Configuration (opcional - usa padrão se não definido)
VITE_ENCRYPTION_KEY=your_32_character_encryption_key

# Security Settings
VITE_ENABLE_AUDIT_LOG=true
VITE_MAX_RETRY_ATTEMPTS=3
VITE_SYNC_INTERVAL_MS=300000
```

### Row Level Security (RLS) - Supabase

```sql
-- Políticas de segurança para cleaning_forms
CREATE POLICY "Users can view own forms" ON cleaning_forms 
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create forms" ON cleaning_forms 
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own draft forms" ON cleaning_forms 
  FOR UPDATE USING (auth.uid() = created_by AND status = 'draft');
```

## 📊 Monitoramento e Auditoria

### 1. Logs de Auditoria
- **Criação de Folhas**: Timestamp, usuário, dados alterados
- **Modificações**: Versioning completo com histórico de mudanças
- **Acessos**: Log de downloads de PDF e visualizações
- **Erros de Sincronização**: Logs detalhados para troubleshooting

### 2. Métricas de Segurança
- **Taxa de Sincronização**: Percentual de forms sincronizados com sucesso
- **Erros de Criptografia**: Monitoramento de falhas de criptografia/descriptografia
- **Tentativas de Acesso**: Rastreamento de tentativas de acesso não autorizadas
- **Performance**: Tempo de criptografia/descriptografia

### 3. Alertas Automáticos
- **Falhas de Sincronização**: Alertas após 3 tentativas falhadas
- **Dados Corrompidos**: Notificação imediata em caso de falha na verificação de integridade
- **Acessos Suspeitos**: Alertas para tentativas de acesso fora do padrão

## 🚀 Fluxo de Operação Segura

### Criação de Folha
1. Usuário preenche o formulário
2. Sistema gera ID único no formato AP-PS-SNR##-DDMMAAHHMMSS
3. Dados são validados e sanitizados
4. Criptografia AES-256-GCM é aplicada
5. Hash SHA-256 é calculado para verificação de integridade
6. Dados são armazenados em IndexedDB criptografados
7. Sincronização automática com Supabase (se online)
8. PDF é gerado e armazenado no Supabase Storage
9. QR Code seguro é gerado com link protegido

### Acesso via QR Code
1. QR Code é escaneado
2. Sistema verifica token e timestamp
3. Valida assinatura digital
4. Redireciona para URL protegido do PDF
5. Supabase verifica permissões via RLS
6. PDF é servido se autorizado

### Sincronização Offline→Online
1. Sistema detecta conexão com internet
2. Busca todas as folhas com `syncStatus: 'pending'`
3. Para cada folha:
   - Descriptografa os dados localmente
   - Verifica integridade via hash
   - Criptografa novamente para envio
   - Tenta sincronizar com Supabase
   - Atualiza status baseado no resultado
4. Implementa retry logic para falhas temporárias
5. Marca folhas como `syncStatus: 'error'` após 3 tentativas

## ⚡ Performance e Otimizações

### Criptografia
- **WebCrypto API**: Usa a API nativa do navegador para máxima performance
- **Streaming**: Para arquivos grandes, implementa criptografia em chunks
- **Worker Threads**: Criptografia em background para não bloquear UI

### Armazenamento
- **Compressão**: Dados são comprimidos antes da criptografia
- **Indexação**: Índices otimizados no IndexedDB para consultas rápidas
- **Cleanup**: Limpeza automática de dados antigos e temporários

### Sincronização
- **Batching**: Múltiplas operações são agrupadas para eficiência
- **Delta Sync**: Apenas mudanças são sincronizadas, não dados completos
- **Background Sync**: Sincronização em background usando Service Workers

## 🛠️ Manutenção e Troubleshooting

### Comandos Úteis

```typescript
// Verificar status de sincronização
const stats = await secureSyncService.getSyncStats();

// Forçar sincronização completa
await secureSyncService.forceSyncAll();

// Limpar dados locais (reset)
await secureSyncService.clearAllData();

// Verificar integridade de uma folha
const isValid = await verifyDataIntegrity(formData, expectedHash);
```

### Problemas Comuns

1. **Erro de Criptografia**: Verificar se está em contexto HTTPS
2. **Falha de Sincronização**: Verificar conectividade e credenciais Supabase
3. **Dados Corrompidos**: Executar verificação de integridade e restaurar backup
4. **QR Code Inválido**: Verificar se URL foi gerado corretamente e não expirou

## 📋 Checklist de Segurança

- [x] Criptografia AES-256-GCM implementada
- [x] IDs únicos e rastreáveis (formato AP-PS-SNR##-DDMMAAHHMMSS)
- [x] Verificação de integridade SHA-256
- [x] Armazenamento offline seguro (IndexedDB criptografado)
- [x] Sincronização automática e segura
- [x] QR Codes com autenticação
- [x] Row Level Security no Supabase
- [x] Logs de auditoria completos
- [x] Retry logic para falhas temporárias
- [x] Interface visual de status de segurança
- [x] Documentação completa

## 🔄 Roadmap de Melhorias

### Curto Prazo
- [ ] Implementar 2FA para usuários administrativos
- [ ] Adicionar watermarks nos PDFs
- [ ] Implementar assinatura digital PKI

### Médio Prazo
- [ ] Integração com HSM (Hardware Security Module)
- [ ] Audit trail imutável via blockchain
- [ ] Análise de comportamento anômalo com ML

### Longo Prazo
- [ ] Certificação ISO 27001
- [ ] Compliance com GDPR/LGPD
- [ ] Integração com sistemas SIEM corporativos

---

**Última atualização**: 31/07/2025
**Versão do Sistema**: 1.0.0
**Nível de Segurança**: Empresarial
