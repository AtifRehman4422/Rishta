import '../../core/network/api_client.dart';
import '../models/user_model.dart';

class OtpStartResult {
  OtpStartResult({
    required this.email,
    required this.purpose,
    required this.resendAfterSeconds,
    this.message,
  });

  final String email;
  final String purpose;
  final int resendAfterSeconds;
  final String? message;
}

class AuthRepository {
  AuthRepository({ApiClient? client}) : _client = client ?? ApiClient.instance;

  final ApiClient _client;

  Future<AppUser> login({required String email, required String password}) async {
    final result = await _client.post('/auth/login', body: {
      'email': email,
      'password': password,
    });
    final data = result.data as Map<String, dynamic>;
    await _client.setToken(data['token'] as String?);
    return AppUser.fromLogin(data['user'] as Map<String, dynamic>);
  }

  /// Creates / updates unverified account and emails OTP. Does not log in.
  Future<OtpStartResult> register(Map<String, dynamic> payload) async {
    final result = await _client.post('/auth/register', body: payload);
    final data = (result.data as Map<String, dynamic>?) ?? {};
    return OtpStartResult(
      email: (data['email'] as String?) ?? (payload['email'] as String? ?? ''),
      purpose: (data['purpose'] as String?) ?? 'email_verify',
      resendAfterSeconds: (data['resend_after_seconds'] as num?)?.toInt() ?? 240,
      message: null,
    );
  }

  Future<AppUser> verifyRegisterOtp({required String email, required String code}) async {
    final result = await _client.post('/auth/verify-register-otp', body: {
      'email': email,
      'code': code,
    });
    final data = result.data as Map<String, dynamic>;
    await _client.setToken(data['token'] as String?);
    return AppUser.fromLogin(data['user'] as Map<String, dynamic>);
  }

  Future<OtpStartResult> resendOtp({
    required String email,
    required String purpose,
  }) async {
    final result = await _client.post('/auth/resend-otp', body: {
      'email': email,
      'purpose': purpose,
    });
    final data = (result.data as Map<String, dynamic>?) ?? {};
    return OtpStartResult(
      email: (data['email'] as String?) ?? email,
      purpose: (data['purpose'] as String?) ?? purpose,
      resendAfterSeconds: (data['resend_after_seconds'] as num?)?.toInt() ?? 240,
    );
  }

  Future<OtpStartResult> forgotPassword({required String email}) async {
    final result = await _client.post('/auth/forgot-password', body: {'email': email});
    final data = (result.data as Map<String, dynamic>?) ?? {};
    return OtpStartResult(
      email: (data['email'] as String?) ?? email,
      purpose: (data['purpose'] as String?) ?? 'password_reset',
      resendAfterSeconds: (data['resend_after_seconds'] as num?)?.toInt() ?? 240,
    );
  }

  Future<AppUser> resetPassword({
    required String email,
    required String code,
    required String newPassword,
  }) async {
    final result = await _client.post('/auth/reset-password', body: {
      'email': email,
      'code': code,
      'new_password': newPassword,
    });
    final data = result.data as Map<String, dynamic>;
    await _client.setToken(data['token'] as String?);
    return AppUser.fromLogin(data['user'] as Map<String, dynamic>);
  }

  Future<AppUser> getMe() async {
    final result = await _client.get('/auth/me');
    return AppUser.fromMe(result.data as Map<String, dynamic>);
  }

  Future<void> logout() async {
    await _client.setToken(null);
  }
}
