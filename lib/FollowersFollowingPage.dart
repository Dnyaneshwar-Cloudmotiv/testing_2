// FollowersFollowingPage.dart
import 'dart:convert';
import 'package:firebase_dynamic_links/firebase_dynamic_links.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:share_plus/share_plus.dart';
import 'package:voiceapp/main.dart';

import 'bottomnavigationbar.dart';
import 'package:voiceapp/connectivity_service.dart';
import 'package:voiceapp/loading_screen.dart';
import 'services/api_service.dart';

class FollowersFollowingPage extends StatefulWidget {
  final String artistId;
  final String artistName;
  final String? profileImageUrl;
  final String? coverImageUrl;
  final String userId;
  final String category;
  final String userfullname;

  FollowersFollowingPage({
    required this.artistId,
    required this.artistName,
    this.profileImageUrl,
    this.coverImageUrl,
    required this.userfullname,
    required this.category,
    required this.userId
  });

  @override
  _FollowersFollowingPageState createState() => _FollowersFollowingPageState();
}

class _FollowersFollowingPageState extends State<FollowersFollowingPage> {
  List<Map<String, String>> _followers = [];
  List<Map<String, String>> _following = [];
  bool _isLoading = true;
  String? _dynamicLink; // Pre-generated dynamic link for sharing
  bool _isGeneratingLink = true;
  bool _isNoInternet = false;
  late ConnectivityService _connectivityService;
  bool _mounted = true;
  int _followersCount = 0;
  int _followingCount = 0;

  @override
  void initState() {
    super.initState();
    _mounted = true;
    _connectivityService = ConnectivityService();
    _setupConnectivityListener();
    // _fetchFollowersAndFollowing();
    _generateDynamicLink();
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
      // Call all data fetching methods here
      _generateDynamicLink();
      await Future.wait([
        _fetchFollowersAndFollowing(),
        _fetchFollowingCount(),
        _fetchFollowersCount(),
      ]);

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

  Future<void> _fetchFollowersAndFollowing() async {
    await Future.wait([
      _fetchFollowers(),
      _fetchFollowing(),
    ]);
    setState(() {
      _isLoading = false;
    });
  }

  Future<void> _fetchFollowingCount() async {
    try {
      final response = await ApiService.getFollowingCount(widget.artistId);

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = json.decode(response.body);

        if (data.containsKey('count')) {
          setState(() {
            _followingCount = data['count'] ?? 0;
          });
        } else {
          print("Error: 'count' field not found in response.");
        }
      } else {
        print("Failed to fetch following count. Status code: ${response.statusCode}");
      }
    } catch (e) {
      print("Error fetching following count: $e");
    }
  }

