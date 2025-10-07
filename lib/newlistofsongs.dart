// newlistofsongs.dart

// dipanshu - this code is for all pages.
import 'dart:async';
import 'dart:convert';
import 'dart:ui';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:firebase_dynamic_links/firebase_dynamic_links.dart';
import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';
import 'package:share_plus/share_plus.dart';
import 'package:voiceapp/audio_service1.dart'; // Ensure this is the correct path to your AudioService class
import 'package:voiceapp/bottomnavigationbar.dart';
import 'package:voiceapp/connectivity_service.dart';
import 'package:voiceapp/loading_screen.dart';
import 'package:voiceapp/main.dart';
import 'package:voiceapp/musicplayer.dart';
import 'package:voiceapp/services/api_service.dart';
import 'package:voiceapp/nowplaying.dart';
import 'dart:math' as math;
import 'package:intl/intl.dart';

import 'package:shimmer/shimmer.dart';
import 'package:voiceapp/profile_manager.dart';
import 'package:marquee/marquee.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:voiceapp/NewHomepage.dart';

import 'notifiers.dart';

class ListPage extends StatefulWidget {
  final List<Map<String, String>>? songs;
  final String genreTitle;
  final String email;
  final String bannerImage;
  final String? image;
  final String fullname;
  final String Category;
  final bool showShuffleButton;
  final bool shownowplayingtime;
  final bool showOptionsMenu;

  final bool isGenre;
  final bool isLanguage;
  final bool isArtist;
  final bool isLovedTracks;
  final bool isHistory;
  final bool isSearch; // Flag for search results
  final String? searchQuery;
  final int? originIndex;
  final String? artistId;
  final int? navigationIndex;
  final bool isArtistByLanguage; // New flag for artist-specific
  final String? highlightSongName; // New parameter for highlighting
  final String? highlightSongId;   // New parameter fo
  final String? album; // New parameter for album
  final bool isArtistAlbum; // New flag for artist album songs
  final bool isAlbum;
  final String? albumId;


  ListPage({
    required this.genreTitle,
    required this.bannerImage,
    required this.email,
    this.songs,
    required this.Category,
    required this.fullname,
    this.image,
    this.showShuffleButton = true,
    this.shownowplayingtime = true,
    this.showOptionsMenu = true,
    this.isGenre = false,
    this.isLanguage = false,
    this.isArtist = false,
    this.isLovedTracks = false,
    this.isHistory = false,
    this.isSearch = false, // Initialize search flag
    this.searchQuery,
    this.originIndex,
    this.artistId,
    this.navigationIndex,
    this.highlightSongName, // Initialize highlight parameters
    this.highlightSongId,
    this.isArtistByLanguage = false, // Initialize new flag
    this.album, // Initialize album parameter
    this.isArtistAlbum = false, // Initialize new flag
    this.isAlbum = false,
    this.albumId,
  });

  @override
  _ListPageState createState() => _ListPageState();
}

class _ListPageState extends State<ListPage> {
  List<Map<String, String>> songs = [];
  List<Map<String, String>> _artistAlbums = []; // New: To store artist's albums
  Set<String> albumSongIds = {};
  bool isLoading = true;
  bool _isLoading = true;
  bool _isNoInternet = false;
  late ConnectivityService _connectivityService;
  bool _mounted = true;
  
  // Progressive loading variables for better UX
  final int initialLoadCount = 6; // Load first 6 songs instantly
  bool _isInitialLoading = true;
  bool _isLoadingMore = false;
  static final Map<String, List<Map<String, String>>> _languageCache = {}; // Static cache for languages

  bool isShuffleEnabled = false;
  bool isMenuOpen = false;
  int? currentlyPlayingIndex;
  final ValueNotifier<bool> isLoadingSongInfo = ValueNotifier<bool>(false);

  StreamSubscription? _playerStateSubscription;
  StreamSubscription? _currentIndexSubscription;

  final ScrollController _scrollController = ScrollController();
  bool _isProcessingIndexChange = false;
  Timer? _scrollDebouncer;

  bool isPlayButtonPressed = false;

  bool _isPlayingInProgress = false;

  // Add this helper function to retrieve userId
  String? getUserIdFromLocalOrPreviousCall(String songId) {
    // Try to get userId from the song data
    final song = songs.firstWhere(
          (song) => song['song_id'] == songId,
      orElse: () => {},
    );
    return song['artistId'] ?? widget.artistId; // Fallback to widget.artistId if available
  }
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();

