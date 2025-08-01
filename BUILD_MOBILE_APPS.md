# 📱 AirPlus Aviation - Guia para Criar APK e IPA

Este guia detalha como criar os arquivos de instalação para Android (APK) e iOS (IPA) da aplicação AirPlus Aviation.

## 🚀 Pré-requisitos

### Para Android (APK):
- **Android Studio** instalado
- **Java Development Kit (JDK)** 17 ou superior
- **Android SDK** configurado
- **Gradle** (incluído no Android Studio)

### Para iOS (IPA):
- **macOS** (obrigatório)
- **Xcode** 15 ou superior
- **Conta de desenvolvedor Apple** (para distribuição)
- **Certificados e perfis de provisionamento** configurados

## 🔧 Configuração Inicial

### 1. Verificar Configuração do Capacitor

```bash
# Verificar se o Capacitor está configurado
npx cap doctor

# Ver configuração atual
cat capacitor.config.ts
```

### 2. Atualizar Configurações (se necessário)

Edite `capacitor.config.ts`:

```typescript
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.airplus.aviation",
  appName: "AirPlus Aviation",
  webDir: "dist/spa",
  server: {
    androidScheme: "https",
  },
  plugins: {
    App: {
      launchUrl: "https://sua-url-de-producao.com", // Atualize com sua URL
    },
    Camera: {
      permissions: ["camera", "photos"],
    },
    Filesystem: {
      enabled: true,
    },
    Network: {
      enabled: true,
    },
    Preferences: {
      enabled: true,
    },
  },
};

export default config;
```

## 📦 Processo de Build

### Passo 1: Build da Aplicação Web

```bash
# Build para produção
npm run build:production

# Verificar se os arquivos foram gerados
ls -la dist/spa/
```

### Passo 2: Sincronizar com Plataformas Nativas

```bash
# Copiar arquivos web para as plataformas nativas
npx cap copy

# Sincronizar plugins e dependências
npx cap sync
```

## 🤖 Build Android (APK)

### Método 1: Via Android Studio (Recomendado)

1. **Abrir projeto Android:**
   ```bash
   npx cap open android
   ```

2. **No Android Studio:**
   - Aguarde a sincronização do Gradle
   - Vá em `Build > Build Bundle(s) / APK(s) > Build APK(s)`
   - Ou `Build > Generate Signed Bundle / APK` para versão de produção

3. **Localizar APK:**
   - Debug: `android/app/build/outputs/apk/debug/app-debug.apk`
   - Release: `android/app/build/outputs/apk/release/app-release.apk`

### Método 2: Via Linha de Comando

```bash
cd android

# APK de Debug (para testes)
./gradlew assembleDebug

# APK de Release (para produção)
./gradlew assembleRelease
```

### Configuração para Release (Produção)

1. **Criar Keystore (primeira vez):**
   ```bash
   keytool -genkey -v -keystore airplus-release-key.keystore -alias airplus -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configurar assinatura em `android/app/build.gradle`:**
   ```gradle
   android {
       signingConfigs {
           release {
               storeFile file('../../airplus-release-key.keystore')
               storePassword 'SUA_SENHA_KEYSTORE'
               keyAlias 'airplus'
               keyPassword 'SUA_SENHA_KEY'
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
               minifyEnabled false
               proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
           }
       }
   }
   ```

3. **Build assinado:**
   ```bash
   ./gradlew assembleRelease
   ```

## 📱 Build iOS (IPA)

### Método 1: Via Xcode (Recomendado)

1. **Abrir projeto iOS:**
   ```bash
   npx cap open ios
   ```

2. **No Xcode:**
   - Selecione o projeto `App` no navigator
   - Configure sua equipe de desenvolvimento em `Signing & Capabilities`
   - Escolha o dispositivo/simulador de destino
   - `Product > Archive`
   - `Window > Organizer > Distribute App`

### Método 2: Via Linha de Comando (macOS apenas)

```bash
cd ios/App

