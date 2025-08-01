# 🚀 AirPlus Aviation - Production Deployment Guide

## 📋 Overview

This guide covers the complete deployment process for the AirPlus Aviation cleaning sheets system, including web deployment and mobile app builds.

## 🏗️ Pre-Deployment Checklist

### ✅ Environment Setup

- [x] Real Supabase credentials configured
- [x] Production database schema created
- [x] AirPlus employee data seeded
- [x] Capacitor configured for mobile builds
- [x] PWA manifest updated with AirPlus branding

### ✅ Database Configuration

```sql
-- Production Supabase URL
https://fyngvoojdfjexbzasgiz.supabase.co

-- Tables Created:
- funcionarios (employees)
- aeronaves (aircraft)
- folhas (cleaning sheets)
- folha_funcionarios (sheet-employee relationship)
- fotos (photo evidence)
- qr_codes (QR code management)
- usuarios (user management)
```

## 🌐 Web Deployment

### 1. Build for Production

```bash
# Install dependencies
npm ci

# Type checking
npm run typecheck

# Build production version
npm run build:production
```

### 2. Deploy to Hosting Platform

#### Option A: Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard:
VITE_SUPABASE_URL=https://fyngvoojdfjexbzasgiz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_NAME=AirPlus Aviation
VITE_COMPANY_NAME=AirPlus
```

#### Option B: Netlify

```bash
# Build and deploy
npm run build:production

# Upload 'dist' folder to Netlify
# Or connect GitHub repository for auto-deployment
```

#### Option C: Cloudflare Pages

```bash
# Connect GitHub repository
# Set build command: npm run build:production
# Set build output directory: dist
```

### 3. Environment Variables

Set these in your hosting platform:

```env
VITE_SUPABASE_URL=https://fyngvoojdfjexbzasgiz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5bmd2b29qZGZqZXhiemFzZ2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5MTM3MTAsImV4cCI6MjA2OTQ4OTcxMH0.0v2M2L2K1EbSXh6gx1ywdz8q7TxaNqW3fq3-fRx1mh0
VITE_APP_NAME=AirPlus Aviation
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production
VITE_COMPANY_NAME=AirPlus
VITE_ENABLE_DEMO_MODE=false
```

## 📱 Mobile Deployment

### 1. Prepare Mobile Build

```bash
# Build and sync mobile platforms
npm run build:mobile

# Or step by step:
npm run build:production
npx cap copy
npx cap sync
```

### 2. Android Build (APK/AAB)

```bash
# Open Android Studio
npm run mobile:android

# In Android Studio:
# 1. Build → Generate Signed Bundle/APK
# 2. Choose APK or Android App Bundle
# 3. Select release build variant
# 4. Sign with your keystore
```

#### Android Requirements:

- Android Studio installed
- Java Development Kit (JDK) 11+
- Android SDK (API level 22+)
- Signing keystore for production

### 3. iOS Build (App Store)

```bash
# Open Xcode
npm run mobile:ios

# In Xcode:
# 1. Select "Any iOS Device" as target
# 2. Product → Archive
# 3. Distribute App → App Store Connect
# 4. Upload to App Store Connect
```

#### iOS Requirements:

- macOS with Xcode 14+
- Apple Developer Account ($99/year)
- iOS Deployment Target: iOS 13+
- App Store Connect setup

## 🗄️ Database Setup

### 1. Run Migrations

```bash
# Deploy production schema
npm run db:migrate

# Or manually in Supabase dashboard:
# 1. Go to SQL editor
# 2. Run migration files in order:
#    - 20240101000010_production_schema.sql
#    - 20240101000011_production_seeds.sql
```

### 2. Verify Data

- Check that funcionarios table has AirPlus employees
- Verify aeronaves table has sample aircraft
- Confirm RLS policies are active
- Test authentication flow

### 3. Configure Storage

In Supabase dashboard:

1. Go to Storage
2. Create buckets:
   - `pdfs` (for generated PDFs)
   - `photos` (for photo evidence)
   - `signatures` (for digital signatures)
3. Set appropriate RLS policies

## 🔐 Security Configuration

### 1. Supabase Security

- ✅ Row Level Security (RLS) enabled
- ✅ JWT authentication configured
- ✅ API keys properly scoped
- ✅ Email domain restrictions (@airplus.co)

### 2. Mobile Security

- Code signing certificates configured
- App permissions properly set
- Secure HTTP only (no HTTP in production)
- Camera and storage permissions

### 3. Web Security

- HTTPS enforced
- Content Security Policy configured
- Secure authentication flow
- Environment variables protected

## 🧪 Testing

### 1. Web Testing

```bash
# Test production build locally
npm run build:production
npx serve dist

# Test authentication
# Test offline functionality
# Test PDF generation
# Test photo upload
```

### 2. Mobile Testing

- Test on physical devices
- Verify camera functionality
- Test offline data sync
- Validate app permissions

## 📊 Monitoring & Analytics

### 1. Supabase Dashboard

- Monitor database performance
- Track API usage
- Review authentication logs
- Monitor storage usage

### 2. Application Monitoring

- Set up error tracking (Sentry)
- Monitor performance metrics
- Track user engagement
- Monitor offline sync success

## 🚀 Go-Live Process

### 1. Final Checks

- [ ] Production database populated
- [ ] All employees can log in
- [ ] PDF generation working
- [ ] Photo upload functional
- [ ] QR codes generating
- [ ] Mobile apps tested
- [ ] Offline sync verified

### 2. Deployment Steps

1. Deploy web application to hosting
2. Update DNS if needed
3. Submit mobile apps for review
4. Train AirPlus staff
5. Monitor initial usage

### 3. Post-Launch

- Monitor system performance
- Collect user feedback
- Plan feature updates
- Regular database backups

## 🎯 Success Metrics

- ✅ Web app accessible at production URL
- ✅ Mobile apps approved and available
- ✅ All AirPlus employees can authenticate
- ✅ Cleaning sheets can be created and signed
- ✅ PDFs generate with AirPlus branding
- ✅ Photo evidence uploads successfully
- ✅ QR codes provide digital access
- ✅ Offline functionality works reliably

## 📞 Support Contacts

- **Technical Support**: Fusion AI Development Team
- **Supabase Issues**: Supabase Support Portal
- **Mobile App Issues**: Platform-specific support
- **AirPlus Training**: Internal IT Team

---

## 🎉 Launch Checklist

### Pre-Launch (1 week before)

- [ ] Complete all testing
- [ ] Staff training scheduled
- [ ] Backup procedures tested
- [ ] Monitoring systems active

### Launch Day

- [ ] Deploy production systems
- [ ] Verify all services online
- [ ] Monitor initial usage
- [ ] Support team on standby

### Post-Launch (1 week after)

- [ ] Collect user feedback
- [ ] Monitor performance metrics
- [ ] Plan first update cycle
- [ ] Document lessons learned

**🚀 AirPlus Aviation System - Ready for Takeoff!**
