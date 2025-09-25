// refer.dart
import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import 'package:voiceapp/main.dart';


class ReferPage extends StatelessWidget {
  final String referralLink;

  ReferPage({required this.referralLink});

  // Function to handle sharing
  void _shareContent(BuildContext context, String content) {
    Share.share(content);
  }

  @override
  Widget build(BuildContext context) {
    return GradientScaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios, color: Colors.white),
          onPressed: () {
            Navigator.of(context).pop();
          },
        ),
        title: Image.asset(
          'assets/logo.png', // Your logo asset
          height: 50,
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            // App Logo and Message
            SizedBox(height: 20),
            Image.asset(
              'assets/logo.png', // Replace with your app logo
              height: 100,
            ),
            SizedBox(height: 20),
            Text(
              'Amazing App for independent music!',
              style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 20),

            // Display the deep link
            GestureDetector(
              onTap: () {
                _shareContent(context, referralLink);
              },
              child: Text(
                referralLink,
                style: TextStyle(
                  color: Colors.blue,
                  fontSize: 18,
                  decoration: TextDecoration.underline,
                ),
              ),
            ),
            SizedBox(height: 10),
            Text('Tap to copy link', style: TextStyle(color: Colors.grey)),

            // Placeholder for recent contacts (if any)
            SizedBox(height: 20),
            Text(
              'Recent Contacts',
              style: TextStyle(color: Colors.grey, fontSize: 16),
            ),
            SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: List.generate(
                4,
                (index) => CircleAvatar(
                  backgroundColor: Colors.grey[800],
                  radius: 25,
                ),
              ),
            ),

            // Sharing buttons
            Spacer(),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildShareButton(
                  icon: Icons.facebook,
                  onPressed: () {
                    _shareContent(context, 'Check out this app: $referralLink');
                  },
                ),
                _buildShareButton(
                  icon: Icons.facebook,
                  onPressed: () {
                    _shareContent(context, 'Check out this app: $referralLink');
                  },
                ),
                _buildShareButton(
                  icon: Icons.mail,
                  onPressed: () {
                    _shareContent(context, 'Check out this app: $referralLink');
                  },
                ),
                _buildShareButton(
                  icon: Icons.copy,
                  onPressed: () {
                    // You can add logic to copy to clipboard if needed
                    _shareContent(context, 'Check out this app: $referralLink');
                  },
                ),
              ],
            ),
            SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildShareButton({required IconData icon, required VoidCallback onPressed}) {
    return CircleAvatar(
      radius: 30,
      backgroundColor: Colors.grey[850],
      child: IconButton(
        icon: Icon(icon, color: Colors.white, size: 30),
        onPressed: onPressed,
      ),
    );
  }
}
