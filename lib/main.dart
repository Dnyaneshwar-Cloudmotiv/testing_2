// main.dart
import 'dart:async';
import 'dart:io';
import 'dart:typed_data';
import 'dart:ui';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_dynamic_links/firebase_dynamic_links.dart';
import 'package:flutter/material.dart';
import 'package:amplify_flutter/amplify_flutter.dart';
import 'package:amplify_auth_cognito/amplify_auth_cognito.dart';
import 'package:flutter/services.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:just_audio_background/just_audio_background.dart';
import 'package:voiceapp/additionalinfo.dart';
import 'package:voiceapp/artist.dart';
import 'package:voiceapp/audio_service1.dart';
import 'package:voiceapp/musicplayer.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:voiceapp/notifiers.dart';
import 'package:voiceapp/Registration.dart';
import 'package:voiceapp/amplifyconfiguration.dart';
import 'package:voiceapp/NewHomepage.dart';
import 'package:voiceapp/splash_screen.dart';
import 'package:voiceapp/loginpage.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:voiceapp/firebase_options.dart';
import 'package:voiceapp/connectivity_service.dart';
import 'package:voiceapp/loading_screen.dart';
import 'package:voiceapp/services/background_task_service.dart';
import 'package:voiceapp/profile_manager.dart';
import 'package:voiceapp/services/api_service.dart';

// Add the extension here
extension CompleterExtension<T> on Completer<T> {
  bool get isCompleted => this.isCompleted;
}

final GoogleSignIn _googleSignIn = GoogleSignIn(scopes: ['email']);

final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();

ValueNotifier<bool> isNowPlayingTileVisible = ValueNotifier<bool>(false);
final ValueNotifier<bool> isFavoriteNotifier = ValueNotifier<bool>(false);

// Define a global ValueNotifier for favorite status or song changes
ValueNotifier<bool> nowPlayingUpdatedNotifier = ValueNotifier(false);

final ValueNotifier<bool> shuffleNotifier = ValueNotifier<bool>(false);

Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  print("Handling a background message: ${message.messageId}");

  try {
    if (message.notification != null) {
      final notification = message.notification!;
      final androidPlatformChannelSpecifics = AndroidNotificationDetails(
        'high_importance_channel',
        'High Importance Notifications',
        channelDescription: 'This channel is used for important notifications.',
        importance: Importance.max,
        priority: Priority.high,
        showWhen: true,
        icon: '@mipmap/ic_launcher',
        color: const Color(0xFF486299),
      );
      final platformChannelSpecifics = NotificationDetails(android: androidPlatformChannelSpecifics);

      await flutterLocalNotificationsPlugin.show(
        notification.hashCode,
        notification.title ?? 'New Notification',
        notification.body ?? 'You have a new message',
        platformChannelSpecifics,
        payload: message.data.isNotEmpty ? jsonEncode(message.data) : null,
      );
      print("Background notification displayed: ${notification.title}");
    } else {
      print("Background message contains no notification data");
    }
  } on FirebaseException catch (e) {
    print('FirebaseException in background message handling: ${e.code} - ${e.message}');
  } catch (e) {
    print("Error handling background message: $e");
  }
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Only essential sync operations for immediate app start
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Start app immediately
  runApp(MyApp());

  // Move heavy operations to background - preserving exact same logic
  _initializeInBackground();
}

Future<void> _initializeInBackground() async {
  // All existing heavy operations moved here - same order, same logic
  MobileAds.instance.initialize().then((initializationStatus) {
    MobileAds.instance.updateRequestConfiguration(
      RequestConfiguration(
        tagForChildDirectedTreatment: TagForUnderAgeOfConsent.unspecified,
        maxAdContentRating: MaxAdContentRating.g,
      ),
    );
  });

  var initializationSettingsAndroid = AndroidInitializationSettings('@mipmap/ic_launcher');
  var initializationSettings = InitializationSettings(android: initializationSettingsAndroid);

  await flutterLocalNotificationsPlugin.initialize(initializationSettings);

  await JustAudioBackground.init(
    androidNotificationChannelId: 'com.ryanheise.bg_demo.channel.audio',
    androidNotificationChannelName: 'Audio playback',
    notificationColor: const Color(0xFF1E1E1E),
    androidShowNotificationBadge: true,
    androidNotificationClickStartsActivity: true,
    androidStopForegroundOnPause: true,
    artDownscaleHeight: 300,
    artDownscaleWidth: 300,
  );

  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

  FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  await autoplayNotifier.loadAutoplayState();

  await BackgroundTaskService().initialize();
  await FirebaseMessaging.instance.requestPermission();
}

class GradientScaffold extends StatelessWidget {
  final Widget body;
  final PreferredSizeWidget? appBar;
  final Widget? bottomNavigationBar;
  final FloatingActionButton? floatingActionButton;
  final bool extendBody;

