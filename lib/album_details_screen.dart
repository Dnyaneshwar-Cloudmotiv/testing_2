// album_details_screen.dart
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:voiceapp/Analystics.dart';
import 'package:voiceapp/Rejected_reason.dart';
import 'package:voiceapp/bottomnavigationbar.dart';
import 'package:voiceapp/loading_screen.dart';
import 'package:voiceapp/profile_manager.dart';
import 'package:voiceapp/adminlistsong.dart'; // Import the Album and AlbumSong models
import 'package:voiceapp/services/api_service.dart';
import 'Song Upload/song_upload_screen_multiplesong.dart';
import 'Song Upload/upload_multiple_songs.dart';
import 'main.dart'; // Assuming GradientScaffold and other common widgets are here

/// API Service class for fetching album data.
class AlbumApiService {
  /// Fetches all user albums for a given userId.
  /// Returns a list of Album objects.
  static Future<List<Album>> fetchUserAlbums(String userId) async {
    try {
      final response = await ApiService.getUserAlbums(userId);

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = json.decode(response.body);
        if (data.containsKey('albums') && data['albums'] != null) {
          final List<dynamic> albumsData = data['albums'] as List<dynamic>;
          return albumsData.map((albumJson) => Album.fromJson(albumJson as Map<String, dynamic>)).toList();
        } else {
          return []; // No albums found
        }
      } else {
        throw Exception('Failed to load albums: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error or data parsing error: $e');
    }
  }
}

/// Dummy screen for "Add New Upload".
class SongUploadScreen extends StatelessWidget {
  final String userId;
  final String userfullname;
  final String? albumId;


  const SongUploadScreen({
    Key? key,
    required this.userId,
    required this.userfullname,
    this.albumId,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(albumId != null ? 'Upload to Album' : 'Upload New Song'),
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              albumId != null
                  ? 'Placeholder: Upload song to album ID: $albumId'
                  : 'Placeholder: Upload new song',
              style: TextStyle(color: Colors.white, fontSize: 18),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 20),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
              },
              child: Text('Go Back'),
            ),
          ],
        ),
      ),
      backgroundColor: Color(0xFF151415),
    );
  }
}

/// Screen to display the details of a single album, including its songs.
class AlbumDetailsScreen extends StatefulWidget {
  final Album album; // Now uses the Album model from adminlistsong.dart
  // Removed allSongs as AlbumSong now contains all necessary info
  final String userId;
  final String userfullname;

  const AlbumDetailsScreen({
    Key? key,
    required this.album,
    required this.userId,
    required this.userfullname,
    // allSongs parameter is kept for compatibility as it's passed from adminlistsong.dart,
    // though AlbumSong now contains all necessary info.
    required List<Song> allSongs,
  }) : super(key: key);

  @override
  State<AlbumDetailsScreen> createState() => _AlbumDetailsScreenState();
}

class _AlbumDetailsScreenState extends State<AlbumDetailsScreen> {
  bool _isLoading = false;
  bool _isNoInternet = false;
  Album? _albumData; // Stores the fully loaded album data
  List<AlbumSong> _albumSongs = []; // Stores the songs within the album

  @override
  void initState() {
    super.initState();
    _loadAlbumDetails(); // Load album details when the screen initializes
  }

  /// Safely updates the state if the widget is mounted.
  void _safeSetState(VoidCallback fn) {
    if (mounted) {
      setState(fn);
    }
  }

