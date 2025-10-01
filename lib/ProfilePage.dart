// ProfilePage.dart
import 'dart:convert';

import 'package:firebase_dynamic_links/firebase_dynamic_links.dart';
import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
//import 'package:voiceapp/Analystics.dart';
import 'package:voiceapp/Analystics1.dart';
//import 'package:voiceapp/ListOfSong.dart';
import 'package:voiceapp/Playlist.dart';

import 'package:voiceapp/adminlistsong.dart';
import 'package:voiceapp/bottomnavigationbar.dart';
//import 'package:voiceapp/encoding.dart';
import 'package:voiceapp/feedback.dart';
import 'package:voiceapp/main.dart';
//import 'package:voiceapp/adminlistofsongs.dart';
//import 'package:voiceapp/adminlistsong.dart';
import 'package:voiceapp/newlistofsongs.dart';
import 'package:voiceapp/nowplaying.dart';
import 'package:voiceapp/profile_manager.dart';
import 'package:voiceapp/refer.dart';
import 'package:voiceapp/viewProfile.dart';
import 'package:voiceapp/services/api_service.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:voiceapp/loading_screen.dart';
import 'package:voiceapp/connectivity_service.dart';

class ProfilePage extends StatefulWidget {
  final String userCategory;
  final String email;
  final String userfullname;
   final bool showGlobalNavBar;
  final bool isFromNewHomePage;

  ProfilePage({
    required this.userCategory,
    required this.email,
    required this.userfullname,
    this.showGlobalNavBar = false,
    this.isFromNewHomePage = false,

  });

  @override
  _ProfilePageState createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  String? _profileImageUrl;
  String? _cachedReferralLink;
  bool _isGeneratingLink = false;
  late ConnectivityService _connectivityService;
  bool _isLoading = false;
  bool _isNoInternet = false;
  bool _mounted = true;

   @override
  void initState() {
    super.initState();
    _mounted = true;
    _prefetchReferralLink();
    _connectivityService = ConnectivityService();
    _setupConnectivityListener();

    
   // _fetchProfileImage();
     // Fetch profile image from API when page loads
  }
  void _setupConnectivityListener() {
    _connectivityService.connectionStream.listen((hasConnection) {
      if (!_mounted) return; // Skip if component is unmounted

      setState(() {
        _isNoInternet = !hasConnection;
      });
    });

    // Initial check
    _checkConnectivity();
  }

  Future<void> _checkConnectivity() async {
    await _connectivityService.checkConnection();
    setState(() {
      _isNoInternet = !_connectivityService.hasConnection;
    });
  }
  @override
  void dispose() {
    _mounted = false; // Set flag before disposing
    _connectivityService.dispose();
    super.dispose();
  }

  Future<void> _prefetchReferralLink() async {
    try {
      _cachedReferralLink = await _createReferralDynamicLink();
    } catch (e) {
      print('Error pre-fetching referral link: $e');
    }
  }

