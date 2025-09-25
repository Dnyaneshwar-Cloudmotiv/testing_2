// SearchPage.dart
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:voiceapp/services/api_service.dart';
import 'package:intl/intl.dart';
import 'package:voiceapp/NewHomepage.dart';
import 'package:voiceapp/SearchResultsPage.dart';
import 'dart:convert';

import 'package:voiceapp/artist.dart';
import 'package:voiceapp/connectivity_service.dart';
import 'package:voiceapp/loading_screen.dart';
import 'package:voiceapp/main.dart';
//import 'package:voiceapp/bottomnavigationbar.dart';
import 'package:voiceapp/newlistofsongs.dart';
import 'package:voiceapp/nowplaying.dart';
import 'package:voiceapp/profile_manager.dart';
import 'package:voiceapp/viewProfile.dart';
import 'package:voiceapp/utils/image_utils.dart';
import 'package:algolia_helper_flutter/algolia_helper_flutter.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';

import 'bottomnavigationbar.dart';

class SearchPage extends StatefulWidget {
  final String email;
  final String userCategory;
  final String userfullname;
  final bool isFromNewHomePage;

  SearchPage({required this.email, required  this.userCategory, required  this.userfullname,this.isFromNewHomePage = false});


  @override
  _SearchPageState createState() => _SearchPageState();
}

class _SearchPageState extends State<SearchPage> {
  final TextEditingController _searchController = TextEditingController();
  // ignore: unused_field
  List<dynamic> _songs = [];
  static const int _pageSize = 3;
  List<Artist> _artists = [];
  List<String>_followingIds=[]; // New list to store fetched artists
  bool _isLoadingArtists = true;// List to store search results
  
  // Progressive loading variables
  final int initialLoadCount = 3;
  bool _isInitialLoading = true;
  
  // Cached artist data
  List<Artist> _cachedArtists = [];
  final List<String> _singers = [
     'Bengali', 'English','Gujarati', 'Hindi',   'Malayalam',  'Marathi',
  ];

  bool _isLoadingMore = false;
  List<dynamic> _allArtistData = [];
  int _currentPage = 0;
  final ScrollController _scrollController = ScrollController();
  bool _isLoading = true;
  bool _isNoInternet = false;
  late ConnectivityService _connectivityService;
  bool _mounted = true;





  // List of singer names

   @override
void initState() {
  super.initState();
  _mounted = true;
   _scrollController.addListener(_scrollListener);
  WidgetsBinding.instance.addPostFrameCallback((_) {
    _initializeData();
  }); // Call a new method to handle both API calls
  _connectivityService = ConnectivityService();
  _setupConnectivityListener();
}

