// viewProfile.dart
import 'dart:async';
import 'dart:io';
import 'dart:ui';

import 'package:amplify_flutter/amplify_flutter.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:voiceapp/audio_service1.dart';
import 'package:voiceapp/contact_support.dart';
import 'package:voiceapp/contact_us.dart';
import 'package:voiceapp/edit_profile.dart';
import 'package:voiceapp/main.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:voiceapp/services/api_service.dart';
import 'package:voiceapp/nowplaying.dart';
import 'package:voiceapp/profile_manager.dart';
import 'bottomnavigationbar.dart';
import 'notifiers.dart';
import 'package:voiceapp/services/background_task_service.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:shared_preferences/shared_preferences.dart'; // Make sure to import your main.dart file
import 'package:voiceapp/connectivity_service.dart';
import 'package:voiceapp/loading_screen.dart';
import 'package:voiceapp/services/auth_service.dart';

class ProfileSettingsPage extends StatefulWidget {
  final String userId;
  final String userfullname;
  final String userCategory; // Accept the user's full name as a parameter

  ProfileSettingsPage({required this.userfullname,required this.userId,required this.userCategory});
  @override
  _ProfileSettingsPageState createState() => _ProfileSettingsPageState();
}

class _ProfileSettingsPageState extends State<ProfileSettingsPage> with SingleTickerProviderStateMixin {
  bool isAutoplayEnabled = true;  // Default state for Autoplay
  bool isNotificationsEnabled = true;

  File? _profileImage;
  final ImagePicker _picker = ImagePicker();
  String? _profileImageUrl;
  String? _coverImageUrl;

  int _followersCount = 0;
  int _followingCount = 0;
  bool _isSigningOut = false;
  StreamSubscription? _sub;

  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<Color?> _colorAnimation;
  late Animation<double> _shadowAnimation;
  bool _isLoading = true;
  bool _isNoInternet = false;
  late ConnectivityService _connectivityService;
  bool _mounted = true;
  final AuthService _authService = AuthService();



  @override
  void initState() {
    super.initState();

    _mounted = true;
    _connectivityService = ConnectivityService();
    _setupConnectivityListener();


    _loadNotificationSetting();
    _initializeAnimations();


    _fetchFollowers();
    _fetchFollowing(); // Fetch profile image from API when page loads
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
      await _fetchFollowers();
      await _fetchFollowing();

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

  void _initializeAnimations() {
    _controller = AnimationController(
      duration: const Duration(milliseconds: 150),
      vsync: this,
    );

    _scaleAnimation = Tween<double>(begin: 1.0, end: 1.1)
        .animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));

    _colorAnimation = ColorTween(begin: Colors.blue, end: Colors.lightBlueAccent)
        .animate(_controller);

    _shadowAnimation = Tween<double>(begin: 5.0, end: 10.0).animate(_controller);
  }

  @override
  void dispose() {
    _mounted = false;
    _connectivityService.dispose();
    _controller.dispose();
    super.dispose();
  }