# Build para simulador (testes)
xcodebuild -workspace App.xcworkspace -scheme App -destination 'platform=iOS Simulator,name=iPhone 15' build

# Archive para dispositivo
xcodebuild -workspace App.xcworkspace -scheme App -destination 'generic/platform=iOS' archive -archivePath build/App.xcarchive

# Exportar IPA
xcodebuild -exportArchive -archivePath build/App.xcarchive -exportPath build/ipa -exportOptionsPlist ../../ExportOptions.plist
```

### Configuração de Certificados

1. **No Apple Developer Portal:**
   - Criar App ID: `com.airplus.aviation`
   - Gerar certificados de desenvolvimento/distribuição
   - Criar perfis de provisionamento

2. **No Xcode:**
   - `Xcode > Preferences > Accounts`
   - Adicionar sua conta Apple Developer
   - `Manage Certificates` para baixar certificados

## 🛠️ Scripts Automatizados

### Script para Android (`scripts/build-android.sh`):

```bash
#!/bin/bash
npm run build:production
npx cap copy android
npx cap sync android
cd android
./gradlew assembleDebug
./gradlew assembleRelease
```

### Script para iOS (`scripts/build-ios.sh`):

```bash
#!/bin/bash
npm run build:production
npx cap copy ios
npx cap sync ios
npx cap open ios
```

## 📋 Checklist de Build

### Antes do Build:
- [ ] Testar aplicação web em produção
- [ ] Verificar todas as funcionalidades offline
- [ ] Configurar URLs de produção no `capacitor.config.ts`
- [ ] Atualizar versão em `package.json`
- [ ] Verificar permissões necessárias

### Android:
- [ ] Java/JDK instalado e configurado
- [ ] Android Studio instalado
- [ ] SDK configurado
- [ ] Keystore criado (para release)
- [ ] Testar APK em dispositivo real

### iOS:
- [ ] Xcode instalado (macOS)
- [ ] Conta Apple Developer ativa
- [ ] Certificados configurados
- [ ] Perfis de provisionamento criados
- [ ] Testar IPA em dispositivo real

## 🚀 Distribuição

### Android:
- **Debug APK**: Para testes internos
- **Release APK**: Para distribuição via site/email
- **Google Play Store**: Usar Android App Bundle (AAB)

### iOS:
- **Development**: Para testes internos
- **Ad Hoc**: Para distribuição limitada
- **App Store**: Para distribuição pública
- **Enterprise**: Para distribuição corporativa

## 📱 Informações da App

- **App ID**: `com.airplus.aviation`
- **Nome**: `AirPlus Aviation`
- **Versão**: Conforme `package.json`
- **Plataformas**: Android 7.0+ (API 24+), iOS 13.0+

## 🔧 Troubleshooting

### Problemas Comuns:

1. **Gradle Build Failed**:
   ```bash
   cd android
   ./gradlew clean
   ./gradlew assembleDebug
   ```

2. **iOS Pod Install Failed**:
   ```bash
   cd ios/App
   pod install --repo-update
   ```

3. **Capacitor Sync Issues**:
   ```bash
   npx cap sync --force
   ```

4. **Plugin Compatibility**:
   ```bash
   npm update @capacitor/core @capacitor/cli
   npx cap sync
   ```

## 📞 Suporte

Para problemas específicos:
- **Android**: Documentação do Android Studio
- **iOS**: Documentação do Xcode
- **Capacitor**: [Documentação oficial](https://capacitorjs.com/)

---

## ✅ Estado Atual

O projeto está configurado com:
- ✅ Capacitor 7.x instalado
- ✅ Projetos Android e iOS criados
- ✅ Plugins necessários configurados
- ✅ Build de produção funcionando
- ✅ Sincronização com plataformas nativas
- ✅ Scripts de build prontos

**Próximos passos**: Execute os builds conforme este guia para gerar APK e IPA.
