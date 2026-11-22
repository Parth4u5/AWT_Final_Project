# JS Flow Visualizer — Case Study

> **Status: written alongside the code.** Sections are filled in as each phase lands, from real decisions
> and real numbers — never retro-fitted to look good after the fact. Headings without content are still
> placeholders for later phases.

## The problem

## Why the regex simulator failed

## The event-stream design

## Key decisions and trade-offs

### Phase 1 — the TypeScript migration (complete)

Phase 1 moved the existing JavaScript app into the monorepo without changing what it does. Three
decisions are worth recording because they traded short-term convenience for later safety:

- **Zod schemas are type-only in Phase 1.** `packages/shared` defines the request/response contract, but the
  Express controllers keep their existing hand-written validation. Moving validation onto Zod in the same
  commit would have changed user-visible error messages — exactly what a "no-op refactor" must not do.
  Phase 4 task 4.2 makes Zod the runtime validator once behaviour changes are allowed.
- **Raw TS source in dev, declarations for build.** `apps/web` aliases `packages/*` to their `src/index.ts`
  via Vite, so `pnpm dev` never needs a package build. `pnpm build` still emits `.d.ts` files with
  `tsc --emitDeclarationOnly`, giving the packages a real distribution contract without slowing the loop.
- **Characterization before correction.** The legacy regex engine is locked by tests that assert its exact
  quirks — a failed evaluation returns the expression text, control flow becomes a `noop`, and an empty
  source yields empty `steps`/`logs`. Those tests make the eventual Phase 2 engine replacement a deliberate
  change rather than an accidental one.

What did **not** change: routes, status codes, error strings, the browser UI, and the anonymous behaviour.
The only visible differences are import specifiers (`react-router-dom` → `react-router`, per React Router v7)
and file extensions.

## What I'd do differently
