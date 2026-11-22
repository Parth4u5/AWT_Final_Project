# Phase 1 — TypeScript Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the existing JavaScript/Vite/Express app into the Phase 0 monorepo as strict TypeScript with shared Zod contracts, real tests, and **zero behaviour change**.

**Architecture:** Phase 1 is a refactor only. `apps/web` consumes `packages/*` as raw TS source through Vite/Vitest path aliases (no package build needed for `dev`), while each package's Turbo `build` task emits declarations with `tsc --emitDeclarationOnly`. The legacy regex engine stays in `apps/web/src/engine` as `.ts` until Phase 2 replaces it; only its **domain types** move into `packages/engine/src/types.ts`. Root helper scripts Move with the app they belong to and are converted to `tsx` where they must import TS.

**Tech Stack:** pnpm 10 catalogs, Turborepo 2, TypeScript 5.9 (`strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, bundler resolution), React 19 + `react-router` v7 (framework package, not `react-router-dom`), Vite 8, Vitest 3, Zod 4, Express 5 + Mongoose 9 (until Phase 4 replaces Express with Fastify), `tsx`, `vite-plugin-checker`.

**Spec:** [`docs/BUILD_LIST.md`](../../BUILD_LIST.md) §6 (Phase 1), §1 (stack), §3 (architecture), §4.2/4.3 (loader split, no OpenAPI codegen), §19 (Definition of Done). Companion: [`docs/INSTALLATION.md`](../INSTALLATION.md), Phase 0 plan.

---

## Global Constraints

- **Migration rule (spec §6):** port behaviour _exactly_. No feature changes, no visual changes, no error-message changes. This phase is a refactor and nothing else.
- Node **22 LTS** (`.nvmrc`), `packageManager: pnpm@10.34.9`, engines `>=22 <25`.
- Every dependency version comes from `pnpm-workspace.yaml` `catalog:` — never a literal version in a package manifest.
- TypeScript: `strict`, `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, `moduleResolution: "bundler"`, `isolatedModules: true`. `exactOptionalPropertyTypes` is added **only** to `packages/*` and `apps/api` in Task 10 — **not** `apps/web`.
- Zero `any` in source (ESLint `@typescript-eslint/no-explicit-any: error`). Use `unknown` + narrowing when inference cannot express a Mongoose/JSON.parse result.
- `allowJs: false` for app source. Pure-logic files (`parser`, `simulator`, `env`, API clients) become `.ts`, not `.tsx`.
- Frontend must use **`react-router`** (v7 framework package), not `react-router-dom` (spec §1.1 / D25). This is the one deliberate import-source change; runtime behaviour is identical.
- `pnpm dev` needs **no package build**; `pnpm build` still type-checks and now emits declarations.
- Keep the Vite proxy `/api → http://localhost:5000` and the `PORT` fallback `5000` in sync.
- Keep all legacy behavioural traps (see Review Focus).
- Preserve existing users/examples: no data migration in Phase 1.

## Review Focus

These five conditions are implied by the spec but not covered by a normal "files exist" check. Each is pinned to a task.

1. **The legacy regex engine's quirks survive typing** — `safeEvaluate` returns the raw expression string on failure, control flow (`if`/`for`/`function`) becomes `noop`, `//` comments are skipped, and only declaration/bare-assignment/`console.log` produce real steps. Pin: Task 7 unit tests with exact expected `steps`/`logs`.
2. **`registerApi` must not persist auth while `loginApi` must** — a plausible "cleanup" during typing silently changes registration behaviour. Pin: Task 8 test with mocked `fetch` and a `localStorage` spy.
3. **Root helper scripts survive the directory move** — `check-env`, `check-env.regression`, `check-docs`, and `seed` all reference the old paths. Pin: Task 2 runs each after the move.
4. **`pnpm dev` needs no package build** — the raw-TS-source contract breaks if aliases point at `dist`. Pin: Task 1 verifies aliases target `packages/*/src/index.ts` with no `dist` present; Task 5 builds with no prebuilt packages.
5. **`exactOptionalPropertyTypes` is scoped correctly** — applied to packages + API, not web. Pin: Task 10 reads all four tsconfigs and runs full typecheck.

---

## File Structure

```
apps/api/                         # moved from backend/ (git mv, history preserved)
  package.json                    # renamed @jsflow/api, catalog deps, dev via tsx
  tsconfig.json                   # extends tooling/tsconfig/node.json
  vercel.json                     # src: src/api/index.ts, /api route
  .env.example                    # moved from backend/.env.example, unchanged content
  src/
    index.ts                      # local server entry (was backend/server.js)
    api/index.ts                  # Vercel handler (was backend/api/index.js)
    app.ts                        # was backend/app.js
    config/{db,env}.ts            # was backend/config/*.js
    controllers/{auth,user,example}Controller.ts
    middleware/authMiddleware.ts
    models/{User,Example}.ts
    routes/{auth,user,example}Routes.ts
    types/express.d.ts            # Request.user declaration merging
apps/web/                         # moved from JsFlow/ (git mv, history preserved)
  index.html                      # /src/main.jsx → /src/main.tsx
  vite.config.ts                  # react + tailwindcss + checker + aliases + /api proxy
  vitest.config.ts                # aliases, node environment for engine tests
  vercel.json                     # SPA rewrite (unchanged behaviour)
  .env.example                    # moved from JsFlow/.env.example
  src/vite-env.d.ts               # ImportMetaEnv declaration
  src/**/*.tsx                    # all legacy .jsx → .tsx
  src/engine/{parser,simulator}.ts # pure logic → .ts
  src/api/*.ts                    # typed clients
  src/utils/auth.ts
packages/shared/src/index.ts      # Zod schemas + z.infer types
packages/engine/src/types.ts      # discriminated unions for instructions/events/scopes/errors
scripts/check-env.ts              # converted from .mjs, imports apps/api/src/config/env.ts
scripts/check-env.regression.ts   # converted from .mjs
scripts/check-docs.mjs            # paths updated to apps/*/.env.example
docs/INSTALLATION.md, docs/RUNBOOK.md, README.md   # path references updated
.github/workflows/ci.yml          # env smoke step uses tsx
```

---

## Task 1: Workspace distribution contract (task 1.3)

**Files:**

- Create: `packages/shared/tsconfig.build.json`, `packages/engine/tsconfig.build.json`
- Modify: `packages/shared/package.json`, `packages/engine/package.json`, `turbo.json`
- Test: verification commands below

**Interfaces:**

- Consumes: Phase 0 skeleton packages with `build: tsc --noEmit` and `tooling/tsconfig/base.json` (`noEmit: true`).
- Produces: `build` = `tsc -p tsconfig.build.json` for `packages/*`, emitting `dist/**/*.d.ts`; aliases in later tasks resolve to `packages/*/src/index.ts`, never to `dist`.

- [ ] **Step 1: Write the failing check**

```powershell
Get-Content packages/shared/package.json | Select-String 'emitDeclarationOnly'
Get-Content apps/web/tsconfig.json | Select-String '@jsflow/shared'
```

Expected: FAIL — no declaration emit, no aliases anywhere.

- [ ] **Step 2: Add declaration build configs**

`packages/shared/tsconfig.build.json` and `packages/engine/tsconfig.build.json`: extend `../../tooling/tsconfig/base.json`, set `noEmit: false`, `declaration: true`, `emitDeclarationOnly: true`, `outDir: "dist"`, `rootDir: "src"`, `include: ["src"]`. Both packages' `build` script becomes `tsc -p tsconfig.build.json`; `typecheck` stays `tsc --noEmit`.

- [ ] **Step 3: Verify declarations emit and nothing prebuilt is needed**

```powershell
$env:PATH = 'C:\Users\Parth\AppData\Local\Temp\opencode\pnpm-shim;' + $env:PATH
pnpm --filter @jsflow/shared build
Test-Path packages/shared/dist/index.d.ts
Test-Path packages/shared/dist/index.js     # expect False
```

Expected: `dist/index.d.ts` exists, no `.js` output (raw source is consumed by Vite).

- [ ] **Step 4: Commit**

```bash
git add packages/shared packages/engine turbo.json
git commit -m "chore: emit declarations for workspace packages"
```

---

## Task 2: Lockfile migration and directory move (tasks 1.1, 1.2)

**Files:**

- Delete: `JsFlow/package-lock.json`, `backend/package-lock.json`
- Delete (skeletons replaced by the moved apps): `apps/web/{package.json,tsconfig.json,src/index.ts}`, `apps/api/{package.json,tsconfig.json,src/index.ts}`
- Move: `git mv JsFlow apps/web`, `git mv backend apps/api`
- Modify: `scripts/check-docs.mjs`, `scripts/check-env.mjs`, `scripts/check-env.regression.mjs` (import path only), `README.md`, `docs/INSTALLATION.md`, `docs/RUNBOOK.md`, `.github/workflows/ci.yml`, `pnpm-lock.yaml`

**Interfaces:**

- Consumes: Task 1 declarations; existing root scripts import `../backend/config/env.js`.
- Produces: app packages at `apps/web` / `apps/api` with their legacy files; env validator temporarily at `apps/api/config/env.js`; root scripts still green. Task 4 converts the validator to TS.

- [ ] **Step 1: Write the failing check**

```powershell
Test-Path JsFlow/package-lock.json; Test-Path apps/web/src/index.ts
```

Expected: FAIL — old lockfile and skeleton stub still exist.

- [ ] **Step 2: Delete old lockfiles and skeleton stubs**

```powershell
git rm JsFlow/package-lock.json backend/package-lock.json
git rm apps/web/package.json apps/web/tsconfig.json apps/web/src/index.ts
git rm apps/api/package.json apps/api/tsconfig.json apps/api/src/index.ts
Remove-Item -Recurse -Force apps/web/node_modules, apps/web/.turbo, apps/api/node_modules, apps/api/.turbo
```

Generated dirs are disposable; `pnpm install` recreates them.

- [ ] **Step 3: Move the apps with git mv**

```powershell
git mv JsFlow apps/web
git mv backend apps/api
```

Expected: `apps/web/src/App.jsx` and `apps/api/app.js` exist; no `JsFlow/` or `backend/` remains.

- [ ] **Step 4: Repoint root scripts, package names and docs**

- `apps/web/package.json` and `apps/api/package.json`: set `name` to `@jsflow/web` / `@jsflow/api` immediately, so root `--filter` scripts keep resolving. Leave all other manifest work to Tasks 4 and 5.
- `scripts/check-env.mjs`, `scripts/check-env.regression.mjs`: import `../apps/api/config/env.js` instead of `../backend/config/env.js`.
- `scripts/check-docs.mjs`: read `apps/api/.env.example` and `apps/web/.env.example`; update the four hardcoded path strings in error messages.
- `README.md`, `docs/INSTALLATION.md`, `docs/RUNBOOK.md`: replace `backend/.env.example → apps/api/.env.example` and `JsFlow/.env.example → apps/web/.env.example`; note Phase 1 task 1.2 has now landed.
- `.github/workflows/ci.yml`: no change yet (the scripts keep their `.mjs` names in this task).

- [ ] **Step 5: Reinstall and verify nothing broke**

```powershell
$env:PATH = 'C:\Users\Parth\AppData\Local\Temp\opencode\pnpm-shim;' + $env:PATH
pnpm install --offline
pnpm check:docs
$env:JWT_SECRET = 'x' * 40; $env:MONGO_URI = 'mongodb://127.0.0.1:27017/jsflow'; $env:ALLOWED_ORIGINS = 'http://localhost:5173'
node scripts/check-env.mjs
node scripts/check-env.regression.mjs
pnpm test:seed
```

Expected: all exit 0; `pnpm-lock.yaml` regenerated with no version drift.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor: move apps into monorepo and migrate lockfiles"
```

---

## Task 3: Shared Zod schemas (task 1.4)

**Files:**

- Create: `packages/shared/src/index.ts`, `packages/shared/src/index.test.ts`
- Modify: `packages/shared/package.json` (zod from catalog)

**Interfaces:**

- Consumes: Zod 4 from catalog.
- Produces: named exports `registerSchema`, `loginSchema`, `meResponseSchema`, `userSchema`, `exampleSchema`, `errorEnvelopeSchema`, `examplesListSchema`, `usersListSchema`, `authResponseSchema`, and their inferred types (`RegisterInput`, `LoginInput`, `User`, `AuthResponse`, `Example`, `ErrorEnvelope`, …). Tasks 4 and 8 import these.

**Behaviour pins:** schemas describe the _current_ payloads only. Runtime validation stays in the Express controllers in Task 4 — switching to Zod parsing there would change error messages and violate the no-behaviour-change rule.

- [ ] **Step 1: Write the failing tests**

```typescript
import { describe, expect, it } from "vitest";
import { errorEnvelopeSchema, loginSchema, registerSchema } from "./index";

describe("shared contracts", () => {
  it("accepts the current register payload", () => {
    expect(
      registerSchema.safeParse({
        name: "A",
        email: "a@b.c",
        password: "123456",
      }).success,
    ).toBe(true);
  });
  it("rejects a password shorter than the legacy minimum of 6", () => {
    expect(
      loginSchema.safeParse({ email: "a@b.c", password: "12345" }).success,
    ).toBe(false);
  });
  it("describes the error envelope the API already returns", () => {
    expect(errorEnvelopeSchema.parse({ message: "Server error" })).toEqual({
      message: "Server error",
    });
  });
});
```

Note: `registerSchema` requires all three fields as non-empty strings, `password` min 6; `loginSchema` requires non-empty `email`/`password`; `userSchema` is `{ id: string, name: string, email: string, role: "user" | "admin" }`; `exampleSchema` is `{ id: string, title: string, code: string, createdBy: string, createdAt: string, updatedAt: string }`; `errorEnvelopeSchema` is `{ message: string }`; list schemas wrap those in `{ users }` / `{ examples }`; `authResponseSchema` is `{ message: string, token: string, user: User }`.

- [ ] **Step 2: Run the test to verify it fails**

```powershell
$env:PATH = 'C:\Users\Parth\AppData\Local\Temp\opencode\pnpm-shim;' + $env:PATH
pnpm --filter @jsflow/shared exec vitest run src/index.test.ts
```

Expected: FAIL — `Cannot find module './index'` or missing exports.

- [ ] **Step 3: Implement the schemas in `packages/shared/src/index.ts`**

Use `z.object(...).strict()` for request bodies and `.passthrough()` for Mongoose-derived response objects (they carry `_id`, `__v`, timestamps). Export `z.infer` types alongside each schema using `export type`.

- [ ] **Step 4: Run the tests to verify they pass**

```powershell
pnpm --filter @jsflow/shared exec vitest run src/index.test.ts
pnpm --filter @jsflow/shared build
```

Expected: 3/3 pass; `dist/index.d.ts` contains the inferred types.

- [ ] **Step 5: Commit**

```bash
git add packages/shared && git commit -m "feat: add shared Zod contracts for the current API"
```

---

## Task 4: Migrate `apps/api` to TypeScript (task 1.5)

**Files:**

- Rename: every `apps/api/**/*.js` → `.ts` (including `config/env.js` → `src/config/env.ts`, `api/index.js` → `src/api/index.ts`, `server.js` → `src/index.ts`)
- Create: `apps/api/src/types/express.d.ts`, `apps/api/src/types/models.ts`
- Modify: `apps/api/package.json`, `apps/api/tsconfig.json`, `scripts/check-env.mjs` → `scripts/check-env.ts`, `scripts/check-env.regression.mjs` → `scripts/check-env.regression.ts`, `scripts/seed.ts` (no change expected), `package.json` root scripts, `.github/workflows/ci.yml`
- Add to catalog + root/api manifests: `express ^5`, `cors ^2`, `jsonwebtoken ^9`, `@types/node`, `@types/express`, `@types/cors`, `@types/jsonwebtoken`

**Interfaces:**

- Consumes: shared schemas from Task 3 (`z.infer` types only), `assertEnv` shape from Phase 0.
- Produces: `apps/api/src/config/env.ts` exporting `assertEnv` and default; `apps/api/src/app.ts` default-exporting the Express app; `apps/api/src/index.ts` (server) and `apps/api/src/api/index.ts` (Vercel handler); root scripts run via `tsx scripts/check-env.ts`.

**Behaviour pins:** same routes, same middleware order, same status codes and message strings, `assertEnv` still called only at boot, `configError`/`bootstrapped` still cached at module scope in the Vercel handler, `deleteUser` self-delete check unchanged, `getExamples` still public and all writes admin-gated.

- [ ] **Step 1: Write the failing check**

```powershell
$env:PATH = 'C:\Users\Parth\AppData\Local\Temp\opencode\pnpm-shim;' + $env:PATH
pnpm --filter @jsflow/api exec tsc --noEmit
```

Expected: FAIL — no TS sources / no express types.

- [ ] **Step 2: Add type dependencies and declarations**

Catalog + `apps/api` devDependencies: `@types/node`, `@types/express`, `@types/cors`, `@types/jsonwebtoken`; `apps/api` dependencies add `express: catalog:`, `cors: catalog:`, `jsonwebtoken: catalog:`. Create `src/types/express.d.ts` augmenting `Express.Request` with `user?: { userId: string; role: "user" | "admin" }`.

- [ ] **Step 3: Rename and type the sources**

- `git mv` each `.js` to `.ts`, moving `server.js → src/index.ts`, `api/index.js → src/api/index.ts`, `config/*.js → src/config/*.ts`.
- Controllers: type `Request`/`Response` generics; keep exact message strings; replace `any` with `unknown` + narrowing; give `generateToken(user: UserDocument)` an explicit return type.
- Models: export `interface IUser` / `interface IExample` and use `mongoose.model<IUser>("User", userSchema)`; keep `password` as the field name (Phase 4 migrates it to `passwordHash`).
- `src/config/env.ts`: convert JSDoc typedef to an exported `interface Env`; keep the exact error messages and `REVOKED_MONGO_URI_MARKERS`.
- `db.ts`: keep the module-scope `cachedConnection`; update the error text from `backend/.env` to `apps/api/.env`.

- [ ] **Step 4: Convert the root env scripts to TS**

Rename `scripts/check-env.mjs → .ts` and `check-env.regression.mjs → .ts`, import `../apps/api/src/config/env.ts` (type-only `import type` where required by `verbatimModuleSyntax`). Root `package.json`: no script changes (CI invokes them directly). CI `Env validator smoke test`: replace `node scripts/check-env.mjs` with `pnpm exec tsx scripts/check-env.ts` (and the regression line likewise); keep the wildcard negative case.

- [ ] **Step 5: Verify API compiles and validators still fail fast**

```powershell
pnpm install --offline
pnpm --filter @jsflow/api exec tsc --noEmit
pnpm exec tsx scripts/check-env.ts          # with valid env -> exit 0
pnpm exec tsx scripts/check-env.regression.ts
```

Expected: exit 0 everywhere; `Select-String -Path apps/api/src/**/*.ts -Pattern '\bany\b'` finds no `any`.

- [ ] **Step 6: Commit**

```bash
git add -A apps/api scripts package.json pnpm-workspace.yaml pnpm-lock.yaml .github
git commit -m "refactor: migrate API to strict TypeScript"
```

---

## Task 5: Migrate `apps/web` to TypeScript (task 1.6)

**Files:**

- Rename: `apps/web/src/**/*.jsx` → `.tsx`, except `src/engine/{parser,simulator}.jsx` → `.ts`
- Create: `apps/web/vite.config.ts`, `apps/web/vitest.config.ts`, `apps/web/src/vite-env.d.ts`
- Modify: `apps/web/index.html`, `apps/web/package.json`, `apps/web/tsconfig.json`, all import specifiers, `apps/web/src/engine/{parser,simulator}.ts`
- Delete: `apps/web/eslint.config.js` (root flat config replaces it)

**Interfaces:**

- Consumes: Task 1 aliases (raw `packages/*/src/index.ts`), Task 3 shared types, Task 4 API shape.
- Produces: typed React app; `apps/web/index.html` points at `/src/main.tsx`; `pnpm --filter @jsflow/web build` runs `tsc --noEmit` with no unbundled package build.

- [ ] **Step 1: Write the failing check**

```powershell
$env:PATH = 'C:\Users\Parth\AppData\Local\Temp\opencode\pnpm-shim;' + $env:PATH
pnpm --filter @jsflow/web exec tsc --noEmit
Select-String -Path apps/web/index.html -Pattern 'main\.tsx'
```

Expected: FAIL — `.jsx` files not included by TS config, `index.html` still references `main.jsx`.

- [ ] **Step 2: Add web TS dev dependencies and configure aliases and Vite**

`apps/web/package.json` devDependencies add from catalog: `typescript`, `vitest`, `@types/react`, `@types/react-dom`, `@types/node`, `vite-plugin-checker`, `vite-tsconfig-paths`. Dependencies replace `react-router-dom` with `react-router: catalog:` and add `zod: catalog:`.

`apps/web/vite.config.ts`: `defineConfig` with `react()`, `tailwindcss()` (from `@tailwindcss/vite`), `checker({ typescript: true })`, `resolve.alias` mapping `@jsflow/shared` → `fileURLToPath(new URL("../../packages/shared/src/index.ts", import.meta.url))` and `@jsflow/engine` → `.../packages/engine/src/index.ts`, and the unchanged `server.proxy['/api'] = { target: 'http://localhost:5000', changeOrigin: true }`. `apps/web/vitest.config.ts`: same aliases, `test.environment: 'node'` (engine tests are pure). `apps/web/tsconfig.json`: add `paths` matching the aliases and `types: ["vite/client"]`. `src/vite-env.d.ts`: `/// <reference types="vite/client" />` plus `interface ImportMetaEnv { readonly VITE_API_BASE_URL?: string }`.

- [ ] **Step 3: Rename files and fix import specifiers**

`git mv` every `.jsx` to `.tsx` (engine files to `.ts`). Change `react-router-dom` imports to `react-router` in the 8 files that use it. Change `./parser.jsx` → `./parser`, `../engine/simulator.jsx` → `../engine/simulator`, `../utils/auth` stays extensionless. Update `index.html` script to `/src/main.tsx`.

- [ ] **Step 4: Add types without changing behaviour**

- Components: explicit prop interfaces (e.g. `{ onRun: (code: string) => void; selectedCode?: string }`, `{ children: ReactNode; adminOnly?: boolean }`); `useState<T>` / `useMemo<T>` generics.
- `src/utils/auth.ts`: `getStoredUser(): User | null` must parse with `unknown` + a type guard — never `JSON.parse(...) as User`.
- `simulator.ts`: `variables: Record<string, unknown>`; keep `safeEvaluate`'s catch returning the raw expression string.
- `parser.ts`: `instruction` is a discriminated union of `log | assign | noop` imported from `@jsflow/engine`; guard `match[2]` / `match[3]` for `noUncheckedIndexedAccess`.
- `alert`, `confirm`, `localStorage`, `document`, `window` come from `DOM` lib — no shims.

- [ ] **Step 5: Verify frontend typechecks with no package build**

```powershell
Remove-Item -Recurse -Force packages/shared/dist, packages/engine/dist
pnpm --filter @jsflow/web build
pnpm --filter @jsflow/web exec eslint src
Select-String -Path apps/web/src -Pattern 'react-router-dom|\bany\b' -Recurse
```

Expected: exit 0; no `react-router-dom`, no `any`.

- [ ] **Step 6: Commit**

```bash
git add -A apps/web && git commit -m "refactor: migrate web app to strict TypeScript"
```

---

## Task 6: Engine domain types (task 1.7)

**Files:**

- Modify: `packages/engine/src/index.ts`, `packages/engine/package.json`
- Create: `packages/engine/src/types.ts`

**Interfaces:**

- Consumes: Task 1 declaration build, Task 5 alias.
- Produces: exported `Instruction`, `LogInstruction`, `AssignInstruction`, `NoopInstruction`, `Step`, `SimulateResult`, `EngineEvent`, `ScopeSnapshot`, `CallFrame`, `EngineError` — all discriminated unions with literal `type`/`kind` fields; no `any`.

- [ ] **Step 1: Write the failing type test**

Create `packages/engine/src/types.test.ts` with `expect-type`-style assertions (or `tsc` compile-only checks):

```typescript
import type { AssignInstruction, EngineEvent } from "./types";

const assign: AssignInstruction = {
  lineNumber: 1,
  raw: "let x = 1",
  normalized: "let x = 1",
  type: "assign",
  variable: "x",
  expression: "1",
};
const event: EngineEvent = { kind: "assign", line: 1, variable: "x", value: 1 };
```

Expected: FAIL — module `./types` does not exist.

- [ ] **Step 2: Define the unions in `packages/engine/src/types.ts`**

`Instruction = LogInstruction | AssignInstruction | NoopInstruction` with `type: "log" | "assign" | "noop"`; `Step = { line: number; action: string; variables: Record<string, unknown> }`; `SimulateResult = { steps: Step[]; logs: string[] }`. Forward-looking (type-only, unused at runtime in Phase 1): `EngineEvent` discriminated by `kind` (`assign | log | call | return | branch | error`), `ScopeSnapshot`, `CallFrame`, `EngineError`. Re-export everything from `src/index.ts` using `export type`.

- [ ] **Step 3: Wire the web engine to the shared types**

In `apps/web/src/engine/parser.ts` and `simulator.ts`, replace local structural types with `import type { Instruction, Step, SimulateResult } from "@jsflow/engine"`. No runtime import.

- [ ] **Step 4: Verify**

```powershell
pnpm --filter @jsflow/engine exec vitest run src/types.test.ts
pnpm --filter @jsflow/engine build
pnpm --filter @jsflow/web exec tsc --noEmit
```

Expected: tests pass; `dist/types.d.ts` emitted; no `any`.

- [ ] **Step 5: Commit**

```bash
git add packages/engine apps/web/src/engine && git commit -m "feat: add typed engine domain unions"
```

---

## Task 7: First engine tests (task 1.8)

**Files:**

- Create: `apps/web/src/engine/parser.test.ts`, `apps/web/src/engine/simulator.test.ts`
- Modify: `apps/web/vitest.config.ts` (if needed)

**Interfaces:**

- Consumes: Task 6 typed parser/simulator.
- Produces: behavioural lock for the regex engine; `pnpm test` now runs real tests (root `test:seed` remains separate).

- [ ] **Step 1: Write the failing tests**

```typescript
import { parseCodeToInstructions } from "./parser";

it("recognises declarations, bare reassignment and console.log, noops the rest", () => {
  const result = parseCodeToInstructions(
    "// skip me\nlet x = 1\nx = x + 1\nconsole.log(x)\nif (true) { console.log(2) }",
  );
  expect(result.map((i) => i.type)).toEqual([
    "assign",
    "assign",
    "log",
    "noop",
  ]);
  expect(result[0]).toMatchObject({
    lineNumber: 2,
    variable: "x",
    expression: "1",
  });
});
```

```typescript
import { simulateCodeFlow } from "./simulator";

it("snapshots variables per step and prefixes every log with its line", () => {
  expect(simulateCodeFlow("let x = 1\nx = 2\nconsole.log(x)")).toEqual({
    steps: [
      { line: 1, action: "Set x", variables: { x: 1 } },
      { line: 2, action: "Set x", variables: { x: 2 } },
      { line: 3, action: "Console output", variables: { x: 2 } },
    ],
    logs: ["Line 1: x = 1", "Line 2: x = 2", "Line 3: console.log -> 2"],
  });
});

it("returns the raw expression string when evaluation fails", () => {
  expect(simulateCodeFlow("let x = nope").steps[0]?.variables.x).toBe("nope");
});
```

These are **characterization tests**: they lock behaviour that already exists. To prove they can fail, deliberately mutate one expectation before the real run — change `["assign", "assign", "log", "noop"]` to `["noop", "assign", "log", "noop"]`, run, watch the assertion fail for that exact reason, then restore the correct value. Record both outputs in the ledger.

- [ ] **Step 2: Run the tests to verify they pass with the correct expectations**

```powershell
pnpm --filter @jsflow/web exec vitest run src/engine/parser.test.ts src/engine/simulator.test.ts
pnpm test
```

Expected: all pass; `pnpm test` 4/4 packages green with real tests in `@jsflow/web`.

- [ ] **Step 3: Remove temporary `--passWithNoTests` from package test scripts**

`apps/web`, `apps/api`, `packages/shared`, `packages/engine`: `test` becomes `vitest run`. Update the CI TODO comment that referenced it. Keep `pnpm test:seed` unchanged.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/engine apps/web/package.json apps/api/package.json packages .github
git commit -m "test: lock legacy engine behaviour and enforce real test gates"
```

---

## Task 8: Typed API client (task 1.9)

**Files:**

- Modify: `apps/web/src/api/Client.ts`, `Authapi.ts`, `Examplesapi.ts`, `apps/web/src/utils/auth.ts`
- Create: `apps/web/src/api/client.test.ts`

**Interfaces:**

- Consumes: Task 3 inferred types; `apiRequest(path, options?)` keeps its exact signature and error messages.
- Produces: typed `registerApi`, `loginApi`, `meApi`, `logoutApi`, `getStoredUser`, `hasToken`, `fetchExamplesApi`, `createExampleApi`, `deleteExampleApi`, `fetchUsersApi`, `deleteUserApi`.

- [ ] **Step 1: Write the failing behaviour test**

```typescript
import { vi } from "vitest";
import { loginApi, registerApi } from "./Authapi";

it("persists auth on login but not on register", async () => {
  const setItem = vi.spyOn(Storage.prototype, "setItem");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({
        message: "ok",
        token: "t",
        user: { id: "1", name: "A", email: "a@b.c", role: "user" },
      }),
    }),
  );
  await registerApi({ name: "A", email: "a@b.c", password: "123456" });
  expect(setItem).not.toHaveBeenCalled();
  await loginApi({ email: "a@b.c", password: "123456" });
  expect(setItem).toHaveBeenCalledWith("token", "t");
});
```

Expected: FAIL — modules are still `.jsx`-era untyped and the spy setup is new.

- [ ] **Step 2: Type the client with `z.infer`**

`apiRequest<T>(path: string, options?: RequestInit): Promise<T>` returns `await response.json() as T`. `Authapi.ts`: `registerApi(data: RegisterInput): Promise<AuthResponse>` (no persistence), `loginApi(data: LoginInput): Promise<AuthResponse>` (calls `persistAuth`), `meApi(): Promise<{ user: User }>`, `getStoredUser(): User | null` via `unknown` guard. `Examplesapi.ts`: `fetchExamplesApi(): Promise<Example[]>` etc. Keep every URL, header, and error string verbatim.

- [ ] **Step 3: Verify**

```powershell
pnpm --filter @jsflow/web exec vitest run src/api/client.test.ts
pnpm --filter @jsflow/web exec tsc --noEmit
```

Expected: test passes; typecheck clean; no `any`.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/api apps/web/src/utils && git commit -m "refactor: type the API client from shared Zod contracts"
```

---

## Task 9: Vercel reconfiguration (task 1.10)

**Files:**

- Create: `apps/api/vercel.json`, `apps/web/vercel.json`
- Modify: `apps/api/src/config/db.ts` (already repointed in Task 4), `docs/RUNBOOK.md`, `docs/INSTALLATION.md`

**Interfaces:**

- Consumes: Task 4/5 apps in their new locations.
- Produces: deploy configs whose relative paths are correct from the new Vercel Root Directory.

- [ ] **Step 1: Write the failing check**

```powershell
Test-Path apps/api/vercel.json; Test-Path apps/web/vercel.json
```

Expected: FAIL — no configs in the new locations.

- [ ] **Step 2: Recreate the configs**

`apps/api/vercel.json`: `version: 2`, `builds: [{ src: "src/api/index.ts", use: "@vercel/node" }]`, `routes: [{ src: "/api/(.*)", dest: "src/api/index.ts" }]`. `apps/web/vercel.json`: SPA rewrite `/(.*) → /index.html` (same as legacy). Document in `docs/RUNBOOK.md` that **Root Directory** is a Vercel dashboard setting (`apps/web`, `apps/api`), listing build command / output directory / env vars per environment.

- [ ] **Step 3: Verify structurally**

```powershell
pnpm exec prettier --check apps/api/vercel.json apps/web/vercel.json
pnpm --filter @jsflow/api exec tsc --noEmit
```

Expected: exit 0. Preview deploy is a human step (dashboard access) — ledger it explicitly.

- [ ] **Step 4: Commit**

```bash
git add apps/api/vercel.json apps/web/vercel.json docs && git commit -m "chore: reconfigure Vercel for the monorepo layout"
```

---

## Task 10: Scope `exactOptionalPropertyTypes` (task 1.11)

**Files:**

- Modify: `tooling/tsconfig/base.json` **or** per-package overrides in `packages/*/tsconfig.json`, `apps/api/tsconfig.json`
- Explicitly NOT `apps/web/tsconfig.json`

**Interfaces:**

- Consumes: all previous tasks.
- Produces: `exactOptionalPropertyTypes: true` on `@jsflow/shared`, `@jsflow/engine`, `@jsflow/api`; absent/false on `@jsflow/web`.

- [ ] **Step 1: Write the failing check**

```powershell
Select-String -Path packages/shared/tsconfig.json, packages/engine/tsconfig.json, apps/api/tsconfig.json -Pattern 'exactOptionalPropertyTypes'
```

Expected: FAIL — no matches.

- [ ] **Step 2: Enable it on the three configs and fix resulting errors**

Add `exactOptionalPropertyTypes: true` to each. Fix by distinguishing `undefined` from absent properties (use `?: T | undefined` where the value is genuinely present-but-undefined). Do **not** add it to `apps/web`.

- [ ] **Step 3: Verify scope and full suite**

```powershell
$env:PATH = 'C:\Users\Parth\AppData\Local\Temp\opencode\pnpm-shim;' + $env:PATH
(Select-String -Path apps/web/tsconfig.json -Pattern 'exactOptionalPropertyTypes' | Measure-Object).Count   # expect 0
pnpm typecheck && pnpm lint && pnpm test && pnpm test:seed && pnpm build && pnpm check:docs
```

Expected: count 0; every gate exit 0.

- [ ] **Step 4: Commit**

```bash
git add packages apps/api && git commit -m "chore: enable exactOptionalPropertyTypes on packages and API"
```

---

## Task 11: Phase 1 gate and honest status

**Files:**

- Modify: `README.md`, `docs/CASE_STUDY.md`

**Interfaces:**

- Consumes: all tasks above.
- Produces: honest "Phase 1 complete" status, gate evidence in the ledger.

- [ ] **Step 1: Write the failing check**

```powershell
Select-String -Path README.md -Pattern 'Phase 1.*(pending|not started|next)'
```

Expected: FAIL — stale status remains.

- [ ] **Step 2: Update status and case study**

README: capability table marks TypeScript monorepo / shared contracts / typed client / engine tests as present; roadmap Phase 1 becomes done; getting-started uses `apps/api/.env.example` and `apps/web/.env.example`. `docs/CASE_STUDY.md`: add a short honest section on what the migration did and did not change.

- [ ] **Step 3: Run the full gate**

```powershell
pnpm typecheck && pnpm lint && pnpm test && pnpm test:seed && pnpm build && pnpm check:docs
```

Expected: all exit 0. Confirm `git ls-files | Select-String 'JsFlow/|backend/'` is empty and `git ls-files | Select-String '\.jsx$'` is empty.

- [ ] **Step 4: Commit**

```bash
git add README.md docs && git commit -m "docs: record Phase 1 completion"
```

---

## Phase 1 Gate — verification before claiming completion

```powershell
# No legacy paths or JSX remain
git ls-files | Select-String 'JsFlow/|backend/|\.jsx$'      # empty
# All quality gates
pnpm typecheck; pnpm lint; pnpm test; pnpm test:seed; pnpm build; pnpm check:docs
# Behaviour unchanged
pnpm --filter @jsflow/web exec vitest run src/engine src/api
# Deploy config present
Test-Path apps/api/vercel.json; Test-Path apps/web/vercel.json
# Human-owned: Vercel dashboard Root Directory + preview deploy (task 1.10)
```

Only after every line passes — and the preview deploy is confirmed by the human — is Phase 1 complete. Then Phase 2 (the engine) begins.