  Future<void> _fetchFollowersCount() async {
    try {
      final response = await ApiService.getFollowersCount(widget.artistId);

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = json.decode(response.body);

        if (data.containsKey('count')) {
          setState(() {
            _followersCount = data['count'] ?? 0;
          });
        } else {
          print("Error: 'count' field not found in response.");
        }
      } else {
        print("Failed to fetch followers count. Status code: ${response.statusCode}");
      }
    } catch (e) {
      print("Error fetching followers count: $e");
    }
  }

  String getInitials(String fullName) {
    fullName = fullName.trim();
    if (fullName.isEmpty) return "";
    List<String> nameParts = fullName.split(RegExp(r'\s+'));
    return nameParts.length == 1
        ? nameParts[0][0].toUpperCase()
        : nameParts[0][0].toUpperCase() + nameParts[1][0].toUpperCase();
  }

  Future<void> _fetchFollowers() async {
    // Clear existing data first
    _followers.clear();

    try {
      final response = await ApiService.getFollowersList(widget.artistId);

      if (response.statusCode == 200) {
        // Decode the JSON response as a List<dynamic>
        final List<dynamic> followersList = json.decode(response.body);

        for (var follower in followersList) {
          if (follower is Map<String, dynamic> &&
              follower.isNotEmpty &&
              follower['FullName'] != null &&
              follower['FullName'].toString().trim().isNotEmpty) {

            String userId = follower['user_id']?.toString() ?? '';

            // Use StageName if present, otherwise fallback to FullName
            String name = (follower['StageName'] != null && follower['StageName'].isNotEmpty)
                ? follower['StageName']
                : (follower['FullName'] ?? 'Unknown');

            String? profileImageUrl = await _fetchProfileImage(userId);

            _followers.add({
              'userId': userId,
              'name': name,
              'profileImageUrl': profileImageUrl ?? '',
            });
          }
        }
        setState(() {});  // Update the UI after fetching data
      } else {
        print("Failed to fetch followers list. Status code: ${response.statusCode}");
      }
    } catch (e) {
      print("Error fetching followers list: $e");
    }
  }

  Future<void> _fetchFollowing() async {
    // Clear existing data first
    _following.clear();

    try {
      final response = await ApiService.getFollowingList(widget.artistId);

      if (response.statusCode == 200) {
        // Decode the JSON response as a List<dynamic> directly
        final List<dynamic> followingList = json.decode(response.body);

        for (var user in followingList) {
          if (user is Map<String, dynamic> &&
              user.isNotEmpty &&
              user['FullName'] != null &&
              user['FullName'].toString().trim().isNotEmpty) {

            String userId = user['user_id']?.toString() ?? '';

            // Use StageName if present, otherwise fallback to FullName
            String name = (user['StageName'] != null && user['StageName'].isNotEmpty)
                ? user['StageName']
                : (user['FullName'] ?? 'Unknown');

            String? profileImageUrl = await _fetchProfileImage(userId);

            _following.add({
              'userId': userId,
              'name': name,
              'profileImageUrl': profileImageUrl ?? '',
            });
          }
        }
        setState(() {});  // Update the UI after fetching data
      } else {
        print("Failed to fetch following list. Status code: ${response.statusCode}");
      }
    } catch (e) {
      print("Error fetching following list: $e");
    }
  }

  Future<String?> _fetchProfileImage(String userId) async {
    try {
      final response = await ApiService.getUserProfilePhoto(userId);

      if (response.statusCode == 200) {
        final responseBody = json.decode(response.body);
        return responseBody['profilePhotoUrl']?['S'];
      } else {
        print('Failed to fetch profile image for userId: $userId.');
        return null;
      }
    } catch (e) {
      print('Error fetching profile image for userId: $userId. Error: $e');
      return null;
    }
  }

  Future<void> _generateDynamicLink() async {
    try {
      final dynamicLink = await createDynamicLink(widget.artistId);
      setState(() {
        _dynamicLink = dynamicLink;
        _isGeneratingLink = false; // Link generation completed
      });
    } catch (e) {
      print("Error generating dynamic link: $e");
      setState(() {
        _isGeneratingLink = false;
      });
    }
  }

  Future<String> createDynamicLink(String artistId) async {
    final DynamicLinkParameters parameters = DynamicLinkParameters(
      uriPrefix: 'https://voiznewapp.page.link',
      link: Uri.parse('https://voiznewapp.page.link/artistprofile?artistId=$artistId'),
      androidParameters: AndroidParameters(
        packageName: 'com.voizapp.voiceapp',
        minimumVersion: 0,
      ),
      iosParameters: IOSParameters(
        bundleId: 'com.voizapp.voiceapp',
        minimumVersion: '0',
      ),
      socialMetaTagParameters: SocialMetaTagParameters(
        title: 'Check out this artist!',
        description: 'Listen to amazing music by ${widget.artistName}',
        imageUrl: Uri.parse(widget.coverImageUrl ?? ''),
      ),
    );

    final ShortDynamicLink shortLink =
    await FirebaseDynamicLinks.instance.buildShortLink(parameters);
    return shortLink.shortUrl.toString();
  }

  // Handle sharing functionality
  void _shareArtistPage() {
    if (_isGeneratingLink) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Generating share link, please wait...')),
      );
    } else if (_dynamicLink != null) {
      //Share.share('Hey, see who I found ! Listen to the amazing song 😍 by ${widget.artistName} on VOIZ ! Just download the app, listen and enjoy! $_dynamicLink');
      Share.share('Hey, see who I found ! Listen to the amazing song by ${widget.artistName} on VOIZ ! Just download the app, listen and enjoy! $_dynamicLink 😍');
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to generate shareable link')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    Widget content = Theme(
        data: Theme.of(context).copyWith(
          tabBarTheme: TabBarThemeData(
            dividerColor: Colors.transparent, // Removes any divider line under the TabBar
          ),
        ),
        child: GradientScaffold(
          //backgroundColor: Colors.blueGrey[900],
          body: Column(
            children: [
              // Display the header at the top
              ArtistHeader(
                artistName: widget.artistName,
                coverImageUrl: widget.coverImageUrl,
                profileImageUrl: widget.profileImageUrl,
                onShare: _shareArtistPage,
              ),
              SizedBox(height: 30),

              Row(
                children: [
                  SizedBox(height: 60,),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(left: 60),
                      child: Center(
                        child: Text(
                          textAlign: TextAlign.center,
                          widget.artistName,
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ),
                  IconButton(
                    icon: Image.asset(
                      'assets/Share.png', // Replace with your image asset path
                      height: 35,             // Adjust size as needed
                      width: 35,              // Adjust size as needed
                    ),
                    onPressed: _shareArtistPage,
                  ),
                ],
              ),
// Loader or content display
              Expanded(
                  child: _isLoading
                      ? Center(child: CircularProgressIndicator())
                      : DefaultTabController(
                    length: 2,
                    child: Column(
                      children: [
                        // Wrapping TabBar in a Container to control its styling
                        Container(
                          color: Colors.transparent, // Match background color to blend in
                          child: TabBar(
                            labelStyle: TextStyle(fontSize: 20, // Increase font size for the selected tab
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                            unselectedLabelStyle: TextStyle(
                              fontSize: 20, // Increase font size for unselected tabs
                              fontWeight: FontWeight.bold,
                              color: Colors.white70,
                            ),
                            indicatorColor: Colors.transparent, // Remove the full-width underline
                            indicator: BoxDecoration(
                              border: Border(
                                bottom: BorderSide(
                                  color: Colors.white, // Selected tab indicator line color
                                  width: 2,
                                ),
                              ),
                            ),
                            indicatorSize: TabBarIndicatorSize.label, // Restrict indicator size to the label width
                            indicatorPadding: EdgeInsets.symmetric(horizontal: -12),
                            tabs: [
                              Tab(text: 'Followers (${_followersCount})'),
                              Tab(text: 'Following (${_followingCount})'),
                            ],
                          ),
                        ),
                        Expanded(
                          child: TabBarView(
                            children: [
                              _buildCenteredListView(_followers),
                              _buildCenteredListView(_following),
                            ],
                          ),
                        ),
                      ],
                    ),
                  )

              ),
            ],
          ),
        ));

    return Stack(
      children: [
        PageWithBottomNav(
          child: content,
          email: widget.userId,
          fullName: widget.userfullname,
          category: widget.category,
          currentIndex: 1,
          isFromNewHomePage: false,
        ),
        LoadingScreen(
          isLoading: _isLoading,
          isNoInternet: _isNoInternet,
          onRetry: _checkConnectivity,
        ),
      ],
    );
  }

  Widget _buildCenteredListView(List<Map<String, String>> list) {
    return Center(
      child: Container(
        width: 300,
        child: ListView.separated(
          itemCount: list.length,
          separatorBuilder: (context, index) => SizedBox(height: 15), // Gap between items
          itemBuilder: (context, index) {
            final user = list[index];
            //final user = list[index];
            final profileImageUrl = user['profileImageUrl'] ?? '';
            final name = user['name'] ?? 'Unknown';
            return ListTile(
              leading: CircleAvatar(
                radius: 25, // Increased size
                backgroundColor: Colors.grey, // Background color for initials
                backgroundImage: profileImageUrl.isNotEmpty
                    ? NetworkImage(profileImageUrl)
                    : null, // Remove backgroundImage if no profile image
                child: profileImageUrl.isEmpty
                    ? Text(
                  getInitials(name),
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                )
                    : null, // No child if profile image is present
              ),
              title: Text(
                user['name'] ?? 'Unknown',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 14,
                ),
              ),
            );
          },
        ),
      ),
    );
  }

}

