// additionalinfo.dart
import 'dart:ui';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:http/http.dart' as http;
import 'package:voiceapp/main.dart';

import 'dart:convert';
import 'NewHomepage.dart';
import 'package:intl/intl.dart';

import 'package:url_launcher/url_launcher.dart';
import 'package:voiceapp/services/api_service.dart';

class AddinfoPage extends StatefulWidget {
  final String email;
  final String userId;  // Add this line

  // AddinfoPage({required this.email});
  const AddinfoPage({
    Key? key,
    required this.email,
    required this.userId,  // Add this line
  }) : super(key: key);

  @override
  _AddinfoPageState createState() => _AddinfoPageState();
}

class _AddinfoPageState extends State<AddinfoPage> {
  final TextEditingController _ageController = TextEditingController();
  final TextEditingController _fullNameController = TextEditingController();
  final TextEditingController _stageNameController = TextEditingController(); // Controller for Stage Name
  final TextEditingController _mobileNumberController = TextEditingController();

  String? _selectedCategory;
  String? _selectedGender;
  String? _userId;
  FirebaseMessaging messaging = FirebaseMessaging.instance;
  bool _isRegistering = false;


  bool _validateFields() {
    if (_fullNameController.text.isEmpty) {
      _showErrorMessage('Name is mandatory');
      return false;
    }

    // Name validation - check for basic name format
    String name = _fullNameController.text.trim();
    
    // Check if name contains only valid characters (letters, spaces, hyphens, apostrophes)
    RegExp nameRegex = RegExp(r"^[a-zA-Z\s\-']+$");
    if (!nameRegex.hasMatch(name)) {
      _showErrorMessage('Please enter a valid name (letters only)');
      return false;
    }

    // Check minimum length (at least 2 characters)
    if (name.length < 2) {
      _showErrorMessage('Name must be at least 2 characters long');
      return false;
    }

    if (_mobileNumberController.text.isEmpty) {
      _showErrorMessage('Phone number is mandatory');
      return false;
    }

    if (_mobileNumberController.text.length < 10) {
      _showErrorMessage('Enter a valid phone number');
      return false;
    }

    if (_selectedGender == null) {
      _showErrorMessage('Please select your gender');
      return false;
    }

    if (_ageController.text.isEmpty) {
      _showErrorMessage('Age is mandatory');
      return false;
    }

    // Age validation for 10-99 years range
    int? age = int.tryParse(_ageController.text);
    if (age == null || age < 10 || age > 99) {
      _showErrorMessage('Age must be between 10 and 99 years');
      return false;
    }

    if (_selectedCategory == null) {
      _showErrorMessage('Please select a category');
      return false;
    }

    return true;
  }

