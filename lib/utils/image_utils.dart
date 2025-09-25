import 'package:flutter/services.dart';

class ImageUtils {
  /// Dynamically loads image by checking for webp first, then png as fallback
  /// Returns the path of the available image format
  static Future<String> getImagePath(String basePath, String imageName) async {
    // Try webp first (preferred format)
    String webpPath = '$basePath/$imageName.webp';
    try {
      await rootBundle.load(webpPath);
      return webpPath;
    } catch (e) {
      // If webp not found, try png
      String pngPath = '$basePath/$imageName.png';
      try {
        await rootBundle.load(pngPath);
        return pngPath;
      } catch (e) {
        // If neither found, return default or throw error
        print('Warning: Neither $webpPath nor $pngPath found');
        return '$basePath/default.png'; // fallback to default
      }
    }
  }

  /// Synchronous version that returns the preferred path without checking
  /// Use this when you're confident the image exists
  static String getPreferredImagePath(String basePath, String imageName) {
    // Always prefer webp format
    return '$basePath/$imageName.webp';
  }

  /// Get genre image path dynamically
  static Future<String> getGenreImagePath(String genreName) async {
    return await getImagePath('assets/genre', genreName);
  }

  /// Get language image path dynamically  
  static Future<String> getLanguageImagePath(String languageName) async {
    return await getImagePath('assets/lang', languageName);
  }

  /// Synchronous versions for immediate use
  static String getGenreImagePathSync(String genreName) {
    return getPreferredImagePath('assets/genre', genreName);
  }

  static String getLanguageImagePathSync(String languageName) {
    return getPreferredImagePath('assets/lang', languageName);
  }
}
