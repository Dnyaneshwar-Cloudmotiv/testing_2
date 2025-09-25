// Analystics1.dart
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:voiceapp/Analystics.dart';
import 'package:voiceapp/main.dart';
import 'package:voiceapp/profile_manager.dart';
import 'package:voiceapp/services/api_service.dart';
import 'bottomnavigationbar.dart';
import 'package:voiceapp/connectivity_service.dart';
import 'package:voiceapp/loading_screen.dart';

class ApprovedSong {
  final String songId;
  final String decision;
  final String stageName;
  final String fullName;
  final String songName;
  final String coverPageUrl;
  final String updatedTimestamp;
  final String playCount;
  final String? albumId;
  final String? albumName;
  final String? albumCoverUrl;
  final int? totalSongs;

  ApprovedSong({
    required this.songId,
    required this.decision,
    required this.stageName,
    required this.fullName,
    required this.songName,
    required this.coverPageUrl,
    required this.updatedTimestamp,
    required this.playCount,
    this.albumId,
    this.albumName,
    this.albumCoverUrl,
    this.totalSongs,
  });

  factory ApprovedSong.fromJson(Map<String, dynamic> json) {
    return ApprovedSong(
      songId: json['song_id'] as String,
      decision: json['decision'] as String,
      stageName: json['stage_name'] as String? ?? '',
      fullName: json['FullName'] as String? ?? '',
      songName: json['songName'] as String,
      coverPageUrl: json['coverPageUrl'] as String? ?? 'assets/music.jpeg',
      updatedTimestamp: json['updatedTimestamp'] as String? ?? '',
      playCount: json['playCount'] as String? ?? '0',
      albumId: json['album_id'] as String?,
      albumName: json['album_name'] as String?,
      albumCoverUrl: json['album_cover_url'] as String?,
      totalSongs: json['total_songs'] as int?,
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

class Album {
  final String albumId;
  final String albumName;
  final String albumCoverUrl;
  final String createdTimestamp;
  final String updatedTimestamp;
  final int songCount;
  final List<ApprovedSong> songs;

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
      albumCoverUrl: json['albumCoverUrl'] as String? ?? 'assets/music.jpeg',
      createdTimestamp: json['createdTimestamp'] as String? ?? '',
      updatedTimestamp: json['updatedTimestamp'] as String? ?? '',
      songCount: json['songCount'] as int? ?? 0,
      songs: (json['songs'] as List<dynamic>?)
          ?.map((song) => ApprovedSong.fromJson(song as Map<String, dynamic>))
          .where((song) => song.decision == 'Approved')
          .toList() ?? [],
    );
  }
}

class AlbumSongsScreen extends StatelessWidget {
  final String albumId;
  final String albumName;
  final List<ApprovedSong> albumSongs;
  final String userId;
  final String userfullname;

  AlbumSongsScreen({
    required this.albumId,
    required this.albumName,
    required this.albumSongs,
    required this.userId,
    required this.userfullname,
  });

