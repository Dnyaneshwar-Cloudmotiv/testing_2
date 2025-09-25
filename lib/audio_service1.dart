// audio_service1.dart
import 'dart:async';
import 'dart:convert';

import 'package:flutter/cupertino.dart';
import 'package:intl/intl.dart';
import 'package:just_audio/just_audio.dart';
import 'package:audio_service/audio_service.dart';
import 'package:just_audio_background/just_audio_background.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:voiceapp/profile_manager.dart';
import 'main.dart';
import 'notifiers.dart';
import 'package:voiceapp/services/api_service.dart';
import 'package:connectivity_plus/connectivity_plus.dart';

class AudioService {
  static AudioService? _instance;
  String _previousSongId = '';
  late AudioPlayer _player;
  late ConcatenatingAudioSource _playlist;
  bool _isShuffleEnabled = false;
  bool _isPlayCountIncremented = false;
  Map<String, bool> playCountTracker = {};
  StreamSubscription<Duration>? _positionSubscription;
  bool _isInitialized = false;
  List<StreamSubscription> _subscriptions = [];

  Duration _previousPosition = Duration.zero;
  bool _positionJumped = false;
  Timer? _playCountTimer;

  // Add these new properties
  final Connectivity _connectivity = Connectivity();
  StreamSubscription? _connectivitySubscription;
  bool _wasPlayingBeforeDisconnect = false;

  final ValueNotifier<bool> isPlaying = ValueNotifier<bool>(false);
  final ValueNotifier<MediaItem?> currentSong = ValueNotifier<MediaItem?>(null);

  // Add this method to update the global state
  void updateNowPlayingState() {
    if (player.playing && player.sequenceState?.currentSource != null) {
      final currentItem = player.sequenceState!.currentSource!.tag as MediaItem;
      isPlaying.value = true;
      currentSong.value = currentItem;
      isNowPlayingTileVisible.value = true;
    } else if (player.sequenceState?.currentSource != null) {
      // Player has a current song but is paused
      final currentItem = player.sequenceState!.currentSource!.tag as MediaItem;
      isPlaying.value = false;
      currentSong.value = currentItem;
      isNowPlayingTileVisible.value = true; // Keep mini player visible when paused
    } else {
      // No current song
      isPlaying.value = false;
      isNowPlayingTileVisible.value = false;
    }
  }

  Future<String?> getCurrentSongId() async {
    try {
      // Get the current index
      final currentIndex = _player.currentIndex;

      // Check if the index is valid
      if (currentIndex == null || currentIndex >= _playlist.length) {
        return null;
      }

      // Get the AudioSource at the current index
      final currentSource = _playlist.children[currentIndex];

      // Check if it's a UriAudioSource and has a MediaItem tag
      if (currentSource is UriAudioSource) {
        final mediaItem = currentSource.tag as MediaItem?;
        return mediaItem?.id;
      }

      return null;
    } catch (e) {
      print('Error getting current song ID: $e');
      return null;
    }
  }

  int? _previousIndex;

  factory AudioService() {
    _instance ??= AudioService._internal();
    return _instance!;
  }

  Future<void> setLoopMode(LoopMode mode) async {
    try {
      await _player.setLoopMode(mode);
      print('Loop mode set to: $mode');

      // When entering loop mode, need special handling
      if (mode == LoopMode.one) {
        // Reset tracking for current song
        final currentIndex = _player.currentIndex;
        if (currentIndex != null && currentIndex < _playlist.length) {
          final mediaItem = (_playlist.children[currentIndex] as UriAudioSource).tag as MediaItem?;
          if (mediaItem != null) {
            // Don't reset if we're already tracking it (let the first play finish counting)
            if (playCountTracker[mediaItem.id] == true) {
              print('PC_TRACKER: Entering loop mode but keeping current track count');
            }
          }
        }

        // Special handling for single loop mode when autoplay is off
        if (!autoplayNotifier.value) {
          print('Single loop mode with autoplay OFF: Ensuring mini player stays visible');
          // Ensure the mini player remains visible even when autoplay is off
          isNowPlayingTileVisible.value = true;
          updateNowPlayingState();
        }
      }
    } catch (e) {
      print('Error setting loop mode: $e');
    }
  }

