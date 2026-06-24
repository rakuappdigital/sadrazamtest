#!/bin/bash
# Sadrazam iOS Sync Script
echo "📦 Web dosyaları kopyalanıyor..."
cp index.html style.css game.js sounds.js haptics.js www/
cp -r assets data www/
echo "🔄 Capacitor sync..."
./node_modules/.bin/cap sync ios
echo "✅ Hazır! Xcode'dan ⌘+R ile çalıştır."
