// edit_profile.dart
import 'dart:convert';
import 'dart:io';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'package:http/http.dart' as http;
import 'package:intl/intl.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:image_cropper/image_cropper.dart';
import 'package:path_provider/path_provider.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'bottomnavigationbar.dart';
import 'package:voiceapp/profile_manager.dart';
import 'package:voiceapp/loading_screen.dart';
import 'package:voiceapp/connectivity_service.dart';
import 'package:voiceapp/services/api_service.dart';

class EditProfilePage extends StatefulWidget {
  final String userId;
  final String userfullname;
  final String userCategory;

  EditProfilePage({required this.userId, required this.userfullname,required this.userCategory});

  @override
  _EditProfilePageState createState() => _EditProfilePageState();
}

class _EditProfilePageState extends State<EditProfilePage>  with SingleTickerProviderStateMixin {
  File? _profileImage;
  File? _coverImage;
  String? _profileImageUrl;
  String? _coverImageUrl;
  final ImagePicker _picker = ImagePicker();
  TextEditingController _usernameController = TextEditingController();
  TextEditingController _bioController = TextEditingController();
  TextEditingController _stageNameController = TextEditingController();
  String? _bioErrorText; // To hold the error message
  final int _charLimit = 300;
  bool _hasStageName = false;
  bool _isStageNameEditable = false;

  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<Color?> _colorAnimation;
  late Animation<double> _shadowAnimation;

  final FocusNode _stageNameFocusNode = FocusNode();

  final ValueNotifier<bool> isLoading = ValueNotifier(false);
  bool _isLoading = true;
  bool _isNoInternet = false;
  late ConnectivityService _connectivityService;
  bool _mounted = true;

  bool _hasChanges = false;
  String _initialUsername = '';
  String _initialStageName = '';
  String _initialBio = '';

  @override
  void initState() {
    _mounted = true;
    _connectivityService = ConnectivityService();
    _setupConnectivityListener();
    // _fetchCoverImage();

    // _fetchProfileImage();
    _stageNameFocusNode.addListener(_handleStageNameFocusChange);
    _bioController.addListener(_checkBioLength);
    _fetchProfileDetails();

    _controller = AnimationController(
      duration: const Duration(milliseconds: 150),
      vsync: this,
      lowerBound: 0.9, // Scale down on tap
      upperBound: 1.0,
    );

    // Define scaling animation curve
    _scaleAnimation = CurvedAnimation(parent: _controller, curve: Curves.easeOut);

    // Define color animation from blue to greenAccent
    _colorAnimation = ColorTween(begin: Colors.blue, end: Colors.blue).animate(_controller);

    // Define shadow animation
    _shadowAnimation = Tween<double>(begin: 5.0, end: 10.0).animate(_controller);

    _usernameController.addListener(_checkForChanges);
    _stageNameController.addListener(_checkForChanges); // Always add listener
    _bioController.addListener(_checkForChanges);

    super.initState();
  }

  void _checkForChanges() {
    setState(() {
      // Compare current values with initial values
      _hasChanges =
          _usernameController.text.trim() != _initialUsername.trim() ||
              (_hasStageName && _stageNameController.text.trim() != _initialStageName.trim()) ||
              _bioController.text.trim() != _initialBio.trim();
    });
  }

