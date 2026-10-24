class ContactNumber {
  ContactNumber({this.id, required this.type, required this.number});

  final String? id;
  final String type;
  final String number;

  factory ContactNumber.fromJson(Map<String, dynamic> json) {
    return ContactNumber(
      id: json['id']?.toString(),
      type: (json['type'] ?? 'phone').toString(),
      number: (json['number'] ?? '').toString(),
    );
  }
}

class ContactAccessStatus {
  ContactAccessStatus({
    required this.status,
    this.adminMessage,
    this.canRequestAgain = true,
    this.canRequest = true,
    this.pendingRemaining,
    this.pendingLimit,
    this.contacts = const [],
    this.lastStatus,
  });

  final String status;
  final String? adminMessage;
  final bool canRequestAgain;
  final bool canRequest;
  final int? pendingRemaining;
  final int? pendingLimit;
  final List<ContactNumber> contacts;
  final String? lastStatus;

  bool get isRejectedPermanent =>
      status == 'rejected' || canRequestAgain == false;

  bool get canSendRequest {
    if (status == 'own' || status == 'pending' || status == 'approved') {
      return false;
    }
    if (isRejectedPermanent) return false;
    if (!canRequest) return false;
    if (pendingRemaining != null && pendingRemaining! <= 0) return false;
    return status == 'none' || status == 'expired';
  }

