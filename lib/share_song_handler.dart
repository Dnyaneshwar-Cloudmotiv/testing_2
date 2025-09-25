// share_song_handler.dart
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:firebase_dynamic_links/firebase_dynamic_links.dart';
import 'package:http/http.dart' as http;
import 'package:voiceapp/audio_service1.dart';
import 'package:voiceapp/musicplayer.dart';
import 'package:voiceapp/artist.dart';
import 'package:voiceapp/listofsongforplaylist.dart';
import 'package:voiceapp/profile_manager.dart';
import 'package:voiceapp/NewHomepage.dart';
import 'package:voiceapp/services/api_service.dart';

class ShareSongHandler {
  static ShareSongHandler? _instance;
  static ShareSongHandler get instance => _instance ??= ShareSongHandler._internal();
  
  ShareSongHandler._internal();

  String? _lastProcessedLinkUrl;
  DateTime? _lastLinkProcessTime;
  bool _isProcessing = false;
  
  // Store user context for proper navigation
  String? _userEmail;
  String? _userCategory;
  String? _userFullName;
  
  // Cache for artist data to prevent multiple API calls
  final Map<String, Map<String, dynamic>> _artistCache = {};
  final Map<String, int> _followerCache = {};
  final Map<String, List<String>> _followingCache = {};
  
  void setUserContext(String email, String category, String fullName) {
    _userEmail = email;
    _userCategory = category;
    _userFullName = fullName;
  }

  /// Initialize dynamic links handling for the entire app
  void initializeDynamicLinks(BuildContext context) {
    // Handle initial link when app is launched from a closed state
    FirebaseDynamicLinks.instance.getInitialLink().then((PendingDynamicLinkData? initialLink) {
      if (initialLink != null) {
        print('App opened from closed state with link: ${initialLink.link}');
        _handleDynamicLink(context, initialLink);
      }
    });

    // Listen for dynamic links while the app is running
    FirebaseDynamicLinks.instance.onLink.listen((PendingDynamicLinkData dynamicLinkData) {
      print('App received dynamic link while running: ${dynamicLinkData.link}');
      _handleDynamicLink(context, dynamicLinkData);
    }).onError((error) {
      print('Dynamic link error: $error');
    });
  }

  /// Handle dynamic link processing
  Future<void> _handleDynamicLink(BuildContext context, PendingDynamicLinkData data) async {
    final Uri? deepLink = data.link;

    if (deepLink == null || _isProcessing) return;

    // Prevent duplicate processing
    final linkUrl = deepLink.toString();
    final currentTime = DateTime.now();
    
    if (_lastProcessedLinkUrl == linkUrl && 
        _lastLinkProcessTime != null && 
        currentTime.difference(_lastLinkProcessTime!).inSeconds < 5) {
      print('Ignoring duplicate link processing');
      return;
    }

    _lastProcessedLinkUrl = linkUrl;
    _lastLinkProcessTime = currentTime;
    _isProcessing = true;

    try {
      print('Processing deep link: $deepLink');
      print('Deep link path: ${deepLink.path}');
      print('Deep link query parameters: ${deepLink.queryParameters}');

      final path = deepLink.path;
      final artistId = deepLink.queryParameters['artistId'];
      final songId = deepLink.queryParameters['songId'];
      final playlistId = deepLink.queryParameters['playlist_id'];

      if (path == '/refer') {
        print('Referral link received, navigating to homepage');
        return;
      }

      // Handle artist profile link
      if (path == '/artistprofile' && artistId != null) {
        await _handleArtistProfileLink(context, artistId);
      }
      // Handle song link
      else if (path == '/song' && songId != null) {
        await _handleSongLink(context, songId);
      }
      // Handle playlist link
      else if (path == '/playlist' && playlistId != null) {
        await _handlePlaylistLink(context, playlistId);
      } else {
        print('Invalid share link format: $path');
      }
    } finally {
      _isProcessing = false;
    }
  }

