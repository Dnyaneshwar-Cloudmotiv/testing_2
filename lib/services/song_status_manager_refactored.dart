// SongStatusManager.dart - Refactored to use centralized API service
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'api_service.dart';

class SongStatusManager {
  static final SongStatusManager _instance = SongStatusManager._internal();

  factory SongStatusManager() => _instance;

  SongStatusManager._internal();

  ValueNotifier<bool> isFavoriteNotifier = ValueNotifier(false);
  bool isCelebration = false;

  void updateFavoriteStatus(bool isFavorite) {
    isFavoriteNotifier.value = isFavorite;
  }

  // Fetch the song's favorite and celebration status using centralized API service
  Future<void> fetchStatus(String songId, String userId) async {
    try {
      final response = await ApiService.getFavoriteReaction(userId, songId);
      
      if (ApiService.isSuccessResponse(response)) {
        final data = ApiService.parseJsonResponse(response);
        print(data);

        if (data != null && data.isNotEmpty && data[0] != null) {
          isFavoriteNotifier.value = data[0]['favorite']?['BOOL'] ?? false;
          isCelebration = data[0]['reaction']?['BOOL'] ?? false;
        } else {
          _resetStatus();
        }
      } else {
        print('Failed to fetch status: ${response.statusCode}');
        _resetStatus();
      }
    } catch (e) {
      print('Error fetching song status: $e');
      _resetStatus();
    }
  }

  // Update song status using centralized API service
  Future<void> updateStatus(String songId, String userId, bool newFavoriteStatus, bool newCelebrationStatus) async {
    // Update local state immediately
    isFavoriteNotifier.value = newFavoriteStatus;
    isCelebration = newCelebrationStatus;

    try {
      // Update favorite status
      final favoriteData = {
        'song_id': songId,
        'favorite': newFavoriteStatus,
        'user_id': userId,
        'updatedTimestamp': ApiService.timestamp
      };

      final favoriteResponse = await ApiService.updateSongFavorite(favoriteData);

      if (ApiService.isSuccessResponse(favoriteResponse)) {
        print('Favorite status updated successfully.');
      } else {
        print('Failed to update favorite status: ${favoriteResponse.statusCode}');
      }

      // Update celebration status
      final celebrationData = {
        'song_id': songId,
        'user_id': userId,
        'reaction': newCelebrationStatus.toString(),
        'updatedTimestamp': ApiService.timestamp
      };

      final celebrationResponse = await ApiService.updateSongReaction(celebrationData);

      if (ApiService.isSuccessResponse(celebrationResponse)) {
        print('Celebration status updated successfully.');
      } else {
        print('Failed to update celebration status: ${celebrationResponse.statusCode}');
      }
    } catch (e) {
      print('Error updating song status: $e');
    }
  }

  // Update favorite status only using centralized API service
  Future<void> updateFavoriteOnly(String songId, String userId, bool newFavoriteStatus) async {
    // Update local state
    isFavoriteNotifier.value = newFavoriteStatus;

    try {
      final favoriteData = {
        'song_id': songId,
        'favorite': newFavoriteStatus,
        'user_id': userId,
        'updatedTimestamp': ApiService.timestamp
      };

      final response = await ApiService.updateSongFavorite(favoriteData);

      if (ApiService.isSuccessResponse(response)) {
        print('Favorite status updated successfully.');
      } else {
        print('Failed to update favorite status: ${response.statusCode}');
      }
    } catch (e) {
      print('Error updating favorite status: $e');
    }
  }

  void _resetStatus() {
    isFavoriteNotifier.value = false;
    isCelebration = false;
  }

  void reset() {
    _resetStatus();
  }
}
