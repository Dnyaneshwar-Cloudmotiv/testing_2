// Song Upload/uploadsong2.dart
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:voiceapp/adminlistsong.dart';
import 'package:voiceapp/bottomnavigationbar.dart';
import 'package:voiceapp/Song%20Upload/uploadsong3.dart';
import 'package:voiceapp/connectivity_service.dart';
import 'package:voiceapp/loading_screen.dart';
import 'package:voiceapp/main.dart'; // Import GradientScaffold from main.dart

class UploadSongSecondPage extends StatefulWidget {
  final Map<String, dynamic> onDataSubmitted;
  final bool isFromNewHomePage;

  UploadSongSecondPage({required this.onDataSubmitted, this.isFromNewHomePage = false});

  @override
  _UploadSongSecondPageState createState() => _UploadSongSecondPageState();
}

class _UploadSongSecondPageState extends State<UploadSongSecondPage> {
  final TextEditingController _moodController = TextEditingController();
  final TextEditingController _storyController = TextEditingController();
  final TextEditingController _lyricistController = TextEditingController();
  final TextEditingController _composerController = TextEditingController();
  final TextEditingController _singerController = TextEditingController();
  final TextEditingController _producerController = TextEditingController();

  String? _storyError;
  bool _isSubmitted = false;
  bool _isTooltipOpen = false; // Tracks tooltip visibility for blur effect
  bool isWordLimitExceeded = false;
  bool _isLoading = true;
  bool _isNoInternet = false;
  bool _mounted = true;
  late ConnectivityService _connectivityService;
  late String email;
  late String fullName;

  final int maxWords = 400;

  @override
  void initState() {
    super.initState();
    _connectivityService = ConnectivityService();
    email = widget.onDataSubmitted['email'];
    fullName = widget.onDataSubmitted['fullName'];
    _setupConnectivityListener();
  }

  void _setupConnectivityListener() {
    _connectivityService.connectionStream.listen((hasConnection) {
      if (!_mounted) return;
      setState(() => _isNoInternet = !hasConnection);
      if (hasConnection && _isNoInternet) {
        _initializeData();
      }
    });
    _checkConnectivity();
  }