// Add this method to launch URL
  Future<void> _launchURL(String url) async {
    if (await canLaunch(url)) {
      await launch(url);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not launch $url')),
      );
    }
  }

  Future<void> _loadNotificationSetting() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    setState(() {
      isNotificationsEnabled = prefs.getBool('isNotificationsEnabled') ?? true;
    });
  }

  Future<void> _toggleNotifications(bool value) async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    setState(() {
      isNotificationsEnabled = value;
    });
    await prefs.setBool('isNotificationsEnabled', value);

    if (!isNotificationsEnabled) {
      await flutterLocalNotificationsPlugin.cancelAll(); // Disable all notifications
      print("Notifications are disabled.");
    } else {
      print("Notifications are enabled.");
    }
  }



  void _sendTestNotification() async {
    const AndroidNotificationDetails androidPlatformChannelSpecifics = AndroidNotificationDetails(
      '1234567890', // Set a unique channel ID
      'Test Channel', // Channel name
      channelDescription: 'Channel for testing notifications', // Channel description
      importance: Importance.max,
      priority: Priority.high,
      showWhen: true,
    );

    const NotificationDetails platformChannelSpecifics = NotificationDetails(android: androidPlatformChannelSpecifics);

    await flutterLocalNotificationsPlugin.show(
      0, // Notification ID
      'Test Notification', // Notification title
      'This is a test notification to check functionality.', // Notification body
      platformChannelSpecifics,
      payload: 'Test Payload',
    );
  }


  Future<void> _fetchFollowers() async {
    try {
      final response = await ApiService.getFollowersCount(ProfileManager().getUserId() ?? '');

      if (response.statusCode == 200) {
        final followersData = json.decode(response.body);

        setState(() {
          _followersCount = followersData['count'] ?? 0;

        });
      } else {
        print('Failed to fetch followers and following data. Status code: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching followers and following data: $e');
    }
  }

  Future<void> _fetchFollowing() async {
    try {
      final response = await ApiService.getFollowingCount(ProfileManager().getUserId() ?? '');

      if (response.statusCode == 200) {
        final followersData = json.decode(response.body);

        setState(() {
          _followingCount = followersData['count'] ?? 0;

        });
      } else {
        print('Failed to fetch followers and following data. Status code: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching followers and following data: $e');
    }
  }







  String getInitials(String? fullName) {
    if (fullName == null || fullName.trim().isEmpty) {
      return ""; // Return empty string if fullName is null or empty
    }

    List<String> nameParts = fullName.trim().split(RegExp(r'\s+'));

    if (nameParts.length == 1) {
      return nameParts[0][0].toUpperCase();
    } else if (nameParts.length > 1) {
      return nameParts[0][0].toUpperCase() + nameParts[1][0].toUpperCase();
    } else {
      return "";
    }
  }

  Future<void> _fetchCoverImage() async {
    try {
      // Make the GET request to fetch the cover image URL
      final response = await ApiService.getUserCoverImage(ProfileManager().getUserId() ?? '');

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
      // Make the GET request to fetch the profile image URL
      final response = await ApiService.getUserProfilePhoto(ProfileManager().getUserId() ?? '');

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



  // Pick image from gallery or camera


  // Upload the selected image to the server (encoded as Base64)



  // Default state for Notifications

  // Define the _logout method that takes context as a parameter
  // Modified _logout method with mounted check
// Refactored _logout function
// _logout function now only handles the logout logic without any navigation or UI interaction
  // Sign out method only handles the logout logic without UI interaction
  Future<void> _logout({bool preserveSession = false}) async {
    try {
      print('🔐 Starting logout process (preserveSession: $preserveSession)');
      
      // First properly dispose the audio player and its resources
      try {
        await AudioService().fullCleanup();
        print('Audio service cleaned up');
      } catch (e) {
        print('Error cleaning up audio service: $e');
      }
      
      // Cancel any active subscriptions
      _sub?.cancel();

      // Reset now playing visibility and other notifiers
      isNowPlayingTileVisible.value = false;
      shuffleNotifier.value = false;
      autoplayNotifier.value = false;

      // Get preferences
      final prefs = await SharedPreferences.getInstance();

      // Save autoplay state as false
      await prefs.setBool('autoplayEnabled', false);
      print('Autoplay disabled and saved');

      // Start UI cleanup immediately
      ProfileManager().clear();
      ProfileManager.resetInstance();
      ProfileManager().clearCurrentlyPlayingSong();
      print('Profile manager reset');

      // 🔧 FIX: Only register background task if not preserving session
      if (!preserveSession) {
        await BackgroundTaskService().registerLogoutTask();
        print('Background logout task registered');
      } else {
        print('🚫 Skipping background logout task - preserving session');
      }
      
      // Continue with immediate logout operations
      try {
        if (preserveSession) {
          // 🔧 FIX: Selective clearing - preserve authentication data
          print('🔐 Preserving session data during logout');
          
          // Clear only non-essential data
          final keysToPreserve = [
            'user_id', 'user_email', 'user_category', 'user_full_name',
            'login_method', 'session_timestamp', 'session_valid',
            'last_app_version', 'last_build_number'
          ];
          
          final allKeys = prefs.getKeys().toList();
          for (final key in allKeys) {
            bool shouldPreserve = false;
            for (final preserveKey in keysToPreserve) {
              if (key.contains(preserveKey)) {
                shouldPreserve = true;
                break;
              }
            }
            if (!shouldPreserve) {
              await prefs.remove(key);
            }
          }
          print('✅ Selective data clearing completed');
        } else {
          // Full logout - clear everything
          await prefs.clear();
          print('SharedPreferences cleared completely');
        }

        // Add a delay to ensure resources are released
        await Future.delayed(Duration(milliseconds: 500));

        // 🔧 FIX: Use AuthService.signOut() for proper session clearing
        if (!preserveSession) {
          await _authService.signOut();
          print('Signed out using AuthService (clears both secure storage and Amplify)');
        } else {
          print('🚫 Preserving Amplify Auth session');
        }

        await loginMethodNotifier.clearLoginMethod();
        print('Login method cleared');

        print('Logout completed successfully');
      } catch (e) {
        print('Error during immediate logout operations: $e');
        if (!preserveSession) {
          print('Continuing with background task to ensure completion');
        }
      }
    } catch (e) {
      print('Error during logout: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to logout: $e')),
        );
      }
    }
  }
  // Display the sign-out confirmation dialog with a loader
  void _showSignOutConfirmationDialog(BuildContext context) {
    showDialog(
      context: context,
      barrierDismissible: true, // Allow tapping outside to dismiss
      barrierColor: Colors.transparent,
      builder: (BuildContext dialogContext) {
        return GestureDetector(
          onTap: () => Navigator.of(dialogContext).pop(), // Dismiss on background tap
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
            child: Container(
              color: Colors.black.withOpacity(0.5),
              child: GestureDetector(
                onTap: () {}, // Prevent taps from propagating through the dialog
                child: StatefulBuilder(
                  builder: (context, setDialogState) => Dialog(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20.0),
                    ),
                    child: Container(
                      padding: EdgeInsets.symmetric(vertical: 20, horizontal: 16),
                      decoration: BoxDecoration(
                        color: Color(0xFF151415),
                        borderRadius: BorderRadius.circular(20.0),
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Center(
                            child: Text(
                              textAlign: TextAlign.center,
                              'Sign out of your account?',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          SizedBox(height: 20),
                          if (_isSigningOut) ...[
                            CircularProgressIndicator(color: Colors.blue),
                            SizedBox(height: 20),
                            Text(
                              'Signing out... Please wait',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                              ),
                            ),
                          ],
                          if (!_isSigningOut) ...[
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                              children: [
                                TextButton(
                                  onPressed: () => Navigator.of(dialogContext).pop(),
                                  child: Text(
                                    'Cancel',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 16,
                                    ),
                                  ),
                                ),
                                TextButton(
                                  onPressed: () async {
                                    setDialogState(() {
                                      _isSigningOut = true;
                                    });
                                    await _logout();
                                    setDialogState(() {
                                      _isSigningOut = false;
                                    });
                                    Navigator.of(dialogContext).pop();
                                    _navigateToLoginPage();
                                  },
                                  child: Text(
                                    'Sign out',
                                    style: TextStyle(
                                      color: Colors.red,
                                      fontSize: 16,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  // Separate navigation function for login page
  void _navigateToLoginPage() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (context) => FirstPage()),
              (Route<dynamic> route) => false,
        );
      }
    });
  }

  Future<void> _updateAutoplayStatus(bool isAutoplayEnabled) async {
    final String timestamp = DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());
    try {
      final response = await ApiService.updateAutoplayStatus(
        userId: ProfileManager().getUserId() ?? '',
        isAutoplayEnabled: isAutoplayEnabled.toString(),
        updatedTimestamp: timestamp,
      );

      if (response.statusCode == 200) {
        print('Autoplay status updated successfully.');
      } else {
        print('Failed to update autoplay status. Status code: ${response.statusCode}');
      }
    } catch (e) {
      print('Error updating autoplay status: $e');
    }
  }


  @override
  Widget build(BuildContext context) {
    Widget content = GradientScaffold(
      //backgroundColor: Colors.blueGrey[900], // Dark background color
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Stack to overlay AppBar items on top of the cover image
            Container(
              height: 350, // Adjust height for the cover image
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
                      child: ClipRRect(
                        borderRadius: BorderRadius.only(
                          bottomLeft: Radius.circular(0),
                          bottomRight: Radius.circular(0),
                        ),
                        child: ProfileManager().coverImageUrl != null
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
                  ),
                  // Back button
                  Positioned(
                    top: 50,
                    left: 16,
                    child: GestureDetector(
                      onTap: () {
                        Navigator.pop(context);
                      },
                      child: Icon(Icons.arrow_back_ios, color: Colors.white),
                    ),
                  ),

                  // Positioned(
                  //   top: 40,
                  //   left: 16,
                  //   child: Image.asset(
                  //     'assets/logo.png', // Your logo image asset
                  //     height: 50, // Adjust the height of the logo
                  //   ),
                  // ),
                  // Circular profile image overlayed on top of the cover image
                  Positioned(
                    bottom: 60,
                    child: Container(
                      child: Material(
                        color: Colors.transparent,
                        child: Stack(
                          clipBehavior: Clip.none,
                          alignment: Alignment.center,
                          children: [
                            // Main profile circle with animation builder
                            Padding(
                              padding: const EdgeInsets.all(8.0),
                              child: AnimatedBuilder(
                                animation: _controller,
                                builder: (context, child) => GestureDetector(
                                  onTap: () async {
                                    print("Main circle tapped"); // Debug print
                                    await _controller.forward();
                                    await _controller.reverse();
                                    // ScaffoldMessenger.of(context).showSnackBar(
                                    //   SnackBar(
                                    //     content: Text('Profile circle tapped'),
                                    //     duration: Duration(seconds: 1),
                                    //     backgroundColor: Colors.blue,
                                    //     behavior: SnackBarBehavior.floating,
                                    //   ),
                                    // );
                                    final result = await Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (context) => EditProfilePage(
                                          userId: widget.userId,
                                          userfullname: widget.userfullname,
                                          userCategory: widget.userCategory,
                                        ),
                                      ),
                                    );

                                    if (result == true) {
                                      setState(() {});
                                    }
                                  },
                                  behavior: HitTestBehavior.translucent,
                                  child: Transform.scale(
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
                                            color: Colors.black.withOpacity(0.2),
                                            blurRadius: _shadowAnimation.value,
                                            offset: Offset(0, 3),
                                          ),
                                        ],
                                      ),
                                      child: CircleAvatar(
                                        radius: 50,
                                        backgroundColor: Colors.grey,
                                        child: ProfileManager().profileImageUrl != null
                                            ? ClipOval(
                                          child: Image.network(
                                            ProfileManager().profileImageUrl!,
                                            fit: BoxFit.cover,
                                            width: 100,
                                            height: 100,
                                            errorBuilder: (context, error, stackTrace) {
                                              return Text(
                                                getInitials(ProfileManager().username.value),
                                                style: TextStyle(
                                                  color: Colors.white,
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 40,
                                                ),
                                              );
                                            },
                                          ),
                                        )
                                            : Text(
                                          getInitials(ProfileManager().username.value),
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
                              ),
                            ),
                            // Edit Icon - preserving original functionality
                            Positioned(
                              bottom: -25,
                              right: -25,
                              child: Material(
                                color: Colors.transparent,
                                child: AnimatedBuilder(
                                  animation: _controller,
                                  builder: (context, child) => InkWell(
                                    borderRadius: BorderRadius.circular(40),
                                    onTap: () async {
                                      print("Edit icon tapped"); // Debug print
                                      await _controller.forward();
                                      await _controller.reverse();
                                      // ScaffoldMessenger.of(context).showSnackBar(
                                      //   // SnackBar(
                                      //   //   content: Text('Edit icon tapped'),
                                      //   //   duration: Duration(seconds: 1),
                                      //   //   backgroundColor: Colors.blue,
                                      //   //   behavior: SnackBarBehavior.floating,
                                      //   // ),
                                      // );
                                      final result = await Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (context) => EditProfilePage(
                                            userId: widget.userId,
                                            userfullname: widget.userfullname,
                                            userCategory: widget.userCategory,
                                          ),
                                        ),
                                      );

                                      if (result == true) {
                                        setState(() {});
                                      }
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.all(35.0),
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
                      ),
                    ),
                  )
                ],
              ),
            ),
            SizedBox(height: 2), // Space after the profile image
            Transform.translate(
              offset: Offset(0, -40),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Text(
                        ProfileManager().username.value??'User',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
                    SizedBox(height: 10),
                    // Center(
                    //   child: Text(
                    //     '${_followersCount} Followers • ${_followingCount} Following',
                    //     style: TextStyle(
                    //       color: Colors.grey,
                    //       fontSize: 16,
                    //     ),
                    //   ),
                    // ),
                    SizedBox(height: 20),
                    _buildProfileOption('Account Settings',onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => SupportDetailsPage(userId: widget.userId, userfullname: widget.userfullname,category:widget.userCategory)),
                      );
                    }),
                    SizedBox(height: 10),
                    Padding(
                      padding: const EdgeInsets.only(left: 16.0,right: 8),
                      child: Divider(color: Colors.white),
                    ),
                    //SizedBox(height: 10),
                    _buildToggleOption(
                      //'Autoplay Related Tracks',
                      'Autoplay',
                      autoplayNotifier.value,  // Use the current value of the ValueNotifier
                          (value) async {
                        setState(() {
                          autoplayNotifier.value = value;  // Update the ValueNotifier
                        });
                        await _updateAutoplayStatus(autoplayNotifier.value);
                        await autoplayNotifier.saveAutoplayState();  // Save to SharedPreferences
                      },
                    ),
                    SizedBox(height: 5),
                    Padding(
                      padding: const EdgeInsets.only(left: 16.0,right: 8),
                      child: Divider(color: Colors.white),
                    ),
                    SizedBox(height: 5),
                    _buildToggleOption(
                      'Notifications',
                      isNotificationsEnabled,
                          (value) => _toggleNotifications(value),
                    ),
                    SizedBox(height: 5,),
              
                    //  ElevatedButton(
                    //   onPressed: _sendTestNotification,
                    //   child: Text('Send Test Notification' ,style: TextStyle(color: Colors.white),),
                    // ),
                    //SizedBox(height: 10),
                    Padding(
                      padding: const EdgeInsets.only(left: 16.0,right: 8),
                      child: Divider(color: Colors.white),
                    ),
                    SizedBox(height: 10),
                    _buildProfileOption('Contact Support', onTap: () {Navigator.push(context, MaterialPageRoute(builder: (context)=>SupportPage(category: widget.userCategory, userId: widget.userId, userfullname: widget.userfullname,)));}),
                    SizedBox(height: 15),
                    Padding(
                      padding: const EdgeInsets.only(left: 16.0,right: 8),
                      child: Divider(color: Colors.white),
                    ),
                    SizedBox(height: 10),
                    _buildProfileOption(
                        'Terms & Condition',
                        onTap: () => _launchURL('https://voiz.co.in/terms-of-use/')
                    ),
                    SizedBox(height: 40),
                    // Sign Out section wrapped with InkWell
                    GestureDetector(
                      onTap: () {
                        _showSignOutConfirmationDialog(context);
                      },
                      behavior: HitTestBehavior.opaque,
                      child: Center(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 12.0),
                          child: Text(
                            'Sign Out',
                            style: TextStyle(
                              color: Color(0xFFDE4D54),
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ),
              
                  ],
                ),
              ),
            ),

            //NowPlayingTile(email: widget.userId, userFullName: widget.userfullname)
          ],


        ),
      ),
    );
    return Stack(
        children:[ PageWithBottomNav(
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


  // Helper method to build profile option with icon
  Widget _buildProfileOption(String title, {required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
        child: Row(
          children: [
            Text(
              title,
              style: TextStyle(fontSize: 18, color: Colors.white),
            ),
            Spacer(),
            Icon(Icons.arrow_forward_ios, color: Colors.white, size: 24,weight: 900,),
          ],
        ),
      ),
    );
  }

  // Helper method to build toggle option (switch)
  Widget _buildToggleOption(String title, bool value, ValueChanged<bool> onChanged) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: TextStyle(fontSize: 18, color: Colors.white),
          ),
          Stack(
            alignment: Alignment.center,
            children: [
              Switch(
                value: value,
                onChanged: onChanged,
                activeColor: Colors.white,
                activeTrackColor: Color(0xFF65C466),
                inactiveTrackColor: Colors.transparent,
                inactiveThumbColor: Colors.white,
              ),
              if (value) // Only show the separator when the switch is active
                Positioned(
                  left: 15, // Fixed position for the active state
                  child: Text(
                    '|',
                    style: TextStyle(
                        color: Colors.transparent,
                        fontSize: 13,
                        fontWeight: FontWeight.w500
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
