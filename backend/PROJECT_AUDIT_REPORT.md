# Brainly (Second Brain) — Technical Audit & Architectural Review

**Audit date:** 2026-08-02 

**Repository layout:** `backend/` (Node/Express API) + `frontend/` (React SPA) — no root monorepo orchestrator  
**Recent major changes:** MongoDB/Mongoose → Neon Postgres + Prisma; cookie-based JWT sessions; audit remediation (tags contract, share recreate, cache versioning, auth signup/logout hardening, dead-dep cleanup)

---

### 1. Executive Summary & Tech Stack Inventory

#### High-level overview

**Brainly** (UI brand: **“Second Brain”**) is a personal knowledge-capture web app. Authenticated users save **tweets, videos, documents, and links** with titles, optional descriptions, URLs, and per-user tags. The dashboard filters by type, tag, and search, with cursor pagination.

The backend persists in **PostgreSQL (Neon via Prisma)**, uses **Redis** for cache + rate limits + **BullMQ** job broker, and runs a separate **metadata worker** that scrapes Open Graph / HTML for URL-bearing content. Users can publish a **public read-only share link**. **Admins** can list users, inspect content, delete content/tags, and disable shares.

Auth uses **JWT access + refresh** in **HTTP-only cookies** (optional `Authorization: Bearer`). The frontend is a **Vite + React 19 SPA** calling `/api/v1/`* with `withCredentials`.

#### Tech stack inventory


| Layer                         | Technology                                       | Version (declared)                | Role                                    |
| ----------------------------- | ------------------------------------------------ | --------------------------------- | --------------------------------------- |
| **Runtime**                   | Node.js                                          | (tooling)                         | API, worker, build                      |
| **API**                       | Express                                          | ^5.2.1                            | HTTP + middleware                       |
| **Language**                  | TypeScript                                       | ^6.0.x (BE), ~6.0.2 (FE)          | End-to-end typing                       |
| **ORM**                       | Prisma                                           | ^6.19.3                           | Schema + queries                        |
| **Database**                  | PostgreSQL (Neon)                                | via `DATABASE_URL` / `DIRECT_URL` | Primary store                           |
| **Cache / RL / queue broker** | Redis (ioredis)                                  | ^5.10.1                           | Lists, tags, share, rate limits, BullMQ |
| **Jobs**                      | BullMQ                                           | ^5.76.2                           | Async URL metadata                      |
| **Auth**                      | jsonwebtoken + bcrypt + cookie-parser            | ^9 / ^6 / ^1.4.7                  | Cookie JWTs; refresh hashed in DB       |
| **Validation**                | Zod                                              | ^4.3.6 (BE), ^4.4.3 (FE)          | Request + form schemas                  |
| **Metadata scrape**           | axios + cheerio                                  | ^1.14 / ^1.2                      | OG/title extraction                     |
| **Security / CORS**           | helmet + cors                                    | ^8.1 / ^2.8                       | Headers; origin allowlist + credentials |
| **Logging**                   | pino, morgan, pino-pretty                        | various                           | Structured + HTTP logs                  |
| **IDs**                       | nanoid                                           | ^5.1.7                            | Public `shareId`                        |
| **UI**                        | React 19, Vite 8, RR7                            | —                                 | SPA                                     |
| **Server state**              | TanStack Query 5                                 | ^5.100.11                         | Lists/mutations                         |
| **Client auth state**         | Zustand 5                                        | ^5.0.13                           | User + hydration (no token storage)     |
| **Forms / UI kit**            | RHF, Zod, Radix, Tailwind 4, CVA, lucide, sonner | —                                 | Forms + shell                           |


**Removed since prior audit:** backend `mongoose`, `nano`, `redis` (node-redis), `uuid`, `express-rate-limit`; frontend `cmdk`, `framer-motion`, `react-markdown`, bogus `"root"` package, react-query-devtools.

**Not present:** Docker/K8s, CI, root README/dev orchestrator, automated tests, i18n, email, object storage, WebSockets, GraphQL.

---

### 2. Architectural & Design Patterns

#### Core architecture

**Modular monolith (layered backend) + feature-sliced frontend SPA + separate worker process.**