  // Method to show a SnackBar with the error message
  void _showErrorMessage(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.white, // Change color to highlight error
        duration: Duration(seconds: 2),
      ),
    );
  }

  Widget buildTextFieldforstagename(
      TextEditingController controller, String label, {
        bool required = true,
        String? infoText,
        String? errorText,
        bool enabled = true,
      }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            child: TextField(
              enabled: enabled,
              controller: controller,
              style: TextStyle(color: Colors.black,decorationThickness: 0),
              decoration: InputDecoration(
                label: RichText(
                  text: TextSpan(
                    text: label, // Main label text (e.g., 'Name')
                    style: TextStyle(color: Colors.black, fontSize: 16,fontFamily: 'Poppins',), // Default label style
                    children: required
                        ? [
                      // TextSpan(
                      //   text: ' *', // Asterisk for required fields
                      //   style: TextStyle(color: Colors.black), // Red asterisk
                      // ),
                    ]
                        : [], // No asterisk if not required
                  ),
                ),
                labelStyle: TextStyle(color: Colors.black),
                fillColor: Colors.white.withOpacity(0.8),
                filled: true,
                floatingLabelBehavior: FloatingLabelBehavior.never, // Label doesn't shift
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8.0),
                  borderSide: BorderSide(color: Colors.black, width: 1.0),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8.0),
                  borderSide: BorderSide(color: Colors.black, width: 1.0),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8.0),
                  borderSide: BorderSide(color: Colors.black, width: 2.0),
                ),
                suffixIcon: infoText != null
                    ? InfoIconWithCustomTooltip(title: label,infoText: infoText)
                    : null,
              ),
              cursorColor: Colors.black,
            ),
          ),
          if (errorText != null)
            Padding(
              padding: const EdgeInsets.only(top: 4.0),
              child: Text(
                errorText,
                style: TextStyle(color: Colors.red, fontSize: 12),
              ),
            ),
        ],
      ),
    );
  }

  String capitalizeWords(String input) {
    if (input.isEmpty) return input;

    return input
        .split(' ')
        .map((word) {
      if (word.isEmpty) return word;
      return word[0].toUpperCase() + word.substring(1).toLowerCase();
    })
        .join(' ');
  }

  Future<void> registerUser() async {
    // Debug prints
    print('Debug - widget.userId: ${widget.userId}');
    print('Debug - widget.email: ${widget.email}');

    if (!_validateFields()) {
      return;
    }

    setState(() {
      _isRegistering = true;
    });

    try {
      final DateFormat dateFormat = DateFormat('yyyy-MM-dd');
      final String registrationDate = dateFormat.format(DateTime.now());
      final String timestamp = DateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'").format(DateTime.now().toUtc());

      // Capitalize the full name
      String capitalizedFullName = capitalizeWords(_fullNameController.text.trim());

      // Capitalize the stage name if it's not empty
      String capitalizedStageName = _stageNameController.text.trim().isNotEmpty
          ? capitalizeWords(_stageNameController.text.trim())
          : '';

      final profileData = {
        "user_id": widget.userId,  // Directly use widget.userId
        "FullName": capitalizedFullName,
        "Age": _ageController.text.trim(),
        "Category": _selectedCategory,
        "Gender": _selectedGender,
        "registrationDate": registrationDate,
        "StageName": capitalizedStageName,
        "PhoneNumber": _mobileNumberController.text.trim(),
        "createdTimestamp": timestamp,
        "updatedTimestamp": timestamp,
        "device": "Android",
        "lastLogin":"Android",
      };

      print('Debug - Update profile request body: ${jsonEncode(profileData)}');

      final updateResponse = await ApiService.updateUserProfile(profileData);

      print('Debug - Update profile response: ${updateResponse.statusCode} - ${updateResponse.body}');

      if (updateResponse.statusCode == 200) {
        await fetchUserId(widget.email);
      } else {
        throw Exception('Profile update failed: ${updateResponse.body}');
      }
    } catch (error) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $error')),
      );
      print('Error: $error');
    } finally {
      setState(() {
        _isRegistering = false;
      });
    }
  }

  Future<void> fetchUserId(String email) async {
    try {
      final response = await ApiService.getUserIdByEmail(email);

      if (response.statusCode == 200) {
        final List<dynamic> responseBody = jsonDecode(response.body); // Parse as a list

        if (responseBody.isNotEmpty) {
          final userData = responseBody[0]; // Access the first item in the list

          setState(() {
            _userId = userData['user_id']?['S']; // Extract user_id from the 'S' field
            _selectedCategory = userData['Category']?['S']; // Extract category
            _fullNameController.text = userData['FullName']?['S'] ?? ''; // Extract FullName
            _stageNameController.text = userData['StageName']?['S'] ?? ''; // Extract StageName
          });

          print('User ID: $_userId');

          // Determine what to pass as the username: StageName or FullName
          String userNameToPass = _stageNameController.text.isNotEmpty
              ? _stageNameController.text // Pass StageName if it's not empty
              : _fullNameController.text;  // Otherwise, pass FullName

          print('UserName: $userNameToPass');

          // Navigate to NewHomePage with the appropriate userNameToPass
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (context) => NewHomePage(
                email: _userId!,
                category: _selectedCategory!,
                userfullname: userNameToPass,
              ),
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('No user data found')),
          );
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to fetch User ID. Status code: ${response.statusCode}')),
        );
      }
    } catch (error) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error fetching User ID: $error')),
      );
      print('Error fetching User ID: $error');
    }
  }
  void _removeActiveTooltip() {
    // This will trigger the tooltip to remove itself
    _InfoIconWithCustomTooltipState.isAnyTooltipVisible = false;
    // Force a rebuild to ensure the tooltip is removed
    setState(() {});
  }

  Future<void> _launchURL(String url) async {
    if (await canLaunch(url)) {
      await launch(url);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not launch $url')),
      );
    }
  }

  void _showTermsModal() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Color(0xFF121212),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (BuildContext context) {
        return Container(
          padding: EdgeInsets.symmetric(vertical: 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Text(
                  'Legal Documents',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
              ListTile(
                leading: Icon(Icons.description, color: Colors.white),
                title: Text(
                  'Terms of Service',
                  style: TextStyle(color: Colors.white),
                ),
                onTap: () {
                  Navigator.pop(context);
                  _launchURL('https://voiz.co.in/terms-of-use/');
                },
              ),
              ListTile(
                leading: Icon(Icons.privacy_tip, color: Colors.white),
                title: Text(
                  'Privacy Policy',
                  style: TextStyle(color: Colors.white),
                ),
                onTap: () {
                  Navigator.pop(context);
                  _launchURL('https://voiz.co.in/privacy-policy/');
                },
              ),
              Padding(
                padding: EdgeInsets.only(top: 16),
                child: TextButton(
                  onPressed: () {
                    Navigator.pop(context);
                  },
                  child: Text(
                    'Close',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }


  @override
  Widget build(BuildContext context) {
    return WillPopScope( // Prevent back navigation
        onWillPop: () async {

          if (isTooltipVisible()) {
            // Remove the active tooltip
            _InfoIconWithCustomTooltipState.removeActiveTooltip();
            return false; // Prevent navigation
          }
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Please complete your registration before leaving.'),
              duration: Duration(seconds: 2),
            ),
          );
          return false;  // Prevents the back button from functioning
        },
        child:  GradientScaffold(
          body: SingleChildScrollView(
            controller: ScrollController(),
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(16, 60, 16, 16),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: <Widget>[
                    SizedBox(height: 60,),

                    // Image.asset(
                    //   'assets/logo.png',
                    //   height: 120,
                    // ),
                    SizedBox(height: 10),
                    Text(
                      'Tell us more about you',
                      style: TextStyle(
                        fontSize: 30,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    SizedBox(height: 60),
                    Column(
                      mainAxisAlignment: MainAxisAlignment.start,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // 1. Name field
                        buildTextField(_fullNameController, 'Name '),
                        SizedBox(height: 10),

                        // 2. Phone field
                        buildTextFieldmobile(_mobileNumberController, 'Phone '),
                        SizedBox(height: 10),

                        // 3. Gender dropdown
                        CustomDropdownField(
                          value: _selectedGender,
                          label: 'Gender ',
                          items: ['Male', 'Female', 'Other'],
                          onChanged: (String? newValue) {
                            setState(() {
                              _selectedGender = newValue;
                            });
                          },
                        ),
                        SizedBox(height: 10),

                        // 4. Age field
                        newbuildTextField(_ageController, 'Age '),
                        SizedBox(height: 10),

                        // 5. Category dropdown
                        newCustomDropdownField(
                          value: _selectedCategory != null
                              ? (_selectedCategory == 'Singer' ? 'Artist' : _selectedCategory)
                              : null,
                          label: 'Category ',
                          items: ['Artist', 'Listener'],
                          onChanged: (String? newValue) {
                            setState(() {
                              _selectedCategory = newValue == 'Artist' ? 'Singer' : newValue;
                            });
                          },
                        ),
                        SizedBox(height: 10),

                        // 6. Stage Name field (only shows if Category is Singer/Artist)
                        if(_selectedCategory=='Singer')
                          buildTextFieldforstagename(
                              _stageNameController,
                              'Stage Name',
                              infoText: 'Name by which the audience will identify you',
                              required: false
                          ),
                      ],
                    ),

                    SizedBox(height: 80),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 100,
                          height: 4,
                          color: Colors.white, // First line filledp
                        ),
                        SizedBox(width: 10),
                        Container(
                          width: 100,
                          height: 4,
                          color: Colors.white, // Second line (initially empty)
                        ),
                      ],
                    ),
                    SizedBox(height: 30,),
                    ElevatedButton(
                      onPressed: _isRegistering ? null : registerUser,
                      child: _isRegistering
                          ? SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                      )
                          :
                      Text(
                        "Let's Start",
                        style: TextStyle(
                          fontSize: 18,
                          color: Colors.white, // Set the text color
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        minimumSize: Size(270, 50),
                        backgroundColor: Color(0xFF2644D9),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30),
                        ),
                        elevation: 4,
                      ),
                    ),
                    SizedBox(height: 10,),
                    Center(
                      child: GestureDetector(
                        onTap: _showTermsModal,
                        child: Text(
                          "Terms of use & privacy policy",
                          style: TextStyle(
                            color: Colors.white,
                            //decoration: TextDecoration.underline,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ));
  }

  Widget buildTextField(TextEditingController controller, String label,
      {bool obscureText = false, bool enabled = true, bool required = true}) {
    return Container(
      width: double.infinity,
      child: TextField(
        controller: controller,
        obscureText: obscureText,
        enabled: enabled,
        style: TextStyle(
            color: Color(0xFF121212),
            decorationThickness: 0,
            fontFamily: 'Poppins'// Remove any text decoration
        ),
        inputFormatters: label.contains('Name') ? [
          TextInputFormatter.withFunction((oldValue, newValue) {
            if (newValue.text.length < oldValue.text.length) {
              return newValue;
            }
            if (newValue.text.isNotEmpty) {
              String lastChar = newValue.text[newValue.text.length - 1];
              if (!RegExp(r"[a-zA-Z\s'-]").hasMatch(lastChar)) {
                return oldValue;
              }
            }
            return newValue;
          }),
        ] : [],
        onChanged: label.contains('Name') ? (value) {
          if (value.isNotEmpty) {
            List<String> words = value.split(' ');
            for (int i = 0; i < words.length; i++) {
              if (words[i].isNotEmpty) {
                words[i] = words[i][0].toUpperCase() +
                    (words[i].length > 1 ? words[i].substring(1).toLowerCase() : '');
              }
            }
            String formattedValue = words.join(' ');
            if (formattedValue != value) {
              controller.value = TextEditingValue(
                text: formattedValue,
                selection: TextSelection.collapsed(offset: formattedValue.length),
              );
            }
          }
        } : null,
        decoration: InputDecoration(
          label: RichText(
            text: TextSpan(
              text: label, // Label text (e.g., 'Name')
              style: TextStyle(color: Colors.black, fontSize: 18,fontFamily: 'Poppins'), // Default label style
              children: required
                  ? [
                // TextSpan(
                //   text: ' *',
                //   style: TextStyle(color: Colors.black), // Red asterisk for required fields
                // ),
              ]
                  : [],
            ),
          ),
          fillColor: Colors.white.withOpacity(0.8),
          filled: true,
          floatingLabelBehavior: FloatingLabelBehavior.never,
          labelStyle: TextStyle(color: Color(0xFF121212)),
          // hintText: label.contains('Name') ? 'Enter full name (e.g., Mahi Dhoni)' : null,
          hintText: label.contains('Name') ? 'Enter full name' : null,
          hintStyle: TextStyle(color: Colors.grey.shade600, fontSize: 14),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8.0),
            borderSide: BorderSide(color: Colors.black, width: 1.0),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8.0),
            borderSide: BorderSide(color: Colors.black, width: 1.0),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8.0),
            borderSide: BorderSide(color: Colors.black, width: 2.0),
          ),
        ),
        cursorColor: Colors.black,
      ),
    );
  }

  Widget buildTextFieldmobile(
      TextEditingController controller, String label,
      {bool obscureText = false,
        bool enabled = true,
        bool required = true}) {
    return Container(
      width: double.infinity,
      child: TextFormField(
        controller: controller,
        obscureText: obscureText,
        enabled: enabled,
        style: TextStyle(color: Colors.black,decorationThickness: 0,),
        decoration: InputDecoration(
          label: RichText(
            text: TextSpan(
              text: label,
              style: TextStyle(color: Colors.black, fontSize: 18,fontFamily: 'Poppins'),
              children: required
                  ? [
                // Add an asterisk if needed
              ]
                  : [],
            ),
          ),
          fillColor: Colors.white.withOpacity(0.8),
          filled: true,
          floatingLabelBehavior: FloatingLabelBehavior.never,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8.0),
            borderSide: BorderSide(color: Colors.black, width: 1.0),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8.0),
            borderSide: BorderSide(color: Colors.black, width: 1.0),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8.0),
            borderSide: BorderSide(color: Colors.black, width: 2.0),
          ),
        ),
        cursorColor: Colors.black,
        keyboardType: TextInputType.phone,
        inputFormatters: [
          FilteringTextInputFormatter.digitsOnly, // Only allow digits
          LengthLimitingTextInputFormatter(10),  // Limit to 10 digits
        ],
        validator: (value) {
          if (value == null || value.isEmpty) {
            return 'Please enter a Mobile Number';
          }
          if (value.length != 10) {
            return 'Mobile number must be exactly 10 digits';
          }
          if (!RegExp(r'^[0-9]+$').hasMatch(value)) {
            return 'Mobile number must contain only digits';
          }
          return null;
        },
      ),
    );
  }



  Widget newbuildTextField(TextEditingController controller, String label,
      {bool obscureText = false, bool enabled = true, bool required = true}) {
    return Container(
      width: double.infinity,
      child: TextField(
        controller: controller,
        obscureText: obscureText,
        enabled: enabled,
        style: TextStyle(
            color: Colors.black
        ),
        decoration: InputDecoration(
          label: RichText(
            text: TextSpan(
              text: label, // Label text (e.g., 'Name')
              style: TextStyle(color: Colors.black, fontSize: 18,fontFamily: 'Poppins'), // Default label style
              children: required
                  ? [
                // TextSpan(
                //   text: ' *',
                //   style: TextStyle(color: Colors.black), // Red asterisk for required fields
                // ),
              ]
                  : [],
            ),
          ),
          fillColor: Colors.white.withOpacity(0.8),
          filled: true,
          floatingLabelBehavior: FloatingLabelBehavior.never,



          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8.0),
            borderSide: BorderSide(color: Colors.black, width: 1.0),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8.0),
            borderSide: BorderSide(color: Colors.black, width: 1.0),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8.0),
            borderSide: BorderSide(color: Colors.black, width: 2.0),
          ),
        ),
        keyboardType: TextInputType.phone,

        inputFormatters: [
          FilteringTextInputFormatter.digitsOnly, // Restrict input to digits only
          LengthLimitingTextInputFormatter(2), // Limit input to 10 digits
        ],
        onChanged: (value) {
          // Additional validation to guide the user
          if (value.isNotEmpty) {
            int? age = int.tryParse(value);
            if (age != null && (age < 10 || age > 99)) {
              // This will be validated on form submission, but gives immediate feedback
              controller.value = controller.value.copyWith(
                text: value,
                selection: TextSelection.collapsed(offset: value.length),
                composing: TextRange.empty,
              );
            }
          }
        },
      ),
    );
  }

  Widget buildDropdownField({
    required String? value,
    required String label,
    required List<String> items,
    required ValueChanged<String?> onChanged,
    bool required = true,
  }) {
    return Container(
      width: 300, // Set the width of the dropdown field
      child: DropdownButtonFormField<String>(
        value: value,
        isExpanded: true, // Ensure the dropdown expands to take available space
        decoration: InputDecoration(
          label: RichText(
            text: TextSpan(
              text: label, // Label text (e.g., 'Category')
              style: TextStyle(color: Colors.black, fontSize: 18,),
              children: required
                  ? [
                // TextSpan(
                //   text: ' *',
                //   style: TextStyle(color: Colors.black), // Red asterisk for required fields
                // ),
              ]
                  : [],
            ),
          ),
          fillColor: Colors.white.withOpacity(0.8),
          filled: true,

          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8.0),
            borderSide: BorderSide(
              color: Colors.grey,
              width: 1.0,
            ),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8.0),
            borderSide: BorderSide(
              color: Colors.grey,
              width: 1.0,
            ),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(8.0),
            borderSide: BorderSide(
              color: Colors.white, // Custom border color on focus
              width: 2.0,
            ),
          ),
        ),
        onChanged: onChanged,
        items: items.map((String item) {
          return DropdownMenuItem<String>(
            value: item,
            child: Text(item),
          );
        }).toList(),
        dropdownColor: Colors.black, // Dropdown menu background color
        // Customize the dropdown field's width with ButtonTheme
        // Wrap the DropdownButtonFormField inside ButtonTheme
        itemHeight: 60, // Adjust height of each item
      ),
    );
  }
}

