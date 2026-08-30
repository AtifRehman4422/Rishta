import '../../core/network/api_client.dart';
import '../models/contact_request_model.dart';

class AdminRepository {
  AdminRepository({ApiClient? client}) : _client = client ?? ApiClient.instance;

  final ApiClient _client;

  Future<List<ComplaintItem>> getComplaints({
    String status = 'pending',
    String search = '',
    int page = 1,
  }) async {
    final result = await _client.get('/admin/complaints', query: {
      'status': status.isEmpty ? 'all' : status,
      'search': search,
      'page': page,
      'limit': 50,
    });
    final list = result.data as List? ?? [];
    return list
        .map((e) => ComplaintItem.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<String> sendComplaintMessage({
    required String id,
    required String message,
    required String recipient,
  }) async {
    final result = await _client.post(
      '/admin/complaints/$id/message',
      body: {
        'message': message,
        'recipient': recipient,
      },
    );
    return result.message ?? 'Message sent';
  }

  Future<String> reviewComplaint({
    required String id,
    required String status,
    String? adminNotes,
  }) async {
    final result = await _client.patch(
      '/admin/complaints/$id',
      body: {
        'status': status,
        if (adminNotes != null && adminNotes.trim().isNotEmpty)
          'admin_notes': adminNotes.trim(),
      },
    );
    return result.message ?? 'Complaint updated';
  }

  Future<String> setRequestLimit({
    required String profileId,
    required int limit,
  }) async {
    final result = await _client.patch(
      '/admin/profiles/$profileId/request-limit',
      body: {'limit': limit},
    );
    return result.message ?? 'Request slots updated';
  }
}
