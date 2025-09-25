// Song Upload/uploadsong1.dart
import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:ui';

import 'package:dropdown_button2/dropdown_button2.dart';
import 'package:flutter/material.dart';//import 'package:flutter/material.dart';
import 'package:voiceapp/NewHomepage.dart';
import 'package:voiceapp/adminlistsong.dart';
import 'package:voiceapp/main.dart';
import 'package:voiceapp/profile_manager.dart';
import 'package:voiceapp/Song%20Upload/uploadsong2.dart';
import 'package:voiceapp/services/api_service.dart';

import '../bottomnavigationbar.dart';
import 'package:voiceapp/connectivity_service.dart';
import 'package:voiceapp/loading_screen.dart';

class Song {
  final String songName;

  Song({
    required this.songName,
  });

  factory Song.fromJson(Map<String, dynamic> json) {
    return Song(
      songName: (json['songName'] ?? '').toString().trim(),
    );
  }

  // Add toJson method if needed for sending data back to API
  Map<String, dynamic> toJson() {
    return {
      'songName': songName,
    };
  }
}

class SongResponse {
  final List<Song> songs;

  SongResponse({required this.songs});

  factory SongResponse.fromJson(List<dynamic> json) {
    List<Song> songs = json.map((songJson) => Song.fromJson(songJson)).toList();
    return SongResponse(songs: songs);
  }
}



// Assuming you have NewHomePage defined here
class UploadSongFirstPage extends StatefulWidget {
  final String email;
  final String fullName;
  final bool showGlobalNavBar;
  final bool isFromNewHomePage;

  UploadSongFirstPage({required this.email, required this.fullName,this.showGlobalNavBar = false,this.isFromNewHomePage = false});

  @override
  _UploadSongFirstPageState createState() => _UploadSongFirstPageState();
}

class _UploadSongFirstPageState extends State<UploadSongFirstPage> {
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _stageNameController = TextEditingController();
  final TextEditingController _songNameController = TextEditingController();
  String? _selectedLanguage;
  bool _mounted = true;
  String? _selectedgenre;
  String? _genreError;
  bool _isLoading = true;
  bool _isNoInternet = false;
  late ConnectivityService _connectivityService;


  //final List<String> _languages = ['English', 'Marathi', 'Hindi', 'Bengali'];

  String? _nameError;
  //String? _stageNameError;
  String? _songNameError;
  String? _languageError;
  bool _needsUpdate = true;
  List<String> _uploadedSongs = [];
  String stagename='';
  final FocusNode _songNameFocusNode = FocusNode();
  bool _isDuplicateWarningShown = false;


