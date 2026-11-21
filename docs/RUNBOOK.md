# Runbook — JS Flow Visualizer

Operational reference for provisioning, rotating, revoking, deploying and rolling back
the services behind the deployed demo. Read [`INSTALLATION.md`](./INSTALLATION.md) for
local fail-fast gates first; this document covers what happens **after** a developer
has a working checkout.

> **Status (Phase 0):** all dashboard URLs below are placeholders. The human owner of
> Task 0 (`docs/BUILD_LIST.md` §5.7) must fill them in and complete the credential
> rotation before the Phase 0 gate can be declared green. No real credential belongs
> in this file or in any `.env.example`.

## Service inventory

| Service             | Purpose                              | Dashboard URL (fill in)   | Credential stored in      |
| ------------------- | ------------------------------------ | ------------------------- | ------------------------- |
| MongoDB Atlas       | Primary database (prod + shared dev) | `<ATLAS_DASHBOARD_URL>`   | `MONGO_URI`               |
| Vercel — web        | React app, SSR + static pages        | `<VERCEL_WEB_URL>`        | Vercel dashboard env vars |
| Vercel — api        | Fastify/Express API, serverless      | `<VERCEL_API_URL>`        | Vercel dashboard env vars |
| Upstash Redis       | Shared rate-limit store (Phase 4+)   | `<UPSTASH_URL>`           | `REDIS_URL`               |
| Anthropic           | AI tutor (Phase 6+)                  | `<ANTHROPIC_CONSOLE_URL>` | `ANTHROPIC_API_KEY`       |
| Sentry              | Error tracking, both apps            | `<SENTRY_URL>`            | `SENTRY_DSN`              |
| Plausible / PostHog | Funnel analytics (Phase 7)           | `<ANALYTICS_URL>`         | client-side site id       |
| Uptime monitor      | Pings `/api/health/ready`            | `<UPTIME_URL>`            | monitor URL only          |

The uptime monitor target is `https://<api-domain>/api/health/ready`. Liveness is
`GET /api/health`; readiness is `GET /api/health/ready` (pings MongoDB). A red readiness
check means the app may still render from cache but cannot save or authenticate — treat
it as an incident.

## Provisioning

1. **Atlas** — create the cluster and a database user with the least privilege needed
   (`readWrite` on the app database). Copy the connection string into `MONGO_URI`.
   Never reuse the credential revoked in Task 0.
2. **Vercel** — create one project per app. Set Root Directory to `apps/web` and
   `apps/api` respectively after Phase 1 moves the apps. Fill env vars per environment
   (production, preview, development); preview and production must not share secrets
   that would let a PR write production data.
3. **Upstash** — create a Redis database in the same region as the API; copy the URL
   into `REDIS_URL` (consumed from Phase 4).
4. **Anthropic** — create an API key with a spend cap; store it only in the API's
   environment. The key must never reach the browser.
5. **Sentry** — create one project per app; copy each DSN. Upload source maps in the
   deploy pipeline once Phase 7 lands.
6. **Plausible / PostHog** — add the site; record the public site id (not a secret).
7. **Uptime** — add a 60-second HTTP monitor on `/api/health/ready` with an alert
   channel the owner actually reads.

After provisioning every service, run **G7** (`node scripts/check-env.mjs` with the
variables exported) and **G12** (deploy health) from `docs/INSTALLATION.md` before
starting feature work. Both must pass locally and on a Vercel preview deploy.

## Rotation and revocation

