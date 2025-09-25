// Song Upload/uploadsong4.dart
import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:ui';

import 'package:audio_duration/audio_duration.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:voiceapp/NewHomepage.dart';
import 'package:voiceapp/adminlistsong.dart';
import 'package:voiceapp/bottomnavigationbar.dart';

import 'package:voiceapp/services/api_service.dart';
import 'package:voiceapp/main.dart';

import '../audio_service1.dart';
import '../profile_manager.dart';
import 'package:voiceapp/connectivity_service.dart';
import 'package:voiceapp/loading_screen.dart';

class UploadSongFourthPage extends StatefulWidget {
  final Map<String, dynamic> onDataSubmitted;
  final bool isFromNewHomePage;

  UploadSongFourthPage({required this.onDataSubmitted,this.isFromNewHomePage = false});

  @override
  _UploadSongFourthPageState createState() => _UploadSongFourthPageState();
}

class _UploadSongFourthPageState extends State<UploadSongFourthPage> {
   File? _audioFile;
  File? _lyricsFile;
   

  bool _isTermsAccepted = false;
  bool _isContentPolicyAccepted = false;
  bool _isCopyrightAccepted = false;
  bool _isLoading = false;
   final GlobalKey _lyricsInfoKey = GlobalKey();
  final GlobalKey _audioInfoKey = GlobalKey();
  bool _isaudioloading=false;
  bool _isSuccessDialogOpen = false;
  bool _isLyricsButtonLoading = false;
  bool _isSongButtonLoading = false;
   bool _isNoInternet = false;
   bool _mounted = true;
   late ConnectivityService _connectivityService;


   late String fullName;
   late String email;
  late String name;
  late String stageName;
  late String songName;
  late String language;
  late String genre;
  late String mood;
  late String story;
  late String lyricist;
  late String composer;
  late String singer;
  late String producer;

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
    name = widget.onDataSubmitted['name'];
    stageName = widget.onDataSubmitted['stage_name'];
    songName = widget.onDataSubmitted['song_name'];
    language = widget.onDataSubmitted['language'];
    genre = widget.onDataSubmitted['genre'];
    mood = widget.onDataSubmitted['mood'];
    story = widget.onDataSubmitted['story'];
    lyricist= widget.onDataSubmitted['lyricist'];
  composer= widget.onDataSubmitted['composer'];
  singer= widget.onDataSubmitted['singer'];
  producer= widget.onDataSubmitted['producer'];
    //credits=widget.onDataSubmitted['credits'];

  //   Future.delayed(Duration.zero, () {
  //   _showSuccessDialog(context);
  // });
  
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


 Future<void> _pickAudioFile() async {
    setState(() => _isSongButtonLoading = true);
    
    try {
      final result = await FilePicker.platform.pickFiles(type: FileType.audio);

      if (result != null) {
        final file = File(result.files.single.path!);
        final fileExtension = file.path.split('.').last.toLowerCase();
        const supportedAudioFormats = ['mp3', 'wav'];

        if (supportedAudioFormats.contains(fileExtension)) {
          setState(() => _audioFile = file);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Unsupported audio format. Supported formats are .mp3 and .wav.'))
          );
        }
      }
    } finally {
      setState(() => _isSongButtonLoading = false);
    }
  }

// Method to pick a lyrics file
Future<void> _pickLyricsFile() async {
    setState(() => _isLyricsButtonLoading = true);
    
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['txt', 'doc', 'docx', 'pdf'],
      );

      if (result != null) {
        final file = File(result.files.single.path!);
        final fileExtension = file.path.split('.').last.toLowerCase();
        const supportedLyricsFormats = ['txt', 'doc', 'docx', 'pdf'];

        if (supportedLyricsFormats.contains(fileExtension)) {
          setState(() => _lyricsFile = file);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Unsupported lyrics format. Supported formats are .doc, .pdf, and .txt.'))
          );
        }
      }
    } finally {
      setState(() => _isLyricsButtonLoading = false);
    }
  }

 bool get _canUpload => _isTermsAccepted && _isContentPolicyAccepted && _isCopyrightAccepted;

  void _onCheckboxChanged(bool? value, String checkboxType) {
    setState(() {
      if (checkboxType == 'terms') {
        _isTermsAccepted = value ?? false;
      } else if (checkboxType == 'policy') {
        _isContentPolicyAccepted = value ?? false;
      } else if (checkboxType == 'copyright') {
        _isCopyrightAccepted = value ?? false;
      }
    });
  }

 

   Future<void> _postSongMetadata(String fileName,String formattedDuration,String lyricsFileName) async {

  final String timestamp = DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());
