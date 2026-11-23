# Phase 2 — The Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the regex line-splitter with a real AST interpreter that emits a typed, replayable event stream, supports the full Tier 1 + Tier 2 language scope, runs safely in a sandbox, and powers grading and the existing UI.

**Architecture:** A Babel parser produces an AST. A scope chain and a **suspendable generator** interpreter walk it, yielding `EngineEvent`s through a tracer. Every value crossing the worker boundary is a tagged, serialisable `EngineValue`. The driver either drains the generator into a `ProgramResult` (instant replay) or pauses/resumes it (real breakpoints). The same pure engine runs in the browser worker and on the server for grading. A shim converts the event stream into the legacy `{steps, logs}` shape so the Phase 1 UI keeps working until Phase 3.

**Tech Stack:** TypeScript 5.9 strict, `@babel/parser` ^7.28, Vitest 3, `fast-check` ^4 (property tests), `expect-type` ^1, NO DOM/Node-only APIs in engine source.

**Spec:** [`docs/BUILD_LIST.md`](../../BUILD_LIST.md) §7 (Phase 2), §4.4 (oracle), §2.3/2.5 (sandbox), §13 (data model), §19 (DoD).

## Global Constraints

- **No behaviour change outside `packages/engine` until Task 12** (legacy adapter). The Phase 1 UI must stay green.
- Engine source is pure TypeScript: no `window`, `document`, `fetch`, `eval`, `Function`, `require`, `process`, `Date.now`, `Math.random`.
- TDD: write the failing test, watch it fail for the intended reason, implement minimally, watch it pass, run full suite.
- Memory management: the generator yields one event at a time; the driver may retain a bounded event array capped by the step budget (100,000). Scope snapshots are tagged values, not live objects. Builtin tables are module-level frozen singletons (cached once).
- Caching: parser output may be memoised by source hash in the driver only; the interpreter itself stays stateless between runs.
- `EngineValue` is the only value that crosses the worker/storage/export boundary.
- Step budget: 100,000 events; instruction timeout: 5 seconds of wall time in the driver.
- All shipped language features are the DECIDED Tier 1 + Tier 2 list in spec §7.4. `class`, `async`, getters/setters, modules, JSX are out of scope.

## Review Focus

1. **Sandbox isolation** — `window`, `document`, `fetch`, `eval`, `Function`, `require`, `process` must throw `ReferenceError` inside the engine, never reach the host. Pinned in Task 8.
2. **Infinite loops terminate** — `while (true) {}` must stop with a friendly `EngineError` and bounded memory, not freeze. Pinned in Task 8.
3. **Serialiser cycle safety** — a self-referential object must render as `↺` instead of throwing on export. Pinned in Task 1.
4. **Suspendable semantics** — the generator must be pausable and resumable with correct scope/stack; a breakpoint test must prove real pause, not replay. Pinned in Task 6.
5. **Legacy UI compatibility** — the adapter produces exactly the `{steps, logs}` shape the Phase 1 tests assert, and the oracle corpus agrees with `node:vm`. Pinned in Tasks 10 and 12.

---

## File Structure

```
packages/engine/src/
├── types.ts          # rewritten: EngineValue, EngineEvent, Scope, Frame, EngineError, ProgramResult
├── tracer.ts         # sequence-numbered event emitter
├── serializer.ts     # toEngineValue / fromEngineValue, cycle detection
├── parser.ts         # Babel parse + friendly errors + out-of-scope detection
├── scopes.ts         # ScopeChain: global → function → block, hoisting, TDZ
├── interpreter.ts    # generator walker, statements + expressions + functions
├── builtins/
│   ├── index.ts      # frozen global object + whitelist
│   ├── console.ts, math.ts, json.ts, array.ts, string.ts, number.ts, object.ts, date.ts
├── sandbox.ts        # createSandbox(), step budget, timeout, host isolation
├── driver.ts         # run(source, options) → ProgramResult; pause/resume API
├── grader.ts         # ProgramResult → test assertions
├── adapter.ts        # ProgramResult → legacy {steps, logs}
├── fixtures/         # teaching programs + expected outputs
└── index.ts          # public exports
```

