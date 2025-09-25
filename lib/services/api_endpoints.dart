/// Centralized API endpoints configuration for Voiz app
/// This file contains all API endpoints used throughout the application
class ApiEndpoints {
  // Base URLs
  static const String _baseAWSUrl = 'execute-api.ap-south-1.amazonaws.com';
  
  // Service base URLs
  static const String artistProfile = 'https://e1jyzvq758.$_baseAWSUrl/artistprofile';
  
  // Authentication & User Management
  static const String deviceLogUrl = 'https://15pi50g5p5.$_baseAWSUrl/dev/log';
  static const String userApiUrl = 'https://ae6phpvtj3.$_baseAWSUrl/voiz/api/userId';
  static const String artistAllSongsUrl = 'https://ae6phpvtj3.$_baseAWSUrl/voiz/api/artist/allsongs';
  
  // Account Management
  static const String deleteAccountUrl = 'https://xkn24pj0ba.$_baseAWSUrl/default/delete';
  static const String updateLastLogin = 'https://knjixc4wse.$_baseAWSUrl/admin_report/update_last_login';
  
  // Profile Management
  static const String followersCountUrl = 'https://j2l5vmk441.$_baseAWSUrl/follow/api/followers/count';
  static const String followingCountUrl = 'https://j2l5vmk441.$_baseAWSUrl/follow/api/following/count';
  static const String coverPageUrl = 'https://e1jyzvq758.$_baseAWSUrl/artistprofile/user/getcoverpage';
  static const String profilePhotoUrl = 'https://e1jyzvq758.$_baseAWSUrl/artistprofile/user/getprofilephoto';
  static const String autoPlayStatusUrl = 'https://i3lmfmc1h2.$_baseAWSUrl/voizpost/save/autoplaystatus';
  
  // Song Management & Favorites
  static const String favoriteReactionUrl = 'https://2a11hm9ls1.$_baseAWSUrl/voizfavorite/song/favoriteReaction';
  static const String songFavoriteUrl = 'https://2a11hm9ls1.$_baseAWSUrl/voizfavorite/api/song/favorite';
  static const String songReactionUrl = 'https://i3lmfmc1h2.$_baseAWSUrl/voizpost/song/reaction';
  
  // Song Upload & Management
  static const String uploadSongUrl = 'https://g076kfytq4.$_baseAWSUrl/voiznew/upload';
  static const String songTableUrl = 'https://g076kfytq4.$_baseAWSUrl/voiznew/songTable';
  static const String createJobUrl = 'https://g076kfytq4.$_baseAWSUrl/voiznew/createjob';
  static const String generatePresignedUrlsUrl = 'https://y6mkdwd71i.$_baseAWSUrl/voiznew/generate-presigned-urls';
  static const String generatePresignedUrlsBulkUrl = 'https://y6mkdwd71i.$_baseAWSUrl/voiznew/generate-presigned-urls-bulk-parallel';
  static const String processSongUrl = 'https://g076kfytq4.$_baseAWSUrl/voiznew/processSong';
  static const String processMultipleSongsUrl = 'https://g076kfytq4.$_baseAWSUrl/voiznew/processMultipleSongs';
  
  // Admin & Notifications
  static const String adminEmailsUrl = 'https://knjixc4wse.$_baseAWSUrl/admin_report/get_admin_emails';
  static const String adminApprovalEmailUrl = 'https://kdr7woc3ih.$_baseAWSUrl/default/AdminSendApprovalEmail';
  static const String adminApprovalMultipleSongsUrl = 'https://eegkqhka27.$_baseAWSUrl/new/AdminSendApprovalEmailForMultipleSongs';
  static const String adminNotificationUrl = 'https://kdr7woc3ih.$_baseAWSUrl/default/AdminSendApprovalEmail';
  static const String adminEmails = 'https://2g8ww6dm3i.execute-api.ap-south-1.amazonaws.com/voizadmin/admin/emails';
  static const String adminNotification = 'https://2g8ww6dm3i.execute-api.ap-south-1.amazonaws.com/voizadmin/admin/notification';
  
  // S3 presigned URL endpoints
  static const String presignedUrl = 'https://2g8ww6dm3i.execute-api.ap-south-1.amazonaws.com/voizadmin/admin/presignedurl';
  static const String presignedUrlMultiple = 'https://2g8ww6dm3i.execute-api.ap-south-1.amazonaws.com/voizadmin/admin/presignedurlmultiple';
  
  // Playlist endpoints
  static const String userPlaylists = 'https://67avbampgi.execute-api.ap-south-1.amazonaws.com/voiz/playlist/list';
  static const String playlistSongs = 'https://67avbampgi.execute-api.ap-south-1.amazonaws.com/voiz/playlist/songList';
  static const String updatePlaylistName = 'https://67avbampgi.execute-api.ap-south-1.amazonaws.com/voiz/updatePlaylistName';
  static const String deletePlaylist = 'https://67avbampgi.execute-api.ap-south-1.amazonaws.com/voiz/playlist/deletePlaylist';
  
