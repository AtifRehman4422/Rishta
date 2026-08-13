import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';

import '../state/auth_controller.dart';
import '../state/notification_controller.dart';
import '../state/shell_navigator.dart';
import '../theme/app_colors.dart';
import '../../data/models/notification_model.dart';
import '../../features/auth/login_screen.dart';
import '../../features/info/notifications_screen.dart';

class NotificationBellButton extends StatefulWidget {
  const NotificationBellButton({
    super.key,
    this.iconColor = Colors.white,
    this.backgroundColor,
  });

  final Color iconColor;
  final Color? backgroundColor;

  @override
  State<NotificationBellButton> createState() => _NotificationBellButtonState();
}

class _NotificationBellButtonState extends State<NotificationBellButton> {
  bool _opening = false;

  Future<void> _onTap() async {
    if (_opening) return;
    final auth = AuthController.instance;
    if (!auth.isLoggedIn) {
      await Navigator.of(context).push(
        MaterialPageRoute<void>(builder: (_) => const LoginScreen()),
      );
      return;
    }
    _opening = true;
    try {
      // Refresh in background while popup opens.
      NotificationController.instance.refresh().catchError((_) {});
      if (!mounted) return;
      await showGeneralDialog<void>(
        context: context,
        barrierDismissible: true,
        barrierLabel: 'Close notifications',
        barrierColor: Colors.black.withValues(alpha: 0.45),
        transitionDuration: const Duration(milliseconds: 380),
        pageBuilder: (context, animation, secondaryAnimation) {
          return const SizedBox.shrink();
        },
        transitionBuilder: (context, animation, secondaryAnimation, child) {
          final curved = CurvedAnimation(
            parent: animation,
            curve: Curves.easeOutBack,
            reverseCurve: Curves.easeInCubic,
          );
          return SafeArea(
            child: Align(
              alignment: Alignment.topRight,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 56, 16, 16),
                child: FadeTransition(
                  opacity: curved,
                  child: ScaleTransition(
                    scale: Tween<double>(begin: 0.86, end: 1).animate(curved),
                    alignment: Alignment.topRight,
                    child: SlideTransition(
                      position: Tween<Offset>(
                        begin: const Offset(0.08, -0.06),
                        end: Offset.zero,
                      ).animate(curved),
                      child: const _NotificationPopup(),
                    ),
                  ),
                ),
              ),
            ),
          );
        },
      );
      await NotificationController.instance.refresh(countOnly: true);
    } finally {
      _opening = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: Listenable.merge([
        AuthController.instance,
        NotificationController.instance,
      ]),
      builder: (context, _) {
        final unread = AuthController.instance.isLoggedIn
            ? NotificationController.instance.unreadCount
            : 0;
        final badge = unread > 9 ? '9+' : '$unread';

        Widget bell = Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: _onTap,
            customBorder: const CircleBorder(),
            child: Ink(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: widget.backgroundColor ??
                    Colors.white.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Stack(
                clipBehavior: Clip.none,
                alignment: Alignment.center,
                children: [
                  Icon(
                    unread > 0
                        ? Icons.notifications_active_rounded
                        : Icons.notifications_none_rounded,
                    color: widget.iconColor,
                  )
                      .animate(target: unread > 0 ? 1 : 0)
                      .shake(
                        hz: 2.5,
                        rotation: 0.08,
                        duration: 700.ms,
                        curve: Curves.easeInOut,
                      ),
                  if (unread > 0)
                    Positioned(
                      top: 4,
                      right: 4,
                      child: Container(
                        constraints:
                            const BoxConstraints(minWidth: 17, minHeight: 17),
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          gradient: AppColors.goldGradient,
                          borderRadius: BorderRadius.circular(999),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.85),
                            width: 1.2,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.gold.withValues(alpha: 0.55),
                              blurRadius: 8,
                              spreadRadius: 0.5,
                            ),
                          ],
                        ),
                        child: Text(
                          badge,
                          style: const TextStyle(
                            color: AppColors.primaryDark,
                            fontSize: 9.5,
                            fontWeight: FontWeight.w900,
                            height: 1,
                          ),
                        ),
                      )
                          .animate(onPlay: (c) => c.repeat(reverse: true))
                          .scale(
                            begin: const Offset(1, 1),
                            end: const Offset(1.12, 1.12),
                            duration: 900.ms,
                            curve: Curves.easeInOut,
                          ),
                    ),
                ],
              ),
            ),
          ),
        );

        return bell;
      },
    );
  }
}

class _NotificationPopup extends StatelessWidget {
  const _NotificationPopup();

  String _fmt(String iso) {
    final dt = DateTime.tryParse(iso)?.toLocal();
    if (dt == null) return iso;
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    final hh = dt.hour.toString().padLeft(2, '0');
    final mm = dt.minute.toString().padLeft(2, '0');
    return '${dt.day}/${dt.month}/${dt.year} $hh:$mm';
  }

  Future<void> _openItem(BuildContext context, AppNotification n) async {
    if (!n.isRead) {
      await NotificationController.instance.markRead(n.id);
    }
    if (!context.mounted) return;
    Navigator.of(context).pop();
    await openNotificationDestination(context, n.link);
  }

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    final maxW = width > 420 ? 360.0 : width - 32;

