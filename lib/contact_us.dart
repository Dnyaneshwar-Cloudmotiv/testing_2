// contact_us.dart
import 'package:flutter/material.dart';
import 'package:voiceapp/main.dart';

import 'bottomnavigationbar.dart';
import 'package:voiceapp/connectivity_service.dart';
import 'package:voiceapp/loading_screen.dart';

class SupportPage extends StatefulWidget {
  final String userId;
  final String userfullname;
  final String category;

  SupportPage({required this.userId,required this.userfullname,required this.category});
  @override
  State<SupportPage> createState() => _SupportPageState();
}

class _SupportPageState extends State<SupportPage> {
  bool _isLoading = true;
  bool _isNoInternet = false;
  late ConnectivityService _connectivityService;
  bool _mounted = true;

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
  @override
  Widget build(BuildContext context) {
    Widget content = GradientScaffold(
      //backgroundColor: const Color(0xFF27364D), // Set background color to match the image
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
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.start,
          children: [
            // Image.asset(
            //   'assets/logo.png', // Your logo asset (replace with correct path)
            //   height: 80,
            // ),
            SizedBox(height: 50),
            Text(
              'Email Support:',
              style: TextStyle(
                fontSize: 20,
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 5),
            if(widget.category=="Singer")...[
            
              Text(
              'info@voiz.co.in',
              style: TextStyle(
                fontSize: 18,
                color: Colors.white,decoration: TextDecoration.underline,
              ),
            )]
            else...[
             Text(
              'info@voiz.co.in',
              style: TextStyle(
                fontSize: 18,
                color: Colors.white,decoration: TextDecoration.underline,
              ),
            ),

            ],
            
          ],
        ),
      ),
      
    );

    return Stack(
      children:[
        PageWithBottomNav(
          child: content,
          email: widget.userId,
          fullName: widget.userfullname,
          category: widget.category,
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
