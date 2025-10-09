import 'dart:async';
import 'dart:isolate';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:workmanager/workmanager.dart';
import 'package:amplify_flutter/amplify_flutter.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'api_service.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import '../profile_manager.dart';
import '../audio_service1.dart';
import '../main.dart';
import 'auth_service.dart';

// Port name for communication between isolates
const String _backgroundPortName = 'voiz_background_port';

// Task types
const String TASK_LOGOUT = 'voiz_logout_task';
const String TASK_DELETE_ACCOUNT = 'voiz_delete_account_task';

class BackgroundTaskService {
  static final BackgroundTaskService _instance = BackgroundTaskService._internal();

  factory BackgroundTaskService() {
    return _instance;
  }

  BackgroundTaskService._internal();

  // Initialize the background service
  Future<void> initialize() async {
    try {
      await Workmanager().initialize(
        callbackDispatcher,
        isInDebugMode: false,
      );
      debugPrint('BackgroundTaskService initialized successfully');
    } catch (e) {
      debugPrint('Failed to initialize BackgroundTaskService: $e');
    }
  }

  // Register a logout task to run in the background
  Future<void> registerLogoutTask() async {
    try {
      // Save current user ID for the background task
      final prefs = await SharedPreferences.getInstance();
      final userId = ProfileManager().getUserId() ?? '';
      await prefs.setString('pending_logout_user_id', userId);

      // Register a one-off task that will run even if the app is closed
      await Workmanager().registerOneOffTask(
        'logout_${DateTime.now().millisecondsSinceEpoch}',
        TASK_LOGOUT,
        existingWorkPolicy: ExistingWorkPolicy.replace,
        constraints: Constraints(
          networkType: NetworkType.connected,
        ),
        backoffPolicy: BackoffPolicy.linear,
        backoffPolicyDelay: const Duration(seconds: 5),
      );

      debugPrint('Logout task registered successfully');
    } catch (e) {
      debugPrint('Failed to register logout task: $e');
    }
  }

  // Register an account deletion task to run in the background
  Future<void> registerAccountDeletionTask() async {
    try {
      // Save current user ID for the background task
      final prefs = await SharedPreferences.getInstance();
      final userId = ProfileManager().getUserId() ?? '';
      await prefs.setString('pending_deletion_user_id', userId);

      // Register a one-off task that will run even if the app is closed
      await Workmanager().registerOneOffTask(
        'account_deletion_${DateTime.now().millisecondsSinceEpoch}',
        TASK_DELETE_ACCOUNT,
        existingWorkPolicy: ExistingWorkPolicy.replace,
        constraints: Constraints(
          networkType: NetworkType.connected,
        ),
        backoffPolicy: BackoffPolicy.linear,
        backoffPolicyDelay: const Duration(seconds: 5),
      );

      debugPrint('Account deletion task registered successfully');
    } catch (e) {
      debugPrint('Failed to register account deletion task: $e');
    }
  }
}

// This is the function that will be called by Workmanager when a task is executed
@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((taskName, inputData) async {
    try {
      debugPrint('Background task started: $taskName');

      // Set up a port for communication with the main isolate if needed
      final sendPort = IsolateNameServer.lookupPortByName(_backgroundPortName);

      switch (taskName) {
        case TASK_LOGOUT:
          await _performLogoutInBackground();
          break;
        case TASK_DELETE_ACCOUNT:
          await _performAccountDeletionInBackground();
          break;
        default:
          debugPrint('Unknown task: $taskName');
          return Future.value(false);
      }

      // Notify the main isolate that the task is complete if port is available
      sendPort?.send({'task': taskName, 'status': 'completed'});

      debugPrint('Background task completed: $taskName');
      return Future.value(true);
    } catch (e) {
      debugPrint('Error executing background task $taskName: $e');
      return Future.value(false);
    }
  });
}