  const GradientScaffold({
    Key? key,
    required this.body,
    this.appBar,
    this.bottomNavigationBar,
    this.floatingActionButton,
    this.extendBody = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: appBar,
      bottomNavigationBar: bottomNavigationBar,
      floatingActionButton: floatingActionButton,
      extendBody: extendBody,
      backgroundColor: Color(0xFF211F20),
      body: Stack(
        children: [
          body,
        ],
      ),
    );
  }
}

ThemeData customTheme = ThemeData(
  fontFamily: 'Poppins',
  primaryColor: Color(0xFF211F20),
  primaryColorLight: Color(0xFF486299),
  primaryColorDark: Color(0xFF1F1E1C),
  scaffoldBackgroundColor: Color(0xFF211F20),
  colorScheme: ColorScheme(
    primary: Color(0xFF2B2A29),
    secondary: Color(0xFF6F6E6C),
    surface: Color(0xFF2B2A29),
    background: Color(0xFF211F20),
    error: Colors.red,
    onPrimary: Colors.white,
    onSecondary: Colors.white,
    onSurface: Colors.white,
    onBackground: Colors.white,
    onError: Colors.white,
    brightness: Brightness.dark,
  ),
);

class MyApp extends StatefulWidget {
  @override
  _MyAppState createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();
  final GlobalKey<ScaffoldMessengerState> scaffoldMessengerKey = GlobalKey<ScaffoldMessengerState>();

  void _showSnackBar(String message) {
    if (mounted && scaffoldMessengerKey.currentState != null) {
      scaffoldMessengerKey.currentState!.showSnackBar(
        SnackBar(content: Text(message)),
      );
    }
  }

  @override
  void initState() {
    super.initState();
    Firebase.initializeApp();
    requestNotificationPermissions();
    getAndPrintFCMToken();
    initializeNotifications();
    FirebaseMessaging.onMessage.listen((RemoteMessage message) async {
      print('Message received in foreground: ${message.messageId}');
      print('Message data: ${message.data}');
      print('Message notification: ${message.notification?.title} - ${message.notification?.body}');

      try {
        if (message.notification != null) {
          // Only show local notification, skip SnackBar to avoid ScaffoldMessenger issues
          await showNotification(message.notification!);
          print('Notification displayed successfully');
        }
      } on FirebaseException catch (e) {
        print('FirebaseException in foreground message handling: ${e.code} - ${e.message}');
      } catch (e) {
        print('Unexpected error in foreground message handling: $e');
      }
    });
    // Dynamic links now handled centrally in NewHomepage
  }


