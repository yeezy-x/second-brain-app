# Second Brain (Brainly)

A personal knowledge-capture web application. Save tweets, videos, documents, and links in one place — tag them, search them, and share a read-only collection with the world.

**Live dev URLs (default)**

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3001 |
| Health check | http://localhost:3001/health |

---

## Features

- **Multi-format capture** — Save content as tweets, videos, documents, or links with title, description, and URL.
- **Smart metadata** — URLs are enriched asynchronously (Open Graph / HTML title) via a BullMQ background worker.
- **Tagging & filtering** — User-scoped tags; filter the dashboard by type, tag, or full-text search with cursor-based pagination.
- **Public sharing** — Generate a nanoid share link that exposes your full collection read-only, without authentication.
- **Admin panel** — Administrators can list users, inspect content, delete content/tags globally, and disable shares.
- **Secure auth** — JWT access + refresh tokens in HTTP-only cookies, with optional `Authorization: Bearer` support.

---

## Tech Stack

### Backend (`backend/`)

| Layer | Technology |
|-------|------------|
| Runtime | Node.js |
| Framework | Express 5 |
| Language | TypeScript |
| ORM | Prisma 6 |
| Database | PostgreSQL (Neon-compatible) |
| Cache / rate limiting | Redis (ioredis) |
| Job queue | BullMQ |
| Auth | jsonwebtoken + bcrypt |
| Validation | Zod |
| Logging | Pino |

### Frontend (`frontend/`)

| Layer | Technology |
|-------|------------|
| UI | React 19 |
| Bundler | Vite 8 |
| Routing | React Router 7 |
| Server state | TanStack Query |
| Client state | Zustand |
| Forms | React Hook Form + Zod |
| Styling | Tailwind CSS 4 |
| Components | Radix UI (shadcn-style) |

---

## Architecture

```
┌─────────────────┐     /api/* proxy      ┌──────────────────┐
│  React SPA      │ ────────────────────► │  Express API     │
│  (Vite :5173)   │                       │  (:3001)         │
└─────────────────┘                       └────────┬─────────┘
                                                   │
                    ┌──────────────────────────────┼──────────────────────────────┐
                    │                              │                              │
              ┌─────▼─────┐                 ┌──────▼──────┐               ┌──────▼──────┐
              │ PostgreSQL │                 │    Redis    │               │  BullMQ     │
              │  (Neon)    │                 │  (cache +   │               │  Worker     │
              └───────────┘                 │  rate limit)│               │  (metadata) │
                                            └─────────────┘               └─────────────┘
```

The backend is a **modular monolith** with feature modules (`auth`, `content`, `tag`, `share`, `admin`). Async metadata extraction runs in a **separate worker process** that shares the same Postgres and Redis instances.

The frontend is a **feature-sliced SPA** with colocated API clients, hooks, and pages under `src/features/`.

---

## Project Structure

```
brainly/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   ├── src/
│   │   ├── config/             # env, db, redis
│   │   ├── core/               # logger
│   │   ├── jobs/               # BullMQ queue + metadata worker
│   │   ├── middlewares/        # auth, rate limit, validation, errors
│   │   ├── modules/            # auth, content, tag, share, admin
│   │   ├── utils/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/                # providers, error boundary
│   │   ├── components/         # shared UI + layout
│   │   ├── features/           # auth, content, tags, share, admin
│   │   ├── pages/              # landing, 404
│   │   ├── routes/             # router + route guards
│   │   └── store/              # auth store (zustand)
│   ├── .env                    # BACKEND_PROXY_TARGET
│   └── package.json
└── README.md
```

---

## Prerequisites

