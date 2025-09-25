// Song Upload/upload_selection_page.dart (Fixed version)
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:voiceapp/Song%20Upload/upload_multiple_songs.dart';
import 'package:voiceapp/Song%20Upload/uploadsong1.dart';
import 'package:voiceapp/main.dart';
import 'package:voiceapp/connectivity_service.dart';
import 'package:voiceapp/loading_screen.dart';
import 'package:voiceapp/NewHomepage.dart';
import '../bottomnavigationbar.dart';

class UploadSelectionPage extends StatefulWidget {
  final String email;
  final String fullName;
  final bool showGlobalNavBar;
  final bool isFromNewHomePage;

  UploadSelectionPage({
    required this.email,
    required this.fullName,
    this.showGlobalNavBar = false,
    this.isFromNewHomePage = false,
  });

  @override
  _UploadSelectionPageState createState() => _UploadSelectionPageState();
}

class _UploadSelectionPageState extends State<UploadSelectionPage> {
  bool _isLoading = false;
  bool _isNoInternet = false;
  late ConnectivityService _connectivityService;
  bool _mounted = true;

  @override
  void initState() {
    super.initState();
    _connectivityService = ConnectivityService();
    _setupConnectivityListener();
  }

  void _setupConnectivityListener() {
    _connectivityService.connectionStream.listen((hasConnection) {
      if (!_mounted || _connectivityService.isClosed) return;

      setState(() {
        _isNoInternet = !hasConnection;
      });
    });

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
    super.dispose();
  }

  // Handle back button press - navigate to home page
  Future<bool> _onWillPop() async {
    if (widget.isFromNewHomePage) {
      // If opened from NewHomePage, just pop back
      return true; // Allow normal pop
    } else {
      // Navigate to home page
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => NewHomePage(
            email: widget.email,
            category: 'Singer',
            userfullname: widget.fullName,
          ),
        ),
      );
      return false; // Prevent default pop
    }
  }

  void _handleBackPress() {
    if (widget.isFromNewHomePage) {
      // If we can pop, just pop to go back to the previous screen
      if (Navigator.of(context).canPop()) {
        Navigator.of(context).pop();
      } else {
        // If no route to pop, ensure we have a proper home screen in the stack
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(
            builder: (context) => NewHomePage(
              email: widget.email,
              category: 'Singer',
              userfullname: widget.fullName,
            ),
          ),
          (Route<dynamic> route) => false,
        );
      }
    } else {
      // If not from home page, replace the entire stack with home
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(
          builder: (context) => NewHomePage(
            email: widget.email,
            category: 'Singer',
            userfullname: widget.fullName,
          ),
        ),
        (Route<dynamic> route) => false,
      );
    }
  }

  void _navigateToSingleUpload() {
    if (_isNoInternet) {
      _showNoInternetSnackBar();
      return;
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => UploadSongFirstPage(
          email: widget.email,
          fullName: widget.fullName,
          showGlobalNavBar: true,
          isFromNewHomePage: false,
        ),
      ),
    );
  }

  void _navigateToMultipleUpload() {
    if (_isNoInternet) {
      _showNoInternetSnackBar();
      return;
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => UploadMultipleSongsPage(
          email: widget.email,
          fullName: widget.fullName,
          // showGlobalNavBar: true,
          isFromNewHomePage: false,
        ),
      ),
    );
  }

  void _showNoInternetSnackBar() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('No internet connection. Please check your connection and try again.'),
        duration: Duration(seconds: 3),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    double screenHeight = MediaQuery.of(context).size.height;

    Widget content = WillPopScope( // Use WillPopScope instead of PopScope
      onWillPop: _onWillPop,
      child: GradientScaffold(
        appBar: AppBar(
          automaticallyImplyLeading: true,
          backgroundColor: Colors.transparent,
          toolbarHeight: kToolbarHeight + 15,
          elevation: 0,
          leading: IconButton(
            icon: Icon(Icons.arrow_back, color: Colors.white),
            onPressed: _handleBackPress,
          ),
          title: Text(
            'Upload Songs',
            style: TextStyle(
              fontSize: 24,
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        body: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.only(left: 16.0,right: 16.0,bottom: 16.0,top: 0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                SizedBox(height: screenHeight * 0),

                // Title
                Text(
                  "Choose Upload Type",
                  style: TextStyle(
                    fontSize: 32,
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),

                SizedBox(height: screenHeight * 0.04),

                // Subtitle
                Text(
                  "Select how you want to upload your music",
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.white.withOpacity(0.8),
                  ),
                  textAlign: TextAlign.center,
                ),

                SizedBox(height: screenHeight * 0.04),

                // Single Upload Option
                _buildUploadOption(
                  context: context,
                  title: "Upload Single Song",
                  subtitle: "Upload one song at a time",
                  icon: Icons.music_note,
                  onTap: _navigateToSingleUpload,
                  color: Color(0xFF2644D9),
                ),

                SizedBox(height: 20),

                // Multiple Upload Option
                _buildUploadOption(
                  context: context,
                  title: "Upload Multiple Songs",
                  subtitle: "Upload multiple songs together",
                  icon: Icons.library_music,
                  onTap: _navigateToMultipleUpload,
                  color: Color(0xFF9C27B0),
                ),

                SizedBox(height: screenHeight * 0.15),

                // Info text
                Container(
                  padding: EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.info_outline,
                        color: Colors.white.withOpacity(0.8),
                        size: 20,
                      ),
                      SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          "You can always come back and upload more songs later",
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.8),
                            fontSize: 14,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                SizedBox(height: kBottomNavigationBarHeight + 20),
              ],
            ),
          ),
        ),
      ),
    );

    Widget finalWidget;
    if (widget.isFromNewHomePage) {
      finalWidget = Stack(
        children: [
          content,
          LoadingScreen(
            isLoading: _isLoading,
            isNoInternet: _isNoInternet,
            onRetry: _checkConnectivity,
          ),
        ],
      );
    } else {
      finalWidget = Stack(
        children: [
          PageWithBottomNav(
            child: content,
            email: widget.email,
            fullName: widget.fullName,
            category: 'Singer',
            currentIndex: 2,
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

    return finalWidget;
  }

  Widget _buildUploadOption({
    required BuildContext context,
    required String title,
    required String subtitle,
    required IconData icon,
    required VoidCallback onTap,
    required Color color,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: Colors.white.withOpacity(0.2),
            width: 1,
          ),
        ),
        child: Column(
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: color.withOpacity(0.2),
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                size: 40,
                color: color,
              ),
            ),
            SizedBox(height: 20),
            Text(
              title,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 8),
            Text(
              subtitle,
              style: TextStyle(
                fontSize: 14,
                color: Colors.white.withOpacity(0.7),
              ),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 16),
            Container(
              padding: EdgeInsets.symmetric(horizontal: 24, vertical: 8),
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                "Select",
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}