---

## Task 1: Engine value model, types, tracer, serializer (tasks 2.1, 2.3)

**Files:**

- Modify: `packages/engine/src/types.ts`, `packages/engine/src/index.ts`
- Create: `packages/engine/src/tracer.ts`, `packages/engine/src/serializer.ts`, `packages/engine/src/tracer.test.ts`, `packages/engine/src/serializer.test.ts`
- Modify: `packages/engine/package.json` (add `@babel/parser`, `fast-check` from catalog)

**Interfaces:**

- Produces: `EngineValue` union exactly as spec §7.3; `EngineEvent` with `{ seq, type, line, column, action, value?, scope?, stack? }`; `Scope`, `CallFrame`, `EngineError`, `ProgramResult`; `Tracer` class with `next(seq): Tracer`, `emit(event): EngineEvent`; `toEngineValue(value, seen?): EngineValue`, `fromEngineValue(v): unknown`.

- [ ] **Step 1: Write failing tests**

```typescript
// serializer.test.ts
it("renders cycles as ↺", () => {
  const obj: Record<string, unknown> = {};
  obj.self = obj;
  expect(toEngineValue(obj)).toMatchObject({
    t: "object",
    entries: { self: { t: "string", v: "↺" } },
  });
});
it("round-trips primitives", () => {
  expect(fromEngineValue(toEngineValue(42))).toBe(42);
});
```

```typescript
// tracer.test.ts
it("numbers events from 0", () => {
  const t = new Tracer();
  const e = t.emit({ type: "log", line: 1, column: 0, action: "console.log" });
  expect(e.seq).toBe(0);
});
```

Expected: FAIL — modules/exports missing.

- [ ] **Step 2: Implement types + tracer + serializer**

Define the full union; `toEngineValue` uses a `WeakSet` to detect cycles; `fromEngineValue` is the inverse. Serialiser never throws on cyclic input.

- [ ] **Step 3: Verify**

`pnpm --filter @jsflow/engine exec vitest run src/serializer.test.ts src/tracer.test.ts` → all pass. `pnpm typecheck` → clean.

- [ ] **Step 4: Commit** — `feat: add engine value model, tracer and serializer`

---

## Task 2: Parser with friendly errors and scope detection (task 2.2)

**Files:**

- Create: `packages/engine/src/parser.ts`, `packages/engine/src/parser.test.ts`

**Interfaces:**

- Consumes: `EngineError` from Task 1.
- Produces: `parse(source: string): ParseResult` where `ParseResult = { ast: File; errors: EngineError[] }`; `isSupported(node: Node): boolean`.

- [ ] **Step 1: Failing tests**

```typescript
it("reports line and column on a syntax error", () => {
  const r = parse("let x = ;");
  expect(r.errors[0]).toMatchObject({
    name: "SyntaxError",
    line: 1,
    column: 9,
  });
});
it("flags out-of-scope class as an engine error", () => {
  const r = parse("class A {}");
  expect(r.errors[0]?.message).toMatch(/not supported/);
});
```

Expected: FAIL.

- [ ] **Step 2: Implement with `@babel/parser`**

Use `parse(source, { sourceType: "script", errorRecovery: true, plugins: [] })`. Convert Babel errors to `EngineError` with `loc.line/column`. Walk AST to reject unsupported node types (`ClassDeclaration`, `AwaitExpression`, `FunctionDeclaration` with `async`, getters/setters, modules). Keep `errorRecovery` so multiple errors can be reported.

- [ ] **Step 3: Verify** — tests pass; `parse("const x = 1").errors` is empty.

- [ ] **Step 4: Commit** — `feat: add Babel parser with friendly errors and scope detection`

---

## Task 3: Scope chain (task 2.4)

**Files:**

