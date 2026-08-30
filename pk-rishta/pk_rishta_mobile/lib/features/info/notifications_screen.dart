import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../core/network/api_client.dart';
import '../../core/state/auth_controller.dart';
import '../../core/state/notification_controller.dart';
import '../../core/state/shell_navigator.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/primary_button.dart';
import '../../data/models/notification_model.dart';
import '../admin/admin_complaints_screen.dart';

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
    final link = n.link;
    final path = (link ?? '/dashboard').split('?').first.trim();
    if (path == '/admin/complaints' && AuthController.instance.isAdmin) {
      await Navigator.of(context).push(
        MaterialPageRoute<void>(builder: (_) => const AdminComplaintsScreen()),
      );
      return;
    }
    Navigator.of(context).pop();
    await openNotificationDestination(context, link);
  }

  (IconData, Gradient) _styleForType(String type) {
    switch (type) {
      case 'contact_request_received':
        return (
          Icons.mark_email_unread_rounded,
          const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [AppColors.primary, AppColors.primaryLight],
          ),
        );
      case 'contact_request_approved':
        return (
          Icons.verified_rounded,
          const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF166534), Color(0xFF22C55E)],
          ),
        );
      case 'contact_request_rejected':
        return (
          Icons.cancel_rounded,
          const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF9F1239), Color(0xFFE11D48)],
          ),
        );
      case 'contact_request_expired':
        return (
          Icons.timer_off_rounded,
          const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF92400E), Color(0xFFF59E0B)],
          ),
        );
      default:
        return (
          Icons.notifications_rounded,
          AppColors.weddingGradient,
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: ListenableBuilder(
        listenable: NotificationController.instance,
        builder: (context, _) {
          final ctrl = NotificationController.instance;
          final items = ctrl.items;
          final loading = ctrl.loading && items.isEmpty;

          return RefreshIndicator(
            onRefresh: _load,
            color: AppColors.primary,
            child: CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              slivers: [
                SliverAppBar(
                  expandedHeight: 150,
                  pinned: true,
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  systemOverlayStyle: SystemUiOverlayStyle.light,
                  actions: [
                    if (ctrl.hasUnread)
                      TextButton(
                        onPressed: _markAll,
                        child: const Text(
                          'Mark all read',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                        ),
                      ),
                    const SizedBox(width: 4),
                  ],
                  flexibleSpace: FlexibleSpaceBar(
                    title: const Text('Notifications', style: TextStyle(fontSize: 16)),
                    background: Container(
                      decoration: const BoxDecoration(gradient: AppColors.weddingGradient),
                      padding: const EdgeInsets.fromLTRB(20, 0, 20, 42),
                      alignment: Alignment.bottomLeft,
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.16),
                              shape: BoxShape.circle,
                              border: Border.all(color: AppColors.goldLight.withValues(alpha: 0.5)),
                            ),
                            child: Icon(
                              ctrl.hasUnread
                                  ? Icons.notifications_active_rounded
                                  : Icons.notifications_none_rounded,
                              color: AppColors.goldLight,
                              size: 24,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              ctrl.hasUnread
                                  ? '${ctrl.unreadCount} new notification${ctrl.unreadCount == 1 ? '' : 's'}'
                                  : 'You are all caught up',
                              style: const TextStyle(
                                color: AppColors.goldLight,
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                if (loading)
                  const SliverFillRemaining(
                    hasScrollBody: false,
                    child: _LoadingView(),
                  )
                else if (_error != null && items.isEmpty)
                  SliverFillRemaining(
                    hasScrollBody: false,
                    child: _ErrorView(message: _error!, onRetry: _load),
                  )
                else if (items.isEmpty)
                  const SliverFillRemaining(
                    hasScrollBody: false,
                    child: _EmptyView(),
                  )
                else
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
                    sliver: SliverList.separated(
                      itemCount: items.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 10),
                      itemBuilder: (context, index) {
                        final n = items[index];
                        final (icon, gradient) = _styleForType(n.type);
                        return FadeSlideItem(
                          index: index,
                          child: _NotificationTile(
                            notification: n,
                            icon: icon,
                            gradient: gradient,
                            onTap: () => _openItem(n),
                          ),
                        );
                      },
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class FadeSlideItem extends StatelessWidget {
  const FadeSlideItem({super.key, required this.index, required this.child});

  final int index;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return child
        .animate(delay: (index.clamp(0, 8) * 60).ms)
        .fadeIn(duration: 380.ms, curve: Curves.easeOutCubic)
        .slideX(
          begin: 0.06,
          end: 0,
          duration: 420.ms,
          curve: Curves.easeOutCubic,
        );
  }
}

class _NotificationTile extends StatelessWidget {
  const _NotificationTile({
    required this.notification,
    required this.icon,
    required this.gradient,
    required this.onTap,
  });

  final AppNotification notification;
  final IconData icon;
  final Gradient gradient;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final n = notification;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Ink(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: n.isRead ? Colors.white : AppColors.blush,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: n.isRead ? AppColors.border : AppColors.goldLight,
            ),
            boxShadow: n.isRead
                ? null
                : [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.06),
                      blurRadius: 12,
                      offset: const Offset(0, 5),
                    ),
                  ],
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  gradient: gradient,
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withValues(alpha: 0.18),
                      blurRadius: 8,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                child: Icon(icon, color: Colors.white, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      n.title,
                      style: TextStyle(
                        fontWeight: n.isRead ? FontWeight.w600 : FontWeight.w800,
                        fontSize: 14.5,
                        color: AppColors.text,
                        height: 1.3,
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
                    Row(
                      children: [
                        Icon(
                          Icons.schedule_rounded,
                          size: 12,
                          color: AppColors.textMuted.withValues(alpha: 0.7),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          _fmtTime(n.createdAt),
                          style: TextStyle(
                            color: AppColors.textMuted.withValues(alpha: 0.85),
                            fontSize: 11.5,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              if (!n.isRead)
                Container(
                  width: 9,
                  height: 9,
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
  }

  String _fmtTime(String iso) {
    final dt = DateTime.tryParse(iso)?.toLocal();
    if (dt == null) return iso;
    final hh = dt.hour.toString().padLeft(2, '0');
    final mm = dt.minute.toString().padLeft(2, '0');
    return '${dt.day}/${dt.month}/${dt.year} $hh:$mm';
  }
}

class _LoadingView extends StatelessWidget {
  const _LoadingView();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(
            width: 36,
            height: 36,
            child: CircularProgressIndicator(strokeWidth: 3, color: AppColors.primary),
          ).animate().fadeIn(duration: 300.ms),
          const SizedBox(height: 14),
          const Text(
            'Loading notifications...',
            style: TextStyle(color: AppColors.textMuted),
          ).animate(delay: 120.ms).fadeIn(duration: 400.ms),
        ],
      ),
    );
  }
}

class _EmptyView extends StatelessWidget {
  const _EmptyView();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 96,
              height: 96,
              decoration: BoxDecoration(
                gradient: AppColors.weddingGradient,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.25),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: const Icon(
                Icons.notifications_none_rounded,
                color: Colors.white,
                size: 48,
              ),
            ).animate().scale(
              begin: const Offset(0.6, 0.6),
              end: const Offset(1, 1),
              duration: 500.ms,
              curve: Curves.easeOutBack,
            ),
            const SizedBox(height: 20),
            const Text(
              'No notifications yet',
              style: TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 18,
                color: AppColors.text,
              ),
            ).animate(delay: 150.ms).fadeIn(duration: 400.ms).slideY(begin: 0.1, end: 0),
            const SizedBox(height: 8),
            const Text(
              'Contact requests and updates\nwill appear here.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.textMuted, height: 1.5),
            ).animate(delay: 260.ms).fadeIn(duration: 400.ms),
          ],
        ),
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.wifi_off_rounded,
              size: 52,
              color: AppColors.primary,
            ),
            const SizedBox(height: 12),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.textMuted),
            ),
            const SizedBox(height: 16),
            PrimaryButton(
              label: 'Retry',
              icon: Icons.refresh_rounded,
              onPressed: onRetry,
            ),
          ],
        ),
      ),
    );
  }
}
