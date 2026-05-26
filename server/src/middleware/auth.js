const jwt = require('jsonwebtoken');
const { pool } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('致命错误: 必须设置环境变量 JWT_SECRET');
  process.exit(1);
}

if (JWT_SECRET.length < 16) {
  console.error('致命错误: JWT_SECRET 长度至少 16 字符');
  process.exit(1);
}

// 节流：每个用户每 60 秒最多更新一次 last_active_at
const lastActiveCache = new Map();
const ACTIVE_THROTTLE_MS = 60 * 1000;
const ACTIVE_CACHE_MAX = 5000;

async function touchLastActive(userId) {
  const now = Date.now();
  const prev = lastActiveCache.get(userId) || 0;
  if (now - prev < ACTIVE_THROTTLE_MS) return;
  lastActiveCache.set(userId, now);
  if (lastActiveCache.size > ACTIVE_CACHE_MAX) {
    const cutoff = now - ACTIVE_THROTTLE_MS * 10;
    for (const [id, ts] of lastActiveCache) {
      if (ts < cutoff) lastActiveCache.delete(id);
      if (lastActiveCache.size <= ACTIVE_CACHE_MAX) break;
    }
  }
  try {
    await pool.query('UPDATE users SET last_active_at = NOW() WHERE id = $1', [userId]);
  } catch (err) {
    console.error('更新 last_active 失败:', err.message);
  }
}

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录' });
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    req.username = payload.username;
    // 异步更新最后活跃时间（不阻塞请求）
    touchLastActive(payload.userId);
    next();
  } catch {
    return res.status(401).json({ error: '登录已过期' });
  }
}

// 管理员中间件 — 必须先经过 authenticate
async function requireAdmin(req, res, next) {
  if (!req.userId) {
    return res.status(401).json({ error: '未登录' });
  }
  try {
    const { rows } = await pool.query(
      'SELECT is_admin, disabled FROM users WHERE id = $1',
      [req.userId]
    );
    if (rows.length === 0 || rows[0].disabled) {
      return res.status(403).json({ error: '账户不存在或已禁用' });
    }
    if (!rows[0].is_admin) {
      return res.status(403).json({ error: '需要管理员权限' });
    }
    req.isAdmin = true;
    next();
  } catch (err) {
    console.error('requireAdmin 失败:', err.message);
    res.status(500).json({ error: '权限验证失败' });
  }
}

// 检查账户是否被禁用（非管理员路由也要用）
async function rejectIfDisabled(req, res, next) {
  if (!req.userId) return next();
  try {
    const { rows } = await pool.query('SELECT disabled FROM users WHERE id = $1', [req.userId]);
    if (rows.length > 0 && rows[0].disabled) {
      return res.status(403).json({ error: '账户已被禁用，请联系管理员' });
    }
    next();
  } catch {
    next();
  }
}

function generateToken(userId, username) {
  return jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '30d' });
}

module.exports = { authenticate, requireAdmin, rejectIfDisabled, generateToken };