  Future<void> requestNotificationPermissions() async {
    if (Platform.isAndroid) {
      final NotificationSettings settings = await FirebaseMessaging.instance.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );

      if (settings.authorizationStatus == AuthorizationStatus.authorized) {
        print('User granted permission');
      } else if (settings.authorizationStatus == AuthorizationStatus.provisional) {
        print('User granted provisional permission');
      } else {
        print('User declined or has not accepted permission');
      }
    }
  }

  Future<void> getAndPrintFCMToken() async {
    try {
      String? token = await FirebaseMessaging.instance.getToken();
      if (token != null) {
        print('FCM Token: $token');
      } else {
        print('Failed to get FCM token: Token is null');
      }
    } on FirebaseException catch (e) {
      print('FirebaseException getting FCM token: ${e.code} - ${e.message}');
      _showSnackBar('Failed to retrieve FCM token: ${e.message}');
    } catch (e) {
      print('Unexpected error getting FCM token: $e');
    }
  }

  Future<void> initializeNotifications() async {
    const AndroidInitializationSettings initializationSettingsAndroid =
    AndroidInitializationSettings('@mipmap/ic_launcher');
    const InitializationSettings initializationSettings =
    InitializationSettings(android: initializationSettingsAndroid);
    await flutterLocalNotificationsPlugin.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: (NotificationResponse details) async {
        if (details.payload != null) {
          print('Notification payload: ${details.payload}');
        }
      },
    );
  }

  void _initDynamicLinks() async {
    try {
      // Ensure Firebase is initialized before accessing Dynamic Links
      await Firebase.initializeApp();

      FirebaseDynamicLinks.instance.onLink.listen((PendingDynamicLinkData dynamicLinkData) {
        _handleDynamicLink(dynamicLinkData);
      }).onError((error) {
        print('Dynamic link error: $error');
      });

      final PendingDynamicLinkData? initialLink = await FirebaseDynamicLinks.instance.getInitialLink();
      if (initialLink != null) {
        _handleDynamicLink(initialLink);
      }
    } catch (e) {
      print('Error initializing dynamic links: $e');
    }
  }

  void _handleDynamicLink(PendingDynamicLinkData data) {
    final Uri? deepLink = data.link;

    if (deepLink != null) {
      final artistId = deepLink.queryParameters['artistId'];
      if (artistId != null) {
        print('Dynamic link detected with artistId: $artistId');
        WidgetsBinding.instance.addPostFrameCallback((_) {
          navigatorKey.currentState?.push(
            MaterialPageRoute(
              builder: (context) => MusicArtistPage(
                artistName: 'Unknown Artist',
                followerCount: 0,
                userId: 'user_id',
                category: 'category',
                userfullname: 'User Full Name',
                isFollowing: false,
                artistId: artistId,
                profileImageUrl: null,
                coverImageUrl: null,
              ),
            ),
          );
        });
      }
    }
  }

  Future<void> showNotification(RemoteNotification notification) async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    bool isNotificationsEnabled = prefs.getBool('isNotificationsEnabled') ?? true;

    if (isNotificationsEnabled) {
      String largeIconPath = '';
      if (notification.body != null) {
        if (notification.body!.contains('approved')) {
          largeIconPath = 'assets/Approved.png';
        } else if (notification.body!.contains('rejected')) {
          largeIconPath = 'assets/rejected.png';
        }
      }

      ByteArrayAndroidBitmap? largeIconBitmap;
      try {
        final base64String = await _loadDrawableAsBase64(largeIconPath.isNotEmpty ? largeIconPath : 'assets/default_icon.png');
        if (base64String.isNotEmpty) {
          largeIconBitmap = ByteArrayAndroidBitmap.fromBase64String(base64String);
        }
      } catch (e) {
        print('Error loading large icon: $e');
        largeIconBitmap = null;
      }

      AndroidNotificationDetails androidPlatformChannelSpecifics = AndroidNotificationDetails(
        'high_importance_channel',
        'High Importance Notifications',
        channelDescription: 'This channel is used for important notifications.',
        importance: Importance.max,
        priority: Priority.high,
        showWhen: true,
        icon: '@mipmap/ic_launcher',
        largeIcon: largeIconBitmap,
        color: const Color(0xFF486299),
      );

      NotificationDetails platformChannelSpecifics = NotificationDetails(android: androidPlatformChannelSpecifics);

      await flutterLocalNotificationsPlugin.show(
        notification.hashCode,
        notification.title ?? 'New Notification',
        notification.body ?? 'You have a new message',
        platformChannelSpecifics,
      );
    } else {
      print("Notifications are disabled, not showing notification.");
    }
  }

  Future<String> _loadDrawableAsBase64(String drawablePath) async {
    try {
      final ByteData imageBytes = await rootBundle.load(drawablePath);
      final buffer = imageBytes.buffer;
      return base64Encode(Uint8List.view(buffer));
    } catch (e) {
      print('Error loading drawable as base64: $e');
      return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: navigatorKey,
      scaffoldMessengerKey: scaffoldMessengerKey,
      debugShowCheckedModeBanner: false,
      theme: customTheme,
      onGenerateRoute: (settings) {
        if (settings.name != null && settings.name!.contains('/track')) {
          final uri = Uri.parse(settings.name!);
          final songDataJson = uri.queryParameters['songData'];

          if (songDataJson != null) {
            final songData = jsonDecode(songDataJson) as Map<String, dynamic>;
            return MaterialPageRoute(
              builder: (context) => FutureBuilder(
                future: _addSongToAudioService(songData),
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.done) {
                    return MusicPlayerPage(
                      userfullname: 'User Name',
                      currentIndex: 0,
                      email: 'user@example.com',
                      userCategory: 'General',
                      sourceType: 'genre',
                      sourceName: 'Search Results',
                    );
                  }
                  return Center(child: CircularProgressIndicator());
                },
              ),
            );
          }
        }
        return null;
      },
      home: SplashScreen(),
    );
  }
}

Future<void> _addSongToAudioService(Map<String, dynamic> songData) async {
  final song = {
    'song_id': songData['id']?.toString() ?? '',
    'title': songData['title']?.toString() ?? 'Unknown Title',
    'artist': songData['artist']?.toString() ?? 'Unknown Artist',
    'album': songData['album']?.toString() ?? 'Unknown Album',
    'coverPage': songData['artUri']?.toString() ?? 'assets/kill.png',
    'streamingUrl': songData['streamingUrl']?.toString() ?? '',
    'duration': songData['duration']?.toString() ?? '0:00',
  };

  await AudioService().loadPlaylist([song], initialIndex: 0);
}

