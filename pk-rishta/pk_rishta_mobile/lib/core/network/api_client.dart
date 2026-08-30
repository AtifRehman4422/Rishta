import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../config/api_config.dart';

class ApiException implements Exception {
  ApiException(
    this.message, {
    this.statusCode,
    this.code,
    this.data,
  });

  final String message;
  final int? statusCode;
  final String? code;
  final Map<String, dynamic>? data;

  bool get requiresOtp =>
      code == 'EMAIL_NOT_VERIFIED' || data?['requires_otp'] == true;

  @override
  String toString() => message;
}

class ApiResult {
  ApiResult({
    required this.data,
    this.pagination,
    this.message,
    this.locked,
  });

  final dynamic data;
  final Map<String, dynamic>? pagination;
  final String? message;
  final bool? locked;
}

class ApiClient {
  ApiClient._();
  static final ApiClient instance = ApiClient._();

  static const _tokenKey = 'pk_rishta_token';
  String? _token;

  Future<void> loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString(_tokenKey);
  }

  String? get token => _token;
  bool get hasToken => _token != null && _token!.isNotEmpty;

  Future<void> setToken(String? value) async {
    _token = value;
    final prefs = await SharedPreferences.getInstance();
    if (value == null || value.isEmpty) {
      await prefs.remove(_tokenKey);
    } else {
      await prefs.setString(_tokenKey, value);
    }
  }

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (hasToken) 'Authorization': 'Bearer $_token',
      };

  Uri _uri(String path, [Map<String, dynamic>? query]) {
    final clean = <String, String>{};
    query?.forEach((key, value) {
      if (value != null && value.toString().isNotEmpty) {
        clean[key] = value.toString();
      }
    });
    return Uri.parse('${ApiConfig.baseUrl}$path').replace(
      queryParameters: clean.isEmpty ? null : clean,
    );
  }

  Future<ApiResult> get(String path, {Map<String, dynamic>? query}) async {
    return _send(() => http.get(_uri(path, query), headers: _headers));
  }

  Future<ApiResult> post(String path, {Map<String, dynamic>? body}) async {
    return _send(
      () => http.post(_uri(path), headers: _headers, body: jsonEncode(body ?? {})),
    );
  }

  Future<ApiResult> put(String path, {Map<String, dynamic>? body}) async {
    return _send(
      () => http.put(_uri(path), headers: _headers, body: jsonEncode(body ?? {})),
    );
  }

  Future<ApiResult> patch(String path, {Map<String, dynamic>? body}) async {
    return _send(
      () => http.patch(
        _uri(path),
        headers: _headers,
        body: jsonEncode(body ?? {}),
      ),
    );
  }

  Future<ApiResult> delete(String path) async {
    return _send(() => http.delete(_uri(path), headers: _headers));
  }

  /// Multipart/form-data upload (e.g. profile photo via `POST /profiles/me/photo`).
  Future<ApiResult> upload(
    String path, {
    required String field,
    required String filename,
    required List<int> bytes,
    String contentType = 'application/octet-stream',
  }) async {
    final request = http.MultipartRequest('POST', _uri(path))
      ..headers.addAll({
        if (hasToken) 'Authorization': 'Bearer $_token',
      })
      ..files.add(http.MultipartFile.fromBytes(
        field,
        bytes,
        filename: filename,
        contentType: _parseMediaType(contentType),
      ));
    return _sendUpload(request);
  }

  static http.MediaType _parseMediaType(String value) {
    final parts = value.split('/');
    if (parts.length == 2 && parts[0].isNotEmpty && parts[1].isNotEmpty) {
      return http.MediaType(parts[0].trim(), parts[1].trim());
    }
    return http.MediaType('application', 'octet-stream');
  }

  Future<ApiResult> _sendUpload(http.MultipartRequest request) async {
    final streamed = await request.send().timeout(const Duration(seconds: 30));
    final res = await http.Response.fromStream(streamed);
    return _parseResponse(res);
  }

  Future<ApiResult> _send(Future<http.Response> Function() request) async {
    if (!hasToken) {
      await loadToken();
    }
    late final http.Response res;
    try {
      res = await request().timeout(const Duration(seconds: 20));
    } catch (e) {
      if (kReleaseMode) {
        throw ApiException('Cannot reach server. Please check your connection and try again.');
      }
      if (kIsWeb) {
        throw ApiException(
          'Cannot reach API (${ApiConfig.baseUrl}). '
          'Start backend (port 3000) and restart it after CORS update, then hard-refresh this page.',
        );
      }
      throw ApiException(
        'Cannot reach server (${ApiConfig.baseUrl}). '
        'Use the same Wi-Fi as this PC, keep the backend on port 3000, '
        'and update DEV_LAN_HOST if your PC IP changed.',
      );
    }
    return _parseResponse(res);
  }

  ApiResult _parseResponse(http.Response res) {
    Map<String, dynamic> json;
    try {
      json = jsonDecode(res.body) as Map<String, dynamic>;
    } catch (_) {
      throw ApiException('Unexpected server response', statusCode: res.statusCode);
    }

    final success = json['success'] == true;
    if (!success || res.statusCode >= 400) {
      throw ApiException(
        (json['message'] as String?) ?? 'Request failed',
        statusCode: res.statusCode,
        code: json['code'] as String?,
        data: json['data'] is Map<String, dynamic>
            ? json['data'] as Map<String, dynamic>
            : null,
      );
    }

    return ApiResult(
      data: json['data'],
      pagination: json['pagination'] as Map<String, dynamic>?,
      message: json['message'] as String?,
      locked: json['locked'] as bool?,
    );
  }
}
