import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/network/api_client.dart';
import '../../core/state/auth_controller.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/validation.dart';
import '../../core/widgets/auth_backdrop.dart';
import '../../core/widgets/primary_button.dart';
import 'login_screen.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _email = TextEditingController();
  final _otp = TextEditingController();
  final _password = TextEditingController();

  bool _otpStep = false;
  bool _submitting = false;
  bool _obscure = true;
  String? _error;
  String? _info;
  int _resendSeconds = 0;
  Timer? _timer;

  @override
  void dispose() {
    _timer?.cancel();
    _email.dispose();
    _otp.dispose();
    _password.dispose();
    super.dispose();
  }

  void _startCountdown(int seconds) {
    _timer?.cancel();
    setState(() => _resendSeconds = seconds);
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) {
        t.cancel();
        return;
      }
      if (_resendSeconds <= 1) {
        t.cancel();
        setState(() => _resendSeconds = 0);
      } else {
        setState(() => _resendSeconds -= 1);
      }
    });
  }

  String get _resendLabel {
    final m = _resendSeconds ~/ 60;
    final s = (_resendSeconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  Future<void> _sendOtp() async {
    final emailError = validateEmail(_email.text);
    if (emailError != null) {
      setState(() => _error = emailError);
      return;
    }
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      final otp = await AuthController.instance.forgotPassword(email: _email.text.trim());
      if (!mounted) return;
      setState(() {
        _otpStep = true;
        _info = 'If an account exists, OTP was sent';
        _submitting = false;
      });
      _startCountdown(otp.resendAfterSeconds);
    } on ApiException catch (e) {
      setState(() {
        _error = e.message;
        _submitting = false;
      });
    }
  }

  Future<void> _resend() async {
    if (_resendSeconds > 0) return;
    setState(() => _submitting = true);
    try {
      final otp = await AuthController.instance.resendOtp(
        email: _email.text.trim(),
        purpose: 'password_reset',
      );
      if (!mounted) return;
      setState(() {
        _info = 'OTP resent';
        _submitting = false;
      });
      _startCountdown(otp.resendAfterSeconds);
    } on ApiException catch (e) {
      setState(() {
        _error = e.message;
        _submitting = false;
      });
      final wait = e.data?['resend_after_seconds'];
      if (wait != null) _startCountdown((wait as num).toInt());
    }
  }

  Future<void> _reset() async {
    if (_otp.text.trim().length < 4) {
      setState(() => _error = 'Enter the OTP from your email');
      return;
    }
    final passwordError = validatePassword(_password.text);
    if (passwordError != null) {
      setState(() => _error = passwordError);
      return;
    }
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await AuthController.instance.resetPassword(
        email: _email.text.trim(),
        code: _otp.text.trim(),
        newPassword: _password.text,
      );
      if (!mounted) return;
      Navigator.pop(context, true);
    } on ApiException catch (e) {
      setState(() {
        _error = e.message;
        _submitting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthBackdrop(
      title: 'Forgot password',
      subtitle: 'An OTP will be sent to your email',
      headerTrailing: TextButton(
        onPressed: () {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute<void>(builder: (_) => const LoginScreen()),
          );
        },
        style: TextButton.styleFrom(
          foregroundColor: AppColors.goldLight,
          backgroundColor: Colors.white.withValues(alpha: 0.1),
          shape: const StadiumBorder(),
        ),
        child: const Text('Sign in', style: TextStyle(fontWeight: FontWeight.w700)),
      ),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(24, 28, 24, 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_info != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Text(_info!, style: const TextStyle(color: Color(0xFF047857))),
              ),
            if (_error != null) AuthErrorBanner(message: _error!),
            if (!_otpStep) ...[
              TextField(
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                decoration: AuthFieldDecoration.soft(
                  label: 'Email',
                  prefixIcon: const Icon(Icons.mail_outline_rounded),
                ),
              ),
              const SizedBox(height: 20),
              _submitting
                  ? const Center(child: CircularProgressIndicator())
                  : PrimaryButton(
                      label: 'Send OTP',
                      icon: Icons.mark_email_unread_outlined,
                      expanded: true,
                      onPressed: _sendOtp,
                    ),
            ] else ...[
              Text(
                'OTP sent to ${_email.text.trim()}',
                style: const TextStyle(color: AppColors.textMuted),
              ),
              const SizedBox(height: 14),
              TextField(
                controller: _otp,
                keyboardType: TextInputType.number,
                maxLength: 6,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800, letterSpacing: 8),
                decoration: AuthFieldDecoration.soft(label: 'OTP'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _password,
                obscureText: _obscure,
                decoration: AuthFieldDecoration.soft(
                  label: 'New password',
                  suffixIcon: IconButton(
                    onPressed: () => setState(() => _obscure = !_obscure),
                    icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              _submitting
                  ? const Center(child: CircularProgressIndicator())
                  : PrimaryButton(
                      label: 'Reset Password',
                      icon: Icons.lock_reset_rounded,
                      style: PrimaryButtonStyle.gold,
                      expanded: true,
                      onPressed: _reset,
                    ),
              TextButton(
                onPressed: _resendSeconds > 0 || _submitting ? null : _resend,
                child: Text(
                  _resendSeconds > 0 ? 'Resend in $_resendLabel' : 'Resend OTP',
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
