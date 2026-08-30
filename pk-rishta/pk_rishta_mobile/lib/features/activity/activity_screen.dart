import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/network/api_client.dart';
import '../../core/state/auth_controller.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/fade_slide.dart';
import '../../core/widgets/gradient_header.dart';
import '../../core/widgets/primary_button.dart';
import '../../core/widgets/urdu_text.dart';
import '../../data/models/contact_request_model.dart';
import '../../data/repositories/profile_repository.dart';
import '../admin/admin_complaints_screen.dart';
import '../profile/profile_detail_screen.dart';

enum _MainSection { contact, complaints }
enum _ContactView { sent, received }
enum _RequestTab { all, pending, approved, rejected }
enum _ComplaintTab { filed, support }

class ActivityScreen extends StatefulWidget {
  const ActivityScreen({
    super.key,
    required this.onLogin,
    required this.onCompleteProfile,
  });

  final VoidCallback onLogin;
  final VoidCallback onCompleteProfile;

  @override
  State<ActivityScreen> createState() => ActivityScreenState();
}

class ActivityScreenState extends State<ActivityScreen> {
  final _repo = ProfileRepository();
  final _scrollController = ScrollController();

  List<ContactAccessRequest> _sent = [];
  List<ContactAccessRequest> _incoming = [];
  bool _incomingLocked = false;
  List<ComplaintItem> _filed = [];
  List<ComplaintItem> _support = [];

  bool _loading = false;
  String? _error;
  String? _flash;
  bool _flashError = false;

  _MainSection _main = _MainSection.contact;
  _ContactView _contactView = _ContactView.sent;
  _RequestTab _requestTab = _RequestTab.all;
  _ComplaintTab _complaintTab = _ComplaintTab.filed;

  String? _respondingId;
  String? _declineId;
  String? _cancellingId;
  final _declineCtrl = TextEditingController();
  final Map<String, TextEditingController> _replyCtrls = {};

  @override
  void initState() {
    super.initState();
    AuthController.instance.addListener(_onAuthChanged);
    if (AuthController.instance.isLoggedIn) _load();
  }

  @override
  void dispose() {
    AuthController.instance.removeListener(_onAuthChanged);
    _scrollController.dispose();
    _declineCtrl.dispose();
    for (final c in _replyCtrls.values) {
      c.dispose();
    }
    super.dispose();
  }

