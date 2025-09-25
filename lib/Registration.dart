// Registration.dart
import 'dart:async';
import 'dart:ui';

import 'package:amplify_auth_cognito/amplify_auth_cognito.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:amplify_flutter/amplify_flutter.dart';
import 'package:flutter/services.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:voiceapp/main.dart';
import 'NewHomepage.dart';
import 'additionalinfo.dart';
import 'package:email_validator/email_validator.dart';
import 'package:url_launcher/url_launcher.dart';

import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:voiceapp/connectivity_service.dart';
import 'package:voiceapp/loading_screen.dart';
import 'package:voiceapp/services/api_service.dart';

import 'notifiers.dart';

class UserApiResponse {
  final String message;
  final String userId;

  UserApiResponse({
    required this.message,
    required this.userId,
  });

  factory UserApiResponse.fromJson(Map<String, dynamic> json) {
    return UserApiResponse(
      message: json['message'] ?? '',
      userId: json['user_id']?.toString() ?? '', // Convert to string since it might come as an integer
    );
  }
}

// Refactored saveUserToApi function using centralized API service
Future<String> saveUserToApi(String email) async {
  try {
    final response = await ApiService.saveUserToApi(email);

    if (ApiService.isSuccessResponse(response)) {
      final responseData = ApiService.parseJsonResponse(response);
      if (responseData != null) {
        final userResponse = UserApiResponse.fromJson(responseData);
        return userResponse.userId;
      } else {
        throw Exception('Failed to parse API response');
      }
    } else {
      throw Exception('Failed to save user: ${response.statusCode}');
    }
  } catch (e) {
    throw Exception('API call failed: $e');
  }
}

class RegistrationPage extends StatefulWidget {
  @override
  _RegistrationPageState createState() => _RegistrationPageState();
}

class _RegistrationPageState extends State<RegistrationPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _mobileNumberController = TextEditingController();
  final _confirmationCodeController =
  TextEditingController(); // For confirmation code
  bool _isPasswordVisible = false;
  bool _isPasswordValid = false; // Flag for internal password validity
  bool _hasSubmitted = false;
  bool _isPasswordErrorVisible = false;
  final String error='Password must be at least 8 characters long';
  int _resendCodeCountdown = 30; // Initial countdown duration in seconds
  bool _isResendButtonEnabled = false; // Resend button state
  bool _isLoading = false; // Loader flag for the continue button
  bool _isConfirmLoading = false; // Loader flag for the confirm button
  bool _isNoInternet = false;
  late ConnectivityService _connectivityService;
  bool _mounted = true;
  late TextEditingController _codeController;
  final dialogKey = GlobalKey<State>();
  bool _isHandlingBackPress = false;

  final GoogleSignUpService _googleSignUpService = GoogleSignUpService();

  @override
  void initState() {
    super.initState();
    _mounted = true;
    _connectivityService = ConnectivityService();
    _setupConnectivityListener();
    _codeController = TextEditingController();
  }

  void _setupConnectivityListener() {
    _connectivityService.connectionStream.listen((hasConnection) {
      if (!_mounted || _connectivityService.isClosed) return;

      setState(() {
        _isNoInternet = !hasConnection;
      });

      // If connection is restored, nothing specific to initialize for registration page
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


  String _maskEmail(String email) {
    if (email.isEmpty) return '';

    // Split email into local part and domain
    final parts = email.split('@');
    if (parts.length != 2) return email;

    final domain = parts[1];

    return 'xxxxxx@$domain';
  }

  Future<void> _signUpWithGoogle() async {
    // Unfocus any active text fields
    FocusScope.of(context).unfocus();

    // Completely reset the form
    _formKey.currentState?.reset();

    // Clear all text controllers
    _emailController.clear();
    _passwordController.clear();

    // Reset all state variables to their initial values
    setState(() {
      _isLoading = false;
      _isPasswordVisible = false;
      _isPasswordValid = false;
      _hasSubmitted = false;
      _isPasswordErrorVisible = false;
    });

    try {
      final result = await _googleSignUpService.signUpWithGoogle(context);

      // If dialog is dismissed or process is canceled, explicitly reset everything
      if (result == null) {
        // Ensure we're back on the registration page
        // if the tell you to navigate back to the main.dart or other pages
        //Navigator.of(context).popUntil((route) => route.isFirst);

        // Completely reset the page state
        setState(() {
          _emailController.clear();
          _passwordController.clear();
          _isLoading = false;
          _isPasswordVisible = false;
          _isPasswordValid = false;
          _hasSubmitted = false;
          _isPasswordErrorVisible = false;
        });

        return;
      }

      // If successful, navigate to additional info page
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => AddinfoPage(
            email: result['email'] ?? '',
            userId: result['userId'] ?? '',
          ),
        ),
      );
    } catch (e) {
      // Complete reset in case of any error
      Navigator.of(context).popUntil((route) => route.isFirst);

      setState(() {
        _emailController.clear();
        _passwordController.clear();
        _isLoading = false;
        _isPasswordVisible = false;
        _isPasswordValid = false;
        _hasSubmitted = false;
        _isPasswordErrorVisible = false;
      });

      // Optionally show error
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Google Sign Up failed')),
      );
    }
  }

