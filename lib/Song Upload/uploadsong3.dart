// Song Upload/uploadsong3.dart
import 'dart:convert';
import 'dart:io';


import 'package:flutter/material.dart';


import 'package:voiceapp/NewHomepage.dart';
import 'package:voiceapp/adminlistsong.dart';
import 'package:voiceapp/bottomnavigationbar.dart';
import 'package:voiceapp/Song%20Upload/uploadsong1.dart';
import 'package:voiceapp/Song%20Upload/uploadsong2.dart';
import 'package:voiceapp/Song%20Upload/uploadsong4.dart';
import 'package:voiceapp/main.dart';
import 'package:voiceapp/connectivity_service.dart';
import 'package:voiceapp/loading_screen.dart';

class UploadSongThirdPage extends StatefulWidget {
  final Map<String, dynamic> onDataSubmitted;
  final bool isFromNewHomePage;

  UploadSongThirdPage({required this.onDataSubmitted, this.isFromNewHomePage = false,});
  

  @override
  _UploadSongThirdPageState createState() => _UploadSongThirdPageState();
}

class _UploadSongThirdPageState extends State<UploadSongThirdPage> {
  File? _audioFile;
  File? _lyricsFile;
  bool _isLoading = false;
  bool _isNoInternet = false;
  bool _mounted = true;
  late ConnectivityService _connectivityService;

  //late String email;
   late String fullName;
   late String email;
  // late String name;
  // late String stageName;
  // late String songName;
  // late String language;
  // late String genre;
  // late String mood;
  // late String story;
  late Map<String,String> credits;
  final TextEditingController _lyricistController = TextEditingController();
final TextEditingController _composerController = TextEditingController();
final TextEditingController _singerController = TextEditingController();
final TextEditingController _producerController = TextEditingController();
String? _lyricistError;
String? _composerError;
String? _singerError;
String? _producerError;