  /// Scrolls this tab's list back to the top when its nav item is tapped.
  void scrollToTop() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        0,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOutCubic,
      );
    }
  }

  void _onAuthChanged() {
    if (!mounted) return;
    if (AuthController.instance.isLoggedIn) {
      _load();
    } else {
      setState(() {
        _sent = [];
        _incoming = [];
        _filed = [];
        _support = [];
        _error = null;
      });
    }
  }

  TextEditingController _replyCtrl(String id) =>
      _replyCtrls.putIfAbsent(id, TextEditingController.new);

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await Future.wait([
        _repo.getMyContactRequests(),
        _repo.getIncomingContactRequests(),
        _repo.getMyComplaints(),
      ]);
      if (!mounted) return;
      final sent = results[0] as List<ContactAccessRequest>;
      final incoming = results[1] as IncomingContactRequests;
      final complaints = results[2] as MyComplaintsData;
      final locked = incoming.locked ||
          AuthController.instance.needsProfileCompletion;
      setState(() {
        _sent = sent;
        _incoming = incoming.items;
        _incomingLocked = locked;
        _filed = complaints.filed;
        _support = complaints.support;
        _loading = false;
        if (incoming.items.any((r) => r.status == 'pending')) {
          _contactView = _ContactView.received;
          _main = _MainSection.contact;
        }
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _loading = false;
      });
    }
  }

  int get _pendingSent =>
      _sent.where((r) => r.status == 'pending').length;

  int get _pendingIncoming =>
      _incoming.where((r) => r.status == 'pending').length;

  List<ContactAccessRequest> get _filteredSent {
    switch (_requestTab) {
      case _RequestTab.all:
        return _sent;
      case _RequestTab.pending:
        return _sent.where((r) => r.status == 'pending').toList();
      case _RequestTab.approved:
        return _sent
            .where((r) => r.status == 'approved' && !r.isAccessExpired)
            .toList();
      case _RequestTab.rejected:
        return _sent
            .where(
              (r) =>
                  r.status == 'rejected' ||
                  r.status == 'expired' ||
                  (r.status == 'approved' && r.isAccessExpired),
            )
            .toList();
    }
  }

  String _fmt(String? iso) {
    if (iso == null || iso.isEmpty) return '';
    final dt = DateTime.tryParse(iso)?.toLocal();
    if (dt == null) return iso;
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    final h = dt.hour % 12 == 0 ? 12 : dt.hour % 12;
    final ampm = dt.hour >= 12 ? 'pm' : 'am';
    final min = dt.minute.toString().padLeft(2, '0');
    return '${dt.day.toString().padLeft(2, '0')}-${months[dt.month - 1]}-${dt.year}, $h:$min $ampm';
  }

  Future<void> _respond(String id, String action, {String? message}) async {
    setState(() => _respondingId = id);
    try {
      await _repo.respondToContactRequest(id, action, message: message);
      if (!mounted) return;
      setState(() {
        _flash = action == 'approve' ? 'Request accepted' : 'Request declined';
        _flashError = false;
        _declineId = null;
        _declineCtrl.clear();
      });
      await _load();
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _flash = e.message;
        _flashError = true;
      });
    } finally {
      if (mounted) setState(() => _respondingId = null);
    }
  }

  Future<void> _cancel(String id) async {
    setState(() => _cancellingId = id);
    try {
      await _repo.cancelContactRequest(id);
      if (!mounted) return;
      setState(() {
        _flash = 'Connection cancelled. Numbers no longer visible.';
        _flashError = false;
      });
      await _load();
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _flash = e.message;
        _flashError = true;
      });
    } finally {
      if (mounted) setState(() => _cancellingId = null);
    }
  }

  Future<void> _sendReply(String id) async {
    final text = _replyCtrl(id).text.trim();
    if (text.isEmpty) return;
    try {
      await _repo.replyToComplaint(id, text);
      _replyCtrl(id).clear();
      if (!mounted) return;
      setState(() {
        _flash = 'Reply sent';
        _flashError = false;
      });
      await _load();
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _flash = e.message;
        _flashError = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: AppColors.ivory,
      child: SafeArea(
        bottom: false,
        child: Column(
          children: [
            GradientHeader(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const AtelierHeaderTitle(
                      title: 'My Activity',
                      subtitle: 'Track contact requests and complaints',
                    ),
                    const UrduText(
                      'میری سرگرمیاں',
                      style: TextStyle(color: Colors.white70, fontSize: 15),
                    ),
                    if (AuthController.instance.isLoggedIn) ...[
                      const SizedBox(height: 14),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          _HeaderStatChip(
                            icon: Icons.send_rounded,
                            label: 'Sent',
                            value: '${_sent.length}',
                          ),
                          _HeaderStatChip(
                            icon: Icons.inbox_rounded,
                            label: 'Received',
                            value: '${_incoming.length}',
                            alert: _pendingIncoming > 0,
                          ),
                          _HeaderStatChip(
                            icon: Icons.report_gmailerrorred_rounded,
                            label: 'Complaints',
                            value: '${_filed.length + _support.length}',
                          ),
                        ],
                      )
                          .animate()
                          .fadeIn(delay: 180.ms, duration: 420.ms)
                          .slideY(begin: 0.15, end: 0, duration: 450.ms),
                    ],
                  ],
                ),
              ),
            ),
            Expanded(child: _buildBody()),
          ],
        ),
      ),
    );
  }

  Widget _buildBody() {
    return ListenableBuilder(
      listenable: AuthController.instance,
      builder: (context, _) {
        if (!AuthController.instance.isLoggedIn) {
          return _LoginPrompt(onLogin: widget.onLogin);
        }
        if (_loading && _sent.isEmpty && _incoming.isEmpty) {
          return Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const CircularProgressIndicator(color: AppColors.primary)
                    .animate(onPlay: (c) => c.repeat())
                    .shimmer(duration: 1200.ms, color: AppColors.goldLight),
                const SizedBox(height: 14),
                Text(
                  'Loading your activity…',
                  style: TextStyle(
                    color: AppColors.textMuted.withValues(alpha: 0.9),
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          );
        }
        if (_error != null && _sent.isEmpty && _incoming.isEmpty) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(_error!, textAlign: TextAlign.center),
                  const SizedBox(height: 12),
                  ElevatedButton(onPressed: _load, child: const Text('Retry')),
                ],
              ),
            ),
          );
        }

        return RefreshIndicator(
          color: AppColors.primary,
          onRefresh: _load,
          child: ListView(
            controller: _scrollController,
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
            children: [
              if (_flash != null) ...[
                FadeSlide(
                  child: _FlashBanner(
                    message: _flash!,
                    isError: _flashError,
                    onClose: () => setState(() => _flash = null),
                  ),
                ),
                const SizedBox(height: 12),
              ],
              FadeSlide(
                delay: 40.ms,
                child: Row(
                  children: [
                    Expanded(
                      child: _HeroCard(
                        title: 'Contact Requests',
                        subtitle:
                            '$_pendingIncoming received · $_pendingSent sent pending',
                        cta: 'View requests →',
                        icon: Icons.phone_in_talk_rounded,
                        gradient: AppColors.weddingGradient,
                        active: _main == _MainSection.contact,
                        index: 0,
                        onTap: () =>
                            setState(() => _main = _MainSection.contact),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: _HeroCard(
                        title: AuthController.instance.isAdmin
                            ? 'Complaint Chats'
                            : 'Complaints',
                        subtitle: AuthController.instance.isAdmin
                            ? 'Chat with User 1 or User 2'
                            : '${_filed.length + _support.length} total',
                        cta: AuthController.instance.isAdmin
                            ? 'Open chats →'
                            : 'View complaints →',
                        icon: Icons.warning_amber_rounded,
                        gradient: AppColors.goldGradient,
                        active: _main == _MainSection.complaints,
                        index: 1,
                        onTap: () {
                          if (AuthController.instance.isAdmin) {
                            Navigator.of(context).push(
                              MaterialPageRoute<void>(
                                builder: (_) => const AdminComplaintsScreen(),
                              ),
                            );
                            return;
                          }
                          setState(() => _main = _MainSection.complaints);
                        },
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 380),
                switchInCurve: Curves.easeOutCubic,
                switchOutCurve: Curves.easeInCubic,
                transitionBuilder: (child, anim) {
                  return FadeTransition(
                    opacity: anim,
                    child: SlideTransition(
                      position: Tween<Offset>(
                        begin: const Offset(0, 0.06),
                        end: Offset.zero,
                      ).animate(anim),
                      child: child,
                    ),
                  );
                },
                child: KeyedSubtree(
                  key: ValueKey('${_main.name}-${_contactView.name}-${_requestTab.name}-${_complaintTab.name}'),
                  child: _main == _MainSection.contact
                      ? _buildContactSection()
                      : _buildComplaintsSection(),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildContactSection() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.06),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: _SegmentBtn(
                  label: 'Sent',
                  count: _sent.length,
                  active: _contactView == _ContactView.sent,
                  onTap: () =>
                      setState(() => _contactView = _ContactView.sent),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _SegmentBtn(
                  label: 'Received',
                  count: _pendingIncoming > 0
                      ? _pendingIncoming
                      : _incoming.length,
                  alert: _pendingIncoming > 0,
                  active: _contactView == _ContactView.received,
                  onTap: () =>
                      setState(() => _contactView = _ContactView.received),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          if (_contactView == _ContactView.sent) ...[
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _FilterChip(
                    label: 'All (${_sent.length})',
                    active: _requestTab == _RequestTab.all,
                    onTap: () =>
                        setState(() => _requestTab = _RequestTab.all),
                  ),
                  _FilterChip(
                    label: 'Pending ($_pendingSent)',
                    active: _requestTab == _RequestTab.pending,
                    onTap: () =>
                        setState(() => _requestTab = _RequestTab.pending),
                  ),
                  _FilterChip(
                    label:
                        'Approved (${_sent.where((r) => r.status == 'approved' && !r.isAccessExpired).length})',
                    active: _requestTab == _RequestTab.approved,
                    onTap: () =>
                        setState(() => _requestTab = _RequestTab.approved),
                  ),
                  _FilterChip(
                    label:
                        'Rejected (${_sent.where((r) => r.status == 'rejected' || r.status == 'expired' || (r.status == 'approved' && r.isAccessExpired)).length})',
                    active: _requestTab == _RequestTab.rejected,
                    onTap: () =>
                        setState(() => _requestTab = _RequestTab.rejected),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            if (_filteredSent.isEmpty)
              _EmptyBox(
                text: _sent.isEmpty
                    ? 'No contact requests yet.'
                    : 'No ${_requestTab.name} requests.',
              )
            else
              ..._filteredSent.asMap().entries.map(
                    (e) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: AnimatedSection(
                        index: e.key.clamp(0, 8),
                        child: _RequestCard(
                          name: e.value.targetName.isEmpty
                              ? 'Profile'
                              : e.value.targetName,
                          meta: [
                            if (e.value.targetAge != null)
                              '${e.value.targetAge} yrs',
                            if ((e.value.targetCity ?? '').isNotEmpty)
                              e.value.targetCity!,
                          ].join(' · '),
                          date: 'Requested ${_fmt(e.value.createdAt)}',
                          status: e.value.displayStatus,
                          note: _sentNote(e.value),
                          contacts: e.value.status == 'approved' &&
                                  !e.value.isAccessExpired
                              ? e.value.contacts
                              : const [],
                          onOpen: () => _openProfile(e.value.targetProfileId),
                          cancelAction: e.value.status == 'approved' && !e.value.isAccessExpired
                              ? _CancelAction(
                                  busy: _cancellingId == e.value.id,
                                  onCancel: () => _cancel(e.value.id),
                                )
                              : null,
                        ),
                      ),
                    ),
                  ),
          ] else ...[
            if (_incomingLocked) ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                margin: const EdgeInsets.only(bottom: 12),
                decoration: BoxDecoration(
                  color: AppColors.blush,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  children: [
                    const Icon(Icons.lock_rounded,
                        color: AppColors.primary, size: 36),
                    const SizedBox(height: 10),
                    Text(
                      'Complete your profile first',
                      style: GoogleFonts.playfairDisplay(
                        fontWeight: FontWeight.w700,
                        fontSize: 18,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Incoming contact requests stay locked until your profile is complete.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: AppColors.textMuted,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 14),
                    PrimaryButton(
                      label: 'Complete Your Profile',
                      onPressed: widget.onCompleteProfile,
                    ),
                  ],
                ),
              ),
            ],
            if (_incoming.isEmpty)
              const _EmptyBox(text: 'No incoming contact requests yet.')
            else
              ..._incoming.asMap().entries.map(
                    (e) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: AnimatedSection(
                        index: e.key.clamp(0, 8),
                        child: Opacity(
                          opacity: _incomingLocked ? 0.45 : 1,
                          child: IgnorePointer(
                            ignoring: _incomingLocked,
                            child: _RequestCard(
                            name: e.value.requesterName.isEmpty
                                ? 'Member'
                                : e.value.requesterName,
                            meta: [
                              if (e.value.requesterAge != null)
                                '${e.value.requesterAge} yrs',
                              if ((e.value.requesterCity ?? '').isNotEmpty)
                                e.value.requesterCity!,
                            ].join(' · '),
                            date: 'Requested ${_fmt(e.value.createdAt)}',
                            status: e.value.status,
                            note: e.value.userMessage,
                            contacts: e.value.status == 'approved' &&
                                    !e.value.isAccessExpired
                                ? e.value.contacts
                                : const [],
                            cancelAction: !_incomingLocked &&
                                    e.value.status == 'approved' &&
                                    !e.value.isAccessExpired
                                ? _CancelAction(
                                    busy: _cancellingId == e.value.id,
                                    onCancel: () => _cancel(e.value.id),
                                  )
                                : null,
                            trailing: !_incomingLocked &&
                                    e.value.status == 'pending'
                                ? _IncomingActions(
                                    busy: _respondingId == e.value.id,
                                    declining: _declineId == e.value.id,
                                    declineCtrl: _declineCtrl,
                                    onAccept: () =>
                                        _respond(e.value.id, 'approve'),
                                    onDeclineStart: () => setState(() {
                                      _declineId = e.value.id;
                                      _declineCtrl.clear();
                                    }),
                                    onDeclineCancel: () => setState(() {
                                      _declineId = null;
                                      _declineCtrl.clear();
                                    }),
                                    onDeclineConfirm: () {
                                      final reason = _declineCtrl.text.trim();
                                      if (reason.isEmpty) {
                                        setState(() {
                                          _flash =
                                              'Please provide a reason for declining';
                                          _flashError = true;
                                        });
                                        return;
                                      }
                                      _respond(
                                        e.value.id,
                                        'reject',
                                        message: reason,
                                      );
                                    },
                                  )
                                : null,
                            onOpen: _incomingLocked
                                ? null
                                : () => _openProfile(
                                      e.value.requesterProfileId,
                                    ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
          ],
        ],
      ),
    );
  }

  String? _sentNote(ContactAccessRequest item) {
    if ((item.status == 'rejected' || item.status == 'expired') &&
        (item.adminMessage ?? '').isNotEmpty) {
      final label = item.status == 'expired' ? 'Expired' : 'Rejected';
      return '$label: ${item.adminMessage}';
    }
    if (item.status == 'approved' && item.isAccessExpired) {
      return 'Access expired on ${_fmt(item.expiresAt)}';
    }
    if (item.status == 'approved') {
      return 'Contact visible — both can see each other\'s numbers';
    }
    return item.adminMessage;
  }

  Widget _buildComplaintsSection() {
    if (AuthController.instance.isAdmin) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          children: [
            const Text(
              'Complaints are admin-only. Chat separately with User 1 (reporter) or User 2 (reported). They cannot see each other\'s messages.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.textMuted, height: 1.4),
            ),
            const SizedBox(height: 14),
            PrimaryButton(
              label: 'Open complaint chats',
              icon: Icons.forum_outlined,
              expanded: true,
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => const AdminComplaintsScreen(),
                  ),
                );
              },
            ),
          ],
        ),
      );
    }
    final list =
        _complaintTab == _ComplaintTab.filed ? _filed : _support;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.06),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: _SegmentBtn(
                  label: 'My Complaints',
                  count: _filed.length,
                  active: _complaintTab == _ComplaintTab.filed,
                  onTap: () =>
                      setState(() => _complaintTab = _ComplaintTab.filed),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _SegmentBtn(
                  label: 'Admin Messages',
                  count: _support.length,
                  active: _complaintTab == _ComplaintTab.support,
                  onTap: () =>
                      setState(() => _complaintTab = _ComplaintTab.support),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          if (list.isEmpty)
            _EmptyBox(
              text: _complaintTab == _ComplaintTab.filed
                  ? 'You have not filed any complaints yet.'
                  : 'No messages from PK Rishta Admin yet.',
            )
          else
            ...list.asMap().entries.map((e) {
              final c = e.value;
              final isSupport = _complaintTab == _ComplaintTab.support;
              final otherLabel = isSupport ? 'From' : 'Against';
              final otherName = isSupport
                  ? 'PK Rishta Admin'
                  : c.reportedName;
              final otherId = isSupport ? null : c.reportedProfileId;
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: AnimatedSection(
                  index: e.key.clamp(0, 8),
                  child: _ComplaintCard(
                    item: c,
                    otherLabel: otherLabel,
                    otherName: otherName.isEmpty ? 'Profile' : otherName,
                    date: _fmt(c.createdAt),
                    isSupport: isSupport,
                    replyCtrl: _replyCtrl(c.id),
                    onOpenOther: otherId == null || otherId.isEmpty
                        ? null
                        : () => _openProfile(otherId),
                    onReply: () => _sendReply(c.id),
                  ),
                ),
              );
            }),
        ],
      ),
    );
  }

  void _openProfile(String id) {
    if (id.isEmpty) return;
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => ProfileDetailScreen(profileId: id),
      ),
    );
  }
}