  Future<void> _checkConnectivity() async {
    if (!_mounted) return;
    setState(() => _isLoading = true);
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
        setState(() => _isLoading = false);
      }
    } catch (e) {
      print('Error initializing data: $e');
      if (_mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  bool _validateInputs() {
    setState(() {
      _storyError = _validateStoryField(_storyController.text, 400, 'Story exceeds 400-word limit');
    });
    return _storyError == null;
  }

  String? _validateStoryField(String text, int maxWords, String errorText) {
    if (_checkWordLimit(text, maxWords)) {
      return errorText;
    }
    return null; // ✅ even if empty, no error
  }

  bool _checkWordLimit(String text, int maxWords) {
    final words = text.trim().split(RegExp(r'\s+'));
    return words.length > maxWords;
  }

  void _onNextPressed() {
    if (_isNoInternet) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('No internet connection. Please check your connection and try again.'),
          duration: Duration(seconds: 3),
        ),
      );
      return;
    }
    setState(() => _isSubmitted = true);
    if (_validateInputs()) {
      Map<String, dynamic> formData = {
        'mood': _moodController.text.isNotEmpty ? _moodController.text : '',
        'story': _storyController.text,
        ...widget.onDataSubmitted,
      };
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => UploadSongThirdPage(onDataSubmitted: formData),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Please fill out all fields')),
      );
    }
  }

  void _onTooltipVisibilityChanged(bool isVisible) {
    if (_mounted) {
      setState(() => _isTooltipOpen = isVisible);
    }
  }

  @override
  void dispose() {
    _mounted = false;
    _moodController.dispose();
    _storyController.dispose();
    _lyricistController.dispose();
    _composerController.dispose();
    _singerController.dispose();
    _producerController.dispose();
    _connectivityService.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    double screenHeight = MediaQuery.of(context).size.height;
    Widget content = GradientScaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: Image.asset('assets/upload_new.png', height: 30, width: 30),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => AdminSongList(userId: email, userfullname: fullName),
                ),
              );
            },
          ),
        ],
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            controller: ScrollController(),
            child: Padding(
              padding: EdgeInsets.only(left: 16.0, right: 16.0, top: 16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(height: screenHeight * 0.12),
                  Center(
                    child: Text(
                      "Song Basket",
                      style: TextStyle(
                        fontSize: 32,
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  SizedBox(height: screenHeight * 0.09),
                  // Ensure "Mood and Pace of the Song" field is visible
                  buildTextField(_moodController, "Mood and Pace of the Song", required: false),
                  SizedBox(height: 18), // Added spacing to match screenshot
                  buildStoryTextField(
                    _storyController,
                    label: 'Story Behind the Song',
                    infoText: 'What inspired you to make this song',
                    errorText: 'The story exceeds the 400-word limit',
                    required: false,
                    maxWords: 400,
                    minLines: 1,
                    maxLines: 6,
                    onWordLimitExceeded: (exceeded) {
                      setState(() => isWordLimitExceeded = exceeded);
                    },
                  ),
                  if (isWordLimitExceeded)
                    Text(
                      'You have reached the 400-word limit.',
                      style: TextStyle(color: Colors.red, fontSize: 12),
                    ),
                  SizedBox(height: screenHeight * 0.14),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(height: 4, width: 75, color: Colors.white),
                      SizedBox(width: 4),
                      Container(height: 4, width: 75, color: Colors.white),
                      SizedBox(width: 4),
                      Container(height: 4, width: 75, color: Color(0xFF120B0B)),
                      SizedBox(width: 4),
                      Container(height: 4, width: 75, color: Color(0xFF120B0B)),
                    ],
                  ),
                  SizedBox(height: screenHeight * 0.02),
                  Center(
                    child: ElevatedButton(
                      onPressed: _onNextPressed,
                      child: Text(
                        'Next',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 23,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Color(0xFF2644D9),
                        minimumSize: Size(250, 50),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30),
                        ),
                      ),
                    ),
                  ),
                  SizedBox(height: 20), // Add padding at the bottom to avoid overlap with bottom nav
                ],
              ),
            ),
          ),
          if (_isTooltipOpen)
            Positioned.fill(
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
                child: Container(color: Colors.black.withOpacity(0.2)), // Adjusted opacity to match screenshot
              ),
            ),
        ],
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
            email: email,
            fullName: fullName,
            category: 'Singer',
            currentIndex: 2,
            isFromNewHomePage: widget.isFromNewHomePage,
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

  Widget buildTextField(
      TextEditingController controller,
      String label, {
        bool required = true,
        String? infoText,
        String? errorText,
      }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            controller: controller,
            style: TextStyle(color: Colors.black, decorationThickness: 0, fontFamily: 'Poppins'),
            decoration: InputDecoration(
              label: RichText(
                text: TextSpan(
                  text: label,
                  style: TextStyle(color: Colors.black, fontSize: 18, fontFamily: 'Poppins'),
                  children: required ? [] : [],
                ),
              ),
              labelStyle: TextStyle(color: Colors.black),
              fillColor: Color(0xFFFFFFFF).withOpacity(0.8),
              floatingLabelBehavior: FloatingLabelBehavior.never,
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
              suffixIcon: infoText != null
                  ? RightPinInfoIconWithTooltip(
                title: label,
                infoText: infoText,
                onVisibilityChanged: _onTooltipVisibilityChanged,
              )
                  : null,
            ),
            cursorColor: Colors.black,
          ),
          if (errorText != null)
            Padding(
              padding: const EdgeInsets.only(top: 4.0),
              child: Text(
                errorText,
                style: TextStyle(color: Colors.red, fontSize: 12, fontFamily: 'Poppins'),
              ),
            ),
        ],
      ),
    );
  }

  Widget buildStoryTextField(
      TextEditingController controller, {
        required String label,
        required String errorText,
        String? infoText,
        int maxWords = 400,
        int minLines = 3,
        int maxLines = 4,
        bool required = true,
        required Function(bool) onWordLimitExceeded,
      }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            controller: controller,
            maxLines: maxLines,
            minLines: minLines,
            style: TextStyle(color: Colors.black, fontFamily: 'Poppins', decorationThickness: 0),
            inputFormatters: [
              TextInputFormatter.withFunction((oldValue, newValue) {
                final words = _getWordCount(newValue.text);
                if (words <= maxWords) {
                  onWordLimitExceeded(false);
                  return newValue;
                } else {
                  onWordLimitExceeded(true);
                  FocusScope.of(context).unfocus();
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('You have reached the 400-word limit'),
                      duration: Duration(seconds: 2),
                    ),
                  );
                  return oldValue;
                }
              }),
            ],
            decoration: InputDecoration(
              label: RichText(
                text: TextSpan(
                  text: label,
                  style: TextStyle(color: Colors.black, fontSize: 18, fontFamily: 'Poppins'),
                  children: required ? [] : [],
                ),
              ),
              labelStyle: TextStyle(color: Colors.black),
              fillColor: Color(0xFFFFFFFF).withOpacity(0.8),
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
              errorText: _validateStoryField(controller.text, maxWords, errorText),
              suffixIcon: infoText != null
                  ? RightPinInfoIconWithTooltip(
                title: "Information",
                infoText: infoText,
                onVisibilityChanged: _onTooltipVisibilityChanged,
              )
                  : null,
            ),
            onChanged: (value) => setState(() {}),
            cursorColor: Colors.black,
          ),
        ],
      ),
    );
  }

  int _getWordCount(String text) {
    return text.trim().split(RegExp(r'\s+')).length;
  }

  Widget buildCreditsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        buildCreditRow(
          label: 'Lyricist',
          controller: _lyricistController,
          errorText: null,
        ),
        buildCreditRow(
          label: 'Composer',
          controller: _composerController,
          errorText: null,
        ),
        buildCreditRow(
          label: 'Singer',
          controller: _singerController,
          errorText: null,
        ),
        buildCreditRow(
          label: 'Producer',
          controller: _producerController,
          errorText: null,
        ),
      ],
    );
  }

  Widget buildCreditRow({
    required String label,
    required TextEditingController controller,
    String? errorText,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Row(
        children: [
          Expanded(
            flex: 2,
            child: Text(
              '$label',
              style: TextStyle(color: Colors.black),
            ),
          ),
          SizedBox(width: 8),
          Expanded(
            flex: 5,
            child: TextField(
              controller: controller,
              style: TextStyle(color: Colors.black),
              decoration: InputDecoration(
                hintText: 'Enter $label\'s name',
                hintStyle: TextStyle(color: Colors.black54),
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
                errorText: errorText,
              ),
              cursorColor: Colors.black,
            ),
          ),
        ],
      ),
    );
  }
}