  Future<void> _fetchProfileImage() async {
  try {
    // Make the GET request to fetch the profile image URL
    final response = await ApiService.getProfilePhoto(ProfileManager().getUserId()!);

    if (ApiService.isSuccessResponse(response)) {
      final responseBody = json.decode(response.body);

      // Check if responseBody contains the key 'profilePhotoUrl' and extract 'S' value
      if (responseBody != null && responseBody['profilePhotoUrl'] != null && responseBody['profilePhotoUrl']['S'] != null) {
        String imageUrl = responseBody['profilePhotoUrl']['S']; // Extract the profile image URL

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


  

  Future<List<Map<String, String>>> fetchLovedTracks() async {
  try {
    final response = await ApiService.getLovedTracks(ProfileManager().getUserId()!);

    if (ApiService.isSuccessResponse(response)) {
      // Decode the JSON response
      final jsonResponse = jsonDecode(response.body);

      // Check if the 'songDetails' key is present and has data
      if (jsonResponse.containsKey('songDetails')) {
        final List<dynamic> songDetails = jsonResponse['songDetails'];

        if (songDetails.isNotEmpty) {
          // Flatten the nested structure and map each song
          List<Map<String, String>> lovedTracks = [];

          for (var songArray in songDetails) {
            for (var song in songArray) {
              final artist = (song['stage_name']?['S']?.isNotEmpty == true)
                  ? song['stage_name']['S']
                  : (song['FullName']?['S'] ?? 'Unknown Artist');
              lovedTracks.add({
                'title': song['songName']?['S'] ?? 'Unknown Title',
                'artist': artist,
                'coverPage': song['coverPageUrl']['S']?? 'assets/logo.png', // Default cover page
                'song_id': song['song_id']['S'] ?? 'Unknown Song Id',
                'duration': song['span']['S'] ?? '0:00',
                 // Default duration, adjust if necessary
              });
            }
          }

          return lovedTracks;
        } else {
          // Return an empty list if no tracks are present
          return [];
        }
      } else {
        // Return an empty list if 'songDetails' is missing
        return [];
      }
    } else {
      throw Exception('Failed to load loved tracks');
    }
  } catch (error) {
    print('Error fetching loved tracks: $error');
    throw Exception('Failed to load loved tracks');
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

  Future<List<Map<String, String>>> fetchSongsByStatus(String status) async {
  try {
    final response = await ApiService.getAdminSongs(status);

    if (ApiService.isSuccessResponse(response)) {
      final jsonResponse = jsonDecode(response.body);
      List<Map<String, String>> songs = [];

      if (jsonResponse.containsKey('songDetails')) {
        final List<dynamic> songDetails = jsonResponse['songDetails'];

        for (var songArray in songDetails) {
          // Check if the songArray is not empty
          if (songArray.isNotEmpty) {
            for (var song in songArray) {
              final artist = (song['stage_name']?['S']?.isNotEmpty == true)
                  ? song['stage_name']['S']
                  : (song['FullName']?['S'] ?? 'Unknown Artist');
              songs.add({
                'title': song['songName']?['S'] ?? 'Unknown Title',
                'artist': artist,
                'workflowId': song['workflowId'] ?? 'Unknown WorkflowId',
                'coverPage': song['coverPageUrl']['S']?? 'assets/logo.png', // Default cover page
                'duration': '3:30', // Default duration
              });
            }
          }
        }
      }
      // Return songs list, empty if no songs are found
      return songs;
    } else {
      throw Exception('Failed to load songs');
    }
  } catch (error) {
    print('Error fetching songs: $error');
    // Return an empty list in case of an error
    return [];
  }
}


Future<List<Map<String, String>>> fetchHistoryTracks() async {
  try {
    final response = await ApiService.getUserHistory(ProfileManager().getUserId()!);

    if (ApiService.isSuccessResponse(response)) {
      final jsonResponse = jsonDecode(response.body);

      // Check if 'songDetails' is a list and contains valid song entries
      if (jsonResponse is Map<String, dynamic> && jsonResponse.containsKey('songDetails')) {
        final List<dynamic> songDetails = jsonResponse['songDetails'];
        List<Map<String, String>> historyTracks = [];

        for (var songArray in songDetails) {
          if (songArray is List) {
            for (var song in songArray) {
              if (song is Map<String, dynamic>) {
                final artist = (song['stage_name']?['S']?.isNotEmpty == true)
                    ? song['stage_name']['S']
                    : (song['FullName']?['S'] ?? 'Unknown Artist');
                historyTracks.add({
                  'title': song['songName']?['S'] ?? 'Unknown Title',
                  'song_id': song['song_id']['S'] ?? 'Unknown Song Id', // Extract 'S' value
                  
                  'artist': artist, // Extract 'S' value
                  'coverPage': song['coverPageUrl']['S']?? 'assets/logo.png', // Default cover page
                  'duration': song['span']?['S'] ?? '3:30',
                  'timestamp': song['current_date_time'] ?? '0:0' // Extract 'S' value
                  
                });
              }
            }
          }
        }

        // Sort the list based on 'timestamp' in decreasing order
        historyTracks.sort((a, b) {
          final dateTimeA = parseCustomDateTime(a['timestamp'] ?? '');
          final dateTimeB = parseCustomDateTime(b['timestamp'] ?? '');
          return dateTimeB.compareTo(dateTimeA); // Descending order
        });

        return historyTracks;
      } else {
        // Return empty list if 'songDetails' is not present or not as expected
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

// Helper function to parse 'yyyyMMdd_HHmmss' format to DateTime
DateTime parseCustomDateTime(String timestamp) {
  try {
    final year = int.parse(timestamp.substring(0, 4));
    final month = int.parse(timestamp.substring(4, 6));
    final day = int.parse(timestamp.substring(6, 8));
    final hour = int.parse(timestamp.substring(9, 11));
    final minute = int.parse(timestamp.substring(11, 13));
    final second = int.parse(timestamp.substring(13, 15));
    return DateTime(year, month, day, hour, minute, second);
  } catch (e) {
    // Return a default DateTime if parsing fails
    return DateTime(0);
  }
}


  @override
  Widget build(BuildContext context) {
    Widget content = GradientScaffold(
      //backgroundColor: Color(0xFF2d3444),
      appBar: AppBar(
      //backgroundColor: Color(0xFF2B2A29),
      backgroundColor: Colors.transparent,
        toolbarHeight: kToolbarHeight + 15,
        elevation: 0,
        automaticallyImplyLeading: false,
        // title: Image.asset(
        //   'assets/logo.png',
        //   height: 50,
        // ),
      ),
      body: Stack(
        children:[ SingleChildScrollView(
          controller: ScrollController(),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Column(
                    children: [
                      SizedBox(height: 0,),
                      Row(
                        children: [
                          Container(
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: Colors.white, // Border color
                                width: 4.0, // Border thickness
                              ),
                            ),
                            child: CircleAvatar(
                              radius: 40,
                              backgroundColor: Colors.grey,
                              child: ProfileManager().profileImageUrl != null
                                  ? ClipOval(
                                child: Image.network(
                                  ProfileManager().profileImageUrl!,
                                  fit: BoxFit.cover,
                                  width: 80,
                                  height: 80,
                                  errorBuilder: (context, error, stackTrace) {
                                    return Text(
                                      getInitials(ProfileManager().username.value),
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 40,
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
                                  fontSize: 40,
                                ),
                              ),
                            ),
                          ),
                          SizedBox(width: 20),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  ProfileManager().username.value ?? 'User',
                                  style: TextStyle(
                                    fontSize: 30,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                  softWrap: true,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                SizedBox(height: 4), // Add spacing between username and "View Profile"
                                InkWell(
                                  onTap: () async {
                                    await Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) => ProfileSettingsPage(
                                          userfullname: widget.userfullname,
                                          userId: widget.email,
                                          userCategory: widget.userCategory,
                                        ),
                                      ),
                                    );
                                  },
                                  borderRadius: BorderRadius.circular(4),
                                  splashColor: Colors.blueAccent.withOpacity(0.3),
                                  highlightColor: Colors.blue.withOpacity(0.2),
                                  child: Text(
                                    'View Profile',
                                    style: TextStyle(
                                      color: Colors.grey,
                                      fontSize: 16,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
        
                      SizedBox(height: 10),
        
                    ],
                  ),
                ),
                SizedBox(height: 40),
               Padding(
                 padding: const EdgeInsets.only(left: 20),
                 child: _buildProfileOption1("assets/final_smile_fill_new_new.png", 'Loved Tracks', () {
                   // Navigate to ListPage directly without pre-fetching the tracks
                   Navigator.push(
                     context,
                     MaterialPageRoute(
                       builder: (context) => ListPage(
                         navigationIndex: 3,
                         genreTitle: "Loved Tracks",
                         // bannerImage: 'assets/default_artist.jpg',
                         bannerImage: 'assets/default_artist_new.png',
                         email: widget.email,
                         image: "assets/final_smile_fill_new.png",
                         Category: widget.userCategory,
                         fullname: widget.userfullname,
                         showShuffleButton: false,
                         showOptionsMenu: false,
                         isLovedTracks: true, // Set this flag to true for loved tracks
                         originIndex: 3,
                       ),
                     ),
                   );
                 }),
               ),
        
        
                SizedBox(height: 20),
                Padding(
                  padding: const EdgeInsets.only(left: 20),
                  child: _buildProfileOption1("assets/history.png", 'History', () {
                    // Navigate to ListPage directly without pre-fetching the history tracks
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => ListPage(
                          navigationIndex: 3,
                          genreTitle: "History",
                          bannerImage: 'assets/default_artist_new.png',
                          email: widget.email,
                          Category: widget.userCategory,
                          fullname: widget.userfullname,
                          image: "assets/history.png",
                          showShuffleButton: false,
                          showOptionsMenu: false,
                          isHistory: true, // Set this flag to true for history tracks
                          originIndex: 3,
                        ),
                      ),
                    );
                  }),
                ),
        
                SizedBox(height: 20),
                Padding(
                  padding: const EdgeInsets.only(left:20),
                  child: _buildProfileOption1("assets/Playlist.png", 'Playlists', () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                          builder: (context) => PlaylistsPage(
                                userId: widget.email,
                                category:widget.userCategory,
                                userfullname:widget.userfullname
                              )),
                    );
                  }),
                ),
        
        
                // Conditionally display "Your Uploads" and "Analytics" based on the user category
                if (widget.userCategory != 'Listener') ...[
                  SizedBox(height: 20),
                  Padding(
                    padding: const EdgeInsets.only(left: 20),
                    child: _buildProfileOption1("assets/upload_new.png", 'Your Uploads', () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => AdminSongList(userId: widget.email,userfullname:widget.userfullname)),
                      );
                    }),
                  ),
                  SizedBox(height: 20),
                  Padding(
                    padding: const EdgeInsets.only(left: 20),
                    child: _buildProfileOption1("assets/analytics.png", 'Analytics', () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => ApprovedSongList(userId: widget.email,userfullname: widget.userfullname)),
                      );
                    }),
                  ),
                ],
                SizedBox(
                  height: 20,
                ),
                 // Inside ProfilePage
          Padding(
            padding: const EdgeInsets.only(left:20),
            child: _buildStaticReferOption("assets/refer.png", 'Refer', () {
                    _shareReferralLink(); // Trigger the share functionality
                  }),
          ),
        
        
                SizedBox(height: 20,),
                 Padding(
                   padding: const EdgeInsets.only(left: 20),
                   child: _buildProfileOption1("assets/feedback.png", 'Feedback', () {
                    // Navigate to the FeedbackPage
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => FeedbackPage(userfullname: widget.userfullname,
                          userEmail: widget.email,
                          userCategory: widget.userCategory,),
                      ),
                    );
                                 }),
                 ),
        
                 SizedBox(height: 80,),
        
              ],
            ),
          ),
        ),
          LoadingScreen(
            isLoading: false,
            isNoInternet: _isNoInternet,
            onRetry: _checkConnectivity,
          ),
    ]
      ),

    );
    // Replace the current if-else block with this:
    if (widget.isFromNewHomePage) {
      // When coming from NewHomePage, just return the content without adding NowPlayingTile
      // since it's already being added in NewHomePage's layout
      return content;
    } else {
      // When not from NewHomePage, use PageWithBottomNav with nowPlayingTile
      return PageWithBottomNav(
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
        currentIndex: widget.userCategory == 'Singer' ? 3 : 2,
        isFromNewHomePage: false,
      );
    }









  }

  // Helper method to build profile options


  Future<void> _shareReferralLink() async {
    try {
      if (_isGeneratingLink) return; // Prevent multiple simultaneous generations
      _isGeneratingLink = true;

      // Use cached link if available
      String linkToShare = _cachedReferralLink ?? await _createReferralDynamicLink();
      _cachedReferralLink = linkToShare; // Cache the link for future use

      final shareMessage = 'Hey, check out the amazing VOIZ music app! Just download the app, listen and enjoy! $linkToShare';
      await Share.share(shareMessage, subject: 'Referral to Voiz App');
    } catch (e) {
      print('Error sharing referral link: $e');
    } finally {
      _isGeneratingLink = false;
    }
  }

  // Optimized dynamic link creation
  Future<String> _createReferralDynamicLink() async {
    final parameters = DynamicLinkParameters(
      uriPrefix: 'https://voiznewapp.page.link',
      link: Uri.parse('https://voiznewapp.page.link/refer'),
      androidParameters: AndroidParameters(
        packageName: 'com.voizapp.voiceapp',
        minimumVersion: 1,
      ),
      iosParameters: IOSParameters(
        bundleId: 'com.voizapp.voiceapp',
        minimumVersion: '1.0.0',
      ),
      socialMetaTagParameters: SocialMetaTagParameters(
        title: 'Invite your friends to Voiz App!',
        description: 'Download Voiz App now and enjoy amazing features!',
        imageUrl: Uri.parse('https://voiz-webui-documents.s3.ap-south-1.amazonaws.com/voiz.png'),
      ),
    );

    try {
      final shortLink = await FirebaseDynamicLinks.instance.buildShortLink(parameters);
      return shortLink.shortUrl.toString();
    } catch (e) {
      print('Error generating dynamic link: $e');
      // Fallback to a static link if dynamic link generation fails
      return 'https://voiznewapp.page.link/refer';
    }
  }