class _HeaderStatChip extends StatelessWidget {
  const _HeaderStatChip({
    required this.icon,
    required this.label,
    required this.value,
    this.alert = false,
  });

  final IconData icon;
  final String label;
  final String value;
  final bool alert;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
          color: alert
              ? AppColors.goldLight.withValues(alpha: 0.7)
              : Colors.white.withValues(alpha: 0.2),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: alert ? AppColors.goldLight : Colors.white70),
          const SizedBox(width: 6),
          Text(
            '$label $value',
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.92),
              fontWeight: FontWeight.w700,
              fontSize: 11.5,
            ),
          ),
        ],
      ),
    );
  }
}

class _HeroCard extends StatelessWidget {
  const _HeroCard({
    required this.title,
    required this.subtitle,
    required this.cta,
    required this.icon,
    required this.gradient,
    required this.active,
    required this.onTap,
    this.index = 0,
  });

  final String title;
  final String subtitle;
  final String cta;
  final IconData icon;
  final Gradient gradient;
  final bool active;
  final VoidCallback onTap;
  final int index;

  @override
  Widget build(BuildContext context) {
    return AnimatedScale(
      scale: active ? 1.0 : 0.97,
      duration: const Duration(milliseconds: 260),
      curve: Curves.easeOutCubic,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(20),
          child: Ink(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              gradient: gradient,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: active ? AppColors.goldLight : Colors.white.withValues(alpha: 0.15),
                width: active ? 2.5 : 1,
              ),
              boxShadow: [
                BoxShadow(
                  color: (active ? AppColors.gold : AppColors.primary)
                      .withValues(alpha: active ? 0.28 : 0.16),
                  blurRadius: active ? 18 : 12,
                  offset: const Offset(0, 7),
                ),
              ],
            ),
            child: Stack(
              children: [
                Positioned(
                  right: -10,
                  top: -12,
                  child: Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white.withValues(alpha: 0.1),
                    ),
                  ),
                ),
                Positioned(
                  right: 8,
                  bottom: -16,
                  child: Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white.withValues(alpha: 0.08),
                    ),
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.16),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(icon, color: Colors.white, size: 18),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.88),
                        fontSize: 11.5,
                        height: 1.3,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      cta,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.95),
                        fontWeight: FontWeight.w700,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    )
        .animate(delay: (80 + index * 90).ms)
        .fadeIn(duration: 420.ms)
        .slideY(begin: 0.12, end: 0, duration: 480.ms, curve: Curves.easeOutCubic);
  }
}