Widget newDropdownField({
  required String? value,
  required String label,
  required List<String> items,
  required ValueChanged<String?> onChanged,
  bool required = true,
}) {
  return Container(
    width: 300,
    child: DropdownButtonFormField<String>(
      value: value,
      isExpanded: true,
      decoration: InputDecoration(
        label: RichText(
          text: TextSpan(
            text: label, // Label text (e.g., 'Category')
            style: TextStyle(color: Colors.black, fontSize: 18),
            children: required
                ? [
              // TextSpan(
              //   text: ' *',
              //   style: TextStyle(color: Colors.black), // Red asterisk for required fields
              // ),
            ]
                : [],
          ),
        ),
        fillColor: Colors.white,
        filled: true,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8.0),
          borderSide: BorderSide(color: Colors.black, width: 1.0),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8.0),
          borderSide: BorderSide(color: Colors.black, width: 1.0),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8.0),
          borderSide: BorderSide(color: Colors.black, width: 2.0),
        ),
      ),
      onChanged: onChanged,
      items: items.map((String item) {
        return DropdownMenuItem<String>(
          value: item,
          child: Text(item),
        );
      }).toList(),
      dropdownColor: Colors.white,
    ),
  );
}








class CustomDropdownField extends StatefulWidget {
  final String? value;
  final String label;
  final List<String> items;
  final ValueChanged<String?> onChanged;

