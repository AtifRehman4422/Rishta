require('dotenv').config();

const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');
const cors = require('cors');

const pool = require('./db');
const { setupSecurity, isProduction } = require('./middleware/security');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profiles');
const contactRequestRoutes = require('./routes/contactRequests');
const complaintRoutes = require('./routes/complaints');
const contactRoutes = require('./routes/contact');
const visitRoutes = require('./routes/visits');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';

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

  // Dev: Angular (4200) + Flutter web (any localhost port, e.g. Chrome mobile view)
  if (!isProduction) {
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) {
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
app.use('/api/dropdowns', require('./routes/dropdowns'));
app.use('/api/admin', adminRoutes);

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
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
      console.log(`PK Rishta Backend (HTTPS) running on port ${PORT}`);
    });
    return;
  }

  http.createServer(app).listen(PORT, () => {
    console.log(`PK Rishta Backend running on port ${PORT}`);
    if (!isProduction) {
      console.log(`Primary frontend: ${FRONTEND_URL}`);
      console.log('Dev CORS: also allowing localhost / 127.0.0.1 (Flutter web + Angular)');
      console.log('Tip: Use HTTPS in production so passwords and data are encrypted on the network.');
    }
  });
}

startServer();