  @override
  void initState() {
    super.initState();
    _mounted = true;
    // Add these lines
    _connectivityService = ConnectivityService();
    _setupConnectivityListener();
    _fetchUploadedSongs();

    // Use addPostFrameCallback to update state after build
    if (mounted) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;

        // Listen to username changes
        final usernameListener = () {
          if (!mounted) return;
          setState(() {
            _nameController.text = ProfileManager().username.value ?? '';
            stagename = ProfileManager().username.value ?? '';
          });
        };

        ProfileManager().username.addListener(usernameListener);

        // Store the listener for cleanup
        _nameController.addListener(() {
          if (!mounted) {
            ProfileManager().username.removeListener(usernameListener);
          }
        });

        // Initialize with current username
        ProfileManager().fetchUpdatedUsername().then((_) {
          if (!mounted) return;
          setState(() {
            _nameController.text = ProfileManager().username.value ?? '';
            stagename = ProfileManager().username.value ?? '';
          });
        });
      });
    }
  }
  void _setupConnectivityListener() {
    _connectivityService.connectionStream.listen((hasConnection) {
      // if (!_mounted) return; // Skip if component is unmounted
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
      await _fetchUploadedSongs();
      await _fetchAndSetUsername();

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
    // Remove all listeners
    ProfileManager().username.removeListener(() {});
    _songNameController.dispose();
    _nameController.dispose();
    _stageNameController.dispose();
    _songNameFocusNode.dispose();
    _connectivityService.dispose(); // Add this line
    super.dispose();
  }



  // Fetch the updated username from ProfileManager
  Future<void> _fetchAndSetUsername() async {
    final profileManager = ProfileManager();
    await profileManager.fetchUpdatedUsername(); // Fetch the latest username
    setState(() {
      _nameController.text = profileManager.username.value ?? widget.fullName;
      stagename=profileManager.username.value??widget.fullName;
    });
  }



  Future<void> _fetchUploadedSongs() async {
    try {
      final userId = widget.email;

      print('Fetching songs for user: $userId'); // Debug log

      if (userId == null || userId.isEmpty) {
        print('Error: Invalid user ID');
        setState(() {
          _uploadedSongs = [];
        });
        return;
      }

      final response = await ApiService.getArtistAllSongs(userId);

      print('Response status code: ${response.statusCode}'); // Debug log
      print('Response body: ${response.body}'); // Debug log

      if (ApiService.isSuccessResponse(response)) {
        final dynamic decodedResponse = ApiService.parseJsonResponse(response);
        List<dynamic> songsData;

        if (decodedResponse is Map<String, dynamic>) {
          if (decodedResponse.containsKey('data')) {
            songsData = decodedResponse['data'] as List<dynamic>;
          } else {
            songsData = [decodedResponse];
          }
        } else if (decodedResponse is List) {
          songsData = decodedResponse;
        } else {
          throw FormatException('Unexpected response format');
        }

        setState(() {
          _uploadedSongs = songsData
              .map((song) => (song['songName'] ?? '').toString().trim().toLowerCase())
              .where((songName) => songName.isNotEmpty)
              .toList();
        });

        print('Successfully fetched ${_uploadedSongs.length} songs');
        print('Songs: $_uploadedSongs');

      } else {
        print('API Error: Status code ${response.statusCode}');
        print('Response body: ${response.body}');
        setState(() {
          _uploadedSongs = [];
        });
      }
    } on SocketException catch (e) {
      print('Network Error: ${e.message}');
      setState(() {
        _uploadedSongs = [];
      });
    } on TimeoutException catch (e) {
      print('Timeout Error: ${e.message}');
      setState(() {
        _uploadedSongs = [];
      });
    } on FormatException catch (e) {
      print('Data Format Error: ${e.message}');
      setState(() {
        _uploadedSongs = [];
      });
    } catch (e, stackTrace) {
      print('Unexpected Error: $e');
      print('Stack trace: $stackTrace');
      setState(() {
        _uploadedSongs = [];
      });
    }
  }




  //String? _genreError;y


  bool _validateInputs() {
    setState(() {
      _nameError = _nameController.text.isEmpty ? 'Name is required' : null;
      //_stageNameError = _stageNameController.text.isEmpty ? 'Stage name is required' : null;
      _songNameError = _songNameController.text.isEmpty ? 'Song name is required' : null;
      _languageError = _selectedLanguage == null ? 'Language is required' : null;
      _genreError = _selectedgenre == null ? 'Genre is required' : null;
    });




    return _nameError == null &&
        //_stageNameError == null &&
        _songNameError == null &&
        _languageError == null &&
        _genreError == null;
  }


  String capitalizeWords(String input) {
    if (input.isEmpty) return input;

    return input
        .split(' ')
        .map((word) {
      if (word.isEmpty) return word;
      return word[0].toUpperCase() + word.substring(1).toLowerCase();
    })
        .join(' ');
  }



  void _onNextPressed() {
    if (_isNoInternet) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('No internet connection. Please check your connection and try again.'),
        duration: Duration(seconds: 3),
      ));
      return;
    }
    if (_validateInputs()) {

      // Capitalize the song name
      String capitalizedSongName = capitalizeWords(_songNameController.text.trim());

      // Update the song name controller with capitalized text
      _songNameController.text = capitalizedSongName;

      // Check if song name is a duplicate
      if (_uploadedSongs.contains(_songNameController.text.trim().toLowerCase()) && !_isDuplicateWarningShown) {
        // Show duplicate warning dialog on the first attempt
        _showDuplicateSongDialog();
      } else {
        // Allow navigation on the second attempt or if there's no duplicate
        _navigateToNextPage();
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Please fill out all fields'),
      ));
    }
  }

  void _navigateToNextPage() {
    String stageName = _stageNameController.text.isNotEmpty ? _stageNameController.text : _nameController.text;
    Map<String, dynamic> formData = {
      'name': _nameController.text,
      'stage_name': stageName,
      'song_name': _songNameController.text,
      'language': _selectedLanguage,
      'genre': _selectedgenre,
      'email': ProfileManager().getUserId(),
      'fullName': widget.fullName,
    };
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => UploadSongSecondPage(
          onDataSubmitted: formData,
        ),
      ),
    );
  }

  void _showDuplicateSongDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        elevation: 15,
          backgroundColor: Color(0xFF151415),
          title: Text("Duplicate Song Detected",textAlign: TextAlign.center,style: TextStyle(fontSize: 24,fontWeight: FontWeight.w500),),
        content: Text("This song has already been uploaded by you. Do you want to continue?",textAlign: TextAlign.center,),
        actions: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              TextButton(
                onPressed: () => Navigator.pop(context), // Close dialog
                child: Text("Cancel", style: TextStyle(color: Colors.white,fontWeight: FontWeight.w500,fontFamily: 'poppins',fontSize: 18)),
              ),
              SizedBox(width: 20),
              TextButton(
                onPressed: () {
                  Navigator.pop(context); // Close dialog
                  _isDuplicateWarningShown = true; // Set flag to allow navigation on second attempt
                  _songNameFocusNode.requestFocus(); // Shift focus to song name field
                },
                child: Text("Proceed", style: TextStyle(color: Colors.white,fontWeight: FontWeight.w500,fontFamily: 'poppins',fontSize: 18)),
              ),
            ],
          ),

        ],
      ),
    );
  }


  @override
  Widget build(BuildContext context) {
    double screenHeight = MediaQuery.of(context).size.height;
    double offsetFromBottom = screenHeight * 0.2;

    Widget content = GradientScaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        backgroundColor: Colors.transparent,
        toolbarHeight: kToolbarHeight + 15,
        elevation: 0,
        title: Padding(
          padding: const EdgeInsets.only(left: 0.0, top: 0.0),
          // child: Image.asset(
          //   'assets/logo.png',
          //   height: 50,
          // ),
        ),
        actions: [
          IconButton(
            icon: Image.asset(
              'assets/upload_new.png',
              height: 30,
              width: 30,
            ),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => AdminSongList(
                    userId: widget.email,
                    userfullname: widget.fullName
                )),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(height: screenHeight * 0.12),
              Center(
                child: Text(
                  "About Your Song",
                  style: TextStyle(
                    fontSize: 32,
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              Opacity(opacity: 0.0,
                  child: Column(
                    children: [
                      // SizedBox(height: screenHeight * 0.09),
                      ValueListenableBuilder<String?>(
                        valueListenable: ProfileManager().username,
                        builder: (context, username, child) {
                          return buildTextField(_nameController, "Name",
                              errorText: _nameError,
                              enabled: false
                          );
                        },
                      ),
                    ],
                  )),

              buildTextField1(_songNameController, "Song Name",
                  errorText: _songNameError
              ),
              CustomDropdownField(
                value: _selectedLanguage,
                label: 'Language',
                items: [
                  'Assamese', 'Bengali', 'Bhojpuri', 'English',
                  'Gujarati', 'Hindi', 'Kannada', 'Kashmiri',
                  'Konkani', 'Malayalam', 'Manipuri', 'Marathi',
                  'Odia', 'Pahari', 'Punjabi', 'Rajasthani',
                  'Sanskrit', 'Tamil', 'Telugu', 'Urdu'
                ],
                onChanged: (String? newValue) {
                  setState(() {
                    _selectedLanguage = newValue;
                  });
                },
                errorText: _languageError,

              ),
              SizedBox(height: 13.0), // Add spacing between dropdowns
              CustomDropdownField(
                value: _selectedgenre,
                label: 'Genre',
                items: ['Classical',
                  'Devotional',
                  'Folk',
                  'Fusion',
                  'Ghazal',
                  'Jazz',
                  'Pop',
                  'Rabindra Sangeet',
                  'Rap',
                  'Rock',
                  'Romantic',
                  'Sufi',
                  'Others',],
                onChanged: (String? newValue) {
                  setState(() {
                    _selectedgenre = newValue;
                  });
                },
                errorText: _genreError,
              ),
              SizedBox(height: screenHeight * 0.14),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(height: 4, width: 75, color: Colors.white),
                  SizedBox(width: 4),
                  Container(height: 4, width: 75, color: Color(0xFF120B0B)),
                  SizedBox(width: 4),
                  Container(height: 4, width: 75, color: Color(0xFF120B0B)),
                  SizedBox(width: 4),
                  Container(height: 4, width: 75, color: Color(0xFF120B0B)),
                ],
              ),
              SizedBox(height: screenHeight * 0.02),
              Center(
                child: ElevatedButton(
                  onPressed: _onNextPressed,
                  child: Text(
                    'Next',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 23,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Color(0xFF2644D9),
                    minimumSize: Size(250, 50),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(30),
                    ),
                  ),
                ),
              ),
              SizedBox(height: screenHeight * 0.02),
              // Add padding for bottom navigation bar
              SizedBox(height: kBottomNavigationBarHeight + 20),
            ],
          ),
        ),
      ),
    );

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
      finalWidget = Stack(
          children: [
            PageWithBottomNav(
              child: content,
              email: widget.email,
              fullName: widget.fullName,
              category: 'Singer',
              currentIndex: 2,
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

    return finalWidget;
  }

  Widget buildTextField(
      TextEditingController controller, String label, {
        bool required = true,
        String? infoText,
        String? errorText,
        bool enabled = true,
      }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: double.infinity, // Takes the full available width
            height: 60, // Set a fixed height for consistency
            child: TextField(
              enabled: enabled,
              controller: controller,
              style: TextStyle(color: Colors.black),
              decoration: InputDecoration(
                label: RichText(
                  text: TextSpan(
                    text: label,
                    style: TextStyle(color: Colors.black, fontSize: 16),
                    children: required
                        ? [
                      // TextSpan(
                      //   text: ' *', // Asterisk for required fields
                      //   style: TextStyle(color: Colors.black),
                      // ),
                    ]
                        : [],
                  ),
                ),
                labelStyle: TextStyle(color: Colors.black),
                fillColor: Colors.white,
                filled: true,
                floatingLabelBehavior: FloatingLabelBehavior.never,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8.0),
                  borderSide: BorderSide(color: Colors.black, width: 1.0),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8.0),
                  borderSide: BorderSide(color: Colors.black, width: 1.0),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8.0),
                  borderSide: BorderSide(color: Colors.black, width: 2.0),
                ),
                suffixIcon: infoText != null
                    ? InfoIconWithCustomTooltip(title: label,infoText: infoText)
                    : null,
              ),
              cursorColor: Colors.black,
            ),
          ),
          if (errorText != null)
            Padding(
              padding: const EdgeInsets.only(top: 4.0),
              child: Text(
                errorText,
                style: TextStyle(color: Colors.red, fontSize: 12),
              ),
            ),
        ],
      ),
    );
  }

  Widget buildTextField1(
      TextEditingController controller, String label, {
        bool required = true,
        String? infoText,
        String? errorText,
        bool enabled = true,
      }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 13.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: double.infinity, // Takes the full available width
            height: 60, // Set a fixed height for consistency
            child: TextField(
              enabled: enabled,
              controller: controller,
              style: TextStyle(color: Colors.black,decorationThickness: 0),
              decoration: InputDecoration(
                label: RichText(
                  text: TextSpan(
                    text: label,
                    style: TextStyle(color: Colors.black, fontSize: 16,fontFamily: 'Poppins',),
                    children: required
                        ? [
                      // TextSpan(
                      //   text: ' *', // Asterisk for required fields
                      //   style: TextStyle(color: Colors.black),
                      // ),
                    ]
                        : [],
                  ),
                ),
                labelStyle: TextStyle(color: Colors.black),
                fillColor: Color(0xFFFFFFFF).withOpacity(0.8),
                filled: true,
                floatingLabelBehavior: FloatingLabelBehavior.never,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8.0),
                  borderSide: BorderSide(color: Colors.black, width: 1.0),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8.0),
                  borderSide: BorderSide(color: Colors.black, width: 1.0),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8.0),
                  borderSide: BorderSide(color: Colors.black, width: 2.0),
                ),
                suffixIcon: infoText != null
                    ? InfoIconWithCustomTooltip(title: label,infoText: infoText)
                    : null,
              ),
              cursorColor: Colors.black,
            ),
          ),
          if (errorText != null)
            Padding(
              padding: const EdgeInsets.only(top: 4.0),
              child: Text(
                errorText,
                style: TextStyle(color: Colors.red, fontSize: 12),
              ),
            ),
        ],
      ),
    );
  }


}







class SpeechBubblePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Color(0xFF1A1B35) // Dark navy blue color
      ..style = PaintingStyle.fill;

    final path = Path();

    final RRect roundedRect = RRect.fromRectAndRadius(
      Rect.fromLTWH(0, 0, size.width, size.height),
      Radius.circular(20), // Slightly reduced radius for smaller width
    );

    path.addRRect(roundedRect);
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) {
    return false;
  }
}

class CustomTooltip extends StatelessWidget {
  final String title;
  final String message;

  CustomTooltip({
    required this.title,
    required this.message,
  });

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: SpeechBubblePainter(),
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        width: 220, // Reduced width
        height: 110,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title, // Title text
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
            SizedBox(height: 10),
            Text(
              message,
              style: TextStyle(
                color: Colors.white.withOpacity(0.7),
                fontSize: 16,
                fontStyle: FontStyle.italic,
                height: 1.3,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class InfoIconWithCustomTooltip extends StatefulWidget {
  final String title;
  final String infoText;

  InfoIconWithCustomTooltip({required this.title, required this.infoText});

  @override
  _InfoIconWithCustomTooltipState createState() => _InfoIconWithCustomTooltipState();
}

class _InfoIconWithCustomTooltipState extends State<InfoIconWithCustomTooltip> {
  final GlobalKey _toolTipKey = GlobalKey();
  OverlayEntry? _overlayEntry;
  bool _isOverlayVisible = false;

  // Add a static variable to track if any tooltip is currently showing
  static bool isAnyTooltipVisible = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      key: _toolTipKey,
      onTap: () => _showOverlay(context),
      child: Container(
        width: 20,
        height: 20,
        child: Center(
          child: Icon(
            Icons.info_outline,
            color: Colors.black,
            size: 32,
          ),
        ),
      ),
    );
  }

  void _showOverlay(BuildContext context) {
    _overlayEntry?.remove();

    final overlay = Overlay.of(context);
    final renderBox = _toolTipKey.currentContext?.findRenderObject() as RenderBox?;
    final offset = renderBox?.localToGlobal(Offset.zero) ?? Offset.zero;

    _overlayEntry = OverlayEntry(
      builder: (context) => Material(
        color: Colors.transparent,
        child: WillPopScope(
          onWillPop: () async {
            if (_isOverlayVisible) {
              _removeOverlay();
              return false;
            }
            return true;
          },
          child: Stack(
            children: [
              Positioned.fill(
                child: GestureDetector(
                  onTap: _removeOverlay,
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 4, sigmaY: 4),
                    child: Container(
                      color: Colors.black.withOpacity(0.5),
                    ),
                  ),
                ),
              ),
              Positioned(
                left: offset.dx - 200,
                top: offset.dy - 70,
                child: GestureDetector(
                  onTap: () {},
                  child: CustomTooltip(
                    title: widget.title,
                    message: widget.infoText,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );

    setState(() {
      _isOverlayVisible = true;
      isAnyTooltipVisible = true;
    });
    overlay.insert(_overlayEntry!);
  }

  void _removeOverlay() {
    _overlayEntry?.remove();
    _overlayEntry = null;
    setState(() {
      _isOverlayVisible = false;
      isAnyTooltipVisible = false;
    });
  }

  @override
  void dispose() {
    _removeOverlay();
    super.dispose();
  }
}

// Helper method to check if any tooltip is visible
bool isTooltipVisible() {
  return _InfoIconWithCustomTooltipState.isAnyTooltipVisible;
}
class CustomDropdownField extends StatelessWidget {
  final String? value;
  final String label;
  final List<String> items;
  final Function(String?) onChanged;
  final String? errorText;

  const CustomDropdownField({
    Key? key,
    required this.value,
    required this.label,
    required this.items,
    required this.onChanged,
    this.errorText,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    double screenWidth = MediaQuery.of(context).size.width;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: double.infinity,
          child: DropdownButton2<String>(
            value: value,
            isExpanded: true,
            underline: Container(),
            dropdownStyleData: DropdownStyleData(
              maxHeight: 150,
              width: 230,
              padding: EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
                color: Color(0xFF211F20),
              ),
              offset: Offset(screenWidth - 200, -4),
            ),
            buttonStyleData: ButtonStyleData(
              height: 55,
              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: Color(0xFFFFFFFF).withOpacity(0.8),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.black, width: 1.0),
              ),
            ),
            iconStyleData: IconStyleData(
              icon: Image.asset(
                'assets/DropMenuVector.png', // Make sure this path matches your asset declaration in pubspec.yaml
                width: 24,
                height: 24,
              ),
              iconSize: 24,
              iconEnabledColor: Colors.black,
            ),
            menuItemStyleData: MenuItemStyleData(
              height: 40,
              padding: EdgeInsets.symmetric(horizontal: 16),
            ),
            items: items.map<DropdownMenuItem<String>>((String item) {
              return DropdownMenuItem<String>(
                value: item,
                child: Text(
                  item,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontFamily: 'Poppins',
                  ),
                ),
              );
            }).toList(),
            selectedItemBuilder: (context) {
              return items.map<Widget>((String item) {
                return Container(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    item,
                    style: TextStyle(
                      color: Colors.black,
                      fontSize: 16,
                      fontFamily: 'Poppins',
                    ),
                  ),
                );
              }).toList();
            },
            hint: Text(
              label,
              style: TextStyle(
                color: Colors.black,
                fontSize: 16,
                fontFamily: 'Poppins',
              ),
            ),
            onChanged: onChanged,
          ),
        ),
        if (errorText != null)
          Padding(
            padding: const EdgeInsets.only(top: 4.0),
            child: Text(
              errorText!,
              style: TextStyle(
                color: Colors.red,
                fontSize: 12,
                fontFamily: 'Poppins',
              ),
            ),
          ),
      ],
    );
  }
}