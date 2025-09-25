// fresh_songs.dart
// Model for Fresh 10 songs

class FreshSong {
  final String songId;
  final String title;
  final String artistName;
  final String coverImageUrl;
  final String audioUrl;
  final String duration;
  final String uploadDate;
  final String artistId;
  final String language;
  final String genre;

  FreshSong({
    required this.songId,
    required this.title,
    required this.artistName,
    required this.coverImageUrl,
    required this.audioUrl,
    required this.duration,
    required this.uploadDate,
    required this.artistId,
    required this.language,
    required this.genre,
  });

  factory FreshSong.fromJson(Map<String, dynamic> json) {
    return FreshSong(
      songId: json['song_id'] ?? '',
      title: json['title'] ?? '',
      artistName: json['artist_name'] ?? '',
      coverImageUrl: json['cover_image_url'] ?? '',
      audioUrl: json['audio_url'] ?? '',
      duration: json['duration'] ?? '',
      uploadDate: json['upload_date'] ?? '',
      artistId: json['artist_id'] ?? '',
      language: json['language'] ?? '',
      genre: json['genre'] ?? '',
    );
  }

  Map<String, String> toSongMap() {
    return {
      'song_id': songId,
      'title': title,
      'artist_name': artistName,
      'cover_image_url': coverImageUrl,
      'audio_url': audioUrl,
      'duration': duration,
      'upload_date': uploadDate,
      'artist_id': artistId,
      'language': language,
      'genre': genre,
    };
  }
}
