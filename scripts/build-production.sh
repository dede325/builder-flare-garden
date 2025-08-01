#!/bin/bash

# AirPlus Aviation - Production Build Script
# ==========================================

echo "🚀 Building AirPlus Aviation for Production..."

# Set production environment
export NODE_ENV=production

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run type checking
echo "🔍 Running type checks..."
npx tsc --noEmit

# Run tests if available
if [ -f "package.json" ] && grep -q "\"test\":" package.json; then
    echo "🧪 Running tests..."
    npm test
fi

# Build the web application
echo "🏗️ Building web application..."
npm run build

# Build mobile applications
echo "📱 Preparing mobile builds..."

# Copy web build to mobile platforms
npx cap copy

# Sync with mobile platforms
npx cap sync

echo "✅ Build completed successfully!"
echo ""
echo "📋 Next steps:"
echo "   Web: Deploy the 'dist' folder to your hosting provider"
echo "   Android: npx cap open android (then build APK/AAB in Android Studio)"
echo "   iOS: npx cap open ios (then archive in Xcode)"
echo ""
echo "🌐 Production URLs:"
echo "   Supabase: https://fyngvoojdfjexbzasgiz.supabase.co"
echo "   App: [Your deployed URL]"
