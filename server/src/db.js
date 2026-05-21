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
    `);
    console.log('数据库初始化完成');
  } finally {
    client.release();
  }
}

module.exports = { pool, initDB };
