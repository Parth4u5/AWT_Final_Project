# Phase 0 — Setup & Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a safe, reproducible, reviewable foundation — no tracked secrets or `node_modules`, no backdoor, no production outage, a working pnpm/Turborepo skeleton, local Mongo + seed, CI gates, and documentation — with zero product behaviour changes.

**Architecture:** Phase 0 is setup, not development (D29). It works in the existing `JsFlow/` + `backend/` JavaScript apps, makes them safe to build on, then scaffolds the `apps/*` + `packages/*` monorepo that Phases 1+ fill in. Credential incident response (task 0.3) is human-owned because it requires dashboard access and a destructive history rewrite; every other task is agent-executable and independently verifiable.

**Tech Stack:** Node 22 LTS, Corepack + pnpm 10, Turborepo 2, TypeScript 5.9, ESLint 9 flat config, Prettier 3, Vitest 3 (configured but no product tests yet), Docker Compose + `mongo:7`, GitHub Actions, husky/lint-staged/commitlint/changesets.

**Spec:** [`docs/BUILD_LIST.md`](../../BUILD_LIST.md) — §5 (Phase 0), §5.7 (incident response), §5.8 (gate), §2 (current state diagnosis), §21 (open questions). Companion: [`docs/INSTALLATION.md`](../INSTALLATION.md).

---

## Global Constraints

