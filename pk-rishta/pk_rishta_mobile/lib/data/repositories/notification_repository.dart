import '../../core/network/api_client.dart';
import '../models/notification_model.dart';

class NotificationRepository {
  NotificationRepository({ApiClient? client})
      : _client = client ?? ApiClient.instance;

  final ApiClient _client;

  Future<List<AppNotification>> getNotifications({int limit = 30}) async {
    final result = await _client.get(
      '/notifications',
      query: {'limit': limit},
    );
    final list = result.data as List? ?? [];
    return list
        .map((e) => AppNotification.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<int> getUnreadCount() async {
    final result = await _client.get('/notifications/unread-count');
    final data = result.data as Map<String, dynamic>? ?? {};
    final unread = data['unread'];
    if (unread is int) return unread;
    return int.tryParse(unread?.toString() ?? '') ?? 0;
  }

  Future<void> markRead(String id) async {
    await _client.patch('/notifications/$id/read');
  }

  Future<void> markAllRead() async {
    await _client.patch('/notifications/read-all');
  }
}
