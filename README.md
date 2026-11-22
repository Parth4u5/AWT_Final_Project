# JS Flow Visualizer

[![CI](https://github.com/Parth4u5/AWT_Final_Project/actions/workflows/ci.yml/badge.svg)](https://github.com/Parth4u5/AWT_Final_Project/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

A learning tool that aims to show JavaScript code executing step by step — the call stack, scope, and
control flow rendered as a live graph you can scrub, step, and break on.

> **Status: Phase 0 agent work is complete; the engine lands in Phase 2.** Tasks 1, 9 and 10 are complete:
> the monorepo scaffold, pinned toolchain, CI, documentation, ignore rules, Docker Compose and idempotent
> seed are all committed. The Phase 0 gate stays red on the human-owned credential rotation (Task 0 —
> git history still contains the leaked URI) and on live Mongo checks that require Docker; see
> [docs/RUNBOOK.md](./docs/RUNBOOK.md). The visualizer engine is **not built yet** — see
> [What works today](#what-works-today) before you form an opinion about the product.

## What works today

Be honest about the current state: this is a foundation, not a finished product.

| Capability                            | Today                                             | Lands in       |
| ------------------------------------- | ------------------------------------------------- | -------------- |
| Monorepo, pinned toolchain, CI        | ✅ Lint, typecheck, test, build on Node 22 & 24   | Phase 0 (done) |
| Local MongoDB + seed                  | ✅ Present, unit-tested (live check needs Docker) | Phase 0 (done) |
| Step-by-step execution                | ❌ Not implemented                                | Phase 2        |
| Loops and conditions                  | ❌ Not implemented                                | Phase 2        |
| Function call tracking / call stack   | ❌ Not implemented                                | Phase 2        |
| Scopes, closures, replay, breakpoints | ❌ Not implemented                                | Phase 2        |
| CodeMirror editor + flow graph        | ❌ Not implemented                                | Phase 3        |
| Accounts, saved sessions, sharing     | ❌ Not implemented                                | Phases 4–5     |
| AI tutor                              | ❌ Not implemented                                | Phase 6        |

The pre-existing UI shell advertised loops, conditions, and function-call tracking, but those claims were
never true — the old "engine" was a regex line-splitter. They are listed above as targets, not features.

## Roadmap

| Phase | Name                      | Length     | Ships                                  |
| ----- | ------------------------- | ---------- | -------------------------------------- |
| 0     | Setup & Foundation        | ~1 week    | Agent tasks done; human Task 0 pending |
| 1     | TypeScript Migration      | ~1 week    | The existing app, fully typed          |
| 2     | The Engine                | ~3 weeks   | The app finally works                  |
| 3     | UI/UX Rebuild             | ~2 weeks   | A polished, accessible visualizer      |
| 4     | Backend v2                | ~1.5 weeks | Secure auth, real data model           |
| 5     | Product Depth             | ~2 weeks   | Challenges, XP, sessions, admin        |
| 6     | The AI Tutor              | ~5 days    | AI explanations of any step            |
| 7     | Portfolio Polish & Launch | ~1.5 weeks | Deploy-ready portfolio piece           |

## Getting started (about five minutes)

The full, fail-fast walkthrough lives in **[docs/INSTALLATION.md](./docs/INSTALLATION.md)**. The short
version:

```powershell
# 1. Prerequisites: Node 22 LTS (.nvmrc), pnpm via corepack, Docker
corepack enable
git clone https://github.com/Parth4u5/AWT_Final_Project.git
cd AWT_Final_Project

# 2. Install from the repository root (never inside a package)
pnpm install --frozen-lockfile

# 3. Copy the CURRENT examples to .env in their current directories and fill in
#    real values (see the environment table below and INSTALLATION.md §9):
#      backend/.env.example -> backend/.env   (API)
#      JsFlow/.env.example  -> JsFlow/.env    (web)
#    Phase 1 task 1.2 moves both into apps/api and apps/web via git mv.

# 4. Start MongoDB and seed it. The seed is idempotent — a second run inserts
#    nothing (verified by `pnpm test:seed`). Export SEED_ADMIN_EMAIL and
#    SEED_ADMIN_PASSWORD first; see docs/RUNBOOK.md.
docker compose up -d
pnpm seed

# 5. Run the web app and API together
pnpm dev
```

If any gate fails, **stop and fix it** — INSTALLATION.md documents every threshold and its remedy.

### Environment variables

| Variable            | Required  | Rule                                                         |
| ------------------- | --------- | ------------------------------------------------------------ |
| `MONGO_URI`         | Always    | Must use the rotated Atlas user; never the leaked credential |
| `JWT_SECRET`        | Always    | ≥ 32 random characters; never `dev_secret_change_me`         |
| `CSRF_SECRET`       | Always    | ≥ 32 random characters; distinct from `JWT_SECRET`           |
| `ALLOWED_ORIGINS`   | Always    | Explicit comma-separated list; `*` is forbidden              |
| `REDIS_URL`         | Phases 4+ | Shared store; in-memory rate limits are bypassable           |
| `ANTHROPIC_API_KEY` | Phase 6+  | Warning if absent — the tutor hides, visualizer still works  |
| `SENTRY_DSN`        | Deploy    | Warning if absent locally                                    |
| `PORT`              | API       | Defaults to `5000`                                           |

The API fails fast at boot on a missing or placeholder secret. Never commit a `.env` file.

## Architecture

The target is a pnpm/Turborepo monorepo: `apps/web` (React 19), `apps/api` (Fastify 5), `packages/engine`
(a pure TypeScript interpreter that runs in a Web Worker and on the server), and `packages/shared` (Zod
schemas that define the client/server contract once).

For the full picture — request flows, the Run pipeline, auth, and deployment — read the
**[System Flow Guide](./docs/SYSTEM_FLOW.md)**. The build order and rationale are in
**[docs/BUILD_LIST.md](./docs/BUILD_LIST.md)**.

## Documentation

- [BUILD_LIST.md](./docs/BUILD_LIST.md) — the specification and phase plan
- [SYSTEM_FLOW.md](./docs/SYSTEM_FLOW.md) — architecture and runtime flows
- [INSTALLATION.md](./docs/INSTALLATION.md) — fail-fast setup checklist
- [ADRs](./docs/adr/) — architecture decision records (001–006)
- [CASE_STUDY.md](./docs/CASE_STUDY.md) — the written project write-up, built alongside the code

## License

[MIT](./LICENSE) © 2026 Parth Thanki.