// Artist Header Widget
class ArtistHeader extends StatelessWidget {
  final String artistName;
  final String? profileImageUrl;
  final String? coverImageUrl;
  final VoidCallback onShare;

  ArtistHeader({
    required this.artistName,
    this.profileImageUrl,
    this.coverImageUrl,
    required this.onShare,
  });

  String getInitials(String fullName) {
    fullName = fullName.trim();
    if (fullName.isEmpty) return "";
    List<String> nameParts = fullName.split(RegExp(r'\s+'));
    return nameParts.length == 1
        ? nameParts[0][0].toUpperCase()
        : nameParts[0][0].toUpperCase() + nameParts[1][0].toUpperCase();
  }

  void _shareArtistPage(BuildContext context) {
    final artistShareText = 'Check out $artistName on VoizApp';
    Share.share(artistShareText);
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.center,
      clipBehavior: Clip.none,
      children: [
        Container(
          height: 250,
          width: double.infinity,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.only(
              bottomLeft: Radius.circular(30),
              bottomRight: Radius.circular(30),
            ),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.only(
              bottomLeft: Radius.circular(30),
              bottomRight: Radius.circular(30),
            ),
            child: coverImageUrl != null
                ? Image.network(
              coverImageUrl!,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) {
                return Image.asset('assets/default.jpg', fit: BoxFit.cover);
              },
            )
                : Image.asset('assets/default.jpg', fit: BoxFit.cover),
          ),
        ),
        Positioned(
          bottom: -40,
          child: Container(
            padding: EdgeInsets.all(3), // Space for the border
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white, // Border color
            ),
            child: CircleAvatar(
              radius: 40,
              backgroundColor: Colors.grey,
              child: profileImageUrl != null
                  ? ClipOval(
                child: FadeInImage.assetNetwork(
                  placeholder: 'assets/mic.jpg',
                  image: profileImageUrl!,
                  fit: BoxFit.cover,
                  width: 90,
                  height: 90,
                  imageErrorBuilder: (context, error, stackTrace) {
                    return Center(
                      child: Text(
                        getInitials(artistName),
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 40,
                        ),
                      ),
                    );
                  },
                ),
              )
                  : Center(
                child: Text(
                  getInitials(artistName),
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 40,
                  ),
                ),
              ),
            ),
          ),
        ),

      ],
    );
  }
}