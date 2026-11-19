# JS Flow Visualizer — Installation & Fail-Fast Checklist

**Companion to:** [BUILD_LIST.md](./BUILD_LIST.md) and [SYSTEM_FLOW.md](./SYSTEM_FLOW.md) · **Status:** describes the *planned* setup from the build list; the monorepo does not exist yet.

This is not a normal install guide. It is a **threshold list**: every gate verifies one thing and **stops execution immediately** if that thing is missing, the wrong version, or misconfigured. A failure is meant to be loud and early — never a cryptic error three steps later.

**Rule:** never continue past a failed gate. Fix it, re-run the verify command, then move on.

---

## 0. How to read a gate

| Field | Meaning |
|---|---|
| **Requires** | The exact tool, library, or value needed |
| **Threshold** | The version floor or limit that is considered safe |
| **Verify** | The command that must pass before you continue |
| **Stops if** | The specific failure that blocks the build |
| **Fix** | What to do when it fails |

Two kinds of stop exist:

- **Hard stop** 🔴 — setup ends here. Continuing guarantees a broken build, leaked secret, or silent failure.
- **Warning** 🟡 — setup continues but the affected feature is disabled or degraded.

---

## 1. Gate map — the whole path at a glance

| Gate | Protects against | Type |
|---|---|---|
| G1 | Wrong OS shell, missing Git | Hard stop |
| G2 | Wrong Node version (the most common source of "works on my machine") | Hard stop |
| G3 | pnpm missing or wrong major | Hard stop |
| G4 | Docker / MongoDB unavailable | Hard stop |
| G5 | Committed secrets, tracked `node_modules`, admin backdoor | Hard stop |
| G6 | Installing in the wrong order → dependency version drift | Hard stop |
| G7 | Missing or placeholder environment variables | Hard stop |
| G8 | Database down or unseeded | Hard stop |
| G9 | Dev servers or `/api` proxy broken | Hard stop |
| G10 | Engine execution limit / sandbox escape | Hard stop at runtime |
| G11 | Quality gates below threshold | Hard stop in CI |
| G12 | Service credentials or deploy health wrong | Warning / Hard stop |

---

## 2. G1 — System prerequisites

**Requires:** 64-bit OS (Windows 10/11, macOS, or Linux), Git 2.40+, PowerShell 7+ recommended on Windows (or any POSIX shell).

**Threshold:** Git ≥ 2.40. Older Git mishandles the history-rewrite in G5.

**Verify:**

```powershell
git --version
$PSVersionTable.PSVersion.ToString()
```

**Stops if:** Git is older than 2.40, or no shell can run `pnpm` scripts. 🔴

**Fix:** install Git from git-scm.com; on Windows install PowerShell 7 and use `pwsh` instead of Windows PowerShell 5.1.

---

## 3. G2 — Node version (hard stop)

**Requires:** Node.js **22 LTS** (`.nvmrc` pins the exact patch). CI also tests Node 24.

**Threshold:** `>=22.0.0`. Anything below 22 is unsupported. A version above 22 but below 24 is untested.

**Verify:**

```powershell
node -v
```

Expected: `v22.x.x` locally. CI matrix: `22.x` and `24.x`.

**Stops if:** major version < 22, or the version does not match `.nvmrc`. 🔴

**Fix:**

```powershell
nvm install 22
nvm use 22
```

or install the current 22 LTS binary from nodejs.org.

**Why this is a gate:** Vite 8, Fastify 5, and React Router 7 framework mode rely on modern Node APIs. A 20.x runtime fails at build time with errors that look unrelated to Node.

---

## 4. G3 — pnpm via corepack (hard stop)

**Requires:** pnpm **10.x**, installed through Corepack so the version is reproducible from `packageManager` in `package.json`.

**Threshold:** `>=10.0.0 <11.0.0`. Do not install pnpm globally with npm — that bypasses Corepack pinning.

**Pinned version (2026-11-19):** Corepack resolves `pnpm@10` to `10.34.9` (the `latest-10` dist-tag). This is the exact patch pinned in the root `package.json` `packageManager` field (`pnpm@10.34.9`).

**Verify:**

```powershell
corepack enable
corepack prepare pnpm@10 --activate
pnpm -v
```

Expected: a `10.x.x` version. Then confirm one source of truth:

```powershell
node -p "require('./package.json').packageManager"
```

**Stops if:** `pnpm` resolves to a different major than the `packageManager` field. 🔴

