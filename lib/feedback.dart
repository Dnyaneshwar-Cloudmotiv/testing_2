// feedback.dart
import 'package:flutter/material.dart';
import 'dart:ui'; // Import for BackdropFilter
import 'package:intl/intl.dart';
import 'package:voiceapp/main.dart';
import 'package:voiceapp/profile_manager.dart';
import 'package:voiceapp/services/api_service.dart';
import 'bottomnavigationbar.dart';
import 'package:voiceapp/connectivity_service.dart';
import 'package:voiceapp/loading_screen.dart';

class FeedbackPage extends StatefulWidget {
  final String userEmail;
  final String userfullname;
  final String userCategory;

  FeedbackPage({required this.userEmail, required this.userfullname, required this.userCategory});

  @override
  _FeedbackPageState createState() => _FeedbackPageState();
}

class _FeedbackPageState extends State<FeedbackPage> {
  int? _experienceRating;
  int? _contentRating;
  final TextEditingController _improveController = TextEditingController();
  final TextEditingController _ideasController = TextEditingController();
  final TextEditingController _motivationController = TextEditingController();
  String? _improveErrorText;
  bool isloading = false;
  bool _isNoInternet = false;
  late ConnectivityService _connectivityService;

  void _setExperienceRating(int rating) {
    setState(() {
      _experienceRating = rating;
    });
  }

  void _setContentRating(int rating) {
    setState(() {
      _contentRating = rating;
    });
  }

  @override
  void initState() {
    super.initState();
    _connectivityService = ConnectivityService();
    _setupConnectivityListener();
  }

  void _setupConnectivityListener() {
    _connectivityService.connectionStream.listen((hasConnection) {
      setState(() {
        _isNoInternet = !hasConnection;
      });
    });
  }

  Future<void> _checkConnectivity() async {
    await _connectivityService.checkConnection();

    setState(() {
      _isNoInternet = !_connectivityService.hasConnection;
    });
  }

  @override
  void dispose() {
    _connectivityService.dispose();
    super.dispose();
  }

