import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import 'NewHomepage.dart';
import 'ProfilePage.dart';
import 'SearchPage.dart';
import 'Song Upload/upload_selection_page.dart';
import 'Song Upload/uploadsong1.dart';
import 'main.dart';

class PageWithBottomNav extends StatelessWidget {
  final Widget child;
  final String email;
  final String fullName;
  final String category;
  final int currentIndex;
  final bool isFromNewHomePage;
  final Widget? nowPlayingTile;
  // Add a callback for handling custom navigation
  final Function(int)? onNavigate;

  PageWithBottomNav({
    required this.child,
    required this.email,
    required this.fullName,
    required this.category,
    required this.currentIndex,
    this.isFromNewHomePage = false,
    this.nowPlayingTile,
    this.onNavigate, // Add this new parameter
  });

  List<BottomNavigationBarItem> _buildNavigationItems() {
    final items = [
      BottomNavigationBarItem(
        icon: Image.asset('assets/home.png', height: 22),
        label: 'Home',
      ),
      BottomNavigationBarItem(
        icon: Image.asset('assets/explore.png', height: 20),
        label: 'Explore',
      ),
    ];

    // Add upload option only for singers
    if (category == 'Singer') {
      items.add(BottomNavigationBarItem(
        icon: Image.asset('assets/add.png', height: 20),
        label: 'Add',
      ));
    }

    // Add library option for all users
    items.add(BottomNavigationBarItem(
      icon: Image.asset('assets/library.png', height: 20),
      label: 'Library',
    ));

    return items;
  }

  int _adjustedIndex(int index) {
    // For listeners, if the index is 3 (library), adjust it to 2
    if (category != 'Singer' && index == 3) {
      return 2;
    }
    return index;
  }

  void _handleNavigation(BuildContext context, int index) {
    // First, check if custom navigation handler is provided
    if (onNavigate != null) {
      onNavigate!(index);
      return;
    }

    // Skip navigation if tapping the current tab
    if (index == _adjustedIndex(currentIndex)) return;

    Widget nextPage;
    switch (index) {
      case 0:
        nextPage = NewHomePage(
          email: email,
          category: category,
          userfullname: fullName,
        );
        break;
      case 1:
        nextPage = SearchPage(
          email: email,
          userCategory: category,
          userfullname: fullName,
        );
        break;
      case 2:
        if (category == 'Singer') {
          nextPage = UploadSelectionPage(
            email: email,
            fullName: fullName,
          );
        } else {
          // For listeners, index 2 is the library
          nextPage = ProfilePage(
            userCategory: category,
            email: email,
            userfullname: fullName,
          );
        }
        break;
      case 3:
        if (category == 'Singer') {
          nextPage = ProfilePage(
            userCategory: category,
            email: email,
            userfullname: fullName,
          );
        } else {
          return;
        }
        break;
      default:
        return;
    }

    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (context) => nextPage),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: true,
      body: Column(
        children: [
          // Main content
          Expanded(
            child: child,
          ),

          // Now Playing Tile (if provided)
          if (nowPlayingTile != null && !isFromNewHomePage) nowPlayingTile!,
        ],
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          border: Border(
            top: BorderSide(
              color: Colors.white,
              width: 1.0,
            ),
          ),
        ),
        child: BottomNavigationBar(
          currentIndex: _adjustedIndex(currentIndex),
          onTap: (index) => _handleNavigation(context, index),
          selectedItemColor: Colors.blue,
          unselectedItemColor: Colors.white,
          type: BottomNavigationBarType.fixed,
          items: _buildNavigationItems(),
        ),
      ),
    );
  }
}




