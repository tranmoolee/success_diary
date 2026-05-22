# 成功日记

灵感来自《小狗钱钱》——每天记录自己做成功的事情，培养自信和持续成长的习惯。

## 功能

- 每日成功事件记录（条目数可增减，支持分类标签）
- 梦想储蓄罐：设定目标金额，追踪进度
- 统计面板：连续天数、分类统计、近 30 天趋势
- 截图分享卡片（通过 html2canvas 生成）
- 多用户支持，JWT 认证
- 新用户引导流程
- 用户资料管理（修改昵称、修改密码）

## 技术栈

- **前端**：单文件 HTML + CSS + Vanilla JS
- **后端**：Node.js / Express
- **数据库**：PostgreSQL 16
- **部署**：Docker Compose
- **安全**：Helmet CSP、bcrypt、Zod 输入校验、速率限制、事务级并发控制

## 快速开始

### 1. 准备环境变量

```bash
cp .env.example .env
# 编辑 .env，设置强密码和 JWT 密钥
# JWT_SECRET 建议：openssl rand -hex 32
```

### 2. Docker Compose 启动（推荐）

```bash
docker compose up -d --build
```

应用运行在 `http://localhost:3800`（可在 `.env` 中修改 `APP_PORT`）。

### 3. 本地开发

需要本地 PostgreSQL 实例（或使用 docker compose 中的数据库）：

```bash
cd server
npm install
npm run dev
```

后端默认连接 `localhost:5432` 上的 PostgreSQL，默认数据库用户为 `postgres`。如果使用 `docker compose` 中的数据库做本地开发，请设置 `DB_HOST=localhost`、`DB_PORT=5433`、`DB_USER=diary`、`DB_PASSWORD` 和 `JWT_SECRET`。

## 环境变量说明

| 变量 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `DB_NAME` | 否 | `success_diary` | 数据库名 |
| `DB_USER` | 否 | `diary` / 本地代码默认 `postgres` | 数据库用户 |
| `DB_PASSWORD` | **是** | — | 数据库密码 |
| `JWT_SECRET` | **是** | — | JWT 签名密钥（≥16 字符） |
| `APP_PORT` | 否 | `3800` | 宿主机映射端口 |
| `PG_PORT` | 否 | `5433` | PostgreSQL 宿主机映射端口 |

> 生产环境中 `DB_PASSWORD` 和 `JWT_SECRET` 未设置时，应用将拒绝启动。

## API 概览

所有接口前缀 `/api`，需 `Authorization: Bearer <token>` 头（除注册和登录外）。

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 |
| GET | `/api/auth/me` | 获取当前用户信息 |
| PATCH | `/api/auth/profile` | 更新用户昵称/主题 |
| PATCH | `/api/auth/password` | 修改密码 |
| GET | `/api/entries/:date` | 获取某日条目 |
| PUT | `/api/entries/:date` | 保存某日条目 |
| GET | `/api/entries/month/:yearMonth` | 月历已记录日期 |
| GET/POST | `/api/dreams` | 梦想列表/新增 |
| PATCH | `/api/dreams/:id` | 更新梦想 |
| DELETE | `/api/dreams/:id` | 删除梦想 |
| GET | `/api/savings` | 储蓄记录 |
| POST | `/api/savings` | 存入/取出 |
| GET | `/api/stats` | 综合统计 |
| POST | `/api/shares` | 创建当天记录分享链接 |
| GET | `/api/shares/stats` | 分享统计 |

## 安全措施

- 密码使用 bcrypt（12 轮）加密存储
- JWT 密钥强制从环境变量读取，缺失则拒绝启动
- 所有用户输入经 Zod schema 校验
- 标签使用服务端白名单，防止 XSS
- 前端全面 HTML 转义（escapeHtml + safeTag）
- Helmet 设置 CSP 等安全响应头
- 全局速率限制 200 次/15 分钟，认证接口 20 次/15 分钟
- 储蓄提现使用 PostgreSQL 事务 + 咨询锁防并发

## 部署到服务器

适用于现有 Docker on Debian (192.168.1.6) 环境：

```bash
# 上传项目到服务器
scp -r . user@192.168.1.6:/opt/success-diary/

# SSH 到服务器
ssh user@192.168.1.6
cd /opt/success-diary

# 配置生产环境变量
cp .env.example .env
vim .env  # 设置强密码

# 启动
docker compose up -d --build
```

然后在 NPM (Nginx Proxy Manager) 中添加反向代理，将域名指向 `192.168.1.6:3800`，通过 Cloudflare Tunnel 暴露到外网。

## 项目结构

```
Success_diary/
├── public/index.html      # 前端 SPA（单文件）
├── server/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js        # Express 入口 + 中间件
│       ├── db.js           # PostgreSQL 连接 + 建表
│       ├── validators.js   # Zod 校验 schemas
│       ├── middleware/
│       │   └── auth.js     # JWT 认证中间件
│       └── routes/
│           ├── auth.js     # 注册/登录/资料
│           ├── entries.js  # 每日条目
│           ├── dreams.js   # 梦想管理
│           ├── savings.js  # 储蓄罐
│           └── stats.js    # 统计数据
├── docker-compose.yml
├── .env.example
└── .gitignore
```

## License

MIT
