const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('../db');
const { ALLOWED_SETTING_KEYS, getSettings } = require('../settings');

const router = express.Router();

// ============ 工具函数 ============

async function logAudit(adminId, action, targetType, targetId, detail = {}) {
  try {
    await pool.query(
      `INSERT INTO admin_audit_log (admin_id, action, target_type, target_id, detail)
       VALUES ($1, $2, $3, $4, $5)`,
      [adminId, action, targetType, targetId, detail]
    );
  } catch (err) {
    console.error('审计日志失败:', err.message);
  }
}

function parsePagination(req) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(10, parseInt(req.query.pageSize) || 20));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

async function getActiveAdminCount(excludeUserId = null) {
  const params = [];
  let where = 'WHERE is_admin = TRUE AND disabled = FALSE';
  if (excludeUserId) {
    params.push(excludeUserId);
    where += ` AND id <> $${params.length}`;
  }
  const { rows } = await pool.query(`SELECT COUNT(*)::int AS count FROM users ${where}`, params);
  return rows[0].count;
}

async function assertAdminSafety(targetUserId, nextValues = {}) {
  const { rows } = await pool.query(
    'SELECT id, is_admin, disabled FROM users WHERE id = $1',
    [targetUserId]
  );
  if (rows.length === 0) return { ok: false, status: 404, error: '用户不存在' };

  const user = rows[0];
  const willBeAdmin = typeof nextValues.isAdmin === 'boolean' ? nextValues.isAdmin : user.is_admin;
  const willBeDisabled = typeof nextValues.disabled === 'boolean' ? nextValues.disabled : user.disabled;
  const removesActiveAdmin = user.is_admin && !user.disabled && (!willBeAdmin || willBeDisabled);

  if (removesActiveAdmin && await getActiveAdminCount(targetUserId) === 0) {
    return { ok: false, status: 400, error: '至少需要保留一个可用管理员' };
  }
  return { ok: true, user };
}

// ============ DASHBOARD: 总览统计 ============