class RightPinInfoIconWithTooltip extends StatefulWidget {
  final String title;
  final String infoText;
  final Function(bool) onVisibilityChanged;

  RightPinInfoIconWithTooltip({
    required this.title,
    required this.infoText,
    required this.onVisibilityChanged,
  });

  @override
  _RightPinInfoIconWithTooltipState createState() => _RightPinInfoIconWithTooltipState();
}

class _RightPinInfoIconWithTooltipState extends State<RightPinInfoIconWithTooltip> {
  final GlobalKey _toolTipKey = GlobalKey();
  OverlayEntry? _overlayEntry;
  bool _isOverlayVisible = false;
  bool _disposed = false;

  @override
  void dispose() {
    _disposed = true;
    _removeOverlay();
    super.dispose();
  }

  void _showOverlay(BuildContext context) {
    if (_disposed) return;
    _removeOverlay();

    final overlay = Overlay.of(context);
    final renderBox = _toolTipKey.currentContext?.findRenderObject() as RenderBox?;
    if (renderBox == null) return;

    final offset = renderBox.localToGlobal(Offset.zero);

    _overlayEntry = OverlayEntry(
      builder: (context) => Material(
        color: Colors.transparent,
        child: Stack(
          children: [
            Positioned.fill(
              child: GestureDetector(
                onTap: _removeOverlay,
                child: Container(color: Colors.black.withOpacity(0.5)),
              ),
            ),
            Positioned(
              left: offset.dx - 220,
              top: offset.dy - 110,
              child: GestureDetector(
                onTap: () {},
                child: RightPinTooltip(
                  title: widget.title,
                  message: widget.infoText,
                ),
              ),
            ),
          ],
        ),
      ),
    );

    if (!_disposed) {
      setState(() => _isOverlayVisible = true);
      widget.onVisibilityChanged(true);
      overlay.insert(_overlayEntry!);
    }
  }