- Create: `packages/engine/src/scopes.ts`, `packages/engine/src/scopes.test.ts`

**Interfaces:**

- Consumes: `EngineValue`, `Scope`, `EngineError`.
- Produces: `class ScopeChain` with `push(kind: "global"|"function"|"block")`, `pop()`, `declare(name, value, kind: "var"|"let"|"const")`, `assign(name, value)`, `lookup(name): EngineValue`, `snapshot(): ScopeSnapshot`.

- [ ] **Step 1: Failing tests** — `let` is block-scoped; `var` hoists to function; TDZ throws on access before declaration; redeclaring `const` throws.

- [ ] **Step 2: Implement** — scopes hold `Map<string, {value, kind, initialized}>`. `var` declarations hoist to nearest function/global scope with `undefined`. `let`/`const` are uninitialised until declaration executes; lookup in TDZ throws `ReferenceError` with line info.

- [ ] **Step 3: Verify** — tests pass.

- [ ] **Step 4: Commit** — `feat: add scope chain with hoisting and TDZ`

---

## Task 4: Expression evaluator — Tier 1 (task 2.5)

**Files:**

- Create: `packages/engine/src/expressions.ts`, `packages/engine/src/expressions.test.ts`

**Interfaces:**

- Consumes: `ScopeChain`, `EngineValue`, `EngineEvent`.
- Produces: `function* evaluate(node: Expression, ctx: EvalContext): Generator<EngineEvent, EngineValue>`.

Covers: literals, identifiers, binary/unary/logical/ternary, `typeof`, template literals, arrays, objects (computed/shorthand/nested), member access + optional chaining, calls + spread, `new`, arrow/function expressions (handled by interpreter in Task 6).

- [ ] **Step 1: Failing tests** — property-access on `undefined` with `?.` yields `undefined`; `??` chooses right only on null/undefined; `**` precedence; template literal interpolation.

- [ ] **Step 2: Implement** — generator yields before/after each evaluation event; uses scope lookup; calls builtins from Task 7 via `ctx.globals`.

- [ ] **Step 3: Verify** — tests pass.

- [ ] **Step 4: Commit** — `feat: add Tier 1 expression evaluator`

---

## Task 5: Statements and control flow — Tier 1 (task 2.6)

**Files:**

- Create: `packages/engine/src/statements.ts`, `packages/engine/src/statements.test.ts`

**Interfaces:**

- Produces: `function* execute(node: Statement, ctx: EvalContext): Generator<EngineEvent, void>`, handling blocks, `if/else`, `for`, `while`, `do…while`, `for…of`, `break`/`continue` via a `Completion` signal, declarations, expression statements, `return`, `throw`, `try/catch/finally`.

- [ ] **Step 1: Failing tests** — nested loops with break/continue; `for…of` over array; `if/else` branch events; try/catch/finally ordering.

- [ ] **Step 2: Implement** — completion records `{ type: "normal"|"break"|"continue"|"return"|"throw", value? }`; loops translate them.

- [ ] **Step 3: Verify** — tests pass, event stream contains branch events for taken paths.

- [ ] **Step 4: Commit** — `feat: add Tier 1 statements and control flow`

---

## Task 6: Functions, closures, call stack — generator core (task 2.7)

**Files:**

- Create: `packages/engine/src/interpreter.ts`, `packages/engine/src/interpreter.test.ts`

**Interfaces:**

- Produces: `function* interpret(ast: File, ctx: RunContext): Generator<EngineEvent, ProgramResult>`; `ProgramResult = { events: EngineEvent[]; output: EngineValue[]; globals: Record<string, EngineValue>; error?: EngineError; stats: { steps: number; durationMs: number } }`.

Function declarations/expressions/arrows create closures capturing the defining `ScopeChain`; calls push a `CallFrame` onto `ctx.stack`; `return` pops it. Recursion works.

