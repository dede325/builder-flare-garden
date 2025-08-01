# 🚀 Deploy Vercel - AirPlus Aviation

Guia completo para deploy da aplicação AirPlus Aviation no Vercel.

## 📋 Pré-requisitos

### 1. Conta Vercel

- Criar conta em [vercel.com](https://vercel.com)
- Instalar Vercel CLI: `npm install -g vercel`

### 2. Variáveis de Ambiente

Configure no painel Vercel:

```env
VITE_SUPABASE_URL=https://fyngvoojdfjexbzasgiz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NODE_ENV=production
```

## 🔧 Configuração

### vercel.json

Arquivo de configuração principal já criado com:

- Build commands otimizados
- Roteamento SPA
- Headers de segurança
- Configuração de funções serverless

### Scripts Disponíveis

```bash
# Deploy automático
npm run deploy:vercel

# Build para Vercel
npm run vercel:build

# Deploy manual
vercel --prod
```

## 🚀 Deploy

### Deploy Automático

```bash
# Executar script de deploy
npm run deploy:vercel
```

### Deploy Manual

```bash
# 1. Login no Vercel
vercel login

# 2. Build da aplicação
npm run build:production

# 3. Deploy
vercel --prod
```

### Deploy via Git

1. Conectar repositório no painel Vercel
2. Configurar variáveis de ambiente
3. Deploy automático a cada push

## 📁 Estrutura de Deploy

```
dist/
├── spa/                 # Frontend (Vite build)
│   ├── index.html
│   ├── assets/
│   └── ...
└── server/              # Backend (Node.js)
    └── node-build.mjs
```

## 🌐 Configurações de Produção

### Domínio Personalizado

1. Adicionar domínio no painel Vercel
2. Configurar DNS
3. SSL automático

### Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=https://fyngvoojdfjexbzasgiz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Aplicação
NODE_ENV=production
VITE_APP_TITLE=AirPlus Aviation
VITE_APP_VERSION=1.0.0
```

### Funções Serverless

- API routes em `/api/*`
- Timeout: 30 segundos
- Runtime: Node.js 18+

## 🔒 Segurança

### Headers de Segurança

```json
{
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block"
}
```

### Cache Strategy

- Static assets: Cache máximo
- Service Worker: No cache
- API responses: Cache inteligente

## 📊 Monitoramento

### Analytics

- Vercel Analytics integrado
- Performance monitoring
- Error tracking

### Logs

```bash
# Ver logs em tempo real
vercel logs --follow

# Logs de função específica
vercel logs api/index.ts
```

## 🐛 Troubleshooting

### Build Errors

```bash
# Verificar build local
npm run build:production

# Limpar cache
rm -rf dist/ node_modules/.cache/
npm ci
```

### Deployment Issues

```bash
# Verificar status
vercel --prod --debug

# Re-deploy
vercel --prod --force
```

### Environment Variables

```bash
# Listar variáveis
vercel env ls

# Adicionar variável
vercel env add VARIABLE_NAME
```

## 📈 Performance

### Otimizações

- ✅ Tree shaking automático
- ✅ Code splitting
- ✅ Asset optimization
- ✅ Gzip compression
- ✅ CDN global

### Métricas

- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3.5s

## 🔄 CI/CD

### Workflow Automático

1. Push para branch main
2. Build automático no Vercel
3. Deploy para produção
4. Preview URLs para PRs

### Preview Deployments

- Cada PR gera preview URL
- Ambiente isolado
- Mesmas configurações de produção

## 🛠️ Manutenção

### Updates

```bash
# Update dependencies
npm update

# Re-deploy
npm run deploy:vercel
```

### Rollback

```bash
# Listar deployments
vercel ls

# Promover deployment anterior
vercel --prod --target <deployment-url>
```

---

## 📞 Suporte

Para problemas específicos do Vercel:

- [Vercel Docs](https://vercel.com/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)
- [Support Ticket](https://vercel.com/help)

---

_Deploy configurado para produção com alta disponibilidade e performance otimizada._
