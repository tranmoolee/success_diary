const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'success_diary',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function waitForDB(retries = 15, delay = 2000) {
  for (let i = 1; i <= retries; i++) {
    try {
      const client = await pool.connect();
      client.release();
      console.log('数据库连接成功');
      return;
    } catch (err) {
      console.log(`等待数据库就绪... (${i}/${retries})`);
      if (i === retries) throw new Error('数据库连接超时: ' + err.message);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

async function initDB() {
  await waitForDB();
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(100),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS entries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        entry_date DATE NOT NULL,
        text TEXT NOT NULL,
        tag VARCHAR(20) DEFAULT '生活',
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, entry_date, sort_order)
      );

      CREATE INDEX IF NOT EXISTS idx_entries_user_date ON entries(user_id, entry_date);

      CREATE TABLE IF NOT EXISTS dreams (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(200) NOT NULL,
        cost NUMERIC(12,2) DEFAULT 0,
        saved NUMERIC(12,2) DEFAULT 0,
        done BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS savings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(10) NOT NULL CHECK (type IN ('deposit', 'withdraw')),
        amount NUMERIC(12,2) NOT NULL,
        note TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      ALTER TABLE users ADD COLUMN IF NOT EXISTS theme VARCHAR(20) DEFAULT 'default';

      CREATE TABLE IF NOT EXISTS user_achievements (
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        code VARCHAR(40) NOT NULL,
        unlocked_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (user_id, code)
      );

      CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);

      CREATE TABLE IF NOT EXISTS shares (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        share_code VARCHAR(12) UNIQUE NOT NULL,
        entry_date DATE NOT NULL,
        entry_count INTEGER DEFAULT 0,
        entries_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
        view_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      ALTER TABLE shares ADD COLUMN IF NOT EXISTS entries_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb;

      CREATE INDEX IF NOT EXISTS idx_shares_code ON shares(share_code);
      CREATE INDEX IF NOT EXISTS idx_shares_user ON shares(user_id);

      -- 管理员相关字段
      ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS disabled BOOLEAN DEFAULT FALSE;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;
      CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = TRUE;
      CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active_at);

      -- 系统设置（公告、注册开关等键值对）
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(50) PRIMARY KEY,
        value TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- 管理员操作日志（审计追踪）
      CREATE TABLE IF NOT EXISTS admin_audit_log (
        id SERIAL PRIMARY KEY,
        admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(50) NOT NULL,
        target_type VARCHAR(20),
        target_id INTEGER,
        detail JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_log(created_at DESC);
    `);

    // 启动时根据 ADMIN_USERNAMES env 自动 grant admin
    const adminUsernames = (process.env.ADMIN_USERNAMES || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    if (adminUsernames.length > 0) {
      const result = await client.query(
        `UPDATE users SET is_admin = TRUE WHERE username = ANY($1) AND is_admin = FALSE RETURNING username`,
        [adminUsernames]
      );
      if (result.rows.length > 0) {
        console.log(`[admin] 已授权管理员: ${result.rows.map(r => r.username).join(', ')}`);
      }
      console.log(`[admin] 配置的管理员账号: ${adminUsernames.join(', ')}`);
    } else {
      console.log('[admin] 未配置 ADMIN_USERNAMES，无管理员账户');
    }
    console.log('数据库初始化完成');
  } finally {
    client.release();
  }
}

module.exports = { pool, initDB };