   @override
  void initState() {
    super.initState();
    _mounted = true;
    _connectivityService = ConnectivityService();
    _setupConnectivityListener();
    //_showSuccessDialog(context);
    //Future.delayed(Duration.zero, () => _showSuccessDialog(context));

    // Assign the values from the constructor to the variables
     fullName=widget.onDataSubmitted['fullName'];
     email = widget.onDataSubmitted['email'];
    // name = widget.onDataSubmitted['name'];
    // stageName = widget.onDataSubmitted['stage_name'];
    // songName = widget.onDataSubmitted['song_name'];
    // language = widget.onDataSubmitted['language'];
    // genre = widget.onDataSubmitted['genre'];
    // mood = widget.onDataSubmitted['mood'];
    // story = widget.onDataSubmitted['story'];
    //credits=widget.onDataSubmitted['credits'];
  
  }
  void _setupConnectivityListener() {
    _connectivityService.connectionStream.listen((hasConnection) {
      if (!_mounted) return;

      setState(() {
        _isNoInternet = !hasConnection;
      });

      if (hasConnection && _isNoInternet) {
        _initializeData();
      }
    });

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

   bool _validateInputs() {
    setState(() {


    _lyricistError = _lyricistController.text.isEmpty ? 'Lyricist is required' : null;
    _composerError = _composerController.text.isEmpty ? 'Composer is required' : null;
    _singerError = _singerController.text.isEmpty ? 'Singer is required' : null;
    _producerError = _producerController.text.isEmpty ? 'Producer is required' : null;
    
    });

    return 
        _lyricistError == null &&
      _composerError == null &&
      _singerError == null &&
      _producerError == null;
        
        //_genreError == null;
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
     setState(() {
      //_isSubmitted = true; // Indicate user has pressed "Next"
       _lyricistError = _lyricistController.text.isEmpty ? 'Lyricist is required' : null;
       _composerError = _composerController.text.isEmpty ? 'Composer is required' : null;
       _singerError = _singerController.text.isEmpty ? 'Singer is required' : null;
       _producerError = _producerController.text.isEmpty ? 'Producer is required' : null;
    });
    if (_validateInputs()) {
      
      // Map<String, dynamic> formData = {
        // 'genre': _selectedGenre,
        // 'mood': _moodController.text.isNotEmpty ? _moodController.text : '',
        // 'story': _storyController.text,
      // Capitalize the names
      String capitalizedSinger = capitalizeWords(_singerController.text.trim());
      String capitalizedComposer = capitalizeWords(_composerController.text.trim());
      String capitalizedLyricist = capitalizeWords(_lyricistController.text.trim());
      String capitalizedProducer = capitalizeWords(_producerController.text.trim());

      // Update the controllers with capitalized values
      _singerController.text = capitalizedSinger;
      _composerController.text = capitalizedComposer;
      _lyricistController.text = capitalizedLyricist;
      _producerController.text = capitalizedProducer;

      Map<String, dynamic> formData = {
        'lyricist': capitalizedLyricist,
        'composer': capitalizedComposer,
        'singer': capitalizedSinger,
        'producer': capitalizedProducer,

        ...widget.onDataSubmitted, // Merging with data from the first page
      };
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => UploadSongFourthPage(
            onDataSubmitted: formData,
          ),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Please fill out all fields'),
      ));
    }
  }


  
  
  

 

    @override
  Widget build(BuildContext context) {

    double screenHeight = MediaQuery.of(context).size.height;
    Widget content = GradientScaffold(
      //backgroundColor: Color(0xFF0F0F1E),
      appBar: AppBar(
           automaticallyImplyLeading:false,
       backgroundColor: Colors.transparent,
        elevation: 0, // No shadow under the app bar
        title: Padding(
          padding: const EdgeInsets.only(left: 0.0,top:0.0), // Add padding to the logo
          // child: Image.asset(
          //   'assets/logo.png', // Your logo asset
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
                  MaterialPageRoute(builder: (context) => AdminSongList(userId: email, userfullname: fullName,)),
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
               SizedBox(height: screenHeight * 0.06),
              Center(
                child: Text(
                  "Update Credits",
                  style: TextStyle(
                    fontSize: 32,
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              SizedBox(height: screenHeight * 0.05),

              // Padding(
              //   padding: const EdgeInsets.only(left: 7),
              //   child: Text("Credits: " ,style: TextStyle(
              //     fontSize: 24,
              //     fontWeight: FontWeight.bold
              //   ),),
              // ),
              SizedBox(height: screenHeight * 0.015),
              // Lyricist, Composer, Singer, Producer text fields
              
              buildTextField(_singerController, "Singer", errorText: _singerError),
              buildTextField(_composerController, "Composer", errorText: _composerError),
               buildTextField(_lyricistController, "Lyricist", errorText: _lyricistError),
              buildTextField(_producerController, "Producer", errorText: _producerError),

              SizedBox(height: 10),

              // Choose File section in a single row
              // Row(
              //   children: [
              //     Expanded(
              //       child: buildFilePicker('Lyrics', _lyricsFile, _pickLyricsFile),
              //     ),
              //     SizedBox(width: 16),
              //     Expanded(
              //       child: buildFilePicker('Audio', _audioFile, _pickAudioFile),
              //     ),
              //   ],
              // ),
              SizedBox(height: screenHeight * 0.06),

              Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(height: 4, width: 75, color: Colors.white),
                SizedBox(width: 4),
                Container(height: 4, width: 75, color: Colors.white),
                SizedBox(width: 4),
                Container(height: 4, width: 75, color: Colors.white),
                SizedBox(width: 4),
                Container(height: 4, width: 75, color: Color(0xFF120B0B)),
              ],
            ),

             SizedBox(height: screenHeight * 0.04),


              

              Center(
                child: ElevatedButton(
                  onPressed: _onNextPressed,
                  child: Text(
    'Next',
    style: TextStyle(
      color: Colors.white, // Set text color here
      fontSize: 23, // Set the font size here
      fontWeight: FontWeight.bold, // You can also adjust the font weight if needed
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
            ],
          ),
        ),
      ),

    );

    Widget finalWidget;
    if (widget.isFromNewHomePage) {
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
      finalWidget = Stack(
          children: [
            PageWithBottomNav(
              child: content,
              email: email,
              fullName: fullName,
              category: 'Singer',
              currentIndex: 2,
              isFromNewHomePage: widget.isFromNewHomePage,
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
      }) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(5, 0, 5, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            controller: controller,
            style: TextStyle(color: Colors.black,decorationThickness: 0,fontFamily: 'Poppins'),
            decoration: InputDecoration(
              label: RichText(
          text: TextSpan(
            text: label, // Label text (e.g., 'Name')
            style: TextStyle(color: Colors.black, fontSize: 18,fontFamily: 'Poppins'), // Default label style
            children: required
                ? [
                    // TextSpan(
                    //   text: ' *',
                    //   style: TextStyle(color: Colors.black), // Red asterisk for required fields
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
              //errorText: errorText, // Display error message
              suffixIcon: infoText != null
                  ? InfoIconWithCustomTooltip(title: label,infoText: infoText)
                  : null,
            ),
            cursorColor: Colors.black,
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

  Widget buildFilePicker(String label, File? file, VoidCallback pickFile,{bool isRequired = true}) {
    return GestureDetector(
      onTap: pickFile,
      child: Container(
        padding: EdgeInsets.symmetric(vertical: 15.0, horizontal: 5.0),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.black, width: 2.0),
          borderRadius: BorderRadius.circular(12.0),
          color: Colors.blue,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: <Widget>[
            Expanded(
              child: RichText(
              text: TextSpan(
                text: file == null ? 'Upload $label' : file.path.split('/').last,
                style: TextStyle(fontSize: 16.0, color: Colors.white),
                children: isRequired
                    ? [
                        // TextSpan(
                        //   text: ' *',
                        //   style: TextStyle(color: Colors.red), // Red asterisk for required fields
                        // ),
                      ]
                    : [],
              ),
              overflow: TextOverflow.ellipsis,
            ),
          
            ),
            Icon(
              Icons.file_upload,
              color: Colors.white,
            ),
          ],
        ),
      ),
    );
  }


 

}
