// queuepage.dart
import 'package:flutter/material.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:just_audio/just_audio.dart';
import 'package:just_audio_background/just_audio_background.dart';
import 'package:marquee/marquee.dart';
import 'package:voiceapp/audio_service1.dart';
import 'package:voiceapp/main.dart';
import 'package:voiceapp/notifiers.dart';
import 'package:voiceapp/nowplaying.dart';

import 'bottomnavigationbar.dart';

class QueuePage extends StatefulWidget {
  final String userId;
  final String userfullname;
  final String category;
  final int? navigationIndex;

  QueuePage({required this.userId, required this.userfullname,required this.category,this.navigationIndex,});

  @override
  _QueuePageState createState() => _QueuePageState();
}

class _QueuePageState extends State<QueuePage> {
  late List<AudioSource> _queue;
  late AudioPlayer _player;
  int? _currentIndex;
  final ScrollController _scrollController = ScrollController();
  bool _isFirstBuild = true;
  final double nowPlayingHeight = 80.0;
  bool _showOnlyCurrentSong = false; // Flag to control whether to show only current song

  @override
  void initState() {
    super.initState();
    _player = AudioService().player;
    _queue = AudioService().currentQueue;
    _currentIndex = _player.currentIndex;

    _player.currentIndexStream.listen((index) {
      setState(() {
        _currentIndex = index;
      });
      if (index != null) {
        _scrollToCurrentSong(index);
      }
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToCurrentSong(int index) {
    if (!_scrollController.hasClients) return;

    // Calculate position (each item height + padding)
    double itemHeight = 90.0;
    double offset = index * itemHeight;

    // Get viewport height (subtract NowPlayingTile height)
    double viewportHeight = _scrollController.position.viewportDimension - nowPlayingHeight;

    // Calculate scroll target to center the item
    double targetOffset = offset - (viewportHeight - itemHeight) / 2;

    // Keep scroll position within bounds
    targetOffset = targetOffset.clamp(
        0.0,
        _scrollController.position.maxScrollExtent
    );

    // Animate to position
    _scrollController.animateTo(
      targetOffset,
      duration: Duration(milliseconds: 400),
      curve: Curves.easeInOut,
    );
  }

  Future<void> _removeFromQueue(int index) async {
    await AudioService().removeSongFromQueue(index);
    setState(() {
      _queue = AudioService().currentQueue;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isFirstBuild && _currentIndex != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _scrollToCurrentSong(_currentIndex!);
        _isFirstBuild = false;
      });
    }

    Widget content = GradientScaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        titleSpacing: 0,
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Padding(
          padding: const EdgeInsets.only(left: 0.0, top: 0.0),
          // child: Image.asset(
          //   'assets/logo.png',
          //   height: 50,
          // ),
        ),
        leading: Container(
          margin: EdgeInsets.all(8.0),
          decoration: BoxDecoration(
            color: Color(0xFF010000),  // Black circle background
            shape: BoxShape.circle,  // Makes the container circular
          ),
          child: IconButton(
            icon: Padding(
              padding: const EdgeInsets.only(left:4.0),
              child: Icon(Icons.arrow_back_ios, color: Colors.white),
            ),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        actions: [
          // Toggle button to switch between showing all songs or just current song
          Container(
            margin: EdgeInsets.all(8.0),
            decoration: BoxDecoration(
              color: _showOnlyCurrentSong ? Color(0xFF2644D9) : Color(0xFF010000),
              shape: BoxShape.circle,
            ),
            // child: IconButton(
            //   icon: Icon(
            //     _showOnlyCurrentSong ? Icons.visibility : Icons.visibility_outlined,
            //     color: Colors.white,
            //   ),
            //   tooltip: _showOnlyCurrentSong ? 'Show all songs' : 'Show only current song',
            //   onPressed: () {
            //     setState(() {
            //       _showOnlyCurrentSong = !_showOnlyCurrentSong;
            //     });
            //   },
            // ),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.only(left: 16.0, top: 16.0, bottom: 16.0),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  "Thread",
                  style: TextStyle(
                    fontSize: 25,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 5.0),
                child: _queue.isEmpty
                    ? Center(
                  child: Text(
                    'No songs in queue.',
                    style: TextStyle(color: Colors.white, fontSize: 18),
                  ),
                )
                    : _showOnlyCurrentSong && _currentIndex != null
                    ? _buildCurrentSongView()
                    : ListView.builder(
                  controller: _scrollController,
                  padding: EdgeInsets.only(bottom: nowPlayingHeight + 20),
                  // Increase item count to include ad banner after the first 2 songs
                  itemCount: _queue.length + (_queue.length > 3 ? 1 : 0),
                  itemBuilder: (context, index) {
                    // Show ad banner only after the first 3 songs (at position 3)
                    if (index == 3) {
                      // Determine if we're in debug mode
                      bool isInDebugMode = false;
                      assert(isInDebugMode = true); // This will be true only in debug mode

                      // IMPORTANT: In debug mode, use test ad ID; in production, use real ad ID
                      String adUnitId;

                      if (isInDebugMode) {
                        adUnitId = 'ca-app-pub-3940256099942544/6300978111'; // Google's test ad ID
                        print('Using test ad ID in queue page: $adUnitId');
                      } else {
                        adUnitId = 'ca-app-pub-1147112055796547/5221124787'; // Production ad ID
                        print('Using production ad ID in queue page: $adUnitId');
                      }

                      return Container(
                        margin: EdgeInsets.symmetric(vertical: 10.0, horizontal: 8.0),
                        child: BannerAdWidget(adUnitId: adUnitId),
                      );
                    }

                    // Calculate the real queue index accounting for the ad banner
                    final int queueIndex = index > 2 ? index - 1 : index;

                    if (queueIndex < _queue.length && _queue[queueIndex] is UriAudioSource) {
                      final mediaItem = (_queue[queueIndex] as UriAudioSource).tag as MediaItem;
                      return _buildQueueItem(mediaItem, queueIndex);
                    }
                    return Container();
                  },
                ),
              ),
            ),
            Container(
              width: double.infinity,
              child: NowPlayingTile(
                email: widget.userId,
                userFullName: widget.userfullname,
                userCategory: 'Singer',
              ),
            ),
          ],
        ),
      ),
    );
    return PageWithBottomNav(
      child: content,
      email: widget.userId,
      fullName: widget.userfullname,
      category: widget.category,
      currentIndex: widget.navigationIndex ?? 0,  // 1 is for Search page
      isFromNewHomePage: false,
    );
  }
  Widget _buildQueueItem(MediaItem mediaItem, int index) {
    bool isCurrentSong = index == _currentIndex;
    final String language = mediaItem.extras?['languages'] ?? 'Unknown Language';

    return GestureDetector( // Added InkWell here
      onTap: () async {
        // Handle tap to play the selected song
        _player.seek(Duration.zero, index: index);
        _player.play();
        // Deactivate loop when selecting a new song
        loopNotifier.value = false;
        await loopNotifier.saveLoopState();
        await _player.setLoopMode(LoopMode.off);
      },
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 5.0),
          child: Container(
            decoration: BoxDecoration(
              color: isCurrentSong ? Color(0xFF211F20) : Colors.transparent,
              // color: isCurrentSong ? const Color.fromARGB(255, 84, 115, 201).withOpacity(0.5) : Colors.transparent,
              borderRadius: BorderRadius.circular(10),
              boxShadow: isCurrentSong ? [
                BoxShadow(
                  color: Colors.black.withOpacity(1),
                  spreadRadius: 2,
                  blurRadius: 4,
                  offset: Offset(0, 0), // changes position of shadow
                ),
              ] : [],
            ),
            margin: EdgeInsets.symmetric(horizontal: 2),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 5.0),
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(0.0),//10
                    child: Image.network(
                      mediaItem.artUri.toString(),
                      height: 60,
                      width: 60,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        return Image.asset(
                          'assets/mic.jpg',
                          height: 70,
                          width: 70,
                          fit: BoxFit.cover,
                        );
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SizedBox(
                          height: 21.4,
                          child: mediaItem.title.length > 25
                              ? Marquee(
                            text: mediaItem.title,
                            style: TextStyle(
                              color: isCurrentSong ? Color(0xFF2644D9) : Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                            scrollAxis: Axis.horizontal,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            blankSpace: 20.0,
                            velocity: 30.0,
                            startAfter: Duration(seconds: 2), // Added 1-second delay
                            pauseAfterRound: Duration(seconds: 1),
                            startPadding: 0.0,
                            accelerationDuration: Duration(seconds: 1),
                            accelerationCurve: Curves.linear,
                            decelerationDuration: Duration(milliseconds: 1000),
                            decelerationCurve: Curves.easeOut,
                          )
                              : Text(
                            mediaItem.title,
                            style:  TextStyle(
                              color: isCurrentSong ? Color(0xFF2644D9) : Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          mediaItem.artist ?? 'Unknown Artist',
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          language,
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Column(
                    children: [
                      Text(
                        _formatDuration(mediaItem.duration ?? Duration.zero),
                        style: TextStyle(color: isCurrentSong ? Color(0xFF2644D9) : Colors.white70,
                            fontSize: 14),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCurrentSongView() {
    if (_currentIndex == null || _currentIndex! >= _queue.length) {
      return Center(
        child: Text(
          'No song is currently playing',
          style: TextStyle(color: Colors.white, fontSize: 18),
        ),
      );
    }

    // Get the current song's media item
    final mediaItem = (_queue[_currentIndex!] as UriAudioSource).tag as MediaItem;

    return ListView(
      padding: EdgeInsets.only(bottom: nowPlayingHeight + 20),
      children: [
        // Current song header
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
          child: Text(
            "Now Playing",
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.white70,
            ),
          ),
        ),
        // Current song card with larger display
        Container(
          margin: EdgeInsets.all(16.0),
          decoration: BoxDecoration(
            color: Color(0xFF1E1E30),
            borderRadius: BorderRadius.circular(16.0),
            boxShadow: [
              BoxShadow(
                color: Colors.black26,
                offset: Offset(0, 4),
                blurRadius: 10.0,
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Album art
              ClipRRect(
                borderRadius: BorderRadius.vertical(top: Radius.circular(16.0)),
                child: Image.network(
                  mediaItem.artUri.toString(),
                  height: 250,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      height: 250,
                      color: Color(0xFF2A2A3A),
                      child: Icon(
                        Icons.music_note,
                        size: 80,
                        color: Colors.white54,
                      ),
                    );
                  },
                ),
              ),
              // Song details
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title
                    Text(
                      mediaItem.title,
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    SizedBox(height: 8),
                    // Artist
                    Text(
                      mediaItem.artist ?? 'Unknown Artist',
                      style: TextStyle(
                        fontSize: 18,
                        color: Colors.white70,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    SizedBox(height: 16),
                    // Duration
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Duration',
                          style: TextStyle(
                            fontSize: 16,
                            color: Colors.white60,
                          ),
                        ),
                        Text(
                          _formatDuration(mediaItem.duration ?? Duration.zero),
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        // Navigation buttons
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              // Previous song button
              IconButton(
                icon: Icon(Icons.skip_previous, color: Colors.white, size: 36),
                onPressed: _currentIndex! > 0 ? () {
                  _player.seekToPrevious();
                } : null,
              ),
              // Play/Pause button
              StreamBuilder<PlayerState>(
                stream: _player.playerStateStream,
                builder: (context, snapshot) {
                  final playerState = snapshot.data;
                  final processingState = playerState?.processingState;
                  final playing = playerState?.playing;

                  return Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                      color: Color(0xFF2644D9),
                      shape: BoxShape.circle,
                    ),
                    child: IconButton(
                      icon: Icon(
                        playing == true ? Icons.pause : Icons.play_arrow,
                        color: Colors.white,
                        size: 36,
                      ),
                      onPressed: () {
                        if (playing == true) {
                          _player.pause();
                        } else {
                          _player.play();
                        }
                      },
                    ),
                  );
                },
              ),
              // Next song button
              IconButton(
                icon: Icon(Icons.skip_next, color: Colors.white, size: 36),
                onPressed: _currentIndex! < _queue.length - 1 ? () {
                  _player.seekToNext();
                } : null,
              ),
            ],
          ),
        ),
      ],
    );
  }

  String _formatDuration(Duration duration) {
    String twoDigits(int n) => n.toString().padLeft(2, "0");
    String twoDigitMinutes = twoDigits(duration.inMinutes.remainder(60));
    String twoDigitSeconds = twoDigits(duration.inSeconds.remainder(60));
    return "$twoDigitMinutes:$twoDigitSeconds";
  }
}

class BannerAdWidget extends StatefulWidget {
  final String adUnitId;

  const BannerAdWidget({
    Key? key,
    required this.adUnitId,
  }) : super(key: key);

  @override
  _BannerAdWidgetState createState() => _BannerAdWidgetState();
}

class _BannerAdWidgetState extends State<BannerAdWidget> {
  BannerAd? _bannerAd;
  bool _isAdLoaded = false;

  @override
  void initState() {
    super.initState();
    _loadBannerAd();
  }

  void _loadBannerAd() {
    // Dispose any existing ad first
    _bannerAd?.dispose();

    // Determine if we're in debug mode
    bool isInDebugMode = false;
    assert(isInDebugMode = true); // This will be true only in debug mode

    // IMPORTANT: In debug mode, use test ad ID; in production, use real ad ID
    String adUnitId;

    if (isInDebugMode) {
      adUnitId = 'ca-app-pub-3940256099942544/6300978111'; // Google's test ad ID
      print('Using test ad ID in BannerAdWidget: $adUnitId');
    } else {
      adUnitId = 'ca-app-pub-1147112055796547/5221124787'; // Production ad ID
      print('Using production ad ID in BannerAdWidget: $adUnitId');
    }

    _bannerAd = BannerAd(
      adUnitId: adUnitId, // Use the determined ad unit ID, not widget.adUnitId
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
