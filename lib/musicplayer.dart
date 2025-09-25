// musicplayer.dart      //latest og one with all good
import 'dart:async';
import 'dart:ui';

import 'package:firebase_dynamic_links/firebase_dynamic_links.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:just_audio/just_audio.dart';
import 'package:rxdart/rxdart.dart';
import 'package:audio_session/audio_session.dart';
import 'package:share_plus/share_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:voiceapp/SongStatusManager.dart';
import 'dart:convert';

import 'package:voiceapp/audio_service1.dart';
import 'package:audio_video_progress_bar/audio_video_progress_bar.dart';
import 'package:just_audio_background/just_audio_background.dart';
import 'package:voiceapp/main.dart';
import 'package:voiceapp/profile_manager.dart';
import 'package:voiceapp/queuepage.dart';
import 'package:voiceapp/viewProfile.dart';
import 'package:shimmer/shimmer.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:marquee/marquee.dart';

import 'NewHomepage.dart';
import 'ProfilePage.dart';
import 'SearchPage.dart';
import 'Song Upload/upload_selection_page.dart';
import 'Song Upload/uploadsong1.dart';
import 'bottomnavigationbar.dart';
import 'newlistofsongs.dart';
import 'notifiers.dart';

import 'package:voiceapp/connectivity_service.dart';
import 'package:voiceapp/loading_screen.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:voiceapp/services/api_service.dart';

class MusicPlayerPage extends StatefulWidget {
  final String userfullname;
  // List of songs
  final int currentIndex;
  final String email;
  final String userCategory; // Current index
  final int? navigationIndex;
  final String? sourceType; // 'playlist', 'genre', or 'language'
  final String? sourceName; // The actual name to display
  final bool? initialPlaybackState;
  final Duration? initialPosition;

  MusicPlayerPage({

    required this.currentIndex,
    required this.email,
    required this.userfullname,
    required this.userCategory,
    this.navigationIndex,
    this.sourceType,
    this.sourceName,
    this.initialPlaybackState,
    this.initialPosition,
  });

  @override
  _MusicPlayerPageState createState() => _MusicPlayerPageState();
}

class _MusicPlayerPageState extends State<MusicPlayerPage> with SingleTickerProviderStateMixin {
  late AudioPlayer _player;
  bool _isHandlingCompletion = false;
  StreamSubscription? _positionSubscription;
  StreamSubscription? _playerStateSubscription;
  late ConcatenatingAudioSource _playlist;
  late int currentIndex;
  bool isLoved = false;
  String selectedEmoji = "";
  bool isCelebrationSelected = false;
  bool showCommentField = false; // To control visibility of the comment field
  TextEditingController commentController = TextEditingController();
  List<Map<String, String>> songComments = []; // To hold the fetched comments
  //bool isLoadingComments = false;
  String currentSongId = '';
  Map<String, String> profileImageCache = {};
  Map<String, List<String>> playlistSongIds = {};
  final Map<String, Uri> _dynamicLinkCache = {};

  String? _profileImageUrl;
  bool _shouldRestorePlaybackState = false;
  Duration? _initialPosition;
  //final SongStatusManager _statusManager = SongStatusManager();// Cache to store profile images for each userId
  bool isTrackReady = false;
  late SongStatusManager _statusManager;

  bool hasPostedHistory = false;
  bool _isInitialized = false;
  Map<String, List<String>> playlistSongCache = {};


  late final ValueNotifier<bool> isLoadingComments;
  late final ValueNotifier<List<Map<String, String>>> songCommentsNotifier;
  late final ValueNotifier<bool> isLoadingPlaylists;
  late final ValueNotifier<List<Map<String, String>>> playlistsNotifier;
  late final ValueNotifier<bool> isLoadingSongInfo;
  bool _isFirstLoad = true;
  bool _isProcessingState = false;
  bool isCommentsModalOpen = false;

  bool _isLoading = true;
  bool _isNoInternet = false;
  late ConnectivityService _connectivityService;
  bool _mounted = true;
  Map<String, bool> _historyPostedMap = {};
  StreamSubscription? _currentIndexSubscription;

  Map<String, dynamic> _playlistCache = {};
  DateTime _playlistCacheTimestamp = DateTime.now();
  final int _cacheExpirationMinutes = 5; // Cache valid for 5 minutes
  bool _isPlaylistLoading = false; // Track background loading state


//agdahsdgsahd hsdahsdgahdha hadaghdgsadjha hgdashdahjsd hsadgashjdasd

