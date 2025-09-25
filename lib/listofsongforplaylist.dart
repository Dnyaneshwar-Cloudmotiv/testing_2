// listofsongforplaylist.dart
import 'dart:async';
import 'dart:convert';
import 'dart:ui';
import 'package:firebase_dynamic_links/firebase_dynamic_links.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:just_audio/just_audio.dart';
import 'package:just_audio_background/just_audio_background.dart';
import 'package:marquee/marquee.dart';
import 'package:share_plus/share_plus.dart';
import 'package:shimmer/shimmer.dart';
import 'package:voiceapp/audio_service1.dart';  // Ensure this is the correct path to your AudioService class
import 'package:voiceapp/main.dart';
import 'package:voiceapp/musicplayer.dart';
import 'package:http/http.dart' as http;
import 'package:voiceapp/services/api_service.dart';
import 'package:voiceapp/nowplaying.dart';
import 'package:voiceapp/profile_manager.dart';

import 'bottomnavigationbar.dart';
import 'package:voiceapp/connectivity_service.dart';
import 'package:voiceapp/loading_screen.dart';

import 'notifiers.dart';
import 'dart:math' as math;

class ListPage1 extends StatefulWidget {
  final List<Map<String, String>>? songs;
  final String genreTitle;
  final String email;
  final String bannerImage;
  final String? image;
  final String fullname;
  final String Category;
  final String playlistId;

  ListPage1({
    required this.genreTitle,
    required this.bannerImage,
    required this.email,

    required this.Category,
    required this.fullname,
    required this.playlistId,
    this.image,
    this.songs
  });

  @override
  _ListPage1State createState() => _ListPage1State();
}

class _ListPage1State extends State<ListPage1> {

  bool isShuffleEnabled = false;
  List<Map<String, String>> songs = [];
  bool isLoading = true;
  int? currentlyPlayingIndex;

  bool isMenuOpen = false;

  StreamSubscription? _playerStateSubscription;
  StreamSubscription? _currentIndexSubscription;
  bool _isLoading = true;
  bool _isNoInternet = false;
  late ConnectivityService _connectivityService;
  bool _mounted = true;

  bool isPlayButtonPressed = false;