  /// Fetches and updates the details for the current album.
  Future<void> _loadAlbumDetails() async {
    _safeSetState(() {
      _isLoading = true;
      _isNoInternet = false;
    });

    try {
      // Fetch all user albums
      final String? userId = ProfileManager().getUserId();
      if (userId == null) {
        if (mounted) {
          _safeSetState(() {
            _isLoading = false;
          });
        }
        return;
      }
      final List<Album> allAlbums = await AlbumApiService.fetchUserAlbums(userId);

      // Find the specific album that matches the one passed to this screen
      final Album? foundAlbum = allAlbums.firstWhere(
            (album) => album.albumId == widget.album.albumId,
        orElse: () => null!, // Use null here, then handle it after .firstWhere
      );

      _safeSetState(() {
        if (foundAlbum != null) {
          _albumData = foundAlbum;
          _albumSongs = foundAlbum.songs;

          // ✅ Date nusar sorting (latest song top la disel)
          _albumSongs.sort((a, b) {
            try {
              DateTime dateA = DateTime.parse(a.createdTimestamp.replaceAll('_', 'T'));
              DateTime dateB = DateTime.parse(b.createdTimestamp.replaceAll('_', 'T'));
              return dateB.compareTo(dateA); // descending order (latest first)
            } catch (e) {
              print('Error parsing date: $e');
              return 0;
            }
          });

        } else {
          _albumData = widget.album;
          _albumSongs = widget.album.songs;

          // ✅ Fallback sathi pan sorting apply kara
          _albumSongs.sort((a, b) {
            try {
              DateTime dateA = DateTime.parse(a.createdTimestamp.replaceAll('_', 'T'));
              DateTime dateB = DateTime.parse(b.createdTimestamp.replaceAll('_', 'T'));
              return dateB.compareTo(dateA);
            } catch (e) {
              print('Error parsing date: $e');
              return 0;
            }
          });

          print('Album with ID ${widget.album.albumId} not found after refresh.');
        }
        _isLoading = false;
      });

    } catch (e) {
      print('Error loading album details: $e');
      _safeSetState(() {
        _isLoading = false;
        _isNoInternet = true; // Set no internet flag on network error
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    Widget content = GradientScaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false, // Allows custom leading widget
        titleSpacing: 0,
        title: Row(
          children: [
            IconButton(
              icon: Icon(Icons.arrow_back_ios, color: Colors.white),
              onPressed: () {
                Navigator.pop(context); // Navigate back
              },
            ),
            Expanded(
              child: Text(
                _albumData?.albumName ?? widget.album.albumName, // Display album name
                style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                overflow: TextOverflow.ellipsis, // Handle long names
              ),
            ),
          ],
        ),
        backgroundColor: Colors.transparent, // Transparent AppBar
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator()) // Show loading indicator
          : Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Album Header (Cover and Name)
            Center(
              child: Column(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(16.0),
                    child: Image.network(
                      _albumData?.albumCoverUrl ?? widget.album.albumCoverUrl,
                      height: 200,
                      width: 200,
                      fit: BoxFit.cover,
                      // Loading builder for image display
                      loadingBuilder: (context, child, loadingProgress) {
                        if (loadingProgress == null) return child;
                        return Container(
                          height: 200,
                          width: 200,
                          decoration: BoxDecoration(
                            color: Colors.grey[800],
                            borderRadius: BorderRadius.circular(16.0),
                          ),
                          child: Center(child: CircularProgressIndicator()),
                        );
                      },
                      // Error builder for image display
                      errorBuilder: (context, error, stackTrace) {
                        print('Album cover error on details screen: $error');
                        return Image.asset(
                          'assets/mic.jpg', // Fallback image
                          height: 200,
                          width: 200,
                          fit: BoxFit.cover,
                        );
                      },
                    ),
                  ),
                  SizedBox(height: 16),
                  Text(
                    _albumData?.albumName ?? widget.album.albumName,
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 24.0,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  SizedBox(height: 8),
                  Text(
                    '${_albumData?.songCount ?? widget.album.songCount} songs',
                    style: TextStyle(
                      color: Colors.grey[400],
                      fontSize: 16.0,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  SizedBox(height: 24),
                ],
              ),
            ),
            // Add New Upload Button
            Center(
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => SongUploadScreen_stes(
                        userId: widget.userId,
                        userfullname: widget.userfullname,
                        albumId: widget.album.albumId, // Pass album ID for context

                      ),
                    ),
                  ).then((_) {
                    // Refresh data when returning from upload screen
                    _loadAlbumDetails();
                  });
                },
                icon: Icon(Icons.add_circle_outline, color: Colors.white),
                label: Text('Add New Upload', style: TextStyle(color: Colors.white)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Color(0xFF2644D9), // Green color
                  padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30),
                  ),
                  shadowColor: Colors.black.withOpacity(0.4),
                  elevation: 5,
                ),
              ),
            ),
            SizedBox(height: 24),
            // Songs List Header
            Text(
              'Songs in this Album',
              style: TextStyle(
                color: Colors.white,
                fontSize: 20.0,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 16),
            // List of songs in the album
            Expanded(
              child: _albumSongs.isEmpty
                  ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      _isNoInternet
                          ? 'No internet connection. Please check your network.'
                          : 'No songs found in this album.',
                      style: TextStyle(color: Colors.grey[400], fontSize: 16),
                      textAlign: TextAlign.center,
                    ),
                    if (_isNoInternet) ...[
                      SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadAlbumDetails,
                        child: Text('Retry'),
                      ),
                    ],
                  ],
                ),
              )
                  : RefreshIndicator(
                onRefresh: _loadAlbumDetails, // Pull to refresh
                child: ListView.builder(
                  itemCount: _albumSongs.length,
                  itemBuilder: (context, index) {
                    final AlbumSong albumSong = _albumSongs[index];
                    return _buildAlbumDetailSongRow(
                      context,
                      albumSong,
                      widget.userId,
                      widget.userfullname,
                    );
                  },
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
          email: widget.userId,
          fullName: widget.userfullname,
          category: "Singer",
          currentIndex: 3,
          isFromNewHomePage: false,
        ),
        LoadingScreen(
          isLoading: _isLoading,
          isNoInternet: _isNoInternet,
          onRetry: _loadAlbumDetails,
        ),
      ],
    );
  }

  /// Helper function to build individual song rows on the album details screen.
  Widget _buildAlbumDetailSongRow(BuildContext context, AlbumSong song, String userId, String userfullname) {
    /// Determines the color for the song status chip.
    Color getStatusColor(String decision) {
      // Using the same color as the adminlistsong.dart for consistency
      return Color(0xFF464445);
    }

    /// Navigates to the RejectionDetailsPage for rejected songs.
    void _navigateToRejectionDetails() {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => RejectionDetailsPage(
            songName: song.songName,
            genre: song.genre,
            // stageName is not directly available on AlbumSong from the album API, using placeholder
            artistName: 'Unknown Artist',
            workflowId: song.workflowId,
            coverPageUrl: song.coverPageUrl,
            userId: userId,
            userfullname: userfullname,
            category: "Singer",
          ),
        ),
      );
    }

    /// Navigates to the AnalyticsPage for approved songs.
    void _navigateToAnalyticsPage() {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => AnalyticsPage(
            songId: song.songId,
            songName: song.songName,
            artistName: song.displayName, // Use displayName getter instead of 'Unknown Artist'
            userfullname: userfullname,
            coverImage: song.coverPageUrl,
          ),
        ),
      );
    }

    return GestureDetector(
      onTap: () {
        // Navigate based on song decision status
        if (song.decision == 'Rejected') {
          _navigateToRejectionDetails();
        } else if (song.decision == 'Approved') {
          _navigateToAnalyticsPage();
        }
      },
      child: Card(
        margin: const EdgeInsets.symmetric(vertical: 8.0),
        color: Color(0xFF232323), // Dark background for the card
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12.0),
        ),
        elevation: 3,
        child: Padding(
          padding: const EdgeInsets.all(12.0),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(8.0),
                child: Image.network(
                  song.coverPageUrl,
                  height: 50,
                  width: 50,
                  fit: BoxFit.cover,
                  // Loading builder for image display
                  loadingBuilder: (context, child, loadingProgress) {
                    if (loadingProgress == null) return child;
                    return Container(
                      height: 50,
                      width: 50,
                      decoration: BoxDecoration(
                        color: Colors.grey[800],
                        borderRadius: BorderRadius.circular(8.0),
                      ),
                      child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
                    );
                  },
                  // Error builder for image display
                  errorBuilder: (context, error, stackTrace) {
                    print('Album song cover error: $error');
                    print('Album song cover URL: ${song.coverPageUrl}');
                    return Image.asset(
                      'assets/mic.jpg', // Fallback image
                      height: 50,
                      width: 50,
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
                    Text(
                      song.songName,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16.0,
                        fontWeight: FontWeight.bold,
                      ),
                      overflow: TextOverflow.ellipsis, // Handle long song names
                    ),
                    Text(
                      song.genre, // Display the genre here
                      style: TextStyle(
                        color: Colors.grey[400],
                        fontSize: 12.0,
                      ),
                    ),
                  ],
                ),
              ),
              // Show analytics icon only for approved songs (if applicable for album songs)
              if (song.decision == 'Approved')
                IconButton(
                  icon: Image.asset(
                    'assets/analytics.png',
                    width: 20,
                    height: 20,
                    color: Colors.white,
                  ),
                  onPressed: _navigateToAnalyticsPage,
                ),
              SizedBox(width: 10),
              Container(
                width: 80.0,
                height: 28.0,
                padding: EdgeInsets.symmetric(horizontal: 8.0, vertical: 4.0),
                decoration: BoxDecoration(
                  color: getStatusColor(song.decision),
                  borderRadius: BorderRadius.circular(14.0),
                ),
                child: Center(
                  child: Text(
                    song.decision, // Display only the decision here
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 12.0,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