// Method to start the countdown timer


//    Future<bool> _checkIfMobileNumberExists(String mobileNumberWithCode) async {
//   try {
//     // Try to sign in with the mobile number. If the sign-in succeeds, the mobile number exists.
//     await Amplify.Auth.signIn(
//       username: mobileNumberWithCode,
//       password: 'dummyPassword', // Using a dummy password just to check if the user exists
//     );
//     return true; // Mobile number exists
//   } on UserNotFoundException {
//     // If the user is not found, the mobile number is not registered yet
//     print('Mobile number does not exist.');
//     return false;
//   } on AuthException catch (e) {
//     // Handle other authentication-related exceptions, assuming the mobile number exists
//     print('AuthException occurred: ${e.message}');
//     return true; // Treat all other cases as the mobile number existing
//   }
// }


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

  Future<void> signUpUser({
    required String email,
    required String password,
  }) async {
    setState(() {
      _isPasswordErrorVisible = true;
      _isLoading = true;
    });

    if (!_formKey.currentState!.validate()) {
      setState(() {
        _isLoading = false;
      });
      return;
    }

    try {
      // 1. Check if user exists in DynamoDB
      final existingUserDetails = await _fetchUserIdAndCategory(email);
      if (existingUserDetails != null) {
        _showErrorDialog(
            'Account Exists',
            'An account with this email already exists. Please login instead.'
        );
        setState(() {
          _isLoading = false;
        });
        return;
      }

      // 2. User not in DynamoDB, try Cognito signup
      final result = await Amplify.Auth.signUp(
        username: email,
        password: password,
      );

      await _handleSignUpResult(result, email);
    } on AuthException catch (e) {
      if (e is UsernameExistsException) {
        // 3. User exists in Cognito but not in DynamoDB
        // We need to determine if they're confirmed or not

        try {
          // Try to resend the confirmation code
          await Amplify.Auth.resendSignUpCode(username: email);

          // If we get here successfully, it means the user exists
          // in Cognito but is not confirmed yet - show confirmation dialog
          _showConfirmationDialog(email);
        } on AuthException catch (resendError) {
          // Check if the error indicates user is already confirmed
          if (resendError.message.contains('User is already confirmed')) {
            // User is confirmed, show "Account exists" message
            _showErrorDialog(
                'Account Exists',
                'An account with this email already exists. Please login instead.'
            );
          } else {
            // Something else went wrong, default to showing confirmation dialog
            _showConfirmationDialog(email);
          }
        }
      } else if (e.message.contains('phone_number')) {
        _showErrorDialog(
            'Mobile Number Exists',
            'The mobile number is already registered. Please use a different number.'
        );
      } else {
        _showErrorDialog('Sign up failed', e.message);
      }
    } catch (e) {
      _showErrorDialog('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }
  // Future<void> signUpUser({
  //   required String email,
  //   required String password,
  //   //required String mobileNumber,
  // }) async {
  //   setState(() {
  //     _isPasswordErrorVisible = true;
  //     //_hasSubmitted = true;
  //     // Mark error visibility as true
  //   });
  //
  //
  //
  //   setState(() {
  //     _isLoading = true; // Start the loader
  //   });
  //
  //   if (!_formKey.currentState!.validate()) {
  //     setState(() {
  //       _isLoading = false; // Stop loader if validation fails
  //     });
  //     return;
  //   }
  //
  //   //final mobileNumberWithCode = '+91${mobileNumber.trim()}';
  //
  //
  //
  //   try {
  //     //final mobileNumberWithCode = '+91${mobileNumber.trim()}';
  //     final userAttributes = {
  //       CognitoUserAttributeKey.email: email,
  //       //CognitoUserAttributeKey.phoneNumber: mobileNumberWithCode,
  //     };
  //     final result = await Amplify.Auth.signUp(
  //       username: email,
  //       password: password,
  //       //options: SignUpOptions(userAttributes: userAttributes),
  //     );
  //
  //     await _handleSignUpResult(result, email);
  //   }  on AuthException catch (e) {
  //     if (e is UsernameExistsException) {
  //       // This means the email already exists
  //       print('Email already exists, resending the confirmation code...');
  //       await _resendConfirmationCode(email);
  //       _showConfirmationDialog(email);
  //     } else if (e.message.contains('phone_number')) {
  //       // This means the phone number already exists
  //       print('Phone number already exists');
  //       _showErrorDialog('Mobile Number Exists', 'The mobile number is already registered. Please use a different number.');
  //     } else {
  //       // Catch other errors
  //       _showErrorDialog('Sign up failed', e.message);
  //     }
  //   }finally {
  //     setState(() {
  //       _isLoading = false; // Stop the loader after sign-up
  //     });
  //   }
  // }


  // Refactored _fetchUserIdAndCategory using centralized API service
  Future<Map<String, String>?> _fetchUserIdAndCategory(String email) async {
    try {
      final response = await ApiService.fetchUserIdAndCategory(email);

      if (ApiService.isSuccessResponse(response)) {
        final List<dynamic>? data = ApiService.parseJsonListResponse(response);

        if (data != null && data.isNotEmpty) {
          final userData = data[0];

          final userId = userData['user_id']?['S'] ?? '';
          final userCategory = userData['Category']?['S'] ?? '';
          final userfullname = userData['FullName']?['S'] ?? '';

          if (userId.isNotEmpty && userCategory.isNotEmpty) {
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
        return null;
      }
    } catch (e) {
      print('Error fetching userId and category: $e');
      return null;
    }
  }

  void _showResendConfirmationDialog(String email) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('Account Exists'),
          content: Text('This account already exists. Would you like to resend the confirmation code?'),
          actions: [
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop(); // Close the dialog
              },
              child: Text('Cancel',style:
              TextStyle(
                  color: Colors.white
              ),),
            ),
            ElevatedButton(
              onPressed: () async {
                await _resendConfirmationCode(email);
                //Navigator.of(context).pop(); // Close the dialog
              },
              child: Text('Resend Code',style: TextStyle(
                  color: Colors.white
              ),),
            ),
          ],
        );
      },
    );
  }



  Future<void> _resendConfirmationCode(String email) async {
    try {
      // Resend the sign-up code using Amplify Auth
      await Amplify.Auth.resendSignUpCode(username: email);
      _confirmationCodeController.clear();
      //_showConfirmationDialog(email);

      // Show a SnackBar or other notification to inform the user
      // ScaffoldMessenger.of(context).showSnackBar(
      //   SnackBar(content: Text('Confirmation code resent to $email')),
      // );
    } on AuthException catch (e) {
      // Check if the error contains a limit exceeded message
      if (e.message.contains('LimitExceededException') ||
          e.message.contains('Attempt limit exceeded')) {
        _showErrorDialog('Failed to resend code',
            "Attempt limit exceeded, please contact the administrator at ",
            isRichText: true,
            emailAddress: "info@voiz.co.in");
      } else {
        // Handle other errors with the original message
        _showErrorDialog('Failed to resend code', e.message);
      }
    }
  }



  Future<void> _handleSignUpResult(SignUpResult result, String email) async {
    if (result.nextStep.signUpStep == AuthSignUpStep.confirmSignUp) {
      print('Showing confirmation dialog...');
      _showConfirmationDialog(email); // Show confirmation dialog
    } else if (result.nextStep.signUpStep == AuthSignUpStep.done) {
      print('Sign up is complete');
      // Optionally navigate to a different page or show a success message
    }
  }

  void _showConfirmationDialog(String email) {
    Timer? timer;
    bool isDialogActive = true;
    int _resendCodeCountdown = 30;
    bool _isResendButtonEnabled = false;
    OverlayEntry? snackbarOverlayEntry; // Track the OverlayEntry

    _codeController.clear();

    void showCustomSnackBar(BuildContext context, String message) {
      if (!isDialogActive) return;
      final overlay = Overlay.of(context);

      // Remove any existing snackbar
      snackbarOverlayEntry?.remove();
      snackbarOverlayEntry = OverlayEntry(
        builder: (context) {
          final keyboardHeight = MediaQuery.of(context).viewInsets.bottom;
          final double bottomPadding = keyboardHeight > 0 ? keyboardHeight + 8 : 16;

          return Positioned(
            bottom: bottomPadding,
            left: 16,
            right: 16,
            child: Material(
              color: Colors.transparent,
              child: Container(
                padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(4),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 4,
                      offset: Offset(0, 2),
                    ),
                  ],
                ),
                child: Text(
                  message,
                  style: TextStyle(
                    color: Colors.black,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          );
        },
      );

      overlay.insert(snackbarOverlayEntry!);
      Future.delayed(Duration(seconds: 3), () {
        snackbarOverlayEntry?.remove();
        snackbarOverlayEntry = null; // Clear reference after removal
      });
    }

    void cleanup() {
      isDialogActive = false;
      timer?.cancel();
      snackbarOverlayEntry?.remove(); // Remove snackbar on dialog close
      snackbarOverlayEntry = null;
      _codeController.clear();
    }

    if (!mounted) return;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext dialogContext) {
        double screenWidth = MediaQuery.of(context).size.width;

        return WillPopScope(
          onWillPop: () async {
            if (_isHandlingBackPress) return true;
            _isHandlingBackPress = true;
            cleanup();
            Navigator.of(context).pop();
            Navigator.of(context).popUntil((route) => !(route is DialogRoute));
            _isHandlingBackPress = false;
            return false;
          },
          child: StatefulBuilder(
            builder: (BuildContext context, void Function(void Function()) setState) {
              if (timer == null && isDialogActive) {
                timer = Timer.periodic(Duration(seconds: 1), (Timer t) {
                  if (!isDialogActive) {
                    t.cancel();
                    return;
                  }
                  setState(() {
                    if (_resendCodeCountdown > 0) {
                      _resendCodeCountdown--;
                    } else {
                      _isResendButtonEnabled = true;
                      t.cancel();
                    }
                  });
                });
              }

              return BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
                child: AlertDialog(
                  backgroundColor: Color(0xFF160101),
                  title: Text('Confirm Sign Up', style: TextStyle(color: Colors.white, fontSize: 24), textAlign: TextAlign.center),
                  content: SingleChildScrollView(
                    child: Container(
                      width: screenWidth * 0.8,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          SizedBox(height: 10),
                          Center(child: Text('A confirmation code was', style: TextStyle(color: Colors.white, fontSize: 16), textAlign: TextAlign.center)),
                          Center(child: Text('sent to:', style: TextStyle(color: Colors.white, fontSize: 16), textAlign: TextAlign.center)),
                          SizedBox(height: 10),
                          Center(
                            child: Text(
                              //_maskEmail(email),
                              email,
                              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 16),
                            ),
                          ),
                          SizedBox(height: 10),
                          Center(child: Text('Enter the confirmation code below to verify your account.', style: TextStyle(color: Colors.white, fontSize: 16), textAlign: TextAlign.center)),
                          SizedBox(height: 25),
                          TextFormField(
                            controller: _codeController,
                            cursorColor: Colors.black,
                            style: TextStyle(color: Colors.black, fontSize: 16),
                            keyboardType: TextInputType.number,
                            inputFormatters: [
                              FilteringTextInputFormatter.digitsOnly,
                              LengthLimitingTextInputFormatter(6),
                              TextInputFormatter.withFunction((oldValue, newValue) {
                                final cleanedValue = newValue.text.replaceAll(RegExp(r'\D'), '');
                                final trimmedValue = cleanedValue.length > 6 ? cleanedValue.substring(0, 6) : cleanedValue;
                                return TextEditingValue(
                                  text: trimmedValue,
                                  selection: TextSelection.collapsed(offset: trimmedValue.length),
                                );
                              }),
                            ],
                            decoration: InputDecoration(
                              hintText: 'Code',
                              hintStyle: TextStyle(color: Color(0xFF160101)),
                              contentPadding: EdgeInsets.symmetric(vertical: 16, horizontal: 16),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.white)),
                              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.white.withOpacity(0.5))),
                              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.white, width: 2)),
                              filled: true,
                              fillColor: Colors.white,
                            ),
                          ),
                          Align(
                            alignment: Alignment.centerLeft,
                            child: TextButton(
                              onPressed: _isResendButtonEnabled
                                  ? () async {
                                if (!isDialogActive) return;
                                await _resendConfirmationCode(email);
                                _codeController.clear();
                                showCustomSnackBar(context, 'Confirmation code resent to $email');
                                setState(() {
                                  _resendCodeCountdown = 30;
                                  _isResendButtonEnabled = false;
                                  timer?.cancel();
                                  timer = Timer.periodic(Duration(seconds: 1), (Timer t) {
                                    if (!isDialogActive) {
                                      t.cancel();
                                      return;
                                    }
                                    setState(() {
                                      if (_resendCodeCountdown > 0) {
                                        _resendCodeCountdown--;
                                      } else {
                                        _isResendButtonEnabled = true;
                                        t.cancel();
                                      }
                                    });
                                  });
                                });
                              }
                                  : null,
                              style: TextButton.styleFrom(padding: EdgeInsets.zero, alignment: Alignment.centerLeft),
                              child: Text(
                                _isResendButtonEnabled ? 'Resend Code' : 'Resend Code($_resendCodeCountdown)',
                                style: TextStyle(color: _isResendButtonEnabled ? Colors.white : Colors.grey, fontSize: 16),
                              ),
                            ),
                          ),
                          SizedBox(height: 10),
                          SizedBox(
                            width: 174,
                            height: 47,
                            child: ElevatedButton(
                              onPressed: _isConfirmLoading
                                  ? null
                                  : () async {
                                if (!isDialogActive) return;
                                if (_codeController.text.length != 6) {
                                  showCustomSnackBar(context, 'Please enter a 6-digit confirmation code');
                                  return;
                                }
                                setState(() {
                                  _isConfirmLoading = true;
                                });
                                _confirmationCodeController.text = _codeController.text;
                                await _confirmUser(email);
                                if (isDialogActive) {
                                  setState(() {
                                    _isConfirmLoading = false;
                                  });
                                }
                              },
                              child: _isConfirmLoading
                                  ? SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                  : Text('Confirm', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                              style: ElevatedButton.styleFrom(backgroundColor: Color(0xFF2644D9)),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        );
      },
    ).then((_) {
      cleanup(); // Ensure cleanup runs when dialog closes
    });
  }

  @override
  void dispose() {
    _mounted = false;
    _connectivityService.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _mobileNumberController.dispose();
    _confirmationCodeController.dispose();
    _codeController.dispose();
    super.dispose();
  }


  Future<void> _confirmUser(String email) async {
    String confirmationCode = _confirmationCodeController.text.trim();

    setState(() {
      _isConfirmLoading = true;
    });

    if (confirmationCode.isEmpty) {
      _showErrorDialog('Confirmation failed', 'Confirmation code is mandatory.');
      return;
    }

    try {
      final result = await Amplify.Auth.confirmSignUp(
        username: email,
        confirmationCode: confirmationCode,
      );

      if (result.isSignUpComplete) {
        await Amplify.Auth.signIn(username: email, password: _passwordController.text.trim());

        try {
          final userId = await saveUserToApi(email);
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) => AddinfoPage(
                email: email,
                userId: userId,
              ),
            ),
          );
        } catch (apiError) {
          _showErrorDialog(
              'API Error',
              'Failed to save user information. Please try again.'
          );
        }
      } else {
        _showErrorDialog('Confirmation failed', 'Please try again.');
      }
    } on AuthException catch (e) {
      if (e.message.contains('CodeMismatchException')) {
        _showErrorDialog('Incorrect Code', 'The confirmation code is incorrect. Please try again.');
      } else if (e.message.contains('ExpiredCodeException')) {
        _showErrorDialog('Code Expired', 'The confirmation code has expired. Please request a new one.');
      } else if (e.message.contains('LimitExceededException') ||
          e.message.contains('Attempt limit exceeded')) {
        _showErrorDialog('Too Many Attempts',
            "Attempt limit exceeded, please contact the administrator at ",
            isRichText: true,
            emailAddress: "info@voiz.co.in");
      } else {
        _showErrorDialog('Error', e.message);
      }
    } finally {
      setState(() {
        _isConfirmLoading = false;
      });
    }
  }

