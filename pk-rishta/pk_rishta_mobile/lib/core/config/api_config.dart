import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';

abstract final class ApiConfig {
  static String get baseUrl {
    if (kIsWeb) return 'http://localhost:3000/api';
    try {
      if (Platform.isAndroid) return 'http://10.0.2.2:3000/api';
    } catch (_) {
      // Platform not available; fall through to localhost.
    }
    return 'http://localhost:3000/api';
  }
}
