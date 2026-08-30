import 'package:flutter/material.dart';

import '../../core/network/api_client.dart';
import '../../core/state/auth_controller.dart';
import '../../core/theme/app_colors.dart';
import '../../core/widgets/gradient_header.dart';
import '../../core/widgets/primary_button.dart';
import '../../data/models/contact_request_model.dart';
import '../../data/repositories/admin_repository.dart';
import '../profile/profile_detail_screen.dart';

class AdminComplaintsScreen extends StatefulWidget {
  const AdminComplaintsScreen({super.key});

  @override
  State<AdminComplaintsScreen> createState() => _AdminComplaintsScreenState();
}

class _AdminComplaintsScreenState extends State<AdminComplaintsScreen> {
  final _repo = AdminRepository();
  final _searchCtrl = TextEditingController();
  final _msgCtrls = <String, TextEditingController>{};
  final _noteCtrls = <String, TextEditingController>{};
  final _chatTarget = <String, String>{};

  List<ComplaintItem> _items = [];
  bool _loading = true;
  bool _sending = false;
  bool _reviewing = false;
  String _status = 'pending';
  String? _flash;
  bool _flashError = false;

  @override
  void initState() {
    super.initState();
    if (!AuthController.instance.isAdmin) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) Navigator.of(context).maybePop();
      });
      return;
    }
    _load();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    for (final c in _msgCtrls.values) {
      c.dispose();
    }
    for (final c in _noteCtrls.values) {
      c.dispose();
    }
    super.dispose();
  }

  TextEditingController _msgCtrl(String id) =>
      _msgCtrls.putIfAbsent(id, TextEditingController.new);

  TextEditingController _noteCtrl(String id) =>
      _noteCtrls.putIfAbsent(id, TextEditingController.new);

  String _targetFor(String id) => _chatTarget[id] ?? 'reporter';

  Future<void> _load({bool silent = false}) async {
    if (!silent) {
      setState(() {
        _loading = true;
        _flash = null;
      });
    }
    try {
      final items = await _repo.getComplaints(
        status: _status,
        search: _searchCtrl.text.trim(),
      );
      if (!mounted) return;
      setState(() {
        _items = items;
        _loading = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _flash = e.message;
        _flashError = true;
      });
    }
  }

  Future<void> _send(ComplaintItem item) async {
    final text = _msgCtrl(item.id).text.trim();
    if (text.isEmpty || _sending) return;
    final recipient = _targetFor(item.id);
    setState(() => _sending = true);
    try {
      final msg = await _repo.sendComplaintMessage(
        id: item.id,
        message: text,
        recipient: recipient,
      );
      if (!mounted) return;
      _msgCtrl(item.id).clear();
      setState(() {
        _sending = false;
        _flash = msg;
        _flashError = false;
      });
      await _load(silent: true);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _sending = false;
        _flash = e.message;
        _flashError = true;
      });
    }
  }

  Future<void> _review(ComplaintItem item, String status) async {
    if (_reviewing) return;
    setState(() => _reviewing = true);
    try {
      final msg = await _repo.reviewComplaint(
        id: item.id,
        status: status,
        adminNotes: _noteCtrl(item.id).text,
      );
      if (!mounted) return;
      setState(() {
        _reviewing = false;
        _flash = msg;
        _flashError = false;
      });
      await _load(silent: true);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _reviewing = false;
        _flash = e.message;
        _flashError = true;
      });
    }
  }

  String _fmt(String iso) {
    final dt = DateTime.tryParse(iso)?.toLocal();
    if (dt == null) return iso;
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    final h = dt.hour % 12 == 0 ? 12 : dt.hour % 12;
    final m = dt.minute.toString().padLeft(2, '0');
    final ap = dt.hour >= 12 ? 'PM' : 'AM';
    return '${dt.day} ${months[dt.month - 1]} ${dt.year}, $h:$m $ap';
  }

  String _roleLabel(String senderRole, String party) {
    if (senderRole == 'admin') return 'Admin';
    if (senderRole == party) {
      return party == 'reporter' ? 'User 1 (Reporter)' : 'User 2 (Reported)';
    }
    if (senderRole == 'reporter') return 'User 1 (Reporter)';
    if (senderRole == 'reported') return 'User 2 (Reported)';
    return senderRole;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.ivory,
      body: Column(
        children: [
          GradientHeader(
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(8, 4, 16, 18),
                child: Row(
                  children: [
                    IconButton(
                      onPressed: () => Navigator.of(context).pop(),
                      icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
                    ),
                    const Expanded(
                      child: AtelierHeaderTitle(
                        title: 'Complaint chats',
                        subtitle: 'Select User 1 or User 2 — private 1:1 chat',
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
            child: Column(
              children: [
                TextField(
                  controller: _searchCtrl,
                  textInputAction: TextInputAction.search,
                  onSubmitted: (_) => _load(),
                  decoration: InputDecoration(
                    hintText: 'Search by email or name',
                    prefixIcon: const Icon(Icons.search_rounded),
                    suffixIcon: IconButton(
                      onPressed: _load,
                      icon: const Icon(Icons.arrow_forward_rounded),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      for (final opt in const [
                        ('pending', 'Pending'),
                        ('resolved', 'Resolved'),
                        ('dismissed', 'Dismissed'),
                        ('', 'All'),
                      ])
                        Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: ChoiceChip(
                            label: Text(opt.$2),
                            selected: _status == opt.$1,
                            onSelected: (_) {
                              setState(() => _status = opt.$1);
                              _load();
                            },
                            selectedColor: AppColors.goldLight,
                            labelStyle: TextStyle(
                              fontWeight: FontWeight.w700,
                              color: _status == opt.$1
                                  ? AppColors.primaryDark
                                  : AppColors.textMuted,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          if (_flash != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: _flashError ? const Color(0xFFFEE2E2) : const Color(0xFFDCFCE7),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  _flash!,
                  style: TextStyle(
                    color: _flashError ? const Color(0xFFB91C1C) : const Color(0xFF15803D),
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
              ),
            ),
          Expanded(
            child: _loading
                ? const Center(
                    child: CircularProgressIndicator(color: AppColors.primary),
                  )
                : _items.isEmpty
                    ? const Center(
                        child: Text(
                          'No complaints found.',
                          style: TextStyle(color: AppColors.textMuted),
                        ),
                      )
                    : RefreshIndicator(
                        color: AppColors.primary,
                        onRefresh: _load,
                        child: ListView.builder(
                          padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
                          itemCount: _items.length,
                          itemBuilder: (context, i) => Padding(
                            padding: const EdgeInsets.only(bottom: 14),
                            child: _buildCard(_items[i]),
                          ),
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildCard(ComplaintItem c) {
    final party = _targetFor(c.id);
    final msgs = c.messagesFor(party);
    final chatName = party == 'reported'
        ? (c.reportedName.isEmpty ? 'Reported user' : c.reportedName)
        : (c.reporterName.isEmpty ? 'Reporter' : c.reporterName);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.05),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _chip(c.status),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  c.categoryLabel,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
              ),
              Text(
                _fmt(c.createdAt),
                style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
              ),
            ],
          ),
          const SizedBox(height: 10),
          _partyRow(
            label: 'User 1 · Reporter',
            name: c.reporterName.isEmpty ? 'Reporter' : c.reporterName,
            meta: [c.reporterCity, c.reporterEmail]
                .whereType<String>()
                .where((e) => e.isNotEmpty)
                .join(' · '),
            onTap: c.reporterProfileId == null || c.reporterProfileId!.isEmpty
                ? null
                : () => Navigator.of(context).push(
                      MaterialPageRoute<void>(
                        builder: (_) =>
                            ProfileDetailScreen(profileId: c.reporterProfileId!),
                      ),
                    ),
          ),
          const SizedBox(height: 6),
          _partyRow(
            label: 'User 2 · Reported',
            name: c.reportedName.isEmpty ? 'Reported profile' : c.reportedName,
            meta: [c.reportedCity, c.reportedEmail]
                .whereType<String>()
                .where((e) => e.isNotEmpty)
                .join(' · '),
            onTap: c.reportedProfileId == null || c.reportedProfileId!.isEmpty
                ? null
                : () => Navigator.of(context).push(
                      MaterialPageRoute<void>(
                        builder: (_) =>
                            ProfileDetailScreen(profileId: c.reportedProfileId!),
                      ),
                    ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _chatTab(
                  label: 'Chat: User 1',
                  active: party == 'reporter',
                  onTap: () => setState(() => _chatTarget[c.id] = 'reporter'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _chatTab(
                  label: 'Chat: User 2',
                  active: party == 'reported',
                  onTap: () => setState(() => _chatTarget[c.id] = 'reported'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            'Private chat with $chatName',
            style: const TextStyle(
              fontSize: 12.5,
              fontWeight: FontWeight.w600,
              color: AppColors.textMuted,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.ivory,
              borderRadius: BorderRadius.circular(14),
            ),
            child: msgs.isEmpty
                ? const Padding(
                    padding: EdgeInsets.symmetric(vertical: 8),
                    child: Text(
                      'No messages with this user yet. Select them and send a message.',
                      style: TextStyle(
                        color: AppColors.textMuted,
                        fontStyle: FontStyle.italic,
                        fontSize: 13,
                      ),
                    ),
                  )
                : Column(
                    children: [
                      for (final m in msgs)
                        Align(
                          alignment: m.senderRole == 'admin'
                              ? Alignment.centerRight
                              : Alignment.centerLeft,
                          child: Container(
                            width: double.infinity,
                            margin: const EdgeInsets.only(bottom: 6),
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: m.senderRole == 'admin'
                                  ? const Color(0xFFEDE9FE)
                                  : Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border: Border(
                                left: BorderSide(
                                  width: 3,
                                  color: m.senderRole == 'admin'
                                      ? const Color(0xFF7C3AED)
                                      : (party == 'reported'
                                          ? const Color(0xFF2563EB)
                                          : const Color(0xFFD97706)),
                                ),
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _roleLabel(m.senderRole, party),
                                  style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.primary,
                                  ),
                                ),
                                Text(m.message),
                                Text(
                                  _fmt(m.createdAt),
                                  style: const TextStyle(
                                    fontSize: 10,
                                    color: AppColors.textMuted,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
          ),
          if (c.status != 'dismissed') ...[
            const SizedBox(height: 10),
            TextField(
              controller: _msgCtrl(c.id),
              maxLines: 2,
              decoration: InputDecoration(
                hintText: party == 'reported'
                    ? 'Message to User 2 only…'
                    : 'Message to User 1 only…',
                isDense: true,
              ),
            ),
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerRight,
              child: PrimaryButton(
                label: party == 'reported' ? 'Send to User 2' : 'Send to User 1',
                onPressed: _sending ? () {} : () => _send(c),
              ),
            ),
          ],
          if (c.status == 'pending') ...[
            const SizedBox(height: 12),
            TextField(
              controller: _noteCtrl(c.id),
              maxLines: 2,
              decoration: const InputDecoration(
                hintText: 'Internal notes only (not sent as chat)',
                isDense: true,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: PrimaryButton(
                    label: 'Resolved',
                    onPressed: _reviewing ? () {} : () => _review(c, 'resolved'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: PrimaryButton(
                    label: 'Dismiss',
                    style: PrimaryButtonStyle.outline,
                    onPressed: _reviewing ? () {} : () => _review(c, 'dismissed'),
                  ),
                ),
              ],
            ),
          ],
          if ((c.adminNotes ?? '').isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              'Admin notes: ${c.adminNotes}',
              style: const TextStyle(
                fontSize: 12.5,
                fontStyle: FontStyle.italic,
                color: AppColors.textMuted,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _chatTab({
    required String label,
    required bool active,
    required VoidCallback onTap,
  }) {
    return Material(
      color: active ? AppColors.primary : Colors.white,
      borderRadius: BorderRadius.circular(999),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 9),
          alignment: Alignment.center,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(999),
            border: Border.all(
              color: active ? AppColors.primary : AppColors.border,
            ),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 13,
              color: active ? Colors.white : AppColors.textMuted,
            ),
          ),
        ),
      ),
    );
  }

  Widget _partyRow({
    required String label,
    required String name,
    required String meta,
    VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
          ),
          Text(
            name,
            style: TextStyle(
              fontWeight: FontWeight.w700,
              color: onTap != null ? AppColors.primary : AppColors.text,
            ),
          ),
          if (meta.isNotEmpty)
            Text(
              meta,
              style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
            ),
        ],
      ),
    );
  }

  Widget _chip(String status) {
    Color bg;
    Color fg;
    switch (status) {
      case 'resolved':
        bg = const Color(0xFFDCFCE7);
        fg = const Color(0xFF15803D);
      case 'dismissed':
        bg = const Color(0xFFFEE2E2);
        fg = const Color(0xFFB91C1C);
      default:
        bg = AppColors.goldLight;
        fg = AppColors.primaryDark;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        status,
        style: TextStyle(color: fg, fontSize: 11, fontWeight: FontWeight.w800),
      ),
    );
  }
}