**Fix:** `corepack prepare pnpm@10 --activate`, then restart the shell.

---

## 5. G4 — Docker and local MongoDB (hard stop)

**Requires:** Docker Engine 24+ with **Compose v2**, enough disk for the `mongo:7` image and a named volume.

**Threshold:** Compose v2 (`docker compose`, not the legacy `docker-compose` v1 binary).

**Verify:**

```powershell
docker --version
docker compose version
docker compose ps
```

**Stops if:** Docker daemon is not running, or `docker compose version` reports v1. 🔴

**Fix:** start Docker Desktop, enable the Compose v2 plugin, then re-run the verify commands.

**Runtime threshold:** after `docker compose up -d`, the `mongo` service must report `healthy`. The API readiness check in G9 fails until it does.

---

## 6. G5 — Repository safety (hard stop — do this before installing)

This gate protects against the two critical incidents in the build list: committed secrets and committed `node_modules`.

**Verify:**

```powershell
# no dependency dump in git
git ls-files | Select-String "node_modules"

# no committed .env files
git ls-files | Select-String "(^|/)\.env$"

# root .gitignore must exist and actually ignore the old backend
git check-ignore backend/node_modules
```

**Threshold:** all three checks must produce the expected result — first two **empty**, third one a printed path.

**Stops if:** any `.env` or `node_modules` path is tracked, or `git check-ignore` returns nothing. 🔴

**Fix — in this order:**

1. Add the root `.gitignore` (covers `node_modules`, `dist`, `.env`, `.vercel`).
2. `git rm -r --cached backend/node_modules`
3. **Rotate the leaked credentials at the database level** — new Atlas DB user, then delete the old one; rotate `JWT_SECRET`. Rotation alone is not enough.
4. Purge history: `git filter-repo --path backend/.env --invert-paths`, force-push.
5. Confirm: `git log --all -p | Select-String -Pattern "MONGO_URI"` → no output.
6. Delete the stale `JsFlow/public/index.html` (the production outage) and the admin backdoor in `authController.js`.

**Stops if:** old credentials are still live. Treat every previously issued token as compromised. 🔴

---

## 7. G6 — Workspace install order (hard stop)

**Rule:** always install from the **workspace root**, never from `apps/*` or `packages/*`. Catalogs and the lockfile are resolved once at the root; installing inside a package creates a second version of React/Zod/Vite and breaks the contract that both apps compile against the same types.

**Threshold:** one version of every shared dependency across the monorepo.

**Verify and install:**

```powershell
# from repository root
pnpm install --frozen-lockfile
pnpm why react
pnpm why zod
pnpm why vite
```

Expected: each `pnpm why` reports a **single** version, resolved through `catalog:`.

**Stops if:** two versions of any catalogued dependency appear, or `--frozen-lockfile` fails because the lockfile is out of date. 🔴

**Fix:** delete the nested `package-lock.json` files, re-run `pnpm install` at the root, commit the regenerated `pnpm-lock.yaml`.

**Then verify the task graph:**

```powershell
pnpm exec turbo run typecheck --dry=json
```

Expected: a JSON task graph showing `apps/web` and `apps/api` depending on `packages/shared` and `packages/engine`.

**Stops if:** the graph does not include both packages — a missing `package.json` in `packages/*`. 🔴

---

## 8. Library & tool inventory (pinned versions)

These are the versions from the build list. They are pinned through pnpm catalogs in `pnpm-workspace.yaml` so a shared dependency **cannot** drift between packages.

### 8.1 Root tooling

| Tool / library | Threshold | Role |
|---|---|---|
| pnpm | `^10` | Workspace manager + catalogs |
| turbo | `^2` | Task graph + build cache |
| typescript | `^5.9` | Compiler; `strict` + `noUncheckedIndexedAccess` |
| vite | `^8` | Build tool |
| @vitejs/plugin-react | `^6` | React plugin |
| @tailwindcss/vite | `^4.2` | Tailwind v4 |
| vite-tsconfig-paths | `^5` | Workspace path aliases |
| vite-plugin-checker | `^0.9` | Type errors in dev server |
| eslint + typescript-eslint | `^9` / `^8` | Flat config, shared |
| prettier + prettier-plugin-tailwindcss | `^3` / `^0.7` | Formatting, sorted classes |
| husky + lint-staged | `^9` / `^16` | Pre-commit hooks |
| @commitlint/cli + config-conventional | `^19` | Conventional Commits |
| @changesets/cli | `^2` | Versioning / releases |
| vitest + @vitest/coverage-v8 | `^3` | One test runner |
| @testing-library/react + jest-dom + user-event | `^16` / `^6` / `^14` | Component tests |
| jsdom | `^26` | Test DOM |
| mongodb-memory-server | `^10` | Real Mongo in tests |
| @playwright/test | `^1` | E2E + visual regression |
| @axe-core/playwright + axe-core | `^4` | Accessibility gates |
| fast-check | `^4` | Property-based engine tests |
| expect-type | `^1` | Type-level contract tests |
| size-limit | `^11` | Bundle budget |
| @lhci/cli | `^0.14` | Lighthouse CI |
| tsx | `^4` | Runs seed / migration scripts |
| concurrently | `^9` | Runs web + api together |

