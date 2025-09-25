import 'dart:io';
import 'dart:async';
import 'dart:ui'; // Import for ImageFilter
import 'package:audio_duration/audio_duration.dart';
import 'package:flutter/gestures.dart'; // Import for TapGestureRecognizer
import 'package:flutter/material.dart';
import 'package:flutter/services.dart'; // Import for TextInputFormatter
import 'package:file_picker/file_picker.dart';
import 'package:dropdown_button2/dropdown_button2.dart';
import 'package:voiceapp/Song%20Upload/upload_selection_page.dart';
import 'package:voiceapp/main.dart'; // Assuming GradientScaffold and PageWithBottomNav are here
import 'package:voiceapp/connectivity_service.dart';
import 'package:voiceapp/loading_screen.dart';
import 'package:url_launcher/url_launcher.dart';
import '../NewHomepage.dart';
import '../bottomnavigationbar.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';
import 'dart:convert';
import 'package:image_picker/image_picker.dart';
import '../profile_manager.dart';


// SongData class remains unchanged
class SongData {
  String albumName;
  String songName;
  String language;
  String genre;
  String moodandPace;
  String storyBehind;
  String singer;
  String composer;
  String lyricist;
  String producer;
  File? lyricsFile;
  File? songFile;
  File? songCoverFile;
  String? lyricsFileName;
  String? songFileName;
  String? songCoverFileName;
  String? span;

  SongData({
    this.albumName = '',
    this.songName = '',
    this.language = '',
    this.genre = '',
    this.moodandPace = '',
    this.storyBehind = '',
    this.singer = '',
    this.composer = '',
    this.lyricist = '',
    this.producer = '',
    this.lyricsFile,
    this.songFile,
    this.songCoverFile,
    this.lyricsFileName,
    this.songFileName,
    this.songCoverFileName,
    required this.span,
  });

  Map<String, dynamic> toJson() {
    return {
      'albumName': albumName,
      'songName': songName,
      'language': language,
      'genre': genre,
      'moodandPace': moodandPace,
      'story': storyBehind,
      'singer': singer,
      'composer': composer,
      'lyricist': lyricist,
      'producer': producer,
      'lyricsFileName': lyricsFileName,
      'songFileName': songFileName,
      'songCoverFileName': songCoverFileName,
      'span': span,
    };
  }
}

class UploadMultipleSongsPage extends StatefulWidget {
  final String email;
  final String fullName;
  final bool isFromNewHomePage;

  UploadMultipleSongsPage({
    required this.email,
    required this.fullName,
    this.isFromNewHomePage = false,
  });


  @override
  _UploadMultipleSongsPageState createState() => _UploadMultipleSongsPageState();
}

class _UploadMultipleSongsPageState extends State<UploadMultipleSongsPage> {
  bool _isLoading = false;
  bool _isNoInternet = false;
  late ConnectivityService _connectivityService;
  bool _mounted = true;
  bool _isAddingSong = false; // NEW: Debounce flag to prevent multiple validations

  // Form controllers
  final _albumNameController = TextEditingController();
  final _songNameController = TextEditingController();
  final _moodandpaceController = TextEditingController();
  final _storyBehindController = TextEditingController();
  final _singerController = TextEditingController();
  final _composerController = TextEditingController();
  final _lyricistController = TextEditingController();
  final _producerController = TextEditingController();

  // Dropdown values
  String? _selectedLanguage;
  String? _selectedGenre;

  // Files
  File? _lyricsFile;
  File? _songFile;
  File? _albumCoverFile;
  File? _songCoverFile;
  String? _lyricsFileName;
  String? _moodandpaceError;
  String? _songFileName;
  String? _albumCoverFileName;
  String? _songCoverFileName;

  // Flag to track if album name and cover should be locked
  bool _isAlbumInfoLocked = false;
  bool _isAlbumCoverUploaded = false; // Flag to track if album cover has been uploaded

  // Upload loading state
  bool _isUploadLoading = false;
  bool _isProcessingSongs = false;

  // Stored songs list
  List<SongData> _storedSongs = [];
  int _currentSongIndex = 1;

  // Error texts
  String? _albumNameError;
  String? _songNameError;
  String? _languageError;
  String? _genreError;
  String? _songFileError;
  String? _albumCoverError;
  String? _songCoverError;
  String? _singerError;
  String? _composerError;
  String? _lyricistError;
  String? _producerError;
  String? _lyricsError;
  String? _storyError;
  bool _isStoryWordLimitExceeded = false;

  // Checkbox states for upload validation
  bool _isTermsAccepted = false;
  bool _isContentPolicyAccepted = false;
  bool _isCopyrightAccepted = false;

  // Constants for validation
  static const int _maxStoryWords = 400;
  static const int _maxSongsLimit = 10; // New: Maximum limit for songs

  // Dropdown options
  final List<String> _languages = [
    'Assamese', 'Bengali', 'Bhojpuri', 'English',
    'Gujarati', 'Hindi', 'Kannada', 'Kashmiri',
    'Konkani', 'Malayalam', 'Manipuri', 'Marathi',
    'Odia', 'Pahari', 'Punjabi', 'Rajasthani',
    'Sanskrit', 'Tamil', 'Telugu', 'Urdu'
  ];

  final List<String> _genres = [
    'Classical', 'Devotional', 'Folk', 'Fusion',
    'Ghazal', 'Jazz', 'Pop', 'Rabindra Sangeet',
    'Rap', 'Rock', 'Romantic', 'Sufi', 'Others'
  ];

  // Computed property for upload button state
  bool get canUpload => _isTermsAccepted && _isContentPolicyAccepted && _isCopyrightAccepted;

  @override
  void initState() {
    super.initState();
    _connectivityService = ConnectivityService();
    _setupConnectivityListener();
  }

  void _setupConnectivityListener() {
    _connectivityService.connectionStream.listen((hasConnection) {
      if (!_mounted || _connectivityService.isClosed) return;
      setState(() {
        _isNoInternet = !hasConnection;
      });
    });
    _checkConnectivity();
  }

  Future<void> _checkConnectivity() async {
    if (!_mounted) return;
    setState(() => _isLoading = true);
    await _connectivityService.checkConnection();
    if (!_mounted) return;
    setState(() {
      _isNoInternet = !_connectivityService.hasConnection;
      _isLoading = false;
    });
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
    _moodandpaceController.dispose();
    _albumNameController.dispose();
    _songNameController.dispose();
    _storyBehindController.dispose();
    _singerController.dispose();
    _composerController.dispose();
    _lyricistController.dispose();
    _producerController.dispose();
    super.dispose();
  }

