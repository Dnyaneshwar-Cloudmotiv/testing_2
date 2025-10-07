// splash_screen.dart
import 'dart:io';
import 'dart:async';
import 'package:amplify_auth_cognito/amplify_auth_cognito.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:amplify_flutter/amplify_flutter.dart';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:voiceapp/NewHomepage.dart';
import 'package:voiceapp/amplifyconfiguration.dart';
import 'package:voiceapp/services/auth_service.dart';
import 'package:voiceapp/services/api_service.dart';
import 'package:firebase_remote_config/firebase_remote_config.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'main.dart';

class SplashScreen extends StatefulWidget {
  @override
  _SplashScreenState createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  // State variables
  bool _amplifyConfigured = false;
  bool _isInitializing = true;
  final AuthService _authService = AuthService();

  // Constants
  static const int UPDATE_CHECK_INTERVAL = 172800000; // 2 days in milliseconds
  static const Duration SPLASH_DURATION = Duration(seconds: 2);
  static const String PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.voizapp.voiceapp';

  @override
  void initState() {
    super.initState();
    _initializeApp();
  }

  /// Main initialization method
  Future<void> _initializeApp() async {
    if (!mounted) return;

    try {
      await _initializeFirebase();
      await _performUpdateCheck();
      await _showSplashScreen();
      await _setupAmplify();
      await _logDeviceInformation();
      await _handleUserAuthentication();
    } catch (e) {
      _handleInitializationError(e);
    } finally {
      _setInitializationComplete();
    }
  }

  /// Initialize Firebase
  Future<void> _initializeFirebase() async {
    await Firebase.initializeApp();
    debugPrint("✅ Firebase initialized successfully");
  }

  /// Check for app updates
  Future<void> _performUpdateCheck() async {
    try {
      if (!await _shouldCheckForUpdate()) {
        return;
      }

      await _checkForAppUpdate();
    } catch (e) {
      debugPrint('⚠️ Error during update check: $e');
    }
  }

  /// Show splash screen for minimum duration
  Future<void> _showSplashScreen() async {
    await Future.delayed(SPLASH_DURATION);
  }

  /// Setup Amplify configuration
  Future<void> _setupAmplify() async {
    if (!_amplifyConfigured) {
      await _configureAmplify();
    }
  }

  /// Log device information if needed
  Future<void> _logDeviceInformation() async {
    await _logDeviceInfo();
  }

  /// Handle user authentication flow
  Future<void> _handleUserAuthentication() async {
    await _checkLoginState();
  }

  /// Handle initialization errors
  void _handleInitializationError(dynamic error) {
    debugPrint('❌ Error during initialization: $error');
    _navigateToFirstPage();
  }

  /// Mark initialization as complete
  void _setInitializationComplete() {
    if (mounted) {
      setState(() {
        _isInitializing = false;
      });
    }
  }

  /// Determine if update check is needed based on last check time
  Future<bool> _shouldCheckForUpdate() async {
    final prefs = await SharedPreferences.getInstance();
    final lastCheckTime = prefs.getInt('last_update_check') ?? 0;
    final currentTime = DateTime.now().millisecondsSinceEpoch;
    final timeDifference = currentTime - lastCheckTime;

    if (timeDifference < UPDATE_CHECK_INTERVAL) {
      final timeAgo = _formatTimeDifference(timeDifference);
      debugPrint('⏰ Skipping update check - last check was $timeAgo ago');
      return false;
    }

    return true;
  }

  /// Format time difference for logging
  String _formatTimeDifference(int timeDifference) {
    if (timeDifference < 3600000) {
      return '${timeDifference ~/ 60000} minutes';
    } else if (timeDifference < 86400000) {
      return '${timeDifference ~/ 3600000} hours';
    } else {
      return '${timeDifference ~/ 86400000} days';
    }
  }

