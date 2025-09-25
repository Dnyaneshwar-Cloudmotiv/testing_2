import 'dart:io';

class SongDataForUpload {
  final String songName;
  final String? lyricsFileName;
  final String? songFileName;
  final String? songCoverFileName;
  final String? albumName;
  final String? genre;
  final String? language;
  final String? mood;
  final String? pace;
  final String? singer;
  final String? composer;
  final String? lyricist;
  final String? producer;
  final String? stageName;
  final String? story;
  final String? span;
  final File? lyricsFile;
  final File? songFile;
  final File? songCoverFile;

  SongDataForUpload({
    required this.songName,
    this.lyricsFileName,
    this.songFileName,
    this.songCoverFileName,
    this.albumName,
    this.genre,
    this.language,
    this.mood,
    this.pace,
    this.singer,
    this.composer,
    this.lyricist,
    this.producer,
    this.stageName,
    this.story,
    this.span,
    this.lyricsFile,
    this.songFile,
    this.songCoverFile,
  });

  Map<String, dynamic> toJson() {
    return {
      'songName': songName,
      'lyricsFileName': lyricsFileName,
      'songFileName': songFileName,
      'songCoverFileName': songCoverFileName,
      'albumName': albumName,
      'genre': genre,
      'language': language,
      'mood': mood,
      'pace': pace,
      'singer': singer,
      'composer': composer,
      'lyricist': lyricist,
      'producer': producer,
      'stageName': stageName,
      'story': story,
      'span': span,
      // Files are not included in JSON by default
    };
  }
}