//print(creditsMap);
    final uri = Uri.parse('https://5qxwn3x3z2.execute-api.ap-south-1.amazonaws.com/voiznew/processSong');
    final headers = {
      'Content-Type': 'application/json',
    };
    final body = {
      'user_id': email, // Use the stored variable
      'FullName': name, // Use the stored variable
      'stage_name': stageName, // Use the stored variable
      'songName': songName, // Use the stored variable
      'languages': language, // Use the stored variable
      'genre': genre, // Use the stored variable
      'mood': mood, // Use the stored variable
      'story': story, // Use the stored variable
      //'credits': creditsMap, // Use the stored variable
      'fileName': songName+'.mp3',
      'span': formattedDuration,
      'approved':"false",
      'lyricist': lyricist,
  'composer': composer,
  'singer': singer,
  'producer': producer,
  'coverPageUrl':"",
  'playCount':'0',
  'playlistCount':'0',
  'shareSongCount':'0',
  'lyricsFileName':lyricsFileName,
  'createdTimestamp':timestamp,
  'updatedTimestamp':timestamp,



    };

    print(body);

    try {
      final response = await ApiService.uploadSong(body);

      if (ApiService.isSuccessResponse(response)) {
        print('Song uploaded successfully');
        await _createJob(); // Call _createJob after successful upload
        await _updateSongTable(); // Call _updateSongTable after successful upload
        await _notifyAdmins(widget.onDataSubmitted['song_name'], widget.onDataSubmitted['name']);
      } else {
        print('Failed to upload song: ${ApiService.getErrorMessage(response)}');
        print('Response body: ${response.body}');
      }
    } catch (e) {
      print('Error uploading song: $e');
    }
  }

  Future<void> _createJob() async {
  try {
    final response = await ApiService.createJob({
      'key': '$songName.mp3',
      'user_id': email,
    });

    if (ApiService.isSuccessResponse(response)) {
      print("Job created successfully");
    } else {
      throw Exception('Error creating job: ${ApiService.getErrorMessage(response)}');
    }
  } catch (e) {
    print('Error creating job: $e');
    // Don't show error to user as this is a non-critical background process
  }
}

Future<void> _updateSongTable() async {
  try {
    final response = await ApiService.updateSongTable({
      'user_id': email,
      'songName': '$songName.mp3',
      'lyricsFileName': _lyricsFile!.path.split('/').last,
    });

    if (ApiService.isSuccessResponse(response)) {
      print("Song entry updated successfully in the table");
    } else {
      throw Exception('Error updating song table: ${ApiService.getErrorMessage(response)}');
    }
  } catch (e) {
    print('Error updating song table: $e');
    // Don't show error to user as this is a non-critical background process
  }
}

// Add this method to your UploadSongFourthPage state class
  Future<void> _notifyAdmins(String songName, String artistName) async {
    try {
      // Step 1: Fetch all admin emails from the API
      final adminEmailsResponse = await ApiService.getAdminEmails();

      print('Admin Emails Fetch Response Status: ${adminEmailsResponse.statusCode}');
      print('Admin Emails Fetch Response Body: ${adminEmailsResponse.body}');

      if (ApiService.isSuccessResponse(adminEmailsResponse)) {
        final adminEmailsData = jsonDecode(adminEmailsResponse.body);

        if (adminEmailsData['success'] == true &&
            adminEmailsData['admins'] != null &&
            adminEmailsData['admins'].isNotEmpty) {

          // Extract all admin emails as an array
          final List<dynamic> admins = adminEmailsData['admins'];
          final List<String> adminEmails = admins.map((admin) => admin['email'].toString()).toList();

          print('Extracted Admin Emails: $adminEmails');
          print('Sending notification to ${adminEmails.length} admins');

          // Step 2: Send notification to all admins via Lambda function
          final notificationResponse = await ApiService.sendAdminNotification({
            'adminEmails': adminEmails,
            'songTitle': songName,
            'singerName': artistName
          });

          print('Notification API Response Status: ${notificationResponse.statusCode}');
          print('Notification API Response Body: ${notificationResponse.body}');

          if (ApiService.isSuccessResponse(notificationResponse)) {
            print('Admin notification sent successfully');

            // Optional: Parse and log the response details
            final responseBody = jsonDecode(notificationResponse.body);
            print('Recipient Count: ${responseBody['recipientCount'] ?? 'Unknown'}');
            print('Message: ${responseBody['message'] ?? 'No message'}');
          } else {
            print('Failed to send admin notification');
            // Fallback to manual notification method if primary method fails
            await _sendFallbackNotification(songName, artistName);
          }
        } else {
          print('No admin emails found, using fallback emails');
          await _sendFallbackNotification(songName, artistName);
        }
      } else {
        print('Failed to fetch admin emails');
        await _sendFallbackNotification(songName, artistName);
      }
    } catch (e) {
      print('Comprehensive error in admin notification process: $e');

      // Ensure fallback is called even if an unexpected error occurs
      try {
        await _sendFallbackNotification(songName, artistName);
      } catch (fallbackError) {
        print('Fallback notification also failed: $fallbackError');
      }
    }
  }