- **Node.js** 20+ (tested on Node 24)
- **npm** 10+
- **PostgreSQL** — [Neon](https://neon.tech) recommended for hosted dev/prod
- **Redis** — local (`redis-server`) or hosted (Upstash, etc.)

---

## Getting Started

### 1. Clone and install dependencies

```bash
git clone <repo-url> brainly
cd brainly

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure the backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=3001
DATABASE_URL=postgresql://USER:PASSWORD@HOST/neondb?sslmode=require&pgbouncer=true
DIRECT_URL=postgresql://USER:PASSWORD@HOST/neondb?sslmode=require
JWT_ACCESS_SECRET=your_access_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars
REDIS_URL=redis://127.0.0.1:6379
FRONTEND_ORIGIN=http://localhost:5173
COOKIE_SECURE=false
NODE_ENV=development
```

| Variable | Description |
|----------|-------------|
| `PORT` | API server port (default `3001`; use `3001` if port `3000` is taken) |
| `DATABASE_URL` | Pooled Postgres connection (Neon pooler / PgBouncer) |
| `DIRECT_URL` | Direct Postgres connection for Prisma migrations |
| `JWT_ACCESS_SECRET` | Secret for 15-minute access tokens |
| `JWT_REFRESH_SECRET` | Secret for 7-day refresh tokens |
| `REDIS_URL` | `redis://` for local, `rediss://` for TLS (Upstash) |
| `FRONTEND_ORIGIN` | CORS origin — must match the Vite dev server |
| `COOKIE_SECURE` | Set `true` in production behind HTTPS |

### 3. Configure the frontend

Create `frontend/.env`:

```env
BACKEND_PROXY_TARGET=http://localhost:3001
```

Vite proxies all `/api` requests to this target during development.

### 4. Set up the database

```bash
cd backend
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to Postgres
```

### 5. Start Redis (if running locally)

```bash
redis-server
# or on Linux with systemd:
sudo systemctl start redis
```

Verify: `redis-cli ping` → `PONG`

### 6. Run the application

You need **three terminal sessions**:

```bash
# Terminal 1 — API server
cd backend
npm run dev

# Terminal 2 — metadata worker (required for URL enrichment)
cd backend
npm run worker

# Terminal 3 — frontend
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Routes (Frontend)

| Path | Access | Description |
|------|--------|-------------|
| `/` | Public | Landing page |
| `/login` | Public | Sign in |
| `/signup` | Public | Create account |
| `/dashboard` | Authenticated | Main content library |
| `/admin` | Admin only | User/content management |
| `/share/:shareId` | Public | Read-only shared collection |

---

## API Reference

Base URL: `http://localhost:3001/api/v1`

All authenticated endpoints accept cookies (default) or `Authorization: Bearer <access_token>`.

### Auth — `/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/signup` | — | Register a new user |
| `POST` | `/login` | — | Sign in (sets cookies) |
| `POST` | `/refresh-token` | Cookie | Rotate access token |
| `POST` | `/logout` | — | Clear session cookies |
| `GET` | `/me` | ✓ | Get current user |

### Content — `/content`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/` | ✓ | Create content item |
| `GET` | `/` | ✓ | List content (filter by `type`, `tag`, `search`; cursor pagination) |
| `DELETE` | `/:id` | ✓ | Delete content item |

### Tags — `/tags`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/` | ✓ | Create a tag |
| `GET` | `/` | ✓ | List user's tags |

### Share — `/share`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/` | ✓ | Create or regenerate share link |
| `GET` | `/:shareId` | — | Get public shared collection |
| `PATCH` | `/:shareId/disable` | ✓ | Disable share link |

### Admin — `/admin`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/users` | Admin | List all users |
| `GET` | `/users/:userId/content` | Admin | Get a user's content |
| `DELETE` | `/content/:id` | Admin | Delete any content |
| `DELETE` | `/tags/:id` | Admin | Delete any tag |
| `PATCH` | `/shares/:shareId/disable` | Admin | Disable any share |

### Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Server uptime check |

---

## Database Schema

| Model | Purpose |
|-------|---------|
| `User` | Account with email, hashed password, role (`USER` / `ADMIN`) |
| `Content` | Saved item with type, title, description, URL, metadata JSON |
| `Tag` | User-scoped tag name |
| `ContentTag` | Many-to-many join between content and tags |
| `Share` | Public share link (`shareId` nanoid) per user |

Content types: `tweet` · `video` · `document` · `link`

Metadata statuses: `pending` · `done` · `failed` · `fallback`

---

## Background Jobs

When content with a URL is created, a **metadata job** is enqueued in BullMQ. The worker (`npm run worker`) fetches the remote page, extracts Open Graph / title data via Cheerio, and updates the content record.

The worker must be running for URL enrichment to work. Without it, content is still saved — metadata stays `pending`.

---

## Production Build

### Backend

```bash
cd backend
npm run build        # compiles to dist/
npm start            # runs dist/server.js
npm run worker       # run worker separately (use a process manager)
```

### Frontend

```bash
cd frontend
npm run build        # outputs to frontend/dist/
npm run preview      # local preview of production build
```

Serve `frontend/dist` as static files and point `/api` to your backend, or configure your reverse proxy accordingly.

---

## Scripts Reference

### Backend

| Script | Description |
|--------|-------------|
| `npm run dev` | Start API with hot reload (tsx watch) |
| `npm run worker` | Start metadata worker |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled server |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Prisma Studio GUI |

### Frontend

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## Troubleshooting

### Port 3000 already in use

Another process may be occupying port 3000. Set `PORT=3001` in `backend/.env` and `BACKEND_PROXY_TARGET=http://localhost:3001` in `frontend/.env`.

### Redis connection errors

- **Local Redis**: use `REDIS_URL=redis://127.0.0.1:6379` (no TLS).
- **Upstash / hosted**: use `rediss://` — TLS is enabled automatically when the URL scheme is `rediss://`.
- Verify Redis is running: `redis-cli ping`.

### Frontend can't reach the API

Ensure the backend is running and `BACKEND_PROXY_TARGET` in `frontend/.env` matches the backend port. The Vite dev server must be restarted after changing `.env`.

### Database connection fails

- Confirm `DATABASE_URL` and `DIRECT_URL` are correct.
- For Neon: use the pooled URL for `DATABASE_URL` and the direct URL for `DIRECT_URL`.
- Run `npm run db:push` after changing the schema.

### Metadata not updating

Make sure the worker is running (`npm run worker` in `backend/`). Check worker logs for fetch or parsing errors.

---

## License

ISC
