# Security Policy

JS Flow Visualizer is a pre-1.0 portfolio project under active development.
Security is taken seriously even at this stage: the build list treats leaked
credentials, insecure configuration and the execution sandbox as first-class
risks (see [`docs/BUILD_LIST.md`](docs/BUILD_LIST.md) §2 and §5).

## Supported versions

| Version              | Supported          |
| -------------------- | ------------------ |
| `main` (latest)      | :white_check_mark: |
| Older commits / tags | :x:                |

Only the latest state of `main` receives security fixes. Please update before
reporting an issue that may already be fixed.

## Reporting a vulnerability

**Please do not open a public issue for a security problem.**

Use GitHub's private vulnerability reporting on this repository
(**Security → Report a vulnerability**). If that is unavailable, contact the
maintainer privately through their GitHub profile ([@Parth4u5](https://github.com/Parth4u5)).
Please include:

- a description of the issue and its impact,
- steps to reproduce (a minimal proof of concept is ideal),
- affected files, versions or deployments, and
- any suggested mitigation you have considered.

You should receive an acknowledgement within **5 business days**. You will be
kept informed as the issue is triaged and fixed, and credited in the fix if you
wish. Please give us a reasonable opportunity to patch before any public
disclosure.

## Scope

Of particular interest (non-exhaustive):

- authentication, JWT handling and session/refresh-token flows,
- CORS configuration, rate limiting and admin privilege checks,
- the JavaScript execution sandbox — any path that reaches `window`,
  `document`, `fetch`, `eval`, `Function` or the host process,
- exposure of secrets, `.env` files or credentials in git history or logs.

## Secrets policy for contributors

- Never commit `.env` files, tokens or credentials. Files matching `.env*` are
  ignored (except `.env.example`); placeholders in example files must be
  rejected by the fail-fast env validator.
- If you believe a credential has been exposed, rotate it first and then report
  it privately. Follow [`docs/RUNBOOK.md`](docs/RUNBOOK.md) for rotation and
  revocation.
- Security-relevant changes must keep the CI gates green
  (`pnpm lint && pnpm typecheck && pnpm test && pnpm build`) and should be
  accompanied by a regression test.