  factory ContactAccessStatus.fromJson(Map<String, dynamic> json) {
    int? toInt(dynamic v) =>
        v == null ? null : (v is int ? v : int.tryParse(v.toString()));
    final contactsRaw = json['contacts'] as List? ?? [];
    return ContactAccessStatus(
      status: (json['status'] ?? 'none').toString(),
      adminMessage: json['admin_message']?.toString(),
      canRequestAgain: json['can_request_again'] != false,
      canRequest: json['can_request'] != false &&
          json['can_request_today'] != false,
      pendingRemaining: toInt(json['pending_remaining'] ?? json['daily_remaining']),
      pendingLimit: toInt(json['pending_limit'] ?? json['daily_limit']),
      lastStatus: json['last_status']?.toString(),
      contacts: contactsRaw
          .map((e) => ContactNumber.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class ContactAccessRequest {
  ContactAccessRequest({
    required this.id,
    required this.requesterProfileId,
    required this.targetProfileId,
    required this.status,
    required this.createdAt,
    this.userMessage,
    this.adminMessage,
    this.expiresAt,
    this.targetFirstName,
    this.targetLastName,
    this.targetCity,
    this.targetAge,
    this.targetGender,
    this.targetPhoto,
    this.requesterFirstName,
    this.requesterLastName,
    this.requesterCity,
    this.requesterAge,
    this.requesterGender,
    this.requesterPhoto,
    this.contacts = const [],
  });

  final String id;
  final String requesterProfileId;
  final String targetProfileId;
  final String status;
  final String createdAt;
  final String? userMessage;
  final String? adminMessage;
  final String? expiresAt;
  final String? targetFirstName;
  final String? targetLastName;
  final String? targetCity;
  final int? targetAge;
  final String? targetGender;
  final String? targetPhoto;
  final String? requesterFirstName;
  final String? requesterLastName;
  final String? requesterCity;
  final int? requesterAge;
  final String? requesterGender;
  final String? requesterPhoto;
  final List<ContactNumber> contacts;

  String get targetName =>
      '${targetFirstName ?? ''} ${targetLastName ?? ''}'.trim();

  String get requesterName =>
      '${requesterFirstName ?? ''} ${requesterLastName ?? ''}'.trim();

  bool get isAccessExpired {
    if (expiresAt == null || expiresAt!.isEmpty) return false;
    final at = DateTime.tryParse(expiresAt!);
    return at != null && at.isBefore(DateTime.now());
  }

  String get displayStatus {
    if (status == 'approved' && isAccessExpired) return 'expired';
    return status;
  }

  factory ContactAccessRequest.fromJson(Map<String, dynamic> json) {
    int? toInt(dynamic v) =>
        v == null ? null : (v is int ? v : int.tryParse(v.toString()));
    final contactsRaw = json['contacts'] as List? ?? [];
    return ContactAccessRequest(
      id: json['id'].toString(),
      requesterProfileId: (json['requester_profile_id'] ?? '').toString(),
      targetProfileId: (json['target_profile_id'] ?? '').toString(),
      status: (json['status'] ?? 'pending').toString(),
      createdAt: (json['created_at'] ?? '').toString(),
      userMessage: json['user_message'] as String?,
      adminMessage: json['admin_message'] as String?,
      expiresAt: json['expires_at']?.toString(),
      targetFirstName: json['target_first_name'] as String?,
      targetLastName: json['target_last_name'] as String?,
      targetCity: json['target_city'] as String?,
      targetAge: toInt(json['target_age']),
      targetGender: json['target_gender'] as String?,
      targetPhoto: json['target_photo'] as String?,
      requesterFirstName: json['requester_first_name'] as String?,
      requesterLastName: json['requester_last_name'] as String?,
      requesterCity: json['requester_city'] as String?,
      requesterAge: toInt(json['requester_age']),
      requesterGender: json['requester_gender'] as String?,
      requesterPhoto: json['requester_photo'] as String?,
      contacts: contactsRaw
          .map((e) => ContactNumber.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class IncomingContactRequests {
  IncomingContactRequests({required this.items, required this.locked});

  final List<ContactAccessRequest> items;
  final bool locked;
}

class ComplaintMessage {
  ComplaintMessage({
    required this.id,
    required this.senderRole,
    required this.message,
    required this.createdAt,
    this.recipientRole,
  });

  final String id;
  final String senderRole;
  final String? recipientRole;
  final String message;
  final String createdAt;

  factory ComplaintMessage.fromJson(Map<String, dynamic> json) {
    final raw = json['recipient_role']?.toString().trim();
    return ComplaintMessage(
      id: json['id'].toString(),
      senderRole: (json['sender_role'] ?? '').toString(),
      recipientRole: (raw == null || raw.isEmpty || raw == 'null') ? null : raw,
      message: (json['message'] ?? '').toString(),
      createdAt: (json['created_at'] ?? '').toString(),
    );
  }

  String displayRole({required bool isSupport}) {
    if (senderRole == 'admin') return 'Admin';
    return 'You';
  }
}

class ComplaintItem {
  ComplaintItem({
    required this.id,
    required this.status,
    required this.category,
    required this.createdAt,
    this.reporterProfileId,
    this.reportedProfileId,
    this.reporterFirstName,
    this.reporterLastName,
    this.reportedFirstName,
    this.reportedLastName,
    this.reporterCity,
    this.reportedCity,
    this.reporterEmail,
    this.reportedEmail,
    this.adminNotes,
    this.messages = const [],
  });

  final String id;
  final String status;
  final String category;
  final String createdAt;
  final String? reporterProfileId;
  final String? reportedProfileId;
  final String? reporterFirstName;
  final String? reporterLastName;
  final String? reportedFirstName;
  final String? reportedLastName;
  final String? reporterCity;
  final String? reportedCity;
  final String? reporterEmail;
  final String? reportedEmail;
  final String? adminNotes;
  final List<ComplaintMessage> messages;

  String get reporterName =>
      '${reporterFirstName ?? ''} ${reporterLastName ?? ''}'.trim();

  String get reportedName =>
      '${reportedFirstName ?? ''} ${reportedLastName ?? ''}'.trim();

  String get categoryLabel =>
      category.replaceAll('_', ' ');

  List<ComplaintMessage> messagesFor(String party) {
    return messages.where((m) {
      if (m.senderRole == party) return true;
      if (m.senderRole == 'admin') {
        final r = (m.recipientRole == null || m.recipientRole!.isEmpty)
            ? 'reporter'
            : m.recipientRole!;
        return r == party || r == 'both';
      }
      return false;
    }).toList();
  }

  factory ComplaintItem.fromJson(Map<String, dynamic> json) {
    final msgs = json['messages'] as List? ?? [];
    return ComplaintItem(
      id: json['id'].toString(),
      status: (json['status'] ?? 'pending').toString(),
      category: (json['category'] ?? '').toString(),
      createdAt: (json['created_at'] ?? '').toString(),
      reporterProfileId: json['reporter_profile_id']?.toString(),
      reportedProfileId: json['reported_profile_id']?.toString(),
      reporterFirstName: json['reporter_first_name'] as String?,
      reporterLastName: json['reporter_last_name'] as String?,
      reportedFirstName: json['reported_first_name'] as String?,
      reportedLastName: json['reported_last_name'] as String?,
      reporterCity: json['reporter_city'] as String?,
      reportedCity: json['reported_city'] as String?,
      reporterEmail: json['reporter_email'] as String?,
      reportedEmail: json['reported_email'] as String?,
      adminNotes: json['admin_notes'] as String?,
      messages: msgs
          .map((e) => ComplaintMessage.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class MyComplaintsData {
  MyComplaintsData({required this.filed, required this.support});

  final List<ComplaintItem> filed;
  final List<ComplaintItem> support;

  factory MyComplaintsData.fromJson(Map<String, dynamic> json) {
    List<ComplaintItem> parse(String key) => ((json[key] as List?) ?? [])
        .map((e) => ComplaintItem.fromJson(e as Map<String, dynamic>))
        .toList();
    return MyComplaintsData(
      filed: parse('filed'),
      support: parse('support'),
    );
  }
}