  @override
  Widget build(BuildContext context) {
    final approvedAlbumSongs = albumSongs.where((song) => song.decision == 'Approved').toList();

    return GradientScaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        titleSpacing: 0,
        title: Row(
          mainAxisAlignment: MainAxisAlignment.start,
          children: [
            IconButton(
              icon: Icon(Icons.arrow_back_ios, color: Colors.white),
              onPressed: () {
                Navigator.pop(context);
              },
            ),
            Expanded(
              child: Text(
                albumName,
                style: TextStyle(color: Colors.white, fontSize: 16),
              ),
            ),
          ],
        ),
        backgroundColor: Colors.transparent,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: approvedAlbumSongs.isEmpty
            ? Center(
          child: Text(
            'No approved songs in this album.',
            style: TextStyle(color: Colors.white, fontSize: 18),
          ),
        )
            : ListView.builder(
          itemCount: approvedAlbumSongs.length,
          itemBuilder: (context, index) {
            final song = approvedAlbumSongs[index];
            return _buildSongRow(context, song);
          },
        ),
      ),
    );
  }

  Widget _buildSongRow(BuildContext context, ApprovedSong song) {
    final Uri? songCoverUri = Uri.tryParse(song.coverPageUrl);
    final bool isValidSongCoverUrl = songCoverUri != null && songCoverUri.isAbsolute;

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => AnalyticsPage(
              songId: song.songId,
              songName: song.songName,
              artistName: song.displayName,
              userfullname: userfullname,
              coverImage: song.coverPageUrl,
            ),
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 12.0),
        padding: const EdgeInsets.all(12.0),
        decoration: BoxDecoration(
          color: Colors.grey[900], // dark card background
          borderRadius: BorderRadius.circular(12.0),
        ),
        child: Row(
          children: [
            // Cover Image
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
                  return SizedBox(
                    height: 60,
                    width: 60,
                    child: Center(child: CircularProgressIndicator()),
                  );
                },
                errorBuilder: (context, error, stackTrace) {
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
            SizedBox(width: 12),
            // Song info
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
                  ),
                  SizedBox(height: 4),
                  Text(
                    song.displayName,
                    style: TextStyle(
                      color: Colors.grey[400],
                      fontSize: 14.0,
                    ),
                  ),
                ],
              ),
            ),
            // Analytics Icon
            IconButton(
              padding: const EdgeInsets.only(right: 12.0),
              icon: Image.asset(
                'assets/analytics.png',
                width: 20,
                fit: BoxFit.cover,
                color: Colors.white,
              ),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => AnalyticsPage(
                      songId: song.songId,
                      songName: song.songName,
                      artistName: song.displayName,
                      userfullname: userfullname,
                      coverImage: song.coverPageUrl,
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

}

class ApprovedSongList extends StatefulWidget {
  final String userId;
  final String userfullname;

  ApprovedSongList({required this.userId, required this.userfullname});

  @override
  _ApprovedSongListState createState() => _ApprovedSongListState();
}

class _ApprovedSongListState extends State<ApprovedSongList> {
  List<ApprovedSong> singleSongs = [];
  List<ApprovedSong> allSongs = [];
  List<Album> albums = [];
  List<ApprovedSong> displayedSongs = [];
  String currentFilter = 'All';
  bool _isLoading = true;
  bool _isDataEmpty = false;
  String? _error;
  bool _mounted = true;
  bool _isNoInternet = false;
  late ConnectivityService _connectivityService;

  @override
  void initState() {
    super.initState();
    _mounted = true;
    _connectivityService = ConnectivityService();
    _setupConnectivityListener();
    fetchData();
  }

  void _setupConnectivityListener() {
    _connectivityService.connectionStream.listen((hasConnection) {
      if (!_mounted || _connectivityService.isClosed) return;

      setState(() {
        _isNoInternet = !hasConnection;
      });

      if (hasConnection && _isNoInternet) {
        fetchData();
      }
    });

    _checkConnectivity();
  }

  Future<void> _checkConnectivity() async {
    await _connectivityService.checkConnection();

    setState(() {
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
      _isLoading = true;
      _error = null;
    });

    try {
      final List<Future> futures = [
        fetchSongs(),
        fetchAlbums(),
      ];

      await Future.wait(futures);

      _filterOutAlbumSongs();

      _safeSetState(() {
        _isLoading = false;
        _isDataEmpty = singleSongs.isEmpty && albums.isEmpty;
      });
    } catch (e) {
      if (!mounted) return;

      _safeSetState(() {
        _error = e.toString();
        _isLoading = false;
        _isDataEmpty = true;
        singleSongs = [];
        albums = [];
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading data: ${e.toString()}'),
            action: SnackBarAction(
              label: 'Retry',
              onPressed: fetchData,
            ),
          ),
        );
      }
    }
  }

  void _filterOutAlbumSongs() {
    Set<String> albumSongIds = {};
    for (Album album in albums) {
      for (ApprovedSong song in album.songs) {
        albumSongIds.add(song.songId);
      }
    }
    singleSongs = allSongs.where((song) => !albumSongIds.contains(song.songId)).toList();
    displayedSongs = List.from(singleSongs);
  }

  /// Fetches approved songs using centralized API service
  /// Handles all error cases and response parsing consistently
  Future<void> fetchSongs() async {
    try {
      // Use centralized API service for consistent error handling and logging
      final response = await ApiService.getApprovedSongsList(ProfileManager().getUserId()!);

      if (!mounted) return;

      if (ApiService.isSuccessResponse(response)) {
        if (response.body.contains("No data found")) {
          _safeSetState(() {
            allSongs = [];
            singleSongs = [];
            displayedSongs = [];
          });
          return;
        }

        final data = ApiService.parseJsonListResponse(response);
        if (data == null) {
          throw Exception('Failed to parse song data');
        }

        if (!mounted) return;

        if (data.isEmpty) {
          _safeSetState(() {
            allSongs = [];
            singleSongs = [];
            displayedSongs = [];
          });
          return;
        }

        List<ApprovedSong> songs = [];
        try {
          songs = data
              .where((song) => song != null)
              .map((song) => ApprovedSong.fromJson(song as Map<String, dynamic>))
              .where((song) => song.decision == 'Approved')
              .toList();
        } catch (e) {
          throw Exception('Failed to process song data: $e');
        }

        _safeSetState(() {
          allSongs = songs;
        });
      } else {
        throw Exception('Failed to load songs: ${ApiService.getErrorMessage(response)}');
      }
    } catch (e) {
      throw Exception('Error fetching songs: $e');
    }
  }

  /// Fetches user albums using centralized API service
  /// Handles all error cases and response parsing consistently
  Future<void> fetchAlbums() async {
    try {
      // Use centralized API service for consistent error handling and logging
      final response = await ApiService.getUserAlbums(ProfileManager().getUserId()!);

      if (!mounted) return;

      if (ApiService.isSuccessResponse(response)) {
        final data = ApiService.parseJsonResponse(response);
        if (data == null) {
          throw Exception('Failed to parse albums data');
        }

        if (data.containsKey('albums') && data['albums'] != null) {
          List<dynamic> albumsData = data['albums'] as List<dynamic>;
          List<Album> fetchedAlbums = albumsData
              .map((album) => Album.fromJson(album as Map<String, dynamic>))
              .where((album) => album.songs.any((song) => song.decision == 'Approved'))
              .toList();
          _safeSetState(() {
            albums = fetchedAlbums;
          });
        } else {
          _safeSetState(() {
            albums = [];
          });
        }
      } else {
        throw Exception('Failed to load albums: ${ApiService.getErrorMessage(response)}');
      }
    } catch (e) {
      throw Exception('Error fetching albums: $e');
    }
  }

  void _filterSongs(String filter) {
    _safeSetState(() {
      currentFilter = filter;
      if (filter == 'All') {
        displayedSongs = List.from(singleSongs);
      } else if (filter == 'A-Z') {
        displayedSongs = List.from(singleSongs)
          ..sort((a, b) => a.songName.toLowerCase().compareTo(b.songName.toLowerCase()));
      } else if (filter == 'Z-A') {
        displayedSongs = List.from(singleSongs)
          ..sort((a, b) => b.songName.toLowerCase().compareTo(a.songName.toLowerCase()));
      } else if (filter == 'Date') {
        displayedSongs = List.from(singleSongs)
          ..sort((a, b) {
            if (a.updatedTimestamp.isEmpty) return 1;
            if (b.updatedTimestamp.isEmpty) return -1;
            return b.updatedTimestamp.compareTo(a.updatedTimestamp);
          });
      } else if (filter == 'Most Streamed') {
        displayedSongs = List.from(singleSongs)
          ..sort((a, b) {
            int countA = int.tryParse(a.playCount) ?? 0;
            int countB = int.tryParse(b.playCount) ?? 0;
            return countB.compareTo(countA);
          });
      } else if (filter == 'Least Streamed') {
        displayedSongs = List.from(singleSongs)
          ..sort((a, b) {
            int countA = int.tryParse(a.playCount) ?? 0;
            int countB = int.tryParse(b.playCount) ?? 0;
            return countA.compareTo(countB);
          });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    Widget content = GradientScaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        titleSpacing: 0,
        title: Row(
          mainAxisAlignment: MainAxisAlignment.start,
          children: [
            IconButton(
              icon: Icon(Icons.arrow_back_ios, color: Colors.white),
              onPressed: () {
                Navigator.pop(context);
              },
            ),
            Expanded(
              child: Text(
                currentFilter == 'All' ? 'Approved Songs' :
                currentFilter == 'A-Z' ? 'Songs A-Z' :
                currentFilter == 'Z-A' ? 'Songs Z-A' :
                currentFilter == 'Date' ? 'Newest Songs' :
                currentFilter == 'Most Streamed' ? 'Most Streamed' :
                currentFilter == 'Least Streamed' ? 'Least Streamed' :
                'Approved Songs',
                style: TextStyle(color: Colors.white, fontSize: 16),
              ),
            ),
            PopupMenuButton<String>(
              icon: Icon(Icons.filter_list, color: Colors.white),
              onSelected: _filterSongs,
              offset: Offset(0, 50),
              elevation: 20,
              color: Color(0xFF151415),
              itemBuilder: (BuildContext context) => [
                PopupMenuItem<String>(
                  value: 'All',
                  child: Text('All Songs', style: TextStyle(color: Colors.white)),
                ),
                PopupMenuItem<String>(
                  value: 'A-Z',
                  child: Text('A-Z', style: TextStyle(color: Colors.white)),
                ),
                PopupMenuItem<String>(
                  value: 'Z-A',
                  child: Text('Z-A', style: TextStyle(color: Colors.white)),
                ),
                PopupMenuItem<String>(
                  value: 'Date',
                  child: Text('Newest First', style: TextStyle(color: Colors.white)),
                ),
                PopupMenuItem<String>(
                  value: 'Most Streamed',
                  child: Text('Most Streamed', style: TextStyle(color: Colors.white)),
                ),
                PopupMenuItem<String>(
                  value: 'Least Streamed',
                  child: Text('Least Streamed', style: TextStyle(color: Colors.white)),
                ),
              ],
            ),
          ],
        ),
        backgroundColor: Colors.transparent,
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : _isDataEmpty
          ? Center(
        child: Text(
          'No approved songs or albums available.',
          style: TextStyle(color: Colors.white, fontSize: 18),
          textAlign: TextAlign.center,
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
                child: _buildApprovedSongList(displayedSongs),
              ),
            ] else if (albums.isEmpty && singleSongs.isEmpty) ...[
              Center(
                child: Text(
                  'No approved content available.',
                  style: TextStyle(color: Colors.grey[400], fontSize: 16),
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
          isLoading: _isLoading,
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
            builder: (context) => AlbumSongsScreen(
              albumId: album.albumId,
              albumName: album.albumName,
              albumSongs: album.songs,
              userId: widget.userId,
              userfullname: widget.userfullname,
            ),
          ),
        );
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
                  print('Album cover error: $error');
                  print('Album cover URL: ${album.albumCoverUrl}');
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
              '${album.songCount} song${album.songCount == 1 ? '' : 's'}',
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

  Widget _buildApprovedSongList(List<ApprovedSong> songs) {
    return songs.isEmpty
        ? Padding(
      padding: const EdgeInsets.all(8.0),
      child: Text(
        'No approved songs available.',
        style: TextStyle(color: Colors.grey[400], fontSize: 16),
      ),
    )
        : ListView.builder(
      itemCount: songs.length,
      itemBuilder: (context, index) {
        final song = songs[index];
        return _buildApprovedSongRow(song);
      },
    );
  }

  Widget _buildApprovedSongRow(ApprovedSong song) {
    final Uri? songCoverUri = Uri.tryParse(song.coverPageUrl);
    final bool isValidSongCoverUrl = songCoverUri != null && songCoverUri.isAbsolute;

    return GestureDetector(
      onTap: () {
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
      },
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 12.0),
        padding: const EdgeInsets.all(12.0),
        decoration: BoxDecoration(
          color: Colors.grey[900], // dark box
          borderRadius: BorderRadius.circular(12.0),
        ),
        child: Row(
          children: [
            // Cover Image
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
            SizedBox(width: 12),
            // Song Info
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
                  ),
                  SizedBox(height: 4),
                  Text(
                    song.displayName,
                    style: TextStyle(
                      color: Colors.grey[400],
                      fontSize: 14.0,
                    ),
                  ),
                ],
              ),
            ),
            // Analytics Icon
            IconButton(
              padding: const EdgeInsets.only(right: 12.0),
              icon: Image.asset(
                'assets/analytics.png',
                width: 20,
                fit: BoxFit.cover,
                color: Colors.white,
              ),
              onPressed: () {
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
              },
            ),
          ],
        ),
      ),
    );
  }
}