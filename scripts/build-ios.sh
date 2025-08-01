#!/bin/bash

echo "📱 Building AirPlus Aviation IPA for iOS..."

# Check if we're in the right directory
if [ ! -f "capacitor.config.ts" ]; then
    echo "❌ Error: capacitor.config.ts not found. Please run from project root."
    exit 1
fi

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "⚠️ Warning: iOS builds can only be created on macOS with Xcode installed."
    echo "💡 For now, creating the iOS project setup that can be built in Xcode..."
fi

# Build production version
echo "📱 Building production web app..."
npm run build:production

# Sync with iOS
echo "🔄 Syncing with iOS platform..."
npx cap copy ios
npx cap sync ios

# Check if we have Xcode available
if command -v xcodebuild &> /dev/null; then
    echo "🏗️ Building iOS app..."
    
    cd ios/App
    
    # Build for simulator (testing)
    echo "📱 Building for iOS Simulator..."
    xcodebuild -workspace App.xcworkspace -scheme App -destination 'platform=iOS Simulator,name=iPhone 15' build
    
    # For physical device/App Store (requires proper certificates)
    echo "📱 Building for iOS Device..."
    xcodebuild -workspace App.xcworkspace -scheme App -destination 'generic/platform=iOS' archive -archivePath build/App.xcarchive
    
    # Export IPA (requires proper provisioning profile)
    echo "📦 Exporting IPA..."
    xcodebuild -exportArchive -archivePath build/App.xcarchive -exportPath build/ipa -exportOptionsPlist ../../ExportOptions.plist
    
    echo "✅ iOS build completed!"
    echo ""
    echo "📦 IPA File: ios/App/build/ipa/App.ipa"
    
else
    echo "⚠️ Xcode not found. Please install Xcode to build iOS apps."
    echo "📁 iOS project ready at: ios/App/App.xcworkspace"
    echo ""
    echo "🛠️ Manual steps to create IPA:"
    echo "   1. Open ios/App/App.xcworkspace in Xcode"
    echo "   2. Select your development team"
    echo "   3. Choose Product > Archive"
    echo "   4. Distribute App > Export > Development/Ad Hoc/App Store"
    echo ""
fi

echo "✅ iOS setup completed!"