  /// Check for app updates
  Future<void> _checkForAppUpdate() async {
    try {
      await _updateLastCheckTime();
      
      // Get current version from package info
      final packageInfo = await PackageInfo.fromPlatform();
      final currentVersion = packageInfo.version;
      
      /// Setup Firebase Remote Config
      await _setupRemoteConfig();
      
      // Get latest version from remote config
      final remoteConfig = FirebaseRemoteConfig.instance;
      final latestVersion = remoteConfig.getString('latest_app_version');
      
      debugPrint('📱 Version check - Current: $currentVersion, Latest: $latestVersion');

      if (latestVersion.isNotEmpty && _isNewVersionAvailable(currentVersion, latestVersion)) {
        await _handleNewVersionAvailable(latestVersion);
      } else {
        debugPrint('✅ App is up to date');
      }
    } catch (e) {
      debugPrint('⚠️ Error checking app version: $e');
    }
  }

  /// Setup Firebase Remote Config
  Future<void> _setupRemoteConfig() async {
    final remoteConfig = FirebaseRemoteConfig.instance;
    await remoteConfig.setConfigSettings(RemoteConfigSettings(
      fetchTimeout: const Duration(seconds: 10),
      minimumFetchInterval: const Duration(hours: 1),
    ));
    
    // Set default values
    await remoteConfig.setDefaults({
      'latest_app_version': '1.0.0',
    });
    
    // Fetch and activate
    try {
      await remoteConfig.fetchAndActivate();
      debugPrint('✅ Remote config initialized successfully');
    } catch (e) {
      debugPrint('⚠️ Error initializing remote config: $e');
    }
  }