class _SegmentBtn extends StatelessWidget {
  const _SegmentBtn({
    required this.label,
    required this.count,
    required this.active,
    required this.onTap,
    this.alert = false,
  });

  final String label;
  final int count;
  final bool active;
  final bool alert;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 240),
      curve: Curves.easeOutCubic,
      decoration: BoxDecoration(
        gradient: active ? AppColors.weddingGradient : null,
        color: active ? null : AppColors.blush,
        borderRadius: BorderRadius.circular(14),
        boxShadow: active
            ? [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.22),
                  blurRadius: 12,
                  offset: const Offset(0, 5),
                ),
              ]
            : null,
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Flexible(
                  child: Text(
                    label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      color: active ? Colors.white : AppColors.text,
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                  decoration: BoxDecoration(
                    color: alert
                        ? const Color(0xFFDC2626)
                        : (active
                            ? Colors.white.withValues(alpha: 0.22)
                            : Colors.white),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    '$count',
                    style: TextStyle(
                      color: alert
                          ? Colors.white
                          : (active ? Colors.white : AppColors.primary),
                      fontWeight: FontWeight.w800,
                      fontSize: 11,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _CancelAction extends StatelessWidget {
  const _CancelAction({required this.busy, required this.onCancel});

  final bool busy;
  final VoidCallback onCancel;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: busy ? null : onCancel,
        icon: busy
            ? const SizedBox(
                width: 14,
                height: 14,
                child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFFB91C1C)),
              )
            : const Icon(Icons.link_off_rounded, size: 16, color: Color(0xFFB91C1C)),
        label: Text(
          busy ? 'Cancelling...' : 'Cancel Connection',
          style: const TextStyle(color: Color(0xFFB91C1C), fontWeight: FontWeight.w600, fontSize: 13),
        ),
        style: OutlinedButton.styleFrom(
          side: const BorderSide(color: Color(0xFFB91C1C), width: 1.2),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.active,
    required this.onTap,
  });

  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(label),
        selected: active,
        onSelected: (_) => onTap(),
        selectedColor: AppColors.primary,
        labelStyle: TextStyle(
          color: active ? Colors.white : AppColors.text,
          fontWeight: FontWeight.w600,
          fontSize: 12,
        ),
        side: BorderSide(
          color: active ? AppColors.primary : AppColors.border,
        ),
      ),
    );
  }
}