router.get('/stats', async (req, res) => {
  try {
    const [
      usersAgg,
      todayUsers,
      activeDAU,
      activeWAU,
      entriesAgg,
      todayEntries,
      sharesAgg,
      themeDist,
      growth,
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE disabled = TRUE)::int AS disabled FROM users`),
      pool.query(`SELECT COUNT(*)::int AS cnt FROM users WHERE created_at >= CURRENT_DATE`),
      pool.query(`SELECT COUNT(DISTINCT id)::int AS cnt FROM users WHERE last_active_at >= NOW() - INTERVAL '24 hours'`),
      pool.query(`SELECT COUNT(DISTINCT id)::int AS cnt FROM users WHERE last_active_at >= NOW() - INTERVAL '7 days'`),
      pool.query(`SELECT COUNT(*)::int AS total FROM entries`),
      pool.query(`SELECT COUNT(*)::int AS cnt FROM entries WHERE created_at >= CURRENT_DATE`),
      pool.query(`SELECT COUNT(*)::int AS total, COALESCE(SUM(view_count), 0)::int AS views FROM shares`),
      pool.query(`SELECT COALESCE(theme, 'default') AS theme, COUNT(*)::int AS cnt FROM users GROUP BY theme ORDER BY cnt DESC`),
      pool.query(`
        SELECT TO_CHAR(d.dt, 'YYYY-MM-DD') AS date,
          COALESCE(u.cnt, 0)::int AS new_users,
          COALESCE(e.cnt, 0)::int AS new_entries
        FROM generate_series(CURRENT_DATE - INTERVAL '29 days', CURRENT_DATE, INTERVAL '1 day') AS d(dt)
        LEFT JOIN (
          SELECT DATE(created_at) AS d, COUNT(*) AS cnt FROM users GROUP BY DATE(created_at)
        ) u ON u.d = d.dt
        LEFT JOIN (
          SELECT DATE(created_at) AS d, COUNT(*) AS cnt FROM entries GROUP BY DATE(created_at)
        ) e ON e.d = d.dt
        ORDER BY d.dt
      `),
    ]);

    res.json({
      users: {
        total: usersAgg.rows[0].total,
        disabled: usersAgg.rows[0].disabled,
        todayNew: todayUsers.rows[0].cnt,
        dau: activeDAU.rows[0].cnt,
        wau: activeWAU.rows[0].cnt,
      },
      entries: {
        total: entriesAgg.rows[0].total,
        todayNew: todayEntries.rows[0].cnt,
      },
      shares: {
        total: sharesAgg.rows[0].total,
        totalViews: sharesAgg.rows[0].views,
      },
      themes: themeDist.rows,
      growth: growth.rows,
    });
  } catch (err) {
    console.error('admin stats 失败:', err);
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

// ============ USERS: 用户管理 ============

router.get('/users', async (req, res) => {
  try {
    const { page, pageSize, offset } = parsePagination(req);
    const q = (req.query.q || '').trim();
    const filter = req.query.filter || 'all'; // all | admin | disabled | active

    const conditions = [];
    const params = [];
    if (q) {
      params.push(`%${q}%`);
      conditions.push(`(username ILIKE $${params.length} OR display_name ILIKE $${params.length})`);
    }
    if (filter === 'admin') conditions.push(`is_admin = TRUE`);
    if (filter === 'disabled') conditions.push(`disabled = TRUE`);
    if (filter === 'active') conditions.push(`last_active_at >= NOW() - INTERVAL '7 days'`);

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const countQuery = await pool.query(`SELECT COUNT(*)::int AS total FROM users ${where}`, params);
    params.push(pageSize, offset);

    const { rows } = await pool.query(`
      SELECT u.id, u.username, u.display_name, u.theme, u.is_admin, u.disabled,
             u.created_at, u.last_active_at,
             COALESCE(e.entry_count, 0)::int AS entry_count,
             COALESCE(a.badge_count, 0)::int AS badge_count,
             COALESCE(s.share_count, 0)::int AS share_count
      FROM users u
      LEFT JOIN (SELECT user_id, COUNT(*) AS entry_count FROM entries GROUP BY user_id) e ON e.user_id = u.id
      LEFT JOIN (SELECT user_id, COUNT(*) AS badge_count FROM user_achievements GROUP BY user_id) a ON a.user_id = u.id
      LEFT JOIN (SELECT user_id, COUNT(*) AS share_count FROM shares GROUP BY user_id) s ON s.user_id = u.id
      ${where}
      ORDER BY u.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    res.json({ total: countQuery.rows[0].total, page, pageSize, items: rows });
  } catch (err) {
    console.error('admin users 失败:', err);
    res.status(500).json({ error: '获取用户列表失败' });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ error: 'id 无效' });

    const [userRow, recentEntries, badges, shareList] = await Promise.all([
      pool.query(`
        SELECT u.id, u.username, u.display_name, u.theme, u.is_admin, u.disabled,
               u.created_at, u.last_active_at,
               COALESCE(e.entry_count, 0)::int AS entry_count,
               COALESCE(a.badge_count, 0)::int AS badge_count,
               COALESCE(s.share_count, 0)::int AS share_count,
               COALESCE(s.total_views, 0)::int AS total_share_views
        FROM users u
        LEFT JOIN (SELECT user_id, COUNT(*) AS entry_count FROM entries WHERE user_id = $1 GROUP BY user_id) e ON e.user_id = u.id
        LEFT JOIN (SELECT user_id, COUNT(*) AS badge_count FROM user_achievements WHERE user_id = $1 GROUP BY user_id) a ON a.user_id = u.id
        LEFT JOIN (SELECT user_id, COUNT(*) AS share_count, COALESCE(SUM(view_count), 0) AS total_views FROM shares WHERE user_id = $1 GROUP BY user_id) s ON s.user_id = u.id
        WHERE u.id = $1
      `, [id]),
      pool.query(`SELECT id, entry_date, text, tag, created_at FROM entries WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`, [id]),
      pool.query(`SELECT code, unlocked_at FROM user_achievements WHERE user_id = $1 ORDER BY unlocked_at DESC`, [id]),
      pool.query(`SELECT share_code, entry_date, entry_count, view_count, created_at FROM shares WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10`, [id]),
    ]);

    if (userRow.rows.length === 0) return res.status(404).json({ error: '用户不存在' });

    res.json({
      user: userRow.rows[0],
      recentEntries: recentEntries.rows,
      badges: badges.rows,
      recentShares: shareList.rows,
    });
  } catch (err) {
    console.error('admin user detail 失败:', err);
    res.status(500).json({ error: '获取用户详情失败' });
  }
});

