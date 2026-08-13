const bcrypt = require('bcryptjs');
const pool = require('../db');
const { generateToken } = require('../middleware/auth');
const { validatePassword } = require('../utils/password');
const { isProduction } = require('../middleware/security');
const { refreshProfileCompletion } = require('./profileController');
const {
  createAndSendOtp,
  verifyOtp,
  getLatestActiveOtp,
  secondsUntilResend,
  OTP_RESEND_SECONDS,
} = require('../utils/otp');

function splitFullName(fullName) {
  const cleaned = String(fullName || '').trim().replace(/\s+/g, ' ');
  if (!cleaned) return { first_name: '', last_name: '' };
  const parts = cleaned.split(' ');
  if (parts.length === 1) {
    return { first_name: parts[0], last_name: '-' };
  }
  return {
    first_name: parts[0],
    last_name: parts.slice(1).join(' '),
  };
}

function otpError(res, err) {
  const status = err.status || 500;
  return res.status(status).json({
    success: false,
    message: err.message || (isProduction ? 'Request failed' : String(err)),
    data: err.resend_after_seconds != null
      ? { resend_after_seconds: err.resend_after_seconds }
      : undefined,
  });
}

async function register(req, res) {
  try {
    const {
      email,
      password,
      phone,
      full_name,
      first_name: bodyFirst,
      last_name: bodyLast,
      gender,
      date_of_birth,
      city,
      province,
      country,
    } = req.body;

    const fromFull = full_name ? splitFullName(full_name) : null;
    const first_name = (fromFull?.first_name || bodyFirst || '').trim();
    const last_name = (fromFull?.last_name || bodyLast || '').trim();
    const phoneValue = (phone || '').trim();
    const cityValue = (city || '').trim();
    const provinceValue = (province || '').trim();
    const emailValue = String(email || '').toLowerCase().trim();

    if (!emailValue || !password || !first_name || !last_name || !gender || !date_of_birth) {
      return res.status(400).json({ success: false, message: 'Required fields missing' });
    }

    if (!phoneValue) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const isOverseas = provinceValue === 'Overseas';
    if (isOverseas && !country) {
      return res.status(400).json({ success: false, message: 'Country is required for overseas location' });
    }

    const profileCountry = isOverseas ? country : (country || 'Pakistan');

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError });
    }

    const existing = await pool.query(
      'SELECT id, is_verified, role FROM users WHERE email = $1',
      [emailValue]
    );

    if (existing.rows.length && existing.rows[0].is_verified) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 12);
    let user;

    if (existing.rows.length && !existing.rows[0].is_verified) {
      // Incomplete signup — refresh details and resend OTP
      const userId = existing.rows[0].id;
      await pool.query(
        `UPDATE users SET password_hash = $1, phone = $2, updated_at = NOW() WHERE id = $3`,
        [hash, phoneValue, userId]
      );
      await pool.query(
        `UPDATE profiles
         SET first_name = $1, last_name = $2, gender = $3, date_of_birth = $4,
             city = $5, province = $6, country = $7, updated_at = NOW()
         WHERE user_id = $8`,
        [
          first_name,
          last_name,
          gender,
          date_of_birth,
          cityValue || '',
          provinceValue || '',
          profileCountry,
          userId,
        ]
      );
      user = { id: userId, email: emailValue, role: existing.rows[0].role };
    } else {
      const userResult = await pool.query(
        `INSERT INTO users (email, password_hash, phone, is_verified)
         VALUES ($1, $2, $3, false)
         RETURNING id, email, role`,
        [emailValue, hash, phoneValue]
      );
      user = userResult.rows[0];
      await pool.query(
        `INSERT INTO profiles (user_id, first_name, last_name, gender, date_of_birth, city, province, country)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          user.id,
          first_name,
          last_name,
          gender,
          date_of_birth,
          cityValue || '',
          provinceValue || '',
          profileCountry,
        ]
      );
    }

    let otpMeta;
    try {
      otpMeta = await createAndSendOtp({
        email: emailValue,
        purpose: 'email_verify',
        userId: user.id,
      });
    } catch (err) {
      if (err.status === 429) {
        return res.status(201).json({
          success: true,
          message: 'Account created. Please verify the OTP sent to your email.',
          data: {
            requires_otp: true,
            email: emailValue,
            purpose: 'email_verify',
            resend_after_seconds: err.resend_after_seconds || OTP_RESEND_SECONDS,
          },
        });
      }
      return otpError(res, err);
    }

    res.status(201).json({
      success: true,
      message: 'OTP sent to your email. Please verify to complete registration.',
      data: {
        requires_otp: true,
        email: otpMeta.email,
        purpose: 'email_verify',
        resend_after_seconds: otpMeta.resend_after_seconds,
      },
    });
  } catch (err) {
    return otpError(res, err);
  }
}

async function verifyRegisterOtp(req, res) {
  try {
    const email = String(req.body.email || '').toLowerCase().trim();
    const code = req.body.code;

    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email and OTP code are required' });
    }

    await verifyOtp({ email, purpose: 'email_verify', code });

    const result = await pool.query(
      `UPDATE users
       SET is_verified = true, updated_at = NOW()
       WHERE email = $1
       RETURNING id, email, role, is_active`,
      [email]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = result.rows[0];
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    const token = generateToken(user);
    res.json({
      success: true,
      message: 'Email verified successfully',
      data: { token, user: { id: user.id, email: user.email, role: user.role } },
    });
  } catch (err) {
    return otpError(res, err);
  }
}

async function resendOtp(req, res) {
  try {
    const email = String(req.body.email || '').toLowerCase().trim();
    const purpose = String(req.body.purpose || '').trim();

    if (!email || !['email_verify', 'password_reset'].includes(purpose)) {
      return res.status(400).json({
        success: false,
        message: 'Valid email and purpose (email_verify | password_reset) are required',
      });
    }

    const userResult = await pool.query(
      'SELECT id, is_verified, is_active FROM users WHERE email = $1',
      [email]
    );

    if (!userResult.rows.length) {
      // Don't leak existence for password reset; for verify still require account
      if (purpose === 'password_reset') {
        return res.json({
          success: true,
          message: 'If an account exists, a new OTP has been sent.',
          data: { resend_after_seconds: OTP_RESEND_SECONDS },
        });
      }
      return res.status(404).json({ success: false, message: 'No account found for this email' });
    }

    const user = userResult.rows[0];
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    if (purpose === 'email_verify' && user.is_verified) {
      return res.status(400).json({ success: false, message: 'Email is already verified. Please login.' });
    }

    if (purpose === 'password_reset' && !user.is_verified) {
      return res.status(400).json({
        success: false,
        message: 'Please verify your email first using the registration OTP.',
      });
    }

    const otpMeta = await createAndSendOtp({
      email,
      purpose,
      userId: user.id,
    });

    res.json({
      success: true,
      message: 'OTP resent to your email',
      data: {
        email: otpMeta.email,
        purpose,
        resend_after_seconds: otpMeta.resend_after_seconds,
      },
    });
  } catch (err) {
    return otpError(res, err);
  }
}

async function forgotPassword(req, res) {
  try {
    const email = String(req.body.email || '').toLowerCase().trim();
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const result = await pool.query(
      'SELECT id, is_verified, is_active FROM users WHERE email = $1',
      [email]
    );

    // Always return a generic success to avoid account enumeration,
    // but only send mail when account is eligible.
    if (result.rows.length) {
      const user = result.rows[0];
      if (user.is_active && user.is_verified) {
        try {
          await createAndSendOtp({
            email,
            purpose: 'password_reset',
            userId: user.id,
          });
        } catch (err) {
          if (err.status === 429) {
            return res.json({
              success: true,
              message: 'If an account exists, an OTP has been sent to your email.',
              data: {
                requires_otp: true,
                email,
                purpose: 'password_reset',
                resend_after_seconds: err.resend_after_seconds || OTP_RESEND_SECONDS,
              },
            });
          }
          // Surface real mail failures (e.g. Gmail App Password required)
          return otpError(res, err);
        }
      }
    }

    res.json({
      success: true,
      message: 'If an account exists, an OTP has been sent to your email.',
      data: {
        requires_otp: true,
        email,
        purpose: 'password_reset',
        resend_after_seconds: OTP_RESEND_SECONDS,
      },
    });
  } catch (err) {
    return otpError(res, err);
  }
}

async function resetPassword(req, res) {
  try {
    const email = String(req.body.email || '').toLowerCase().trim();
    const code = req.body.code;
    const newPassword = req.body.new_password || req.body.password;

    if (!email || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP code, and new password are required',
      });
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError });
    }

    await verifyOtp({ email, purpose: 'password_reset', code });

    const hash = await bcrypt.hash(newPassword, 12);
    const result = await pool.query(
      `UPDATE users
       SET password_hash = $1, updated_at = NOW()
       WHERE email = $2 AND is_active = true
       RETURNING id, email, role`,
      [hash, email]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = result.rows[0];
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Password updated successfully',
      data: { token, user: { id: user.id, email: user.email, role: user.role } },
    });
  } catch (err) {
    return otpError(res, err);
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const result = await pool.query(
      'SELECT id, email, password_hash, role, is_active, is_verified FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (!result.rows.length) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = result.rows[0];
    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.is_verified && user.role !== 'admin') {
      let resendAfter = OTP_RESEND_SECONDS;
      const latest = await getLatestActiveOtp(user.email, 'email_verify');
      if (latest) {
        resendAfter = secondsUntilResend(latest) || 0;
      }
      if (!latest || resendAfter === 0) {
        try {
          const meta = await createAndSendOtp({
            email: user.email,
            purpose: 'email_verify',
            userId: user.id,
            force: !latest,
          });
          resendAfter = meta.resend_after_seconds;
        } catch (err) {
          if (err.status === 429) {
            resendAfter = err.resend_after_seconds || OTP_RESEND_SECONDS;
          }
        }
      }

      return res.status(403).json({
        success: false,
        message: 'Please verify your email with the OTP we sent.',
        code: 'EMAIL_NOT_VERIFIED',
        data: {
          requires_otp: true,
          email: user.email,
          purpose: 'email_verify',
          resend_after_seconds: resendAfter,
        },
      });
    }

    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
    const token = generateToken(user);

    res.json({
      success: true,
      data: { token, user: { id: user.id, email: user.email, role: user.role } },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: isProduction ? 'Login failed' : err.message,
    });
  }
}

async function getMe(req, res) {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.phone, u.role, u.is_verified, u.created_at,
              p.id as profile_id, p.first_name, p.last_name, p.gender, p.date_of_birth,
              p.city, p.province, p.country, p.is_profile_complete, p.is_verified as profile_verified,
              p.profile_photo
       FROM users u
       LEFT JOIN profiles p ON p.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (result.rows[0].profile_id) {
      const refreshed = await refreshProfileCompletion(result.rows[0].profile_id);
      result.rows[0].is_profile_complete = !!refreshed?.is_profile_complete;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: isProduction ? 'Request failed' : err.message,
    });
  }
}

module.exports = {
  register,
  verifyRegisterOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  login,
  getMe,
};