  CustomDropdownField({
    required this.value,
    required this.label,
    required this.items,
    required this.onChanged,
  });

  @override
  _CustomDropdownFieldState createState() => _CustomDropdownFieldState();
}

class _CustomDropdownFieldState extends State<CustomDropdownField> {
  bool showAsterisk = true; // This will manage the asterisk independently

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity, // Set fixed width for the dropdown button
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GestureDetector(
            onTap: () {
              FocusScope.of(context).unfocus(); // Unfocus any focused text field
              _showDropdownMenu();
            },
            child: Container(
              padding: EdgeInsets.symmetric(horizontal: 12.0, vertical: 13.0),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.8),
                border: Border.all(color: Colors.black),
                borderRadius: BorderRadius.circular(8.0),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  RichText(
                    text: TextSpan(
                      text: widget.value ?? widget.label,
                      style: TextStyle(color: Colors.black,fontSize: 17,fontFamily: 'Poppins'),
                      children: showAsterisk
                          ? [
                        // TextSpan(
                        //   text: ' *',
                        //   style: TextStyle(color: Colors.black),
                        // ),
                      ]
                          : [],
                    ),
                  ),
                  Icon(Icons.arrow_drop_down, color: Colors.black),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showDropdownMenu() {
    final RenderBox renderBox = context.findRenderObject() as RenderBox;
    final position = renderBox.localToGlobal(Offset.zero);

    showMenu<String>(
      context: context,
      position: RelativeRect.fromLTRB(
        position.dx + renderBox.size.width - 100,
        position.dy + renderBox.size.height,
        position.dx + renderBox.size.width,
        position.dy + renderBox.size.height + 100,
      ),
      items: widget.items.map((String item) {
        return PopupMenuItem<String>(
          value: item,
          child: Text(item, style: TextStyle(color: Colors.white)),
        );
      }).toList(),
    ).then((String? selectedValue) {
      if (selectedValue != null) {
        setState(() {
          showAsterisk = false; // Update state to remove asterisk
          widget.onChanged(selectedValue);
        });
      }
    });
  }
}




class newCustomDropdownField extends StatefulWidget {
  String? value;
  final String label;
  final List<String> items;
  final ValueChanged<String?> onChanged;