router.patch('/users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ error: 'id 无效' });
    if (id === req.userId) return res.status(400).json({ error: '不能修改自己' });

    const { disabled, isAdmin, displayName } = req.body || {};
    const safety = await assertAdminSafety(id, { disabled, isAdmin });
    if (!safety.ok) return res.status(safety.status).json({ error: safety.error });

    const sets = [];
    const params = [];
    const detail = {};

    if (typeof disabled === 'boolean') {
      params.push(disabled);
      sets.push(`disabled = $${params.length}`);
      detail.disabled = disabled;
    }
    if (typeof isAdmin === 'boolean') {
      params.push(isAdmin);
      sets.push(`is_admin = $${params.length}`);
      detail.isAdmin = isAdmin;
    }
    if (typeof displayName === 'string' && displayName.trim()) {
      params.push(displayName.trim().slice(0, 100));
      sets.push(`display_name = $${params.length}`);
      detail.displayName = displayName.trim();
    }

    if (sets.length === 0) return res.status(400).json({ error: '无更新字段' });

    params.push(id);
    const result = await pool.query(
      `UPDATE users SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING id, username, display_name, is_admin, disabled`,
      params
    );

    if (result.rows.length === 0) return res.status(404).json({ error: '用户不存在' });
    await logAudit(req.userId, 'user.update', 'user', id, detail);
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('admin user update 失败:', err);
    res.status(500).json({ error: '更新用户失败' });
  }
});

router.post('/users/:id/reset-password', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ error: 'id 无效' });

    const { newPassword } = req.body || {};
    if (!newPassword || newPassword.length < 8 || newPassword.length > 128) {
      return res.status(400).json({ error: '密码长度必须为 8 到 128 个字符' });
    }
    const hash = await bcrypt.hash(newPassword, 10);
    const result = await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id', [hash, id]);
    if (result.rows.length === 0) return res.status(404).json({ error: '用户不存在' });

    await logAudit(req.userId, 'user.reset_password', 'user', id, {});
    res.json({ success: true });
  } catch (err) {
    console.error('admin reset password 失败:', err);
    res.status(500).json({ error: '重置密码失败' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ error: 'id 无效' });
    if (id === req.userId) return res.status(400).json({ error: '不能删除自己' });
    const safety = await assertAdminSafety(id, { isAdmin: false });
    if (!safety.ok) return res.status(safety.status).json({ error: safety.error });

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING username', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: '用户不存在' });

    await logAudit(req.userId, 'user.delete', 'user', id, { username: result.rows[0].username });
    res.json({ success: true });
  } catch (err) {
    console.error('admin user delete 失败:', err);
    res.status(500).json({ error: '删除用户失败' });
  }
});

// ============ ENTRIES: 日记审核 ============

