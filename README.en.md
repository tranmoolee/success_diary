# Success Diary

[Chinese README](./README.md)

Success Diary is a lightweight web app for recording daily wins, tracking personal dreams, and reviewing growth through streaks, stats, and shareable cards.

## Features

- Daily success entries with multiple rows and category tags
- Dream savings jar for tracking goals and money movement
- Growth dashboard with streaks, totals, trends, and category stats
- Share cards generated in the browser with QR codes
- Multi-user support with JWT authentication
- Cloudflare Turnstile protection for registration
- Admin entry point for basic operational settings
- Vanilla HTML, CSS, and JavaScript frontend served by an Express API

## Tech Stack

- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Node.js, Express
- Database: PostgreSQL
- Security: Helmet CSP, bcrypt, Zod validation, rate limiting
- Deployment: Docker Compose

## Quick Start

### 1. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set the required database, JWT, and Turnstile values.

At minimum, production deployments must provide:

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

### 2. Start with Docker Compose

```bash
docker compose up -d --build
```

The app listens on `http://localhost:3800` by default. Set `APP_PORT` if you need another host port.

### 3. Local Development

Run the API directly:

```bash
cd server
npm install
npm run dev
```

The Express server serves the static frontend from `public/` and exposes API routes under `/api`.

## API Overview

Most API endpoints require:

```http
Authorization: Bearer <token>
```

Public endpoints:

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Log in |
| GET | `/api/config` | Read public runtime config |
| GET | `/s/:code` | Public share page |

Authenticated endpoints:

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/auth/me` | Current user profile |
| PATCH | `/api/auth/profile` | Update display name or theme |
| PATCH | `/api/auth/password` | Change password |
| GET | `/api/entries/:date` | Read entries for a date |
| PUT | `/api/entries/:date` | Save entries for a date |
| GET | `/api/entries/month/:yearMonth` | Read recorded days in a month |
| GET/POST | `/api/dreams` | List or create dreams |
| PATCH | `/api/dreams/:id` | Update a dream |
| DELETE | `/api/dreams/:id` | Delete a dream |
| GET | `/api/savings` | List savings records |
| POST | `/api/savings` | Add deposit or withdrawal |
| GET | `/api/stats` | Read aggregate stats |
| GET | `/api/achievements` | Read achievements |
| POST | `/api/shares` | Create a share link |
| GET | `/api/shares/stats` | Read share stats |

## Security Notes

- Passwords are hashed with bcrypt.
- JWT signing requires a configured secret.
- Registration uses Cloudflare Turnstile and server-side verification.
- Request payloads are validated with Zod.
- User-facing content is escaped before rendering.
- Helmet configures security headers and CSP.
- API and auth routes use rate limiting.
- Savings withdrawals use database transactions and advisory locks.

## Project Structure

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

## License

MIT