- [ ] **Step 1: Failing tests** — recursion factorial; closure counter; call stack events contain frame names; **generator pause/resume** test:

  ```typescript
  const gen = interpret(parse("let x=1; x=2;").ast, ctx);
  expect(gen.next().value).toMatchObject({ type: "assign" });
  expect(ctx.scopes.lookup("x")).toEqual({ t: "number", v: 1 });
  expect(gen.next().value).toMatchObject({ type: "assign" });
  ```

  Expected: FAIL before implementation.

- [ ] **Step 2: Implement** — wire parser → statements → expressions; emit `call`/`return` events; maintain frames.

- [ ] **Step 3: Verify** — tests pass; generator resume semantics proven.

- [ ] **Step 4: Commit** — `feat: add generator interpreter with closures and call stack`

---

## Task 7: Builtins library — Tier 1 (task 2.8)

**Files:**

- Create: `packages/engine/src/builtins/*.ts`, `packages/engine/src/builtins/index.test.ts`

**Interfaces:**

- Produces: `builtins: Readonly<Record<string, EngineValue>>` — frozen singleton. Includes `console.log/warn/error/info`, `Math` subset, `Number`, `parseInt`, `parseFloat`, `isNaN`, `String` methods, `Boolean`, `JSON`, `Object.keys/values/entries/assign`, `Array` methods (`map/filter/reduce/push/pop/join/length/indexOf/includes/slice/concat`), `Date` read-only.

- [ ] **Step 1: Failing tests** — `[1,2,3].map(x => x*2)`; `JSON.stringify({a:1})`; `Math.max(1,5)`; `console.log` captured as output event.

- [ ] **Step 2: Implement** — builtins operate on live engine values, return engine values; `console.*` pushes to `ctx.output`.

- [ ] **Step 3: Verify** — tests pass.

- [ ] **Step 4: Commit** — `feat: add whitelisted builtin library`

---

## Task 8: Sandbox, step budget, timeout (task 2.9)

**Files:**

- Create: `packages/engine/src/sandbox.ts`, `packages/engine/src/sandbox.test.ts`
- Modify: `packages/engine/src/driver.ts` (create with `run()`)

**Interfaces:**

- Produces: `createSandbox(options?): Sandbox` and `run(source: string, options?: RunOptions): ProgramResult`.

- [ ] **Step 1: Failing tests**

  ```typescript
  expect(run("console.log(window)").error?.name).toBe("ReferenceError");
  expect(run("while (true) {}").error?.message).toMatch(/execution limit/i);
  ```

  Also `fetch`, `document`, `eval`, `Function`, `require`, `process` each throw `ReferenceError`.

- [ ] **Step 2: Implement** — sandbox global object contains only builtins; unknown identifiers throw. Driver counts events (cap 100,000) and checks elapsed time (5s), returning an `EngineError` with `line`/`column` when exceeded.

- [ ] **Step 3: Verify** — tests pass; memory bounded (event array never exceeds budget).

- [ ] **Step 4: Commit** — `feat: add sandbox with step and timeout limits`

---

## Task 9: Tier 2 sweep (task 2.10)

**Files:**

- Modify parser/interpreter/expressions/statements and their tests.

**Scope:** destructuring (array/object, defaults, rest), `switch`, `try/catch` already done, `for…in`, spread/rest, computed properties, `?.` done, `??` done, `**` done, `new` done, `JSON` done, array/string/object methods done. Add missing: `switch`, `for…in`, destructuring patterns.

- [ ] **Step 1: Failing tests** — `const {a, b: [x]} = obj`; `for (const k in obj)`; `switch` with fall-through.

- [ ] **Step 2: Implement** — pattern binding in declarations and parameters; switch completion; `for…in` over object keys.

- [ ] **Step 3: Verify** — tests pass.

- [ ] **Step 4: Commit** — `feat: complete Tier 2 language sweep`

---

## Task 10: Oracle harness and golden snapshots (task 2.11)

**Files:**

- Create: `packages/engine/src/oracle/*.test.ts`, `packages/engine/src/fixtures/*.js`

**Interfaces:**

