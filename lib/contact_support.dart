// contact_support.dart
import 'dart:io';
import 'dart:ui';

import 'package:amplify_flutter/amplify_flutter.dart';
import 'package:flutter/material.dart';
import 'package:voiceapp/main.dart';
import 'About_Us.dart';
import 'account_deletion.dart';
import 'bottomnavigationbar.dart';
import 'notifiers.dart';
import 'profile_manager.dart';
import 'package:url_launcher/url_launcher.dart';
//import 'package:voiceapp/nowplaying.dart';
import 'package:voiceapp/connectivity_service.dart';
import 'package:voiceapp/loading_screen.dart';

class SupportDetailsPage extends StatefulWidget {

  final String userId;
  final String userfullname;
  final String category;

  SupportDetailsPage({required this.userId,required this.userfullname,required this.category});

  @override
  _SupportDetailsPageState createState() => _SupportDetailsPageState();
}

class _SupportDetailsPageState extends State<SupportDetailsPage> {
  final _formKey = GlobalKey<FormState>(); // Create a form key
  final _oldPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _isOldPasswordVisible = false;
  bool _isNewPasswordVisible = false;
  bool _isConfirmPasswordVisible = false;

  String _email = 'Loading...'; // Placeholder for the user's email
  String _phoneNumber = 'Loading...';

  bool _isLoading = true;
  bool _isNoInternet = false;
  late ConnectivityService _connectivityService;
  bool _mounted = true;


  final _scaffoldMessengerKey = GlobalKey<ScaffoldMessengerState>();

