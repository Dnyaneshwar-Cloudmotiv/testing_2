import 'dart:async';

import 'package:amplify_flutter/amplify_flutter.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:voiceapp/loginpage.dart';
import 'package:voiceapp/main.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:voiceapp/services/api_service.dart';

class MergeAccountConfirmPage extends StatefulWidget {
  final String email;
  final Function? onMergeComplete;

  MergeAccountConfirmPage({
    required this.email,
    this.onMergeComplete
  });

  @override
  _MergeAccountConfirmPageState createState() => _MergeAccountConfirmPageState();
}

class _MergeAccountConfirmPageState extends State<MergeAccountConfirmPage> {
  final _codeController = TextEditingController();
  int _resendCountdown = 30;
  Timer? _resendTimer;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    startResendCountdown();
  }

  @override
  void dispose() {
    _resendTimer?.cancel();
    super.dispose();
  }

  void startResendCountdown() {
    setState(() {
      _resendCountdown = 30;
    });

    _resendTimer?.cancel();
    _resendTimer = Timer.periodic(Duration(seconds: 1), (timer) {
      if (_resendCountdown > 0) {
        setState(() {
          _resendCountdown--;
        });
      } else {
        timer.cancel();
      }
    });
  }

  Future<void> resendCode() async {
    try {
      await Amplify.Auth.resetPassword(username: widget.email);
      _showMessage('Verification code resent to your email.');
      startResendCountdown();
    } on AuthException catch (e) {
      _showMessage(e.message);
    }
  }

  Future<void> confirmMergeAccount() async {
    String trimmedCode = _codeController.text.trim().replaceAll(RegExp(r'\D'), '');
    if (trimmedCode.isEmpty) {
      _showMessage('Confirmation code is required.');
      return;
    }

    if (trimmedCode.length != 6) {
      _showMessage('Please enter a valid 6-digit code.');
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      // Fetch the Google password from API
      String googlePassword = await _fetchGooglePassword(widget.email);

      // Confirm password reset with the Google password
      await Amplify.Auth.confirmResetPassword(
        username: widget.email,
        newPassword: googlePassword,
        confirmationCode: trimmedCode,
      );

      _showMessage('Account successfully linked with Google!');

      // Call the callback if provided
      if (widget.onMergeComplete != null) {
        Navigator.of(context).pop(); // Go back to login page
        widget.onMergeComplete!();
      } else {
        // Default behavior if no callback
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(builder: (context) => LoginPage()),
              (route) => false,
        );
      }
    } on AuthException catch (e) {
      _showMessage(e.message);
    } catch (e) {
      _showMessage('Error linking account: ${e.toString()}');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<String> _fetchGooglePassword(String email) async {
    try {
      final response = await ApiService.createMergePassword(email);

      if (response.statusCode == 200) {
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

  String _generateSecurePasswordForGoogle(String email) {
    return 'Google_${email.hashCode.toString()}!123';
  }

  void _showMessage(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return GradientScaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        titleSpacing: 0,
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: Image.asset(
          'assets/logo.png',
          height: 50,
        ),
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios, color: Colors.white),
          onPressed: () {
            Navigator.pop(context);
          },
        ),
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            controller: ScrollController(),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  SizedBox(height: 50),
                  Center(
                    child: Text(
                      "Link Account with Google",
                      style: TextStyle(fontSize: 25, fontWeight: FontWeight.bold),
                    ),
                  ),
                  SizedBox(height: 30),
                  Text(
                    "We've sent a verification code to your email. Enter the code below to link your existing account with Google.",
                    style: TextStyle(color: Colors.white, fontSize: 16),
                    textAlign: TextAlign.center,
                  ),
                  SizedBox(height: 30),
                  // Display the email
                  TextFormField(
                    initialValue: widget.email,
                    readOnly: true,
                    style: TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      labelText: 'Email',
                      labelStyle: TextStyle(color: Colors.white),
                      border: OutlineInputBorder(
                        borderSide: BorderSide(color: Colors.white),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderSide: BorderSide(color: Colors.white),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderSide: BorderSide(color: Colors.white, width: 2.0),
                      ),
                    ),
                    cursorColor: Colors.white,
                  ),
                  SizedBox(height: 20),
                  // Confirmation code input
                  TextFormField(
                    controller: _codeController,
                    keyboardType: TextInputType.number,
                    inputFormatters: [
                      FilteringTextInputFormatter.digitsOnly,
                      LengthLimitingTextInputFormatter(6),
                    ],
                    style: TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      floatingLabelBehavior: FloatingLabelBehavior.never,
                      labelText: 'Verification Code',
                      labelStyle: TextStyle(color: Colors.white),
                      border: OutlineInputBorder(
                        borderSide: BorderSide(color: Colors.white),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderSide: BorderSide(color: Colors.white),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderSide: BorderSide(color: Colors.white, width: 2.0),
                      ),
                    ),
                    cursorColor: Colors.white,
                  ),
                  SizedBox(height: 10),
                  // Resend Code button and timer
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      GestureDetector(
                        onTap: _resendCountdown == 0 ? resendCode : null,
                        child: Text(
                          _resendCountdown == 0
                              ? 'Resend Code'
                              : 'Resend in $_resendCountdown s',
                          style: TextStyle(
                            color: _resendCountdown == 0 ? Colors.blue : Colors.grey,
                          ),
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 60),
                  ElevatedButton(
                    onPressed: _isLoading ? null : confirmMergeAccount,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.black,
                      padding: EdgeInsets.symmetric(horizontal: 50, vertical: 15),
                    ),
                    child: _isLoading
                        ? CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    )
                        : Text(
                      'Link Account',
                      style: TextStyle(fontSize: 18, color: Colors.white, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (_isLoading)
            Container(
              color: Colors.black.withOpacity(0.5),
              child: Center(
                child: CircularProgressIndicator(),
              ),
            ),
        ],
      ),
    );
  }
}