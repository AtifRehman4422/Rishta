require('dotenv').config();

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const express = require('express');
const cors = require('cors');

const pool = require('./db');
const { setupSecurity, isProduction } = require('./middleware/security');
const { warnIfSmtpMisconfigured } = require('./utils/mailer');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profiles');
const contactRequestRoutes = require('./routes/contactRequests');
const complaintRoutes = require('./routes/complaints');
const contactRoutes = require('./routes/contact');
const visitRoutes = require('./routes/visits');
const favoriteRoutes = require('./routes/favorites');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';

function resolveFrontendDist() {
  const candidates = [
    process.env.FRONTEND_DIST,
    path.join(__dirname, 'public'),
    path.join(__dirname, 'frontend'),
    path.join(__dirname, '..', 'pk-rishta-frontend', 'dist', 'pk-rishta-frontend', 'browser'),
  ].filter(Boolean);

  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'index.html'))) {
      return dir;
    }
  }
  return null;
}

const FRONTEND_DIST = resolveFrontendDist();

if (isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  console.error('FATAL: Set JWT_SECRET to a random string of at least 32 characters in production.');
  process.exit(1);
}

setupSecurity(app);

function isAllowedOrigin(origin) {
  if (!origin) return true;

  const configured = (process.env.FRONTEND_URL || FRONTEND_URL)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (configured.includes(origin)) return true;

  // Dev: Angular / Flutter web on localhost, and phones on the LAN.
  if (!isProduction) {
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
      return true;
    }
    if (/^https?:\/\/(10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/i.test(origin)) {
      return true;
    }
  }

  return false;
}

app.use(cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600,
}));

app.use(express.json({ limit: '100kb' }));

app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/db-status', async (_req, res) => {
  if (isProduction) {
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'connected' });
  } catch {
    res.status(500).json({ status: 'error' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/contact-requests', contactRequestRoutes);
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/contact', contactRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/address-disclosures', require('./routes/addressDisclosures'));
app.use('/api/dropdowns', require('./routes/dropdowns'));
app.use('/api/admin', adminRoutes);

// Unknown API routes stay JSON 404.
app.use('/api', (_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Serve Angular build + SPA fallback so refresh on /search, /login, etc. works.
if (FRONTEND_DIST) {
  app.use(express.static(FRONTEND_DIST, { index: false, maxAge: isProduction ? '1h' : 0 }));

  // Middleware (not regex route) so Express 5 + Passenger always hit this for deep links.
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return next();
    }
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'), (err) => {
      if (err) next(err);
    });
  });
  console.log(`Serving frontend from: ${FRONTEND_DIST}`);
} else if (isProduction) {
  console.warn(
    'WARNING: No Angular build found. Upload frontend to backend/public (with index.html) ' +
      'or set FRONTEND_DIST. Until then, page refresh will return JSON 404.'
  );
}

app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'Route not found' });
  }
  res.status(404).json({
    success: false,
    message: FRONTEND_DIST
      ? 'Route not found'
      : 'Frontend not deployed. Upload Angular build to backend/public or set FRONTEND_DIST, and put .htaccess in the web root.',
  });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: isProduction ? 'Internal server error' : err.message,
  });
});

function startServer() {
  const sslKey = process.env.SSL_KEY_PATH;
  const sslCert = process.env.SSL_CERT_PATH;

  if (sslKey && sslCert) {
    const credentials = {
      key: fs.readFileSync(sslKey),
      cert: fs.readFileSync(sslCert),
    };
    https.createServer(credentials, app).listen(PORT, () => {
      console.log(`Hum Rishta Backend (HTTPS) running on port ${PORT}`);
      warnIfSmtpMisconfigured();
    });
    return;
  }

  http.createServer(app).listen(PORT, '0.0.0.0', () => {
    console.log(`Hum Rishta Backend running on port ${PORT}`);
    if (!isProduction) {
      console.log(`Primary frontend: ${FRONTEND_URL}`);
      console.log('Listening on 0.0.0.0 so physical phones can use this PC LAN IP:3000');
      console.log('Dev CORS: localhost + private LAN (Flutter web + Angular + real devices)');
      console.log('Tip: Use HTTPS in production so passwords and data are encrypted on the network.');
    }
    warnIfSmtpMisconfigured();
  });
}

startServer();
