import 'package:flutter/material.dart';
import 'package:in_app_update/in_app_update.dart';

class AppUpdateManager {
  static Future<void> checkForUpdate(BuildContext context) async {
    try {
      final info = await InAppUpdate.checkForUpdate();

      if (info.updateAvailability == UpdateAvailability.updateAvailable) {
        if (info.immediateUpdateAllowed) {
          // For immediate updates (critical updates)
          await InAppUpdate.performImmediateUpdate();
        } else if (info.flexibleUpdateAllowed) {
          // For flexible updates (normal updates)
          await InAppUpdate.startFlexibleUpdate();
          // The system will handle showing the update progress
          // and prompting the user to install when ready
        }
      }
    } catch (e) {
      print('Error checking for updates: $e');
    }
  }

  // Optional: Method to complete a flexible update if needed
  static Future<void> completeFlexibleUpdate() async {
    try {
      await InAppUpdate.completeFlexibleUpdate();
    } catch (e) {
      print('Error completing update: $e');
    }
  }
}