// Fallback method to notify specific admins if the API call fails
  Future<void> _sendFallbackNotification(String songName, String artistName) async {
    try {
      // List of fallback admin emails
      List<String> fallbackEmails = [
        "abhishekgothankar32@gmail.com",
        "ankitad@cloudmotivglobal.com",
        "mriganka@voiz.co.in"
      ];

      print('Using fallback emails: $fallbackEmails');

      final fallbackResponse = await ApiService.sendAdminNotification({
        'adminEmails': fallbackEmails,
        'songTitle': songName,
        'singerName': artistName
      });

      print('Fallback Notification API Response Status: ${fallbackResponse.statusCode}');
      print('Fallback Notification API Response Body: ${fallbackResponse.body}');

      if (ApiService.isSuccessResponse(fallbackResponse)) {
        print('Fallback admin notification sent successfully');
      } else {
        print('Failed to send fallback admin notification');
      }
    } catch (e) {
      print('Error in fallback notification process: $e');
    }
  }


  // 
  
// //  
Future<void> _uploadFile() async {
  // if (_isNoInternet) {
  //   ScaffoldMessenger.of(context).showSnackBar(SnackBar(
  //     content: Text('No internet connection. Please check your connection and try again.'),
  //     duration: Duration(seconds: 3),
  //   ));
  //   return;
  // }
  if (_audioFile == null || _lyricsFile == null) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Both audio and lyrics files are required')),
    );
    return; // Stop execution if files are missing
  }

  setState(() => _isLoading = true); // Show loader

  final Stopwatch _stopwatch = Stopwatch();
  _stopwatch.start();

  try {
    // Calculate the song duration in MM:SS format
    var durationInMilliseconds = await AudioDuration.getAudioDuration(_audioFile!.path);
    String formattedDuration = _formatDuration(durationInMilliseconds!);

    final audioBytes = File(_audioFile!.path).readAsBytesSync();
    final lyricsBytes = File(_lyricsFile!.path).readAsBytesSync();
    final songNameWithExtension = '$songName.mp3';
    final lyricsFileName = _lyricsFile!.path.split('/').last;

    // Step 1: Fetch presigned URLs for both song and lyrics in one API call
    final response = await ApiService.generatePresignedUrls({
      'songName': songNameWithExtension,
      'lyricsFileName': lyricsFileName,
      'user_id': email,
    });

    if (ApiService.isSuccessResponse(response)) {
      final responseBody = jsonDecode(response.body);
      final songPresignedUrl = responseBody['songUrl'];
      final lyricsPresignedUrl = responseBody['lyricsUrl'];

      // Step 2: Upload both files to S3 in parallel using the fetched URLs
      await Future.wait([
        _uploadToS3(songPresignedUrl, audioBytes, 'audio/mpeg'),
        _uploadToS3(lyricsPresignedUrl, lyricsBytes, 'application/*'),
      ]);

      // Step 3: Post metadata, create job, and update the song table
      await _postSongMetadata(songNameWithExtension, formattedDuration,lyricsFileName);
      //await _createJob();
      //await _updateSongTable();

      // Step 4: Notify all admin users about the new song upload
      await _notifyAdmins(songName, name);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('File uploaded and processed successfully')),
      );

        _stopwatch.stop();
        
        // Display the elapsed time
        final elapsedTime = _stopwatch.elapsed;
        print("Elapsed time: ${elapsedTime.inSeconds} seconds");
      _showSuccessDialog(context);
    } else {
      throw Exception('Error fetching presigned URLs');
    }
  } catch (e) {
    // Replace the existing error handling with this
    String errorMessage = 'Unable to upload file. Please check your connection and try again.';

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(errorMessage)),
    );
    print('Upload error occurred: $e'); // Keep log for debugging but don't show to user
  } finally {
    setState(() => _isLoading = false); // Hide loader
  }
}

  Future<void> _uploadToS3(String url, List<int> fileBytes, String contentType) async {
    try {
      final uploadResponse = await ApiService.uploadToS3(url, fileBytes);
      if (!ApiService.isSuccessResponse(uploadResponse)) {
        throw Exception('Failed to upload file');
      }
    } catch (e) {
      // Hide the technical AWS error details
      throw Exception('Connection error');
    }
  }