// Helper method to build the "Refer" option




   Widget _buildProfileOption(IconData icon, String title, VoidCallback onTap) {
  return InkWell(
    onTap: onTap,
    borderRadius: BorderRadius.circular(10), // Rounded corners for effect
    splashColor: Colors.grey.shade500.withOpacity(0.8), // Ripple effect color
    highlightColor: Colors.grey.shade500.withOpacity(0.8), // Highlight color when tapped
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 0, horizontal: 0), // Padding for row
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(10), // Rounded corners
      ),
      child: Row(
        children: [
          Icon(icon, color: Colors.white, size: 30),
          SizedBox(width: 20),
          Text(
            title,
            style: TextStyle(
              fontSize: 24,
              color: Colors.white,
            ),
          ),
        ],
      ),
    ),
  );
}

// Helper method to build profile options with image icon and ripple effect
Widget _buildProfileOption1(String imagePath, String title, VoidCallback onTap) {
  return GestureDetector( // change InkWell to GestureDetector to remove the highlight color
    onTap: onTap,
    behavior: HitTestBehavior.opaque,
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 0, horizontal: 0),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Image.asset(
            imagePath,
            width: 30,
            //height: 33,
            fit: BoxFit.cover,
          ),
          SizedBox(width: 20),
          Text(
            title,
            style: TextStyle(
              fontSize: 24,
              color: Colors.white,
            ),
          ),
        ],
      ),
    ),
  );
}

// Helper method for the "Refer" option with an image icon and tap feedback
Widget _buildStaticReferOption(String imagePath, String title, VoidCallback onTap) {
  return GestureDetector( // change InkWell to GestureDetector to remove the highlight color
    onTap: onTap,
    behavior: HitTestBehavior.opaque,
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 0, horizontal: 0),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Image.asset(
            imagePath,
            width: 30,
            //height: 30,
            fit: BoxFit.cover,
          ),
          SizedBox(width: 20),
          Text(
            title,
            style: TextStyle(
              fontSize: 24,
              color: Colors.white,
            ),
          ),
        ],
      ),
    ),
  );
}
}