class _RequestCard extends StatelessWidget {
  const _RequestCard({
    required this.name,
    required this.meta,
    required this.date,
    required this.status,
    this.note,
    this.contacts = const [],
    this.trailing,
    this.cancelAction,
    this.onOpen,
  });

  final String name;
  final String meta;
  final String date;
  final String status;
  final String? note;
  final List<ContactNumber> contacts;
  final Widget? trailing;
  final _CancelAction? cancelAction;
  final VoidCallback? onOpen;

  Color get _accent {
    switch (status) {
      case 'approved':
        return const Color(0xFF15803D);
      case 'rejected':
      case 'expired':
        return const Color(0xFFB91C1C);
      default:
        return AppColors.gold;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.05),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(width: 4, color: _accent),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 46,
                          height: 46,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            gradient: AppColors.weddingGradient,
                            borderRadius: BorderRadius.circular(15),
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.primary.withValues(alpha: 0.2),
                                blurRadius: 8,
                                offset: const Offset(0, 3),
                              ),
                            ],
                          ),
                          child: Text(
                            name.isNotEmpty ? name[0].toUpperCase() : '?',
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w800,
                              fontSize: 18,
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              GestureDetector(
                                onTap: onOpen,
                                child: Text(
                                  name,
                                  style: GoogleFonts.playfairDisplay(
                                    fontWeight: FontWeight.w700,
                                    fontSize: 16,
                                    color: onOpen != null
                                        ? AppColors.primary
                                        : AppColors.text,
                                  ),
                                ),
                              ),
                              if (meta.isNotEmpty)
                                Text(
                                  meta,
                                  style: const TextStyle(
                                    color: AppColors.textMuted,
                                    fontSize: 12.5,
                                  ),
                                ),
                              Text(
                                date,
                                style: const TextStyle(
                                  color: AppColors.textMuted,
                                  fontSize: 11.5,
                                ),
                              ),
                            ],
                          ),
                        ),
                        _StatusChip(status: status),
                      ],
                    ),
                    if ((note ?? '').isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Text(
                        note!,
                        style: TextStyle(
                          color: status == 'expired' || status == 'rejected'
                              ? const Color(0xFFB91C1C)
                              : AppColors.textMuted,
                          fontSize: 12.5,
                          height: 1.35,
                        ),
                      ),
                    ],
                    if (contacts.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 6,
                        children: contacts
                            .map(
                              (c) => ActionChip(
                                avatar: Icon(
                                  c.type == 'whatsapp'
                                      ? Icons.chat_rounded
                                      : Icons.phone_rounded,
                                  size: 16,
                                  color: AppColors.primary,
                                ),
                                label: Text(
                                  '${c.type == 'whatsapp' ? 'WhatsApp' : 'Phone'}: ${c.number}',
                                ),
                                onPressed: () async {
                                  final uri = c.type == 'whatsapp'
                                      ? Uri.parse(
                                          'https://wa.me/${c.number.replaceAll(RegExp(r'[^0-9+]'), '')}',
                                        )
                                      : Uri(scheme: 'tel', path: c.number);
                                  if (await canLaunchUrl(uri)) {
                                    await launchUrl(uri);
                                  }
                                },
                              ),
                            )
                            .toList(),
                      ),
                    ],
                    if (trailing != null) ...[
                      const SizedBox(height: 10),
                      trailing!,
                    ],
                    if (cancelAction != null) ...[
                      const SizedBox(height: 10),
                      cancelAction!,
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _IncomingActions extends StatelessWidget {
  const _IncomingActions({
    required this.busy,
    required this.declining,
    required this.declineCtrl,
    required this.onAccept,
    required this.onDeclineStart,
    required this.onDeclineCancel,
    required this.onDeclineConfirm,
  });

  final bool busy;
  final bool declining;
  final TextEditingController declineCtrl;
  final VoidCallback onAccept;
  final VoidCallback onDeclineStart;
  final VoidCallback onDeclineCancel;
  final VoidCallback onDeclineConfirm;

  @override
  Widget build(BuildContext context) {
    if (declining) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(
            controller: declineCtrl,
            maxLines: 2,
            decoration: const InputDecoration(
              hintText: 'Reason for declining (required)',
              border: OutlineInputBorder(),
              isDense: true,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: PrimaryButton(
                  label: busy ? '...' : 'Confirm Decline',
                  onPressed: busy ? () {} : onDeclineConfirm,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: PrimaryButton(
                  label: 'Cancel',
                  style: PrimaryButtonStyle.outline,
                  onPressed: onDeclineCancel,
                ),
              ),
            ],
          ),
        ],
      );
    }
    return Row(
      children: [
        Expanded(
          child: PrimaryButton(
            label: busy ? '...' : 'Accept',
            onPressed: busy ? () {} : onAccept,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: PrimaryButton(
            label: 'Decline',
            style: PrimaryButtonStyle.outline,
            onPressed: busy ? () {} : onDeclineStart,
          ),
        ),
      ],
    );
  }
}

