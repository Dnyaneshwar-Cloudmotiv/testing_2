// SongStatusManager.dart
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:intl/intl.dart';
import 'package:voiceapp/services/api_service.dart';
class SongStatusManager {
  static final SongStatusManager _instance = SongStatusManager._internal();

  factory SongStatusManager() => _instance;

  SongStatusManager._internal();

  ValueNotifier<bool> isFavoriteNotifier = ValueNotifier(false);
  bool isCelebration = false;


  void updateFavoriteStatus(bool isFavorite) {
    isFavoriteNotifier.value = isFavorite;
  }

  // Fetch the song's favorite and celebration status directly from the API
  Future<void> fetchStatus(String songId, String userId) async {
    try {
      final response = await ApiService.getFavoriteReaction(userId, songId);
      
      if (ApiService.isSuccessResponse(response)) {
        final data = ApiService.parseJsonListResponse(response);
        print(data);

        if (data != null && data.isNotEmpty && data[0] != null) {
          isFavoriteNotifier.value = data[0]['favorite']?['BOOL'] ?? false;
          isCelebration = data[0]['reaction']?['BOOL'] ?? false;
        } else {
          isFavoriteNotifier.value = false;
          isCelebration = false;
        }
      } else {
        print('Failed to fetch status: ${ApiService.getErrorMessage(response)}');
        isFavoriteNotifier.value = false;
        isCelebration = false;
      }
    } catch (e) {
      print('Error fetching song status: $e');
      isFavoriteNotifier.value = false;
      isCelebration = false;
    }
  }

  // Update song status directly on the server without caching
  Future<void> updateStatus(String songId, String userId, bool newFavoriteStatus, bool newCelebrationStatus) async {
    final String timestamp = DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());
    isFavoriteNotifier.value = newFavoriteStatus;
    isCelebration = newCelebrationStatus;

    try {
      // Update favorite status on the server
      final favoriteResponse = await ApiService.updateSongFavorite({
        'song_id': songId,
        'favorite': isFavoriteNotifier.value,
        'user_id': userId,
        'updatedTimestamp': timestamp
      });

      if (ApiService.isSuccessResponse(favoriteResponse)) {
        print('Favorite status updated successfully.');
      } else {
        print('Failed to update favorite status: ${ApiService.getErrorMessage(favoriteResponse)}');
      }

      // Update celebration status on the server
      final celebrationResponse = await ApiService.updateSongReaction({
        'song_id': songId,
        'user_id': userId,
        'reaction': newCelebrationStatus.toString(),
        'updatedTimestamp': timestamp
      });

      if (ApiService.isSuccessResponse(celebrationResponse)) {
        print('Celebration status updated successfully.');
      } else {
        print('Failed to update celebration status: ${ApiService.getErrorMessage(celebrationResponse)}');
      }
    } catch (e) {
      print('Error updating song status: $e');
    }
  }

  // Add this new method to SongStatusManager
  Future<void> updateFavoriteOnly(String songId, String userId, bool newFavoriteStatus) async {
    final String timestamp = DateFormat('yyyyMMdd_HHmmss').format(DateTime.now());

    // Update local state
    isFavoriteNotifier.value = newFavoriteStatus;

    try {
      // Update favorite status on the server
      final favoriteResponse = await ApiService.updateSongFavorite({
        'song_id': songId,
        'favorite': isFavoriteNotifier.value,
        'user_id': userId,
        'updatedTimestamp': timestamp
      });

      if (ApiService.isSuccessResponse(favoriteResponse)) {
        print('Favorite status updated successfully.');
      } else {
        print('Failed to update favorite status: ${ApiService.getErrorMessage(favoriteResponse)}');
      }
    } catch (e) {
      print('Error updating favorite status: $e');
    }
  }

  void reset() {
    isFavoriteNotifier.value = false;
    isCelebration = false;
  }
}