  void _setupConnectivityListener() {
    _connectivityService.connectionStream.listen((hasConnection) {
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
      await _fetchProfileDetails();

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
    _bioController.removeListener(_checkBioLength); // Remove listener when disposing
    _bioController.dispose();
    _stageNameFocusNode.dispose();
    _stageNameFocusNode.removeListener(_handleStageNameFocusChange);
    _controller.dispose();

    _usernameController.removeListener(_checkForChanges);
    _stageNameController.removeListener(_checkForChanges); // Always remove listener
    _bioController.removeListener(_checkForChanges);
    super.dispose();
  }

  void _handleStageNameFocusChange() {
    if (!_stageNameFocusNode.hasFocus) {
      // Reset `_isStageNameEditable` when focus is lost to show warning again on refocus
      setState(() {
        _isStageNameEditable = false;
      });
    }
  }
  Future<void> _showStageNameEditDialog() async {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor: Color(0xFF151415),
          title: Text('Warning',textAlign: TextAlign.center,),
          content: Text('Your identity with the audience will be changed.',textAlign: TextAlign.center,),
          actions: [
            // Wrap the actions in a Center widget
            Center(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center, // Center the buttons horizontally
                children: [
                  TextButton(
                    onPressed: () {
                      Navigator.of(context).pop(); // Close dialog
                    },
                    child: Text('Cancel', style: TextStyle(color: Colors.white,fontSize: 16)),
                  ),
                  SizedBox(width: 45), // Add some space between buttons
                  TextButton(
                    onPressed: () {
                      setState(() {
                        _isStageNameEditable = true; // Enable editing only after confirmation
                      });
                      Navigator.of(context).pop(); // Close dialog
                      WidgetsBinding.instance.addPostFrameCallback((_) {
                        _stageNameFocusNode.requestFocus(); // Open keyboard for Stage Name field
                      });
                    },
                    child: Text('Yes', style: TextStyle(color: Colors.white,fontSize: 16)),
                  ),
                ],
              ),
            ),
          ],
        );
      },
    );
  }
  Future<void> _requestPermissionAndPickImage(ImageSource source) async {
    // Show bottom sheet with options instead of directly checking permissions
    showModalBottomSheet(
      context: context,
      backgroundColor: Color(0xFF151415),
      barrierColor: Colors.white.withOpacity(0.05),
      elevation: 18,
      builder: (BuildContext context) {
        return BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 4, sigmaY: 4),

          child: Container(
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0), // Slightly transparent for blur effect to show through
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.7),
                  spreadRadius: 3,
                  blurRadius: 0.5,
                  offset: Offset(3, -3), // Shadow positioned above the bottom sheet
                ),
              ],
              borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: SafeArea(
              child: Wrap(
                children: <Widget>[
                  ListTile(
                    leading: Icon(Icons.photo_library),
                    title: Text('Choose from Gallery'),
                    onTap: () {
                      Navigator.of(context).pop();
                      _checkPermissionAndProceed(ImageSource.gallery, isCoverImage: true);
                    },
                  ),
                  ListTile(
                    leading: Icon(Icons.camera_alt),
                    title: Text('Capture from Camera'),
                    onTap: () {
                      Navigator.of(context).pop();
                      _checkPermissionAndProceed(ImageSource.camera, isCoverImage: true);
                    },
                  ),
                  // Add delete option
                  ListTile(
                    leading: Icon(Icons.delete, color: Colors.red),
                    title: Text('Remove Cover Image', style: TextStyle(color: Colors.red)),
                    onTap: () {
                      Navigator.of(context).pop();
                      _showDeleteConfirmationDialog('cover');
                    },
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

// Modified method for profile image
  Future<void> _requestPermissionAndPickImage1(ImageSource source) async {
    // Show bottom sheet with options instead of directly checking permissions
    showModalBottomSheet(
      context: context,
      backgroundColor: Color(0xFF151415),
      barrierColor: Colors.white.withOpacity(0.05),
      elevation: 8,
      builder: (BuildContext context) {
        return BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 4, sigmaY: 4),
          child: Container(
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.05), // Slightly transparent for blur effect to show through
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.7),
                  spreadRadius: 3,
                  blurRadius: 0.5,
                  offset: Offset(3, -3), // Shadow positioned above the bottom sheet
                ),
              ],
              borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
            ),
            child: SafeArea(
              child: Wrap(
                children: <Widget>[
                  ListTile(
                    leading: Icon(Icons.photo_library),
                    title: Text('Choose from Gallery'),
                    onTap: () {
                      Navigator.of(context).pop();
                      _checkPermissionAndProceed(ImageSource.gallery, isCoverImage: false);
                    },
                  ),
                  ListTile(
                    leading: Icon(Icons.camera_alt),
                    title: Text('Capture from Camera'),
                    onTap: () {
                      Navigator.of(context).pop();
                      _checkPermissionAndProceed(ImageSource.camera, isCoverImage: false);
                    },
                  ),
                  // Add delete option
                  ListTile(
                    leading: Icon(Icons.delete, color: Colors.red),
                    title: Text('Remove Profile Image', style: TextStyle(color: Colors.red)),
                    onTap: () {
                      Navigator.of(context).pop();
                      _showDeleteConfirmationDialog('profile');
                    },
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

// New helper method to check permissions and proceed
  Future<void> _checkPermissionAndProceed(ImageSource source, {required bool isCoverImage}) async {
    if (source == ImageSource.gallery) {
      // For gallery access, try different permission approaches based on Android version
      List<Permission> galleryPermissions = [
        Permission.storage,
        Permission.photos,
        Permission.mediaLibrary,
      ];
      
      bool hasPermission = false;
      
      // Check if any of the gallery permissions are granted
      for (Permission permission in galleryPermissions) {
        PermissionStatus status = await permission.status;
        if (status.isGranted) {
          hasPermission = true;
          break;
        }
      }
      
      if (!hasPermission) {
        // Try to request storage permission first
        PermissionStatus storageStatus = await Permission.storage.request();
        if (storageStatus.isGranted) {
          hasPermission = true;
        } else {
          // If storage permission fails, try photos permission
          PermissionStatus photosStatus = await Permission.photos.request();
          if (photosStatus.isGranted) {
            hasPermission = true;
          }
        }
      }
      
      if (hasPermission) {
        // Permission granted, proceed with image picking
        if (isCoverImage) {
          _pickImage1(source);
        } else {
          _pickImage(source);
        }
      } else {
        // Check if permanently denied
        bool isPermanentlyDenied = await Permission.storage.isPermanentlyDenied || 
                                  await Permission.photos.isPermanentlyDenied;
        
        if (isPermanentlyDenied) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Permission permanently denied. Please enable it in settings.')),
          );
          await openAppSettings();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Gallery permission denied. Please allow access to continue.')),
          );
        }
      }
    } else {
      // Camera permission handling
      PermissionStatus cameraStatus = await Permission.camera.status;
      
      if (cameraStatus.isGranted) {
        if (isCoverImage) {
          _pickImage1(source);
        } else {
          _pickImage(source);
        }
      } else if (cameraStatus.isDenied) {
        cameraStatus = await Permission.camera.request();
        if (cameraStatus.isGranted) {
          if (isCoverImage) {
            _pickImage1(source);
          } else {
            _pickImage(source);
          }
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Camera permission denied. Please allow access to continue.')),
          );
        }
      } else if (cameraStatus.isPermanentlyDenied) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Camera permission permanently denied. Please enable it in settings.')),
        );
        await openAppSettings();
      }
    }
  }