  AudioService._internal() {
    if (!_isInitialized) {
      _initializeService();
      _setupConnectivityMonitoring();
      _setupAutoplayProtection(); // Add this line
    }
  }

  static void resetInstance() {
    if (_instance != null) {
      _instance!._cleanup();
      _instance = null;
    }
  }

  Future<void> fullCleanup() async {
    try {
      // Stop playback
      await _player.stop();

      // Set an empty playlist
      _playlist = ConcatenatingAudioSource(children: []);
      try {
        await _player.setAudioSource(_playlist);
      } catch (e) {
        print('Error setting empty audio source: $e');
      }

      // Cancel all subscriptions
      for (var subscription in _subscriptions) {
        await subscription.cancel();
      }
      _subscriptions.clear();

      // Cancel other subscriptions
      await _positionSubscription?.cancel();
      _positionSubscription = null;

      await _connectivitySubscription?.cancel();
      _connectivitySubscription = null;

      // Reset state variables
      _isShuffleEnabled = false;
      _isPlayCountIncremented = false;
      playCountTracker.clear();
      _wasPlayingBeforeDisconnect = false;

      print('AudioService fully cleaned up');
    } catch (e) {
      print('Error during audio service cleanup: $e');
    }
  }

  // Add this new method to setup connectivity monitoring
  void _setupConnectivityMonitoring() {
    _connectivitySubscription = _connectivity.onConnectivityChanged.listen(_handleConnectivityChange);
    // Check initial connectivity
    _connectivity.checkConnectivity().then(_handleConnectivityChange);
  }

  // Add this method to handle connectivity changes
  void _handleConnectivityChange(ConnectivityResult result) {
    bool hasConnection = result != ConnectivityResult.none;

    if (!hasConnection) {
      // Connection lost
      _wasPlayingBeforeDisconnect = _player.playing;
      if (_player.playing) {
        print('Connection lost, pausing playback');
        _player.pause();
      }
    } else {
      // Connection restored
      print('Connection restored, checking playback state');
      // Add a small delay to ensure connection is stable
      Future.delayed(Duration(milliseconds: 1500), () {
        checkAndRecoverPlayback();
      });
    }
  }

  Future<void> _cleanup() async {
    try {
      // Cancel all stream subscriptions
      for (var subscription in _subscriptions) {
        await subscription.cancel();
      }
      _subscriptions.clear();

      // Cancel position subscription
      await _positionSubscription?.cancel();
      _positionSubscription = null;

      // Cancel connectivity subscription
      await _connectivitySubscription?.cancel();
      _connectivitySubscription = null;

      // Stop and dispose player
      if (_isInitialized) {
        await _player.stop();
        await _player.dispose();
      }

      // Reset all state variables
      _playlist = ConcatenatingAudioSource(children: []);
      _isShuffleEnabled = false;
      _isPlayCountIncremented = false;
      playCountTracker.clear();
      _isInitialized = false;
      _wasPlayingBeforeDisconnect = false;

      print('AudioService cleanup completed');
    } catch (e) {
      print('Error during AudioService cleanup: $e');
    }
  }

  Future<void> reinitialize() async {
    print('Reinitializing AudioService');
    await _cleanup();
    _initializeService();
  }

  void _initializeService() {
    if (_isInitialized) {
      print('AudioService is already initialized.');
      return;
    }

    _player = AudioPlayer();
    _playlist = ConcatenatingAudioSource(children: []);
    _initializePlayer();
    autoplayNotifier.addListener(() {
      print('Autoplay setting changed: ${autoplayNotifier.value}');
    });
    shuffleNotifier.addListener(() async {
      await toggleShuffleMode(shuffleNotifier.value);
    });
    _isInitialized = true;
  }

  AudioPlayer get player => _player;
  bool get isShuffleEnabled => _isShuffleEnabled;

  Stream<int?> get currentIndexStream => _player.currentIndexStream;
  List<AudioSource> get currentQueue => _playlist.children;

