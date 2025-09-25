// Favourite_status.dart
import 'package:flutter/material.dart';

class FavoriteService with ChangeNotifier {
  Map<String, bool> _favoriteStatus = {};

  static final FavoriteService _instance = FavoriteService._internal();

  factory FavoriteService() {
    return _instance;
  }

  FavoriteService._internal();

  bool isFavorite(String songId) {
    return _favoriteStatus[songId] ?? false;
  }

  void setFavorite(String songId, bool isFavorite) {
    _favoriteStatus[songId] = isFavorite;
    notifyListeners();
  }
}