  void _setupConnectivityListener() {
    _connectivityService.connectionStream.listen((hasConnection) {
      if (!_mounted) return; // Skip if component is unmounted

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


  @override
  void dispose() {
    //_scrollController.removeListener(_scrollListener);
    //_scrollController.dispose();
    _mounted = false;
    _connectivityService.dispose();
    super.dispose();
  }

  @override
  void setState(VoidCallback fn) {
    if (_mounted && mounted) {
      super.setState(fn);
    }
  }

   void _scrollListener() {
    if (_scrollController.position.pixels == _scrollController.position.maxScrollExtent) {
      _loadMoreArtists();
    }
  }





  Future<void> _initializeData() async {
    try {
      await _fetchFollowingList();
      await _fetchArtists();

      if (mounted) {
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




  Future<void> _fetchFollowingList() async {
    final followingUrl = Uri.parse(
        'https://dfiksrd6v8.execute-api.ap-south-1.amazonaws.com/follow/api/following/List?user_id=${ProfileManager().getUserId()}');

    try {
      final response = await ApiService.get(followingUrl.toString());

      if (ApiService.isSuccessResponse(response)) {
        final data = json.decode(response.body);

        // Safely handle 'followDetails' extraction
        List<dynamic> followDetails = data['followDetails'] ?? [];

        // Filter out null or invalid 'user_id'
        List<String> validUserIds = followDetails
            .where((follow) => follow['user_id'] != null && follow['user_id'] is String)
            .map<String>((follow) => follow['user_id'] as String)
            .toList();

        setState(() {
          _followingIds = validUserIds;
        });

        print('Following IDs: $_followingIds'); // Debugging to see extracted user_ids
      } else {
        print('Failed to fetch following list');
      }
    } catch (e) {
      print('Error fetching following list: $e');
    }
  }


  Future<void> _refreshArtists() async {
    // Fetch the updated artist data
    try {
      // Reset all state variables
      _allArtistData = []; // Clear cached artist data to fetch fresh
      _artists = []; // Clear displayed artists
      _currentPage = 0; // Reset pagination
      _isInitialLoading = true; // Reset initial loading flag
      
      await _fetchFollowingList();
      await _fetchArtists(); // Fetch artists without clearing the displayed list
    } finally {
      // Ensure loading state is properly reset
      if (_mounted) {
        setState(() {
          _isLoadingArtists = false;
        });
      }
    }
  }
  Future<void> _fetchArtists() async {
    if (_isLoadingArtists) {
      setState(() {
        _isLoadingArtists = true;
      });
    }

    try {
      await _fetchFollowingList();
      if (_allArtistData.isEmpty) {
        final artistUrl = Uri.parse('https://py529n10q0.execute-api.ap-south-1.amazonaws.com/voiz/api/artist');
        final artistResponse = await ApiService.get(artistUrl.toString());

        if (ApiService.isSuccessResponse(artistResponse)) {
          // Filter artists with songCount > 0
          _allArtistData = (json.decode(artistResponse.body) as List)
              .where((artist) => artist['songCount'] > 0)
              .toList();
        } else {
          print('Failed to load artists');
          return;
        }
      }

      // Remove duplicates before processing using user_id as unique identifier
      final Map<String, dynamic> uniqueArtistsMap = {};
      for (var artist in _allArtistData) {
        final userId = artist['user_id']?.toString();
        if (userId != null && userId.isNotEmpty) {
          uniqueArtistsMap[userId] = artist;
        }
      }
      _allArtistData = uniqueArtistsMap.values.toList();

      // Sort by song count for better initial display
      _allArtistData.sort((a, b) => (b['songCount'] ?? 0).compareTo(a['songCount'] ?? 0));

      if (_isInitialLoading) {
        // Load initial batch for instant display
        await _loadInitialArtists();
        // Load remaining artists in background
        _loadRemainingArtistsInBackground();
      } else {
        // Regular pagination loading
        await _loadArtistBatch();
      }

    } catch (e) {
      print('Error fetching artists: $e');
    } finally {
      if (_isLoadingArtists) {
        setState(() {
          _isLoadingArtists = false;
          _isInitialLoading = false;
        });
      }
    }
  }

  Future<void> _loadInitialArtists() async {
    final int endIndex = initialLoadCount < _allArtistData.length ? initialLoadCount : _allArtistData.length;
    final List<dynamic> initialBatch = _allArtistData.sublist(0, endIndex);
    
    final List<Artist> initialArtists = await _processArtistBatch(initialBatch);
    
    setState(() {
      _artists = initialArtists;
      _currentPage = 1; // We've loaded the first batch
    });
  }

  Future<void> _loadRemainingArtistsInBackground() async {
    if (_allArtistData.length <= initialLoadCount) return;
    
    final remainingData = _allArtistData.skip(initialLoadCount).toList();
    
    // Process remaining artists in smaller batches to avoid blocking UI
    const batchSize = 2;
    for (int i = 0; i < remainingData.length; i += batchSize) {
      if (!_mounted) return;
      
      final int endIndex = (i + batchSize < remainingData.length) ? i + batchSize : remainingData.length;
      final batch = remainingData.sublist(i, endIndex);
      
      final newArtists = await _processArtistBatch(batch);
      
      if (!_mounted) return;
      
      setState(() {
        // Add only artists not already in the list (prevent duplicates)
        final existingArtistIds = _artists.map((a) => a.userId).toSet();
        final filteredNewArtists = newArtists
            .where((artist) => !existingArtistIds.contains(artist.userId))
            .toList();
        _artists.addAll(filteredNewArtists);
        // Keep sorted by follower count
        _artists.sort((a, b) => b.followerCount.compareTo(a.followerCount));
      });
      
      // Small delay to prevent UI blocking
      await Future.delayed(Duration(milliseconds: 100));
    }
  }

  Future<void> _loadArtistBatch() async {
    // Get the next batch of artists
    final int startIndex = _currentPage * _pageSize;
    final int endIndex = startIndex + _pageSize;
    final List<dynamic> currentBatch = _allArtistData.sublist(
        startIndex,
        endIndex < _allArtistData.length ? endIndex : _allArtistData.length
    );

    final newArtists = await _processArtistBatch(currentBatch);

    setState(() {
      // Add only artists not already in the list
      final existingArtistIds = _artists.map((a) => a.userId).toSet();
      final filteredNewArtists = newArtists
          .where((artist) => !existingArtistIds.contains(artist.userId))
          .toList();
      _artists.addAll(filteredNewArtists);
      // Re-sort the entire list after adding new artists
      _artists.sort((a, b) => b.followerCount.compareTo(a.followerCount));
      _currentPage++;
    });
  }

  Future<List<Artist>> _processArtistBatch(List<dynamic> batch) async {
    Map<String, Artist> uniqueArtistsMap = {};

    for (var artistJson in batch) {
      String userId = artistJson['user_id'].toString().trim();
      String rawStageName = artistJson['StageName']?.toString().trim() ?? '';
      String fullName = artistJson['FullName']?.toString().trim() ?? '';
      String stageName = rawStageName.isEmpty ? fullName : rawStageName;

      // Additional check to prevent duplicates using both stageName and userId
      String uniqueKey = '$stageName-$userId';
      if (uniqueArtistsMap.containsKey(uniqueKey)) {
        continue;
      }

      int songCount = artistJson['songCount'] ?? 0;
      bool isFollowing = _followingIds.contains(userId);

      // Fetch follower count
      final followersResponse = await ApiService.getFollowerCount(userId);

      int followerCount = 0;
      if (ApiService.isSuccessResponse(followersResponse)) {
        final followersData = json.decode(followersResponse.body);
        if (followersData is Map<String, dynamic> && followersData['count'] != null) {
          followerCount = followersData['count'];
        }
      }

      // Fetch profile and cover images with caching
      final profileImageUrl = await _fetchProfileImage(userId);
      final coverImageUrl = await _fetchCoverImage(userId);

      uniqueArtistsMap[uniqueKey] = Artist(
        stageName: stageName,
        userId: userId,
        followerCount: followerCount,
        isFollowing: isFollowing,
        profileImageUrl: profileImageUrl,
        coverImageUrl: coverImageUrl,
      );
    }

    return uniqueArtistsMap.values.toList();
  }

  Future<void> _loadMoreArtists() async {
    if (!_isLoadingMore &&
        _currentPage * _pageSize < _allArtistData.length) {
      setState(() {
        _isLoadingMore = true;
      });

      await _fetchArtists();

      setState(() {
        _isLoadingMore = false;
      });
    }
  }

Future<String?> _fetchProfileImage(String userId) async {
  try {
    final response = await ApiService.getProfilePhoto(userId);

    if (ApiService.isSuccessResponse(response)) {
      final responseBody = json.decode(response.body);
      return responseBody['profilePhotoUrl']?['S'];
    } else {
      print('Failed to fetch profile image for userId: $userId');
      return null;
    }
  } catch (e) {
    print('Error fetching profile image for userId: $userId, Error: $e');
    return null;
  }
}

// Fetch cover image URL for an artist by user ID
Future<String?> _fetchCoverImage(String userId) async {
  try {
    final response = await ApiService.getCoverPage(userId);

    if (ApiService.isSuccessResponse(response)) {
      final responseBody = json.decode(response.body);
      return responseBody['coverPageUrl']?['S'];
    } else {
      print('Failed to fetch cover image for userId: $userId');
      return null;
    }
  } catch (e) {
    print('Error fetching cover image for userId: $userId, Error: $e');
    return null;
  }
}

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

Future<void> _followArtist(String followedId, String followingId, int index) async {
  final String timestamp = DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());

    try {
      final response = await ApiService.followUser({
        'updatedTimestamp': timestamp,
        'followed_id': followedId, // Current user's ID
        'following_id': followingId, // Artist's user ID
      });

      if (ApiService.isSuccessResponse(response)) {

         await _fetchUpdatedFollowerCount(followingId, index);
        // Assuming the API returns success
        setState(() {
          _artists[index].isFollowing = true;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Successfully followed ${_artists[index].stageName}')),
        );
      } else {
        // Handle failure
        print('Failed to follow artist. Status code: ${response.statusCode}');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to follow artist')),
        );
      }
    } catch (e) {
      print('Error following artist: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error following artist')),
      );
    }
  }


  Future<void> _unfollowArtist(String unfollowedId, String unfollowingId, int index) async {
    final String timestamp = DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());

    try {
      final response = await ApiService.unfollowUser({
        'updatedTimestamp': timestamp,
        'followed_id': unfollowedId,
        'following_id': [unfollowingId],
      });

      if (ApiService.isSuccessResponse(response)) {
        await _fetchUpdatedFollowerCount(unfollowingId, index);
        setState(() {
          _artists[index].isFollowing = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Unfollowed ${_artists[index].stageName}')),
        );
      } else {
        print('Failed to unfollow artist.');
      }
    } catch (e) {
      print('Error unfollowing artist: $e');
    }
  }








  Future<void> _fetchUpdatedFollowerCount(String userId, int index) async {
  final followersUrl = Uri.parse(
      'https://dfiksrd6v8.execute-api.ap-south-1.amazonaws.com/follow/api/followers/count?user_id=$userId');

  try {
        final followersResponse = await ApiService.get(followersUrl.toString());

        if (ApiService.isSuccessResponse(followersResponse)) {
      final followersData = json.decode(followersResponse.body);
      final int updatedFollowerCount = followersData['count'] ?? 0;

      setState(() {
        _artists[index].followerCount = updatedFollowerCount;
      });
    } else {
      print('Failed to fetch updated follower count');
    }
  } catch (e) {
    print('Error fetching updated follower count: $e');
  }
}

Future<List<Map<String, String>>> _fetchSongsForQuickKeyword(String keyword) async {
  try {
    final response = await ApiService.getSongsByLanguage(keyword);

    if (ApiService.isSuccessResponse(response)) {
      List<dynamic> songData = json.decode(response.body);

      // Convert the fetched data into a list of maps
      List<Map<String, String>> songs = songData.map<Map<String, String>>((song) {
        return {
          'title': song['songName']['S'] ?? 'Unknown',
          'artist': song['stage_name']['S'] ?? 'Unknown',
          'song_id': song['song_id']['S'] ?? 'Unknown',
          'coverPage': song['coverPageUrl']['S'] ?? 'assets/logo.png',
          'duration': song['span']['S'] ?? '0:00',
        };
      }).toList();

      return songs;
    } else {
      throw Exception('Failed to load songs for keyword $keyword');
    }
  } catch (e) {
    print('Error fetching songs for keyword $keyword: $e');
    return [];
  }
}

void _navigateToMusicArtistPage(Artist artist, int index) async {
  // Pass the artist and receive any updated data back from MusicArtistPage
  final updatedArtist = await Navigator.push(
    context,
    MaterialPageRoute(
      builder: (context) => MusicArtistPage(
        artistName: artist.stageName,
        followerCount: artist.followerCount,
        userId: widget.email,
        category: widget.userCategory,
        userfullname: widget.userfullname,
        isFollowing: artist.isFollowing,
        artistId: artist.userId,
         profileImageUrl: artist.profileImageUrl,
        coverImageUrl: artist.coverImageUrl,
      ),
    ),
  );

  // If artist was updated, modify the artist list directly
  if (updatedArtist != null) {
    setState(() {
      _artists[index] = updatedArtist; // Update only the changed artist
    });
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
            // child: Image.asset(
            //   'assets/logo.png', // Your logo asset
            //   height: 50,
            // ),
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
      //backgroundColor: Colors.blueGrey[900],

     body: RefreshIndicator(
        onRefresh: () async {
          await _refreshArtists(); // Refresh artist data for all cards
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Artists refreshed!')),
          );
        },
        child:  Padding(
        padding: const EdgeInsets.fromLTRB(0, 0, 0, 0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Search bar
                  TextField(
                    readOnly: true,
                    controller: _searchController,
                    style: TextStyle(
                      color: Colors.black, // Set input text color to black
                    ),
                    cursorColor: Colors.black,
                    decoration: InputDecoration(
                      prefixIcon: Icon(Icons.search, color: Colors.black),
                      hintText: 'Search Songs/Artist',
                      hintStyle: TextStyle(color: Color(0x99000000),fontFamily: 'Poppins',fontSize: 18),
                      filled: true,
                      fillColor: Colors.white.withOpacity(0.8),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(20),
                        borderSide: BorderSide.none,
                      ),
                    ),
                   onTap: () {
              // Navigate to the new search page on tap
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => SearchResultsPage(email: widget.email, userCategory: widget.userCategory, userfullname: widget.userfullname,focusTextField: true,)),
              );
            },
                  ),
                  SizedBox(height: 10),


            SizedBox(height: 15,),
                  // Singer names in rows with buttons
                  LayoutBuilder(
                    builder: (context, constraints) {
                      // Calculate the available width
                      double availableWidth = constraints.maxWidth;

                      // Set fixed button width (max 158 as requested)
                      double buttonWidth = min(148.0, (availableWidth - 20) / 2);

                      // Calculate spacing between buttons (centered in available space)
                      double horizontalSpacing = availableWidth - (buttonWidth * 2) - 20;

                      return Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 10.0),
                        child: Wrap(
                          alignment: WrapAlignment.spaceBetween,
                          spacing: horizontalSpacing > 0 ? horizontalSpacing : 8, // Minimum spacing of 10
                          runSpacing: 15.0, // Vertical space between rows
                          children: List.generate(_singers.length, (index) {
                            // Create rows with exactly 2 buttons each
                            bool isStartOfRow = index % 2 == 0;
                            bool isEndOfRow = index % 2 == 1 || index == _singers.length - 1;
                            String singer = _singers[index];

                            return Container(
                              width: buttonWidth,
                              height: 45,
                              margin: EdgeInsets.only(
                                right: isEndOfRow ? 0 : 0,
                                left: isStartOfRow ? 0 : 0,
                              ),
                              child: ElevatedButton(
                                onPressed: () {
                                  String languageBannerImage = ImageUtils.getLanguageImagePathSync(singer);
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                      builder: (context) => ListPage(
                                        navigationIndex: 1,
                                        genreTitle: singer,
                                        bannerImage: languageBannerImage,
                                        email: widget.email,
                                        Category: widget.userCategory,
                                        fullname: widget.userfullname,
                                        isLanguage: true,
                                      ),
                                    ),
                                  );
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Color(0x33D9D9D9),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                ),
                                child: Text(
                                  singer,
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontFamily: 'Poppins',
                                      fontSize: 16.5
                                  ),
                                ),
                              ),
                            );
                          }),
                        ),
                      );
                    },
                  )


                ],
              ),
            ),

            // Remaining content should take up the remaining space
            SizedBox(height: 20,),
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Image section with artist info and "Follow" button
                    Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 10.0),
            child: Text(
              'Top Artists',
              style: TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        SizedBox(height: 20,),
           Container(
              height: 200, // Set reduced fixed height for the artist section
              child: RefreshIndicator(
                color: Colors.white, // Color of the loader itself
  backgroundColor: Colors.blueAccent,
                onRefresh: () async {
                  print("Refresh started");
                  // setState(() {
                  //   _isLoadingArtists = true;
                  // });
                  await _refreshArtists();
                  // setState(() {
                  //   _isLoadingArtists = false;
                  // });
                  print("Refresh completed");

                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Artists refreshed!')),
                  );
                },
                child: SingleChildScrollView(
                  scrollDirection: Axis.vertical, // Allows vertical refresh pull
                  physics: const AlwaysScrollableScrollPhysics(),
                  child: SizedBox(
                    height: 200, // Fixed height for artist cards list
                    child: _isLoadingArtists && _artists.isEmpty
                        ? _buildShimmerLoading()
                        : _artists.isEmpty
                            ? Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                                child: Text(
                                  'No artists found',
                                  style: TextStyle(color: Colors.white),
                                ),
                              )
                            : ListView.builder(
  controller: _scrollController,
  scrollDirection: Axis.horizontal,
  padding: EdgeInsets.symmetric(horizontal: 16.0),
  itemCount: _artists.length + (_isLoadingMore ? 1 : 0),
  itemBuilder: (context, index) {
    if (index == _artists.length) {
      return Center(
        child: SizedBox(
          width: 50,
          height: 50,
          child: CircularProgressIndicator(
            color: Colors.white,
          ),
        ),
      );
    }
    final artist = _artists[index];
    return Padding(
      padding: const EdgeInsets.only(right: 16.0),
      child: artistProfileCard(artist, index),
    );
  },
)
                  ),
                ),
              ),
            ),
                    SizedBox(height: 20),

                SizedBox(height: 65,)
                  ],
                ),
              ),
            ),
          ],
        ),
      ),


    ));


    // Create the final widget structure based on where SearchPage is being shown
    // Create the final widget structure based on where SearchPage is being shown
    Widget finalWidget;
    if (widget.isFromNewHomePage) {
      // When embedded in NewHomePage, just use the content with LoadingScreen
      finalWidget = Stack(
          children: [
            content,
            LoadingScreen(
              isLoading: _isLoading,
              isNoInternet: _isNoInternet,
              onRetry: _checkConnectivity,
            ),
          ]
      );
    } else {
      // When shown as a standalone page, wrap with nav bar and LoadingScreen
      // Add nowPlayingTile here, similar to ProfilePage
      finalWidget = PageWithBottomNav(
        child: content,
        nowPlayingTile: ValueListenableBuilder<bool>(
          valueListenable: isNowPlayingTileVisible,
          builder: (context, isVisible, _) {
            if (!isVisible) return const SizedBox();
            return NowPlayingTile(
              email: widget.email,
              userFullName: widget.userfullname,
              userCategory: widget.userCategory,
            );
          },
        ),
        email: widget.email,
        fullName: widget.userfullname,
        category: widget.userCategory,
        currentIndex: 1,
        isFromNewHomePage: false,
      );
    }

    return finalWidget;
  }


  Widget artistProfileCard(Artist artist, int index) {
    final currentUserId = ProfileManager().getUserId();

    return GestureDetector(
      onTap: () => _navigateToMusicArtistPage(artist, index),
      child: Container(
        width: 300,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(10),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(10),
          child: Stack(
            children: [
              // Background image with caching
              Positioned.fill(
                child: _getArtistImageWidget(artist),
              ),
              // Gradient overlay for better text readability
              Positioned.fill(
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.transparent,
                        Colors.black.withOpacity(0.7),
                      ],
                    ),
                  ),
                ),
              ),
              _buildArtistInfo(artist),
              if (_shouldShowFollowButton(artist.userId, currentUserId))
                _buildFollowButton(artist, index),
            ],
          ),
        ),
      ),
    );
  }

