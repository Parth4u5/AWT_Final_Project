/**
 * Documentation contract check (verification-first for Phase 0 task 0.10/0.11).
 * Fails when the runbook or the env examples are incomplete.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const apiEnv = read("backend/.env.example");
const webEnv = read("JsFlow/.env.example");
const runbook = read("docs/RUNBOOK.md");

const apiVars = [
  "PORT",
  "MONGO_URI",
  "JWT_SECRET",
  "ALLOWED_ORIGINS",
  "CSRF_SECRET",
  "REDIS_URL",
  "ANTHROPIC_API_KEY",
  "SENTRY_DSN",
  "SEED_ADMIN_EMAIL",
  "SEED_ADMIN_PASSWORD",
  "SEED_ADMIN_NAME",
];

for (const name of apiVars) {
  assert.match(
    apiEnv,
    new RegExp(`^${name}=`, "m"),
    `${name} missing from backend/.env.example`,
  );
  const line =
    apiEnv.split("\n").find((entry) => entry.startsWith(`${name}=`)) ?? "";
  assert.ok(
    apiEnv.indexOf(line) > 0,
    `${name} needs a description in backend/.env.example`,
  );
}
assert.match(
  webEnv,
  /^VITE_API_BASE_URL=/m,
  "VITE_API_BASE_URL missing from JsFlow/.env.example",
);

for (const section of [
  "Service inventory",
  "Rotate",
  "Revoke",
  "Rollback",
  "Health checks",
  "G7",
  "G12",
  "Task 0",
  "mongodb",
  "Vercel",
  "Upstash",
  "Anthropic",
  "Sentry",
  "Plausible",
  "uptime",
]) {
  assert.ok(
    runbook.toLowerCase().includes(section.toLowerCase()),
    `docs/RUNBOOK.md is missing: ${section}`,
  );
}

assert.ok(
  !/mongodb\+srv:\/\/[^<]*:[^<\s]+@/.test(apiEnv),
  "backend/.env.example must not contain a real-looking connection string",
);

// Status claims must reflect the tasks that are actually committed (review finding).
const readme = read("README.md");
const staleClaims = [
  "the held tasks (1, 9, 10)",
  "there is no local Docker/seed flow yet",
  "pending Docker/seed (Task 9)",
  "do not exist on this branch yet",
  "Phase 0 (held)",
];
for (const stale of staleClaims) {
  assert.ok(
    !readme.includes(stale),
    `README contains stale status claim: ${stale}`,
  );
}
assert.match(
  readme,
  /Tasks 1, 9 and 10 are complete/i,
  "README must state that Tasks 1, 9 and 10 are complete",
);

console.log(
  "PASS: env examples, runbook and README satisfy the documentation contract.",
);