  newCustomDropdownField({
    required this.value,
    required this.label,
    required this.items,
    required this.onChanged,
  });

  @override
  _newCustomDropdownFieldState createState() => _newCustomDropdownFieldState();
}

class _newCustomDropdownFieldState extends State<newCustomDropdownField> {
  bool showAsterisk = true; // Local state to manage the asterisk visibility

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          GestureDetector(
            onTap: () {
              FocusScope.of(context).unfocus();
              _showDropdownMenu();
            },
            child: Container(
              padding: EdgeInsets.symmetric(horizontal: 12.0, vertical: 13.0),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.8),
                border: Border.all(color: Colors.black),
                borderRadius: BorderRadius.circular(8.0),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  RichText(
                    text: TextSpan(
                      text: widget.value ?? widget.label,
                      style: TextStyle(color: Colors.black,fontSize: 17,fontFamily: 'Poppins'),
                      children: showAsterisk
                          ? [
                        // TextSpan(
                        //   text: ' *',
                        //   style: TextStyle(color: Colors.black),
                        // ),
                      ]
                          : [],
                    ),
                  ),
                  Icon(Icons.arrow_drop_down, color: Colors.black),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showDropdownMenu() {
    final RenderBox renderBox = context.findRenderObject() as RenderBox;
    final position = renderBox.localToGlobal(Offset.zero);

    showMenu<String>(
      context: context,
      position: RelativeRect.fromLTRB(
        position.dx + renderBox.size.width - 100,
        position.dy + renderBox.size.height,
        position.dx + renderBox.size.width,
        position.dy + renderBox.size.height + 100,
      ),
      items: widget.items.map((String item) {
        return PopupMenuItem<String>(
          value: item,
          child: Text(item, style: TextStyle(color: Colors.white)),
        );
      }).toList(),
    ).then((String? selectedValue) {
      if (selectedValue != null) {
        setState(() {
          showAsterisk = false; // Update to remove asterisk on selection
          widget.value = selectedValue;
        });
        widget.onChanged(selectedValue);
      }
    });
  }
}


class SpeechBubblePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.black
      ..style = PaintingStyle.fill
      ..isAntiAlias = true;