// Private helper methods for better code organization

  Widget _getArtistImageWidget(Artist artist) {
    // Check if artist has a valid cover image URL
    if (_hasValidCoverImage(artist.coverImageUrl)) {
      return CachedNetworkImage(
        imageUrl: artist.coverImageUrl!,
        fit: BoxFit.cover,
        width: double.infinity,
        height: double.infinity,
        memCacheWidth: 600,
        memCacheHeight: 400,
        fadeInDuration: Duration(milliseconds: 200),
        placeholder: (context, url) => Shimmer.fromColors(
          baseColor: Colors.grey[800]!,
          highlightColor: Colors.grey[600]!,
          child: Container(
            color: Colors.white,
          ),
        ),
        errorWidget: (context, url, error) {
          // Generate default image based on userId hash
          final imageNumber = artist.userId.hashCode.abs() % 3 + 1;
          return Image.asset(
            'assets/artist_card_default_new$imageNumber.png',
            fit: BoxFit.cover,
            width: double.infinity,
            height: double.infinity,
          );
        },
      );
    }

    // Generate default image based on userId hash
    final imageNumber = artist.userId.hashCode.abs() % 3 + 1;
    return Image.asset(
      'assets/artist_card_default_new$imageNumber.png',
      fit: BoxFit.cover,
      width: double.infinity,
      height: double.infinity,
    );
  }

  bool _hasValidCoverImage(String? coverImageUrl) {
    return coverImageUrl != null &&
        coverImageUrl.isNotEmpty &&
        coverImageUrl.trim().isNotEmpty;
  }

  Widget _buildArtistInfo(Artist artist) {
    return Positioned(
      left: 10,
      bottom: 10,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            artist.stageName,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Text(
              '${artist.followerCount} Followers',
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
    );
  }

    bool _shouldShowFollowButton(String artistUserId, String? currentUserId) {
      return artistUserId != currentUserId;
    }

    Widget _buildFollowButton(Artist artist, int index) {
      return Positioned(
        right: 10,
        bottom: 10,
        child: GestureDetector(
          onTap: () => _handleFollowToggle(artist, index),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(30),
              gradient: LinearGradient(
                colors: [
                  Colors.white.withOpacity(0.2),
                  Colors.white.withOpacity(0.2)
                ],
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const SizedBox(width: 5),
                Text(
                  artist.isFollowing ? 'Unfollow' : 'Follow +',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.normal,
                    fontFamily: 'Poppins',
                    fontSize: 16,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    Future<void> _handleFollowToggle(Artist artist, int index) async {
      final currentUserId = ProfileManager().getUserId();
      if (currentUserId == null) return;

      try {
        if (artist.isFollowing) {
          await _unfollowArtist(currentUserId, artist.userId, index);
        } else {
          await _followArtist(currentUserId, artist.userId, index);
        }
      } catch (e) {
        // Handle error appropriately (show snackbar, log, etc.)
        debugPrint('Error toggling follow status: $e');
      }
    }


  Widget _buildShimmerLoading() {
    return Shimmer.fromColors(
      baseColor: Colors.grey[800]!,
      highlightColor: Colors.grey[600]!,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: EdgeInsets.symmetric(horizontal: 16.0),
        itemCount: 3,
        itemBuilder: (context, index) {
          return Padding(
            padding: const EdgeInsets.only(right: 16.0),
            child: Container(
              width: 300,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget albumCard(String title, String imagePath) {
  return GestureDetector(
    onTap: () async {
      // Fetch songs for the selected album (mood)
      List<Map<String, String>> songs = await _fetchSongsForQuickKeyword(title);

      // Navigate to ListPage if songs are fetched successfully
      if (songs.isNotEmpty) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ListPage(
              navigationIndex: 1,
              genreTitle: title, // Use the title of the album (e.g., "Party", "Gym")
              bannerImage: imagePath, // Use the image of the album
              email: widget.email, // Pass user's email if needed
              //songs: songs,
              Category: widget.userCategory, fullname: widget.userfullname, // Pass the fetched songs list
            ),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('No songs available for $title')),
        );
      }
    },
    child: Column(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(10.0),
          child: Image.asset(imagePath, width: 120, height: 120, fit: BoxFit.cover),
        ),
        SizedBox(height: 5),
        Text(
          title,
          style: TextStyle(color: Colors.white, fontSize: 16),
        ),
      ],
    ),
  );
}

}

class Artist {
  final String stageName;
  final String userId;
  int followerCount;
  bool isFollowing; // Tracks if the current user is following this artist
  String? coverImageUrl; // URL for the cover page image
  String? profileImageUrl; // URL for the profile image

  Artist({
    required this.stageName,
    required this.userId,
    required this.followerCount,
    this.isFollowing = false, // Defaults to not following
    this.coverImageUrl,
    this.profileImageUrl,
  });

  // Factory method to create an Artist from JSON
  factory Artist.fromJson(
    Map<String, dynamic> json,
    String userId, {
    bool isFollowing = false,
    String? coverPageUrl,
    String? profileImageUrl,
  }) {
    String rawStageName = json['stage_name']['S'].toString();
    String stageName = rawStageName.trim(); // Remove any leading/trailing whitespace

    return Artist(
      stageName: stageName,
      userId: userId,
      followerCount: json['follower_count'] is int
          ? json['follower_count']
          : int.parse(json['follower_count'].toString()), // Handle different types
      isFollowing: isFollowing,
      coverImageUrl: coverPageUrl,
      profileImageUrl: profileImageUrl,
    );
  }
}

