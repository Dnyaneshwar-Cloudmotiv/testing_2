// Playlist.dart

import 'dart:ui';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:firebase_dynamic_links/firebase_dynamic_links.dart';
import 'package:flutter/material.dart';
import 'package:voiceapp/services/api_service.dart';
import 'package:intl/intl.dart';
import 'package:share_plus/share_plus.dart';
import 'package:voiceapp/listofsongforplaylist.dart';
import 'package:voiceapp/main.dart';
import 'package:voiceapp/nowplaying.dart';
import 'package:voiceapp/profile_manager.dart';
import 'dart:convert';
import 'bottomnavigationbar.dart';
import 'newlistofsongs.dart'; // Import the ListPage here
import 'package:voiceapp/connectivity_service.dart';
import 'package:voiceapp/loading_screen.dart';

class PlaylistsPage extends StatefulWidget {
  final String userId;
  final String category;
  final String userfullname;
  String? expandedPlaylistId;

  PlaylistsPage(
      {required this.userId,
        required this.category,
        required this.userfullname});

  @override
  _PlaylistsPageState createState() => _PlaylistsPageState();
}

class _PlaylistsPageState extends State<PlaylistsPage> {
  List<Map<String, String>> playlists = [];
  bool isLoading = true;
  bool isMenuOpen = false;
  bool _isLoading = true;
  bool _isNoInternet = false;
  late ConnectivityService _connectivityService;
  bool _mounted = true;

