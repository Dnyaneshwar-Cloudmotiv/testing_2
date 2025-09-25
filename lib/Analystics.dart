// Analystics.dart

import 'package:flutter/material.dart';
import 'package:voiceapp/main.dart';

import 'package:voiceapp/profile_manager.dart';
import 'package:voiceapp/services/api_service.dart';

import 'bottomnavigationbar.dart';
import 'package:voiceapp/connectivity_service.dart';
import 'package:voiceapp/loading_screen.dart';

class AnalyticsPage extends StatefulWidget {
  final String songName;
  final String artistName;
  final String userfullname;
  final String coverImage;
  final String songId;


  // Constructor to accept the dynamic data
  AnalyticsPage({
    required this.songName,
    required this.artistName,
    required this.userfullname,
    required this.coverImage,
    required this.songId,
  });

  @override
  _AnalyticsPageState createState() => _AnalyticsPageState();
}

class _AnalyticsPageState extends State<AnalyticsPage> {
  int favoriteCount = 0;
  int reactionCount = 0;
  int playCount = 0;
  int shareSongCount=0;
  int playlistCount=0;
   bool _mounted = true;
  bool _isLoading = true;
  String? _error;
  bool _isNoInternet = false;
  late ConnectivityService _connectivityService;

  @override
  void initState() {
    super.initState();
    _connectivityService = ConnectivityService();
    _setupConnectivityListener();
    _fetchAnalyticsData();
  }

  void _setupConnectivityListener() {
    _connectivityService.connectionStream.listen((hasConnection) {
      if (!_mounted || _connectivityService.isClosed) return;

      setState(() {
        _isNoInternet = !hasConnection;
      });

      if (hasConnection && _isNoInternet) {
        _fetchAnalyticsData();
      }
    });
  }

  Future<void> _checkConnectivity() async {
    await _connectivityService.checkConnection();

    setState(() {
      _isNoInternet = !_connectivityService.hasConnection;
    });

    if (_connectivityService.hasConnection) {
      _fetchAnalyticsData();
    }
  }

  @override
  void dispose() {
    _mounted = false;
    _connectivityService.dispose();
    super.dispose();
  }

    void _safeSetState(VoidCallback fn) {
    if (_mounted && mounted) {
      setState(fn);
    }
  }

  /// Fetches analytics data using the centralized API service
  /// Handles all error cases and loading states properly
  Future<void> _fetchAnalyticsData() async {
    if (!mounted) return;

    try {
      // Use centralized API service for consistent error handling and logging
      final response = await ApiService.getSongCounts(widget.songId);

      if (!mounted) return;

      if (ApiService.isSuccessResponse(response)) {
        final data = ApiService.parseJsonResponse(response);
        
        if (data != null) {
          _safeSetState(() {
            favoriteCount = data['favoriteCount'] ?? 0;
            reactionCount = data['reactionCount'] ?? 0;
            playCount = int.tryParse(data['playCount']?.toString() ?? '0') ?? 0;
            playlistCount = int.tryParse(data['playlistCount']?.toString() ?? '0') ?? 0;
            shareSongCount = int.tryParse(data['shareSongCount']?.toString() ?? '0') ?? 0;
            _isLoading = false;
            _error = null;
          });
        } else {
          _handleApiError('Failed to parse analytics data');
        }
      } else {
        _handleApiError(ApiService.getErrorMessage(response));
      }
    } catch (e) {
      if (!mounted) return;
      _handleApiError('Error loading analytics: ${e.toString()}');
    }
  }

