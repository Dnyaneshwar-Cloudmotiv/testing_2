import 'dart:convert';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:amplify_flutter/amplify_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:voiceapp/profile_manager.dart';
import 'package:voiceapp/services/background_task_service.dart';
import 'package:voiceapp/services/api_service.dart';

import 'audio_service1.dart';
import 'bottomnavigationbar.dart';
import 'main.dart';

class AccountDeletionPage extends StatefulWidget {

  final String userId;
  final String userfullname;
  final String category;

  AccountDeletionPage({required this.userId,required this.userfullname,required this.category});


  @override
  _AccountDeletionPageState createState() => _AccountDeletionPageState();
}

class _AccountDeletionPageState extends State<AccountDeletionPage> {
  bool _isLoading = false;
  bool _isSigningOut = false;

  // Replace with your server's API endpoint for account deletion
  Future<void> _deleteAccount() async {
    setState(() {
      _isSigningOut = true; // Reuse the _isSigningOut flag for account deletion
    });

    try {
      print('Starting account deletion process...');

      // Register the background task to ensure completion even if app is closed
      await BackgroundTaskService().registerAccountDeletionTask();
      print('Background account deletion task registered');

      // Continue with immediate UI cleanup and user feedback
      try {
        // Step 1: Call your server API to delete account-related data
        final userId = ProfileManager().getUserId();
        if (userId == null) {
          throw Exception('User ID not found. Cannot proceed with account deletion.');
        }
        
        final success = await ApiService.deleteUserAccount(userId);

        if (!success) {
          print('Warning: Server deletion request failed');
          print('Continuing with background task to ensure completion');
        } else {
          print('Account successfully deleted on the server.');
        }

        // Step 2: Delete the user from AWS Cognito
        print('Attempting to delete user from Cognito...');
        await Amplify.Auth.deleteUser();
        print('User successfully deleted from Cognito.');

        // Step 3: Start UI cleanup immediately
        print('Starting immediate UI cleanup...');
        ProfileManager().clear();
        ProfileManager.resetInstance();
        print('Profile manager reset');

        // Step 4: Clear notifications
        print('Clearing notifications...');
        await flutterLocalNotificationsPlugin.cancelAll();

        // Step 5: Navigate to the FirstPage
        print('Navigating to the FirstPage...');
        _navigateToFirstPage();

      } catch (e) {
        print('Error during immediate account deletion operations: $e');
        print('Continuing with background task to ensure completion');
        _navigateToFirstPage(); // Still navigate away even if there's an error
      }

    } catch (e) {
      print('Error during account deletion: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to delete account: $e')),
        );
      }
    } finally {
      setState(() {
        _isSigningOut = false;
      });
      print('Account deletion process initiated.');
    }
  }

  void _showDeleteAccountConfirmationDialog(BuildContext context) {
    showDialog(
      context: context,
      barrierDismissible: true,
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
                    elevation: 20,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20.0),
                    ),
                    child: Container(
                      padding: EdgeInsets.symmetric(vertical: 20, horizontal: 16),
                      decoration: BoxDecoration(
                        color: Color(0xFF151415),
                        borderRadius: BorderRadius.circular(20.0),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.4),
                            spreadRadius: 5,
                            blurRadius: 15,
                            offset: Offset(0, 6), // changes position of shadow
                          ),
                        ]
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Center(
                            child: Text(
                              textAlign: TextAlign.center,
                              'Delete your account?',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 24,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          SizedBox(height: 20),
                          Padding(
                            padding: EdgeInsets.symmetric(horizontal: 16),
                            child: Text(
                              'Deleting your account will permanently erase all your data from this device, '
                              'including your previously played songs, preferences, and listening history. '
                              'This action cannot be undone. Are you sure you want to continue?',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: Colors.white70,
                                fontSize: 16,
                              ),
                            ),
                          ),
                          SizedBox(height: 20),
                          if (_isSigningOut) ...[
                            CircularProgressIndicator(color: Colors.blue),
                            SizedBox(height: 20),
                            Text(
                              'Deleting account... Please wait',
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
                                      fontSize: 18,
                                    ),
                                  ),
                                ),
                                TextButton(
                                  onPressed: () async {
                                    setDialogState(() {
                                      _isSigningOut = true;
                                    });
                                    await _deleteAccount();
                                    setDialogState(() {
                                      _isSigningOut = false;
                                    });
                                    Navigator.of(dialogContext).pop();
                                  },
                                  child: Text(
                                    'Delete',
                                    style: TextStyle(
                                      color: Colors.red,
                                      fontSize: 18,
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

  void _navigateToFirstPage() {
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


  @override
  Widget build(BuildContext context) {
    print("Building AccountDeletionPage UI...");
    Widget content = GradientScaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        backgroundColor: Colors.transparent,
        titleSpacing: 0, // Remove extra spacing
        leadingWidth: 10, // Set the width for the leading icon to reduce space
        title: Row(
          children: [
            IconButton(
              icon: Icon(Icons.arrow_back_ios, color: Colors.white),
              onPressed: () {
                print("Navigating back to the previous screen...");
                Navigator.of(context).pop(); // Go back to the previous screen
              },
            ),
            // Image.asset(
            //   'assets/logo.png', // Your logo asset
            //   height: 50, // Logo height
            // ),
          ],
        ),
      ),
      body: _isLoading
          ? Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 15),
            Text(
              "Processing account deletion...",
              style: TextStyle(color: Colors.white),
            )
          ],
        ),
      )
          : Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.start,
            children: [
              SizedBox(height: 80),
              Text(
                'Your data will be permanently removed. Confirm to proceed. ',
                style: TextStyle(color: Colors.white, fontSize: 22),
                textAlign: TextAlign.center,
              ),
              SizedBox(height: 120),
              ElevatedButton(
                onPressed: () {
                  _showDeleteAccountConfirmationDialog(context); // Show confirmation dialog
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Color(0xFF2644D9),
                  padding: EdgeInsets.symmetric(horizontal: 50, vertical: 15),
                ),
                child: Text(
                  'Delete Account',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 20,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
    return PageWithBottomNav(
      child: content,
      email: widget.userId,
      fullName: widget.userfullname,
      category: widget.category,
      currentIndex: 3,  // 1 is for Search page
      isFromNewHomePage: false,
    );
  }
}