class _ComplaintCard extends StatelessWidget {
  const _ComplaintCard({
    required this.item,
    required this.otherLabel,
    required this.otherName,
    required this.date,
    required this.replyCtrl,
    required this.onReply,
    this.isSupport = false,
    this.onOpenOther,
  });

  final ComplaintItem item;
  final String otherLabel;
  final String otherName;
  final String date;
  final bool isSupport;
  final TextEditingController replyCtrl;
  final VoidCallback onReply;
  final VoidCallback? onOpenOther;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.ivory,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _StatusChip(status: item.status),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  isSupport ? 'PK Rishta Support' : item.category.replaceAll('_', ' '),
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
              Text(
                date,
                style: const TextStyle(
                  color: AppColors.textMuted,
                  fontSize: 11,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          GestureDetector(
            onTap: onOpenOther,
            child: Text.rich(
              TextSpan(
                children: [
                  TextSpan(
                    text: '$otherLabel: ',
                    style: const TextStyle(fontWeight: FontWeight.w700),
                  ),
                  TextSpan(
                    text: otherName,
                    style: TextStyle(
                      color: onOpenOther != null
                          ? AppColors.primary
                          : AppColors.text,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          ...item
              .messagesFor(isSupport ? 'reported' : 'reporter')
              .map((m) {
            final isAdminMsg = m.senderRole == 'admin';
            return Align(
              alignment:
                  isAdminMsg ? Alignment.centerLeft : Alignment.centerRight,
              child: Container(
                width: double.infinity,
                margin: const EdgeInsets.only(bottom: 6),
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: isAdminMsg ? const Color(0xFFEDE9FE) : Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border(
                    left: BorderSide(
                      width: 3,
                      color: isAdminMsg
                          ? const Color(0xFF7C3AED)
                          : AppColors.gold,
                    ),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      m.displayRole(isSupport: isSupport),
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary,
                      ),
                    ),
                    Text(m.message),
                  ],
                ),
              ),
            );
          }),
          if (item.status != 'dismissed') ...[
            const SizedBox(height: 6),
            TextField(
              controller: replyCtrl,
              maxLines: 2,
              decoration: const InputDecoration(
                hintText: 'Write your reply...',
                border: OutlineInputBorder(),
                isDense: true,
              ),
            ),
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerRight,
              child: PrimaryButton(label: 'Send Reply', onPressed: onReply),
            ),
          ],
        ],
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    switch (status) {
      case 'accepted':
      case 'approved':
      case 'resolved':
        bg = const Color(0xFFDCFCE7);
        fg = const Color(0xFF15803D);
      case 'rejected':
      case 'declined':
      case 'expired':
      case 'dismissed':
        bg = const Color(0xFFFEE2E2);
        fg = const Color(0xFFB91C1C);
      default:
        bg = AppColors.goldLight;
        fg = AppColors.primaryDark;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        status,
        style: TextStyle(
          color: fg,
          fontSize: 11,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _EmptyBox extends StatelessWidget {
  const _EmptyBox({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 28),
      child: Column(
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppColors.blush,
                  AppColors.goldLight.withValues(alpha: 0.55),
                ],
              ),
              borderRadius: BorderRadius.circular(24),
            ),
            child: const Icon(
              Icons.inbox_outlined,
              color: AppColors.primary,
              size: 32,
            ),
          )
              .animate()
              .fadeIn(duration: 400.ms)
              .scale(begin: const Offset(0.85, 0.85), curve: Curves.easeOutBack),
          const SizedBox(height: 14),
          Text(
            text,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: AppColors.textMuted,
              height: 1.4,
              fontWeight: FontWeight.w600,
            ),
          ).animate().fadeIn(delay: 120.ms, duration: 400.ms),
        ],
      ),
    );
  }
}

