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
const sharesRoutes = require('./routes/shares');
const { authenticate } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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
app.use('/api/shares', authenticate, sharesRoutes);

// Public share landing page — GET /s/:code
app.get('/s/:code', async (req, res) => {
  const code = req.params.code;
  if (!/^[A-Za-z0-9_-]{4,12}$/.test(code)) {
    return res.status(400).send('无效的分享码');
  }
  try {
    const { rows } = await pool.query(
      `UPDATE shares SET view_count = view_count + 1 WHERE share_code = $1
       RETURNING user_id, entry_date, entry_count, entries_snapshot, view_count`,
      [code]
    );
    if (rows.length === 0) {
      return res.status(404).send('分享不存在或已过期');
    }
    const share = rows[0];
    let entries = Array.isArray(share.entries_snapshot) ? share.entries_snapshot : [];
    if (entries.length === 0) {
      const result = await pool.query(
        `SELECT text, tag FROM entries WHERE user_id = $1 AND entry_date = $2 ORDER BY sort_order`,
        [share.user_id, share.entry_date]
      );
      entries = result.rows;
    }
    const { rows: userRows } = await pool.query(
      `SELECT display_name, username FROM users WHERE id = $1`,
      [share.user_id]
    );
    const user = userRows[0] || {};
    const displayName = user.display_name || user.username || '匿名';
    const safeDisplayName = escapeHtml(displayName);
    const dateStr = new Date(share.entry_date).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });

    res.send(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${safeDisplayName} 的成功日记</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;
  background:linear-gradient(135deg,#eef4ff 0%,#e8f4f8 50%,#f0f5ff 100%);
  min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.card{max-width:420px;width:100%;background:rgba(255,255,255,0.75);
  border:1px solid rgba(255,255,255,0.8);border-radius:24px;padding:32px 24px;
  backdrop-filter:blur(20px);box-shadow:0 12px 40px rgba(37,99,235,0.08)}
.header{text-align:center;margin-bottom:24px}
.avatar{width:56px;height:56px;border-radius:50%;
  background:linear-gradient(135deg,#2563eb,#14b8a6);color:#fff;
  display:inline-flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;margin-bottom:12px}
h1{font-size:20px;font-weight:800;color:#1e293b;margin-bottom:4px}
.date{font-size:13px;color:#64748b}
.entries{display:flex;flex-direction:column;gap:10px;margin-bottom:20px}
.entry{display:flex;align-items:flex-start;gap:10px;padding:12px;
  background:rgba(255,255,255,0.7);border-radius:14px;border:1px solid rgba(37,99,235,0.08)}
.num{width:24px;height:24px;border-radius:50%;
  background:linear-gradient(135deg,#2563eb,#14b8a6);color:#fff;
  display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0}
.text{font-size:14px;line-height:1.6;color:#1f2937;flex:1}
.tag{font-size:10px;padding:2px 8px;border-radius:10px;
  background:rgba(37,99,235,0.08);color:#2563eb;white-space:nowrap;flex-shrink:0}
.footer{text-align:center;padding-top:16px;border-top:1px solid rgba(37,99,235,0.08)}
.footer p{font-size:12px;color:#94a3b8}
.footer .brand{font-weight:700;color:#2563eb}
.views{font-size:11px;color:#94a3b8;margin-top:8px}
.cta{display:block;text-decoration:none;margin-top:14px;padding:12px 16px;border-radius:14px;
  background:linear-gradient(135deg,#2563eb,#14b8a6);color:#fff;font-size:14px;font-weight:800}
.cta-sub{font-size:11px;color:#64748b;margin-top:8px}
</style>
</head>
<body>
<div class="card">
  <div class="header">
    <div class="avatar">${escapeHtml(displayName.charAt(0).toUpperCase())}</div>
    <h1>${safeDisplayName} 的成功日记</h1>
    <div class="date">${dateStr} · ${share.entry_count} 条记录</div>
  </div>
  <div class="entries">
    ${entries.map((e, i) => `<div class="entry"><div class="num">${i + 1}</div><div class="text">${escapeHtml(e.text)}</div><div class="tag">${escapeHtml(e.tag)}</div></div>`).join('')}
  </div>
  <div class="footer">
    <p>来自 <span class="brand">成功日记 · 小狗钱钱</span></p>
    <a class="cta" href="/">点击一起开始记录</a>
    <p class="cta-sub">每天写下成功事项，积累看得见的自信</p>
    <p class="views">已被查看 ${share.view_count} 次</p>
  </div>
</div>
</body>
</html>`);
  } catch (err) {
    console.error('分享页错误:', err);
    res.status(500).send('服务器错误');
  }
});

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