  Future<bool> _onWillPop() async {
    print("Physical back button clicked");

    if (_isUploadLoading) {
      print('Upload in progress, preventing back navigation');
      _showSnackBar('Please wait, upload is in progress.');
      return false;
    }

    // Close all open tooltips
    bool isAnyTooltipOpen = false;
    for (final state in _RightPinInfoIconWithTooltipState._tooltipStates) {
      if (state._isOverlayVisible) {
        print('Closing tooltip for ${state.widget.title}');
        state._removeOverlay();
        isAnyTooltipOpen = true;
      }
    }

    if (isAnyTooltipOpen) {
      print("Tooltip was open, staying on current screen");
      await Future.delayed(Duration(milliseconds: 100));
      return false;
    }

    if (widget.isFromNewHomePage) {
      print("Going back to first screen");
      Navigator.of(context).popUntil((route) => route.isFirst);
      return false;
    } else {
      print("Replacing with UploadSelectionPage");
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => UploadSelectionPage(
            email: widget.email,
            fullName: widget.fullName,
          ),
        ),
      );
      return false;
    }
  }

  void _handleBackPress() {
    if (_isUploadLoading) {
      print('Upload in progress, preventing back navigation');
      _showSnackBar('Please wait, upload is in progress.');
      return;
    }

    if (widget.isFromNewHomePage) {
      print('Navigating back from NewHomePage');
      Navigator.of(context).pop();
    } else {
      print('Replacing with UploadSelectionPage');
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => UploadSelectionPage(
            email: widget.email,
            fullName: widget.fullName,
          ),
        ),
      );
    }
  }

  // Helper to validate story field word count
  String? _validateStoryField(String text) {
    final words = _getWordCount(text);
    if (words > _maxStoryWords) {
      return 'The story exceeds the $_maxStoryWords-word limit';
    }
    return null;
  }

  int _getWordCount(String text) {
    final normalizedText = text.trim().replaceAll(RegExp(r'\s+'), ' ');
    return normalizedText.isEmpty ? 0 : normalizedText.split(' ').length;
  }
  void _showSnackBar(String message, {Color backgroundColor = Colors.red}) {
    if (mounted) {
      ScaffoldMessenger.of(context).clearSnackBars();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: backgroundColor,
          duration: Duration(seconds: 3),
        ),
      );
    }
  }

  Future<void> _addNextSong() async {
    if (_isAddingSong) return; // Prevent re-entrant calls

    // NEW: Check max song limit before processing
    if (_storedSongs.length >= _maxSongsLimit) {
      _showSnackBar('You have reached the maximum limit of $_maxSongsLimit songs. Please upload the current batch.');
      return; // Do not add song if limit is reached
    }

    setState(() {
      _isAddingSong = true;
    });

    try {
      // Clear previous error states
      setState(() {
        _albumNameError = null;
        _albumCoverError = null;
        _songNameError = null;
        _languageError = null;
        _genreError = null;
        _singerError = null;
        _composerError = null;
        _producerError = null;
        _lyricistError = null;
        _lyricsError = null;
        _songFileError = null;
        _songCoverError = null;
        _storyError = null;
        _moodandpaceError = null;
      });

      // Perform validation
      bool hasErrors = false;
      setState(() {
        if (!_isAlbumInfoLocked) {
          if (_albumNameController.text.trim().isEmpty) {
            _albumNameError = 'Album name is required';
            _showSnackBar('Please enter album name');
            hasErrors = true;
          }
        }
        if (_songNameController.text.trim().isEmpty) {
          _songNameError = 'Song name is required';
          _showSnackBar('Please enter song name');
          hasErrors = true;
        }
        if (_selectedLanguage == null) {
          _languageError = 'Language is required';
          _showSnackBar('Please select a language');
          hasErrors = true;
        }
        if (_selectedGenre == null) {
          _genreError = 'Genre is required';
          _showSnackBar('Please select a genre');
          hasErrors = true;
        }
        if (_singerController.text.trim().isEmpty) {
          _singerError = 'Singer name is required';
          _showSnackBar('Please enter singer name');
          hasErrors = true;
        }
        if (_composerController.text.trim().isEmpty) {
          _composerError = 'Composer name is required';
          _showSnackBar('Please enter composer name');
          hasErrors = true;
        }
        if (_producerController.text.trim().isEmpty) {
          _producerError = 'Producer name is required';
          _showSnackBar('Please enter producer name');
          hasErrors = true;
        }
        if (_lyricistController.text.trim().isEmpty) {
          _lyricistError = 'Lyricist name is required';
          _showSnackBar('Please enter lyricist name');
          hasErrors = true;
        }
        if (_lyricsFile == null) {
          _lyricsError = 'Lyrics file is required';
          _showSnackBar('Please upload a lyrics file');
          hasErrors = true;
        }
        if (_songFile == null) {
          _songFileError = 'Song file is required';
          _showSnackBar('Please upload a song file');
          hasErrors = true;
        }
        _storyError = _validateStoryField(_storyBehindController.text);
        if (_storyError != null) {
          _showSnackBar(_storyError!);
          hasErrors = true;
        }
      });

      if (hasErrors) {
        return;
      }

      // Check for duplicate song
      final String currentSongName = _songNameController.text.trim().toLowerCase();
      final String currentSinger = _singerController.text.trim().toLowerCase();
      for (final SongData existingSong in _storedSongs) {
        if (existingSong.songName.toLowerCase() == currentSongName &&
            existingSong.singer.toLowerCase() == currentSinger) {
          _showSnackBar('This song has already been added.');
          return;
        }
      }

      String? formattedDuration;
      if (_songFile != null) {
        try {
          var durationInMilliseconds = await AudioDuration.getAudioDuration(_songFile!.path);
          if (durationInMilliseconds == null || durationInMilliseconds <= 0) {
            _showSnackBar('Invalid audio file: Unable to determine duration');
            return;
          }
          formattedDuration = _formatDuration(durationInMilliseconds);
        } catch (e) {
          _showSnackBar('Error calculating song duration: $e');
          return;
        }
      } else {
        _showSnackBar('Song file is required');
        return;
      }

      String finalAlbumName = _albumNameController.text.trim();
      String finalMoodAndPace = _moodandpaceController.text.trim();

      if (_isAlbumInfoLocked && _storedSongs.isNotEmpty) {
        finalAlbumName = _storedSongs.first.albumName;
      }

      final songData = SongData(
        moodandPace: finalMoodAndPace,
        albumName: finalAlbumName,
        songName: _songNameController.text.trim(),
        language: _selectedLanguage!,
        genre: _selectedGenre!,
        storyBehind: _storyBehindController.text.trim(),
        singer: _singerController.text.trim(),
        composer: _composerController.text.trim(),
        lyricist: _lyricistController.text.trim(),
        producer: _producerController.text.trim(),
        lyricsFile: _lyricsFile,
        songFile: _songFile,
        songCoverFile: _songCoverFile,
        lyricsFileName: _lyricsFileName,
        songFileName: _songFileName,
        songCoverFileName: _songCoverFileName,
        span: formattedDuration!,
      );

      setState(() {
        _storedSongs.add(songData);
        _currentSongIndex++;
        if (!_isAlbumInfoLocked) {
          _isAlbumInfoLocked = true;
        }
        _clearForm();
      });

      _showSnackBar('Song ${_currentSongIndex - 1} added successfully!', backgroundColor: Colors.green);

      // NEW: Show notification if max limit is reached after adding the current song
      if (_storedSongs.length >= _maxSongsLimit) {
        _showSnackBar('You have reached the maximum limit of $_maxSongsLimit songs. Please upload the current batch.');
      }

    } finally {
      setState(() {
        _isAddingSong = false;
      });
    }
  }

  void _clearForm() {
    print('Clearing form');
    _moodandpaceController.clear();
    if (!_isAlbumInfoLocked) {
      _albumNameController.clear();
    }
    _songNameController.clear();
    _storyBehindController.clear();
    _singerController.clear();
    _composerController.clear();
    _lyricistController.clear();
    _producerController.clear();

    setState(() {
      _selectedLanguage = null;
      _selectedGenre = null;
      _lyricsFile = null;
      _songFile = null;
      _songCoverFile = null;
      _lyricsFileName = null;
      _songFileName = null;
      _songCoverFileName = null;
      _albumNameError = null;
      _albumCoverError = null;
      _songNameError = null;
      _languageError = null;
      _genreError = null;
      _singerError = null;
      _composerError = null;
      _producerError = null;
      _lyricistError = null;
      _lyricsError = null;
      _songFileError = null;
      _songCoverError = null;
      _storyError = null;
      _moodandpaceError = null;
      _isStoryWordLimitExceeded = false;
    });
  }

  Future<void> _pickLyricsFile() async {
    try {
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['txt', 'doc', 'docx', 'pdf'],
      );

      if (result != null) {
        setState(() {
          _lyricsFile = File(result.files.single.path!);
          _lyricsFileName = result.files.single.name;
          _lyricsError = null;
        });
      }
    } catch (e) {
      _showSnackBar('Error picking lyrics file: $e');
    }
  }

  Future<void> _pickSongFile() async {
    try {
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['mp3', 'wav', 'aac', 'm4a', 'flac'],
      );

      if (result != null) {
        final file = File(result.files.single.path!);
        var durationInMilliseconds = await AudioDuration.getAudioDuration(file.path);
        if (durationInMilliseconds == null || durationInMilliseconds <= 0) {
          _showSnackBar('Invalid audio file: Unable to determine duration');
          return;
        }
        setState(() {
          _songFile = file;
          _songFileName = result.files.single.name;
          _songFileError = null;
        });
      }
    } catch (e) {
      _showSnackBar('Error picking song file: $e');
    }
  }

  Future<void> _pickAlbumCoverFile() async {
    try {
      final picker = ImagePicker();
      final image = await picker.pickImage(source: ImageSource.gallery);
      if (image != null) {
        setState(() {
          _albumCoverFile = File(image.path);
          _albumCoverFileName = image.name;
          _albumCoverError = null;
        });
      } else {
        print('Album cover picking cancelled');
      }
    } catch (e) {
      _showSnackBar('Error picking album cover file: $e');
    }
  }

  Future<void> _pickSongCoverFile() async {
    try {
      final picker = ImagePicker();
      final image = await picker.pickImage(source: ImageSource.gallery);
      if (image != null) {
        setState(() {
          _songCoverFile = File(image.path);
          _songCoverFileName = image.name;
          _songCoverError = null;
        });
      } else {
        print('Song cover picking cancelled');
      }
    } catch (e) {
      _showSnackBar('Error picking song cover file: $e');
    }
  }

  void _onCheckboxChanged(bool? value, String type) {
    print('Console: Checkbox $type changed to $value');
    setState(() {
      switch (type) {
        case 'terms':
          _isTermsAccepted = value ?? false;
          break;
        case 'policy':
          _isContentPolicyAccepted = value ?? false;
          break;
        case 'copyright':
          _isCopyrightAccepted = value ?? false;
          break;
      }
    });
  }

  String _formatDuration(int durationInMilliseconds) {
    final duration = Duration(milliseconds: durationInMilliseconds);
    final minutes = duration.inMinutes;
    final seconds = duration.inSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  Future<void> _uploadFile() async {
    if (_isNoInternet) {
      _showSnackBar('No internet connection. Please check your connection and try again.');
      return;
    }

    if (!canUpload) {
      _showSnackBar('Please accept all terms and conditions before uploading');
      return;
    }

    if (_storedSongs.isEmpty) {
      _showSnackBar('No songs to upload. Please add songs first.');
      return;
    }

    for (var song in _storedSongs) {
      if (song.songFile == null) {
        _showSnackBar('Audio file is required for ${song.songName}');
        return;
      }
    }

    setState(() {
      _isUploadLoading = true;
      _isLoading = true;
    });

    final Stopwatch _stopwatch = Stopwatch();
    _stopwatch.start();

    try {
      // Phase 1: Upload files to S3 in batches
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(Colors.white)),
              SizedBox(width: 16),
              Expanded(
                child: Text('Uploading ${_storedSongs.length} songs to secure storage. This may take a moment...', style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
          backgroundColor: Colors.blue.shade700,
          duration: Duration(minutes: 5),
          behavior: SnackBarBehavior.floating,
        ),
      );

      const int batchSize = 3;
      for (var i = 0; i < _storedSongs.length; i += batchSize) {
        final batch = _storedSongs.sublist(
          i,
          i + batchSize > _storedSongs.length ? _storedSongs.length : i + batchSize,
        );
        await Future.wait(batch.map((song) => _uploadSongFiles(song)));
      }

      // Hide previous snackbar and show new one for processing
      ScaffoldMessenger.of(context).hideCurrentSnackBar();

      // Phase 2: Process the songs
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(Colors.white)),
              SizedBox(width: 16),
              Expanded(
                child: Text('Processing song metadata. Please wait...', style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
          backgroundColor: Colors.deepPurple,
          duration: Duration(minutes: 2),
          behavior: SnackBarBehavior.floating,
        ),
      );

      await _processMultipleSongs();

      if (_storedSongs.isNotEmpty) {
        final List<String> songTitles = _storedSongs.map((song) => song.songName.trim()).toList();
        final String artistName = _singerController.text.trim().isNotEmpty ? _singerController.text.trim() : widget.fullName.trim();
        final String? albumName = _albumNameController.text.trim().isNotEmpty ? _albumNameController.text.trim() : null;
        await _notifyAdmins(songTitles, artistName, albumName: albumName);
      }

      _stopwatch.stop();
      final elapsedTime = _stopwatch.elapsed;
      print("Elapsed time: ${elapsedTime.inSeconds} seconds");

      ScaffoldMessenger.of(context).hideCurrentSnackBar();

    } catch (e) {
      ScaffoldMessenger.of(context).hideCurrentSnackBar();
      String errorMessage = 'Upload failed. Please check your connection and try again.';
      if (e.toString().contains('timed out')) {
        errorMessage = 'Upload timed out. Please try again with fewer songs or check your internet connection.';
      } else if (e.toString().contains('Exception: Missing')) {
        errorMessage = 'A file upload failed. Please ensure all required files are selected.';
      }
      _showSnackBar(errorMessage);
      print('Upload error occurred: $e');
    } finally {
      setState(() {
        _isUploadLoading = false;
        _isLoading = false;
      });
    }
  }

  Future<void> _uploadSongFiles(dynamic song) async {
    try {
      final audioBytes = File(song.songFile!.path).readAsBytesSync();
      final lyricsBytes = song.lyricsFile != null ? File(song.lyricsFile!.path).readAsBytesSync() : null;
      List<int>? songCoverBytes = song.songCoverFile != null ? File(song.songCoverFile!.path).readAsBytesSync() : null;
      List<int>? albumCoverBytes = _albumCoverFile != null ? File(_albumCoverFile!.path).readAsBytesSync() : null;

      if (song.span == null || song.span!.isEmpty || !RegExp(r'^\d{2}:\d{2}$').hasMatch(song.span!)) {
        print('Getting audio duration for ${song.songName}...');
        var durationInMilliseconds = await AudioDuration.getAudioDuration(song.songFile!.path);
        if (durationInMilliseconds == null || durationInMilliseconds <= 0) {
          throw Exception('Invalid audio file: Unable to determine duration');
        }
        song.span = _formatDuration(durationInMilliseconds);
        print('Set duration for ${song.songName}: ${song.span}');
      }

      final songFileNameWithExtension = '${song.songName?.trim()}.mp3';

      if (song.lyricsFileName == null || song.lyricsFileName!.trim().isEmpty) {
        song.lyricsFileName = '${song.songName?.trim()}_lyrics.txt';
        print('Generated lyrics filename: ${song.lyricsFileName}');
      }

      if (song.songCoverFile != null && (song.songCoverFileName == null || song.songCoverFileName!.trim().isEmpty)) {
        final extension = song.songCoverFile!.path.split('.').last.toLowerCase();
        song.songCoverFileName = '${song.songName?.trim()}_cover.$extension';
        print('Generated cover filename: ${song.songCoverFileName}');
      }

      print('Uploading files for ${song.songName}:');
      print('- Song file: $songFileNameWithExtension');
      print('- Lyrics file: ${song.lyricsFileName}');
      print('- Cover file: ${song.songCoverFileName}');
      print('- Duration: ${song.span}');

      final presignedResponse = await http.post(
        Uri.parse('https://3gvsubdh31.execute-api.ap-south-1.amazonaws.com/voiznew/generate-presigned-urls-bulk-parallel'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'songs': [
            {
              'songName': songFileNameWithExtension,
              'lyricsFileName': song.lyricsFileName,
              if (song.songCoverFileName != null && song.songCoverFileName!.trim().isNotEmpty)
                'songImageFileName': song.songCoverFileName!.trim(),
            }
          ],
          'user_id': widget.email,
          'albumName': _albumNameController.text.trim(),
          'albumCoverFileName': _albumCoverFileName,
        }),
      ).timeout(Duration(seconds: 30));
      if (presignedResponse.statusCode != 200) {
        throw Exception('Error fetching presigned URLs for ${song.songName}: ${presignedResponse.reasonPhrase}');
      }

      final responseBody = jsonDecode(presignedResponse.body);

      if (!responseBody['success'] || responseBody['songs'] == null || responseBody['songs'].isEmpty) {
        throw Exception('Invalid response structure for ${song.songName}');
      }

      final songData = responseBody['songs'][0];
      final songPresignedUrl = songData['songUrl'];
      final lyricsPresignedUrl = songData['lyricsUrl'];
      final songCoverPresignedUrl = songData['songImageUrl'];
      final albumCoverPresignedUrl = responseBody['albumCoverUrl'];

      if (songPresignedUrl == null) {
        throw Exception('Missing song presigned URL for ${song.songName}');
      }

      List<Future> uploads = [
        _uploadToS3(songPresignedUrl, audioBytes, 'audio/mpeg'),
      ];

      if (lyricsBytes != null && lyricsPresignedUrl != null) {
        uploads.add(_uploadToS3(lyricsPresignedUrl, lyricsBytes, 'text/plain'));
      } else if (song.lyricsFile != null) {
        print('Warning: Lyrics file provided but no presigned URL received for ${song.songName}');
      }

      if (songCoverBytes != null && songCoverPresignedUrl != null) {
        final coverMimeType = _getMimeTypeFromExtension(song.songCoverFile!.path);
        uploads.add(_uploadToS3(songCoverPresignedUrl, songCoverBytes, coverMimeType));
      } else if (song.songCoverFile != null) {
        print('Warning: Song cover file provided but no presigned URL received for ${song.songName}');
      }

      if (albumCoverBytes != null && albumCoverPresignedUrl != null && !_isAlbumCoverUploaded) {
        final albumCoverMimeType = _getMimeTypeFromExtension(_albumCoverFile!.path);
        uploads.add(_uploadToS3(albumCoverPresignedUrl, albumCoverBytes, albumCoverMimeType));
        setState(() {
          _isAlbumCoverUploaded = true;
        });
        print('✅ Successfully uploaded album cover: $_albumCoverFileName');
      } else if (_albumCoverFile != null && !_isAlbumCoverUploaded) {
        print('Warning: Album cover file provided but no presigned URL received for it, or already uploaded.');
      }

      await Future.wait(uploads);
      print('✅ Successfully uploaded all files for song: ${song.songName}');
    } catch (e) {
      print('❌ Error uploading files for ${song.songName}: $e');
      throw Exception('Failed to upload files for ${song.songName}: $e');
    }
  }

  String _getMimeTypeFromExtension(String filePath) {
    final extension = filePath.split('.').last.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      default:
        return 'image/*';
    }
  }

  Future<void> _notifyAdmins(dynamic songTitles, String artistName, {String? albumName}) async {
    // Fallback emails as per the React code
    final List<String> fallbackEmails = ["ankitad@cloudmotivglobal.com", "mriganka@voiz.co.in"];

    try {
      // Convert single string to list if necessary
      final List<String> songTitlesList = songTitles is String
          ? [songTitles]
          : List<String>.from(songTitles as List<dynamic>);

      if (songTitlesList.isEmpty) {
        print('No song titles provided, using fallback notification');
        await _sendFallbackNotification(songTitlesList, artistName, albumName: albumName);
        return;
      }

      // Step 1: Fetch admin emails
      final adminEmailsResponse = await http.get(
        Uri.parse('https://gc5yd9g903.execute-api.ap-south-1.amazonaws.com/admin_report/get_admin_emails'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(Duration(seconds: 30));

      print('Admin Emails Fetch Response Status: ${adminEmailsResponse.statusCode}');
      print('Admin Emails Fetch Response Body: ${adminEmailsResponse.body}');

      List<String> adminEmails = fallbackEmails; // Default to fallback emails

      if (adminEmailsResponse.statusCode == 200) {
        final adminEmailsData = jsonDecode(adminEmailsResponse.body);

        if (adminEmailsData['success'] == true &&
            adminEmailsData['admins'] != null &&
            adminEmailsData['admins'].isNotEmpty) {
          final List<dynamic> admins = adminEmailsData['admins'];
          adminEmails = admins.map((admin) => admin['email'].toString()).toList();
          print('Extracted Admin Emails: $adminEmails');
        } else {
          print('No valid admin emails found in response, using fallback emails: $fallbackEmails');
        }
      } else {
        print('Failed to fetch admin emails, status: ${adminEmailsResponse.statusCode}, using fallback emails: $fallbackEmails');
      }

      // Step 2: Send notification to admin emails
      print('Sending notification to ${adminEmails.length} admins for songs: $songTitlesList');
      final notificationResponse = await http.post(
        Uri.parse('https://2k3idh0o26.execute-api.ap-south-1.amazonaws.com/new/AdminSendApprovalEmailForMultipleSongs'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'adminEmails': adminEmails,
          'songTitles': songTitlesList,
          'singerName': artistName,
          'albumName': albumName,
        }),
      ).timeout(Duration(seconds: 30));

      print('Notification API Response Status: ${notificationResponse.statusCode}');
      print('Notification API Response Body: ${notificationResponse.body}');

      if (notificationResponse.statusCode == 200) {
        final responseBody = jsonDecode(notificationResponse.body);
        print('Admin notification sent successfully');
        print('Recipient Count: ${responseBody['recipientCount'] ?? 'Unknown'}');
        print('Song Count: ${responseBody['songCount'] ?? 'Unknown'}');
        print('Message: ${responseBody['message'] ?? 'No message'}');
      } else {
        print('Failed to send admin notification, status: ${notificationResponse.statusCode}');
        await _sendFallbackNotification(songTitlesList, artistName, albumName: albumName);
      }
    } catch (e) {
      print('Error in admin notification process: $e');
      try {
        final List<String> songTitlesList = songTitles is String
            ? [songTitles]
            : List<String>.from(songTitles as List<dynamic>);
        await _sendFallbackNotification(songTitlesList, artistName, albumName: albumName);
      } catch (fallbackError) {
        print('Fallback notification also failed: $fallbackError');
      }
    }
  }

  Future<void> _sendFallbackNotification(List<String> songTitles, String artistName, {String? albumName}) async {
    final List<String> fallbackEmails = ["ankitad@cloudmotivglobal.com", "mriganka@voiz.co.in"];
    print('Fallback notification triggered for songs: $songTitles, artist: $artistName, album: ${albumName ?? 'None'}');

    try {
      final notificationResponse = await http.post(
        Uri.parse('https://2k3idh0o26.execute-api.ap-south-1.amazonaws.com/new/AdminSendApprovalEmailForMultipleSongs'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'adminEmails': fallbackEmails,
          'songTitles': songTitles,
          'singerName': artistName,
          'albumName': albumName,
        }),
      ).timeout(Duration(seconds: 30));

      print('Fallback Notification API Response Status: ${notificationResponse.statusCode}');
      print('Fallback Notification API Response Body: ${notificationResponse.body}');

      if (notificationResponse.statusCode == 200) {
        print('Fallback notification sent successfully');
      } else {
        print('Failed to send fallback notification, status: ${notificationResponse.statusCode}');
      }
    } catch (e) {
      print('Error in fallback notification: $e');
      throw e; // Re-throw to allow caller to handle
    }
  }

  Future<void> _processMultipleSongs() async {
    final String albumTimestamp = DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());

    String calculateTotalAlbumSpan() {
      int totalMinutes = 0;
      int totalSeconds = 0;

      for (var song in _storedSongs) {
        if (song.span != null && song.span!.isNotEmpty) {
          final parts = song.span!.split(':');
          if (parts.length == 2) {
            try {
              totalMinutes += int.parse(parts[0]);
              totalSeconds += int.parse(parts[1]);
            } catch (e) {
              print('Error parsing span for ${song.songName}: ${song.span}');
            }
          }
        }
      }

      totalMinutes += totalSeconds ~/ 60;
      totalSeconds = totalSeconds % 60;

      return '${totalMinutes.toString().padLeft(2, '0')}:${totalSeconds.toString().padLeft(2, '0')}';
    }

    // Get stage name from ProfileManager, refresh if needed, fallback to fullName
    String? stageName = ProfileManager().username.value;
    print('DEBUG: Initial stageName from ProfileManager: $stageName');
    print('DEBUG: ProfileManager userId: ${ProfileManager().getUserId()}');
    
    // If no stage name in memory, try to fetch it fresh for existing users
    if (stageName == null || stageName.trim().isEmpty) {
      print('DEBUG: No stage name found, fetching fresh data...');
      try {
        await ProfileManager().fetchUpdatedUsername();
        stageName = ProfileManager().username.value;
        print('DEBUG: After refresh, stageName: $stageName');
      } catch (e) {
        print('Error fetching updated username: $e');
      }
    }
    
    final artistName = (stageName?.trim().isNotEmpty == true) ? stageName! : (widget.fullName?.trim() ?? 'Unknown Artist');
    
    print('DEBUG: Final artistName being used: $artistName');
    print('DEBUG: stageName: $stageName, fullName: ${widget.fullName}');

    final body = {
      'user_id': widget.email?.trim() ?? '',
      'FullName': widget.fullName?.trim() ?? 'Unknown Artist',
      'albumName': _albumNameController.text.trim(),
      'albumCoverImg': _albumCoverFileName?.trim() ?? '',
      'span': calculateTotalAlbumSpan(),
      'stage_name': artistName,
      'story': '',
      'songs': _storedSongs.map((song) {
        final String timestamp = DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());

        if (song.span == null || song.span!.isEmpty || !RegExp(r'^\d{2}:\d{2}$').hasMatch(song.span!)) {
          print('Warning: Invalid span for ${song.songName}: ${song.span}');
        }

        String songFileName = song.songName?.trim() ?? '';
        if (!songFileName.endsWith('.mp3')) {
          songFileName = '$songFileName.mp3';
        }

        String lyricsFileName = song.lyricsFileName?.trim() ?? '';
        if (lyricsFileName.isEmpty && song.songName != null) {
          lyricsFileName = '${song.songName!.trim()}_lyrics.txt';
        }

        return {
          'songName': song.songName?.trim() ?? '',
          'language': song.language?.trim() ?? '',
          'genre': song.genre?.trim() ?? '',
          'mood': song.moodandPace?.trim() ?? '',
          'pace': '',
          'story': song.storyBehind?.trim() ?? '',
          'lyricist': song.lyricist?.trim() ?? '',
          'composer': song.composer?.trim() ?? '',
          'singer': song.singer?.trim() ?? '', // Use the user-provided singer name
          'producer': song.producer?.trim() ?? '',
          'fileName': songFileName,
          'lyricsFileName': lyricsFileName,
          if (song.songCoverFileName != null && song.songCoverFileName!.trim().isNotEmpty)
            'songImageFileName': song.songCoverFileName!.trim(), // ✅ Only include if valid
          'span': song.span ?? '',
          'createdTimestamp': timestamp,
          'updatedTimestamp': timestamp,
        };
      }).where((song) {
        bool isValid = song['songName']!.isNotEmpty &&
            song['fileName']!.isNotEmpty &&
            song['lyricsFileName']!.isNotEmpty &&
            song['language']!.isNotEmpty &&
            song['genre']!.isNotEmpty &&
            song['span']!.isNotEmpty;

        print('Song valid: $isValid, Song: ${song['songName']}, File: ${song['fileName']}, Lyrics: ${song['lyricsFileName']}, Span: ${song['span']}');
        return isValid;
      }).toList(),
      'createdTimestamp': albumTimestamp,
      'updatedTimestamp': albumTimestamp,
    };

    print('API Payload: ${jsonEncode(body)}');

    try {
      final response = await http.post(
        Uri.parse('https://5qxwn3x3z2.execute-api.ap-south-1.amazonaws.com/voiznew/processMultipleSongs'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(body),
      ).timeout(Duration(minutes: 10));

      print('Response: ${response.statusCode} - ${response.body}');
      await _handleApiResponse(response);

    } catch (error) {
      print('Upload Error: $error');
      _showSnackBar('Upload failed: $error');
    }
  }

  Future<void> _handleApiResponse(http.Response response) async {
    print('Console: Handling API response, status: ${response.statusCode}');
    print('Console: Response body: ${response.body}');

    if (response.statusCode == 200) {
      try {
        final responseData = jsonDecode(response.body);
        print('Console: Parsed response data: $responseData');

        final processedSongs = responseData['processedSongs'] ?? [];
        final failedSongs = responseData['failedSongs'] ?? [];
        final processedCount = processedSongs.length;
        final failedCount = failedSongs.length;
        final isAlbum = responseData['albumId'] != null;

        String successMessage = isAlbum
            ? 'Album "${responseData['albumName']}" created with $processedCount songs!'
            : '$processedCount songs uploaded successfully!';
        if (failedCount > 0) {
          successMessage += ' ($failedCount failed)';
        }

        print('Console: Success - Processed: $processedCount, Failed: $failedCount, Album: $isAlbum');
        _showSnackBar(successMessage, backgroundColor: Colors.green);

        if (failedCount > 0) {
          print('Console: Showing failed songs dialog for $failedCount failed songs');
          await _showFailedSongsDialog(failedSongs);
        }

        if (processedSongs.isNotEmpty) {
          final songTitles = _storedSongs.map((s) => s.songName.trim().isNotEmpty ? s.songName : 'Unknown Song').toList();


          final artistName = _singerController.text.trim().isNotEmpty ? _singerController.text.trim() : widget.fullName.trim();
          final albumName = isAlbum ? responseData['albumName'] : null;
          try {
            await _notifyAdmins(songTitles, artistName, albumName: albumName);
            print('Console: Admin notification sent');
          } catch (e) {
            print('Console: Error sending admin notification: $e');
            _showSnackBar('Could not send admin notifications.',
                backgroundColor: Colors.orange);
          }
        }

        if (mounted) {
          print('Console: Widget is mounted, showing success dialog');

          await Future.delayed(Duration(milliseconds: 200));

          bool dialogResult = await _showDetailedSuccessDialog(
            context,
            processedCount,
            failedCount,
            isAlbum ? responseData['albumName'] : null,
          );
          print('Console: Success dialog result: $dialogResult');

          if (dialogResult && mounted) {
            print('Console: Dialog confirmed, resetting state');
            setState(() {
              _isTermsAccepted = false;
              _isContentPolicyAccepted = false;
              _isCopyrightAccepted = false;
              _storedSongs.clear();
              _currentSongIndex = 1;
              _isAlbumInfoLocked = false;
              _albumCoverFile = null;
              _albumCoverFileName = null;
              _isAlbumCoverUploaded = false;
            });
            _clearForm();

            await Future.delayed(Duration(milliseconds: 100));

            // ✅ Add this line:
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (context) => NewHomePage(
                  email: widget.email,
                  category: 'Singer',
                  userfullname: widget.fullName,
                  preservedAudioState: null,
                ),
              ),
            );

          } else {
            print('Console: Dialog not confirmed or widget unmounted during dialog');
          }
        }
        else {
          print('Console: Widget not mounted, skipping dialog');
        }
      } catch (e, stackTrace) {
        print('Console: Error processing response: $e');
        print('Console: Stack trace: $stackTrace');
        _showSnackBar('Error processing upload response: $e');
      }
    } else {
      String errorMessage = 'Upload failed';
      try {
        final errorData = jsonDecode(response.body);
        errorMessage = errorData['error'] ?? errorMessage;
        if (errorData['details'] != null) {
          errorMessage += ': ${errorData['details']}';
        }
      } catch (e) {
        errorMessage += ': Server returned status ${response.statusCode}';
      }
      print('Console: API Error - Status ${response.statusCode}, Response: ${response.body}');
      _showSnackBar(errorMessage);
    }
  }

  Future<void> _handleUploadError(Exception e) async {
    String errorMessage = e.toString();
    IconData icon = Icons.error;

    if (errorMessage.contains('timed out')) {
      print('Upload Timeout: $e');
      errorMessage = 'Upload timed out. Please try again with fewer songs or check your connection.';
      icon = Icons.timer_off;
    } else {
      print('Upload Exception: $e');
      errorMessage = 'Upload failed: ${e.toString()}';
    }

    _showSnackBar(errorMessage);
  }

  Future<void> _uploadToS3(String url, List<int> fileBytes, String contentType) async {
    try {
      final uploadResponse = await http.put(
        Uri.parse(url),
        headers: {'Content-Type': contentType},
        body: fileBytes,
      ).timeout(
        Duration(minutes: 1),
        onTimeout: () {
          throw Exception('File upload timed out');
        },
      );

      if (uploadResponse.statusCode != 200) {
        throw Exception('Failed to upload file to S3. Status: ${uploadResponse.statusCode}');
      }
    } catch (e) {
      throw Exception('Connection error while uploading file: $e');
    }
  }

  Future<void> _showFailedSongsDialog(List<dynamic> failedSongs) async {
    return showDialog<void>(
      context: context,
      barrierDismissible: true,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Row(
            children: [
              Icon(Icons.warning, color: Colors.orange),
              SizedBox(width: 8),
              Text('Some Songs Failed'),
            ],
          ),
          content: Container(
            width: double.maxFinite,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('The following songs could not be processed:'),
                SizedBox(height: 10),
                Container(
                  height: 200,
                  child: ListView.builder(
                    shrinkWrap: true,
                    itemCount: failedSongs.length,
                    itemBuilder: (context, index) {
                      final failedSong = failedSongs[index];
                      return Card(
                        margin: EdgeInsets.symmetric(vertical: 2),
                        child: ListTile(
                          leading: Icon(Icons.error_outline, color: Colors.red),
                          title: Text(
                            failedSong['songName'] ?? 'Unknown Song',
                            style: TextStyle(fontSize: 14),
                          ),
                          subtitle: Text(
                            failedSong['error'] ?? 'Unknown error',
                            style: TextStyle(fontSize: 12),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              child: Text('OK'),
              onPressed: () {
                Navigator.of(context).pop();
              },
            ),
          ],
        );
      },
    );
  }

  Future<bool> _showDetailedSuccessDialog(
      BuildContext context,
      int processedCount,
      int failedCount,
      String? albumName) async {
    String title = albumName != null
        ? 'Album Created Successfully!'
        : 'Songs Uploaded Successfully!';

    String message = albumName != null
        ? 'Your album "$albumName" has been created with $processedCount songs.'
        : '$processedCount songs have been uploaded successfully.';

    if (failedCount > 0) {
      message += '\n\n$failedCount songs failed to upload. You can try uploading them again later.';
    }

    message += '\n\nYour songs are now being processed and will be available shortly.';

    return await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext dialogContext) {
        return AlertDialog(
          backgroundColor: Color(0xFF151415),  // Changed from Colors.grey[850]
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          contentPadding: EdgeInsets.zero,
          content: Stack(
            children: [
              Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.check_circle_outline,
                      color: Colors.blue,  // Changed from Colors.green
                      size: 60,
                    ),
                    SizedBox(height: 20),
                    Text(
                      title,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    SizedBox(height: 15),
                    Text(
                      message,
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 16,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    SizedBox(height: 30),
                    ElevatedButton.icon(
                      onPressed: () {
                        Navigator.of(dialogContext).pop(true);
                      },
                      icon: Icon(Icons.check, color: Colors.white),
                      label: Text(
                        "OK",
                        style: TextStyle(color: Colors.white, fontSize: 16),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Color(0xFF2644D9),  // Changed from Colors.deepPurple
                        padding: EdgeInsets.symmetric(horizontal: 30, vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(25),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Positioned(
                top: 8,
                right: 8,
                child: IconButton(
                  icon: Icon(Icons.close, color: Colors.white70, size: 28),
                  onPressed: () {
                    Navigator.of(dialogContext).pop(true);
                  },
                ),
              ),
            ],
          ),
        );
      },
    ) ?? false;
  }

  Future<void> _launchURL(String url) async {
    final Uri uri = Uri.parse(url);
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      throw Exception('Could not launch $url');
    }
  }

  void _uploadAllSongs() {
    if (_isUploadLoading) {
      return;
    }

    if (_storedSongs.isEmpty) {
      _showSnackBar('No songs to upload. Please add at least one song.');
      return;
    }

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext dialogContext) {
        return PopScope(
          canPop: !_isUploadLoading,
          onPopInvoked: (didPop) async {
            if (!didPop) { // Only handle if pop was prevented by canPop
              if (!_isUploadLoading) {
                // This means the user tried to pop, but canPop was false
                // No action needed here, as the dialog remains open.
                // If it popped due to external tap, then it means canPop was true,
                // and no action is needed here.
              }
            }
          },
          child: StatefulBuilder(
            builder: (context, setDialogState) {
              bool canUpload = _isTermsAccepted && _isContentPolicyAccepted && _isCopyrightAccepted;

              print('Console: Dialog gradient applied - Top: #2644D9, Bottom: #9C27B0'); // Debug log
              return AlertDialog(
                backgroundColor: Colors.transparent,
                contentPadding: EdgeInsets.zero,
                content: Container(
                  width: MediaQuery.of(context).size.width * 0.9,
                  padding: EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Color(0xFF2644D9),  // Blue at top
                        Color(0xFF151415),  // Dark color at bottom
                      ],
                    ),
                    borderRadius: BorderRadius.circular(15),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.3),
                        blurRadius: 20,
                        offset: Offset(0, 10),
                      ),
                    ],
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      AnimatedContainer(
                        duration: Duration(milliseconds: 300),
                        child: Text(
                          'Confirm Upload',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      SizedBox(height: 20),
                      Text(
                        'Please confirm the following before uploading ${_storedSongs.length} songs:',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 14,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      SizedBox(height: 20),
                      _buildAnimatedCheckbox(
                        "I've read and agreed to the terms and conditions",
                        _isTermsAccepted,
                            (value) {
                          if (!_isUploadLoading) {
                            setDialogState(() => _onCheckboxChanged(value, 'terms'));
                            setState(() {});
                          }
                        },
                        url: 'https://voiz.co.in/music-license-agreement/',
                        linkText: 'terms and conditions',
                      ),
                      _buildAnimatedCheckbox(
                        "Content uploaded meets the platform Code of Conduct",
                        _isContentPolicyAccepted,
                            (value) {
                          if (!_isUploadLoading) {
                            setDialogState(() => _onCheckboxChanged(value, 'policy'));
                            setState(() {});
                          }
                        },
                        url: 'https://voiz.co.in/code-of-conduct/',
                        linkText: 'Code of Conduct',
                      ),
                      _buildAnimatedCheckbox(
                        "Content doesn't infringe others copyrights",
                        _isCopyrightAccepted,
                            (value) {
                          if (!_isUploadLoading) {
                            setDialogState(() => _onCheckboxChanged(value, 'copyright'));
                            setState(() {});
                          }
                        },
                      ),
                      SizedBox(height: 30),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          // Expanded(
                          //   child: TextButton(
                          //     onPressed: _isUploadLoading
                          //         ? null
                          //         : () {
                          //       Navigator.of(dialogContext).pop();
                          //       // NEW: Show SnackBar to confirm cancellation without data loss
                          //       _showSnackBar('Upload cancelled. Your added songs are retained.', backgroundColor: Colors.blueGrey);
                          //     },
                          //     child: Text(
                          //       'Cancel',
                          //       style: TextStyle(
                          //         color: _isUploadLoading ? Colors.grey : Colors.white,
                          //         fontSize: 16,
                          //       ),
                          //     ),
                          //   ),
                          // ),
                          SizedBox(width: 10),
                          Expanded(
                            flex: 2,
                            child: ElevatedButton(
                              onPressed: (canUpload && !_isUploadLoading)
                                  ? () async {
                                if (_isUploadLoading) return;

                                setDialogState(() => _isUploadLoading = true);
                                Navigator.of(dialogContext).pop(); // Close the dialog
                                await _uploadFile(); // Start the actual upload

                                if (mounted) {
                                  setState(() => _isUploadLoading = false);
                                }
                              }
                                  : null,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: (canUpload && !_isUploadLoading)
                                    ? Color(0xFF2644D9)
                                    : Colors.grey,
                                padding: EdgeInsets.symmetric(vertical: 15),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(30),
                                ),
                              ),
                              child: _isUploadLoading
                                  ? SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 2,
                                ),
                              )
                                  : Text(
                                'Confirm',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }

  Widget _buildAnimatedCheckbox(
      String text,
      bool value,
      Function(bool?) onChanged, {
        String? url,
        String? linkText,
      }) {
    return AnimatedContainer(
      duration: Duration(milliseconds: 300),
      margin: EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          AnimatedContainer(
            duration: Duration(milliseconds: 200),
            child: Checkbox(
              value: value,
              onChanged: onChanged,
              activeColor: Colors.white,
              checkColor: Color(0xFF2644D9),
              side: BorderSide(color: Colors.white, width: 2),
            ),
          ),
          Expanded(
            child: url != null && linkText != null
                ? RichText(
              text: TextSpan(
                children: [
                  TextSpan(
                    text: text.replaceAll(linkText, ''),
                    style: TextStyle(color: Colors.white),
                  ),
                  WidgetSpan(
                    child: GestureDetector(
                      onTap: () => _launchURL(url),
                      child: Text(
                        linkText,
                        style: TextStyle(
                          color: Colors.blue,
                          decoration: TextDecoration.underline,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            )
                : Text(
              text,
              style: TextStyle(
                color: Colors.white,
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProgressDot(bool isActive) {
    return AnimatedContainer(
      duration: Duration(milliseconds: 300),
      height: 4,
      width: 75,
      decoration: BoxDecoration(
        color: isActive ? Colors.green : Colors.white,
        borderRadius: BorderRadius.circular(2),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    String? hintText,
    String? errorText,
    int maxLines = 1,
    bool required = false,
    String? infoText,
    bool enabled = true,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 13.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: double.infinity,
            height: maxLines > 1 ? null : 60,
            child: TextField(
              enabled: enabled,
              controller: controller,
              maxLines: maxLines,
              cursorColor: Colors.black,
              style: TextStyle(
                color: Colors.black,
                fontSize: 16,
                fontFamily: 'Poppins',
                decorationThickness: 0,
              ),
              inputFormatters: label == 'Story Behind the Song'
                  ? [
                TextInputFormatter.withFunction((oldValue, newValue) {
                  final words = _getWordCount(newValue.text);
                  if (words <= _maxStoryWords) {
                    setState(() => _isStoryWordLimitExceeded = false);
                    return newValue;
                  } else {
                    setState(() => _isStoryWordLimitExceeded = true);
                    _showSnackBar('You have reached the $_maxStoryWords-word limit');
                    return oldValue;
                  }
                }),
              ]
                  : [],
              decoration: InputDecoration(
                label: RichText(
                  text: TextSpan(
                    text: label.replaceAll(': *', '').replaceAll(':', ''),
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
                  borderSide: BorderSide(color: Colors.black, width: 1.0),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8.0),
                  borderSide: BorderSide(color: errorText != null ? Colors.red : Colors.black, width: 1.0),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8.0),
                  borderSide: BorderSide(color: Colors.black, width: 2.0),
                ),
                errorText: errorText,
                suffixIcon: infoText != null
                    ? RightPinInfoIconWithTooltip(
                  key: UniqueKey(),
                  title: label.replaceAll(': *', '').replaceAll(':', ''),
                  infoText: infoText,
                  boldInfoText: '',
                  iconColor: label == 'Story Behind the Song' ? Colors.black : Colors.white,
                )
                    : null,
              ),
              onChanged: label == 'Story Behind the Song'
                  ? (value) {
                setState(() {
                  _storyError = _validateStoryField(value);
                });
              }
                  : null,
            ),
          ),
          if (label == 'Story Behind the Song' && _isStoryWordLimitExceeded)
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

  Widget _buildDropdown({
    required String? value,
    required String label,
    required List<String> items,
    required Function(String?) onChanged,
    String? errorText,
    String? hintText,
  }) {
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
                border: Border.all(color: errorText != null ? Colors.red : Colors.black, width: 1.0),
              ),
            ),
            iconStyleData: IconStyleData(
              icon: Image.asset(
                'assets/DropMenuVector.png',
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
              hintText ?? label,
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
              errorText,
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

  Widget _buildFileUploadButton({
    required String label,
    String? fileName,
    required VoidCallback onTap,
    IconData? icon,
    bool isRequired = false,
    String? errorText,
    String? infoText,
    Color? buttonColor,
    bool isLoading = false,
  }) {
    bool hasFile = fileName != null && fileName.isNotEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Flexible(
              child: ElevatedButton(
                onPressed: isLoading ? null : onTap,
                style: ElevatedButton.styleFrom(
                  backgroundColor: hasFile
                      ? Color(0xFF2644D9)
                      : (buttonColor ?? Color(0xFF2644D9)),
                  minimumSize: Size(170, 50),
                  padding: EdgeInsets.symmetric(horizontal: 8.0, vertical: 4.0),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30.0),
                  ),
                  shadowColor: Colors.black.withOpacity(0.4),
                  elevation: 5,
                  side: BorderSide(
                    color: errorText != null ? Colors.red : Colors.transparent,
                    width: 1.0,
                  ),
                ),
                child: isLoading
                    ? SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 2.0,
                  ),
                )
                    : Row(
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (hasFile || icon != null) ...[
                      Icon(
                        hasFile ? Icons.check_circle_outline : icon,
                        color: Colors.white,
                        size: 20,
                      ),
                      SizedBox(width: 5),
                    ],
                    Flexible(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            hasFile ? fileName! : label,
                            style: TextStyle(
                              color: hasFile ? Colors.grey[400] : Colors.white,
                              fontSize: 12.0,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'Poppins',
                            ),
                            textAlign: TextAlign.center,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            if (infoText != null)
              Padding(
                padding: const EdgeInsets.only(left: 7.0),
                child: RightPinInfoIconWithTooltip(
                  key: UniqueKey(),
                  title: label,
                  infoText: infoText,
                  boldInfoText: '',
                  iconColor: Colors.white,
                ),
              ),
          ],
        ),
        if (errorText != null && errorText.isNotEmpty)
          SizedBox(
            width: 170, // 👈 match button width
            child: Padding(
              padding: const EdgeInsets.only(top: 6.0),
              child: Align(
                alignment: Alignment.centerLeft, // ✅ RIGHT aligned
                child: Text(
                  errorText,
                  style: TextStyle(
                    color: Colors.red,
                    fontSize: 12,
                    fontFamily: 'Poppins',
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    // Determine if the 'Add Song' button should be enabled
    final bool canAddMoreSongs = _storedSongs.length < _maxSongsLimit;

    Widget content = WillPopScope(
      onWillPop: _onWillPop,
      child: GradientScaffold(
        appBar: AppBar(
          automaticallyImplyLeading: true,
          backgroundColor: Colors.transparent,
          toolbarHeight: kToolbarHeight + 15,
          elevation: 0,
          leading: IconButton(
            icon: Icon(Icons.arrow_back, color: Colors.white),
            onPressed: _handleBackPress,
          ),
          title: Text(
            'Upload Multiple Songs',
            style: TextStyle(
              fontSize: 20,
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        body: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    image: _albumCoverFile != null
                        ? DecorationImage(
                      image: FileImage(_albumCoverFile!),
                      fit: BoxFit.cover,
                      colorFilter: ColorFilter.mode(
                        Colors.black.withOpacity(0.7),
                        BlendMode.darken,
                      ),
                    )
                        : null,
                    color: Colors.black.withOpacity(0.7),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.music_note, color: Colors.white),
                      SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Song $_currentSongIndex',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              '${_storedSongs.length} songs added',
                              style: TextStyle(
                                color: Colors.white.withOpacity(0.7),
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                SizedBox(height: 13.0),
                // Replace the relevant section in the build method's Column children
                _buildTextField(
                  controller: _albumNameController,
                  label: 'Album Name',
                  hintText: 'Enter Album title',
                  errorText: _albumNameError,
                  enabled: !_isAlbumInfoLocked,
                  required: false,
                ),
                if (!_isAlbumInfoLocked)
                  _buildFileUploadButton(
                    label: 'Upload Album Cover',
                    fileName: _albumCoverFileName,
                    onTap: _pickAlbumCoverFile,
                    isRequired: true,
                    errorText: _albumCoverError,
                    infoText: 'Supported formats are .jpg, .jpeg and .png',
                  ),
                SizedBox(height: 13.0),
                _buildTextField(
                  controller: _songNameController,
                  label: 'Song Name',
                  hintText: 'Enter song title',
                  errorText: _songNameError,
                  required: true,
                ),
                SizedBox(height: 13.0),
                _buildDropdown(
                  value: _selectedLanguage,
                  label: 'Language',
                  hintText: 'Language',
                  items: _languages,
                  onChanged: (value) => setState(() => _selectedLanguage = value),
                  errorText: _languageError,
                ),
                SizedBox(height: 13.0),
                _buildDropdown(
                  value: _selectedGenre,
                  label: 'Genre',
                  hintText: 'Genre',
                  items: _genres,
                  onChanged: (value) => setState(() => _selectedGenre = value),
                  errorText: _genreError,
                ),
                SizedBox(height: 13.0),
                _buildTextField(
                  controller: _moodandpaceController,
                  label: 'Mood and Pace',
                  hintText: 'Enter Mood and Pace ',
                  errorText: _moodandpaceError,
                  required: false,
                ),
                SizedBox(height: 13.0),
                _buildTextField(
                  controller: _storyBehindController,
                  label: 'Story Behind the Song',
                  hintText: 'What inspired you to make this song',
                  maxLines: 3,
                  infoText: 'What inspired you to make this song',
                  errorText: _storyError,
                  required: false,
                ),
                SizedBox(height: 13.0),
                _buildTextField(
                  controller: _singerController,
                  label: 'Singer',
                  hintText: 'Enter singer name',
                  errorText: _singerError,
                  required: true,
                ),
                SizedBox(height: 13.0),
                _buildTextField(
                  controller: _composerController,
                  label: 'Composer',
                  hintText: 'Enter composer name',
                  errorText: _composerError,
                  required: true,
                ),
                SizedBox(height: 13.0),
                _buildTextField(
                  controller: _lyricistController,
                  label: 'Lyricist',
                  hintText: 'Enter lyricist name',
                  errorText: _lyricistError,
                  required: true,
                ),
                SizedBox(height: 13.0),
                _buildTextField(
                  controller: _producerController,
                  label: 'Producer',
                  hintText: 'Enter producer name',
                  errorText: _producerError,
                  required: true,
                ),
                SizedBox(height: 13.0),
                _buildFileUploadButton(
                  label: 'Upload Lyrics',
                  fileName: _lyricsFileName,
                  onTap: _pickLyricsFile,
                  isRequired: true,
                  errorText: _lyricsError,
                  infoText: 'Supported formats are .doc, .docx, .pdf and .txt.',
                  buttonColor: Color(0xFF2644D9),
                ),
                SizedBox(height: 13.0),
                _buildFileUploadButton(
                  label: 'Upload Song',
                  fileName: _songFileName,
                  onTap: _pickSongFile,
                  isRequired: true,
                  errorText: _songFileError,
                  infoText: 'Supported formats: .mp3 and .wav',
                  buttonColor: Color(0xFF2644D9),
                ),

                SizedBox(height: 16.0),
                _buildFileUploadButton(
                  label: 'Upload Song Cover',
                  fileName: _songCoverFileName,
                  onTap: _pickSongCoverFile,
                  isRequired: true,
                  errorText: _songCoverError,
                  infoText: 'Supported formats: .jpg, .jpeg and .png',
                  buttonColor: Color(0xFF2644D9),
                ),
                SizedBox(height: 30),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        // NEW: Disable button if max limit is reached
                        onPressed: canAddMoreSongs ? _addNextSong : null,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: canAddMoreSongs ? Color(0xFF2644D9) : Colors.grey, // Grey out if disabled
                          padding: EdgeInsets.symmetric(vertical: 15),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(30),
                          ),
                          elevation: 5,
                          shadowColor: Colors.black.withOpacity(0.4),
                        ),
                        child: Text(
                          'Add Song',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 15),
                if (_storedSongs.isNotEmpty)
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: double.infinity,
                        padding: EdgeInsets.all(16),
                        margin: EdgeInsets.only(bottom: 15),
                        decoration: BoxDecoration(
                          image: _albumCoverFile != null
                              ? DecorationImage(
                            image: FileImage(_albumCoverFile!),
                            fit: BoxFit.cover,
                            colorFilter: ColorFilter.mode(
                              Colors.black.withOpacity(0.7),
                              BlendMode.darken,
                            ),
                          )
                              : null,
                          color: Colors.black.withOpacity(0.7),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Upload Summary',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'Poppins',
                              ),
                            ),
                            SizedBox(height: 8),
                            Row(
                              children: [
                                Icon(Icons.album, color: Colors.white),
                                SizedBox(width: 8),
                                Text(
                                  'Album: ${_albumNameController.text}',
                                  style: TextStyle(color: Colors.white, fontFamily: 'Poppins'),
                                ),
                              ],
                            ),
                            SizedBox(height: 4),
                            Row(
                              children: [
                                Icon(Icons.image, color: Colors.white),
                                SizedBox(width: 8),
                                Text(
                                  'Album Cover: ${_albumCoverFileName ?? "Not uploaded"}',
                                  style: TextStyle(color: Colors.white, fontFamily: 'Poppins'),
                                ),
                              ],
                            ),
                            SizedBox(height: 4),
                            Row(
                              children: [
                                Icon(Icons.music_note, color: Colors.white),
                                SizedBox(width: 8),
                                Text(
                                  'Songs Added: ${_storedSongs.length}',
                                  style: TextStyle(color: Colors.white, fontFamily: 'Poppins'),
                                ),
                              ],
                            ),
                            SizedBox(height: 10),
                            Text(
                              'Added Songs:',
                              style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold, fontFamily: 'Poppins'),
                            ),
                            ListView.builder(
                              shrinkWrap: true,
                              physics: NeverScrollableScrollPhysics(),
                              itemCount: _storedSongs.length,
                              itemBuilder: (context, index) {
                                final song = _storedSongs[index];
                                return Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 4.0),
                                  child: Text(
                                    '${index + 1}. ${song.songName} - ${song.singer} (${song.span})',
                                    style: TextStyle(color: Colors.white70, fontSize: 13, fontStyle: FontStyle.italic, fontFamily: 'Poppins'),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                );
                              },
                            ),
                          ],
                        ),
                      ),
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton(
                              onPressed: _uploadAllSongs,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Color(0xFF2644D9),
                                padding: EdgeInsets.symmetric(vertical: 15),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(30),
                                ),
                                elevation: 5,
                                shadowColor: Colors.black.withOpacity(0.4),
                              ),
                              child: Text(
                                'Upload All Songs (${_storedSongs.length})',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                SizedBox(height: kBottomNavigationBarHeight + 20),
              ],
            ),
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
        ],
      );
    } else {
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
        ],
      );
    }

    return finalWidget;
  }
}

// Tooltip classes - copied from song_upload_screen_multiplesong.dart
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
                  BoxShadow(color: Colors.white.withOpacity(0.4), blurRadius: 12, spreadRadius: -2, offset: Offset(0, 8)),
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
  final Color? iconColor;

  const RightPinInfoIconWithTooltip({
    Key? key, // Added key parameter
    required this.title,
    required this.infoText,
    required this.boldInfoText,
    this.iconColor,
  }) : super(key: key); // Pass to superclass

  @override
  _RightPinInfoIconWithTooltipState createState() => _RightPinInfoIconWithTooltipState();
}

class _RightPinInfoIconWithTooltipState extends State<RightPinInfoIconWithTooltip> with SingleTickerProviderStateMixin {
  // Static list to track all tooltip states
  static final List<_RightPinInfoIconWithTooltipState> _tooltipStates = [];

  final GlobalKey _toolTipKey = GlobalKey();
  OverlayEntry? _overlayEntry;
  bool _isOverlayVisible = false;
  bool _disposed = false;
  bool _isDisposing = false;
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  WillPopCallback? _popCallback;
  ModalRoute? _currentModalRoute;
  bool _isControllerDisposed = false;

  @override
  void initState() {
    super.initState();
    // Register this state
    _tooltipStates.add(this);
    _controller = AnimationController(vsync: this, duration: Duration(milliseconds: 300));
    _scaleAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutBack));
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final modalRoute = ModalRoute.of(context);
      if (modalRoute != null && _currentModalRoute == null) {
        _currentModalRoute = modalRoute;
        _popCallback = () async {
          if (_isOverlayVisible) {
            print('Closing tooltip due to navigation');
            _removeOverlay();
            await Future.delayed(Duration(milliseconds: 100)); // Reduced duration
            return false;
          }
          print('No tooltip open during navigation');
          return true;
        };
        modalRoute.addScopedWillPopCallback(_popCallback!);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        if (_isOverlayVisible) {
          print('Back button pressed, closing tooltip');
          _removeOverlay();
          await Future.delayed(Duration(milliseconds: 100));
          return false;
        }
        print('Back button pressed, no tooltip open');
        return true;
      },
      child: InkWell(
        key: _toolTipKey,
        onTap: _toggleOverlay,
        borderRadius: BorderRadius.circular(50),
        child: Container(
          padding: EdgeInsets.all(8),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            boxShadow: _isOverlayVisible
                ? [BoxShadow(color: Colors.blue.withOpacity(0.5), blurRadius: 10, spreadRadius: 2)]
                : [],
          ),
          child: Icon(Icons.info_outline, color: widget.iconColor ?? Colors.white, size: 32),
        ),
      ),
    );
  }

  void _toggleOverlay() {
    if (_isOverlayVisible) {
      print('Toggling off tooltip');
      _removeOverlay();
    } else {
      print('Toggling on tooltip');
      _showOverlay();
    }
  }

  void _showOverlay() {
    if (_disposed || _isOverlayVisible || _isDisposing) {
      print('Cannot show: disposed=$_disposed, visible=$_isOverlayVisible, disposing=$_isDisposing');
      return;
    }
    final overlay = Overlay.of(context);
    final renderBox = _toolTipKey.currentContext?.findRenderObject() as RenderBox?;
    if (renderBox == null) {
      print('Cannot show: RenderBox is null');
      return;
    }

    final offset = renderBox.localToGlobal(Offset.zero);
    _overlayEntry = OverlayEntry(
      builder: (context) => AnimatedBuilder(
        animation: _scaleAnimation,
        builder: (context, child) => Stack(
          children: [
            Positioned.fill(
              child: GestureDetector(
                onTap: () {
                  print('Tapped outside, closing');
                  _removeOverlay();
                },
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
        ),
      ),
    );

    if (!_disposed && mounted && !_isDisposing) {
      setState(() => _isOverlayVisible = true);
      overlay.insert(_overlayEntry!);
      if (!_isControllerDisposed) {
        print('Starting animation');
        _controller.forward();
      }
    }
  }

  void _removeOverlay() {
    if (_disposed) {
      return;
    }

    if (!_isOverlayVisible) {
      return;
    }

    _isOverlayVisible = false;
    if (_popCallback != null && _currentModalRoute != null) {
      _currentModalRoute!.removeScopedWillPopCallback(_popCallback!);
      _popCallback = null;
      _currentModalRoute = null;
    }

    if (_overlayEntry != null) {
      _overlayEntry!.remove();
      _overlayEntry = null;
    }

    if (!_isControllerDisposed && _controller.isAnimating) {
      _controller.reverse().then((_) {
        if (mounted && !_disposed) {
          setState(() {});
        }
      });
    } else if (mounted && !_disposed) {
      setState(() {});
    }
  }

  @override
  void dispose() {
    if (_isDisposing) {
      return;
    }
    _isDisposing = true;
    _disposed = true;

    // Unregister this state
    _tooltipStates.remove(this);

    // Remove overlay without animation
    if (_overlayEntry != null) {
      _overlayEntry!.remove();
      _overlayEntry = null;
    }

    // Cleanup callbacks
    if (_popCallback != null && _currentModalRoute != null) {
      _currentModalRoute!.removeScopedWillPopCallback(_popCallback!);
      _popCallback = null;
      _currentModalRoute = null;
    }

    // Dispose controller if not already disposed
    if (!_isControllerDisposed) {
      _controller.dispose();
      _isControllerDisposed = true;
    }

    super.dispose();
  }
}
