import 'package:audio_duration/audio_duration.dart';
import 'package:dropdown_button2/dropdown_button2.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:voiceapp/bottomnavigationbar.dart';
import 'package:voiceapp/main.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import 'dart:io';
import 'dart:ui';
import 'package:voiceapp/services/api_service.dart';
import 'dart:convert';
import 'package:url_launcher/url_launcher.dart';
import '../NewHomepage.dart';

class SongUploadScreen_stes extends StatefulWidget {
  final String userId;
  final String userfullname;
  final String albumId;

  const SongUploadScreen_stes({
    Key? key,
    required this.userId,
    required this.userfullname,
    required this.albumId,
  }) : super(key: key);

  @override
  _SongUploadScreenState createState() => _SongUploadScreenState();
}

class _SongUploadScreenState extends State<SongUploadScreen_stes> {
  // Text editing controllers
  final TextEditingController _songNameController = TextEditingController();
  final TextEditingController _moodPaceController = TextEditingController();
  final TextEditingController _storyBehindSongController = TextEditingController();
  final TextEditingController _singerNameController = TextEditingController();
  final TextEditingController _producerController = TextEditingController();
  final TextEditingController _composerController = TextEditingController();
  final TextEditingController _lyricistController = TextEditingController();
  final TextEditingController _stageNameController = TextEditingController();
  final TextEditingController _spanController = TextEditingController();

  // File paths
  String? _pickedLyricsFilePath;
  String? _pickedSongFilePath;
  String? _pickedCoverImagePath;

  // Loading states
  bool _isLyricsButtonLoading = false;
  bool _isSongButtonLoading = false;
  bool _isCoverImageButtonLoading = false;
  bool _isSubmitting = false;
  bool _isSubmitted = false; // Tracks if form has been submitted

  // Terms
  bool _isTermsAccepted = false;
  bool _isContentPolicyAccepted = false;
  bool _isCopyrightAccepted = false;

  // Dropdown values and errors
  String? _selectedLanguage;
  String? _selectedGenre;
  String? _languageError;
  String? _songNameError;
  String? _genreError;
  String? _storyError;
  String? _singerNameError;
  String? _composerError;
  String? _lyricistError;
  String? _producerError;
  String? _lyricsError;
  String? _songFileError;
  String? _coverImageError;
  bool _isStorySubmitted = false;
  bool _isStoryWordLimitExceeded = false;

  // Dropdown options
  final List<String> _languages = [
    'Assamese', 'Bengali', 'Bhojpuri', 'English', 'Gujarati', 'Hindi', 'Kannada',
    'Kashmiri', 'Scene', 'Malayalam', 'Manipuri', 'Marathi', 'Odia', 'Punjabi',
    'Rajasthani', 'Tamil', 'Telugu', 'Urdu'
  ];

  final List<String> _genres = [
    'Classical', 'Devotional', 'Folk', 'Fusion', 'Ghazal', 'Jazz', 'Pop',
    'Rabindra Sangeet', 'Rap', 'Rock', 'Romantic', 'Sufi', 'Others'
  ];

  final int _maxStoryWords = 400;

  @override
  void dispose() {
    _songNameController.dispose();
    _moodPaceController.dispose();
    _storyBehindSongController.dispose();
    _singerNameController.dispose();
    _producerController.dispose();
    _composerController.dispose();
    _lyricistController.dispose();
    _stageNameController.dispose();
    _spanController.dispose();
    super.dispose();
  }

  // Format duration in HH:MM:SS
  String _formatDuration(int milliseconds) {
    final duration = Duration(milliseconds: milliseconds);
    String twoDigits(int n) => n.toString().padLeft(2, '0');
    final hours = twoDigits(duration.inHours);
    final minutes = twoDigits(duration.inMinutes.remainder(60));
    final seconds = twoDigits(duration.inSeconds.remainder(60)); // Corrected to use remainder(60) for seconds
    return [if (duration.inHours > 0) hours, minutes, seconds].join(':');
  }

  // Format timestamp to YYYYMMDD_HHmmss
  String _formatTimestamp(DateTime dateTime) {
    String pad(int n) => n.toString().padLeft(2, '0');
    final year = dateTime.year.toString();
    final month = pad(dateTime.month);
    final day = pad(dateTime.day);
    final hour = pad(dateTime.hour);
    final minute = pad(dateTime.minute);
    final second = pad(dateTime.second);
    return '${year}${month}${day}_${hour}${minute}${second}';
  }

  // Upload file to S3
  Future<void> _uploadToS3(String url, List<int> data, String contentType) async {
    print('Attempting S3 PUT to: $url with Content-Type: $contentType');
    final res = await ApiService.uploadToS3(url, data);
    if (ApiService.isSuccessResponse(res)) {
      print('S3 upload successful for URL: $url');
    } else {
      print('S3 upload failed for URL: $url. Status: ${res.statusCode}, Reason: ${res.reasonPhrase}, Body: ${res.body}');
      throw Exception('S3 upload failed: ${res.reasonPhrase}');
    }
  }