  /// Update last check time in preferences
  Future<void> _updateLastCheckTime() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('last_update_check', DateTime.now().millisecondsSinceEpoch);
  }

  // Removed _getCurrentAppVersion as it's no longer needed

  /// Handle new version availability
  Future<void> _handleNewVersionAvailable(String latestVersion) async {
    final prefs = await SharedPreferences.getInstance();
    final skippedVersion = prefs.getString('skipped_version');
    final cleanLatestVersion = _extractVersionNumber(latestVersion);

    if (skippedVersion != cleanLatestVersion) {
      _showUpdateDialog();
    } else {
      debugPrint('ℹ️ User has skipped version $cleanLatestVersion');
    }
  }

  /// Extract version number from version string
  String _extractVersionNumber(String versionString) {
    final cleanVersion = versionString.replaceAll(RegExp(r'^version:\s*'), '');
    final versionMatch = RegExp(r'(\d+\.\d+\.\d+(?:\+\d+)?)').firstMatch(cleanVersion);
    return versionMatch?.group(1) ?? cleanVersion;
  }

  /// Compare version numbers to determine if update is available
  bool _isNewVersionAvailable(String currentVersion, String latestVersion) {
    final current = _extractVersionNumber(currentVersion);
    final latest = _extractVersionNumber(latestVersion);

    debugPrint('🔍 Comparing versions - Current: $current, Latest: $latest');

    final currentParts = current.split('+');
    final latestParts = latest.split('+');

    final currentVersionOnly = currentParts[0];
    final latestVersionOnly = latestParts[0];

    final currentBuild = currentParts.length > 1 ? int.tryParse(currentParts[1]) ?? 0 : 0;
    final latestBuild = latestParts.length > 1 ? int.tryParse(latestParts[1]) ?? 0 : 0;

    return _compareVersions(currentVersionOnly, latestVersionOnly, currentBuild, latestBuild);
  }

  /// Compare version segments and build numbers
  bool _compareVersions(String currentVersion, String latestVersion, int currentBuild, int latestBuild) {
    final currentSegments = currentVersion.split('.').map(int.parse).toList();
    final latestSegments = latestVersion.split('.').map(int.parse).toList();
    final maxLength = currentSegments.length > latestSegments.length
        ? currentSegments.length
        : latestSegments.length;

    for (int i = 0; i < maxLength; i++) {
      final currentSegment = i < currentSegments.length ? currentSegments[i] : 0;
      final latestSegment = i < latestSegments.length ? latestSegments[i] : 0;

      if (latestSegment > currentSegment) return true;
      if (latestSegment < currentSegment) return false;
    }

    return latestBuild > currentBuild;
  }

  /// Show update dialog to user
  void _showUpdateDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext dialogContext) => _buildUpdateDialog(dialogContext),
    );
  }

  /// Build update dialog widget
  Widget _buildUpdateDialog(BuildContext dialogContext) {
    return AlertDialog(
      title: const Text('New Version Available'),
      content: const Text('A new version of the app is available. Please update to continue using the app.'),
      actions: [
        Center(
          child: ElevatedButton(
            onPressed: () => _handleUpdateButtonPress(dialogContext),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF2644D9),
              foregroundColor: Colors.white,
            ),
            child: const Text('Update Now'),
          ),
        ),
      ],
    );
  }

  /// Handle update button press
  Future<void> _handleUpdateButtonPress(BuildContext dialogContext) async {
    Navigator.of(dialogContext).pop();
    await _launchPlayStore();
  }

  /// Launch Play Store for app update
  Future<void> _launchPlayStore() async {
    try {
      final uri = Uri.parse(PLAY_STORE_URL);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        _showErrorSnackBar('Could not open Play Store. Please update manually.');
      }
    } catch (e) {
      debugPrint('❌ Error opening Play Store: $e');
      _showErrorSnackBar('Error opening Play Store. Please try again.');
    }
  }

  /// Show error snack bar
  void _showErrorSnackBar(String message) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message)),
      );
    }
  }

  /// Configure Amplify
  Future<void> _configureAmplify() async {
    try {
      final authPlugin = AmplifyAuthCognito();
      await Amplify.addPlugins([authPlugin]);
      await Amplify.configure(amplifyconfig);

      setState(() {
        _amplifyConfigured = true;
      });

      debugPrint('✅ Amplify configured successfully');
    } catch (e) {
      debugPrint('❌ Error configuring Amplify: $e');
      _navigateToFirstPage();
    }
  }

  /// Log device information to backend API
  Future<void> _logDeviceInfo() async {
    try {
      if (!await _shouldLogDeviceInfo()) {
        return;
      }

      final deviceInfo = await _collectDeviceInfo();
      await _sendDeviceInfoToAPI(deviceInfo);
    } catch (e) {
      debugPrint("⚠️ Error logging device info: $e");
    }
  }

  /// Determine if device info should be logged
  Future<bool> _shouldLogDeviceInfo() async {
    final prefs = await SharedPreferences.getInstance();
    final email = await _getUserEmail();

    if (email == null || email.isEmpty) {
      debugPrint("ℹ️ No email found → proceeding with device log API");
      return true;
    }

    if (_isGmailUser(email)) {
      debugPrint("ℹ️ Gmail user detected ($email) → skipping /dev/log API");
      return false;
    }

    final userId = prefs.getString('${email}_userId');
    if (userId != null && userId.isNotEmpty) {
      debugPrint("ℹ️ UserId already found ($userId) for non-Gmail user → skipping /dev/log API");
      return false;
    }

    debugPrint("ℹ️ Non-Gmail user without userId → proceeding with device log API");
    return true;
  }

  /// Check if user is using Gmail
  bool _isGmailUser(String email) {
    return email.toLowerCase().endsWith('@gmail.com');
  }

  /// Collect device information
  Future<Map<String, String>> _collectDeviceInfo() async {
    final deviceInfo = DeviceInfoPlugin();

    if (Platform.isAndroid) {
      return await _getAndroidDeviceInfo(deviceInfo);
    } else if (Platform.isIOS) {
      return await _getIOSDeviceInfo(deviceInfo);
    }

    return _getDefaultDeviceInfo();
  }

  /// Get Android device information
  Future<Map<String, String>> _getAndroidDeviceInfo(DeviceInfoPlugin deviceInfo) async {
    final androidInfo = await deviceInfo.androidInfo;
    return {
      'deviceName': "${androidInfo.manufacturer} ${androidInfo.model}",
      'deviceId': androidInfo.id,
      'osVersion': "Android ${androidInfo.version.release}",
      'buildVersion': androidInfo.version.incremental.isNotEmpty
          ? androidInfo.version.incremental
          : "SDK ${androidInfo.version.sdkInt}",
    };
  }

  /// Get iOS device information
  Future<Map<String, String>> _getIOSDeviceInfo(DeviceInfoPlugin deviceInfo) async {
    final iosInfo = await deviceInfo.iosInfo;
    return {
      'deviceName': "${iosInfo.name} ${iosInfo.model}",
      'deviceId': iosInfo.identifierForVendor ?? "Unknown ID",
      'osVersion': "${iosInfo.systemName} ${iosInfo.systemVersion}",
      'buildVersion': iosInfo.systemVersion,
    };
  }

  /// Get default device information
  Map<String, String> _getDefaultDeviceInfo() {
    return {
      'deviceName': "Unknown Device",
      'deviceId': "Unknown ID",
      'osVersion': "Unknown Version",
      'buildVersion': "Unknown Build",
    };
  }

  /// Send device information to API
  Future<void> _sendDeviceInfoToAPI(Map<String, String> deviceInfo) async {
    debugPrint("🌐 Sending device info to API");
    await ApiService.logDeviceInfo(deviceInfo);
  }
  /// Check user's login state and navigate accordingly
  Future<void> _checkLoginState() async {
    if (!_amplifyConfigured) return;

    try {
      debugPrint('🔐 Checking authentication state...');

      if (await _hasValidStoredSession()) {
        await _navigateWithStoredSession();
        return;
      }

      // 🔧 FIX: Add session recovery mechanism with retry logic
      if (await _attemptSessionRecovery()) {
        debugPrint('✅ Session recovery successful');
        final sessionData = await _authService.getSessionData();
        if (sessionData != null) {
          _navigateToHomePage(sessionData);
          return;
        }
      }

      if (await _canInitializeFromAmplifyAuth()) {
        await _navigateWithAmplifySession();
        return;
      }

      _handleNoValidAuthentication();
    } catch (e) {
      await _handleAuthenticationError(e);
    }
  }

  /// 🔧 FIX: Session recovery mechanism for post-update scenarios
  Future<bool> _attemptSessionRecovery() async {
    try {
      debugPrint('🔄 Attempting session recovery...');
      
      // Give Amplify Auth time to initialize after app update
      await Future.delayed(const Duration(seconds: 1));
      
      // Try to restore session from secure storage with Amplify Auth retry
      for (int attempt = 1; attempt <= 3; attempt++) {
        try {
          debugPrint('🔄 Session recovery attempt $attempt/3');
          
          // Check if Amplify Auth is ready
          final authSession = await Amplify.Auth.fetchAuthSession();
          if (authSession.isSignedIn) {
            // Try to restore session data
            final email = await _authService.getCurrentUserEmail();
            if (email != null) {
              final userDetails = await _authService.fetchUserDetails(email);
              if (userDetails != null) {
                await _authService.saveSession(
                  userId: userDetails['userId']!,
                  userEmail: email,
                  userCategory: userDetails['userCategory']!,
                  userFullName: userDetails['userFullName']!,
                  loginMethod: 'session_recovery',
                );
                debugPrint('✅ Session recovery successful on attempt $attempt');
                return true;
              }
            }
          }
        } catch (e) {
          debugPrint('⚠️ Session recovery attempt $attempt failed: $e');
        }
        
        if (attempt < 3) {
          await Future.delayed(Duration(seconds: attempt * 2)); // Exponential backoff
        }
      }
      
      debugPrint('❌ Session recovery failed after 3 attempts');
      return false;
    } catch (e) {
      debugPrint('❌ Session recovery error: $e');
      return false;
    }
  }

  /// Check if there's a valid stored session
  Future<bool> _hasValidStoredSession() async {
    return await _authService.hasValidSession();
  }

  /// Navigate with stored session data
  Future<void> _navigateWithStoredSession() async {
    debugPrint('✅ Valid session found in secure storage');
    final sessionData = await _authService.getSessionData();

    if (sessionData != null) {
      debugPrint('🏠 Navigating to home page with stored session data');
      _navigateToHomePage(sessionData);
    }
  }

  /// Check if session can be initialized from Amplify Auth
  Future<bool> _canInitializeFromAmplifyAuth() async {
    debugPrint('🔍 No valid session found, checking Amplify Auth...');
    return await _authService.initializeFromAmplifyAuth();
  }

  /// Navigate with Amplify session data
  Future<void> _navigateWithAmplifySession() async {
    debugPrint('✅ Successfully initialized session from Amplify Auth');
    final sessionData = await _authService.getSessionData();

    if (sessionData != null) {
      _navigateToHomePage(sessionData);
    }
  }

  /// Handle case when no valid authentication is found
  void _handleNoValidAuthentication() {
    debugPrint('🚫 No valid authentication found, redirecting to login');
    _navigateToFirstPage();
  }

  /// Handle authentication errors
  Future<void> _handleAuthenticationError(dynamic error) async {
    debugPrint('❌ Error checking login state: $error');
    await _authService.clearSession();
    _navigateToFirstPage();
  }

  /// Navigate to home page with session data
  void _navigateToHomePage(Map<String, String> sessionData) {
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (context) => NewHomePage(
          email: sessionData['userId']!,
          category: sessionData['userCategory']!,
          userfullname: sessionData['userFullName']!,
        ),
      ),
    );
  }

  /// Navigate to the initial page (FirstPage)
  void _navigateToFirstPage() {
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (context) => FirstPage()),
    );
  }

  /// Get user's email from Amplify attributes
  Future<String?> _getUserEmail() async {
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
      debugPrint('⚠️ Error fetching email: $e');
      return null;
    }
  }

  /// Fetch user ID and category from backend API
  Future<Map<String, String>?> _fetchUserIdAndCategory(String email) async {
    try {
      final userDetails = await ApiService.getUserDetails(email);
      if (userDetails != null) {
        return {
          'userId': userDetails['userId'] ?? '',
          'userCategory': userDetails['userCategory'] ?? '',
          'userfullname': userDetails['userFullName'] ?? '',
        };
      }
    } catch (e) {
      debugPrint('⚠️ Error fetching user details: $e');
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _buildSplashScreenUI(),
    );
  }

  /// Build the splash screen UI
  Widget _buildSplashScreenUI() {
    return Stack(
      children: [
        _buildGradientBackground(),
        _buildLogoContainer(),
      ],
    );
  }

  /// Build gradient background layers
  Widget _buildGradientBackground() {
    return Stack(
      children: [
        _buildGradientLayer(1.0, Color(0xFF211F20), Color(0xFF211F20)),
        _buildGradientLayer(0.7, Color(0xFF2A2829), Colors.transparent),
        _buildGradientLayer(0.4, Color(0xFF333132), Colors.transparent),
      ],
    );
  }

  /// Build individual gradient layer
  Widget _buildGradientLayer(double radius, Color centerColor, Color edgeColor) {
    return Container(
      decoration: BoxDecoration(
        gradient: RadialGradient(
          center: Alignment(0.0, 0.0),
          radius: radius,
          colors: [centerColor.withOpacity(1), edgeColor],
        ),
      ),
    );
  }

  /// Build logo container
  Widget _buildLogoContainer() {
    return Center(
      child: Container(
        width: 500,
        height: 500,
        child: Image.asset(
          'assets/logo_final.png',
          color: const Color(0xFFFFFFFF),
          fit: BoxFit.contain,
        ),
      ),
    );
  }
}