  Future<void> addSongToQueue(Map<String, String> song) async {
    print('Adding song to queue: ${song['title']} by ${song['artist']}');
    // Get source info with fallbacks
    final source = song['source'] ??
        song['playlistName'] ??
        song['genre'] ??
        song['sourceType'] ??
        'Latest Music';
    final audioSource = AudioSource.uri(
      Uri.parse(song['streamingUrl']!),
      tag: MediaItem(
        id: song['song_id']!,
        title: song['title']!,
        artist: song['artist']!,
        album: song['albumName'] ?? 'Unknown Album', // Set album field
        artUri: Uri.parse(song['coverPage'] ?? song['albumCoverUrl'] ?? 'assets/kill.png'),
        extras: {
          'albumId': song['album_id'],       // ✅ Added
          'artistId': song['user_id'],       // ✅ Added
          'languages': song['languages'] ?? 'unknown',
          'genre': song['genre'] ?? 'unknown',
          'source': source,
          'playlistName': song['playlistName'] ?? 'unknown',
          'sourceType': song['sourceType'] ?? 'playlist',
        },
      ),
    );
    await _playlist.add(audioSource);
    print('Song added to queue with source: $source');
  }

  Future<void> removeSongFromQueue(int index) async {
    if (index < _playlist.length) {
      await _playlist.removeAt(index);
      print('Song removed from queue at index: $index');
    } else {
      print('Index out of range.');
    }
  }

  AudioProcessingState _mapProcessingState(ProcessingState processingState) {
    switch (processingState) {
      case ProcessingState.idle:
        return AudioProcessingState.idle;
      case ProcessingState.loading:
        return AudioProcessingState.loading;
      case ProcessingState.buffering:
        return AudioProcessingState.buffering;
      case ProcessingState.ready:
        return AudioProcessingState.ready;
      case ProcessingState.completed:
        return AudioProcessingState.completed;
      default:
        return AudioProcessingState.idle;
    }
  }

  MediaItem _getCurrentMediaItem() {
    final index = _player.currentIndex;
    if (index != null && index < _playlist.children.length) {
      return (_playlist.children[index] as UriAudioSource).tag as MediaItem;
    }
    return MediaItem(id: '', title: 'Unknown');
  }

  Stream<String?> get currentSongIdStream => _currentSongIdController.stream;
  final _currentSongIdController = StreamController<String?>.broadcast();

  // Update this whenever the current song changes
  void _updateCurrentSongId(String? songId) {
    _currentSongIdController.add(songId);
  }

  Future<void> dispose() async {
    // Do nothing to prevent accidental disposal
    print('Dispose called but ignored to preserve audio state');
  }

  Future<void> safeDispose() async {
    if (_isInitialized) {
      await _cleanup();
      try {
        await _player.stop();
        await _positionSubscription?.cancel();
        await _player.dispose();
        _isInitialized = false;
      } catch (e) {
        print('Error during safe dispose: $e');
      }
    }
  }

  Future<void> _clearPersistentData() async {
    // Implement logic to clear any persistent data related to the audio player
    // This could involve deleting shared preferences, clearing a local database, or removing files
    await _clearSharedPreferences();

    print('Persistent data related to the audio player has been cleared.');
  }

  Future<void> _clearSharedPreferences() async {
    // Implement logic to clear shared preferences
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }

