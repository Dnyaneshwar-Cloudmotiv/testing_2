# API Service Migration Guide

## Overview
This guide explains how to migrate from scattered API calls to the centralized API service system for better code organization, performance, and maintainability.

## Files Created
- `lib/services/api_endpoints.dart` - Centralized endpoint definitions
- `lib/services/api_service.dart` - HTTP client service with common methods
- `lib/services/song_status_manager_refactored.dart` - Example refactored implementation

## Benefits of Centralized API Service

### 🚀 Performance Benefits
- **Connection Pooling**: Single HTTP client instance reused across app
- **Consistent Timeouts**: Proper timeout handling for different API types
- **Request Logging**: Centralized logging for debugging and monitoring
- **Error Handling**: Consistent error handling patterns

### 🧹 Code Organization
- **Single Source of Truth**: All endpoints in one place
- **Easy Maintenance**: Update base URLs or add authentication in one location
- **Reduced Duplication**: No more repeated HTTP setup code
- **Type Safety**: Structured request/response handling

### 🔧 Developer Experience
- **Easier Testing**: Mock the service instead of individual HTTP calls
- **Better Debugging**: Centralized logging and error tracking
- **Consistent API**: Same patterns across all API calls

## Migration Steps

### Step 1: Import the Services
```dart
import 'package:your_app/services/api_service.dart';
import 'package:your_app/services/api_endpoints.dart';
```

### Step 2: Replace Direct HTTP Calls

#### Before (Old Way):
```dart
final response = await http.get(
  Uri.parse('https://2a11hm9ls1.execute-api.ap-south-1.amazonaws.com/voizfavorite/song/favoriteReaction?user_id=$userId&song_id=$songId'),
);

if (response.statusCode == 200) {
  final data = jsonDecode(response.body);
  // Handle response
}
```

#### After (New Way):
```dart
final response = await ApiService.getFavoriteReaction(userId, songId);

if (ApiService.isSuccessResponse(response)) {
  final data = ApiService.parseJsonResponse(response);
  // Handle response
}
```

### Step 3: Use Structured Data
```dart
// Instead of manual JSON encoding
body: jsonEncode({
  'song_id': songId,
  'favorite': isFavorite,
  'user_id': userId,
  'updatedTimestamp': DateFormat('yyyyMMdd_HHmmss').format(DateTime.now())
})

// Use structured approach
final favoriteData = {
  'song_id': songId,
  'favorite': isFavorite,
  'user_id': userId,
  'updatedTimestamp': ApiService.timestamp
};

final response = await ApiService.updateSongFavorite(favoriteData);
```

## Common API Patterns

### GET Requests with Parameters
```dart
// User followers
final response = await ApiService.getFollowersCount(userId);

// Search with parameters
final response = await ApiService.searchSongs({
  'query': searchTerm,
  'limit': 20,
  'offset': 0
});
```

### POST Requests with Data
```dart
final response = await ApiService.updateSongFavorite({
  'song_id': songId,
  'favorite': true,
  'user_id': userId,
  'updatedTimestamp': ApiService.timestamp
});
```

### File Upload Requests
```dart
final response = await ApiService.generatePresignedUrls({
  'songName': 'song.mp3',
  'lyricsName': 'lyrics.txt'
});
```

## Error Handling Best Practices

```dart
try {
  final response = await ApiService.getFavoriteReaction(userId, songId);
  
  if (ApiService.isSuccessResponse(response)) {
    final data = ApiService.parseJsonResponse(response);
    if (data != null) {
      // Handle successful response
    }
  } else {
    print('API Error: ${response.statusCode}');
    // Handle API error
  }
} catch (e) {
  print('Network Error: $e');
  // Handle network/timeout errors
}
```

## Adding New Endpoints

### 1. Add to ApiEndpoints.dart
```dart
static const String newFeatureUrl = 'https://xyz.$_baseAWSUrl/new/feature';

// For dynamic URLs
static String getNewFeature(String id) {
  return '$newFeatureUrl?id=$id';
}
```

### 2. Add to ApiService.dart
```dart
static Future<http.Response> getNewFeature(String id) {
  return get(ApiEndpoints.getNewFeature(id));
}

static Future<http.Response> createNewFeature(Map<String, dynamic> data) {
  return post(ApiEndpoints.newFeatureUrl, body: data);
}
```

## File-by-File Migration Priority

### High Priority (Core Features)
1. `SongStatusManager.dart` ✅ (Example completed)
2. `NewHomepage.dart` - Main app functionality
3. `musicplayer.dart` - Music playback APIs
4. `Song Upload/` - Upload functionality

### Medium Priority
1. `ProfilePage.dart` - User profile APIs
2. `SearchPage.dart` - Search functionality
3. `Playlist.dart` - Playlist management

### Low Priority
1. Analytics files
2. Admin functionality
3. Support/feedback features

## Testing the Migration

### 1. Unit Tests
```dart
// Mock the ApiService for testing
class MockApiService extends Mock implements ApiService {}

test('should fetch song status successfully', () async {
  when(mockApiService.getFavoriteReaction(any, any))
    .thenAnswer((_) async => http.Response('{"favorite": true}', 200));
  
  // Test your logic
});
```

### 2. Integration Tests
- Test actual API calls in development environment
- Verify response parsing works correctly
- Check error handling scenarios

## Performance Monitoring

The centralized service provides built-in logging:
```
[GET] https://api.example.com/endpoint - Status: 200
[POST] https://api.example.com/endpoint - Status: 201
[GET] https://api.example.com/endpoint - Error: TimeoutException
```

Monitor these logs to identify:
- Slow API endpoints
- Frequent failures
- Network issues

## Next Steps

1. **Start with one file**: Begin with `SongStatusManager.dart` (example provided)
2. **Test thoroughly**: Ensure the refactored code works identically
3. **Migrate incrementally**: One file at a time to avoid breaking changes
4. **Update imports**: Remove old `http` imports, add new service imports
5. **Clean up**: Remove unused code and consolidate similar functions

## Support

If you encounter issues during migration:
1. Check the example in `song_status_manager_refactored.dart`
2. Verify endpoint URLs in `api_endpoints.dart`
3. Test with a simple GET request first
4. Use the logging output to debug issues

Remember: The goal is cleaner, more maintainable code with better performance!
