const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { pool, initDB } = require('./db');
const authRoutes = require('./routes/auth');
const entryRoutes = require('./routes/entries');
const dreamRoutes = require('./routes/dreams');
const savingsRoutes = require('./routes/savings');
const statsRoutes = require('./routes/stats');
const achievementsRoutes = require('./routes/achievements');
const { authenticate } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware — 启用 CSP，允许 cdnjs (html2canvas)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'"],
      upgradeInsecureRequests: null,
    },
  },
}));
app.use(cors());
app.use(express.json({ limit: '100kb' })); // 限制请求体大小

// 全局 API 限流
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// 登录/注册 更严格限流：每IP每15分钟最多 20 次
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '请求过于频繁，请稍后再试' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Static frontend
app.use(express.static(path.join(__dirname, '../../public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/entries', authenticate, entryRoutes);
app.use('/api/dreams', authenticate, dreamRoutes);
app.use('/api/savings', authenticate, savingsRoutes);
app.use('/api/stats', authenticate, statsRoutes);
app.use('/api/achievements', authenticate, achievementsRoutes);

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../public/index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

// Start
async function start() {
  try {
    await initDB();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`成功日记 API 运行在 http://0.0.0.0:${PORT}`);
    });
  } catch (err) {
    console.error('启动失败:', err);
    process.exit(1);
  }
}

start();