  Future<void> _showSuccessDialog(BuildContext context) async {
    showDialog(
      context: context,
      barrierDismissible: false, // Prevents dialog from being dismissed by tapping outside
      builder: (BuildContext context) {
        return BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 5.0, sigmaY: 5.0), // Apply blur effect
          child: Dialog(
            backgroundColor: Colors.transparent, // Set background to transparent
            child: Stack(
              alignment: Alignment.topCenter,
              clipBehavior: Clip.none, // Allow overflow outside the dialog
              children: [
                Container(
                  width: 300,
                  height: 230,
                  padding: EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Color(0xFF151415), // Set the background color
                    borderRadius: BorderRadius.circular(15),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      SizedBox(height: 50), // Add spacing for close icon
                      Text(
                        "Thank you for your feedback in helping us improve",
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      SizedBox(height: 40), // Add spacing between text and checkmark
                      GestureDetector(
                        onTap: () {
                          Navigator.of(context).pop(); // Close the dialog
                        },
                        child: CircleAvatar(
                          radius: 20,
                          backgroundColor: Colors.blue,
                          child: Icon(
                            Icons.check,
                            color: Colors.white,
                            size: 30,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Positioned(
                  top: 10,
                  right: 30,
                  child: GestureDetector(
                    onTap: () {
                      Navigator.of(context).pop();
                    },
                    child: CircleAvatar(
                      radius: 15, // Increase the radius to make space for the black circle
                      backgroundColor: Colors.grey.shade300, // Background color of the avatar
                      child: Container(
                        decoration: BoxDecoration(
                          shape: BoxShape.circle, // Ensures the border is circular
                          border: Border.all(
                            color: Colors.white, // Black border around the icon
                            width: 2.0, // Thickness of the black border
                          ),
                        ),
                        child: CircleAvatar(
                          radius: 12, // Adjust the radius of the inner circle
                          child: Icon(
                            Icons.close,
                            color: Colors.white, // Icon color
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<void> submitFeedback({
    required String userId,
    int? experienceRating,
    int? contentRating,
    String? improve,
    String? yourIdeas,
    String? motivation,
  }) async {
    // Validate required fields
    if (_experienceRating == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("'How's your experience using Voiz app?' is required")),
      );
      return;
    }

    if (_experienceRating != null && _experienceRating! <= 4 && _improveController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("'How can we improve? ' is required")),
      );
      return;
    }

    if (_contentRating == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("'How do you like the content?' is required")),
      );
      return;
    }

    final String timestamp = DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());

    // Prepare the feedback data
    final feedbackData = {
      'user_id': userId,
      'experience': experienceRating.toString() ?? "NA",
      'content': contentRating.toString() ?? "NA",
      'improve': improve?.isNotEmpty == true ? improve : "NA",
      'yourIdeas': yourIdeas?.isNotEmpty == true ? yourIdeas : "NA",
      'motivation': motivation?.isNotEmpty == true ? motivation : "NA",
      'createdTimestamp': timestamp,
      'updatedTimestamp': timestamp
    };

    print('Submitting feedback: $feedbackData');

    try {
      // Use centralized API service to submit feedback
      final response = await ApiService.submitUserFeedback(feedbackData);

      if (ApiService.isSuccessResponse(response)) {
        print('Feedback submitted successfully');
        _showSuccessDialog(context);
        _resetForm();
      } else {
        final errorMessage = ApiService.getErrorMessage(response);
        print('Failed to submit feedback: $errorMessage');
        _handleFeedbackError(errorMessage);
      }
    } catch (error) {
      print('Error submitting feedback: $error');
      _handleFeedbackError('Failed to submit feedback. Please try again.');
    }
  }

  /// Reset form fields after successful submission
  void _resetForm() {
    setState(() {
      _experienceRating = null;
      _contentRating = null;
      _improveController.clear();
      _ideasController.clear();
      _motivationController.clear();
    });
  }

  /// Handle feedback submission errors
  void _handleFeedbackError(String errorMessage) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(errorMessage),
        backgroundColor: Colors.red,
        duration: Duration(seconds: 3),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    Widget content = GradientScaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leadingWidth: 35, // Reduce the width of the leading section
        leading: IconButton(
          padding: EdgeInsets.only(left: 10), // Adjust padding of the back button
          icon: Icon(Icons.arrow_back_ios, color: Colors.white, size: 20),
          onPressed: () => Navigator.of(context).pop(),
        ),
        titleSpacing: 0, // Remove default spacing before title
        title: Padding(
          padding: EdgeInsets.only(left: 0), // Adjust if needed
        ),
      ),
      body: SingleChildScrollView(
        controller: ScrollController(),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 0.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              SizedBox(height: 0),
              Text(
                "Feedback",
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 36,
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: 24),
              _buildQuestion("How's your experience using the app? "),
              SizedBox(height: 8),
              _buildRatingRow(
                selectedRating: _experienceRating,
                onRatingSelected: _setExperienceRating,
              ),
              if (_experienceRating != null && _experienceRating! <= 4)
                Column(
                  children: [
                    SizedBox(height: 24),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        "How can we improve?",
                        style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.only(top: 16.0),
                      child: _buildTextField("How can we improve?", controller: _improveController),
                    ),
                  ],
                ),
              SizedBox(height: 24),
              _buildQuestion("How do you like the content? "),
              SizedBox(height: 8),
              _buildRatingRow(
                selectedRating: _contentRating,
                onRatingSelected: _setContentRating,
              ),
              SizedBox(height: 24),
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  "Share your ideas:",
                  style: TextStyle(
                    fontSize: 20,
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              SizedBox(height: 16),
              _buildTextField("Share your ideas", controller: _ideasController),
              SizedBox(height: 16),
              Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  "What would motivate you to share our app with friends and family?",
                  style: TextStyle(
                    fontSize: 20,
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              SizedBox(height: 16),
              _buildTextField(
                "What would motivate you to share our app with friends and family?",
                controller: _motivationController,
              ),
              SizedBox(height: 32),
              ElevatedButton(
                onPressed: isloading
                    ? null // Disable the button if loading
                    : () {
                  // Start loading and submit the feedback
                  setState(() {
                    isloading = true; // Show loader
                  });

                  submitFeedback(
                    userId: ProfileManager().getUserId()!,
                    experienceRating: _experienceRating,
                    contentRating: _contentRating,
                    improve: _improveController.text,
                    yourIdeas: _ideasController.text,
                    motivation: _motivationController.text,
                  ).then((_) {
                    // After feedback submission, stop the loader
                    setState(() {
                      isloading = false;
                    });
                  });
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Color(0xFF2644D9),
                  minimumSize: Size(312, 56),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(30),
                  ),
                ),
                child: isloading
                    ? CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                )
                    : Text(
                  'Submit',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              SizedBox(height: 20,),
            ],
          ),
        ),
      ),
    );

    return Stack(
      children: [
        PageWithBottomNav(
          child: content,
          email: widget.userEmail,
          fullName: widget.userfullname,
          category: widget.userCategory,
          currentIndex: 3,
          isFromNewHomePage: false,
        ),
        LoadingScreen(
          isLoading: isloading,
          isNoInternet: _isNoInternet,
          onRetry: _checkConnectivity,
        ),
      ],
    );
  }

  Widget _buildQuestion(String question) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Text(
        question,
        style: TextStyle(
          color: Colors.white,
          fontSize: 20,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildRatingRow({
    required int? selectedRating,
    required Function(int) onRatingSelected,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: List.generate(
        5,
            (index) {
          final rating = index + 1;
          final isSelected = rating <= (selectedRating ?? 0);
          return GestureDetector(
            onTap: () => onRatingSelected(rating),
            child: Container(
              width: 40,
              height: 40,
              child: Image.asset(
                isSelected ? 'assets/star_filled_new.png' : 'assets/star_outline_new.png',
                color: isSelected ? Colors.white : Colors.white,
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildTextField(String hintText, {required TextEditingController controller}) {
    return TextField(
      controller: controller,
      maxLines: 3,
      style: TextStyle(color: Colors.black, fontSize: 17, decorationThickness: 0),
      decoration: InputDecoration(
        hintStyle: TextStyle(color: Colors.black54, fontSize: 17),
        fillColor: Color(0xCCFFFFFF),
        filled: true,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12.0),
          borderSide: BorderSide.none,
        ),
      ),
    );
  }
}