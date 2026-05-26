const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');
const { generateToken, authenticate, rejectIfDisabled } = require('../middleware/auth');
const { getClientIp, verifyTurnstile } = require('../turnstile');
const { getSetting, isRegistrationOpen } = require('../settings');
const {
  validate,
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} = require('../validators');

const router = express.Router();

// 注册
router.post('/register', validate(registerSchema), async (req, res) => {
  try {
    const { username, password, displayName, turnstileToken } = req.validated;

    const registration = await getSetting('registration');
    if (!isRegistrationOpen(registration)) {
      return res.status(403).json({ error: '当前暂未开放注册' });
    }

    const human = await verifyTurnstile(turnstileToken, getClientIp(req), 'register');
    if (!human) {
      return res.status(400).json({ error: '人机验证失败，请重试' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: '用户名已存在' });
    }

    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      'INSERT INTO users (username, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id, username, display_name, theme',
      [username, hash, displayName || username]
    );

    const user = result.rows[0];
    const token = generateToken(user.id, user.username);

    res.status(201).json({
      token,
      user: { id: user.id, username: user.username, displayName: user.display_name, theme: user.theme || 'default' }
    });
  } catch (err) {
    console.error('注册失败:', err);
    res.status(500).json({ error: '注册失败' });
  }
});

// 登录
router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { username, password } = req.validated;

    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    if (user.disabled) {
      return res.status(403).json({ error: '账户已被禁用，请联系管理员' });
    }

    const token = generateToken(user.id, user.username);

    res.json({
      token,
      user: { id: user.id, username: user.username, displayName: user.display_name, theme: user.theme || 'default' }
    });
  } catch (err) {
    console.error('登录失败:', err);
    res.status(500).json({ error: '登录失败' });
  }
});

// 获取当前用户信息
router.get('/me', authenticate, rejectIfDisabled, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, display_name, theme, created_at FROM users WHERE id = $1',
      [req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '用户不存在' });
    }
    const u = result.rows[0];
    res.json({ id: u.id, username: u.username, displayName: u.display_name, theme: u.theme || 'default', createdAt: u.created_at });
  } catch (err) {
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

// 更新用户资料（昵称 / 主题）
router.patch('/profile', authenticate, rejectIfDisabled, validate(updateProfileSchema), async (req, res) => {
  try {
    const { displayName, theme } = req.validated;
    const sets = [];
    const params = [];
    if (displayName !== undefined) { params.push(displayName); sets.push(`display_name = $${params.length}`); }
    if (theme !== undefined) { params.push(theme); sets.push(`theme = $${params.length}`); }
    params.push(req.userId);
    const result = await pool.query(
      `UPDATE users SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING id, username, display_name, theme, created_at`,
      params
    );
    const u = result.rows[0];
    res.json({ id: u.id, username: u.username, displayName: u.display_name, theme: u.theme || 'default', createdAt: u.created_at });
  } catch (err) {
    console.error('更新失败:', err);
    res.status(500).json({ error: '更新失败' });
  }
});

// 修改密码
router.patch('/password', authenticate, rejectIfDisabled, validate(changePasswordSchema), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.validated;

    const userResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.userId]);
    const valid = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
    if (!valid) {
      return res.status(401).json({ error: '当前密码错误' });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '修改密码失败' });
  }
});

module.exports = router;
