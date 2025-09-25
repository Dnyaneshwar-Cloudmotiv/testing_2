// notifiers.dart
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AutoplayNotifier extends ValueNotifier<bool> {
  AutoplayNotifier(bool value) : super(value);

  // Load the autoplay state from SharedPreferences
  Future<void> loadAutoplayState() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    value = prefs.getBool('isAutoplayEnabled') ?? true;  // Default to true if not found
  }

  // Save the autoplay state to SharedPreferences
  Future<void> saveAutoplayState() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.setBool('isAutoplayEnabled', value);
  }
}

// Add this new class alongside your existing AutoplayNotifier
class LoopNotifier extends ValueNotifier<bool> {
  LoopNotifier(bool value) : super(value);

  Future<void> loadLoopState() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    value = prefs.getBool('isLoopEnabled') ?? false;
  }

  Future<void> saveLoopState() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.setBool('isLoopEnabled', value);
  }
}

// New LoginMethodNotifier for managing login method
class LoginMethodNotifier extends ValueNotifier<String?> {
  static const String LOGIN_METHOD_KEY = 'login_method';
  static const String LOGIN_METHOD_GOOGLE = 'google';
  static const String LOGIN_METHOD_EMAIL = 'email';

  LoginMethodNotifier() : super(null);

  // Load the login method from SharedPreferences
  Future<void> loadLoginMethod() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    value = prefs.getString(LOGIN_METHOD_KEY);
  }

  // Save the login method to SharedPreferences
  Future<void> saveLoginMethod(String method) async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.setString(LOGIN_METHOD_KEY, method);
    value = method;
  }

  // Check if logged in with Google
  Future<bool> isGoogleLogin() async {
    await loadLoginMethod();
    return value == LOGIN_METHOD_GOOGLE;
  }

  // Check if logged in with Email
  Future<bool> isEmailLogin() async {
    await loadLoginMethod();
    return value == LOGIN_METHOD_EMAIL;
  }

  // Clear login method (used during logout)
  Future<void> clearLoginMethod() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.remove(LOGIN_METHOD_KEY);
    value = null;
  }
}

// Global instances
LoginMethodNotifier loginMethodNotifier = LoginMethodNotifier();

// Create a global instance of AutoplayNotifier
AutoplayNotifier autoplayNotifier = AutoplayNotifier(true);

// Add this global instance alongside your existing autoplayNotifier
final LoopNotifier loopNotifier = LoopNotifier(false);


