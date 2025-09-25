import 'package:flutter/material.dart';

import 'package:voiceapp/main.dart';
import 'package:voiceapp/Rejectd/rejected_edit.dart';
import 'package:voiceapp/services/api_service.dart';
import 'bottomnavigationbar.dart';
import 'package:voiceapp/connectivity_service.dart';
import 'package:voiceapp/loading_screen.dart';


class RejectionDetailsPage extends StatefulWidget {
  final String songName;
  final String artistName;
  final String workflowId;
  final String coverPageUrl;
  final String genre;
  final String userId;
  final String userfullname;
  final String category;

  const RejectionDetailsPage({
    Key? key,
    required this.songName,
    required this.artistName,
    required this.workflowId,
    required this.coverPageUrl,
    required this.genre,
    required this.userId,
    required this.userfullname,
    required this.category,
  }) : super(key: key);

  @override
  State<RejectionDetailsPage> createState() => _RejectionDetailsPageState();
}

class _RejectionDetailsPageState extends State<RejectionDetailsPage> {
  String? rejectionReason;
  String? improvementSuggestion;
  bool isLoading = true;
  bool _mounted = true;
  bool _isNoInternet = false; // Initialize _isNoInternet here
  late final ConnectivityService _connectivityService;

  @override
  void initState() {
    super.initState();
    _mounted = true;
    _connectivityService = ConnectivityService();
    _setupConnectivityListener();
    fetchRejectionDetails();
  }

  @override
  void dispose() {
    _mounted = false;
    _connectivityService.dispose();
    super.dispose();
  }

  void _setupConnectivityListener() {
    _connectivityService.connectionStream.listen((hasConnection) {
      if (!_mounted || _connectivityService.isClosed) return;
      setState(() => _isNoInternet = !hasConnection);

      if (hasConnection && _isNoInternet) {
        fetchRejectionDetails();
      }
    });

    _checkConnectivity();
  }

  Future<void> _checkConnectivity() async {
    await _connectivityService.checkConnection();
    setState(() => _isNoInternet = !_connectivityService.hasConnection);

    if (_connectivityService.hasConnection) {
      fetchRejectionDetails();
    }
  }

  Future<void> fetchRejectionDetails() async {
    print('Fetching rejection details for workflowId: ${widget.workflowId}');
    setState(() {
      isLoading = true;
    });

    try {
      // Use centralized API service to fetch rejection details
      final response = await ApiService.getRejectionDetails(widget.workflowId);

      print('Rejection API Response Status: ${response.statusCode}');
      print('Rejection API Response Body: ${response.body}');

      if (ApiService.isSuccessResponse(response)) {
        final data = ApiService.parseJsonResponse(response);
        print('Parsed rejection data: $data');

        // Check if data is a list (unexpected for this endpoint)
        if (data is List) {
          print('Warning: Rejection details API returned a list. Expected an object.');
          _handleLoadError('Unexpected API response format: received a list.');
          return;
        }

        setState(() {
          // Safely extract rejection reason from DynamoDB format
          final rejectionData = data?['rejectionReason'];
          rejectionReason = rejectionData != null && rejectionData is Map<String, dynamic> 
              ? rejectionData['S'] ?? "No reason provided"
              : "No reason provided";
          
          // Safely extract improvement suggestion from DynamoDB format
          final improvementData = data?['improvement'];
          improvementSuggestion = improvementData != null && improvementData is Map<String, dynamic>
              ? improvementData['S'] ?? "No improvement suggestions"
              : "No improvement suggestions";
          
          isLoading = false;
          print('rejectionReason set to: $rejectionReason');
          print('improvementSuggestion set to: $improvementSuggestion');
        });
      } else {
        final errorMessage = ApiService.getErrorMessage(response);
        _handleLoadError('Failed to fetch rejection details: $errorMessage');
      }
    } catch (error) {
      print('Error fetching rejection details: $error');
      _handleLoadError('Error fetching rejection details: $error');
    }
  }