- Produces: `runFixture(name)` helper; golden snapshot files with expected `{output, globals}`.

- [ ] **Step 1: Failing test** — `fast-check` generates arithmetic/comparison expressions over a seeded scope; for each, compare `run(code).output` with `node:vm` evaluation of the same expression. Golden snapshot for closures/loops authored from the JS spec, not from engine output.

- [ ] **Step 2: Implement** — fixed-seed property test; hand-authored fixtures for control flow, closures, recursion, destructuring, try/catch.

- [ ] **Step 3: Verify** — all corpus cases agree; coverage report ≥ 90% for engine.

- [ ] **Step 4: Commit** — `test: add oracle corpus and golden snapshots`

---

## Task 11: Grader (task 2.12)

**Files:**

- Create: `packages/engine/src/grader.ts`, `packages/engine/src/grader.test.ts`

**Interfaces:**

- Produces: `grade(result: ProgramResult, tests: TestAssertion[]): GradeResult` supporting `output-equals`, `output-contains`, `global-equals`.

- [ ] **Step 1: Failing test** — assertions pass/fail with correct score.

- [ ] **Step 2: Implement** — pure comparison over `EngineValue`s.

- [ ] **Step 3: Verify** — tests pass.

- [ ] **Step 4: Commit** — `feat: add challenge grader`

---

## Task 12: Legacy steps adapter (task 2.13)

**Files:**

- Create: `packages/engine/src/adapter.ts`, `packages/engine/src/adapter.test.ts`
- Modify: `apps/web/src/engine/simulator.ts` to delegate to the engine **only after** the adapter passes.

**Interfaces:**

- Produces: `toLegacySteps(result: ProgramResult): { steps: Step[]; logs: string[] }` matching Phase 1 exactly: `action` strings `Set x`, `Console output`, `Execute: …`; logs prefixed `Line n: `.

- [ ] **Step 1: Failing test** — adapter output equals the Phase 1 simulator for the same programs (reuse the characterization tests).

- [ ] **Step 2: Implement** — map `EngineEvent`s to legacy steps/logs, preserving quirks where the old engine would have produced them; unsupported programs produce noop-style steps.

- [ ] **Step 3: Verify** — existing `apps/web/src/engine/*.test.ts` still pass against the delegated simulator.

- [ ] **Step 4: Commit** — `feat: add legacy steps adapter and wire the UI`

---

## Task 13: Deviation list, fixture corpus, public exports (tasks 2.14, 2.15)

**Files:**

- Create: `packages/engine/README.md`, `packages/engine/src/fixtures/index.ts`
- Modify: `packages/engine/src/index.ts`

- [ ] **Step 1: Failing check** — `Test-Path packages/engine/README.md` and fixture count ≥ 20.

- [ ] **Step 2: Implement** — README documents the language scope contract and deviations (`Date` frozen, no `Math.random`, integer-key ordering normalised). Public exports include `run`, `parse`, `grade`, `toLegacySteps`, `toEngineValue`, `fromEngineValue`, all types.

- [ ] **Step 3: Verify** — docs contract check passes; fixtures import cleanly.

- [ ] **Step 4: Commit** — `docs: publish engine scope and deviation list`

---

## Task 14: Phase 2 gate

- [ ] Run every gate: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm check:docs`, `pnpm check:workspace`, `pnpm typecheck:vercel`.
- [ ] Engine coverage ≥ 90%; `while(true){}` terminates; `window` undefined; grader tests pass; legacy UI tests pass.
- [ ] Update README/CASE_STUDY status only after all gates green.

---

## Phase 2 Gate (verification before claiming completion)

```powershell
pnpm typecheck; pnpm lint; pnpm test; pnpm build; pnpm check:docs; pnpm check:workspace; pnpm typecheck:vercel
pnpm --filter @jsflow/engine exec vitest run --coverage   # ≥90%
```

Only after all pass — and the Vercel API 500 is resolved separately — is Phase 2 complete.
