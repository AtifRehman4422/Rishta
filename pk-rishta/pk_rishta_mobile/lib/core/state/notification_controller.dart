import 'package:flutter/foundation.dart';

import '../../data/models/notification_model.dart';
import '../../data/repositories/notification_repository.dart';
import 'auth_controller.dart';

class NotificationController extends ChangeNotifier {
  NotificationController._() {
    AuthController.instance.addListener(_onAuthChanged);
  }

  static final NotificationController instance = NotificationController._();

  final NotificationRepository _repo = NotificationRepository();

  List<AppNotification> _items = [];
  int _unreadCount = 0;
  bool _loading = false;

  List<AppNotification> get items => List.unmodifiable(_items);
  int get unreadCount => _unreadCount;
  bool get loading => _loading;
  bool get hasUnread => _unreadCount > 0;

  void _onAuthChanged() {
    if (AuthController.instance.isLoggedIn) {
      refresh().catchError((_) {});
    } else {
      clear();
    }
  }

  Future<void> bootstrap() async {
    if (AuthController.instance.isLoggedIn) {
      try {
        await refresh();
      } catch (_) {}
    }
  }

  void clear() {
    _items = [];
    _unreadCount = 0;
    _loading = false;
    notifyListeners();
  }

  Future<void> refresh({bool countOnly = false}) async {
    if (!AuthController.instance.isLoggedIn) {
      clear();
      return;
    }
    _loading = true;
    notifyListeners();
    try {
      final unread = await _repo.getUnreadCount();
      _unreadCount = unread;
      if (!countOnly) {
        _items = await _repo.getNotifications();
      }
    } catch (e) {
      rethrow;
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> markRead(String id) async {
    try {
      await _repo.markRead(id);
      _items = _items
          .map(
            (n) => n.id == id
                ? AppNotification(
                    id: n.id,
                    type: n.type,
                    title: n.title,
                    body: n.body,
                    link: n.link,
                    relatedId: n.relatedId,
                    isRead: true,
                    createdAt: n.createdAt,
                  )
                : n,
          )
          .toList();
      _unreadCount = (_unreadCount - 1).clamp(0, 999);
      notifyListeners();
    } catch (_) {}
  }

  Future<void> markAllRead() async {
    try {
      await _repo.markAllRead();
      _items = _items
          .map(
            (n) => AppNotification(
              id: n.id,
              type: n.type,
              title: n.title,
              body: n.body,
              link: n.link,
              relatedId: n.relatedId,
              isRead: true,
              createdAt: n.createdAt,
            ),
          )
          .toList();
      _unreadCount = 0;
      notifyListeners();
    } catch (_) {}
  }
}