void showConfirmationDialog(
    BuildContext context, String email, {required Function(String) onConfirmSuccess, required Function() onResendCode}) {
  final TextEditingController codeController = TextEditingController();
  Timer? timer;
  bool isDialogActive = true;
  bool isConfirmLoading = false;
  int resendCodeCountdown = 30;
  bool isResendButtonEnabled = false;

  void showCustomSnackBar(BuildContext context, String message) {
    if (!isDialogActive) return;
    final overlay = Overlay.of(context);
    final overlayEntry = OverlayEntry(
      builder: (context) {
        final keyboardHeight = MediaQuery.of(context).viewInsets.bottom;
        final double bottomPadding = keyboardHeight > 0 ? keyboardHeight + 8 : 16;

        return Positioned(
          bottom: bottomPadding,
          left: 16,
          right: 16,
          child: Material(
            color: Colors.transparent,
            child: Container(
              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(4),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 4,
                    offset: Offset(0, 2),
                  ),
                ],
              ),
              child: Text(
                message,
                style: TextStyle(
                  color: Colors.black,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),
        );
      },
    );

    overlay.insert(overlayEntry);
    Future.delayed(Duration(seconds: 3), () {
      if (isDialogActive && overlayEntry.mounted) {
        overlayEntry.remove();
      }
    });
  }

  void cleanup() {
    isDialogActive = false;
    timer?.cancel();
  }

  String maskEmail(String email) {
    if (email.isEmpty) return '';
    final parts = email.split('@');
    if (parts.length != 2) return email;
    final domain = parts[1];
    return 'xxxxxx@$domain';
  }

  showDialog(
    context: context,
    barrierDismissible: false,
    builder: (BuildContext dialogContext) {
      double screenWidth = MediaQuery.of(context).size.width;

      return WillPopScope(
        onWillPop: () async {
          cleanup();
          return true;
        },
        child: StatefulBuilder(
          builder: (BuildContext context, void Function(void Function()) setState) {
            if (timer == null && isDialogActive) {
              timer = Timer.periodic(Duration(seconds: 1), (Timer t) {
                if (!isDialogActive) {
                  t.cancel();
                  return;
                }
                setState(() {
                  if (resendCodeCountdown > 0) {
                    resendCodeCountdown--;
                  } else {
                    isResendButtonEnabled = true;
                    t.cancel();
                  }
                });
              });
            }

            return BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
              child: AlertDialog(
                backgroundColor: Color(0xFF160101),
                title: Text(
                  'Confirm Sign Up',
                  style: TextStyle(color: Colors.white, fontSize: 24),
                  textAlign: TextAlign.center,
                ),
                content: SingleChildScrollView(
                  child: Container(
                    width: screenWidth * 0.8,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        SizedBox(height: 10),
                        Center(
                            child: Text('A confirmation code was',
                                style: TextStyle(color: Colors.white, fontSize: 16), textAlign: TextAlign.center)),
                        Center(
                            child:
                            Text('sent to:', style: TextStyle(color: Colors.white, fontSize: 16), textAlign: TextAlign.center)),
                        SizedBox(height: 10),
                        Center(
                          child: Text(
                            email,
                            style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 16),
                          ),
                        ),
                        SizedBox(height: 10),
                        Center(
                            child: Text('Enter the confirmation code below to verify your account.',
                                style: TextStyle(color: Colors.white, fontSize: 16), textAlign: TextAlign.center)),
                        SizedBox(height: 25),
                        TextFormField(
                          controller: codeController,
                          cursorColor: Colors.black,
                          style: TextStyle(color: Colors.black, fontSize: 16),
                          textAlign: TextAlign.left,
                          keyboardType: TextInputType.number,
                          inputFormatters: [
                            FilteringTextInputFormatter.digitsOnly,
                            LengthLimitingTextInputFormatter(6),
                            TextInputFormatter.withFunction((oldValue, newValue) {
                              final cleanedValue = newValue.text.replaceAll(RegExp(r'\D'), '');
                              final trimmedValue = cleanedValue.length > 6 ? cleanedValue.substring(0, 6) : cleanedValue;

                              return TextEditingValue(
                                text: trimmedValue,
                                selection: TextSelection.collapsed(offset: trimmedValue.length),
                              );
                            }),
                          ],
                          decoration: InputDecoration(
                            hintText: 'Code',
                            hintStyle: TextStyle(color: Color(0xFF160101)),
                            contentPadding: EdgeInsets.symmetric(
                              vertical: 16,
                              horizontal: 16,
                            ),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: BorderSide(color: Colors.white),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: BorderSide(color: Colors.white.withOpacity(0.5)),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: BorderSide(color: Colors.white, width: 2),
                            ),
                            filled: true,
                            fillColor: Colors.white,
                          ),
                        ),
                        Align(
                          alignment: Alignment.centerLeft,
                          child: TextButton(
                            onPressed: isResendButtonEnabled
                                ? () async {
                              if (!isDialogActive) return;
                              await onResendCode();
                              codeController.clear();
                              showCustomSnackBar(context, 'Confirmation code resent to $email');
                              setState(() {
                                resendCodeCountdown = 30;
                                isResendButtonEnabled = false;
                                timer?.cancel();
                                timer = Timer.periodic(Duration(seconds: 1), (Timer t) {
                                  if (!isDialogActive) {
                                    t.cancel();
                                    return;
                                  }
                                  setState(() {
                                    if (resendCodeCountdown > 0) {
                                      resendCodeCountdown--;
                                    } else {
                                      isResendButtonEnabled = true;
                                      t.cancel();
                                    }
                                  });
                                });
                              });
                            }
                                : null,
                            style: TextButton.styleFrom(
                              padding: EdgeInsets.zero,
                              alignment: Alignment.centerLeft,
                            ),
                            child: Text(
                              isResendButtonEnabled ? 'Resend Code' : 'Resend Code($resendCodeCountdown)',
                              style: TextStyle(
                                color: isResendButtonEnabled ? Colors.white : Colors.grey,
                                fontSize: 16,
                              ),
                            ),
                          ),
                        ),
                        SizedBox(height: 10),
                        SizedBox(
                          width: 174,
                          height: 47,
                          child: ElevatedButton(
                            onPressed: isConfirmLoading
                                ? null
                                : () async {
                              if (!isDialogActive) return;
                              if (codeController.text.length != 6) {
                                showCustomSnackBar(context, 'Please enter a 6-digit confirmation code');
                                return;
                              }
                              setState(() {
                                isConfirmLoading = true;
                              });

                              try {
                                await onConfirmSuccess(codeController.text);
                                Navigator.of(context).pop();
                              } catch (e) {
                                showCustomSnackBar(context, e.toString());
                              } finally {
                                if (isDialogActive) {
                                  setState(() {
                                    isConfirmLoading = false;
                                  });
                                }
                              }
                            },
                            child: isConfirmLoading
                                ? SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            )
                                : Text('Confirm', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Color(0xFF2644D9),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      );
    },
  ).then((_) {
    isDialogActive = false;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      codeController.dispose();
    });
  });
}

class GoogleSignUpService {
  final GoogleSignIn _googleSignIn = GoogleSignIn(scopes: ['email']);

  Future<Map<String, String>?> _fetchUserIdAndCategory(String email) async {
    try {
      final userDetails = await ApiService.getUserDetails(email);
      if (userDetails != null) {
        return {
          'userId': userDetails['userId'] ?? '',
          'userCategory': userDetails['userCategory'] ?? '',
          'userfullname': userDetails['userFullName'] ?? '',
        };
      }
      return null;
    } catch (e) {
      print('Error fetching user details: $e');
      return null;
    }
  }

  Future<String> saveUserToApi(String email) async {
    // TODO: Implement this method in ApiService if needed
    // For now, we'll return an empty string as the original implementation had a placeholder
    return '';
  }

  void _showErrorDialog(BuildContext context, String title, String message, {bool isRichText = false, String emailAddress = ""}) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text(title),
          content: isRichText
              ? RichText(
            text: TextSpan(
              style: TextStyle(color: Colors.white, fontSize: 16),
              children: [
                TextSpan(text: message),
                TextSpan(
                  text: emailAddress,
                  style: TextStyle(
                    color: Colors.blue,
                    fontStyle: FontStyle.italic,
                    fontFamily: 'Poppins',
                    fontSize: 16,
                    decoration: TextDecoration.underline,
                    decorationColor: Colors.blue,
                  ),
                ),
              ],
            ),
          )
              : Text(message),
          actions: [
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: Text('OK', style: TextStyle(color: Colors.white)),
              style: ElevatedButton.styleFrom(backgroundColor: Color(0xFF2644D9)),
            ),
          ],
          actionsAlignment: MainAxisAlignment.center,
        );
      },
    );
  }

  Future<String> _fetchGooglePassword(String email) async {
    try {
      return await ApiService.generateGooglePassword(email);
    } catch (e) {
      print('Error generating password: $e');
      throw Exception('Unable to generate password. Please try again.');
    }
  }

  Future<Map<String, dynamic>?> signUpWithGoogle(BuildContext context) async {
    try {
      await _googleSignIn.signOut();
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      if (googleUser == null) return null;

      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      await FirebaseAuth.instance.signOut();
      final UserCredential userCredential = await FirebaseAuth.instance.signInWithCredential(credential);
      final User? user = userCredential.user;
      if (user == null) throw Exception('Failed to create account with Google');

      final String email = user.email ?? '';
      if (email.isEmpty) return null;

      final existingUserDetails = await _fetchUserIdAndCategory(email);
      if (existingUserDetails != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('An account with this email already exists. Please log in instead.')),
        );
        await _googleSignIn.signOut();
        return null;
      }

      final String randomPassword = await _fetchGooglePassword(email);

      try {
        final signUpResult = await Amplify.Auth.signUp(
          username: email,
          password: randomPassword,
          options: SignUpOptions(
            userAttributes: {
              CognitoUserAttributeKey.email: email,
              CognitoUserAttributeKey.name: googleUser.displayName ?? '',
            },
          ),
        );

        if (signUpResult.nextStep.signUpStep == AuthSignUpStep.confirmSignUp) {
          bool verificationCompleted = await _showEmailVerificationDialog(context, email);
          if (!verificationCompleted) {
            return null;
          }
        }

        final userId = await saveUserToApi(email);

        final result = await Amplify.Auth.signIn(
          username: email,
          password: randomPassword,
        );

        if (result.isSignedIn) {
          await loginMethodNotifier.saveLoginMethod(LoginMethodNotifier.LOGIN_METHOD_GOOGLE);
          final userDetails = await _fetchUserIdAndCategory(email);
          if (userDetails != null) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (context) => NewHomePage(
                  email: userDetails['userId']!,
                  category: userDetails['userCategory']!,
                  userfullname: userDetails['userfullname'] ?? '',
                ),
              ),
            );
          } else {
            print('Failed to retrieve user details');
          }
        }

        return {
          'email': email,
          'name': googleUser.displayName ?? '',
          'photoUrl': googleUser.photoUrl,
          'userId': userId,
        };
      } on AuthException catch (e) {
        if (e.message.contains('LimitExceededException') || e.message.contains('Attempt limit exceeded')) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Attempt limit exceeded, please contact the administrator at info@voiz.co.in'),
              duration: Duration(seconds: 3),
            ),
          );
          await _googleSignIn.signOut();
          return null;
        } else if (e is UsernameExistsException) {
          try {
            await Amplify.Auth.resendSignUpCode(username: email);
            bool verificationCompleted = await _showEmailVerificationDialog(context, email);

            if (!verificationCompleted) {
              await _googleSignIn.signOut();
              return null;
            }

            final result = await Amplify.Auth.signIn(
              username: email,
              password: randomPassword,
            );

            if (result.isSignedIn) {
              String userId;
              try {
                userId = await saveUserToApi(email);
              } catch (apiError) {
                final userDetails = await _fetchUserIdAndCategory(email);
                if (userDetails != null) {
                  userId = userDetails['userId']!;
                } else {
                  throw Exception('Failed to get or create user in database');
                }
              }

              await loginMethodNotifier.saveLoginMethod(LoginMethodNotifier.LOGIN_METHOD_GOOGLE);
              final userDetails = await _fetchUserIdAndCategory(email);
              if (userDetails != null) {
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(
                    builder: (context) => NewHomePage(
                      email: userDetails['userId']!,
                      category: userDetails['userCategory']!,
                      userfullname: userDetails['userfullname'] ?? '',
                    ),
                  ),
                );
                return {
                  'email': email,
                  'name': googleUser.displayName ?? '',
                  'photoUrl': googleUser.photoUrl,
                  'userId': userId,
                };
              }
              return null;
            }
          } on AuthException catch (e) {
            if (e.message.contains('LimitExceededException') || e.message.contains('Attempt limit exceeded')) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Attempt limit exceeded, please contact the administrator at info@voiz.co.in'),
                  duration: Duration(seconds: 3),
                ),
              );
            } else if (e.message.contains('User is already confirmed')) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('An account with this email already exists. Please log in instead.')),
              );
            } else {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Error confirming account: ${e.message}')),
              );
            }
            await _googleSignIn.signOut();
            return null;
          }
        } else {
          print('Cognito error: $e');
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error creating account: ${e.message}')),
          );
          return null;
        }
      }
    } catch (e) {
      print('Error in Google Sign Up: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to sign up with Google: ${e.toString()}')),
      );
      await _googleSignIn.signOut();
      return null;
    }
  }

  Future<bool> _showEmailVerificationDialog(BuildContext context, String email) async {
    Completer<bool> completer = Completer<bool>();

    showConfirmationDialog(
      context,
      email,
      onConfirmSuccess: (code) async {
        try {
          final result = await Amplify.Auth.confirmSignUp(
            username: email,
            confirmationCode: code,
          );

          if (result.isSignUpComplete) {
            completer.complete(true);
            return true;
          } else {
            throw Exception('Verification not complete');
          }
        } on AuthException catch (e) {
          if (e.message.contains('CodeMismatchException')) {
            throw 'Incorrect code. Please try again.';
          } else if (e.message.contains('ExpiredCodeException')) {
            throw 'Code expired. Please request a new one.';
          } else if (e.message.contains('LimitExceededException') || e.message.contains('Attempt limit exceeded')) {
            _showErrorDialog(
              context,
              'Too Many Attempts',
              "Attempt limit exceeded, please contact the administrator at ",
              isRichText: true,
              emailAddress: "info@voiz.co.in",
            );
            completer.complete(false);
            throw 'Attempt limit exceeded.';
          } else {
            throw 'Error: ${e.message}';
          }
        }
      },
      onResendCode: () async {
        try {
          await Amplify.Auth.resendSignUpCode(username: email);
          return true;
        } on AuthException catch (e) {
          if (e.message.contains('LimitExceededException') || e.message.contains('Attempt limit exceeded')) {
            _showErrorDialog(
              context,
              'Failed to resend code',
              "Attempt limit exceeded",
              isRichText: true,
              emailAddress: "info@voiz.co.in",
            );
            throw 'Failed to resend code: ${e.message}';
          }
          throw 'Error';
        }
      },
    );

    Timer(Duration(minutes: 5), () {
      if (!completer.isCompleted) {
        completer.complete(false);
      }
    });

    return completer.future;
  }

  String _generateSecurePassword(String email) {
    return 'Google_${email.hashCode.toString()}!123';
  }
}

