# Contributing to JS Flow Visualizer

Thanks for your interest in this project. JS Flow Visualizer is being built as a
**production-quality, portfolio-grade TypeScript web app** — the goal is depth,
polish and defensibility, not shipping fast. That standard applies to
contributions too. The full proposal lives in
[`docs/BUILD_LIST.md`](docs/BUILD_LIST.md); start there for scope and direction.

## Before you start

- **Status:** Phase 0 (Setup & Foundation). The execution engine is not built
  yet — it lands in Phase 2. Please do not open PRs that claim features the
  build list schedules for a later phase.
- **No product behaviour changes in Phase 0.** Work in this phase is safety,
  reproducibility and tooling only.
- **Decisions are recorded.** Architecture choices have ADRs in `docs/adr/`.
  If your change revisits one, update the ADR in the same PR (and note it in the
  description).

## Local setup

1. Use the pinned Node version in `.nvmrc` (**22 LTS**). Node 24 is also tested
   in CI, but 22 is the development baseline.
2. Enable pnpm with Corepack and install dependencies:

   ```bash
   corepack enable
   pnpm install --frozen-lockfile
   ```

3. Verify the machine before you begin (`docs/INSTALLATION.md` has the full
   fail-fast checklist):

   ```bash
   pnpm lint && pnpm typecheck && pnpm test && pnpm build
   ```

4. Run both apps with `pnpm dev`. See [`docs/INSTALLATION.md`](docs/INSTALLATION.md)
   and [`docs/RUNBOOK.md`](docs/RUNBOOK.md) for environment variables and
   services.

## Branches, commits and pull requests

- Branch from `main` with a short, descriptive name, e.g. `feat/scope-chain`,
  `fix/health-check`.
- **Conventional Commits are enforced** by commitlint (`ci:`, `feat:`, `fix:`,
  `docs:`, `chore:`, `refactor:`, `test:`, etc.). A malformed message is
  rejected by the `commit-msg` hook.
- Pre-commit runs Prettier and ESLint via lint-staged. Formatting and lint
  errors must be fixed before you can commit.
- Keep PRs focused and reviewable. One concern per PR; explain the _why_, not
  just the _what_, in the description.
- CI must be green on **Node 22 and 24** before a PR can merge. `main` also
  requires one review and linear history (branch protection is configured by
  the repository owner).
- Use `pnpm changeset` when a change affects a versionable workspace package.

## Quality bar

- `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` all pass locally
  and in CI.
- TypeScript is `strict` with `noUncheckedIndexedAccess` and
  `verbatimModuleSyntax`; avoid `any` (ESLint rejects it).
- Tests accompany behaviour changes. Coverage thresholds, Lighthouse scores
  and a bundle-size budget are planned quality gates (see `docs/BUILD_LIST.md`
  §4.1) — do not add half-enforced versions of them ahead of their phase.
- Accessibility and security are part of "done", not a follow-up. No secrets
  in git, no `origin: "*"` CORS, no fallback credentials.

## Reporting problems

- Security vulnerabilities: follow [`SECURITY.md`](SECURITY.md) and report
  privately. **Never** open a public issue for an unpatched vulnerability.
- Behavioural bugs and feature requests: open an issue with reproduction
  steps and the relevant build-list task number, if there is one.
- Community expectations are in [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

## License

By contributing you agree that your contributions are licensed under the
[MIT License](LICENSE).
