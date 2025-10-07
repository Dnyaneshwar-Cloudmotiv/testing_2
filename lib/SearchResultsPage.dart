// SearchResultsPage.dart
import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:algolia_helper_flutter/algolia_helper_flutter.dart';
import 'package:http/http.dart' as http;
import 'package:just_audio/just_audio.dart';
import 'package:just_audio_background/just_audio_background.dart';
import 'package:voiceapp/artist.dart';
import 'package:voiceapp/audio_service1.dart';
import 'package:voiceapp/bottomnavigationbar.dart';
import 'package:voiceapp/main.dart';
import 'package:voiceapp/musicplayer.dart';
import 'package:voiceapp/nowplaying.dart';
import 'package:voiceapp/profile_manager.dart';
import 'package:voiceapp/viewProfile.dart';
import 'package:voiceapp/services/api_service.dart';

import 'notifiers.dart';

class Artist {
  final String objectID;
  final String stageName;
  final String fullName;
  final String profilePhotoUrl;
  final String category;
  final String coverPageUrl;

  Artist({
    required this.objectID,
    required this.stageName,
    required this.fullName,
    required this.profilePhotoUrl,
    required this.category,
    required this.coverPageUrl,
  });

  factory Artist.fromJson(Map<String, dynamic> json) {
    return Artist(
      objectID: json['objectID'] ?? '',
      stageName: json['stageName'] ?? '',
      fullName: json['fullName'] ?? '',
      profilePhotoUrl: json['profilePhotoUrl'] ?? '',
      category: json['category'] ?? '',
      coverPageUrl:json['coverPageUrl']??'',
    );
  }
}


class Song {
  final String objectID;
  final String songName;
  final bool approved;
  final String coverPageUrl;
  final String songStreamUrl;
  final String span;
  final String stageName;
  final String fullName;

  Song({
    required this.objectID,
    required this.songName,
    required this.approved,
    required this.coverPageUrl,
    required this.songStreamUrl,
    required this.span,
    required this.stageName,
    required this.fullName,
  });

  factory Song.fromJson(Map<String, dynamic> json) {
    return Song(
      objectID: json['objectID'] ?? '',
      songName: json['songName'] ?? 'Unknown Song',
      approved: json['approved'] == 'true',
      coverPageUrl: json['coverPageUrl'] ?? 'assets/mic.jpg',
      songStreamUrl: json['songStreamUrl'] ?? '',
      span: json['span'] ?? '0:00',
      stageName: json['stage_name'] ?? 'Unknown Artist',
      fullName: json['FullName'] ?? 'Unknown Artist',
    );
  }
}

class SearchResultsPage extends StatefulWidget {
  final String email;
  final String userCategory;
  final String userfullname;
  final bool focusTextField;

  SearchResultsPage({
    required this.email,
    required this.userCategory,
    required this.userfullname,
    this.focusTextField = false,
  });

  @override
  _SearchResultsPageState createState() => _SearchResultsPageState();
}

class _SearchResultsPageState extends State<SearchResultsPage> {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
  late Debouncer _tapDebouncer;
  bool _isSearchFocused = false;

final HitsSearcher _artistSearcher = HitsSearcher(
    applicationID: 'GBYVEIU9LF',
    apiKey: 'f20f4880d4e810614fb7cf9d92a373e7',
    indexName: 'Artist_index',
  );


  final HitsSearcher _songSearcher = HitsSearcher(
    applicationID: 'GBYVEIU9LF',
    apiKey: 'f20f4880d4e810614fb7cf9d92a373e7',
    indexName: 'song_index',
  );



  List<String> _trendingSearches = [];
  List<Song> _songResults = [];
  List<Artist> _artistResults = [];
  bool _isSearching = false;
  Timer? _searchIconTimer;
  bool _isLoadingTrending = true;


