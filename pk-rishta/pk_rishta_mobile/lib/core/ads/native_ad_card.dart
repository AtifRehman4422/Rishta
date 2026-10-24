import 'package:flutter/material.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';

import '../theme/app_colors.dart';
import 'ad_units.dart';
import 'ads_controller.dart';

/// Inline native ad styled like the rest of the app. Renders nothing until it loads.
class NativeAdCard extends StatefulWidget {
  const NativeAdCard({super.key, required this.slot});

  final int slot;

  @override
  State<NativeAdCard> createState() => _NativeAdCardState();
}

class _NativeAdCardState extends State<NativeAdCard> {
  static const _height = 350.0;

  NativeAd? _nativeAd;
  bool _loaded = false;
  bool _loading = false;
  bool _failed = false;
  bool _disposed = false;

  @override
  void initState() {
    super.initState();
    AdsController.instance.addListener(_onController);
    _load();
  }

  void _onController() {
    if (!mounted || _disposed) return;
    final ads = AdsController.instance;
    if (!ads.canShowAds) {
      _failed = false;
      _release();
      setState(() => _loaded = false);
      return;
    }
    if (_nativeAd == null && !_loading && !_failed) _load();
  }

  Future<void> _load() async {
    if (_loading || _nativeAd != null || _failed || _disposed) return;
    if (!AdsController.instance.canShowAds) return;
    _loading = true;
    final ad = NativeAd(
      adUnitId: AdUnits.native,
      request: const AdRequest(),
      nativeTemplateStyle: NativeTemplateStyle(
        templateType: TemplateType.medium,
        mainBackgroundColor: Colors.white,
        cornerRadius: 16,
        callToActionTextStyle: NativeTemplateTextStyle(
          textColor: Colors.white,
          backgroundColor: AppColors.primary,
          style: NativeTemplateFontStyle.bold,
          size: 14,
        ),
        primaryTextStyle: NativeTemplateTextStyle(
          textColor: AppColors.text,
          style: NativeTemplateFontStyle.bold,
          size: 16,
        ),
        secondaryTextStyle: NativeTemplateTextStyle(
          textColor: AppColors.textMuted,
          style: NativeTemplateFontStyle.normal,
          size: 13,
        ),
        tertiaryTextStyle: NativeTemplateTextStyle(
          textColor: AppColors.textMuted,
          style: NativeTemplateFontStyle.normal,
          size: 12,
        ),
      ),
      listener: NativeAdListener(
        onAdLoaded: (ad) {
          if (_disposed || !mounted || !AdsController.instance.canShowAds) {
            if (!_disposed) ad.dispose();
            _loading = false;
            return;
          }
          setState(() {
            _loaded = true;
            _loading = false;
          });
        },
        onAdFailedToLoad: (ad, error) {
          if (!_disposed) ad.dispose();
          _nativeAd = null;
          _loading = false;
          _failed = true;
          if (mounted && !_disposed) setState(() => _loaded = false);
        },
      ),
    );
    _nativeAd = ad;
    await ad.load();
  }

  void _release() {
    _nativeAd?.dispose();
    _nativeAd = null;
    _loaded = false;
    _loading = false;
  }

  @override
  void dispose() {
    _disposed = true;
    AdsController.instance.removeListener(_onController);
    _release();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final ad = _nativeAd;
    if (!_loaded || ad == null) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(left: 4, bottom: 6),
            child: Text(
              'Ad',
              style: TextStyle(
                color: AppColors.textMuted,
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.4,
              ),
            ),
          ),
          DecoratedBox(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.border),
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(24),
              child: SizedBox(
                height: _height,
                width: double.infinity,
                child: AdWidget(ad: ad),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
