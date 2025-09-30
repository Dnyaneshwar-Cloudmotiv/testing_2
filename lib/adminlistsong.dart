// adminlistsong.dart - FIXED VERSION
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:voiceapp/Analystics.dart';
import 'package:voiceapp/Rejected_reason.dart';
import 'package:voiceapp/main.dart';
import 'package:voiceapp/profile_manager.dart';
import 'package:voiceapp/services/api_service.dart';
import 'album_details_screen.dart';
import 'bottomnavigationbar.dart';
import 'package:voiceapp/connectivity_service.dart';
import 'package:voiceapp/loading_screen.dart';

/// Represents a single song, typically for individual song listings (not part of an album).
/// This model aligns with the data received from the 'approverList' API.
class Song {
  final String songId;
  final String decision;
  final String stageName;
  final String fullName;
  final String songName;
  final String workflowId;
  final String coverPageUrl;
  final String genre;
  final String updatedTimestamp;
  final String playCount;

  Song({
    required this.songId,
    required this.decision,
    required this.stageName,
    required this.fullName,
    required this.songName,
    required this.workflowId,
    required this.coverPageUrl,
    required this.genre,
    required this.updatedTimestamp,
    required this.playCount,
  });

  factory Song.fromJson(Map<String, dynamic> json) {
    return Song(
      songId: json['song_id'] as String,
      decision: json['decision'] as String,
      stageName: json['stage_name'] as String? ?? '',
      fullName: json['FullName'] as String? ?? '',
      songName: json['songName'] as String,
      workflowId: json['workflowId'] as String,
      coverPageUrl: json['coverPageUrl'] as String,
      genre: json['genre'] as String,
      updatedTimestamp: json['updatedTimestamp'] as String? ?? '',
      playCount: json['playCount'] as String? ?? '0',
    );
  }

  String get displayName {
    if (stageName.isNotEmpty) {
      return stageName;
    } else if (fullName.isNotEmpty) {
      return fullName;
    } else {
      return 'Unknown Artist';
    }
  }
}

/// Represents a song that is part of an album.
class AlbumSong {
  final String songId;
  final String songName;
  final String stageName;
  final String fullName;
  final String coverPageUrl;
  final String songStreamUrl;
  final String languages;
  final String genre;
  final String playCount;
  final String decision;
  final String workflowId;
  final String workflowUpdatedTimestamp;
  final String createdTimestamp;

  AlbumSong({
    required this.songId,
    required this.songName,
    required this.fullName,
    required this.stageName,
    required this.coverPageUrl,
    required this.songStreamUrl,
    required this.languages,
    required this.genre,
    required this.playCount,
    required this.decision,
    required this.workflowId,
    required this.workflowUpdatedTimestamp,
    required this.createdTimestamp,
  });

  factory AlbumSong.fromJson(Map<String, dynamic> json) {
    return AlbumSong(
      songId: json['song_id'] as String,
      songName: json['songName'] as String,
      stageName: json['stage_name'] as String? ?? '',
      fullName: json['FullName'] as String? ?? '',
      coverPageUrl: json['coverPageUrl'] as String? ?? '',
      songStreamUrl: json['songStreamUrl'] as String? ?? '',
      languages: json['languages'] as String? ?? '',
      genre: json['genre'] as String? ?? '',
      playCount: json['playCount'] as String? ?? '0',
      decision: json['decision'] as String? ?? '',
      workflowId: json['workflowId'] as String? ?? '',
      workflowUpdatedTimestamp: json['workflowUpdatedTimestamp'] as String? ?? '',
      createdTimestamp: json['createdTimestamp'] as String? ?? '',
    );
  }

  String get displayName {
    if (stageName.isNotEmpty) {
      return stageName;
    } else if (fullName.isNotEmpty) {
      return fullName;
    } else {
      return 'Unknown Artist';
    }
  }
}