- **Backend modules:** `auth`, `content`, `tag`, `share`, `admin`, `user` (repository for User only).
- **Two processes:** API (`npm run dev` / `start`) and worker (`npm run worker` → `metadata.worker.ts`).
- **Frontend features:** `auth`, `content`, `tags`, `share`, `admin` under `src/features/`*.

#### Design patterns (selected)


| Pattern                    | Where                                                  |
| -------------------------- | ------------------------------------------------------ |
| Module / feature folders   | `backend/src/modules/*`, `frontend/src/features/*`     |
| Partial repository         | `user.repository.ts` only                              |
| Service layer              | `*.service.ts`                                         |
| Zod edge validation        | Content middleware; `validate()` elsewhere             |
| Middleware pipeline        | `app.ts`                                               |
| Rate-limiter factory       | `createRateLimiter`                                    |
| Cache-aside + version bump | `content.service.ts` (`version:<userId>` in list keys) |
| Producer–consumer          | BullMQ `metadata` queue                                |
| Idempotent jobs            | `jobId = sha256(userId:url)`                           |
| Axios refresh queue        | `api-client.ts` single-flight on 401                   |
| Route guards               | `ProtectedRoute`, `PublicOnlyRoute`, `AdminRoute`      |
| Optimistic updates         | `useCreateContent.ts`                                  |


#### Separation of concerns

**Strengths**

- Versioned `/api/v1` API and consistent `ApiResponse` envelope.
- Cookie session model aligned FE ↔ BE (`withCredentials`, `/auth/me` hydration).
- Content tags returned as `{ id, name }[]` — FE types match.
- Worker isolates slow network I/O from request path.
- Conditional Redis TLS via `getRedisOptions()` (`rediss://` only).

**Weaknesses**

- User-only repository; other domains inline Prisma.
- Dual `_id` + `id` mapping for Mongo-era client compat.
- `getTag` controller still unwired; `ShareVisibility` / `expiresAt` unused by create API.
- FE/BE Zod schemas duplicated (no shared package).
- `api:unauthorized` listener in `QueryProvider` never dispatched.

**Modularity (subjective):** Backend ~7.5/10, Frontend ~8/10 for a learning/small-team codebase.

---

### 3. System Flows & Lifecycle Mapping

#### Create content (authenticated)

```
CreateContentDialog (RHF + Zod)
  → POST /api/v1/content (+ sb_access cookie)
  → authMiddleware → validateBody
  → Prisma transaction: tag upserts + Content + ContentTag
  → bumpContentVersion(userId)
  → if url: metadataQueue.add("process-metadata", { contentId, url })
  → 201 mapped content
  → FE optimistic list patch + invalidate queries
```

**Worker (separate process):**

```
BullMQ Worker → processMetadata
  → extractMetadata(url) [axios + cheerio, 5s / 1MB]
  → update metadata + metadataStatus (done | fallback | failed)
```

Without `npm run worker`, content saves but metadata stays pending.

#### List / filter content

```
/dashboard → ContentList (?type &tag &search)
  → GET /api/v1/content
  → Cache-aside: content:{userId}:v{version}:{md5(params)} (skipped for search)
  → Cursor pagination base64 { createdAt, id }; tag filter via Redis tag:{userId}:{name}
  → { items, nextCursor }
```

#### Public share

```
Owner: POST /share → one Share per user; inactive → reactivate + new shareId
Visitor: GET /share/:shareId → Redis share:{shareId} → full library via getContentByUserId
```

`Share.visibility` defaults to `private` in schema but is **not enforced** on public GET — any active link is public.

#### Authentication & session lifecycle


| Step              | Behavior (current)                                                                                                                           |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Signup**        | Creates user, issues JWTs, hashes refresh in DB, **sets cookies**, returns safe `{ id, email, role }` — FE auto-sessions (no separate login) |
| **Login**         | Same cookie + safe user DTO                                                                                                                  |
| **Cookies**       | `sb_access` path `/`, 15m, sameSite lax; `sb_refresh` path `/api/v1/auth`, 7d, sameSite strict                                               |
| **Refresh**       | Public `POST /refresh-token` (cookie or body); **no access JWT required**                                                                    |
| **Protected API** | Cookie or Bearer → `req.user = { id, role }`                                                                                                 |
| **Hydrate**       | `useInitializeAuth` → `GET /auth/me`                                                                                                         |
| **Logout**        | Public route; resolves user from access **or** refresh; clears DB hash + cookies                                                             |
| **Admin**         | `requireRole(ADMIN)` on `/api/v1/admin/`*                                                                                                    |


