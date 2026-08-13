import 'package:flutter/foundation.dart';

import '../network/api_client.dart';
import '../../data/models/user_model.dart';
import '../../data/repositories/auth_repository.dart';

class AuthController extends ChangeNotifier {
  AuthController._();
  static final AuthController instance = AuthController._();

  final AuthRepository _repo = AuthRepository();

  AppUser? _user;
  bool _loading = false;

  AppUser? get user => _user;
  bool get isLoggedIn => _user != null;
  bool get isAdmin => _user?.isAdmin ?? false;
  bool get isLoading => _loading;

  bool get canViewProfiles =>
      isAdmin || (isLoggedIn && (_user?.isProfileComplete ?? false));

  bool get needsProfileCompletion =>
      isLoggedIn && !isAdmin && !(_user?.isProfileComplete ?? false);

  Future<void> bootstrap() async {
    await ApiClient.instance.loadToken();
    if (ApiClient.instance.hasToken) {
      await _refreshMe();
    }
  }

  Future<void> refreshMe() => _refreshMe();

  Future<void> _refreshMe() async {
    try {
      _user = await _repo.getMe();
      notifyListeners();
    } catch (_) {
      await _repo.logout();
      _user = null;
      notifyListeners();
    }
  }

  Future<void> login({required String email, required String password}) async {
    _setLoading(true);
    try {
      await _repo.login(email: email, password: password);
      await _refreshMe();
    } finally {
      _setLoading(false);
    }
  }

  Future<OtpStartResult> register(Map<String, dynamic> payload) async {
    _setLoading(true);
    try {
      return await _repo.register(payload);
    } finally {
      _setLoading(false);
    }
  }

  Future<void> verifyRegisterOtp({required String email, required String code}) async {
    _setLoading(true);
    try {
      await _repo.verifyRegisterOtp(email: email, code: code);
      await _refreshMe();
    } finally {
      _setLoading(false);
    }
  }

  Future<OtpStartResult> resendOtp({
    required String email,
    required String purpose,
  }) {
    return _repo.resendOtp(email: email, purpose: purpose);
  }

  Future<OtpStartResult> forgotPassword({required String email}) {
    return _repo.forgotPassword(email: email);
  }

  Future<void> resetPassword({
    required String email,
    required String code,
    required String newPassword,
  }) async {
    _setLoading(true);
    try {
      await _repo.resetPassword(email: email, code: code, newPassword: newPassword);
      await _refreshMe();
    } finally {
      _setLoading(false);
    }
  }

  Future<void> logout() async {
    await _repo.logout();
    _user = null;
    notifyListeners();
  }

  void _setLoading(bool value) {
    _loading = value;
    notifyListeners();
  }
}
