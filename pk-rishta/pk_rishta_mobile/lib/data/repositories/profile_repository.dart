import '../../core/network/api_client.dart';
import '../models/contact_request_model.dart';
import '../models/my_profile_model.dart';
import '../models/profile_model.dart';

class SearchResult {
  SearchResult({required this.profiles, required this.total});

  final List<Profile> profiles;
  final int total;
}

class ProfileRepository {
  ProfileRepository({ApiClient? client}) : _client = client ?? ApiClient.instance;

  final ApiClient _client;

  Future<SearchResult> search({
    String? gender,
    String? city,
    String? province,
    String? country,
    String? maritalStatus,
    String? religion,
    String? education,
    String? minAge,
    String? maxAge,
    Map<String, dynamic>? query,
    int page = 1,
    int limit = 12,
  }) async {
    final result = await _client.get('/profiles/search', query: query ?? {
      'gender': gender,
      'city': city,
      'province': province,
      'country': country,
      'marital_status': maritalStatus,
      'religion': religion,
      'education': education,
      'min_age': minAge,
      'max_age': maxAge,
      'page': page,
      'limit': limit,
    });

    final list = (result.data as List)
        .map((e) => Profile.fromJson(e as Map<String, dynamic>))
        .toList();
    final total = (result.pagination?['total'] as int?) ?? list.length;
    return SearchResult(profiles: list, total: total);
  }

  Future<Profile> getById(String id) async {
    final result = await _client.get('/profiles/$id');
    return Profile.fromJson(result.data as Map<String, dynamic>);
  }

  Future<MyProfileData> getMyProfile() async {
    final result = await _client.get('/profiles/me');
    return MyProfileData.fromJson(result.data as Map<String, dynamic>);
  }

  Future<MyProfileData> updateMyProfile(Map<String, dynamic> body) async {
    final result = await _client.put('/profiles/me', body: body);
    return MyProfileData.fromJson(result.data as Map<String, dynamic>);
  }

  Future<List<String>> dropdownOptions(String field) async {
    final result = await _client.get('/dropdowns', query: {'field': field});
    final list = result.data as List? ?? [];
    return list
        .map((e) => (e as Map<String, dynamic>)['label']?.toString() ?? '')
        .where((e) => e.isNotEmpty)
        .toList();
  }

  Future<void> requestContact(String targetProfileId, {String? message}) async {
    await _client.post('/contact-requests', body: {
      'target_profile_id': targetProfileId,
      if (message != null && message.isNotEmpty) 'user_message': message,
    });
  }

  Future<List<ContactAccessRequest>> getMyContactRequests() async {
    final result = await _client.get('/contact-requests');
    final list = result.data as List? ?? [];
    return list
        .map((e) => ContactAccessRequest.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<IncomingContactRequests> getIncomingContactRequests() async {
    final result = await _client.get('/contact-requests/incoming');
    final list = result.data as List? ?? [];
    return IncomingContactRequests(
      items: list
          .map((e) => ContactAccessRequest.fromJson(e as Map<String, dynamic>))
          .toList(),
      locked: result.locked == true,
    );
  }

  Future<void> respondToContactRequest(
    String id,
    String action, {
    String? message,
  }) async {
    await _client.patch('/contact-requests/$id/respond', body: {
      'action': action,
      if (message != null && message.isNotEmpty) 'message': message,
    });
  }

  Future<MyComplaintsData> getMyComplaints() async {
    final result = await _client.get('/complaints');
    final data = result.data as Map<String, dynamic>? ?? {};
    return MyComplaintsData.fromJson(data);
  }

  Future<void> replyToComplaint(String id, String message) async {
    await _client.post('/complaints/$id/reply', body: {'message': message});
  }

  /// Legacy interest endpoints (kept for compatibility).
  Future<void> sendInterest(String receiverId, {String? message}) async {
    await _client.post('/profiles/interests', body: {
      'receiver_id': receiverId,
      if (message != null && message.isNotEmpty) 'message': message,
    });
  }

  Future<InterestLists> getMyInterests() async {
    final result = await _client.get('/profiles/interests');
    final data = result.data as Map<String, dynamic>;
    List<InterestItem> parse(String key) => ((data[key] as List?) ?? [])
        .map((e) => InterestItem.fromJson(e as Map<String, dynamic>))
        .toList();
    return InterestLists(sent: parse('sent'), received: parse('received'));
  }
}

class InterestLists {
  InterestLists({required this.sent, required this.received});

  final List<InterestItem> sent;
  final List<InterestItem> received;
}

class InterestItem {
  InterestItem({
    required this.name,
    required this.gender,
    this.age,
    this.city,
    this.status,
    this.message,
  });

  final String name;
  final String gender;
  final int? age;
  final String? city;
  final String? status;
  final String? message;

  factory InterestItem.fromJson(Map<String, dynamic> json) {
    final first = (json['first_name'] ?? '') as String;
    final last = (json['last_name'] ?? '') as String;
    int? toInt(dynamic v) =>
        v == null ? null : (v is int ? v : int.tryParse(v.toString()));
    return InterestItem(
      name: '$first $last'.trim(),
      gender: (json['gender'] ?? '') as String,
      age: toInt(json['age']),
      city: json['city'] as String?,
      status: json['status'] as String?,
      message: json['message'] as String?,
    );
  }
}