    if (mounted) {
      // Get the current song ID
      final currentSongId = ProfileManager.currentlyPlayingSongIdNotifier.value;

      if (currentSongId != null) {
        // Find the index of the current song
        final songIndex = songs.indexWhere((song) =>
        song['song_id'] == currentSongId);

        if (songIndex != -1) {
          setState(() {
            currentlyPlayingIndex = songIndex;
          });

          // Force immediate scroll for artist-specific lists when returning to the page
          if ((widget.isArtistByLanguage ||
              (widget.isGenre && widget.artistId != null)) &&
              ModalRoute
                  .of(context)
                  ?.isCurrent == true) {
            // Directly scroll without delay for immediate visual feedback
            _scrollToCurrentSong(songIndex, forceScroll: true);
          } else {
            // Use the delayed approach for other list types
            Future.delayed(Duration(milliseconds: 100), () {
              if (mounted) {
                _scrollToCurrentSong(songIndex, forceScroll: true);
              }
            });
          }
        }
      }
    }
  }

  @override
  void initState() {
    super.initState();
    _mounted = true;
    _connectivityService = ConnectivityService();
    _setupConnectivityListener();
    fetchSongs(); // This will now also fetch albums if it's an artist page
    _setupAudioPlayerListeners();
    _scrollController.addListener(_onScrollChanged);
    fetchSongs().then((_) {
      // Only perform highlight operations after songs are loaded
      _initializeHighlightAfterFetch();
    });

    ProfileManager.currentlyPlayingSongIdNotifier.addListener(
        _updateCurrentSongById);
    _setupAudioPlayerListeners();
    _scrollController.addListener(_onScrollChanged);

    if (widget.isArtistByLanguage ||
        (widget.isGenre && widget.artistId != null)) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _forceUpdateCurrentSongHighlight();
      });
    }
  }

  void _initializeHighlightAfterFetch() {
    if (!_mounted || songs.isEmpty) return;

    // Find and highlight the current song by ID
    final currentSongId = ProfileManager.currentlyPlayingSongIdNotifier.value;
    if (currentSongId != null) {
      _handleSongHighlightById(currentSongId);
    }
  }

  void _updateCurrentSongById() {
    if (!mounted) return;

    final currentSongId = ProfileManager.currentlyPlayingSongIdNotifier.value;
    if (currentSongId == null) return;

    _handleSongHighlightById(currentSongId);
  }

  void _handleSongHighlightById(String songId) {
    // Find index of song in current list
    final index = songs.indexWhere((song) => song['song_id'] == songId);

    // Only process if song exists in this list
    if (index != -1) {
      // Update state with a short delay to allow list to render
      Future.delayed(Duration(milliseconds: 50), () {
        if (mounted) {
          setState(() {
            currentlyPlayingIndex = index;
          });

          // Use multiple delayed scroll attempts with increasing delays
          // This improves reliability when switching between lists
          Future.delayed(
              Duration(milliseconds: 100), () => _safeScrollToSong(index));
          Future.delayed(
              Duration(milliseconds: 300), () => _safeScrollToSong(index));
        }
      });
    } else {
      // If song is not in this list, ensure no song is highlighted
      if (currentlyPlayingIndex != null && mounted) {
        setState(() {
          currentlyPlayingIndex = null;
        });
      }
    }
  }

  void _forceUpdateCurrentSongHighlight() {
    final currentSongId = ProfileManager.currentlyPlayingSongIdNotifier.value;
    if (currentSongId == null) return;

    final index = songs.indexWhere((song) => song['song_id'] == currentSongId);
    if (index == -1) return;

    setState(() {
      currentlyPlayingIndex = index;
    });

    // Immediately scroll to make the highlighted song visible
    _scrollToCurrentSong(index, forceScroll: true);
  }

  void _setupConnectivityListener() {
    _connectivityService.connectionStream.listen((hasConnection) {
      if (!_mounted || _connectivityService.isClosed) return;

      setState(() {
        _isNoInternet = !hasConnection;
      });

      // If connection is restored, retry fetching songs
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
      isLoading = true;
    });

    await _connectivityService.checkConnection();

    if (!_mounted) return;

    if (_connectivityService.hasConnection) {
      await _initializeData();
    }

    setState(() {
      _isNoInternet = !_connectivityService.hasConnection;
      isLoading = false;
    });
  }

  Future<void> _initializeData() async {
    try {
      await fetchSongs();

      if (_mounted) {
        setState(() {
          isLoading = false;
        });
      }
    } catch (e) {
      print('Error initializing data: $e');
      if (_mounted) {
        setState(() {
          isLoading = false;
        });
      }
    }
  }

  void _onScrollChanged() {
    // Optional: Add logging or additional scroll tracking logic
    print('Current scroll offset: ${_scrollController.offset}');
  }

  // First, modify the _setupAudioPlayerListeners function to better handle song changes
  void _setupAudioPlayerListeners() {
    print(">>> Setting up audio service listeners");
    final audioService = AudioService();

    // Listen to current index changes from the audio service
    _currentIndexSubscription = audioService.currentIndexStream
        .distinct()
        .listen(
          (index) async {
        print('>>> AudioService index changed to: $index');
        if (index != null && mounted && !_isProcessingIndexChange) {
          _isProcessingIndexChange = true;

          try {
            // Get the song ID at this index from the audio service's playlist
            // Not from our local songs list - this is important
            final songId = await audioService.getCurrentSongId();

            if (songId != null && songId.isNotEmpty) {
              // Update the ProfileManager with the new song ID
              ProfileManager().updateCurrentlyPlayingSong(songId);

              // Find the index in our local list by song ID
              final localIndex = songs.indexWhere((song) =>
              song['song_id'] == songId);

              if (localIndex != -1 && mounted) {
                setState(() {
                  currentlyPlayingIndex = localIndex;
                });

                // Scroll with a slight delay to ensure UI is ready
                _scrollDebouncer?.cancel();
                _scrollDebouncer = Timer(Duration(milliseconds: 150), () {
                  if (mounted) {
                    _safeScrollToSong(localIndex);
                  }
                });
              }
            }
          } finally {
            _isProcessingIndexChange = false;
          }
        }
      },
      onError: (error) {
        print('>>> Error in index stream: $error');
        _isProcessingIndexChange = false;
      },
    );

    // Also listen to player state changes to update UI when playback starts/stops
    _playerStateSubscription =
        audioService.player.playerStateStream.listen((state) {
          if (mounted &&
              ProfileManager.currentlyPlayingSongIdNotifier.value != null) {
            _updateCurrentSongById();
          }
        });
  }

  void _safeScrollToSong(int index) {
    if (!mounted || !_scrollController.hasClients) return;

    try {
      final double itemHeight = 76.0; // Consistent item height

      // Get actual viewport height - account for various UI elements
      final double viewportHeight = MediaQuery
          .of(context)
          .size
          .height -
          MediaQuery
              .of(context)
              .padding
              .top -
          kToolbarHeight -
          290; // Banner + title + bottom nav, etc.

      // Calculate target offset to center the song item
      double targetOffset = (index * itemHeight) - (viewportHeight / 2) +
          (itemHeight / 2);

      // Ensure offset is within scrollable range
      if (_scrollController.position.maxScrollExtent > 0) {
        targetOffset = math.max(0,
            math.min(targetOffset, _scrollController.position.maxScrollExtent));

        // Smoothly animate to the position
        _scrollController.animateTo(
          targetOffset,
          duration: Duration(milliseconds: 300),
          curve: Curves.easeOutCubic,
        );
      }
    } catch (e) {
      print('Safe scroll error: $e');
    }
  }

  void _scrollToCurrentSong(int index, {bool forceScroll = false}) {
    if (!mounted || !_scrollController.hasClients) return;

    try {
      final double itemHeight = 76.0; // Consistent item height
      final double albumsSectionHeight = 180.0; // Albums section height (150 + padding)
      final double statusBarHeight = MediaQuery
          .of(context)
          .padding
          .top;
      // Reduced topSectionHeight to allow albums section to scroll up (red line position)
      final double topSectionHeight = 120.0; // Only banner section (artist name area)
      final double viewportHeight = MediaQuery
          .of(context)
          .size
          .height - topSectionHeight - statusBarHeight;

      // Calculate the actual list index for this song (accounting for albums section)
      int listIndex = index;
      if (widget.isArtist && _artistAlbums.isNotEmpty && widget.album == null) {
        listIndex += 1; // Albums section takes index 0
      }
      
      // Account for banner ad position
      int bannerAdPosition = (widget.isArtist && _artistAlbums.isNotEmpty && widget.album == null) ? 3 : 2;
      if (listIndex >= bannerAdPosition && songs.length > 2) {
        listIndex += 1; // Banner ad shifts song positions
      }

      // Calculate target offset - include albums section height if present
      double baseOffset = 0;
      if (widget.isArtist && _artistAlbums.isNotEmpty && widget.album == null) {
        baseOffset = albumsSectionHeight; // Albums section height
      }
      
      double targetOffset = baseOffset + (index * itemHeight) - (viewportHeight / 2) + (itemHeight * 1.5);

      // Ensure offset is within scrollable range with some buffer
      targetOffset = math.max(0, math.min(targetOffset,
          _scrollController.position.maxScrollExtent + itemHeight));

      // Use ScrollPosition methods for more precise control
      _scrollController.jumpTo(targetOffset);

      // Optional: Animate to provide smooth scrolling
      _scrollController.animateTo(
        targetOffset,
        duration: Duration(milliseconds: 800),
        curve: Curves.easeInOutQuart,
      );
      print(
          'Scrolling to song index $index (list index $listIndex), offset: $targetOffset, viewport height: $viewportHeight (red line position with scrollable albums)');
    } catch (e) {
      print('Detailed scroll error: $e');
    }
  }

  Future<List<Map<String, String>>> fetchSongsByGenre(String genre, String userId) async {
    try {
      final response = await ApiService.getSongsByGenreAndUser(genre, userId);
      if (ApiService.isSuccessResponse(response)) {
        List<dynamic> data = ApiService.parseJsonListResponse(response) ?? [];

        print('Fetched data for genre $genre and artist $userId: $data');

        return data.map<Map<String, String>>((song) {
          final artist = (song['stage_name']?.isNotEmpty == true)
              ? song['stage_name']
              : song['FullName'] ?? 'Unknown Artist';
          return {
            'title': song['songName'] ?? 'Unknown Title',
            'artist': artist,
            'song_id': song['song_id'] ?? 'Unknown Song Id',
            'coverPage': song['coverPageUrl'] ?? 'assets/logo.png',
            'duration': song['span'] ?? '0:00',
            'streamingUrl': song['songStreamUrl'] ?? '',
            'languages': song['languages'] ?? '',
            'genre': song['genre'] ?? '',
            'source': song['genre'] ?? '',
            'album': song['albumName'] ?? 'Unknown Album',
            'albumId': song['album_id'] ?? '', // Add albumId from API
            'artistId': song['user_id'] ?? '', // Add artistId from API
          };
        }).toList();
      } else {
        print(
            'Failed to load songs for genre $genre and artist $userId. Status code: ${response
                .statusCode}');
        return [];
      }
    } catch (error) {
      print('Error fetching songs by genre and artist: $error');
      return [];
    }
  }

  Future<List<Map<String, String>>> fetchSongsByartist(String stage_name) async {
    try {
      final response = await ApiService.getArtistSongs(widget.artistId!);
      if (ApiService.isSuccessResponse(response)) {
        List<dynamic> data = ApiService.parseJsonListResponse(response) ?? [];
        print('DEBUG: fetchSongsByartist response: $data'); // Debug API response
        if (data.isNotEmpty) {
          List<dynamic> singleSongs = data.where((song) {
            String songId = song['song_id'] ?? '';
            return !albumSongIds.contains(songId);
          }).toList();
          singleSongs.sort((a, b) {
            int idA = int.tryParse(a['song_id'] ?? '0') ?? 0;
            int idB = int.tryParse(b['song_id'] ?? '0') ?? 0;
            return idB.compareTo(idA);
          });
          return singleSongs.map<Map<String, String>>((song) {
            return {
              'title': song['songName'] ?? 'Unknown Title',
              'artist': stage_name,
              'song_id': song['song_id'] ?? 'Unknown Song Id',
              'coverPage': song['coverPageUrl'] ?? '',
              'duration': song['span'] ?? '0:00',
              'streamingUrl': song['songStreamUrl'] ?? '',
              'languages': song['languages'] ?? '',
              'genre': song['genre'] ?? '',
              'album': song['albumName']?.isEmpty == true ? 'Single' : song['albumName'] ?? 'Single',
              'albumId': song['album_id']?.toString() ?? '', // Ensure correct key
              'artistId': song['user_id']?.toString() ?? widget.artistId ?? '',
            };
          }).toList();
        } else {
          print('No songs found for the artist.');
          return [];
        }
      } else {
        print('Failed to load songs. Status code: ${response.statusCode}');
        return [];
      }
    } catch (error) {
      print('Error fetching songs: $error');
      return [];
    }
  }

  // New: Function to fetch albums for a given artist
  Future<List<Map<String, String>>> _fetchAlbumsForArtist(String artistId) async {
    print('DEBUG: Calling _fetchAlbumsForArtist API for artistId: $artistId');

    try {
      final response = await ApiService.getArtistAlbums(artistId);
      print('DEBUG: _fetchAlbumsForArtist response status: ${response.statusCode}');
      if (ApiService.isSuccessResponse(response)) {
        Map<String, dynamic> responseData = ApiService.parseJsonResponse(response) ?? {};
        List<dynamic> albumsData = responseData['albums'] ?? [];
        print('DEBUG: _fetchAlbumsForArtist raw data: $albumsData');

        // Clear previous album song IDs
        albumSongIds.clear();

        // Collect album song IDs
        for (var album in albumsData) {
          List<dynamic> songsInAlbum = album['songs'] ?? [];
          for (var song in songsInAlbum) {
            String songId = song['song_id'] ?? '';
            if (songId.isNotEmpty) {
              albumSongIds.add(songId);
            }
          }
        }
        print('DEBUG: Collected ${albumSongIds.length} album song IDs');

        // Map albums for display
        return albumsData.map<Map<String, String>>((album) {
          return {
            'albumName': album['albumName'] ?? 'Unknown Album',
            'coverPage': album['albumCoverUrl'] ?? 'assets/mic.jpg', // ✅ FIXED KEY
            'artistId': artistId,
          };
        }).toList();
      } else {
        print('DEBUG: Failed to load albums. Status code: ${response.statusCode}, Body: ${response.body}');
        return [];
      }
    } catch (error) {
      print('DEBUG: Error fetching albums: $error');
      return [];
    }
  }

  // Modified: fetchSongsByArtistAlbum to filter by albumName
  Future<List<Map<String, String>>> fetchSongsByArtistAlbum(String artistId, {String? albumName}) async {
    try {
      final response = await ApiService.getArtistAlbumSongs(artistId, albumName ?? '');
      if (ApiService.isSuccessResponse(response)) {
        Map<String, dynamic> responseData = ApiService.parseJsonResponse(response) ?? {};
        List<dynamic> albumsData = responseData['albums'] ?? [];
        List<Map<String, String>> allSongs = [];
        for (var album in albumsData) {
          if (albumName == null || album['albumName'] == albumName) {
            List<dynamic> songsInAlbum = album['songs'] ?? [];
            for (var song in songsInAlbum) {
              final artist = (song['stage_name']?.isNotEmpty == true)
                  ? song['stage_name']
                  : song['FullName'] ?? 'Unknown Artist';
              allSongs.add({
                'title': song['songName'] ?? 'Unknown Title',
                'artist': artist,
                'song_id': song['song_id'] ?? 'Unknown Song Id',
                'coverPage': song['coverPageUrl'] ?? '',
                'duration': song['span'] ?? '0:00',
                'streamingUrl': song['songStreamUrl'] ?? '',
                'languages': song['languages'] ?? '',
                'genre': song['genre'] ?? '',
                'album': album['albumName'] ?? 'Unknown Album',
                'albumId': album['album_id'] ?? '', // Add albumId
                'artistId': artistId, // Add artistId
              });
            }
          }
        }
        print('Fetched album songs: $allSongs');
        return allSongs;
      } else {
        print('Failed to load songs by artist album. Status code: ${response.statusCode}');
        return [];
      }
    } catch (error) {
      print('Error fetching songs by artist album: $error');
      return [];
    }
  }

  Future<void> fetchSongs() async {
    if (!mounted) return;
    try {
      if (widget.songs != null && widget.songs!.isNotEmpty) {
        if (mounted) {
          setState(() {
            songs = widget.songs!;
            isLoading = false;
          });
        }
      } else {
        List<Map<String, String>> fetchedSongs = [];

        if (widget.isGenre && widget.artistId != null) {
          fetchedSongs = await fetchSongsByGenreArtist(widget.genreTitle, widget.artistId!);
        } else if (widget.isGenre) {
          fetchedSongs = await fetchSongsByGenreOnly(widget.genreTitle);
        } else if (widget.isLanguage) {
          // Use progressive loading for language songs (like Hindi)
          fetchedSongs = await fetchSongsByLanguage(widget.genreTitle);
          if (fetchedSongs.isNotEmpty) {
            await _loadSongsProgressively(fetchedSongs);
            return; // Exit early since progressive loading handles the UI updates
          }
        } else if (widget.isArtist && widget.artistId != null) {
          print('DEBUG: Fetching albums for artistId: ${widget.artistId}');
          final fetchedAlbums = await _fetchAlbumsForArtist(widget.artistId!);
          if (mounted) {
            setState(() {
              _artistAlbums = fetchedAlbums;
            });
            print('DEBUG: Fetched ${_artistAlbums.length} albums for artist.');
          }
          fetchedSongs = await fetchSongsByartist(widget.genreTitle);
        } else if (widget.isLovedTracks) {
          fetchedSongs = await fetchLovedTracks();
        } else if (widget.isHistory) {
          fetchedSongs = await fetchHistoryTracks();
        } else if (widget.isSearch && widget.searchQuery != null) {
          fetchedSongs = await searchSongs(widget.searchQuery!);
        } else if (widget.isArtistByLanguage && widget.artistId != null) {
          fetchedSongs = await fetchSongsByArtistLanguage(widget.genreTitle, widget.artistId!);
        } else if (widget.isArtistAlbum && widget.artistId != null) {
          fetchedSongs = await fetchSongsByArtistAlbum(widget.artistId!, albumName: widget.album);
        } else if (widget.isAlbum && widget.albumId != null && widget.artistId != null) {
          fetchedSongs = await fetchSongsByAlbumId(widget.artistId!, widget.albumId!);
        }

        if (mounted) {
          setState(() {
            songs = fetchedSongs;
            isLoading = false;
          });
        }
      }
    } catch (e) {
      print("Error fetching songs: $e");
      if (mounted) {
        setState(() {
          isLoading = false;
        });
      }
    }
  }

  Future<List<Map<String, String>>> searchSongs(String query) async {
    final url = Uri.parse('https://py529n10q0.execute-api.ap-south-1.amazonaws.com/voiz/api/search?name=$query');
    try {
      final response = await ApiService.searchSongs({'name': query});
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map<Map<String, String>>((song) {
          final artist = (song['stage_name']?['S']?.isNotEmpty == true)
              ? song['stage_name']['S']
              : (song['FullName']?['S'] ?? 'Unknown');
          return {
            'title': song['songName']['S'] ?? 'Unknown',
            'artist': artist,
            'song_id': song['song_id']['S'] ?? 'Unknown',
            'duration': song['span']['S'] ?? '0:00',
            'coverPage': song['coverPageUrl']['S'] ?? 'assets/logo.png',
            'album': song['albumName']['S'] ?? 'Unknown Album',
            'albumId': song['album_id']?.toString() ?? '', // Add albumId
            'artistId': song['user_id']?.toString() ?? '', // Add artistId
          };
        }).toList();
      } else {
        throw Exception('Failed to load songs for query "$query"');
      }
    } catch (e) {
      print('Error searching songs for "$query": $e');
      return [];
    }
  }

  Future<List<Map<String, String>>> fetchHistoryTracks() async {
    try {
      final response = await ApiService.getUserHistory(ProfileManager().getUserId() ?? '');
      if (ApiService.isSuccessResponse(response)) {
        final jsonResponse = ApiService.parseJsonResponse(response) ?? {};
        if (jsonResponse is Map<String, dynamic> && jsonResponse.containsKey('songDetails')) {
          final List<dynamic> songDetails = jsonResponse['songDetails'];
          final Set<String> uniqueSongIds = {};
          List<Map<String, String>> historyTracks = [];
          for (var song in songDetails) {
            if (song is Map<String, dynamic>) {
              final songId = song['song_id'] ?? 'Unknown Song Id';
              if (!uniqueSongIds.contains(songId)) {
                uniqueSongIds.add(songId);
                historyTracks.add({
                  'title': song['songName'] ?? 'Unknown Title',
                  'song_id': songId,
                  'artist': (song['stage_name']?.isNotEmpty == true) ? song['stage_name'] : song['FullName'] ?? 'Unknown Artist',
                  'coverPage': song['coverPageUrl'] ?? 'assets/logo.png',
                  'duration': song['span'] ?? '3:30',
                  'timestamp': song['updatedTimestamp'] ?? '0:0',
                  'streamingUrl': song['songStreamUrl'] ?? '',
                  'languages': song['languages'] ?? '',
                  'genre': song['genre'] ?? '',
                  'album': song['albumName'] ?? 'Unknown Album',
                  'albumId': song['album_id'] ?? '', // Add albumId
                  'artistId': song['user_id'] ?? '', // Add artistId
                });
              }
            }
          }
          historyTracks.sort((a, b) {
            final dateTimeA = parseCustomDateTime(a['timestamp'] ?? '');
            final dateTimeB = parseCustomDateTime(b['timestamp'] ?? '');
            return dateTimeB.compareTo(dateTimeA);
          });
          return historyTracks;
        } else {
          return [];
        }
      } else {
        throw Exception('Failed to load history tracks');
      }
    } catch (error) {
      print('Error fetching history tracks: $error');
      return [];
    }
  }

  Future<List<Map<String, String>>> fetchLovedTracks() async {
    try {
      final response = await ApiService.getLovedTracks(ProfileManager().getUserId() ?? '');
      if (ApiService.isSuccessResponse(response)) {
        final jsonResponse = ApiService.parseJsonResponse(response) ?? {};
        if (jsonResponse.containsKey('songDetails')) {
          final List<dynamic> songDetails = jsonResponse['songDetails'];
          return songDetails.map<Map<String, String>>((song) {
            return {
              'title': song['songName'] ?? 'Unknown Title',
              'artist': (song['stage_name']?.isNotEmpty == true) ? song['stage_name'] : song['FullName'] ?? 'Unknown Artist',
              'coverPage': song['coverPageUrl'] ?? 'assets/logo.png',
              'song_id': song['song_id'] ?? 'Unknown Song Id',
              'duration': song['span'] ?? '0:00',
              'streamingUrl': song['songStreamUrl'] ?? '',
              'languages': song['languages'] ?? '',
              'genre': song['genre'] ?? '',
              'timestamp': song['updatedTimestamp'] ?? DateTime.now().toString(),
              'album': song['albumName'] ?? 'Unknown Album',
              'albumId': song['album_id'] ?? '', // Add albumId
              'artistId': song['user_id'] ?? '', // Add artistId
            };
          }).toList();
        } else {
          print('No songDetails found in response');
          return [];
        }
      } else {
        throw Exception('Failed to load loved tracks: ${response.statusCode}');
      }
    } catch (error) {
      print('Error fetching loved tracks: $error');
      throw Exception('Failed to load loved tracks: $error');
    }
  }

  DateTime parseCustomDateTime(String dateTimeStr) {
    try {
      if (dateTimeStr == '0' || dateTimeStr.isEmpty) {
        print('Invalid timestamp: $dateTimeStr, using current time');
        return DateTime.now(); // Use current time for invalid dates
      }

      // Handle different timestamp formats
      if (dateTimeStr.contains('_')) {
        // Format:YYYYMMdd_HHmmss
        final year = int.parse(dateTimeStr.substring(0, 4));
        final month = int.parse(dateTimeStr.substring(4, 6));
        final day = int.parse(dateTimeStr.substring(6, 8));
        final hour = int.parse(dateTimeStr.substring(9, 11));
        final minute = int.parse(dateTimeStr.substring(11, 13));
        final second = int.parse(dateTimeStr.substring(13, 15));

        return DateTime(year, month, day, hour, minute, second);
      } else {
        // Try parsing as ISO 8601
        return DateTime.parse(dateTimeStr);
      }
    } catch (e) {
      print('Error parsing date "$dateTimeStr": $e');
      return DateTime.now(); // Use current time for parsing errors
    }
  }


  Future<List<Map<String, String>>> fetchSongsByLanguage(String language) async {
    try {
      // Check cache first for instant loading
      if (_languageCache.containsKey(language)) {
        print('✅ Using cached data for language: $language (${_languageCache[language]!.length} songs)');
        return _languageCache[language]!;
      }
      
      print('🔄 Fetching fresh data for language: $language');
      // Map "Oriya" back to "Odia" for API compatibility
      String apiLanguage = language == 'Oriya' ? 'Odia' : language;
      final response = await ApiService.getSongsByLanguage(apiLanguage);
      if (ApiService.isSuccessResponse(response)) {
        List<dynamic> data = ApiService.parseJsonListResponse(response) ?? [];
        print('📥 Language API ($language) response: ${data.length} songs');
        if (data.isNotEmpty) {
          final songsList = data.map<Map<String, String>>((song) {
            final albumName = song['albumName'] ?? 'Unknown Album';
            final albumId = song['album_id'] ?? '';
            final artistId = song['user_id'] ?? '';
            final artist = (song['stage_name']?.isNotEmpty == true)
                ? song['stage_name']
                : song['FullName'] ?? 'Unknown Artist';
            return {
              'title': song['songName'] ?? 'Unknown Title',
              'artist': artist,
              'song_id': song['song_id'] ?? 'Unknown Song Id',
              'coverPage': song['coverPageUrl'] ?? 'assets/logo.png',
              'duration': song['span'] ?? '0:00',
              'streamingUrl': song['songStreamUrl'] ?? '',
              'languages': song['languages'] ?? '',
              'genre': song['genre'] ?? '',
              'source': song['languages'] ?? '',
              'album': albumName,
              'albumId': albumId,
              'artistId': artistId,
            };
          }).toList();
          
          // Cache the results for instant future access
          _languageCache[language] = songsList;
          print('💾 Cached ${songsList.length} songs for language: $language');
          return songsList;
        }
      } else {
        print('❌ Failed to load songs for language $language. Status code: ${response.statusCode}');
        return [];
      }
    } catch (error) {
      print('💥 Error fetching songs by language: $error');
      return [];
    }
    return [];
  }
  
  Future<void> _loadSongsProgressively(List<Map<String, String>> allSongs) async {
    if (allSongs.isEmpty) return;
    
    print('🚀 Starting progressive loading: ${allSongs.length} total songs');
    
    // Load initial 6 songs for instant display
    final initialBatch = allSongs.take(initialLoadCount).toList();
    if (mounted) {
      setState(() {
        songs = initialBatch;
        isLoading = false;
        _isInitialLoading = false;
      });
      print('⚡ Displayed first ${initialBatch.length} songs instantly');
    }
    
    // Load remaining songs in background if there are more
    if (allSongs.length > initialLoadCount) {
      print('🔄 Loading remaining ${allSongs.length - initialLoadCount} songs in background');
      _loadRemainingSongsInBackground(allSongs.skip(initialLoadCount).toList());
    }
  }
  
  Future<void> _loadRemainingSongsInBackground(List<Map<String, String>> remainingSongs) async {
    const batchSize = 4; // Load 4 songs at a time
    
    for (int i = 0; i < remainingSongs.length; i += batchSize) {
      if (!mounted) return;
      
      final int endIndex = (i + batchSize < remainingSongs.length) ? i + batchSize : remainingSongs.length;
      final batch = remainingSongs.sublist(i, endIndex);
      
      if (!mounted) return;
      
      setState(() {
        songs.addAll(batch);
      });
      
      print('📥 Added ${batch.length} more songs (${songs.length}/${initialLoadCount + remainingSongs.length} total)');
      
      // Small delay to prevent UI blocking
      await Future.delayed(Duration(milliseconds: 150));
    }
    
    print('✅ Finished loading all songs progressively');
  }

  Future<List<Map<String, String>>> fetchSongsByGenreArtist(String genre, String artistId) async {
    try {
      final response = await ApiService.getSongsByGenreAndUser(genre, artistId);
      if (ApiService.isSuccessResponse(response)) {
        List<dynamic> data = ApiService.parseJsonListResponse(response) ?? [];
        return data.map<Map<String, String>>((song) {
          final artist = (song['stage_name']?.isNotEmpty == true)
              ? song['stage_name']
              : song['FullName'] ?? 'Unknown Artist';
          return {
            'title': song['songName'] ?? 'Unknown Title',
            'artist': artist,
            'song_id': song['song_id'] ?? 'Unknown Song Id',
            'coverPage': song['coverPageUrl'] ?? 'assets/mic.jpg',
            'duration': song['span'] ?? '0:00',
            'streamingUrl': song['songStreamUrl'] ?? '',
            'languages': song['languages'] ?? '',
            'genre': song['genre'] ?? '',
            'albumName': song['albumName'] ?? 'Unknown Album',
            'albumId': song['album_id']?.toString() ?? '',
            'artistId': song['user_id']?.toString() ?? '',
          };
        }).toList();
      }
    } catch (error) {
      print('Error fetching songs by genre and artist: $error');
    }
    return [];
  }

  Future<List<Map<String, String>>> fetchSongsByArtistLanguage(String language, String artistId) async {
    try {
      final response = await ApiService.getSongsByArtistLanguage(artistId, language);
      if (ApiService.isSuccessResponse(response)) {
        List<dynamic> data = ApiService.parseJsonListResponse(response) ?? [];
        return data.map<Map<String, String>>((song) {
          final artist = (song['stage_name']?.isNotEmpty == true) ? song['stage_name'] : song['FullName'] ?? 'Unknown Artist';
          return {
            'title': song['songName'] ?? 'Unknown Title',
            'artist': artist,
            'song_id': song['song_id'] ?? 'Unknown Song Id',
            'coverPage': song['coverPageUrl'] ?? 'assets/mic.jpg',
            'duration': song['span'] ?? '0:00',
            'streamingUrl': song['songStreamUrl'] ?? '',
            'languages': song['languages'] ?? '',
            'genre': song['genre'] ?? '',
            'albumName': song['albumName'] ?? 'Unknown Album',
            'albumId': song['album_id']?.toString() ?? '',
            'artistId': song['user_id']?.toString() ?? '',
          };
        }).toList();
      }
    } catch (error) {
      print('Error fetching songs by artist language: $error');
    }
    return [];
  }

  Future<List<Map<String, String>>> fetchSongsByAlbumId(String artistId, String albumId) async {
    try {
      final response = await ApiService.getArtistAlbumSongs(artistId, albumId);
      if (ApiService.isSuccessResponse(response)) {
        Map<String, dynamic> responseData = ApiService.parseJsonResponse(response) ?? {};
        List<dynamic> albumsData = responseData['albums'] ?? [];
        
        List<Map<String, String>> allSongs = [];
        var targetAlbum = albumsData.firstWhere(
          (album) => album['album_id'] == albumId,
          orElse: () => null,
        );
        
        if (targetAlbum != null) {
          List<dynamic> songsInAlbum = targetAlbum['songs'] ?? [];
          for (var song in songsInAlbum) {
            final artist = (song['stage_name']?.isNotEmpty == true)
                ? song['stage_name']
                : song['FullName'] ?? 'Unknown Artist';
            allSongs.add({
              'title': song['songName'] ?? 'Unknown Title',
              'artist': artist,
              'song_id': song['song_id'] ?? 'Unknown Song Id',
              'coverPage': song['coverPageUrl'] ?? 'assets/mic.jpg',
              'duration': song['span'] ?? '0:00',
              'streamingUrl': song['songStreamUrl'] ?? '',
              'languages': song['languages'] ?? '',
              'genre': song['genre'] ?? '',
              'albumName': targetAlbum['albumName'] ?? 'Unknown Album',
              'albumId': targetAlbum['album_id']?.toString() ?? '',
              'artistId': song['user_id']?.toString() ?? '',
            });
          }
        }
        return allSongs;
      }
    } catch (error) {
      print('Error fetching songs by album: $error');
    }
    return [];
  }

  Future<List<Map<String, String>>> fetchSongsByGenreOnly(String genre) async {
    try {
      final response = await ApiService.getSongsByGenre(genre);
      if (ApiService.isSuccessResponse(response)) {
        List<dynamic> data = ApiService.parseJsonListResponse(response) ?? [];
        print('DEBUG: fetchSongsByGenre response: $data'); // Debug API response
        return data.map<Map<String, String>>((song) {
          final albumName = song['albumName'] ?? 'Unknown Album';
          final albumId = song['album_id']?.toString() ?? ''; // Corrected key
          final artistId = song['user_id']?.toString() ?? '';
          final artist = (song['stage_name']?.isNotEmpty == true)
              ? song['stage_name']
              : song['FullName'] ?? 'Unknown Artist';
          return {
            'title': song['songName'] ?? 'Unknown Title',
            'artist': artist,
            'song_id': song['song_id'] ?? 'Unknown Song Id',
            'coverPage': song['coverPageUrl'] ?? 'assets/logo.png',
            'duration': song['span'] ?? '0:00',
            'streamingUrl': song['songStreamUrl'] ?? '',
            'languages': song['languages'] ?? '',
            'genre': song['genre'] ?? '',
            'source': song['genre'] ?? '',
            'album': albumName,
            'albumId': albumId,
            'artistId': artistId,
          };
        }).toList();
      } else {
        print('Failed to load songs for genre $genre. Status code: ${response.statusCode}');
        return [];
      }
    } catch (error) {
      print('Error fetching songs by genre: $error');
      return [];
    }
  }
  // Function to fetch the song URL from the API
  Future<String> fetchSongUrl(String songName) async {
    final response = await ApiService.getSongUrl(songName);

    if (ApiService.isSuccessResponse(response)) {
      final jsonResponse = ApiService.parseJsonResponse(response) ?? {};
      return jsonResponse['songUrl']?['S'] ?? '';
    } else {
      throw Exception('Failed to load song URL');
    }
  }

  Future<bool> loadPlaylistIntoAudioService({required int initialIndex}) async {
    if (!mounted) return false;

    try {
      await AudioService().loadPlaylist(songs, initialIndex: initialIndex);

      // Wait for player to be ready or error
      bool isLoaded = await Future.any([
        // Wait for player to be ready
        AudioService().player.playerStateStream.firstWhere((state) {
          return state.processingState == ProcessingState.ready;
        }).timeout(Duration(seconds: 5)),

        // Or catch any error that occurs
        AudioService().player.playbackEventStream.firstWhere((event) {
          return event.processingState == ProcessingState.completed ||
              event.processingState == ProcessingState.idle;
        }).timeout(Duration(seconds: 5))
      ]).then((_) {
        // Check if player is actually playing and has duration
        final duration = AudioService().player.duration;
        final processingState = AudioService().player.processingState;

        return processingState == ProcessingState.ready &&
            duration != null &&
            duration > Duration.zero;
      }).catchError((e) {
        print('Error waiting for player ready state: $e');
        return false;
      });

      if (!isLoaded) {
        print('Failed to load song: Player not ready or no duration');
        return false;
      }

      print('Playlist loaded successfully at index $initialIndex');
      return true;
    } catch (e) {
      print('Failed to load playlist: $e');
      return false;
    }
  }

  void _shareSong(String songId, String title, String coverImageUrl) async {
    try {
      // Generate the dynamic link for the song
      Uri dynamicLink = await createDynamicLink(songId, title, coverImageUrl);

      // Share the song with the generated dynamic link
      final shareText =
          'Hey, see what I found ! Listen to this amazing song 😍 on VOIZ ! Just download the app, listen and enjoy ! $dynamicLink';
      Share.share(shareText);
      await _incrementShareCount(songId);
    } catch (e) {
      print('Error generating dynamic link: $e');
    }
  }

  Future<Uri> createDynamicLink(String songId, String title,
      String imageUrl) async {
    final DynamicLinkParameters parameters = DynamicLinkParameters(
      uriPrefix:
      'https://voiznewapp.page.link',
      // Your Firebase Dynamic Link domain
      link: Uri.parse(
          'https://voiznewapp.page.link/song?songId=$songId'),
      // Song-specific URL
      androidParameters: AndroidParameters(
        packageName: 'com.voizapp.voiceapp', // Your app's Android package
        minimumVersion: 0,
      ),
      iosParameters: IOSParameters(
        bundleId: 'com.voizapp.voiceapp', // Your app's iOS bundle ID
        minimumVersion: '1.0.1',
      ),
      socialMetaTagParameters: SocialMetaTagParameters(
        title: title, // Use the song title
        description:
        'Hey, see what I found ! Listen to this amazing song 😍 on VOIZ ! Just download the app, listen and enjoy !',
        imageUrl: Uri.parse(imageUrl),
      ),
    );

    // Generate a short dynamic link
    final ShortDynamicLink shortLink =
    await FirebaseDynamicLinks.instance.buildShortLink(parameters);
    return shortLink.shortUrl;
  }

  Future<void> _incrementShareCount(String songId) async {
    final String timestamp =
    DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());
    try {
      final response = await ApiService.updateShareSongCount({
        'song_id': songId, 
        'updatedTimestamp': timestamp
      });

      if (ApiService.isSuccessResponse(response)) {
        print('Share count incremented successfully!');
      } else {
        print(
            'Failed to increment share count. Status code: ${response
                .statusCode}');
      }
    } catch (e) {
      print('Error incrementing share count: $e');
    }
  }


  void _showSongInfoModal(BuildContext context, String songId) async {
    if (!mounted) return;
    List<Map<String, String>> songCredits = [];
    isLoadingSongInfo.value = true;

    String songTitle = songs.firstWhere(
          (song) => song['song_id'] == songId,
      orElse: () => {'title': 'Unknown Title'},
    )['title']!;

    try {
      songCredits = await fetchSongCredits(songId);
    } catch (e) {
      print("Error fetching song credits: $e");
    } finally {
      if (mounted) {
        isLoadingSongInfo.value = false;
      }
    }

    isLoadingSongInfo.value = false;
    if (!mounted) return;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (BuildContext context) {
        return Stack(
            children: [
              Positioned.fill(
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 5.0, sigmaY: 5.0),
                  child: Container(
                    color: Colors.black.withOpacity(0),
                  ),
                ),
              ),
              DraggableScrollableSheet(
                initialChildSize: 0.8,
                maxChildSize: 0.9,
                minChildSize: 0.5,
                builder: (BuildContext context,
                    ScrollController scrollController) {
                  return Align(
                    alignment: Alignment.center,
                    child: FractionallySizedBox(
                      widthFactor: 0.9,
                      child: Container(
                        decoration: BoxDecoration(
                          color: Color(0xFF151415),
                          borderRadius: BorderRadius.only(
                            topLeft: Radius.circular(20.0),
                            topRight: Radius.circular(20.0),
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.6),
                              spreadRadius: 3,
                              blurRadius: 0.5,
                              offset: Offset(3, -3),
                            ),
                          ],
                        ),
                        padding: EdgeInsets.all(16.0),
                        child: ValueListenableBuilder<bool>(
                          valueListenable: isLoadingSongInfo,
                          builder: (context, isLoading, child) {
                            if (isLoading) {
                              return buildShimmerSongInfoLoader();
                            } else {
                              return NotificationListener<ScrollNotification>(
                                onNotification: (scrollNotification) {
                                  return true;
                                },
                                child: Stack(
                                  children: [
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment
                                          .start,
                                      children: [
                                        Center(
                                          child: Container(
                                            width: 40,
                                            height: 4,
                                            margin: EdgeInsets.symmetric(
                                                vertical: 8),
                                            decoration: BoxDecoration(
                                              color: Colors.grey[300],
                                              borderRadius: BorderRadius
                                                  .circular(2),
                                            ),
                                          ),
                                        ),
                                        SizedBox(height: 20),
                                        Center(
                                          child: Text(
                                            songTitle,
                                            style: TextStyle(
                                              color: Colors.white,
                                              fontSize: 20,
                                              fontWeight: FontWeight.bold,
                                            ),
                                            textAlign: TextAlign.center,
                                          ),
                                        ),
                                        SizedBox(height: 0),
                                        Padding(
                                          padding: const EdgeInsets.all(12.0),
                                          // child: Text(
                                          //   'Credits:',
                                          //   style: TextStyle(
                                          //     color: Colors.white,
                                          //     fontSize: 22,
                                          //   ),
                                          // ),
                                        ),
                                        SizedBox(height: 10),
                                        Expanded(
                                          child: SingleChildScrollView(
                                            controller: scrollController,
                                            child: Column(
                                              children: [
                                                ListView.builder(
                                                  shrinkWrap: true,
                                                  physics: NeverScrollableScrollPhysics(),
                                                  itemCount: songCredits.length,
                                                  itemBuilder: (context,
                                                      index) {
                                                    final credit = songCredits[index];
                                                    return _creditRow(
                                                      credit['name'] ??
                                                          'Unknown',
                                                      credit['role'] ??
                                                          'Unknown',
                                                      isLastItem: index ==
                                                          songCredits.length -
                                                              1,
                                                    );
                                                  },
                                                ),
                                                SizedBox(height: 50),
                                              ],
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    if (songCredits.length > 3)
                                      Positioned(
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        child: Container(
                                          height: 50,
                                          decoration: BoxDecoration(
                                            gradient: LinearGradient(
                                              begin: Alignment.topCenter,
                                              end: Alignment.bottomCenter,
                                              colors: [
                                                Color(0xFF100F32).withOpacity(
                                                    0),
                                                Color(0xFF100F32),
                                              ],
                                            ),
                                          ),
                                          // child: Center(
                                          //   child: Icon(
                                          //     Icons.keyboard_arrow_down,
                                          //     color: Colors.white.withOpacity(0.7),
                                          //     size: 30,
                                          //   ),
                                          // ),
                                        ),
                                      ),
                                  ],
                                ),
                              );
                            }
                          },
                        ),
                      ),
                    ),
                  );
                },
              ),
            ]
        );
      },
    );
  }

  Widget _buildShimmerSongInfoLoader() {
    return ListView.builder(
      itemCount: 4,
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
                  color: Colors.grey[600],
                ),
                SizedBox(width: 10),
                Container(
                  height: 20,
                  width: 120,
                  color: Colors.grey[600],
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

  Future<List<Map<String, String>>> fetchSongCredits(String songId) async {
    //String? songId1 = getCurrentSongId();
    final response = await ApiService.getSongInfo(songId);

    if (ApiService.isSuccessResponse(response)) {
      Map<String, dynamic> data = ApiService.parseJsonResponse(response) ?? {};

      // Extract specific fields for credits
      List<Map<String, String>> credits = [
        {'name': data['singer']['S'] ?? 'Unknown', 'role': 'Singer'},
        {'name': data['composer']['S'] ?? 'Unknown', 'role': 'Composer'},
        {'name': data['lyricist']['S'] ?? 'Unknown', 'role': 'Lyricist'},
        {'name': data['producer']['S'] ?? 'Unknown', 'role': 'Producer'},
      ];

      return credits;
    } else {
      throw Exception('Failed to load song credits');
    }
  }


  Widget buildShimmer() {
    return ListView.builder(
      itemCount: 5,
      itemBuilder: (context, index) {
        return Shimmer.fromColors(
          baseColor: Colors.grey[800]!,
          highlightColor: Colors.grey[700]!,
          child: ListTile(
            leading: Container(width: 60, height: 60, color: Colors.grey),
            title: Container(
                width: double.infinity, height: 8, color: Colors.grey),
            subtitle: Container(
                width: double.infinity, height: 8, color: Colors.grey),
          ),
        );
      },
    );
  }

  Widget buildShimmerSongInfoLoader() {
    return Container(
      padding: EdgeInsets.all(16.0),
      child: Column(
        children: [
          Shimmer.fromColors(
            baseColor: Colors.grey[800]!,
            highlightColor: Colors.grey[700]!,
            child: Container(
              width: double.infinity,
              height: 20,
              color: Colors.grey,
            ),
          ),
          SizedBox(height: 10),
          Shimmer.fromColors(
            baseColor: Colors.grey[800]!,
            highlightColor: Colors.grey[700]!,
            child: Container(
              width: double.infinity,
              height: 15,
              color: Colors.grey,
            ),
          ),
        ],
      ),
    );
  }


  @override
  void dispose() {
    _mounted = false;
    _connectivityService.dispose();
    // Cancel any active timers or subscriptions if you use them
    // For example:
    // _songIdSubscription?.cancel();

    // Clear the songs list to release memory
    songs.clear();

    // Ensure the AudioService playlist is cleared if required
    // AudioService().clearPlaylist().then((_) {
    //   print('AudioService playlist cleared on dispose.');
    // }).catchError((e) {
    //   print('Error clearing AudioService playlist: $e');
    // });

    // Additional cleanup if needed (e.g., stopping background tasks)
    isLoading = false;
    currentlyPlayingIndex = null;
    isLoadingSongInfo.dispose();
    _scrollController.removeListener(_onScrollChanged);
    _scrollController.dispose();
    _scrollDebouncer?.cancel();
    //ProfileManager.currentlyPlayingSongIdNotifier.removeListener(_updateCurrentSong);
    ProfileManager.currentlyPlayingSongIdNotifier.removeListener(
        _updateCurrentSongById);
    _currentIndexSubscription?.cancel();
    _playerStateSubscription?.cancel();

    // Call the parent dispose method
    super.dispose();
  }

  // Add this new helper method to your _ListPageState class
  Future<void> _setupPlaylistAfterNavigation(String newSongId,
      int safeIndex) async {
    try {
      // Update current song ID TWICE - once immediately for UI feedback,
      // and again after a delay to ensure it persists
      ProfileManager().updateCurrentlyPlayingSong(newSongId);

      // Update UI immediately to show the selected song as playing
      if (mounted) {
        setState(() {
          currentlyPlayingIndex = safeIndex;
        });

        // Scroll to show the playing song immediately
        _scrollToCurrentSong(safeIndex, forceScroll: true);
      }

      // Pause any current playback
      await AudioService().player.pause();

      // Filter out invalid songs
      final validSongs = songs.where((song) =>
      song['streamingUrl'] != null &&
          song['streamingUrl']!.isNotEmpty &&
          song['song_id'] != null
      ).toList();

      // Clear the playlist first to prevent state conflicts
      await AudioService().clearPlaylist().catchError((e) {
        print('Error clearing playlist: $e');
      });

      // Load the playlist with selected song
      await AudioService().loadPlaylist(
          validSongs,
          initialIndex: safeIndex
      ).catchError((e) async {
        print('Error loading playlist: $e');

        // Try one more time with delay if failed
        await Future.delayed(Duration(milliseconds: 300));
        return AudioService().loadPlaylist(
            validSongs,
            initialIndex: safeIndex
        );
      }).catchError((e) {
        print('Retry loading playlist failed: $e');
      });

      // Make multiple update attempts to ensure the song ID persists
      // These delays are staggered to increase chances of success
      Future.delayed(Duration(milliseconds: 100), () {
        ProfileManager().updateCurrentlyPlayingSong(newSongId);
      });

      Future.delayed(Duration(milliseconds: 500), () {
        ProfileManager().updateCurrentlyPlayingSong(newSongId);
      });
    } finally {
      if (mounted) {
        setState(() {
          _isPlayingInProgress = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    Widget content = GradientScaffold(
      body:
      Column(
        children: [
          // Banner image section
          Container(
            height: 230,
            width: double.infinity,
            child: Stack(
              children: [
                // Banner Image without BoxFit property
                Container(
                  width: double.infinity,
                  height: 230,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: ClipRRect(
                    //borderRadius: BorderRadius.circular(20),
                    child: widget.bannerImage.startsWith('http')
                        ? CachedNetworkImage(
                      imageUrl: widget.bannerImage,
                      fit: BoxFit.cover,
                      memCacheWidth: 500,
                      // Cache a smaller version
                      memCacheHeight: 400,
                      placeholder: (context, url) =>
                          Container(
                            color: Colors.grey[900],
                            child: Center(
                              child: CircularProgressIndicator(
                                strokeWidth: 2.0,
                                valueColor: AlwaysStoppedAnimation<Color>(
                                    Colors.white),
                              ),
                            ),
                          ),
                      errorWidget: (context, error, stackTrace) {
                        return Image.asset(
                          'assets/default.jpg',
                          fit: BoxFit.cover,
                        );
                      },
                    )
                        : Image.asset(
                      widget.bannerImage, // Asset image path
                      fit: BoxFit.cover,
                      errorBuilder: (BuildContext context, Object error,
                          StackTrace? stackTrace) {
                        // Fallback to a default image on error
                        return Image.asset(
                          'assets/default.jpg',
                          // Replace with your fallback asset path
                          fit: BoxFit.cover,
                        );
                      },
                    ),
                  ),

                ),


                // Back Button
                Positioned(
                  top: 50,
                  left: 16,
                  child: GestureDetector(
                    onTap: () {
                      Navigator.of(context).pop();
                    },
                    child: Center(
                      child: CircleAvatar(
                        radius: 14,
                        backgroundColor: Color(0xFF100F32),
                        // Or whatever background color you want
                        child: Padding(
                          padding: const EdgeInsets.only(left: 5),
                          child: Icon(
                            Icons.arrow_back_ios,
                            color: Colors.white,
                            size: 18,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                // Logo

              ],
            ),
          ),

          // Controls section - Removed container wrapper and minimized padding
          Padding(
            padding: EdgeInsets.only(left: 16, right: 16, top: 8, bottom: 4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Flexible(
                  child: Row(
                    children: [
                      Flexible(
                        child: widget.genreTitle.length > 15
                            ? SizedBox(
                          height: 30,
                          child: Marquee(
                            text: widget.genreTitle,
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                            ),
                            blankSpace: 50.0,
                            velocity: 30.0,
                            pauseAfterRound: Duration(seconds: 1),
                            scrollAxis: Axis.horizontal,
                            fadingEdgeEndFraction: 0.1,
                            fadingEdgeStartFraction: 0.1,
                          ),
                        )
                            : Text(
                          widget.genreTitle,
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (widget.image != null)
                        Padding(
                          padding: EdgeInsets.only(left: 8),
                          child: Container(
                            width: 30,
                            height: 30,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.transparent,
                              image: DecorationImage(
                                image: AssetImage(widget.image!),
                                fit: BoxFit.cover,
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),),
                Row(
                  children: [
                    if (widget.showShuffleButton)
                      ValueListenableBuilder<bool>(
                        valueListenable: shuffleNotifier,
                        builder: (context, isShuffleEnabled, child) {
                          return Container(
                            width: 50,
                            height: 50,
                            decoration: BoxDecoration(
                              color: isShuffleEnabled
                                  ? Color(0xFF2644D9)
                                  : Color(0x33D9D9D9),
                              shape: BoxShape.circle,
                            ),
                            child: IconButton(
                              icon: Image.asset(
                                'assets/shuffle.png',
                                width: 24,
                                height: 24,
                                color: Colors.white,
                              ),
                              onPressed: () {
                                shuffleNotifier.value = !shuffleNotifier.value;
                              },
                            ),
                          );
                        },
                      ),
                    SizedBox(width: 10),
                    Container(
                      width: 50,
                      height: 50,
                      decoration: BoxDecoration(
                        color: isPlayButtonPressed ? Color(0xFF2644D9) : Color(
                            0x33D9D9D9),
                        // 0xFF93C6FE
                        shape: BoxShape.circle,
                      ),
                      child: IconButton(
                        icon: Icon(
                          Icons.play_arrow,
                          color: Colors.white,
                          size: 32,
                        ),
                        onPressed: () async {
                          setState(() {
                            isPlayButtonPressed = true;
                          });
                          final firstSongId = songs[0]['song_id'] ?? '';
                          ProfileManager().updateCurrentlyPlayingSong(
                              firstSongId);
                          await AudioService().clearPlaylist();

                          if (mounted) {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) =>
                                    MusicPlayerPage(
                                      email: widget.email,
                                      currentIndex: 0,
                                      userfullname: widget.fullname,
                                      userCategory: widget.Category,
                                      navigationIndex: widget.navigationIndex,
                                    ),
                              ),
                            );
                          }
                          bool success = false;
                          int retryCount = 0;
                          const maxRetries = 3;

                          while (!success && retryCount < maxRetries) {
                            try {
                              await loadPlaylistIntoAudioService(
                                  initialIndex: 0);
                              success = true;
                            } catch (e) {
                              print(
                                  'Load attempt ${retryCount + 1} failed: $e');
                              retryCount++;

                              if (retryCount < maxRetries) {
                                await Future.delayed(
                                    Duration(milliseconds: 500));
                                await AudioService().reinitialize();
                                print('Retrying after reinitialize...');
                              } else {
                                print('All retries failed, returning to list');
                                if (mounted) {
                                  Navigator.pop(context);
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                          'Unable to play songs. Please try again.'),
                                      duration: Duration(seconds: 2),
                                    ),
                                  );
                                }
                                break;
                              }
                            }
                          }
                          Future.delayed(Duration(milliseconds: 200), () {
                            if (mounted) {
                              setState(() {
                                isPlayButtonPressed = false;
                              });
                            }
                          });
                        },

                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Songs List - No padding at top
          Expanded(
            child: ClipRect(
              child: isLoading
                  ? buildShimmer()
                  : songs.isEmpty && _artistAlbums.isEmpty
                  ? Center(
                child: Text(
                  'No songs available.',
                  style: TextStyle(color: Colors.white, fontSize: 18),
                ),
              )
                  : Stack(
                children: [
                  ListView.builder(
                    controller: _scrollController,
                    // Add sufficient top padding to ensure the first item's text is fully visible
                    padding: EdgeInsets.only(top: 12.0),
                    itemCount: _getListItemCount(),
                    itemBuilder: (context, index) {
                      // Show albums section as first item if it's an artist page with albums
                      if (index == 0 && widget.isArtist && _artistAlbums.isNotEmpty && widget.album == null) {
                        return _buildAlbumsSection();
                      }
                      
                      // Adjust index for songs when albums section is present
                      int songIndex = _getSongIndex(index);
                      
                      // Show banner ad after the first 2 songs (accounting for albums section)
                      if (_shouldShowBannerAd(index, songIndex)) {
                        // Determine if we're in debug mode
                        bool isInDebugMode = false;
                        assert(isInDebugMode =
                        true); // This will be true only in debug mode
                        // Use appropriate ad ID based on mode
                        String adUnitId = 'ca-app-pub-1147112055796547/5221124787'; // Production ad ID

                        if (isInDebugMode) {
                          adUnitId =
                          'ca-app-pub-3940256099942544/6300978111'; // Google's test ad ID
                          print('Using test ad ID in list view: $adUnitId');
                        } else {
                          print(
                              'Using production ad ID in list view: $adUnitId');
                        }

                        return Container(
                          margin: EdgeInsets.symmetric(
                              vertical: 10.0, horizontal: 8.0),
                          child: BannerAdWidget(adUnitId: adUnitId),
                        );
                      }

                      // Get the actual song for this index
                      final song = songs[songIndex];
                      return _buildSongItem(
                        context,
                        song['title'] ?? 'Unknown Title',
                        song['artist'] ?? 'Unknown Artist',
                        song['coverPage'] ?? 'assets/logo.png',
                        song['duration'] ?? '0:00',
                        songIndex,
                        song['languages'] ?? '',
                        song['albumName'] ?? '',
                      );
                    },
                  ),
                  if (isMenuOpen)
                    Positioned.fill(
                      // Use bottom padding to ensure the blur doesn't cover the bottom navigation bar
                      bottom: kBottomNavigationBarHeight +
                          (widget.shownowplayingtime ? 80.0 : 0.0),
                      child: BackdropFilter(
                        filter: ImageFilter.blur(sigmaX: 4, sigmaY: 4),
                        child: Container(
                          color: Colors.black.withOpacity(0.0),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),

          // Now Playing Tile
          if (widget.shownowplayingtime)
            NowPlayingTile(
              email: widget.email,
              userFullName: widget.fullname,
              userCategory: widget.Category,
            ),
        ],

      ),
    );

    return Stack(
      children: [
        PageWithBottomNav(
          child: content,
          email: widget.email,
          fullName: widget.fullname,
          category: widget.Category,
          currentIndex: widget.navigationIndex ?? 0,
          isFromNewHomePage: false,
        ),
        LoadingScreen(
          isLoading: isLoading,
          isNoInternet: _isNoInternet,
          onRetry: _checkConnectivity,
        ),
      ],
    );
  }

  Widget _buildSongItem(
      BuildContext context,
      String title,
      String artist,
      String imagePath,
      String duration,
      int index,
      String languages,
      String album,
      ) {
    return ValueListenableBuilder<String?>(
      valueListenable: ProfileManager.currentlyPlayingSongIdNotifier,
      builder: (context, currentSongId, child) {
        final songId = songs[index]['song_id'] ?? '';
        final isPlaying = currentSongId == songId;
        final coverImageUrl = songs[index]['coverPage'] ?? 'assets/mic.jpg';
        final songGenre = songs[index]['genre'] ?? 'Unknown Genre';
        final songLanguage = songs[index]['languages'] ?? 'Unknown Language';
        final albumName = songs[index]['album'] ?? '';
        final artistId = widget.artistId ?? songs[index]['artistId']?.toString() ?? '';
        final albumId = songs[index]['albumId']?.toString() ?? '';
        final hasValidAlbum = albumId.isNotEmpty && albumName != 'Single' && albumName != 'Unknown Album';

        print('SONG: ${songs[index]['title']} | albumId: "$albumId" | hasValidAlbum: $hasValidAlbum');

        return GestureDetector(
          onTap: () async {
            if (_isPlayingInProgress) return;
            setState(() => _isPlayingInProgress = true);

            final newSongId = songId;
            final safeIndex = index;
            final isCurrentlyPlayingSong =
                newSongId == ProfileManager.currentlyPlayingSongIdNotifier.value;
            final isCurrentlyPlayingState = AudioService().player.playing;

            if (isCurrentlyPlayingSong) {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => MusicPlayerPage(
                    navigationIndex: widget.navigationIndex,
                    email: widget.email,
                    currentIndex: safeIndex,
                    userfullname: widget.fullname,
                    userCategory: widget.Category,
                    initialPlaybackState: isCurrentlyPlayingState,
                    initialPosition: AudioService().player.position,
                  ),
                ),
              );
              setState(() => _isPlayingInProgress = false);
            } else {
              loopNotifier.value = false;
              await loopNotifier.saveLoopState();
              AudioService().player.setLoopMode(LoopMode.off);

              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => MusicPlayerPage(
                    navigationIndex: widget.navigationIndex,
                    email: widget.email,
                    currentIndex: safeIndex,
                    userfullname: widget.fullname,
                    userCategory: widget.Category,
                  ),
                ),
              );

              _setupPlaylistAfterNavigation(newSongId, safeIndex);
            }
          },
          child: Container(
            key: ValueKey('song_$songId${isPlaying ? '_playing' : ''}'),
            decoration: BoxDecoration(
              color: isPlaying ? const Color(0xFF211F15) : Colors.transparent,
              borderRadius: BorderRadius.circular(10),
              boxShadow: isPlaying
                  ? [
                BoxShadow(
                  color: Colors.black.withOpacity(1),
                  spreadRadius: 2,
                  blurRadius: 4,
                  offset: Offset(0, 0),
                ),
              ]
                  : [],
            ),
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: Row(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(8.0),
                  child: CachedNetworkImage(
                    imageUrl: coverImageUrl,
                    width: 60,
                    height: 60,
                    fit: BoxFit.cover,
                    placeholder: (_, __) => Container(
                      width: 60,
                      height: 60,
                      color: Colors.grey[900],
                      child: const Center(child: CircularProgressIndicator()),
                    ),
                    errorWidget: (_, __, ___) => Image.asset(
                      'assets/mic.jpg',
                      width: 60,
                      height: 60,
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      title.length > 25
                          ? SizedBox(
                        height: 22,
                        child: Marquee(
                          text: title,
                          style: TextStyle(
                            color: isPlaying
                                ? const Color(0xFF2644D9)
                                : Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                          blankSpace: 50.0,
                          velocity: 30.0,
                          pauseAfterRound: const Duration(seconds: 1),
                          startAfter: const Duration(seconds: 2),
                        ),
                      )
                          : Text(
                        title,
                        style: TextStyle(
                          color: isPlaying
                              ? const Color(0xFF2644D9)
                              : Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        artist,
                        style: const TextStyle(color: Colors.grey, fontSize: 14),
                      ),
                      if (languages.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(
                          languages,
                          style: const TextStyle(color: Colors.grey, fontSize: 12),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  duration,
                  style: TextStyle(
                    color: isPlaying ? const Color(0xFF2644D9) : Colors.white,
                    fontSize: 14,
                  ),
                ),
                if (widget.showOptionsMenu)
                  Theme(
                    data: Theme.of(context).copyWith(
                      splashColor: Colors.transparent,
                      highlightColor: Colors.transparent,
                      hoverColor: Colors.transparent,
                      splashFactory: NoSplash.splashFactory,
                    ),
                    child: PopupMenuButton<String>(
                      icon: const Icon(Icons.more_vert, color: Colors.white),
                      color: const Color(0xFF151415),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      position: PopupMenuPosition.under,
                      onSelected: (value) async {
                        setState(() => isMenuOpen = false);
                        final selectedSongId = songs[index]['song_id'] ?? '';
                        final selectedSongTitle = songs[index]['title'] ?? 'Unknown Title';
                        final selectedCoverImageUrl = songs[index]['coverPage'] ?? 'assets/mic.jpg';

                        switch (value) {
                          case 'Share':
                            _shareSong(selectedSongId, selectedSongTitle, selectedCoverImageUrl);
                            break;
                          case 'Song info':
                            _showSongInfoModal(context, selectedSongId);
                            break;
                          case 'Go to album':
                            final songId = songs[index]['song_id'] ?? '';
                            String albumName = songs[index]['album'] ?? 'Unknown Album';
                            String albumId = songs[index]['albumId'] ?? '';
                            String artistId = songs[index]['artistId'] ?? '';
                            String coverPage = songs[index]['coverPage'] ?? 'assets/mic.jpg';

                            print('➡️ Checking albumId: $albumId, artistId: $artistId');

                            // ✅ fetch album data only if missing
                            if (albumId.isEmpty || artistId.isEmpty) {
                              try {
                                final response = await ApiService.getAlbumGoto(songId);

                                if (ApiService.isSuccessResponse(response)) {
                                  final data = ApiService.parseJsonResponse(response) ?? {};
                                  albumId = data['album_id'] ?? '';
                                  albumName = data['albumName'] ?? 'Unknown Album';
                                  coverPage = data['albumCoverUrl'] ?? coverPage;
                                  artistId = data['user_id'] ?? artistId;

                                  print('✅ API album found => $albumId | $albumName | $artistId');
                                } else {
                                  print('❌ Album API failed: ${response.statusCode}');
                                  return;
                                }
                              } catch (e) {
                                print('❌ Error in album API: $e');
                                return;
                              }
                            }

                            if (albumId.isNotEmpty && artistId.isNotEmpty) {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => ListPage(
                                    genreTitle: albumName,
                                    bannerImage: coverPage,
                                    email: widget.email,
                                    Category: widget.Category,
                                    fullname: widget.fullname,
                                    navigationIndex: widget.navigationIndex,
                                    artistId: artistId,
                                    albumId: albumId,
                                    isAlbum: true,
                                  ),
                                ),
                              );
                            } else {
                              print('❌ Still missing albumId or artistId');
                            }
                            break;
                        }
                      },

                      onCanceled: () => setState(() => isMenuOpen = false),
                      onOpened: () => setState(() => isMenuOpen = true),
                      itemBuilder: (_) {
                        final song = songs[index];
                        final albumId = song['albumId'] ?? '';
                        final hasValidAlbum = albumId.toString().isNotEmpty;

                        List<PopupMenuItem<String>> menuItems = [
                          PopupMenuItem<String>(
                            value: 'Share',
                            child: ListTile(
                              leading: Image.asset('assets/Share.png', height: 24, width: 24, color: Colors.white),
                              title: Text('Share', style: TextStyle(color: Colors.white, fontSize: 18, fontFamily: 'Poppins', fontWeight: FontWeight.w600)),
                            ),
                          ),
                          PopupMenuItem<String>(
                            value: 'Song info',
                            child: ListTile(
                              leading: Icon(Icons.info_outline, color: Colors.white),
                              title: Text('Song info', style: TextStyle(color: Colors.white, fontSize: 18, fontFamily: 'Poppins', fontWeight: FontWeight.w600)),
                            ),
                          ),
                        ];

                        if (hasValidAlbum) {
                          menuItems.add(
                            PopupMenuItem<String>(
                              value: 'Go to album',
                              child: ListTile(
                                leading: Icon(Icons.album, color: Colors.white),
                                title: Text('Go to album', style: TextStyle(color: Colors.white, fontSize: 18, fontFamily: 'Poppins', fontWeight: FontWeight.w600)),
                              ),
                            ),
                          );
                        }
                        return menuItems;
                      },
                    ),

                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> onGoToAlbumPressed(String songId) async {
    try {
      // Find the song in the local songs list
      final song = songs.firstWhere(
            (song) => song['song_id'] == songId,
        orElse: () => {},
      );
      String? albumId = song['albumId'];
      String? albumName = song['album'];
      String? albumCover = song['coverPage'];
      String? artistId = song['artistId'] ?? widget.artistId;

      // If albumId or artistId is missing, fetch from API
      if (albumId == null || albumId.isEmpty || artistId == null || artistId.isEmpty || albumName == 'Single') {
        final albumRes = await ApiService.getAlbumGoto(songId);

        if (ApiService.isSuccessResponse(albumRes)) {
          final albumData = ApiService.parseJsonResponse(albumRes) ?? {};
          albumId = albumData['album_id']?.toString() ?? '';
          albumName = albumData['albumName'] ?? 'Unknown Album';
          albumCover = albumData['albumCoverUrl'] ?? 'assets/mic.jpg';
          artistId = albumData['user_id'] ?? artistId;
        } else {
          print('Failed to load album info. Status code: ${albumRes.statusCode}, Body: ${albumRes.body}');
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Failed to load album information.'),
              duration: Duration(seconds: 2),
            ),
          );
          return;
        }
      }

      // Validate inputs
      if (artistId == null || artistId.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Artist information not available.'),
            duration: Duration(seconds: 2),
          ),
        );
        return;
      }

      if (albumId == null || albumId.isEmpty || albumName == 'Single') {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('This song is not part of an album.'),
            duration: Duration(seconds: 2),
          ),
        );
        return;
      }

      // Fetch album songs
      final formattedSongs = await fetchSongsByAlbumId(artistId, albumId);

      if (mounted) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => ListPage(
              genreTitle: albumName ?? 'Unknown Album',
              bannerImage: albumCover ?? 'assets/mic.jpg',
              email: widget.email,
              Category: widget.Category,
              fullname: widget.fullname,
              songs: formattedSongs,
              isAlbum: true,
              isArtistAlbum: true,
              artistId: artistId,
              albumId: albumId,
              album: albumName ?? 'Unknown Album',
              navigationIndex: widget.navigationIndex,
              showShuffleButton: widget.showShuffleButton,
              shownowplayingtime: widget.shownowplayingtime,
              showOptionsMenu: widget.showOptionsMenu,
            ),
          ),
        );
      }
    } catch (error) {
      print('Error in onGoToAlbumPressed: $error');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('An error occurred while fetching album data.'),
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  // Helper methods for the new scrollable albums implementation
  int _getListItemCount() {
    int baseCount = songs.length;
    
    // Add 1 for albums section if it should be shown
    if (widget.isArtist && _artistAlbums.isNotEmpty && widget.album == null) {
      baseCount += 1;
    }
    
    // Add 1 for banner ad if there are more than 2 songs
    if (songs.length > 2) {
      baseCount += 1;
    }
    
    return baseCount;
  }

  int _getSongIndex(int listIndex) {
    int songIndex = listIndex;
    
    // Subtract 1 if albums section is present (it takes index 0)
    if (widget.isArtist && _artistAlbums.isNotEmpty && widget.album == null) {
      songIndex -= 1;
    }
    
    // Adjust for banner ad position
    int bannerAdPosition = (widget.isArtist && _artistAlbums.isNotEmpty && widget.album == null) ? 3 : 2;
    if (listIndex > bannerAdPosition && songs.length > 2) {
      songIndex -= 1;
    }
    
    return songIndex;
  }

  bool _shouldShowBannerAd(int listIndex, int songIndex) {
    if (songs.length <= 2) return false;
    
    // Banner ad position: after 2 songs, accounting for albums section
    int bannerAdPosition = (widget.isArtist && _artistAlbums.isNotEmpty && widget.album == null) ? 3 : 2;
    return listIndex == bannerAdPosition;
  }

  Widget _buildAlbumsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
          child: Text(
            'Albums',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
              fontFamily: 'Poppins',
            ),
          ),
        ),
        Container(
          height: 150, // Height for the horizontal album list
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: EdgeInsets.symmetric(horizontal: 16.0),
            itemCount: _artistAlbums.length,
            itemBuilder: (context, index) {
              final album = _artistAlbums[index];
              return GestureDetector(
                onTap: () {
                  // Navigate to a new ListPage instance showing songs for this specific album
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => ListPage(
                        genreTitle: album['albumName']!,
                        bannerImage: album['coverPage']!,
                        email: widget.email,
                        Category: widget.Category,
                        fullname: widget.fullname,
                        isArtistAlbum: true,
                        artistId: album['artistId'],
                        album: album['albumName'],
                        navigationIndex: widget.navigationIndex,
                      ),
                    ),
                  );
                },
                child: Container(
                  width: 110, // Width for each album item
                  margin: EdgeInsets.only(right: 12.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8.0),
                        child: CachedNetworkImage(
                          imageUrl: album['coverPage'] ?? '',
                          width: 100,
                          height: 100,
                          fit: BoxFit.cover,
                          placeholder: (context, url) => Center(
                              child: CircularProgressIndicator()),
                          errorWidget: (context, url, error) => Image.asset(
                            'assets/mic.jpg',
                            width: 100,
                            height: 100,
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                      SizedBox(height: 8.0),
                      Text(
                        album['albumName']!,
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          fontFamily: 'Poppins',
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        SizedBox(height: 10), // Space between albums and song list
      ],
    );
  }
}