String _formatDuration(int milliseconds) {
  int seconds = (milliseconds / 1000).round();
  int minutes = (seconds / 60).floor();
  seconds = seconds % 60;
  return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
}


  Future<void> _navigateToHome(BuildContext context) async {
    if (!mounted) return;

    try {
      // Preserve audio state before navigation
      final audioState = AudioService().preserveState();

      await Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(
          builder: (context) => NewHomePage(
            email: email,
            category: 'Singer',
            userfullname: fullName,
            preservedAudioState: audioState, // Pass the preserved state
          ),
        ),
            (route) => false,
      );
    } catch (e) {
      print('Error during navigation: $e');
    }
  }



  Future<void> _showSuccessDialog(BuildContext context) async {
  print("=== START: _showSuccessDialog ===");
  print("Initial mounted state: $mounted");
  
  if (!mounted) {
    print("Widget not mounted, returning early");
    return;
  }
  if (!mounted) return;

  bool shouldNavigate = false;

  try {
    await showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext dialogContext) {
        print("Building dialog content");
        return WillPopScope(
          onWillPop: () async {
            print("WillPopScope triggered");
            return false;
          },
          child: Dialog(
            backgroundColor: Colors.transparent,
            child: Stack(
              alignment: Alignment.topCenter,
              clipBehavior: Clip.none,
              children: [
                Container(
                  width: 263,
                  height: 290,
                  padding: EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Color(0xFF151415),
                    borderRadius: BorderRadius.circular(28),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.white.withOpacity(0.2),
                        blurRadius: 15,
                        spreadRadius: -2,
                        offset: Offset(8, 0),
                      ),
                      BoxShadow(
                        color: Colors.white.withOpacity(0.2),
                        blurRadius: 15,
                        spreadRadius: -2,
                        offset: Offset(0, 8),
                      ),
                      BoxShadow(
                        color: Colors.white.withOpacity(0.3),
                        blurRadius: 20,
                        spreadRadius: -5,
                        offset: Offset(8, 8),
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      SizedBox(height: 20),
                      Center(
                        child: Text(
                          "Confirmation!",
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      SizedBox(height: 40),
                      Text(
                        "Your song has been\nuploaded for approval !",
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                      SizedBox(height: 40),
                      GestureDetector(
                        onTap: () {
                          print("Checkmark button tapped");
                          shouldNavigate = true;
                          print("Setting shouldNavigate to true");
                          Navigator.of(dialogContext).pop();
                          print("Dialog popped from checkmark");
                        },
                        child: CircleAvatar(
                          radius: 25,
                          backgroundColor: Colors.blue,
                          child: Icon(
                            Icons.check,
                            color: Colors.white,
                            size: 35,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Positioned(
                  top: 10,
                  right: 20,
                  child: GestureDetector(
                    onTap: () {
                      print("Close button tapped");
                      shouldNavigate = true;
                      print("Setting shouldNavigate to true");
                      Navigator.of(dialogContext).pop();
                      print("Dialog popped from close button");
                    },
                    child: CircleAvatar(
                      radius: 15,
                      child: Container(
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: Colors.white,
                            width: 3.0,
                          ),
                        ),
                        child: CircleAvatar(
                          radius: 12,
                          child: Icon(
                            Icons.close,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );

    print("Dialog closed. shouldNavigate: $shouldNavigate");
    print("Mounted state after dialog: $mounted");

    if (shouldNavigate && mounted) {
      await _navigateToHome(context);
    }
  } catch (e, stackTrace) {
    print("Error in _showSuccessDialog: $e");
    print("Stack trace: $stackTrace");
  }
  }



  @override
  Widget build(BuildContext context) {
    Widget content = GradientScaffold(
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
controller: ScrollController(),
child:Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            SizedBox(height: 60),
            Text(
              "Upload and Check",
              style: TextStyle(
                fontSize: 32,
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 30),


            // Upload Lyrics Button
            Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.center, // Align items vertically center
                  children: [
                    buildFilePicker('Lyrics', _lyricsFile, _pickLyricsFile),
                    SizedBox(width: 10),
                    Padding(
                      padding: const EdgeInsets.only(top: 8.0), // Fine-tune vertical alignment
                      child: RightPinInfoIconWithTooltip(
                        title: 'Upload Lyrics',
                        infoText: 'Supported file formats: ',
                        boldInfoText: '.doc, .docx, .pdf and .txt',
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 30),


                // Upload Audio Button with Info Icon
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.center, // Align items vertically center
                  children: [
                    buildFilePicker('Song', _audioFile, _pickAudioFile),
                    SizedBox(width: 5),
                    Padding(
                      padding: const EdgeInsets.only(top: 8.0, left: 2.0), // Fine-tune vertical alignment
                      child: RightPinInfoIconWithTooltip(
                        title: 'Upload Song',
                        infoText: 'Supported file formats: ',
                        boldInfoText: '.mp3 and .wav',
                      ),
                    ),
                    if (_isaudioloading)
                      Padding(
                        padding: const EdgeInsets.only(left: 1),
                        child: SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2.0, color: Colors.white),
                        ),
                      ),
                  ],
                ),
              ],
            ),
            SizedBox(height: 40),

            // Checkboxes
             _buildCheckboxnew(
                "I've read and agreed to the terms and conditions",
                _isTermsAccepted,
                (value) => _onCheckboxChanged(value, 'terms'),
              ),
              SizedBox(height: 5,),
              
              _buildCheckbox1(
                "Content uploaded meets the platform Code of Conduct",
                _isContentPolicyAccepted,
                (value) => _onCheckboxChanged(value, 'policy'),
              ),
              SizedBox(height: 5,),
              _buildCheckbox2(
                "Content doesn't infringe others copyrights",
                _isCopyrightAccepted,
                (value) => _onCheckboxChanged(value, 'copyright'),
              ),
            SizedBox(height: 30),

            // Progress Indicator
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(height: 4, width: 75, color: Colors.white),
                SizedBox(width: 4),
                Container(height: 4, width: 75, color: Colors.white),
                SizedBox(width: 4),
                Container(height: 4, width: 75, color: Colors.white),
                SizedBox(width: 4),
                Container(height: 4, width: 75, color: Colors.white),
              ],
            ),
            SizedBox(height: 30),

            // Upload Button
            ElevatedButton(
              onPressed: _canUpload && !_isLoading ? _uploadFile : null,
              style: ElevatedButton.styleFrom(
                minimumSize: Size(312, 56),
                backgroundColor: _canUpload && !_isLoading
                    ? Color(0xFF2644D9)
                    : Colors.grey,
                padding: EdgeInsets.symmetric(vertical: 15, horizontal: 60),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(30),
                ),
              ),
              child: _isLoading
                  ? CircularProgressIndicator(color: Colors.white)
                  : Text(
                "Upload",
                style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      )
,),
      // bottomNavigationBar: GlobalBottomNavigationBar(
      //   email: widget.onDataSubmitted['email'],
      //   fullName: widget.onDataSubmitted['fullName'],
      //   category: 'Singer',
      //   currentIndex: 2,
      // ),
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
  Widget _buildCheckbox1(String text, bool value, Function(bool?) onChanged) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Transform.scale(
          scale: 1.2,
          child: Checkbox(
            value: value,
            onChanged: onChanged,
            activeColor: Colors.blue,
            fillColor: MaterialStateProperty.resolveWith<Color>(
                  (Set<MaterialState> states) {
                if (states.contains(MaterialState.selected)) {
                  return Color(0xFF2364C6);
                }
                return Colors.white;
              },
            ),
            checkColor: Colors.white,
          ),
        ),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Text.rich(
              TextSpan(
                children: [
                  TextSpan(
                    text: "Content uploaded meets the platform ",
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontStyle: FontStyle.italic,
                      fontFamily: 'Poppins',
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  TextSpan(
                    text: "Code of Conduct",
                    style: TextStyle(
                      fontSize: 16,
                      fontStyle: FontStyle.italic,
                      fontFamily: 'Poppins',
                      color: Color(0xFF4297FF),
                      fontWeight: FontWeight.w600,
                    ),
                    recognizer: TapGestureRecognizer()
                      ..onTap = () {
                        _openCodeOfConduct();
                      },
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

//  Widget _buildCheckbox1(String text, bool value, Function(bool?) onChanged) {
//   return Row(
//     crossAxisAlignment: CrossAxisAlignment.start, // Align items to the top
//     children: [
//       Transform.scale(
//         scale: 1.2,
//         child: Checkbox(
//           value: value,
//           onChanged: onChanged,
//           activeColor: Colors.blue,
//           fillColor: MaterialStateProperty.resolveWith<Color>(
//             (Set<MaterialState> states) {
//               if (states.contains(MaterialState.selected)) {
//                 return Color(0xFF2364C6);
//               }
//               return Colors.white;
//             },
//           ),
//           checkColor: Colors.white,
//         ),
//       ),
//       Expanded(
//         child: Padding(
//           padding: const EdgeInsets.only(top: 12), // Align text with checkbox
//           child: Wrap(
//             crossAxisAlignment: WrapCrossAlignment.start,
//             children: [
//               Text(
//                 "Content uploaded meets the platform ",
//                 style: TextStyle(
//                   color: Colors.white,
//                   fontSize: 16,
//                   fontStyle: FontStyle.italic,
//                   fontFamily: 'Poppins',
//                   fontWeight: FontWeight.w600,
//                 ),
//               ),
//               GestureDetector(
//                 onTap: () {
//                   _openCodeOfConduct();
//                 },
//                 child: Text(
//                   "Code of Conduct",
//                   style: TextStyle(
//                     fontSize: 16,
//                     fontStyle: FontStyle.italic,
//                     fontFamily: 'Poppins',
//                     color: Colors.blue,
//                     fontWeight: FontWeight.w600,
//                   ),
//                 ),
//               ),
//             ],
//           ),
//         ),
//       ),
//     ],
//   );
// }

// Function to open the Code of Conduct hyperlink
void _openCodeOfConduct() {
  const url = 'https://voiz.co.in/code-of-conduct/'; // Replace with actual URL
  launch(url); // You may need to use the 'url_launcher' package for this
}

void _openTermsAndConditions() {
  const url = 'https://voiz.co.in/music-license-agreement/'; // Replace with the actual URL
  launch(url); // You may need to use the 'url_launcher' package for this
}

Widget _buildCheckbox2(String text, bool value, Function(bool?) onChanged) {
  return Row(
    crossAxisAlignment: CrossAxisAlignment.start, // Align items to the top
    children: [
      Transform.scale(
        scale: 1.2,
        child: Checkbox(
          value: value,
          onChanged: onChanged,
          activeColor: Color(0xFF2364C6),
          fillColor: MaterialStateProperty.resolveWith<Color>(
            (Set<MaterialState> states) {
              if (states.contains(MaterialState.selected)) {
                return Color(0xFF2364C6);
              }
              return Colors.white;
            },
          ),
          checkColor: Colors.white,
        ),
      ),
      Expanded(
        child: Padding(
          padding: const EdgeInsets.only(top: 12), // Align text with checkbox
          child: Text(
            "Content uploaded is mine and doesn't infringe other's copyrights",
            style: TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontStyle: FontStyle.italic,
              fontFamily: 'Poppins',
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ),
    ],
  );
}

Widget _buildCheckboxnew(String text, bool value, Function(bool) onChanged) {
  return Row(
    crossAxisAlignment: CrossAxisAlignment.start, // Align items to the top
    children: [
      Transform.scale(
        scale: 1.2,
        child: Checkbox(
          value: value,
          onChanged: (bool? newValue) => onChanged(newValue!),
          activeColor: Color(0xFF2364C6),
          fillColor: MaterialStateProperty.resolveWith<Color>(
            (Set<MaterialState> states) {
              if (states.contains(MaterialState.selected)) {
                return Color(0xFF2364C6);
              }
              return Colors.white;
            },
          ),
          checkColor: Colors.white,
        ),
      ),
      Expanded(
        child: Padding(
          padding: const EdgeInsets.only(top: 12), // Align text with checkbox
          child: Wrap(
            crossAxisAlignment: WrapCrossAlignment.start,
            children: [
              Text(
                "I have read & agree with the ",
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontFamily: 'Poppins',
                  fontStyle: FontStyle.italic,
                  fontWeight: FontWeight.w600,
                ),
              ),
              GestureDetector(
                onTap: _openTermsAndConditions,
                child: Text(
                  "terms & conditions",
                  style: TextStyle(
                    fontSize: 16,
                    fontFamily: 'Poppins',
                    fontStyle: FontStyle.italic,
                    color: Color(0xFF4297FF),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    ],
  );
}



   Widget buildFilePicker(String label, File? file, VoidCallback pickFile, {bool isRequired = true}) {
    bool isLoading = label == 'Song' ? _isSongButtonLoading : _isLyricsButtonLoading;
    
    return GestureDetector(
      onTap: pickFile,
      child: Container(
        width: 170,
        height: 50,
        padding: EdgeInsets.symmetric(vertical: 15.0, horizontal: 5.0),
        decoration: BoxDecoration(
          //border: Border.all(color: Colors.black, width: 2.0),
          borderRadius: BorderRadius.circular(32.0),
          color: Color(0xFF2644D9),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            if (isLoading)
              SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  color: Colors.transparent,
                  strokeWidth: 2.0,
                ),
              )
            else
              Expanded(
                child: Center(
                  child: Text(
                    file == null ? 'Upload $label' : file.path.split('/').last,
                    style: TextStyle(
                      fontSize: 16.0,
                      color: Colors.white,
                      fontWeight: FontWeight.bold
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class RightPinTooltipPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Color(0xFF151415)
      ..style = PaintingStyle.fill
      ..isAntiAlias = true;

    final path = Path();
    final cornerRadius = 30.0;

    // Start from bottom left, with rounded corner
    path.moveTo(0, cornerRadius);

    // Bottom left rounded corner
    path.quadraticBezierTo(0, 0, cornerRadius, 0);

    // Top left side - straight line
    path.lineTo(size.width - cornerRadius, 0);

    // Top right side - straight line (sharp corner)
    path.lineTo(size.width, 0);
    path.lineTo(size.width, size.height - cornerRadius); // Stop before corner

    // Bottom right rounded corner - NEW
    path.quadraticBezierTo(
        size.width,
        size.height,
        size.width - cornerRadius,
        size.height
    );

    // Bottom side
    path.lineTo(cornerRadius, size.height);

    // Bottom left rounded corner
    path.quadraticBezierTo(0, size.height, 0, size.height - cornerRadius);

    path.close();

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}


class RightPinTooltip extends StatelessWidget {
  final String title;
  final String infoText;
  final String boldInfoText;

  RightPinTooltip({
    required this.title,
    required this.infoText,
    required this.boldInfoText,
  });
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 273,
      height: 145,
      child: Stack(
        children: [
          // Enhanced shadow effect with white glow
          Positioned(
            right: 10,
            bottom: 5,
            child: Container(
              width: 250,
              height: 120,
              margin: EdgeInsets.only(right: 8, bottom: 8),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  // Outer white glow
                  BoxShadow(
                    color: Colors.white.withOpacity(0.3),
                    blurRadius: 15,
                    spreadRadius: 1,
                  ),
                  // Right side white shadow
                  BoxShadow(
                    color: Colors.white.withOpacity(0.4),
                    blurRadius: 12,
                    spreadRadius: -2,
                    offset: Offset(8, 0),
                  ),
                  // Bottom white shadow
                  BoxShadow(
                    color: Colors.white.withOpacity(0.4),
                    blurRadius: 12,
                    spreadRadius: -2,
                    offset: Offset(6, 8),
                  ),
                  // Corner white shadow
                  BoxShadow(
                    color: Colors.white.withOpacity(0.5),
                    blurRadius: 12,
                    spreadRadius: -3,
                    offset: Offset(6, 6),
                  ),
                ],
              ),
            ),
          ),
          // Original tooltip with CustomPainter
          Positioned(
            left: 0,
            top: 0,
            child: CustomPaint(
              painter: RightPinTooltipPainter(),
              child: Container(
                padding: EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                width: 260,
                height: 140,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    SizedBox(height: 10),
                    Expanded(
                      child: SingleChildScrollView(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              infoText,
                              style: TextStyle(
                                color: Colors.white.withOpacity(0.9),
                                fontSize: 16,
                                fontStyle: FontStyle.italic,
                                height: 1.3,
                              ),
                            ),
                            Text(
                              boldInfoText,
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontStyle: FontStyle.italic,
                                fontWeight: FontWeight.bold,
                                height: 1.3,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

          ),
        ],
      ),
    );
  }
}

class RightPinInfoIconWithTooltip extends StatefulWidget {
  final String title;
  final String infoText;
  final String boldInfoText;

  RightPinInfoIconWithTooltip({
    required this.title,
    this.infoText = '',
    this.boldInfoText = '',
  });

  @override
  _RightPinInfoIconWithTooltipState createState() => _RightPinInfoIconWithTooltipState();
}

class _RightPinInfoIconWithTooltipState extends State<RightPinInfoIconWithTooltip>
    with SingleTickerProviderStateMixin {
  final GlobalKey _toolTipKey = GlobalKey();
  OverlayEntry? _overlayEntry;
  bool _isOverlayVisible = false;
  bool _disposed = false;
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: Duration(milliseconds: 300),
    );
    _scaleAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutBack),
    );
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        if (_isOverlayVisible) {
          _removeOverlay();
          return false;
        }
        return true;
      },
      child: InkWell(
        key: _toolTipKey,
        onTap: () => _toggleOverlay(context),
        borderRadius: BorderRadius.circular(50),
        child: Container(
          padding: EdgeInsets.only(top: 0,bottom: 10,left: 8,right: 8),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            boxShadow: _isOverlayVisible
                ? [
              BoxShadow(
                color: Colors.blue.withOpacity(0.5),
                blurRadius: 10,
                spreadRadius: 2,
              ),
            ]
                : [],
          ),
          child: Icon(
            Icons.info_outline,
            color: Colors.white,
            size: 32,
          ),
        ),
      ),
    );
  }

  void _toggleOverlay(BuildContext context) {
    if (_isOverlayVisible) {
      _removeOverlay();
    } else {
      _showOverlay(context);
    }
  }

  void _showOverlay(BuildContext context) {
    if (_disposed || _isOverlayVisible) return;

    final overlay = Overlay.of(context);
    final renderBox = _toolTipKey.currentContext?.findRenderObject() as RenderBox?;
    if (renderBox == null) return;

    final offset = renderBox.localToGlobal(Offset.zero);

    _overlayEntry = OverlayEntry(
      builder: (context) => AnimatedBuilder(
        animation: _scaleAnimation,
        builder: (context, child) {
          return Stack(
            children: [
              Positioned.fill(
                child: GestureDetector(
                  onTap: _removeOverlay,
                  behavior: HitTestBehavior.translucent,
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 4, sigmaY: 4),
                    child: Container(
                      color: Colors.black.withOpacity(0.5),
                    ),
                  ),
                ),
              ),
              Positioned(
                left: offset.dx - 230 > 0 ? offset.dx - 230 : 10,
                top: offset.dy - (-40),
                child: Transform.scale(
                  scale: _scaleAnimation.value,
                  child: Material(
                    color: Colors.transparent,
                    child: GestureDetector(
                      onTap: () {},
                      child: RightPinTooltip(
                        title: widget.title,
                        infoText: widget.infoText,
                        boldInfoText: widget.boldInfoText,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );

    if (!_disposed && mounted) {
      setState(() {
        _isOverlayVisible = true;
      });
      overlay.insert(_overlayEntry!);
      _controller.forward();
    }
  }

  void _removeOverlay() {
    if (!_isOverlayVisible) return;

    _controller.reverse().then((_) {
      _overlayEntry?.remove();
      _overlayEntry = null;

      if (!_disposed && mounted) {
        setState(() {
          _isOverlayVisible = false;
        });
      }
    });
  }

  @override
  void dispose() {
    _disposed = true;
    _removeOverlay();
    _controller.dispose();
    super.dispose();
  }
}