JWT payload includes `role` (`USER` | `ADMIN`).

#### API surface (`/api/v1`)


| Area    | Endpoints                                              | Notes                             |
| ------- | ------------------------------------------------------ | --------------------------------- |
| Auth    | signup, login, refresh-token, logout, me               | me requires auth; logout does not |
| Content | POST /, GET /, DELETE /:id                             | No update                         |
| Tags    | POST /, GET /                                          | `getTag` unwired                  |
| Share   | POST /, GET /:shareId, PATCH /:shareId/disable         | Public GET                        |
| Admin   | users, user content, delete content/tag, disable share | ADMIN only                        |
| Health  | `GET /health`                                          | Unversioned                       |


#### Frontend routes


| Path                | Guard                |
| ------------------- | -------------------- |
| `/`                 | Landing (public)     |
| `/login`, `/signup` | PublicOnly           |
| `/dashboard`        | Protected + AppShell |
| `/admin`            | AdminRoute           |
| `/share/:shareId`   | Public               |
| `*`                 | 404                  |


#### Env (backend)

From `env.ts` + `.env.example`:

`PORT`, `DATABASE_URL`, `DIRECT_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `REDIS_URL`, `FRONTEND_ORIGIN`, `COOKIE_SECURE`, `NODE_ENV`

Frontend: `VITE_API_BASE_URL`, Vite `BACKEND_PROXY_TARGET`; `.env` gitignored.

---

### 4. Reverse-Engineered PRD

#### Personas


| Persona         | Role    | Capabilities                                                                                    |
| --------------- | ------- | ----------------------------------------------------------------------------------------------- |
| Registered user | `USER`  | Signup/login, content create/list/delete, tags via content, share create/disable, search/filter |
| Administrator   | `ADMIN` | Above + list users, view any content, delete any content/tag, disable any share                 |
| Anonymous       | —       | Landing; public share page if link active                                                       |


No orgs/teams; sharing is **full-collection public link** only.

#### Core features

1. **Auth** — Email/password; cookie session; refresh; logout; `/me`.
2. **Content library** — Four types; title required; URL required for link/video; ≤10 tags; cursor list; delete own.
3. **Tags** — Unique `(name, userId)`; list cached; create API exists (UI mainly from content form).
4. **Search** — ILIKE on title/description; no cursor with search.
5. **Metadata jobs** — Background OG scrape; statuses pending/done/failed/fallback.
6. **Sharing** — One share row per user; reactivate after disable; public feed.
7. **Admin console** — `/admin` UI + `/api/v1/admin`.
8. **Shell** — Sidebar/topbar, landing page, empty/error/loading, toasts.

#### Business rules (encoded)

- Password min 6; generic login errors; refresh rotation with bcrypt-stored hash.
- Content validation as in Zod schemas; limit 1–50 (FE uses 20).
- Share: unique `userId`; inactive reactivated with new `shareId`; `expiresAt` checked if set but never written by API.
- Redis down: rate limiter fails open; caches fall back to DB; enqueue may fail.

#### Non-functional (as implemented)


| NFR           | Implementation                                                                      |
| ------------- | ----------------------------------------------------------------------------------- |
| Security      | Helmet, CORS origin, HTTP-only cookies, bcrypt, JWT secrets, 10kb JSON, trust proxy |
| Rate limit    | Global 100/15m; auth 100/hour (Redis INCR)                                          |
| Caching       | Content lists (~60–80s + version key), tags 300s, share 60s                         |
| Jobs          | 3 attempts, exponential backoff; concurrency 2                                      |
| Observability | Pino, morgan, request IDs                                                           |


**Gaps:** No CSRF beyond SameSite; SSRF risk on metadata fetch; no admin audit log; no automated tests; Redis must be healthy for jobs/enqueue.

---

### 5. Remediation status (vs prior audit)


| Prior issue                              | Status                                                      |
| ---------------------------------------- | ----------------------------------------------------------- |
| Refresh required access JWT              | **Fixed** — public `/refresh-token`                         |
| Signup leaked password hash / no cookies | **Fixed** — safe DTO + session cookies                      |
| Logout needed live access                | **Fixed** — access or refresh resolution                    |
| Tags FE `string[]` vs BE `{id,name}`     | **Fixed**                                                   |
| Share recreate after disable 500         | **Fixed** — reactivate + new `shareId`                      |
| Content cache not versioned in keys      | **Fixed** — `v{version}` in key                             |
| Dead deps (nano, uuid, cmdk, …)          | **Removed**                                                 |
| Missing `.env.example`                   | **Added** (`backend/.env.example`)                          |
| Redis TLS always on                      | **Improved** — TLS only for `rediss://` (`redisOptions.ts`) |
| FE `.env` not ignored                    | **Fixed**                                                   |