    final path = Path();
    final radius = 20.0;

    // Start from top-left and draw clockwise
    path.moveTo(radius, 0);

    // Top edge and top-right corner
    path.lineTo(size.width - radius, 0);
    path.arcToPoint(
      Offset(size.width, radius),
      radius: Radius.circular(radius),
      clockwise: true,
    );

    // Right edge straight to bottom-right (no rounding)
    path.lineTo(size.width, size.height);

    // Bottom edge straight to bottom-left corner
    path.lineTo(radius, size.height);

    // Bottom-left corner
    path.arcToPoint(
      Offset(0, size.height - radius),
      radius: Radius.circular(radius),
      clockwise: true,
    );

    // Left edge and top-left corner
    path.lineTo(0, radius);
    path.arcToPoint(
      Offset(radius, 0),
      radius: Radius.circular(radius),
      clockwise: true,
    );

    path.close();
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
class CustomTooltip extends StatelessWidget {
  final String title;
  final String message;

  CustomTooltip({
    required this.title,
    required this.message,
  });

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      painter: SpeechBubblePainter(),
      child: Container(
        padding: EdgeInsets.fromLTRB(20, 12, 20, 22),
        width: 250,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
            SizedBox(height: 4),
            Text(
              message,
              style: TextStyle(
                color: Colors.white.withOpacity(0.8),
                fontSize: 16,
                fontStyle: FontStyle.italic,
                height: 1.2,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class InfoIconWithCustomTooltip extends StatefulWidget {
  final String title;
  final String infoText;

  InfoIconWithCustomTooltip({required this.title, required this.infoText});

  @override
  _InfoIconWithCustomTooltipState createState() => _InfoIconWithCustomTooltipState();
}

class _InfoIconWithCustomTooltipState extends State<InfoIconWithCustomTooltip> {
  final GlobalKey _toolTipKey = GlobalKey();
  static OverlayEntry? _overlayEntry;  // Made static to access from outside
  bool _isOverlayVisible = false;

  // Static variable to track if any tooltip is currently showing
  static bool isAnyTooltipVisible = false;

  // Static method to remove active tooltip
  static void removeActiveTooltip() {
    _overlayEntry?.remove();
    _overlayEntry = null;
    isAnyTooltipVisible = false;
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      key: _toolTipKey,
      onTap: () => _showOverlay(context),
      child: Container(
        width: 20,
        height: 20,
        child: Center(
          child: Icon(
            Icons.info_outline,
            color: Colors.black,
            size: 32,
          ),
        ),
      ),
    );
  }

  void _showOverlay(BuildContext context) {
    _overlayEntry?.remove();

    final overlay = Overlay.of(context);
    final renderBox = _toolTipKey.currentContext?.findRenderObject() as RenderBox?;
    final offset = renderBox?.localToGlobal(Offset.zero) ?? Offset.zero;

    _overlayEntry = OverlayEntry(
      builder: (context) => Material(
        color: Colors.transparent,
        child: Stack(
          children: [
            Positioned.fill(
              child: GestureDetector(
                onTap: _removeOverlay,
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 4, sigmaY: 4),
                  child: Container(
                    color: Colors.black.withOpacity(0.2),
                  ),
                ),
              ),
            ),
            Positioned(
              left: offset.dx - 222, // Adjusted to align pointer with info icon
              top: offset.dy - 78,  // Moved up slightly to account for pointer
              child: GestureDetector(
                onTap: () {},
                child: CustomTooltip(
                  title: widget.title,
                  message: widget.infoText,
                ),
              ),
            ),
          ],
        ),
      ),
    );

    setState(() {
      _isOverlayVisible = true;
      isAnyTooltipVisible = true;
    });
    overlay.insert(_overlayEntry!);
  }

  void _removeOverlay() {
    _overlayEntry?.remove();
    _overlayEntry = null;
    setState(() {
      _isOverlayVisible = false;
      isAnyTooltipVisible = false;
    });
  }

  @override
  void dispose() {
    _removeOverlay();
    super.dispose();
  }
}

// Helper method to check if any tooltip is visible
bool isTooltipVisible() {
  return _InfoIconWithCustomTooltipState.isAnyTooltipVisible;
}