  @override
  void initState() {
    super.initState();
    _mounted = true;
    _connectivityService = ConnectivityService();
    _setupConnectivityListener();
    _fetchSongs().then((_) {
      // Only perform highlight operations after songs are loaded
      _initializeHighlightAfterFetch();
    });
    //ProfileManager.currentlyPlayingSongIdNotifier.addListener(_updateCurrentSong);
    ProfileManager.currentlyPlayingSongIdNotifier.addListener(_updateCurrentSongById);
    _setupAudioPlayerListeners();


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
      await _fetchSongs();

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
          Future.delayed(Duration(milliseconds: 100), () => _safeScrollToSong(index));
          Future.delayed(Duration(milliseconds: 300), () => _safeScrollToSong(index));
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

  void _safeScrollToSong(int index) {
    if (!mounted) return;

    final scrollController = ScrollController(); // Replace with your actual scroll controller if you have one

    try {
      // Check if scroll controller is attached
      if (!scrollController.hasClients) return;

      final double itemHeight = 76.0;  // Consistent item height

      // Get actual viewport height - account for various UI elements
      final double viewportHeight = MediaQuery.of(context).size.height -
          MediaQuery.of(context).padding.top -
          kToolbarHeight -
          290; // Banner + title + bottom nav, etc.

      // Calculate target offset to center the song item
      double targetOffset = (index * itemHeight) - (viewportHeight / 2) + (itemHeight / 2);

      // Ensure offset is within scrollable range
      if (scrollController.position.maxScrollExtent > 0) {
        targetOffset = math.max(0, math.min(targetOffset, scrollController.position.maxScrollExtent));

        // Smoothly animate to the position
        scrollController.animateTo(
          targetOffset,
          duration: Duration(milliseconds: 300),
          curve: Curves.easeOutCubic,
        );
      }
    } catch (e) {
      print('Safe scroll error: $e');
    }
  }


//   @override
// void dispose() {
//   _songIdSubscription.cancel();
//   super.dispose();
// }

  void _setupAudioPlayerListeners() {
    final audioService = AudioService();

    // Listen to current index changes from the audio service
    _currentIndexSubscription = audioService.currentIndexStream
        .distinct()
        .listen(
          (index) async {
        if (index != null && mounted) {
          try {
            // Access the current song ID
            String? songId;

            try {
              // First try to get it from the AudioService's current queue
              if (index < audioService.currentQueue.length) {
                final currentSource = audioService.currentQueue[index];
                if (currentSource is UriAudioSource) {
                  final mediaItem = currentSource.tag as MediaItem?;
                  songId = mediaItem?.id;
                }
              }

              // If songId is still null, try getting it directly from the current song notifier
              if (songId == null) {
                songId = ProfileManager.currentlyPlayingSongIdNotifier.value;
              }
            } catch (e) {
              print('Error getting song ID: $e');
            }

            if (songId != null && songId.isNotEmpty) {
              // Update the ProfileManager with the new song ID
              ProfileManager().updateCurrentlyPlayingSong(songId);

              // Find the index in our local list by song ID
              final localIndex = songs.indexWhere((song) => song['song_id'] == songId);

              if (localIndex != -1 && mounted) {
                setState(() {
                  currentlyPlayingIndex = localIndex;
                });
              }
            }
          } catch (e) {
            print('Error in index stream handler: $e');
          }
        }
      },
    );

    // Also listen to player state changes to update UI when playback starts/stops
    _playerStateSubscription = audioService.player.playerStateStream.listen((state) {
      if (mounted && ProfileManager.currentlyPlayingSongIdNotifier.value != null) {
        _updateCurrentSongById();
      }
    });
  }

  @override
  void dispose() {
    //ProfileManager.currentlyPlayingSongIdNotifier.removeListener(_updateCurrentSong);
    ProfileManager.currentlyPlayingSongIdNotifier.removeListener(_updateCurrentSongById);
    songs.clear();
    _currentIndexSubscription?.cancel();
    _playerStateSubscription?.cancel();
    isLoading = false;
    currentlyPlayingIndex = null;
    _mounted = false;
    _connectivityService.dispose();
    super.dispose();
  }


  void _updateCurrentSong() {
    // Implementation moved to _updateCurrentSongById
  }

  DateTime _parseTimestamp(String timestamp) {
    try {
      if (timestamp.length >= 15) {
        String dateStr = timestamp.substring(0, 8);
        String timeStr = timestamp.substring(9, 15);
        
        int year = int.parse(dateStr.substring(0, 4));
        int month = int.parse(dateStr.substring(4, 6));
        int day = int.parse(dateStr.substring(6, 8));
        int hour = int.parse(timeStr.substring(0, 2));
        int minute = int.parse(timeStr.substring(2, 4));
        int second = int.parse(timeStr.substring(4, 6));
        
        return DateTime(year, month, day, hour, minute, second);
      }
    } catch (e) {
      print('Error parsing timestamp: $e');
    }
    return DateTime.now();
  }

  Future<void> _fetchSongs() async {
    try {
      final response = await ApiService.getPlaylistSongs(widget.playlistId);

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);

        if (jsonResponse.containsKey('songDetails')) {
          final List<dynamic> items = jsonResponse['songDetails'];

          // First, determine the most common playlist name
          Map<String, int> playlistNameCounts = {};
          for (var song in items) {
            if (song.containsKey('playlistName') && song['playlistName'] != null) {
              String name = song['playlistName'].toString();
              playlistNameCounts[name] = (playlistNameCounts[name] ?? 0) + 1;
            }
          }

          String mostCommonPlaylistName = 'Unknown Playlist';
          int maxCount = 0;
          playlistNameCounts.forEach((name, count) {
            if (count > maxCount) {
              maxCount = count;
              mostCommonPlaylistName = name;
            }
          });

          // If we found a valid playlist name and it's different from the widget title,
          // update the widget title (this will happen on next build)
          if (mostCommonPlaylistName != 'Unknown Playlist' &&
              widget.genreTitle != mostCommonPlaylistName) {
            // We can't directly modify widget.genreTitle as it's final,
            // but we'll use the correct name in our data
            print('Found more accurate playlist name: $mostCommonPlaylistName');
          }

          // Convert items to List<Map> and sort by addedOn timestamp
          final sortedSongs = items.map<Map<String, dynamic>>((song) => {
            'title': song['songName'] ?? 'Unknown Title',
            'artist': (song['stage_name']?.isNotEmpty == true)
                ? song['stage_name']
                : song['FullName'] ?? 'Unknown Artist',
            'duration': song['span'] ?? '00:00',
            'song_id': song['song_id'] ?? 'unknown',
            'coverPage': song['coverPageUrl'] ?? 'assets/logo.png',
            'streamingUrl': song['songStreamUrl'] ?? '',
            'languages': song['languages'] ?? '',
            'genre':song['genre']??'',
            'playlistName': mostCommonPlaylistName, // Use the most common name for consistency
            'addedOn': song['addedOn'] ?? '00000000_000000', // Default value for sorting
          }).toList()
            ..sort((a, b) {
              // Parse timestamps and sort in descending order (newest first)
              final dateA = _parseTimestamp(a['addedOn']);
              final dateB = _parseTimestamp(b['addedOn']);
              return dateB.compareTo(dateA); // For ascending order (oldest first), swap dateB and dateA
            });

          setState(() {
            songs = sortedSongs.map<Map<String, String>>((song) => {
              'title': song['title'],
              'artist': song['artist'],
              'duration': song['duration'],
              'song_id': song['song_id'],
              'coverPage': song['coverPage'],
              'streamingUrl': song['streamingUrl'],
              'languages': song['languages'],
              'genre':song['genre']??'',
              'playlistName': song['playlistName'],
            }).toList();
            isLoading = false;
          });
        } else {
          setState(() {
            songs = [];
            isLoading = false;
          });
        }
      } else {
        throw Exception('Failed to load songs');
      }
    } catch (e) {
      print('Error fetching songs: $e');
      setState(() {
        isLoading = false;
      });
    }
  }

  // Function to fetch the song URL from the API
  Future<String> fetchSongUrl(String songName) async {
    final response = await ApiService.getSongStreamingUrl(songName);

    if (response.statusCode == 200) {
      final jsonResponse = json.decode(response.body);
      return jsonResponse['songUrl']['S'];
    } else {
      throw Exception('Failed to load song URL');
    }
  }

  Future<void> toggleShuffleMode() async {
    setState(() {
      isShuffleEnabled = !isShuffleEnabled;
    });

    // await AudioService().toggleShuffleMode(); // Trigger shuffle in AudioService
    // print(isShuffleEnabled ? 'Shuffle enabled' : 'Shuffle disabled');
  }

  // Fetch all song URLs and update the AudioService playlist
  Future<void> loadPlaylistIntoAudioService({required int initialIndex}) async {
    try {
      // Fetch URLs for all songs in the list
      //List<Map<String, String>> updatedSongs = await fetchAllSongUrls(songs);


      // Navigate to MusicPlayerPage with playlist name
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => MusicPlayerPage(
            currentIndex: initialIndex,
            email: widget.email,
            userfullname: widget.fullname,
            userCategory: widget.Category,
            sourceType: 'playlist',
            sourceName: widget.genreTitle, // This is the playlist name
            navigationIndex: 3, // Add this line to set Library tab as active
          ),
        ),
      );

      if (mounted) {
        // Load the playlist into AudioService with the specified initialIndex
        await AudioService().loadPlaylist(songs,initialIndex: initialIndex);
        print('Playlist loaded into AudioService');
        isNowPlayingTileVisible.value = true;
      }
    } catch (e) {
      print('Failed to load playlist: $e');
    }

  }

  Future<void> _onSongTap(int index) async {
    if (songs.isEmpty || index >= songs.length) return;

    try {
      final selectedSongId = songs[index]['song_id'];
      final currentSongId = ProfileManager.currentlyPlayingSongIdNotifier.value;

      if (selectedSongId != currentSongId) {
        // Clear the current playlist
        await AudioService().clearPlaylist();

        // Turn off loop mode
        loopNotifier.value = false;
        await loopNotifier.saveLoopState();
        AudioService().player.setLoopMode(LoopMode.off);

        // Set the currently playing song ID before loading the playlist
        if (selectedSongId != null) {
          ProfileManager().updateCurrentlyPlayingSong(selectedSongId);
        }

        // Load the playlist starting from the selected song
        await loadPlaylistIntoAudioService(initialIndex: index);

        // Make mini player visible
        isNowPlayingTileVisible.value = true;

        // ScaffoldMessenger.of(context).showSnackBar(
        //     SnackBar(content: Text('Now playing: ${songs[index]['title']}'))
        // );
      } else {
        // If the same song is clicked, navigate to the full player view
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => MusicPlayerPage(
              currentIndex: index,
              email: widget.email,
              userfullname: widget.fullname,
              userCategory: widget.Category,
              sourceType: 'playlist',
              sourceName: widget.genreTitle,
              navigationIndex: 3,
            ),
          ),
        );
      }
    } catch (e) {
      print('Error playing song: $e');
    }
  }

  // Future<List<Map<String, String>>> fetchAllSongUrls(List<Map<String, String>> songs) async {
  //   List<Map<String, String>> updatedSongs = [];

  //   for (var song in songs) {
  //     try {
  //       String songUrl = await fetchSongUrl(song['title'] ?? '');

  //       updatedSongs.add({
  //         ...song,
  //         'streamingUrl': songUrl, // Attach the fetched streaming URL
  //       });
  //     } catch (e) {
  //       print('Error fetching URL for ${song['title']}: $e');
  //       updatedSongs.add({
  //         ...song,
  //         'streamingUrl': '', // Fallback if URL can't be fetched
  //       });
  //     }
  //   }

  //   return updatedSongs;
  // }


  Future<void> _removeSong(String playlistId, String songId) async {
    if (!mounted) return; // Check if widget is still mounted before making changes

    final String timestamp = DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());
    try {
      final response = await ApiService.removeSongFromPlaylist(
        playlistId: playlistId,
        songIds: [songId],
        updatedTimestamp: timestamp,
      );

      if (response.statusCode == 200) {
        if (mounted) {
          setState(() {
            songs.removeWhere((song) => song['song_id'] == songId); // Remove the song locally
          });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Song removed successfully from the playlist')),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to remove song from playlist')),
          );
        }
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error removing song from playlist')),
        );
      }
    }

  }


  void _showSongInfoModal(BuildContext context, String songId) async {
    List<Map<String, String>> songCredits = [];
    String songTitle = songs.firstWhere(
          (song) => song['song_id'] == songId,
      orElse: () => {'title': 'Unknown Title'},
    )['title']!;

    try {
      songCredits = await fetchSongCredits(songId);
    } catch (e) {
      print("Error fetching song credits: $e");
    }

    int initialDisplayCount = 5;
    ValueNotifier<int> displayCount = ValueNotifier<int>(initialDisplayCount);

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (BuildContext context) {
        return DraggableScrollableSheet(
          initialChildSize: 0.7,
          maxChildSize: 0.9,
          minChildSize: 0.5,
          builder: (BuildContext context, ScrollController scrollController) {
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
                  ),
                  padding: EdgeInsets.all(16.0),
                  child: Stack(
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Center(
                            child: Container(
                              width: 40,
                              height: 4,
                              margin: EdgeInsets.symmetric(vertical: 8),
                              decoration: BoxDecoration(
                                color: Colors.grey[300],
                                borderRadius: BorderRadius.circular(2),
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
                                    itemBuilder: (context, index) {
                                      final credit = songCredits[index];
                                      return _creditRow(
                                        credit['name'] ?? 'Unknown',
                                        credit['role'] ?? 'Unknown',
                                        isLastItem: index == songCredits.length - 1,
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
                                  Color(0xFF100F32).withOpacity(0),
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
                ),
              ),
            );
          },
        );
      },
    );
  }

  // Widget _creditRow(String name, String role, {bool isLastItem = false}) {
  //   return Padding(
  //     padding: const EdgeInsets.symmetric(vertical: 15.0, horizontal: 20),
  //     child: Row(
  //       mainAxisAlignment: MainAxisAlignment.spaceBetween,
  //       crossAxisAlignment: CrossAxisAlignment.center, // Align content in the middle
  //       children: [
  //         Flexible(
  //           child: Text(
  //             name,
  //             style: TextStyle(
  //               color: Colors.white,
  //               fontSize: 18.0,
  //               fontWeight: FontWeight.bold,
  //             ),
  //             softWrap: true,
  //             maxLines: 3,
  //             overflow: TextOverflow.ellipsis,
  //           ),
  //         ),
  //
  //         Container(
  //           width: 120, // Fixed width for consistent size
  //           padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
  //           decoration: BoxDecoration(
  //             color: Color(0xFF93C6FE),
  //             borderRadius: BorderRadius.circular(20),
  //           ),
  //           child: Center(
  //             child: Text(
  //               role,
  //               style: TextStyle(
  //                 color: Colors.black,
  //                 fontSize: 17,
  //                 fontWeight: FontWeight.bold,
  //               ),
  //               softWrap: true, // Allow wrapping inside the container
  //             ),
  //           ),
  //         ),
  //       ],
  //     ),
  //   );
  // }

  Widget _creditRow(String name, String role, {bool isLastItem = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 15.0, horizontal: 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.baseline, // Changed to baseline alignment
        textBaseline: TextBaseline.alphabetic, // Added text baseline
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
    final response = await ApiService.getSongCredits(songId); // Replace with your actual API URL

    if (response.statusCode == 200) {
      Map<String, dynamic> data = jsonDecode(response.body);

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


  void _shareSong(String songId, String title,String coverImageUrl) async {
    try {
      // Generate the dynamic link for the song
      Uri dynamicLink = await createDynamicLink(songId, title,coverImageUrl);

      // Share the song with the generated dynamic link
      final shareText = 'Hey, see what I found ! Listen to this amazing song 😍 on VOIZ ! Just download the app, listen and enjoy ! $dynamicLink';
      Share.share(shareText);
      await _incrementShareCount(songId);
    } catch (e) {
      print('Error generating dynamic link: $e');
    }
  }

  Future<Uri> createDynamicLink(String songId, String title,String imageUrl) async {


    // Log the parsed URL to ensure it's cprint("Parsed Image URL: $imageUrl");
    final DynamicLinkParameters parameters = DynamicLinkParameters(
      uriPrefix: 'https://voiznewapp.page.link', // Your Firebase Dynamic Link domain
      link: Uri.parse('https://voiznewapp.page.link/song?songId=$songId'), // Song-specific URL
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
        description: 'Hey, see what I found ! Listen to this amazing song 😍 on VOIZ ! Just download the app, listen and enjoy !',
        imageUrl: Uri.parse(imageUrl),
      ),
    );

    // Generate a short dynamic link
    final ShortDynamicLink shortLink = await FirebaseDynamicLinks.instance.buildShortLink(parameters);
    return shortLink.shortUrl;
  }

  Widget _buildShimmerList() {
    return ListView.builder(
      itemCount: 5, // Number of shimmer items to show while loading
      itemBuilder: (context, index) {
        return Shimmer.fromColors(
          baseColor: Colors.grey[300]!,
          highlightColor: Colors.grey[100]!,
          child: ListTile(
            leading: Container(
              width: 60,
              height: 60,
              color: Colors.white,
            ),
            title: Container(
              width: double.infinity,
              height: 10,
              color: Colors.white,
            ),
            subtitle: Container(
              width: double.infinity,
              height: 10,
              color: Colors.white,
            ),
          ),
        );
      },
    );
  }

  Future<void> _confirmDeleteSong(BuildContext context, String playlistId, String songId) async {
    setState(() {
      isMenuOpen = true; // Set blur state for song list
    });

    bool? confirmDelete = await showDialog<bool>(
      context: context,
      barrierColor: Colors.black.withOpacity(0.0),
      builder: (BuildContext context) {
        return Dialog(
          elevation: 8.0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20.0),
          ),
          child: Container(
            padding: EdgeInsets.symmetric(vertical: 20, horizontal: 16),
            decoration: BoxDecoration(
              color: Color(0xFF151415),
              borderRadius: BorderRadius.circular(20.0),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Delete Song?',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    TextButton(
                      onPressed: () {
                        setState(() {
                          isMenuOpen = false;
                        });
                        Navigator.of(context).pop(false);
                      },
                      child: Text(
                        'Cancel',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                        ),
                      ),
                    ),
                    TextButton(
                      onPressed: () {
                        setState(() {
                          isMenuOpen = false;
                        });
                        Navigator.of(context).pop(true);
                      },
                      child: Text(
                        'Delete',
                        style: TextStyle(
                          color: Colors.red,
                          fontSize: 18,
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
    ).then((value) {
      // Ensure blur is removed when dialog is dismissed
      if (mounted) {
        setState(() {
          isMenuOpen = false;
        });
      }
      return value;
    });

    // Proceed with deletion if confirmed
    if (confirmDelete == true) {
      await _removeSong(playlistId, songId);
    }
  }

  Future<void> _incrementShareCount(String songId) async {
    final String timestamp = DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());
    try {
      final response = await ApiService.incrementSongShareCount(
        songId: songId,
        updatedTimestamp: timestamp,
      );

      if (response.statusCode == 200) {
        print('Share count incremented successfully!');
      } else {
        print('Failed to increment share count. Status code: ${response.statusCode}');
      }
    } catch (e) {
      print('Error incrementing share count: $e');
    }
  }



  @override
  Widget build(BuildContext context) {
    Widget content= WillPopScope(
      onWillPop: () async {
        Navigator.pop(context, true);
        return false;
      },
      child: GradientScaffold(
        body: Column(
          children: [
            // Cover image section
            Container(
              width: double.infinity,
              height: 250,
              child: Stack(
                children: [
                  // Banner Image
                  Container(
                    width: double.infinity,
                    height: 250,
                    child: Image.network(
                      widget.bannerImage,
                      fit: BoxFit.contain,
                      width: double.infinity,
                      height: 230,
                      errorBuilder: (context, error, stackTrace) {
                        return Image.asset(
                          'assets/default.jpg',
                          fit: BoxFit.contain,
                        );
                      },
                    ),
                  ),
                  // Back button and logo

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
                          backgroundColor: Color(0xFF100F32), // Or whatever background color you want
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
                  // Positioned(
                  //   top: 40,
                  //   left: 45,
                  //   child: Image.asset(
                  //     'assets/logo.png',
                  //     height: 50,
                  //   ),
                  // ),
                ],
              ),
            ),

            // Title and controls section with zero bottom padding
            Padding(
              padding:
              EdgeInsets.only(left: 16, right: 16, top: 5, bottom: 4),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded( // Allow text to take available space and wrap
                    child: Text(
                      widget.genreTitle,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                      softWrap: true, // Enable text wrapping
                      maxLines: 2, // Limit to 2 lines, adjust if needed
                    ),
                  ),
                  Row(
                    children: [

                      ValueListenableBuilder<bool>(
                        valueListenable: shuffleNotifier,
                        builder: (context, isShuffleEnabled, child) {
                          return Container(
                            width: 50,
                            height: 50,
                            decoration: BoxDecoration(
                              color: isShuffleEnabled
                                  ? Color(0xFF2644D9)   // Blue when enabled
                                  : Color(0x33D9D9D9),  // Semi-transparent gray when disabled
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
                          color: isPlayButtonPressed
                              ? Color(0xFF2644D9)   // Blue when pressed
                              : Color(0x33D9D9D9),  // Semi-transparent gray normally
                          // color: Color(0xFF93C6FE),
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
                            if (songs.isNotEmpty) {
                              //final firstSongId = songs[0]['song_id'] ?? '';
                              // ProfileManager()
                              //     .updateCurrentlyPlayingSong(firstSongId);

                              final firstSongId = songs[0]['song_id'] ?? '';
                              //ProfileManager().updateCurrentlyPlayingSong(firstSongId);
                              //final selectedSongId = songs[index]['song_id'];
                              if (firstSongId != null) {
                                ProfileManager().updateCurrentlyPlayingSong(firstSongId);
                              }

                              await AudioService().clearPlaylist();

                              await loadPlaylistIntoAudioService(
                                  initialIndex: 0);




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

            // Song list immediately after
            Expanded(
              child: ClipRect(
                child: Stack(
                  children: [
                    // Song list
                    isLoading ? _buildShimmerList() : _buildSongList(),

                    // Blur overlay when menu is open
                    if (isMenuOpen)
                      Positioned.fill(
                        child: BackdropFilter(
                          filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
                          child: Container(
                            color: Colors.black.withOpacity(0.0),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),

            NowPlayingTile(
              email: widget.email,
              userFullName: widget.fullname,
              userCategory: widget.Category,
            )
          ],
        ),
      ),
    );
    return Stack(
        children:[
          PageWithBottomNav(
            child: content,
            email: widget.email,
            fullName: widget.fullname,
            category: widget.Category,
            currentIndex: 3,  // 1 is for Search page
            isFromNewHomePage: false,
          ),
          LoadingScreen(
            isLoading: _isLoading,
            isNoInternet: _isNoInternet,
            onRetry: _checkConnectivity,
          ),
        ]
    );
  }
  Widget _buildSongList() {
    return ListView.builder(
      padding: EdgeInsets.zero,
      itemCount: songs.length,
      itemBuilder: (context, index) {
        final song = songs[index];
        return _buildSongItem(
          context,
          song['title'] ?? 'Unknown Title',
          song['artist'] ?? 'Unknown Artist',
          song['coverPage'] ?? 'assets/logo.png',
          song['duration'] ?? '0:00',
          index,
          song['languages']??'unknown',
          song['genre']??'unknown',
        );
      },
    );

  }
  // Build each song item in the list
  // Build each song item in the list with a 3-dot menu
  // Build each song item in the list as a GestureDetector for play functionality
  Widget _buildSongItem(BuildContext context, String title, String artist,
      String imagePath, String duration, int index, String languages, String genre) {
    return ValueListenableBuilder<String?>(
      valueListenable: ProfileManager.currentlyPlayingSongIdNotifier,
      builder: (context, currentSongId, child) {
        final songId = songs[index]['song_id'] ?? '';
        final isPlaying = currentSongId == songId;
        final streamingUrl = songs[index]['streamingUrl'] ?? '';
        final coverImageUrl = songs[index]['coverPage'] ?? '';

        return GestureDetector(
          onTap: () => _onSongTap(index),
          child: Padding(
            padding: const EdgeInsets.only(top: 0.0),
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(10),
                color: isPlaying ? const Color(0xFF211F20) : Colors.transparent,
                boxShadow: isPlaying ? [
                  BoxShadow(
                    color: Colors.black.withOpacity(1),
                    spreadRadius: 2,
                    blurRadius: 4,
                    offset: Offset(0, 0), // changes position of shadow
                  ),
                ] : [],
              ),

              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                child: Row(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(0.0),
                      child: Image.network(
                        imagePath,
                        height: 60,
                        width: 60,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return Image.asset(
                            'assets/mic.jpg',
                            height: 60,
                            width: 60,
                            fit: BoxFit.cover,
                          );
                        },
                      ),
                    ),
                    SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          title.length > 25 // Arbitrary length threshold for scrolling
                              ? SizedBox(
                            height: 20,
                            child: Marquee(
                              text: title,
                              style: TextStyle(
                                color: isPlaying ? Color(0xFF2644D9) : Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                              blankSpace: 50.0,
                              velocity: 30.0,
                              pauseAfterRound: Duration(seconds: 1),
                            ),
                          )
                              : Text(
                            title,
                            style: TextStyle(
                              color: isPlaying ? Color(0xFF2644D9) : Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                          SizedBox(height: 4),
                          Text(
                            artist,
                            style: TextStyle(
                              color: Colors.grey,
                              fontSize: 14,
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            languages,
                            style: TextStyle(
                              color: Colors.grey,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    SizedBox(width: 8),
                    Text(
                      duration,
                      style: TextStyle(
                        color: isPlaying ? Color(0xFF2644D9) : Colors.white,
                        fontSize: 14,
                      ),
                    ),
                    PopupMenuButton<String>(
                      icon: Icon(Icons.more_vert, color: Colors.white),
                      color: Color(0xFF151415),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                      ),
                      position: PopupMenuPosition.under,
                      offset: Offset(0, 0),
                      onOpened: () {
                        setState(() {
                          isMenuOpen = true;
                        });
                      },
                      onCanceled: () {
                        setState(() {
                          isMenuOpen = false;
                        });
                      },
                      onSelected: (String value) async {
                        setState(() {
                          isMenuOpen = false;
                        });
                        switch (value) {
                          case 'Song info':
                            _showSongInfoModal(context, songId);
                            break;
                          case 'Delete':
                            await _confirmDeleteSong(context, widget.playlistId, songId);
                            break;
                          case 'Share':
                            _shareSong(songId, title, coverImageUrl);
                            break;
                        }
                      },
                      itemBuilder: (BuildContext context) {
                        return [
                          PopupMenuItem<String>(
                            value: 'Delete',
                            child: ListTile(
                              leading: Image.asset(
                                'assets/delete.png',
                                height: 26,
                                width: 26,
                                color: Colors.white,
                              ),
                              title: Text('Delete', style: TextStyle(color: Colors.white,fontWeight: FontWeight.w600)),
                            ),
                          ),
                          PopupMenuItem<String>(
                            value: 'Song info',
                            child: ListTile(
                              leading: Icon(Icons.info_outline, color: Colors.white,size: 30,),
                              title: Text('Song info', style: TextStyle(color: Colors.white,fontWeight: FontWeight.w600)),
                            ),
                          ),
                          PopupMenuItem<String>(
                            value: 'Share',
                            child: ListTile(
                              leading: Image.asset(
                                'assets/Share.png',
                                height: 26,
                                width: 26,
                                color: Colors.white,
                              ),
                              title: Text('Share', style: TextStyle(color: Colors.white,fontWeight: FontWeight.w600)),
                            ),
                          ),
                        ];
                      },
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }


}