router.get('/entries', async (req, res) => {
  try {
    const { page, pageSize, offset } = parsePagination(req);
    const q = (req.query.q || '').trim();
    const tag = (req.query.tag || '').trim();

    const conditions = [];
    const params = [];
    if (q) {
      params.push(`%${q}%`);
      conditions.push(`e.text ILIKE $${params.length}`);
    }
    if (tag) {
      params.push(tag);
      conditions.push(`e.tag = $${params.length}`);
    }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const countQuery = await pool.query(`SELECT COUNT(*)::int AS total FROM entries e ${where}`, params);
    params.push(pageSize, offset);

    const { rows } = await pool.query(`
      SELECT e.id, e.text, e.tag, e.entry_date, e.created_at,
             u.id AS user_id, u.username, u.display_name
      FROM entries e
      JOIN users u ON u.id = e.user_id
      ${where}
      ORDER BY e.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    res.json({ total: countQuery.rows[0].total, page, pageSize, items: rows });
  } catch (err) {
    console.error('admin entries 失败:', err);
    res.status(500).json({ error: '获取日记列表失败' });
  }
});

router.delete('/entries/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) return res.status(400).json({ error: 'id 无效' });
    const result = await pool.query('DELETE FROM entries WHERE id = $1 RETURNING user_id, text', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: '日记不存在' });
    await logAudit(req.userId, 'entry.delete', 'entry', id, { user_id: result.rows[0].user_id });
    res.json({ success: true });
  } catch (err) {
    console.error('admin entry delete 失败:', err);
    res.status(500).json({ error: '删除日记失败' });
  }
});

// ============ SHARES: 分享统计 ============

router.get('/shares', async (req, res) => {
  try {
    const { page, pageSize, offset } = parsePagination(req);
    const sort = req.query.sort === 'views' ? 'view_count DESC' : 'created_at DESC';

    const countQuery = await pool.query(`SELECT COUNT(*)::int AS total FROM shares`);
    const { rows } = await pool.query(`
      SELECT s.share_code, s.entry_date, s.entry_count, s.view_count, s.created_at,
             u.id AS user_id, u.username, u.display_name
      FROM shares s
      JOIN users u ON u.id = s.user_id
      ORDER BY ${sort}
      LIMIT $1 OFFSET $2
    `, [pageSize, offset]);

    res.json({ total: countQuery.rows[0].total, page, pageSize, items: rows });
  } catch (err) {
    console.error('admin shares 失败:', err);
    res.status(500).json({ error: '获取分享列表失败' });
  }
});

router.delete('/shares/:code', async (req, res) => {
  try {
    const code = req.params.code;
    const result = await pool.query('DELETE FROM shares WHERE share_code = $1 RETURNING user_id', [code]);
    if (result.rows.length === 0) return res.status(404).json({ error: '分享不存在' });
    await logAudit(req.userId, 'share.delete', 'share', null, { code, user_id: result.rows[0].user_id });
    res.json({ success: true });
  } catch (err) {
    console.error('admin share delete 失败:', err);
    res.status(500).json({ error: '删除分享失败' });
  }
});

// ============ SETTINGS: 系统设置 ============

router.get('/settings', async (req, res) => {
  try {
    res.json({ settings: await getSettings() });
  } catch (err) {
    console.error('admin settings 失败:', err);
    res.status(500).json({ error: '获取设置失败' });
  }
});

router.put('/settings/:key', async (req, res) => {
  try {
    const key = req.params.key;
    if (!/^[a-z_]{1,50}$/.test(key)) return res.status(400).json({ error: 'key 格式错误' });
    if (!ALLOWED_SETTING_KEYS.has(key)) return res.status(400).json({ error: '不支持的设置项' });
    const { value } = req.body || {};
    if (typeof value !== 'string' || value.length > 5000) {
      return res.status(400).json({ error: 'value 必须是字符串且不超过 5000 字符' });
    }
    const normalizedValue = value.trim();
    if (key === 'registration' && normalizedValue && !['on', 'off'].includes(normalizedValue.toLowerCase())) {
      return res.status(400).json({ error: 'registration 只能设置为 on 或 off' });
    }
    if (key === 'daily_limit_minutes' && normalizedValue) {
      const minutes = Number(normalizedValue);
      if (!Number.isInteger(minutes) || minutes < 0 || minutes > 1440) {
        return res.status(400).json({ error: '每日使用时长必须是 0 到 1440 的整数分钟' });
      }
    }
    await pool.query(
      `INSERT INTO system_settings (key, value, updated_at) VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
      [key, normalizedValue]
    );
    await logAudit(req.userId, 'setting.update', 'setting', null, { key });
    res.json({ success: true, key, value: normalizedValue });
  } catch (err) {
    console.error('admin setting update 失败:', err);
    res.status(500).json({ error: '更新设置失败' });
  }
});

// ============ AUDIT LOG: 操作日志 ============

router.get('/audit', async (req, res) => {
  try {
    const { page, pageSize, offset } = parsePagination(req);
    const countQuery = await pool.query(`SELECT COUNT(*)::int AS total FROM admin_audit_log`);
    const { rows } = await pool.query(`
      SELECT l.id, l.action, l.target_type, l.target_id, l.detail, l.created_at,
             u.username AS admin_username
      FROM admin_audit_log l
      LEFT JOIN users u ON u.id = l.admin_id
      ORDER BY l.created_at DESC
      LIMIT $1 OFFSET $2
    `, [pageSize, offset]);
    res.json({ total: countQuery.rows[0].total, page, pageSize, items: rows });
  } catch (err) {
    console.error('admin audit 失败:', err);
    res.status(500).json({ error: '获取操作日志失败' });
  }
});

// ============ ME: 当前管理员信息 ============

router.get('/me', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, username, display_name, is_admin FROM users WHERE id = $1',
      [req.userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: '用户不存在' });
    res.json({ user: rows[0] });
  } catch (err) {
    res.status(500).json({ error: '获取信息失败' });
  }
});

module.exports = router;