### 8.2 `apps/web` — frontend

| Package | Threshold | Role |
|---|---|---|
| react / react-dom | `^19.2` | UI runtime |
| react-router + @react-router/dev + @react-router/node | `^7.13` | Routing + SSR/prerender |
| @tanstack/react-query | `^5` | Server-state behind auth |
| zustand | `^5` | Client state: cursor, theme, runs |
| zod | `^4` | Shared runtime validation |
| react-hook-form + @hookform/resolvers | `^7` / `^5` | Forms using the shared schema |
| CodeMirror 6 packages | `^6` | Editor: state, view, language, commands, autocomplete, lint, search, lang-javascript, theme-one-dark |
| @lezer/highlight | latest | Syntax highlighting tokens |
| @xyflow/react | `^12` | Execution flow graph |
| tailwindcss | `^4.2` | Styling |
| shadcn/ui + Radix | latest | Accessible primitives (source files you own) |
| class-variance-authority | `^0.7` | Variant API |
| clsx + tailwind-merge | `^2` / `^3` | Conditional classes |
| lucide-react | latest | Icons replacing emoji |
| sonner | `^2` | Toasts replacing `alert()` |
| @sentry/react | `^10` | Frontend error tracking |
| vite-plugin-pwa | `^1` | Offline support |
| arctic | `^3` | OAuth 2.0 client |

### 8.3 `apps/api` — backend

| Package | Threshold | Role |
|---|---|---|
| fastify | `^5` | HTTP server |
| fastify-type-provider-zod | `^5` | Validation + inferred types from Zod |
| @fastify/cors / helmet / cookie / jwt / rate-limit | `^11` / `^13` / `^11` / `^10` / `^10` | Security primitives |
| @fastify/swagger + swagger-ui | `^9` | OpenAPI + `/api/docs` |
| @fastify/under-pressure | `^2` | 503 under load |
| mongoose | `^9` | MongoDB ODM |
| @node-rs/argon2 | `^2` | Argon2id hashing (prebuilt, no node-gyp) |
| bcryptjs | `^3` | Verification of legacy hashes only |
| zod | `^4` | Shared schemas |
| pino + pino-pretty | `^9` | Structured logging |
| @sentry/node | `^10` | Server error tracking |
| @anthropic-ai/sdk | latest | AI tutor (Phase 6) |
| arctic | `^3` | OAuth |
| nanoid | `^5` | Slugs |
| dotenv | `^17` | Local env loading |

### 8.4 `packages/shared` and `packages/engine`

| Package | Threshold | Role |
|---|---|---|
| zod | `^4` | One schema per request/response |
| typescript | `^5.9` | `z.infer` types derived, never hand-written |
| @babel/parser | `^7.28` | Parsing only — no `@babel/traverse` or `@babel/generator` |

**Threshold:** `packages/engine` has **no runtime dependencies** and no DOM/Node-only APIs. If a DOM or Node import appears, the worker and the server grader diverge. 🔴

**Verify the inventory:**

```powershell
pnpm list -r --depth -1
```

Stops if any version differs from the table above. 🔴

---

## 9. G7 — Environment variables (hard stop)

The server **fails fast at boot** if a required secret is missing or still a placeholder. This is deliberate: silent fallback values are what made the original project insecure.

