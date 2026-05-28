# 成功日记

[English README](./README.en.md)

成功日记是一款轻量级 Web 应用，用来记录每天的小成功、追踪梦想目标，并通过连续记录、统计面板和分享卡片帮助用户看见自己的成长。

## 功能特性

- 每日成功事项记录，支持多条输入和分类标签
- 梦想存钱罐，用于记录目标和收支变化
- 成长统计面板，展示连续天数、累计数据、趋势和分类统计
- 浏览器内生成带二维码的分享卡片
- 多用户支持，基于 JWT 的登录认证
- 注册流程支持 Cloudflare Turnstile 人机验证
- 管理入口用于基础运营设置
- 前端使用原生 HTML、CSS、JavaScript，后端使用 Express 提供 API 和静态资源服务

## 技术栈

- 前端：HTML、CSS、Vanilla JavaScript
- 后端：Node.js、Express
- 数据库：PostgreSQL
- 安全：Helmet CSP、bcrypt、Zod 校验、接口限流
- 部署：Docker Compose

## 快速开始

### 1. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`，设置数据库、JWT 和 Turnstile 相关配置。

生产环境至少需要提供：

```env
DB_HOST=your-postgres-host
DB_PORT=5432
DB_NAME=success_diary
DB_USER=your-db-user
DB_PASSWORD=your-db-password
JWT_SECRET=replace-with-a-long-random-secret
TURNSTILE_SITE_KEY=your-cloudflare-turnstile-site-key
TURNSTILE_SECRET_KEY=your-cloudflare-turnstile-secret-key
```

### 2. 使用 Docker Compose 启动

```bash
docker compose up -d --build
```

默认访问地址为 `http://localhost:3800`。如需修改宿主机端口，可以设置 `APP_PORT`。

### 3. 本地开发

直接运行后端服务：

```bash
cd server
npm install
npm run dev
```

Express 服务会从 `public/` 提供静态前端，并在 `/api` 下暴露接口。

## API 概览

大多数接口需要携带：

```http
Authorization: Bearer <token>
```

公开接口：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 |
| GET | `/api/config` | 读取公开运行配置 |
| GET | `/s/:code` | 公开分享页面 |

登录后接口：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/auth/me` | 当前用户资料 |
| PATCH | `/api/auth/profile` | 更新昵称或主题 |
| PATCH | `/api/auth/password` | 修改密码 |
| GET | `/api/entries/:date` | 读取某日记录 |
| PUT | `/api/entries/:date` | 保存某日记录 |
| GET | `/api/entries/month/:yearMonth` | 读取某月已记录日期 |
| GET/POST | `/api/dreams` | 列出或创建梦想 |
| PATCH | `/api/dreams/:id` | 更新梦想 |
| DELETE | `/api/dreams/:id` | 删除梦想 |
| GET | `/api/savings` | 列出存钱罐记录 |
| POST | `/api/savings` | 新增存入或支出 |
| GET | `/api/stats` | 读取综合统计 |
| GET | `/api/achievements` | 读取成就 |
| POST | `/api/shares` | 创建分享链接 |
| GET | `/api/shares/stats` | 读取分享统计 |

## 安全说明

- 密码使用 bcrypt 哈希存储
- JWT 签名密钥必须通过环境变量配置
- 注册使用 Cloudflare Turnstile，并在服务端校验
- 请求体使用 Zod 校验
- 面向用户展示的内容会在渲染前转义
- Helmet 配置安全响应头和 CSP
- API 和认证接口使用限流
- 存钱罐支出使用数据库事务和 advisory lock 控制并发

## 项目结构

```text
Success_diary/
├── public/
│   ├── index.html
│   ├── admin.html
│   ├── js/
│   └── styles/
├── server/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js
│       ├── db.js
│       ├── settings.js
│       ├── validators.js
│       ├── middleware/
│       └── routes/
├── docker-compose.yml
├── docker-compose.local.yml
└── README.md
```

## 开源协议

MIT
