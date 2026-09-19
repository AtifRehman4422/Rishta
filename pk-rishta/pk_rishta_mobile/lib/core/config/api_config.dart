import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

abstract final class ApiConfig {
  /// Override at build/run time:
  ///   flutter run --dart-define=API_BASE_URL=http://192.168.1.14:3000/api
  static const String _fromEnv = String.fromEnvironment('API_BASE_URL');

  /// PC Wi-Fi IPv4 (`ipconfig`). A real phone cannot use localhost or 10.0.2.2.
  /// Update this when the PC gets a new IP (Wi-Fi reconnect).
  static const String _lanHost = String.fromEnvironment(
    'DEV_LAN_HOST',
    defaultValue: '192.168.1.14',
  );

  static String _resolved = '';

  static String get baseUrl {
    if (_resolved.isNotEmpty) return _resolved;
    if (_fromEnv.isNotEmpty) return _fromEnv;
    return _defaultUrl;
  }

  /// Full server origin (no `/api` suffix) used to resolve media paths like
  /// `/uploads/profiles/xxx.jpg`.
  static String get origin {
    final url = baseUrl;
    final stripped = url.endsWith('/api') ? url.substring(0, url.length - 4) : url;
    return stripped.endsWith('/') ? stripped.substring(0, stripped.length - 1) : stripped;
  }

  /// Resolves a relative server path (e.g. `/uploads/...`) to an absolute URL.
  static String resolveUrl(String path) {
    final p = path.trim();
    if (p.isEmpty) return '';
    if (p.startsWith('http://') || p.startsWith('https://')) return p;
    if (p.startsWith('/')) return '$origin$p';
    return '$origin/$p';
  }

  static String get _lanUrl => 'http://$_lanHost:3000/api';

  static String get _defaultUrl {
    if (kReleaseMode) return 'https://humrishta.com/api';
    if (kIsWeb) return 'http://localhost:3000/api';
    try {
      if (Platform.isAndroid || Platform.isIOS) return _lanUrl;
    } catch (_) {}
    return 'http://localhost:3000/api';
  }

  static List<String> get _candidates {
    if (_fromEnv.isNotEmpty) return [_fromEnv];
    if (kIsWeb) return ['http://localhost:3000/api'];
    try {
      if (Platform.isAndroid) {
        return [
          _lanUrl,
          'http://10.0.2.2:3000/api',
          'http://127.0.0.1:3000/api',
        ];
      }
      if (Platform.isIOS) {
        return [_lanUrl, 'http://127.0.0.1:3000/api', 'http://localhost:3000/api'];
      }
    } catch (_) {}
    return [_lanUrl];
  }

  /// Picks a reachable backend (LAN IP, emulator alias, or USB adb reverse).
  static Future<void> init() async {
    if (_fromEnv.isNotEmpty) {
      _resolved = _fromEnv;
      return;
    }
    if (kReleaseMode) {
      _resolved = 'https://humrishta.com/api';
      return;
    }
    if (kIsWeb) {
      _resolved = 'http://localhost:3000/api';
      return;
    }

    for (final url in _candidates) {
      try {
        final res = await http
            .get(Uri.parse('$url/health'))
            .timeout(const Duration(seconds: 2));
        if (res.statusCode == 200) {
          _resolved = url;
          return;
        }
      } catch (_) {}
    }
    _resolved = _defaultUrl;
  }
}
