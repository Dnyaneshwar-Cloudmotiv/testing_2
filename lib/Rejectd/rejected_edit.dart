import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:file_picker/file_picker.dart';
import 'dart:io';
import 'package:voiceapp/main.dart'; // For GradientScaffold
import 'package:voiceapp/services/api_service.dart';

class EditSongDetailsPage extends StatefulWidget {
  final String songName;
  final String artistName;
  final String workflowId;
  final String coverPageUrl;
  final String genre;
  final String userId;
  final String userfullname;
  final String category;
  final String songId;
  final String? albumId; // Optional album ID for album songs

  const EditSongDetailsPage({
    Key? key,
    required this.songName,
    required this.artistName,
    required this.workflowId,
    required this.coverPageUrl,
    required this.genre,
    required this.userId,
    required this.userfullname,
    required this.category,
    required this.songId,
    this.albumId, // Optional album ID
  }) : super(key: key);

  @override
  State<EditSongDetailsPage> createState() => _EditSongDetailsPageState();
}

class _EditSongDetailsPageState extends State<EditSongDetailsPage> {
  late TextEditingController _songNameController;
  late TextEditingController _fullNameController;
  late TextEditingController _singerController;
  late TextEditingController _producerController;
  late TextEditingController _composerController;
  late TextEditingController _lyricistController;
  late TextEditingController _fileNameController;
  late TextEditingController _lyricsFileNameController;
  late TextEditingController _moodController;
  late TextEditingController _paceController;
  late TextEditingController _spanController;
  late TextEditingController _storyController;

  // Dropdown selections
  String? _selectedLanguage;
  String? _selectedGenre;

  // File upload variables
  String? _pickedSongFilePath;
  String? _pickedLyricsFilePath;
  bool _isSongButtonLoading = false;
  bool _isLyricsButtonLoading = false;
  String? _songFileError;
  String? _lyricsError;

  // Loading state
  bool _isLoading = false;

  final List<String> _languages = [
    'English', 'Hindi', 'Assamese', 'Bengali', 'Gujarati', 'Kannada',
    'Malayalam', 'Marathi', 'Odia', 'Punjabi', 'Tamil', 'Telugu',
    'Urdu', 'Pahari', 'Spanish', 'French', 'German'
  ];

  final List<String> _genres = [
    'Pop', 'Rock', 'Hip Hop', 'Electronic', 'Classical', 'Jazz',
    'Ghazal', 'Bollywood', 'Folk', 'Country', 'R&B', 'Blues',
    'Reggae', 'Alternative', 'Indie', 'Romantic' // Added 'Romantic' as it appears in your API response
  ];

  final List<String> _moods = [
    'Happy', 'Sad', 'Energetic', 'Calm', 'Romantic', 'Melancholic',
    'Upbeat', 'Peaceful', 'Aggressive', 'Nostalgic'
  ];

  Map<String, dynamic>? _songData;
  bool _isAlbumSong = false; // Track if this is an album song
  String? _albumId; // Store album ID if this is an album song
  String? _albumName; // Store album name if this is an album song

  @override
  void initState() {
    super.initState();
    _songNameController = TextEditingController();
    _fullNameController = TextEditingController();
    _singerController = TextEditingController();
    _producerController = TextEditingController();
    _composerController = TextEditingController();
    _lyricistController = TextEditingController();
    _fileNameController = TextEditingController();
    _lyricsFileNameController = TextEditingController();
    _moodController = TextEditingController();
    _paceController = TextEditingController();
    _spanController = TextEditingController();
    _storyController = TextEditingController();

    _fetchSongDetails(); // Fetch song details when the page initializes
  }

