// nowplaying.dart
import 'dart:async';
import 'dart:ui' as ui;
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';
import 'package:just_audio_background/just_audio_background.dart';
import 'package:marquee/marquee.dart';
import './SongStatusManager.dart';
import './audio_service1.dart';
import './profile_manager.dart';
import './musicplayer.dart';
import './main.dart';

class NowPlayingTile extends StatefulWidget {
  final String email;
  final String userFullName;
  final String userCategory;

  const NowPlayingTile({
    Key? key,
    required this.email,
    required this.userFullName,
    required this.userCategory,
  }) : super(key: key);

  @override
  _NowPlayingTileState createState() => _NowPlayingTileState();
}

class _NowPlayingTileState extends State<NowPlayingTile> {
  final AudioService _audioService = AudioService();
  final SongStatusManager _statusManager = SongStatusManager();
  late ValueNotifier<String> songTitleNotifier = ValueNotifier<String>('Unknown');
  late ValueNotifier<String> artistNameNotifier = ValueNotifier<String>('Unknown Artist');
  StreamSubscription<SequenceState?>? _sequenceStateSubscription;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    _initializeSubscriptions();
  }

  void _initializeSubscriptions() {
    // Add a delay to ensure AudioService is properly initialized
    Future.delayed(Duration(milliseconds: 500), () {
      if (!mounted) return;

      // Check if there's a valid current media item before initializing
      final currentMediaItem = _audioService.player.sequenceState?.currentSource?.tag as MediaItem?;
      if (currentMediaItem != null && currentMediaItem.id.isNotEmpty) {
        songTitleNotifier.value = currentMediaItem.title;
        artistNameNotifier.value = currentMediaItem.artist ?? 'Unknown Artist';
        _safelyFetchSongStatus(currentMediaItem.id);
        _isInitialized = true;
        isNowPlayingTileVisible.value = true;
      }

      // Listen to sequence state changes
      _sequenceStateSubscription = _audioService.player.sequenceStateStream.listen((sequenceState) {
        if (!mounted) return;

        final mediaItem = sequenceState?.currentSource?.tag as MediaItem?;
        if (mediaItem != null && mediaItem.id.isNotEmpty) {
          songTitleNotifier.value = mediaItem.title;
          artistNameNotifier.value = mediaItem.artist ?? 'Unknown Artist';
          _safelyFetchSongStatus(mediaItem.id);
          _isInitialized = true;
        } else {
          // Reset the status if no valid media item
         // _statusManager.resetStatus();
          _isInitialized = false;
        }
      });

      // Add status manager listener
      _statusManager.isFavoriteNotifier.addListener(_onFavoriteStatusChanged);
    });
  }

  Future<void> _safelyFetchSongStatus(String songId) async {
    if (!mounted || songId.isEmpty) return;

    final userId = ProfileManager().getUserId();
    if (userId != null && userId.isNotEmpty) {
      try {
        await _statusManager.fetchStatus(songId, userId);
      } catch (e) {
        print('Error fetching song status: $e');
        // Reset status on error
        //_statusManager.resetStatus();
      }
    } else {
      print('Invalid user ID when fetching song status');
     // _statusManager.resetStatus();
    }
  }
  @override
  void dispose() {
    _sequenceStateSubscription?.cancel();
    songTitleNotifier.dispose();
    artistNameNotifier.dispose();
    _statusManager.isFavoriteNotifier.removeListener(_onFavoriteStatusChanged);
    super.dispose();
  }

  void _onFavoriteStatusChanged() {
    if (!mounted) return;
  }

  Future<void> _fetchSongStatus(String songId) async {
    if (!mounted) return;
    await _statusManager.fetchStatus(songId, ProfileManager().getUserId()!);
  }

  Future<void> _toggleFavorite() async {
    final songId = getCurrentSongId();
    if (songId != null) {
      final newFavoriteStatus = !_statusManager.isFavoriteNotifier.value;

      // First update UI immediately for responsive feel
      setState(() {
        _statusManager.isFavoriteNotifier.value = newFavoriteStatus;
        // Don't change celebration status here
      });

      // Then update the server, but preserve existing celebration status
      await _statusManager.updateFavoriteOnly(
          songId,
          ProfileManager().getUserId()!,
          newFavoriteStatus,
      );
    }
  }

  String? getCurrentSongId() {
    final mediaItem = _audioService.player.sequenceState?.currentSource?.tag as MediaItem?;
    return mediaItem?.id;
  }

  Widget _buildSongImage(String? imagePath) {
    return Padding(
      padding: const EdgeInsets.all(8.0),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(8.0),
        child: CachedNetworkImage(
          imageUrl: imagePath ?? '',
          height: 50,
          width: 50,
          fit: BoxFit.cover,
          errorWidget: (context, url, error) => Image.asset(
            'assets/mic.jpg',
            height: 50,
            width: 50,
            fit: BoxFit.cover,
          ),
        ),
      ),
    );
  }

  Widget _buildSongInfo() {
    return StreamBuilder<SequenceState?>(
      stream: _audioService.player.sequenceStateStream,
      builder: (context, snapshot) {
        final mediaItem = snapshot.data?.currentSource?.tag as MediaItem?;
        
        final title = mediaItem?.title ?? 'Unknown';
        final artist = mediaItem?.artist ?? 'Unknown Artist';

        return Expanded(
          child: Transform.translate(
            offset: Offset(-8, 0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  height: 21.4, // Adjust height to fit the text
                  child: title.length > 20 // Adjust threshold as needed
                      ? Marquee(
                    text: title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                    scrollAxis: Axis.horizontal,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    blankSpace: 20.0,
                    velocity: 30.0,
                    pauseAfterRound: Duration(seconds: 1),
                    startPadding: 0.0,
                    accelerationDuration: Duration(seconds: 1),
                    accelerationCurve: Curves.linear,
                    decelerationDuration: Duration(milliseconds: 500),
                    decelerationCurve: Curves.easeOut,
                  )
                      : Text(
                    title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  artist,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.grey,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildFavoriteButton() {
    return ValueListenableBuilder<bool>(
      valueListenable: _statusManager.isFavoriteNotifier,
      builder: (context, isFavorite, child) {
        return GestureDetector(
          onTap: _toggleFavorite,
          child: Image.asset(
            isFavorite
                ? 'assets/final_smile_fill_new_new.png'
                : 'assets/final_smile_empty_new_new.png',
            width: 33,
            height: 33,
          ),
        );
      },
    );
  }

  Widget _buildPlaybackControls() {
    return StreamBuilder<Duration?>(
      stream: _audioService.player.positionStream,
      builder: (context, snapshot) {
        final position = snapshot.data ?? Duration.zero;
        final totalDuration = _audioService.player.duration ?? Duration.zero;
        final progress = totalDuration.inMilliseconds > 0
            ? position.inMilliseconds / totalDuration.inMilliseconds
            : 0.0;

        return Stack(
          alignment: Alignment.center,
          children: [
            SizedBox(
              width: 35,
              height: 35,
              child: CircularProgressIndicator(
                value: progress,
                strokeWidth: 3,
                valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFD9D9D9)),
                backgroundColor: Color(0xFF545454),
              ),
            ),
            StreamBuilder<bool>(
              stream: _audioService.player.playingStream,
              builder: (context, playingSnapshot) {
                final isPlaying = playingSnapshot.data ?? false;
                return IconButton(
                  icon: Icon(
                    isPlaying ? Icons.pause : Icons.play_arrow,
                    size: 27,
                  ),
                  onPressed: () {
                    if (isPlaying) {
                      _audioService.player.pause();
                    } else {
                      _audioService.player.play();
                    }
                  },
                );
              },
            ),
          ],
        );
      },
    );
  }

  void _navigateToMusicPlayer() {
    if (!mounted) return;
    final mediaItem = _audioService.player.sequenceState?.currentSource?.tag as MediaItem?;
    final source = mediaItem?.extras?['source'] ??
        mediaItem?.extras?['playlistName'] ??
        mediaItem?.extras?['genre'] ??
        mediaItem?.genre ??
        'Latest Music'; // Changed from 'Unknown S' to a more meaningful default
    final bool isCurrentlyPlaying = _audioService.player.playing;
    final Duration currentPosition = _audioService.player.position;

    print('Selected source for navigation: $source');
    print('MediaItem extras: ${mediaItem?.extras}');
    print('MediaItem genre: ${mediaItem?.genre}');
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => MusicPlayerPage(
          navigationIndex: 0,
          email: widget.email,
          currentIndex: _audioService.player.currentIndex ?? 0,
          userfullname: widget.userFullName,
          userCategory: widget.userCategory,
          sourceType: 'playlist',  // Add this
          sourceName: source,      // Add this
          initialPlaybackState: isCurrentlyPlaying,
          initialPosition: currentPosition,
        ),
      ),
    ).then((_) {
      if (mounted) {
        isNowPlayingTileVisible.value = true;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<bool>(
      valueListenable: isNowPlayingTileVisible,
      builder: (context, isVisible, child) {
        if (!isVisible) return const SizedBox();

        return StreamBuilder<SequenceState?>(
          stream: _audioService.player.sequenceStateStream,
          builder: (context, snapshot) {
            final mediaItem = snapshot.data?.currentSource?.tag as MediaItem?;

            if (mediaItem == null) return const SizedBox();

            return GestureDetector(
              onTap: _navigateToMusicPlayer,
              child: Container(
                height: 70,
                decoration: BoxDecoration(
                  // color: const Color.fromARGB(255, 9, 21, 34),
                  color: Color(0xFF151415),
                  borderRadius: BorderRadius.circular(12.0),
                ),
                child: Row(
                  children: [
                    _buildSongImage(mediaItem.artUri?.toString()),
                    const SizedBox(width: 12),
                    _buildSongInfo(),
                    const SizedBox(width: 12),
                    _buildFavoriteButton(),
                    const SizedBox(width: 12),
                    _buildPlaybackControls(),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }
}