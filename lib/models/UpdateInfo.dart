class UpdateInfo {
  final String latestVersion;
  final String downloadUrl;
  final bool isForced;
  final String title;
  final String description;
  final List<String> features;
  final String releaseDate;

  UpdateInfo({
    required this.latestVersion,
    required this.downloadUrl,
    required this.isForced,
    required this.title,
    required this.description,
    required this.features,
    required this.releaseDate,
  });

  factory UpdateInfo.fromJson(Map<String, dynamic> json) {
    return UpdateInfo(
      latestVersion: json['latest_version'] ?? '',
      downloadUrl: json['download_url'] ?? '',
      isForced: json['is_forced'] ?? false,
      title: json['title'] ?? 'App Update Available',
      description: json['description'] ?? 'A new version is available.',
      features: List<String>.from(json['features'] ?? []),
      releaseDate: json['release_date'] ?? '',
    );
  }
}