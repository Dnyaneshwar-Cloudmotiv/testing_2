import 'dart:io';
import 'package:flutter/services.dart';

class AppTerminator {
  static const platform = MethodChannel('com.voizapp.voiceapp/app_terminator');

  static Future<void> terminateApp() async {
    try {
      // Try to use platform-specific method first
      await platform.invokeMethod('terminateApp');
    } catch (e) {
      // Fallback to standard methods
      print('Failed to terminate using platform channel: $e');
      try {
        // Force system navigator pop
        await SystemNavigator.pop(animated: true);

        // Additional forceful termination
        exit(0);
      } catch (e) {
        print('Failed to terminate app: $e');
      }
    }
  }
}