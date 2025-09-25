// integration_example.dart
// This file shows how to integrate ShareSongHandler into your app

import 'package:flutter/material.dart';
import 'package:voiceapp/share_song_handler.dart';
import 'package:voiceapp/splash_screen.dart';

// 1. In your main app widget (MyApp class), initialize the handler:
class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Voiz App',
      home: Builder(
        builder: (context) {
          // Initialize dynamic links handling
          ShareSongHandler.instance.initializeDynamicLinks(context);
          return SplashScreen(); // Replace with your actual home page
        },
      ),
    );
  }
}

// 2. In your NewHomepage.dart, replace the existing dynamic link logic with:
class NewHomePageIntegration {
  void initializeDynamicLinksInHomepage(BuildContext context) {
    // Remove all existing dynamic link code from NewHomepage.dart
    // and replace with this single line:
    ShareSongHandler.instance.initializeDynamicLinks(context);
  }
}

// 3. Usage in any screen where you want to handle shared songs:
class ExampleUsage extends StatefulWidget {
  @override
  _ExampleUsageState createState() => _ExampleUsageState();
}

class _ExampleUsageState extends State<ExampleUsage> {
  @override
  void initState() {
    super.initState();
    // Initialize dynamic links for this screen
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ShareSongHandler.instance.initializeDynamicLinks(context);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Example')),
      body: Center(
        child: Text('Dynamic links will be handled automatically'),
      ),
    );
  }
}