  Future<void> _initializePlayer() async {
    try {
      setupPlayCountTracking();
      await _player.setAudioSource(_playlist);
      print('Initialized player with empty playlist.');

      // Set loop mode based on autoplay setting
      await _player.setLoopMode(autoplayNotifier.value ? LoopMode.all : LoopMode.off);
      await _player.setAllowsExternalPlayback(false);

      // Listen for autoplay changes to update loop mode accordingly
      autoplayNotifier.addListener(() {
        _player.setLoopMode(autoplayNotifier.value ? LoopMode.all : LoopMode.off);
        print('Autoplay changed to: ${autoplayNotifier.value}, updated loop mode accordingly');
      });

      _player.playbackEventStream.listen((event) {
        final controls = [
          MediaControl.skipToPrevious,
          if (_player.playing) MediaControl.pause else MediaControl.play,
          MediaControl.skipToNext,
        ];

        final state = PlaybackState(
          controls: controls,
          systemActions: const {
            MediaAction.play,
            MediaAction.pause,
            MediaAction.skipToNext,
            MediaAction.skipToPrevious,
          },
          androidCompactActionIndices: const [0, 1, 3],
          processingState: _mapProcessingState(_player.processingState),
          playing: _player.playing,
          updatePosition: _player.position,
          bufferedPosition: _player.bufferedPosition,
          speed: _player.speed,
        );

        print("Player state updated: $state");
      });

      // Flag to prevent concurrent processing of events
      bool isProcessing = false;

      // Listen for playback completion to control whether the next song plays
      _player.processingStateStream.listen((processingState) async {
        if (isProcessing) return;

        if (processingState == ProcessingState.completed) {
          print('Song completed, checking autoplay state.');
          isProcessing = true;

          await handleSongCompletion(_player.currentIndex ?? 0);
          isProcessing = false;
        }
      });

      // Listen for changes in the current index to update the UI
      _player.currentIndexStream.listen((index) async {
        if (index != null && index < _playlist.length) {
          final mediaItem = (_playlist.children[index] as UriAudioSource).tag as MediaItem?;
          if (mediaItem != null) {
            ProfileManager().updateCurrentlyPlayingSong(mediaItem.id);
            print('Current song changed to: ${mediaItem.title} by ${mediaItem.artist}');
            _startTrackingPlayCount(mediaItem);
            updateNowPlayingState();
          } else {
            print('Error: MediaItem is null or unavailable.');
          }
        } else {
          print('Error: Invalid index or playlist is empty.');
        }
      });

      // Ensure UI updates on playback state changes
      _player.playingStream.listen((playing) {
        isPlaying.value = playing;
        if (!playing) {
          isNowPlayingTileVisible.value = false;
        }
        updateNowPlayingState();
      });

      _listenForDurationChanges();
      _listenForSequenceStateChanges();

      print('Player listeners set.');
    } catch (e) {
      print('Error initializing player: $e');
    }
  }

  bool get isActive => _isInitialized && _player.playing;

  // Add method to preserve current state
  Map<String, dynamic> preserveState() {
    return {
      'currentIndex': _player.currentIndex,
      'position': _player.position,
      'playing': _player.playing,
      'shuffleEnabled': _isShuffleEnabled,
    };
  }

  // Add method to restore state
  Future<void> restoreState(Map<String, dynamic> state) async {
    if (!_isInitialized) {
      _initializeService();
    }

    try {
      final currentIndex = state['currentIndex'] as int?;
      final position = state['position'] as Duration?;
      final playing = state['playing'] as bool?;

      if (currentIndex != null && currentIndex < _playlist.length) {
        await _player.seek(position ?? Duration.zero, index: currentIndex);
        if (playing == true) {
          await _player.play();
        }
      }
    } catch (e) {
      print('Error restoring audio state: $e');
    }
  }

  Future<void> play() async => await _player.play();
  Future<void> pause() async => await _player.pause();
  Future<void> skipToNext() async => await _player.seekToNext();
  Future<void> skipToPrevious() async => await _player.seekToPrevious();

  void _startTrackingPlayCount(MediaItem mediaItem) {
    _positionSubscription?.cancel();

    print('Tracking play count for song: ${mediaItem.title}, ID: ${mediaItem.id}');

    if (!playCountTracker.containsKey(mediaItem.id)) {
      playCountTracker[mediaItem.id] = false;
    }

    _positionSubscription = _player.positionStream.listen((position) {
      if (_player.playing) {
        if (position.inSeconds >= 30 && playCountTracker[mediaItem.id] != true) {
          print('30 seconds reached for song: ${mediaItem.title}. Incrementing play count.');
          _incrementPlayCount(mediaItem.id);
          playCountTracker[mediaItem.id] = true;
        }
      }
    });
  }