    return Material(
      color: Colors.transparent,
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxWidth: maxW,
          maxHeight: MediaQuery.sizeOf(context).height * 0.62,
        ),
        child: Container(
          width: maxW,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFFFFFBF7), Colors.white, Color(0xFFFFF0F3)],
            ),
            border: Border.all(color: AppColors.gold.withValues(alpha: 0.35)),
            boxShadow: [
              BoxShadow(
                color: AppColors.primaryDark.withValues(alpha: 0.28),
                blurRadius: 28,
                offset: const Offset(0, 14),
              ),
            ],
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(16, 14, 8, 14),
                decoration: const BoxDecoration(
                  gradient: AppColors.weddingGradient,
                ),
                child: Row(
                  children: [
                    const Icon(Icons.notifications_active_rounded,
                        color: AppColors.goldLight, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Notifications',
                        style: GoogleFonts.playfairDisplay(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 18,
                        ),
                      ),
                    ),
                    ListenableBuilder(
                      listenable: NotificationController.instance,
                      builder: (context, _) {
                        if (!NotificationController.instance.hasUnread) {
                          return const SizedBox.shrink();
                        }
                        return TextButton(
                          onPressed: () =>
                              NotificationController.instance.markAllRead(),
                          style: TextButton.styleFrom(
                            foregroundColor: AppColors.goldLight,
                            visualDensity: VisualDensity.compact,
                          ),
                          child: const Text(
                            'Mark all read',
                            style: TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 12,
                            ),
                          ),
                        );
                      },
                    ),
                    IconButton(
                      onPressed: () => Navigator.of(context).pop(),
                      icon: const Icon(Icons.close_rounded, color: Colors.white70),
                      visualDensity: VisualDensity.compact,
                    ),
                  ],
                ),
              ),
              Flexible(
                child: ListenableBuilder(
                  listenable: NotificationController.instance,
                  builder: (context, _) {
                    final ctrl = NotificationController.instance;
                    if (ctrl.loading && ctrl.items.isEmpty) {
                      return const Padding(
                        padding: EdgeInsets.all(28),
                        child: Center(child: CircularProgressIndicator()),
                      );
                    }
                    if (ctrl.items.isEmpty) {
                      return Padding(
                        padding: const EdgeInsets.fromLTRB(20, 28, 20, 28),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.notifications_off_outlined,
                              size: 40,
                              color: AppColors.primary.withValues(alpha: 0.45),
                            )
                                .animate()
                                .fadeIn(duration: 400.ms)
                                .scale(begin: const Offset(0.8, 0.8)),
                            const SizedBox(height: 12),
                            const Text(
                              'No notifications yet',
                              style: TextStyle(
                                fontWeight: FontWeight.w700,
                                color: AppColors.text,
                              ),
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'Contact requests and updates will appear here.',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: AppColors.textMuted,
                                fontSize: 13,
                                height: 1.4,
                              ),
                            ),
                          ],
                        ),
                      );
                    }

                    return ListView.separated(
                      shrinkWrap: true,
                      padding: const EdgeInsets.fromLTRB(10, 10, 10, 6),
                      itemCount: ctrl.items.length,
                      separatorBuilder: (_, _) => const SizedBox(height: 8),
                      itemBuilder: (context, index) {
                        final n = ctrl.items[index];
                        return _PopupItem(
                          notification: n,
                          timeLabel: _fmt(n.createdAt),
                          index: index,
                          onTap: () => _openItem(context, n),
                        );
                      },
                    );
                  },
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 4, 12, 12),
                child: SizedBox(
                  width: double.infinity,
                  child: TextButton(
                    onPressed: () {
                      Navigator.of(context).pop();
                      Navigator.of(context).push(
                        MaterialPageRoute<void>(
                          builder: (_) => const NotificationsScreen(),
                        ),
                      );
                    },
                    child: const Text(
                      'View all notifications',
                      style: TextStyle(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    )
        .animate()
        .shimmer(
          delay: 200.ms,
          duration: 900.ms,
          color: AppColors.gold.withValues(alpha: 0.12),
        );
  }
}

class _PopupItem extends StatelessWidget {
  const _PopupItem({
    required this.notification,
    required this.timeLabel,
    required this.index,
    required this.onTap,
  });

  final AppNotification notification;
  final String timeLabel;
  final int index;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final unread = !notification.isRead;
    return Material(
      color: unread ? AppColors.blush : Colors.white,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Ink(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: unread
                  ? AppColors.primary.withValues(alpha: 0.18)
                  : AppColors.border,
            ),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  gradient: unread
                      ? AppColors.weddingGradient
                      : LinearGradient(
                          colors: [
                            AppColors.blush,
                            AppColors.goldLight.withValues(alpha: 0.5),
                          ],
                        ),
                  borderRadius: BorderRadius.circular(11),
                ),
                child: Icon(
                  unread
                      ? Icons.mark_email_unread_rounded
                      : Icons.mark_email_read_outlined,
                  size: 16,
                  color: unread ? Colors.white : AppColors.primary,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      notification.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontWeight: unread ? FontWeight.w800 : FontWeight.w600,
                        fontSize: 13.5,
                        color: AppColors.text,
                      ),
                    ),
                    if ((notification.body ?? '').isNotEmpty) ...[
                      const SizedBox(height: 3),
                      Text(
                        notification.body!,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: AppColors.textMuted,
                          fontSize: 12.5,
                          height: 1.35,
                        ),
                      ),
                    ],
                    const SizedBox(height: 4),
                    Text(
                      timeLabel,
                      style: TextStyle(
                        color: AppColors.textMuted.withValues(alpha: 0.85),
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
              if (unread)
                Container(
                  width: 8,
                  height: 8,
                  margin: const EdgeInsets.only(top: 6, left: 6),
                  decoration: const BoxDecoration(
                    color: AppColors.primary,
                    shape: BoxShape.circle,
                  ),
                ),
            ],
          ),
        ),
      ),
    )
        .animate()
        .fadeIn(delay: (60 * index).ms, duration: 320.ms)
        .slideY(begin: 0.12, end: 0, delay: (60 * index).ms, duration: 340.ms);
  }
}