  // Get MIME type from file extension
  String _getMimeTypeFromExtension(String path) {
    final ext = path.split('.').last.toLowerCase();
    const mimeTypes = {
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'm4a': 'audio/x-m4a',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'txt': 'text/plain',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    return mimeTypes[ext] ?? 'application/octet-stream';
  }

  // Safe setState
  void _safeSetState(VoidCallback fn) {
    if (mounted) setState(fn);
  }

  // Pick lyrics file
  Future<void> _pickLyricsFile() async {
    _safeSetState(() => _isLyricsButtonLoading = true);
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'txt', 'doc', 'docx'],
      );
      if (result != null && result.files.single.path != null) {
        _safeSetState(() {
          _pickedLyricsFilePath = result.files.single.path;
          _lyricsError = null;
        });
        print('Picked lyrics file: $_pickedLyricsFilePath');
      } else {
        print('Lyrics file picking cancelled');
      }
    } catch (e) {
      print('Error picking lyrics file: $e');
      _showSnackBar('Error picking lyrics file.');
    } finally {
      _safeSetState(() => _isLyricsButtonLoading = false);
    }
  }

  // Pick song file
  Future<void> _pickSongFile() async {
    _safeSetState(() => _isSongButtonLoading = true);
    try {
      final result = await FilePicker.platform.pickFiles(type: FileType.audio);
      if (result != null && result.files.single.path != null) {
        _safeSetState(() {
          _pickedSongFilePath = result.files.single.path;
          _songFileError = null;
        });
        print('Picked song file: $_pickedSongFilePath');
      } else {
        print('Song file picking cancelled');
      }
    } catch (e) {
      print('Error picking song file: $e');
      _showSnackBar('Error picking song file.');
    } finally {
      _safeSetState(() => _isSongButtonLoading = false);
    }
  }

  // Pick cover image
  Future<void> _pickCoverImage() async {
    _safeSetState(() => _isCoverImageButtonLoading = true);
    try {
      final picker = ImagePicker();
      final image = await picker.pickImage(source: ImageSource.gallery);
      if (image != null) {
        _safeSetState(() {
          _pickedCoverImagePath = image.path;
          _coverImageError = null;
        });
        print('Picked cover image: $_pickedCoverImagePath');
      } else {
        print('Cover image picking cancelled');
      }
    } catch (e) {
      print('Error picking cover image: $e');
      _showSnackBar('Error picking cover image.');
    } finally {
      _safeSetState(() => _isCoverImageButtonLoading = false);
    }
  }

  // Validate story field
  String? _validateStoryField(String text) {
    final words = _getWordCount(text);
    if (words > _maxStoryWords) {
      return 'The story exceeds the $_maxStoryWords-word limit';
    }
    return null;
  }

  // Get word count
  int _getWordCount(String text) {
    final normalizedText = text.trim().replaceAll(RegExp(r'\s+'), ' ');
    return normalizedText.isEmpty ? 0 : normalizedText.split(' ').length;
  }

  void _onCheckboxChanged(bool? value, String checkboxType) {
    _safeSetState(() {
      if (checkboxType == 'terms') {
        _isTermsAccepted = value ?? false;
      } else if (checkboxType == 'policy') {
        _isContentPolicyAccepted = value ?? false;
      } else if (checkboxType == 'copyright') {
        _isCopyrightAccepted = value ?? false;
      }
    });
  }

  void _openCodeOfConduct() async {
    const url = 'https://voiz.co.in/code-of-conduct/';
    if (await canLaunchUrl(Uri.parse(url))) { // Changed to canLaunchUrl
      await launchUrl(Uri.parse(url)); // Changed to launchUrl
    } else {
      _showSnackBar('Could not open Code of Conduct');
    }
  }

  void _openTermsAndConditions() async {
    const url = 'https://voiz.co.in/music-license-agreement/';
    if (await canLaunchUrl(Uri.parse(url))) { // Changed to canLaunchUrl
      await launchUrl(Uri.parse(url)); // Changed to launchUrl
    } else {
      _showSnackBar('Could not open Terms and Conditions');
    }
  }

  Widget _buildCheckboxnew(String text, bool value, Function(bool?) onChanged) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Transform.scale(
          scale: 1.2,
          child: Checkbox(
            value: value,
            onChanged: onChanged,
            activeColor: Color(0xFF2364C6),
            fillColor: MaterialStateProperty.resolveWith<Color>(
                  (states) => states.contains(MaterialState.selected) ? Color(0xFF2364C6) : Colors.white,
            ),
            checkColor: Colors.white,
          ),
        ),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(top: 12),
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

  Widget _buildCheckbox1(String text, bool value, Function(bool?) onChanged) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Transform.scale(
          scale: 1.2,
          child: Checkbox(
            value: value,
            onChanged: onChanged,
            activeColor: Color(0xFF2364C6),
            fillColor: MaterialStateProperty.resolveWith<Color>(
                  (states) => states.contains(MaterialState.selected) ? Color(0xFF2364C6) : Colors.white,
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
                    recognizer: TapGestureRecognizer()..onTap = _openCodeOfConduct,
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCheckbox2(String text, bool value, Function(bool?) onChanged) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Transform.scale(
          scale: 1.2,
          child: Checkbox(
            value: value,
            onChanged: onChanged,
            activeColor: Color(0xFF2364C6),
            fillColor: MaterialStateProperty.resolveWith<Color>(
                  (states) => states.contains(MaterialState.selected) ? Color(0xFF2364C6) : Colors.white,
            ),
            checkColor: Colors.white,
          ),
        ),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Text(
              text,
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

  // Validate form
  bool _validateForm() {
    bool isValid = true;
    // Reset errors
    _songNameError = null;
    _languageError = null;
    _genreError = null;
    _storyError = null;
    _singerNameError = null;
    _composerError = null;
    _lyricistError = null;
    _producerError = null;
    _lyricsError = null;
    _songFileError = null;
    _coverImageError = null;
    _isStorySubmitted = true;

    if (_songNameController.text.trim().isEmpty) {
      _songNameError = 'Song name is required';
      isValid = false;
    }
    if (_selectedLanguage == null) {
      _languageError = 'Language is required';
      isValid = false;
    }
    if (_selectedGenre == null) {
      _genreError = 'Genre is required';
      isValid = false;
    }
    if (_singerNameController.text.trim().isEmpty) {
      _singerNameError = 'Singer name is required';
      isValid = false;
    }
    if (_composerController.text.trim().isEmpty) {
      _composerError = 'Composer is required';
      isValid = false;
    }
    if (_lyricistController.text.trim().isEmpty) {
      _lyricistError = 'Lyricist is required';
      isValid = false;
    }
    if (_producerController.text.trim().isEmpty) {
      _producerError = 'Producer is required';
      isValid = false;
    }
    if (_pickedLyricsFilePath == null) {
      _lyricsError = 'Lyrics file is required';
      isValid = false;
    }
    if (_pickedSongFilePath == null) {
      _songFileError = 'Song file is required';
      isValid = false;
    }
    if (widget.albumId.isEmpty) {
      isValid = false;
    }
    if (_storyBehindSongController.text.trim().isNotEmpty) {
      _storyError = _validateStoryField(_storyBehindSongController.text);
      if (_storyError != null) {
        isValid = false;
      }
    }
    _safeSetState(() {});
    return isValid;
  }

  // Show snackbar
  void _showSnackBar(String message, {Color backgroundColor = Colors.red}) {
    if (mounted) {
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: backgroundColor,
          duration: Duration(seconds: 3),
        ),
      );
    }
  }

  // Show result dialog for errors
  void _showResultDialog({
    required String title,
    required String message,
    required bool isSuccess,
  }) {
    if (!mounted) return;
    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16.0)),
          backgroundColor: isSuccess ? Colors.green[50] : Colors.red[50],
          title: Row(
            children: [
              Icon(
                isSuccess ? Icons.check_circle : Icons.error,
                color: isSuccess ? Colors.green[800] : Colors.red[800],
                size: 30,
              ),
              SizedBox(width: 10),
              Text(
                title,
                style: TextStyle(
                  color: isSuccess ? Colors.green[800] : Colors.red[800],
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          content: Text(message, style: TextStyle(color: Colors.black87)),
          actions: [
            TextButton(
              child: Text(
                'OK',
                style: TextStyle(
                  color: isSuccess ? Colors.green[800] : Colors.red[800],
                  fontWeight: FontWeight.bold,
                ),
              ),
              onPressed: () {
                Navigator.of(context).pop();
                if (isSuccess) {
                  _clearForm();
                  Navigator.pop(context);
                }
              },
            ),
          ],
        );
      },
    );
  }

  // Navigate to home
  Future<void> _navigateToHome(BuildContext context) async {
    if (!mounted) return;
    try {
      dynamic audioState; // Placeholder for audio state
      await Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(
          builder: (context) => NewHomePage(
            email: widget.userId,
            category: 'Singer',
            userfullname: widget.userfullname,
            preservedAudioState: audioState,
          ),
        ),
            (route) => false,
      );
    } catch (e) {
      print('Error during navigation: $e');
    }
  }

  // Show success dialog
  Future<void> _showSuccessDialog(BuildContext context) async {
    print("=== START: _showSuccessDialog ===");
    print("Initial mounted state: $mounted");
    if (!mounted) {
      print("Widget not mounted, returning early");
      return;
    }
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
                            border: Border.all(color: Colors.white, width: 3.0),
                          ),
                          child: CircleAvatar(
                            radius: 12,
                            child: Icon(Icons.close, color: Colors.white),
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

  _showConfirmationDialog(BuildContext context) async {
    bool allAccepted = false;
    await showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext dialogContext) {
        return StatefulBuilder(
          builder: (BuildContext context, StateSetter setDialogState) {
            bool canConfirm = _isTermsAccepted && _isContentPolicyAccepted && _isCopyrightAccepted;
            return AlertDialog(
              backgroundColor: Color(0xFF151415),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
              content: Container(
                width: 300,
                padding: EdgeInsets.all(20),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Text(
                        "Confirm Upload",
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    SizedBox(height: 20),
                    _buildCheckbox(
                      text: "I've read and agreed to the terms and conditions",
                      value: _isTermsAccepted,
                      onChanged: (value) {
                        setDialogState(() => _isTermsAccepted = value ?? false);
                        _safeSetState(() => _isTermsAccepted = value ?? false);
                      },
                      hyperlinkText: "terms and conditions",
                      onHyperlinkTap: _openTermsAndConditions,
                    ),
                    SizedBox(height: 10),
                    _buildCheckbox(
                      text: "Content uploaded meets the platform Code of Conduct",
                      value: _isContentPolicyAccepted,
                      onChanged: (value) {
                        setDialogState(() => _isContentPolicyAccepted = value ?? false);
                        _safeSetState(() => _isContentPolicyAccepted = value ?? false);
                      },
                      hyperlinkText: "Code of Conduct",
                      onHyperlinkTap: _openCodeOfConduct,
                    ),
                    SizedBox(height: 10),
                    _buildCheckbox(
                      text: "Content doesn't infringe others copyrights",
                      value: _isCopyrightAccepted,
                      onChanged: (value) {
                        setDialogState(() => _isCopyrightAccepted = value ?? false);
                        _safeSetState(() => _isCopyrightAccepted = value ?? false);
                      },
                    ),
                    SizedBox(height: 20),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        TextButton(
                          onPressed: () {
                            Navigator.of(dialogContext).pop();
                          },
                          child: Text(
                            "Cancel",
                            style: TextStyle(color: Colors.white, fontSize: 16),
                          ),
                        ),
                        ElevatedButton(
                          onPressed: canConfirm
                              ? () {
                            allAccepted = true;
                            Navigator.of(dialogContext).pop();
                          }
                              : null,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: canConfirm ? Color(0xFF2644D9) : Colors.grey,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(30),
                            ),
                          ),
                          child: Text(
                            "Confirm",
                            style: TextStyle(color: Colors.white, fontSize: 16),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
    return allAccepted;
  }

  // Extract filename from path
  String _getFileName(String filePath) => filePath.split('/').last;

  // Parse mood and pace
  Map<String, String> _parseMoodAndPace(String moodPaceText) {
    final parts = moodPaceText.split(',').map((e) => e.trim()).toList();
    return {
      'mood': parts.isNotEmpty ? parts[0] : '',
      'pace': parts.length > 1 ? parts[1] : '',
    };
  }

  // Upload files to S3
  Future<void> _uploadFilesToS3({
    required String? songUrl,
    required String? lyricsUrl,
    required String? songCoverImageUrl,
    required String? songFilePath,
    required String? lyricsFilePath,
    required String? coverImagePath,
  }) async {
    final uploadTasks = <Future<void>>[];
    if (songFilePath != null && songUrl != null) {
      final audioBytes = await File(songFilePath).readAsBytes();
      final mimeType = _getMimeTypeFromExtension(songFilePath);
      uploadTasks.add(_uploadToS3(songUrl, audioBytes, mimeType));
      print('Added song upload task for $songFilePath with MIME type: $mimeType');
    } else if (songFilePath != null) {
      print('Warning: Song file selected but no presigned URL for song.');
    }
    if (lyricsFilePath != null && lyricsUrl != null) {
      final lyricsBytes = await File(lyricsFilePath).readAsBytes();
      final mimeType = _getMimeTypeFromExtension(lyricsFilePath);
      uploadTasks.add(_uploadToS3(lyricsUrl, lyricsBytes, mimeType));
      print('Added lyrics upload task for $lyricsFilePath with MIME type: $mimeType');
    } else if (lyricsFilePath != null) {
      print('Warning: Lyrics file selected but no presigned URL for lyrics.');
    }
    if (coverImagePath != null && songCoverImageUrl != null) {
      final imageBytes = await File(coverImagePath).readAsBytes();
      final mimeType = _getMimeTypeFromExtension(coverImagePath);
      uploadTasks.add(_uploadToS3(songCoverImageUrl, imageBytes, mimeType));
      print('Added cover image upload task for $coverImagePath with MIME type: $mimeType');
    } else if (coverImagePath != null) {
      print('Warning: Cover image selected but no presigned URL for cover image.');
    }
    if (uploadTasks.isEmpty) {
      throw Exception('No files to upload');
    }
    await Future.wait(uploadTasks);
    print('All S3 upload tasks completed successfully.');
  }

  // Submit song
  Future<void> _submitSong() async {
    _safeSetState(() => _isSubmitting = true);
    try {
      bool agreed = await _showConfirmationDialog(context);
      if (!agreed) {
        _showSnackBar('Please agree to all terms to proceed.');
        _safeSetState(() => _isSubmitting = false); // Ensure submitting is reset if terms not agreed
        return;
      }
      final moodPace = _parseMoodAndPace(_moodPaceController.text);
      final nowTimestamp = _formatTimestamp(DateTime.now());
      String _sanitizeFileName(String filePath) {
        final fileName = _getFileName(filePath);
        return fileName.replaceAll(RegExp(r'[^\w\.\-]'), '_');
      }
      final songFileName = _pickedSongFilePath != null ? _sanitizeFileName(_pickedSongFilePath!) : '';
      final lyricsFileName = _pickedLyricsFilePath != null ? _sanitizeFileName(_pickedLyricsFilePath!) : '';
      final songCoverImageFileName = _pickedCoverImagePath != null ? _sanitizeFileName(_pickedCoverImagePath!) : '';
      if (songFileName.isEmpty) {
        _showSnackBar('Song file name is required');
        _safeSetState(() => _isSubmitting = false); // Ensure submitting is reset if song file name is empty
        return;
      }
      final presignedPayload = {
        'user_id': int.parse(widget.userId),
        'album_id': widget.albumId,
        'songs': [
          {
            'songName': songFileName,
            'lyricsFileName': lyricsFileName,
            if (songCoverImageFileName.isNotEmpty) 'songImageFileName': songCoverImageFileName,
          }
        ],
      };
      final jsonBody = jsonEncode(presignedPayload);
      print('Sending presigned URL payload: $jsonBody');
      final presignedRes = await ApiService.post(
        'https://y6mkdwd71i.execute-api.ap-south-1.amazonaws.com/voiznew/generate-presigned-urls-for-existing-album',
        body: presignedPayload,
      ).timeout(Duration(seconds: 30));
      print('Presigned URL response status: ${presignedRes.statusCode}, body: ${presignedRes.body}');
      if (presignedRes.statusCode != 200) {
        final body = jsonDecode(presignedRes.body);
        final errorMessage = body['error'] ?? 'Unknown error';
        throw Exception('Presigned URL fetch failed: $errorMessage');
      }
      final body = jsonDecode(presignedRes.body);
      if (!body['success'] || body['songs'] == null || body['songs'].isEmpty) {
        final errorMessage = body['message'] ?? 'Invalid presigned URL response';
        throw Exception(errorMessage);
      }
      final songData = body['songs'][0];
      final String? songS3Url = songData['songUrl'];
      final String? lyricsS3Url = songData['lyricsUrl'];
      final String? songCoverS3Url = songData['songImageUrl'];
      print('Starting S3 uploads for retrieved presigned URLs...');
      await _uploadFilesToS3(
        songUrl: songS3Url,
        lyricsUrl: lyricsS3Url,
        songCoverImageUrl: songCoverS3Url,
        songFilePath: _pickedSongFilePath,
        lyricsFilePath: _pickedLyricsFilePath,
        coverImagePath: _pickedCoverImagePath,
      );
      String songSpan = _spanController.text.trim();
      if (_pickedSongFilePath != null && (songSpan.isEmpty || !RegExp(r'\d{1,2}:\d{2}').hasMatch(songSpan))) {
        print('Calculating duration for song...');
        final durationMs = await AudioDuration.getAudioDuration(_pickedSongFilePath!);
        songSpan = durationMs != null && durationMs > 0 ? _formatDuration(durationMs) : '';
        print('Song duration set to: $songSpan');
      }
      final payload = {
        'album_id': widget.albumId,
        'user_id': widget.userId,
        'FullName': widget.userfullname,
        'createdTimestamp': nowTimestamp,
        'updatedTimestamp': nowTimestamp,
        'song': {
          'songName': _songNameController.text.trim(),
          'lyricsFileName': lyricsFileName,
          'fileName': songFileName,
          'singer': _singerNameController.text.trim(),
          'producer': _producerController.text.trim(),
          'composer': _composerController.text.trim(),
          'lyricist': _lyricistController.text.trim(),
          'songCoverImg': songCoverImageFileName,
          'genre': _selectedGenre!,
          'languages': _selectedLanguage!,
          'mood': moodPace['mood']!,
          'pace': moodPace['pace']!,
          'span': songSpan,
          'stage_name': _stageNameController.text.trim().isEmpty ? widget.userfullname : _stageNameController.text.trim(),
          'story': _storyBehindSongController.text.trim(),
          'createdTimestamp': nowTimestamp,
          'updatedTimestamp': nowTimestamp,
        },
      };
      print('Submitting song metadata with payload: ${jsonEncode(payload)}');
      final response = await ApiService.post(
        'https://g076kfytq4.execute-api.ap-south-1.amazonaws.com/voiznew/addSongToAlbum',
        body: payload,
      );
      print('Add Song API Response Status: ${response.statusCode}, Body: ${response.body}');
      if (ApiService.isSuccessResponse(response)) {
        // Song added successfully, now notify admins
        await _notifyAdmins(
          _songNameController.text.trim(),
          _singerNameController.text.trim(), // Assuming singerName is the artist name
        );
        _clearForm();
        await _showSuccessDialog(context);
      } else {
        String errorMessage = 'Failed to add song to album.';
        try {
          final errorResponse = jsonDecode(response.body);
          errorMessage = errorResponse['error'] ?? errorMessage;
        } catch (e) {
          print('Error parsing add song error response: $e');
        }
        throw Exception(errorMessage);
      }
    } catch (e) {
      print('Overall error during song submission: $e');
      _showResultDialog(
        title: 'Submission Error!',
        message: 'Error: ${e.toString().replaceFirst("Exception: ", "")}',
        isSuccess: false,
      );
    } finally {
      _safeSetState(() => _isSubmitting = false);
    }
  }

  // Validate and submit
  void _validateAndSubmit() {
    if (_isSubmitting) return;
    _safeSetState(() {
      _isSubmitted = true;
      _isSubmitting = true; // Set to true at the start of validation and submission process
    });
    if (!_validateForm()) {
      // Show only the first error as a snackbar
      if (_songNameError != null) {
        _showSnackBar(_songNameError!);
      } else if (_languageError != null) {
        _showSnackBar(_languageError!);
      } else if (_genreError != null) {
        _showSnackBar(_genreError!);
      } else if (_singerNameError != null) {
        _showSnackBar(_singerNameError!);
      } else if (_composerError != null) {
        _showSnackBar(_composerError!);
      } else if (_lyricistError != null) {
        _showSnackBar(_lyricistError!);
      } else if (_producerError != null) {
        _showSnackBar(_producerError!);
      } else if (_lyricsError != null) {
        _showSnackBar(_lyricsError!);
      } else if (_songFileError != null) {
        _showSnackBar(_songFileError!);
      } else if (widget.albumId.isEmpty) {
        _showSnackBar('Album ID is required');
      } else if (_storyError != null) {
        _showSnackBar(_storyError!);
      }
      _safeSetState(() => _isSubmitting = false); // Reset submitting if validation fails
      return;
    }
    _submitSong();
  }

  Widget _buildCheckbox({
    required String text,
    required bool value,
    required Function(bool?) onChanged,
    String? hyperlinkText,
    VoidCallback? onHyperlinkTap,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Transform.scale(
          scale: 1.2,
          child: Checkbox(
            value: value,
            onChanged: onChanged,
            activeColor: Color(0xFF2364C6),
            fillColor: MaterialStateProperty.resolveWith<Color>(
                  (states) => states.contains(MaterialState.selected) ? Color(0xFF2364C6) : Colors.white,
            ),
            checkColor: Colors.white,
          ),
        ),
        Expanded(
          child: Padding(
            padding: EdgeInsets.only(top: 12),
            child: Text.rich(
              TextSpan(
                children: [
                  TextSpan(
                    text: hyperlinkText != null ? text.replaceAll(hyperlinkText, '') : text,
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontStyle: FontStyle.italic,
                      fontFamily: 'Poppins',
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  if (hyperlinkText != null)
                    TextSpan(
                      text: hyperlinkText,
                      style: TextStyle(
                        fontSize: 16,
                        fontStyle: FontStyle.italic,
                        fontFamily: 'Poppins',
                        color: Color(0xFF4297FF),
                        fontWeight: FontWeight.w600,
                      ),
                      recognizer: TapGestureRecognizer()..onTap = onHyperlinkTap,
                    ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  // Clear form
  void _clearForm() {
    _songNameController.clear();
    _moodPaceController.clear();
    _storyBehindSongController.clear();
    _singerNameController.clear();
    _producerController.clear();
    _composerController.clear();
    _lyricistController.clear();
    _stageNameController.clear();
    _spanController.clear();
    _safeSetState(() {
      _selectedLanguage = null;
      _selectedGenre = null;
      _pickedLyricsFilePath = null;
      _pickedSongFilePath = null;
      _pickedCoverImagePath = null;
      _languageError = null;
      _songNameError = null;
      _genreError = null;
      _storyError = null;
      _singerNameError = null;
      _composerError = null;
      _lyricistError = null;
      _producerError = null;
      _lyricsError = null;
      _songFileError = null;
      _coverImageError = null;
      _isStorySubmitted = false;
      _isStoryWordLimitExceeded = false;
      _isSubmitted = false;
      _isTermsAccepted = false; // Reset terms acceptance
      _isContentPolicyAccepted = false; // Reset content policy acceptance
      _isCopyrightAccepted = false; // Reset copyright acceptance
    });
  }

  // Build text field
  Widget _buildTextField({
    required String labelText,
    required TextEditingController controller,
    String? hintText,
    String? errorText,
    int maxLines = 1,
    String? infoText,
    bool required = false,
  }) {
    String? computedErrorText;
    if (_isSubmitted) {
      computedErrorText = required && controller.text.trim().isEmpty
          ? '$labelText is required'
          : errorText; // Use custom error if provided (e.g., story word limit)
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 13.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: double.infinity,
            height: maxLines > 1 ? null : 60,
            child: TextField(
              controller: controller,
              maxLines: maxLines,
              cursorColor: Colors.black,
              style: TextStyle(
                color: Colors.black,
                fontSize: 16,
                fontFamily: 'Poppins',
                decorationThickness: 0,
              ),
              inputFormatters: labelText == 'Story Behind the Song'
                  ? [
                TextInputFormatter.withFunction((oldValue, newValue) {
                  final words = _getWordCount(newValue.text);
                  if (words <= _maxStoryWords) {
                    _safeSetState(() => _isStoryWordLimitExceeded = false);
                    return newValue;
                  } else {
                    _safeSetState(() => _isStoryWordLimitExceeded = true);
                    FocusScope.of(context).unfocus();
                    _showSnackBar('You have reached the $_maxStoryWords-word limit');
                    return oldValue;
                  }
                }),
              ]
                  : [],
              decoration: InputDecoration(
                label: RichText(
                  text: TextSpan(
                    text: labelText.replaceAll(': *', '').replaceAll(':', ''),
                    style: TextStyle(
                      color: Colors.black,
                      fontSize: 16,
                      fontFamily: 'Poppins',
                    ),
                  ),
                ),
                labelStyle: TextStyle(
                  color: Colors.black,
                  fontSize: 16,
                  fontFamily: 'Poppins',
                ),
                hintText: hintText,
                hintStyle: TextStyle(
                  color: Colors.grey[500],
                  fontSize: 14,
                  fontFamily: 'Poppins',
                ),
                fillColor: Color(0xFFFFFFFF).withOpacity(0.8),
                filled: true,
                floatingLabelBehavior: FloatingLabelBehavior.never,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8.0),
                  borderSide: BorderSide(color: computedErrorText != null ? Colors.red : Colors.black, width: 1.0),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8.0),
                  borderSide: BorderSide(color: computedErrorText != null ? Colors.red : Colors.black, width: 1.0),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8.0),
                  borderSide: BorderSide(color: computedErrorText != null ? Colors.red : Colors.black, width: 2.0),
                ),
                errorText: computedErrorText ?? (labelText == 'Story Behind the Song' ? _validateStoryField(controller.text) : null),
                errorStyle: TextStyle(
                  color: Colors.red,
                  fontSize: 12,
                  fontFamily: 'Poppins',
                ),
                suffixIcon: infoText != null
                    ? RightPinInfoIconWithTooltip(
                  title: labelText.replaceAll(': *', '').replaceAll(':', ''),
                  infoText: 'What inspired you to make this song',
                  boldInfoText: '',
                  iconColor: labelText == 'Story Behind the Song' ? Colors.black : Colors.white,
                )
                    : null,
              ),
              onChanged: labelText == 'Story Behind the Song'
                  ? (value) {
                _safeSetState(() {
                  _storyError = _validateStoryField(value);
                });
              }
                  : null,
            ),
          ),
          if (labelText == 'Story Behind the Song' && _isStoryWordLimitExceeded)
            Padding(
              padding: const EdgeInsets.only(top: 4.0),
              child: Text(
                'You have reached the $_maxStoryWords-word limit.',
                style: TextStyle(
                  color: Colors.red,
                  fontSize: 12,
                  fontFamily: 'Poppins',
                ),
              ),
            ),
        ],
      ),
    );
  }

  // Build dropdown
  Widget _buildDropdown({
    required String? value,
    required String label,
    required List<String> items,
    required Function(String?) onChanged,
    String? errorText,
    String? hintText,
  }) {
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
              offset: Offset(MediaQuery.of(context).size.width - 200, -4),
            ),
            buttonStyleData: ButtonStyleData(
              height: 55,
              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: Color(0xFFFFFFFF).withOpacity(0.8),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: errorText != null ? Colors.red : Colors.black, width: 1.0),
              ),
            ),
            iconStyleData: IconStyleData(
              icon: Image.asset('assets/DropMenuVector.png', width: 24, height: 24),
              iconSize: 24,
              iconEnabledColor: Colors.black,
            ),
            menuItemStyleData: MenuItemStyleData(height: 40, padding: EdgeInsets.symmetric(horizontal: 16)),
            items: items
                .map((item) => DropdownMenuItem<String>(
              value: item,
              child: Text(item, style: TextStyle(color: Colors.white, fontSize: 16, fontFamily: 'Poppins')),
            ))
                .toList(),
            selectedItemBuilder: (context) => items
                .map((item) => Container(
              alignment: Alignment.centerLeft,
              child: Text(item, style: TextStyle(color: Colors.black, fontSize: 16, fontFamily: 'Poppins')),
            ))
                .toList(),
            hint: Text(hintText ?? label, style: TextStyle(color: Colors.black, fontSize: 16, fontFamily: 'Poppins')),
            onChanged: onChanged,
          ),
        ),
        if (errorText != null)
          Padding(
            padding: EdgeInsets.only(top: 4.0),
            child: Text(errorText, style: TextStyle(color: Colors.red, fontSize: 12, fontFamily: 'Poppins')),
          ),
      ],
    );
  }

  Widget _buildUploadButton({
    required VoidCallback onPressed,
    required String label,
    IconData? icon,
    bool isLoading = false,
    String? selectedFileName,
    String? errorText,
    bool required = false,
  }) {
    String? computedErrorText = errorText;
    if (required && _isSubmitted && selectedFileName == null) {
      computedErrorText = errorText ?? '$label is required';
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        ElevatedButton(
          onPressed: isLoading ? null : onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: Color(0xFF2644D9),
            minimumSize: Size(170, 50),
            padding: EdgeInsets.symmetric(horizontal: 8.0, vertical: 4.0),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30.0)),
            shadowColor: Colors.black.withOpacity(0.4),
            elevation: 5,
          ),
          child: isLoading
              ? SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.0),
          )
              : Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (icon != null)
                Icon(
                  selectedFileName != null ? Icons.check_circle_outline : icon,
                  color: Colors.white,
                  size: 20,
                ),
              if (icon != null) SizedBox(width: 5),
              Flexible(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      selectedFileName ?? label,
                      style: TextStyle(
                        color: selectedFileName != null ? Colors.grey[400] : Colors.white,
                        fontSize: 12.0,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        // Red warning removed — validation logic above still sets computedErrorText
      ],
    );
  }


  // --- Start of _notifyAdmins and _sendFallbackNotification methods ---
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
  // --- End of _notifyAdmins and _sendFallbackNotification methods ---


  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        PageWithBottomNav(
          email: widget.userId,
          fullName: widget.userfullname,
          category: 'Singer',
          currentIndex: 3,
          isFromNewHomePage: false,
          child: GradientScaffold(
            appBar: AppBar(
              automaticallyImplyLeading: false,
              titleSpacing: 0,
              title: Row(
                children: [
                  IconButton(
                    icon: Icon(Icons.arrow_back_ios, color: Colors.white),
                    onPressed: () => Navigator.pop(context),
                  ),
                  Expanded(
                    child: Text(
                      'Upload to Album',
                      style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              backgroundColor: Colors.transparent,
            ),
            body: SafeArea(
              bottom: true,
              child: SingleChildScrollView(
                padding: EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildTextField(
                      labelText: 'Song Name',
                      controller: _songNameController,
                      hintText: 'Enter song name',
                      required: true,
                    ),
                    SizedBox(height: 13.0),
                    _buildDropdown(
                      label: 'Language',
                      value: _selectedLanguage,
                      items: _languages,
                      onChanged: (value) => _safeSetState(() {
                        _selectedLanguage = value;
                        _languageError = null;
                      }),
                      errorText: _languageError,
                      hintText: 'Language',
                    ),
                    SizedBox(height: 13.0),
                    _buildDropdown(
                      label: 'Genre',
                      value: _selectedGenre,
                      items: _genres,
                      onChanged: (value) => _safeSetState(() {
                        _selectedGenre = value;
                        _genreError = null;
                      }),
                      errorText: _genreError,
                      hintText: 'Genre',
                    ),
                    SizedBox(height: 13.0),
                    _buildTextField(
                      labelText: 'Mood and Pace',
                      controller: _moodPaceController,
                      hintText: 'Enter mood and pace',
                    ),
                    SizedBox(height: 13.0),
                    _buildTextField(
                      labelText: 'Story Behind the Song',
                      controller: _storyBehindSongController,
                      hintText: 'What inspired you to make this song',
                      maxLines: 4,
                      infoText: 'What inspired you to make this song',
                    ),
                    SizedBox(height: 13.0),
                    _buildTextField(
                      labelText: 'Singer Name',
                      controller: _singerNameController,
                      hintText: 'Enter singer name',
                      errorText: _singerNameError,
                      required: true,
                    ),
                    SizedBox(height: 13.0),
                    _buildTextField(
                      labelText: 'Composer',
                      controller: _composerController,
                      hintText: 'Enter composer name',
                      errorText: _composerError,
                      required: true,
                    ),
                    SizedBox(height: 13.0),
                    _buildTextField(
                      labelText: 'Lyricist',
                      controller: _lyricistController,
                      hintText: 'Enter lyricist name',
                      errorText: _lyricistError,
                      required: true,
                    ),
                    SizedBox(height: 13.0),
                    _buildTextField(
                      labelText: 'Producer',
                      controller: _producerController,
                      hintText: 'Enter producer name',
                      errorText: _producerError,
                      required: true,
                    ),
                    SizedBox(height: 13.0),
                    Center(
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              _buildUploadButton(
                                onPressed: _pickLyricsFile,
                                label: 'Upload Lyrics',
                                icon: null, // Removed icon
                                isLoading: _isLyricsButtonLoading,
                                selectedFileName: _pickedLyricsFilePath != null ? _getFileName(_pickedLyricsFilePath!) : null,
                                errorText: _lyricsError,
                                required: true,
                              ),
                              SizedBox(width: 10),
                              RightPinInfoIconWithTooltip(
                                title: 'Upload Lyrics',
                                infoText: 'Supported file formats: ',
                                boldInfoText: '.doc, .docx, .pdf and .txt',
                                iconColor: Colors.white,
                              ),
                            ],
                          ),
                          SizedBox(height: 15.0),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              _buildUploadButton(
                                onPressed: _pickSongFile,
                                label: 'Upload Song',
                                icon: null, // Removed icon
                                isLoading: _isSongButtonLoading,
                                selectedFileName: _pickedSongFilePath != null ? _getFileName(_pickedSongFilePath!) : null,
                                errorText: _songFileError,
                                required: true,
                              ),
                              SizedBox(width: 10),
                              RightPinInfoIconWithTooltip(
                                title: 'Upload Song',
                                infoText: 'Supported file formats: ',
                                boldInfoText: '.mp3 and .wav',
                                iconColor: Colors.white,
                              ),
                            ],
                          ),
                          SizedBox(height: 15.0),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              _buildUploadButton(
                                onPressed: _pickCoverImage,
                                label: 'Upload Cover Page',
                                icon: null, // Kept icon
                                isLoading: _isCoverImageButtonLoading,
                                selectedFileName: _pickedCoverImagePath != null ? _getFileName(_pickedCoverImagePath!) : null,
                                errorText: _coverImageError,
                              ),
                              SizedBox(width: 10),
                              RightPinInfoIconWithTooltip(
                                title: 'Upload Cover Page',
                                infoText: 'Supported image formats: ',
                                boldInfoText: '.jpg, .jpeg and .png',
                                iconColor: Colors.white,
                              ),
                            ],
                          ),
                          SizedBox(height: 30.0),
                          ElevatedButton(
                            onPressed: _isSubmitting ? null : _validateAndSubmit,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: _isSubmitting ? Colors.grey : Color(0xFF2644D9),
                              minimumSize: Size(250, 50),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30.0)),
                              shadowColor: Colors.black.withOpacity(0.4),
                              elevation: 5,
                            ),
                            child: _isSubmitting
                                ? Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.0),
                                ),
                                SizedBox(width: 10),
                                Text(
                                  'Adding Song...',
                                  style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                                ),
                              ],
                            )
                                : Text(
                              'Add Song',
                              style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                            ),
                          ),
                          SizedBox(height: kBottomNavigationBarHeight + 20),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