  void setupPlayCountTracking() {
    // Cancel existing timer if any
    _playCountTimer?.cancel();
    
    _playCountTimer = Timer.periodic(Duration(seconds: 2), (timer) async {
      try {
        if (!_player.playing) return;

        final currentIndex = _player.currentIndex;
        if (currentIndex == null || currentIndex >= _playlist.length) return;

        final currentSong = (_playlist.children[currentIndex] as UriAudioSource).tag as MediaItem?;
        if (currentSong == null || currentSong.id.isEmpty) {
          print('PC_TRACKER: Invalid song or song ID, skipping.');
          return;
        }

        final position = _player.position;
        final duration = _player.duration;

        print('PC_TRACKER: Song ${currentSong.title} (ID: ${currentSong.id}) at position ${position.inSeconds}s');

        // Check for song loop/reset
        if (_previousPosition.inSeconds > 30 && position.inSeconds < 5) {
          _positionJumped = true;
          print('PC_TRACKER: Position jump detected! Likely a song loop.');
          playCountTracker[currentSong.id] = false;
        }
        _previousPosition = position;

        if (!playCountTracker.containsKey(currentSong.id)) {
          playCountTracker[currentSong.id] = false;
        }

        // Increment play count when threshold is reached
        if ((position.inSeconds >= 30 || (duration != null && position.inSeconds >= duration.inSeconds - 1)) &&
            playCountTracker[currentSong.id] != true) {
          print('PC_TRACKER: Threshold reached for song ${currentSong.title}. Incrementing play count.');
          playCountTracker[currentSong.id] = true;
          await directIncrementPlayCount(currentSong.id);
        }

        // Handle song ending with autoplay off
        // Check if we're near the end of the song (within 2 seconds)
        if (duration != null && !autoplayNotifier.value &&
            position.inSeconds >= duration.inSeconds - 2) {
          print('PC_TRACKER: Song about to end with autoplay off. Loading next song but will stop it.');

          // Use the centralized handler for consistent behavior
          await handleSongCompletion(currentIndex);
          return;
        }
      } catch (e) {
        print('PC_TRACKER: Error in play count timer: $e');
      }
    });

    _player.sequenceStateStream.listen((sequenceState) {
      try {
        final currentIndex = _player.currentIndex;
        if (currentIndex == null || currentIndex >= _playlist.length) return;

        final currentSong = (_playlist.children[currentIndex] as UriAudioSource).tag as MediaItem?;
        if (currentSong == null || currentSong.id.isEmpty) return;

        if (!_previousSongId.isEmpty && _previousSongId != currentSong.id) {
          print('PC_TRACKER: New song detected. Resetting tracker for ${currentSong.title}');
          playCountTracker[currentSong.id] = false;
        }
        _previousSongId = currentSong.id;
      } catch (e) {
        print('PC_TRACKER: Error in sequence state listener: $e');
      }
    });

    _player.positionStream.listen((position) {
      try {
        if (_player.loopMode != LoopMode.one) return;

        if (_positionJumped) {
          _positionJumped = false;
          final currentIndex = _player.currentIndex;
          if (currentIndex != null && currentIndex < _playlist.children.length) {
            final currentSong = (_playlist.children[currentIndex] as UriAudioSource).tag as MediaItem?;
            if (currentSong != null) {
              print('PC_TRACKER: Confirmed loop reset for ${currentSong.title}');
              playCountTracker[currentSong.id] = false;
            }
          }
        }
      } catch (e) {
        print('PC_TRACKER: Error in position listener: $e');
      }
    });
  }

  Future<void> directIncrementPlayCount(String songId) async {
    print('PC_TRACKER: Starting play count increment for $songId');

    if (songId.isEmpty) {
      print('PC_TRACKER: Cannot increment play count - song ID is empty');
      return;
    }

    final userId = ProfileManager().getUserId() ?? '';
    if (userId.isEmpty) {
      print('PC_TRACKER: Cannot increment play count - user ID is empty');
      return;
    }

    try {
      final response = await ApiService.incrementPlayCount(songId, userId);
      
      if (response.statusCode == 200) {
        print('PC_TRACKER: Successfully incremented play count for song ID: $songId');
        print('PC_TRACKER: API Response: ${response.body}');
      } else {
        print('PC_TRACKER: Failed to increment play count. Status code: ${response.statusCode}');
        print('PC_TRACKER: Error response: ${response.body}');
      }
    } catch (e) {
      print('PC_TRACKER: Error during API call: $e');
    }
  }

