// artist.dart
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';
import 'package:voiceapp/services/api_service.dart';
import 'package:voiceapp/FollowersFollowingPage.dart';
import 'package:voiceapp/viewProfile.dart';
import 'package:voiceapp/utils/image_utils.dart';
import 'package:voiceapp/SearchPage.dart';
import 'package:voiceapp/main.dart';
import 'package:voiceapp/NewHomepage.dart';
// 'package:voiceapp/detailed_bio.dart';
import 'package:voiceapp/newlistofsongs.dart';
//import 'package:voiceapp/nowplaying.dart';
import 'package:firebase_dynamic_links/firebase_dynamic_links.dart';
import 'package:share_plus/share_plus.dart';
import 'package:voiceapp/profile_manager.dart';
import 'bottomnavigationbar.dart';
import 'package:voiceapp/connectivity_service.dart';
import 'package:voiceapp/loading_screen.dart';

import 'nowplaying.dart';

class MusicArtistPage extends StatefulWidget {
  final String artistName;
  final int followerCount;
  final String userId;
  final String category;
  final String userfullname;
  final bool isFollowing;
  final String artistId;
  final String? profileImageUrl; // Optional profile image URL
  final String? coverImageUrl;
  final bool isFromDeepLink;

  // Constructor to accept artist details
  MusicArtistPage({required this.artistName, required this.followerCount, required  this.userId, required  this.category, required this.userfullname,required this.isFollowing,required this.artistId, this.profileImageUrl,this.isFromDeepLink = false,
    this.coverImageUrl,});

  @override
  _MusicArtistPageState createState() => _MusicArtistPageState();
}

class _MusicArtistPageState extends State<MusicArtistPage> {
  List<Map<String, dynamic>> _songs = []; // 
  List<String> _languages = []; // List to store the fetched languages
  bool _isLoadingLanguages = true;

  List<String> _genres = [];
  bool _isLoadingGenres = true;
  bool _isBioExpanded = false;
  String bio='';
  bool isFollowing = false; // Track if the current user follows this artist
  int followerCount = 0;
  bool shouldRefresh = false;
  late Artist updatedArtist;
  String? _dynamicLink; // Store the pre-generated dynamic link here
  bool _isGeneratingLink = true;

  bool _isLoading = true;
  bool _isNoInternet = false;
  late ConnectivityService _connectivityService;
  final ValueNotifier<bool> isNowPlayingTileVisible = ValueNotifier<bool>(true);

  @override
  void initState() {
    super.initState();
    _connectivityService = ConnectivityService();
    _setupConnectivityListener();

    print('Initial coverImageUrl: ${widget.coverImageUrl}');

    // Initialize with passed state, will be updated with real API check
    bool initialFollowState = false;
    if (widget.artistId != ProfileManager().getUserId()) {
      initialFollowState = widget.isFollowing;
      print('🔍 Using initial passed follow state for artist ${widget.artistId}: $initialFollowState');
    }

    updatedArtist = Artist(
      stageName: widget.artistName,
      userId: widget.artistId,
      followerCount: widget.followerCount,
      isFollowing: initialFollowState,
      coverImageUrl: widget.coverImageUrl,
      profileImageUrl: widget.profileImageUrl,
    );

    _preloadImages();
    _generateDynamicLink();
    _fetchArtistLanguages();
    _fetchGenres();
    _fetchProfileDetails();
    _fetchAlbumsForArtist();
    
  }

