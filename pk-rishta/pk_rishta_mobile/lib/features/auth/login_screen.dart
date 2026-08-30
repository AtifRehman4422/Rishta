import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../core/network/api_client.dart';
import '../../core/state/auth_controller.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/validation.dart';
import '../../core/widgets/auth_backdrop.dart';
import '../../core/widgets/fade_slide.dart';
import '../../core/widgets/primary_button.dart';
import 'forgot_password_screen.dart';
import 'register_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _otp = TextEditingController();
  bool _submitting = false;
  bool _obscure = true;
  bool _otpStep = false;
  String? _error;
  String? _info;
  int _resendSeconds = 0;
  Timer? _resendTimer;

  @override
  void dispose() {
    _resendTimer?.cancel();
    _email.dispose();
    _password.dispose();
    _otp.dispose();
    super.dispose();
  }

  void _startResendCountdown(int seconds) {
    _resendTimer?.cancel();
    setState(() => _resendSeconds = seconds);
    _resendTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      if (_resendSeconds <= 1) {
        timer.cancel();
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

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _submitting = true;
      _error = null;
      _info = null;
    });
    try {
      await AuthController.instance.login(
        email: _email.text.trim(),
        password: _password.text,
      );
      if (!mounted) return;
      Navigator.pop(context, true);
    } on ApiException catch (e) {
      if (e.requiresOtp) {
        setState(() {
          _otpStep = true;
          _info = e.message;
          _error = null;
        });
        final wait = e.data?['resend_after_seconds'];
        _startResendCountdown(wait != null ? (wait as num).toInt() : 240);
      } else {
        setState(() => _error = e.message);
      }
    } catch (_) {
      setState(() => _error = 'Something went wrong. Please try again.');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _verifyOtp() async {
    if (_otp.text.trim().length < 4) {
      setState(() => _error = 'Enter the OTP from your email');
      return;
    }
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await AuthController.instance.verifyRegisterOtp(
        email: _email.text.trim(),
        code: _otp.text.trim(),
      );
      if (!mounted) return;
      Navigator.pop(context, true);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<void> _resendOtp() async {
    if (_resendSeconds > 0) return;
    setState(() => _submitting = true);
    try {
      final otp = await AuthController.instance.resendOtp(
        email: _email.text.trim(),
        purpose: 'email_verify',
      );
      if (!mounted) return;
      setState(() => _info = 'OTP resent');
      _startResendCountdown(otp.resendAfterSeconds);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
      final wait = e.data?['resend_after_seconds'];
      if (wait != null) _startResendCountdown((wait as num).toInt());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthBackdrop(
      title: 'Welcome back',
      subtitle: 'Sign in to continue your journey',
      headerTrailing: TextButton(
        onPressed: () {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute<void>(builder: (_) => const RegisterScreen()),
          );
        },
        style: TextButton.styleFrom(
          foregroundColor: AppColors.goldLight,
          backgroundColor: Colors.white.withValues(alpha: 0.1),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          shape: const StadiumBorder(),
        ),
        child: const Text('Register', style: TextStyle(fontWeight: FontWeight.w700)),
      ),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(24, 28, 24, 28),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            FadeSlide(
              child: Text(
                'Sign in',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w700,
                      color: AppColors.text,
                    ),
              ),
            ),
            const SizedBox(height: 6),
            const FadeSlide(
              delay: Duration(milliseconds: 60),
              child: Text(
                'Enter your details below',
                style: TextStyle(color: AppColors.textMuted, fontSize: 13.5),
              ),
            ),
            const SizedBox(height: 22),
            if (_info != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Text(_info!, style: const TextStyle(color: Color(0xFF047857))),
              ),
            if (_error != null) AuthErrorBanner(message: _error!),
            if (_otpStep)
              FadeSlide(
                child: Column(
                  children: [
                    Text(
                      'Verify ${_email.text.trim()}',
                      style: const TextStyle(color: AppColors.textMuted),
                    ),
                    const SizedBox(height: 14),
                    TextField(
                      controller: _otp,
                      keyboardType: TextInputType.number,
                      maxLength: 6,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 10,
                      ),
                      decoration: AuthFieldDecoration.soft(label: 'OTP'),
                    ),
                    const SizedBox(height: 16),
                    _submitting
                        ? const CircularProgressIndicator()
                        : PrimaryButton(
                            label: 'Verify & Login',
                            icon: Icons.verified_outlined,
                            expanded: true,
                            onPressed: _verifyOtp,
                          ),
                    TextButton(
                      onPressed: _resendSeconds > 0 || _submitting ? null : _resendOtp,
                      child: Text(
                        _resendSeconds > 0 ? 'Resend in $_resendLabel' : 'Resend OTP',
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ),
                    TextButton(
                      onPressed: () => setState(() => _otpStep = false),
                      child: const Text('Back'),
                    ),
                  ],
                ),
              )
            else
            FadeSlide(
              delay: 100.ms,
              child: Form(
                key: _formKey,
                child: Column(
                  children: [
                    TextFormField(
                      controller: _email,
                      keyboardType: TextInputType.emailAddress,
                      textInputAction: TextInputAction.next,
                      decoration: AuthFieldDecoration.soft(
                        label: 'Email',
                        prefixIcon: const Icon(Icons.mail_outline_rounded),
                      ),
                      validator: (value) => validateEmail(value),
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _password,
                      obscureText: _obscure,
                      decoration: AuthFieldDecoration.soft(
                        label: 'Password',
                        prefixIcon: const Icon(Icons.lock_outline_rounded),
                        suffixIcon: IconButton(
                          onPressed: () => setState(() => _obscure = !_obscure),
                          icon: Icon(
                            _obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                          ),
                        ),
                      ),
                      validator: (value) =>
                          value == null || value.isEmpty ? 'Enter your password' : null,
                    ),
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: () {
                          Navigator.of(context).push(
                            MaterialPageRoute<void>(
                              builder: (_) => const ForgotPasswordScreen(),
                            ),
                          );
                        },
                        child: const Text(
                          'Forgot password?',
                          style: TextStyle(fontWeight: FontWeight.w700),
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    _submitting
                        ? const Padding(
                            padding: EdgeInsets.symmetric(vertical: 12),
                            child: Center(child: CircularProgressIndicator()),
                          )
                        : PrimaryButton(
                            label: 'Sign In',
                            icon: Icons.arrow_forward_rounded,
                            expanded: true,
                            onPressed: _submit,
                          ),
                  ],
                ),
              ),
            ),
            if (!_otpStep) ...[
            const SizedBox(height: 22),
            FadeSlide(
              delay: 180.ms,
              child: AuthSwitchLink(
                prompt: "Don't have an account? ",
                actionLabel: 'Register free',
                onTap: () {
                  Navigator.of(context).pushReplacement(
                    MaterialPageRoute<void>(builder: (_) => const RegisterScreen()),
                  );
                },
              ),
            ),
            ],
          ],
        ),
      ),
    );
  }
}
