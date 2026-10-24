import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';

import 'ad_units.dart';

enum RewardedResult { earned, closed, notReady }

/// Loads AdMob. A rewarded video never hides banner or native ads.
class AdsController extends ChangeNotifier {
  AdsController._();

  static final instance = AdsController._();

  bool _sdkReady = false;
  RewardedAd? _rewarded;
  bool _loadingRewarded = false;
  bool _showingRewarded = false;

  bool get supportsAds {
    if (kIsWeb) return false;
    return defaultTargetPlatform == TargetPlatform.android ||
        defaultTargetPlatform == TargetPlatform.iOS;
  }

  bool get canShowAds => supportsAds && _sdkReady;

  bool get rewardedReady => _rewarded != null && !_showingRewarded;

  Future<void> init() async {
    if (!supportsAds) return;
    try {
      await MobileAds.instance.initialize();
      _sdkReady = true;
      unawaited(_preloadRewarded());
    } catch (_) {
      _sdkReady = false;
    }
    notifyListeners();
  }

  Future<RewardedResult> showRewarded() async {
    if (!canShowAds) return RewardedResult.notReady;
    final ad = _rewarded;
    if (ad == null || _showingRewarded) {
      unawaited(_preloadRewarded());
      return RewardedResult.notReady;
    }

    _showingRewarded = true;
    _rewarded = null;
    final completer = Completer<RewardedResult>();
    var earned = false;

    ad.fullScreenContentCallback = FullScreenContentCallback(
      onAdDismissedFullScreenContent: (ad) {
        ad.dispose();
        _showingRewarded = false;
        unawaited(_preloadRewarded());
        if (!completer.isCompleted) {
          completer.complete(earned ? RewardedResult.earned : RewardedResult.closed);
        }
      },
      onAdFailedToShowFullScreenContent: (ad, error) {
        ad.dispose();
        _showingRewarded = false;
        unawaited(_preloadRewarded());
        if (!completer.isCompleted) completer.complete(RewardedResult.notReady);
      },
    );

    try {
      await ad.show(
        onUserEarnedReward: (ad, reward) {
          earned = true;
        },
      );
    } catch (_) {
      ad.dispose();
      _showingRewarded = false;
      unawaited(_preloadRewarded());
      return RewardedResult.notReady;
    }

    return completer.future;
  }

  Future<void> _preloadRewarded() async {
    if (!supportsAds || !_sdkReady || _rewarded != null || _loadingRewarded) return;
    _loadingRewarded = true;
    await RewardedAd.load(
      adUnitId: AdUnits.rewarded,
      request: const AdRequest(),
      rewardedAdLoadCallback: RewardedAdLoadCallback(
        onAdLoaded: (ad) {
          _rewarded = ad;
          _loadingRewarded = false;
          notifyListeners();
        },
        onAdFailedToLoad: (error) {
          _loadingRewarded = false;
          notifyListeners();
        },
      ),
    );
  }
}
