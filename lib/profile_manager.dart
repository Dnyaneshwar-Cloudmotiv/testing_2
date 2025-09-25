// profile_manager.dart
import 'dart:async';
import 'package:amplify_flutter/amplify_flutter.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:voiceapp/services/api_service.dart';

class ProfileManager {
  static ProfileManager? _instance;
  String? profileImageUrl;
  String? coverImageUrl;
  String? userId;
  ValueNotifier<String?> username = ValueNotifier<String?>(null);
  ValueNotifier<String?> email = ValueNotifier<String?>(null);
  ValueNotifier<String?> phoneNumber = ValueNotifier<String?>(null);
  static final ValueNotifier<String?> currentlyPlayingSongIdNotifier = ValueNotifier<String?>(null);
  Map<String, String> _lastPlayedSourceInfo = {};
  //String? _currentlyPlayingSongId;
  //final StreamController<String?> _songIdController = StreamController.broadcast();

  // Private constructor
  ProfileManager._internal();

  // Factory constructor with reset capability
  factory ProfileManager() {
    _instance ??= ProfileManager._internal();
    return _instance!;
  }

  // Method to reset singleton instance
  static void resetInstance() {
    _instance?.dispose();
    _instance = ProfileManager._internal();
  }

  void clearCurrentlyPlayingSong() {
    currentlyPlayingSongIdNotifier.value = null;
  }


  Future<void> initialize(String userId) async {
    // Clear existing data before initialization
    _clearProfileData();
    
    // Set new userId
    this.userId = userId;
    
    // Fetch all user data
    try {
      await Future.wait([
        _fetchUserDetails(),
        _fetchAndSetProfileImage(),
        _fetchAndSetCoverImage(),
        _fetchAndSetUsername(),
      ]);
    } catch (e) {
      print('Error during initialization: $e');
      _clearProfileData(); // Clear data if initialization fails
    }
  }

  void _clearProfileData() {
    profileImageUrl = null;
    coverImageUrl = null;
    userId = null;
    username.value = null;
    email.value = null;
    phoneNumber.value = null;
  }

  Future<void> _fetchAndSetProfileImage() async {
    if (userId != null) {
      profileImageUrl = await _fetchProfileImage();
    }
  }

  Future<void> _fetchAndSetCoverImage() async {
    if (userId != null) {
      coverImageUrl = await _fetchCoverImage();
    }
  }

  Future<void> _fetchAndSetUsername() async {
    if (userId != null) {
      username.value = await _fetchUsername();
    }
  }

  void updateCurrentlyPlayingSong(String songId) {
    currentlyPlayingSongIdNotifier.value = songId;
  }

  // Method to get current song ID
  String? getCurrentlyPlayingSongId() {
    return currentlyPlayingSongIdNotifier.value;
  }



  String? getUserId() {
    return userId;
  }

  //String? get currentlyPlayingSongId => _currentlyPlayingSongId;
  
  //Stream<String?> get currentlyPlayingSongStream => _songIdController.stream;

  // void updateCurrentlyPlayingSong(String? songId) {
  //   _currentlyPlayingSongId = songId;
  //   _songIdController.add(songId);
  // }

  void clear() {
    _clearProfileData();
    // Only clear audio state if explicitly needed

  }

  Future<void> _fetchUserDetails() async {
    try {
      var session = await Amplify.Auth.fetchAuthSession();
      if (!session.isSignedIn) {
        email.value = null;
        return;
      }

      List<AuthUserAttribute> attributes = await Amplify.Auth.fetchUserAttributes();
      email.value = attributes
          .firstWhere(
            (attr) => attr.userAttributeKey == CognitoUserAttributeKey.email,
            orElse: () => AuthUserAttribute(
              userAttributeKey: CognitoUserAttributeKey.email,
              value: '',
            ),
          )
          .value;
    } catch (e) {
      print('Error fetching user email: $e');
      email.value = null;
    }
  }

  void setUserId(String id) {
    userId = id;
    print("user id set to $id");
  }

  Future<void> fetchUpdatedProfileImage() async {
    if (userId != null) {
      profileImageUrl = await _fetchProfileImage();
    }
  }

  Future<void> fetchUpdatedCoverImage() async {
    if (userId != null) {
      coverImageUrl = await _fetchCoverImage();
    }
  }

  Future<void> fetchUpdatedUsername() async {
    if (userId != null) {
      username.value = await _fetchUsername();
    }
  }

  Future<String?> _fetchProfileImage() async {
    if (userId == null) return null;
    try {
      final response = await ApiService.getProfilePhoto(userId!);
      if (response.statusCode == 200) {
        final responseBody = json.decode(response.body);
        return responseBody['profilePhotoUrl']?['S'];
      }
      return null;
    } catch (e) {
      debugPrint('Error fetching profile image: $e');
      return null;
    }
  }

  Future<String?> _fetchCoverImage() async {
    if (userId == null) return null;
    try {
      final response = await ApiService.getCoverPageImage(userId!);
      if (response.statusCode == 200) {
        final responseBody = json.decode(response.body);
        return responseBody['coverPageUrl']?['S'];
      }
      return null;
    } catch (e) {
      debugPrint('Error fetching cover image: $e');
      return null;
    }
  }

  Future<String?> _fetchUsername() async {
    if (userId == null) return null;
    
    try {
      final response = await ApiService.getProfileDetails(userId!);
      if (response.statusCode == 200) {
        final responseBody = json.decode(response.body);
        String? stageName = responseBody['StageName']?['S'];
        String? fullName = responseBody['FullName']?['S'];

        String? phoneNumberFromResponse = responseBody['PhoneNumber']?['S'];
        phoneNumber.value = phoneNumberFromResponse?.trim();

        return stageName?.trim().isNotEmpty == true ? stageName : fullName ?? 'unknown';
      }
      return null;
    } catch (e) {
      debugPrint('Error fetching profile details: $e');
      return null;
    }
  }

  void updateProfileImageUrl(String newUrl) {
    profileImageUrl = newUrl;
  }

  void updateCoverImageUrl(String newUrl) {
    coverImageUrl = newUrl;
  }

  void updateUsername(String newUsername) {
    username.value = newUsername;
  }

  void dispose() {
    _clearProfileData();
    //_songIdController.close();
  }

  void setLastPlayedSourceInfo(Map<String, String> info) {
    _lastPlayedSourceInfo = info;
  }

  Map<String, String> getLastPlayedSourceInfo() {
    return _lastPlayedSourceInfo;
  }
}