/// Represents an album containing multiple songs.
class Album {
  final String albumId;
  final String albumName;
  final String albumCoverUrl;
  final String createdTimestamp;
  final String updatedTimestamp;
  final int songCount;
  final List<AlbumSong> songs;

  Album({
    required this.albumId,
    required this.albumName,
    required this.albumCoverUrl,
    required this.createdTimestamp,
    required this.updatedTimestamp,
    required this.songCount,
    required this.songs,
  });

  factory Album.fromJson(Map<String, dynamic> json) {
    return Album(
      albumId: json['albumId'] as String,
      albumName: json['albumName'] as String,
      albumCoverUrl: json['albumCoverUrl'] as String? ?? '',
      createdTimestamp: json['createdTimestamp'] as String? ?? '',
      updatedTimestamp: json['updatedTimestamp'] as String? ?? '',
      songCount: json['songCount'] as int? ?? 0,
      songs: (json['songs'] as List<dynamic>?)
          ?.map((song) => AlbumSong.fromJson(song as Map<String, dynamic>))
          .toList() ?? [],
    );
  }
}

class AdminSongList extends StatefulWidget {
  final String userId;
  final String userfullname;

  AdminSongList({required this.userId, required this.userfullname});

  @override
  _AdminSongListState createState() => _AdminSongListState();
}

class _AdminSongListState extends State<AdminSongList> {
  bool isLoading = true;
  bool isDataEmpty = false;
  bool _mounted = true;
  bool _isNoInternet = false;
  late ConnectivityService _connectivityService;
  List<Song> singleSongs = [];
  List<Song> allSongs = [];
  List<Album> albums = [];
  String currentFilter = 'All';

  List<Song> _originalAllSongs = [];
  List<Album> _originalAlbums = [];

  DateTime? _parseTimestamp(String timestamp) {
    if (timestamp.isEmpty) return null;
    try {
      return DateTime.parse(timestamp);
    } catch (_) {
      if (timestamp.length == 15 && timestamp.contains('_')) {
        final String datePart = timestamp.substring(0, 8);
        final String timePart = timestamp.substring(9);
        final String formatted = '${datePart.substring(0,4)}-${datePart.substring(4,6)}-${datePart.substring(6,8)} '
            '${timePart.substring(0,2)}:${timePart.substring(2,4)}:${timePart.substring(4,6)}';
        try {
          return DateTime.parse(formatted);
        } catch (e) {
          print('Error parsing YYYYMMDD_HHMMSS format "$timestamp": $e');
          return null;
        }
      }
    }
    return null;
  }

  @override
  void initState() {
    super.initState();
    _connectivityService = ConnectivityService();
    _setupConnectivityListener();
    fetchData();
  }

  void _setupConnectivityListener() {
    _connectivityService.connectionStream.listen((hasConnection) {
      if (!_mounted || _connectivityService.isClosed) return;

      _safeSetState(() {
        _isNoInternet = !hasConnection;
      });

      if (hasConnection && _isNoInternet) {
        fetchData();
      }
    });
  }

