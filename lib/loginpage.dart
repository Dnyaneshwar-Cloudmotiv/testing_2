// loginpage.dart
import 'package:amplify_auth_cognito/amplify_auth_cognito.dart';
import 'package:email_validator/email_validator.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:amplify_flutter/amplify_flutter.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:intl/intl.dart';
import 'package:voiceapp/MergeAccountConfirmPage.dart';
import 'package:voiceapp/NewHomepage.dart';
import 'package:voiceapp/ResetPassword/sendresetcode.dart';
import 'package:voiceapp/ResetPasswordPage.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:voiceapp/additionalinfo.dart';
import 'package:voiceapp/notifiers.dart';
import 'package:voiceapp/profile_manager.dart';
import 'package:voiceapp/services/auth_service.dart';
import 'package:voiceapp/services/api_service.dart';

import 'audio_service1.dart';
import 'main.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:voiceapp/connectivity_service.dart';
import 'package:voiceapp/loading_screen.dart';
final GoogleSignIn _googleSignIn = GoogleSignIn(scopes: ['email']);

class LoginPage extends StatefulWidget {
  @override
  _LoginPageState createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _emailFocusNode = FocusNode();
  final _passwordFocusNode = FocusNode();
  bool _isPasswordVisible = false;
  bool _isLoading = false;
  String? _userId;
  String? _usercategory;
  late String  _userfullname = ''; // Add this variable
  FirebaseMessaging messaging = FirebaseMessaging.instance;
  late DateTime _startTime;
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

  }
  void _setupConnectivityListener() {
    _connectivityService.connectionStream.listen((hasConnection) {
      if (!_mounted || _connectivityService.isClosed) return;

      setState(() {
        _isNoInternet = !hasConnection;
      });

      // If connection is restored, initialize data
      if (hasConnection && _isNoInternet) {
        // Nothing specific to initialize for login page
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
    // Dispose of focus nodes
    _emailFocusNode.dispose();
    _passwordFocusNode.dispose();
    super.dispose();
  }

  final RegExp customEmailRegex = RegExp(
      r'^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|hotmail\.com|msn\.com|iol\.co\.in|iol\.com|outlook\.com|protonmail\.com|icloud\.com|cloudmotivglobal\.com|mmcoe\.edu\.in|voiz\.info\.in)$'
  );

  Future<void> _launchURL(String url) async {
    if (await canLaunch(url)) {
      await launch(url);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not launch $url')),
      );
    }
  }

  void _showTermsModal() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Color(0xFF121212),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (BuildContext context) {
        return Container(
          padding: EdgeInsets.symmetric(vertical: 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Text(
                  'Legal Documents',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
              ListTile(
                leading: Icon(Icons.description, color: Colors.white),
                title: Text(
                  'Terms of Service',
                  style: TextStyle(color: Colors.white),
                ),
                onTap: () {
                  Navigator.pop(context);
                  _launchURL('https://voiz.co.in/terms-of-use/');
                },
              ),
              ListTile(
                leading: Icon(Icons.privacy_tip, color: Colors.white),
                title: Text(
                  'Privacy Policy',
                  style: TextStyle(color: Colors.white),
                ),
                onTap: () {
                  Navigator.pop(context);
                  _launchURL('https://voiz.co.in/privacy-policy/');
                },
              ),
              Padding(
                padding: EdgeInsets.only(top: 16),
                child: TextButton(
                  onPressed: () {
                    Navigator.pop(context);
                  },
                  child: Text(
                    'Close',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }


  Future<void> signInUser({
    required String email,
    required String password,
  }) async {
    if (_isLoading) return; // Prevent multiple sign-in attempts
    
    setState(() {
      _isLoading = true; // Start loading
      _startTime = DateTime.now();
    });

    try {
      final result = await Amplify.Auth.signIn(
        username: email,
        password: password,
      );

      if (result.isSignedIn) {
        // Fetch the user ID after successful login

        await loginMethodNotifier.saveLoginMethod(
            LoginMethodNotifier.LOGIN_METHOD_EMAIL
        );

        // Set autoplay to true and save the state
        autoplayNotifier.value = true;
        await autoplayNotifier.saveAutoplayState();

        await fetchUserId(email);
      } else {
        print('Sign in failed');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Sign in failed. Please try again.')),
        );
      }
    } on UserNotFoundException {
      // User not found, show user-friendly message
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Account doesn\'t exist. Please create a new one.')),
      );
    } on AuthException catch (e) {
      print('Error signing in user: ${e.message}');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${e.message}')),
      );
    } finally {
      setState(() {
        _isLoading = false; // Stop loading
      });
    }
  }

  Future<void> fetchUserId(String email) async {
    try {
      final response = await ApiService.getUserByEmail(email);

      if (ApiService.isSuccessResponse(response)) {
        final List<dynamic> responseBody = jsonDecode(response.body);

        if (responseBody.isNotEmpty) {
          final userData = responseBody[0];

          _userId = userData['user_id']?['S'];
          _usercategory = userData['Category']?['S'];
          _userfullname = userData['FullName']?['S'] ?? 'User';

          print('User ID: $_userId');

          // Update lastLogin value to "Android"
          if (_userId != null) {
            try {
              final updateLoginResponse = await ApiService.updateLastLogin({
                'user_id': _userId,
                'lastLogin': 'Android'
              });

              if (ApiService.isSuccessResponse(updateLoginResponse)) {
                print('Last login platform updated to Android successfully');
              } else {
                print('Failed to update last login platform: ${updateLoginResponse.statusCode}');
              }
            } catch (loginError) {
              // Don't stop the login flow if this fails, just log the error
              print('Error updating last login platform: $loginError');
            }
          }

          // Check mandate details before proceeding
          await checkMandateDetails(_userId!);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('User data not found.')),
          );
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to fetch User ID. Status code: ${response.statusCode}')),
        );
      }
    } catch (error) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error fetching User ID: $error')),
      );
      print('Error fetching User ID: $error');
    }
  }

  Future<void> checkMandateDetails(String userId) async {
    try {
      final mandateResponse = await ApiService.getMandateDetails(userId);

      if (ApiService.isSuccessResponse(mandateResponse)) {
        final mandateData = jsonDecode(mandateResponse.body);

        if (mandateData['FillMandateDetails'] == false) {
          // Redirect to AddinfoPage if mandate details are not filled
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (context) => AddinfoPage(
                email: _emailController.text.trim(),
                userId: userId,
              ),
            ),
          );
        } else {
          // Save session data securely
          await _authService.saveSession(
            userId: userId,
            userEmail: _emailController.text.trim(),
            userCategory: _usercategory!,
            userFullName: _userfullname,
            loginMethod: 'email',
          );

          // Proceed with normal login flow
          await AudioService().reinitialize();
          Navigator.of(context).pushAndRemoveUntil(
            MaterialPageRoute(
              builder: (context) => NewHomePage(
                email: userId,
                category: _usercategory ?? 'Listener',
                userfullname: _userfullname,
              ),
            ),
            (Route<dynamic> route) => false, // This removes all previous routes
          );

          final elapsedTime = DateTime.now().difference(_startTime);
          print("Login completed in ${elapsedTime.inSeconds} seconds");

          callPostApi(userId, _userfullname);
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to fetch mandate details. Status code: ${mandateResponse.statusCode}')),
        );
      }
    } catch (error) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error checking mandate details: $error')),
      );
      print('Error checking mandate details: $error');
    }
  }
  Future<String> _fetchGooglePassword(String email) async {
    try {
      final response = await ApiService.createGooglePassword({'email': email});

      if (ApiService.isSuccessResponse(response)) {
        final data = jsonDecode(response.body);
        if (data['success'] == true && data['password'] != null) {
          return data['password'];
        } else {
          throw Exception('API response missing password or success flag');
        }
      } else {
        throw Exception('Failed to fetch password: ${response.statusCode}');
      }
    } catch (e) {
      print('Error fetching password from API: $e');
      throw Exception('Unable to generate password. Please try again.');
    }
  }

  Future<void> _signInWithGoogle() async {
    try {
      setState(() {
        _isLoading = true;
        _startTime = DateTime.now();
      });

      // Make sure we're signed out of Google before attempting to sign in again
      await _googleSignIn.signOut();

      // Also make sure we're signed out of Amplify to avoid "User already signed in" error
      try {
        await Amplify.Auth.signOut();
        print("Signed out from Amplify before Google login");
      } catch (e) {
        // Ignore error if no user is signed in
        print("No user to sign out or error signing out: $e");
      }

      // Google Sign-In
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();

      if (googleUser == null) {
        print('Google sign-in canceled');
        setState(() {
          _isLoading = false;
        });
        return;
      }

      final email = googleUser.email;
      print('Google sign-in successful for email: $email');

      // First, check if this email exists in your database
      final userExists = await _checkUserExistsInDatabase(email);
      print('User exists in database: $userExists');

      if (userExists) {
        // User exists, try to sign in with Google password
        try {
          final String googlePassword = await _fetchGooglePassword(email);
          final result = await Amplify.Auth.signIn(
            username: email,
            password: googlePassword,
          );

          if (result.isSignedIn) {
            // Save login method for Google login
            await loginMethodNotifier.saveLoginMethod(
                LoginMethodNotifier.LOGIN_METHOD_GOOGLE
            );
            // Set autoplay to true and save the state
            autoplayNotifier.value = true;
            await autoplayNotifier.saveAutoplayState();

            print('Amplify sign-in successful with Google credentials');

            // Get the user details
            final userDetails = await _fetchUserIdAndCategory(email);

            if (userDetails != null) {
              setState(() {
                _userId = userDetails['userId'];
                _usercategory = userDetails['userCategory'];
                _userfullname = userDetails['userfullname'] ?? '';
              });

              print('Retrieved user details: userId=$_userId, category=$_usercategory');

              // Check mandate details before proceeding
              await googleSignInCheckMandateDetails(_userId!, email);
            } else {
              print('Failed to retrieve user details from API');
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Failed to fetch user details')),
              );

              // Sign out if we couldn't get user details
              await Amplify.Auth.signOut();
              print('Signing out due to missing user details');

              setState(() {
                _isLoading = false;
              });
            }
          }
        } on UserNotConfirmedException {
          print('User not confirmed');
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Please confirm your account first')),
          );
          setState(() {
            _isLoading = false;
          });
        } on NotAuthorizedServiceException {
          // User exists but not with Google password
          print('User exists but not with Google credentials');
          setState(() {
            _isLoading = false;
          });
          _showMergeAccountDialog(email);
          return;
        } on AuthException catch (e) {
          print('Authentication error: ${e.message}');
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Login failed: ${e.message}')),
          );
          setState(() {
            _isLoading = false;
          });
        }
      } else {
        // No account with this email, show error
        print('No account found with Google email');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('No account found with this Google email')),
        );
        setState(() {
          _isLoading = false;
        });
      }
    } catch (e) {
      print('Error signing in with Google: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Login failed: ${e.toString()}')),
      );
      setState(() {
        _isLoading = false;
      });
    }
  }
  // Add this new function in loginpage.dart
  Future<void> googleSignInCheckMandateDetails(String userId, String email) async {
    print('Checking mandate details for Google login user: $userId');

    try {
      final mandateResponse = await ApiService.getMandateDetails(userId);

      if (ApiService.isSuccessResponse(mandateResponse)) {
        final mandateData = jsonDecode(mandateResponse.body);
        print('Mandate data for Google user: $mandateData');

        // Check if user has a category - this is specific to Google login flow
        if (_usercategory == null || _usercategory!.isEmpty || mandateData['FillMandateDetails'] == false) {
          // Redirect to AddinfoPage if category is missing or mandate details are not filled
          print('Google user needs to fill additional information');
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (context) => AddinfoPage(
                email: email,
                userId: userId,
              ),
            ),
          );
        } else {
          // Save session data securely for Google login
          await _authService.saveSession(
            userId: userId,
            userEmail: email,
            userCategory: _usercategory!,
            userFullName: _userfullname,
            loginMethod: 'google',
          );

          // Proceed with normal login flow if all details are present
          print('Google user has complete profile, proceeding to home page');
          await AudioService().reinitialize();
          Navigator.of(context).pushAndRemoveUntil(
            MaterialPageRoute(
              builder: (context) => NewHomePage(
                email: userId,
                category: _usercategory ?? 'Listener',
                userfullname: _userfullname,
              ),
            ),
            (Route<dynamic> route) => false, // This removes all previous routes
          );

          final elapsedTime = DateTime.now().difference(_startTime);
          print("Google login completed in ${elapsedTime.inSeconds} seconds");

          callPostApi(userId, _userfullname);
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to fetch mandate details. Status code: ${mandateResponse.statusCode}')),
        );
        setState(() {
          _isLoading = false;
        });
      }
    } catch (error) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error checking mandate details: $error')),
      );
      print('Error checking mandate details: $error');
      setState(() {
        _isLoading = false;
      });
    }
  }

  // Function to check if user exists in database
  Future<bool> _checkUserExistsInDatabase(String email) async {
    try {
      final response = await ApiService.getUserByEmail(email);

      if (ApiService.isSuccessResponse(response)) {
        final List<dynamic> responseBody = jsonDecode(response.body);
        return responseBody.isNotEmpty; // Return true if user exists
      } else {
        print('Failed to check user: ${response.statusCode}');
        return false;
      }
    } catch (error) {
      print('Error checking if user exists: $error');
      return false;
    }
  }

  // Show dialog for merging accounts
  void _showMergeAccountDialog(String email) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor: Color(0xFF211F20),
          title: Text(
            'Link with Google',
            style: TextStyle(color: Colors.white),
          ),
          content: Text(
            'An account with this email already exists. Would you like to link it with Google for easier sign-in?',
            style: TextStyle(color: Colors.white),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: Text(
                'Cancel',
                style: TextStyle(color: Colors.grey),
              ),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                _initiateAccountMerge(email);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Color(0xFF2644D9),
              ),
              child: Text(
                'Link Account',
                style: TextStyle(color: Colors.white),
              ),
            ),
          ],
        );
      },
    );
  }

  void _initiateAccountMerge(String email) {
    setState(() {
      _isLoading = true;
    });

    try {
      Amplify.Auth.resetPassword(username: email).then((_) {
        setState(() {
          _isLoading = false;
        });
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => MergeAccountConfirmPage(
              email: email,
              onMergeComplete: () {
                // Callback when merge is complete to handle navigation
                _signInWithGoogle();
              },
            ),
          ),
        );
      }).catchError((e) {
        setState(() {
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.message}')),
        );
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }
// Helper method to generate a consistent password
  String _generateSecurePasswordForGoogle(String email) {
    return 'Google_${email.hashCode.toString()}!123';
  }
  Future<Map<String, String>?> _fetchUserIdAndCategory(String email) async {
    print('Fetching user details for email: $email');

    try {
      final response = await ApiService.getUserByEmail(email);
      print('API response status: ${response.statusCode}');

      if (ApiService.isSuccessResponse(response)) {
        final List<dynamic> data = json.decode(response.body);
        print('API response data: ${response.body}');

        if (data.isNotEmpty) {
          final userData = data[0];

          final userId = userData['user_id']?['S'] ?? '';
          final userCategory = userData['Category']?['S'] ?? '';
          final userfullname = userData['FullName']?['S'] ?? '';

          print('Parsed data - userId: $userId, category: $userCategory, name: $userfullname');

          if (userId.isNotEmpty) {
            // Update lastLogin value to "Android"
            try {
              final updateLoginResponse = await ApiService.updateLastLogin({
                'user_id': userId,
                'lastLogin': 'Android'
              });

              if (ApiService.isSuccessResponse(updateLoginResponse)) {
                print('Last login platform updated to Android successfully');
              } else {
                print('Failed to update last login platform: ${updateLoginResponse.statusCode}');
              }
            } catch (loginError) {
              // Don't stop the login flow if this fails, just log the error
              print('Error updating last login platform: $loginError');
            }

            return {
              'userId': userId,
              'userCategory': userCategory,
              'userfullname': userfullname,
            };
          } else {
            print('userId or userCategory not found or is empty in the response');
            return null;
          }
        } else {
          print('No user data found in the response');
          return null;
        }
      } else {
        print('Failed to fetch userId and category. Status code: ${response.statusCode}');
        print('Response body: ${response.body}');
        return null;
      }
    } catch (e) {
      print('Error fetching userId and category: $e');
      return null;
    }
  }
  Future<void> callPostApi(String? userId, String? userFullName) async {
    String? firebaseToken;

    // Get the Firebase token
    firebaseToken = await messaging.getToken();
    print("device token : $firebaseToken");
    final String timestamp = DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());

    final requestBody = {
      'user_id': userId,
      'firebaseToken': firebaseToken,
      'updatedTimestamp': timestamp,
    };

    try {
      final response = await ApiService.saveFirebaseToken(requestBody);

      if (ApiService.isSuccessResponse(response)) {
        print('POST request successful: ${response.body}');
        // Handle the response as needed
      } else {
        print('Failed to send POST request: ${response.statusCode}');
        // Optionally show an error message
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to send POST request')),
        );
      }
    } catch (error) {
      print('Error sending POST request: $error');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error sending POST request: $error')),
      );
    }
  }
  @override
  Widget build(BuildContext context) {
    // Get screen dimensions for responsive design
    final screenHeight = MediaQuery.of(context).size.height;
    final screenWidth = MediaQuery.of(context).size.width;
    final keyboardHeight = MediaQuery.of(context).viewInsets.bottom;

    return Stack(
      children: [
        Scaffold(
          backgroundColor: Color(0xFF211F20),
          body: SafeArea(
            child: SingleChildScrollView(
              physics: ClampingScrollPhysics(),
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  minHeight: screenHeight - MediaQuery.of(context).padding.top - MediaQuery.of(context).padding.bottom,
                ),
                child: IntrinsicHeight(
                  child: Padding(
                    padding: EdgeInsets.symmetric(
                      horizontal: screenWidth * 0.05, // 5% of screen width
                      vertical: 40,
                    ),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Logo section with responsive spacing
                          SizedBox(height: screenHeight * 0.02),
                          Center(
                            child: Image.asset(
                              'assets/logo_final.png',
                              height: screenHeight * 0.19, // 15% of screen height
                              width: screenWidth * 0.8, // 80% of screen width
                              fit: BoxFit.contain,
                            ),
                          ),
                          SizedBox(height: screenHeight * 0.02),

                          // Login title
                          Center(
                            child: Text(
                              'Login',
                              style: TextStyle(
                                fontSize: screenWidth * 0.09, // Responsive font size
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ),
                          SizedBox(height: screenHeight * 0.07),

                          // Email field
                          Container(
                            width: double.infinity,
                            child: TextFormField(
                              controller: _emailController,
                              focusNode: _emailFocusNode,
                              cursorColor: Colors.black,
                              style: TextStyle(
                                color: Colors.black,
                                decorationThickness: 0,
                                fontFamily: 'Poppins',
                                fontSize: screenWidth * 0.04,
                              ),
                              onFieldSubmitted: (_) {
                                FocusScope.of(context).requestFocus(_passwordFocusNode);
                              },
                              textInputAction: TextInputAction.next,
                              decoration: InputDecoration(
                                fillColor: Color(0xFFD3D2D2),
                                filled: true,
                                floatingLabelBehavior: FloatingLabelBehavior.never,
                                label: RichText(
                                  text: TextSpan(
                                    text: 'Email',
                                    style: TextStyle(
                                      color: Colors.black,
                                      fontSize: screenWidth * 0.045,
                                      fontFamily: 'Poppins',
                                    ),
                                  ),
                                ),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(10),
                                  borderSide: BorderSide(
                                    color: Colors.black,
                                    width: 1.0,
                                  ),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(10),
                                  borderSide: BorderSide(
                                    color: Colors.black,
                                    width: 2.0,
                                  ),
                                ),
                                prefixIcon: Icon(Icons.email, color: Colors.black),
                                contentPadding: EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: screenHeight * 0.02,
                                ),
                              ),
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return 'Please enter your Email ID';
                                }
                                if (!EmailValidator.validate(value)) {
                                  return 'Please enter a valid Email ID';
                                }
                                return null;
                              },
                            ),
                          ),
                          SizedBox(height: screenHeight * 0.02),

                          // Password field
                          Container(
                            width: double.infinity,
                            child: TextFormField(
                              controller: _passwordController,
                              focusNode: _passwordFocusNode,
                              textInputAction: TextInputAction.done,
                              cursorColor: Colors.black,
                              style: TextStyle(
                                color: Colors.black,
                                decorationThickness: 0,
                                fontSize: screenWidth * 0.04,
                              ),
                              obscureText: !_isPasswordVisible,
                              decoration: InputDecoration(
                                floatingLabelBehavior: FloatingLabelBehavior.never,
                                fillColor: Color(0xFFD3D2D2),
                                filled: true,
                                label: RichText(
                                  text: TextSpan(
                                    text: 'Password',
                                    style: TextStyle(
                                      color: Colors.black,
                                      fontSize: screenWidth * 0.045,
                                      fontFamily: 'Poppins',
                                    ),
                                  ),
                                ),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(10),
                                  borderSide: BorderSide(
                                    color: Colors.black,
                                    width: 1.0,
                                  ),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(10),
                                  borderSide: BorderSide(
                                    color: Colors.black,
                                    width: 2.0,
                                  ),
                                ),
                                prefixIcon: Icon(Icons.lock, color: Colors.black),
                                suffixIcon: IconButton(
                                  icon: Icon(
                                    _isPasswordVisible
                                        ? Icons.visibility
                                        : Icons.visibility_off,
                                    color: Colors.black,
                                  ),
                                  onPressed: () {
                                    setState(() {
                                      _isPasswordVisible = !_isPasswordVisible;
                                    });
                                  },
                                ),
                                contentPadding: EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: screenHeight * 0.02,
                                ),
                              ),
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return 'Please enter a password';
                                } else if (value.length < 8) {
                                  return 'Password must be at least 8 characters long';
                                }
                                return null;
                              },
                            ),
                          ),
                          SizedBox(height: screenHeight * 0.018),

                          // Forgot password
                          Center(
                            child: TextButton(
                              onPressed: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => SendResetCodePage(),
                                  ),
                                );
                              },
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    'Forgot Password',
                                    style: TextStyle(
                                      color: Color(0xFF4297FF),
                                      fontSize: screenWidth * 0.04,
                                    ),
                                  ),
                                  Container(
                                    margin: EdgeInsets.only(top: 2),
                                    height: 1,
                                    width: 120,
                                    color: Colors.blue,
                                  ),
                                ],
                              ),
                            ),
                          ),

                          // Flexible spacer to push buttons to bottom on larger screens
                          Flexible(
                            child: SizedBox(height: screenHeight * 0.07),
                          ),

                          // Login button
                          Container(
                            width: double.infinity,
                            height: screenHeight * 0.07,
                            margin: EdgeInsets.symmetric(horizontal: 0),
                            child: ElevatedButton(
                              onPressed: _isLoading
                                  ? null
                                  : () {
                                if (_formKey.currentState?.validate() ?? false) {
                                  signInUser(
                                    email: _emailController.text.trim(),
                                    password: _passwordController.text.trim(),
                                  );
                                }
                              },
                              child: Text(
                                'Login',
                                style: TextStyle(
                                  fontSize: screenWidth * 0.045,
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontFamily: 'Poppins',
                                ),
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Color(0xFF2644D9),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(30),
                                ),
                                elevation: 0,
                                shadowColor: Colors.transparent,
                              ),
                            ),
                          ),
                          SizedBox(height: screenHeight * 0.015),

                          // Google sign-in button
                          Container(
                            width: double.infinity,
                            height: screenHeight * 0.07,
                            margin: EdgeInsets.symmetric(horizontal: 0),
                            child: ElevatedButton.icon(
                              onPressed: _signInWithGoogle,
                              icon: Image.asset(
                                "assets/google.jpg",
                                width: 24,
                                height: 24,
                              ),
                              label: Text(
                                'Continue with Google',
                                style: TextStyle(
                                  fontSize: screenWidth * 0.04,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black,
                                  fontFamily: 'Poppins',
                                ),
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.white,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(30),
                                ),
                                shadowColor: Color.fromRGBO(0, 0, 0, 0.25),
                                elevation: 4,
                              ),
                            ),
                          ),
                          SizedBox(height: screenHeight * 0.02),

                          // Terms and conditions
                          Center(
                            child: GestureDetector(
                              onTap: _showTermsModal,
                              child: RichText(
                                textAlign: TextAlign.center,
                                text: TextSpan(
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontFamily: 'Poppins',
                                    fontSize: screenWidth * 0.032,
                                  ),
                                  children: [
                                    TextSpan(text: "By logging in, you agree to the\n"),
                                    TextSpan(
                                      text: "Terms of Use and Privacy Policy",
                                      style: TextStyle(
                                        decoration: TextDecoration.underline,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          SizedBox(height: screenHeight * 0.02),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
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
}