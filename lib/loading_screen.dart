import 'package:flutter/material.dart';
import 'dart:ui';

class LoadingScreen extends StatelessWidget {
  final bool isLoading;
  final bool isNoInternet;
  final VoidCallback? onRetry;

  const LoadingScreen({
    Key? key,
    this.isLoading = false,
    this.isNoInternet = false,
    this.onRetry,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (!isLoading && !isNoInternet) return const SizedBox.shrink();

    // For loading state, we'll show just the indicator without a container
    // if (isLoading) {
    //   return Stack(
    //     children: [
    //       // Blurred background
    //       BackdropFilter(
    //         filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
    //         child: Container(
    //           color: Colors.black.withOpacity(0.0),
    //           width: double.infinity,
    //           height: double.infinity,
    //         ),
    //       ),
    //       // Only the loading indicator
    //       const Center(
    //         child: CircularProgressIndicator(
    //           valueColor: AlwaysStoppedAnimation<Color>(Colors.green),
    //         ),
    //       ),
    //     ],
    //   );
    // }

    // For loading state, we'll show just the indicator without blur or container
    if (isLoading) {
      return const Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(Colors.green),
        ),
      );
    }

    // For no internet state, we'll show the container with message
    return Stack(
      children: [
        // Blurred background
        BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
          child: Container(
            color: Colors.black.withOpacity(0.0),
            width: double.infinity,
            height: double.infinity,
          ),
        ),
        // Content
        Center(
          child: Material(
            elevation: 8,
            color: Colors.transparent,
            borderRadius: BorderRadius.circular(15),
            child: Container(
              width: 200,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
              decoration: BoxDecoration(
                color: const Color(0xFF151415),
                borderRadius: BorderRadius.circular(15),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.2),
                    blurRadius: 1,
                    spreadRadius: 2,
                  ),
                ],
                border: Border.all(
                  color: Colors.black45,
                  width: 1.0,
                ),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.wifi_off,
                    size: 32,
                    color: Colors.white,
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'No Internet Connection',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      decoration: TextDecoration.none,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  if (onRetry != null) ...[
                    const SizedBox(height: 16),
                    // ElevatedButton(
                    //   onPressed: onRetry,
                    //   child: const Text('Retry'),
                    // ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}