  Future<void> _checkConnectivity() async {
    await _connectivityService.checkConnection();

    _safeSetState(() {
      _isNoInternet = !_connectivityService.hasConnection;
    });

    if (_connectivityService.hasConnection) {
      fetchData();
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

  Future<void> fetchData() async {
    _safeSetState(() {
      isLoading = true;
      isDataEmpty = false;
    });
    try {
      final List<Future> futures = [
        fetchSongs(),
        fetchAlbums(),
      ];

      await Future.wait(futures);

      _originalAllSongs = List.from(allSongs);
      _originalAlbums = List.from(albums);

      albums.sort((a, b) {
        final DateTime? dateA = _parseTimestamp(a.updatedTimestamp);
        final DateTime? dateB = _parseTimestamp(b.updatedTimestamp);

        if (dateA == null && dateB == null) return 0;
        if (dateA == null) return 1;
        if (dateB == null) return -1;

        return dateB.compareTo(dateA);
      });

      _filterOutAlbumSongs();

      _safeSetState(() {
        isLoading = false;
        isDataEmpty = singleSongs.isEmpty && albums.isEmpty;
      });
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error fetching data: ${e.toString()}')),
      );
      _safeSetState(() {
        isLoading = false;
        isDataEmpty = true;
      });
    }
  }

  void _filterOutAlbumSongs() {
    Set<String> albumSongIds = {};
    for (Album album in _originalAlbums) {
      for (AlbumSong albumSong in album.songs) {
        albumSongIds.add(albumSong.songId);
      }
    }
    singleSongs = _originalAllSongs.where((song) => !albumSongIds.contains(song.songId)).toList();
  }

  /// Fetches user uploaded songs using centralized API service
  /// Handles all error cases and response parsing consistently
  Future<void> fetchSongs() async {
    try {
      // Use centralized API service to get all user uploaded songs (regardless of approval status)
      final response = await ApiService.getUserUploadedSongs(ProfileManager().getUserId()!);

      if (!mounted) return;

      if (ApiService.isSuccessResponse(response)) {
        print('🔍 Songs API Response Status: ${response.statusCode}');
        print('🔍 Songs API Response Body: ${response.body}');

        if (response.body.contains("No data found")) {
          allSongs = [];
          return;
        }

        final data = ApiService.parseJsonListResponse(response);
        if (data == null) {
          print('❌ Failed to parse songs data');
          allSongs = [];
          return;
        }

        if (data.isNotEmpty) {
          print('✅ Total songs received from API: ${data.length}');

          // Parse all songs without filtering by album_id
          List<Song> songs = data
              .map((song) => Song.fromJson(song as Map<String, dynamic>))
              .toList();

          // Sort songs by songId (newest first)
          songs.sort((a, b) => int.parse(b.songId).compareTo(int.parse(a.songId)));

          allSongs = songs;

          print('✅ Final songs count after parsing: ${allSongs.length}');

          // Debug: Print first few songs for verification
          for (int i = 0; i < (allSongs.length > 5 ? 5 : allSongs.length); i++) {
            Song song = allSongs[i];
            print('🎵 Song ${i+1}: ID=${song.songId}, Name=${song.songName}, Decision=${song.decision}');
          }
        } else {
          allSongs = [];
        }
      } else {
        print('❌ Failed to load songs: ${ApiService.getErrorMessage(response)}');
        allSongs = [];
      }
    } catch (e) {
      print('❌ Error fetching songs: $e');
      allSongs = [];
    }
  }

  /// Fetches user albums using centralized API service
  /// Handles all error cases and response parsing consistently
  Future<void> fetchAlbums() async {
    try {
      final userId = ProfileManager().getUserId();
      print('🔍 Fetching albums for user ID: $userId');

      // Use centralized API service for consistent error handling and logging
      final response = await ApiService.getUserAlbums(userId!);

      if (!mounted) return;

      if (ApiService.isSuccessResponse(response)) {
        print('🔍 Albums API Response Status: ${response.statusCode}');
        print('🔍 Albums API Response Body: ${response.body}');

        final data = ApiService.parseJsonResponse(response);
        if (data == null) {
          print('❌ Failed to parse albums data');
          albums = [];
          return;
        }

        if (data.containsKey('albums') && data['albums'] != null) {
          List<dynamic> albumsData = data['albums'] as List<dynamic>;
          List<Album> fetchedAlbums = albumsData
              .map((album) => Album.fromJson(album as Map<String, dynamic>))
              .toList();
          albums = fetchedAlbums;
          print('✅ Albums loaded: ${albums.length}');
        } else {
          albums = [];
          print('ℹ️ No albums found in response');
        }
      } else {
        print('❌ Failed to load albums: ${ApiService.getErrorMessage(response)}');
        albums = [];
      }
    } catch (e) {
      print('❌ Error fetching albums: $e');
      albums = [];
    }
  }

  void _filterContent(String filter) {
    _safeSetState(() {
      currentFilter = filter;

      // IMPROVED: Better filtering logic
      if (filter == 'All') {
        // Show all songs except those that are in albums
        _filterOutAlbumSongs();
        albums = List.from(_originalAlbums);
      } else if (filter == 'Approved' || filter == 'Rejected' || filter == 'Pending') {
        // Filter songs by decision status
        singleSongs = _originalAllSongs.where((song) {
          // First check if song is not in any album
          Set<String> albumSongIds = {};
          for (Album album in _originalAlbums) {
            for (AlbumSong albumSong in album.songs) {
              albumSongIds.add(albumSong.songId);
            }
          }
          bool isNotInAlbum = !albumSongIds.contains(song.songId);

          // Then check if it matches the filter
          return isNotInAlbum && song.decision == filter;
        }).toList();

        albums = _originalAlbums.where((album) {
          return album.songs.any((albumSong) => albumSong.decision == filter);
        }).toList();
      } else if (filter == 'A-Z') {
        _filterOutAlbumSongs();
        albums = List.from(_originalAlbums);
        singleSongs.sort((a, b) => a.songName.toLowerCase().compareTo(b.songName.toLowerCase()));
        albums.sort((a, b) => a.albumName.toLowerCase().compareTo(b.albumName.toLowerCase()));
      } else if (filter == 'Z-A') {
        _filterOutAlbumSongs();
        albums = List.from(_originalAlbums);
        singleSongs.sort((a, b) => b.songName.toLowerCase().compareTo(a.songName.toLowerCase()));
        albums.sort((a, b) => b.albumName.toLowerCase().compareTo(a.albumName.toLowerCase()));
      } else if (filter == 'Date') {
        _filterOutAlbumSongs();
        albums = List.from(_originalAlbums);
        singleSongs.sort((a, b) {
          final DateTime? dateA = _parseTimestamp(a.updatedTimestamp);
          final DateTime? dateB = _parseTimestamp(b.updatedTimestamp);

          if (dateA == null && dateB == null) return 0;
          if (dateA == null) return 1;
          if (dateB == null) return -1;
          return dateB.compareTo(dateA);
        });
        albums.sort((a, b) {
          final DateTime? dateA = _parseTimestamp(a.updatedTimestamp);
          final DateTime? dateB = _parseTimestamp(b.updatedTimestamp);

          if (dateA == null && dateB == null) return 0;
          if (dateA == null) return 1;
          if (dateB == null) return -1;
          return dateB.compareTo(dateA);
        });
      }

      // Final sort for albums after filtering
      albums.sort((a, b) {
        final DateTime? dateA = _parseTimestamp(a.updatedTimestamp);
        final DateTime? dateB = _parseTimestamp(b.updatedTimestamp);

        if (dateA == null && dateB == null) return 0;
        if (dateA == null) return 1;
        if (dateB == null) return -1;
        return dateB.compareTo(dateA);
      });

      // Debug information
      print('🔍 Filter applied: $filter');
      print('🔍 Single songs after filter: ${singleSongs.length}');
      print('🔍 Albums after filter: ${albums.length}');
    });
  }

  @override
  Widget build(BuildContext context) {
    Widget content = GradientScaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        titleSpacing: 0,
        title: Row(
          children: [
            IconButton(
              icon: Icon(Icons.arrow_back_ios, color: Colors.white),
              onPressed: () {
                Navigator.pop(context);
              },
            ),
            Expanded(
              child: Text(
                currentFilter == 'All' ? 'All Content' :
                currentFilter == 'A-Z' ? 'Content (A-Z)' :
                currentFilter == 'Z-A' ? 'Content (Z-A)' :
                currentFilter == 'Date' ? 'Newest Content' :
                '${currentFilter} Songs',
                style: TextStyle(color: Colors.white, fontSize: 16),
              ),
            ),
            PopupMenuButton<String>(
              icon: Icon(Icons.filter_list, color: Colors.white),
              onSelected: _filterContent,
              offset: Offset(0, 50),
              elevation: 20,
              color: Color(0xFF151415),
              itemBuilder: (BuildContext context) => [
                PopupMenuItem<String>(
                  value: 'All',
                  child: Text('All Content'),
                  textStyle: TextStyle(color: Colors.white),
                ),
                PopupMenuItem<String>(
                  value: 'Approved',
                  child: Text('Approved Songs'),
                  textStyle: TextStyle(color: Colors.white),
                ),
                PopupMenuItem<String>(
                  value: 'Rejected',
                  child: Text('Rejected Songs'),
                  textStyle: TextStyle(color: Colors.white),
                ),
                PopupMenuItem<String>(
                  value: 'Pending',
                  child: Text('Pending Songs'),
                  textStyle: TextStyle(color: Colors.white),
                ),
                PopupMenuItem<String>(
                  value: 'A-Z',
                  child: Text('Sort A-Z'),
                  textStyle: TextStyle(color: Colors.white),
                ),
                PopupMenuItem<String>(
                  value: 'Z-A',
                  child: Text('Sort Z-A'),
                  textStyle: TextStyle(color: Colors.white),
                ),
                PopupMenuItem<String>(
                  value: 'Date',
                  child: Text('Newest First'),
                  textStyle: TextStyle(color: Colors.white),
                ),
              ],
            ),
          ],
        ),
        backgroundColor: Colors.transparent,
      ),
      body: isLoading
          ? Center(child: CircularProgressIndicator())
          : isDataEmpty
          ? Center(
        child: Text(
          'No songs or albums uploaded',
          style: TextStyle(color: Colors.white, fontSize: 18),
        ),
      )
          : Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (albums.isNotEmpty) ...[
              SizedBox(height: 10),
              Text(
                'Your Albums',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20.0,
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: 10),
              Container(
                height: 200,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: albums.length,
                  itemBuilder: (context, index) {
                    return _buildAlbumGridItem(albums[index]);
                  },
                ),
              ),
              SizedBox(height: 20),
            ],
            if (singleSongs.isNotEmpty) ...[
              Text(
                'Your Songs',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20.0,
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: 10),
              Expanded(
                child: ListView.builder(
                  itemCount: singleSongs.length,
                  itemBuilder: (context, index) {
                    return _buildSongRow(singleSongs[index]);
                  },
                ),
              ),
            ] else if (albums.isEmpty && singleSongs.isEmpty) ...[
              Expanded(
                child: Center(
                  child: Text(
                    'No content available in this category',
                    style: TextStyle(color: Colors.grey[400], fontSize: 16),
                  ),
                ),
              ),
            ],
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
          isLoading: isLoading,
          isNoInternet: _isNoInternet,
          onRetry: _checkConnectivity,
        ),
      ],
    );
  }

  Widget _buildAlbumGridItem(Album album) {
    final Uri? albumCoverUri = Uri.tryParse(album.albumCoverUrl);
    final bool isValidAlbumCoverUrl = albumCoverUri != null && albumCoverUri.isAbsolute;

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => AlbumDetailsScreen(
              album: album,
              allSongs: _originalAllSongs,
              userId: widget.userId,
              userfullname: widget.userfullname,
            ),
          ),
        ).then((_) {
          fetchData();
        });
      },
      child: Container(
        width: 150,
        margin: const EdgeInsets.only(right: 15.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(12.0),
              child: isValidAlbumCoverUrl
                  ? Image.network(
                album.albumCoverUrl,
                height: 130,
                width: 150,
                fit: BoxFit.cover,
                loadingBuilder: (context, child, loadingProgress) {
                  if (loadingProgress == null) return child;
                  return Container(
                    height: 130,
                    width: 150,
                    decoration: BoxDecoration(
                      color: Colors.grey[800],
                      borderRadius: BorderRadius.circular(12.0),
                    ),
                    child: Center(child: CircularProgressIndicator()),
                  );
                },
                errorBuilder: (context, error, stackTrace) {
                  print('Album grid cover error: $error');
                  print('Album grid cover URL: ${album.albumCoverUrl}');
                  return Image.asset(
                    'assets/mic.jpg',
                    height: 130,
                    width: 150,
                    fit: BoxFit.cover,
                  );
                },
              )
                  : Image.asset(
                'assets/mic.jpg',
                height: 130,
                width: 150,
                fit: BoxFit.cover,
              ),
            ),
            SizedBox(height: 8),
            Text(
              album.albumName,
              style: TextStyle(
                color: Colors.white,
                fontSize: 14.0,
                fontWeight: FontWeight.bold,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            Text(
              '${album.songCount} songs',
              style: TextStyle(
                color: Colors.grey[400],
                fontSize: 12.0,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSongRow(Song song) {
    Color getStatusColor(String decision) {
      switch (decision) {
        case 'Approved':
          return Color(0xFF464445);
        case 'Rejected':
          return Color(0xFF464445);
        case 'Pending':
          return Color(0xFF464445);
        default:
          return Colors.grey;
      }
    }

    void _navigateToRejectionDetails() {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => RejectionDetailsPage(
            songName: song.songName,
            genre: song.genre,
            artistName: song.displayName,
            workflowId: song.workflowId,
            coverPageUrl: song.coverPageUrl,
            userId: widget.userId,
            userfullname: widget.userfullname,
            category: "Singer",
          ),
        ),
      );
    }

    void _navigateToAnalyticsPage() {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => AnalyticsPage(
            songId: song.songId,
            songName: song.songName,
            artistName: song.displayName,
            userfullname: widget.userfullname,
            coverImage: song.coverPageUrl,
          ),
        ),
      );
    }

    final Uri? songCoverUri = Uri.tryParse(song.coverPageUrl);
    final bool isValidSongCoverUrl = songCoverUri != null && songCoverUri.isAbsolute;

    return GestureDetector(
      onTap: () {
        if (song.decision == 'Rejected') {
          _navigateToRejectionDetails();
        } else if (song.decision == 'Approved') {
          _navigateToAnalyticsPage();
        }
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8.0),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8.0),
              child: isValidSongCoverUrl
                  ? Image.network(
                song.coverPageUrl,
                height: 60,
                width: 60,
                fit: BoxFit.cover,
                loadingBuilder: (context, child, loadingProgress) {
                  if (loadingProgress == null) return child;
                  return Container(
                    height: 60,
                    width: 60,
                    child: Center(child: CircularProgressIndicator()),
                  );
                },
                errorBuilder: (context, error, stackTrace) {
                  print('Individual song cover error: $error');
                  print('Individual song cover URL: ${song.coverPageUrl}');
                  return Image.asset(
                    'assets/mic.jpg',
                    height: 60,
                    width: 60,
                    fit: BoxFit.cover,
                  );
                },
              )
                  : Image.asset(
                'assets/mic.jpg',
                height: 60,
                width: 60,
                fit: BoxFit.cover,
              ),
            ),
            SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    song.songName,
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18.0,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    song.genre,
                    style: TextStyle(
                      color: Colors.grey[400],
                      fontSize: 14.0,
                    ),
                  ),
                ],
              ),
            ),
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
              height: 25.0,
              padding: EdgeInsets.symmetric(horizontal: 8.0, vertical: 4.0),
              decoration: BoxDecoration(
                color: getStatusColor(song.decision),
                borderRadius: BorderRadius.circular(12.0),
              ),
              child: Center(
                child: Text(
                  song.decision,
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
    );
  }
}