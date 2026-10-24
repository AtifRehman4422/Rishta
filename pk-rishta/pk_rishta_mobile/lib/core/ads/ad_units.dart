import 'package:flutter/foundation.dart';

/// AdMob ids for Hum Rishta.
///
/// Debug builds use Google's test units so local testing does not count as
/// invalid traffic. Release builds use the live Android units.
abstract final class AdUnits {
  static const androidAppId = 'ca-app-pub-7706538461271047~7343560472';

  static const _banner = 'ca-app-pub-7706538461271047/4839899642';
  static const _native = 'ca-app-pub-7706538461271047/3518904100';
  static const _rewarded = 'ca-app-pub-7706538461271047/9239054517';

  static const _testBannerAndroid = 'ca-app-pub-3940256099942544/6300978111';
  static const _testNativeAndroid = 'ca-app-pub-3940256099942544/2247696110';
  static const _testRewardedAndroid = 'ca-app-pub-3940256099942544/5224354917';

  static const _testBannerIos = 'ca-app-pub-3940256099942544/2934735716';
  static const _testNativeIos = 'ca-app-pub-3940256099942544/3986624511';
  static const _testRewardedIos = 'ca-app-pub-3940256099942544/1712485313';

  static bool get _ios => defaultTargetPlatform == TargetPlatform.iOS;

  static String get banner {
    if (!kDebugMode) return _banner;
    return _ios ? _testBannerIos : _testBannerAndroid;
  }

  static String get native {
    if (!kDebugMode) return _native;
    return _ios ? _testNativeIos : _testNativeAndroid;
  }

  static String get rewarded {
    if (!kDebugMode) return _rewarded;
    return _ios ? _testRewardedIos : _testRewardedAndroid;
  }
}