  void _setupConnectivityListener() {
    _connectivityService.connectionStream.listen((hasConnection) {
      if (_connectivityService.isClosed) return;

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
    setState(() {
      _isLoading = true;
    });

    await _connectivityService.checkConnection();

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
      // Check real follow status using new API
      if (widget.artistId != ProfileManager().getUserId()) {
        final realFollowStatus = await _checkFollowStatus(widget.artistId);
        setState(() {
          updatedArtist.isFollowing = realFollowStatus;
        });
      }

      // Call all data fetching methods here
      await _fetchArtistLanguages();
      await _fetchGenres();
      await _fetchProfileDetails();

      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      print('Error initializing data: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }



  /// Checks if current user follows this artist using the new checkFollowingStatus API
  Future<bool> _checkFollowStatus(String artistId) async {
    final currentUserId = ProfileManager().getUserId();
    if (currentUserId == null || currentUserId.isEmpty) {
      print('⚠️ No current user ID available for follow check');
      return false;
    }

    try {
      final response = await ApiService.getFollowingStatus(currentUserId);
      
      if (ApiService.isSuccessResponse(response)) {
        final data = json.decode(response.body);
        if (data != null && data['following'] != null) {
          final List<dynamic> followingList = data['following'];
          
          // Check if artistId exists in the following list with status true
          for (var followItem in followingList) {
            if (followItem['artist_id']?.toString() == artistId && 
                followItem['status'] == true) {
              print('🔍 User $currentUserId follows artist $artistId: true');
              return true;
            }
          }
        }
        print('🔍 User $currentUserId follows artist $artistId: false');
        return false;
      } else {
        print('❌ Failed to check follow status for artist $artistId: ${response.statusCode}');
        return false;
      }
    } catch (e) {
      print('❌ Error checking follow status for artist $artistId: $e');
      return false;
    }
  }

  void _preloadImages() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (widget.coverImageUrl != null && mounted) {
        precacheImage(CachedNetworkImageProvider(widget.coverImageUrl!), context);
      }
      if (widget.profileImageUrl != null && mounted) {
        precacheImage(CachedNetworkImageProvider(widget.profileImageUrl!), context);
      }
    });
  }

  @override
  void dispose() {
    _connectivityService.dispose();
    super.dispose();
  }

  Future<void> _generateDynamicLink() async {
    try {
      final dynamicLink = await createDynamicLink(widget.artistId);
      setState(() {
        _dynamicLink = dynamicLink;
        _isGeneratingLink = false; // Link generation is done
      });
    } catch (e) {
      print("Error generating dynamic link: $e");
      setState(() {
        _isGeneratingLink = false; // Stop loading state even if there’s an error
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

  void _shareArtistPage() {
    if (_isGeneratingLink) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Generating share link, please wait...')),
      );
    } else if (_dynamicLink != null) {
      //Share.share('Hey, see who I found ! Listen to the amazing song by ${widget.artistName} on VOIZ ! Just download the app, listen and enjoy! $_dynamicLink');
      Share.share('Hey, see who I found ! Listen to the amazing song by ${widget.artistName} on VOIZ ! Just download the app, listen and enjoy! $_dynamicLink');
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to generate shareable link')),
      );
    }
  }

  void _handleFollowToggle() async {
    try {
      if (updatedArtist.isFollowing) {
        // If already following, unfollow the artist
        await _unfollowArtist();
      } else {
        // If not following, follow the artist
        await _followArtist();
      }

      // Mark for refresh on return
      shouldRefresh = true;
    } catch (e) {
      print('❌ Error toggling follow status: $e');
      ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update follow status. Please try again.'))
      );
    }
  }

  Future<List<Map<String, String>>> fetchSongsByAlbumId(String userId, String albumId) async {
    try {
      final response = await ApiService.getSongsByAlbumId(userId, albumId);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> albums = data['albums'] ?? [];

        if (albums.isNotEmpty) {
          final List<dynamic> songs = albums[0]['songs'] ?? [];

          return songs.map<Map<String, String>>((song) => {
            'title': song['songName'] ?? '',
            'album': song['albumName'] ?? '',
            'song_id': song['song_id'] ?? '',
            'artist': (song['stage_name'] != null && song['stage_name'].toString().trim().isNotEmpty)
                ? song['stage_name'].toString()
                : (song['FullName'] ?? 'Unknown Artist').toString(),
            'duration': song['span'] ?? '0:00',
            'coverPage': song['coverPageUrl'] ?? 'assets/logo.png',
            'streamingUrl': song['songStreamUrl'] ?? '',
            'languages': song['languages'] ?? '',
            'genre': song['genre'] ?? '',
          }).toList();
        } else {
          print(' No albums found for albumId: $albumId');
          return [];
        }
      } else {
        print('Failed to fetch songs. Status code: ${response.statusCode}');
        return [];
      }
    } catch (e) {
      print("Error fetching songs for album $albumId: $e");
      return [];
    }
  }