  // Increment the play count for a song
  Future<void> _incrementPlayCount(String songId) async {
    final userId = ProfileManager().getUserId();
    if (userId == null || userId.isEmpty) {
      print('Cannot increment play count - user ID is empty');
      return;
    }

    try {
      final response = await ApiService.incrementPlayCount(songId, userId);
      
      if (response.statusCode == 200) {
        print('Successfully incremented play count for song ID: $songId');
      } else {
        print('Failed to increment play count. Status code: ${response.statusCode}');
      }
    } catch (e) {
      print('Error incrementing play count: $e');
    }
  }

  Future<void> clearPlaylist() async {
    try {
      // Stop playback before clearing the playlist
      await _player.stop();
      print('Player stopped');

      // Give the system time to release resources
      await Future.delayed(const Duration(milliseconds: 500));

      // Reset the audio source by setting an empty playlist
      _playlist = ConcatenatingAudioSource(children: []);
      await _player.setAudioSource(_playlist);
      print('Playlist cleared');
    } catch (e) {
      print('Failed to clear playlist: $e');
    }
  }

  Future<void> reset() async {
    try {
      // Stop current playback
      await _player.stop();

      // Clear the playlist
      _playlist = ConcatenatingAudioSource(children: []);

      // Reset all state variables
      // _isShuffleEnabled = false;
      _isPlayCountIncremented = false;
      playCountTracker.clear();

      print('AudioService reset completed');
    } catch (e) {
      print('Error resetting AudioService: $e');
    }
  }

  Future<bool> loadPlaylist(List<Map<String, String>> songs, {int initialIndex = 0}) async {
    try {
      if (songs.isEmpty) {
        print('Error: Cannot load empty playlist');
        return false;
      }

      print('Loading playlist with ${songs.length} songs. Initial song index: $initialIndex');

      try {
        await _player.stop().timeout(Duration(milliseconds: 800), onTimeout: () {
          print('Player stop timed out, continuing');
        });
      } catch (e) {
        print('Error stopping player: $e');
      }

      await Future.delayed(Duration(milliseconds: 100));

      initialIndex = initialIndex.clamp(0, songs.length - 1);

      final validSongs = songs.where((song) {
        bool isValid = song['streamingUrl'] != null &&
            song['streamingUrl']!.isNotEmpty &&
            song['song_id'] != null &&
            song['song_id']!.isNotEmpty;
        if (!isValid) {
          print('Skipping invalid song: ${song['title']} - Missing ${song['streamingUrl'] == null ? 'streamingUrl' : 'song_id'}');
        } else {
          print('Valid song: ${song['title']} with URL length: ${song['streamingUrl']!.length}');
        }
        return isValid;
      }).toList();

      if (validSongs.isEmpty) {
        print('No valid songs with streaming URLs found');
        return false;
      }

      _playlist = ConcatenatingAudioSource(children: []);
      try {
        await _player.setAudioSource(_playlist);
        print('Cleared existing playlist');
      } catch (e) {
        print('Error clearing playlist: $e');
      }

      final audioSources = <AudioSource>[];
      for (var song in validSongs) {
        try {
          print('Adding song to playlist: ${song['title']} by ${song['artist']}');
          final streamingUrl = song['streamingUrl']!.trim();

          Uri artUri;
          try {
            artUri = song['coverPage'] != null && song['coverPage']!.isNotEmpty
                ? Uri.parse(song['coverPage']!)
                : Uri.parse('https://example.com/mic.jpg');
          } catch (e) {
            print('Error parsing cover page URL: $e');
            artUri = Uri.parse('https://example.com/mic.jpg');
          }

          final source = song['genre'] ?? song['artist'] ?? song['playlistName'] ?? 'Music';

          Duration? songDuration;
          try {
            if (song['duration'] != null && song['duration']!.isNotEmpty) {
              songDuration = _parseDuration(song['duration']!);
              print('Parsed duration for ${song['title']}: ${songDuration.toString()}');
            } else {
              print('No duration provided for song: ${song['title']}');
              songDuration = null; // Allow null duration
            }
          } catch (e) {
            print('Error parsing duration for ${song['title']}: $e');
            songDuration = null;
          }

          audioSources.add(AudioSource.uri(
            Uri.parse(streamingUrl),
            tag: MediaItem(
              id: song['song_id']!,
              album: song['album'] ?? 'Unknown Album',
              title: song['title'] ?? 'Unknown Title',
              artist: song['artist'] ?? 'Unknown Artist',
              duration: songDuration,
              artUri: artUri,
              extras: {
                'albumId': song['album_id'],       // ✅ Added
                'artistId': song['user_id'],       // ✅ Added
                'languages': song['languages'] ?? 'unknown',
                'genre': song['genre'] ?? 'unknown',
                'artist': song['artist'] ?? 'unknown',
                'source': source,
                'playlistName': song['playlistName'] ?? 'unknown',
                'sourceType': song['sourceType'] ?? 'playlist',
              },
            ),
          ));
        } catch (e) {
          print('Error creating AudioSource for song: ${song['title']} - $e');
        }
      }

      if (audioSources.isEmpty) {
        print('No valid audio sources could be created');
        return false;
      }

      initialIndex = initialIndex.clamp(0, audioSources.length - 1);

      _playlist = ConcatenatingAudioSource(children: audioSources);

      try {
        await _player.setAudioSource(_playlist, initialIndex: initialIndex).timeout(Duration(seconds: 5), onTimeout: () {
          print('Set audio source timeout, but continuing');
          return;
        });

        await Future.delayed(Duration(milliseconds: 300));

        await _player.play().timeout(Duration(seconds: 3), onTimeout: () {
          print('Play command timeout, but continuing');
          return;
        });

        print('New playlist set, playing the song.');
        return true;
      } catch (e) {
        if (e.toString().contains('single player instance')) {
          print('Known player instance issue: $e - attempting recovery');
          await reinitialize();
          return true;
        }
        print('Error setting up playlist: $e');
        return false;
      }
    } catch (e) {
      print('Comprehensive error in loadPlaylist: $e');
      return false;
    }
  }

