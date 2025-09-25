// ResetPassword/confirmationcode.dart
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:amplify_flutter/amplify_flutter.dart';
import 'package:flutter/services.dart';
import 'package:voiceapp/loginpage.dart';
import 'package:voiceapp/main.dart';

class ConfirmResetPasswordPage extends StatefulWidget {
  final String email;

  ConfirmResetPasswordPage({required this.email});

  @override
  _ConfirmResetPasswordPageState createState() => _ConfirmResetPasswordPageState();
}

class _ConfirmResetPasswordPageState extends State<ConfirmResetPasswordPage> {
  final _codeController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _isPasswordVisible = false;
  bool _isConfirmPasswordVisible = false;
  int _resendCountdown = 30; // 30 seconds countdown
  Timer? _resendTimer;

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

  // Start countdown for resend code button
  void startResendCountdown() {
    setState(() {
      _resendCountdown = 30; // Reset countdown to 30 seconds
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

  // Resend reset code function
  Future<void> resendCode() async {
    try {
      await Amplify.Auth.resetPassword(username: widget.email);
      _showMessage('Reset code resent to your email.');
      startResendCountdown();
    } on AuthException catch (e) {
      _showMessage(e.message);
    }
  }

  Future<void> resetPassword() async {
    if (_codeController.text.isEmpty) {
      _showMessage('Confirmation code is required.');
      return;
    }

    if (_newPasswordController.text.length < 8) {
      _showMessage('Password must be at least 8 characters long.');
      return;
    }

    if (_newPasswordController.text != _confirmPasswordController.text) {
      _showMessage('Passwords do not match.');
      return;
    }

    try {
      await Amplify.Auth.confirmResetPassword(
        username: widget.email,
        newPassword: _newPasswordController.text.trim(),
        confirmationCode: _codeController.text.trim(),
      );
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (context) => LoginPage()),
        // Replace `LoginPage` with your login page widget
            (route) => false, // Removes all routes until this condition is met
      );
      //Navigator.popUntil(context, (route) => route.isFirst); // Return to the login page
    } on AuthException catch (e) {
      _showMessage(e.message);
    }
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
        // Disable default leading widget
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios, color: Colors.white),
          onPressed: () {
            Navigator.pop(context); // Go back to the previous page
          },
        ),
        titleSpacing: -40,
        title: Image.asset(
          'assets/logo.png',
          height: 80, // balanced size
        ),
      ),
      body: SingleChildScrollView(
        controller: ScrollController(),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            children: [
              const SizedBox(height: 50),
              const Center(
                child: Text(
                  "Confirm Reset Password",
                  style: TextStyle(fontSize: 25, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(height: 50),

              // Display the email
              TextFormField(
                initialValue: widget.email,
                readOnly: true,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
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
              const SizedBox(height: 20),

              // Confirmation code input
              TextFormField(
                controller: _codeController,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  floatingLabelBehavior: FloatingLabelBehavior.never,
                  labelText: 'Confirmation Code',
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
                keyboardType: TextInputType.number,
                maxLength: 6,
                buildCounter: (context,
                    {required currentLength, required isFocused, maxLength}) {
                  return null; // Hide the counter
                },
                inputFormatters: [
                  TextInputFormatter.withFunction((oldValue, newValue) {
                    String digitsOnly =
                    newValue.text.replaceAll(RegExp(r'[^0-9]'), '');
                    if (digitsOnly.length > 6) {
                      digitsOnly = digitsOnly.substring(0, 6);
                    }
                    return TextEditingValue(
                      text: digitsOnly,
                      selection:
                      TextSelection.collapsed(offset: digitsOnly.length),
                    );
                  }),
                ],
              ),
              const SizedBox(height: 10),

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
                        color: _resendCountdown == 0
                            ? Colors.blue
                            : Colors.grey,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              // New password input
              TextFormField(
                controller: _newPasswordController,
                obscureText: !_isPasswordVisible,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  floatingLabelBehavior: FloatingLabelBehavior.never,
                  labelText: 'New Password',
                  labelStyle: const TextStyle(color: Colors.white),
                  border: const OutlineInputBorder(
                    borderSide: BorderSide(color: Colors.white),
                  ),
                  enabledBorder: const OutlineInputBorder(
                    borderSide: BorderSide(color: Colors.white),
                  ),
                  focusedBorder: const OutlineInputBorder(
                    borderSide: BorderSide(color: Colors.white, width: 2.0),
                  ),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _isPasswordVisible
                          ? Icons.visibility
                          : Icons.visibility_off,
                      color: Colors.white,
                    ),
                    onPressed: () {
                      setState(() {
                        _isPasswordVisible = !_isPasswordVisible;
                      });
                    },
                  ),
                ),
                cursorColor: Colors.white,
              ),
              const SizedBox(height: 20),

              // Confirm new password input
              TextFormField(
                controller: _confirmPasswordController,
                obscureText: !_isConfirmPasswordVisible,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  floatingLabelBehavior: FloatingLabelBehavior.never,
                  labelText: 'Confirm New Password',
                  labelStyle: const TextStyle(color: Colors.white),
                  border: const OutlineInputBorder(
                    borderSide: BorderSide(color: Colors.white),
                  ),
                  enabledBorder: const OutlineInputBorder(
                    borderSide: BorderSide(color: Colors.white),
                  ),
                  focusedBorder: const OutlineInputBorder(
                    borderSide: BorderSide(color: Colors.white, width: 2.0),
                  ),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _isConfirmPasswordVisible
                          ? Icons.visibility
                          : Icons.visibility_off,
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
              const SizedBox(height: 100),

              // Reset button
              ElevatedButton(
                onPressed: resetPassword,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2644D9),
                  foregroundColor: Colors.black,
                  padding: const EdgeInsets.symmetric(
                      horizontal: 50, vertical: 15),
                ),
                child: const Text(
                  'Reset Password',
                  style: TextStyle(
                      fontSize: 18,
                      color: Colors.white,
                      fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}