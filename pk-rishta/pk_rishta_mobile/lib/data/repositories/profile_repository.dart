import '../../core/network/api_client.dart';
import '../models/contact_request_model.dart';
import '../models/my_profile_model.dart';
import '../models/profile_model.dart';

class SearchResult {
  SearchResult({
    required this.profiles,
    required this.total,
    this.page = 1,
    this.limit = 12,
    this.totalPages = 1,
  });

  final List<Profile> profiles;
  final int total;
  final int page;
  final int limit;
  final int totalPages;
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
      'country': (country == null || country.toLowerCase() == 'pakistan') ? null : country,
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
    final pagination = result.pagination ?? const <String, dynamic>{};
    return SearchResult(
      profiles: list,
      total: (pagination['total'] as int?) ?? list.length,
      page: (pagination['page'] as int?) ?? page,
      limit: (pagination['limit'] as int?) ?? limit,
      totalPages: (pagination['totalPages'] as int?) ?? 1,
    );
  }

  Future<SearchResult> getMatches({
    int page = 1,
    int limit = 20,
  }) async {
    final result = await _client.get('/profiles/matches', query: {
      'page': page,
      'limit': limit,
    });

    final list = (result.data as List)
        .map((e) => Profile.fromJson(e as Map<String, dynamic>))
        .toList();
    final pagination = result.pagination ?? const <String, dynamic>{};
    return SearchResult(
      profiles: list,
      total: (pagination['total'] as int?) ?? list.length,
      page: (pagination['page'] as int?) ?? page,
      limit: (pagination['limit'] as int?) ?? limit,
      totalPages: (pagination['totalPages'] as int?) ?? 1,
    );
  }

  Future<Profile> getById(String id) async {
    final result = await _client.get('/profiles/$id');
    return Profile.fromJson(result.data as Map<String, dynamic>);
  }

  Future<List<Profile>> getFavorites() async {
    final result = await _client.get('/favorites', query: {'limit': '50'});
    final list = result.data as List? ?? [];
    return list
        .map((e) => Profile.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> addFavorite(String profileId) async {
    await _client.post('/favorites/$profileId');
  }

  Future<void> removeFavorite(String profileId) async {
    await _client.delete('/favorites/$profileId');
  }

  Future<MyProfileData> getMyProfile() async {
    final result = await _client.get('/profiles/me');
    return MyProfileData.fromJson(result.data as Map<String, dynamic>);
  }

  Future<MyProfileData> updateMyProfile(Map<String, dynamic> body) async {
    final result = await _client.put('/profiles/me', body: body);
    return MyProfileData.fromJson(result.data as Map<String, dynamic>);
  }

  /// Uploads a profile photo (multipart `photo` field). Returns the new
  /// `profile_photo` path (e.g. `/uploads/profiles/xxx.jpg`).
  Future<String> uploadProfilePhoto({
    required String filename,
    required List<int> bytes,
    required String contentType,
  }) async {
    final result = await _client.upload(
      '/profiles/me/photo',
      field: 'photo',
      filename: filename,
      bytes: bytes,
      contentType: contentType,
    );
    final data = result.data as Map<String, dynamic>?;
    return (data?['profile_photo'] ?? '').toString();
  }

  Future<List<String>> dropdownOptions(String field) async {
    final result = await _client.get('/dropdowns', query: {'field': field});
    final list = result.data as List? ?? [];
    return list
        .map((e) => (e as Map<String, dynamic>)['label']?.toString() ?? '')
        .where((e) => e.isNotEmpty)
        .toList();
  }

  Future<void> requestDropdownOption({
    required String requestedLabel,
    required String name,
    required String email,
    String fieldKey = '',
    String fieldLabel = '',
    String category = '',
  }) async {
    await _client.post('/dropdowns/requests', body: {
      if (fieldKey.isNotEmpty) 'field_key': fieldKey,
      if (fieldLabel.isNotEmpty) 'field_label': fieldLabel,
      if (category.isNotEmpty) 'category': category,
      'requested_label': requestedLabel,
      'name': name,
      'email': email,
    });
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

  Future<void> cancelContactRequest(String id) async {
    await _client.patch('/contact-requests/$id/cancel', body: {});
  }

  Future<MyComplaintsData> getMyComplaints() async {
    final result = await _client.get('/complaints');
    final data = result.data as Map<String, dynamic>? ?? {};
    return MyComplaintsData.fromJson(data);
  }

  Future<void> submitComplaint(
    String reportedProfileId,
    String category,
    String description,
  ) async {
    await _client.post('/complaints', body: {
      'reported_profile_id': reportedProfileId,
      'category': category,
      'description': description,
    });
  }

  Future<void> replyToComplaint(String id, String message) async {
    await _client.post('/complaints/$id/reply', body: {'message': message});
  }
}