class FirstPage extends StatefulWidget {
  @override
  _FirstPageState createState() => _FirstPageState();
}

class _FirstPageState extends State<FirstPage> {
  bool _amplifyConfigured = false;
  ValueNotifier<bool> isNowPlayingTileVisible = ValueNotifier<bool>(true);
  final GoogleSignUpService _googleSignUpService = GoogleSignUpService();
  DateTime? _lastBackPressTime;
  StreamSubscription? _sub;
  bool _isLoading = true;
  bool _isNoInternet = false;
  late ConnectivityService _connectivityService;
  bool _mounted = true;

  Future<Map<String, String>?> _fetchUserIdAndCategory(String email) async {
    try {
      final userDetails = await ApiService.getUserDetails(email);
      if (userDetails != null) {
        return {
          'userId': userDetails['userId'] ?? '',
          'userCategory': userDetails['userCategory'] ?? '',
          'userfullname': userDetails['userFullName'] ?? '',
        };
      }
      return null;
    } catch (e) {
      print('Error fetching user details: $e');
      return null;
    }
  }

  void _setupConnectivityListener() {
    _connectivityService.connectionStream.listen((hasConnection) {
      if (!_mounted || _connectivityService.isClosed) return;

      setState(() {
        _isNoInternet = !hasConnection;
      });

      if (hasConnection && _isNoInternet) {
        _initializeData();
      }
    });

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
      await _configureAmplify();

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
    _sub?.cancel();
    _mounted = false;
    _connectivityService.dispose();
    AudioService().dispose();
    super.dispose();
  }