- Node **22 LTS** pinned in `.nvmrc`; CI matrix Node **22 and 24** (§5.2 task 0.8, §5.5 task 0.23).
- pnpm **^10** via Corepack, single source of versions through **pnpm catalogs** (§5.3 task 0.13); no `package-lock.json` survives past Phase 1.
- TypeScript **^5.9**, `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `moduleResolution: "bundler"` (§5.3 task 0.16). `exactOptionalPropertyTypes` lands in Phase 1 task 1.11, **not here**.
- **No secrets in git.** Fail fast if `JWT_SECRET` or `MONGO_URI` is missing or equal to a fallback value (§5.1 task 0.5).
- **No hardcoded credentials, no email-based privilege escalation** (§5.1 task 0.4).
- CORS allowlist from env; `origin: "*"` is forbidden (§4.8, §15.1).
- The deployed web app must boot — `JsFlow/public/index.html` must be deleted (§5.1 task 0.6).
- **Phase 0 makes no product behaviour changes** beyond what safety requires (§5).
- Preserve existing users and examples: rotate Atlas credentials **in place**, do not create a new cluster (D13, §21 Q1 — default assumed; confirm with human before Task 0).

---

## Review Focus

These five conditions are implied by the spec but not covered by a normal "files exist" check. Each gets its pinned test in the owning task.

1. **`dist/index.html` after a production build must be the Vite-built document**, not the stale `public/` copy — otherwise the deployed app serves a blank page. Test in Task 2: build and assert the script tag points at a hashed `/assets/index-*.js`.
2. **The JWT fallback string must be gone from every location**, not just one. Test in Task 3: repository-wide search for `dev_secret_change_me` returns zero matches.
3. **Adding `.gitignore` does not untrack already-committed files.** Test in Task 1: `git ls-files` returns no `node_modules` and no `.env` after the change.
4. **Wildcard CORS must be rejected**, since the spec forbids `origin: "*"` (§15.1). Test in Task 3: validation rejects `ALLOWED_ORIGINS=*`.
5. **Seed must be idempotent** — running twice must not duplicate the admin, examples, or challenges. Test in Task 9: two consecutive `pnpm seed` runs produce identical counts.

---

## File Structure

```
.gitignore                          # repo-wide ignore safety net
.dockerignore                       # keep build context small
.editorconfig                       # shared editor basics
.nvmrc                              # Node 22 LTS pin
package.json                        # workspace root: scripts, packageManager, devDependencies
pnpm-workspace.yaml                 # workspace globs + catalog of every shared version
turbo.json                          # task graph: build/typecheck/lint/test
docker-compose.yml                  # mongo:7 + healthcheck + seed init
docker-compose.override.yml         # local overrides
tooling/tsconfig/base.json          # strict base preset
tooling/tsconfig/node.json          # Node app preset
tooling/tsconfig/react.json         # React app preset
tooling/eslint/base.js              # shared flat config
prettier.config.js                  # Prettier + tailwind plugin
commitlint.config.js                # conventional commits
apps/web/                           # skeleton (filled in Phase 1) — package.json, tsconfig.json, src/index.ts
apps/api/                           # skeleton (filled in Phase 1)
packages/shared/                    # skeleton — Zod schemas land in Phase 1
packages/engine/                    # skeleton — interpreter lands in Phase 2
scripts/seed.ts                     # idempotent seed (admin, 20+ examples, 10+ challenges)
scripts/check-env.mjs               # standalone env validator used by backend boot
backend/config/env.js               # fail-fast env validator imported by server.js and api/index.js
backend/.env.example                # rewritten with all variables
JsFlow/.env.example                 # VITE_API_BASE_URL
.github/workflows/ci.yml            # lint, typecheck, test, build on Node 22 + 24
.github/dependabot.yml              # grouped npm + github-actions PRs
.github/CODEOWNERS                  # review ownership
docs/adr/ADR-001..006.md            # six architecture decision records
docs/CASE_STUDY.md                  # headings-only skeleton
docs/RUNBOOK.md                     # provision/rotate/revoke/deploy/rollback
README.md                           # rewritten, honest
LICENSE, CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md
```

---

## Task 0 (HUMAN-OWNED): Credential incident response — task 0.3 / §5.7

**Files:** External: MongoDB Atlas dashboard, Vercel dashboards, Sentry. Local: `backend/.env` (delete after rotation), git history.

**Interfaces:**

- Consumes: the leaked `backend/.env` currently tracked in git.
- Produces: a new Atlas DB user/password, a new `JWT_SECRET`, a scrubbed git history, and written evidence for each step. **No later task may proceed until this task's evidence checklist is satisfied.**

- [ ] **Step 1: Confirm open question Q1/D13 with the human**

Ask: "Preserve existing users and examples by rotating Atlas credentials in place (new user → update URI → delete old user), or start clean?" The plan assumes **preserve**. Record the answer in `docs/adr/ADR-013-credential-rotation.md` (add to the ADR set in Task 12).

- [ ] **Step 2: Provision external services (task 0.9) and revoke at the database level**

First provision the services from §1.6: one Vercel project per app, an Upstash Redis instance, an Anthropic API key, a Sentry project, a Plausible/PostHog site, and a Better Uptime monitor aimed at `/api/health/ready`. Record every credential and dashboard URL in `docs/RUNBOOK.md` (Task 10). Evidence: one working credential and dashboard URL per service.

Then create a new Atlas DB user with a new password, update `MONGO_URI` in both local env and every Vercel environment to use it, verify the app connects, and **delete the old DB user**. Preserves data and cluster. Evidence: Atlas screenshot/ID of deleted user and successful connection with the new one.

- [ ] **Step 3: Audit the cluster**

Check Atlas access logs for unexpected connections, collections, users, or data. Assume the DB was read. Evidence: short written note in `docs/RUNBOOK.md`.

- [ ] **Step 4: Rotate `JWT_SECRET`**

Generate a new 32+ character random value and set it in local env + all Vercel environments. This invalidates every previously issued token — the intended outcome. Evidence: old value no longer present anywhere.

- [ ] **Step 5: Purge history and force-push**

```bash
git filter-repo --path backend/.env --invert-paths
git push origin --force --all
```

Do this **before** branch protection is enabled (Task 11). Then verify:

```bash
git log --all -p | Select-String -Pattern "MONGO_URI"   # expect no output
```

- [ ] **Step 6: Remove the backdoor-created admin and rotate other credentials**

Delete the `admin@jsflow.local` account from the database; the admin must come from the seed script (Task 9). Rotate any other credential ever committed. Evidence: database query showing no such account.

- [ ] **Step 7: Commit / handoff**

No agent commit for this task — it is a human action with out-of-band evidence. Announce the evidence checklist result before Task 1 begins.

---

## Task 1: Root ignore rules and untrack committed artifacts — tasks 0.1, 0.2

**Files:**

- Create: `.gitignore`, `.dockerignore`
- Modify: `backend/.env` (remove from working tree)
- Test: verification commands below (no test framework exists yet)

**Interfaces:**

- Consumes: existing `JsFlow/.gitignore` (lines 1–24) and tracked `backend/node_modules` + `backend/.env`.
- Produces: `git ls-files` free of `node_modules` and `.env`; `git check-ignore backend/node_modules` succeeds. Task 2 depends on a clean index.

- [ ] **Step 1: Write the failing check**

```bash
git ls-files | Select-String "node_modules|(\.env$)"
```

Expected: **FAIL** — thousands of `backend/node_modules/...` lines and `backend/.env` are printed.

- [ ] **Step 2: Create `.gitignore`**

Root file covering: `node_modules/`, `dist/`, `dist-ssr/`, `.env`, `.env.*`, `!.env.example`, `.vercel/`, `coverage/`, `.turbo/`, `*.local`, logs, editor dirs (`.vscode/*` with `!.vscode/extensions.json`, `.idea`, `.DS_Store`). Mirror the existing `JsFlow/.gitignore` rules so nothing is lost when that directory is moved in Phase 1.

- [ ] **Step 3: Create `.dockerignore`**

Ignore `node_modules`, `dist`, `.git`, `.env`, `coverage`, `.turbo`.

- [ ] **Step 4: Untrack and remove the artifacts**

```bash
git rm -r --cached backend/node_modules
git rm --cached backend/.env
Remove-Item backend/.env        # only after Task 0 rotate step 4 has provided a new value elsewhere
```

- [ ] **Step 5: Re-run the check**

```bash
git ls-files | Select-String "node_modules|(\.env$)"   # expect empty
git check-ignore backend/node_modules                  # expect a printed path
git check-ignore backend/.env                          # expect a printed path
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add .gitignore .dockerignore
git commit -m "chore: ignore and untrack dependencies and secrets"
```

---

## Task 2: Kill the production outage and remove dead files — tasks 0.6, 0.7

**Files:**

- Delete: `JsFlow/public/index.html`, `JsFlow/src/App.css`, `JsFlow/src/styles/Globals.css`, `JsFlow/src/store/useStore.jsx`
- Modify: `JsFlow/package.json` (remove `prismjs`)

**Interfaces:**

- Consumes: the stale public HTML confirmed at `JsFlow/public/index.html` (different `<title>`, no favicon, no hashed script).
- Produces: a `dist/index.html` that Vite actually built. Verified by the Review Focus test #1.

- [ ] **Step 1: Write the failing test (production-outage regression)**

Record the current breakage as the baseline:

```bash
Get-Content JsFlow/public/index.html | Select-String "src/main.jsx"
```

Expected: the stale file still points at `/src/main.jsx`, which does not exist in `dist/`. A Vite copy of `public/*` overwrites the built `dist/index.html` with this file.

- [ ] **Step 2: Delete the stale document and dead files**

Remove the four files listed above. Grep already confirmed no source imports `App.css`, `Globals.css`, `useStore`, or `prismjs`, so the deletions are behaviour-neutral.

- [ ] **Step 3: Remove the unused dependency**

Delete `"prismjs": "^1.30.0"` from `JsFlow/package.json`. Leave `package-lock.json` untouched here; Phase 1 task 1.1 deletes both lockfiles and regenerates `pnpm-lock.yaml`.

- [ ] **Step 4: Verify the built document**

```bash
cd JsFlow && npm install --no-save && npm run build
Get-Content dist/index.html | Select-String "assets/index-.*\.js"
Test-Path dist/index.html
```

Expected: PASS if `dist/index.html` contains a hashed `/assets/index-*.js` script and **no** `/src/main.jsx`. Also assert `Test-Path dist/src/main.jsx` is `False`.

- [ ] **Step 5: Commit**

```bash
git add -A JsFlow
git commit -m "fix: remove stale public index and dead frontend files"
```

---

## Task 3: Fail-fast configuration and removal of auth backdoors — tasks 0.4, 0.5

**Files:**

- Create: `scripts/check-env.mjs`, `backend/config/env.js`
- Modify: `backend/server.js`, `backend/api/index.js`, `backend/controllers/authController.js`, `backend/middleware/authMiddleware.js`, `backend/.env.example`

**Interfaces:**

- Consumes: `process.env`.
- Produces: `assertEnv(env = process.env): Env` exported from `backend/config/env.js`, throwing `Error` with an exact message and causing exit code 1 on a bad configuration. Both boot paths import it. Later phases add `ALLOWED_ORIGINS`, `CSRF_SECRET`, `REDIS_URL`, `ANTHROPIC_API_KEY` to the same validator.

- [ ] **Step 1: Write the failing checks (Review Focus #2 and #4)**

```bash
Select-String -Path backend/**/*.js -Pattern "dev_secret_change_me"   # expect matches today
$env:ALLOWED_ORIGINS="*"; node scripts/check-env.mjs                   # expect exit 1 today (script missing)
```

Expected: FAIL. Both insecure conditions currently exist.

- [ ] **Step 2: Implement `backend/config/env.js`**

Signature: `assertEnv(env = process.env)` returns a typed plain object of validated values and throws on any of:

- `JWT_SECRET` missing or equal to `dev_secret_change_me` / `changeme` / shorter than 32 chars.
- `MONGO_URI` missing or containing the known leaked cluster/user markers (keep the marker list in one constant).
- `ALLOWED_ORIGINS` missing, `*`, or present in any entry. (Use `FRONTEND_URL` as today's transitional source if `ALLOWED_ORIGINS` is absent, but reject wildcard in both.)

Error messages must name the exact variable and the exact problem, e.g. `JWT_SECRET is set to the fallback value`.

- [ ] **Step 3: Create `scripts/check-env.mjs`**

A thin CLI wrapper that imports `assertEnv` and calls it; non-zero exit on throw. This is the verification entry point used by CI and by `docs/INSTALLATION.md` gate G7.

- [ ] **Step 4: Wire both boot paths**

In `backend/server.js` and `backend/api/index.js`, call `assertEnv()` **before** `dotenv.config()`-dependent work and before `connectDB()`. On throw, log only `error.message` and `process.exit(1)` (serverless: return 500 with a generic message — never the secret).

- [ ] **Step 5: Remove every fallback and backdoor**

In `authController.js` and `authMiddleware.js`, replace `process.env.JWT_SECRET || "dev_secret_change_me"` with the validated `process.env.JWT_SECRET`. Delete lines 74–101 of `authController.js` (the `admin / admin@616` auto-create branch). Change line 35 so `role` is always `"user"` — no email can grant admin.

- [ ] **Step 6: Rewrite `backend/.env.example`**

List `PORT`, `MONGO_URI`, `JWT_SECRET`, `ALLOWED_ORIGINS`, `CSRF_SECRET`, `REDIS_URL`, `ANTHROPIC_API_KEY`, `SENTRY_DSN`, each with a description and a **safe placeholder** that the validator will reject (so copying the example cannot boot insecurely).

- [ ] **Step 7: Verify**

```bash
node scripts/check-env.mjs                                   # with valid local env → exit 0
$env:JWT_SECRET="dev_secret_change_me"; node scripts/check-env.mjs   # exit 1
$env:ALLOWED_ORIGINS="*"; node scripts/check-env.mjs        # exit 1
Select-String -Path backend/**/*.js -Pattern "dev_secret_change_me|admin@gmail\.com|admin@jsflow\.local|admin@616"   # expect empty
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add -A backend scripts
git commit -m "fix: fail fast on bad config and remove auth backdoor"
```

---

## Task 4: Node and pnpm version pinning — task 0.8

**Files:**

- Create: `.nvmrc`
- Modify: root `package.json` (create if absent — right now only `JsFlow/package.json` and `backend/package.json` exist)

**Interfaces:**

- Consumes: none.
- Produces: `node -v` reproducible via `.nvmrc` (`22`), and `packageManager: "pnpm@10.x"` in the root manifest. Task 5 extends this root manifest into the full workspace.

- [ ] **Step 1: Write the failing check**

```bash
Test-Path .nvmrc; node -p "require('./package.json').packageManager"
```

Expected: FAIL — neither exists.

- [ ] **Step 2: Add pins**

`.nvmrc` contains `22` only. Root `package.json` starts as:

```json
{
  "name": "jsflow-visualizer",
  "private": true,
  "packageManager": "pnpm@10.0.0",
  "engines": { "node": ">=22 <25" }
}
```

Use the exact pnpm 10 patch available via Corepack; record the chosen version in `docs/INSTALLATION.md` gate G3 if it differs.

- [ ] **Step 3: Verify**

```bash
corepack enable
corepack prepare pnpm@10 --activate
pnpm -v                                  # 10.x
node -p "require('./package.json').packageManager"   # pnpm@10.x
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add .nvmrc package.json && git commit -m "chore: pin Node 22 and pnpm 10"
```

---

## Task 5: Workspace manifests, catalogs and Turbo graph — tasks 0.12, 0.13, 0.21 (dev script)

**Files:**

- Create: `pnpm-workspace.yaml`, `turbo.json`, root `package.json` (extend Task 4)

**Interfaces:**

- Consumes: pinned root manifest, pinned versions from §1 / §8 of `docs/INSTALLATION.md`.
- Produces: `pnpm install` at root resolves one version per catalogued package; `pnpm dev` runs both apps. Task 6 creates the directories these globs point to.

- [ ] **Step 1: Write the failing check**

```bash
Test-Path pnpm-workspace.yaml; Test-Path turbo.json; node -p "require('./package.json').scripts.dev"
```

Expected: FAIL.

- [ ] **Step 2: Create `pnpm-workspace.yaml`**

Globs: `apps/*`, `packages/*`, `tooling/*`. A `catalog:` block declaring **every** shared version from §1 of the build list — React 19.2, react-router 7.13, zod 4, typescript 5.9, vite 8, @vitejs/plugin-react 6, tailwindcss 4.2, fastify 5, mongoose 9, vitest 3, eslint 9, prettier 3, turbo 2, and the rest. This is the single source of versions; no package may hardcode a shared version.

- [ ] **Step 3: Create `turbo.json`**

Tasks: `build` (dependsOn `^build`, outputs `dist/**`), `typecheck`, `lint`, `test` (dependsOn `^build` only where needed). No remote cache configuration yet — note it as a later enhancement.

- [ ] **Step 4: Add root scripts**

`dev`: `concurrently "pnpm --filter web dev" "pnpm --filter api dev"`. Also add `build`, `typecheck`, `lint`, `test`, `seed`, `changeset` delegating to Turbo/tsx. Pin `concurrently` in the catalog.

- [ ] **Step 5: Verify**

```bash
pnpm install --lockfile-only
node -p "JSON.stringify(require('./pnpm-workspace.yaml'))"   # or read the file
pnpm exec turbo run build --dry=json                         # parses without packages -> ok
```

Expected: PASS — the lockfile generates with no version conflicts; `turbo --dry=json` parses the config.

- [ ] **Step 6: Commit**

```bash
git add pnpm-workspace.yaml turbo.json package.json pnpm-lock.yaml
git commit -m "chore: add pnpm workspace catalogs and turbo graph"
```

---

## Task 6: Package skeleton — tasks 0.14, 0.15

**Files:**

- Create: `apps/web/{package.json,tsconfig.json,src/index.ts}`, `apps/api/{package.json,tsconfig.json,src/index.ts}`, `packages/shared/{package.json,tsconfig.json,src/index.ts}`, `packages/engine/{package.json,tsconfig.json,src/index.ts}`

**Interfaces:**

- Consumes: workspace globs and catalog from Task 5.
- Produces: package names `@jsflow/web`, `@jsflow/api`, `@jsflow/shared`, `@jsflow/engine` (used by `pnpm --filter` in every later task and by `docs/INSTALLATION.md` commands).

- [ ] **Step 1: Write the failing check**

```bash
pnpm --filter @jsflow/engine exec node -p "require('./package.json').name"
```

Expected: FAIL — package does not exist.

- [ ] **Step 2: Create the four packages**

Each `package.json`: `name`, `private: true`, `type: "module"`, `scripts` (`build`, `typecheck`, `lint`, `test` as applicable), and dependencies referenced as `catalog:` (never literal versions). `packages/engine` has **no runtime dependencies** and no DOM/Node-only imports. Each `src/index.ts` is an empty stub with a single `export {}` so TypeScript accepts it.

- [ ] **Step 3: Verify graph resolution**

```bash
pnpm install
pnpm --filter @jsflow/engine exec node -p "require('./package.json').name"
pnpm exec turbo run build --dry=json | Select-String "@jsflow/(shared|engine)"
```

Expected: PASS — all four names resolve and appear in the task graph.

- [ ] **Step 4: Commit**

```bash
git add apps packages pnpm-lock.yaml && git commit -m "chore: scaffold web, api, shared and engine packages"
```

---

## Task 7: Shared TypeScript/ESLint/Prettier presets — tasks 0.16, 0.17

**Files:**

- Create: `tooling/tsconfig/{base,node,react}.json`, `tooling/eslint/base.js`, `prettier.config.js`
- Modify: each package's `tsconfig.json` to extend the appropriate preset

**Interfaces:**

- Consumes: skeleton packages from Task 6.
- Produces: `tsc --noEmit` passing with zero errors across all four packages; `pnpm lint` passing repo-wide.

- [ ] **Step 1: Write the failing check**

```bash
pnpm -r exec tsc --noEmit
pnpm lint
```

Expected: FAIL — no presets, no lint script.

- [ ] **Step 2: Write tsconfig presets**

`base.json`: `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `moduleResolution: "bundler"`, `module: "ESNext"`, `target: "ES2022"`, `skipLibCheck`, `noEmit`. `node.json` and `react.json` extend it; React adds `jsx: "react-jsx"`, `lib: ["DOM", "ES2022"]`. Do **not** enable `exactOptionalPropertyTypes` yet (Phase 1 task 1.11).

- [ ] **Step 3: Write ESLint and Prettier configs**

Flat config in `tooling/eslint/base.js` using `typescript-eslint`, `eslint-plugin-react-hooks`, `react-refresh`, `jsx-a11y`, `import-x`, `simple-import-sort`, and `eslint-config-prettier` last. `prettier.config.js` uses `prettier-plugin-tailwindcss`. Zero `any` rule enabled but with no source files yet it cannot fail.

- [ ] **Step 4: Verify**

```bash
pnpm -r exec tsc --noEmit          # exit 0, zero errors
pnpm lint                          # exit 0
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tooling prettier.config.js apps packages && git commit -m "chore: add strict shared tsconfig and lint presets"
```

---

## Task 8: Git hooks, commit conventions and changesets — task 0.18

**Files:**

- Create: `commitlint.config.js`, `.husky/pre-commit`, `.husky/commit-msg`, `.changeset/config.json`
- Modify: root `package.json` (prepare script, devDependencies)

**Interfaces:**

- Consumes: lint/format scripts from Task 7.
- Produces: a rejected commit with a bad message, and a working `pnpm changeset`.

- [ ] **Step 1: Write the failing check**

```bash
git commit --allow-empty -m "bad message"   # expected: rejected after this task
```

Expected: FAIL — currently accepted.

- [ ] **Step 2: Configure commitlint**

`commitlint.config.js` extends `@commitlint/config-conventional`. `.husky/commit-msg` runs `pnpm exec commitlint --edit "$1"`.

- [ ] **Step 3: Configure lint-staged and pre-commit**

`.husky/pre-commit` runs `pnpm exec lint-staged`; lint-staged config in root `package.json` runs Prettier + ESLint on staged `*.{ts,tsx,js,jsx,json,md}`. Root `prepare` script runs `husky`.

- [ ] **Step 4: Configure changesets**

`.changeset/config.json` with `privatePackages: { version: true, tag: false }`; root `changeset` script.

- [ ] **Step 5: Verify**

```bash
git commit --allow-empty -m "bad message"      # expect rejection
git commit --allow-empty -m "chore: verify commitlint" && git reset --hard HEAD~1
pnpm changeset --help                           # exits 0
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A .husky commitlint.config.js .changeset package.json
git commit -m "chore: add husky, commitlint and changesets"
```

---

## Task 9: Local MongoDB, seed script and one-command dev — tasks 0.19–0.22

**Files:**

- Create: `docker-compose.yml`, `docker-compose.override.yml`, `scripts/seed.ts`
- Modify: `backend/.env.example` (local URI already documented), root `package.json` (`seed` script)

**Interfaces:**

- Consumes: validated env, `mongoose`, `tsx`, `nanoid` from the catalog.
- Produces: `pnpm seed` idempotent, producing exactly 1 admin, 20+ categorized examples, 10+ starter challenges. Review Focus test #5 lives here. Phase 4 task 4.17 fills in the full content.

- [ ] **Step 1: Write the failing check (Review Focus #5)**

```bash
pnpm seed; pnpm seed
```

Expected: FAIL now — no compose file, no seed script.

- [ ] **Step 2: Write `docker-compose.yml`**

Service `mongo` using `mongo:7`, a named volume, a healthcheck (`mongosh --eval "db.adminCommand('ping')"`), and `ports: 27017:27017`. An `init` step or documented `pnpm seed` invocation handles seeding. `docker-compose.override.yml` holds local-only overrides.

- [ ] **Step 3: Write the idempotent seed**

`scripts/seed.ts`, run via `tsx`. Use `updateOne` with `upsert: true` and stable natural keys (admin email, example title, challenge slug) so re-running changes nothing. Respect the "no magic email" rule: the admin is created here deliberately with a credential from env, never inferred from a registrant's email. Content: 1 admin, 20+ examples with `category`/`difficulty`, 10+ challenges with `tests[]` placeholders (filled in Phase 5 task 5.12).

- [ ] **Step 4: Verify idempotency**

```bash
docker compose up -d
docker compose ps                     # mongo healthy
pnpm seed && pnpm seed
# query counts via mongosh or a small tsx script: expect 1 admin, >=20 examples, >=10 challenges, identical after both runs
```

Expected: PASS.

- [ ] **Step 5: Verify one-command dev**

```bash
pnpm dev
# web on 5173, api on 5000; Vite proxy /api -> localhost:5000 (configure in the web skeleton when Phase 1 migrates vite.config.js)
curl http://localhost:5000/api/health    # {"status":"ok"}
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add docker-compose*.yml scripts/seed.ts package.json && git commit -m "feat: add seeded local mongo and one-command dev"
```

---

## Task 10: Environment documentation and runbook — tasks 0.10, 0.11

**Files:**

- Create: `docs/RUNBOOK.md`
- Modify: `backend/.env.example`, `JsFlow/.env.example`

**Interfaces:**

- Consumes: the validator's variable list from Task 3.
- Produces: a runbook another person can follow to provision, rotate, revoke, deploy and roll back.

- [ ] **Step 1: Write the failing check**

```bash
Test-Path docs/RUNBOOK.md
Select-String -Path backend/.env.example -Pattern "CSRF_SECRET|REDIS_URL|ALLOWED_ORIGINS"
```

Expected: FAIL — variables missing, runbook absent.

- [ ] **Step 2: Expand `.env.example` files**

Every variable with a one-line description and a safe default, matching `docs/INSTALLATION.md` §9 exactly. `ANTHROPIC_API_KEY` and `SENTRY_DSN` marked as later-phase / warning-only.

- [ ] **Step 3: Write `docs/RUNBOOK.md`**

Sections: service inventory with dashboard URLs (Atlas, Vercel web + api, Upstash, Anthropic, Sentry, Plausible, uptime monitor); how to provision each; how to rotate/revoke each secret; what a rotation invalidates; how to roll back a deploy; where the health checks live. Reference `docs/INSTALLATION.md` gates G7 and G12.

- [ ] **Step 4: Verify** — re-run the check in Step 1; both must pass. Also confirm no real secret was added to either example file:

```bash
node scripts/check-env.mjs   # with example values copied -> must exit 1 (placeholders rejected)
```

- [ ] **Step 5: Commit**

```bash
git add docs/RUNBOOK.md backend/.env.example JsFlow/.env.example && git commit -m "docs: add runbook and complete env examples"
```

---

## Task 11: CI baseline and repository signals — tasks 0.23–0.26

**Files:**

- Create: `.github/workflows/ci.yml`, `.github/dependabot.yml`, `.github/CODEOWNERS`, `.editorconfig`, `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`

**Interfaces:**

- Consumes: root scripts from Tasks 5 and 7.
- Produces: every PR gated by lint/typecheck/test/build on Node 22 and 24. Branch protection is a GitHub setting — **human-owned**, performed by the repo owner after this task merges.

- [ ] **Step 1: Write the failing check**

```bash
Test-Path .github/workflows/ci.yml; Test-Path .github/dependabot.yml
```

Expected: FAIL.

- [ ] **Step 2: Create CI workflow**

Triggers: push to `main`, pull_request. Jobs: `lint`, `typecheck`, `test`, `build`, each with a `matrix.node-version: [22, 24]`, using `pnpm/action-setup` with cache and `actions/setup-node` with `cache: pnpm`. Cache the Turborepo graph. Run `pnpm install --frozen-lockfile`, then the corresponding script. Coverage thresholds and Lighthouse/size-limit arrive in Phase 1/3 — leave TODOs referencing the build list, not silent omissions.

- [ ] **Step 3: Create Dependabot, CODEOWNERS and community files**

Dependabot: `npm` and `github-actions` ecosystems, grouped weekly PRs. CODEOWNERS: `*` owned by the repo owner; `docs/adr/` and `docs/BUILD_LIST.md` also owned. `.editorconfig`: UTF-8, 2-space indent, final newline. `LICENSE`: MIT. The three community docs follow the build list's stated purpose.

- [ ] **Step 4: Verify locally**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Expected: PASS on Node 22. Confirm the workflow YAML parses (e.g. `pnpm exec prettier --check .github/workflows/ci.yml`).

- [ ] **Step 5: Human step — branch protection**

Repo owner: require the CI checks, one review, and linear history on `main`. Do this **after** Task 0's force-push. Evidence: settings screenshot.

- [ ] **Step 6: Commit**

```bash
git add -A .github .editorconfig LICENSE CONTRIBUTING.md SECURITY.md CODE_OF_CONDUCT.md
git commit -m "ci: add PR gates, dependabot and repository policies"
```

---

## Task 12: Documentation — tasks 0.27–0.29

**Files:**

- Modify: `README.md`
- Create: `docs/adr/ADR-001..006.md`, `docs/CASE_STUDY.md`
- (Task 0 adds `ADR-013` if the human chooses to record the rotation decision)

**Interfaces:**

- Consumes: §1, §2, §3, §4 of the build list; the companion guides already committed.
- Produces: six interview-ready ADRs, an honest README, and a case-study skeleton.

- [ ] **Step 1: Write the failing check**

```bash
Get-ChildItem docs/adr/*.md | Measure-Object | Select-Object -ExpandProperty Count
Select-String -Path README.md -Pattern "Open `index.html` in your browser"
```

Expected: FAIL — no ADRs and the stale README instruction is present.

- [ ] **Step 2: Rewrite `README.md`**

Accurate feature list (do **not** claim loops/functions work — the engine is not built until Phase 2), honest status ("Phase 0 foundation; engine landing in Phase 2"), setup that works in 5 minutes referencing `docs/INSTALLATION.md`, env table, CI badges (add once CI is green), architecture link to `docs/SYSTEM_FLOW.md`, license. Remove the fictitious `/src`, `/assets`, `index.html` structure.

- [ ] **Step 3: Write six ADRs**

`ADR-001` TypeScript, `ADR-002` Monorepo + pnpm catalogs, `ADR-003` Fastify over Express, `ADR-004` CodeMirror over Monaco, `ADR-005` Own-the-session auth, `ADR-006` MongoDB over Postgres. Each: context, decision, consequences, alternatives considered — taken verbatim from build list §4.1 and the decisions log.

- [ ] **Step 4: Create the case-study skeleton**

`docs/CASE_STUDY.md` with headings only: the problem, why the regex simulator failed, the event-stream design, key decisions and trade-offs, what I'd do differently. Written as the project is built, not retro-fitted.

- [ ] **Step 5: Verify**

```bash
(Get-ChildItem docs/adr/*.md).Count -eq 6
Select-String -Path README.md -Pattern "Open `index.html` in your browser"   # expect empty
pnpm exec prettier --check README.md docs/*.md docs/adr/*.md
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add README.md docs && git commit -m "docs: rewrite README and add ADRs and case study skeleton"
```

---

## Phase 0 Gate — verification before claiming completion

Run all commands below and record the output. A single failure means Phase 0 is not done.

```bash
# Safety
git ls-files | Select-String "node_modules|(\.env$)"           # empty
git log --all -p | Select-String -Pattern "MONGO_URI"          # empty (after Task 0)
Select-String -Path backend/**/*.js -Pattern "dev_secret_change_me|admin@gmail\.com|admin@616"   # empty
node scripts/check-env.mjs                                     # exit 0 with valid env

# App boots
cd JsFlow && npm run build && Select-String -Path dist/index.html -Pattern "assets/index-.*\.js"   # matches
pnpm dev; curl http://localhost:5000/api/health                 # {"status":"ok"}

# Data
docker compose ps                                              # mongo healthy
pnpm seed && pnpm seed                                         # identical counts

# Quality
pnpm lint && pnpm typecheck && pnpm test && pnpm build          # all green

# Docs
(Get-ChildItem docs/adr/*.md).Count -eq 6
Test-Path docs/RUNBOOK.md; Test-Path docs/CASE_STUDY.md
```

Then confirm the human-owned items: old DB user deleted, `JWT_SECRET` rotated, cluster audited, history purged, branch protection enabled. Announce Phase 0 complete only after every line above passes — and only then begin Phase 1, which starts with the lockfile migration (task 1.1).
