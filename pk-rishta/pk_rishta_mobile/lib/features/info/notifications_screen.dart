import 'package:flutter/material.dart';

import '../../core/network/api_client.dart';
import '../../core/state/notification_controller.dart';
import '../../core/state/shell_navigator.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/notification_model.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _error = null);
    try {
      await NotificationController.instance.refresh();
      if (!mounted) return;
      if (NotificationController.instance.items.isEmpty &&
          NotificationController.instance.loading == false) {
        // keep empty state
      }
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    }
  }

  Future<void> _markAll() async {
    await NotificationController.instance.markAllRead();
  }

  Future<void> _openItem(AppNotification n) async {
    if (!n.isRead) {
      await NotificationController.instance.markRead(n.id);
    }
    if (!mounted) return;
    Navigator.of(context).pop();
    await openNotificationDestination(context, n.link);
  }

  String _fmt(String iso) {
    final dt = DateTime.tryParse(iso)?.toLocal();
    if (dt == null) return iso;
    final hh = dt.hour.toString().padLeft(2, '0');
    final mm = dt.minute.toString().padLeft(2, '0');
    return '${dt.day}/${dt.month}/${dt.year} $hh:$mm';
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: NotificationController.instance,
      builder: (context, _) {
        final ctrl = NotificationController.instance;
        final items = ctrl.items;
        final loading = ctrl.loading && items.isEmpty;

        return Scaffold(
          appBar: AppBar(
            title: const Text('Notifications'),
            actions: [
              if (ctrl.hasUnread)
                TextButton(onPressed: _markAll, child: const Text('Mark all read')),
            ],
          ),
          body: loading
              ? const Center(child: CircularProgressIndicator())
              : _error != null
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(_error!),
                          const SizedBox(height: 12),
                          ElevatedButton(onPressed: _load, child: const Text('Retry')),
                        ],
                      ),
                    )
                  : items.isEmpty
                      ? const Center(
                          child: Padding(
                            padding: EdgeInsets.all(24),
                            child: Text(
                              'No notifications yet.\nContact requests and updates will appear here.',
                              textAlign: TextAlign.center,
                              style: TextStyle(color: AppColors.textMuted, height: 1.5),
                            ),
                          ),
                        )
                      : RefreshIndicator(
                          onRefresh: _load,
                          child: ListView.separated(
                            padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
                            itemCount: items.length,
                            separatorBuilder: (_, _) => const SizedBox(height: 10),
                            itemBuilder: (context, index) {
                              final n = items[index];
                              return Material(
                                color: n.isRead ? Colors.white : AppColors.blush,
                                borderRadius: BorderRadius.circular(16),
                                child: InkWell(
                                  borderRadius: BorderRadius.circular(16),
                                  onTap: () => _openItem(n),
                                  child: Ink(
                                    padding: const EdgeInsets.all(14),
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(16),
                                      border: Border.all(color: AppColors.border),
                                    ),
                                    child: Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Icon(
                                          n.isRead
                                              ? Icons.notifications_none_rounded
                                              : Icons.notifications_active_rounded,
                                          color: AppColors.primary,
                                        ),
                                        const SizedBox(width: 12),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                n.title,
                                                style: TextStyle(
                                                  fontWeight: n.isRead
                                                      ? FontWeight.w600
                                                      : FontWeight.w800,
                                                ),
                                              ),
                                              if ((n.body ?? '').isNotEmpty) ...[
                                                const SizedBox(height: 4),
                                                Text(
                                                  n.body!,
                                                  style: const TextStyle(
                                                    color: AppColors.textMuted,
                                                    height: 1.35,
                                                  ),
                                                ),
                                              ],
                                              const SizedBox(height: 6),
                                              Text(
                                                _fmt(n.createdAt),
                                                style: const TextStyle(
                                                  color: AppColors.textMuted,
                                                  fontSize: 11.5,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        if (!n.isRead)
                                          Container(
                                            width: 8,
                                            height: 8,
                                            margin: const EdgeInsets.only(top: 6),
                                            decoration: const BoxDecoration(
                                              color: AppColors.primary,
                                              shape: BoxShape.circle,
                                            ),
                                          ),
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
        );
      },
    );
  }
}