  Future<void> checkAndRecoverPlayback() async {
    final connectivityResult = await _connectivity.checkConnectivity();
    final hasConnection = connectivityResult != ConnectivityResult.none;

    if (hasConnection && !_player.playing && _wasPlayingBeforeDisconnect) {
      // We have connection, player is stopped, but should be playing
      print('Recovery: Connection available but playback stopped. Attempting to restart playback.');

      // Get current song info for diagnostics
      final currentIndex = _player.currentIndex;
      final mediaItem = currentIndex != null && currentIndex < _playlist.children.length
          ? (_playlist.children[currentIndex] as UriAudioSource).tag as MediaItem
          : null;

      print('Current song: ${mediaItem?.title ?? 'Unknown'}, Position: ${_player.position}');

      try {
        // Try to resume playback
        await _player.play();
        print('Recovery: Playback successfully restarted');
      } catch (e) {
        print('Recovery: Failed to restart playback: $e');

        // If simple restart fails, try more aggressive recovery
        if (_playlist.children.isNotEmpty) {
          try {
            // Try seeking to reset the player
            await _player.seek(_player.position, index: currentIndex ?? 0);
            await Future.delayed(Duration(milliseconds: 300));
            await _player.play();
            print('Recovery: Advanced recovery successful');
          } catch (e) {
            print('Recovery: Advanced recovery failed: $e');
          }
        }
      }
    }
  }

  Duration _parseDuration(String durationString) {
    List<String> parts = durationString.split(':').reversed.toList();
    int hours = parts.length > 2 ? int.parse(parts[2]) : 0;
    int minutes = parts.length > 1 ? int.parse(parts[1]) : 0;
    int seconds = int.parse(parts[0]);
    return Duration(hours: hours, minutes: minutes, seconds: seconds);
  }

  Future<void> toggleShuffleMode(bool enableShuffle) async {
    try {
      if (enableShuffle) {
        await _player.shuffle();
      }
      await _player.setShuffleModeEnabled(enableShuffle);
      print(enableShuffle ? 'Shuffle enabled' : 'Shuffle disabled');
    } catch (e) {
      print('Error toggling shuffle mode: $e');
    }
  }