  @override
  void initState() {
    super.initState();
    _player = AudioService().player;
    _statusManager = SongStatusManager();
    // _statusManager.isFavoriteNotifier.value = false;
    // _statusManager.isCelebration = false;
    isLoadingComments = ValueNotifier(true);
    songCommentsNotifier = ValueNotifier([]);
    isLoadingPlaylists = ValueNotifier(true);
    playlistsNotifier = ValueNotifier([]);
    isLoadingSongInfo = ValueNotifier(true);
    _mounted = true;
    _connectivityService = ConnectivityService();
    _setupConnectivityListener();
    _shouldRestorePlaybackState = widget.initialPlaybackState != null;
    _initialPosition = widget.initialPosition;
    //isNowPlayingTileVisible.value = true;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      isNowPlayingTileVisible.value = true;
    });

    // Listen to player state changes
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        _initializePlayer();
      }
    });
    //_init();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        _prefetchPlaylists();
      }
    });
  }

  MediaItem? getCurrentMediaItem() {
    try {
      final mediaItem = _player.sequenceState?.currentSource?.tag as MediaItem?;
      print("Current MediaItem: id=${mediaItem?.id}, album=${mediaItem?.album}, extras=${mediaItem?.extras}");
      return mediaItem;
    } catch (e) {
      print("Error getting current media item: $e");
      return null;
    }
  }
  void _goToAlbumPage(BuildContext context) async {
    final mediaItem = getCurrentMediaItem();
    if (mediaItem == null) {
      print("No MediaItem available");
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Unable to load song data")),
      );
      return;
    }

    String albumId = mediaItem.extras?['albumId']?.toString() ?? '';
    String artistId = mediaItem.extras?['artistId']?.toString() ?? '';
    String albumName = mediaItem.album ?? 'Unknown Album';
    String albumCoverUrl = mediaItem.artUri?.toString() ?? '';

    print("MediaItem extras: ${mediaItem.extras}");
    print("Initial album data: ID=$albumId, ArtistID=$artistId, Name=$albumName, SongID=${mediaItem.id}");

    // Fetch album data if albumId or artistId is missing
    if (albumId.isEmpty || artistId.isEmpty) {
      try {
        final response = await ApiService.getAlbumGoto(mediaItem.id);
        if (ApiService.isSuccessResponse(response)) {
          final data = ApiService.parseJsonResponse(response);
          if (data != null) {
            albumId = data['album_id']?.toString() ?? '';
            artistId = data['user_id']?.toString() ?? '';
            albumName = data['albumName'] ?? albumName;
            albumCoverUrl = data['albumCoverUrl'] ?? albumCoverUrl;
            print("Fetched album data: ID=$albumId, ArtistID=$artistId, Name=$albumName");
          }
        } else {
          print("Failed to fetch album data: ${ApiService.getErrorMessage(response)}");
        }
      } catch (e) {
        print("Error fetching album data: $e");
      }
    }

    // Validate album data
    if (albumId.isEmpty || albumName == 'Unknown Album' || albumName == 'Single') {
      print("Invalid album data after fetch: albumId='$albumId', artistId='$artistId', albumName='$albumName'");
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('This song is not a part of any album')),
      );
      return;
    }

    // Navigate to ListPage
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ListPage(
          genreTitle: albumName,
          bannerImage: albumCoverUrl,
          email: widget.email,
          fullname: widget.userfullname,
          Category: widget.userCategory,
          isArtistAlbum: true,
          artistId: artistId,
          album: albumName,
          albumId: albumId,
          navigationIndex: widget.navigationIndex ?? 0,
        ),
      ),
    );
  }

  Future<void> _prefetchPlaylists() async {
    if (_isPlaylistLoading || !mounted) return; // Prevent multiple simultaneous fetches

    _isPlaylistLoading = true;

    try {
      String? userId = ProfileManager().getUserId();
      if (userId != null) {
        await _fetchPlaylists(userId);
      }
    } catch (e) {
      print('Error prefetching playlists: $e');
    } finally {
      if (mounted) {
        setState(() {
          _isPlaylistLoading = false;
        });
      }
    }
  }

  void _setupConnectivityListener() {
    _connectivityService.connectionStream.listen((hasConnection) {
      if (!_mounted || _connectivityService.isClosed) return;

      setState(() {
        _isNoInternet = !hasConnection;
      });

      // If connection is restored, initialize data
      if (hasConnection && _isNoInternet) {
        _initializeData();
      }
    });

    // Initial check
    _checkConnectivity();
  }

  Future<void> _checkConnectivity() async {
    if (!_mounted) return;

    setState(() {
      _isLoading = true;
    });

    await _connectivityService.checkConnection();

    if (!_mounted) return;

    if (_connectivityService.hasConnection) {
      await _initializeData();
    }

    setState(() {
      _isNoInternet = !_connectivityService.hasConnection;
      _isLoading = false;
    });
  }

  Future<void> _initializeData() async {
    try {
      // If you have any initial data fetching method, call it here
      // For example:
      // await _fetchSongStatus();
      // await _updateSongStatus();

      if (_mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    } catch (e) {
      print('Error initializing data: $e');
      if (_mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  void setState(VoidCallback fn) {
    if (_mounted && mounted) {
      super.setState(fn);
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Reset state when dependencies change (like after re-login)
    if (!_isInitialized) {
      _isInitialized = true;
      _setupPlayerListeners();
      _prefetchPlaylists();
    }
  }

  void _refreshPlaylistsInBackground() {
    // Don't show loading indicators, just refresh quietly
    _invalidatePlaylistCache();
    _prefetchPlaylists();
  }

  Future<void> _initializePlayer() async {
    if (!mounted) return;

    try {
      // Initialize audio session
      final session = await AudioSession.instance;
      await session.configure(AudioSessionConfiguration.music());

      // Set up player listeners only if not already set
      if (_isFirstLoad) {
        _setupPlayerListeners();
        _isFirstLoad = false;
      }

      // Restore the playback state if flag is set
      if (_shouldRestorePlaybackState) {
        // Seek to the initial position first
        if (_initialPosition != null) {
          await _player.seek(_initialPosition!);
        }

        // Then set the playback state
        if (widget.initialPlaybackState == true) {
          await _player.play();
        } else {
          await _player.pause();
        }
        _shouldRestorePlaybackState = false; // Reset the flag
      }
      // If no specific state was provided, fall back to default behavior
      else if (autoplayNotifier.value) {
        await _player.play();
      }
    } catch (e) {
      print('Error initializing player: $e');
    }
  }

  void _setupPlayerListeners() {
    if (!mounted) return;

    // Create a debounced function for posting history to avoid duplicate calls
    Future<void> debouncedPostHistory(String songId) async {
      // Skip if we've already posted history for this song in this session
      if (_historyPostedMap.containsKey(songId) &&
          _historyPostedMap[songId] == true) {
        print("History already posted for song ID: $songId in this session");
        return;
      }

      final userId = ProfileManager().getUserId();
      if (userId == null || songId.isEmpty) {
        print("Invalid user ID or song ID for history post");
        return;
      }

      try {
        bool success = await _postHistoryWithRetry(songId, userId);
        if (success && mounted) {
          setState(() {
            // Mark this song as having had its history posted
            _historyPostedMap[songId] = true;
            hasPostedHistory = true;
          });
        }
      } catch (e) {
        print("Error in debouncedPostHistory: $e");
      }
    }

    // Add a timer to monitor if playback gets stuck
    Timer.periodic(Duration(seconds: 30), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }

      if (_player.playing &&
          _player.position.inSeconds > 0 &&
          _player.position == _player.position) {
        // Position hasn't changed for 30 seconds despite being in "playing" state
        print("Detected stalled playback at position ${_player.position}");

        // Try to fix by seeking slightly forward
        _player.seek(_player.position + Duration(milliseconds: 500))
            .then((_) => _player.play())
            .catchError((e) => print("Error recovering from stall: $e"));
      }
    });

    // Main player state listener - detect when a song actually starts playing
    _playerStateSubscription?.cancel();
    _playerStateSubscription = _player.playerStateStream.listen((playerState) {
      if (!mounted || _isProcessingState) return;

      _isProcessingState = true;
      try {
        // Only process history when song is actually playing
        if (playerState.playing &&
            playerState.processingState == ProcessingState.ready) {
          //_resetSongStatus();
          setState(() {
            isTrackReady = true;
          });

          _updateSongStatus();

          // Get song ID with retry mechanism
          getCurrentSongIdWithRetry().then((songId) {
            if (songId != null) {
              print("Song playing - posting to history. ID: $songId");
              debouncedPostHistory(songId);
            }
          });
        } else if (playerState.processingState == ProcessingState.buffering &&
            playerState.playing) {
          // Handle buffering state to detect potential stalls
          print("Player is buffering while playing");
        }
      } finally {
        _isProcessingState = false;
      }
    });

    // Current index listener - detect when song changes
    _currentIndexSubscription?.cancel();
    _currentIndexSubscription = _player.currentIndexStream.listen((index) {
      if (!mounted || index == null) return;

      setState(() {
        currentIndex = index;
      });

      // Get the media item when song changes
      final mediaItem = getCurrentMediaItem();
      if (mediaItem != null) {
        ProfileManager().updateCurrentlyPlayingSong(mediaItem.id);
        currentSongId = mediaItem.id;

        // Check if we should post history for this song
        if (_player.playing && mediaItem.id.isNotEmpty) {
          print("Song changed - posting to history. ID: ${mediaItem.id}");
          debouncedPostHistory(mediaItem.id);
        }
      }
    });
  }

  Future<bool> _postHistoryWithRetry(String songId, String userId,
      {int maxRetries = 3}) async {
    for (int i = 0; i < maxRetries; i++) {
      try {
        bool success = await _attemptPostHistory(songId, userId);
        if (success) {
          print('Successfully posted song $songId to history on attempt ${i +
              1}');
          return true;
        } else {
          print('Failed to post song to history on attempt ${i + 1}');
          await Future.delayed(Duration(milliseconds: 500 * (i + 1)));
        }
      } catch (e) {
        print('Error posting song to history on attempt ${i + 1}: $e');
        await Future.delayed(Duration(milliseconds: 500 * (i + 1)));
      }
    }
    return false;
  }

  Future<bool> _attemptPostHistory(String songId, String userId) async {
    final String timestamp = DateFormat('yyyyMMdd_HHmmss').format(
        DateTime.now());

    try {
      print("Posting history with song ID: $songId and user ID: $userId");

      final response = await ApiService.saveHistory({
        'song_id': songId,
        'user_id': userId,
        'updatedTimestamp': timestamp
      });

      return ApiService.isSuccessResponse(response);
    } catch (e) {
      print('Error in _attemptPostHistory: $e');
      return false;
    }
  }

// Helper method to safely set state

// ... (rest of the code remains the same)

  String? getCurrentSongId() {
    final mediaItem = getCurrentMediaItem();
    return mediaItem?.id;
  }

  Future<void> _storeLinkToLocalCache(String songId, Uri link) async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.setString(songId, link.toString());
  }

  Future<Uri?> _getLinkFromLocalCache(String songId) async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    String? link = prefs.getString(songId);
    return link != null ? Uri.parse(link) : null;
  }


  Future<Uri> createDynamicLink(MediaItem mediaItem) async {
    // Get the song ID from the mediaItem
    String songId = mediaItem.id;

    // Get the image URL from the mediaItem, or provide a default URL if not available
    Uri? imageUrl = mediaItem.artUri ??
        Uri.parse('https://example.com/default-image.jpg');

    // Create the dynamic link with the media item data
    final DynamicLinkParameters parameters = DynamicLinkParameters(
      uriPrefix: 'https://voiznewapp.page.link',
      // Your Firebase Dynamic Link domain
      link: Uri.parse('https://voiznewapp.page.link/song?songId=$songId'),
      // Link with songId as query parameter
      androidParameters: AndroidParameters(
        packageName: 'com.voizapp.voiceapp',
        // Replace with your Android app's package name
        minimumVersion: 0,
      ),
      iosParameters: IOSParameters(
        bundleId: 'com.voizapp.voiceapp', // Replace with your iOS bundle ID
        minimumVersion: '1.0.1',
      ),
      socialMetaTagParameters: SocialMetaTagParameters(
        title: mediaItem.title, // Use the song title from the media item
        description: 'Hey, see what I found ! Listen to this amazing song 😍 on VOIZ ! Just download the app, listen and enjoy !',
        imageUrl: imageUrl, // Use the fetched image URL from the media item
      ),
    );

    // Generate the short dynamic link
    final ShortDynamicLink shortLink = await FirebaseDynamicLinks.instance
        .buildShortLink(parameters);
    return shortLink.shortUrl;
  }

  void _shareSong(MediaItem mediaItem) async {
    try {
      // Generate the dynamic link for the song
      Uri dynamicLink = await createDynamicLink(mediaItem);


      // Use the link to share the song
      final shareText = 'Hey, see what I found ! Listen to this amazing song 😍 on VOIZ ! Just download the app, listen and enjoy ! $dynamicLink';
      Share.share(shareText);
      await _incrementShareCount(mediaItem.id);
    } catch (e) {
      print('Error generating dynamic link: $e');
    }
  }

  Future<void> _incrementShareCount(String songId) async {
    final String timestamp = DateFormat('yyyyMMdd_HHmmss').format(
        DateTime.now());
    try {
      final response = await ApiService.updateShareSongCount({
        'song_id': songId,
        'updatedTimestamp': timestamp
      });

      if (ApiService.isSuccessResponse(response)) {
        print('Share count incremented successfully!');
      } else {
        print('Failed to increment share count: ${ApiService.getErrorMessage(response)}');
      }
    } catch (e) {
      print('Error incrementing share count: $e');
    }
  }


  Future<void> _updateSongStatus() async {
    if (!mounted) return;

    final songId = await getCurrentSongIdWithRetry();
    if (songId == null) {
      print("Warning: songId is null, skipping status update");
      //_statusManager.isFavoriteNotifier.value = false;
      //_statusManager.isCelebration = false;
      return; // Early return if songId is null
    }

    final userId = ProfileManager().getUserId();
    if (userId == null) {
      // Explicitly set to false if no user
      //_statusManager.isFavoriteNotifier.value = false;
      //_statusManager.isCelebration = false;
      return;
    }

    try {
      await _statusManager.fetchStatus(songId, userId);
      if (mounted) {
        setState(() {
          // Status is now handled by the manager
        });
      }
    } catch (e) {
      print("Error updating song status: $e");
      if (mounted) {
        setState(() {
          //_statusManager.isCelebration = false;
          //_statusManager.isFavoriteNotifier.value = false;
        });
      }
    }
  }


  void resetState() {
    isLoadingComments.value = false;
    isLoadingPlaylists.value = false;
    isLoadingSongInfo.value = false;

    songCommentsNotifier.value = [];
    playlistsNotifier.value = [];

    //_statusManager.isFavoriteNotifier.value = false;
    //_statusManager.isCelebration = false;

    currentIndex = 0;
    isTrackReady = false;
    hasPostedHistory = false;
    isLoved = false;
    selectedEmoji = "";
    isCelebrationSelected = false;
    showCommentField = false;
    currentSongId = '';
  }

  @override
  void dispose() {
    _historyPostedMap.clear(); // Clear history tracking
    _mounted = false;
    _connectivityService.dispose();
    resetState();
    _isInitialized = false;
    _isFirstLoad = true;
    _isProcessingState = false;
    isLoadingComments.value = true;
    isLoadingPlaylists.value = true;
    isLoadingSongInfo.value = true;
    songCommentsNotifier.value = [];
    playlistsNotifier.value = [];
    _positionSubscription?.cancel();
    _playerStateSubscription?.cancel();
    _currentIndexSubscription?.cancel();
    // Show the mini-player again when leaving the full player page
    if (_player.playing) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        isNowPlayingTileVisible.value = true;
        AudioService().updateNowPlayingState();
      });
    }


    _playerStateSubscription?.cancel();
    //_player.dispose(); // Dispose of the audio player
    super.dispose();
  }


  String getInitials(String? fullName) {
    if (fullName == null || fullName
        .trim()
        .isEmpty) {
      return ""; // Return empty string if fullName is null or empty
    }

    List<String> nameParts = fullName.trim().split(RegExp(r'\s+'));

    if (nameParts.length == 1) {
      return nameParts[0][0].toUpperCase();
    } else if (nameParts.length > 1) {
      return nameParts[0][0].toUpperCase() + nameParts[1][0].toUpperCase();
    } else {
      return "";
    }
  }

  void _toggleFavorite(String songId, bool newFavoriteStatus) {
    // Immediately update the UI to reflect the new state
    setState(() {
      _statusManager.isFavoriteNotifier.value = newFavoriteStatus;
    });
    _statusManager.updateStatus(
        songId, ProfileManager().getUserId()!, newFavoriteStatus,
        _statusManager.isCelebration);
  }

  void _toggleCelebration(String songId, bool newCelebrationStatus) {
    // Immediately update the UI to reflect the new state
    setState(() {
      _statusManager.isCelebration = newCelebrationStatus;
    });
    _statusManager.updateStatus(songId, ProfileManager().getUserId()!,
        _statusManager.isFavoriteNotifier.value, newCelebrationStatus);
  }

  void _resetSongStatus() {
    if (mounted) {
      // Force an immediate UI update with reset values
      setState(() {
        _statusManager.isFavoriteNotifier.value = false;
        _statusManager.isCelebration = false;
      });
    }
  }


  Future<List<Map<String, String>>> fetchSongCredits(String songId) async {
    String? songId1 = getCurrentSongId();
    print("Fetching song credits for songId: $songId1");
    
    if (songId1 == null) {
      print("getCurrentSongId() returned null");
      return [];
    }
    
    final response = await ApiService.getSongInfo(songId1);
    print("API Response status: ${response.statusCode}");
    print("API Response body: ${response.body}");

    if (ApiService.isSuccessResponse(response)) {
      final data = ApiService.parseJsonResponse(response);
      print("Parsed data: $data");
      
      if (data == null) {
        print("Parsed data is null");
        return [];
      }

      List<Map<String, String>> credits = [
        {'name': data['artist']?['S'] ?? data['singer']?['S'] ?? 'Unknown', 'role': 'Singer'},
        {'name': data['composer']?['S'] ?? 'Unknown', 'role': 'Composer'},
        {'name': data['lyricist']?['S'] ?? 'Unknown', 'role': 'Lyricist'},
        {'name': data['producer']?['S'] ?? 'Unknown', 'role': 'Producer'},
      ];

      print("Credits created: $credits");
      return credits;
    } else {
      print("API call failed with status: ${response.statusCode}");
      throw Exception('Failed to load song credits: ${ApiService.getErrorMessage(response)}');
    }
  }


  Future<void> _fetchProfileImage() async {
    try {
      final userId = ProfileManager().getUserId();
      if (userId == null) return;

      final response = await ApiService.getProfilePhoto(userId);

      if (ApiService.isSuccessResponse(response)) {
        final responseBody = ApiService.parseJsonResponse(response);

        // Check if responseBody contains the key 'profilePhotoUrl' and extract 'S' value
        if (responseBody != null && responseBody['profilePhotoUrl'] != null &&
            responseBody['profilePhotoUrl']['S'] != null) {
          String imageUrl = responseBody['profilePhotoUrl']['S']; // Extract the profile image URL

          // Set the profile image URL to display it
          setState(() {
            _profileImageUrl = imageUrl;
          });
        } else {
          print('No profile image URL found in the response.');
        }
      } else {
        print('Failed to fetch profile image: ${ApiService.getErrorMessage(response)}');
      }
    } catch (e) {
      print('Error fetching profile image: $e');
    }
  }


  Future<void> _init() async {
    // Initialize the audio session
    final session = await AudioSession.instance;
    await session.configure(AudioSessionConfiguration.music());

    // Set the current playlist and play the selected song
    await _player.play();
    //_fetchSongStatus();
  }

  Duration parseDuration(String time) {
    final parts = time.split(':');
    final minutes = int.parse(parts[0]);
    final seconds = int.parse(parts[1]);
    return Duration(minutes: minutes, seconds: seconds);
  }
  Future<void> _fetchComments(String songId) async {
    try {
      final songId1 = getCurrentSongId();
      if (songId1 == null) return;

      print(songId1);

      final response = await ApiService.getSongComments(songId1);

      if (ApiService.isSuccessResponse(response)) {
        final jsonResponse = ApiService.parseJsonListResponse(response);
        List<dynamic> userDetails = jsonResponse ?? [];

        List<Map<String, String>> comments = [];
        for (var comment in userDetails) {
          String fullName = comment['FullName'] ?? 'Unknown';
          String stageName = comment['StageName'] ?? '';
          String displayName = stageName.isNotEmpty ? stageName : fullName;
          String commentText = comment['comments'] ?? 'No comment';
          String userId = comment['user_id'] ?? '';
          String profileImage = comment['profilePhotoUrl'] ?? '';
          String comment_id = comment['comment_id'] ?? ' ';

          comments.add({
            'username': displayName,
            'comment': commentText,
            'profileImage': profileImage,
            'userId': userId,
            'comment_id': comment_id
          });
        }

        comments.sort((a, b) => int.tryParse(b['comment_id']!)!.compareTo(
            int.tryParse(a['comment_id']!)!));

        print(comments);

        // Update the songCommentsNotifier and stop the loader
        songCommentsNotifier.value = comments;
        isLoadingComments.value = false;
      } else {
        print('Failed to fetch comments: ${ApiService.getErrorMessage(response)}');
        isLoadingComments.value = false;
      }
    } catch (e) {
      print('Error fetching comments: $e');
      isLoadingComments.value = false;
    }
  }


  Future<String> _getProfileImage(String userId) async {
    // Check if profile image is already cached
    if (profileImageCache.containsKey(userId)) {
      return profileImageCache[userId]!;
    }

    try {
      final response = await ApiService.getProfilePhoto(userId);

      if (ApiService.isSuccessResponse(response)) {
        final responseBody = ApiService.parseJsonResponse(response);

        // Check if responseBody contains the key 'profilePhotoUrl' and extract 'S' value
        if (responseBody != null && responseBody['profilePhotoUrl'] != null &&
            responseBody['profilePhotoUrl']['S'] != null) {
          String imageUrl = responseBody['profilePhotoUrl']['S']; // Extract the profile image URL

          // Cache the profile image for future use
          profileImageCache[userId] = imageUrl;

          return imageUrl;
        } else {
          print('No profile image URL found in the response.');
          return ''; // Return empty string if no profile image is found
        }
      } else {
        print('Failed to fetch profile image: ${ApiService.getErrorMessage(response)}');
        return ''; // Return empty string in case of failure
      }
    } catch (e) {
      print('Error fetching profile image: $e');
      return ''; // Return empty string in case of an error
    }
  }


  // Fetch comments based on songId

  Widget _buildShimmerLoader() {
    return ListView.builder(
      itemCount: 5, // Number of shimmer items to display
      itemBuilder: (context, index) {
        return Shimmer.fromColors(
          baseColor: Colors.grey[700]!,
          highlightColor: Colors.grey[500]!,
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: Colors.grey[600],
              radius: 20,
            ),
            title: Container(
              height: 10,
              color: Colors.grey[600],
              margin: EdgeInsets.only(bottom: 6),
            ),
            subtitle: Container(
              height: 10,
              color: Colors.grey[600],
              width: double.infinity,
            ),
          ),
        );
      },
    );
  }


  void _clearComments() {
    songCommentsNotifier.value = [];
    isLoadingComments.value = true;
    commentController.clear(); // Clear the text input if any
  }

  // Function to show the comments section in a bottom sheet
  void _showCommentsSection(BuildContext context) {
    // Open modal immediately with shimmer loader
    isCommentsModalOpen = true;
    final bottomNavHeight = kBottomNavigationBarHeight + MediaQuery
        .of(context)
        .padding
        .bottom;
    final rootContext = context;
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.white.withOpacity(0.05),
      isScrollControlled: true,
      builder: (BuildContext context) {
        return Stack(

            children: [
              BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 2.0, sigmaY: 2.0),
                child: Container(
                  color: Colors.black.withOpacity(
                      0.05), // Slight darkening effect
                ),
              ),
              StatefulBuilder(
                builder: (BuildContext context, StateSetter modalSetState) {
                  // Begin fetching comments
                  _fetchComments(currentSongId);

                  return Padding(
                    padding: EdgeInsets.only(bottom: bottomNavHeight),
                    child: DraggableScrollableSheet(
                      initialChildSize: 0.8,
                      maxChildSize: 0.9,
                      minChildSize: 0.5,
                      builder: (BuildContext context,
                          ScrollController scrollController) {
                        return Align(
                            alignment: Alignment.center,
                            // Center the modal on the screen
                            child: FractionallySizedBox(
                                widthFactor: 0.92,
                                // Adjust the width factor to leave space on both sides
                                child: Container(
                                  decoration: BoxDecoration(
                                      color: Color(0xFF151415),
                                      borderRadius: BorderRadius.only(
                                        topLeft: Radius.circular(20.0),
                                        topRight: Radius.circular(20.0),
                                      ),
                                      boxShadow: [
                                        // BoxShadow(
                                        //   color: Colors.black.withOpacity(1),
                                        //   spreadRadius: 1,
                                        //   blurRadius: 5,
                                        //   offset: Offset(0, -4),
                                        // ),
                                        BoxShadow(
                                          color: Colors.black.withOpacity(
                                              0.7),
                                          spreadRadius: 3,
                                          blurRadius: 0.5,
                                          offset: Offset(3, -3),
                                        ),
                                      ]
                                  ),
                                  padding: const EdgeInsets.all(16.0),
                                  child: Column(
                                    children: [
                                      Align(
                                        alignment: Alignment.centerLeft,
                                        // Align to the left
                                        child: Padding(
                                          padding: const EdgeInsets.only(
                                              left: 8.0),
                                          child: Text(
                                            'Comments',
                                            style: TextStyle(
                                              fontSize: 20,
                                              color: Colors.white,
                                              fontWeight: FontWeight.bold,
                                              fontFamily: 'Poppins',
                                            ),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Padding(
                                        padding: const EdgeInsets.only(
                                            left: 15),
                                        child: TextField(
                                          controller: commentController,
                                          style: TextStyle(
                                              color: Color(0xFFA5A5A5),
                                              decorationThickness: 0),
                                          cursorColor: Colors.white,
                                          decoration: InputDecoration(
                                              contentPadding: EdgeInsets.only(
                                                  top: 20),
                                              hintText: 'Add a comment',
                                              hintStyle: TextStyle(
                                                  color: Colors.white70,
                                                  decorationThickness: 0),
                                              suffixIcon: IconButton(
                                                icon: Padding(
                                                  padding: const EdgeInsets
                                                      .only(top: 10),
                                                  child: SizedBox(
                                                      height: 16.97,
                                                      width: 19.46,
                                                      child: Icon(Icons.send,
                                                        color: Colors.white,)),
                                                ),
                                                onPressed: () async {
                                                  if (commentController.text
                                                      .isNotEmpty) {
                                                    final success = await _postComment(
                                                      currentSongId,
                                                      ProfileManager()
                                                          .getUserId()!,
                                                      commentController.text,
                                                    );

                                                    _showOverlayMessage(
                                                      context,
                                                      success
                                                          ? 'Comment posted successfully!'
                                                          : 'Failed to post comment.',
                                                    );
                                                    commentController.clear();
                                                    await _fetchComments(
                                                        currentSongId); // Refresh comments
                                                  }
                                                },
                                              ),
                                              enabledBorder: const UnderlineInputBorder(
                                                borderSide: BorderSide(
                                                    color: Colors.white70,
                                                    width: 2),
                                              ),
                                              focusedBorder: UnderlineInputBorder(
                                                borderSide: BorderSide(
                                                    color: Colors.white70,
                                                    width: 2),
                                              ),
                                              isDense: true
                                          ),
                                        ),
                                      ),
                                      const SizedBox(height: 10),
                                      Expanded(
                                        // Use ValueListenableBuilder to automatically update the comments
                                        child: ValueListenableBuilder<bool>(
                                          valueListenable: isLoadingComments,
                                          builder: (context, isLoading, child) {
                                            if (isLoading) {
                                              return _buildShimmerLoader(); // Show shimmer loader
                                            } else {
                                              return ValueListenableBuilder<
                                                  List<Map<String, String>>>(
                                                valueListenable: songCommentsNotifier,
                                                builder: (context, comments,
                                                    child) {
                                                  return comments.isEmpty
                                                      ? Center(
                                                    child: Text(
                                                      'No comments, add a new one!',
                                                      style: TextStyle(
                                                          color: Colors.white70,
                                                          fontSize: 16),
                                                    ),
                                                  )
                                                      : ListView.builder(
                                                    controller: scrollController,
                                                    itemCount: comments.length,
                                                    itemBuilder: (context,
                                                        index) {
                                                      final comment = comments[index];
                                                      final String profileImage = comment['profileImage']!;
                                                      final String username = comment['username']!;

                                                      return ListTile(
                                                        leading: profileImage
                                                            .isNotEmpty
                                                            ? CircleAvatar(
                                                          backgroundImage: NetworkImage(
                                                              profileImage),
                                                        )
                                                            : CircleAvatar(
                                                          backgroundColor: Colors
                                                              .grey,
                                                          child: Text(
                                                            getInitials(
                                                                username),
                                                            style: TextStyle(
                                                              color: Colors
                                                                  .white,
                                                              fontWeight: FontWeight
                                                                  .bold,
                                                            ),
                                                          ),
                                                        ),
                                                        title: Text(
                                                          username,
                                                          style: TextStyle(
                                                              color: Colors
                                                                  .white),
                                                        ),
                                                        subtitle: Text(
                                                          comment['comment']!,
                                                          style: TextStyle(
                                                              color: Colors
                                                                  .white70),
                                                        ),
                                                      );
                                                    },
                                                  );
                                                },
                                              );
                                            }
                                          },
                                        ),
                                      ),
                                    ],
                                  ),
                                )));
                      },
                    ),
                  );
                },
              ),
            ]
        );
      },
    ).then((_) {
      _clearComments();
      // Update flag when modal closes
      isCommentsModalOpen = false;
    });
  }


  void _showOverlayMessage(BuildContext context, String message) {
    final overlay = Overlay.of(context);

    // Get the height of the keyboard
    final keyboardHeight = MediaQuery
        .of(context)
        .viewInsets
        .bottom;

    final overlayEntry = OverlayEntry(
      builder: (context) =>
          Positioned(
            bottom: keyboardHeight > 0
                ? keyboardHeight +
                20 // Position above the keyboard with padding
                : MediaQuery
                .of(context)
                .size
                .height * 0.1, // Default position when no keyboard
            left: MediaQuery
                .of(context)
                .size
                .width * 0.1,
            right: MediaQuery
                .of(context)
                .size
                .width * 0.1,
            child: Material(
              color: Colors.transparent,
              child: Container(
                padding: EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  message,
                  style: TextStyle(color: Colors.black, fontSize: 16),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          ),
    );

    overlay?.insert(overlayEntry);

    // Remove the overlay after a short delay
    Future.delayed(Duration(seconds: 2), () {
      overlayEntry.remove();
    });
  }


  Future<bool> _postComment(String songId, String userId,
      String comment) async {
    final String timestamp = DateFormat('yyyyMMdd_HHmmss').format(
        DateTime.now());
    try {
      String? songId1 = getCurrentSongId();
      if (songId1 == null) return false;
      
      print(songId1);
      final response = await ApiService.addComment({
        'song_id': songId1,
        'user_id': userId,
        'comments': comment,
        'createdTimestamp': timestamp,
        'updatedTimestamp': timestamp
      });

      return ApiService.isSuccessResponse(response);
    } catch (e) {
      print('Error posting comment: $e');
      return false;
    }
  }


  // Update the _playNextSong method to use correct sequence checking
  Future<void> _playNextSong() async {
    try {
      //_resetSongStatus();
      // Deactivate loop when changing songs
      loopNotifier.value = false;
      await loopNotifier.saveLoopState();
      await _player.setLoopMode(LoopMode.off);
      final sequenceState = _player.sequenceState;
      if (sequenceState == null) return;

      final currentIndex = sequenceState.currentIndex;
      final lastIndex = sequenceState.sequence.length - 1;

      if (currentIndex < lastIndex) {
        await _player.seekToNext();
        final mediaItem = getCurrentMediaItem();
        if (mediaItem != null) {
          ProfileManager().updateCurrentlyPlayingSong(mediaItem.id);
          currentSongId = mediaItem.id;
        }

        // Reset position and ensure it's paused if autoplay is off
        await _player.seek(Duration.zero);
        if (!autoplayNotifier.value) {
          await _player.pause();
        }
      } else {
        // At the end of playlist, go back to first song
        await _player.seek(Duration.zero, index: 0);
        final mediaItem = getCurrentMediaItem();
        if (mediaItem != null) {
          ProfileManager().updateCurrentlyPlayingSong(mediaItem.id);
          currentSongId = mediaItem.id;
        }

        if (!autoplayNotifier.value) {
          await _player.pause();
        }
      }
    } catch (e) {
      print("Error playing next song: $e");
    }
  }

  Future<void> _playPreviousSong() async {
    try {
      // Deactivate loop when changing songs
      //_resetSongStatus();
      loopNotifier.value = false;
      await loopNotifier.saveLoopState();
      await _player.setLoopMode(LoopMode.off);
      final sequenceState = _player.sequenceState;
      if (sequenceState == null) return;

      if (sequenceState.currentIndex > 0) {
        await _player.seekToPrevious();
        final mediaItem = getCurrentMediaItem();
        if (mediaItem != null) {
          ProfileManager().updateCurrentlyPlayingSong(mediaItem.id);
          currentSongId = mediaItem.id;
        }

        // Reset position and ensure it's paused if autoplay is off
        await _player.seek(Duration.zero);
        if (!autoplayNotifier.value) {
          await _player.pause();
        }
      } else {
        // At the start of playlist, go to last song
        await _player.seek(
            Duration.zero, index: sequenceState.sequence.length - 1);
        final mediaItem = getCurrentMediaItem();
        if (mediaItem != null) {
          ProfileManager().updateCurrentlyPlayingSong(mediaItem.id);
          currentSongId = mediaItem.id;
        }

        if (!autoplayNotifier.value) {
          await _player.pause();
        }
      }
    } catch (e) {
      print("Error playing previous song: $e");
    }
  }

  void _addSongToQueue(Map<String, String> song) async {
    await AudioService().addSongToQueue(song);
  }

  // void _removeSongFromQueue(int index) async {
  //   await AudioService().removeSongFromQueue(index);
  // }

  Future<void> _addToFavorites(String songId, bool isFavorite) async {
    try {
      String? songId1 = getCurrentSongId();
      if (songId1 == null) return;

      print(songId1);
      print(isFavorite);
      final response = await ApiService.updateSongFavorite({
        'song_id': songId1,
        'favorite': isFavorite,
        'user_id': ProfileManager().getUserId()
      });

      if (ApiService.isSuccessResponse(response)) {
        setState(() {
          this.isLoved = isFavorite;
        });
        print('Song added to favorites');
      } else {
        print('Failed to update favorite status: ${ApiService.getErrorMessage(response)}');
      }
    } catch (e) {
      print('Error updating favorite status: $e');
    }
  }


  Future<void> _addTocelebration(String songId,
      bool isCelebrationSelected) async {
    String? songId1 = getCurrentSongId();
    if (songId1 == null) return;

    print(songId1);
    print(isCelebrationSelected);
    try {
      final response = await ApiService.sendSongFeedback({
        'song_id': songId1,
        'user_id': ProfileManager().getUserId(),
        'reaction': isCelebrationSelected,
      });

      if (ApiService.isSuccessResponse(response)) {
        setState(() {
          isCelebrationSelected = isCelebrationSelected;
        });
        print('Song reaction updated');
      } else {
        print('Failed to update reaction: ${ApiService.getErrorMessage(response)}');
      }
    } catch (e) {
      print('Error updating reaction: $e');
    }
  }


  Future<List<String>> _fetchSongs(String playlistId) async {
    try {
      final response = await ApiService.getPlaylistSongs(playlistId);

      if (ApiService.isSuccessResponse(response)) {
        final jsonResponse = ApiService.parseJsonResponse(response);
        if (jsonResponse != null && jsonResponse.containsKey('songDetails')) {
          final List<dynamic> items = jsonResponse['songDetails'];

          // Extract only song IDs to check if a song exists in the playlist
          return items.map<String>((song) => song['song_id'] ?? 'unknown')
              .toList();
        }
      }
      throw Exception('Failed to load songs: ${ApiService.getErrorMessage(response)}');
    } catch (e) {
      print('Error fetching songs: $e');
      return [];
    }
  }

  // Update your _fetchPlaylists method to cache results
  Future<void> _fetchPlaylists(String userId) async {
    try {
      //isLoadingPlaylists.value = true;

      final response = await ApiService.getPlaylistList(userId);

      if (ApiService.isSuccessResponse(response)) {
        // Process the data as you currently do
        final jsonResponse = ApiService.parseJsonResponse(response) ?? {};
        List<dynamic> items = jsonResponse['playlists'] ?? [];
        List<Map<String, String>> playlists = [];

        for (var playlist in items) {
          String playlistId = playlist['playlist_id']?['S'] ?? '';
          String playlistName = playlist['playlistName']?['S'] ?? '';
          String createdTimestamp = playlist['createdTimestamp']?['S'] ?? '';

          // Handle songIds and their timestamps from Map structure
          Map<String, dynamic> songIdsMap = playlist['songIds']?['M'] ?? {};
          int songCount = songIdsMap.length;

          String coverImage = 'assets/kill.png';

          if (songIdsMap.isNotEmpty) {
            // Find the song with the earliest timestamp
            String? earliestSongId;
            DateTime? earliestTime;

            songIdsMap.forEach((songId, timestampObj) {
              String timestamp = timestampObj['S'] ?? '';
              DateTime currentTime = parseCustomDateTime(timestamp);

              if (earliestTime == null || currentTime.isBefore(earliestTime!)) {
                earliestTime = currentTime;
                earliestSongId = songId;
              }
            });

            if (earliestSongId != null) {
              print("First added song ID for playlist $playlistName: $earliestSongId");
              print("First song timestamp: ${earliestTime?.toString()}");
              coverImage = await _fetchCoverPageUrl(earliestSongId!) ?? coverImage;
            }
          }

          print("Cover Image for playlist $playlistName: $coverImage");

          playlists.add({
            'playlist_id': playlistId,
            'playlistName': playlistName,
            'songCount': songCount.toString(),
            'coverImage': coverImage,
            'createdTimestamp': createdTimestamp,
          });
        }

        // Sort playlists by playlist_id in descending order
        playlists.sort((a, b) {
          final idA = int.parse(a['playlist_id'] ?? '0');
          final idB = int.parse(b['playlist_id'] ?? '0');
          return idB.compareTo(idA);
        });

        // Cache the results
        _playlistCache['playlists'] = playlists;
        _playlistCacheTimestamp = DateTime.now();

        // Only update the UI if we're actually showing playlists
        if (isLoadingPlaylists.value) {
          playlistsNotifier.value = playlists;
          isLoadingPlaylists.value = false;
        }
      } else {
        throw Exception('Failed to load playlists. Status Code: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching playlists: $e');
      playlistsNotifier.value = [];
    } finally {
      isLoadingPlaylists.value = false;
    }
  }

// Helper function to parse custom date-time format (e.g., "yyyyMMdd_HHmmss"


  Future<String?> _fetchCoverPageUrl(String songId) async {
    try {
      final response = await ApiService.getSongDetails(songId);

      if (ApiService.isSuccessResponse(response)) {
        final jsonResponse = ApiService.parseJsonResponse(response);

        // Access and return the coverPageUrl if it exists
        final coverPageUrl = jsonResponse?['coverPageUrl']?['S'];
        print("Cover page URL for song $songId: $coverPageUrl"); // Debug log

        return coverPageUrl ??
            'assets/out_of_mine.png'; // Return default if not present
      } else {
        print("Failed to fetch song details for $songId: ${ApiService.getErrorMessage(response)}");
      }
    } catch (e) {
      print("Error fetching song details for $songId: $e");
    }
    return 'assets/out_of_mine.png'; // Fallback to default image if error occurs
  }


// Helper function to parse custom date-time format (e.g., "yyyyMMdd_HHmmss")
  DateTime parseCustomDateTime(String dateTimeStr) {
    try {
      final year = int.parse(dateTimeStr.substring(0, 4));
      final month = int.parse(dateTimeStr.substring(4, 6));
      final day = int.parse(dateTimeStr.substring(6, 8));
      final hour = int.parse(dateTimeStr.substring(9, 11));
      final minute = int.parse(dateTimeStr.substring(11, 13));
      final second = int.parse(dateTimeStr.substring(13, 15));

      return DateTime(year, month, day, hour, minute, second);
    } catch (e) {
      print('Error parsing date: $e');
      return DateTime(1970); // Default fallback date
    }
  }


  Widget _buildShimmerPlaylistLoader() {
    return ListView.builder(
      itemCount: 5,
      itemBuilder: (context, index) {
        return Shimmer.fromColors(
          baseColor: Colors.grey[700]!,
          highlightColor: Colors.grey[500]!,
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: Colors.grey[600],
              radius: 25,
            ),
            title: Container(
              height: 10,
              color: Colors.grey[600],
              margin: EdgeInsets.only(bottom: 6),
            ),
            subtitle: Container(
              height: 10,
              color: Colors.grey[600],
              width: double.infinity,
            ),
          ),
        );
      },
    );
  }

  Future<void> _fetchSongsAndCache(String playlistId) async {
    if (!playlistSongCache.containsKey(playlistId)) {
      List<String> songs = await _fetchSongs(playlistId);
      playlistSongCache[playlistId] = songs;
    }
  }


  // Update your _addSongToPlaylist method to invalidate cache when a song is added
  Future<void> _addSongToPlaylist(String playlistId, String songId) async {
    // Step 2: Fetch and cache songs for the playlist if not already cached
    await _fetchSongsAndCache(playlistId);

    // Step 3: Check if the song already exists locally
    if (playlistSongCache[playlistId]!.contains(songId)) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Song already exists in the playlist')),
      );
      return; // Exit early without API call
    }

    // Step 4: Proceed with API call to add song
    final String timestamp = DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());
    final data = {
      'playlist_id': playlistId,
      'songIds': [songId],
      'updatedTimestamp': timestamp,
    };

    try {
      final response = await ApiService.addSongToPlaylist(data);

      if (ApiService.isSuccessResponse(response)) {
        _refreshPlaylistsInBackground;
        // Update the local cache
        playlistSongCache[playlistId]!.add(songId);
        // Invalidate playlist cache since counts have changed
        _refreshPlaylistsInBackground();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Song added to playlist')),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to add song to playlist: ${ApiService.getErrorMessage(response)}')),
        );
      }
    } catch (e) {
      print('Error adding song to playlist: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error adding song to playlist')),
      );
    }
  }

  Future<String?> getCurrentSongIdWithRetry({int maxRetries = 3}) async {
    for (int i = 0; i < maxRetries; i++) {
      try {
        final mediaItem = getCurrentMediaItem();
        if (mediaItem != null && mediaItem.id.isNotEmpty) {
          return mediaItem.id;
        }
        print("Retry $i: mediaItem is null or has empty ID, waiting...");
        await Future.delayed(Duration(milliseconds: 500 * (i + 1)));
      } catch (e) {
        print("Error in getCurrentSongIdWithRetry (attempt ${i + 1}): $e");
        await Future.delayed(Duration(milliseconds: 500 * (i + 1)));
      }
    }
    print("Failed to get valid mediaItem.id after $maxRetries retries");
    return null;
  }


  Future<void> _postHistory(String songId, String userId) async {
    final String timestamp = DateFormat('yyyyMMdd_HHmmss').format(
        DateTime.now());

    try {
      // Use the retry method to ensure we have a valid songId
      String? songId1 = await getCurrentSongIdWithRetry();
      if (songId1 == null) {
        print("Warning: songId is null, skipping history post");
        return;
      }

      print("Attempting to post history:");
      print("Song ID: ${songId1}");
      print("User ID: ${userId}");

      final response = await ApiService.saveHistory({
        'song_id': songId1,
        'user_id': userId,
        'updatedTimestamp': timestamp
      });

      if (ApiService.isSuccessResponse(response)) {
        print('Song posted to history');
        if (mounted) {
          setState(() {
            hasPostedHistory = true;
          });
        }
      } else {
        print('Failed to post song to history: ${ApiService.getErrorMessage(response)}');
      }
    } catch (e) {
      print('Error posting song to history: $e');
    }
  }

  Future<void> _createNewPlaylist(BuildContext modalContext, String userId, List<String> songIds) async {
    TextEditingController playlistController = TextEditingController();

    // Ensure dialog closes safely if widget is unmounted
    if (!mounted) return;

    // Display the dialog to enter playlist name
    showDialog(
      context: modalContext,
      builder: (BuildContext dialogContext) {
        return Dialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20.0),
          ),
          backgroundColor: Color(0xFF151415),
          child: Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Create New Playlist',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 15),
                TextField(
                  controller: playlistController,
                  decoration: InputDecoration(
                    floatingLabelBehavior: FloatingLabelBehavior.never,
                    labelText: 'Playlist Name',
                    labelStyle: TextStyle(fontSize: 16, color: Colors.white),
                    enabledBorder: UnderlineInputBorder(
                      borderSide: BorderSide(color: Colors.grey),
                    ),
                    focusedBorder: UnderlineInputBorder(
                      borderSide: BorderSide(color: Colors.white),
                    ),
                  ),
                  cursorColor: Colors.white,
                  style: TextStyle(decorationThickness: 0),
                ),
                SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    TextButton(
                      onPressed: () {
                        Navigator.of(dialogContext).pop();
                      },
                      child: Text(
                        'Cancel',
                        style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w500),
                      ),
                    ),
                    SizedBox(width: 50),
                    TextButton(
                      onPressed: () async {
                        Navigator.of(dialogContext).pop(); // Close the create playlist dialog

                        final playlistName = playlistController.text;
                        if (playlistName.isEmpty) {
                          ScaffoldMessenger.of(modalContext).showSnackBar(
                            SnackBar(content: Text('Playlist name cannot be empty')),
                          );
                          return;
                        }

                        final String timestamp = DateFormat('yyyyMMdd_HHmmss')
                            .format(DateTime.now());

                        final data = {
                          'playlistName': playlistName,
                          'songIds': songIds,
                          'user_id': userId,
                          'createdTimestamp': timestamp,
                          'updatedTimestamp': timestamp
                        };

                        try {
                          // Show loading indicator
                          isLoadingPlaylists.value = true;

                          final response = await ApiService.createNewPlaylist(data);

                          if (ApiService.isSuccessResponse(response)) {
                            // Clear cache so next fetch will get fresh data
                            _invalidatePlaylistCache();

                            // Fetch playlists immediately to update the data
                            await _fetchPlaylists(userId);

                            // Automatically open the playlist selection modal to show the new playlist
                            if (mounted) {
                              _showPlaylistModal(context);

                              // Wait 1 second then automatically close the playlist modal
                              await Future.delayed(Duration(seconds: 1));

                              // Close the playlist selection modal
                              if (mounted && Navigator.of(context).canPop()) {
                                Navigator.of(context).pop();
                              }

                              // Show success message after closing the modal
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text('Playlist created successfully'),
                                  duration: Duration(seconds: 2),
                                ),
                              );
                            }
                          } else {
                            ScaffoldMessenger.of(modalContext).showSnackBar(
                              SnackBar(content: Text('Failed to create playlist')),
                            );
                          }
                        } catch (error) {
                          ScaffoldMessenger.of(modalContext).showSnackBar(
                            SnackBar(content: Text('Error creating playlist: $error')),
                          );
                        } finally {
                          // Ensure loading indicator is turned off
                          isLoadingPlaylists.value = false;
                        }
                      },
                      child: Text(
                        'Create',
                        style: TextStyle(
                          color: Colors.white,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        elevation: 0,
                        backgroundColor: Color(0xFF151415),
                        textStyle: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
                        padding: EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(15),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
  void _showSongInfoModal(BuildContext context, MediaItem mediaItem) async {
    List<Map<String, String>> songCredits = [];
    isLoadingSongInfo.value = true;

    try {
      songCredits = await fetchSongCredits(mediaItem.id);
      print("Song credits fetched successfully: ${songCredits.length} items");
    } catch (e) {
      print("Error fetching song credits: $e");
      // Show error to user
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load song information: $e')),
        );
      }
    }

    isLoadingSongInfo.value = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (BuildContext context) {
        return Stack(
          children: [
            // Full-screen backdrop filter that applies blur
            Positioned.fill(
              child: GestureDetector(
                onTap: () => Navigator.of(context).pop(),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 5.0, sigmaY: 5.0),
                  child: Container(
                    color: Colors.black.withOpacity(0.1),
                  ),
                ),
              ),
            ),
            // The modal content
            DraggableScrollableSheet(
              initialChildSize: 0.6,
              maxChildSize: 0.7,
              minChildSize: 0.5,
              builder: (context, scrollController) {
                return Center(
                  child: FractionallySizedBox(
                    widthFactor: 0.9,
                    child: Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.6),
                            spreadRadius: 3,
                            blurRadius: 0.5,
                            offset: Offset(3, -3),
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.only(
                          topLeft: Radius.circular(20.0),
                          topRight: Radius.circular(20.0),
                        ),
                        child: Container(
                          color: Color(0xFF151415),
                          child: Padding(
                            padding: EdgeInsets.all(16.0),
                            child: ValueListenableBuilder<bool>(
                              valueListenable: isLoadingSongInfo,
                              builder: (context, isLoading, child) {
                                if (isLoading) {
                                  return _buildShimmerSongInfoLoader();
                                } else {
                                  return Column(
                                    children: [
                                      Center(
                                        child: Container(
                                          width: 40,
                                          height: 4,
                                          decoration: BoxDecoration(
                                            color: Colors.grey[400],
                                            borderRadius: BorderRadius.circular(2),
                                          ),
                                          margin: EdgeInsets.only(bottom: 20),
                                        ),
                                      ),
                                      Text(
                                        mediaItem.title,
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontSize: 20,
                                          fontWeight: FontWeight.bold,
                                        ),
                                        textAlign: TextAlign.center,
                                      ),
                                      SizedBox(height: 30),
                                      Expanded(
                                        child: songCredits.isEmpty
                                            ? Center(
                                                child: Column(
                                                  mainAxisAlignment: MainAxisAlignment.center,
                                                  children: [
                                                    Icon(
                                                      Icons.info_outline,
                                                      color: Colors.grey[400],
                                                      size: 48,
                                                    ),
                                                    SizedBox(height: 16),
                                                    Text(
                                                      'Song information not available',
                                                      style: TextStyle(
                                                        color: Colors.grey[400],
                                                        fontSize: 16,
                                                      ),
                                                      textAlign: TextAlign.center,
                                                    ),
                                                  ],
                                                ),
                                              )
                                            : ListView.builder(
                                                controller: scrollController,
                                                itemCount: songCredits.length,
                                                itemBuilder: (context, index) {
                                                  final credit = songCredits[index];
                                                  return _creditRow(
                                                    credit['name'] ?? 'Unknown',
                                                    credit['role'] ?? 'Unknown',
                                                    isLastItem: index == songCredits.length - 1,
                                                  );
                                                },
                                              ),
                                      ),
                                    ],
                                  );
                                }
                              },
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ],
        );
      },
    );
  }


// Shimmer loader function for song info
  Widget _buildShimmerSongInfoLoader() {
    return ListView.builder(
      itemCount: 4, // Number of shimmer rows for the credits
      itemBuilder: (context, index) {
        return Shimmer.fromColors(
          baseColor: Colors.grey[700]!,
          highlightColor: Colors.grey[500]!,
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  height: 20,
                  width: 150,
                  color: Colors.grey[600], // Simulate the name text
                ),
                SizedBox(width: 10),
                Container(
                  height: 20,
                  width: 120,
                  color: Colors.grey[600], // Simulate the role text
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _creditRow(String name, String role, {bool isLastItem = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 15.0, horizontal: 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.baseline,
        // Changed to baseline alignment
        textBaseline: TextBaseline.alphabetic,
        // Added text baseline
        children: [
          Container(
            width: 120,
            child: Text(
              role,
              style: TextStyle(
                color: Colors.white,
                fontFamily: 'Poppins',
                fontSize: 17,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),

          Flexible(
            child: Padding(
              padding: const EdgeInsets.only(left: 22.0),
              child: Text(
                name,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18.0,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Poppins',
                ),
                softWrap: true,
                maxLines: 4,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.start,
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatDuration(Duration? duration) {
    if (duration == null) return 'N/A';
    String twoDigits(int n) => n.toString().padLeft(2, '0');
    final minutes = twoDigits(duration.inMinutes.remainder(60));
    final seconds = twoDigits(duration.inSeconds.remainder(60));
    return '$minutes:$seconds';
  }


// Update your _showPlaylistModal method
  void _showPlaylistModal(BuildContext context) {
    // Just use the already fetched data
    if (_playlistCache.isEmpty) {
      // If cache is empty for some reason, start loading
      isLoadingPlaylists.value = true;
      _fetchPlaylists(ProfileManager().getUserId()!);
    } else {
      // Use cached data immediately
      isLoadingPlaylists.value = false;
      playlistsNotifier.value = List<Map<String, String>>.from(_playlistCache['playlists']);

      // Optionally refresh in background if cache is stale
      bool needsFreshData = DateTime.now().difference(_playlistCacheTimestamp).inMinutes >= _cacheExpirationMinutes;
      if (needsFreshData && !_isPlaylistLoading) {
        // Quietly refresh in background without showing loading indicators
        _prefetchPlaylists();
      }
    }

    String? selectedPlaylistId; // Store the selected playlist ID
    final bottomNavHeight = kBottomNavigationBarHeight + MediaQuery.of(context).padding.bottom;

    showModalBottomSheet(
      isDismissible: true,
      // Add this line
      enableDrag: true,
      context: context,
      barrierColor: Colors.black.withOpacity(0.1),
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (BuildContext context) {
        return Stack(
          children: [
            Positioned.fill(
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 2.0, sigmaY: 2.0),
                  child: Container(
                    color: Colors.white.withOpacity(
                        0.05), // Semi-transparent black overlay
                  ),
                )
            ),
            GestureDetector(
              // Add this GestureDetector
                behavior: HitTestBehavior.opaque,
                onTap: () => Navigator.of(context).pop(),
                child: GestureDetector(
                  // Nested GestureDetector to prevent modal from closing when tapping inside
                    onTap: () {},
                    child: StatefulBuilder(
                      builder: (BuildContext context,
                          StateSetter modalSetState) {
                        return Padding(
                          padding: EdgeInsets.only(bottom: bottomNavHeight),
                          child: DraggableScrollableSheet(
                            initialChildSize: 0.5,
                            maxChildSize: 0.75,
                            minChildSize: 0.5,
                            builder: (BuildContext context,
                                ScrollController scrollController) {
                              return Align(
                                alignment: Alignment.center,
                                // Center the modal on the screen
                                child: FractionallySizedBox(
                                  widthFactor: 0.92,
                                  // Adjust the width factor to leave space on both sides
                                  child: Transform.translate(
                                    offset: Offset(0, -4),
                                    child: Container(
                                      decoration: BoxDecoration(
                                          color: Color(0xFF151415),
                                          borderRadius: BorderRadius.only(
                                            topLeft: Radius.circular(20.0),
                                            topRight: Radius.circular(20.0),
                                          ),
                                          boxShadow: [
                                            // BoxShadow(
                                            //   color: Colors.black.withOpacity(
                                            //       1),
                                            //   spreadRadius: 1,
                                            //   blurRadius: 5,
                                            //   offset: Offset(0, -4),
                                            // ),
                                            BoxShadow(
                                              color: Colors.black.withOpacity(
                                                  0.7),
                                              spreadRadius: 3,
                                              blurRadius: 0.5,
                                              offset: Offset(3, -3),
                                            ),
                                          ]
                                      ),
                                      padding: const EdgeInsets.all(16.0),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment
                                            .start,
                                        children: [
                                          GestureDetector(
                                            behavior: HitTestBehavior.opaque,
                                            // Important! Makes entire area clickable
                                            onTap: () {
                                              Navigator.pop(context);
                                              _createNewPlaylist(context,
                                                  ProfileManager().getUserId()!,
                                                  [getCurrentSongId()!]);
                                            },
                                            child: Container(
                                              padding: EdgeInsets.symmetric(
                                                  vertical: 16.0),
                                              child: Row(
                                                children: [
                                                  SizedBox(width: 25.0),
                                                  Image.asset(
                                                    "assets/Add_Icon_Create_Playlist.png",
                                                    width: 40,
                                                    height: 40,
                                                  ),
                                                  SizedBox(width: 20),
                                                  Text(
                                                    'Create Playlist',
                                                    style: TextStyle(
                                                      color: Colors.white,
                                                      fontSize: 18,
                                                      fontWeight: FontWeight
                                                          .w500,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ),
                                          const SizedBox(height: 5),
                                          Expanded(
                                            child: ValueListenableBuilder<bool>(
                                              valueListenable: isLoadingPlaylists,
                                              builder: (context, isLoading,
                                                  child) {
                                                if (isLoading) {
                                                  return _buildShimmerPlaylistLoader(); // Show shimmer loader
                                                } else {
                                                  return ValueListenableBuilder<
                                                      List<
                                                          Map<String, String>>>(
                                                    valueListenable: playlistsNotifier,
                                                    builder: (context,
                                                        playlists, child) {
                                                      return playlists.isEmpty
                                                          ? Center(
                                                        child: Text(
                                                          'No playlists found. Create a new one!',
                                                          style: TextStyle(
                                                              color: Colors
                                                                  .grey,
                                                              fontSize: 16),
                                                        ),
                                                      )
                                                          : ListView.builder(
                                                        controller: scrollController,
                                                        itemCount: playlists
                                                            .length,
                                                        itemBuilder: (context,
                                                            index) {
                                                          final playlist = playlists[index];
                                                          final String playlistName = playlist['playlistName'] ??
                                                              'Unnamed Playlist';
                                                          final String playlistId = playlist['playlist_id'] ??
                                                              '';
                                                          final String songCount = playlist['songCount'] ??
                                                              '';
                                                          final String coverImage = playlist['coverImage'] ??
                                                              'assets/kill.png';

                                                          return Container(
                                                            margin: EdgeInsets
                                                                .symmetric(
                                                                vertical: 8),
                                                            child: ListTile(
                                                              leading: SizedBox(
                                                                width: 90,
                                                                height: 90,
                                                                // Ensure enough height
                                                                child: Stack(
                                                                  clipBehavior: Clip
                                                                      .none,
                                                                  alignment: Alignment
                                                                      .center,
                                                                  children: [
                                                                    // Folder image with reduced opacity
                                                                    Opacity(
                                                                      opacity: 0.45,
                                                                      child: Image
                                                                          .asset(
                                                                        'assets/folder13.png',
                                                                        height: 280,
                                                                        width: 90,
                                                                        fit: BoxFit
                                                                            .cover,
                                                                      ),
                                                                    ),
                                                                    // Playlist image overlaid inside the folder
                                                                    Positioned(
                                                                      top: -15,
                                                                      left: 10.5,
                                                                      // Left 16 can be the width 100 of the folder13
                                                                      child: ClipRRect(
                                                                        borderRadius: BorderRadius
                                                                            .circular(
                                                                            8),
                                                                        child: Opacity(
                                                                          opacity: 0.7,
                                                                          child: Image
                                                                              .network(
                                                                            coverImage,
                                                                            height: 62,
                                                                            width: 70,
                                                                            fit: BoxFit
                                                                                .cover,
                                                                            errorBuilder: (
                                                                                BuildContext context,
                                                                                Object exception,
                                                                                StackTrace? stackTrace) {
                                                                              return Container();
                                                                            },
                                                                          ),
                                                                        ),
                                                                      ),
                                                                    ),
                                                                  ],
                                                                ),
                                                              ),
                                                              title: Text(
                                                                playlistName,
                                                                style: TextStyle(
                                                                  fontSize: 18,
                                                                  color: Colors
                                                                      .white,
                                                                  fontWeight: FontWeight
                                                                      .w500,
                                                                ),
                                                              ),
                                                              subtitle: Text(
                                                                '$songCount Songs',
                                                                style: TextStyle(
                                                                    color: Colors
                                                                        .grey[400]),
                                                              ),
                                                              trailing: Container(
                                                                width: 24,
                                                                height: 24,
                                                                decoration: BoxDecoration(
                                                                  shape: BoxShape
                                                                      .circle,
                                                                  border: Border
                                                                      .all(
                                                                    color: selectedPlaylistId ==
                                                                        playlistId
                                                                        ? Color(
                                                                        0xFF2364C6)
                                                                        : Colors
                                                                        .grey[400]!,
                                                                    width: 2,
                                                                  ),
                                                                  color: selectedPlaylistId ==
                                                                      playlistId
                                                                      ? Color(
                                                                      0xFF2364C6)
                                                                      : Colors
                                                                      .transparent,
                                                                ),
                                                                child: selectedPlaylistId ==
                                                                    playlistId
                                                                    ? Icon(
                                                                  Icons.check,
                                                                  size: 16,
                                                                  color: Colors
                                                                      .white,
                                                                )
                                                                    : null,
                                                              ),
                                                              onTap: () {
                                                                modalSetState(() {
                                                                  selectedPlaylistId =
                                                                      playlistId;
                                                                });
                                                                if (selectedPlaylistId !=
                                                                    null) {
                                                                  Future
                                                                      .delayed(
                                                                      Duration(
                                                                          milliseconds: 300), () {
                                                                    _addSongToPlaylist(
                                                                        selectedPlaylistId!,
                                                                        getCurrentSongId()!);
                                                                    Navigator
                                                                        .pop(
                                                                        context);
                                                                  });
                                                                }
                                                              },
                                                            ),
                                                          );
                                                        },
                                                      );
                                                    },
                                                  );
                                                }
                                              },
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                        );
                      },
                    ))
            )
          ],
        );
      },
    );
  }

  void _invalidatePlaylistCache() {
    _playlistCache.clear();
    _playlistCacheTimestamp = DateTime.now().subtract(Duration(days: 1)); // Force expiration
  }

  void _sendEmail() async {
    final MediaItem? currentMediaItem = getCurrentMediaItem();

    // Fetch the song title or fallback to 'Unknown Song' if no media item is available
    String songTitle = currentMediaItem?.title ?? 'Unknown Song';

    // Use the song title directly without encoding spaces
    String formattedSongTitle = songTitle;

    // Construct the URI manually to avoid any automatic encoding of spaces
    final String emailUrl = 'mailto:info@voiz.co.in?subject=Reporting#$formattedSongTitle';

    if (await canLaunchUrl(Uri.parse(emailUrl))) {
      await launchUrl(Uri.parse(emailUrl));
    } else {
      print('Could not launch $emailUrl');
      throw 'Could not launch $emailUrl';
    }
  }


  void _showReportDialog(BuildContext context) {
    showDialog(
      context: context,
      barrierColor: Colors.white.withOpacity(0),
      builder: (BuildContext context) {
        return Stack(
          children: [
            // Body-specific blur
            BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 5.0, sigmaY: 5.0),
              // Blur intensity
              child: Container(
                color: Colors.transparent, // Keeps AppBar unaffected
              ),
            ),
            Center(
              child: Dialog(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(28.0), // Rounded corners
                ),
                backgroundColor: Color(0xFF151415),
                // Dark background for the dialog
                child: Container(
                  height: 230,
                  width: 150,
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    // Inner padding for content
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Align(
                          alignment: Alignment.topRight,
                          child: GestureDetector(
                            onTap: () {
                              Navigator.of(context).pop(); // Close the dialog
                            },
                            child: Container(
                              width: 25,
                              height: 25,
                              decoration: BoxDecoration(
                                color: Color(0xFF100F32),
                                // Match dialog background color
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.white,
                                    width: 2), // White circular border
                              ),
                              child: Center(
                                child: Icon(Icons.close, color: Colors.white,
                                    size: 18), // White close icon
                              ),
                            ),
                          ),
                        ),
                        SizedBox(height: 10),
                        Text(
                          'Report a Song',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ), // White bold text for the title
                        ),
                        SizedBox(height: 25),
                        Text(
                          'Please write an email to',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                          ), // White text for the description
                        ),
                        SizedBox(height: 20),
                        GestureDetector(
                          onTap: () {
                            Navigator.of(context).pop(); // Close the dialog
                            _sendEmail(); // Open email client
                          },
                          child: Text(
                            'info@voiz.co.in',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: Colors.blue,
                              fontSize: 14,
                              decoration: TextDecoration.underline,
                              decorationColor: Colors.blue,
                              fontStyle: FontStyle.italic,
                            ), // Blue underlined email text
                          ),
                        ),
                        SizedBox(height: 20),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }


  Widget _buildShimmerEffect() {
    return GradientScaffold(
      //backgroundColor: Colors.black,
      body: Shimmer.fromColors(
        baseColor: Colors.grey[700]!,
        highlightColor: Colors.grey[500]!,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Center(
              child: Container(
                height: 250,
                width: 250,
                color: Colors.grey[600], // Placeholder for album art
              ),
            ),
            SizedBox(height: 20),
            Container(
              width: 200,
              height: 20,
              color: Colors.grey[600], // Placeholder for song title
            ),
            SizedBox(height: 10),
            Container(
              width: 100,
              height: 15,
              color: Colors.grey[600], // Placeholder for artist name
            ),
            SizedBox(height: 40),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.skip_previous, color: Colors.grey[600], size: 48),
                SizedBox(width: 20),
                Icon(Icons.play_arrow, color: Colors.grey[600], size: 48),
                SizedBox(width: 20),
                Icon(Icons.skip_next, color: Colors.grey[600], size: 48),
              ],
            ),
          ],
        ),
      ),
    );
  }


  void navigate(String username, String email) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) =>
          QueuePage(
            userfullname: username,
            userId: email,
            category: widget.userCategory,
            navigationIndex: widget.navigationIndex,)),
    );
  }


  Stream<PositionData> get _positionDataStream =>
      Rx.combineLatest2<Duration, Duration?, PositionData>(
        _player.positionStream,
        _player.durationStream,
            (position, duration) =>
            PositionData(position, duration ?? Duration.zero),
      );

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvoked: (didPop) async {
        if (didPop) return;

        try {
          // Custom back navigation logic
          // First, check if we're currently in full-screen music player
          Navigator.of(context).pop();

          // Optional: If you want to ensure navigation back to the home/previous page
          // Uncomment and customize if needed
          // Navigator.of(context).pushReplacement(
          //   MaterialPageRoute(
          //     builder: (context) => NewHomePage(
          //       email: widget.email,
          //       category: widget.userCategory,
          //       userfullname: widget.userfullname,
          //     ),
          //   ),
          // );
        } catch (e) {
          print('Error during back navigation: $e');
          // Fallback navigation if something goes wrong
          Navigator.of(context).popUntil((route) => route.isFirst);
        }
      },
      child: Stack(
        children: [
          StreamBuilder<SequenceState?>(
            stream: _player.sequenceStateStream,
            builder: (context, snapshot) {
              final sequenceState = snapshot.data;
              final mediaItem = sequenceState?.currentSource?.tag as MediaItem?;

              // Handle null mediaItem case
              if (mediaItem == null) {
                return Center(
                  child: CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.teal),
                  ),
                );
              }

              final String imagePath = mediaItem.artUri?.toString() ?? 'assets/default_image.jpg';
              final String artist = mediaItem.artist ?? 'Unknown Artist';
              String songId = mediaItem.id;

              if (songId.isEmpty) {
                print('Warning: Empty song ID encountered');
                songId = 'unknown';
              }

              String title = mediaItem?.title ?? 'Loading';

              Widget content = GradientScaffold(
                appBar: AppBar(
                  leading: IconButton(
                    padding: EdgeInsets.zero,
                    icon: Icon(Icons.arrow_back_ios, color: Colors.white),
                    onPressed: () {
                      Navigator.of(context).pop(); // Navigate back when pressed
                    },
                  ),
                  automaticallyImplyLeading: false,
                  titleSpacing: 0,
                  title: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Text(widget.sourceName ?? mediaItem.extras?['source']),
                      Text(widget.sourceName ?? mediaItem.extras?['source'] ??
                          'Unknown Source'),
                    ],
                  ),
                  actions: [
                    SizedBox(width: 10),
                    GestureDetector(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) =>
                                ProfileSettingsPage(
                                  userfullname: widget.userfullname,
                                  userId: widget.email,
                                  userCategory: widget.userCategory,
                                ),
                          ),
                        );
                      },
                      child: Container(
                        width: 40, // Outer container size
                        height: 40,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: Colors.white, // Border color
                            width: 2, // Border width
                          ),
                        ),
                        child: CircleAvatar(
                          radius: 20,
                          backgroundColor: Colors.grey,
                          child: ProfileManager().profileImageUrl != null
                              ? ClipOval(
                            child: Image.network(
                              ProfileManager().profileImageUrl!,
                              fit: BoxFit.cover,
                              width: 100,
                              height: 100,
                              errorBuilder: (context, error, stackTrace) {
                                return Text(
                                  getInitials(ProfileManager().username.value),
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 20,
                                  ),
                                );
                              },
                            ),
                          )
                              : Text(
                            getInitials(ProfileManager().username.value),
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 20,
                            ),
                          ),
                        ),
                      ),
                    ),
                    SizedBox(width: 10),
                  ],
                  backgroundColor: Colors.transparent,
                ),
                body: SingleChildScrollView(
                  controller: ScrollController(),
                  child: SafeArea(
                    child: Container(
                      child: Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            //SizedBox(height: MediaQuery.of(context).size.height * 0.02),
                            // Banner Ad below album art
                            Container(
                              margin: EdgeInsets.only(bottom: 0.02),
                              child: MusicPlayerBannerAd(adUnitId: 'ca-app-pub-1147112055796547/5221124787'),
                            ),
                            Transform.translate(
                              offset: Offset(0, 35),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.end,

                                children: [
                                  Theme(
                                    data: Theme.of(context).copyWith(
                                      // Remove splash effects
                                      splashColor: Colors.transparent,
                                      highlightColor: Colors.transparent,
                                      // Remove hover color
                                      hoverColor: Colors.transparent,
                                      // Also remove the overlay
                                      splashFactory: NoSplash.splashFactory,
                                    ),
                                    child: PopupMenuButton<String>(
                                      padding: EdgeInsets.zero,
                                      icon: Icon(
                                          Icons.more_vert, color: Colors.white),
                                      // 3-dots icon
                                      color: Color(0xFF151415),
                                      // Dark background color for the popup
                                      shape: RoundedRectangleBorder( // Rounded corners for popup
                                        borderRadius: BorderRadius.circular(30),
                                      ),
                                      offset: Offset(0, 2),
                                      // to make the menu up and down

                                      constraints: BoxConstraints(
                                        minWidth: 230,
                                        // Increase this value to make menu wider
                                        maxWidth: 250, // Maximum width constraint
                                      ),
                                      onSelected: (String value) {
                                        switch (value) {
                                          case 'Add to Playlist':
                                            _showPlaylistModal(
                                                context); // Add to Playlist logic
                                            break;
                                          case 'Go to Album':
                                            _goToAlbumPage(context);
                                            break;
                                          case 'Comment':
                                            _showCommentsSection(
                                                context); // Comment logic
                                            break;
                                          case 'Add to Queue':
                                            navigate(widget.userfullname,
                                                ProfileManager().getUserId()!);
                                            break;
                                          case 'Share':
                                          //_shareSong(currentSongId); // Share logic
                                            final mediaItem = getCurrentMediaItem();
                                            if (mediaItem != null) {
                                              _shareSong(
                                                  mediaItem); // Call share function here
                                            } else {
                                              print("No media item to share");
                                            }
                                            break;
                                          case 'Song Info':
                                            final mediaItem = getCurrentMediaItem();
                                            if (mediaItem != null) {
                                              _showSongInfoModal(
                                                  context, mediaItem);
                                            }
                                            break;
                                          case 'Report':
                                            _showReportDialog(
                                                context); // Pass the song title to the report method
                                            break;
                                        }
                                      },
                                      itemBuilder: (BuildContext context) {
                                        return [
                                          PopupMenuItem<String>(
                                            value: 'Add to Playlist',
                                            child: Padding(
                                              padding: const EdgeInsets.only(
                                                  left: 28.0),
                                              child: Row(
                                                children: [
                                                  Image.asset(
                                                      "assets/menu_play_list_folder.png",
                                                      height: 25, width: 25),
                                                  SizedBox(width: 8),
                                                  Padding(
                                                    padding: const EdgeInsets
                                                        .only(
                                                        left: 5),
                                                    child: Text(
                                                        'Add to Playlist',
                                                        style: TextStyle(
                                                            color: Colors.white,
                                                            fontWeight: FontWeight
                                                                .bold)),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ),
                                          PopupMenuItem<String>(
                                            value: 'Comment',
                                            child: Padding(
                                              padding: const EdgeInsets.only(
                                                  left: 28.0),
                                              child: Row(
                                                children: [
                                                  Image.asset(
                                                      "assets/menu_comment_new_new.png",
                                                      height: 25, width: 25),
                                                  SizedBox(width: 8),
                                                  Padding(
                                                    padding: const EdgeInsets
                                                        .only(
                                                        left: 5),
                                                    child: Text('Comment',
                                                        style: TextStyle(
                                                            color: Colors.white,
                                                            fontWeight: FontWeight
                                                                .bold)),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ),
                                          PopupMenuItem<String>(
                                            value: 'Go to Album',
                                            child: Padding(
                                              padding: const EdgeInsets.only(left: 28.0),
                                              child: Row(
                                                children: [
                                                  Icon(Icons.album),
                                                  SizedBox(width: 8),
                                                  Padding(
                                                    padding: const EdgeInsets.only(left: 5),
                                                    child: Text(
                                                      'Go to Album',
                                                      style: TextStyle(
                                                        color: Colors.white,
                                                        fontWeight: FontWeight.bold,
                                                      ),
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ),
                                          PopupMenuItem<String>(
                                            value: 'Add to Queue',
                                            child: Padding(
                                              padding: const EdgeInsets.only(
                                                  left: 28.0),
                                              child: Row(
                                                children: [
                                                  Image.asset(
                                                      "assets/menu_thread.png",
                                                      height: 30,
                                                      width: 30),
                                                  SizedBox(width: 8),
                                                  Text('Thread',
                                                      style: TextStyle(
                                                          color: Colors.white,
                                                          fontWeight: FontWeight
                                                              .bold)),
                                                ],
                                              ),
                                            ),
                                          ),
                                          PopupMenuItem<String>(
                                            value: 'Share',
                                            child: Padding(
                                              padding: const EdgeInsets.only(
                                                  left: 28.0),
                                              child: Row(
                                                children: [
                                                  Image.asset(
                                                      "assets/menu_share.png",
                                                      height: 25, width: 25),
                                                  SizedBox(width: 8),
                                                  Padding(
                                                    padding: const EdgeInsets
                                                        .only(
                                                        left: 8),
                                                    child: Text('Share',
                                                        style: TextStyle(
                                                            color: Colors.white,
                                                            fontWeight: FontWeight
                                                                .bold)),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ),
                                          PopupMenuItem<String>(
                                            value: 'Song Info',
                                            child: Padding(
                                              padding: const EdgeInsets.only(
                                                  left: 28.0),
                                              child: Row(
                                                children: [
                                                  Image.asset(
                                                      "assets/menu_song_info.png",
                                                      height: 35, width: 35),
                                                  SizedBox(width: 8),
                                                  Text('Song Info',
                                                      style: TextStyle(
                                                          color: Colors.white,
                                                          fontWeight: FontWeight
                                                              .bold)),
                                                ],
                                              ),
                                            ),
                                          ),
                                          PopupMenuItem<String>(
                                            value: 'Report',
                                            child: Padding(
                                              padding: const EdgeInsets.only(
                                                  left: 28.0),
                                              child: Row(
                                                children: [
                                                  Image.asset(
                                                      "assets/menu_report.png",
                                                      height: 35,
                                                      width: 35),
                                                  SizedBox(width: 8),
                                                  Text('Report',
                                                      style: TextStyle(
                                                          color: Colors.white,
                                                          fontWeight: FontWeight
                                                              .bold)),
                                                ],
                                              ),
                                            ),
                                          ),
                                        ];
                                      },
                                    ),
                                  ),
                                ],
                              ),
                            ),

                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Padding(
                                  padding: const EdgeInsets.only(right: 5),
                                  child: Center(
                                    child: Stack(
                                      alignment: Alignment.topRight,
                                      children: [
                                        // Image with rounded corners
                                        ClipRRect(
                                          borderRadius: BorderRadius.circular(
                                              0.0), // it's 16
                                          child: Container(
                                            width: MediaQuery
                                                .of(context)
                                                .size
                                                .width * 0.85,
                                            // Increased from 0.8 to 0.85
                                            height: MediaQuery
                                                .of(context)
                                                .size
                                                .height * 0.45,
                                            // Increased from 0.4 to 0.45
                                            constraints: BoxConstraints(
                                              maxWidth: 350,
                                              // Increased from 300 to 350
                                              maxHeight: 350,
                                              // Increased from 300 to 350
                                              minWidth: 250,
                                              // Increased from 200 to 250
                                              minHeight: 250, // Increased from 200 to 250
                                            ),
                                            child: Image.network(
                                              imagePath,
                                              fit: BoxFit.cover,
                                              errorBuilder: (
                                                  BuildContext context,
                                                  Object exception,
                                                  StackTrace? stackTrace) {
                                                return Image.asset(
                                                  'assets/default_image.jpg',
                                                  fit: BoxFit.cover,
                                                );
                                              },
                                            ),
                                          ),
                                        ),

                                        // Share button with responsive positioning
                                        Positioned(
                                          top: 8,

                                          right: MediaQuery
                                              .of(context)
                                              .size
                                              .width * 0.001,
                                          // Adjust position based on screen width
                                          child: IconButton(
                                            icon: Image.asset(
                                              "assets/Share.png",
                                              // Make sure you have this image in your assets folder
                                              width: 50,
                                              height: 50,
                                              color: Colors
                                                  .white, // Optional: adds a white tint to the image
                                            ),
                                            onPressed: () {
                                              final mediaItem = getCurrentMediaItem();
                                              if (mediaItem != null) {
                                                _shareSong(mediaItem);
                                              } else {
                                                print("No media item to share");
                                              }
                                            },
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            Padding(
                              padding: const EdgeInsets.fromLTRB(0, 20, 30, 0),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.start,
                                children: [
                                  Flexible(
                                    child: mediaItem.title.length >
                                        20 // Threshold for long titles
                                        ? SizedBox(
                                      height: 26.5,
                                      // Control the height of the marquee
                                      child: Marquee(
                                        text: mediaItem.title,
                                        style: const TextStyle(
                                          fontSize: 20,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.white,
                                        ),
                                        scrollAxis: Axis.horizontal,
                                        blankSpace: 50.0,
                                        velocity: 30.0,
                                        pauseAfterRound: const Duration(
                                            seconds: 1),
                                        startPadding: 25.0,
                                        accelerationDuration: const Duration(
                                            seconds: 1),
                                        accelerationCurve: Curves.easeIn,
                                        decelerationDuration: const Duration(
                                            milliseconds: 500),
                                        decelerationCurve: Curves.easeOut,
                                      ),
                                    )
                                        : Padding(
                                      padding: const EdgeInsets.only(
                                          left: 25.0),
                                      child: Text(
                                        mediaItem.title,
                                        style: const TextStyle(
                                          fontSize: 20,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.white,),
                                        overflow: TextOverflow.ellipsis,
                                        // Fallback for shorter text
                                        softWrap: true,
                                        maxLines: 2,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),


                            //SizedBox(height: 60),
                            SizedBox(height: MediaQuery
                                .of(context)
                                .size
                                .height * 0.00),

                            Padding(
                              padding: const EdgeInsets.fromLTRB(0, 0, 30, 0),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.start,
                                children: [
                                  SizedBox(
                                    width: 180,
                                    // Fixed width for artist name container
                                    child: artist.length > 17
                                        ? SizedBox(
                                      height: 20,
                                      child: Marquee(
                                        text: artist,
                                        style: TextStyle(
                                          fontSize: 16,
                                          color: Colors.white70,
                                        ),
                                        scrollAxis: Axis.horizontal,
                                        blankSpace: 50.0,
                                        velocity: 30.0,
                                        pauseAfterRound: const Duration(
                                            seconds: 1),
                                        startPadding: 25.0,
                                        accelerationDuration: const Duration(
                                            seconds: 1),
                                        accelerationCurve: Curves.linear,
                                        decelerationDuration: const Duration(
                                            milliseconds: 500),
                                        decelerationCurve: Curves.easeOut,
                                      ),
                                    )
                                        : Padding(
                                      padding: const EdgeInsets.only(
                                          bottom: 25.0, left: 25),
                                      child: Text(
                                        artist,
                                        style: TextStyle(
                                          fontSize: 16,
                                          color: Colors.white70,
                                        ),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ),
                                  Spacer(),
                                  GestureDetector(
                                    onTap: songId != null
                                        ? () => _toggleCelebration(songId,
                                        !_statusManager.isCelebration)
                                        : null,
                                    child: _statusManager.isCelebration
                                        ? Image.asset(
                                      'assets/reaction_filled.png',
                                      // Use your filled version
                                      width: 40,
                                      height: 40,
                                      color: Colors.white,
                                      // Apply white color directly
                                      colorBlendMode: BlendMode.srcIn,
                                    )
                                        : Image.asset(
                                      'assets/reaction_empty.png',
                                      width: 40,
                                      height: 40,
                                    ),
                                  ),
                                  // GestureDetector(
                                  //   onTap: songId != null
                                  //       ? () => _toggleCelebration(songId, !_statusManager.isCelebration)
                                  //       : null,
                                  //   child: Image.asset(
                                  //     _statusManager.isCelebration
                                  //         ? 'assets/reaction_filled.png'
                                  //         : 'assets/reaction_empty.png',
                                  //     width: 40,
                                  //     height: 40,
                                  //   ),
                                  // ),
                                  SizedBox(width: 10),
                                  GestureDetector(
                                    onTap: songId != null
                                        ? () => _toggleFavorite(songId,
                                        !_statusManager.isFavoriteNotifier
                                            .value)
                                        : null,
                                    child: Image.asset(
                                      _statusManager.isFavoriteNotifier.value
                                          ? 'assets/final_smile_fill_new_new.png'
                                          : 'assets/final_smile_empty_new_new.png',
                                      width: 30,
                                      height: 30,
                                    ),
                                  ),
                                  SizedBox(width: 10),
                                  IconButton(
                                    icon: Image.asset(
                                      "assets/NewCommentLogo.png",
                                      height: 28,
                                      width: 28,
                                    ),
                                    onPressed: () =>
                                        _showCommentsSection(context),
                                  ),
                                ],
                              ),
                            ),
                            Padding(
                                padding: const EdgeInsets.fromLTRB(
                                    25, 5, 30, 0),
                                child: StreamBuilder<PositionData>(
                                  stream: _positionDataStream,
                                  builder: (context, snapshot) {
                                    final positionData = snapshot.data;
                                    return ProgressBar(
                                      barHeight: 5,
                                      baseBarColor: Colors.grey[600],
                                      // Removed buffered bar color
                                      progressBarColor: Colors.white,
                                      thumbColor: Colors.white,
                                      timeLabelTextStyle: const TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w600,
                                      ),
                                      progress: positionData?.position ??
                                          Duration.zero,
                                      // Removed buffered position
                                      total: positionData?.duration ??
                                          Duration.zero,
                                      onSeek: _player.seek,
                                    );
                                  },
                                )
                            ),
                            SizedBox(height: MediaQuery
                                .of(context)
                                .size
                                .height * 0.02),
                            ControlButtons(
                              _player,
                              onNext: _playNextSong,
                              onPrevious: _playPreviousSong,
                              showPlaylistModal: () =>
                                  _showPlaylistModal(context),
                              queuemodal: () {
                                //_showQueueModal(context); // Pass the method here
                              },
                              email: ProfileManager().getUserId()!,
                              // Pass email
                              userfullname: widget.userfullname,
                              userCategory: widget.userCategory,
                              navigationIndex: widget.navigationIndex,


                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              );
              return Stack(
                children: [
                  PageWithBottomNav(
                    child: content,
                    email: widget.email,
                    fullName: widget.userfullname,
                    category: widget.userCategory,
                    currentIndex: widget.navigationIndex ?? 0,
                    isFromNewHomePage: false,
                    // Add this onNavigate callback
                    onNavigate: (int index) {
                      if (index == 0) {
                        // Navigate to Home page
                        Navigator.of(context).pushReplacement(
                          MaterialPageRoute(
                            builder: (context) => NewHomePage(
                              email: widget.email,
                              category: widget.userCategory,
                              userfullname: widget.userfullname,
                            ),
                          ),
                        );
                      } else if (index == 1) {
                        // Navigate to Search page
                        Navigator.of(context).pushReplacement(
                          MaterialPageRoute(
                            builder: (context) => SearchPage(
                              email: widget.email,
                              userCategory: widget.userCategory,
                              userfullname: widget.userfullname,
                            ),
                          ),
                        );
                      } else if (index == 2 && widget.userCategory == 'Singer') {
                        // For singers, navigate to Upload page
                        Navigator.of(context).pushReplacement(
                          MaterialPageRoute(
                            builder: (context) => UploadSelectionPage(
                              email: widget.email,
                              fullName: widget.userfullname,
                            ),
                          ),
                        );
                      } else {
                        // Navigate to Profile/Library page
                        Navigator.of(context).pushReplacement(
                          MaterialPageRoute(
                            builder: (context) => ProfilePage(
                              userCategory: widget.userCategory,
                              email: widget.email,
                              userfullname: widget.userfullname,
                            ),
                          ),
                        );
                      }
                    },
                  ),
                  // PageWithBottomNav(
                  //   child: content,
                  //   email: widget.email,
                  //   fullName: widget.userfullname,
                  //   category: widget.userCategory,
                  //   currentIndex: widget.navigationIndex ?? 0,
                  //   isFromNewHomePage: false,
                  // ),
                  LoadingScreen(
                    isLoading: _isLoading,
                    isNoInternet: _isNoInternet,
                    onRetry: _checkConnectivity,
                  ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}

class PositionData {
  final Duration position;
  // Removed bufferedPosition
  final Duration duration;

  PositionData(this.position, this.duration);
}

class ControlButtons extends StatefulWidget  {
  final AudioPlayer player;
  final VoidCallback onNext;
  final VoidCallback onPrevious;
  final VoidCallback showPlaylistModal;
  final VoidCallback queuemodal;
  final String email;  // Add email field
  final String userfullname;
  final String userCategory;
  final int? navigationIndex;


  const ControlButtons(this.player,

      {required this.onNext,
        required this.onPrevious,
        required this.showPlaylistModal,
        required this.queuemodal,
        required this.email,  // Initialize email
        required this.userfullname,
        required this.userCategory,
        this.navigationIndex,

        Key? key})
      : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 10),
          child: IconButton(
            icon: Image.asset("assets/playlist (2).png",height: 30,width: 30,), // Replace with your desired icon
            iconSize: 0,
            onPressed: () {
              // Add desired functionality for this button
              showPlaylistModal();
            },
            splashColor: Colors.greenAccent,
            highlightColor: Colors.blue.withOpacity(0.2),
          ),
        ),
        Spacer(),
        IconButton(
          icon: const Icon(Icons.skip_previous, color: Color(0xFF93C6FE)),
          iconSize: 48.0,
          onPressed: onPrevious, // Play previous song
        ),
        Spacer(),
        StreamBuilder<PlayerState>(
          stream: player.playerStateStream,
          builder: (context, snapshot) {
            // Get the current player state
            final playerState = snapshot.data;
            // Get playing status, default to false if null
            final playing = playerState?.playing ?? false;

            return Container(
              width: 70,
              height: 70,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF93C6FE),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: IconButton(
                icon: Icon(
                  playing ? Icons.pause : Icons.play_arrow,
                  color: Colors.white,
                  size: 50.0,
                ),
                onPressed: () {
                  if (playing) {
                    player.pause();
                  } else {
                    player.play();
                  }
                },
              ),
            );
          },
        ),
        Spacer(),
        IconButton(
          icon: const Icon(Icons.skip_next, color: Color(0xFF93C6FE)),
          iconSize: 48.0,
          onPressed: onNext, // Play next song
        ),
        Spacer(),
        Padding(
          padding: const EdgeInsets.only(right: 10),
          child: IconButton(
            icon: Image.asset("assets/Queue.png",height: 40,width: 40,), // Replace with your desired icon
            iconSize: 36.0,
            onPressed: () {
              // Navigate to the QueuePage when the queue icon is pressed
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => QueuePage(
                  userfullname: userfullname, userId: email, category: userCategory,navigationIndex: navigationIndex,)),
              );
            },
          ),
        ),
      ],
    );
  }
  @override
  State<ControlButtons> createState() => _ControlButtonsState();
}

class _ControlButtonsState extends State<ControlButtons> {
  StreamSubscription<ProcessingState>? _processingStateSubscription;

  @override
  void initState() {
    super.initState();
    _setupProcessingStateListener();
    _loadLoopState(); // Add this line
  }

  // Add this new method after initState
  Future<void> _loadLoopState() async {
    await loopNotifier.loadLoopState();
    if (mounted) {
      widget.player.setLoopMode(loopNotifier.value ? LoopMode.one : LoopMode.off);
    }
  }

  void _setupProcessingStateListener() {
    _processingStateSubscription = widget.player.processingStateStream.listen((state) {
      if (state == ProcessingState.completed && loopNotifier.value && mounted) {
        widget.player.seek(Duration.zero);
        widget.player.play();
      }
    });
  }

  void _toggleRepeat() async {
    loopNotifier.value = !loopNotifier.value;
    await loopNotifier.saveLoopState();
    widget.player.setLoopMode(loopNotifier.value ? LoopMode.one : LoopMode.off);
  }

  @override
  void dispose() {
    _processingStateSubscription?.cancel();
    super.dispose();
  }


  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 10),
          child: IconButton(
            icon: Image.asset("assets/create_paly_list.png", height: 30, width: 30,),
            iconSize: 0,
            onPressed: widget.showPlaylistModal,
            splashColor: Colors.greenAccent,
            highlightColor: Colors.blue.withOpacity(0.2),
          ),
        ),
        Spacer(),
        IconButton(
          icon: const Icon(Icons.skip_previous, color: Color(0xFF2644D9)),
          iconSize: 48.0,
          onPressed: widget.onPrevious,
        ),
        Spacer(),
        StreamBuilder<PlayerState>(
          stream: widget.player.playerStateStream,
          builder: (context, snapshot) {
            final playerState = snapshot.data;
            final playing = playerState?.playing ?? false;

            return Container(
              width: 70,
              height: 70,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFF2644D9),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: IconButton(
                icon: Icon(
                  playing ? Icons.pause : Icons.play_arrow,
                  color: Colors.white,
                  size: 50.0,
                ),
                onPressed: () {
                  if (playing) {
                    widget.player.pause();
                  } else {
                    widget.player.play();
                  }
                },
              ),
            );
          },
        ),
        Spacer(),
        IconButton(
          icon: const Icon(Icons.skip_next, color: Color(0xFF2644D9)),
          //0xFF93C6FE
          iconSize: 48.0,
          onPressed: widget.onNext,
        ),
        Spacer(),
        ValueListenableBuilder<bool>(
          valueListenable: loopNotifier,
          builder: (context, isLooping, child) {
            return Padding(
              padding: const EdgeInsets.only(right: 10),
              child: IconButton(
                icon: Image.asset(
                  "assets/thread_icon.png",
                  height: 40,
                  width: 40,
                  color: isLooping ? Colors.green : null,
                ),
                iconSize: 36.0,
                onPressed: _toggleRepeat,
              ),
            );
          },
        ),
      ],
    );
  }
}

// Custom Banner Ad Widget for Music Player to avoid import conflicts
class MusicPlayerBannerAd extends StatefulWidget {
  final String adUnitId;

  const MusicPlayerBannerAd({
    Key? key,
    required this.adUnitId,
  }) : super(key: key);

  @override
  _MusicPlayerBannerAdState createState() => _MusicPlayerBannerAdState();
}

class _MusicPlayerBannerAdState extends State<MusicPlayerBannerAd> {
  BannerAd? _bannerAd;
  bool _isAdLoaded = false;

  @override
  void initState() {
    super.initState();
    // Add a small delay before loading ads
    Future.delayed(Duration(milliseconds: 300), () {
      if (mounted) {
        _loadBannerAd();
      }
    });
  }

  void _loadBannerAd() {
    // Dispose any existing ad first
    _bannerAd?.dispose();

    // Determine if we're in debug mode
    bool isInDebugMode = false;
    assert(isInDebugMode = true); // This will be true only in debug mode

    // Use test ad ID in debug mode, real ad ID in production
    String adUnitId = widget.adUnitId;

    // IMPORTANT: In debug mode, use test ad ID; in production, use real ad ID
    if (isInDebugMode) {
      adUnitId = 'ca-app-pub-3940256099942544/6300978111'; // Google's test ad unit ID
      print('Using test ad ID in MusicPlayerBannerAd: $adUnitId');
    } else {
      // Make sure we're using the production ad ID
      adUnitId = widget.adUnitId; // Production ad ID
      print('Using production ad ID in MusicPlayerBannerAd: $adUnitId');
    }

    _bannerAd = BannerAd(
      adUnitId: adUnitId,
      size: AdSize.banner,
      request: const AdRequest(),
      listener: BannerAdListener(
        onAdLoaded: (_) {
          if (mounted) {
            setState(() {
              _isAdLoaded = true;
            });
          }
        },
        onAdFailedToLoad: (ad, error) {
          ad.dispose();
          if (mounted) {
            setState(() {
              _isAdLoaded = false;
            });
          }
        },
        onAdOpened: (ad) {
          // When ad is opened/clicked
          print('Banner ad opened');
        },
        onAdClosed: (ad) {
          // When ad is closed
          print('Banner ad closed');
        },
        onAdImpression: (ad) {
          // When ad is displayed
          print('Banner ad impression recorded');
        },
      ),
    );

    // Load ad after ensuring widget is still active
    if (mounted) {
      _bannerAd?.load();
    }
  }

  @override
  void dispose() {
    // Dispose the banner ad when the widget is removed
    _bannerAd?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    bool isInDebugMode = false;
    assert(isInDebugMode = true); // This will be true only in debug mode

    return RepaintBoundary(
      child: _isAdLoaded && _bannerAd != null
          ? Container(
        width: _bannerAd!.size.width.toDouble(),
        height: _bannerAd!.size.height.toDouble(),
        alignment: Alignment.center,
        child: AdWidget(ad: _bannerAd!),
      )
          : Container(
        width: 320,
        height: 50,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: Colors.grey[900],
          borderRadius: BorderRadius.circular(8),
        ),
        child: Image.asset(
          'assets/Banner Ad.png',
          width: 320,
          height: 50,
          fit: BoxFit.cover,
        ),
      ),
    );
  }
}

class SeekBar extends StatelessWidget {
  final Duration position;
  final Duration duration;
  final ValueChanged<Duration>? onChanged;
  final ValueChanged<Duration>? onChangeEnd;

  const SeekBar({
    Key? key,
    required this.position,
    required this.duration,
    this.onChanged,
    this.onChangeEnd,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Slider(
          min: 0.0,
          max: duration.inMilliseconds.toDouble(),
          activeColor: Colors.white,
          inactiveColor: Colors.grey.shade300,
          value: position.inMilliseconds
              .toDouble()
              .clamp(0.0, duration.inMilliseconds.toDouble()),
          onChanged: (value) {
            final newPosition = Duration(milliseconds: value.round());
            if (onChangeEnd != null) {
              onChangeEnd!(newPosition);
            }
          },
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(_formatDuration(position),
                  style: TextStyle(color: Colors.white)),
              Text(_formatDuration(duration),
                  style: TextStyle(color: Colors.white)),
            ],
          ),
        ),
      ],
    );
  }
  String _formatDuration(Duration duration) {
    String twoDigits(int n) => n.toString().padLeft(2, '0');
    final minutes = twoDigits(duration.inMinutes.remainder(60));
    final seconds = twoDigits(duration.inSeconds.remainder(60));
    return '$minutes:$seconds';
  }
}