  /// Centralized error handling for API failures
  void _handleApiError(String errorMessage) {
    _safeSetState(() {
      _error = errorMessage;
      _isLoading = false;
    });

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to load analytics data'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    Widget content = GradientScaffold(
      appBar: AppBar(
        titleSpacing: 0,
         leading: IconButton(
          icon: Icon(Icons.arrow_back_ios, color: Colors.white),
          onPressed: () {
            Navigator.pop(context); // Go back to the previous page
          },
        ),
        automaticallyImplyLeading: false,
        // title: Image.asset(
        //   'assets/logo.png',
        //   height: 50,
        // ),
        backgroundColor: Colors.transparent,
      ),
      body: Padding(
        padding: const EdgeInsets.fromLTRB(8, 8, 8, 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
             Container(
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(
            color: Colors.white, // Border color
            width: 4.0, // Border thickness
          ),
        ),
        child:
            // Profile Image (Initials with Grey background)
            CircleAvatar(
                          radius: 50,
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
                        ),),
            SizedBox(height: 10),
            Text(
              'Analytics',
              style: TextStyle(
                color: Colors.white,
                fontSize: 28,
                fontWeight: FontWeight.w600,
                  fontFamily: 'Poppins'
                //fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 20),
            // Song Information Section (Without card)
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(10),
                  child: Container(
                    height: 74,
                    width: 110,
                    color: Colors.black, // Background color for empty space
                    child: Align(
                      child: Image.network(
                        widget.coverImage,
                        height: 75,
                        width: 110,
                        fit: BoxFit.fitWidth, // Scale image to match width while maintaining aspect ratio
                        alignment: Alignment(0, -0.6), // Center the image
                        errorBuilder: (context, error, stackTrace) {
                          return Image.asset(
                            'assets/mic.jpg',
                            height: 75,
                            width: 110,
                            fit: BoxFit.fitWidth,
                          );
                        },
                      ),
                    ),
                  ),
                ),

                SizedBox(width: 30),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.songName,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize:18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      widget.artistName,
                      style: TextStyle(
                        color: Colors.grey,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            // Stats Section
          Expanded(
  child: SingleChildScrollView(
    child: Column(
      children: [
        // GridView for the first four items
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true, // Ensures the GridView takes only the necessary height
          physics: NeverScrollableScrollPhysics(), // Disable GridView's internal scroll
          padding: EdgeInsets.symmetric(horizontal: 15, vertical: 15),
          crossAxisSpacing: 20, // Horizontal spacing
          mainAxisSpacing: 20, // Vertical spacing
          children: [
            Center(
              child: _buildStatItem(
                title: '${playCount}',
                subtitle: 'Streams',
              ),
            ),
            Center(
              // child: _buildStatItem(
              //   title: '${playlistCount}',
              //   subtitle: 'Added to Playlists',
              // ),
              child: _buildStatItem(
                title: '${shareSongCount}',
                subtitle: 'Shares',
                // imagePath: 'assets/Share.png',
              ),
            ),
            Center(
              child: _buildStatItem(
                title: '${reactionCount}',
                subtitle: '',
                imagePath: 'assets/reaction_empty.png',
              ),
            ),
            Center(
              child: _buildStatItem(
                title: '${favoriteCount}',
                subtitle: '',
                imagePath: 'assets/final_smile_fill_new.png',
              ),
            ),

          ],
        ),
        // Centered "Shares" item below the grid
        Padding(
          padding: const EdgeInsets.only(top: 20), // Vertical space
          child: Center(
            child: _buildStatItem(
              title: '${playlistCount}',
              subtitle: 'Added to Playlists',
            ),
            // child: _buildStatItem(
            //   title: '${shareSongCount}',
            //   subtitle: 'Shares',
            //   imagePath: 'assets/Share.png',
            // ),
          ),
        ),
      ],
    ),
  ),
),

          ],
        ),
      ),
    );

    return Stack(
      children: [
        PageWithBottomNav(
          child: content,
          email: ProfileManager().getUserId()!,
          fullName: widget.userfullname,
          category: "Singer",
          currentIndex: 3,
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

  // Helper method to build each stat item (with optional image)
  // Widget _buildStatItem({
  //   required String title,
  //   required String subtitle,
  //   String? imagePath, // Optional image path
  // }) {
  //   String numberPart = title.replaceAll(' +', '');
  //   return Column(
  //     mainAxisAlignment: MainAxisAlignment.center,
  //     children: [
  //       Text(
  //         title,
  //         style: TextStyle(
  //           color: Colors.white,
  //           fontSize: 28,
  //           fontWeight: FontWeight.bold,
  //         ),
  //       ),
  //       //SizedBox(height: 5),
  //       Row(
  //         mainAxisAlignment: MainAxisAlignment.center,
  //         children: [
  //           Text(
  //             subtitle,
  //             style: TextStyle(
  //               color: Colors.white,
  //               fontSize: 18,
  //             ),
  //           ),
  //           SizedBox(width: 5),
  //           if (imagePath != null)
  //             Image.asset(
  //               imagePath,
  //               width: 38,
  //               height: 38,
  //             ),
  //         ],
  //       ),
  //     ],
  //   );
  // }
  Widget _buildStatItem({
    required String title,
    required String subtitle,
    String? imagePath,
  }) {
    // Only apply special formatting for items that end with " +"
    if (title.endsWith(' +')) {
      String numberPart = title.replaceAll(' +', '');

      // Check if this is a stream or share count
      bool isStreamOrShare = title.contains('${playCount}') ||
          title.contains('${shareSongCount}');

      // Apply bold weight for + sign on stream and share counts, normal weight for others
      FontWeight plusWeight = isStreamOrShare ? FontWeight.bold : FontWeight.normal;

      return Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                numberPart,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                ' +',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 28,
                  fontWeight: plusWeight, // Different weight based on count type
                ),
              ),
            ],
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                subtitle,
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                ),
              ),
              SizedBox(width: 5),
              if (imagePath != null)
                Image.asset(
                  imagePath,
                  width: 38,
                  height: 38,
                ),
            ],
          ),
        ],
      );
    }

    // Keep original layout for all other items
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          title,
          style: TextStyle(
            color: Colors.white,
            fontSize: 28,
            fontWeight: FontWeight.bold,
          ),
        ),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              subtitle,
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
              ),
            ),
            SizedBox(width: 5),
            if (imagePath != null)
              Image.asset(
                imagePath,
                width: 38,
                height: 38,
              ),
          ],
        ),
      ],
    );
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
}
