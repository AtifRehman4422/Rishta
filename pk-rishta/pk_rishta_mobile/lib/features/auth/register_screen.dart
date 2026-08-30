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
import 'login_screen.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullName = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  final _otp = TextEditingController();

  String? _gender;
  DateTime? _dob;
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
    _fullName.dispose();
    _email.dispose();
    _phone.dispose();
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

  Future<void> _pickDob() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime(now.year - 25),
      firstDate: DateTime(now.year - 80),
      lastDate: DateTime(now.year - 18),
      helpText: 'Select date of birth',
    );
    if (picked != null) setState(() => _dob = picked);
  }

  Future<void> _submitRegister() async {
    setState(() => _error = null);
    if (!_formKey.currentState!.validate()) return;
    if (_gender == null) {
      setState(() => _error = 'Please select gender');
      return;
    }
    if (_dob == null) {
      setState(() => _error = 'Please select your date of birth');
      return;
    }

    final dob = '${_dob!.year.toString().padLeft(4, '0')}-'
        '${_dob!.month.toString().padLeft(2, '0')}-'
        '${_dob!.day.toString().padLeft(2, '0')}';

    setState(() => _submitting = true);
    try {
      final otp = await AuthController.instance.register({
        'email': _email.text.trim(),
        'password': _password.text,
        'phone': _phone.text.trim(),
        'full_name': _fullName.text.trim(),
        'gender': _gender,
        'date_of_birth': dob,
      });
      if (!mounted) return;
      setState(() {
        _otpStep = true;
        _info = 'OTP sent to ${otp.email}';
        _submitting = false;
      });
      _startResendCountdown(otp.resendAfterSeconds);
    } on ApiException catch (e) {
      setState(() {
        _error = e.message;
        _submitting = false;
      });
      if (e.data?['resend_after_seconds'] != null) {
        _startResendCountdown((e.data!['resend_after_seconds'] as num).toInt());
      }
    } catch (_) {
      setState(() {
        _error = 'Something went wrong. Please try again.';
        _submitting = false;
      });
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
      setState(() {
        _error = e.message;
        _submitting = false;
      });
    } catch (_) {
      setState(() {
        _error = 'Something went wrong. Please try again.';
        _submitting = false;
      });
    }
  }

  Future<void> _resendOtp() async {
    if (_resendSeconds > 0) return;
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      final otp = await AuthController.instance.resendOtp(
        email: _email.text.trim(),
        purpose: 'email_verify',
      );
      if (!mounted) return;
      setState(() {
        _info = 'OTP resent';
        _submitting = false;
      });
      _startResendCountdown(otp.resendAfterSeconds);
    } on ApiException catch (e) {
      setState(() {
        _error = e.message;
        _submitting = false;
      });
      final wait = e.data?['resend_after_seconds'];
      if (wait != null) _startResendCountdown((wait as num).toInt());
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthBackdrop(
      title: _otpStep ? 'Verify email' : 'Join PK Rishta',
      subtitle: _otpStep
          ? 'Enter the OTP sent to your email'
          : 'Create your free account & begin a halal match journey',
      headerTrailing: TextButton(
        onPressed: () {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute<void>(builder: (_) => const LoginScreen()),
          );
        },
        style: TextButton.styleFrom(
          foregroundColor: AppColors.goldLight,
          backgroundColor: Colors.white.withValues(alpha: 0.1),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          shape: const StadiumBorder(),
        ),
        child: const Text('Sign in', style: TextStyle(fontWeight: FontWeight.w700)),
      ),
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(24, 28, 24, 32),
        child: _otpStep ? _buildOtpForm() : _buildRegisterForm(),
      ),
    );
  }

  Widget _buildOtpForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (_info != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Text(_info!, style: const TextStyle(color: Color(0xFF047857))),
          ),
        if (_error != null) AuthErrorBanner(message: _error!),
        Text(
          'Code sent to ${_email.text.trim()}',
          style: const TextStyle(color: AppColors.textMuted),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _otp,
          keyboardType: TextInputType.number,
          maxLength: 6,
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800, letterSpacing: 10),
          decoration: AuthFieldDecoration.soft(label: 'OTP', hint: '••••••'),
        ),
        const SizedBox(height: 18),
        _submitting
            ? const Center(child: CircularProgressIndicator())
            : PrimaryButton(
                label: 'Verify & Continue',
                icon: Icons.verified_outlined,
                expanded: true,
                onPressed: _verifyOtp,
              ),
        const SizedBox(height: 14),
        TextButton(
          onPressed: _resendSeconds > 0 || _submitting ? null : _resendOtp,
          child: Text(
            _resendSeconds > 0 ? 'Resend in $_resendLabel' : 'Resend OTP',
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
        ),
        TextButton(
          onPressed: () => setState(() {
            _otpStep = false;
            _error = null;
          }),
          child: const Text('Edit details'),
        ),
      ],
    );
  }

  Widget _buildRegisterForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        FadeSlide(
          child: Text(
            'Create account',
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
            'A few details to get you started — OTP will be emailed on save',
            style: TextStyle(color: AppColors.textMuted, fontSize: 13.5),
          ),
        ),
        const SizedBox(height: 20),
        if (_error != null) AuthErrorBanner(message: _error!),
        FadeSlide(
          delay: 100.ms,
          child: Form(
            key: _formKey,
            child: Column(
              children: [
                TextFormField(
                  controller: _fullName,
                  textCapitalization: TextCapitalization.words,
                  decoration: AuthFieldDecoration.soft(
                    label: 'Full name *',
                    hint: 'Enter full name',
                    prefixIcon: const Icon(Icons.person_outline_rounded),
                  ),
                  validator: (value) => validateName(value, 'Full name'),
                ),
                const SizedBox(height: 14),
                DropdownButtonFormField<String>(
                  initialValue: _gender,
                  decoration: AuthFieldDecoration.soft(
                    label: 'Gender *',
                    prefixIcon: const Icon(Icons.wc_outlined),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'male', child: Text('Male')),
                    DropdownMenuItem(value: 'female', child: Text('Female')),
                  ],
                  onChanged: (value) => setState(() => _gender = value),
                  validator: (value) => value == null ? 'Required' : null,
                ),
                const SizedBox(height: 14),
                InkWell(
                  onTap: _pickDob,
                  borderRadius: BorderRadius.circular(18),
                  child: InputDecorator(
                    decoration: AuthFieldDecoration.soft(
                      label: 'Date of birth *',
                      prefixIcon: const Icon(Icons.calendar_today_outlined),
                    ),
                    child: Text(
                      _dob == null
                          ? 'Select date'
                          : '${_dob!.day}/${_dob!.month}/${_dob!.year}',
                      style: TextStyle(
                        color: _dob == null ? AppColors.textMuted : AppColors.text,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _email,
                  keyboardType: TextInputType.emailAddress,
                  decoration: AuthFieldDecoration.soft(
                    label: 'Email *',
                    prefixIcon: const Icon(Icons.mail_outline_rounded),
                  ),
                  validator: (value) => validateEmail(value),
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _phone,
                  keyboardType: TextInputType.phone,
                  decoration: AuthFieldDecoration.soft(
                    label: 'Phone *',
                    hint: '+92 300 1234567',
                    prefixIcon: const Icon(Icons.phone_outlined),
                  ),
                  validator: (value) => validatePhone(value, required: true),
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _password,
                  obscureText: _obscure,
                  decoration: AuthFieldDecoration.soft(
                    label: 'Password *',
                    helperText: 'At least 8 characters, letters & numbers',
                    prefixIcon: const Icon(Icons.lock_outline_rounded),
                    suffixIcon: IconButton(
                      onPressed: () => setState(() => _obscure = !_obscure),
                      icon: Icon(
                        _obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                      ),
                    ),
                  ),
                  validator: (value) => validatePassword(value),
                ),
                const SizedBox(height: 24),
                _submitting
                    ? const Center(child: CircularProgressIndicator())
                    : PrimaryButton(
                        label: 'Register Free',
                        icon: Icons.favorite_rounded,
                        style: PrimaryButtonStyle.gold,
                        expanded: true,
                        onPressed: _submitRegister,
                      ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 22),
        FadeSlide(
          delay: 180.ms,
          child: AuthSwitchLink(
            prompt: 'Already have an account? ',
            actionLabel: 'Sign in',
            onTap: () {
              Navigator.of(context).pushReplacement(
                MaterialPageRoute<void>(builder: (_) => const LoginScreen()),
              );
            },
          ),
        ),
      ],
    );
  }
}
