// detailed_bio.dart
import 'package:flutter/material.dart';
import 'package:voiceapp/main.dart';

class DetailedBioPage extends StatelessWidget {
  final String artistName;
  final int followerCount;
  final String bio;

  DetailedBioPage({
    required this.artistName,
    required this.followerCount,
    required this.bio,
  });

  String getInitials(String fullName) {
    // Trim the full name to remove any leading or trailing spaces
    fullName = fullName.trim();

    if (fullName.isEmpty) {
      return ""; // Return empty string if the fullName is empty
    }

    // Split the full name by space and remove any empty elements (if any)
    List<String> nameParts = fullName.split(RegExp(r'\s+'));

    if (nameParts.length == 1) {
      // If only one name is provided, use the first letter of that name
      return nameParts[0][0].toUpperCase();
    } else if (nameParts.length > 1) {
      // If both first and last names are provided, use the first letter of both
      return nameParts[0][0].toUpperCase() + nameParts[1][0].toUpperCase();
    } else {
      return ""; // Return an empty string if no valid name parts are found
    }
  }

  @override
  Widget build(BuildContext context) {
    return GradientScaffold(
      //backgroundColor: Colors.blueGrey[900], // Dark background color
      body: SingleChildScrollView(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          // Stack to overlay the circular profile image on top of the album cover
          Container(
            height:
                250, // Increase height to provide enough space for CircleAvatar
            child: Stack(
              alignment: Alignment.center,
              clipBehavior: Clip
                  .none, // This allows the CircleAvatar to overflow the container
              children: [
                // Single large album cover at the top
                Container(
                  height: 200,
                  width: double.infinity,
                  child: ClipRRect(
                    borderRadius: BorderRadius.only(
                      bottomLeft: Radius.circular(30),
                      bottomRight: Radius.circular(30),
                    ),
                    child: Image.asset(
                      'assets/artist.jpg', // Your single album cover image
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
                // Circular profile image overlayed on top of the album cover
                Positioned(
                  bottom: -20, // Adjust position to overlap the cover
                  child: CircleAvatar(
                    radius: 50,
                    backgroundColor:
                        Colors.grey, // Grey background for the avatar
                    child: Text(
                      getInitials(artistName), // Display the initials
                      style: TextStyle(
                        color:
                            Colors.white, // White text color for the initials
                        fontWeight: FontWeight.bold,
                        fontSize: 40,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          SizedBox(height: 20), // Add space to avoid overlap with the avatar

          // Profile details below the album and avatar
          Center(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              mainAxisAlignment: MainAxisAlignment
                  .spaceBetween, // Changed to spaceBetween to position items on either end
              children: [
                Flexible(
                  // Allow this part to take available space
                  child: Center(
                    child: Column(
                      crossAxisAlignment:
                          CrossAxisAlignment.start, // Align items to the left
                      children: [
                        Padding(
                          padding: const EdgeInsets.fromLTRB(50, 0, 0, 0),
                          child: Text(
                            artistName,
                            style: TextStyle(
                              fontSize: 24,
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.fromLTRB(60, 0, 0, 0),
                          child: Text(
                            '${followerCount} Followers',
                            style: TextStyle(
                              fontSize: 16,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                IconButton(
                  icon: Icon(Icons.share, color: Colors.white),
                  onPressed: () {
                    // Share functionality
                  },
                ),
              ],
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(30.0),
            child: Text("About SInger :",
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
          ),

          //SizedBox(height: 5),
          Padding(
            padding: const EdgeInsets.fromLTRB(30, 0, 20, 0),
            child: Text(bio),
          ),
        ]),
      ),
    );
  }
}
