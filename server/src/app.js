/*
 High-level Express app bootstrap with security and performance middleware.
*/
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const morgan = require('morgan');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const { ensureDirectory } = require('./utils/fsUtils');
const { getDbKind } = require('./db/auto');

const uploadRouter = require('./routes/upload');
const authRouter = require('./routes/auth');
const contactRouter = require('./routes/contact');

const app = express();

// Basic security headers
app.use(helmet());

// CORS
app.use(cors({ origin: true, credentials: true }));

// Logging in dev
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// JSON parsing with limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Sanitizers and protections
app.use(mongoSanitize());
app.use(hpp());

// Rate limit auth and form endpoints
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(['/api/auth', '/api/contact'], authLimiter);

// Gzip responses
app.use(compression());

// Ensure upload dir exists
const uploadDir = process.env.UPLOAD_DIR || path.resolve(__dirname, '../../uploads');
ensureDirectory(uploadDir);

// Serve static frontend
const publicDir = path.resolve(__dirname, '../public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir, { maxAge: '1h', etag: true }));
}

// Health
app.get('/health', (req, res) => res.json({ ok: true, dbKind: getDbKind() }));

// Routes
app.use('/upload', uploadRouter);
app.use('/api/auth', authRouter);
app.use('/api/contact', contactRouter);

// Fallback to index.html for root
app.get('/', (req, res) => {
  const indexPath = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
  res.status(200).send('ClassiCo Tech backend is running.');
});

// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Server error' });
});

const PORT = process.env.PORT || 8080;

async function start() {
  try {
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Server listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Startup failed', error);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = app;

