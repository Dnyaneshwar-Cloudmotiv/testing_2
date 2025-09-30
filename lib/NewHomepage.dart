// NewHomepage.dart

import 'dart:ui';
import 'dart:math';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:firebase_dynamic_links/firebase_dynamic_links.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:in_app_update/in_app_update.dart';
import 'package:marquee/marquee.dart';
import 'package:shimmer/shimmer.dart';
import 'package:voiceapp/bottomnavigationbar.dart';
import 'package:voiceapp/utils/image_utils.dart';
import 'package:voiceapp/adminlistsong.dart';
import 'package:voiceapp/app_terminator.dart';
import 'package:voiceapp/artist.dart';
import 'package:voiceapp/audio_service1.dart';
import 'package:voiceapp/connectivity_service.dart';
import 'package:voiceapp/edit_profile.dart';
import 'package:voiceapp/listofsongforplaylist.dart';
import 'package:voiceapp/loading_screen.dart';
import 'package:voiceapp/main.dart';
import 'dart:math';


import 'package:voiceapp/newlistofsongs.dart';

import 'package:voiceapp/ProfilePage.dart';
import 'package:voiceapp/SearchPage.dart';

import 'package:voiceapp/musicplayer.dart';


import 'package:http/http.dart' as http;
import 'package:voiceapp/services/api_service.dart';
import 'package:voiceapp/nowplaying.dart';
import 'package:voiceapp/profile_manager.dart';
import 'package:voiceapp/Song%20Upload/uploadsong1.dart';
import 'package:voiceapp/Song%20Upload/upload_selection_page.dart';
import 'dart:convert';
import 'dart:async';
import 'package:flutter/services.dart';

import 'package:voiceapp/viewProfile.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:permission_handler/permission_handler.dart';

import 'AppUpdateManager.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:voiceapp/connectivity_service.dart';
import 'package:voiceapp/loading_screen.dart';


class BackButtonService {
  static final BackButtonService _instance = BackButtonService._internal();
  factory BackButtonService() => _instance;
  BackButtonService._internal();

  StreamController<bool> _backButtonController = StreamController<bool>.broadcast();
  Stream<bool> get backButtonStream => _backButtonController.stream;
  bool _isProcessing = false;


  void resetState() {

    _isProcessing = false;
  }

  Future<bool> handleBackPress(int currentIndex, BuildContext context) async {
    if (_isProcessing) return false;
    _isProcessing = true;

    try {
      if (currentIndex != 0) {
        _backButtonController.add(true);
        return false;
      } else {
        final shouldExit = await showExitDialog(context);
        if (shouldExit) {
          await SystemNavigator.pop();
          return true;
        }
        return false;
      }
    } finally {
      _isProcessing = false;
    }
  }