// Tooltip classes (unchanged)
class RightPinTooltipPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Color(0xFF151415)
      ..style = PaintingStyle.fill
      ..isAntiAlias = true;
    final path = Path();
    final cornerRadius = 30.0;
    path.moveTo(0, cornerRadius);
    path.quadraticBezierTo(0, 0, cornerRadius, 0);
    path.lineTo(size.width - cornerRadius, 0);
    path.lineTo(size.width, 0);
    path.lineTo(size.width, size.height - cornerRadius);
    path.quadraticBezierTo(size.width, size.height, size.width - cornerRadius, size.height);
    path.lineTo(cornerRadius, size.height);
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

  const RightPinTooltip({
    Key? key,
    required this.title,
    required this.infoText,
    required this.boldInfoText,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 273,
      height: 145,
      child: Stack(
        children: [
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
                  BoxShadow(color: Colors.white.withOpacity(0.3), blurRadius: 15, spreadRadius: 1),
                  BoxShadow(color: Colors.white.withOpacity(0.4), blurRadius: 12, spreadRadius: -2, offset: Offset(8, 0)),
                  BoxShadow(color: Colors.white.withOpacity(0.4), blurRadius: 12, spreadRadius: -2, offset: Offset(6, 8)),
                  BoxShadow(color: Colors.white.withOpacity(0.5), blurRadius: 12, spreadRadius: -3, offset: Offset(6, 6)),
                ],
              ),
            ),
          ),
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
                      style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600),
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
  final Color iconColor;

  const RightPinInfoIconWithTooltip({
    Key? key,
    required this.title,
    required this.infoText,
    required this.boldInfoText,
    this.iconColor = Colors.white,
  }) : super(key: key);

  @override
  _RightPinInfoIconWithTooltipState createState() => _RightPinInfoIconWithTooltipState();
}