// Perform logout operations in the background
Future<void> _performLogoutInBackground() async {
  try {
    debugPrint('Starting background logout process...');

    // Get the user ID from shared preferences
    final prefs = await SharedPreferences.getInstance();
    final userId = prefs.getString('pending_logout_user_id');

    if (userId == null || userId.isEmpty) {
      debugPrint('No pending logout user ID found');
      return;
    }

    // 🔧 FIX: Check if this is an app update scenario
    final isAppUpdate = await _isAppUpdateScenario(prefs);
    if (isAppUpdate) {
      debugPrint('🚫 App update detected - preserving user session');
      await prefs.remove('pending_logout_user_id'); // Clean up the task
      return;
    }

    // Clean up audio resources
    try {
      await AudioService().fullCleanup();
      debugPrint('Audio service cleaned up');
    } catch (e) {
      debugPrint('Error cleaning up audio service: $e');
    }

    // Clear notifications
    try {
      final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
          FlutterLocalNotificationsPlugin();
      await flutterLocalNotificationsPlugin.cancelAll();
      debugPrint('Notifications cleared');
    } catch (e) {
      debugPrint('Error clearing notifications: $e');
    }

    // Sign out using AuthService for proper session clearing
    try {
      final authService = AuthService();
      await authService.signOut();
      debugPrint('Signed out using AuthService (clears both secure storage and Amplify)');
    } catch (e) {
      debugPrint('Error signing out using AuthService: $e');
    }

    // Clear all local storage
    try {
      await prefs.clear();
      debugPrint('SharedPreferences cleared');
    } catch (e) {
      debugPrint('Error clearing SharedPreferences: $e');
    }

    debugPrint('Background logout process completed successfully');
  } catch (e) {
    debugPrint('Error during background logout: $e');
  }
}

// Perform account deletion operations in the background
Future<void> _performAccountDeletionInBackground() async {
  try {
    debugPrint('Starting background account deletion process...');

    // Get the user ID from shared preferences
    final prefs = await SharedPreferences.getInstance();
    final userId = prefs.getString('pending_deletion_user_id');

    if (userId == null || userId.isEmpty) {
      debugPrint('No pending deletion user ID found');
      return;
    }

    // Step 1: Call server API to delete account-related data
    try {
      await ApiService.deleteUserAccount(userId);
    } catch (e) {
      debugPrint('Error calling delete API: $e');
    }

    // Step 2: Delete the user from AWS Cognito
    try {
      await Amplify.Auth.deleteUser();
      debugPrint('User successfully deleted from Cognito');
    } catch (e) {
      debugPrint('Error deleting user from Cognito: $e');
    }

    // Step 3: Clean up audio resources
    try {
      await AudioService().fullCleanup();
      debugPrint('Audio service cleaned up');
    } catch (e) {
      debugPrint('Error cleaning up audio service: $e');
    }

    // Step 4: Clear notifications
    try {
      final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
          FlutterLocalNotificationsPlugin();
      await flutterLocalNotificationsPlugin.cancelAll();
      debugPrint('Notifications cleared');
    } catch (e) {
      debugPrint('Error clearing notifications: $e');
    }

    // Step 5: Clear all local storage
    try {
      await prefs.clear();
      debugPrint('SharedPreferences cleared');
    } catch (e) {
      debugPrint('Error clearing SharedPreferences: $e');
    }

    debugPrint('Background account deletion process completed successfully');
  } catch (e) {
    debugPrint('Error during background account deletion: $e');
  }
}

/// 🔧 FIX: Helper function to detect app update scenarios
Future<bool> _isAppUpdateScenario(SharedPreferences prefs) async {
  try {
    // Get current app version
    final packageInfo = await PackageInfo.fromPlatform();
    final currentVersion = packageInfo.version;
    final currentBuildNumber = packageInfo.buildNumber;
    
    // Get stored version from last app run
    final storedVersion = prefs.getString('last_app_version');
    final storedBuildNumber = prefs.getString('last_build_number');
    
    // Store current version for next time
    await prefs.setString('last_app_version', currentVersion);
    await prefs.setString('last_build_number', currentBuildNumber);
    
    // If no stored version, this is first run (not an update)
    if (storedVersion == null || storedBuildNumber == null) {
      debugPrint('🔍 First app run detected');
      return false;
    }
    
    // Check if version or build number changed
    final versionChanged = storedVersion != currentVersion;
    final buildChanged = storedBuildNumber != currentBuildNumber;
    
    if (versionChanged || buildChanged) {
      debugPrint('📱 App update detected: $storedVersion→$currentVersion, build: $storedBuildNumber→$currentBuildNumber');
      return true;
    }
    
    debugPrint('✅ No app update detected');
    return false;
  } catch (e) {
    debugPrint('⚠️ Error detecting app update: $e');
    return false; // Assume no update on error
  }
}
