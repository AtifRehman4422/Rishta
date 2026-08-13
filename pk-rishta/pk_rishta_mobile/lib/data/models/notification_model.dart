class AppNotification {
  AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.isRead,
    required this.createdAt,
    this.body,
    this.link,
    this.relatedId,
  });

  final String id;
  final String type;
  final String title;
  final bool isRead;
  final String createdAt;
  final String? body;
  final String? link;
  final String? relatedId;

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'].toString(),
      type: (json['type'] ?? '').toString(),
      title: (json['title'] ?? 'Notification').toString(),
      body: json['body'] as String?,
      link: json['link'] as String?,
      relatedId: json['related_id']?.toString(),
      isRead: json['is_read'] == true,
      createdAt: (json['created_at'] ?? '').toString(),
    );
  }
}