  // Profile and user data endpoints
  static const String lovedTracks = 'https://2a11hm9ls1.execute-api.ap-south-1.amazonaws.com/voizfavorite/api/lovedtracks';
  static const String adminSongs = 'https://2g8ww6dm3i.execute-api.ap-south-1.amazonaws.com/voizadmin/admin/getsongs';
  static const String userHistory = 'https://3ujjsgu42d.execute-api.ap-south-1.amazonaws.com/history/gethistory';
  static const String songDetails = 'https://2g8ww6dm3i.execute-api.ap-south-1.amazonaws.com/voizadmin/admin/song/detail';
  
  // Search and discovery endpoints
  static const String songsByLanguage = 'https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/api/language';
  static const String checkFollowStatus = 'https://j2l5vmk441.execute-api.ap-south-1.amazonaws.com/follow/api/checkFollow';
  static const String getCoverPage = 'https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/user/getcoverpage';
  static const String followersCountUrl2 = 'https://j2l5vmk441.execute-api.ap-south-1.amazonaws.com/follow/api/followers/count';
  static const String trendingSongsUrl = 'https://ae6phpvtj3.$_baseAWSUrl/voiz/api/trending/songs';
  static const String freshSongsUrl = 'https://ae6phpvtj3.$_baseAWSUrl/voiz/api/songs/fresh';
  
  // Playlist Management
  static const String createPlaylistUrl = 'https://ae6phpvtj3.$_baseAWSUrl/voiz/api/playlist/create';
  static const String getPlaylistsUrl = 'https://ae6phpvtj3.$_baseAWSUrl/voiz/api/playlists';
  static const String addToPlaylistUrl = 'https://ae6phpvtj3.$_baseAWSUrl/voiz/api/playlist/add-song';
  static const String removeFromPlaylistUrl = 'https://ae6phpvtj3.$_baseAWSUrl/voiz/api/playlist/remove-song';
  
  // Analytics & Reporting
  static const String songAnalyticsUrl = 'https://ae6phpvtj3.$_baseAWSUrl/voiz/api/analytics/song';
  static const String userAnalyticsUrl = 'https://ae6phpvtj3.$_baseAWSUrl/voiz/api/analytics/user';
  
  // Follow System
  static const String followUserUrl = 'https://j2l5vmk441.$_baseAWSUrl/follow/api/follow';
  static const String unfollowUserUrl = 'https://j2l5vmk441.$_baseAWSUrl/follow/api/unfollow';
  static const String getFollowersUrl = 'https://j2l5vmk441.$_baseAWSUrl/follow/api/followers';
  static const String getFollowingUrl = 'https://j2l5vmk441.$_baseAWSUrl/follow/api/following';
  
  // Login & Authentication APIs
  static const String mandateDetailsUrl = 'https://i3lmfmc1h2.$_baseAWSUrl/voizpost/save/getmandate';
  static const String updateLastLoginUrl = 'https://knjixc4wse.$_baseAWSUrl/admin_report/update_last_login';
  static const String createPasswordUrl = 'https://knjixc4wse.$_baseAWSUrl/admin_report/create_password';
  static const String saveTokenUrl = 'https://i3lmfmc1h2.$_baseAWSUrl/voizpost/save/token';
  static const String userDetails = 'https://ae6phpvtj3.$_baseAWSUrl/voiz/api/userId';
  
  // Home Page APIs - Playlist Management
  static const String playlistSongsUrl = 'https://67avbampgi.$_baseAWSUrl/voiz/playlist/songList';
  
  // Home Page APIs - Profile & Artist Management
  static const String artistDetailsUrl = 'https://e1jyzvq758.$_baseAWSUrl/artistprofile/artist/details';
  static const String artistViewProfileUrl = 'https://e1jyzvq758.$_baseAWSUrl/artistprofile/artist/viewprofile';
  static const String userProfileDetailsUrl = 'https://e1jyzvq758.$_baseAWSUrl/artistprofile/user/getprofiledetails';
  static const String updateBioShowUrl = 'https://gc5yd9g903.$_baseAWSUrl/admin_report/update_next_bio_show';
  
  // Home Page APIs - Content Discovery
  static const String languageCountUrl = 'https://ae6phpvtj3.$_baseAWSUrl/voiz/api/language/count';
  static const String genreCountUrl = 'https://ae6phpvtj3.$_baseAWSUrl/voiz/api/genre/count';
  static const String artistsUrl = 'https://ae6phpvtj3.$_baseAWSUrl/voiz/api/artist';
  static const String genreSongsUrl = 'https://ae6phpvtj3.$_baseAWSUrl/voiz/api/genre';
  static const String languageSongsUrl = 'https://ae6phpvtj3.$_baseAWSUrl/voiz/api/language';
  static const String topSongsUrl = 'https://ae6phpvtj3.$_baseAWSUrl/voiz/api/songs/top';
  
  // Home Page APIs - Song Details
  static const String songDetailsUrl = 'https://2g8ww6dm3i.$_baseAWSUrl/voizadmin/admin/song/detail';
  
  // Home Page APIs - Follow System (Additional)
  static const String followingListUrl = 'https://j2l5vmk441.$_baseAWSUrl/follow/api/following/List';
  