---

### 6. Remaining debt & roadmap

#### Still open

1. **SSRF** — Worker fetches arbitrary user URLs (`utils/metadata.ts`).
2. **Share schema drift** — `visibility` / `expiresAt` unused by create path.
3. **Rate limit fail-open** when Redis errors.
4. **Dead code** — unwired `getTag`; unused `api:unauthorized` listener.
5. **Public share loads full library** — no pagination.
6. **Search** — ILIKE only; no `tsvector`.
7. **Job dedupe** — same `userId:url` `jobId` can skip metadata for a second item.
8. **Graceful shutdown** — no Prisma/Redis/worker close on SIGTERM.
9. **No content update** on either side; description rarely shown on dashboard cards.
10. **No CI / tests / root DX** — no workspace README or unified `dev` script.
11. **k6 scripts** under `backend/src/testing/` — review for embedded tokens.
12. **Admin** — `deleteTag` API may lack full UI parity.

#### Suggested priority

**Critical:** Harden metadata fetch (https-only, block private IPs); ensure production `REDIS_URL` is valid.

**High:** Paginate public share; shared Zod package; graceful shutdown; wire or delete dead code; CSRF threat-model for cookie auth.

**Medium:** Full-text search; CI (`tsc`, lint, smoke tests); root README + concurrent FE/BE start; surface `metadataStatus` on cards.

**Low:** Drop dual `_id`/`id` once clients are clean; backend ESLint; admin audit log.

---

### 7. Redis / BullMQ mental model (current)


| Concern                        | Store                                          |
| ------------------------------ | ---------------------------------------------- |
| Users, content, tags, shares   | **Postgres**                                   |
| List/tag/share response copies | **Redis cache**                                |
| Request counts per IP          | **Redis RL keys** (`rl:global:`*, `rl:auth:*`) |
| “Scrape this URL later”        | **BullMQ on Redis** (`metadata` queue)         |
| Scrape + write metadata        | **Worker → Postgres**                          |


List invalidation: `INCR version:<userId>` so keys `content:{userId}:v{n}:…` miss after mutations.

---

## Appendix: Repository structure

```
brainly/
├── PROJECT_AUDIT_REPORT.md
├── backend/
│   ├── .env.example
│   ├── prisma/schema.prisma
│   └── src/
│       ├── app.ts, server.ts
│       ├── config/ (env, db, redis, redisOptions)
│       ├── core/logger.ts
│       ├── jobs/ (queue, worker, metadata.job)
│       ├── middlewares/
│       ├── modules/{auth,content,tag,share,admin,user}/
│       ├── testing/ (k6)
│       └── utils/
└── frontend/
    └── src/
        ├── app/
        ├── components/
        ├── features/{auth,content,tags,share,admin}/
        ├── lib/
        ├── pages/ (Landing, NotFound)
        ├── routes/
        └── store/auth-store.ts
```

**Local run**

```bash
cd backend && npm run dev      # API (default PORT from .env; example uses 3001)
cd backend && npm run worker   # metadata jobs
cd frontend && npm run dev     # Vite :5173
```

---

*End of report. Reflects codebase as of 2026-08-02.*