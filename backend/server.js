const express       = require('express');
const http          = require('http');
const path          = require('path');
const { Server }    = require('socket.io');
const mongoose      = require('mongoose');
const dotenv        = require('dotenv');
const cors          = require('cors');
const helmet        = require('helmet');
const morgan        = require('morgan');
const cookieParser  = require('cookie-parser');
const rateLimit     = require('express-rate-limit');

dotenv.config();

const connectDB                   = require('./config/db');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const initSocket                  = require('./socket/socketHandler');

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

// ─── Connect to MongoDB ────────────────────────────────────────────────────────
connectDB();

// ─── App & HTTP server ────────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);

// Enable trust proxy so rate-limiter and secure cookies work behind reverse proxies (Railway / Render)
app.set('trust proxy', 1);

// Allowed origins for CORS (main app + isolated admin panel)
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
if (process.env.CLIENT_URL) allowedOrigins.push(process.env.CLIENT_URL);
if (process.env.ADMIN_URL)  allowedOrigins.push(process.env.ADMIN_URL);

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
initSocket(io);
// Make io accessible in controllers via req.io
app.set('io', io);

// ─── Security middleware ───────────────────────────────────────────────────────
app.use(helmet());
app.disable('x-powered-by');

// Global rate limiter (100 req / 15 min per IP)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

// Stricter limiter for auth routes (20 req / 15 min)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
});

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: function (origin, callback) {
      // In single deployment mode, requests from browser to same host might have no origin or match
      if (!origin) return callback(null, true);
      // If allowedOrigins contains it, or in production single deployment, accept
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'production') {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// ─── Body parsers ─────────────────────────────────────────────────────────────
// NOTE: Stripe webhook needs raw body — must be BEFORE express.json()
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// ─── HTTP logger ──────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '🚀 TuniStudy / TuniJob API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
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

// ─── Single Deployment: Serve Built Frontend & Admin SPAs ──────────────────
const fs = require('fs');
const frontendDist = fs.existsSync(path.join(__dirname, '../frontend/dist')) 
  ? path.join(__dirname, '../frontend/dist') 
  : path.join(__dirname, 'frontend/dist');

const adminDist = fs.existsSync(path.join(__dirname, '../admin/dist')) 
  ? path.join(__dirname, '../admin/dist') 
  : path.join(__dirname, 'admin/dist');

// 1. Serve Admin SPA at /admin
app.use('/admin', express.static(adminDist));
app.get(/^\/admin(\/.*)?$/, (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(adminDist, 'index.html'));
});

// 2. Serve Main Frontend SPA at /
app.use(express.static(frontendDist));
app.get('{*splat}', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// ─── 404 + Global error handler ───────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  console.log(`📡 Socket.io ready`);
  console.log(`🌐 Health check: http://0.0.0.0:${PORT}/api/health\n`);
});