// Add a confirmation dialog for delete
  void _showDeleteConfirmationDialog(String imageType) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor: Color(0xFF151415),
          title: Text('Confirm Delete', textAlign: TextAlign.center),
          content: Text(
              'Are you sure you want to remove your ${imageType == 'profile' ? 'profile' : 'cover'} image?',
              textAlign: TextAlign.center
          ),
          actions: [
            Center(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  TextButton(
                    onPressed: () {
                      Navigator.of(context).pop(); // Close dialog
                    },
                    child: Text('Cancel', style: TextStyle(color: Colors.white, fontSize: 16)),
                  ),
                  SizedBox(width: 45),
                  TextButton(
                    onPressed: () {
                      Navigator.of(context).pop();
                      if (imageType == 'profile') {
                        _deleteProfileImage();
                      } else {
                        _deleteCoverImage();
                      }
                    },
                    child: Text('Delete', style: TextStyle(color: Colors.red, fontSize: 16)),
                  ),
                ],
              ),
            ),
          ],
        );
      },
    );
  }

  Future<void> _deleteProfileImage() async {
    try {
      // Set loading state
      isLoading.value = true;

      final String timestamp = DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());
      final userId = ProfileManager().getUserId();
      if (userId == null) return;
      
      final response = await ApiService.clearProfilePhoto(userId, timestamp);

      if (response.statusCode == 200) {
        // Clear local image state
        setState(() {
          _profileImage = null;
          _profileImageUrl = null;
        });

        // Update ProfileManager and notify listeners
        await ProfileManager().fetchUpdatedProfileImage();

        // Force a rebuild for immediate UI update
        if (mounted) {
          setState(() {}); // Trigger another rebuild after ProfileManager update
        }

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Profile image removed successfully')),
        );
      } else {
        print('Failed to delete profile image. Status code: ${response.statusCode}');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to remove profile image')),
        );
      }
    } catch (e) {
      print('Error deleting profile image: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error removing profile image')),
      );
    } finally {
      isLoading.value = false;
    }
  }

  Future<void> _deleteCoverImage() async {
    // Check if the current cover image is the default image
    if (ProfileManager().coverImageUrl == null ||
        ProfileManager().coverImageUrl!.contains('default.jpg')) {
      // ScaffoldMessenger.of(context).showSnackBar(
      //   SnackBar(content: Text('No custom cover image to remove')),
      // );
      return;
    }

    try {
      // Set loading state
      isLoading.value = true;

      final String timestamp = DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());
      final userId = ProfileManager().getUserId();
      if (userId == null) return;
      
      final response = await ApiService.clearCoverPagePhoto(userId, timestamp);

      if (response.statusCode == 200) {
        // Clear local image state immediately
        setState(() {
          _coverImage = null;
          _coverImageUrl = null;
        });

        // Update ProfileManager and notify listeners
        await ProfileManager().fetchUpdatedCoverImage();

        // Force a rebuild for immediate UI update after ProfileManager update
        if (mounted) {
          setState(() {}); // Trigger another rebuild
        }

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Cover image removed successfully')),
        );
      } else {
        print('Failed to delete cover image. Status code: ${response.statusCode}');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to remove cover image')),
        );
      }
    } catch (e) {
      print('Error deleting cover image: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error removing cover image')),
      );
    } finally {
      isLoading.value = false;
    }
  }


  void _checkBioLength() {
    setState(() {
      if (_bioController.text.length > _charLimit) {
        _bioErrorText = 'Bio cannot exceed $_charLimit characters';
      } else {
        _bioErrorText = null; // Clear error if within limit
      }
    });
  }

  Future<void> _fetchProfileDetails() async {
    try {
      final userId = ProfileManager().getUserId();
      if (userId == null) return;
      
      final response = await ApiService.getProfileDetails(userId);

      if (response.statusCode == 200) {
        final responseBody = json.decode(response.body);

        if (responseBody != null) {
          // Extract StageName and FullName and use FullName if StageName is not provided
          String stageName = responseBody['StageName']?['S'] ?? '';
          String fullName = responseBody['FullName']?['S'] ?? '';

          // Set username as StageName if present, otherwise use FullName
          String username = stageName.trim().isNotEmpty ? fullName : (fullName.trim().isNotEmpty ? fullName : 'unknown');

          setState(() {
            // Store initial values
            _initialUsername = username;
            _initialStageName = stageName;
            _initialBio = responseBody['bio']?['S'] ?? '';

            // Update controllers with fetched values
            _usernameController.text = username;
            _bioController.text = _initialBio;
            _hasStageName = stageName.trim().isNotEmpty;
            if (_hasStageName) {
              _stageNameController.text = stageName;
            }

            // Reset changes flag
            _hasChanges = false;
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



  Future<void> _fetchCoverImage() async {
    try {
      final userId = ProfileManager().getUserId();
      if (userId == null) return;
      
      // Make the GET request to fetch the cover image URL
      final response = await ApiService.getCoverPageImage(userId);

      if (response.statusCode == 200) {
        final responseBody = json.decode(response.body);

        // Check if responseBody contains the key 'coverPageUrl' and extract 'S' value
        if (responseBody != null && responseBody['coverPageUrl'] != null && responseBody['coverPageUrl']['S'] != null) {
          String imageUrl = responseBody['coverPageUrl']['S']; // Extract the cover image URL

          // Set the cover image URL to display it
          setState(() {
            _coverImageUrl = imageUrl;
          });
        } else {
          print('No cover image URL found in the response.');
        }
      } else {
        print('Failed to fetch cover image. Status code: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching cover image: $e');
    }
  }



  // Function to show options to pick image from camera or gallery
  Future<void> _fetchProfileImage() async {
    try {
      final userId = ProfileManager().getUserId();
      if (userId == null) return;
      
      // Make the GET request to fetch the profile image URL
      final response = await ApiService.getProfilePhoto(userId);

      if (response.statusCode == 200) {
        final responseBody = json.decode(response.body);

        // Check if responseBody contains the key 'profilePhotoUrl' and extract 'S' value
        if (responseBody != null && responseBody['profilePhotoUrl'] != null && responseBody['profilePhotoUrl']['S'] != null) {
          String imageUrl = responseBody['profilePhotoUrl']['S']; // Extract the profile image URL

          // Set the profile image URL to display it
          setState(() {
            _profileImageUrl = imageUrl;
          });
        } else {
          print('No profile image URL found in the response.');
        }
      } else {
        print('Failed to fetch profile image. Status code: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching profile image: $e');
    }
  }


  // Pick image from gallery or capture from camera
  // Function to pick and crop profile image
// Function to pick and crop profile image
  Future<void> _pickImage(ImageSource source) async {
    final pickedFile = await _picker.pickImage(source: source);
    if (pickedFile != null) {
      CroppedFile? croppedFile = await ImageCropper().cropImage(
        sourcePath: pickedFile.path,
        aspectRatio: const CropAspectRatio(ratioX: 1, ratioY: 1), // Square aspect ratio
        uiSettings: [
          AndroidUiSettings(
            toolbarTitle: 'Crop Profile Image',
            toolbarColor: Colors.blue,
            toolbarWidgetColor: Colors.white,
            initAspectRatio: CropAspectRatioPreset.original,
            lockAspectRatio: true,
          ),
          IOSUiSettings(
            minimumAspectRatio: 1.0,
          ),
        ],
      );

      if (croppedFile != null) {
        setState(() {
          _profileImage = File(croppedFile.path); // Convert CroppedFile to File
          _uploadImage(_profileImage!);
        });
      }
    }
  }

// Function to pick and crop cover image
  Future<void> _pickImage1(ImageSource source) async {
    final pickedFile = await _picker.pickImage(source: source);
    if (pickedFile != null) {
      CroppedFile? croppedFile = await ImageCropper().cropImage(
        sourcePath: pickedFile.path,
        aspectRatio: const CropAspectRatio(ratioX: 16, ratioY: 9), // Widescreen aspect ratio
        uiSettings: [
          AndroidUiSettings(
            toolbarTitle: 'Crop Cover Image',
            toolbarColor: Colors.blue,
            toolbarWidgetColor: Colors.white,
            initAspectRatio: CropAspectRatioPreset.original,
            lockAspectRatio: false,
          ),
          IOSUiSettings(
            minimumAspectRatio: 1.0,
          ),
        ],
      );

      if (croppedFile != null) {
        setState(() {
          _coverImage = File(croppedFile.path); // Convert CroppedFile to File
          _uploadImage1(_coverImage!);
        });
      }
    }
  }



  // Get initials for user's profile picture if no image is uploaded
  String getInitials(String? fullName, {String? stageName}) {
    if (stageName != null && stageName.trim().isNotEmpty) {
      List<String> stageNameParts = stageName.trim().split(RegExp(r'\s+'));
      if (stageNameParts.length == 1) {
        return stageNameParts[0][0].toUpperCase();
      }
      return stageNameParts[0][0].toUpperCase() + stageNameParts[1][0].toUpperCase();
    }

    if (fullName == null || fullName.trim().isEmpty) {
      return "";
    }

    List<String> nameParts = fullName.trim().split(RegExp(r'\s+'));
    if (nameParts.length == 1) {
      return nameParts[0][0].toUpperCase();
    }
    return nameParts[0][0].toUpperCase() + nameParts[1][0].toUpperCase();
  }


  // Function to upload the image using a presigned URL
  Future<void> _uploadImage(File imageFile) async {

    final String registrationDate = DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());



    print(registrationDate);
    try {


      // Step 1: Get the presigned URL
      String? presignedUrl = await _getPresignedUrl(imageFile,registrationDate);

      // Step 2: Upload the image to the presigned URL
      if (presignedUrl != null && presignedUrl.isNotEmpty) {
        final response = await http.put(
          Uri.parse(presignedUrl),
          headers: {
            'Content-Type': 'image/jpeg', // Ensure correct MIME type
          },
          body: await imageFile.readAsBytes(),
        );

        if (response.statusCode == 200) {
          print("Image uploaded successfully.");
          _notifyServerAboutUpload(registrationDate);
        } else {
          print("Failed to upload image. Status code: ${response.statusCode}");
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to upload image')),
          );
        }
      } else {
        print("Presigned URL is null or empty.");
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to generate presigned URL')),
        );
      }
    } catch (e) {
      print("Error uploading image: $e");
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error uploading image')),
      );
    }
  }

  Future<void> _uploadImage1(File imageFile) async {
    try {
      // Step 1: Get the presigned URL

      final String registrationDate = DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());



      print(registrationDate);

      String? presignedUrl = await _getPresignedUrl1(imageFile,registrationDate);

      // Step 2: Upload the image to the presigned URL
      if (presignedUrl != null && presignedUrl.isNotEmpty) {
        final response = await http.put(
          Uri.parse(presignedUrl),
          headers: {
            'Content-Type': 'image/jpeg', // Ensure correct MIME type
          },
          body: await imageFile.readAsBytes(),
        );

        if (response.statusCode == 200) {
          _notifyServerAboutUpload1(registrationDate);
        } else {
          print("Failed to upload image. Status code: ${response.statusCode}");
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to upload image')),
          );
        }
      } else {
        print("Presigned URL is null or empty.");
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to generate presigned URL')),
        );
      }
    } catch (e) {
      print("Error uploading image: $e");
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error uploading image')),
      );
    }
  }

  Future<void> _notifyServerAboutUpload(String registrationDate) async {
    final String timestamp = DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());
    try {
      final response = await ApiService.notifyProfileImageUpload(
        userId: ProfileManager().getUserId() ?? '',
        imageUrl: "profile#${registrationDate}",
      );

      if (response.statusCode == 200) {
        await ProfileManager().fetchUpdatedProfileImage();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Profile image updated successfully')),
        );
      } else {
        print('Failed to notify server. Status code: ${response.statusCode}');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to notify server')),
        );
      }
    } catch (e) {
      print('Error notifying server: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error notifying server')),
      );
    }
  }

  Future<void> _notifyServerAboutUpload1( String registrationDate) async {

    final String timestamp = DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());
    try {
      final userId = ProfileManager().getUserId();
      if (userId == null) return;
      
      final response = await ApiService.notifyCoverPageUpload(
        userId: userId,
        fileName: "CoverPage#${registrationDate}",
        timestamp: timestamp,
      );

      if (response.statusCode == 200) {
        await ProfileManager().fetchUpdatedCoverImage();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('CoverPage uploaded successfully')),
        );
      } else {
        print('Failed to notify server. Status code: ${response.statusCode}');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to notify server')),
        );
      }
    } catch (e) {
      print('Error notifying server: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error notifying server')),
      );
    }
  }


  // Function to request presigned URL from the API
  Future<String?> _getPresignedUrl(File imageFile, String registrationDate) async {
    try {
      // Extract the file name from the selected image file path
      String fileName = imageFile.path.split('/').last;

      // Make the POST request to get the presigned URL
      final response = await ApiService.getPresignedUrlForProfilePhoto(
        userId: ProfileManager().getUserId() ?? '',
        fileName: "profile#${registrationDate}",
      );

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        // Extract the URL if present in the response
        return jsonResponse['url'] as String?;
      } else {
        print('Failed to get presigned URL. Status code: ${response.statusCode}');
        return null;
      }
    } catch (e) {
      print('Error getting presigned URL: $e');
      return null;
    }
  }

  Future<String?> _getPresignedUrl1(File imageFile, String registrationDate) async {
    try {
      // Extract file name from the selected image file path
      String fileName = imageFile.path.split('/').last;

      // Make the POST request to get the presigned URL
      final response = await ApiService.getPresignedUrlForCoverPage(
        userId: ProfileManager().getUserId() ?? '',
        fileName: "CoverPage#${registrationDate}",
      );

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        // Extract the URL if it exists in the response

        print(jsonResponse);
        return jsonResponse['url'] as String?;
      } else {
        print('Failed to get presigned URL. Status code: ${response.statusCode}');
        return null;
      }
    } catch (e) {
      print('Error getting presigned URL: $e');
      return null;
    }
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

  Future<void> _saveProfileDetails() async {

    if(_usernameController.text.isEmpty)
    {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Username cannot be empty.')),
      );
      return;
    }

    if (_hasStageName && _stageNameController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Stage name cannot be empty.')),
      );
      return;
    }

    final String timestamp = DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());

    // Capitalize the username
    String capitalizedUsername = capitalizeWords(_usernameController.text.trim());

    // Capitalize the stage name if it exists
    String stageName = _stageNameController.text.isNotEmpty
        ? capitalizeWords(_stageNameController.text.trim())
        : '';

    print(stageName);

    try {

      isLoading.value = true;
      
      final response = await ApiService.updateProfile(
        userId: ProfileManager().getUserId() ?? '',
        fullName: capitalizedUsername,
        bio: _bioController.text,
        stageName: stageName,
        updatedTimestamp: timestamp,
      );

      if (response.statusCode == 200) {
        // Update the controllers with capitalized values
        _usernameController.text = capitalizedUsername;
        if (_hasStageName) {
          _stageNameController.text = stageName;
        }

        // Update initial values to reflect the new saved state
        setState(() {
          _initialUsername = capitalizedUsername;
          _initialStageName = stageName;
          _initialBio = _bioController.text;
          _hasChanges = false; // Reset changes flag since we just saved
        });

        await ProfileManager().fetchUpdatedUsername();
        
        FocusScope.of(context).unfocus();
        
        // Show success message
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Profile updated successfully')),
          );
        }
      } else {
        print('Failed to update profile. Status code: ${response.statusCode}');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update profile')),
        );
      }
    } catch (e) {
      print('Error updating profile: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error updating profile')),
      );
    } finally {
      isLoading.value = false; // Stop loading
    }
  }



  // Show options for picking an image (Camera or Gallery)
  void _showImagePickerOptions() {
    showModalBottomSheet(
      context: context,
      builder: (BuildContext context) {
        return SafeArea(
          child: Wrap(
            children: <Widget>[
              ListTile(
                leading: Icon(Icons.photo_library),
                title: Text('Choose from Gallery'),
                onTap: () {
                  Navigator.of(context).pop();
                  _pickImage(ImageSource.gallery); // Pick image from gallery
                },
              ),
              ListTile(
                leading: Icon(Icons.camera_alt),
                title: Text('Capture from Camera'),
                onTap: () {
                  Navigator.of(context).pop();
                  _pickImage(ImageSource.camera); // Capture image from camera
                },
              ),
            ],
          ),
        );
      },
    );
  }

  void _showImagePickerOptions1() {
    showModalBottomSheet(
      context: context,
      builder: (BuildContext context) {
        return SafeArea(
          child: Wrap(
            children: <Widget>[
              ListTile(
                leading: Icon(Icons.photo_library),
                title: Text('Choose from Gallery'),
                onTap: () {
                  Navigator.of(context).pop();
                  _pickImage1(ImageSource.gallery); // Pick image from gallery
                },
              ),
              ListTile(
                leading: Icon(Icons.camera_alt),
                title: Text('Capture from Camera'),
                onTap: () {
                  Navigator.of(context).pop();
                  _pickImage1(ImageSource.camera); // Capture image from camera
                },
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    Widget content =  WillPopScope(
        onWillPop: () async {
          Navigator.pop(context, true);  // Pass true on back press
          return false; // Prevent the default pop to make sure our logic is executed
        },
        child:  Scaffold(
          //backgroundColor: Colors.blueGrey[900],
          body: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Stack to overlay AppBar items and cover image
                Container(
                  height: 350,
                  child: Stack(
                    alignment: Alignment.center,
                    clipBehavior: Clip.none,
                    children: [
                      // Cover image
                      Positioned(
                        top: 0, // Adjust this negative value to move the cover image up
                        left: 0,
                        right: 0,
                        child: Container(
                          height: 250,
                          width: double.infinity,
                          child: _coverImage != null
                              ? Image.file(
                            _coverImage!,
                            fit: BoxFit.cover,
                          )
                              : ProfileManager().coverImageUrl != null
                              ? Image.network(
                            ProfileManager().coverImageUrl!,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) {
                              return Image.asset(
                                'assets/default.jpg',
                                fit: BoxFit.cover,
                              );
                            },
                          )
                              : Image.asset(
                            'assets/default.jpg',
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                      // Back button and logo
                      Positioned(
                        top: 50,
                        left: 16,
                        child: GestureDetector(
                          onTap: () {
                            Navigator.pop(context, true);
                          },
                          child: Icon(Icons.arrow_back_ios, color: Colors.white),
                        ),
                      ),
                      // Positioned(
                      //   top: 40,
                      //   left: 32,
                      //   child: Image.asset(
                      //     'assets/logo.png',
                      //     height: 50,
                      //   ),
                      // ),
                      // Edit icon for cover image
                      if (widget.userCategory == "Singer" || widget.userCategory == "Listener")
                        Positioned(
                          right: -2,
                          bottom: 60,
                          child: Material(
                            color: Colors.transparent,
                            child: AnimatedBuilder(
                              animation: _controller,
                              builder: (context, child) => InkWell(
                                borderRadius: BorderRadius.circular(30),
                                onTap: () async {
                                  await _controller.forward(); // Animate forward (color and scale change)
                                  await _controller.reverse(); // Revert animation
                                  _requestPermissionAndPickImage(ImageSource.gallery);
                                },
                                child: Padding(
                                  padding: const EdgeInsets.all(20.0), // Increase tappable area with padding
                                  child: Transform.scale(
                                    scale: _scaleAnimation.value,
                                    child: Container(
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        color: _colorAnimation.value, // Use animated color
                                        boxShadow: [
                                          BoxShadow(
                                            color: Colors.black.withOpacity(0.3),
                                            blurRadius: _shadowAnimation.value,
                                            offset: Offset(0, 3),
                                          ),
                                        ],
                                      ),
                                      padding: const EdgeInsets.all(10.0), // Original icon padding
                                      child: Icon(Icons.edit, color: Colors.white),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),

                      // Profile image
                      // Replace the existing Positioned widget for the profile image in the Stack with this code
                      Positioned(
                        bottom: 68,
                        child: Stack(
                          clipBehavior: Clip.none,
                          alignment: Alignment.center,
                          children: [
                            GestureDetector(
                              onTap: () async {
                                print("Profile circle tapped");
                                await _controller.forward();
                                await _controller.reverse();
                                // ScaffoldMessenger.of(context).showSnackBar(
                                //   SnackBar(
                                //     content: Text('Profile image tapped'),
                                //     duration: Duration(seconds: 1),
                                //     backgroundColor: Colors.blue,
                                //     behavior: SnackBarBehavior.floating,
                                //   ),
                                // );
                                _requestPermissionAndPickImage1(ImageSource.gallery);
                              },
                              child: AnimatedBuilder(
                                animation: _controller,
                                builder: (context, child) => Transform.scale(
                                  scale: _scaleAnimation.value,
                                  child: Container(
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                        color: Colors.white,
                                        width: 4.0,
                                      ),
                                      boxShadow: [
                                        BoxShadow(
                                          color: Colors.black.withOpacity(0.3),
                                          blurRadius: _shadowAnimation.value,
                                          offset: Offset(0, 3),
                                        ),
                                      ],
                                    ),
                                    child: CircleAvatar(
                                      radius: 50,
                                      backgroundColor: Colors.grey,
                                      child: _profileImage != null
                                          ? ClipOval(
                                        child: Image.file(
                                          _profileImage!,
                                          fit: BoxFit.cover,
                                          width: 100,
                                          height: 100,
                                        ),
                                      )
                                          : ProfileManager().profileImageUrl != null
                                          ? ClipOval(
                                        child: Image.network(
                                          ProfileManager().profileImageUrl!,
                                          fit: BoxFit.cover,
                                          width: 100,
                                          height: 100,
                                          errorBuilder: (context, error, stackTrace) {
                                            return Text(
                                              getInitials(
                                                  _stageNameController.text.isNotEmpty
                                                      ? _stageNameController.text
                                                      : (_usernameController.text.isNotEmpty
                                                      ? _usernameController.text
                                                      : widget.userfullname)
                                              ),
                                              style: TextStyle(
                                                color: Colors.white,
                                                fontWeight: FontWeight.bold,
                                                fontSize: 30,
                                              ),
                                            );
                                          },
                                        ),
                                      )
                                          : Text(
                                        getInitials(
                                            _stageNameController.text.isNotEmpty
                                                ? _stageNameController.text
                                                : (_usernameController.text.isNotEmpty
                                                ? _usernameController.text
                                                : widget.userfullname)
                                        ),
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 30,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            // Edit icon
                            Positioned(
                              right: -20,
                              bottom: -25,
                              child: Material(
                                color: Colors.transparent,
                                child: AnimatedBuilder(
                                  animation: _controller,
                                  builder: (context, child) => InkWell(
                                    borderRadius: BorderRadius.circular(30),
                                    onTap: () async {
                                      print("Edit icon tapped");
                                      await _controller.forward();
                                      await _controller.reverse();
                                      // ScaffoldMessenger.of(context).showSnackBar(
                                      //   SnackBar(
                                      //     content: Text('Edit icon tapped'),
                                      //     duration: Duration(seconds: 1),
                                      //     backgroundColor: Colors.blue,
                                      //     behavior: SnackBarBehavior.floating,
                                      //   ),
                                      // );
                                      _requestPermissionAndPickImage1(ImageSource.gallery);
                                    },
                                    child: Padding(
                                      padding: const EdgeInsets.all(25.0),
                                      child: Transform.scale(
                                        scale: _scaleAnimation.value,
                                        child: Container(
                                          decoration: BoxDecoration(
                                            shape: BoxShape.circle,
                                            color: _colorAnimation.value,
                                            boxShadow: [
                                              BoxShadow(
                                                color: Colors.black.withOpacity(0.3),
                                                blurRadius: _shadowAnimation.value,
                                                offset: Offset(0, 3),
                                              ),
                                            ],
                                          ),
                                          padding: const EdgeInsets.all(8.0),
                                          child: Icon(Icons.edit, color: Colors.white, size: 25),
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      )
                    ],
                  ),
                ),
                //SizedBox(height: 40),
                // Edit Profile Photo Text
                Transform.translate(
                  offset: Offset(0, -50),
                  child: Center(
                    child: Text(
                      'Edit Profile',
                      style: TextStyle(color: Colors.white,fontSize:20,fontWeight:  FontWeight.bold),
                    ),
                  ),
                ),
                SizedBox(height: 20),
                //  Padding(
                //   padding: const EdgeInsets.symmetric(horizontal: 15.0),
                //   child: Text(
                //     'Update Details :', // Heading for the Username field
                //     style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
                //   ),
                // ),
                SizedBox(height: 20,),
                Transform.translate(
                  offset: Offset(0, -60),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 50.0),
                    child: Text(
                      'Username', // Heading for the Username field
                      style: TextStyle(color: Colors.white, fontSize: 20,fontFamily: 'Poppins', ),
                    ),
                  ),
                ),
                SizedBox(height: 10),
                // Username Text Field
                Transform.translate(
                  offset: Offset(0, -60),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 50.0),
                    child: TextField(
                      controller: _usernameController,
                      style: TextStyle(color: Colors.black,fontFamily: 'Poppins',decorationThickness: 0,fontSize: 20),
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: Color(0xCCFFFFFF),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                  ),
                ),
                SizedBox(height: 20),
                if (_hasStageName) ...[
                  Transform.translate(
                    offset: Offset(0, -60),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 50.0),
                      child: Text(
                        'Stage Name',
                        style: TextStyle(color: Colors.white, fontSize: 20,fontFamily: 'Poppins',),
                      ),
                    ),
                  ),
                  SizedBox(height: 10),
                  Transform.translate(
                    offset: Offset(0, -60),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 50.0),
                      child: GestureDetector(
                        onTap: () {
                          if (!_isStageNameEditable) {
                            _showStageNameEditDialog();
                          }
                        },
                        child: AbsorbPointer(
                          absorbing: !_isStageNameEditable, // Ensure non-editable initially
                          child: TextField(
                            controller: _stageNameController,
                            focusNode: _stageNameFocusNode,
                            style: TextStyle(color: Colors.black,fontFamily: 'Poppins',decorationThickness: 0,fontSize: 20),
                            decoration: InputDecoration(
                              filled: true,
                              fillColor: Color(0xCCFFFFFF),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  SizedBox(height: 20),
                ],
                if (widget.userCategory == "Singer") ...[
                  Transform.translate(
                    offset: Offset(0, -60),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 50.0),
                      child: Text(
                        'Bio',
                        style: TextStyle(color: Colors.white, fontSize: 20),
                      ),
                    ),
                  ),
                  SizedBox(height: 10),
                  Transform.translate(
                    offset: Offset(0, -60),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 50.0),
                      child: TextField(
                        controller: _bioController,
                        maxLines: 5,
                        minLines: 3,
                        inputFormatters: [LengthLimitingTextInputFormatter(301)],
                        style: TextStyle(color: Colors.black,decorationThickness: 0,fontSize: 20),
                        decoration: InputDecoration(
                          filled: true,
                          fillColor: Color(0xCCFFFFFF),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          errorText: _bioErrorText,
                        ),
                      ),
                    ),
                  ),
                ],

                SizedBox(height: 40),
                // Save Button
                Transform.translate(
                  offset: Offset(0, -60),
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(0, 0, 0, 30),
                    child: Center(
                      child: ValueListenableBuilder<bool>(
                        valueListenable: isLoading,
                        builder: (context, loading, child) {
                          return SizedBox(
                            width: 187,
                            height: 42,
                            child: ElevatedButton(
                              onPressed: // Disable button if:
                              // 1. Currently loading, or
                              // 2. No changes have been made, or
                              // 3. Bio exceeds character limit
                              (loading || !_hasChanges ||
                                  (_bioController.text.length > _charLimit))
                                  ? null
                                  : () {
                                if (_bioController.text.length <= _charLimit) {
                                  _saveProfileDetails();
                                } else {
                                  setState(() {
                                    _bioErrorText = 'Bio cannot exceed $_charLimit characters';
                                  });
                                }
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Color(0xFF2644D9),
                                padding: EdgeInsets.symmetric(horizontal: 40, vertical: 2),
                              ),
                              child: loading
                                  ? SizedBox(
                                height: 24,
                                width: 24,
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                  strokeWidth: 2,
                                ),
                              )
                                  : Text('Update', style: TextStyle(
                                  color: _hasChanges ? Colors.white : Colors.grey,
                                  fontSize: 20, fontWeight: FontWeight.bold)),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                ),
                // Other widgets and components
              ],
            ),
          ),
        ));
    return Stack(
        children:[
          PageWithBottomNav(
            child: content,
            email: widget.userId,
            fullName: widget.userfullname,
            category: widget.userCategory,
            currentIndex: 3,  // 1 is for Search page
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
}