  Future<void> _followArtist() async {
    final String timestamp = DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());

    try {
      final response = await ApiService.followArtist(
        updatedTimestamp: timestamp,
        followedId: ProfileManager().getUserId() ?? '',
        followingId: widget.artistId,
      );

      if (response.statusCode == 200) {
        print("Follow Successful for artist: ${widget.artistId}");


        // Fetch the updated count from API
        final followersResponse = await ApiService.getFollowersCount(widget.artistId);

        if (followersResponse.statusCode == 200) {
          final followersData = json.decode(followersResponse.body);
          final int updatedCount = followersData['count'] ?? 0;

          // Update state
          setState(() {
            updatedArtist.isFollowing = true;
            updatedArtist.followerCount = updatedCount;
          });

          // Show success message
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Followed ${widget.artistName}')),
          );
        }
      } else {
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

  Future<void> _unfollowArtist() async {
    final String timestamp = DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());

    try {
      final response = await ApiService.unfollowArtist(
        updatedTimestamp: timestamp,
        followedId: ProfileManager().getUserId() ?? '',
        followingIds: [widget.artistId],
      );

      if (response.statusCode == 200) {
        print("✅ Unfollow Successful for artist: ${widget.artistId}");


        // Fetch the updated count from API
        final followersResponse = await ApiService.getFollowersCount(widget.artistId);

        if (followersResponse.statusCode == 200) {
          final followersData = json.decode(followersResponse.body);
          final int updatedCount = followersData['count'] ?? 0;

          // Update state
          setState(() {
            updatedArtist.isFollowing = false;
            updatedArtist.followerCount = updatedCount;
          });

          // Show success message
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Unfollowed ${widget.artistName}')),
          );
        }
      } else {
        print('❌ Failed to unfollow artist. Status code: ${response.statusCode}');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to unfollow artist')),
        );
      }
    } catch (e) {
      print('❌ Error unfollowing artist: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error unfollowing artist')),
      );
    }
  }

  Future<void> _fetchUpdatedFollowerCount(String userId) async {
    print(userId);

    try {
      final followersResponse = await ApiService.getFollowersCount(userId);

      if (followersResponse.statusCode == 200) {

        final followersData = json.decode(followersResponse.body);
        final int updatedFollowerCount = followersData['count'] ?? 0;

        print(updatedFollowerCount);

        setState(() {
          followerCount = updatedFollowerCount;
        });
      } else {
        print('Failed to fetch updated follower count');
      }
    } catch (e) {
      print('Error fetching updated follower count: $e');
    }
  }

  Future<void> _fetchArtistLanguages() async {
    try {
      final response = await ApiService.getArtistLanguages(widget.artistId);

      if (response.statusCode == 200) {
        final List<dynamic> responseData = json.decode(response.body);

        // Extract unique languages
        Set<String> uniqueLanguages = responseData.map<String>((lang) => lang.toString()).toSet();

        setState(() {
          _languages = uniqueLanguages.toList();
          _isLoadingLanguages = false; // Stop showing loader
        });
      } else {
        print('Failed to fetch artist languages.');
        setState(() {
          _languages = []; // Ensure empty list if API fails
          _isLoadingLanguages = false;
        });
      }
    } catch (e) {
      print('Error fetching artist languages: $e');
      setState(() {
        _languages = []; // Ensure empty list on error
        _isLoadingLanguages = false;
      });
    }
  }

  Future<void> _fetchGenres() async {
    try {
      final response = await ApiService.getArtistGenres(widget.artistId);

      if (response.statusCode == 200) {
        final List<dynamic> responseData = json.decode(response.body);

        // Extract unique genres
        Set<String> uniqueGenres = responseData.map<String>((genre) => genre.toString()).toSet();

        setState(() {
          _genres = uniqueGenres.toList();
          _isLoadingGenres = false; // Stop showing loader
        });
      } else {
        print('Failed to fetch artist genres.');
        setState(() {
          _genres = []; // Ensure empty list if API fails
          _isLoadingGenres = false;
        });
      }
    } catch (e) {
      print('Error fetching artist genres: $e');
      setState(() {
        _genres = []; // Ensure empty list on error
        _isLoadingGenres = false;
      });
    }
  }

  Future<void> _fetchProfileDetails() async {
    try {
      // Make the GET request to fetch user profile details (FullName and bio)
      final response = await ApiService.getUserProfileDetails(widget.artistId);

      if (response.statusCode == 200) {
        final responseBody = json.decode(response.body);

        // Extract FullName and bio from response, as the data is inside "S"
        if (responseBody != null) {
          setState(() {
            //_usernameController.text = responseBody['FullName']?['S'] ?? '';
            bio = responseBody['bio']?['S'] ?? '';
          });
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

  String getInitials(String fullName) {
    // Trim the full name to remove any leading or trailing spaces
    fullName = fullName.trim();

    if (fullName.isEmpty) {
      return ""; // Return empty string if the fullName is empty
    }

    // Split the full name by space and remove any empty elements (if any)
    List<String> nameParts = fullName.split(RegExp(r'\s+'));

    if (nameParts.length == 1) {
      // If only one name is provided, use the first letter of that name
      return nameParts[0][0].toUpperCase();
    } else if (nameParts.length > 1) {
      // If both first and last names are provided, use the first letter of both
      return nameParts[0][0].toUpperCase() + nameParts[1][0].toUpperCase();
    } else {
      return ""; // Return an empty string if no valid name parts are found
    }
  }

  Future<List<Map<String, String>>> _fetchSongsForLanguage(String language) async {
    try {
      final response = await ApiService.getSongsForLanguage(widget.artistId, language);

      if (response.statusCode == 200) {
        List<dynamic> songData = json.decode(response.body);

        if (songData.isEmpty) {
          // No songs available for this language
          return [];
        }

        return songData.map<Map<String, String>>((song) {
          return {
            'title': song['songName'] ?? 'Unknown',
            'artist': (song['stage_name'] != null && song['stage_name'].toString().trim().isNotEmpty)
                ? song['stage_name'].toString()
                : (song['FullName'] ?? 'Unknown Artist').toString(),
            'song_id': song['song_id'] ?? 'Unknown',
            'duration': song['span'] ?? '0:00',
            'coverPage': song['coverPageUrl'] ?? 'assets/logo.png',
            'streamingUrl': song['songStreamUrl'] ?? '',
            'languages': song['languages'] ?? '',
            'genre':song['genre']??'',
          };
        }).toList();
      } else {
        print('Failed to load songs for language "$language"');
        return [];
      }
    } catch (e) {
      print('Error fetching songs for language $language: $e');
      return [];
    }
  }

  List<Map<String, String>> _artistAlbums = [];
  bool _isLoadingAlbums = true;

  Future<void> _fetchAlbumsForArtist() async {
    try {
      final response = await ApiService.getArtistAlbums(widget.artistId);

      if (response.statusCode == 200) {
        final Map<String, dynamic> responseData = json.decode(response.body);
        final List<dynamic> albums = responseData['albums'] ?? [];

        setState(() {
          _artistAlbums = albums.map<Map<String, String>>((album) => {
            'albumName': album['albumName'] ?? 'Unknown Album',
            'coverPage': album['albumCoverUrl'] ?? 'assets/mic.jpg',
            'albumId': album['album_id'] ?? '',
          }).toList();
          _isLoadingAlbums = false;
        });
      } else {
        print('Failed to fetch albums. Status: ${response.statusCode}');
        setState(() => _isLoadingAlbums = false);
      }
    } catch (e) {
      print('Error fetching albums: $e');
      setState(() => _isLoadingAlbums = false);
    }
  }

  Future<List<Map<String, String>>> _fetchSongsForGenre(String genre) async {
    try {
      final response = await ApiService.getSongsForGenre(genre, widget.artistId);

      if (response.statusCode == 200) {
        List<dynamic> songData = json.decode(response.body);

        if (songData.isEmpty) {
          // No songs available for this genre
          return [];
        }

        return songData.map<Map<String, String>>((song) {
          return {
            'title': song['songName'] ?? 'Unknown',
            'artist': (song['stage_name'] != null && song['stage_name'].toString().trim().isNotEmpty)
                ? song['stage_name'].toString()
                : (song['FullName'] ?? 'Unknown Artist').toString(),
            'song_id': song['song_id'] ?? 'Unknown',
            'duration': song['span'] ?? '0:00',
            'coverPage': song['coverPageUrl'] ?? 'assets/logo.png',
            'streamingUrl': song['songStreamUrl'] ?? '',
            'languages': song['languages'] ?? '',
            'genre':song['genre']??'',
          };
        }).toList();
      } else {
        print('Failed to load songs for $genre');
        return [];
      }
    } catch (e) {
      print('Error fetching songs for genre $genre: $e');
      return [];
    }
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
  };

  final Map<String, String> genreCoverPages = {
    'Classical': 'https://voiz-webui-documents.s3.ap-south-1.amazonaws.com/classical.png',
    'Folk': 'https://voiz-webui-documents.s3.ap-south-1.amazonaws.com/Folk1.png',
    'Devotional': 'https://voiz-webui-documents.s3.ap-south-1.amazonaws.com/devotional+2.png',
    'Ghazal': 'https://voiz-webui-documents.s3.ap-south-1.amazonaws.com/ghazal.png',
    'Sufi': 'https://voiz-webui-documents.s3.ap-south-1.amazonaws.com/sufi.png',
    'Pop': 'https://voiz-webui-documents.s3.ap-south-1.amazonaws.com/pop.png',
    'Rock': 'https://voiz-webui-documents.s3.ap-south-1.amazonaws.com/rock.png',
    'Rap': 'https://voiz-webui-documents.s3.ap-south-1.amazonaws.com/rap2.png',
    'Jazz': 'https://voiz-webui-documents.s3.ap-south-1.amazonaws.com/jazz.png',
    'Rabindra Sangeet': 'https://voiz-webui-documents.s3.ap-south-1.amazonaws.com/rabindra+sangeet.png',
    'Fusion': 'https://voiz-webui-documents.s3.ap-south-1.amazonaws.com/fusion.png',
    'Romantic': 'https://voiz-webui-documents.s3.ap-south-1.amazonaws.com/romantic+2.png',
    'Others': 'https://voiz-webui-documents.s3.ap-south-1.amazonaws.com/others.png',
    'Kids':'https://voiz-webui-documents.s3.ap-south-1.amazonaws.com/others.png'
  };

  @override
  Widget build(BuildContext context) {
    Widget content = WillPopScope(
      onWillPop: () async {
        if (widget.isFromDeepLink) {
          Navigator.pushAndRemoveUntil(
            context,
            MaterialPageRoute(
              builder: (context) => NewHomePage(
                email: widget.userId,
                category: widget.category,
                userfullname: widget.userfullname,
              ),
            ),
                (Route<dynamic> route) => false,
          );
          return false;
        } else {
          Navigator.pop(context, updatedArtist);
          return true;
        }
      },
      child: GradientScaffold(
        body: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Cover Image and Profile Picture Stack
              Stack(
                alignment: Alignment.center,
                clipBehavior: Clip.none,
                children: [
                  // Cover Image
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
                        bottomLeft: Radius.circular(0),
                        bottomRight: Radius.circular(0),
                      ),
                      child: widget.coverImageUrl != null
                          ? CachedNetworkImage(
                        imageUrl: widget.coverImageUrl!,
                        fit: BoxFit.cover,
                        memCacheWidth: 800,
                        memCacheHeight: 600,
                        errorWidget: (context, url, error) => 
                            Image.asset('assets/default.jpg', fit: BoxFit.cover),
                      )
                          : Image.asset('assets/default.jpg', fit: BoxFit.cover),
                    ),
                  ),

                  Positioned(
                    top: 50,
                    left: 16,
                    child: GestureDetector(
                      onTap: () {
                        if (widget.isFromDeepLink) {
                          Navigator.pushAndRemoveUntil(
                            context,
                            MaterialPageRoute(
                              builder: (context) => NewHomePage(
                                email: widget.userId,
                                category: widget.category,
                                userfullname: widget.userfullname,
                              ),
                            ),
                                (Route<dynamic> route) => false,
                          );
                        } else {
                          Navigator.pop(context, updatedArtist);
                        }
                      },
                      child: Center(
                        child: CircleAvatar(
                          radius: 14,
                          backgroundColor: Color(0xFF100F32),
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

                  // Profile Picture
                  Positioned(
                    bottom: -40,
                    child: Container(
                      padding: EdgeInsets.all(3),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white,
                      ),
                      child: CircleAvatar(
                        radius: 40,
                        backgroundColor: Colors.grey,
                        child: widget.profileImageUrl != null
                            ? ClipOval(
                          child: CachedNetworkImage(
                            imageUrl: widget.profileImageUrl!,
                            fit: BoxFit.cover,
                            width: 90,
                            height: 90,
                            memCacheWidth: 180,
                            memCacheHeight: 180,
                            errorWidget: (context, url, error) => Center(
                              child: Text(
                                getInitials(widget.artistName),
                                style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 40,
                                ),
                              ),
                            ),
                          ),
                        )
                            : Center(
                          child: Text(
                            getInitials(widget.artistName),
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
              ),

              // Centered Profile Details with Share Icon
              SizedBox(height: 40),
              Stack(
                alignment: Alignment.center,
                children: [
                  Container(
                    width: double.infinity,
                    padding: EdgeInsets.symmetric(horizontal: 50), // Add padding to avoid text overlap with share icon
                    child: Text(
                      widget.artistName,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 24,
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  Positioned(
                    right: 16,
                    child: IconButton(
                      icon: Image.asset(
                        'assets/Share.png',
                        height: 35,
                        width: 35,
                      ),
                      onPressed: _shareArtistPage,
                    ),
                  ),
                ],
              ),

              // Rest of Profile Details
              Center(
                child: Column(
                  children: [
                    SizedBox(height: 8),
                    GestureDetector(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => FollowersFollowingPage(
                              artistId: widget.artistId,
                              artistName: widget.artistName,
                              profileImageUrl: widget.profileImageUrl,
                              coverImageUrl: widget.coverImageUrl,
                              userfullname: widget.userfullname,
                              category: widget.category,
                              userId: widget.userId,
                            ),
                          ),
                        );
                      },
                      child: Text(
                        '${updatedArtist.followerCount} Followers',
                        style: TextStyle(
                          fontSize: 16,
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          decoration: TextDecoration.underline,
                          decorationThickness: 2,
                        ),
                      ),
                    ),
                    SizedBox(height: 12),
                    if (widget.artistId != ProfileManager().getUserId())
                      SizedBox(
                        width: 100,
                        child: TextButton(
                          onPressed: _handleFollowToggle,
                          style: TextButton.styleFrom(
                            backgroundColor: updatedArtist.isFollowing
                                ? Colors.grey.shade600
                                : Color(0xFF2644D9),
                          ),
                          child: Text(
                            updatedArtist.isFollowing ? 'Unfollow' : 'Follow',
                            style: TextStyle(color: Colors.white),
                          ),
                        ),
                      ),

                    Padding(
                      padding: EdgeInsets.symmetric(horizontal: 24),
                      child: GestureDetector(
                        onTap: () {
                          setState(() {
                            _isBioExpanded = !_isBioExpanded;
                          });
                        },
                        child: Column(
                          children: [
                            Text(
                              bio,
                              textAlign: TextAlign.center,
                              maxLines: _isBioExpanded ? null : 2,
                              overflow: _isBioExpanded ? TextOverflow.visible : TextOverflow.ellipsis,
                              style: TextStyle(
                                fontSize: 15,
                                color: Colors.white,
                              ),
                            ),
                            if (bio.length > 100)
                              Text(
                                _isBioExpanded ? 'Show Less' : 'More',
                                style: TextStyle(
                                  fontSize: 14,
                                  color: Colors.blue,
                                ),
                              ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // Albums, Genres, and Languages Sections
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 📀 Albums
                  Padding(
                    padding: EdgeInsets.only(left: 16.0, top: 24.0),
                    child: Text(
                      'Albums',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  _isLoadingAlbums
                      ? Center(child: CircularProgressIndicator())
                      : _artistAlbums.isEmpty
                      ? Padding(
                    padding: EdgeInsets.only(left: 16.0),
                    child: Text(
                      'No albums available.',
                      style: TextStyle(color: Colors.white, fontSize: 16),
                    ),
                  )
                      : Container(
                    height: 200,
                    padding: EdgeInsets.only(top: 8),
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: EdgeInsets.only(left: 16.0),
                      itemCount: _artistAlbums.length,
                      itemBuilder: (context, index) {
                        final album = _artistAlbums[index];
                        final albumId = album['albumId']!;
                        final artistId = widget.artistId;

                        return GestureDetector(
                          onTap: () async { // Make the onTap function async
                            final List<Map<String, String>> albumSongs = await fetchSongsByAlbumId(artistId, albumId);

                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) => ListPage(
                                  navigationIndex: 1,
                                  email: widget.userId,
                                  fullname: widget.userfullname,
                                  Category: widget.category,
                                  bannerImage: album['coverPage']!,
                                  genreTitle: album['albumName']!,
                                  isAlbum: true,
                                  albumId: album['albumId']!,
                                  artistId: widget.artistId,
                                  originIndex: 1,
                                  songs: albumSongs, // Pass the fetched album songs here
                                ),
                              ),
                            );
                          },
                          child: Padding(
                            padding: const EdgeInsets.only(right: 12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(12),
                                  child: CachedNetworkImage(
                                    imageUrl: album['coverPage']!,
                                    height: 130,
                                    width: 130,
                                    fit: BoxFit.cover,
                                    memCacheWidth: 260,
                                    memCacheHeight: 260,
                                    errorWidget: (context, url, error) => 
                                        Image.asset(
                                          'assets/mic.jpg',
                                          height: 130,
                                          width: 130,
                                          fit: BoxFit.cover,
                                        ),
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Container(
                                  width: 130,
                                  child: Text(
                                    album['albumName']!,
                                    style: TextStyle(
                                        color: Colors.white, fontSize: 14),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),

                  // 🎼 Genres
                  Padding(
                    padding: EdgeInsets.only(left: 16.0, top: 24.0),
                    child: Text(
                      'Genre',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  _isLoadingGenres
                      ? Center(child: CircularProgressIndicator())
                      : _genres.isEmpty
                      ? Padding(
                    padding: EdgeInsets.only(left: 16.0),
                    child: Text(
                      'No genres available for this artist.',
                      style: TextStyle(color: Colors.white, fontSize: 16),
                    ),
                  )
                      : Container(
                    height: 200,
                    child: ListView(
                      padding: EdgeInsets.only(left: 16.0),
                      scrollDirection: Axis.horizontal,
                      children: _genres.map((genre) => genreCard(genre)).toList(),
                    ),
                  ),

                  // 🌍 Languages
                  Padding(
                    padding: EdgeInsets.only(left: 16.0, top: 24.0),
                    child: Text(
                      'Languages',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  _isLoadingLanguages
                      ? Center(child: CircularProgressIndicator())
                      : _languages.isEmpty
                      ? Padding(
                    padding: EdgeInsets.only(left: 16.0),
                    child: Text(
                      'No languages available for this artist.',
                      style: TextStyle(color: Colors.white, fontSize: 16),
                    ),
                  )
                      : Container(
                    height: 120,
                    child: ListView(
                      padding: EdgeInsets.only(left: 16.0),
                      scrollDirection: Axis.horizontal,
                      children: _languages
                          .map((language) => languageCard(language))
                          .toList(),
                    ),
                  ),

                  SizedBox(height: 20),
                ],
              ),
            ],
          ),
        ),
      ),
    );

    return Stack(
      children: [
        PageWithBottomNav(
          child: content,
          email: widget.userId,
          fullName: widget.userfullname,
          category: widget.category,
          currentIndex: 1, // 1 is for Search page
          isFromNewHomePage: false,
          nowPlayingTile: ValueListenableBuilder<bool>(
            valueListenable: isNowPlayingTileVisible,
            builder: (context, isVisible, _) {
              if (!isVisible) return const SizedBox();
              return NowPlayingTile(
                email: widget.userId,
                userFullName: widget.userfullname,
                userCategory: widget.category,
              );
            },
          ),
        ),
        LoadingScreen(
          isLoading: _isLoading,
          isNoInternet: _isNoInternet,
          onRetry: _checkConnectivity,
        ),
      ],
    );
  }

  Widget albumCard(String title, String imagePath) {
    return Column(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(10.0),
          child: CachedNetworkImage(
            imageUrl: imagePath,
            width: 120,
            height: 120,
            fit: BoxFit.cover,
            memCacheWidth: 240,
            memCacheHeight: 240,
            placeholder: (context, url) => Shimmer.fromColors(
              baseColor: Colors.grey[300]!,
              highlightColor: Colors.grey[100]!,
              child: Container(
                height: 120,
                width: 120,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
            errorWidget: (context, url, error) => Image.asset(
              'assets/mic.jpg',
              fit: BoxFit.cover,
              width: 120,
              height: 120,
            ),
            fadeInDuration: Duration(milliseconds: 200),
          ),
        ),
        SizedBox(height: 5),
        Text(
          title,
          style: TextStyle(color: Colors.white, fontSize: 16),
        ),
      ],
    );
  }

  Widget genreCard(String genre) {
    final String imagePath = genreCoverPages[genre] ??
        'https://voiz-webui-documents.s3.ap-south-1.amazonaws.com/others.png';

    return GestureDetector(
      onTap: () async {
        // Fetch songs for the selected genre
        final List<Map<String, String>> songs = await _fetchSongsForGenre(genre);

        // Navigate to ListPage with the fetched songs
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ListPage(
              genreTitle: genre,
              bannerImage: imagePath,
              email: widget.userId,
              Category: widget.category,
              fullname: widget.userfullname,
              navigationIndex: 1,
              originIndex: 1,
              isGenre: true,
              artistId: widget.artistId,
              songs: songs, // Pass the fetched songs
            ),
          ),
        );
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 140,
              height: 144,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(15),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(0),
                child: CachedNetworkImage(
                  imageUrl: imagePath,
                  fit: BoxFit.cover,
                  memCacheWidth: 280,
                  memCacheHeight: 288,
                  errorWidget: (context, url, error) => 
                      Image.asset('assets/default.jpg', fit: BoxFit.cover),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              genre,
              style: TextStyle(
                color: Color(0xBFFFFFFF),
                fontWeight: FontWeight.bold,
                fontSize: 16.83,
              ),
              textAlign: TextAlign.start,
            ),
          ],
        ),
      ),
    );
  }

  // Helper widget for language card
  // Helper widget for language card
  Widget languageCard(String language) {
    final String imagePath = languageCoverPages[language] ??
        'assets/default_lang.jpg';

    return GestureDetector(
      onTap: () async {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) =>
                ListPage(
                  navigationIndex: 1,
                  genreTitle: language,
                  // Pass the language as genreTitle
                  bannerImage: imagePath,
                  email: widget.userId,
                  songs: null,
                  // Do not pass songs, let ListPage fetch them
                  Category: widget.category,
                  fullname: widget.userfullname,
                  originIndex: 1,
                  isArtistByLanguage: true,
                  // Ensure this is true
                  artistId: widget.artistId,
                  // Pass the artist ID
                  highlightSongName: null,
                  // Optionally set later
                  highlightSongId: null, // Optionally set later
                ),
          ),
        ).then((_) {
          // Refresh logic if needed
          if (shouldRefresh) {
            _fetchArtistLanguages();
            _fetchGenres();
            _fetchProfileDetails();
          }
        });
      },
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: 8.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(0),
                  //child: Image.network(
                  child: Image.asset(
                    imagePath,
                    width: 70,
                    height: 70,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return Image.asset(
                        'assets/default_lang.jpg',
                        fit: BoxFit.cover,
                        width: 70,
                        height: 70,
                      );
                    },
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
            SizedBox(height: 5),
            Text(
              language,
              style: TextStyle(color: Color(0xBFFFFFFF), fontSize: 14),
            ),
          ],
        ),
      ),
    );
  }
}