// share_song_screen.dart
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:firebase_dynamic_links/firebase_dynamic_links.dart';
import 'package:http/http.dart' as http;
import 'package:voiceapp/audio_service1.dart';
import 'package:voiceapp/musicplayer.dart';
import 'package:voiceapp/artist.dart';
import 'package:voiceapp/listofsongforplaylist.dart';
import 'package:voiceapp/profile_manager.dart';
import 'package:voiceapp/services/api_service.dart';

class ShareSongScreen extends StatefulWidget {
  final String email;
  final String category;
  final String userfullname;
  final String? songId;
  final PendingDynamicLinkData? dynamicLinkData;

  const ShareSongScreen({
    Key? key,
    required this.email,
    required this.category,
    required this.userfullname,
    this.songId,
    this.dynamicLinkData,
  }) : super(key: key);

  @override
  _ShareSongScreenState createState() => _ShareSongScreenState();
}

class _ShareSongScreenState extends State<ShareSongScreen> {
  bool _isLoading = true;
  bool _isProcessingDynamicLink = false;
  String? _errorMessage;
  String? _lastProcessedLinkUrl;
  DateTime? _lastLinkProcessTime;

  @override
  void initState() {
    super.initState();
    _initializeShareSong();
  }

  Future<void> _initializeShareSong() async {
    try {
      if (widget.dynamicLinkData != null) {
        await _handleDynamicLink(widget.dynamicLinkData!);
      } else if (widget.songId != null) {
        await _handleDirectSongId(widget.songId!);
      } else {
        // Check for initial link when app is opened from background/closed state
        await _checkInitialLink();
        // Then listen for dynamic links
        _initDynamicLinks();
      }
    } catch (e) {
      _showErrorSnackBar('Failed to initialize share song: $e');
    }
  }

  Future<void> _checkInitialLink() async {
    try {
      final PendingDynamicLinkData? initialLink = await FirebaseDynamicLinks.instance.getInitialLink();
      if (initialLink != null) {
        print('Found initial link from background/closed app: ${initialLink.link}');
        await _handleDynamicLink(initialLink);
      } else {
        print('No initial link found');
        // If no link found, navigate back to previous screen
        Future.delayed(Duration(milliseconds: 1000), () {
          if (mounted) {
            _navigateBack();
          }
        });
      }
    } catch (e) {
      print('Error checking initial link: $e');
      _showErrorSnackBar('Failed to process shared link: $e');
    }
  }

  void _initDynamicLinks() {
    // Handle initial link when app is launched from a closed state
    FirebaseDynamicLinks.instance.getInitialLink().then((PendingDynamicLinkData? initialLink) {
      if (initialLink != null) {
        _handleDynamicLink(initialLink);
      }
    });

    // Listen for dynamic links while the app is in the foreground or background
    FirebaseDynamicLinks.instance.onLink.listen((PendingDynamicLinkData dynamicLinkData) {
      _handleDynamicLink(dynamicLinkData);
    }).onError((error) {
      print('Dynamic link error: $error');
      _showErrorSnackBar('Dynamic link error: $error');
    });
  }

  Future<void> _handleDynamicLink(PendingDynamicLinkData data) async {
    final Uri? deepLink = data.link;

    if (deepLink != null && !_isProcessingDynamicLink) {
      // Prevent duplicate link processing
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
      _isProcessingDynamicLink = true;

      try {
        print('Received deep link: $deepLink');
        print('Deep link path: ${deepLink.path}');
        print('Deep link query parameters: ${deepLink.queryParameters}');

        final path = deepLink.path;
        final artistId = deepLink.queryParameters['artistId'];
        final songId = deepLink.queryParameters['songId'];
        final playlistId = deepLink.queryParameters['playlist_id'];

        if (path == '/refer') {
          print('Referral link received, navigating to homepage');
          _navigateBack();
          return;
        }

        // Handle artist profile link
        if (path == '/artistprofile' && artistId != null) {
          await _handleArtistProfileLink(artistId);
        }
        // Handle song link
        else if (path == '/song' && songId != null) {
          await _handleDirectSongId(songId);
        }
        // Handle playlist link
        else if (path == '/playlist' && playlistId != null) {
          await _handlePlaylistLink(playlistId);
        } else {
          _showErrorSnackBar('Invalid share link format');
          _navigateBack();
        }
      } finally {
        _isProcessingDynamicLink = false;
      }
    }
  }

  Future<void> _handleDirectSongId(String songId) async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      print('Processing song with ID: $songId');

      // Check if song is currently playing to prevent conflicts
      final currentSongId = await AudioService().getCurrentSongId();
      if (currentSongId != null && currentSongId == songId) {
        print('Song is already playing, navigating to player');
        _navigateToMusicPlayer(songId, 'Unknown Genre');
        return;
      }

      // Fetch song details
      final songDetails = await _fetchSongDetails(songId);

      if (songDetails == null) {
        _showErrorSnackBar('Song not found or unavailable');
        _navigateBack();
        return;
      }

