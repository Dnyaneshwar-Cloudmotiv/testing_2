import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'bottomnavigationbar.dart';
import 'main.dart';
import 'package:voiceapp/connectivity_service.dart';
import 'package:voiceapp/loading_screen.dart';

class AboutUsScreen extends StatefulWidget {

  final String userId;
  final String userfullname;
  final String category;

  AboutUsScreen({required this.userId,required this.userfullname,required this.category});



  @override
  _AboutUsScreenState createState() => _AboutUsScreenState();
}

class _AboutUsScreenState extends State<AboutUsScreen> {
  String _version = '';
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
    _getAppVersion();
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
      await _getAppVersion();

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

  Future<void> _getAppVersion() async {
    final PackageInfo packageInfo = await PackageInfo.fromPlatform();
    setState(() {
      _version = packageInfo.version;
    });
  }

  @override
  Widget build(BuildContext context) {
    Widget content = GradientScaffold(
      //backgroundColor: const Color(0xFF1A1B2E), // Dark blue background
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
      body: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,

          children: [

            SizedBox(height: 50,),
            // Version section
            Center(
              child: Padding(
                padding: const EdgeInsets.only(right: 245.0),
                child: const Text(
                  'About',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight:  FontWeight.bold
                  ),
                ),
              ),
            ),
            SizedBox(height: 30,),
            Padding(
              padding: const EdgeInsets.only(left: 20,right: 20),
              child: Row(
                children: [
                  const Text(
                    'Version',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                    ),
                  ),
                  Spacer(),
                  Text(
                    _version,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.only(left: 18.0,right: 18),
              child: Divider(
                color: Colors.white,
                thickness: 1,
              ),
            ),

          ],
        ),
      ),

    );

    return Stack(
      children:[ PageWithBottomNav(
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