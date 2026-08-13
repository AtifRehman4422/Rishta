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
  });

  final String id;
  final String senderRole;
  final String message;
  final String createdAt;

  factory ComplaintMessage.fromJson(Map<String, dynamic> json) {
    return ComplaintMessage(
      id: json['id'].toString(),
      senderRole: (json['sender_role'] ?? '').toString(),
      message: (json['message'] ?? '').toString(),
      createdAt: (json['created_at'] ?? '').toString(),
    );
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
  final List<ComplaintMessage> messages;

  String get reporterName =>
      '${reporterFirstName ?? ''} ${reporterLastName ?? ''}'.trim();

  String get reportedName =>
      '${reportedFirstName ?? ''} ${reportedLastName ?? ''}'.trim();

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
      messages: msgs
          .map((e) => ComplaintMessage.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class MyComplaintsData {
  MyComplaintsData({required this.filed, required this.againstMe});

  final List<ComplaintItem> filed;
  final List<ComplaintItem> againstMe;

  factory MyComplaintsData.fromJson(Map<String, dynamic> json) {
    List<ComplaintItem> parse(String key) => ((json[key] as List?) ?? [])
        .map((e) => ComplaintItem.fromJson(e as Map<String, dynamic>))
        .toList();
    return MyComplaintsData(
      filed: parse('filed'),
      againstMe: parse('against_me'),
    );
  }
}