  void _removeOverlay() {
    _overlayEntry?.remove();
    _overlayEntry = null;
    if (!_disposed && mounted) {
      setState(() => _isOverlayVisible = false);
      widget.onVisibilityChanged(false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        if (_isOverlayVisible) {
          _removeOverlay();
          return false;
        }
        return true;
      },
      child: GestureDetector(
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
      ),
    );
  }
}

class RightPinTooltip extends StatelessWidget {
  final String title;
  final String message;

  RightPinTooltip({required this.title, required this.message});

  @override
  Widget build(BuildContext context) {
    const cornerRadius = 30.0;

    return Container(
      width: 275,
      height: 135,
      child: Stack(
        children: [
          Positioned(
            right: 10,
            bottom: 5,
            child: Container(
              width: 250,
              height: 130,
              margin: EdgeInsets.only(right: 8, bottom: 0),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(cornerRadius),
                boxShadow: [
                  BoxShadow(
                    color: Colors.white.withOpacity(0.4),
                    blurRadius: 15,
                    spreadRadius: 1,
                  ),
                  BoxShadow(
                    color: Colors.white.withOpacity(0.3),
                    blurRadius: 12,
                    spreadRadius: -2,
                    offset: Offset(8, 0),
                  ),
                  BoxShadow(
                    color: Colors.white.withOpacity(0.3),
                    blurRadius: 12,
                    spreadRadius: -2,
                    offset: Offset(6, 18),
                  ),
                  BoxShadow(
                    color: Colors.white.withOpacity(0.4),
                    blurRadius: 12,
                    spreadRadius: -3,
                    offset: Offset(6, 6),
                  ),
                ],
              ),
            ),
          ),
          Positioned(
            left: 0,
            top: 0,
            child: CustomPaint(
              painter: RightPinTooltipPainter(),
              child: Container(
                padding: EdgeInsets.fromLTRB(24, 16, 24, 28),
                width: 250,
                height: 135,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(height: 8),
                    Text(
                      message,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class RightPinTooltipPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Color(0xFF211F20).withOpacity(1)
      ..style = PaintingStyle.fill
      ..isAntiAlias = true;

    final path = Path();
    final cornerRadius = 30.0;

    path.moveTo(cornerRadius, 0);
    path.quadraticBezierTo(0, 0, 0, cornerRadius);
    path.lineTo(0, size.height - cornerRadius);
    path.quadraticBezierTo(0, size.height, cornerRadius, size.height);
    path.lineTo(size.width - cornerRadius, size.height);
    path.lineTo(size.width, size.height);
    path.lineTo(size.width, size.height - cornerRadius);
    path.lineTo(size.width, cornerRadius);
    path.quadraticBezierTo(size.width, 0, size.width - cornerRadius, 0);
    path.lineTo(cornerRadius, 0);
    path.close();

    final gradient = LinearGradient(
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
      colors: [
        Color(0xFF211F20).withOpacity(1),
        Color(0xFF211F20).withOpacity(1),
      ],
    );

    final rect = Rect.fromLTWH(0, 0, size.width, size.height);
    final gradientPaint = Paint()
      ..shader = gradient.createShader(rect)
      ..style = PaintingStyle.fill;

    canvas.drawPath(path, gradientPaint);

    final innerShadowPaint = Paint()
      ..color = Colors.black.withOpacity(0.1)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0
      ..maskFilter = MaskFilter.blur(BlurStyle.inner, 2.0);

    canvas.drawPath(path, innerShadowPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}