const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('致命错误: 必须设置环境变量 JWT_SECRET');
  process.exit(1);
}

if (JWT_SECRET.length < 16) {
  console.error('致命错误: JWT_SECRET 长度至少 16 字符');
  process.exit(1);
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
    next();
  } catch {
    return res.status(401).json({ error: '登录已过期' });
  }
}

function generateToken(userId, username) {
  return jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '30d' });
}

module.exports = { authenticate, generateToken };