  void _handleLoadError(String logMessage) {
    print(logMessage);
    if (!_mounted) return;
    
    setState(() {
      isLoading = false;
      rejectionReason = "Unable to load reason";
      improvementSuggestion = "Unable to load suggestions";
    });
    
    // Show user-friendly error message
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Failed to load rejection details. Please try again.'),
        backgroundColor: Colors.red,
        duration: Duration(seconds: 3),
      ),
    );
  }

  // void _onEditTap() {
  //   Navigator.push(
  //     context,
  //     MaterialPageRoute(
  //       builder: (context) => EditSongDetailsPage(
  //         songName: widget.songName,
  //         artistName: widget.artistName,
  //         workflowId: widget.workflowId,
  //         coverPageUrl: widget.coverPageUrl,
  //         genre: widget.genre,
  //         userId: widget.userId,
  //         userfullname: widget.userfullname,
  //         category: widget.category,
  //         songId: widget.workflowId,
  //       ),
  //     ),
  //   );
  // }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        PageWithBottomNav(
          child: _buildPageContent(),
          email: widget.userId,
          fullName: widget.userfullname,
          category: widget.category,
          currentIndex: 3,
          isFromNewHomePage: false,
        ),
        LoadingScreen(
          isLoading: isLoading,
          isNoInternet: _isNoInternet,
          onRetry: _checkConnectivity,
        ),
      ],
    );
  }

  Widget _buildPageContent() {
    return GradientScaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        titleSpacing: 0,
        backgroundColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: isLoading
            ? const Center(child: CircularProgressIndicator())
            : _buildDetailsContent(),
      ),
    );
  }

  Widget _buildDetailsContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 30),
        const SizedBox(height: 50),
        Row(
          children: [
            _buildCoverImage(),
            const SizedBox(width: 16),
            _buildSongInfo(),
            // Edit button removed from UI as requested
            // const SizedBox(width: 8),
            // _buildEditButton(),
          ],
        ),
        const SizedBox(height: 50),
        _buildSectionTitle('Reason for Rejection:'),
        _buildSectionContent(rejectionReason),
        const SizedBox(height: 50),
        _buildSectionTitle('How can you improve:'),
        _buildSectionContent(improvementSuggestion),
        const SizedBox(height: 50),
        _buildSectionTitle('Contact Support:'),
        _buildSectionContent('info@voiz.co.in'),
      ],
    );
  }

  Widget _buildCoverImage() {
    return Container(
      width: 80,
      height: 80,
      decoration: BoxDecoration(borderRadius: BorderRadius.circular(8)),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: Image.network(
          widget.coverPageUrl,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => Image.asset('assets/mic.jpg', fit: BoxFit.cover),
        ),
      ),
    );
  }

  Widget _buildSongInfo() {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            widget.songName,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
            maxLines: 4,
            overflow: TextOverflow.ellipsis,
          ),
          Text(
            widget.genre,
            style: const TextStyle(fontSize: 16, color: Colors.grey),
          ),
        ],
      ),
    );
  }

  Widget _buildEditButton() {
    return GestureDetector(
      // onTap: _onEditTap,
      child: Container(
        width: 110,
        height: 30,
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: const Color(0xFF464445),
          borderRadius: BorderRadius.circular(15),
        ),
        child: const Center(
          child: Text(
            'Edit',
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String text) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 24,
        fontWeight: FontWeight.bold,
        color: Colors.white,
        fontFamily: 'Poppins',
      ),
    );
  }

  Widget _buildSectionContent(String? content) {
    return Padding(
      padding: const EdgeInsets.only(left: 15, top: 15),
      child: Text(
        content ?? "No data available",
        style: const TextStyle(
          fontSize: 16,
          color: Color(0xFFD7D2D2),
          fontFamily: 'Poppins',
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