  @override
  void initState() {
    super.initState();
    _mounted = true;
    _connectivityService = ConnectivityService();
    _setupConnectivityListener();
    _fetchPlaylists();
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
      await _fetchPlaylists();

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
  void dispose() {
    _mounted = false;
    _connectivityService.dispose();
    super.dispose();
  }

  void _confirmDeletePlaylist(String playlistId) {
    setState(() {
      isMenuOpen = true; // Set blur state for playlist list only
    });

    showDialog(
      context: context,
      barrierColor: Colors.black.withOpacity(0.1), // Semi-transparent overlay
      builder: (BuildContext context) {
        return Dialog(
          elevation: 15,
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
                  'Delete Playlist?',
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
                          isMenuOpen = false; // Remove blur
                        });
                        Navigator.of(context).pop();
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
                      onPressed: () async {
                        setState(() {
                          isMenuOpen = false; // Remove blur
                        });
                        Navigator.of(context).pop();
                        await _deletePlaylist(playlistId);
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
    ).then((_) {
      // Ensure blur is removed when dialog is dismissed
      if (mounted) {
        setState(() {
          isMenuOpen = false;
        });
      }
    });
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
            'playlistCount': data['playlistCount']?['S'] ?? '0',
            'shareSongCount': data['shareSongCount']?['S'] ?? '0',
            'span': data['span']?['S'] ?? '00:00',
            'coverPage': data['coverPageUrl']?['S'] ??
                'assets/placeholder.png', // Default cover page if null
            'songUrl': data['songUrl']?['S'] ?? '', // Fallback if no URL
            'genre': data['genre']?['S'] ?? 'Unknown Genre',
            'mood': data['mood']?['S'] ?? 'Unknown Mood',
            'playCount': data['playCount']?['S'] ?? '0',
            'approved': data['approved']?['BOOL'] ?? false,
            'userDetails': {
              'email': data['user_EmailId']?['S'] ?? 'No Email',
              'fullName': data['user_FullName']?['S'] ?? 'No Name',
              'profilePhotoUrl': data['coverPageUrl']?['S'] ??
                  '', // Default or fallback for profile image
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
        print(
            'Failed to fetch song details. Status code: ${response.statusCode}');
        return null;
      }
    } catch (error) {
      print('Error fetching song details: $error');
      return null;
    }
  }

  // Fetch playlists from the API
  Future<void> _fetchPlaylists() async {
    print(ProfileManager().getUserId()!);
    try {
      final response = await ApiService.getUserPlaylists(ProfileManager().getUserId()!);

      if (ApiService.isSuccessResponse(response)) {
        final jsonResponse = jsonDecode(response.body);

        if (jsonResponse.containsKey('playlists') &&
            jsonResponse['playlists'].isNotEmpty) {
          final List<dynamic> playlistsData = jsonResponse['playlists'];

          List<Map<String, String>> updatedPlaylists = [];
          Map<String, String> coverSongIdMap = {}; // Map playlist_id to cover songId (latest added)
          List<String> songIdsToFetch = []; // List of all songIds to fetch

          // First pass: Extract playlists and their cover song IDs (latest added)
          for (var playlist in playlistsData) {
            final playlistId = playlist['playlist_id']?['S'] ?? '';
            final playlistName = playlist['playlistName']?['S'] ?? 'Unknown Playlist';

            // Extract songIds from the M (map) structure
            final songIdsMap = playlist['songIds']?['M'] ?? {};
            final Map<String, String> songIdToTimestamp = {};

            // Create a map of songId to timestamp
            songIdsMap.forEach((songId, timestampObj) {
              if (timestampObj['S'] != null) {
                songIdToTimestamp[songId] = timestampObj['S'];
              }
            });

            final songCount = songIdToTimestamp.length.toString();
            String coverImage = 'assets/folder12.png'; // Default image

            // Get the earliest timestamp for creation
            String earliestTimestamp = '';
            if (songIdToTimestamp.isNotEmpty) {
              earliestTimestamp = songIdToTimestamp.values.reduce((a, b) =>
              parseCustomDateTime(a).isBefore(parseCustomDateTime(b)) ? a : b);

              // Find the songId with the latest timestamp
              String latestAddedSongId = songIdToTimestamp.entries
                  .reduce((a, b) =>
              parseCustomDateTime(a.value).isAfter(parseCustomDateTime(b.value))
                  ? a : b)
                  .key;

              coverSongIdMap[playlistId] = latestAddedSongId;
              songIdsToFetch.add(latestAddedSongId);
            }

            Map<String, String> playlistData = {
              'playlist_id': playlistId,
              'playlistName': playlistName,
              'songCount': songCount,
              'coverImage': coverImage,
              'createdTimestamp': earliestTimestamp,
            };

            updatedPlaylists.add(playlistData);
          }

          // Second pass: Fetch all song details in a batch (or in smaller batches)
          Map<String, Map<String, dynamic>> songDetailsMap = {};

          // Batch fetch song details - ideally in chunks of 10-20 if there are many
          for (int i = 0; i < songIdsToFetch.length; i += 10) {
            int end = (i + 10 < songIdsToFetch.length) ? i + 10 : songIdsToFetch.length;
            List<String> batch = songIdsToFetch.sublist(i, end);

            // Process each batch
            List<Future<void>> batchFutures = [];
            for (String songId in batch) {
              batchFutures.add(_fetchSongDetails(songId).then((details) {
                if (details != null) {
                  songDetailsMap[songId] = details;
                }
              }));
            }

            // Wait for the current batch to complete
            await Future.wait(batchFutures);
          }

          // Third pass: Update playlists with cover images
          for (var playlist in updatedPlaylists) {
            String playlistId = playlist['playlist_id']!;
            if (coverSongIdMap.containsKey(playlistId)) {
              String songId = coverSongIdMap[playlistId]!;
              if (songDetailsMap.containsKey(songId)) {
                playlist['coverImage'] = songDetailsMap[songId]!['coverPage'];
              }
            }
          }

          // Sort playlists by playlist_id in descending order
          updatedPlaylists.sort((a, b) {
            final idA = int.parse(a['playlist_id'] ?? '0');
            final idB = int.parse(b['playlist_id'] ?? '0');
            return idB.compareTo(idA); // Descending order
          });

          setState(() {
            playlists = updatedPlaylists;
          });
        } else {
          setState(() {
            playlists = [];
          });
        }
      } else {
        throw Exception('Failed to load playlists');
      }
    } catch (e) {
      print('Error fetching playlists: $e');
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }

// Helper function to parse custom date-time format (e.g., "yyyyMMdd_HHmmss")
  DateTime parseCustomDateTime(String dateTimeStr) {
    // Try parsing ISO 8601 format first
    DateTime? isoParsed = DateTime.tryParse(dateTimeStr);
    if (isoParsed != null) {
      return isoParsed;
    }

    // Try parsing custom format "yyyyMMdd_HHmmss"
    final RegExp dateTimeRegExp = RegExp(r'^\d{8}_\d{6}$');
    if (!dateTimeRegExp.hasMatch(dateTimeStr)) {
      print('Invalid date format: $dateTimeStr');
      return DateTime(1970);
    }

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
      return DateTime(1970);
    }
  }

  void _sharePlaylist(String playlistId, String coverImage) async {
    try {
      final dynamicLink =
      await _createPlaylistDynamicLink(playlistId, coverImage);
      final shareText =
          'Hey, see my amazing playlist 😍 on VOIZ ! Sharing as I know you would love it ! Just download the app, listen and enjoy!  $dynamicLink';
      Share.share(shareText);
    } catch (e) {
      print('Error sharing playlist: $e');
    }
  }

// Create the dynamic link for the playlist
  Future<String> _createPlaylistDynamicLink(
      String playlistId, String coverImage) async {
    final DynamicLinkParameters parameters = DynamicLinkParameters(
      uriPrefix: 'https://voiznewapp.page.link',
      link: Uri.parse(
          'https://voiznewapp.page.link/playlist?playlist_id=$playlistId'),
      androidParameters: AndroidParameters(
        packageName:
        'com.voizapp.voiceapp', // Replace with your app package name
        minimumVersion: 1,
      ),
      iosParameters: IOSParameters(
        bundleId: 'com.voizapp.voiceapp', // Replace with your iOS bundle ID
        minimumVersion: '1.0.0',
      ),
      socialMetaTagParameters: SocialMetaTagParameters(
        title: 'Check out My playlist!',
        description: 'Amazing playlist on VoizApp!',
        imageUrl: Uri.parse(coverImage), // Optional, if you have a banner image
      ),
    );

    final ShortDynamicLink shortLink =
    await FirebaseDynamicLinks.instance.buildShortLink(parameters);
    return shortLink.shortUrl.toString();
  }

  // Fetch songs for a specific playlist
  Future<List<Map<String, String>>> _fetchSongsInPlaylist(
      String playlistId) async {
    final response = await ApiService.getPlaylistSongs(playlistId);

    if (ApiService.isSuccessResponse(response)) {
      final jsonResponse = jsonDecode(response.body);

      // Check if the response contains 'songDetails'
      if (jsonResponse.containsKey('songDetails')) {
        final List<dynamic> items = jsonResponse['songDetails'];
        // Extract song details
        List<Map<String, String>> songList = [];

        for (var songArray in items) {
          for (var song in songArray) {
            final artist = (song['Stage_name']?['S']?.isNotEmpty == true)
                ? song['Stage_name']['S']
                : (song['FullName']?['S'] ?? 'Unknown Artist');
            songList.add({
              'title':
              song['songName']['S'] ?? 'Unknown Title', // Access song name
              'artist': artist, // Access stage name with fallback
              'duration': song['span']['S'] ?? '00:00',
              'song_id': song['song_id']['S'] ?? 'unknown', // Access duration
              'coverPage': song['coverPageUrl']['S'] ??
                  'assets/logo.png', // Default image path
            });
          }
        }

        print(songList);

        return songList; // Return the constructed list of songs
      } else {
        // Return an empty list if no songs found
        return [];
      }
    } else {
      throw Exception('Failed to load songs');
    }
  }

  Future<void> _renamePlaylist(String playlistId) async {
    TextEditingController _renameController = TextEditingController();

    setState(() {
      isMenuOpen = true;
    });

    showDialog(
      context: context,
      barrierColor: Colors.black.withOpacity(0),
      builder: (context) {
        return AlertDialog(
          elevation: 10.0,
          backgroundColor: Color(0xFF151415),
          //backgroundColor: Colors.black, // Set the background color to black
          //insetPadding: EdgeInsets.symmetric(horizontal: 20), // Control overall dialog width
          contentPadding: EdgeInsets.symmetric(horizontal: 30, vertical: 15),
          title: Center(
            child: Text(
              'Rename Playlist',
              style:
              TextStyle(color: Colors.white,fontWeight: FontWeight.w600,fontSize: 24,fontFamily: 'Poppins'), // Make the title text white
            ),
          ),
          content: TextField(
            controller: _renameController,
            style: TextStyle(color: Colors.black,decorationThickness: 0), // Make the input text white
            decoration: InputDecoration(
              filled: true,
              fillColor: Color(0xCCFFFFFF),
              hintText: 'Enter new playlist name',
              hintStyle: TextStyle(
                  color: Colors.black,fontSize: 15), // Make the hint text white-ish
              enabledBorder: OutlineInputBorder(
                borderSide: BorderSide(
                    color: Colors.transparent), // White border for the input field
              ),
              focusedBorder: OutlineInputBorder(
                borderSide: BorderSide(
                    color: Colors.transparent,
                    width: 2.0), // White border when focused
              ),
            ),
            cursorColor: Colors.black,
          ),
          actions: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                TextButton(
                  onPressed: () {
                    setState(() {
                      isMenuOpen = false; // Remove blur
                    });
                    Navigator.pop(context);
                  },
                  child: Text(
                    'Cancel',
                    style: TextStyle(color: Colors.white,fontFamily: 'Poppins',fontSize: 18), // Make the text blue
                  ),
                ),
                SizedBox(width: 25,),
                TextButton(
                  onPressed: () async {
                    String newName = _renameController.text;
                    if (newName.isNotEmpty) {
                      await _performRenamePlaylist(playlistId, newName);
                      setState(() {
                        isMenuOpen = false; // Remove blur
                      });
                      Navigator.pop(context);
                    } else {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Please enter a valid name')),
                      );
                    }
                  },
                  child: Text(
                    'Rename',
                    style: TextStyle(color: Colors.white,fontFamily: 'Poppins',fontSize: 18), // Make the text blue
                  ),
                ),
              ],
            ),

          ],
        );
      },
    ).then((_) {
      // Ensure blur is removed when dialog is dismissed
      if (mounted) {
        setState(() {
          isMenuOpen = false;
        });
      }
    });
  }

  // Perform the actual rename API call
  Future<void> _performRenamePlaylist(String playlistId, String newName) async {
    final String timestamp =
    DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());
    try {
      final response = await ApiService.updatePlaylistName({
        'playlist_id': playlistId,
        'playlistName': newName,
        'updatedTimestamp': timestamp
      });

      if (ApiService.isSuccessResponse(response)) {
        print('Playlist renamed successfully');
        setState(() {
          playlists = playlists.map((playlist) {
            if (playlist['playlist_id'] == playlistId) {
              return {...playlist, 'playlistName': newName};
            }
            return playlist;
          }).toList();
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Playlist renamed successfully')),
        );
      } else {
        print('Failed to rename playlist');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to rename playlist')),
        );
      }
    } catch (error) {
      print('Error renaming playlist: $error');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error renaming playlist')),
      );
    }
  }

  // Delete playlist method
  Future<void> _deletePlaylist(String playlistId) async {
    try {
      final response = await ApiService.deletePlaylist({
        'playlist_id': playlistId,
      });

      if (ApiService.isSuccessResponse(response)) {
        print('Playlist deleted successfully');
        setState(() {
          playlists
              .removeWhere((playlist) => playlist['playlist_id'] == playlistId);
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Playlist deleted successfully')),
        );
      } else {
        print('Failed to delete playlist');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to delete playlist')),
        );
      }
    } catch (error) {
      print('Error deleting playlist: $error');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error deleting playlist')),
      );
    }
  }

  // Share playlist method

  @override
  Widget build(BuildContext context) {
    Widget content = GradientScaffold(
      //backgroundColor: Colors.black,
      // appBar: AppBar(
      //   backgroundColor: Colors.transparent,
      //   elevation: 0,
      //   title: Padding(
      //       padding: const EdgeInsets.only(left: 0.0, top: 0.0), // Add padding to the logo
      //       child: Image.asset(
      //         'assets/logo.png', // Your logo asset
      //         height: 50,
      //       ),
      //     ),
      //   leading: IconButton(
      //     icon: Icon(Icons.arrow_back_ios, color: Colors.white),
      //     onPressed: () {
      //       Navigator.pop(context);
      //     },
      //   ),
      // ),
      // body: isLoading
      //     ? Center(child: CircularProgressIndicator())
      //     : Column(
      body: Column(
        children: [
          // Top banner with text and icon
          Stack(
            children: [
              Container(
                width: double.infinity,
                height: 250,
                decoration: BoxDecoration(
                  image: DecorationImage(
                    image: AssetImage('assets/default.jpg'),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
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

              Positioned(
                bottom: 10,
                left: 20,
                child: Row(
                  children: [
                    Text(
                      "Playlists",
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 30,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(
                      width: 10,
                    ),
                    Image.asset("assets/Playlist.png", height: 30)
                  ],
                ),
              ),
            ],
          ),
          SizedBox(height: 20),
          // Playlist List
          Expanded(
            child: Stack(
              children: [
                // Playlist List
                ClipRect(
                  child: ListView.builder(
                    padding: EdgeInsets.zero,
                    itemCount: playlists.length,
                    itemBuilder: (context, index) {
                      final playlist = playlists[index];
                      return GestureDetector(
                        onTap: () async {
                          final bool? shouldRefresh =
                          await Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => ListPage1(
                                genreTitle: playlist['playlistName']!,
                                bannerImage: 'assets/playlist_banner.jpg',
                                email: widget.userId,
                                Category: widget.category,
                                fullname: widget.userfullname,
                                playlistId: playlist['playlist_id']!,
                              ),
                            ),
                          );

                          // Refresh playlists if needed
                          if (shouldRefresh == true) {
                            _fetchPlaylists();
                          }
                        },
                        child: _buildPlaylistItem(
                          context,
                          playlist['playlistName'] ?? 'Unnamed Playlist',
                          '${playlist['songCount']} Songs',
                          playlist['playlist_id'] ?? '',
                          playlist['coverImage'] ??
                              'assets/out_of_mine.png',
                        ),
                      );
                    },
                  ),
                ),
                // Blur effect restricted to ListView area
                if (isMenuOpen)
                  Positioned(
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    child: ClipRect(
                      child: BackdropFilter(
                        filter:
                        ImageFilter.blur(sigmaX: 5.0, sigmaY: 5.0),
                        child: Container(
                          color: Colors
                              .transparent, // Slight overlay effect (optional)
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),

          NowPlayingTile(
            email: widget.userId,
            userFullName: widget.userfullname,
            userCategory: widget.category,
          )
        ],
      ),
    );

    return Stack(
        children:[
          PageWithBottomNav(
            child: content,
            email: widget.userId,
            fullName: widget.userfullname,
            category: widget.category,
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

  Widget _buildPlaylistItem(BuildContext context, String title,
      String songCount, String playlistId, String coverImage) {
    bool isAsset = coverImage.startsWith('assets/');

    return GestureDetector(
        behavior: HitTestBehavior.opaque, // Ensure the entire item is tappable
        onTap: () async {
          // Navigate to the ListPage1 with a refresh check
          final bool? shouldRefresh = await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => ListPage1(
                genreTitle: title,
                bannerImage: 'assets/default.jpg',
                email: widget.userId,
                Category: widget.category,
                fullname: widget.userfullname,
                playlistId: playlistId,
              ),
            ),
          );

          // Refresh playlists if needed
          if (shouldRefresh == true) {
            _fetchPlaylists();
          }
        },
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Stack to overlay playlist image inside folder image
              Row(
                children: [
                  Stack(
                    alignment: Alignment.center,
                    children: [
                      // Folder image with reduced opacity
                      Opacity(
                        opacity: 0.80, // Adjust the opacity value (0.0 to 1.0)
                        child: Image.asset(
                          'assets/folder13.png', // Replace with your transparent folder asset
                          height: 85, // Adjust folder size as needed
                          width: 95,
                          fit: BoxFit.cover,
                        ),
                      ),
                      // Playlist image overlaid inside the folder
                      Positioned(
                        top: 0,
                        left: 10,
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(10),
                          child: Opacity(
                            opacity: 0.7,
                            child: isAsset
                                ? Image.asset(
                              coverImage,
                              height: 70,
                              width: 80,
                              fit: BoxFit.cover,
                            )
                                : CachedNetworkImage(
                              imageUrl: coverImage,
                              height: 70,
                              width: 80,
                              fit: BoxFit.cover,
                              placeholder: (context, url) => Container(
                                color: Colors.grey[800],
                                height: 70,
                                width: 80,
                              ),
                              errorWidget: (context, url, error) => Container(
                                color: Colors.grey[800],
                                height: 70,
                                width: 80,
                                child: Icon(Icons.broken_image, color: Colors.white),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),

                  SizedBox(width: 12),
                  // Title and song count
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        SizedBox(height: 4),
                        Text(
                          songCount,
                          style: TextStyle(
                            color: Colors.grey,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                  // 3-dot menu button on the right side of the row
                  PopupMenuButton<String>(
                    icon: Icon(Icons.more_vert, color: Colors.white),
                    position: PopupMenuPosition.under,
                    color: Color(
                        0xFF151415), // Set the background color for the popup menu
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(
                          20), // Rounded rectangular corners
                    ),
                    onOpened: () {
                      setState(() {
                        isMenuOpen = true; // Open the menu
                      });
                    },
                    onCanceled: () {
                      setState(() {
                        isMenuOpen = false; // Close the menu
                      });
                    },
                    onSelected: (String value) {
                      setState(() {
                        isMenuOpen = false; // Close the menu on selection
                      });

                      switch (value) {
                        case 'Rename':
                          _renamePlaylist(playlistId);
                          break;
                        case 'Delete':
                          _confirmDeletePlaylist(playlistId);
                          break;
                        case 'Share':
                          _sharePlaylist(playlistId, coverImage);
                          break;
                      }
                    },
                    itemBuilder: (BuildContext context) {
                      return [
                        PopupMenuItem<String>(
                          value: 'Rename',
                          height: 25,
                          child: ListTile(
                            dense: true, // Makes the ListTile more compact
                            visualDensity: VisualDensity(horizontal: 0, vertical: 0),
                            leading: Image.asset(
                              'assets/edit.png', // Path to your custom image for rename
                              height: 24,
                              width: 24,
                              color: Colors
                                  .white, // Optional: Tint the image white if itâ€™s monochrome
                            ),
                            title: Text(
                              'Rename',
                              style: TextStyle(color: Colors.white,fontFamily: 'poppins',fontWeight: FontWeight.w600),
                            ),
                          ),
                        ),
                        PopupMenuItem<String>(
                          value: 'Delete',
                          height: 25,
                          child: ListTile(
                            dense: true, // Makes the ListTile more compact
                            visualDensity: VisualDensity(horizontal: 0, vertical: -4),
                            leading: Image.asset(
                              'assets/delete.png', // Path to your custom image for delete
                              height: 24,
                              width: 24,
                              color: Colors
                                  .white, // Optional: Tint the image white if itâ€™s monochrome
                            ),
                            title: Text(
                              'Delete',
                              style: TextStyle(color: Colors.white,fontFamily: 'poppins',fontWeight: FontWeight.w600),
                            ),
                          ),
                        ),
                        PopupMenuItem<String>(
                          value: 'Share',
                          child: ListTile(
                            leading: Image.asset(
                              'assets/Share.png', // Path to your custom image for share
                              height: 24,
                              width: 24,
                              color: Colors
                                  .white, // Optional: Tint the image white if itâ€™s monochrome
                            ),
                            title: Text(
                              'Share',
                              style: TextStyle(color: Colors.white,fontFamily: 'poppins',fontWeight: FontWeight.w600),
                            ),
                          ),
                        ),
                      ];
                    },
                  ),
                ],
              ),
              SizedBox(height: 10), // Add spacing after the playlist item
            ],
          ),
        ));
  }
}