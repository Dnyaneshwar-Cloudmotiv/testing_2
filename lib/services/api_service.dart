import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';
import 'package:flutter/foundation.dart';
import 'package:amplify_flutter/amplify_flutter.dart';
import 'package:amplify_auth_cognito/amplify_auth_cognito.dart';
import 'api_endpoints.dart';

/// Centralized API service for all HTTP requests in the Voiz app
/// Provides consistent error handling, logging, and request configuration
class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  static final http.Client _client = http.Client();
  
  // 🔧 Follow State Cache - Persistent across widget lifecycles
  static Map<String, bool> _followStateCache = {};
  static DateTime _cacheTimestamp = DateTime.now();
  static const Duration _cacheValidityDuration = Duration(minutes: 10);

  // Common headers
  static const Map<String, String> _jsonHeaders = {
    'Content-Type': 'application/json',
  };

  // Helper method to generate timestamp
  static String get timestamp => DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());

  /// Generic GET request with enhanced error handling
  static Future<http.Response> get(
    String url, {
    Map<String, String>? headers,
    Duration? timeout,
  }) async {
    try {
      final response = await _client.get(
        Uri.parse(url),
        headers: headers,
      ).timeout(timeout ?? ApiEndpoints.defaultTimeout);
      
      _logRequest('GET', url, response.statusCode);
      
      if (!isSuccessResponse(response)) {
        _logError('GET', url, 'HTTP ${response.statusCode}: ${getErrorMessage(response)}');
      }
      
      return response;
    } on SocketException {
      _logError('GET', url, 'No internet connection');
      rethrow;
    } on TimeoutException {
      _logError('GET', url, 'Request timeout');
      rethrow;
    } catch (e) {
      _logError('GET', url, e);
      rethrow;
    }
  }

  /// Generic POST request with enhanced error handling
  static Future<http.Response> post(
    String url, {
    Map<String, dynamic>? body,
    Map<String, String>? headers,
    Duration? timeout,
  }) async {
    try {
      final response = await _client.post(
        Uri.parse(url),
        headers: headers ?? _jsonHeaders,
        body: body != null ? jsonEncode(body) : null,
      ).timeout(timeout ?? ApiEndpoints.defaultTimeout);
      
      _logRequest('POST', url, response.statusCode);
      
      if (!isSuccessResponse(response)) {
        _logError('POST', url, 'HTTP ${response.statusCode}: ${getErrorMessage(response)}');
      }
      
      return response;
    } on SocketException {
      _logError('POST', url, 'No internet connection');
      rethrow;
    } on TimeoutException {
      _logError('POST', url, 'Request timeout');
      rethrow;
    } catch (e) {
      _logError('POST', url, e);
      rethrow;
    }
  }

  /// Generic PUT request
  static Future<http.Response> put(
    String url, {
    Map<String, dynamic>? body,
    Map<String, String>? headers,
    Duration? timeout,
  }) async {
    try {
      final response = await _client.put(
        Uri.parse(url),
        headers: headers ?? _jsonHeaders,
        body: body != null ? jsonEncode(body) : null,
      ).timeout(timeout ?? ApiEndpoints.defaultTimeout);
      
      _logRequest('PUT', url, response.statusCode);
      return response;
    } catch (e) {
      _logError('PUT', url, e);
      rethrow;
    }
  }

  /// Generic DELETE request
  static Future<http.Response> delete(
    String url, {
    Map<String, String>? headers,
    Duration? timeout,
  }) async {
    try {
      final response = await _client.delete(
        Uri.parse(url),
        headers: headers,
      ).timeout(timeout ?? ApiEndpoints.defaultTimeout);
      
      _logRequest('DELETE', url, response.statusCode);
      return response;
    } catch (e) {
      _logError('DELETE', url, e);
      rethrow;
    }
  }

  // S3 upload helper method
  static Future<http.Response> uploadToS3(String presignedUrl, List<int> fileBytes) async {
    try {
      final response = await http.put(
        Uri.parse(presignedUrl),
        body: fileBytes,
        headers: {
          'Content-Type': 'audio/mpeg',
        },
      );
      
      _logRequest('S3 Upload', presignedUrl, response.statusCode);
      return response;
    } catch (e) {
      print('Error uploading to S3: $e');
      rethrow;
    }
  }

  // Playlist management methods
  static Future<http.Response> getUserPlaylists(String userId) async {
    return await get('${ApiEndpoints.userPlaylists}?user_id=$userId');
  }


  static Future<http.Response> updatePlaylistName(Map<String, dynamic> data) async {
    return await post(ApiEndpoints.updatePlaylistName, body: data);
  }

  static Future<http.Response> deletePlaylist(Map<String, dynamic> data) async {
    return await post(ApiEndpoints.deletePlaylist, body: data);
  }

  // Profile and user data methods
  static Future<http.Response> getLovedTracks(String userId) async {
    return await get('${ApiEndpoints.lovedTracks}?user_id=$userId');
  }

  static Future<http.Response> getAdminSongs(String status) async {
    return await get('${ApiEndpoints.adminSongs}?decision=$status');
  }

  /// Gets all songs uploaded by a specific user (for Your Uploads section)
  /// Falls back to approverListPhone if adminSongs doesn't work with user_id
  static Future<http.Response> getUserUploadedSongs(String userId) async {
    try {
      // First try the adminSongs endpoint with authentication
      final token = await getAuthToken();
      final response = await get('${ApiEndpoints.adminSongs}?user_id=$userId', headers: getAuthHeaders(token));
      
      if (response.statusCode == 400) {
        // If 400 error, fall back to approverListPhone but include all statuses
        print('⚠️ AdminSongs endpoint returned 400, falling back to approverListPhone');
        return await get('https://py529n10q0.execute-api.ap-south-1.amazonaws.com/voiz/api/approverListPhone?user_id=$userId');
      }
      
      return response;
    } catch (e) {
      print('❌ Error with adminSongs endpoint: $e, falling back to approverListPhone');
      // Fallback to the original endpoint
      return await get('https://py529n10q0.execute-api.ap-south-1.amazonaws.com/voiz/api/approverListPhone?user_id=$userId');
    }
  }

  static Future<http.Response> getUserHistory(String userId) async {
    return await get('${ApiEndpoints.userHistory}?user_id=$userId');
  }

  static Future<http.Response> getSongDetails(String songId) async {
    return await get('${ApiEndpoints.songDetails}?song_id=$songId');
  }

  // Search and discovery methods
  static Future<http.Response> getSongsByLanguage(String language) async {
    return await get('${ApiEndpoints.songsByLanguage}?languages=$language');
  }

  static Future<http.Response> checkFollowStatus(String userId, String artistId) async {
    return await get('${ApiEndpoints.checkFollowStatus}?user_id=$userId&artistId=$artistId');
  }

  static Future<http.Response> getCoverPage(String userId) async {
    return await get('${ApiEndpoints.getCoverPage}?user_id=$userId');
  }

  // Profile Management APIs
  static Future<http.Response> getFollowerCount(String userId) {
    return get('${ApiEndpoints.followersCountUrl}?user_id=$userId');
  }

  static Future<http.Response> getFollowingCount(String userId) {
    return get(ApiEndpoints.getFollowingCount(userId));
  }


  static Future<http.Response> saveAutoPlayStatus(Map<String, dynamic> data) {
    return post(ApiEndpoints.autoPlayStatusUrl, body: data);
  }

  // Song Management APIs
  static Future<http.Response> getFavoriteReaction(String userId, String songId) {
    return get(ApiEndpoints.getFavoriteReaction(userId, songId));
  }

  static Future<http.Response> updateSongFavorite(Map<String, dynamic> data) {
    return post(ApiEndpoints.songFavoriteUrl, body: data);
  }

  static Future<http.Response> updateSongReaction(Map<String, dynamic> data) {
    return post(ApiEndpoints.songReactionUrl, body: data);
  }

  // Song Upload APIs
  static Future<http.Response> generatePresignedUrls(Map<String, dynamic> data) {
    return post(ApiEndpoints.generatePresignedUrlsUrl, body: data);
  }

  static Future<http.Response> generatePresignedUrlsBulk(Map<String, dynamic> data) {
    return post(ApiEndpoints.generatePresignedUrlsBulkUrl, body: data);
  }

  static Future<http.Response> processSong(Map<String, dynamic> data) {
    return post(ApiEndpoints.processSongUrl, body: data);
  }

  static Future<http.Response> processMultipleSongs(Map<String, dynamic> data) {
    return post(
      ApiEndpoints.processMultipleSongsUrl, 
      body: data,
      timeout: ApiEndpoints.uploadTimeout,
    );
  }

  static Future<http.Response> createJob(Map<String, dynamic> data) async {
    // These endpoints don't accept Bearer token authentication
    return post(ApiEndpoints.createJobUrl, body: data);
  }

  static Future<http.Response> updateSongTable(Map<String, dynamic> data) async {
    // These endpoints don't accept Bearer token authentication
    return post(ApiEndpoints.songTableUrl, body: data);
  }

  // Admin APIs
  static Future<http.Response> getAdminEmails() {
    return get(ApiEndpoints.adminEmailsUrl, timeout: Duration(seconds: 30));
  }

  static Future<http.Response> sendAdminApprovalEmail(Map<String, dynamic> data) {
    return post(ApiEndpoints.adminApprovalEmailUrl, body: data);
  }

  static Future<http.Response> sendAdminApprovalMultipleSongs(Map<String, dynamic> data) {
    return post(ApiEndpoints.adminApprovalMultipleSongsUrl, body: data);
  }

  // User & Authentication APIs
  static Future<http.Response> logDevice(Map<String, dynamic> data) {
    return post(ApiEndpoints.deviceLogUrl, body: data);
  }

  static Future<http.Response> getUserId(Map<String, dynamic> data) {
    return post(ApiEndpoints.userApiUrl, body: data);
  }

  // Login specific APIs
  static Future<http.Response> getUserByEmail(String email) {
    return get(ApiEndpoints.getUserIdByEmail(email));
  }

  static Future<http.Response> getMandateDetails(String userId) {
    return get(ApiEndpoints.getMandateDetails(userId));
  }

  static Future<http.Response> updateLastLogin(Map<String, dynamic> data) {
    return post(ApiEndpoints.updateLastLoginUrl, body: data);
  }

  static Future<http.Response> createGooglePassword(Map<String, dynamic> data) {
    return post(ApiEndpoints.createPasswordUrl, body: data);
  }

  static Future<http.Response> saveFirebaseToken(Map<String, dynamic> data) {
    return post(ApiEndpoints.saveTokenUrl, body: data);
  }

  static Future<http.Response> getArtistAllSongs(String userId) {
    return get(ApiEndpoints.getArtistAllSongs(userId));
  }

  // Song Upload APIs
  static Future<http.Response> uploadSong(Map<String, dynamic> data) async {
    // Use processSong endpoint as that's what the upload code expects
    return post(ApiEndpoints.processSongUrl, body: data);
  }

  // Home Page APIs - Profile & Artist Management
  static Future<http.Response> getArtistDetails(String userId) {
    return get(ApiEndpoints.getArtistDetails(userId));
  }

  static Future<http.Response> getArtistViewProfile(String userId) {
    return get(ApiEndpoints.getArtistViewProfile(userId));
  }

  static Future<http.Response> getUserProfileDetails(String userId) {
    return get(ApiEndpoints.getUserProfileDetails(userId));
  }

  static Future<http.Response> getUserProfilePhoto(String userId) {
    return get(ApiEndpoints.getUserProfilePhoto(userId));
  }

  static Future<http.Response> updateBioShow(Map<String, dynamic> data) {
    return post(ApiEndpoints.updateBioShowUrl, body: data);
  }

  // Home Page APIs - Content Discovery
  static Future<http.Response> getLanguageCount() {
    return get(ApiEndpoints.languageCountUrl);
  }

  static Future<http.Response> getGenreCount() {
    return get(ApiEndpoints.genreCountUrl);
  }


  // Home Page APIs - Follow System (Additional)
  static Future<http.Response> getFollowingList(String userId) {
    return get(ApiEndpoints.getFollowingList(userId));
  }

  // Search APIs
  static Future<http.Response> searchSongs(Map<String, dynamic> params) {
    final queryString = Uri(queryParameters: params.map((k, v) => MapEntry(k, v.toString()))).query;
    return get('${ApiEndpoints.searchSongsUrl}?$queryString');
  }

  static Future<http.Response> searchArtists(Map<String, dynamic> params) {
    final queryString = Uri(queryParameters: params.map((k, v) => MapEntry(k, v.toString()))).query;
    return get('${ApiEndpoints.searchArtistsUrl}?$queryString');
  }

  static Future<http.Response> getTrendingSongs() {
    return get(ApiEndpoints.trendingSongsUrl);
  }


  // Follow System APIs
  static Future<http.Response> followUser(Map<String, dynamic> data) {
    return post(ApiEndpoints.followUserUrl, body: data);
  }

  static Future<http.Response> unfollowUser(Map<String, dynamic> data) {
    return post(ApiEndpoints.unfollowUserUrl, body: data);
  }

  static Future<http.Response> getFollowers(String userId) {
    return get('${ApiEndpoints.getFollowersUrl}?user_id=$userId');
  }

  static Future<http.Response> getFollowing(String userId) {
    return get('${ApiEndpoints.getFollowingUrl}?user_id=$userId');
  }

  // Playlist APIs
  static Future<http.Response> createPlaylist(Map<String, dynamic> data) {
    return post(ApiEndpoints.createPlaylistUrl, body: data);
  }

  static Future<http.Response> getPlaylists(String userId) {
    return get('${ApiEndpoints.getPlaylistsUrl}?user_id=$userId');
  }

  static Future<http.Response> addToPlaylist(Map<String, dynamic> data) {
    return post(ApiEndpoints.addToPlaylistUrl, body: data);
  }

  static Future<http.Response> removeFromPlaylist(Map<String, dynamic> data) {
    return post(ApiEndpoints.removeFromPlaylistUrl, body: data);
  }

  // Analytics APIs
  static Future<http.Response> getSongAnalytics(String songId) {
    return get('${ApiEndpoints.songAnalyticsUrl}?song_id=$songId');
  }

  static Future<http.Response> getUserAnalytics(String userId) {
    return get('${ApiEndpoints.userAnalyticsUrl}?user_id=$userId');
  }

  /// Gets detailed song counts for analytics (plays, favorites, reactions, shares, playlist additions)
  static Future<http.Response> getSongCounts(String songId) {
    return get('https://py529n10q0.execute-api.ap-south-1.amazonaws.com/voiz/api/song/counts?song_id=$songId');
  }

  // Music Player APIs
  static Future<http.Response> getAlbumGoto(String songId) {
    return get(ApiEndpoints.getAlbumGoto(songId));
  }

  static Future<http.Response> saveHistory(Map<String, dynamic> data) {
    return post(ApiEndpoints.historyUrl, body: data);
  }

  static Future<http.Response> updateShareSongCount(Map<String, dynamic> data) {
    return post(ApiEndpoints.shareSongCountUrl, body: data);
  }

  static Future<http.Response> getSongInfo(String songId) async {
    final token = await getAuthToken();
    return get(ApiEndpoints.getSongInfo(songId), headers: getAuthHeaders(token));
  }

  static Future<http.Response> getSongComments(String songId) {
    return get(ApiEndpoints.getSongComments(songId));
  }

  static Future<http.Response> addComment(Map<String, dynamic> data) {
    return post(ApiEndpoints.addCommentUrl, body: data);
  }

  static Future<http.Response> sendSongFeedback(Map<String, dynamic> data) {
    return post(ApiEndpoints.songFeedbackUrl, body: data);
  }

  static Future<http.Response> getPlaylistList(String userId) {
    return get(ApiEndpoints.getPlaylistList(userId));
  }

  static Future<http.Response> addSongToPlaylist(Map<String, dynamic> data) {
    return post(ApiEndpoints.addSongToPlaylistUrl, body: data);
  }

  static Future<http.Response> createNewPlaylist(Map<String, dynamic> data) {
    return post(ApiEndpoints.newPlaylistUrl, body: data);
  }

  // Utility methods
  static bool isSuccessResponse(http.Response response) {
    return response.statusCode >= 200 && response.statusCode < 300;
  }

  static Map<String, dynamic>? parseJsonResponse(http.Response response) {
    try {
      return jsonDecode(response.body) as Map<String, dynamic>;
    } catch (e) {
      print('Error parsing JSON response: $e');
      return null;
    }
  }

  static List<dynamic>? parseJsonListResponse(http.Response response) {
    try {
      return jsonDecode(response.body) as List<dynamic>;
    } catch (e) {
      print('Error parsing JSON list response: $e');
      return null;
    }
  }

  // Enhanced error handling with specific error types
  static String getErrorMessage(http.Response response) {
    switch (response.statusCode) {
      case 400:
        return 'Bad request. Please check your input.';
      case 401:
        return 'Unauthorized. Please log in again.';
      case 403:
        return 'Access forbidden. You don\'t have permission.';
      case 404:
        return 'Resource not found.';
      case 500:
        return 'Server error. Please try again later.';
      case 503:
        return 'Service unavailable. Please try again later.';
      default:
        return 'An error occurred. Status code: ${response.statusCode}';
    }
  }

  // Method to add authorization header
  static Map<String, String> getAuthHeaders(String? token) {
    final headers = Map<String, String>.from(_jsonHeaders);
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  // Method to get Amplify authentication token
  static Future<String?> getAuthToken() async {
    try {
      final session = await Amplify.Auth.fetchAuthSession();
      final cognitoSession = session as CognitoAuthSession;
      return cognitoSession.userPoolTokensResult.value.idToken.raw;
    } catch (e) {
      print('Error getting auth token: $e');
      return null;
    }
  }

  static void _logRequest(String method, String url, int statusCode) {
    print('[$method] $url - Status: $statusCode');
  }

  static void _logError(String method, String url, dynamic error) {
    print('[$method] $url - Error: $error');
  }

  // 🔧 Follow State Cache Management Methods
  
  /// Updates the follow state cache for a user
  static void updateFollowStateCache(String userId, bool isFollowing) {
    _followStateCache[userId] = isFollowing;
    _cacheTimestamp = DateTime.now();
    print('🔍 Updated follow cache: $userId -> $isFollowing');
  }
  
  /// Gets the cached follow state for a user, returns null if not cached or expired
  static bool? getCachedFollowState(String userId) {
    final cacheAge = DateTime.now().difference(_cacheTimestamp);
    
    if (cacheAge > _cacheValidityDuration) {
      // Cache expired, clear it
      _followStateCache.clear();
      print('⚠️ Follow cache expired, cleared');
      return null;
    }
    
    final cachedState = _followStateCache[userId];
    if (cachedState != null) {
      print('✅ Using cached follow state: $userId -> $cachedState');
    }
    return cachedState;
  }
  
  /// Checks if the cache is valid (not expired)
  static bool isCacheValid() {
    final cacheAge = DateTime.now().difference(_cacheTimestamp);
    return cacheAge <= _cacheValidityDuration;
  }
  
  /// Clears the follow state cache
  static void clearFollowStateCache() {
    _followStateCache.clear();
    _cacheTimestamp = DateTime.now();
    print('🔍 Follow cache cleared');
  }

  // Songs by genre and user methods
  static Future<http.Response> getSongsByGenreAndUser(String genre, String userId) {
    final url = ApiEndpoints.getSongsByGenreAndUser(genre, userId);
    return get(url);
  }

  // Song URL methods
  static Future<http.Response> getSongUrl(String songName) {
    final url = ApiEndpoints.getSongUrl(songName);
    return get(url);
  }

  // Songs by artist and language methods
  static Future<http.Response> getSongsByArtistLanguage(String userId, String language) {
    final url = ApiEndpoints.getSongsByArtistLanguage(userId, language);
    return get(url);
  }


  /// Gets profile details for a user
  static Future<http.Response> getProfileDetails(String userId) async {
    final url = '${ApiEndpoints.artistProfile}/user/getprofiledetails?user_id=$userId';
    final token = await getAuthToken();
    return get(url, headers: getAuthHeaders(token));
  }

  /// Clears profile photo
  static Future<http.Response> clearProfilePhoto(String userId, String timestamp) async {
    final url = 'https://54sg4hmfzc.execute-api.ap-south-1.amazonaws.com/artistprofile/clearProfilePhoto';
    final token = await getAuthToken();
    return post(url, body: {
      'user_id': userId,
      'updatedTimestamp': timestamp,
    }, headers: getAuthHeaders(token));
  }

  /// Clears cover page photo
  static Future<http.Response> clearCoverPagePhoto(String userId, String timestamp) async {
    final url = 'https://54sg4hmfzc.execute-api.ap-south-1.amazonaws.com/artistprofile/clearCoverPagePhoto';
    final token = await getAuthToken();
    return post(url, body: {
      'user_id': userId,
      'updatedTimestamp': timestamp,
    }, headers: getAuthHeaders(token));
  }

  /// Gets cover page image URL
  static Future<http.Response> getCoverPageImage(String userId) async {
    final url = '${ApiEndpoints.artistProfile}/user/getcoverpage?user_id=$userId';
    final token = await getAuthToken();
    return get(url, headers: getAuthHeaders(token));
  }

  /// Gets profile photo URL
  static Future<http.Response> getProfilePhoto(String userId) async {
    final url = '${ApiEndpoints.artistProfile}/user/getprofilephoto?user_id=$userId';
    final token = await getAuthToken();
    return get(url, headers: getAuthHeaders(token));
  }

  /// Notifies server about cover page upload
  static Future<http.Response> notifyCoverPageUpload({required String userId, required String fileName, required String timestamp}) async {
    final url = 'https://54sg4hmfzc.execute-api.ap-south-1.amazonaws.com/artistprofile/coverPageUrl';
    final token = await getAuthToken();
    return post(url, body: {
      'user_id': userId,
      'fileName': fileName,
      'updatedTimestamp': timestamp,
    }, headers: getAuthHeaders(token));
  }

  // Missing API methods for NewHomepage.dart
  static Future<http.Response> getFollowersCount(String userId) {
    return get(ApiEndpoints.getFollowersCount(userId));
  }

  static Future<http.Response> getArtists() {
    return get(ApiEndpoints.artistsUrl);
  }

  static Future<http.Response> getSongsByGenre(String genre) {
    return get(ApiEndpoints.getSongsByGenre(genre));
  }

  static Future<http.Response> getFreshSongs(String userId) {
    return get(ApiEndpoints.getFreshSongs(userId));
  }

  static Future<http.Response> getTopSongs(String userId) {
    return get(ApiEndpoints.getTopSongs(userId));
  }

  static Future<http.Response> sendAdminNotification(Map<String, dynamic> data) {
    return post(ApiEndpoints.adminNotificationUrl, body: data);
  }

  // Missing methods for newlistofsongs.dart
  static Future<http.Response> getArtistSongs(String userId) {
    return get('${ApiEndpoints.artistSongsUrl}?user_id=$userId');
  }

  static Future<http.Response> getArtistAlbums(String userId) {
    return get('${ApiEndpoints.artistAlbumsUrl}?user_id=$userId');
  }

  static Future<http.Response> getArtistAlbumSongs(String userId, String albumName) {
    return get('${ApiEndpoints.artistAlbumsUrl}?user_id=$userId');
  }

  // Registration specific APIs
  static Future<http.Response> saveUserToApi(String email) {
    return post(
      'https://sxff4q77h9.execute-api.ap-south-1.amazonaws.com/voizpost/save/usernew',
      body: {'EmailId': email},
    );
  }

  static Future<http.Response> fetchUserIdAndCategory(String email) {
    return get('https://py529n10q0.execute-api.ap-south-1.amazonaws.com/voiz/api/userId?email=$email');
  }

  static Future<http.Response> fetchGooglePassword(String email) {
    return post(
      'https://gc5yd9g903.execute-api.ap-south-1.amazonaws.com/admin_report/create_password',
      body: {'email': email},
    );
  }

  // Profile editing specific APIs
  static Future<http.Response> notifyProfileImageUpload({
    required String userId,
    required String imageUrl,
  }) async {
    final url = 'https://54sg4hmfzc.execute-api.ap-south-1.amazonaws.com/artistprofile/profilePhotoUrl';
    final token = await getAuthToken();
    return post(url, body: {
      'user_id': userId,
      'fileName': imageUrl,
      'updatedTimestamp': DateFormat('yyyyMMdd_HHmmss').format(DateTime.now()),
    }, headers: getAuthHeaders(token));
  }

  static Future<http.Response> getPresignedUrlForProfilePhoto({
    required String userId,
    required String fileName,
  }) async {
    final url = 'https://54sg4hmfzc.execute-api.ap-south-1.amazonaws.com/artistprofile/generate-presigned-url/profilePhoto';
    final token = await getAuthToken();
    return post(url, body: {
      'user_id': userId,
      'fileName': fileName,
    }, headers: getAuthHeaders(token));
  }

  static Future<http.Response> getPresignedUrlForCoverPage({
    required String userId,
    required String fileName,
  }) async {
    final url = 'https://54sg4hmfzc.execute-api.ap-south-1.amazonaws.com/artistprofile/generate-presigned-url/coverPage';
    final token = await getAuthToken();
    return post(url, body: {
      'user_id': userId,
      'fileName': fileName,
    }, headers: getAuthHeaders(token));
  }

  static Future<http.Response> updateProfile({
    required String userId,
    required String fullName,
    required String bio,
    required String stageName,
    required String updatedTimestamp,
  }) async {
    final url = 'https://54sg4hmfzc.execute-api.ap-south-1.amazonaws.com/artistprofile/user/editprofile';
    final token = await getAuthToken();
    return post(url, body: {
      'user_id': userId,
      'FullName': fullName,
      'bio': bio,
      'StageName': stageName,
      'updatedTimestamp': updatedTimestamp,
    }, headers: getAuthHeaders(token));
  }

  // Additional social features API
  static Future<http.Response> getFollowersList(String userId) {
    return get('https://dfiksrd6v8.execute-api.ap-south-1.amazonaws.com/follow/api/followers/List?user_id=$userId');
  }

  // Artist profile specific APIs
  static Future<http.Response> getSongsByAlbumId(String userId, String albumId) {
    return get('https://py529n10q0.execute-api.ap-south-1.amazonaws.com/voiz/api/artist/album/songs?user_id=$userId&album_id=$albumId');
  }

  static Future<http.Response> followArtist({
    required String updatedTimestamp,
    required String followedId,
    required String followingId,
  }) {
    return post(
      'https://dfiksrd6v8.execute-api.ap-south-1.amazonaws.com/follow/api/follow',
      body: {
        'updatedTimestamp': updatedTimestamp,
        'followed_id': followedId,
        'following_id': followingId,
      },
    );
  }

  static Future<http.Response> unfollowArtist({
    required String updatedTimestamp,
    required String followedId,
    required List<String> followingIds,
  }) {
    return post(
      'https://dfiksrd6v8.execute-api.ap-south-1.amazonaws.com/follow/api/unfollow',
      body: {
        'updatedTimestamp': updatedTimestamp,
        'followed_id': followedId,
        'following_id': followingIds,
      },
    );
  }

  static Future<http.Response> getArtistLanguages(String userId) {
    return get('https://54sg4hmfzc.execute-api.ap-south-1.amazonaws.com/artistprofile/artist/language?user_id=$userId');
  }

  static Future<http.Response> getArtistGenres(String userId) {
    return get('https://54sg4hmfzc.execute-api.ap-south-1.amazonaws.com/artistprofile/artist/genre?user_id=$userId');
  }

  static Future<http.Response> getSongsForLanguage(String userId, String language) {
    return get('https://54sg4hmfzc.execute-api.ap-south-1.amazonaws.com/artistprofile/artist/language/songs?user_id=$userId&languages=$language');
  }

  static Future<http.Response> getSongsForGenre(String genre, String userId) {
    return get('https://54sg4hmfzc.execute-api.ap-south-1.amazonaws.com/artistprofile/artist/genre/songs?genre=$genre&user_id=$userId');
  }

  // Profile viewing specific APIs
  static Future<http.Response> getUserCoverImage(String userId) {
    return get('https://54sg4hmfzc.execute-api.ap-south-1.amazonaws.com/artistprofile/user/getcoverpage?user_id=$userId');
  }

  static Future<http.Response> updateAutoplayStatus({
    required String userId,
    required String isAutoplayEnabled,
    required String updatedTimestamp,
  }) {
    return post(
      'https://sxff4q77h9.execute-api.ap-south-1.amazonaws.com/voizpost/save/autoplaystatus',
      body: {
        'user_id': userId,
        'isAutorelatedtrackenable': isAutoplayEnabled,
        'updatedTimestamp': updatedTimestamp,
      },
    );
  }

  // Playlist song management APIs
  static Future<http.Response> getPlaylistSongs(String playlistId) {
    return get('https://t48nholdt7.execute-api.ap-south-1.amazonaws.com/voiz/playlist/songList?playlist_id=$playlistId');
  }

  static Future<http.Response> getSongStreamingUrl(String songName) {
    return get('https://5qxwn3x3z2.execute-api.ap-south-1.amazonaws.com/voiznew/getSongUrl?songName=$songName.mp3');
  }

  static Future<http.Response> removeSongFromPlaylist({
    required String playlistId,
    required List<String> songIds,
    required String updatedTimestamp,
  }) {
    return post(
      'https://t48nholdt7.execute-api.ap-south-1.amazonaws.com/voiz/playlist/removeSong',
      body: {
        'playlist_id': playlistId,
        'songIds': songIds,
        'updatedTimestamp': updatedTimestamp,
      },
    );
  }

  static Future<http.Response> getSongCredits(String songId) {
    return get('https://py529n10q0.execute-api.ap-south-1.amazonaws.com/voiz/song/info?song_id=$songId');
  }

  static Future<http.Response> incrementSongShareCount({
    required String songId,
    required String updatedTimestamp,
  }) {
    return post(
      'https://sxff4q77h9.execute-api.ap-south-1.amazonaws.com/voizpost/save/shareSongCount',
      body: {
        'song_id': songId,
        'updatedTimestamp': updatedTimestamp,
      },
    );
  }

  // Album management APIs
  static Future<http.Response> getUserAlbums(String userId) {
    return get('https://py529n10q0.execute-api.ap-south-1.amazonaws.com/voiz/api/userAlbums?user_id=$userId');
  }

  /// Gets approved songs list for a user (Analytics dashboard)
  static Future<http.Response> getApprovedSongsList(String userId) {
    return get('https://py529n10q0.execute-api.ap-south-1.amazonaws.com/voiz/api/approverListPhone?user_id=$userId');
  }

  // Share song handler specific APIs (different endpoints than existing methods)
  static Future<http.Response> getSharedSongDetails(String songId) {
    return get('https://6htqk6p035.execute-api.ap-south-1.amazonaws.com/voizadmin/admin/song/detail?song_id=$songId');
  }

  static Future<http.Response> getSharedArtistDetails(String artistId) {
    return get('https://54sg4hmfzc.execute-api.ap-south-1.amazonaws.com/artistprofile/artist/details?user_id=$artistId');
  }

  static Future<http.Response> getSharedFollowingList(String userId) {
    return get('https://dfiksrd6v8.execute-api.ap-south-1.amazonaws.com/follow/api/following/List?user_id=$userId');
  }

  static Future<http.Response> getSharedFollowerCount(String artistId) {
    return get('https://dfiksrd6v8.execute-api.ap-south-1.amazonaws.com/follow/api/followers/count?user_id=$artistId');
  }

  // Additional info APIs
  static Future<http.Response> updateUserProfile(Map<String, dynamic> profileData) {
    return post(
      'https://sxff4q77h9.execute-api.ap-south-1.amazonaws.com/voizpost/save/updateprofiledetails',
      body: profileData,
    );
  }

  static Future<http.Response> getUserIdByEmail(String email) {
    return get('https://py529n10q0.execute-api.ap-south-1.amazonaws.com/voiz/api/userId?email=$email');
  }

  // Feedback APIs
  static Future<http.Response> submitUserFeedback(Map<String, dynamic> feedbackData) {
    return post(
      'https://01bgjtw3s9.execute-api.ap-south-1.amazonaws.com/voiz/feedback',
      body: feedbackData,
    );
  }

  // Rejection APIs
  static Future<http.Response> getRejectionDetails(String workflowId) {
    return get('https://py529n10q0.execute-api.ap-south-1.amazonaws.com/voiz/song/rejected/reason?workflowId=$workflowId');
  }

  /// Fetches details of a rejected song for editing
  /// [songId] The ID of the song to fetch
  /// [isAlbumSong] Whether this is an album song (uses different endpoint)
  static Future<http.Response> getRejectedSongDetails(String songId, {bool isAlbumSong = false}) {
    final endpoint = isAlbumSong 
        ? 'https://cgos5ixza4.execute-api.ap-south-1.amazonaws.com/update/updateRejectedAlbumSongs/getSongData'
        : 'https://cgos5ixza4.execute-api.ap-south-1.amazonaws.com/update/updateRejectedSong/getSongData';
    
    return get('$endpoint?song_id=$songId');
  }

  /// Updates a rejected single song's details
  /// [songData] Map containing the song data to update
  static Future<http.Response> updateRejectedSong(Map<String, dynamic> songData) {
    return post(
      'https://cgos5ixza4.execute-api.ap-south-1.amazonaws.com/update/updateRejectedSong',
      body: songData,
    );
  }

  /// Updates a rejected album song's details
  /// [albumSongData] Map containing the album song data to update
  static Future<http.Response> updateRejectedAlbumSong(Map<String, dynamic> albumSongData) {
    return post(
      'https://cgos5ixza4.execute-api.ap-south-1.amazonaws.com/update/updateRejectedAlbumSongs',
      body: albumSongData,
    );
  }

  // Account merging APIs
  static Future<http.Response> createMergePassword(String email) {
    return post(
      'https://gc5yd9g903.execute-api.ap-south-1.amazonaws.com/admin_report/create_password',
      body: {'email': email},
    );
  }

  /// Increments the play count for a song
  /// [songId] The ID of the song to increment play count for
  /// [userId] The ID of the user who played the song
  static Future<http.Response> incrementPlayCount(String songId, String userId) async {
    final String apiUrl = 'https://sxff4q77h9.execute-api.ap-south-1.amazonaws.com/voizpost/save/playcount';
    final String timestamp = DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());

    final requestBody = {
      'song_id': songId,
      'updatedTimestamp': timestamp,
      'user_id': userId,
    };

    try {
      return await post(
        apiUrl,
        body: requestBody,
        timeout: const Duration(seconds: 10), // Shorter timeout for play count updates
      );
    } catch (error) {
      _logError('POST', apiUrl, 'Failed to increment play count: $error');
      rethrow;
    }
  }

  /// Fetches user details by email
  /// [email] The email address of the user to fetch
  /// Returns a Future that resolves to the user details or null if not found
  static Future<Map<String, dynamic>?> getUserDetails(String email) async {
    try {
      final response = await get(
        'https://py529n10q0.execute-api.ap-south-1.amazonaws.com/voiz/api/userId?email=$email',
        timeout: const Duration(seconds: 15),
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        if (data.isNotEmpty) {
          final userData = data[0];
          
          final userId = userData['user_id']?['S']?.toString() ?? '';
          final userCategory = userData['Category']?['S']?.toString() ?? '';
          final userFullName = userData['FullName']?['S']?.toString() ?? '';

          if (userId.isNotEmpty && userCategory.isNotEmpty) {
            return {
              'userId': userId,
              'userCategory': userCategory,
              'userFullName': userFullName,
            };
          }
        }
      }
      return null;
    } catch (e) {
      _logError('GET', 'getUserDetails', 'Error fetching user details: $e');
      rethrow;
    }
  }

  /// Generates a password for Google sign-in
  /// [email] The email address to generate a password for
  /// Returns a Future that resolves to the generated password
  static Future<String> generateGooglePassword(String email) async {
    const String apiUrl = 'https://gc5yd9g903.execute-api.ap-south-1.amazonaws.com/admin_report/create_password';
    
    try {
      final response = await post(
        apiUrl,
        body: {'email': email},
        timeout: const Duration(seconds: 15),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true && data['password'] != null) {
          return data['password'] as String;
        } else {
          throw Exception('API response missing password or success flag');
        }
      } else {
        throw Exception('Failed to generate password: ${response.statusCode}');
      }
    } catch (e) {
      _logError('POST', 'generateGooglePassword', 'Error generating password: $e');
      rethrow;
    }
  }

  /// Get the latest app version from the server
  /// Returns the latest version string
  static Future<String> getLatestAppVersion() async {
    const String apiUrl = 'https://your-api-endpoint.com/latest-version';
    
    try {
      final response = await _client.get(Uri.parse(apiUrl)).timeout(const Duration(seconds: 10));
      
      if (isSuccessResponse(response)) {
        final data = json.decode(response.body);
        final version = data['version'] as String?;
        if (version != null) {
          debugPrint('✅ Latest app version: $version');
          return version;
        }
        throw Exception('Invalid version format in response');
      } else {
        throw Exception('Failed to get latest version: ${response.statusCode}');
      }
    } catch (e) {
      _logError('GET', 'getLatestAppVersion', 'Error getting latest version: $e');
      // Return a default version to prevent app from breaking
      return '1.0.0';
    }
  }

  /// Log device information to the backend
  /// [deviceInfo] Map containing device information
  /// Returns true if the log was successful
  static Future<bool> logDeviceInfo(Map<String, String> deviceInfo) async {
    const String apiUrl = 'https://agtffbm7a7.execute-api.ap-south-1.amazonaws.com/dev/log';
    
    try {
      final uri = Uri.parse('$apiUrl?'
          'device=${Uri.encodeComponent(deviceInfo['deviceName'] ?? '')}'
          '&id=${Uri.encodeComponent(deviceInfo['deviceId'] ?? '')}'
          '&os=${Uri.encodeComponent(deviceInfo['osVersion'] ?? '')}'
          '&build=${Uri.encodeComponent(deviceInfo['buildVersion'] ?? '')}');

      final response = await _client.get(uri).timeout(const Duration(seconds: 10));
      
      if (isSuccessResponse(response)) {
        debugPrint('✅ Device info logged successfully');
        return true;
      } else {
        debugPrint('❌ Failed to log device info: ${response.statusCode}');
        return false;
      }
    } catch (e) {
      _logError('GET', 'logDeviceInfo', 'Error logging device info: $e');
      return false;
    }
  }

  // Profile photo, cover photo, and profile details methods are already defined above
  // These were duplicate methods that have been removed to fix compilation errors

  /// Deletes a user account from the server
  /// [userId] The ID of the user to delete
  /// Returns true if the deletion was successful, false otherwise
  static Future<bool> deleteUserAccount(String userId) async {
    try {
      final response = await http.post(
        Uri.parse(ApiEndpoints.deleteAccountUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'user_id': userId,
          'action': 'delete',
        }),
      );

      if (response.statusCode >= 200 && response.statusCode < 300) {
        debugPrint('Account successfully deleted on the server');
        return true;
      } else {
        debugPrint('Failed to delete account on the server. Status: ${response.statusCode}');
        return false;
      }
    } catch (e) {
      _logError('POST', 'deleteUserAccount', 'Error deleting user account: $e');
      return false;
    }
  }

  /// Fetches user details by email
  /// [email] The email address of the user to fetch
  /// Returns a Future that resolves to a map containing user details or null if not found
  static Future<Map<String, dynamic>?> fetchUserDetails(String email) async {
    try {
      final response = await http.get(
        Uri.parse(ApiEndpoints.getUserDetailsByEmail(email)),
      );

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final dynamic jsonData = jsonDecode(response.body);
        if (jsonData is List && jsonData.isNotEmpty) {
          final firstItem = jsonData[0];
          if (firstItem != null && firstItem is Map<String, dynamic>) {
            return firstItem;
          }
        }
      }
      return null;
    } catch (e) {
      _logError('GET', 'fetchUserDetails', 'Error fetching user details: $e');
      return null;
    }
  }

  /// Updates the last login platform for a user
  /// [userId] The ID of the user to update
  /// [platform] The platform to set as last login (e.g., 'Android')
  /// Returns true if the update was successful, false otherwise
  static Future<bool> updateLastLoginPlatform(String userId, {String platform = 'Android'}) async {
    try {
      final response = await http.post(
        Uri.parse(ApiEndpoints.updateLastLogin),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'user_id': userId,
          'lastLogin': platform,
        }),
      );

      if (response.statusCode >= 200 && response.statusCode < 300) {
        debugPrint('Last login platform updated successfully');
        return true;
      } else {
        debugPrint('Failed to update last login platform: ${response.statusCode}');
        return false;
      }
    } catch (e) {
      _logError('POST', 'updateLastLoginPlatform', 'Error updating last login: $e');
      return false;
    }
  }

  // Cleanup method
  static void dispose() {
    _client.close();
  }
}
