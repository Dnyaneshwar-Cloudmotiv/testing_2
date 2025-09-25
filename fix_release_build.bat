@echo off
echo Cleaning Flutter project...
flutter clean

echo Deleting build cache...
rmdir /s /q .dart_tool
rmdir /s /q build
rmdir /s /q .flutter-plugins
rmdir /s /q .flutter-plugins-dependencies

echo Getting packages...
flutter pub get

echo Building release APK with optimizations disabled...
flutter build apk --release --no-shrink

echo Done! The APK is located at build\app\outputs\flutter-apk\app-release.apk
