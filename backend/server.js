const express       = require('express');
const http          = require('http');
const path          = require('path');
const fs            = require('fs');
const { Server }    = require('socket.io');
const mongoose      = require('mongoose');
const dotenv        = require('dotenv');
const cors          = require('cors');
const helmet        = require('helmet');
const morgan        = require('morgan');
const cookieParser  = require('cookie-parser');
const rateLimit     = require('express-rate-limit');

dotenv.config();

const connectDB                         = require('./config/db');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const initSocket                        = require('./socket/socketHandler');

// ─── Route imports ────────────────────────────────────────────────────────────
const authRoutes         = require('./routes/auth');
const userRoutes         = require('./routes/users');
const universityRoutes   = require('./routes/universities');
const stageRoutes        = require('./routes/stages');
const jobRoutes          = require('./routes/jobs');
const applicationRoutes  = require('./routes/applications');
const notificationRoutes = require('./routes/notifications');
const paymentRoutes      = require('./routes/payments');
const adminRoutes        = require('./routes/admin');
const institutionRoutes  = require('./routes/institutions');
const proRoutes          = require('./routes/pro');
const communityRoutes    = require('./routes/community');
const aiRoutes           = require('./routes/ai');

// ─── Static dist paths (resolved early so health check can use them) ──────────
const frontendDist = fs.existsSync(path.join(__dirname, '../frontend/dist'))
  ? path.join(__dirname, '../frontend/dist')
  : path.join(__dirname, 'frontend/dist');

const adminDist = fs.existsSync(path.join(__dirname, '../admin/dist'))
  ? path.join(__dirname, '../admin/dist')
  : path.join(__dirname, 'admin/dist');

// ─── Connect to MongoDB ────────────────────────────────────────────────────────
connectDB();

// ─── App & HTTP server ────────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);

// Enable trust proxy so rate-limiter and secure cookies work behind Railway
app.set('trust proxy', 1);

// ─── Socket.io ────────────────────────────────────────────────────────────────
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
if (process.env.CLIENT_URL) allowedOrigins.push(process.env.CLIENT_URL);
if (process.env.ADMIN_URL)  allowedOrigins.push(process.env.ADMIN_URL);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
initSocket(io);
app.set('io', io);

// ─── Security middleware ───────────────────────────────────────────────────────
app.use(helmet());
app.disable('x-powered-by');

// Global rate limiter (1000 req / 15 min per IP)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

// Auth limiter (100 req / 15 min)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
});

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, Railway health probes)
      if (!origin) return callback(null, true);
      // Accept all in production (single-host deployment) or known dev origins
      if (process.env.NODE_ENV === 'production' || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// ─── Body parsers ─────────────────────────────────────────────────────────────
// Stripe webhook needs raw body — must be BEFORE express.json()
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// ─── HTTP logger ──────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ─── Health check (Railway probes HEAD / and GET /api/health) ─────────────────
// HEAD probe — Railway load balancer uses HEAD / to confirm server is up
app.head('/', (_req, res) => res.sendStatus(200));

app.get('/api/health', (_req, res) => {
  const dbState  = mongoose.connection.readyState;
  const dbStatus = ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] || 'unknown';
  res.status(200).json({
    success:     true,
    message:     '🚀 TuniVerse API is running',
    environment: process.env.NODE_ENV || 'production',
    database:    dbStatus,
    timestamp:   new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',          authLimiter, authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/universities',  universityRoutes);
app.use('/api/stages',        stageRoutes);
app.use('/api/jobs',          jobRoutes);
app.use('/api/applications',  applicationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments',      paymentRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/institutions',  institutionRoutes);
app.use('/api/pro',           proRoutes);
app.use('/api/community',     communityRoutes);
app.use('/api/ai',            aiRoutes);

// ─── Mobile App Version & Update Info Endpoint ────────────────────────────────
app.get('/api/app-version', (_req, res) => {
  res.json({
    status: 'success',
    data: {
      latestVersion: process.env.APP_LATEST_VERSION || '1.1.0',
      buildNumber:   parseInt(process.env.APP_BUILD_NUMBER || '110', 10),
      apkUrl:        '/downloads/tuniverse-app.apk',
      iosUrl:        process.env.APP_IOS_URL || 'https://tunistudy.up.railway.app',
      releaseNotes: [
        'iOS Support — Install TuniVerse directly on iPhone & iPad',
        'Smart OS Detection — Android & iOS download buttons auto-detected',
        'Tunisian Baccalaureate Verification Engine & 24h Review Center',
        'Mobile Notch & Status Bar Safe Area Clearance',
        'Profile Completion Gate for Student & Citizen Applications',
      ],
      forceUpdate:  process.env.APP_FORCE_UPDATE === 'true' || false,
      publishedAt:  new Date().toISOString(),
    },
  });
});

// ─── Direct Android APK Download Route ───────────────────────────────────────
app.get('/downloads/tuniverse-app.apk', (_req, res) => {
  const apkPaths = [
    path.join(__dirname, '../frontend/dist/downloads/tuniverse-app.apk'),
    path.join(__dirname, '../frontend/public/downloads/tuniverse-app.apk'),
    path.join(__dirname, 'frontend/dist/downloads/tuniverse-app.apk'),
    path.join(__dirname, '../frontend/android/app/build/outputs/apk/debug/app-debug.apk'),
  ];
  for (const p of apkPaths) {
    if (fs.existsSync(p) && fs.statSync(p).size > 100000) {
      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      res.setHeader('Content-Disposition', 'attachment; filename="tuniverse-app.apk"');
      return res.sendFile(path.resolve(p));
    }
  }
  res.status(404).send('APK file not found.');
});

// ─── Serve Built SPAs ─────────────────────────────────────────────────────────
// 1. Admin panel at /admin
app.use('/admin', express.static(adminDist));
app.get(/^\/admin(\/.*)?$/, (_req, res) => {
  res.sendFile(path.join(adminDist, 'index.html'));
});

// 2. Main frontend SPA at /
app.use(express.static(frontendDist));
app.get('{*splat}', (_req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// ─── 404 + Global error handler ───────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 TuniVerse server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  console.log(`📡 Socket.io ready`);
  console.log(`🌐 Health: http://0.0.0.0:${PORT}/api/health\n`);
});