| Variable | Required | Threshold / rule |
|---|---|---|
| `MONGO_URI` | Always | Must use the **rotated** Atlas user; never the leaked credential |
| `JWT_SECRET` | Always | ≥ 32 random characters; never `dev_secret_change_me` |
| `CSRF_SECRET` | Always | ≥ 32 random characters; distinct from `JWT_SECRET` |
| `ALLOWED_ORIGINS` | Always | Explicit comma-separated list; **`*` is forbidden** |
| `REDIS_URL` | Phases 4+ | Shared store required; in-memory rate limits are bypassable on serverless |
| `ANTHROPIC_API_KEY` | Phase 6+ | Warning 🟡 if absent — the tutor button hides, the visualizer still works |
| `SENTRY_DSN` | Deploy | Warning 🟡 if absent locally |
| `PORT` | API | Default `5000` |

**Verify (PowerShell):**

```powershell
$required = @("MONGO_URI","JWT_SECRET","CSRF_SECRET","ALLOWED_ORIGINS")
$bad = @("dev_secret_change_me","changeme","your-","xxxx","*")
foreach ($name in $required) {
  $v = [Environment]::GetEnvironmentVariable($name)
  if ([string]::IsNullOrWhiteSpace($v)) { throw "STOP: $name is not set" }
  if ($bad | Where-Object { $v -like "*$_*" }) { throw "STOP: $name is still a placeholder" }
}
if ([Environment]::GetEnvironmentVariable("JWT_SECRET").Length -lt 32) { throw "STOP: JWT_SECRET too short" }
"G7 passed"
```

**Stops if:** any variable is missing, a placeholder is present, `JWT_SECRET` is shorter than 32, or `ALLOWED_ORIGINS` is `*`. 🔴

**Fix:** copy `.env.example` to `.env` for both apps and fill in real values. Never commit the result.

---

## 10. G8 — Database and seed (hard stop)

**Install and verify:**

```powershell
docker compose up -d
docker compose ps
pnpm seed
pnpm seed   # run twice — must be idempotent
```

**Threshold:** Mongo container status `healthy`; seed creates exactly **1 admin**, **20+ examples**, **10+ challenges**; second run changes nothing.

**Stops if:** container unhealthy, seed throws, or counts differ. 🔴

**Fix:** check the container logs (`docker compose logs mongo`), confirm `MONGO_URI` points to the local instance, and verify the admin comes from the seed script — never from a magic email or backdoor.

---

## 11. G9 — Dev servers and health checks (hard stop)

**Start:**

```powershell
pnpm dev
```

**Verify:**

```powershell
curl http://localhost:5000/api/health
curl http://localhost:5000/api/health/ready
curl http://localhost:5173/api/health
```

**Threshold:**

- `/api/health` → liveness `ok`
- `/api/health/ready` → Mongo ping successful (this is what uptime monitoring watches)
- `/api/health` through the Vite proxy on `5173` → same response, proving the proxy works

**Stops if:** the API does not boot (secret check failed), readiness reports DB unreachable, or the proxy returns 404/502. 🔴

**Fix:** re-run G7 and G8. Do not start feature work until both health endpoints are green.

---

## 12. G10 — Engine execution thresholds (runtime stops)

These are the limits that stop a **running program**, not the setup. They are the safety net that replaces the old `new Function(...)` hole.

| Limit | Threshold | Trigger | Result |
|---|---|---|---|
| Step budget | 100,000 events | `while (true) {}` or runaway recursion | "Execution limit reached" error, tab stays responsive |
| Instruction timeout | bounded wall-clock time | Any non-terminating program | Friendly timeout error, worker terminated |
| Sandbox | whitelist only | `window`, `document`, `fetch`, `eval`, `Function`, `require`, `process` | `ReferenceError` inside the program |
| Cycle handling | detected in serializer | Circular object/array | Rendered as a loop marker instead of a crash |
| Syntax scope | supported subset only | `class`, `async`, `yield` in v2.0 | Friendly out-of-scope diagnostic in the editor |

**Threshold:** all five must hold. A program that can reach the host, spin forever, or crash the serializer is a release blocker. 🔴

**Verify:** run the engine test suite — the fixture corpus, the `fast-check` corpus against `node:vm`, and the `while(true){}` case.

```powershell
pnpm --filter @jsflow/engine test
```

Stops if coverage < 90% or any sandbox/timeout test fails. 🔴

---

## 13. G11 — Quality thresholds (CI hard stops)