  /// Handle song link processing
  Future<void> _handleSongLink(BuildContext context, String songId) async {
    try {
      print('Processing song with ID: $songId');

      // Check if song is currently playing
      final currentSongId = await AudioService().getCurrentSongId();
      if (currentSongId == songId) {
        print('Song is already playing');
        return;
      }

      // Show loading dialog
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (BuildContext context) {
          return Dialog(
            backgroundColor: Color(0xFF151415),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
            child: Padding(
              padding: EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(color: Colors.blue),
                  SizedBox(height: 16),
                  Text(
                    'Opening shared song...',
                    style: TextStyle(color: Colors.white, fontSize: 16),
                  ),
                ],
              ),
            ),
          );
        },
      );

      // Fetch song details
      final songDetails = await _fetchSongDetails(songId);

      // Close loading dialog
      if (Navigator.canPop(context)) {
        Navigator.pop(context);
      }

      if (songDetails == null) {
        _showErrorSnackBar(context, 'Song not found or unavailable');
        return;
      }

      // Validate streaming URL
      if (songDetails['streamingUrl'] == null || songDetails['streamingUrl'].isEmpty) {
        _showErrorSnackBar(context, 'Song streaming URL not available');
        return;
      }

      // Get song info
      final String genre = songDetails['genre'] ?? 'Unknown Genre';
      final String language = songDetails['languages'] ?? 'Unknown Language';

      // Pause current audio if playing
      if (currentSongId != null) {
        await AudioService().pause();
        await Future.delayed(Duration(milliseconds: 200));
      }

      // Create song list
      final List<Map<String, String>> songList = [
        {
          'title': songDetails['songName'] ?? 'Unknown Title',
          'artist': songDetails['stageName'] ?? 'Unknown Artist',
          'duration': songDetails['span'] ?? '00:00',
          'streamingUrl': songDetails['streamingUrl'],
          'coverPage': songDetails['coverPage'] ?? 'assets/mic.jpg',
          'song_id': songId,
          'source': genre,
          'genre': genre,
          'language': language,
        }
      ];

      // Navigate to music player
      await _navigateToMusicPlayer(context, songList, genre);

    } catch (e) {
      print('Error handling song link: $e');
      if (Navigator.canPop(context)) {
        Navigator.pop(context);
      }
      _showErrorSnackBar(context, 'Failed to load song: $e');
    }
  }

  /// Fetch song details from API
  Future<Map<String, dynamic>?> _fetchSongDetails(String songId) async {
    try {
      final response = await ApiService.getSharedSongDetails(songId);

      if (response.statusCode == 200) {
        final Map<String, dynamic>? data = jsonDecode(response.body);

        if (data != null && data.isNotEmpty) {
          return {
            'fileName': data['fileName']?['S'] ?? 'Unknown File',
            'streamingUrl': data['songStreamUrl']?['S'] ?? '',
            'songName': data['songName']?['S'] ?? 'Unknown Song',
            'stageName': data['stage_name']?['S'] ?? 'Unknown Stage Name',
            'span': data['span']?['S'] ?? '00:00',
            'coverPage': data['coverPageUrl']?['S'] ?? 'assets/placeholder.png',
            'genre': data['genre']?['S'] ?? 'Unknown Genre',
            'languages': data['languages']?['S'] ?? 'Unknown Language',
          };
        }
      }
      return null;
    } catch (error) {
      print('Error fetching song details: $error');
      return null;
    }
  }

  /// Navigate to music player with song
  Future<void> _navigateToMusicPlayer(BuildContext context, List<Map<String, String>> songList, String genre) async {
    // Get user details from current route or use defaults
    final currentRoute = ModalRoute.of(context);
    String email = 'user@example.com';
    String category = 'Listener';
    String userfullname = 'User';

    // Try to extract user details from current page if available
    if (currentRoute?.settings.arguments is Map) {
      final args = currentRoute!.settings.arguments as Map;
      email = args['email'] ?? email;
      category = args['category'] ?? category;
      userfullname = args['userfullname'] ?? userfullname;
    }

    // Clear existing MusicPlayerPage instances
    Navigator.popUntil(context, (route) => route.isFirst);

    // Navigate to player
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => MusicPlayerPage(
          currentIndex: 0,
          navigationIndex: 0,
          email: email,
          userfullname: userfullname,
          userCategory: category,
          sourceType: 'genre',
          sourceName: genre,
        ),
        settings: RouteSettings(name: 'music_player_from_share'),
      ),
    );

    // Load the song
    await Future.delayed(Duration(milliseconds: 500));
    await AudioService().loadPlaylist(songList, initialIndex: 0);
  }

  /// Handle artist profile link processing
  Future<void> _handleArtistProfileLink(BuildContext context, String artistId) async {
    try {
      print('Processing artist profile with ID: $artistId');

      // Show loading dialog
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (BuildContext context) {
          return Dialog(
            backgroundColor: Color(0xFF151415),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
            child: Padding(
              padding: EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(color: Colors.blue),
                  SizedBox(height: 16),
                  Text(
                    'Loading artist profile...',
                    style: TextStyle(color: Colors.white, fontSize: 16),
                  ),
                ],
              ),
            ),
          );
        },
      );

      // Fetch artist details
      final artistDetails = await _fetchArtistDetails(artistId);

      // Close loading dialog
      if (Navigator.canPop(context)) {
        Navigator.pop(context);
      }

      if (artistDetails != null) {
        // Fetch follower data in parallel to improve performance
        final futures = await Future.wait([
          _fetchFollowerCount(artistId),
          _fetchFollowingList(ProfileManager().getUserId()!),
        ]);
        
        int followerCount = futures[0] as int;
        List<String> followingIds = futures[1] as List<String>;
        bool isFollowing = followingIds.contains(artistId);

        // Get user details from stored context or use defaults
        String email = _userEmail ?? 'user@example.com';
        String category = _userCategory ?? 'Listener';
        String userfullname = _userFullName ?? 'User';
        
        // Try to extract user details from current route as fallback
        final currentRoute = ModalRoute.of(context);
        if (currentRoute?.settings.arguments is Map) {
          final args = currentRoute!.settings.arguments as Map;
          email = args['email'] ?? email;
          category = args['category'] ?? category;
          userfullname = args['userfullname'] ?? userfullname;
        }

        // For deep links, ensure we have proper navigation stack
        // First navigate to home, then push artist page
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(
            builder: (context) => NewHomePage(
              email: email,
              category: category,
              userfullname: userfullname,
            ),
          ),
          (Route<dynamic> route) => false,
        );
        
        // Small delay to ensure home page is loaded, then navigate to artist
        await Future.delayed(Duration(milliseconds: 500));
        
        if (context.mounted) {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) => MusicArtistPage(
                artistId: artistId,
                artistName: artistDetails['StageName'],
                followerCount: followerCount,
                userId: email,
                category: category,
                userfullname: userfullname,
                isFollowing: isFollowing,
                profileImageUrl: artistDetails['profilePhotoUrl'],
                coverImageUrl: artistDetails['coverPageUrl'],
                isFromDeepLink: false, // Changed to false since we now have proper nav stack
              ),
            ),
          );
        }
      } else {
        _showErrorSnackBar(context, 'Artist details not found');
      }
    } catch (e) {
      print('Error handling artist profile link: $e');
      if (Navigator.canPop(context)) {
        Navigator.pop(context);
      }
      _showErrorSnackBar(context, 'Failed to load artist profile: $e');
    }
  }

  /// Handle playlist link processing
  Future<void> _handlePlaylistLink(BuildContext context, String playlistId) async {
    try {
      print('Processing playlist with ID: $playlistId');

      // Show loading dialog
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (BuildContext context) {
          return Dialog(
            backgroundColor: Color(0xFF151415),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
            child: Padding(
              padding: EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(color: Colors.blue),
                  SizedBox(height: 16),
                  Text(
                    'Loading playlist...',
                    style: TextStyle(color: Colors.white, fontSize: 16),
                  ),
                ],
              ),
            ),
          );
        },
      );

      // Fetch playlist songs
      final result = await _fetchSongsInPlaylist(playlistId);

      // Close loading dialog
      if (Navigator.canPop(context)) {
        Navigator.pop(context);
      }

      final String playlistName = result['playlistName'];
      final List<Map<String, String>> songs = result['songs'];

      if (songs.isNotEmpty) {
        // Get user details from current route or use defaults
        final currentRoute = ModalRoute.of(context);
        String email = 'user@example.com';
        String category = 'Listener';
        String userfullname = 'User';

        // Try to extract user details from current page if available
        if (currentRoute?.settings.arguments is Map) {
          final args = currentRoute!.settings.arguments as Map;
          email = args['email'] ?? email;
          category = args['category'] ?? category;
          userfullname = args['userfullname'] ?? userfullname;
        }

        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ListPage1(
              genreTitle: playlistName,
              bannerImage: 'assets/playlist_banner.jpg',
              email: email,
              Category: category,
              fullname: userfullname,
              playlistId: playlistId,
            ),
          ),
        );
      } else {
        _showErrorSnackBar(context, 'The playlist you\'re looking for is not found');
      }
    } catch (e) {
      print('Error handling playlist link: $e');
      if (Navigator.canPop(context)) {
        Navigator.pop(context);
      }
      _showErrorSnackBar(context, 'The playlist you\'re looking for is not found');
    }
  }

  /// Fetch artist details from API with caching
  Future<Map<String, dynamic>?> _fetchArtistDetails(String artistId) async {
    // Check cache first
    if (_artistCache.containsKey(artistId)) {
      return _artistCache[artistId]!;
    }

    try {
      final response = await ApiService.getSharedArtistDetails(artistId);
      print('Artist API Response Status: ${response.statusCode}');
      print('Artist API Response Body: ${response.body}');

      if (response.statusCode == 200) {
        // Handle different response formats
        dynamic responseData;
        try {
          responseData = jsonDecode(response.body);
        } catch (e) {
          print('JSON decode error: $e');
          return null;
        }

        // Check if response is a string (error message) or object
        if (responseData is String) {
          print('API returned string response: $responseData');
          return null;
        }

        // Handle both direct object and nested object formats
        Map<String, dynamic> data;
        if (responseData is Map<String, dynamic>) {
          // Check if data is nested under 'Item' key (DynamoDB format)
          if (responseData.containsKey('Item') && responseData['Item'] is Map) {
            data = responseData['Item'];
            // Handle DynamoDB attribute format
            final result = {
              'genres': _extractDynamoValue(data['genres']) ?? [],
              'languages': _extractDynamoValue(data['languages']) ?? [],
              'coverPageUrl': _extractDynamoValue(data['coverPageUrl']) ?? '',
              'profilePhotoUrl': _extractDynamoValue(data['profilePhotoUrl']) ?? '',
              'FullName': _extractDynamoValue(data['FullName']) ?? 'Unknown Artist',
              'StageName': _extractDynamoValue(data['StageName']) ?? _extractDynamoValue(data['FullName']) ?? 'Unknown Artist',
              'bio': _extractDynamoValue(data['bio']) ?? '',
            };
            // Cache the result
            _artistCache[artistId] = result;
            return result;
          } else {
            // Direct object format
            data = responseData;
            final result = {
              'genres': data['genres'] ?? [],
              'languages': data['languages'] ?? [],
              'coverPageUrl': data['coverPageUrl'] ?? '',
              'profilePhotoUrl': data['profilePhotoUrl'] ?? '',
              'FullName': data['FullName'] ?? 'Unknown Artist',
              'StageName': data['StageName'] ?? data['FullName'] ?? 'Unknown Artist',
              'bio': data['bio'] ?? '',
            };
            // Cache the result
            _artistCache[artistId] = result;
            return result;
          }
        }

        print('Unexpected response format: ${responseData.runtimeType}');
        return null;
      } else {
        print('Failed to fetch artist details. Status code: ${response.statusCode}');
        print('Error response: ${response.body}');
        return null;
      }
    } catch (error) {
      print('Error fetching artist details: $error');
      return null;
    }
  }

  /// Extract value from DynamoDB attribute format
  dynamic _extractDynamoValue(dynamic attribute) {
    if (attribute == null) return null;
    if (attribute is Map<String, dynamic>) {
      // DynamoDB format: {"S": "value"} or {"N": "123"} or {"L": [...]}
      if (attribute.containsKey('S')) return attribute['S'];
      if (attribute.containsKey('N')) return attribute['N'];
      if (attribute.containsKey('L')) return attribute['L'];
      if (attribute.containsKey('SS')) return attribute['SS'];
    }
    return attribute; // Return as-is if not DynamoDB format
  }

  /// Fetch following list from API with caching
  Future<List<String>> _fetchFollowingList(String userId) async {
    // Check cache first
    if (_followingCache.containsKey(userId)) {
      return _followingCache[userId]!;
    }

    try {
      final response = await ApiService.getSharedFollowingList(userId);
      print('Following API Response Status: ${response.statusCode}');
      print('Following API Response Body: ${response.body}');
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        List<String> followingList = [];
        
        // Handle different response formats
        if (data is Map<String, dynamic>) {
          if (data['followingList'] != null) {
            followingList = List<String>.from(data['followingList']);
          } else if (data['followDetails'] != null) {
            // Handle nested format
            final followDetails = data['followDetails'] as List;
            followingList = followDetails.expand((innerList) => innerList).map<String>((follow) {
              if (follow is Map && follow['user_id'] != null) {
                if (follow['user_id'] is Map && follow['user_id']['S'] != null) {
                  return follow['user_id']['S'] as String;
                }
                return follow['user_id'].toString();
              }
              return follow.toString();
            }).toList();
          }
        }
        
        // Cache the result
        _followingCache[userId] = followingList;
        return followingList;
      }
      return [];
    } catch (e) {
      print('Error fetching following list: $e');
      return [];
    }
  }

  /// Fetch follower count from API with caching
  Future<int> _fetchFollowerCount(String artistId) async {
    // Check cache first
    if (_followerCache.containsKey(artistId)) {
      return _followerCache[artistId]!;
    }

    try {
      final response = await ApiService.getSharedFollowerCount(artistId);
      print('Follower API Response Status: ${response.statusCode}');
      print('Follower API Response Body: ${response.body}');
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        // Handle different response formats
        int count = 0;
        if (data is Map<String, dynamic>) {
          count = data['followerCount'] ?? data['count'] ?? 0;
        } else if (data is int) {
          count = data;
        }
        
        // Cache the result
        _followerCache[artistId] = count;
        return count;
      }
      return 0;
    } catch (e) {
      print('Error fetching follower count: $e');
      return 0;
    }
  }

  /// Fetch playlist songs from API
  Future<Map<String, dynamic>> _fetchSongsInPlaylist(String playlistId) async {
    final response = await ApiService.getPlaylistSongs(playlistId);

    if (response.statusCode == 200) {
      final jsonResponse = jsonDecode(response.body);

      if (jsonResponse.containsKey('songDetails')) {
        final List<dynamic> items = jsonResponse['songDetails'];
        String playlistName = 'Unknown Playlist';
        List<Map<String, String>> songList = [];

        // Use a map to count occurrences of each playlist name
        Map<String, int> playlistNameCounts = {};

        // First pass: collect all playlist names and count them
        for (var song in items) {
          if (song.containsKey('playlistName') && song['playlistName'] != null) {
            String name = song['playlistName'].toString();
            playlistNameCounts[name] = (playlistNameCounts[name] ?? 0) + 1;
          }
        }

        // Find the most common playlist name
        if (playlistNameCounts.isNotEmpty) {
          int maxCount = 0;
          playlistNameCounts.forEach((name, count) {
            if (count > maxCount) {
              maxCount = count;
              playlistName = name;
            }
          });
        }

        // Second pass: create the song list
        for (var song in items) {
          songList.add({
            'title': (song['songName'] ?? 'Unknown Title').toString(),
            'artist': (song['stage_name'] != null && song['stage_name'].toString().trim().isNotEmpty
                ? song['stage_name']
                : song['FullName'] ?? 'Unknown Artist').toString(),
            'duration': (song['span'] ?? '00:00').toString(),
            'song_id': (song['song_id'] ?? 'unknown').toString(),
            'coverPage': (song['coverPageUrl'] ?? 'assets/mic.jpg').toString(),
            'streamingUrl': (song['songStreamUrl'] ?? '').toString(),
            'language': (song['languages'] ?? '').toString(),
            'genre': (song['genre'] ?? '').toString(),
            'addedOn': (song['addedOn'] ?? '').toString(),
          });
        }

        return {
          'playlistName': playlistName,
          'songs': songList,
        };
      } else {
        return {
          'playlistName': 'Unknown Playlist',
          'songs': <Map<String, String>>[],
        };
      }
    } else {
      throw Exception('Failed to load playlist');
    }
  }

  /// Show error message
  void _showErrorSnackBar(BuildContext context, String message) {
    ScaffoldMessenger.of(context).clearSnackBars();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          message,
          style: TextStyle(color: Colors.white),
        ),
        backgroundColor: Colors.red[700],
        behavior: SnackBarBehavior.floating,
        margin: EdgeInsets.all(16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        duration: Duration(seconds: 4),
      ),
    );
  }
}