      // Validate streaming URL
      if (songDetails['streamingUrl'] == null || songDetails['streamingUrl'].isEmpty) {
        _showErrorSnackBar('Song streaming URL not available');
        _navigateBack();
        return;
      }

      // Get language/genre info
      final String language = songDetails['languages'] ?? 'Unknown Language';
      final String genre = songDetails['genre'] ?? 'Unknown Genre';

      // Stop current audio if playing
      if (currentSongId != null) {
        await AudioService().pause();
        await Future.delayed(Duration(milliseconds: 200));
      }

      // Create song list for player
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

      // Navigate to player and load song
      await _navigateToMusicPlayerWithSong(songList, genre);

    } catch (e) {
      print('Error handling song: $e');
      _showErrorSnackBar('Failed to load song: $e');
      _navigateBack();
    }
  }

  Future<void> _handleArtistProfileLink(String artistId) async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      print('Processing artist profile with ID: $artistId');

      // Fetch artist details
      final artistDetails = await _fetchArtistDetails(artistId);
      if (artistDetails != null) {
        int followerCount = await _fetchFollowerCount(artistId);
        List<String> followingIds = await _fetchFollowingList(
            ProfileManager().getUserId()!);
        bool isFollowing = followingIds.contains(artistId);

        if (mounted) {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) => MusicArtistPage(
                artistId: artistId,
                artistName: (artistDetails['StageName']?.toString().trim().isNotEmpty == true)
                    ? artistDetails['StageName']
                    : artistDetails['FullName'] ?? 'Unknown Artist',
                followerCount: followerCount,
                userId: widget.email,
                category: widget.category,
                userfullname: widget.userfullname,
                isFollowing: isFollowing,
                profileImageUrl: artistDetails['profilePhotoUrl'],
                coverImageUrl: artistDetails['coverPageUrl'],
                isFromDeepLink: true,
              ),
            ),
          );
        }
      } else {
        _showErrorSnackBar('Artist details not found');
        _navigateBack();
      }
    } catch (e) {
      print('Error handling artist profile link: $e');
      _showErrorSnackBar('Failed to load artist profile: $e');
      _navigateBack();
    }
  }

  Future<void> _handlePlaylistLink(String playlistId) async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      print('Processing playlist with ID: $playlistId');

      // Fetch songs in the playlist
      final result = await _fetchSongsInPlaylist(playlistId);
      final String playlistName = result['playlistName'];
      final List<Map<String, String>> songs = result['songs'];

      if (songs.isNotEmpty) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ListPage1(
              genreTitle: playlistName,
              bannerImage: 'assets/playlist_banner.jpg',
              email: widget.email,
              Category: widget.category,
              fullname: widget.userfullname,
              playlistId: playlistId,
            ),
          ),
        );
      } else {
        _showErrorSnackBar('The playlist you\'re looking for is not found');
        _navigateBack();
      }
    } catch (e) {
      print('Error handling playlist link: $e');
      _showErrorSnackBar('The playlist you\'re looking for is not found');
      _navigateBack();
    }
  }

  Future<Map<String, dynamic>?> _fetchArtistDetails(String artistId) async {
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
            return {
              'genres': _extractDynamoValue(data['genres']) ?? [],
              'languages': _extractDynamoValue(data['languages']) ?? [],
              'coverPageUrl': _extractDynamoValue(data['coverPageUrl']) ?? '',
              'profilePhotoUrl': _extractDynamoValue(data['profilePhotoUrl']) ?? '',
              'FullName': _extractDynamoValue(data['FullName']) ?? 'Unknown Artist',
              'StageName': _extractDynamoValue(data['StageName']) ?? _extractDynamoValue(data['FullName']) ?? 'Unknown Artist',
              'bio': _extractDynamoValue(data['bio']) ?? '',
            };
          } else {
            // Direct object format
            data = responseData;
            return {
              'genres': data['genres'] ?? [],
              'languages': data['languages'] ?? [],
              'coverPageUrl': data['coverPageUrl'] ?? '',
              'profilePhotoUrl': data['profilePhotoUrl'] ?? '',
              'FullName': data['FullName'] ?? 'Unknown Artist',
              'StageName': data['StageName'] ?? data['FullName'] ?? 'Unknown Artist',
              'bio': data['bio'] ?? '',
            };
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

  Future<List<String>> _fetchFollowingList(String userId) async {
    try {
      final response = await ApiService.getSharedFollowingList(userId);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['followingList'] != null) {
          return List<String>.from(data['followingList']);
        }
      }
      return [];
    } catch (e) {
      print('Error fetching following list: $e');
      return [];
    }
  }

  Future<int> _fetchFollowerCount(String artistId) async {
    try {
      final response = await ApiService.getSharedFollowerCount(artistId);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return data['followerCount'] ?? 0;
      }
      return 0;
    } catch (e) {
      print('Error fetching follower count: $e');
      return 0;
    }
  }

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
            'stageName': (data['stage_name']?['S']?.trim().isNotEmpty == true)
                ? data['stage_name']['S']
                : (data['FullName']?['S'] ?? data['user_FullName']?['S'] ?? 'Unknown Stage Name'),
            'playlistCount': data['playlistCount']?['S'] ?? '0',
            'shareSongCount': data['shareSongCount']?['S'] ?? '0',
            'span': data['span']?['S'] ?? '00:00',
            'coverPage': data['coverPageUrl']?['S'] ?? 'assets/placeholder.png',
            'songUrl': data['songUrl']?['S'] ?? '',
            'genre': data['genre']?['S'] ?? 'Unknown Genre',
            'languages': data['languages']?['S'] ?? 'Unknown Language',
            'mood': data['mood']?['S'] ?? 'Unknown Mood',
            'playCount': data['playCount']?['S'] ?? '0',
            'approved': data['approved']?['BOOL'] ?? false,
            'userDetails': {
              'email': data['user_EmailId']?['S'] ?? 'No Email',
              'fullName': data['user_FullName']?['S'] ?? 'No Name',
              'profilePhotoUrl': data['coverPageUrl']?['S'] ?? '',
              'user_id': data['user_id']?['S'] ?? 'Unknown User ID',
              'age': data['user_Age']?['S'] ?? 'Unknown Age',
              'gender': data['user_Gender']?['S'] ?? 'Unknown Gender',
              'category': data['user_Category']?['S'] ?? 'Unknown Category',
            },
          };
        } else {
          print('No song details found for songId: $songId');
          return null;
        }
      } else {
        print('Failed to fetch song details. Status code: ${response.statusCode}');
        return null;
      }
    } catch (error) {
      print('Error fetching song details: $error');
      return null;
    }
  }

  Future<void> _navigateToMusicPlayerWithSong(List<Map<String, String>> songList, String genre) async {
    if (!mounted) return;

    // Clear existing MusicPlayerPage instances to prevent stacking
    Navigator.popUntil(context, (route) => route.isFirst);

    // Navigate to player page
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => MusicPlayerPage(
          currentIndex: 0,
          navigationIndex: 0,
          email: widget.email,
          userfullname: widget.userfullname,
          userCategory: widget.category,
          sourceType: 'genre',
          sourceName: genre,
        ),
        settings: RouteSettings(name: 'music_player_from_share'),
      ),
    );

    // Give UI time to initialize, then load the song
    await Future.delayed(Duration(milliseconds: 500));

    // Load the playlist
    await AudioService().loadPlaylist(songList, initialIndex: 0);
  }

  void _navigateToMusicPlayer(String songId, String genre) {
    if (!mounted) return;

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => MusicPlayerPage(
          currentIndex: 0,
          navigationIndex: 0,
          email: widget.email,
          userfullname: widget.userfullname,
          userCategory: widget.category,
          sourceType: 'genre',
          sourceName: genre,
        ),
        settings: RouteSettings(name: 'music_player_from_share'),
      ),
    );
  }

  void _navigateBack() {
    if (mounted) {
      Navigator.pop(context);
    }
  }

  void _showErrorSnackBar(String message) {
    if (mounted) {
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
          action: SnackBarAction(
            label: 'Dismiss',
            textColor: Colors.white,
            onPressed: () {
              ScaffoldMessenger.of(context).hideCurrentSnackBar();
            },
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Color(0xFF0D0D0D),
      appBar: AppBar(
        backgroundColor: Color(0xFF0D0D0D),
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: Colors.white),
          onPressed: _navigateBack,
        ),
        title: Text(
          'Opening Shared Song',
          style: TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (_isLoading) ...[
              // Custom loading animation
              Container(
                width: 80,
                height: 80,
                child: CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.blue),
                  strokeWidth: 3,
                ),
              ),
              SizedBox(height: 24),
              Text(
                'Loading shared song...',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
              ),
              SizedBox(height: 8),
              Text(
                'Please wait while we prepare your music',
                style: TextStyle(
                  color: Colors.grey[400],
                  fontSize: 14,
                ),
              ),
            ] else if (_errorMessage != null) ...[
              Icon(
                Icons.error_outline,
                color: Colors.red[400],
                size: 64,
              ),
              SizedBox(height: 16),
              Text(
                'Oops! Something went wrong',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                ),
              ),
              SizedBox(height: 8),
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 32),
                child: Text(
                  _errorMessage!,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.grey[400],
                    fontSize: 14,
                  ),
                ),
              ),
              SizedBox(height: 24),
              ElevatedButton(
                onPressed: _navigateBack,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  foregroundColor: Colors.white,
                  padding: EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: Text('Go Back'),
              ),
            ],
            // Music note animation
            if (_isLoading) ...[
              SizedBox(height: 32),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _buildMusicNote(0),
                  SizedBox(width: 8),
                  _buildMusicNote(200),
                  SizedBox(width: 8),
                  _buildMusicNote(400),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildMusicNote(int delay) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: Duration(milliseconds: 1000),
      builder: (context, value, child) {
        return Transform.translate(
          offset: Offset(0, -10 * (0.5 - (value - 0.5).abs()) * 2),
          child: Icon(
            Icons.music_note,
            color: Colors.blue.withOpacity(0.3 + 0.7 * value),
            size: 24,
          ),
        );
      },
    );
  }
}