| Check | Threshold | Command |
|---|---|---|
| Typecheck | 0 errors; strict; zero `any` in `src/` | `pnpm typecheck` |
| Lint | 0 errors | `pnpm lint` |
| Unit / E2E tests | all pass | `pnpm test` |
| Engine coverage | ≥ 90% | `pnpm test --coverage` |
| API coverage | ≥ 80% | `pnpm test --coverage` |
| Web coverage | ≥ 75% | `pnpm test --coverage` |
| Bundle size | within `size-limit` budget (≈200 KB budget in the brief) | `pnpm size` |
| Lighthouse CI | ≥ 90 on `/` and `/playground` | `pnpm lighthouse` |
| axe / a11y | 0 violations | Playwright + axe suite |
| Node matrix | 22 **and** 24 | GitHub Actions |

**Stops if:** any check falls below its threshold — CI rejects the PR. 🔴

**Why these are install-level gates:** a machine that cannot pass them locally will fail in CI; fixing it at setup time is far cheaper than debugging a red pipeline later.

---

## 14. G12 — External services and deploy health

| Service | Needed when | Threshold |
|---|---|---|
| MongoDB Atlas | Phase 0 | New rotated DB user; old user deleted; cluster audited |
| Vercel | Phase 1 | One project per app; preview deploy boots |
| Upstash Redis / Vercel KV | Phase 4 | Shared rate-limit store configured |
| Anthropic API | Phase 6 | Key present; if absent, tutor hides 🟡 |
| Sentry | Deploy | DSN in both apps; source maps uploaded 🟡 |
| Plausible / PostHog | Phase 7 | Loaded after first paint 🟡 |
| Uptime monitor | Launch | Pinging `/api/health/ready` with an alert channel |

**Stops if:** Atlas credentials are still the leaked ones, or Vercel env vars are missing for a target environment. 🔴

---

## 15. Fresh-machine install sequence (copy-paste)

Run top to bottom for a Windows machine with PowerShell 7. Each line corresponds to a gate above; stop on the first failure.

```powershell
# G1-G3: prerequisites
git --version                      # >= 2.40
node -v                            # v22.x
corepack enable
corepack prepare pnpm@10 --activate
pnpm -v                            # 10.x

# G5: safety — must be done before installing
git ls-files | Select-String "node_modules"     # expect empty
git ls-files | Select-String "(^|/)\.env$"      # expect empty
git check-ignore backend/node_modules           # expect a path

# G6: install from the ROOT only
pnpm install --frozen-lockfile
pnpm why react                     # one version
pnpm exec turbo run typecheck --dry=json

# G7: environment — fill .env files first, then verify
# (see the verification snippet in section 9)

# G8: database + seed
docker compose up -d
docker compose ps                  # healthy
pnpm seed
pnpm seed                          # idempotent

# G9: dev servers + health
pnpm dev
curl http://localhost:5000/api/health
curl http://localhost:5000/api/health/ready

# G10-G11: engine limits + quality gates
pnpm --filter @jsflow/engine test
pnpm typecheck
pnpm lint
pnpm test --coverage
pnpm size
```

---

## 16. Failure lookup — error → cause → fix

| Message / symptom | Cause | Fix |
|---|---|---|
| `pnpm: command not found` | Corepack not enabled | `corepack enable`, restart shell |
| `Unsupported engine: expected >=22` | Old Node | `nvm install 22 && nvm use 22` |
| `STOP: JWT_SECRET is not set` | G7 failed | Copy `.env.example`, set a 32+ char secret |
| `STOP: MONGO_URI is still a placeholder` | Leaked/placeholder credential | Rotate at DB level, update env |
| `EADDRINUSE :5000` | Port occupied | Stop the other process or change `PORT` |
| `ECONNREFUSED 127.0.0.1:27017` | Docker not running | `docker compose up -d`, re-check G8 |
| `dist/index.html` is blank | Stale `public/index.html` overwriting the build | Delete `JsFlow/public/index.html` (Phase 0 task 0.6) |
| `pnpm why react` shows two versions | Installed from a nested package | Delete nested lockfiles, reinstall at root |
| `Execution limit reached` | Step budget hit | Expected — a runaway program, not a setup bug |
| `playwright: executable doesn't exist` | Browsers not downloaded | `pnpm exec playwright install` |
| `mongodb-memory-server download failed` | No network / no cache | Prefetch the binary or set the download dir |
| `size-limit exceeded` | Eager editor/engine imports | Lazy `import()` the editor and worker |
| Tutor button missing | `ANTHROPIC_API_KEY` absent | Warning only — core app works; add key for Phase 6 |
| `/api/health/ready` fails | Mongo unreachable | Fix G8; do not proceed |
