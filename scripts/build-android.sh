#!/bin/bash

echo "🤖 Building AirPlus Aviation APK for Android..."

# Check if we're in the right directory
if [ ! -f "capacitor.config.ts" ]; then
    echo "❌ Error: capacitor.config.ts not found. Please run from project root."
    exit 1
fi

# Build production version
echo "📱 Building production web app..."
npm run build:production

# Sync with Android
echo "🔄 Syncing with Android platform..."
npx cap copy android
npx cap sync android

# Create Android build
echo "🏗️ Building Android APK..."
cd android

# Create debug APK (faster for testing)
echo "🔧 Creating debug APK..."
./gradlew assembleDebug

# Create release APK (production ready, needs signing)
echo "🔧 Creating release APK..."
./gradlew assembleRelease

echo "✅ Android build completed!"
echo ""
echo "📦 APK Files generated:"
echo "   Debug APK: android/app/build/outputs/apk/debug/app-debug.apk"
echo "   Release APK: android/app/build/outputs/apk/release/app-release-unsigned.apk"
echo ""
echo "📋 Next steps:"
echo "   1. For testing: Use the debug APK"
echo "   2. For production: Sign the release APK with your keystore"
echo ""
