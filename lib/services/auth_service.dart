// auth_service.dart
import 'package:amplify_flutter/amplify_flutter.dart';
import 'package:amplify_auth_cognito/amplify_auth_cognito.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

class AuthService {
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  // Secure storage for sensitive data
  static const _secureStorage = FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
    ),
  );

  // Storage keys
  static const String _keyUserId = 'user_id';
  static const String _keyUserEmail = 'user_email';
  static const String _keyUserCategory = 'user_category';
  static const String _keyUserFullName = 'user_full_name';
  static const String _keyLoginMethod = 'login_method';
  static const String _keySessionTimestamp = 'session_timestamp';
  static const String _keySessionValid = 'session_valid';

  // Session validity duration (30 days)
  static const Duration _sessionValidityDuration = Duration(days: 30);

  /// Check if user has a valid session
  Future<bool> hasValidSession() async {
    try {
      // First check Amplify Auth session
      final authSession = await Amplify.Auth.fetchAuthSession();
      if (!authSession.isSignedIn) {
        await clearSession();
        return false;
      }

      // Check if we have stored session data
      final sessionValid = await _secureStorage.read(key: _keySessionValid);
      if (sessionValid != 'true') {
        return false;
      }

      // Check session timestamp
      final timestampStr = await _secureStorage.read(key: _keySessionTimestamp);
      if (timestampStr == null) {
        return false;
      }

      final sessionTimestamp = DateTime.fromMillisecondsSinceEpoch(int.parse(timestampStr));
      final now = DateTime.now();
      
      if (now.difference(sessionTimestamp) > _sessionValidityDuration) {
        await clearSession();
        return false;
      }

      // Verify we have all required user data
      final userId = await _secureStorage.read(key: _keyUserId);
      final userEmail = await _secureStorage.read(key: _keyUserEmail);
      final userCategory = await _secureStorage.read(key: _keyUserCategory);
      final userFullName = await _secureStorage.read(key: _keyUserFullName);

      return userId != null && userEmail != null && userCategory != null && userFullName != null;
    } catch (e) {
      print('Error checking session validity: $e');
      await clearSession();
      return false;
    }
  }

  /// Save user session data securely
  Future<void> saveSession({
    required String userId,
    required String userEmail,
    required String userCategory,
    required String userFullName,
    required String loginMethod,
  }) async {
    try {
      final timestamp = DateTime.now().millisecondsSinceEpoch.toString();

      await Future.wait([
        _secureStorage.write(key: _keyUserId, value: userId),
        _secureStorage.write(key: _keyUserEmail, value: userEmail),
        _secureStorage.write(key: _keyUserCategory, value: userCategory),
        _secureStorage.write(key: _keyUserFullName, value: userFullName),
        _secureStorage.write(key: _keyLoginMethod, value: loginMethod),
        _secureStorage.write(key: _keySessionTimestamp, value: timestamp),
        _secureStorage.write(key: _keySessionValid, value: 'true'),
      ]);

      debugPrint('Session saved successfully for user: $userEmail');
    } catch (e) {
      debugPrint('Error saving session: $e');
      throw Exception('Failed to save session data');
    }
  }

  /// Get stored session data
  Future<Map<String, String>?> getSessionData() async {
    try {
      if (!await hasValidSession()) {
        return null;
      }

      final userId = await _secureStorage.read(key: _keyUserId);
      final userEmail = await _secureStorage.read(key: _keyUserEmail);
      final userCategory = await _secureStorage.read(key: _keyUserCategory);
      final userFullName = await _secureStorage.read(key: _keyUserFullName);
      final loginMethod = await _secureStorage.read(key: _keyLoginMethod);

      if (userId == null || userEmail == null || userCategory == null || userFullName == null) {
        return null;
      }

      return {
        'userId': userId,
        'userEmail': userEmail,
        'userCategory': userCategory,
        'userFullName': userFullName,
        'loginMethod': loginMethod ?? 'email',
      };
    } catch (e) {
      print('Error getting session data: $e');
      return null;
    }
  }

  /// Clear all session data
  Future<void> clearSession() async {
    try {
      await Future.wait([
        _secureStorage.delete(key: _keyUserId),
        _secureStorage.delete(key: _keyUserEmail),
        _secureStorage.delete(key: _keyUserCategory),
        _secureStorage.delete(key: _keyUserFullName),
        _secureStorage.delete(key: _keyLoginMethod),
        _secureStorage.delete(key: _keySessionTimestamp),
        _secureStorage.delete(key: _keySessionValid),
      ]);

      // Also clear SharedPreferences data for backward compatibility
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys().where((key) => 
        key.contains('_userId') || 
        key.contains('_userCategory') || 
        key.contains('_userFullName')
      ).toList();
      
      for (final key in keys) {
        await prefs.remove(key);
      }

      debugPrint('Session cleared successfully');
    } catch (e) {
      debugPrint('Error clearing session: $e');
    }
  }

  /// Sign out user completely
  Future<void> signOut() async {
    try {
      // Clear local session data first
      await clearSession();
      
      // Sign out from Amplify
      await Amplify.Auth.signOut();
      
      debugPrint('User signed out successfully');
    } catch (e) {
      debugPrint('Error during sign out: $e');
      // Even if Amplify sign out fails, we've cleared local data
    }
  }

  /// Check Amplify Auth session and refresh if needed
  Future<bool> checkAndRefreshAmplifySession() async {
    try {
      final authSession = await Amplify.Auth.fetchAuthSession();
      
      if (authSession.isSignedIn) {
        // Session is valid, Amplify handles token refresh automatically
        debugPrint('Amplify Auth session is valid');
        return true;
      } else {
        debugPrint('Amplify Auth session is not signed in');
        await clearSession();
        return false;
      }
    } catch (e) {
      debugPrint('Error checking Amplify session: $e');
      await clearSession();
      return false;
    }
  }

  /// Fetch user details from API
  Future<Map<String, String>?> fetchUserDetails(String email) async {
    try {
      final userData = await ApiService.fetchUserDetails(email);
      
      if (userData != null) {
        final userId = userData['user_id']?['S']?.toString() ?? '';
        final userCategory = userData['Category']?['S']?.toString() ?? '';
        final userFullName = userData['FullName']?['S']?.toString() ?? '';
        
        if (userId.isNotEmpty) {
          // Update last login platform
          await _updateLastLoginPlatform(userId);
          
          return {
            'userId': userId,
            'userCategory': userCategory,
            'userFullName': userFullName,
          };
        }
      }
      
      debugPrint('Failed to fetch user details');
      return null;
    } catch (e) {
      debugPrint('Error fetching user details: $e');
      return null;
    }
  }

  /// Update last login platform
  Future<void> _updateLastLoginPlatform(String userId) async {
    try {
      await ApiService.updateLastLoginPlatform(userId);
    } catch (e) {
      debugPrint('Error updating last login platform: $e');
    }
  }

  /// Get user email from Amplify attributes
  Future<String?> getCurrentUserEmail() async {
    try {
      final attributes = await Amplify.Auth.fetchUserAttributes();
      final emailAttribute = attributes.firstWhere(
        (attr) => attr.userAttributeKey == CognitoUserAttributeKey.email,
        orElse: () => AuthUserAttribute(
          userAttributeKey: CognitoUserAttributeKey.email,
          value: '',
        ),
      );

      return emailAttribute.value.isEmpty ? null : emailAttribute.value;
    } catch (e) {
      debugPrint('Error fetching user email: $e');
      return null;
    }
  }

  /// Initialize session from Amplify Auth (for existing logged-in users)
  Future<bool> initializeFromAmplifyAuth() async {
    try {
      if (!await checkAndRefreshAmplifySession()) {
        return false;
      }

      final email = await getCurrentUserEmail();
      if (email == null) {
        return false;
      }

      // Check if we already have valid session data
      if (await hasValidSession()) {
        final sessionData = await getSessionData();
        if (sessionData != null && sessionData['userEmail'] == email) {
          return true;
        }
      }

      // Fetch fresh user data from API
      final userDetails = await fetchUserDetails(email);
      if (userDetails == null) {
        return false;
      }

      // Save new session
      await saveSession(
        userId: userDetails['userId']!,
        userEmail: email,
        userCategory: userDetails['userCategory']!,
        userFullName: userDetails['userFullName']!,
        loginMethod: 'amplify_restore',
      );

      return true;
    } catch (e) {
      debugPrint('Error initializing from Amplify Auth: $e');
      return false;
    }
  }
}
