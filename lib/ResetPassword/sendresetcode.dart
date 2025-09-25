// ResetPassword/sendresetcode.dart
import 'package:flutter/material.dart';
import 'package:amplify_flutter/amplify_flutter.dart';
import 'package:voiceapp/ResetPassword/confirmationcode.dart';
import 'package:voiceapp/main.dart';



class SendResetCodePage extends StatefulWidget {
  @override
  _SendResetCodePageState createState() => _SendResetCodePageState();
}

class _SendResetCodePageState extends State<SendResetCodePage> {
  final _emailController = TextEditingController();

  Future<void> sendResetCode() async {
    if (_emailController.text.isEmpty) {
      _showMessage('Email cannot be empty.');
      return;
    }

    try {
      await Amplify.Auth.resetPassword(username: _emailController.text.trim());
      _showMessage('Password reset code sent to your email.');

      // Navigate to the confirmation page
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) =>
              ConfirmResetPasswordPage(
                email: _emailController.text.trim(),
              ),
        ),
      );
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
          height: 80,
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
                  "Reset Password",
                  style: TextStyle(fontSize: 25, fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(height: 30),
              TextFormField(
                controller: _emailController,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  floatingLabelBehavior: FloatingLabelBehavior.never,
                  labelText: 'Email ID',
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
              const SizedBox(height: 40),
              ElevatedButton(
                onPressed: sendResetCode,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2644D9),
                  foregroundColor: Colors.black,
                  padding:
                  const EdgeInsets.symmetric(horizontal: 50, vertical: 15),
                ),
                child: const Text(
                  'Send Reset Code',
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