class _FlashBanner extends StatelessWidget {
  const _FlashBanner({
    required this.message,
    required this.isError,
    required this.onClose,
  });

  final String message;
  final bool isError;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 10, 4, 10),
      decoration: BoxDecoration(
        color: isError ? const Color(0xFFFEE2E2) : const Color(0xFFDCFCE7),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              message,
              style: TextStyle(
                color: isError
                    ? const Color(0xFFB91C1C)
                    : const Color(0xFF15803D),
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          IconButton(
            onPressed: onClose,
            icon: const Icon(Icons.close, size: 18),
          ),
        ],
      ),
    );
  }
}

class _LoginPrompt extends StatelessWidget {
  const _LoginPrompt({required this.onLogin});

  final VoidCallback onLogin;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        Container(
          padding: const EdgeInsets.all(26),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: AppColors.border),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.08),
                blurRadius: 22,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Column(
            children: [
              Container(
                width: 76,
                height: 76,
                decoration: BoxDecoration(
                  gradient: AppColors.weddingGradient,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: const Icon(
                  Icons.lock_outline_rounded,
                  size: 36,
                  color: Colors.white,
                ),
              )
                  .animate()
                  .fadeIn(duration: 400.ms)
                  .scale(begin: const Offset(0.85, 0.85)),
              const SizedBox(height: 16),
              Text(
                'Login required',
                style: GoogleFonts.playfairDisplay(
                  fontSize: 24,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Login to view your sent and received contact requests.',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.textMuted, height: 1.5),
              ),
              const SizedBox(height: 18),
              PrimaryButton(
                label: 'Login to continue',
                onPressed: onLogin,
              ),
            ],
          ),
        )
            .animate()
            .fadeIn(duration: 450.ms)
            .slideY(begin: 0.08, end: 0, duration: 500.ms),
      ],
    );
  }
}