| Secret                 | Rotate by                                                                                                                   | Invalidates                                                 | Revoke by                                               |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------- |
| Atlas DB user password | Create a **new** DB user on the **same** cluster, update `MONGO_URI` everywhere, verify, then delete the old user           | Old connections only — data and cluster are preserved (D13) | Delete the old DB user in Atlas                         |
| `JWT_SECRET`           | Generate 32+ random bytes (`openssl rand -hex 32`), set in every environment                                                | **All** previously issued access tokens — intended          | Overwrite the old value; no token can be forged with it |
| Refresh-token families | `PATCH` the user's status to `banned` or revoke the family record (Phase 4)                                                 | All refresh tokens in that family                           | Mark `revokedAt` on the `RefreshToken` documents        |
| `CSRF_SECRET`          | Generate a new independent 32+ char value                                                                                   | Outstanding CSRF cookies                                    | Update every environment together                       |
| `REDIS_URL`            | Create a new Upstash database, update env, verify rate limits, delete the old database                                      | Rate-limit counters (reset is acceptable)                   | Delete old database                                     |
| `ANTHROPIC_API_KEY`    | Create a new key, update API env, verify the tutor, then revoke the old key                                                 | In-flight tutor requests only                               | Revoke in the Anthropic console                         |
| `SENTRY_DSN`           | Recreate the project key if exposed; update env                                                                             | Event ingestion from old builds                             | Revoke the DSN key in Sentry                            |
| Seed admin password    | Set a new `SEED_ADMIN_PASSWORD`, re-run `pnpm seed` **after** clearing the old hash (Phase 4 owns the proper rotation path) | Local/admin login with the old password                     | Replace the stored `passwordHash`                       |

Rules: rotate in the same order everywhere (local `.env` → Vercel preview → Vercel
production), verify the app boots after each step, and never commit a filled env file.
The cluster **host** does not change on rotation — the revoked credential is the DB
user, so `backend/config/env.js` deliberately matches the user marker, not the host.

## Task 0 — credential incident response (human-owned)

The leaked `backend/.env` was public from the initial commit. Rotation alone is not
enough; follow §5.7 of the build list in order:

1. Confirm **preserve data** (Q1/D13 — confirmed by the owner 2026-11-21).
2. Create a new Atlas DB user, update `MONGO_URI` locally and in every Vercel
   environment, verify the connection, then **delete the old DB user**.
3. Audit Atlas access logs for unexpected connections, collections, users or data.
   Assume the database was read. Record the findings here.
4. Rotate `JWT_SECRET` — every old token becomes forgeable otherwise.
5. Purge history with `git filter-repo --path backend/.env --invert-paths`, force-push,
   then verify `git log --all -p | Select-String "MONGO_URI"` is empty. Do this
   **before** branch protection is enabled.
6. Delete the backdoor-created `admin@jsflow.local` user; the admin comes from
   `pnpm seed` (see `scripts/seed.ts`) using `SEED_ADMIN_*` env vars.
7. Rotate any other credential ever committed. Delete the stale local `backend/.env`
   once the new one is in place.

Local convenience: `docker compose up -d` starts `mongo:7`, then export `MONGO_URI`,
`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` (and optionally `SEED_ADMIN_NAME`) and run
`pnpm seed`. The seed is idempotent: natural keys plus `$setOnInsert` mean a second
run inserts nothing. Verify with `pnpm test:seed`.

## Rollback

1. **Deploy** — in Vercel, open the deployment and choose "Promote to Production"
   on the last known-good deployment. Do not re-run a migration as a rollback.
2. **Schema/data** — Phase 0 changes no production data besides the deliberate admin
   cleanup. Later migrations must be forward-only and reversible by restoring an
   Atlas snapshot; take a snapshot before any migration.
3. **Secret** — if a rotated secret breaks the deploy, restore the previous value
   from the password manager (never from git), redeploy, then investigate. Never
   restore a credential that Task 0 revoked.
4. **Verify** — after rollback, `GET /api/health/ready` must be green and the uptime
   monitor must recover. Record the incident in `docs/CASE_STUDY.md` only when it is
   safe to disclose.

## Health checks and gates

- Local: `node scripts/check-env.mjs` (**G7** — hard stop on missing/placeholder env),
  `node scripts/check-env.regression.mjs`, `node scripts/check-docs.mjs`.
- Boot: `GET /api/health` (liveness), `GET /api/health/ready` (MongoDB ping).
- CI: `pnpm lint && pnpm typecheck && pnpm test && pnpm test:seed && pnpm build`
  on Node 22 and 24; branch protection requires all of them plus one review.
- Deploy: **G12** — a preview deploy must boot and serve `/api/health/ready` before
  merging to `main`.