  Future<bool> showExitDialog(BuildContext context) async {
    return await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return Dialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(15.0), // Rounded corners
          ),
          backgroundColor: Color(0xFF151415), // Background color
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 30),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Exit App',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 15),
                Text(
                  'Are you sure you want to exit the app?',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                  ),
                ),
                SizedBox(height: 25),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: [
                    TextButton(
                      onPressed: () => Navigator.of(context).pop(false),
                      child: Text(
                        'Cancel',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    TextButton(
                      onPressed: () async {
                        // Set a flag before terminating
                        final prefs = await SharedPreferences.getInstance();
                        await prefs.setBool('app_was_properly_exited', true);

                        // Pop the dialog
                        Navigator.of(context).pop(true);

                        // Use the app terminator
                        await AppTerminator.terminateApp();
                      },
                      child: Text(
                        'Yes',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
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
    ) ?? false;
  }


  void dispose() {
    _backButtonController.close();
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
    // assert(isInDebugMode = true); // This will be true only in debug mode

    // Use test ad ID in debug mode, real ad ID in production
    String adUnitId = widget.adUnitId;

    // IMPORTANT: In debug mode, use test ad ID; in production, use real ad ID
    if (isInDebugMode) {
      adUnitId = 'ca-app-pub-3940256099942544/6300978111'; // Google's test ad unit ID
      print('Using test ad ID: $adUnitId');
    } else {
      // Make sure we're using the production ad ID
      adUnitId = 'ca-app-pub-1147112055796547/5221124787'; // Production ad ID
      print('Using production ad ID: $adUnitId');
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


class NewHomePage extends StatefulWidget {
  final String email;
  final String category;
  final String userfullname;
  final Map<String, dynamic>? preservedAudioState;

  NewHomePage({required this.email,required this.category,required this.userfullname,this.preservedAudioState,});

  @override
  _NewHomePageState createState() => _NewHomePageState();
}

class _NewHomePageState extends State<NewHomePage> with WidgetsBindingObserver {
  String selectedCategory = 'For you';
  bool _isLoading = true;
  bool _hasInternet = true;
  late ConnectivityService _connectivityService;
  bool isSearching = false; // State variable to control search bar visibility
  final TextEditingController searchController =
  TextEditingController(); // Controller for the search bar
  int _currentIndex=0;
  //bool _isNavigatingBack = false;
  String? _profileImageUrl;
  ValueNotifier<bool> isNowPlayingTileVisible = ValueNotifier<bool>(true);
  DateTime? registrationDate;

  String fullName = '';
  bool _isListeningToDynamicLinks = false;
  String StageName='';
  String bio = '';

  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  bool _processingBackPress = false;
  DateTime? lastBackPressTime;
  bool _isExiting = false;
  bool _mounted = true;

  final BackButtonService _backButtonService = BackButtonService();
  late StreamSubscription<bool> _backButtonSubscription;
  bool _isProcessingDynamicLink = false;
  bool _hasShownPlaylistNotification = false; // Add this line to track notification state

  // // Add this property to hold the interstitial ad
  // InterstitialAd? _interstitialAd;
  // bool _isInterstitialAdReady = false;




  Future<void> checkForUpdate() async {
    print('checking for Update');
    InAppUpdate.checkForUpdate().then((info) {
      setState(() {
        if (info.updateAvailability == UpdateAvailability.updateAvailable) {
          print('update available');
          update();
        }
      });
    }).catchError((e) {
      print(e.toString());
    });
  }

  void update() async {
    print('Updating');
    await InAppUpdate.startFlexibleUpdate();
    InAppUpdate.completeFlexibleUpdate().then((_) {}).catchError((e) {
      print(e.toString());
    });
  }

  @override
  void initState() {
    super.initState();
    checkForUpdate();
    //_loadInterstitialAd();

    _connectivityService = ConnectivityService();
    _initializeWithConnectivity();
    _initializeWithPreservedState();
    _initializeNotifications();
  }


  Future<void> _initializeWithConnectivity() async {
    await _connectivityService.checkConnection();
    if (_connectivityService.hasConnection) {
      _initializeWithPreservedState();
    } else {
      setState(() {
        _isLoading = false;
        _hasInternet = false;
      });
    }

    _connectivityService.connectionStream.listen((hasConnection) {
      if (mounted) {
        setState(() {
          _hasInternet = hasConnection;
          if (hasConnection && !_isLoading && _currentIndex == 0) {
            // Only reload if we're on the home tab (index 0)
            _initializeWithPreservedState();
          } else if (hasConnection) {
            // Just update the internet state without reloading for other tabs
            _hasInternet = true;
            _isLoading = false;
          }
        });
      }
    });
  }

  Future<void> _checkConnectivityAndReload() async {
    setState(() => _isLoading = true);
    await _connectivityService.checkConnection();
    if (_connectivityService.hasConnection) {
      if (_currentIndex == 0) {
        // Only reload content if we're on the home tab
        await _initializeWithPreservedState();
      } else {
        // Just update the loading/internet state without reloading
        setState(() {
          _isLoading = false;
          _hasInternet = true;
        });
      }
    } else {
      setState(() {
        _isLoading = false;
        _hasInternet = false;
      });
    }
  }

  Future<void> _initializeWithPreservedState() async {
    if (widget.preservedAudioState != null) {
      await AudioService().restoreState(widget.preservedAudioState!);
    }
    _initializeApp();
  }


  Future<void> _initializeApp() async {
    if (!_mounted) return;
    setState(() => _isLoading = true);
    try {
      await _checkNotificationLaunch();
      // _setupNotificationListeners();
      ProfileManager().setUserId(widget.email);

      if (!_mounted) return;
      await _fetchProfileDetails();
      await _initializeProfile();

      if (!_mounted) return;
      WidgetsBinding.instance.addObserver(this);
      _setupBackButtonListener();
      // await _requestNotificationPermission(); // Disabled to prevent notification popup during automation testing
      _initDynamicLinks();
      await AppUpdateManager.checkForUpdate(context);

      if (!_mounted) return;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!_mounted) return;
        FocusScope.of(context).unfocus();
        _resetToHome();
      });
    } catch (e) {
      print('Error initializing app: $e');
    } finally{
      if (mounted) {
        setState(() => _isLoading = false);  // Set loading to false when done
      }
    }
  }

  @override
  void setState(VoidCallback fn) {
    if (_mounted && mounted) {
      super.setState(fn);
    }
  }

  Future<void> _checkNotificationLaunch() async {
    final notificationAppLaunchDetails =
    await flutterLocalNotificationsPlugin.getNotificationAppLaunchDetails();

    if (notificationAppLaunchDetails?.didNotificationLaunchApp ?? false) {
      print('App launched from notification');
      if (widget.category == 'Singer') {
        // Use a slight delay to ensure proper navigation
        Future.delayed(Duration(milliseconds: 500), () {
          if (mounted) {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => AdminSongList(
                  userId: widget.email,
                  userfullname: widget.userfullname,
                ),
              ),
            );
          }
        });
      }
    }
  }

  void _setupNotificationListeners() {
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('Received foreground message: ${message.data}');
    });

    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      print('App opened from background via notification');
      if (widget.category == 'Singer') {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => AdminSongList(
              userId: widget.email,
              userfullname: widget.userfullname,
            ),
          ),
        );
      }
    });
  }

  void _initializeNotifications() async {
    const AndroidInitializationSettings initializationSettingsAndroid =
    AndroidInitializationSettings('@mipmap/ic_launcher');

    const InitializationSettings initializationSettings =
    InitializationSettings(android: initializationSettingsAndroid);

    // Initialize notifications and handle foreground taps
    await flutterLocalNotificationsPlugin.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: (NotificationResponse response) {
        if (widget.category == 'Singer') {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => AdminSongList(
                userId: widget.email,
                userfullname: widget.userfullname,
              ),
            ),
          );
        }
      },
    );

    // Handle background notifications
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      print('App opened from background via notification');
      if (widget.category == 'Singer') {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => AdminSongList(
              userId: widget.email,
              userfullname: widget.userfullname,
            ),
          ),
        );
      }
    });

    // Handle foreground messages without navigation
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('Received foreground message: ${message.data}');
    });
  }

  @override
  void dispose() {
    // Add this line to dispose the interstitial ad
    //_interstitialAd?.dispose();
    _mounted = false;
    WidgetsBinding.instance.removeObserver(this);
    _backButtonSubscription.cancel();
    FirebaseMessaging.onMessage.listen((_) {}).cancel();
    _connectivityService.dispose();
    super.dispose();
  }




  void _setupBackButtonListener() {
    _backButtonSubscription = _backButtonService.backButtonStream.listen((event) {
      if (mounted && event) {
        setState(() {
          _currentIndex = 0;
        });
      }
    });
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      // Dynamic links handled by ShareSongHandler
      _backButtonService.resetState();
    }
  }

  Future<void> _exitApp() async {
    if (_isExiting) return;

    _isExiting = true;

    // Stop any ongoing processes or services here if needed
    // For example, stop audio playback, save state, etc.

    await Future.delayed(Duration(milliseconds: 100));
    if (!mounted) return;

    // Force close the app
    SystemChannels.platform.invokeMethod('SystemNavigator.pop');
  }

  void _initDynamicLinks() {
    if (_isListeningToDynamicLinks) return; // Avoid adding multiple listeners

    // Handle initial link when app is launched from a closed state
    FirebaseDynamicLinks.instance.getInitialLink().then((PendingDynamicLinkData? initialLink) {
      if (initialLink != null) {
        // Store the initial link to be processed after initialization
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _handleDynamicLink(initialLink);
        });
      }
    });

    // Listen for dynamic links while the app is in the foreground or background
    FirebaseDynamicLinks.instance.onLink.listen((PendingDynamicLinkData dynamicLinkData) {
      _handleDynamicLink(dynamicLinkData);
    }).onError((error) {
      print('Dynamic link error: $error');
    });

    _isListeningToDynamicLinks = true;
  }
  /// Handle the dynamic link and navigate to the ArtistPage

  void _handleDynamicLink(PendingDynamicLinkData data) async {
    final Uri? deepLink = data.link;

    if (deepLink != null && !_isProcessingDynamicLink) {
      // Print the deep link for debugging purposes
      _isProcessingDynamicLink = true;

      try {
        print('Received deep link: $deepLink');
        print('Deep link path: ${deepLink.path}');
        print('Deep link query parameters: ${deepLink.queryParameters}');
        
        // Add delay to prevent multiple rapid calls
        await Future.delayed(Duration(milliseconds: 300));

        // Extract the link path and query parameters
        final path = deepLink.path;
        final artistId = deepLink.queryParameters['artistId'];
        final songId = deepLink.queryParameters['songId'];
        final playlistId = deepLink
            .queryParameters['playlist_id']; // Extract playlist ID

        if (path == '/refer') {
          print('Referral link received, navigating to homepage');
          WidgetsBinding.instance.addPostFrameCallback((_) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (context) =>
                    NewHomePage(
                      email: widget.email,
                      category: widget.category,
                      userfullname: widget.userfullname,
                    ),
              ),
            );
          });
          return;
        }

        // Handle artist profile link
        // Handle artist profile link
        if (path == '/artistprofile' && artistId != null) {
          print('Navigating to artist with ID: $artistId');

          try {
            // Fetch artist details
            final artistDetails = await _fetchArtistDetails(artistId);
            if (artistDetails != null) {
              int followerCount = await _fetchFollowerCount(artistId);
              List<String> followingIds = await _fetchFollowingList(
                  ProfileManager().getUserId()!);
              bool isFollowing = followingIds.contains(artistId);

              // Remove the WidgetsBinding.instance.addPostFrameCallback
              if (mounted && context != null) {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (context) =>
                        MusicArtistPage(
                          artistId: artistId,
                          artistName: artistDetails['StageName'],
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
              print('Artist details not found.');
            }
          } catch (e) {
            print('Error navigating to artist page: $e');
          }
        }


        // Handle song link
        if (path == '/song' && songId != null) {
          print('Navigating to song with ID: $songId');

          try {
            // First fetch song details
            final songDetails = await _fetchSongDetails(songId);

            if (songDetails == null) {
              print('Song details not found for songId: $songId');
              _isProcessingDynamicLink = false;
              return;
            }

            // Get language/genre info
            final String language = songDetails['languages'] ??
                'Unknown Language';
            final String genre = songDetails['genre'] ?? 'Unknown Genre';

            // Wait for a moment to ensure any previous audio operations are completed
            await Future.delayed(Duration(milliseconds: 300));

            final List<Map<String, String>> songList = [
              {
                'title': songDetails['songName'],
                'artist': songDetails['stageName'],
                'duration': songDetails['span'],
                'streamingUrl': songDetails['streamingUrl'],
                'coverPage': songDetails['coverPage'],
                'song_id': songId,
                'source': genre,
                'genre': genre,
              }
            ];

            // Navigate to player page first
            if (mounted) {
              // Navigator.popUntil(context, (route) =>
              // route.isFirst || route.settings.name == 'new_home_page');
              // Pop all MusicPlayerPage instances to avoid stacking
              // Navigator.popUntil(context, (route) {
              //   return route.isFirst || route is MaterialPageRoute && route.builder(context) is NewHomePage;
              // });
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) =>
                      MusicPlayerPage(
                        currentIndex: 0,
                        navigationIndex: 0,
                        email: widget.email,
                        userfullname: widget.userfullname,
                        userCategory: widget.category,
                        sourceType: 'genre',
                        sourceName: genre,
                      ),
                ),
              );

              // Give UI time to initialize, then load the song
              await Future.delayed(Duration(milliseconds: 300));

              // Load the playlist
              await AudioService().loadPlaylist(songList, initialIndex: 0);
            }
          } catch (e) {
            print('Error handling song deep link: $e');
          }
        }

        else if (path == '/playlist' && playlistId != null) {
          print('Navigating to playlist with ID: $playlistId');
          final playlistIdInt = int.parse(playlistId);

          try {
            // Fetch songs in the playlist
            final result = await _fetchSongsInPlaylist(playlistId);
            print(result);
            final String playlistName = result['playlistName'];
            print(playlistName); // Extract the playlist name
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
              // Show a user-friendly message when the playlist is not found or empty
              if (!_hasShownPlaylistNotification) {
                _hasShownPlaylistNotification = true;
                ScaffoldMessenger.of(context).clearSnackBars(); // Clear any existing snackbars first
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('The playlist you\'re looking for is not found'),
                    backgroundColor: Colors.white,
                    behavior: SnackBarBehavior.floating,
                    margin: EdgeInsets.all(16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    duration: Duration(seconds: 3),
                  ),
                );
              }
              print('No songs found for playlistId: $playlistId');
            }
          } catch (e) {
            // Handle errors when fetching playlist data
            if (!_hasShownPlaylistNotification) {
              _hasShownPlaylistNotification = true;
              ScaffoldMessenger.of(context).clearSnackBars(); // Clear any existing snackbars first
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('The playlist you\'re looking for is not found'),
                  backgroundColor: Colors.white,
                  behavior: SnackBarBehavior.floating,
                  margin: EdgeInsets.all(16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  duration: Duration(seconds: 3),
                ),
              );
            }
            print('Error fetching playlist: $e');
          }
        }
      } finally{
        // Reset flag regardless of success or failure
        _isProcessingDynamicLink = false;
      }
    }

  }

  Future<Map<String, dynamic>> _fetchSongsInPlaylist(String playlistId) async {
    final response = await ApiService.getPlaylistSongs(playlistId);

    if (ApiService.isSuccessResponse(response)) {
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
          // Convert all values to strings to ensure type safety
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
      throw Exception('Failed to load songs: ${response.statusCode}');
    }
  }


  Future<List<String>> _fetchFollowingList(String userId) async {
    try {
      final response = await ApiService.getFollowingList(userId);

      if (ApiService.isSuccessResponse(response)) {
        final data = json.decode(response.body);
        List<dynamic> followDetails = data['followDetails'];

        // Flatten the lists and extract artist user_ids
        List<String> followingIds = [];
        
        if (followDetails is List) {
          for (var innerList in followDetails) {
            if (innerList is List) {
              for (var follow in innerList) {
                if (follow is Map && follow['user_id'] != null) {
                  if (follow['user_id'] is Map && follow['user_id']['S'] != null) {
                    followingIds.add(follow['user_id']['S'].toString());
                  } else {
                    followingIds.add(follow['user_id'].toString());
                  }
                }
              }
            }
          }
        }

        return followingIds;
      } else {
        print('Failed to fetch following list');
        return [];
      }
    } catch (e) {
      print('Error fetching following list: $e');
      return [];
    }
  }

  Future<int> _fetchFollowerCount(String artistId) async {
    try {
      final response = await ApiService.getFollowersCount(artistId);

      if (ApiService.isSuccessResponse(response)) {
        final followersData = json.decode(response.body);
        return followersData['count'] ?? 0;
      } else {
        print('Failed to fetch follower count for artistId: $artistId');
        return 0;
      }
    } catch (e) {
      print('Error fetching follower count: $e');
      return 0;
    }
  }




  Future<Map<String, dynamic>?> _fetchArtistDetails(String artistId) async {
    try {
      final response = await ApiService.getArtistDetails(artistId);
      print('Artist API Response Status: ${response.statusCode}');
      print('Artist API Response Body: ${response.body}');

      if (ApiService.isSuccessResponse(response)) {
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

  Future<void> _requestNotificationPermission() async {
    PermissionStatus status = await Permission.notification.status;
    if (!status.isGranted) {
      status = await Permission.notification.request();
      // From here, user can select allow or deny
    }
    if (status.isPermanentlyDenied) {
      print("Notification permission permanently denied");
      // Don't call openAppSettings() here automatically
    }
  }

  // Future<void> _requestNotificationPermission() async {
  //   PermissionStatus status = await Permission.notification.status;
  //   if (!status.isGranted) {
  //     status = await Permission.notification.request();
  //     if (status.isDenied) {
  //       // Handle the case where the user denies the permission
  //       print("Notification permission denied");
  //     } else if (status.isPermanentlyDenied) {
  //       // Prompt the user to enable permission from settings
  //       openAppSettings();
  //     }
  //   }
  // }

  Future<void> _fetchEmailFromAPI(String userId) async {
    try {
      final response = await ApiService.getArtistViewProfile(userId);

      if (ApiService.isSuccessResponse(response)) {
        final data = jsonDecode(response.body);
        if (data['Item'] != null && data['Item']['EmailId'] != null && data['Item']['EmailId']['S'] != null) {
          String emailValue = data['Item']['EmailId']['S'];
          // Update the ProfileManager's email value directly
          ProfileManager().email.value = emailValue;
        }
      }
    } catch (e) {
      print('Error fetching email from API: $e');
    }
  }



  Future<void> _initializeProfile() async {
    String? userId = ProfileManager().getUserId();
    print("These is my user ID : $userId");
    await ProfileManager().initialize(userId!);
    // Check if email is still null or "Loading..." after initialization
    if (ProfileManager().email.value == null || ProfileManager().email.value == 'Loading...') {
      await _fetchEmailFromAPI(userId);
    }
    if (!_mounted) return;
    setState(() {
      _profileImageUrl = ProfileManager().profileImageUrl; // Set the URL for use in this page
    });
  }

  void _resetToHome() {
    if (!mounted) return;
    setState(() {
      _currentIndex = 0;
    });
  }

  DateTime _parseDate(String dateString) {
    // List of possible date formats to try
    List<String> formats = [
      'yyyy-MM-dd',
      'yyyy-MM-ddTHH:mm:ss',
      'yyyy-MM-ddTHH:mm:ssZ',
      'yyyy-MM-dd HH:mm:ss.SSS',
      'yyyy-MM-ddTHH:mm:ss.SSS',
    ];

    for (var format in formats) {
      try {
        return DateTime.parse(dateString);
      } catch (e) {
        continue;
      }
    }

    // If no format works, return the current date as a fallback
    print('Failed to parse date: $dateString');
    return DateTime.now();
  }

  Future<bool> _shouldShowBioDialog() async {
    if (widget.category != "Singer") {
      print("User is not a singer. Bio update dialog will not be shown.");
      return false;
    }

    try {
      final response = await ApiService.getUserProfileDetails(ProfileManager().getUserId()!);

      if (!ApiService.isSuccessResponse(response)) {
        print("Failed to fetch profile details: ${response.statusCode}");
        return false;
      }

      final responseBody = json.decode(response.body);

      // Extract bio and check if it's empty
      String bioFromResponse = responseBody['bio']?['S'] ?? '';

      // Extract registration date
      DateTime registrationDate = _parseDate(responseBody['registrationDate']['S']);

      // Determine if this is a new user (created within the last 24 hours)
      final now = DateTime.now();
      var nextScheduledDate = now.add(Duration(days: 3));
      final isNewUser = now.difference(registrationDate).inHours < 24;
      print("Is new user: $isNewUser");

      // Extract next_bio_show date
      DateTime? nextBioShow;
      try {
        if (responseBody['next_bio_show']?['S'] == null ||
            responseBody['next_bio_show']['S'].toString().isEmpty) {
          if (isNewUser) {
            // For new users, set to the day after registration
            nextBioShow = registrationDate.add(Duration(days: 1));
            print("New user: Setting next_bio_show to day after registration: $nextBioShow");
          } else {
            // For existing users with no next_bio_show, set to current date
            nextBioShow = now;
            print("Existing user: Setting next_bio_show to current date: $nextBioShow");
          }
        } else {
          nextBioShow = DateTime.parse(responseBody['next_bio_show']['S']);
          print("Existing next_bio_show from DB: $nextBioShow");
        }
      } catch (e) {
        print("Error parsing next_bio_show date: $e");
        // Fallback based on user age
        nextBioShow = isNewUser
            ? registrationDate.add(Duration(days: 1))
            : now;
      }

      // Determine if we should show the dialog
      bool shouldShowDialog = now.isAtSameMomentAs(nextBioShow) || now.isAfter(nextBioShow);
      String nextScheduleDateString = nextScheduledDate.toIso8601String();
      if (shouldShowDialog && bioFromResponse.isEmpty) {
        // Calculate the next show date
        nextScheduledDate = now.add(Duration(days: 3));

        String nextScheduleDateString = nextScheduledDate.toIso8601String();
        
        // Update the next_bio_show in backend
        final updateResponse = await ApiService.updateBioShow({
          'user_id': ProfileManager().getUserId(),
          'next_bio_show': nextScheduleDateString,
          'current_date': now.toIso8601String(),
          'registration_date': registrationDate.toIso8601String(),
          'is_new_user': isNewUser
        });

        print("Update response status: ${updateResponse.statusCode}");
        print("Update response body: ${updateResponse.body}");

        if (ApiService.isSuccessResponse(updateResponse)) {
          print("Next bio prompt successfully scheduled for: $nextScheduledDate");
          return true; // Show the dialog
        } else {
          print("Failed to update next bio show date.");
          print("Response body: ${updateResponse.body}");
        }
      }

      return false;
    } catch (e) {
      print("Comprehensive error in _shouldShowBioDialog: $e");
      return false;
    }
  }

// Helper method to parse date safely
//   DateTime _parseDate(String dateString) {
//     try {
//       return DateTime.parse(dateString);
//     } catch (e) {
//       print("Error parsing date: $e");
//       return DateTime.now();
//     }
//   }


  Future<void> clearAllPreferences() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    print("Cleared all shared preferences");
  }





  Future<void> _fetchProfileDetails() async {
    if (!_mounted) return;
    try {
      final response = await ApiService.getUserProfileDetails(ProfileManager().getUserId()!);

      if (!_mounted) return;

      if (ApiService.isSuccessResponse(response) && _mounted) {
        final responseBody = json.decode(response.body);

        print("API Response:");
        print(responseBody);

        // Extract bio and profile photo URL
        String bioFromResponse = responseBody['bio']?['S'] ?? '';
        String profilePhotoUrl = responseBody['profilePhotoUrl']?['S'] ?? '';
        final userCategory = responseBody['Category']?['S'] ?? '';

        print("Bio from API: '$bioFromResponse'");
        print("Profile Photo URL: '$profilePhotoUrl'");
        print("User category: $userCategory");

        if (responseBody != null) {
          if (mounted) {
            setState(() {
              fullName = responseBody['FullName']?['S'] ?? '';
              StageName = responseBody['StageName']?['S'] ?? '';
              bio = bioFromResponse;
              registrationDate = DateTime.parse(responseBody['registrationDate']['S']);
            });

            // Prioritize bio popup first
            if (userCategory == "Singer" && bioFromResponse.isEmpty && await _shouldShowBioDialog() && _mounted) {
              print("Bio is empty - showing bio update dialog");
              _showBioUpdateDialog();
            }
            // If bio is filled, then check for profile image
            else if (userCategory == "Singer" && profilePhotoUrl.isEmpty && await _shouldShowProfileImageDialog() && _mounted) {
              print("Profile photo is empty - showing profile image update dialog");
              _showProfileImageUpdateDialog();
            }
            else {
              print("No dialogs to show - either bio and image are filled or conditions not met");
            }
          }
        } else {
          print('No profile details found.');
        }
      } else {
        print('Failed to fetch profile details. Status code: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching profile details: $e');
    }
  }
  Future<bool> _shouldShowProfileImageDialog() async {
    if (widget.category != "Singer") {
      print("User is not a singer. Profile image update dialog will not be shown.");
      return false;
    }

    try {
      final response = await ApiService.getUserProfileDetails(ProfileManager().getUserId()!);

      if (!ApiService.isSuccessResponse(response)) {
        print("Failed to fetch profile details: ${response.statusCode}");
        return false;
      }

      final responseBody = json.decode(response.body);

      // Extract profile photo URL and check if it's empty
      String profilePhotoUrl = responseBody['profilePhotoUrl']?['S'] ?? '';

      // Extract registration date
      DateTime registrationDate = _parseDate(responseBody['registrationDate']['S']);

      // Determine if this is a new user (created within the last 24 hours)
      final now = DateTime.now();
      final isNewUser = now.difference(registrationDate).inHours < 24;
      print("Is new user: $isNewUser");

      // Extract next_bio_show date
      DateTime? nextBioShow;
      try {
        if (responseBody['next_bio_show']?['S'] == null ||
            responseBody['next_bio_show']['S'].toString().isEmpty) {
          if (isNewUser) {
            // For new users, set to the day after registration
            nextBioShow = registrationDate.add(Duration(days: 1));
            print("New user: Setting next_bio_show to day after registration: $nextBioShow");
          } else {
            // For existing users with no next_bio_show, set to current date
            nextBioShow = now;
            print("Existing user: Setting next_bio_show to current date: $nextBioShow");
          }
        } else {
          nextBioShow = DateTime.parse(responseBody['next_bio_show']['S']);
          print("Existing next_bio_show from DB: $nextBioShow");
        }
      } catch (e) {
        print("Error parsing next_bio_show date: $e");
        // Fallback based on user age
        nextBioShow = isNewUser
            ? registrationDate.add(Duration(days: 1))
            : now;
      }

      // Determine if we should show the dialog
      bool shouldShowDialog = now.isAtSameMomentAs(nextBioShow) || now.isAfter(nextBioShow);

      if (shouldShowDialog && profilePhotoUrl.isEmpty) {
        // Calculate the next show date
        final nextScheduledDate = now.add(Duration(days: 3));

        print("Preparing to update next_bio_show to: $nextScheduledDate");

        // Update the next_bio_show in backend
        final updateResponse = await ApiService.updateBioShow({
          'user_id': ProfileManager().getUserId(),
          'next_bio_show': nextScheduledDate.toIso8601String(),
          'current_date': now.toIso8601String(),
          'registration_date': registrationDate.toIso8601String(),
          'is_new_user': isNewUser
        });

        print("Update response status: ${updateResponse.statusCode}");
        print("Update response body: ${updateResponse.body}");

        if (ApiService.isSuccessResponse(updateResponse)) {
          print("Next profile image prompt successfully scheduled for: $nextScheduledDate");
          return true; // Show the dialog
        } else {
          print("Failed to update next profile image show date.");
          print("Response body: ${updateResponse.body}");
        }
      }

      return false;
    } catch (e) {
      print("Comprehensive error in _shouldShowProfileImageDialog: $e");
      return false;
    }
  }
  bool _isDialogShowing = false;
  void _showBioUpdateDialog() {
    if (_isDialogShowing) return;
    _isDialogShowing = true;
    showDialog(
      context: context,
      barrierDismissible: false,
      barrierColor: Colors.transparent, // Make the default barrier transparent
      builder: (BuildContext context) {
        return BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5), // Add blur effect
          child: Container(
            color: Colors.black.withOpacity(0.5), // Semi-transparent overlay
            child: Dialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(28.0),
              ),
              child: Container(
                padding: EdgeInsets.all(0),
                height: 300,
                width: 300,
                decoration: BoxDecoration(
                  color: Color(0xFF151415),
                  borderRadius: BorderRadius.circular(20.0),
                ),
                child: Stack(
                  children: [
                    // Close button
                    Positioned(
                      top: 8,
                      right: 7,
                      child: GestureDetector(
                        behavior: HitTestBehavior.opaque,
                        onTap: () {
                          Navigator.of(context).pop();
                        },
                        child: CircleAvatar(
                          radius: 15,
                          child: Container(
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: Colors.white,
                                width: 2.0,
                              ),
                            ),
                            child: CircleAvatar(
                              radius: 12,
                              backgroundColor: Colors.transparent,
                              child: Icon(
                                Icons.close,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    // Content
                    Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Column(
                          children: [
                            SizedBox(height: 20),
                            Center(
                              child: Padding(
                                padding: const EdgeInsets.all(15.0),
                                child: Text(
                                  'Update your bio',
                                  style: TextStyle(
                                    fontSize: 24.0,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                        SizedBox(height: 20),
                        Center(
                          child: Padding(
                            padding: const EdgeInsets.all(8.0),
                            child: Text(
                              'So your audience gets to ',
                              style: TextStyle(
                                fontSize: 16.0,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),
                        Center(
                          child: Text(
                            'know you better ',
                            style: TextStyle(
                              fontSize: 16.0,
                              color: Colors.white,
                            ),
                          ),
                        ),
                        SizedBox(height: 40.0),
                        // Update Button
                        Center(
                          child: Container(
                            width: 150,
                            child: ElevatedButton(
                              onPressed: () {
                                Navigator.of(context).pop();
                                Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                        builder: (context) => EditProfilePage(
                                          userId: ProfileManager().getUserId()!,
                                          userfullname: widget.userfullname,
                                          userCategory: widget.category,
                                        )
                                    )
                                );
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF2644D9),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(30.0),
                                ),
                                padding: EdgeInsets.symmetric(
                                  vertical: 12.0,
                                ),
                              ),
                              child: Text(
                                'Update',
                                style: TextStyle(
                                  fontSize: 16.0,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    ).then((_) {
      _isDialogShowing = false;
    });
  }

  void _showProfileImageUpdateDialog() {
    if (_isDialogShowing) return;
    _isDialogShowing = true;
    showDialog(
      context: context,
      barrierDismissible: false,
      barrierColor: Colors.transparent,
      builder: (BuildContext context) {
        return BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
          child: Container(
            color: Colors.black.withOpacity(0.5),
            child: Dialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20.0),
              ),
              child: Container(
                constraints: BoxConstraints(
                  maxWidth: 320,
                  minHeight: 280,
                  maxHeight: 400,
                ),
                decoration: BoxDecoration(
                  color: Color(0xFF151415),
                  borderRadius: BorderRadius.circular(20.0),
                ),
                child: Stack(
                  children: [
                    // Close button
                    Positioned(
                      top: 8,
                      right: 8,
                      child: GestureDetector(
                        behavior: HitTestBehavior.opaque,
                        onTap: () {
                          Navigator.of(context).pop();
                        },
                        child: Container(
                          width: 30,
                          height: 30,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: Colors.white,
                              width: 2.0,
                            ),
                          ),
                          child: Icon(
                            Icons.close,
                            color: Colors.white,
                            size: 18,
                          ),
                        ),
                      ),
                    ),
                    // Content
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 40, 20, 20),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          // Title
                          Column(
                            children: [
                              Text(
                                'Update your Profile',
                                style: TextStyle(
                                  fontSize: 22.0,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                                textAlign: TextAlign.center,
                              ),
                              Text(
                                'Image',
                                style: TextStyle(
                                  fontSize: 22.0,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                          SizedBox(height: 20),
                          // Description
                          Column(
                            children: [
                              Text(
                                'So your audience can',
                                style: TextStyle(
                                  fontSize: 16.0,
                                  color: Colors.white,
                                ),
                                textAlign: TextAlign.center,
                              ),
                              Text(
                                'recognize you better',
                                style: TextStyle(
                                  fontSize: 16.0,
                                  color: Colors.white,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                          SizedBox(height: 30),
                          // Update Button
                          Container(
                            width: 150,
                            child: ElevatedButton(
                              onPressed: () {
                                Navigator.of(context).pop();
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => EditProfilePage(
                                      userId: ProfileManager().getUserId()!,
                                      userfullname: widget.userfullname,
                                      userCategory: widget.category,
                                    ),
                                  ),
                                );
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF2644D9),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(30.0),
                                ),
                                padding: EdgeInsets.symmetric(
                                  vertical: 12.0,
                                ),
                              ),
                              child: Text(
                                'Update',
                                style: TextStyle(
                                  fontSize: 16.0,
                                  color: Colors.white,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    ).then((_) {
      _isDialogShowing = false;
    });
  }


  Future<void> _fetchProfileImage() async {
    if (!_mounted) return;
    try {
      // Make the GET request to fetch the profile image URL
      final response = await ApiService.getUserProfilePhoto(ProfileManager().getUserId()!);

      if (response.statusCode == 200) {
        final responseBody = json.decode(response.body);

        // Check if responseBody contains the key 'profilePhotoUrl' and extract 'S' value
        if (responseBody != null && responseBody['profilePhotoUrl'] != null && responseBody['profilePhotoUrl']['S'] != null) {
          String imageUrl = responseBody['profilePhotoUrl']['S']; // Extract the profile image URL
          if (!_mounted) return;
          // Set the profile image URL to display it
          setState(() {
            _profileImageUrl = imageUrl;
          });
        } else {
          print('No profile image URL found in the response.');
        }
      } else {
        print('Failed to fetch profile image. Status code: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching profile image: $e');
    }
  }

  // Function to extract initials from the user's full name
  String getInitials(String? fullName) {
    if (fullName == null || fullName.trim().isEmpty) {
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

  Future<Map<String, dynamic>?> _fetchSongDetails(String songId) async {
    try {
      final response = await ApiService.getSongDetails(songId);

      if (ApiService.isSuccessResponse(response)) {
        // Parse the JSON response
        final Map<String, dynamic>? data = jsonDecode(response.body);

        if (data != null && data.isNotEmpty) {
          return {
            'fileName': data['fileName']?['S'] ?? 'Unknown File',
            'streamingUrl': data['songStreamUrl']?['S'] ?? '',
            'songName': data['songName']?['S'] ?? 'Unknown Song',
            'stageName': data['stage_name']?['S'] ?? 'Unknown Stage Name',
            'playlistCount':data['playlistCount']?['S']??'0',
            'shareSongCount':data['shareSongCount']?['S']??'0',
            'span': data['span']?['S'] ?? '00:00',
            'coverPage': data['coverPageUrl']?['S'] ?? 'assets/placeholder.png', // Default cover page if null
            'songUrl': data['songUrl']?['S'] ?? '', // Fallback if no URL
            'genre': data['genre']?['S'] ?? 'Unknown Genre',
            'languages': data['languages']?['S'] ?? 'Unknown Language',
            'mood': data['mood']?['S'] ?? 'Unknown Mood',
            'playCount': data['playCount']?['S'] ?? '0',
            'approved': data['approved']?['BOOL'] ?? false,
            'userDetails': {
              'email': data['user_EmailId']?['S'] ?? 'No Email',
              'fullName': data['user_FullName']?['S'] ?? 'No Name',
              'profilePhotoUrl': data['coverPageUrl']?['S'] ?? '', // Default or fallback for profile image
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

  Widget _buildBottomNavigationBar() {
    return Container(
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(
            color: Colors.white,
            width: 1.0,
          ),
        ),
      ),
      child: WillPopScope(
        onWillPop: () async {
          // If not on home tab, switch to home tab
          if (_currentIndex != 0) {
            setState(() => _currentIndex = 0);
            return false;
          }
          // If on home tab, show exit confirmation
          return await BackButtonService().showExitDialog(context) ?? false;
        },
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (int index) {
            if (mounted) {
              setState(() {
                _currentIndex = index;
              });
            }
          },
          selectedItemColor: Colors.blue,
          unselectedItemColor: Colors.white,
          type: BottomNavigationBarType.fixed,
          enableFeedback: false,
          showSelectedLabels: true,
          showUnselectedLabels: true,
          selectedFontSize: 12,
          unselectedFontSize: 12,
          //backgroundColor: Colors.transparent,
          elevation: 0,
          items: [
            BottomNavigationBarItem(
              icon: Image.asset('assets/home.png', height: 22),
              label: 'Home',
            ),
            BottomNavigationBarItem(
              icon: Image.asset('assets/explore.png', height: 20),
              label: 'Explore',
            ),
            if (widget.category == 'Singer')
              BottomNavigationBarItem(
                icon: Image.asset('assets/add.png', height: 20),
                label: 'Add',
              ),
            BottomNavigationBarItem(
              icon: Image.asset('assets/library.png', height: 20),
              label: 'Library',
            ),
          ],
        ),
      ),
    );
  }



  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvoked: (didPop) async {
        if (didPop) return;
        await _backButtonService.handleBackPress(_currentIndex, context);
      },
      child: Stack(
        children: [
          GradientScaffold(
            key: _scaffoldKey,
            appBar: _currentIndex == 0 ? _buildAppBar() : null,
            body: Column(
              children: [
                Expanded(
                  child: IndexedStack(
                    index: _currentIndex,
                    children: [
                      HomePage(
                        email: widget.email,
                        userCategory: widget.category,
                        userfullname: widget.userfullname,
                      ),
                      SearchPage(
                        email: widget.email,
                        userCategory: widget.category,
                        userfullname: widget.userfullname,
                        isFromNewHomePage: true,
                      ),
                      if (widget.category == 'Singer')
                        UploadSelectionPage(
                          email: widget.email,
                          fullName: widget.userfullname,
                          isFromNewHomePage: true,
                          showGlobalNavBar: false,
                        ),
                      ProfilePage(
                        userCategory: widget.category,
                        email: widget.email,
                        userfullname: widget.userfullname,
                        isFromNewHomePage: true,
                      ),
                    ],
                  ),
                ),
                ValueListenableBuilder<bool>(
                  valueListenable: isNowPlayingTileVisible,
                  builder: (context, isVisible, _) {
                    if (!isVisible || _currentIndex == 2 && widget.category == 'Singer') return const SizedBox();
                    return NowPlayingTile(
                      email: widget.email,
                      userFullName: widget.userfullname,
                      userCategory: widget.category,
                    );
                  },
                ),
              ],
            ),
            bottomNavigationBar: _buildBottomNavigationBar(),
          ),
          LoadingScreen(
            isLoading: _isLoading,
            isNoInternet: !_hasInternet,
            onRetry: _checkConnectivityAndReload,
          ),
        ],
      ),
    );
  }

  // Function to handle logout
  PreferredSizeWidget? _buildAppBar() {
    return AppBar(
      backgroundColor: Colors.transparent,
      elevation: 0,
      automaticallyImplyLeading: false,
      toolbarHeight: kToolbarHeight + 15,
      title: Text(
        'Start Listening',
        style: TextStyle(
          fontSize: 32,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
      ),
      // title: Image.asset(
      //   'assets/logo.png',
      //   height: 50,
      // ),
      actions: [
        SizedBox(width: 10),
        GestureDetector(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => ProfileSettingsPage(
                  userfullname: widget.userfullname,
                  userId: widget.email,
                  userCategory: widget.category,
                ),
              ),
            );
          },
          child: Container(
            width:40, // Outer container size
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
    );
  }




  // void _exitApp() {
  //   Navigator.of(context).pushAndRemoveUntil(
  //     MaterialPageRoute(builder: (context) => NewHomePage(
  //       email: widget.email,
  //       category: widget.category,
  //       userfullname: widget.userfullname,
  //     )),
  //     (Route<dynamic> route) => false, // Remove all previous routes
  //   );
  //   SystemNavigator.pop(); // Close the app completely
  // }







  void _updateCategory(String category) {
    if (!_mounted) return;
    setState(() {
      selectedCategory = category;
    });
  }
}


// Content for the "For you" category



class ForYouContent extends StatefulWidget {
  final String email;
  final String category;
  final String userfullname;

  ForYouContent({required this.email, required this.category, required this.userfullname});

  @override
  _ForYouContentState createState() => _ForYouContentState();
}

class _ForYouContentState extends State<ForYouContent> {
  // ScrollControllers for each section
  final ScrollController _discoverScrollController = ScrollController(); // For "Discover"
  final ScrollController _forYouScrollController = ScrollController(); // For "For You From India"
  final ScrollController _genreScrollController = ScrollController(); // For "Genre"
  final ScrollController _languageScrollController = ScrollController();

  // Data lists
  List<Map<String, dynamic>> artists = [];
  List<Map<String, dynamic>> genreList = [];
  List<Map<String, dynamic>> languageList = [];
  List<Map<String, dynamic>> freshSongs = [];

  // Loading states
  bool isLoading = true;
  bool isGenreLoading = true;
  bool isLanguageLoading = true;
  bool isFreshSongsLoading = true;
  bool isLoadingMore = false;
  bool isGenreLoadingMore = false;
  bool isLanguageLoadingMore = false;
  bool isRefreshing = false;
  bool isInitialLoading = true; // For initial load only
  bool _mounted = true;

  // Cached fresh songs data
  List<Map<String, String>> cachedFreshSongs = [];

  // Cached top 30 songs data
  List<Map<String, String>> cachedTop30Songs = [];
  bool isTop30SongsLoading = false;

  // Initial load counts
  final int initialLoadCount = 3;
  final int initialGenreLoadCount = 3;
  final int initialLanguageLoadCount = 3;


  @override
  void initState() {
    super.initState();
    _setupScrollListener();
    _setupGenreScrollListener();
    _setupLanguageScrollListener();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        // Initial data fetching
        fetchInitialArtists();
        fetchInitialGenres();
        fetchInitialLanguages();
        // Preload fresh songs data to properly manage loading state
        _preloadFreshSongsData();
      }
    });
  }

  void setState(VoidCallback fn) {
    if ( mounted) {
      super.setState(fn);
    }
  }


  void _setupLanguageScrollListener() {
    _languageScrollController.addListener(() {
      if (_languageScrollController.position.pixels >=
          _languageScrollController.position.maxScrollExtent * 0.8 &&
          !isLanguageLoadingMore) {
        loadMoreLanguages();
      }
    });
  }

  final Map<String, String> languageCoverPages = {
    'Assamese': ImageUtils.getLanguageImagePathSync('Assamese'),
    'Bengali': ImageUtils.getLanguageImagePathSync('Bengali'),
    'Bhojpuri': ImageUtils.getLanguageImagePathSync('Bhojpuri'),
    'English': ImageUtils.getLanguageImagePathSync('English'),
    'Gujarati': ImageUtils.getLanguageImagePathSync('Gujarati'),
    'Hindi': ImageUtils.getLanguageImagePathSync('Hindi'),
    'Kannada': ImageUtils.getLanguageImagePathSync('Kannada'),
    'Kashmiri': ImageUtils.getLanguageImagePathSync('Kashmiri'),
    'Konkani': ImageUtils.getLanguageImagePathSync('Konkani'),
    'Malayalam': ImageUtils.getLanguageImagePathSync('Malayalam'),
    'Manipuri': ImageUtils.getLanguageImagePathSync('Manipuri'),
    'Marathi': ImageUtils.getLanguageImagePathSync('Marathi'),
    'Oriya': ImageUtils.getLanguageImagePathSync('Oriya'),
    'Pahari': ImageUtils.getLanguageImagePathSync('Pahari'),
    'Punjabi': ImageUtils.getLanguageImagePathSync('Punjabi'),
    'Rajasthani': ImageUtils.getLanguageImagePathSync('Rajasthani'),
    'Sanskrit': ImageUtils.getLanguageImagePathSync('Sanskrit'),
    'Tamil': ImageUtils.getLanguageImagePathSync('Tamil'),
    'Telugu': ImageUtils.getLanguageImagePathSync('Telugu'),
    'Urdu': ImageUtils.getLanguageImagePathSync('Urdu'),
    // Default fallback for unlisted languages
    //'default': 'assets/lang/default_lang.webp',
  };



  Future<void> fetchInitialLanguages() async {
    if (!mounted) return;
    try {
      final response = await ApiService.getLanguageCount();
      if (!mounted) return;
      if (ApiService.isSuccessResponse(response)) {
        List<dynamic> allLanguages = jsonDecode(response.body);
        print(allLanguages);

        allLanguages.sort((a, b) => (b['count'] ?? 0).compareTo(a['count'] ?? 0));
        List<dynamic> initialLanguages = allLanguages.take(initialLanguageLoadCount).toList();
        if (!mounted) return;
        setState(() {
          languageList = initialLanguages.map<Map<String, dynamic>>((language) {
            String languageName = language['language'] ?? 'Unknown Language';
            return {
              'language': languageName,
              'count': language['count'] ?? 0,
              'image': languageCoverPages[languageName] ?? 'assets/default_lang.jpg',
            };
          }).toList();
          isLanguageLoading = false;
        });

        // Load remaining languages in the background
        loadRemainingLanguages(allLanguages.skip(initialLanguageLoadCount).toList());
      }
    } catch (error) {
      print('Error fetching languages: $error');
      if (!mounted) return;
      setState(() => isLanguageLoading = false);
    }
  }

// Update the loadRemainingLanguages method to use the image map
  Future<void> loadRemainingLanguages(List<dynamic> remainingLanguages) async {
    if (remainingLanguages.isEmpty) return;

    for (var language in remainingLanguages) {
      if (!mounted) return;

      String languageName = language['language'] ?? 'Unknown Language';

      // Check if the language already exists
      final languageExists = languageList.any((existingLanguage) =>
      existingLanguage['language'] == languageName);

      if (!languageExists) {
        if (!mounted) return;
        setState(() {
          languageList.add({
            'language': languageName,
            'count': language['count'] ?? 0,
            'image': languageCoverPages[languageName] ?? 'assets/default_lang.jpg',
          });
        });
      }

      await Future.delayed(Duration(milliseconds: 100));
    }
  }

  Future<void> loadMoreLanguages() async {
    if (!mounted) return;
    setState(() => isLanguageLoadingMore = true);

    // Simulate loading more languages from the server
    await Future.delayed(Duration(milliseconds: 500));
    if (!mounted) return;

    setState(() => isLanguageLoadingMore = false);
  }

  void _setupGenreScrollListener() {
    _genreScrollController.addListener(() {
      if (_genreScrollController.position.pixels >=
          _genreScrollController.position.maxScrollExtent * 0.8 &&
          !isGenreLoadingMore) {
        loadMoreGenres();
      }
    });
  }

  Future<void> fetchInitialGenres() async {
    if (!mounted) return;
    try {
      final response = await ApiService.getGenreCount();

      if (!mounted) return;

      if (ApiService.isSuccessResponse(response)) {
        List<dynamic> allGenres = jsonDecode(response.body);
        print(allGenres);
        allGenres.sort((a, b) => (b['count'] ?? 0).compareTo(a['count'] ?? 0));
        List<dynamic> initialGenres = allGenres.take(initialGenreLoadCount).toList();

        if (!mounted) return;

        setState(() {
          genreList = initialGenres.map<Map<String, dynamic>>((genre) {
            String genreName = genre['genre'] ?? 'Unknown Genre';
            return {
              'genre': genreName,
              'count': genre['count'] ?? 0,
              'image': genreCoverPages[genreName] ?? 'assets/logo.png', // Use static cover page URL
            };
          }).toList();
          isGenreLoading = false;
        });

        // Load remaining genres in the background
        loadRemainingGenres(allGenres.skip(initialGenreLoadCount).toList());
      }
    } catch (error) {
      print('Error fetching genres: $error');
      if (!mounted) return;
      setState(() => isGenreLoading = false);
    }
  }

  Future<void> loadRemainingGenres(List<dynamic> remainingGenres) async {
    if (remainingGenres.isEmpty) return;

    for (var genre in remainingGenres) {
      if (!mounted) return;

      String genreName = genre['genre'] ?? 'Unknown Genre';

      // Check if the genre already exists
      final genreExists = genreList.any((existingGenre) =>
      existingGenre['genre'] == genreName);

      if (!genreExists) {
        if (!mounted) return;
        setState(() {
          genreList.add({
            'genre': genreName,
            'count': genre['count'] ?? 0,
            'image': genreCoverPages[genreName] ?? 'assets/logo.png', // Use static cover page URL
          });
        });
      }

      await Future.delayed(Duration(milliseconds: 100));
    }
  }

  Future<void> loadMoreGenres() async {
    if (!mounted) return;
    setState(() => isGenreLoadingMore = true);

    // Simulate loading more genres from the server
    await Future.delayed(Duration(milliseconds: 500));
    if (!mounted) return;

    setState(() => isGenreLoadingMore = false);
  }

  void _setupScrollListener() {
    _discoverScrollController.addListener(() {
      if (_discoverScrollController.position.pixels >=
          _discoverScrollController.position.maxScrollExtent * 0.8 &&
          !isLoadingMore) {
        loadMoreArtists();
      }
    });
  }

  Future<void> fetchInitialArtists() async {
    if (!mounted) return;
    try {
      final response = await ApiService.getArtists();
      if (!mounted) return;
      if (ApiService.isSuccessResponse(response)) {
        List<dynamic> allData = jsonDecode(response.body);
        print(allData);

        // Filter only artists with non-zero song count
        List<dynamic> filteredData = allData
            .where((artist) =>
        artist['songCount'] != null &&
            int.tryParse(artist['songCount'].toString()) != null &&
            int.parse(artist['songCount'].toString()) > 0)
            .toList();

        // Sort by songCount in descending order
        filteredData.sort((a, b) {
          final countA = int.parse(a['songCount'].toString());
          final countB = int.parse(b['songCount'].toString());
          return countB.compareTo(countA);
        });

        // Log filtered and sorted data for debugging
        print("Filtered and Sorted Data: $filteredData");

        // Load initial artists
        List<dynamic> initialData = filteredData.take(initialLoadCount).toList();
        if (!mounted) return;

        setState(() {
          artists = initialData.map<Map<String, dynamic>>((artist) {
            final stageName = (artist['StageName']?.trim().isNotEmpty == true)
                ? artist['StageName']
                : (artist['FullName']?.trim().isNotEmpty == true)
                ? artist['FullName']
                : 'Unknown Artist';

            return {
              'stageName': stageName,
              'userId': artist['user_id'] ?? '',
              'profilePhotoUrl': artist['profilePhotoUrl'] ?? '',
              'fullName': artist['FullName'] ?? '',
              'songCount': artist['songCount'] ?? 0,
            };
          }).toList();
          isLoading = false;
        });

        // Load remaining artists in background
        loadRemainingArtists(filteredData.skip(initialLoadCount).toList());
      }
    } catch (e) {
      print('Error fetching initial artists: $e');
      if (!mounted) return;
      setState(() => isLoading = false);
    }
  }

  Future<void> loadRemainingArtists(List<dynamic> remainingData) async {
    if (remainingData.isEmpty) return;

    for (var artist in remainingData) {
      if (!mounted) return;

      setState(() {
        // Add only artists with non-zero song count
        if (artist['songCount'] != null && artist['songCount'] > 0) {
          artists.add({
            'stageName': (artist['StageName']?.trim().isNotEmpty == true)
                ? artist['StageName']
                : (artist['FullName']?.trim().isNotEmpty == true)
                ? artist['FullName']
                : 'Unknown Artist',
            'userId': artist['user_id'] ?? '',
            'profilePhotoUrl': artist['profilePhotoUrl'] ?? '',
            'fullName': artist['FullName'] ?? '',
            'songCount': artist['songCount'] ?? 0,
          });
        }
      });

      // Add a small delay to prevent UI blocking
      await Future.delayed(Duration(milliseconds: 100));
    }
  }


  Future<void> loadMoreArtists() async {
    // This method would be used if fetching from API with pagination
    // For now, it's handled by loadRemainingArtists
    if (!mounted) return;
    setState(() => isLoadingMore = true);
    await Future.delayed(Duration(milliseconds: 500));
    if (!mounted) return;
    setState(() => isLoadingMore = false);
  }

  // Fetch songs for specific genre and update the state

  final Map<String, String> genreCoverPages = {
    'Classical': ImageUtils.getGenreImagePathSync('classical'),
    'Folk': ImageUtils.getGenreImagePathSync('Folk1'),
    'Devotional': ImageUtils.getGenreImagePathSync('devotional 2'),
    'Ghazal': ImageUtils.getGenreImagePathSync('ghazal'),
    'Sufi': ImageUtils.getGenreImagePathSync('sufi'),
    'Pop': ImageUtils.getGenreImagePathSync('pop'),
    'Rock': ImageUtils.getGenreImagePathSync('rock'),
    'Rap': ImageUtils.getGenreImagePathSync('rap2'),
    'Jazz': ImageUtils.getGenreImagePathSync('jazz'),
    'Rabindra Sangeet': ImageUtils.getGenreImagePathSync('rabindra-sangeet'),
    'Fusion': ImageUtils.getGenreImagePathSync('fusion'),
    'Romantic': ImageUtils.getGenreImagePathSync('romantic 2'),
    'Kids': ImageUtils.getGenreImagePathSync('others'),
    'Others': ImageUtils.getGenreImagePathSync('others'),
    // Default fallback for unlisted genres
    //'default': 'assets/genre/default_genre.webp',
  };

  Future<List<Map<String, String>>> fetchSongsByGenre() async {
    try {
      final response = await ApiService.getSongsByGenre('Romantic');

      if (ApiService.isSuccessResponse(response)) {
        List<dynamic> data = jsonDecode(response.body);
        return data.map<Map<String, String>>((song) {
          return {
            'title': song['songName']['S'] ?? 'Unknown Title',
            'artist': song['stage_name']['S'] != null && song['stage_name']['S'].toString().trim().isNotEmpty
                ? song['stage_name']['S']
                : song['FullName']['S'] ?? 'Unknown Artist',
            'song_id': song['song_id']['S'] ?? 'Unknown Song Id',
            'coverPage': song['coverPageUrl']['S'] ?? 'assets/logo.png',
            'duration': song['span']['S'] ?? '0:00',
          };
        }).toList();
      } else {
        throw Exception('Failed to load songs');
      }
    } catch (error) {
      throw Exception('Error fetching songs: $error');
    }
  }

  // Scroll functions for each section
  void _scrollDiscoverRight() {
    _discoverScrollController.animateTo(
      _discoverScrollController.offset + 200, // Scroll by 200 pixels
      duration: Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
  }

  void _scrollForYouRight() {
    _forYouScrollController.animateTo(
      _forYouScrollController.offset + 200, // Scroll by 200 pixels
      duration: Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
  }

  void _scrollGenreRight() {
    _genreScrollController.animateTo(
      _genreScrollController.offset + 200, // Scroll by 200 pixels
      duration: Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
  }


  Future<void> _preloadFreshSongsData() async {
    if (!mounted) return;

    try {
      setState(() {
        isFreshSongsLoading = true;
      });

      final userId = ProfileManager().getUserId();
      print('Preloading fresh songs with user ID: $userId');

      final response = await ApiService.getFreshSongs(userId!);

      if (!mounted) return;

      print('API Response status: ${response.statusCode}');
      print('API Response body: ${response.body.substring(0, min(100, response.body.length))}...');

      if (ApiService.isSuccessResponse(response)) {
        final List<dynamic> data = jsonDecode(response.body);
        print('Preloaded ${data.length} fresh songs');

        final List<Map<String, String>> songsList = [];

        for (var song in data) {
          try {
            if (song is Map<String, dynamic>) {
              Map<String, String> songMap = {};

              // ? DynamoDB format (map with .S values)
              if (song.containsKey('song_id') && song['song_id'] is Map && song['song_id'].containsKey('S')) {
                final artistName = (song['stage_name']?['S']?.isNotEmpty == true)
                    ? song['stage_name']['S']
                    : (song['FullName']?['S'] ?? 'Unknown Artist');

                songMap = {
                  'song_id': song['song_id']['S'] ?? '',
                  'title': song['songName']?['S'] ?? 'Unknown Song',
                  'artist': artistName,
                  'coverPage': song['coverPageUrl']?['S'] ?? 'assets/logo.png',
                  'streamingUrl': song['songStreamUrl']?['S'] ?? '',
                  'duration': song['span']?['S'] ?? '0:00',
                  'languages': song['languages']?['S'] ?? 'unknown',
                  'genre': song['genre']?['S'] ?? 'Unknown',
                  'album': song['albumName']?['S'] ?? 'Unknown Album',
                  'albumId': song['albumId']?['S'] ?? song['album_id']?['S'] ?? '', // ? Support both albumId and album_id
                  'artistId': song['user_id']?['S'] ?? song['artistId']?['S'] ?? '', // ? Add artistId for "Go to album" functionality
                };
              }

              // ? Normal JSON format
              else if (song.containsKey('song_id') || song.containsKey('songId')) {
                final artistName = (song['stage_name']?.toString().isNotEmpty == true || song['stageName']?.toString().isNotEmpty == true)
                    ? (song['stage_name'] ?? song['stageName']).toString()
                    : (song['FullName'] ?? 'Unknown Artist').toString();

                songMap = {
                  'song_id': (song['song_id'] ?? song['songId'] ?? '').toString(),
                  'title': (song['title'] ?? song['songName'] ?? 'Unknown Song').toString(),
                  'artist': artistName,
                  'coverPage': (song['cover_image_url'] ?? song['coverPageUrl'] ?? song['cover_page_url'] ?? 'assets/logo.png').toString(),
                  'streamingUrl': (song['songStreamUrl'] ?? song['song_stream_url'] ?? song['streaming_url'] ?? '').toString(),
                  'duration': (song['duration'] ?? song['span'] ?? '0:00').toString(),
                  'languages': (song['languages'] ?? song['language'] ?? '').toString(),
                  'genre': (song['genre'] ?? 'Unknown').toString(),
                  'album': (song['albumName'] ?? song['album'] ?? 'Unknown Album').toString(),
                  'albumId': (song['album_id'] ?? song['albumId'] ?? '').toString(), // ? FIXED
                  'artistId': (song['user_id'] ?? song['artistId'] ?? song['artist_id'] ?? '').toString(), // ? Add artistId for "Go to album" functionality
                };
              }

              if (songMap.isNotEmpty &&
                  songMap['song_id']!.isNotEmpty &&
                  songMap['streamingUrl']!.isNotEmpty) {
                print('? Song: ${songMap['title']} | albumId: ${songMap['albumId']}');
                songsList.add(songMap);
              } else {
                print('?? Skipping invalid song: $songMap');
              }
            }
          } catch (e) {
            print('? Error parsing song during preload: $e');
          }
        }

        if (!mounted) return;

        setState(() {
          cachedFreshSongs = songsList;
          isFreshSongsLoading = false;
        });
      } else {
        print('? Failed to preload fresh songs: ${response.statusCode}');
        if (!mounted) return;
        setState(() {
          isFreshSongsLoading = false;
        });
      }
    } catch (e) {
      print('? Error preloading fresh songs: $e');
      if (!mounted) return;
      setState(() {
        isFreshSongsLoading = false;
      });
    }
  }

  Future<void> _handleRefresh() async {
    setState(() {
      isRefreshing = true;
      // Clear cached fresh songs to force a refresh
      cachedFreshSongs = [];
    });

    // Refresh all data
    await Future.wait([
      fetchInitialArtists(),
      fetchInitialGenres(),
      fetchInitialLanguages(),
      _preloadFreshSongsData(),
    ]);

    setState(() {isRefreshing = false;});

    return Future.value();
  }

  // ... rest of the code remains the same ...

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
        color: Colors.black, // Changed refresh indicator color to purple
        backgroundColor: Colors.white,
        onRefresh: _handleRefresh,
        child: ListView(
          physics: AlwaysScrollableScrollPhysics(),
          children: [
            SizedBox(height: 15),
            // Latest Music Section
            Row(
              children: [
                Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: Text(
                    'Latest Music',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
                Spacer(),
              ],
            ),
            SizedBox(height: 10),
            SizedBox(
              height: 160,
              child: isLoading
                  ? Shimmer.fromColors(
                baseColor: Colors.grey[800]!,
                highlightColor: Colors.grey[700]!,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: 5,
                  itemBuilder: (context, index) {
                    return Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: Container(
                        width: 120,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(8.0),
                        ),
                      ),
                    );
                  },
                ),
              )
                  : ListView.builder(
                controller: _discoverScrollController,
                scrollDirection: Axis.horizontal,
                itemCount: artists.length + 2 + (isLoadingMore ? 1 : 0), // +2 for the Fresh Songs and Top 30 Songs containers
                itemBuilder: (context, index) {
                  if (index == 0) {
                    // Fresh Songs Container
                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 8.0),
                      child: GestureDetector(
                        onTap: () async {
                          print('Fresh Songs container tapped');

                          // If we already have cached fresh songs, use them instead of making another API call
                          if (cachedFreshSongs.isNotEmpty) {
                            print('Using cached fresh songs data: ${cachedFreshSongs.length} songs');
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => ListPage(
                                  genreTitle: 'Fresh 10 Songs',
                                  bannerImage: 'assets/fresh10_banner.png',
                                  email: widget.email,
                                  Category: widget.category,
                                  fullname: widget.userfullname,
                                  songs: cachedFreshSongs,
                                  originIndex: 0,
                                ),
                              ),
                            );
                            return;
                          }

                          try {
                            // Set loading state to true when starting the fetch
                            setState(() {
                              isFreshSongsLoading = true;
                            });

                            // Get the user ID for authentication
                            final userId = ProfileManager().getUserId();
                            print('Using user ID for authentication: $userId');

                            // Use the correct fresh songs API endpoint with proper authentication
                            final response = await ApiService.getFreshSongs(userId!);

                            print('API Response status: ${response.statusCode}');
                            print('API Response body: ${response.body.substring(0, min(100, response.body.length))}...');

                            if (ApiService.isSuccessResponse(response)) {
                              final List<dynamic> data = jsonDecode(response.body);
                              print('Parsed ${data.length} songs from API');

                              if (data.isNotEmpty) {
                                print('First song sample: ${data[0]}');
                              }

                              // Convert to the format ListPage expects
                              final List<Map<String, String>> songsList = [];

                              for (var song in data) {
                                try {
                                  // Check if the song has the expected structure
                                  if (song is Map<String, dynamic>) {
                                    // Handle different possible formats
                                    Map<String, String> songMap = {};

                                    // Try DynamoDB format first (which is what the fresh-songs API returns)
                                    if (song.containsKey('song_id') && song['song_id'] is Map && song['song_id'].containsKey('S')) {
                                      songMap = {
                                        'song_id': song['song_id']['S'] ?? '',
                                        'title': song['songName']?['S'] ?? 'Unknown Song',
                                        'artist': song['stage_name']?['S'] != null && song['stage_name']['S'].toString().trim().isNotEmpty
                                            ? song['stage_name']['S']
                                            : song['FullName']?['S'] ?? 'Unknown Artist',
                                        'coverPage': song['coverPageUrl']?['S'] ?? 'assets/logo.png',
                                        // Use the correct streaming URL field
                                        'streamingUrl': song['songStreamUrl']?['S'] ?? '',
                                        'duration': song['span']?['S'] ?? '0:00',
                                        'languages': song['languages']?['S'] ?? 'unknown',
                                        // Add genre for completeness
                                        'genre': song['genre']?['S'] ?? 'Unknown',
                                        // Add album if available
                                        'album': song['album']?['S'] ?? 'Unknown Album',
                                        // Add albumId and artistId for "Go to album" functionality
                                        'albumId': song['album_id']?['S'] ?? song['albumId']?['S'] ?? '',
                                        'artistId': song['user_id']?['S'] ?? song['artistId']?['S'] ?? '',
                                      };
                                    }
                                    // Try regular JSON format
                                    else if (song.containsKey('song_id') || song.containsKey('songId')) {
                                      songMap = {
                                        'song_id': (song['song_id'] ?? song['songId'] ?? '').toString(),
                                        'title': (song['title'] ?? song['songName'] ?? 'Unknown Song').toString(),
                                        'artist': (song['stage_name'] != null && song['stage_name'].toString().trim().isNotEmpty)
                                            ? song['stage_name'].toString()
                                            : (song['FullName'] ?? song['artist_name'] ?? song['stageName'] ?? 'Unknown Artist').toString(),
                                        'coverPage': (song['cover_image_url'] ?? song['coverPageUrl'] ?? song['cover_page_url'] ?? 'assets/logo.png').toString(),
                                        'streamingUrl': (song['songStreamUrl'] ?? song['song_stream_url'] ?? song['streaming_url'] ?? '').toString(),
                                        'duration': (song['duration'] ?? song['span'] ?? '0:00').toString(),
                                        'languages': (song['languages'] ?? song['language'] ?? '').toString(),
                                        'genre': (song['genre'] ?? 'Unknown').toString(),
                                        'album': (song['album'] ?? 'Unknown Album').toString(),
                                        // Add albumId and artistId for "Go to album" functionality
                                        'albumId': (song['album_id'] ?? song['albumId'] ?? '').toString(),
                                        'artistId': (song['user_id'] ?? song['artistId'] ?? song['artist_id'] ?? '').toString(),
                                      };
                                    }

                                    // Verify we have the essential fields
                                    if (songMap.isNotEmpty &&
                                        songMap['song_id']?.isNotEmpty == true &&
                                        songMap['streamingUrl']?.isNotEmpty == true) {
                                      print('Adding song: ${songMap['title']} with URL: ${songMap['streamingUrl']}');
                                      songsList.add(songMap);
                                    } else {
                                      print('Skipping song with missing essential data: ${songMap['title']}');
                                    }
                                  }
                                } catch (e) {
                                  print('Error parsing song: $e');
                                }
                              }

                              // Only navigate if we have songs
                              if (songsList.isNotEmpty) {
                                // Cache the songs for future use
                                cachedFreshSongs = List<Map<String, String>>.from(songsList);

                                print('Navigating with ${songsList.length} songs');
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => ListPage(
                                      genreTitle: 'Fresh 10 Songs',
                                      bannerImage: 'assets/fresh10_banner.png',
                                      email: widget.email,
                                      Category: widget.category,
                                      fullname: widget.userfullname,
                                      songs: songsList,
                                      originIndex: 0,
                                    ),
                                  ),
                                );
                              } else {
                                print('No valid songs found in API response');
                                ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text('No fresh songs available at the moment.'))
                                );
                              }
                            } else {
                              print('API returned error status: ${response.statusCode}');
                              ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text('Unable to load fresh songs. Please try again later.'))
                              );
                              // Set loading state to false when API returns an error
                              setState(() {
                                isFreshSongsLoading = false;
                              });
                            }
                          } catch (e) {
                            print('Error fetching fresh songs: $e');
                            ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('Error loading fresh songs: $e'))
                            );
                          } finally {
                            // Always set loading state to false when fetch completes or fails
                            setState(() {
                              isFreshSongsLoading = false;
                            });
                          }
                        },
                        child: Container(
                          width: 149,
                          height: 144,
                          decoration: BoxDecoration(
                            color: Colors.black,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Column(
                            children: [
                              Expanded(
                                child: Stack(
                                  children: [
                                    Container(
                                      margin: EdgeInsets.all(8),
                                      child: ClipRRect(
                                        borderRadius: BorderRadius.circular(4),
                                        child: Image.asset(
                                          'assets/fresh10_banner.png',
                                          width: double.infinity,
                                          height: double.infinity,
                                          fit: BoxFit.contain,
                                          errorBuilder: (context, error, stackTrace) {
                                            return Container(
                                              color: Colors.red,
                                              child: Center(
                                                child: Text(
                                                  'TOP 10',
                                                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                                                ),
                                              ),
                                            );
                                          },
                                        ),
                                      ),
                                    ),
                                    // Show loading indicator when fetching fresh songs
                                    if (isFreshSongsLoading)
                                      Container(
                                        margin: EdgeInsets.all(8),
                                        decoration: BoxDecoration(
                                          color: Colors.black.withOpacity(0.5),
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: Center(
                                          child: SizedBox(
                                            width: 20,
                                            height: 20,
                                            child: CircularProgressIndicator(
                                              strokeWidth: 2,
                                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                            ),
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                              Container(
                                width: double.infinity,
                                height: 25,
                                padding: EdgeInsets.symmetric(horizontal: 8),
                                child: Text(
                                  'Fresh 10 Songs',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 15,
                                  ),
                                  textAlign: TextAlign.left,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  }

                  if (index == 1) {
                    // Top 30 Songs Container
                    return Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 8.0),
                      child: GestureDetector(
                        onTap: () async {
                          print('Top 30 Songs container tapped');

                          // If we already have cached top 30 songs, use them instead of making another API call
                          if (cachedTop30Songs.isNotEmpty) {
                            print('Using cached top 30 songs data: ${cachedTop30Songs.length} songs');

                            // Ensure cached songs are also sorted by rank
                            List<Map<String, String>> sortedCachedSongs = List<Map<String, String>>.from(cachedTop30Songs);
                            sortedCachedSongs.sort((a, b) {
                              int rankA = int.tryParse(a['rank'] ?? '999') ?? 999;
                              int rankB = int.tryParse(b['rank'] ?? '999') ?? 999;
                              return rankA.compareTo(rankB);
                            });

                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => ListPage(
                                  genreTitle: 'Top Trending Songs',
                                  bannerImage: 'assets/top30_banner.png',
                                  email: widget.email,
                                  Category: widget.category,
                                  fullname: widget.userfullname,
                                  songs: sortedCachedSongs,
                                  originIndex: 0,
                                ),
                              ),
                            );
                            return;
                          }

                          try {
                            // Set loading state to true when starting the fetch
                            setState(() {
                              isTop30SongsLoading = true;
                            });

                            print('Fetching top 30 songs from API...');
                            // Get the user ID for authentication
                            final userId = ProfileManager().getUserId();
                            print('Using user ID for authentication: $userId');

                            // Use the top 30 songs API endpoint
                            final response = await ApiService.getTopSongs(userId!);

                            print('API Response status: ${response.statusCode}');
                            print('API Response body: ${response.body.substring(0, min(100, response.body.length))}...');

                            if (ApiService.isSuccessResponse(response)) {
                              final List<dynamic> data = jsonDecode(response.body);
                              print('Parsed ${data.length} songs from API');

                              if (data.isNotEmpty) {
                                print('First song sample: ${data[0]}');
                              }

                              // Convert to the format ListPage expects
                              final List<Map<String, String>> songsList = [];

                              for (var song in data) {
                                try {
                                  // Check if the song has the expected structure
                                  if (song is Map<String, dynamic>) {
                                    Map<String, String> songMap = {
                                      'song_id': (song['song_id'] ?? '').toString(),
                                      'title': (song['songName'] ?? 'Unknown Song').toString(),
                                      'artist': (song['stage_name'] != null && song['stage_name'].toString().trim().isNotEmpty
                                          ? song['stage_name']
                                          : song['FullName'] ?? 'Unknown Artist').toString(),
                                      'coverPage': (song['coverPageUrl'] ?? 'assets/logo.png').toString(),
                                      'streamingUrl': (song['songStreamUrl'] ?? '').toString(),
                                      'duration': (song['span'] ?? '0:00').toString(),
                                      'languages': (song['languages'] ?? '').toString(),
                                      'genre': (song['genre'] ?? 'Unknown').toString(),
                                      'album': (song['album'] ?? 'Unknown Album').toString(),
                                      'playcount': (song['playcount'] ?? 0).toString(),
                                      'rank': (song['rank'] ?? 0).toString(),
                                      // Add albumId and artistId for "Go to album" functionality
                                      'albumId': (song['album_id'] ?? song['albumId'] ?? '').toString(),
                                      'artistId': (song['user_id'] ?? song['artistId'] ?? song['artist_id'] ?? '').toString(),
                                    };

                                    // Verify we have the essential fields
                                    if (songMap['song_id']?.isNotEmpty == true &&
                                        songMap['streamingUrl']?.isNotEmpty == true) {
                                      print('Adding song: ${songMap['title']} with rank: ${songMap['rank']}, playcount: ${songMap['playcount']}, albumId: ${songMap['albumId']}');
                                      songsList.add(songMap);
                                    } else {
                                      print('Skipping song with missing essential data: ${songMap['title']}');
                                    }
                                  }
                                } catch (e) {
                                  print('Error parsing song: $e');
                                }
                              }

                              // Only navigate if we have songs
                              if (songsList.isNotEmpty) {
                                // Sort songs by rank (ascending order - rank 1 should be first)
                                songsList.sort((a, b) {
                                  int rankA = int.tryParse(a['rank'] ?? '999') ?? 999;
                                  int rankB = int.tryParse(b['rank'] ?? '999') ?? 999;
                                  return rankA.compareTo(rankB);
                                });

                                print('Songs sorted by rank: ${songsList.map((s) => '${s['title']} (rank: ${s['rank']})').join(', ')}');

                                // Cache the songs for future use
                                cachedTop30Songs = List<Map<String, String>>.from(songsList);

                                print('Navigating with ${songsList.length} top songs');
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => ListPage(
                                      genreTitle: 'Top 30 Songs',
                                      bannerImage: 'assets/top30_banner.png',
                                      email: widget.email,
                                      Category: widget.category,
                                      fullname: widget.userfullname,
                                      songs: songsList,
                                      originIndex: 0,
                                    ),
                                  ),
                                );
                              } else {
                                print('No valid songs found in API response');
                                ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(content: Text('No top songs available at the moment.'))
                                );
                              }
                            } else {
                              print('API returned error status: ${response.statusCode}');
                              ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text('Unable to load top songs. Please try again later.'))
                              );
                            }
                          } catch (e) {
                            print('Error fetching top 30 songs: $e');
                            ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text('Error loading top songs: $e'))
                            );
                          } finally {
                            // Always set loading state to false when fetch completes or fails
                            setState(() {
                              isTop30SongsLoading = false;
                            });
                          }
                        },
                        child: Container(
                          width: 149,
                          height: 144,
                          decoration: BoxDecoration(
                            color: Colors.black,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Column(
                            children: [
                              Expanded(
                                child: Stack(
                                  children: [
                                    Container(
                                      margin: EdgeInsets.all(8),
                                      child: ClipRRect(
                                        borderRadius: BorderRadius.circular(4),
                                        child: Container(
                                          width: double.infinity,
                                          height: double.infinity,
                                          decoration: BoxDecoration(
                                            image: DecorationImage(
                                              image: AssetImage('assets/top30_banner.png'), // Path to your image file
                                              fit: BoxFit.cover, // Ensures the image covers the entire container
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Container(
                                width: double.infinity,
                                height: 25,
                                padding: EdgeInsets.symmetric(horizontal: 8),
                                child: Text(
                                  'Trending Songs',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 15,
                                  ),
                                  textAlign: TextAlign.left,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  }

                  if (index == artists.length + 2) {
                    return Center(
                      child: SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    );
                  }

                  final artist = artists[index - 2]; // Adjust index to account for Fresh Songs and Top 30 Songs containers
                  return DiscoverCard(
                    artist['stageName'],
                    '',
                    artist['profilePhotoUrl'].isNotEmpty
                        ? artist['profilePhotoUrl']
                        : 'assets/default_artist_new.png',
                    widget.email,
                    widget.category,
                    widget.userfullname,
                    userId: artist['userId'],
                  );
                },
              ),
            ),
            // Banner Ad after Latest Music Section
            SizedBox(height: 20),
            Container(
              margin: EdgeInsets.symmetric(horizontal: 8.0),
              child: BannerAdWidget(adUnitId: 'ca-app-pub-1147112055796547/5221124787'),
            ),
            SizedBox(height: 20),

            // For You From India Section
            Row(
              children: [
                Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: Text(
                    'For You From India',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
                Spacer(),
              ],
            ),
            SizedBox(height: 10),
            SizedBox(
              height: 120,
              child: isLanguageLoading
                  ? Shimmer.fromColors(
                baseColor: Colors.grey[800]!,
                highlightColor: Colors.grey[700]!,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: 5,
                  itemBuilder: (context, index) {
                    return Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: Container(
                        width: 100,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(8.0),
                        ),
                      ),
                    );
                  },
                ),
              )
                  : ListView.builder(
                controller: _languageScrollController,
                scrollDirection: Axis.horizontal,
                itemCount: languageList.length + (isLanguageLoadingMore ? 1 : 0),
                itemBuilder: (context, index) {
                  if (index == languageList.length && isLanguageLoadingMore) {
                    return Center(
                      child: SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    );
                  }

                  final language = languageList[index];
                  return LanguageCard(
                    language['language'],
                    language['image'],
                    widget.email,
                    widget.category,
                    widget.userfullname,
                  );
                },
              ),
            ),

            // Genre Section
            Row(
              children: [
                Padding(
                  padding: const EdgeInsets.all(8.0),
                  child: Text(
                    'Genre',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
                Spacer(),
              ],
            ),
            SizedBox(height: 10),
            SizedBox(
              height: 120,
              child: isGenreLoading
                  ? Shimmer.fromColors(
                baseColor: Colors.grey[800]!,
                highlightColor: Colors.grey[700]!,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: 5,
                  itemBuilder: (context, index) {
                    return Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: Container(
                        width: 100,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(8.0),
                        ),
                      ),
                    );
                  },
                ),
              )
                  : ListView.builder(
                controller: _genreScrollController,
                scrollDirection: Axis.horizontal,
                itemCount: genreList.length + (isGenreLoadingMore ? 1 : 0),
                itemBuilder: (context, index) {
                  if (index == genreList.length && isGenreLoadingMore) {
                    return Center(
                      child: SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    );
                  }

                  final genre = genreList[index];
                  return GenreCard(
                    genre['genre'],
                    genre['image'],
                    widget.email,
                    widget.category,
                    widget.userfullname,
                  );
                },
              ),
            ),
            //SizedBox(height: 50),
          ],
        ));
  }
}


// Content for the "Relax" category
class RelaxContent extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment:
      CrossAxisAlignment.start, // Aligns the text to the start
      children: [
        // Discover Section
        Text(
          'Discover',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        SizedBox(height: 10),
        Container(
          height: 160,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              // DiscoverCard('Peaceful Melodies', 'Chill', 'assets/image1.jpeg'),
              // DiscoverCard('Nature Sounds', 'Ambient', 'assets/image2.jpeg'),
              // DiscoverCard('Meditation Music', 'Relax', 'assets/image3.jpeg'),
            ],
          ),
        ),
      ],
    );
  }
}

// Placeholder for the "Workout" category (you can fill in this content later)
class RegionalContent extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(); // Placeholder content
  }
}

class KidsContent extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(); // Placeholder content
  }
}


class DiscoverCard extends StatefulWidget {
  final String stageName;
  final String genre;
  final String imagePath;
  final String userId;
  final String email;
  final String category;
  final String userfullname;

  DiscoverCard(
      this.stageName,
      this.genre,
      this.imagePath,
      this.email,
      this.category,
      this.userfullname,
      {this.userId = ''}
      );

  @override
  _DiscoverCardState createState() => _DiscoverCardState();
}

class _DiscoverCardState extends State<DiscoverCard> {
  static const List<String> defaultImages = [
    'assets/default_artist1.png',
    'assets/default_artist2.png',
    'assets/default_artist3.png',
    'assets/default_artist4.png',
  ];

  // Store the selected default image
  String? _selectedDefaultImage;

  @override
  void initState() {
    super.initState();
    // Select a random image once when the widget is created
    if (!widget.imagePath.startsWith('http')) {
      _setDeterministicDefaultImage();
    }
  }

  void _setDeterministicDefaultImage() {
    // Use userId hash to determine a consistent default image
    int imageIndex = widget.userId.hashCode.abs() % defaultImages.length;
    _selectedDefaultImage = defaultImages[imageIndex];
  }

  void _selectRandomDefaultImage() {
    final random = Random();
    _selectedDefaultImage = defaultImages[random.nextInt(defaultImages.length)];
  }

  @override
  Widget build(BuildContext context) {
    // Ensure default image is set if not already done and no network image
    if (_selectedDefaultImage == null && !widget.imagePath.startsWith('http')) {
      _setDeterministicDefaultImage();
    }

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ListPage(
              genreTitle: widget.stageName,
              bannerImage: widget.imagePath,
              email: widget.email,
              Category: widget.category,
              fullname: widget.userfullname,
              isArtist: true,
              originIndex: 0,
              artistId: widget.userId,
            ),
          ),
        );
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8.0),
        child: Container(
          width: 149,
          height: 144,
          decoration: BoxDecoration(
            color: Colors.black,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(
            children: [
              Expanded(
                child: Container(
                  margin: EdgeInsets.all(8),
                  child: SizedBox(
                    width: 145,
                    height: 145,
                    child: widget.imagePath.startsWith('http')
                        ? CachedNetworkImage(
                      imageUrl: widget.imagePath,
                      fit: BoxFit.cover,
                      placeholder: (context, url) => Container(
                        color: Colors.grey[900],
                        child: Center(
                          child: CircularProgressIndicator(
                            strokeWidth: 2.0,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        ),
                      ),
                      errorWidget: (context, url, error) => Image.asset(
                        _selectedDefaultImage ?? defaultImages[0],
                        fit: BoxFit.cover,
                      ),
                      memCacheWidth: 200,
                      memCacheHeight: 200,
                      filterQuality: FilterQuality.high,
                    )
                        : Image.asset(
                      _selectedDefaultImage ?? defaultImages[0],
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
              ),
              Container(
                width: double.infinity,
                height: 25,
                padding: EdgeInsets.symmetric(horizontal: 8),
                child: widget.stageName.length > 15
                    ? Marquee(
                  text: widget.stageName,
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                  ),
                  scrollAxis: Axis.horizontal,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  blankSpace: 20.0,
                  velocity: 30.0,
                  startPadding: 10.0,
                  accelerationDuration: Duration(seconds: 1),
                  accelerationCurve: Curves.linear,
                  decelerationDuration: Duration(milliseconds: 500),
                  decelerationCurve: Curves.easeOut,
                )
                    : Text(
                  widget.stageName,
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                  ),
                  textAlign: TextAlign.left,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class RecentlyPlayedCard extends StatelessWidget {
  final String title;
  final String imagePath;
  final String audioPath; // Path to the static audio file

  RecentlyPlayedCard(this.title, this.imagePath, this.audioPath);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        // Navigator.push(
        //   context,
        //   MaterialPageRoute(
        //     builder: (context) => MusicPlayerPage(
        //       title: title,
        //       imagePath: imagePath,

        //     ),
        //   ),
        // );
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8.0),
        child: Column(
          mainAxisSize: MainAxisSize
              .min, // Ensures the Column only takes up the space it needs
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              width: 70,
              height: 70, // Reduced the height to prevent overflow
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(10),
                image: DecorationImage(
                  image: AssetImage(imagePath),
                  fit: BoxFit.cover,
                ),
              ),
            ),
            SizedBox(height: 4), // Reduced space between image and text
            Text(
              title,
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
              overflow: TextOverflow.ellipsis, // Prevents text overflow
              maxLines: 1, // Ensures the text stays on one line
            ),
          ],
        ),
      ),
    );
  }
}

class LanguageCard extends StatelessWidget {
  final String title;
  final String imagePath;
  final String email;
  final String category;
  final String userfullname;

  LanguageCard(this.title, this.imagePath, this.email,this.category,this.userfullname);

  Future<List<Map<String, String>>> fetchSongsByLanguage(String language) async {
    try {
      final response = await ApiService.getSongsByLanguage(language);

      print('Response status: ${response.statusCode}');
      print('Response body: ${response.body}');

      if (ApiService.isSuccessResponse(response)) {
        List<dynamic> data = jsonDecode(response.body);

        print('Parsed data: $data');

        // Check if data is not empty and return songs list
        if (data.isNotEmpty) {
          return data.map<Map<String, String>>((song) {
            return {
              'title': song['songName']['S'] ?? 'Unknown Title',
              'artist': song['stage_name']['S'] != null && song['stage_name']['S'].toString().trim().isNotEmpty
                  ? song['stage_name']['S']
                  : song['FullName']['S'] ?? 'Unknown Artist',
              'song_id': song['song_id']['S'] ?? 'Unknown Song Id',
              'coverPage': song['coverPageUrl']['S']?? 'assets/logo.png',

              'duration': song['span']['S'] ?? '0:00',
            };
          }).toList();
        }
      } else {
        print('Failed to load songs. Status code: ${response.statusCode}');
        // Return an empty list if the response is not successful
        return [];
      }
    } catch (error) {
      print('Error fetching songs: $error');
      // Return an empty list in case of error
      return [];
    }
    return [];
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () async {
        try {
          // Fetch the list of songs for the selected language
          //List<Map<String, String>> songs = await fetchSongsByLanguage(title);

          // Navigate to the ListPage with the fetched songs and email
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => ListPage(
                genreTitle: title,
                bannerImage: imagePath,
                //songs: songs, // Pass empty list if no songs are present
                email: email, Category: category, fullname: userfullname,
                isLanguage: true, // Pass the email to the ListPage
                originIndex: 0,
              ),
            ),
          );
        } catch (e) {
          // Log the error but don't show any error message (per the requirement)
          print('Failed to load songs: $e');
        }
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Stack(
              children: [
                Container(
                  width: 83,
                  height: 83,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(0),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(0),
                    child: Image.asset(
                      imagePath,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        print('Error loading image: $error');
                        // Return default asset image if specific language image fails to load
                        return Image.asset(
                          'assets/default_lang.jpg',
                          fit: BoxFit.cover,
                        );
                      },
                    ),
                  ),
                ),
                Positioned(
                  bottom: 8,
                  left: 8,
                  child: CircleAvatar(
                    backgroundColor: Colors.white.withOpacity(0.7),
                    radius: 13,
                    child: Icon(
                      Icons.play_arrow,
                      color: Colors.black,
                      size: 20,
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: 4),
            Text(
              title,
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
              overflow: TextOverflow.ellipsis,
              maxLines: 1,
            ),
          ],
        ),
      ),
    );
  }
}

class GenreCard extends StatelessWidget {
  final String title;
  final String imagePath;
  final String email;
  final String category;
  final String userfullname;

  GenreCard(this.title, this.imagePath, this.email, this.category, this.userfullname);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () async {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ListPage(
              genreTitle: title,
              bannerImage: imagePath,
              email: email,
              Category: category,
              fullname: userfullname,
              isGenre: true,
              originIndex: 0,
            ),
          ),
        );
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Stack(
              children: [
                Container(
                  width: 83,
                  height: 83,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(0),
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(0),
                    child: Image.asset(
                      imagePath,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        print('Error loading image: $error');
                        // Return default asset image if specific genre image fails to load
                        return Image.asset(
                          ImageUtils.getGenreImagePathSync('Others'),
                          fit: BoxFit.cover,
                        );
                      },
                    ),
                  ),
                ),
                Positioned(
                  bottom: 8,
                  left: 8,
                  child: CircleAvatar(
                    backgroundColor: Colors.white.withOpacity(0.7),
                    radius: 13,
                    child: Icon(
                      Icons.play_arrow,
                      color: Colors.black,
                      size: 16,
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: 4),
            Text(
              title,
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
              overflow: TextOverflow.ellipsis,
              maxLines: 1,
            ),
          ],
        ),
      ),
    );
  }
}


class HomePage extends StatefulWidget {
  final String email;
  final String userCategory;
  final String userfullname;

  HomePage({
    required this.email,
    required this.userCategory,
    required this.userfullname,
  });

  @override
  _HomePageState createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  String selectedCategory = 'For you';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: ForYouContent(
        email: widget.email,
        category: widget.userCategory,
        userfullname: widget.userfullname,
      ),
    );
  }
}