//   Future<void> _confirmUser(String email) async {
//   String confirmationCode = _confirmationCodeController.text.trim();
//
//   setState(() {
//       _isConfirmLoading = true; // Start the loader for confirm
//     });
//
//   if (confirmationCode.isEmpty) {
//     _showErrorDialog('Confirmation failed', 'Confirmation code is mandatory.');
//     return;
//   }
//
//   try {
//     final result = await Amplify.Auth.confirmSignUp(
//       username: email,
//       confirmationCode: confirmationCode,
//     );
//
//     if (result.isSignUpComplete) {
//       print('Confirmation successful, navigating to add info page...');
//       await Amplify.Auth.signIn(username: email, password: _passwordController.text.trim());
//       // Navigate to the additional info page after confirmation
//       Navigator.of(context).push(
//         MaterialPageRoute(
//           builder: (context) => AddinfoPage(email: email),
//         ),
//       );
//     } else {
//       _showErrorDialog('Confirmation failed', 'Please try again.');
//     }
//   } on AuthException catch (e) {
//     // Show more specific error messages based on the error type
//     if (e.message.contains('CodeMismatchException')) {
//       _showErrorDialog('Incorrect Code', 'The confirmation code is incorrect. Please try again.');
//     } else if (e.message.contains('ExpiredCodeException')) {
//       _showErrorDialog('Code Expired', 'The confirmation code has expired. Please request a new one.');
//     } else {
//       _showErrorDialog('Error', e.message); // Generic error handling
//     }
//   }finally {
//       setState(() {
//         _isConfirmLoading = false; // Stop the loader after confirmation
//       });
//     }
// }


  void _showErrorDialog(String title, String message,{bool isRichText = false, String emailAddress = ""}) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return WillPopScope(
          onWillPop: () async {
            if (_isHandlingBackPress) {
              return true;
            }

            _isHandlingBackPress = true;

            Navigator.of(context).pop();

            Navigator.of(context).popUntil((route) {
              return !(route is DialogRoute);
            });

            _isHandlingBackPress = false;
            return false;
          },
          child: AlertDialog(
            key: dialogKey,
            title: Text(title),
            content: isRichText
                ? RichText(
              text: TextSpan(
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                ),
                children: [
                  TextSpan(text: message),
                  TextSpan(
                    text: emailAddress,
                    style: TextStyle(
                      color: Colors.blue,
                      fontStyle: FontStyle.italic,
                      fontFamily: 'Poppins',
                      fontSize: 16,
                      decoration: TextDecoration.underline,  // This adds the underline
                      decorationColor: Colors.blue,          // This makes the underline blue
                    ),
                  ),
                ],
              ),
            )
                : Text(message),
            actions: [
              ElevatedButton(
                onPressed: () {
                  Navigator.of(context).pop(); // Close the dialog
                },
                child: Text('OK',style: TextStyle(color: Colors.white),),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Color(0xFF2644D9), // Button background color white
                ),
              ),
            ],
            actionsAlignment: MainAxisAlignment.center,
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    // Get screen dimensions for responsive design
    final screenHeight = MediaQuery.of(context).size.height;
    final screenWidth = MediaQuery.of(context).size.width;
    final keyboardHeight = MediaQuery.of(context).viewInsets.bottom;

    return Stack(
      children: [
        GradientScaffold(
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
                      vertical: 20,
                    ),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Logo section with responsive spacing
                          SizedBox(height: screenHeight * 0.05),
                          Center(
                            child: Image.asset(
                              'assets/logo_final.png',
                              height: screenHeight * 0.19, // 15% of screen height
                              width: screenWidth * 0.8, // 80% of screen width
                              fit: BoxFit.contain,
                            ),
                          ),
                          SizedBox(height: screenHeight * 0.02),

                          // Create account title
                          Center(
                            child: Text(
                              'Create an account',
                              style: TextStyle(
                                fontSize: screenWidth * 0.075, // Responsive font size
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ),
                          SizedBox(height: screenHeight * 0.025),

                          // Email field
                          Container(
                            width: double.infinity,
                            child: TextFormField(
                              controller: _emailController,
                              cursorColor: Colors.black,
                              style: TextStyle(
                                color: Colors.black,
                                decorationThickness: 0,
                                fontFamily: 'Poppins',
                                fontSize: screenWidth * 0.04,
                              ),
                              decoration: InputDecoration(
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
                                fillColor: Color(0xFFD3D2D2),
                                filled: true,
                                floatingLabelBehavior: FloatingLabelBehavior.never,
                                floatingLabelStyle: TextStyle(
                                  color: Colors.black,
                                ),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(10),
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
                          SizedBox(height: screenHeight * 0.025),

                          // Password field
                          Container(
                            width: double.infinity,
                            child: TextFormField(
                              controller: _passwordController,
                              cursorColor: Colors.black,
                              obscureText: !_isPasswordVisible,
                              style: TextStyle(
                                color: Colors.black,
                                fontFamily: 'Poppins',
                                fontSize: screenWidth * 0.04,
                              ),
                              decoration: InputDecoration(
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
                                fillColor: Color(0xFFD3D2D2),
                                filled: true,
                                floatingLabelBehavior: FloatingLabelBehavior.never,
                                floatingLabelStyle: TextStyle(
                                  color: Colors.black,
                                ),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(10),
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
                                    _isPasswordVisible ? Icons.visibility : Icons.visibility_off,
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
                              onChanged: (value) {
                                setState(() {
                                  _isPasswordValid = value.length >= 8;
                                });
                              },
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

                          // Password hint
                          if (!_hasSubmitted)
                            Padding(
                              padding: const EdgeInsets.only(top: 8.0, left: 9),
                              child: Text(
                                'Password must be at least 8 characters long',
                                style: TextStyle(
                                  color: Color(0x99FFFFFF),
                                  fontSize: screenWidth * 0.035,
                                ),
                              ),
                            ),

                          // Flexible spacer to push content down
                          Flexible(
                            child: SizedBox(height: screenHeight * 0.05),
                          ),

                          // Progress indicator
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                width: screenWidth * 0.25,
                                height: 4,
                                color: Colors.white,
                              ),
                              SizedBox(width: 10),
                              Container(
                                width: screenWidth * 0.25,
                                height: 4,
                                color: Colors.grey,
                              ),
                            ],
                          ),
                          SizedBox(height: screenHeight * 0.06),

                          // Continue button
                          Container(
                            width: double.infinity,
                            height: screenHeight * 0.07,
                            child: ElevatedButton(
                              onPressed: _isLoading ? null : () {
                                setState(() {
                                  _hasSubmitted = true;
                                });
                                if (_formKey.currentState?.validate() ?? false) {
                                  signUpUser(
                                    email: _emailController.text.trim(),
                                    password: _passwordController.text.trim(),
                                  );
                                }
                              },
                              child: _isLoading
                                  ? CircularProgressIndicator(color: Colors.white)
                                  : Text(
                                'Continue',
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
                          SizedBox(height: screenHeight * 0.02),

                          // Google sign-up button
                          Container(
                            width: double.infinity,
                            height: screenHeight * 0.07,
                            child: ElevatedButton.icon(
                              onPressed: _isLoading ? null : _signUpWithGoogle,
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
                          SizedBox(height: screenHeight * 0.03),

                          // Terms and conditions
                          Center(
                            child: GestureDetector(
                              onTap: _showTermsModal,
                              child: RichText(
                                textAlign: TextAlign.center,
                                text: TextSpan(
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: screenWidth * 0.035,
                                    fontFamily: 'Poppins',
                                  ),
                                  children: [
                                    TextSpan(text: "By clicking Continue, you agree to the "),
                                    TextSpan(
                                      text: "Terms of use & privacy policy",
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

class GoogleSignUpService {
  final GoogleSignIn _googleSignIn = GoogleSignIn(scopes: ['email']);

  // Refactored _fetchGooglePassword using centralized API service
  Future<String> _fetchGooglePassword(String email) async {
    try {
      final response = await ApiService.fetchGooglePassword(email);

      if (ApiService.isSuccessResponse(response)) {
        final data = ApiService.parseJsonResponse(response);
        if (data != null && data['success'] == true && data['password'] != null) {
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

  // Refactored _fetchUserIdAndCategory using centralized API service
  Future<Map<String, String>?> _fetchUserIdAndCategory(String email) async {
    try {
      final response = await ApiService.fetchUserIdAndCategory(email);

      if (ApiService.isSuccessResponse(response)) {
        final List<dynamic>? data = ApiService.parseJsonListResponse(response);

        if (data != null && data.isNotEmpty) {
          final userData = data[0];

          final userId = userData['user_id']?['S'] ?? '';
          final userCategory = userData['Category']?['S'] ?? '';
          final userfullname = userData['FullName']?['S'] ?? '';

          if (userId.isNotEmpty && userCategory.isNotEmpty) {
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
        return null;
      }
    } catch (e) {
      print('Error fetching userId and category: $e');
      return null;
    }
  }

  void _showErrorDialog(BuildContext context, String title, String message, {bool isRichText = false, String emailAddress = ""}) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text(title),
          content: isRichText
              ? RichText(
            text: TextSpan(
              style: TextStyle(color: Colors.white, fontSize: 16),
              children: [
                TextSpan(text: message),
                TextSpan(
                  text: emailAddress,
                  style: TextStyle(
                    color: Colors.blue,
                    fontStyle: FontStyle.italic,
                    fontFamily: 'Poppins',
                    fontSize: 16,
                    decoration: TextDecoration.underline,
                    decorationColor: Colors.blue,
                  ),
                ),
              ],
            ),
          )
              : Text(message),
          actions: [
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: Text('OK', style: TextStyle(color: Colors.white)),
              style: ElevatedButton.styleFrom(backgroundColor: Color(0xFF2644D9)),
            ),
          ],
          actionsAlignment: MainAxisAlignment.center,
        );
      },
    );
  }

  Future<bool> _showEmailVerificationDialog(BuildContext context, String email) async {
    Completer<bool> completer = Completer<bool>();

    showConfirmationDialog(
      context,
      email,
      onConfirmSuccess: (code) async {
        try {
          final result = await Amplify.Auth.confirmSignUp(
            username: email,
            confirmationCode: code,
          );

          if (result.isSignUpComplete) {
            completer.complete(true);
            return true;
          } else {
            throw Exception('Verification not complete');
          }
        } on AuthException catch (e) {
          if (e.message.contains('CodeMismatchException')) {
            throw 'Incorrect code. Please try again.';
          } else if (e.message.contains('ExpiredCodeException')) {
            throw 'Code expired. Please request a new one.';
          } else if (e.message.contains('LimitExceededException') || e.message.contains('Attempt limit exceeded')) {
            _showErrorDialog(
              context,
              'Too Many Attempts',
              "Attempt limit exceeded, please contact the administrator at ",
              isRichText: true,
              emailAddress: "info@voiz.co.in",
            );
            completer.complete(false);
            throw 'Attempt limit exceeded. Please try again later.';
          } else {
            throw 'Error: ${e.message}';
          }
        }
      },
      onResendCode: () async {
        try {
          await Amplify.Auth.resendSignUpCode(username: email);
          return true;
        } on AuthException catch (e) {
          if (e.message.contains('LimitExceededException') || e.message.contains('Attempt limit exceeded')) {
            _showErrorDialog(
              context,
              'Failed to resend code',
              "Attempt limit exceeded, please contact the administrator at ",
              isRichText: true,
              emailAddress: "info@voiz.co.in",
            );
            throw 'Attempt limit exceeded. Please try again later.';
          } else {
            throw 'Failed to resend code: ${e.message}';
          }
        }
      },
    );

    // Set a timeout for the verification process
    Timer(Duration(minutes: 5), () {
      if (!completer.isCompleted) {
        completer.complete(false);
      }
    });

    return completer.future;
  }

  Future<Map<String, dynamic>?> signUpWithGoogle(BuildContext context) async {
    try {
      await _googleSignIn.signOut();
      // Start Google Sign Up flow
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      if (googleUser == null) return null;

      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      // Create Firebase user
      await FirebaseAuth.instance.signOut();
      final UserCredential userCredential = await FirebaseAuth.instance.signInWithCredential(credential);
      final User? user = userCredential.user;
      if (user == null) throw Exception('Failed to create account with Google');

      final String email = user.email ?? '';
      if (email.isEmpty) return null;

      // Check if user already exists in DynamoDB
      final existingUserDetails = await _fetchUserIdAndCategory(email);
      if (existingUserDetails != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('An account with this email already exists. Please log in instead.')),
        );
        await _googleSignIn.signOut();
        return null;
      }

      // Generate a secure random password for Cognito
      final String randomPassword = await _fetchGooglePassword(email);

      try {
        // Try to sign up with Cognito
        final signUpResult = await Amplify.Auth.signUp(
          username: email,
          password: randomPassword,
          options: SignUpOptions(
            userAttributes: {
              CognitoUserAttributeKey.email: email,
              CognitoUserAttributeKey.name: googleUser.displayName ?? '',
            },
          ),
        );

        // Check if email verification is required
        if (signUpResult.nextStep.signUpStep == AuthSignUpStep.confirmSignUp) {
          bool verificationCompleted = await _showEmailVerificationDialog(context, email);

          if (!verificationCompleted) {
            return null;
          }
        }

        // Save user to DynamoDB
        final userId = await saveUserToApi(email);

        // Attempt Cognito Sign-In after successful sign-up
        final result = await Amplify.Auth.signIn(
          username: email,
          password: randomPassword,
        );

        if (result.isSignedIn) {
          await loginMethodNotifier.saveLoginMethod(LoginMethodNotifier.LOGIN_METHOD_GOOGLE);
          final userDetails = await _fetchUserIdAndCategory(email);
          if (userDetails != null) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (context) => NewHomePage(
                  email: userDetails['userId']!,
                  category: userDetails['userCategory']!,
                  userfullname: userDetails['userfullname']!,
                ),
              ),
            );
          } else {
            print('Failed to retrieve user details');
          }
        }

        return {
          'email': email,
          'name': googleUser.displayName ?? '',
          'photoUrl': googleUser.photoUrl,
          'userId': userId,
        };
      } on AuthException catch (e) {
        if (e.message.contains('LimitExceededException') || e.message.contains('Attempt limit exceeded')) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Attempt limit exceeded, please contact the administrator at info@voiz.co.in'),
              duration: Duration(seconds: 3),
            ),
          );
          await _googleSignIn.signOut();
          return null;
        } else if (e is UsernameExistsException) {
          try {
            await Amplify.Auth.resendSignUpCode(username: email);
            bool verificationCompleted = await _showEmailVerificationDialog(context, email);

            if (!verificationCompleted) {
              await _googleSignIn.signOut();
              return null;
            }

            final result = await Amplify.Auth.signIn(
              username: email,
              password: randomPassword,
            );

            if (result.isSignedIn) {
              String userId;
              try {
                userId = await saveUserToApi(email);
              } catch (apiError) {
                final userDetails = await _fetchUserIdAndCategory(email);
                if (userDetails != null) {
                  userId = userDetails['userId']!;
                } else {
                  throw Exception('Failed to get or create user in database');
                }
              }

              await loginMethodNotifier.saveLoginMethod(LoginMethodNotifier.LOGIN_METHOD_GOOGLE);
              final userDetails = await _fetchUserIdAndCategory(email);
              if (userDetails != null) {
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(
                    builder: (context) => NewHomePage(
                      email: userDetails['userId']!,
                      category: userDetails['userCategory']!,
                      userfullname: userDetails['userfullname']!,
                    ),
                  ),
                );
              }

              return {
                'email': email,
                'name': googleUser.displayName ?? '',
                'photoUrl': googleUser.photoUrl,
                'userId': userId,
              };
            }
            return null;
          } catch (confirmError) {
            if (confirmError is AuthException &&
                (confirmError.message.contains('LimitExceededException') || confirmError.message.contains('Attempt limit exceeded'))) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Attempt limit exceeded, please contact the administrator at info@voiz.co.in'),
                  duration: Duration(seconds: 3),
                ),
              );
            } else if (confirmError.toString().contains('User is already confirmed')) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('An account with this email already exists. Please log in instead.')),
              );
            } else {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Error confirming account: ${confirmError.toString()}')),
              );
            }
            await _googleSignIn.signOut();
            return null;
          }
        } else {
          print('Cognito error: $e');
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error creating account: ${e.message}')),
          );
          return null;
        }
      }
    } catch (e) {
      print('Error in Google Sign Up: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to sign up with Google: ${e.toString()}')),
      );
      await _googleSignIn.signOut();
      return null;
    }
  }
}