  Future<bool> _handleWillPop() async {
    if (_lastBackPressTime == null || DateTime.now().difference(_lastBackPressTime!) > Duration(seconds: 2)) {
      // Use the context from FirstPage which has access to Scaffold
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Press back again to exit'),
            duration: Duration(seconds: 2),
          ),
        );
      }
      _lastBackPressTime = DateTime.now();
      return false;
    }
    Navigator.of(context).popUntil((route) => route.isFirst);
    await SystemNavigator.pop();
    return true;
  }

  Future<void> _signUpWithGoogle() async {
    final result = await _googleSignUpService.signUpWithGoogle(context);

    if (result != null) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => AddinfoPage(
            email: result['email'] ?? '',
            userId: result['userId'] ?? '',
          ),
        ),
      );
    }
  }

  Future<void> _configureAmplify() async {
    try {
      final authPlugin = AmplifyAuthCognito();
      await Amplify.addPlugins([authPlugin]);
      await Amplify.configure(amplifyconfig);
      print('Successfully configured Amplify');
      setState(() {
        _amplifyConfigured = true;
      });
      _checkLoginState();
    } catch (e) {
      print('Error configuring Amplify: $e');
    }
  }

  void _checkLoginState() async {
    if (!_amplifyConfigured) {
      print('Amplify not configured, skipping login state check');
      return;
    }

    try {
      final user = await Amplify.Auth.getCurrentUser();
      if (user != null) {
        final email = await _getUserEmail();
        if (email != null) {
          print('Email fetched: $email');
          final userDetails = await _fetchUserIdAndCategory(email);
          if (userDetails != null) {
            final userId = userDetails['userId'] ?? '';
            final userCategory = userDetails['userCategory'] ?? 'Listener';
            final userfullname = userDetails['userfullname'] ?? '';

            if (userId.isEmpty) {
              print('User ID is empty, redirecting to login');
              await _signOutAndRedirect();
              return;
            }

            try {
              final profileManager = ProfileManager();
              profileManager.setUserId(userId);
              print('ProfileManager initialized with userId: $userId');
              await profileManager.initialize(userId);
              print('ProfileManager initialized successfully');

              WidgetsBinding.instance.addPostFrameCallback((_) {
                if (mounted) {
                  Navigator.pushReplacement(
                    context,
                    MaterialPageRoute(
                      builder: (context) => NewHomePage(
                        email: userId,
                        category: userCategory,
                        userfullname: userfullname,
                      ),
                    ),
                  );
                }
              });
            } catch (e) {
              print('Error initializing ProfileManager: $e');
              await _signOutAndRedirect();
            }
          } else {
            print('Failed to retrieve user details');
            await _signOutAndRedirect();
          }
        } else {
          print('Failed to fetch user email');
          await _signOutAndRedirect();
        }
      } else {
        print('No current user found');
        await _signOutAndRedirect();
      }
    } on AuthException catch (e) {
      print('Error checking login state: ${e.message}');
      await _signOutAndRedirect();
    } catch (e) {
      print('Unexpected error in checkLoginState: $e');
      await _signOutAndRedirect();
    }
  }

  Future<void> _signOutAndRedirect() async {
    try {
      print('Signing out...');
      await Amplify.Auth.signOut();
      print('Successfully signed out.');
    } catch (e) {
      print('Error during sign out: $e');
    } finally {
      print('Redirecting to login page...');
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => LoginPage()),
      );
    }
  }

  Future<String?> _getUserEmail() async {
    try {
      final attributes = await Amplify.Auth.fetchUserAttributes();

      for (var attr in attributes) {
        print('Attribute: ${attr.userAttributeKey} = ${attr.value}');
      }

      final emailAttribute = attributes.firstWhere(
            (attr) => attr.userAttributeKey == CognitoUserAttributeKey.email,
        orElse: () => AuthUserAttribute(
          userAttributeKey: CognitoUserAttributeKey.email,
          value: '',
        ),
      );

      if (emailAttribute.value.isEmpty) {
        print('Email attribute not found');
        return null;
      }

      return emailAttribute.value;
    } catch (e) {
      print('Error fetching email: $e');
      return null;
    }
  }

  Future<void> _signInWithGoogle() async {
    try {
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      if (googleUser == null) {
        print('Google sign-in canceled');
        return;
      }

      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      final userCredential = await FirebaseAuth.instance.signInWithCredential(credential);
      final user = userCredential.user;

      if (user != null) {
        final email = user.email;
        if (email != null) {
          final userDetails = await _fetchUserIdAndCategory(email);
          if (userDetails != null) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(
                builder: (context) => NewHomePage(
                  email: userDetails['userId']!,
                  category: userDetails['userCategory']!,
                  userfullname: userDetails['userfullname'] ?? '',
                ),
              ),
            );
          } else {
            print('Failed to retrieve user details');
          }
        }
      }
    } catch (e) {
      print('Error signing in with Google: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: _handleWillPop,
      child: Stack(
        children: [
          GradientScaffold(
            body: SingleChildScrollView(
              controller: ScrollController(),
              child: Center(
                child: Container(
                  padding: EdgeInsets.fromLTRB(16, 130, 16, 16),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.start,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: <Widget>[
                      Image.asset(
                        'assets/logo_final.png',
                        height: 200,
                        color: Color(0xFFFFFFFF),
                      ),
                      SizedBox(height: 180),
                      ElevatedButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            PageRouteBuilder(
                              pageBuilder: (context, animation, secondaryAnimation) => LoginPage(),
                              transitionsBuilder: (context, animation, secondaryAnimation, child) {
                                const begin = Offset(0.0, 0.0);
                                const end = Offset.zero;
                                final tween = Tween(begin: begin, end: end);
                                final offsetAnimation = animation.drive(tween);

                                return SlideTransition(
                                  position: offsetAnimation,
                                  child: child,
                                );
                              },
                              transitionDuration: Duration(milliseconds: 300),
                            ),
                          );
                        },
                        child: Text(
                          'Log in',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          minimumSize: Size(312, 56),
                          backgroundColor: Color(0xFF2644D9),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(25),
                          ),
                          shadowColor: Color.fromRGBO(0, 0, 0, 0.25),
                          elevation: 4,
                        ),
                      ),
                      SizedBox(height: 15),
                      ElevatedButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            PageRouteBuilder(
                              pageBuilder: (context, animation, secondaryAnimation) => RegistrationPage(),
                              transitionsBuilder: (context, animation, secondaryAnimation, child) {
                                const begin = Offset(0.0, 0.0);
                                const end = Offset.zero;
                                final tween = Tween(begin: begin, end: end);
                                final offsetAnimation = animation.drive(tween);

                                return SlideTransition(
                                  position: offsetAnimation,
                                  child: child,
                                );
                              },
                              transitionDuration: Duration(milliseconds: 300),
                            ),
                          );
                        },
                        child: Text(
                          'Sign up',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        style: ElevatedButton.styleFrom(
                          minimumSize: Size(312, 56),
                          backgroundColor: Color(0xFF2644D9),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(25),
                          ),
                          shadowColor: Color.fromRGBO(0, 0, 0, 0.25),
                          elevation: 4,
                        ),
                      ),
                      SizedBox(height: 20),
                    ],
                  ),
                ),
              ),
            ),
          ),
          // LoadingScreen(
          //   isLoading: _isLoading,
          //   isNoInternet: _isNoInternet,
          //   onRetry: _checkConnectivity,
          // ),
        ],
      ),
    );
  }
}