  // Add this method to handle song completion
  Future<void> handleSongCompletion(int currentIndex) async {
    print('Handling song completion with autoplay: ${autoplayNotifier.value}');

    // Check if we're in single loop mode
    if (_player.loopMode == LoopMode.one) {
      print('Single loop mode detected: Ensuring mini player stays visible');
      // Always keep the mini player visible in single loop mode
      isNowPlayingTileVisible.value = true;
      updateNowPlayingState();
      // In single loop mode, the player will automatically restart the song
      return;
    }

    if (!autoplayNotifier.value) {
      // When autoplay is off, allow next song to load but immediately stop it
      print('Autoplay is OFF: Loading next song but stopping playback');

      if (_player.hasNext) {
        // Move to next song
        await _player.seekToNext();

        // Wait a brief moment for the next song to load
        await Future.delayed(Duration(milliseconds: 300));

        // Then stop playback completely instead of just pausing
        await _player.stop();

        // Set loop mode to off to prevent further automatic playback
        await _player.setLoopMode(LoopMode.off);

        // Update UI state
        isPlaying.value = false;
        isNowPlayingTileVisible.value = true;
        updateNowPlayingState();

        print('Autoplay is OFF: Next song loaded and stopped');
      } else {
        // At the end of playlist
        print('Autoplay is OFF: End of playlist reached');
        await _player.stop();
        await _player.setLoopMode(LoopMode.off);
        await _player.seek(Duration.zero, index: 0);
        isPlaying.value = false;
        isNowPlayingTileVisible.value = true;
        updateNowPlayingState();
      }
    } else if (_player.hasNext) {
      // When autoplay is on and there's a next song, play it
      print('Autoplay is ON: Moving to next song');
      await _player.seekToNext();
      await _player.play();
    } else if (_player.loopMode == LoopMode.all) {
      // When autoplay is on, at the end of playlist, and loop all is enabled
      print('Autoplay is ON: End of playlist, looping to beginning');
      await _player.seek(Duration.zero, index: 0);
      await _player.play();
    } else {
      // When autoplay is on but no next song and not looping
      print('Autoplay is ON: End of playlist, stopping playback');
      await _player.stop();
      isPlaying.value = false;
      isNowPlayingTileVisible.value = false;
      updateNowPlayingState();
    }
  }

  void _listenForDurationChanges() {
    _player.durationStream.listen((duration) {
      final currentIndex = _player.currentIndex;
      if (currentIndex != null && currentIndex < _playlist.length) {
        final mediaItem = (_playlist.children[currentIndex] as UriAudioSource).tag as MediaItem;
        print('Duration changed for: ${mediaItem.title}, New Duration: $duration');
      }
    });
  }

  void _listenForCurrentSongIndexChanges() {
    _player.currentIndexStream.listen((index) {
      if (index != null && index < _playlist.length) {
        final mediaItem = (_playlist.children[index] as UriAudioSource).tag as MediaItem;
        print('Current song changed to: ${mediaItem.title} by ${mediaItem.artist}');
      }
    });
  }

  void _listenForSequenceStateChanges() {
    _player.sequenceStateStream.listen((sequenceState) {
      final sequence = sequenceState?.effectiveSequence;
      if (sequence != null && sequence.isNotEmpty) {
        final items = sequence.map((source) => (source as UriAudioSource).tag as MediaItem).toList();
        print('Playlist sequence state updated with ${items.length} items.');
      }
    });
  }

  void _setupAutoplayProtection() {
    _player.currentIndexStream.listen((index) async {
      if (index == null) return;

      // If autoplay is off and index changed (meaning a new song started)
      if (!autoplayNotifier.value && _previousIndex != null && _previousIndex != index) {
        print('AUTOPLAY PROTECTION: Detected song change with autoplay OFF');
        print('Previous index: $_previousIndex, New index: $index');

        // Allow the song to load but immediately stop it
        if (_player.playing) {
          print('AUTOPLAY PROTECTION: Stopping playback of new song');
          await _player.stop();

          // Set loop mode to off to prevent further automatic playback
          await _player.setLoopMode(LoopMode.off);

          // Update UI state
          isPlaying.value = false;
          isNowPlayingTileVisible.value = true;
          updateNowPlayingState();

          print('AUTOPLAY PROTECTION: New song loaded and stopped');
        }
      }

      _previousIndex = index;
    });
  }
}