class _RightPinInfoIconWithTooltipState extends State<RightPinInfoIconWithTooltip> with SingleTickerProviderStateMixin {
  final GlobalKey _toolTipKey = GlobalKey();
  OverlayEntry? _overlayEntry;
  bool _isOverlayVisible = false;
  bool _disposed = false;
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: Duration(milliseconds: 300));
    _scaleAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutBack));
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
          padding: EdgeInsets.all(8),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            boxShadow: _isOverlayVisible
                ? [BoxShadow(color: Colors.blue.withOpacity(0.5), blurRadius: 10, spreadRadius: 2)]
                : [],
          ),
          child: Icon(Icons.info_outline, color: widget.iconColor, size: 32),
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
                    child: Container(color: Colors.black.withOpacity(0.5)),
                  ),
                ),
              ),
              Positioned(
                left: offset.dx - 230 > 0 ? offset.dx - 230 : 10,
                top: offset.dy - 40,
                child: Transform.scale(
                  scale: _scaleAnimation.value,
                  child: Material(
                    color: Colors.transparent,
                    child: RightPinTooltip(
                      title: widget.title,
                      infoText: widget.infoText,
                      boldInfoText: widget.boldInfoText,
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
      setState(() => _isOverlayVisible = true);
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
        setState(() => _isOverlayVisible = false);
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