  // Music Player APIs
  static const String albumGotoUrl = 'https://ae6phpvtj3.$_baseAWSUrl/voiz/api/artist/album/goto';
  static const String historyUrl = 'https://3ujjsgu42d.$_baseAWSUrl/history/save/history';
  static const String shareSongCountUrl = 'https://i3lmfmc1h2.$_baseAWSUrl/voizpost/save/shareSongCount';
  static const String songInfoUrl = 'https://ae6phpvtj3.$_baseAWSUrl/voiz/song/info';
  static const String songCommentsUrl = 'https://hl9z99pvmk.$_baseAWSUrl/voiz/song/comments';
  static const String addCommentUrl = 'https://hl9z99pvmk.$_baseAWSUrl/voiz/song/comment';
  static const String songFeedbackUrl = 'https://i3lmfmc1h2.$_baseAWSUrl/voizpost/song/feedback';
  static const String playlistListUrl = 'https://67avbampgi.$_baseAWSUrl/voiz/playlist/list';
  static const String addSongToPlaylistUrl = 'https://67avbampgi.$_baseAWSUrl/voiz/playlist/addSong';
  static const String newPlaylistUrl = 'https://67avbampgi.$_baseAWSUrl/voiz/newPlaylist';

  // External URLs
  static const String playStoreUrl = 'https://play.google.com/store/apps/details?id=com.voizapp.voiceapp';
  static const String termsConditionsUrl = 'https://voiz.co.in/terms-of-use/';
  static const String musicLicenseUrl = 'https://voiz.co.in/music-license-agreement/';
  static const String codeOfConductUrl = 'https://voiz.co.in/code-of-conduct/';
  
  // Helper methods for dynamic URL construction
  static String getFollowersCount(String userId) => '$followersCountUrl?user_id=$userId';
  static String getFollowingCount(String userId) => '$followingCountUrl?user_id=$userId';
  static String getProfilePhoto(String userId) => '$profilePhotoUrl?user_id=$userId';
  
  static String getFavoriteReaction(String userId, String songId) {
    return '$favoriteReactionUrl?user_id=$userId&song_id=$songId';
  }

  static String getSongsByGenreAndUser(String genre, String userId) {
    return 'https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/artist/genre/songs?genre=$genre&user_id=$userId';
  }

  static String getSongUrl(String songName) {
    return 'https://g076kfytq4.execute-api.ap-south-1.amazonaws.com/voiznew/getSongUrl?songName=$songName.mp3';
  }

  static String getSongsByArtistLanguage(String userId, String language) {
    return 'https://e1jyzvq758.execute-api.ap-south-1.amazonaws.com/artistprofile/artist/language/songs?user_id=$userId&languages=$language';
  }

  // Additional endpoint constants (avoiding duplicates)
  static const String searchSongsUrl = 'https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/api/search';
  static const String searchArtistsUrl = 'https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/api/search/artists';
  static const String artistSongsUrl = 'https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/api/artist/songs';
  static const String artistAlbumsUrl = 'https://ae6phpvtj3.execute-api.ap-south-1.amazonaws.com/voiz/api/userAlbumsWithApprovedSongs';

  // Timeout configurations
  static const Duration defaultTimeout = Duration(seconds: 30);
  static const Duration uploadTimeout = Duration(minutes: 10);

  // Helper methods for dynamic URL construction
  static String getUserIdByEmail(String email) {
    return '$userApiUrl?email=$email';
  }

  static String getUserDetailsByEmail(String email) {
    return '$userDetails?email=$email';
  }

  static String getMandateDetails(String userId) {
    return '$mandateDetailsUrl?user_id=$userId';
  }

  static String getArtistAllSongs(String userId) {
    return '$artistAllSongsUrl?user_id=$userId';
  }

  static String getArtistDetails(String userId) {
    return '$artistDetailsUrl?user_id=$userId';
  }

  static String getArtistViewProfile(String userId) {
    return '$artistViewProfileUrl?user_id=$userId';
  }

  static String getUserProfileDetails(String userId) {
    return '$userProfileDetailsUrl?user_id=$userId';
  }

  static String getUserProfilePhoto(String userId) {
    return '$profilePhotoUrl?user_id=$userId';
  }

  static String getFollowingList(String userId) {
    return '$followingListUrl?user_id=$userId';
  }

  static String getFreshSongs(String userId) {
    return '$freshSongsUrl?user_id=$userId';
  }

  static String getTopSongs(String userId) {
    return '$topSongsUrl?user_id=$userId';
  }

  static String getSongsByGenre(String genre) {
    return '$genreSongsUrl?genre=$genre';
  }

  static String getSongsByLanguage(String language) {
    return '$languageSongsUrl?languages=$language';
  }

  static String getAlbumGoto(String songId) {
    return '$albumGotoUrl?song_id=$songId';
  }

  static String getSongInfo(String songId) {
    return '$songInfoUrl?song_id=$songId';
  }

  static String getSongComments(String songId) {
    return '$songCommentsUrl?song_id=$songId';
  }

  static String getPlaylistList(String userId) {
    return '$playlistListUrl?user_id=$userId';
  }
}