  @override
  void initState() {
    super.initState();
    _searchController.addListener(_onTextInputSearch);
    
    // Add focus listeners to track search field focus state
    _searchFocusNode.addListener(() {
      setState(() {
        _isSearchFocused = _searchFocusNode.hasFocus;
      });
    });
    
    _artistSearcher.responses.listen((response) {
      setState(() {
        _artistResults = response.hits.map((hit) => Artist.fromJson(hit)).toList();
      });
    });

    // Listen to song search results
    _songSearcher.responses.listen((response) {
      setState(() {
        _songResults = response.hits.map((hit) => Song.fromJson(hit)).toList();
      });
    });

    _fetchTrendingSearches();

    _tapDebouncer = Debouncer(milliseconds: 300);

    if (widget.focusTextField) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        FocusScope.of(context).requestFocus(_searchFocusNode);
      });
    }
  }

  Future<void> _fetchTrendingSearches() async {
    setState(() {
      _isLoadingTrending = true;
    });

    try {
      // First check for internet connectivity
      final result = await InternetAddress.lookup('google.com');
      if (result.isNotEmpty && result[0].rawAddress.isNotEmpty) {
        // Internet connection is available, proceed with API call
        final now = DateTime.now();
        final sevenDaysAgo = now.subtract(Duration(days: 7));

        final endDate = now.toUtc().toIso8601String();
        final startDate = sevenDaysAgo.toUtc().toIso8601String();

        // Add timeout to API calls
        final artistResponse = await http.post(
          Uri.parse('https://analytics.algolia.net/1/indexes/Artist_index/popular-searches'),
          headers: {
            'X-Algolia-API-Key': '00174c3e702b3bead464a7cc0e3fe329',
            'X-Algolia-Application-Id': 'GBYVEIU9LF',
            'Content-Type': 'application/json',
          },
          body: json.encode({
            "startDate": startDate,
            "endDate": endDate,
            "size": 3,
            "source": "clicks"
          }),
        ).timeout(
          Duration(seconds: 10),
          onTimeout: () {
            throw TimeoutException('The connection has timed out, please try again!');
          },
        );

         final songResponse = await http.post(
          Uri.parse('https://analytics.algolia.net/1/indexes/song_index/popular-searches'),
          headers: {
            'X-Algolia-API-Key': '00174c3e702b3bead464a7cc0e3fe329',
            'X-Algolia-Application-Id': 'GBYVEIU9LF',
            'Content-Type': 'application/json',
          },
          body: json.encode({
            "startDate": startDate,
            "endDate": endDate,
            "size": 2,
            "source": "clicks"
          }),
        ).timeout(
          Duration(seconds: 10),
          onTimeout: () {
            throw TimeoutException('The connection has timed out, please try again!');
          },
        );

        List<String> popularItems = [];

        if (ApiService.isSuccessResponse(artistResponse)) {
          final data = json.decode(artistResponse.body);
          if (data['hits'] != null) {
            final artistHits = (data['hits'] as List)
                .map((hit) => hit['stageName'] as String?)
                .where((name) => name != null && name.isNotEmpty)
                .take(3)
                .toList();
            popularItems.addAll(artistHits.whereType<String>());
          }
        }

        if (ApiService.isSuccessResponse(songResponse)) {
          final data = json.decode(songResponse.body);
          if (data['hits'] != null) {
            final songHits = (data['hits'] as List)
                .map((hit) => hit['songName'] as String?)
                .where((name) => name != null && name.isNotEmpty)
                .take(2)
                .toList();
            popularItems.addAll(songHits.whereType<String>());
          }
        }

        if (popularItems.isEmpty) {
          throw Exception('No analytics data available');
        }

        setState(() {
          _trendingSearches = popularItems;
          _isLoadingTrending = false;
        });
      } else {
        throw Exception('No Internet connection');
      }
    } on SocketException catch (e) {
      print('Network error: $e');
      await _fetchPopularHitsAsFallback();
    } on TimeoutException catch (e) {
      print('Timeout error: $e');
      await _fetchPopularHitsAsFallback();
    } catch (e) {
      print('Error fetching top hits: $e');
      await _fetchPopularHitsAsFallback();
    }
  }

  Future<void> _fetchPopularHitsAsFallback() async {
    try {
      // Create a stream subscription for both searchers with timeout
      List<String> popularItems = [];

      // Set empty query to get default/popular results
      _artistSearcher.applyState((state) => state.copyWith(
          query: '',
          page: 0,
          hitsPerPage: 3
      ));

      _songSearcher.applyState((state) => state.copyWith(
          query: '',
          page: 0,
          hitsPerPage: 50
      ));

      // Add timeout to the Future.wait
      final responses = await Future.wait([
        _artistSearcher.responses.first.timeout(Duration(seconds: 5)),
        _songSearcher.responses.first.timeout(Duration(seconds: 5))
      ]).catchError((error) {
        print('Error in fallback search responses: $error');
        throw error;
      });

      // Process artist results
      if (responses[0].hits.isNotEmpty) {
        popularItems.addAll(
            responses[0].hits
                .map((hit) => hit['stageName'] as String)
                .where((name) => name != null && name.isNotEmpty)
                .take(3)
        );
      }

      // Process song results
      if (responses[1].hits.isNotEmpty) {
        popularItems.addAll(
            responses[1].hits
                .map((hit) => hit['songName'] as String)
                .where((name) => name != null && name.isNotEmpty)
                .take(2)
        );
      }

      if (popularItems.isEmpty) {
        throw Exception('No results from fallback search');
      }

      setState(() {
        _trendingSearches = popularItems;
        _isLoadingTrending = false;
      });

    } catch (e) {
      print('Error in fallback search: $e');
      // Final fallback to static list if everything fails
      setState(() {
        _trendingSearches = [
          "Popular Artist 1",
          "Top Song 1",
          "Trending Artist",
          "Latest Hit",
          "Featured Artist"
        ];
        _isLoadingTrending = false;
      });
    }
  }

  // Future<Map<String, String>> fetchSourceDetails(String songId) async {
  //   try {
  //     final songDetails = await _fetchSongDetails(songId);
  //     return {
  //       'sourceName': songDetails?['genre'] ?? 'Unknown Genre',
  //       'sourceType': 'genre', // Assuming the sourceType is always genre
  //     };
  //   } catch (e) {
  //     print('Error fetching source details: $e');
  //     return {
  //       'sourceName': 'Unknown',
  //       'sourceType': 'Unknown',
  //     };
  //   }
  // }

  // Improved _fetchSongDetails method with better handling of null values and string conversion
  Future<Map<String, String>?> _fetchSongDetails(String songId) async {
    try {
      final response = await ApiService.getSongInfo(songId);

      if (ApiService.isSuccessResponse(response)) {
        final data = json.decode(response.body);

        // Convert all DynamoDB-style entries to simple strings
        return {
          'genre': data['genre']?['S'] ?? 'Unknown Genre',
          'songName': data['songName']?['S'] ?? 'Unknown Song',
          'stage_name': data['stage_name']?['S'] ?? 'Unknown Artist',
          'languages': data['languages']?['S'] ?? 'Unknown Language',
          'songStreamUrl': data['songStreamUrl']?['S'] ?? '',
          'coverPageUrl': data['coverPageUrl']?['S'] ?? '',
          'span': data['span']?['S'] ?? '0:00',
          'song_id': songId,
        };
      } else {
        print('Error fetching song details: ${response.statusCode}');
        // Return default values for all fields as strings
        return {
          'genre': 'Unknown Genre',
          'songName': 'Unknown Song',
          'stage_name': 'Unknown Artist',
          'languages': 'Unknown Language',
          'songStreamUrl': '',
          'coverPageUrl': '',
          'span': '0:00',
          'song_id': songId,
        };
      }
    } catch (e) {
      print('Error fetching song details: $e');
      // Return default values for all fields as strings
      return {
        'genre': 'Unknown Genre',
        'songName': 'Unknown Song',
        'stage_name': 'Unknown Artist',
        'languages': 'Unknown Language',
        'songStreamUrl': '',
        'coverPageUrl': '',
        'span': '0:00',
        'song_id': songId,
      };
    }
  }


  Future<bool> checkFollowStatus(String userId, String artistId) async {
    try {
      // ApiService.checkFollowStatus now returns bool directly
      return await ApiService.checkFollowStatus(userId, artistId);
    } catch (e) {
      print('Error checking follow status: $e');
      return false;
    }
  }

  Future<int> fetchFollowerCount(String artistId) async {
    try {
      final response = await ApiService.getFollowerCount(artistId);

      if (ApiService.isSuccessResponse(response)) {
        final data = json.decode(response.body);
        return data['count'] ?? 0;
      }
      return 0;
    } catch (e) {
      print('Error fetching follower count: $e');
      return 0;
    }
  }


  void _onTextInputSearch() {
    final query = _searchController.text;
    if (query.isNotEmpty) {
      _artistSearcher.applyState((state) => state.copyWith(query: query, page: 0));
      _songSearcher.applyState((state) => state.copyWith(query: query, page: 0));
    } else {
      setState(() {
        _artistResults.clear();
        _songResults.clear();
      });
    }
  }

  void _performIconSearch() {
    final query = _searchController.text;
    if (query.isNotEmpty) {
      setState(() {
        _isSearching = true; // Show loader when search icon is tapped
      });

      // Start search and timer to hide loader after 2 seconds
      _songSearcher
          .applyState((state) => state.copyWith(query: query, page: 0));

      _artistSearcher.applyState((state) => state.copyWith(query: query, page: 0));

      _searchFocusNode.unfocus(); // Hide the keyboard

      _searchIconTimer?.cancel(); // Cancel any existing timer
      _searchIconTimer = Timer(Duration(milliseconds: 200), () {
        setState(() {
          _isSearching = false; // Hide loader after 2 seconds
        });
      });
    }
  }

  @override
  void dispose() {
    if (_searchFocusNode.hasFocus) {
      _searchFocusNode.unfocus(); // Remove focus on dispose
    }
    _searchController.dispose();
    _artistSearcher.dispose();
    _songSearcher.dispose();
    _searchFocusNode.dispose();
    _searchIconTimer?.cancel();
    _tapDebouncer.cancel(); // Cancel the debouncer
    super.dispose();
  }

  String getInitials(String? fullName) {
    if (fullName == null || fullName.trim().isEmpty) {
      return "";
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

  @override
  Widget build(BuildContext context) {
    Widget content = GradientScaffold(
      appBar: AppBar(
          automaticallyImplyLeading: false,
          backgroundColor: Colors.transparent,
          toolbarHeight: kToolbarHeight + 15,
          elevation: 0, // No shadow under the app bar
          title: Padding(
            padding: const EdgeInsets.only(left: 0.0, top: 0.0), // Add padding to the logo
            child: Image.asset(
              'assets/logo.png', // Your logo asset
              height: 50,
            ),
          ),
          actions: [

            SizedBox(width: 10),
            GestureDetector(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => ProfileSettingsPage(userfullname: widget.userfullname, userId: widget.email, userCategory: widget.userCategory,)),
                );
              },
              child:  Padding(
                padding: const EdgeInsets.only(right: 10),
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
                  child:CircleAvatar(
                    radius: 20,
                    backgroundColor: Colors.grey,
                    child:ProfileManager().profileImageUrl != null
                        ? ClipOval(
                      child: Image.network(
                        ProfileManager().profileImageUrl!,
                        fit: BoxFit.cover,
                        width: 100,
                        height: 100,
                        errorBuilder: (context, error, stackTrace) {
                          return Text(
                            getInitials(ProfileManager().username.value),
                            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 20),
                          );
                        },
                      ),
                    )
                        : Text(
                      getInitials(ProfileManager().username.value),
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 20),
                    ),
                  ),
                ),
              ),
            )]
      ),
      body: Stack(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              children: [
                TextField(
                  controller: _searchController,
                  focusNode: _searchFocusNode,
                  style: TextStyle(
                    color: Colors
                        .black, // Change this color to the desired text color
                    decorationThickness: 0,
                  ),
                  decoration: InputDecoration(
                    prefixIcon: GestureDetector(
                      onTap: _performIconSearch, // Trigger icon search
                      child: _isSearching
                          ? Padding(
                        padding: const EdgeInsets.all(8.0),
                        child: SizedBox(
                          width: 10,
                          height: 10,
                          child: CircularProgressIndicator(
                            color: Colors.black,
                            strokeWidth: 3,
                          ),
                        ),
                      )
                          : Icon(Icons.search, color: Colors.black),
                    ),
                    hintText: 'Search Songs/Artist',
                    hintStyle: TextStyle(color: Color(0x99000000),fontFamily: 'Poppins',fontSize: 18),
                    filled: true,
                    fillColor: Colors.white.withOpacity(0.8),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(20),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
                SizedBox(height: 20),
                Expanded(
                  child: _searchController.text.isEmpty
                      ? _buildTrendingSearches()
                      : _buildSearchResults(),
                ),

              ],
            ),
          ),

        ],
      ),
    );

    return PageWithBottomNav(
      child: content,
      nowPlayingTile: !_isSearchFocused ? ValueListenableBuilder<bool>(
        valueListenable: isNowPlayingTileVisible,
        builder: (context, isVisible, _) {
          if (!isVisible) return const SizedBox();
          return NowPlayingTile(
            email: widget.email,
            userFullName: widget.userfullname,
            userCategory: widget.userCategory,
          );
        },
      ) : null,
      email: widget.email,
      fullName: widget.userfullname,
      category: widget.userCategory,
      currentIndex: 1,  // 1 is for Search page
      isFromNewHomePage: false,
    );
  }

  // Widget to display trending searches when no query is entered
  Widget _buildTrendingSearches() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 10.0),
          child: Row(
            children: [
              Icon(Icons.trending_up, color: Colors.blueAccent),
              SizedBox(width: 8),
              Text(
                "Popular Content", // Changed from "Trending Searches" to "Popular Content"
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.blueAccent,
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: _isLoadingTrending
              ? Center(
            child: CircularProgressIndicator(),
          )
              : _trendingSearches.isEmpty
              ? Center(
            child: Text(
              "No popular content available",
              style: TextStyle(color: Colors.grey),
            ),
          )
              : ListView.builder(
            itemCount: _trendingSearches.length,
            itemBuilder: (context, index) {
              final item = _trendingSearches[index];
              return ListTile(
                leading: Icon(
                  Icons.trending_up,  // Changed from search to trending_up
                  color: Colors.grey,
                ),
                title: Text(item),
                trailing: Icon(
                  Icons.arrow_forward_ios,
                  size: 16,
                  color: Colors.grey,
                ),
                onTap: () {
                  _searchController.text = item;
                  _performIconSearch();
                },
              );
            },
          ),
        ),
      ],
    );
  }

  // Widget to display search results when there is a query
  Widget _buildSearchResults() {
    if (_artistResults.isEmpty && _songResults.isEmpty) {
      return Center(child: Text("No results found"));
    }

    bool _isSongLoaded(String songId) {
      try {
        final audioService = AudioService();
        final player = audioService.player;

        if (player.sequenceState == null ||
            player.sequenceState!.sequence.isEmpty) {
          return false;
        }

        final currentSource = player.sequenceState!.currentSource;
        if (currentSource == null) return false;

        final mediaItem = currentSource.tag as MediaItem?;
        if (mediaItem == null) return false;

        // Check if the song ID matches
        return mediaItem.id == songId;
      } catch (e) {
        print('Error checking if song is loaded: $e');
        return false;
      }
    }

// Helper method to check if the player is actually ready
    Future<bool> _verifyPlayerIsReady() async {
      // Try multiple times to check if the player is ready
      for (int i = 0; i < 5; i++) {
        final player = AudioService().player;
        final processingState = player.processingState;
        final duration = player.duration;

        if (processingState == ProcessingState.ready &&
            duration != null &&
            duration > Duration.zero) {
          return true;
        }

        print('Player not ready yet, waiting... (attempt ${i+1}/5)');
        await Future.delayed(Duration(milliseconds: 300));
      }

      return false;
    }

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Artists Section
          if (_artistResults.isNotEmpty) ...[
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 16.0),
              child: Text(
                "Artists",
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),
            SizedBox(
              height: 100,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                itemCount: _artistResults.length,
                itemBuilder: (context, index) {
                  final artist = _artistResults[index];
                  return Padding(
                    padding: const EdgeInsets.only(right: 16.0),
                    child: GestureDetector(
                      onTap: () async {
                        showDialog(
                          context: context,
                          barrierDismissible: false,
                          builder: (BuildContext context) {
                            return Center(
                              child: CircularProgressIndicator(),
                            );
                          },
                        );

                        try {
                          // Fetch follow status and follower count in parallel
                          final Future<bool> followStatusFuture = checkFollowStatus(
                              widget.email,
                              artist.objectID
                          );

                          final Future<int> followerCountFuture = fetchFollowerCount(
                              artist.objectID
                          );

                          // Wait for both futures to complete and explicitly cast the results
                          final results = await Future.wait([
                            followStatusFuture,
                            followerCountFuture,
                          ]);

                          // Close loading indicator
                          Navigator.of(context).pop();

                          // Properly cast the results to their respective types
                          final bool isFollowing = results[0] as bool;
                          final int followerCount = results[1] as int;

                          // Navigate to MusicArtistPage
                          final updatedArtist = await Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => MusicArtistPage(
                                artistId: artist.objectID,
                                artistName: artist.stageName,
                                followerCount: followerCount,
                                userId: widget.email,
                                category: widget.userCategory,
                                userfullname: widget.userfullname,
                                isFollowing: isFollowing,
                                profileImageUrl: artist.profilePhotoUrl,
                                coverImageUrl: artist.coverPageUrl,
                                isFromDeepLink: false,
                              ),
                            ),
                          );

                          if (updatedArtist != null) {
                            // Handle any updates if needed
                          }
                        } catch (e) {
                          // Close loading indicator if still showing
                          if (context.mounted) {
                            Navigator.of(context).pop();

                            // Show error message
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('Error loading artist profile. Please try again.'),
                                duration: Duration(seconds: 2),
                              ),
                            );
                          }
                          print('Error navigating to artist page: $e');
                        }

                      },
                      child: Column(
                        children: [
                          CircleAvatar(
                            radius: 30,
                            backgroundColor: Colors.grey[200],
                            child: ClipOval(
                              child: Image.network(
                                artist.profilePhotoUrl,
                                width: 60,
                                height: 60,
                                fit: BoxFit.cover,
                                errorBuilder: (context, error, stackTrace) {
                                  return CircleAvatar(
                                    radius: 30,
                                    backgroundColor: Colors.grey,
                                    child: Text(
                                      artist.stageName.isNotEmpty ? artist.stageName[0].toUpperCase() : '',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 24,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  );
                                },
                              ),
                            ),
                          ),
                          SizedBox(height: 8),
                          Text(
                            artist.stageName,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
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
          ],

          // Songs Section
          if (_songResults.isNotEmpty) ...[
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 16.0),
              child: Text(
                "Songs",
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),
            Theme(
              data: Theme.of(context).copyWith(
                splashColor: Colors.transparent,
                highlightColor: Colors.transparent,
                hoverColor: Colors.transparent,
                splashFactory: NoSplash.splashFactory,
              ),
              child: ListView.builder(
                shrinkWrap: true,
                physics: NeverScrollableScrollPhysics(),
                itemCount: _songResults.length,
                itemBuilder: (context, index) {
                  final song = _songResults[index];
                  if (!song.approved) return SizedBox.shrink();

                  return ListTile(
                    contentPadding: EdgeInsets.symmetric(vertical: 3, horizontal: 16),
                    leading: ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: FadeInImage.assetNetwork(
                        placeholder: 'assets/mic.jpg',
                        image: song.coverPageUrl,
                        width: 60,
                        height: 60,
                        fit: BoxFit.cover,
                        imageErrorBuilder: (context, error, stackTrace) {
                          return Image.asset(
                            'assets/mic.jpg',
                            width: 60,
                            height: 60,
                            fit: BoxFit.cover,
                          );
                        },
                      ),
                    ),
                    title: Text(song.songName),
                    //subtitle: Text(song.stageName),
                    subtitle: Text(song.stageName.isNotEmpty ? song.stageName : song.fullName),
                    trailing: Text(
                      song.span,
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                    ),
                    // Complete fixed version of the song tap handler for SearchResultsPage
// Replace the entire onTap section in your ListView.builder for songs

                    onTap: () {
                      // Prevent multiple rapid taps
                      if (_tapDebouncer.isActive) {
                        print('Tap debounced - ignoring');
                        return;
                      }

                      // Execute the action with debouncing
                      _tapDebouncer.run(() async {
                        try {
                          _searchFocusNode.unfocus();

                          // Get current song ID and check if it's the same song
                          final currentSongId = ProfileManager.currentlyPlayingSongIdNotifier.value;
                          final isSameSong = song.objectID == currentSongId;

                          print('Song tapped: ${song.songName} (ID: ${song.objectID})');
                          print('Current playing ID: $currentSongId, isSameSong: $isSameSong');

                          // Fetch song details
                          final sourceDetails = await _fetchSongDetails(song.objectID);
                          final sourceName = sourceDetails?['genre'] ?? 'Unknown Genre';

                          // If it's the same song, just navigate to the player without reloading
                          if (isSameSong) {
                            print('Same song selected, navigating without reloading');

                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => MusicPlayerPage(
                                  email: widget.email,
                                  currentIndex: 0,
                                  userfullname: widget.userfullname,
                                  userCategory: widget.userCategory,
                                  navigationIndex: 1,
                                  sourceType: 'genre',
                                  sourceName: sourceName,
                                ),
                              ),
                            );

                            return;
                          }

                          loopNotifier.value = false;
                          await loopNotifier.saveLoopState();
                          AudioService().player.setLoopMode(LoopMode.off);

                          // Update currently playing song ID before clearing playlist
                          ProfileManager().updateCurrentlyPlayingSong(song.objectID);

                          // Clear existing playlist in background
                          await AudioService().clearPlaylist();

                          // Navigate to the player immediately for better UX
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => MusicPlayerPage(
                                email: widget.email,
                                currentIndex: 0,
                                userfullname: widget.userfullname,
                                userCategory: widget.userCategory,
                                navigationIndex: 1,
                                sourceType: 'genre',
                                sourceName: sourceName,
                              ),
                            ),
                          );

                          // Load the playlist after navigation
                          bool success = false;
                          int retryCount = 0;
                          const maxRetries = 3;

                          while (!success && retryCount < maxRetries) {
                            try {
                              // Create a song map with all values explicitly as strings
                              final Map<String, String> songMap = {
                                'title': song.songName,
                                //'artist': song.stageName,
                                'artist': song.stageName.isNotEmpty ? song.stageName : song.fullName,
                                'coverPage': song.coverPageUrl,
                                'duration': song.span,
                                'streamingUrl': song.songStreamUrl,
                                'song_id': song.objectID,
                                'source': sourceName,
                                'genre': sourceName,
                                'languages': sourceDetails != null && sourceDetails.containsKey('languages')
                                    ? sourceDetails['languages'].toString()
                                    : 'Unknown Language',
                              };

                              print('Loading playlist with song: ${song.songName}');
                              success = await AudioService().loadPlaylist(
                                [songMap],
                                initialIndex: 0,
                              );

                              if (!success) {
                                print('Load attempt ${retryCount + 1} failed without exception');
                                retryCount++;

                                if (retryCount < maxRetries) {
                                  await Future.delayed(Duration(milliseconds: 500));
                                  await AudioService().reinitialize();
                                  print('Retrying after reinitialize...');
                                } else {
                                  print('All retries failed');
                                }
                              }
                            } catch (e) {
                              print('Error loading playlist: $e');
                              retryCount++;
                              await Future.delayed(Duration(milliseconds: 500));
                            }
                          }
                        } catch (e) {
                          print('Error in song tap handler: $e');
                        }
                      });
                    },
                  );
                },
              ),
            ),
          ],
        ],
      ),
    );
  }
}
class Debouncer {
  final int milliseconds;
  Timer? _timer;
  bool _isActive = false;

  Debouncer({required this.milliseconds});

  bool get isActive => _isActive;

  void run(VoidCallback action) {
    if (_timer != null) {
      _timer!.cancel();
    }
    _isActive = true;
    _timer = Timer(Duration(milliseconds: milliseconds), () {
      action();
      _isActive = false;
    });
  }

  void cancel() {
    _timer?.cancel();
    _isActive = false;
  }
}