  // Function to fetch rejected song details from the backend
  Future<void> _fetchSongDetails() async {
    if (!mounted) return;
    
    setState(() {
      _isLoading = true;
    });

    try {
      // Try single song endpoint first
      final response = await ApiService.getRejectedSongDetails(widget.songId, isAlbumSong: false);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final responseData = json.decode(response.body);
        if (responseData != null && responseData['success'] == true && responseData['data'] != null) {
          _songData = responseData['data'] as Map<String, dynamic>?;
          if (_songData != null) {
            _populateFields(_songData!);
            return;
          }
        }
      }

      // If single song endpoint fails, try album song endpoint
      final albumResponse = await ApiService.getRejectedSongDetails(widget.songId, isAlbumSong: true);

      if (albumResponse.statusCode >= 200 && albumResponse.statusCode < 300) {
        final responseData = json.decode(albumResponse.body);
        if (responseData != null && responseData['success'] == true && responseData['data'] != null) {
          _songData = responseData['data'] as Map<String, dynamic>?;
          if (_songData != null) {
            _populateFields(_songData!);
            return;
          }
        }
      }

      _showErrorMessage('No song data found for this ID.');
    } catch (e) {
      _showErrorMessage('Error fetching song details: ${e.toString()}');
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  // Helper method to populate form fields with fetched data
  void _populateFields(Map<String, dynamic> data) {
    setState(() {
      // Update controllers with fetched data
      _songNameController.text = data['songName'] ?? '';
      _fullNameController.text = data['FullName'] ?? '';
      _singerController.text = data['singer'] ?? '';
      _producerController.text = data['producer'] ?? '';
      _composerController.text = data['composer'] ?? '';
      _lyricistController.text = data['lyricist'] ?? '';
      _fileNameController.text = data['fileName'] ?? '';
      _lyricsFileNameController.text = data['lyricsFileName'] ?? '';
      _moodController.text = data['mood'] ?? '';
      _paceController.text = data['pace'] ?? '';
      _spanController.text = data['span'] ?? '';
      _storyController.text = data['story'] ?? '';

      // Detect album song based on presence of album data (like upload screen)
      // Check for album_id, albumName, or albumId fields
      String? albumIdValue = data['album_id']?.toString() ?? 
                           data['albumId']?.toString() ?? 
                           data['albumID']?.toString();
      String? albumNameValue = data['album_name']?.toString() ?? 
                             data['albumName']?.toString() ?? 
                             data['album']?.toString();
      
      // Song is considered part of an album if either album ID or album name exists
      bool hasAlbumData = (albumIdValue != null && albumIdValue.isNotEmpty && albumIdValue != 'null') ||
                         (albumNameValue != null && albumNameValue.isNotEmpty && albumNameValue != 'null');
      
      if (hasAlbumData) {
        _albumId = albumIdValue;
        _albumName = albumNameValue ?? 'Unknown Album';
        _isAlbumSong = true;
        print('Detected album song: Album ID = $_albumId, Album Name = $_albumName');
      } else {
        _albumId = null;
        _albumName = null;
        _isAlbumSong = false;
        print('Detected single song (no album data found)');
      }

      // Safe assignment for language
      String? fetchedLanguage = data['languages'];
      _selectedLanguage = _languages.contains(fetchedLanguage) ? fetchedLanguage : null;

      // Safe assignment for genre
      String? fetchedGenre = data['genre'];
      _selectedGenre = _genres.contains(fetchedGenre) ? fetchedGenre : null;
    });
  }

  // Helper method to show error messages
  void _showErrorMessage(String message) {
    if (!mounted) return;
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  // Function to update single song details
  Future<void> _updateSingleSong() async {
    if (!mounted) return;
    
    // Generate timestamp in the required format
    final now = DateTime.now();
    final timestamp = '${now.year.toString().padLeft(4, '0')}${now.month.toString().padLeft(2, '0')}${now.day.toString().padLeft(2, '0')}_${now.hour.toString().padLeft(2, '0')}${now.minute.toString().padLeft(2, '0')}${now.second.toString().padLeft(2, '0')}';

    // Collect all data from controllers and dropdowns
    final Map<String, dynamic> songData = {
      'song_id': widget.songId,
      'user_id': widget.userId,
      'songName': _songNameController.text,
      'FullName': _fullNameController.text,
      'composer': _composerController.text,
      'producer': _producerController.text,
      'singer': _singerController.text,
      'lyricist': _lyricistController.text,
      'fileName': _fileNameController.text,
      'lyricsFileName': _lyricsFileNameController.text,
      'updatedTimestamp': timestamp,
      'mood': _moodController.text,
      'pace': _paceController.text,
      'genre': _selectedGenre ?? '',
      'languages': _selectedLanguage ?? '',
      'span': _spanController.text,
      'story': _storyController.text,
    };

    try {
      final response = await ApiService.updateRejectedSong(songData);
      if (!mounted) return;
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Single song updated successfully!'),
              backgroundColor: Colors.green,
            ),
          );
          Navigator.pop(context, true);
        }
      } else {
        _showErrorMessage('Failed to update song: ${response.statusCode}');
      }
    } catch (e) {
      _showErrorMessage('Error updating song: ${e.toString()}');
    }
  }

  // Function to update album song details
  Future<void> _updateAlbumSong() async {
    if (!mounted) return;
    
    // Validate album ID
    if (_albumId == null || _albumId!.isEmpty) {
      _showErrorMessage('Album ID is required for album songs');
      return;
    }

    // Generate timestamp in ISO format for album songs
    final now = DateTime.now();
    final timestamp = now.toIso8601String();

    // Collect song data in the required format for album songs
    final Map<String, dynamic> albumSongData = {
      'user_id': widget.userId,
      'album_id': _albumId!,
      'songs': [
        {
          'song_id': widget.songId,
          'songName': _songNameController.text,
          'fileName': _fileNameController.text,
          'lyricsFileName': _lyricsFileNameController.text,
          'singer': _singerController.text,
          'producer': _producerController.text,
          'composer': _composerController.text,
          'lyricist': _lyricistController.text,
          'genre': _selectedGenre ?? '',
          'language': _selectedLanguage ?? '',
          'mood': _moodController.text,
          'pace': _paceController.text,
        }
      ],
      'updatedTimestamp': timestamp,
    };

    try {
      final response = await ApiService.updateRejectedAlbumSong(albumSongData);
      if (!mounted) return;
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Album song updated successfully!'),
              backgroundColor: Colors.green,
            ),
          );
          Navigator.pop(context, true);
        }
      } else {
        _showErrorMessage('Failed to update album song: ${response.statusCode}');
      }
    } catch (e) {
      _showErrorMessage('Error updating album song: ${e.toString()}');
    }
  }

  // Main update function that calls appropriate method based on detected song type
  Future<void> _updateSongDetails() async {
    if (_isAlbumSong) {
      await _updateAlbumSong();
    } else {
      await _updateSingleSong();
    }
  }

  // Play song function
  void _playSong() {
    if (_songData != null) {
      // Check if song file URL is available
      String? songUrl = _songData!['songFileUrl'] ?? _songData!['song_file_url'] ?? _songData!['fileName'];
      
      if (songUrl != null && songUrl.isNotEmpty) {
        // Show a dialog or navigate to a player screen
        showDialog(
          context: context,
          builder: (BuildContext context) {
            return AlertDialog(
              backgroundColor: const Color(0xFF2C2C2C),
              title: const Text(
                'Play Song',
                style: TextStyle(color: Colors.white),
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.music_note,
                    color: Color(0xFF1DB954),
                    size: 48,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    _songNameController.text.isNotEmpty 
                        ? _songNameController.text 
                        : 'Unknown Song',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _singerController.text.isNotEmpty 
                        ? 'by ${_singerController.text}' 
                        : 'Unknown Artist',
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Song playback functionality will be implemented here.',
                    style: TextStyle(
                      color: Colors.white60,
                      fontSize: 12,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text(
                    'Close',
                    style: TextStyle(color: Color(0xFF1DB954)),
                  ),
                ),
              ],
            );
          },
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Song file not available for playback'),
            backgroundColor: Colors.orange,
          ),
        );
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Song data not loaded'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  void dispose() {
    _songNameController.dispose();
    _fullNameController.dispose();
    _singerController.dispose();
    _producerController.dispose();
    _composerController.dispose();
    _lyricistController.dispose();
    _fileNameController.dispose();
    _lyricsFileNameController.dispose();
    _moodController.dispose();
    _paceController.dispose();
    _spanController.dispose();
    _storyController.dispose();
    super.dispose();
  }

  // Safe setState
  void _safeSetState(VoidCallback fn) {
    if (mounted) setState(fn);
  }

  // Show snack bar
  void _showSnackBar(String message) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message)),
      );
    }
  }

  // Pick song file
  Future<void> _pickSongFile() async {
    _safeSetState(() => _isSongButtonLoading = true);
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.audio,
      );
      if (result != null && result.files.single.path != null) {
        final file = File(result.files.single.path!);
        final fileExtension = file.path.split('.').last.toLowerCase();
        const supportedAudioFormats = ['mp3', 'wav', 'm4a', 'aac'];

        if (supportedAudioFormats.contains(fileExtension)) {
          _safeSetState(() {
            _pickedSongFilePath = result.files.single.path;
            _songFileError = null;
            // Update the file name controller with the picked file name
            _fileNameController.text = result.files.single.name;
          });
          print('Picked song file: $_pickedSongFilePath');
        } else {
          _showSnackBar('Unsupported audio format. Supported formats are .mp3, .wav, .m4a, .aac.');
        }
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
          // Update the lyrics file name controller with the picked file name
          _lyricsFileNameController.text = result.files.single.name;
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF151415),
      appBar: AppBar(
        titleSpacing: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        automaticallyImplyLeading: false,
        backgroundColor: Colors.transparent,
        title: Text(
          _isAlbumSong ? 'Edit Album Song' : 'Edit Song Details',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Song Info Header (like Analytics profile section)
            Container(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  // Song Cover (like profile avatar)
                  Container(
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: Colors.white,
                        width: 3.0,
                      ),
                    ),
                    child: CircleAvatar(
                      radius: 40,
                      backgroundColor: Colors.grey[800],
                      child: const Icon(
                        Icons.music_note,
                        color: Colors.white,
                        size: 40,
                      ),
                    ),
                  ),
                  const SizedBox(width: 20),
                  // Song Details
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _songNameController.text.isNotEmpty 
                              ? _songNameController.text 
                              : 'Song Name',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _singerController.text.isNotEmpty 
                              ? _singerController.text 
                              : 'Artist Name',
                          style: const TextStyle(
                            color: Colors.grey,
                            fontSize: 14,
                          ),
                        ),
                        // Album info if applicable
                        if (_isAlbumSong && _albumName != null) ...[
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              const Icon(Icons.album, color: Colors.blue, size: 16),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  _albumName!,
                                  style: const TextStyle(
                                    color: Colors.blue,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Form Fields in Expanded ScrollView
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [

                    // Basic Info Section
                    _buildSectionCard(
                      title: 'Basic Information',
                      children: [
                        _buildTextField('Song Name', _songNameController),
                        _buildTextField('Full Name', _fullNameController),
                        _buildDropdownField(
                          label: 'Language',
                          value: _selectedLanguage,
                          items: _languages,
                          onChanged: (String? newValue) {
                            setState(() {
                              _selectedLanguage = newValue;
                            });
                          },
                        ),
                        _buildDropdownField(
                          label: 'Genre',
                          value: _selectedGenre,
                          items: _genres,
                          onChanged: (String? newValue) {
                            setState(() {
                              _selectedGenre = newValue;
                            });
                          },
                        ),
                      ],
                    ),

                    const SizedBox(height: 20),

                    // File Information Section
                    _buildSectionCard(
                      title: 'File Information',
                      children: [
                        _buildTextField('File Name', _fileNameController),
                        _buildTextField('Lyrics File Name', _lyricsFileNameController),
                        _buildTextField('Song Duration (Span)', _spanController),
                      ],
                    ),

                    const SizedBox(height: 20),

                    // Song Details Section
                    _buildSectionCard(
                      title: 'Song Details',
                      children: [
                        _buildTextField('Mood', _moodController),
                        _buildTextField('Pace', _paceController),
                        _buildTextFieldWithInfo(
                          label: 'Story Behind the song',
                          controller: _storyController,
                          infoText: 'What inspired you to make this song?',
                        ),
                      ],
                    ),

                    const SizedBox(height: 20),

                    // Credits Section
                    _buildSectionCard(
                      title: 'Credits',
                      children: [
                        _buildTextField('Singer', _singerController),
                        _buildTextField('Composer', _composerController),
                        _buildTextField('Lyricist', _lyricistController),
                        _buildTextField('Producer', _producerController),
                      ],
                    ),
                    const SizedBox(height: 30),

                    // Action Buttons
                    _buildActionButtons(),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField(String label, TextEditingController controller) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 5),
        TextFormField(
          controller: controller,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.white10,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide.none,
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Color(0xFF2644D9), width: 2),
            ),
          ),
        ),
        const SizedBox(height: 15),
      ],
    );
  }

  Widget _buildTextFieldWithInfo({
    required String label,
    required TextEditingController controller,
    required String infoText,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(width: 8),
            Tooltip(
              message: infoText,
              textStyle: const TextStyle(color: Colors.white),
              decoration: BoxDecoration(
                color: Colors.grey[800],
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.info_outline,
                color: Colors.white70,
                size: 20,
              ),
            ),
          ],
        ),
        const SizedBox(height: 5),
        TextFormField(
          controller: controller,
          style: const TextStyle(color: Colors.white),
          maxLines: 3,
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.white10,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide.none,
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Color(0xFF2644D9), width: 2),
            ),
          ),
        ),
        const SizedBox(height: 15),
      ],
    );
  }

  Widget _buildDropdownField({
    required String label,
    required String? value,
    required List<String> items,
    required ValueChanged<String?> onChanged,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 5),
        DropdownButtonFormField<String>(
          value: value,
          onChanged: onChanged,
          dropdownColor: Colors.grey[800],
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.white10,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide.none,
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: Color(0xFF2644D9), width: 2),
            ),
          ),
          items: items.map<DropdownMenuItem<String>>((String item) {
            return DropdownMenuItem<String>(
              value: item,
              child: Text(item),
            );
          }).toList(),
        ),
        const SizedBox(height: 15),
      ],
    );
  }

  Widget _buildFileUploadButton({
    required String label,
    required String fileName,
    required VoidCallback onPressed,
    required bool isLoading,
    String? error,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          width: double.infinity,
          height: 50,
          decoration: BoxDecoration(
            color: Colors.white10,
            borderRadius: BorderRadius.circular(10),
            border: error != null ? Border.all(color: Colors.red, width: 1) : null,
          ),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: isLoading ? null : onPressed,
              borderRadius: BorderRadius.circular(10),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Row(
                  children: [
                    if (isLoading)
                      const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF2644D9)),
                        ),
                      )
                    else
                      const Icon(
                        Icons.upload_file,
                        color: Color(0xFF2644D9),
                        size: 20,
                      ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        fileName,
                        style: TextStyle(
                          color: fileName == 'No file selected' ? Colors.white60 : Colors.white,
                          fontSize: 14,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (!isLoading)
                      const Icon(
                        Icons.folder_open,
                        color: Colors.white60,
                        size: 20,
                      ),
                  ],
                ),
              ),
            ),
          ),
        ),
        if (error != null)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text(
              error,
              style: const TextStyle(
                color: Colors.red,
                fontSize: 12,
              ),
            ),
          ),
        const SizedBox(height: 15),
      ],
    );
  }

  // Build section card (Analytics style)
  Widget _buildSectionCard({
    required String title,
    required List<Widget> children,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[900]?.withOpacity(0.3),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Colors.white.withOpacity(0.1),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          ...children,
        ],
      ),
    );
  }

  // Build action buttons (Analytics style)
  Widget _buildActionButtons() {
    return Column(
      children: [
        // Play Song Button (Analytics style)
        Container(
          width: double.infinity,
          height: 50,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF1DB954), Color(0xFF1ED760)],
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
            ),
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF1DB954).withOpacity(0.3),
                spreadRadius: 0,
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.transparent,
              shadowColor: Colors.transparent,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            onPressed: _playSong,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.play_arrow,
                  color: Colors.white,
                  size: 24,
                ),
                const SizedBox(width: 8),
                const Text(
                  'Play Song',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        
        // Update Button (Analytics style)
        Container(
          width: double.infinity,
          height: 50,
          decoration: BoxDecoration(
            color: const Color(0xFF2644D9),
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF2644D9).withOpacity(0.3),
                spreadRadius: 0,
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.transparent,
              shadowColor: Colors.transparent,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            onPressed: _updateSongDetails,
            child: Text(
              _isAlbumSong ? 'Update Album Song' : 'Update Song Details',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
          ),
        ),
      ],
    );
  }
}