  String? _validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Password is required';
    } else if (value.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    return null; // Return null if the password is valid
  }

  @override
  void initState() {
    super.initState();
    _mounted = true;
    _connectivityService = ConnectivityService();
    _setupConnectivityListener();
    //_fetchUserDetails(); // Fetch the current user's details
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
      // If you have any initial data fetching method, call it here
      // For example: await _fetchUserDetails();

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

  String _maskEmail(String email) {
    // Check if the email is empty or doesn't contain an '@' symbol
    if (email.isEmpty || !email.contains('@')) {
      return email; // Return the original email if invalid
    }

    // Split email into two parts (before and after the '@')
    List<String> parts = email.split('@');
    String username = parts[0];

    // Show first four characters followed by XXXX, then the rest
    if (username.length > 4) {
      String maskedPart = "XXXX" + username.substring(4);
      return maskedPart + '@' +
          parts[1]; // Join back the masked part with domain
    }

    return email; // Return unmasked if too short
  }


  String _maskPhoneNumber(String phoneNumber) {
    if (phoneNumber.length >= 10) {
      // Show first 2 digits, then XXX, then 2 digits, then XXX
      return phoneNumber.substring(0, 2) + 'XXX' +
          phoneNumber.substring(5, 7) + 'XXX';
    }
    return phoneNumber; // Return the original number if it's too short
  }

  Future<void> _fetchUserDetails() async {
    try {
      // Check if a user is signed in
      var session = await Amplify.Auth.fetchAuthSession();
      if (!session.isSignedIn) {
        // User is not signed in, set error messages or handle accordingly
        setState(() {
          _email = '';
          _phoneNumber = '';
        });
        return; // Exit if the user is not signed in
      }

      // Get the current authenticated user
      AuthUser user = await Amplify.Auth.getCurrentUser();

      // Fetch user attributes like email and phone number
      List<AuthUserAttribute> attributes = await Amplify.Auth
          .fetchUserAttributes();

      // Find the email and phone number from the attributes
      String email = attributes
          .firstWhere((attr) =>
      attr.userAttributeKey == CognitoUserAttributeKey.email)
          .value;
      //String phoneNumber = attributes.firstWhere((attr) => attr.userAttributeKey == CognitoUserAttributeKey.phoneNumber).value;

      setState(() {
        _email = email;
        //_phoneNumber = phoneNumber;
      });
    } catch (e) {
      print('Error fetching user details: $e');
      setState(() {
        _email = 'Error fetching email';
        _phoneNumber = 'Error fetching phone number';
      });
    }
  }


  // Show change password dialog
  Future<void> _showChangePasswordDialog(BuildContext context) async {
    bool isGoogleLogin = await loginMethodNotifier.isGoogleLogin();
    print("IS THIS THE $isGoogleLogin");
    if (isGoogleLogin) {
      // If logged in with Google, show a dialog explaining why password change is not possible
      showDialog(
        context: context,
        builder: (BuildContext context) {
          return AlertDialog(
            backgroundColor: Color(0xFF211F20),
            title: Text(
              'Password Change Unavailable',
              style: TextStyle(color: Colors.white),
            ),
            content: Text(
              'Since you signed in with Google, you cannot change your password through this app.',
              style: TextStyle(color: Colors.white),
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.of(context).pop();
                },
                child: Text(
                  'OK',
                  style: TextStyle(color: Colors.white),
                ),
              ),
            ],
          );
        },
      );
      return;
    }

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return ScaffoldMessenger(
          key: _scaffoldMessengerKey,
          child: Builder(
            builder: (context) => BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 2.0, sigmaY: 2.0),
              child: Container(
                color: Colors.white.withOpacity(0.02),
                child: WillPopScope(
                  onWillPop: () async {
                    // Clear text fields when back button is pressed
                    _oldPasswordController.clear();
                    _newPasswordController.clear();
                    _confirmPasswordController.clear();
                    return true; // Allow the dialog to be dismissed
                  },
                  child: Scaffold(
                    backgroundColor: Colors.transparent,
                    body: Dialog(
                      backgroundColor: Color(0xFF151415),
                      child: StatefulBuilder(
                        builder: (BuildContext context, StateSetter setState) {
                          return Container(
                            height: 450,
                            padding: EdgeInsets.all(16.0),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Close button
                                Align(
                                  alignment: Alignment.topRight,
                                  child: GestureDetector(
                                    onTap: () {
                                      // Clear text fields when dialog is closed
                                      _oldPasswordController.clear();
                                      _newPasswordController.clear();
                                      _confirmPasswordController.clear();
                                      Navigator.of(context).pop(); // Close the dialog
                                    },
                                    child: Container(
                                      width: 30,
                                      height: 30,
                                      decoration: BoxDecoration(
                                        color: Colors.transparent,
                                        shape: BoxShape.circle,
                                        border: Border.all(
                                          color: Colors.white,
                                          width: 3,
                                        ),
                                      ),
                                      child: Center(
                                        child: Icon(
                                          Icons.close,
                                          color: Colors.white,
                                          size: 22,
                                          weight: 900,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                                SizedBox(height: 15),
                                // Old Password Input
                                Padding(
                                  padding: const EdgeInsets.only(left: 12.0),
                                  child: Text(
                                    "Old Password",
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 18,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                                Padding(
                                  padding: const EdgeInsets.only(left: 12.0, right: 12),
                                  child: TextField(
                                    controller: _oldPasswordController,
                                    obscureText: !_isOldPasswordVisible,
                                    style: TextStyle(color: Colors.white),
                                    decoration: InputDecoration(
                                      floatingLabelBehavior: FloatingLabelBehavior.never,
                                      enabledBorder: UnderlineInputBorder(
                                        borderSide: BorderSide(color: Colors.white, width: 2),
                                      ),
                                      focusedBorder: UnderlineInputBorder(
                                        borderSide: BorderSide(color: Colors.white, width: 2.0),
                                      ),
                                      suffixIcon: IconButton(
                                        icon: Icon(
                                          _isOldPasswordVisible ? Icons.visibility : Icons.visibility_off,
                                          color: Colors.white,
                                        ),
                                        onPressed: () {
                                          setState(() {
                                            _isOldPasswordVisible = !_isOldPasswordVisible;
                                          });
                                        },
                                      ),
                                    ),
                                    cursorColor: Colors.white,
                                  ),
                                ),
                                SizedBox(height: 15),
                                // New Password Input
                                Padding(
                                  padding: const EdgeInsets.only(left: 12.0),
                                  child: Text(
                                    "New Password",
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 18,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                                Padding(
                                  padding: const EdgeInsets.only(left: 12.0, right: 12),
                                  child: TextField(
                                    controller: _newPasswordController,
                                    obscureText: !_isNewPasswordVisible,
                                    style: TextStyle(color: Colors.white),
                                    decoration: InputDecoration(
                                      floatingLabelBehavior: FloatingLabelBehavior.never,
                                      enabledBorder: UnderlineInputBorder(
                                        borderSide: BorderSide(color: Colors.white, width: 2),
                                      ),
                                      focusedBorder: UnderlineInputBorder(
                                        borderSide: BorderSide(color: Colors.white, width: 2.0),
                                      ),
                                      suffixIcon: IconButton(
                                        icon: Icon(
                                          _isNewPasswordVisible ? Icons.visibility : Icons.visibility_off,
                                          color: Colors.white,
                                        ),
                                        onPressed: () {
                                          setState(() {
                                            _isNewPasswordVisible = !_isNewPasswordVisible;
                                          });
                                        },
                                      ),
                                    ),
                                    cursorColor: Colors.white,
                                  ),
                                ),
                                SizedBox(height: 15),
                                // Confirm New Password Input
                                Padding(
                                  padding: const EdgeInsets.only(left: 12.0),
                                  child: Text(
                                    "Confirm New Password",
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 18,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                                Padding(
                                  padding: const EdgeInsets.only(left: 12.0, right: 12),
                                  child: TextField(
                                    controller: _confirmPasswordController,
                                    obscureText: !_isConfirmPasswordVisible,
                                    style: TextStyle(color: Colors.white),
                                    decoration: InputDecoration(
                                      floatingLabelBehavior: FloatingLabelBehavior.never,
                                      enabledBorder: UnderlineInputBorder(
                                        borderSide: BorderSide(color: Colors.white),
                                      ),
                                      focusedBorder: UnderlineInputBorder(
                                        borderSide: BorderSide(color: Colors.white, width: 2.0),
                                      ),
                                      suffixIcon: IconButton(
                                        icon: Icon(
                                          _isConfirmPasswordVisible ? Icons.visibility : Icons.visibility_off,
                                          color: Colors.white,
                                        ),
                                        onPressed: () {
                                          setState(() {
                                            _isConfirmPasswordVisible = !_isConfirmPasswordVisible;
                                          });
                                        },
                                      ),
                                    ),
                                    cursorColor: Colors.white,
                                  ),
                                ),
                                SizedBox(height: 25),
                                Center(
                                  child: SizedBox(
                                    width: 187,
                                    height: 42,
                                    child: ElevatedButton(
                                      onPressed: () async {
                                        await _changePassword(context);
                                      },
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: Color(0xFF2644D9),
                                        foregroundColor: Colors.white,
                                        padding: EdgeInsets.symmetric(horizontal: 50, vertical: 4),
                                      ),
                                      child: Text(
                                        'Update',
                                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20),
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                    resizeToAvoidBottomInset: true,
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Future<void> _deleteAccount(BuildContext context) async {
    void showSnackBarMessage(String message) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            message,
            style: TextStyle(color: Colors.black),
          ),
          backgroundColor: Colors.white,
          duration: Duration(seconds: 5),
          action: SnackBarAction(
            label: 'Dismiss',
            textColor: Colors.blue,
            onPressed: () {
              ScaffoldMessenger.of(context).hideCurrentSnackBar();
            },
          ),
        ),
      );
    }

    try {
      // Show confirmation dialog
      bool? confirm = await showDialog<bool>(
        context: context,
        builder: (BuildContext context) {
          return AlertDialog(
            title: Text('Confirm Account Deletion'),
            content: Text(
                'Are you sure you want to delete your account? This action is irreversible.'),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(false), // Cancel
                child: Text('Cancel'),
              ),
              TextButton(
                onPressed: () => Navigator.of(context).pop(true), // Confirm
                child: Text('Delete', style: TextStyle(color: Colors.red)),
              ),
            ],
          );
        },
      );

      if (confirm != true) {
        return; // Exit if user cancels
      }

      // Call the server API to delete the account
      // Example: Replace this with your actual API call
      await _callServerDeleteAccountAPI();

      // Delete user from Cognito
      await Amplify.Auth.deleteUser();
      showSnackBarMessage('Account deleted successfully.');

      // Navigate to the first page
      Navigator.of(context).pushNamedAndRemoveUntil('/', (route) => false);
    } catch (e) {
      showSnackBarMessage('Error deleting account: $e');
    }
  }

// Simulated API call to delete account from the server
  Future<void> _callServerDeleteAccountAPI() async {
    await Future.delayed(Duration(seconds: 2)); // Simulate a network call
    // Replace with actual API call logic
  }


  // Function to change password using AWS Cognito
  Future<void> _changePassword(BuildContext context) async {
    void showSnackBarMessage(String message) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            message,
            style: TextStyle(color: Colors.black),
          ),
          backgroundColor: Colors.white,
          duration: Duration(seconds: 5),
          behavior: SnackBarBehavior.fixed,
          // Change to fixed for bottom positioning
          // Remove margin to show at bottom
          action: SnackBarAction(
            label: 'Dismiss',
            textColor: Colors.blue,
            onPressed: () {
              ScaffoldMessenger.of(context).hideCurrentSnackBar();
            },
          ),
        ),
      );
    }
    String oldPassword = _oldPasswordController.text;
    String newPassword = _newPasswordController.text;
    String confirmPassword = _confirmPasswordController.text;

    // Validate that the new password and confirm password match

    if (oldPassword.isEmpty) {
      showSnackBarMessage('Please Enter Old Password');
      return;
    }

    if (oldPassword.length < 8) {
      showSnackBarMessage('Old password should be 8 characters long');
      return;
    }

    if (newPassword.length < 8) {
      showSnackBarMessage('New password must be at least 8 characters long');
      return;
    }


    if (newPassword != confirmPassword) {
      showSnackBarMessage('New passwords do not match');
      return;
    }


    try {
      // Call AWS Amplify Auth API to change the password
      await Amplify.Auth.updatePassword(
        oldPassword: oldPassword,
        newPassword: newPassword,
      );
      showSnackBarMessage('Password changed successfully');


      //Navigator.of(context).pop();


      _oldPasswordController.clear();
      _newPasswordController.clear();
      _confirmPasswordController.clear();

      await Future.delayed(const Duration(milliseconds: 3000));

      Navigator.of(context).pop(); // Close the modal on success
    } on AuthException catch (e) {
      // Check if the error message is related to the old password being incorrect
      if (e.message.contains('Incorrect username or password')) {
        showSnackBarMessage('Old password is incorrect');
      } else {
        // Handle other authentication errors
        showSnackBarMessage('Error changing password: ${e.message}');
      }
    } catch (e) {
      // Catch any other errors
      showSnackBarMessage('An unexpected error occurred: $e');
    }
  }


  @override
  Widget build(BuildContext context) {
    Widget content = GradientScaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        backgroundColor: Colors.transparent,
        titleSpacing: 0,
        leadingWidth: 10,
        title: Row(
          children: [
            IconButton(
              icon: Icon(Icons.arrow_back_ios, color: Colors.white),
              onPressed: () {
                Navigator.of(context).pop();
              },
            ),
          ],
        ),
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(height: 80),
              Padding(
                padding: const EdgeInsets.only(left: 0.0),
                child: Text(
                  'Email',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Poppins',
                  ),
                ),
              ),
              SizedBox(height: 10),
              Padding(
                padding: const EdgeInsets.only(left: 0.0),
                child: ValueListenableBuilder<String?>(
                  valueListenable: ProfileManager().email,
                  builder: (context, email, child) {
                    return Container(
                      decoration: BoxDecoration(
                        border: Border(
                          bottom: BorderSide(
                            color: Colors.transparent,
                            width: 1,
                          ),
                        ),
                      ),
                      child: Text(
                        _maskEmail(email ?? 'Loading...'),
                        style: TextStyle(
                          color: Colors.white,
                          fontFamily: 'Poppins',
                          fontSize: 20,
                        ),
                      ),
                    );
                  },
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(left: 0.1, right: 8),
                child: Divider(color: Colors.white, thickness: 1),
              ),
              SizedBox(height: 45),
              Text(
                'Phone Number',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: 10),
              Padding(
                padding: const EdgeInsets.only(left: 0.0),
                child: ValueListenableBuilder<String?>(
                  valueListenable: ProfileManager().phoneNumber,
                  builder: (context, phoneNumber, child) {
                    return Text(
                      _maskPhoneNumber(phoneNumber ?? 'Loading...'),
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                      ),
                    );
                  },
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(left: 0.0, right: 8),
                child: Divider(color: Colors.white),
              ),
              SizedBox(height: 40),
              GestureDetector(
                onTap: () {
                  _showChangePasswordDialog(context);
                },
                behavior: HitTestBehavior.opaque,
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 0),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          'Change Password',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              SizedBox(height: 40),
              GestureDetector(
                onTap: () => RatingService.rateApp(context),
                behavior: HitTestBehavior.opaque,
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          'Rate Us',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              if (widget.category == 'Listener') ...[
                SizedBox(height: 40),
                GestureDetector(
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (context) =>
                            AccountDeletionPage(
                              userId: widget.userId,
                              userfullname: widget.userfullname,
                              category: widget.category,
                            ),
                      ),
                    );
                  },
                  behavior: HitTestBehavior.opaque,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            'Delete Account',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
              SizedBox(height: 40),
              GestureDetector(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) =>
                          AboutUsScreen(
                            userId: widget.userId,
                            userfullname: widget.userfullname,
                            category: widget.category,
                          ),
                    ),
                  );
                },
                behavior: HitTestBehavior.opaque,
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          'About',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              SizedBox(height: 20), // Bottom padding for scrollable content
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
}

// Add this class at the top of your file after the imports
class RatingService {
  static const String androidPackageName = 'com.voizapp.voiceapp';

  static Future<void> rateApp(BuildContext context) async {
    if (Platform.isAndroid) {
      // Internal testing URL format
      final internalTestingUrl = Uri.parse('https://play.google.com/store/apps/details?id=com.voizapp.voiceapp');

      try {
        final bool launched = await launchUrl(
          internalTestingUrl,
          mode: LaunchMode.externalApplication,
        );

        if (!launched) {
          final marketUrl = Uri.parse('market://details?id=$androidPackageName');
          final webUrl = Uri.parse('https://play.google.com/store/apps/details?id=com.voizapp.voiceapp');

          try {
            await launchUrl(marketUrl, mode: LaunchMode.externalApplication);
          } catch (e) {
            await launchUrl(webUrl, mode: LaunchMode.externalApplication);
          }
        }
      } catch (e) {
        print('Error launching Play Store: $e');
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Unable to open Play Store'))
        );
      }
    }
  }
}
