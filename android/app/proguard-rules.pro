# Flutter specific rules
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.** { *; }
-keep class io.flutter.util.** { *; }
-keep class io.flutter.view.** { *; }
-keep class io.flutter.** { *; }
-keep class io.flutter.plugins.** { *; }

# Firebase rules
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# Firebase Dynamic Links
-keep class com.google.firebase.dynamiclinks.** { *; }
-dontwarn com.google.firebase.dynamiclinks.**

# HTTP and JSON parsing
-keep class dart.** { *; }
-keep class org.json.** { *; }
-dontwarn org.json.**

# Audio Service
-keep class com.ryanheise.audioservice.** { *; }
-dontwarn com.ryanheise.audioservice.**

# Amplify Auth
-keep class com.amplifyframework.** { *; }
-dontwarn com.amplifyframework.**

# Shared Preferences
-keep class io.flutter.plugins.sharedpreferences.** { *; }

# Device Info
-keep class io.flutter.plugins.deviceinfo.** { *; }

# URL Launcher
-keep class io.flutter.plugins.urllauncher.** { *; }

# Permission Handler
-keep class com.baseflow.permissionhandler.** { *; }

# Google Play Core
-keep class com.google.android.play.core.** { *; }
-dontwarn com.google.android.play.core.**

# Keep all model classes and their fields
-keepclassmembers class ** {
    @com.google.gson.annotations.SerializedName <fields>;
}

# Keep Gson classes
-keep class com.google.gson.** { *; }
-dontwarn com.google.gson.**

# Keep reflection for JSON parsing
-keepattributes Signature
-keepattributes *Annotation*
-keepattributes EnclosingMethod
-keepattributes InnerClasses