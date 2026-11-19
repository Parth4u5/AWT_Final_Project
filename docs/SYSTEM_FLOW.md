# JS Flow Visualizer — System Flow Guide

**Companion to:** [BUILD_LIST.md](./BUILD_LIST.md) · **Status:** describes the *planned* system from the build list (the proposal is not implemented yet).

The build list tells you **what gets built and in what order**. This guide tells you **what actually happens when someone uses the website** — split into small, focused flows so each one can be read on its own.

**How to read the diagrams:** boxes are components or states, arrows are the event that moves you to the next one, diamonds are decisions. Diagrams are Mermaid and render directly on GitHub and in most Markdown viewers. Read top-to-bottom unless a diagram says otherwise.

---

## 1. The whole system in one picture

Before zooming in, here is the shape of everything. The browser holds the editor and the player; the **engine** is a worker inside the browser; the server holds data, accounts, and anything that costs money.

```mermaid
flowchart LR
    U["Visitor / browser"] --> WEB["apps/web<br/>React 19 + React Router v7<br/>public pages are SSR / prerendered"]
    WEB --> WORK["Engine Web Worker<br/>packages/engine<br/>parses and runs the code"]
    WEB -->|"HTTP + credentials"| API["apps/api<br/>Fastify 5<br/>auth, data, grading, tutor proxy"]
    API --> DB[("MongoDB Atlas<br/>users, sessions, examples,<br/>challenges, progress, logs")]
    API --> REDIS[("Upstash Redis<br/>shared rate limits")]
    API --> AI["Anthropic API<br/>AI tutor"]
    API --> OBS["Sentry<br/>errors on both apps"]
```

**Short version:** the code you write runs entirely in your browser on a sandboxed interpreter; the server is only involved for accounts, saved work, challenges, and the AI tutor.

---

## 2. A visitor's first five minutes

This is the growth path: public content is crawlable and free to read, the playground is open to everyone, and the account ask only appears when someone wants more.

```mermaid
flowchart TD
    A["Landing page /"] --> B["Browse examples, docs, how-it-works<br/>prerendered so search engines can read them"]
    B --> C["Open the Playground"]
    C --> D["Type or paste JavaScript"]
    D --> E["Press Run"]
    E --> F{"Signed in?"}
    F -->|"No"| G["Anonymous run counter +1<br/>stored in localStorage"]
    G --> H{"More than 5 runs?"}
    H -->|"No"| I["Watch the visualization<br/>full playground, all panels work"]
    H -->|"Yes"| J["Sign-up wall modal"]
    J --> K["Create free account<br/>counter is cleared"]
    K --> I
    F -->|"Yes"| I
```

**Features in this flow:** public example library, docs and how-it-works pages, the playground, and the 5-free-run funnel. Everything stays visible — the wall is a modal, never a redirect.

---

## 3. Pressing Run: where the code actually goes

This is the heart of the product. The engine turns text into a typed event stream, and the UI simply plays that stream back — which is why scrubbing is instant and why it can run safely on the server too.

```mermaid
flowchart TD
    SRC["Source code in the editor"] --> LINT["Engine-aware linter<br/>flags syntax the sandbox cannot run"]
    LINT --> MSG["postMessage to the Web Worker"]
    MSG --> PARSE["@babel/parser<br/>source to AST, friendly line/column errors"]
    PARSE --> SCOPE["Build scope chain<br/>global, function, block; hoisting and TDZ"]
    SCOPE --> INTERP["Generator interpreter<br/>yields one event per operation"]
    INTERP --> STREAM["EngineEvent stream<br/>typed, numbered, immutable"]
    STREAM --> SER["Serializer<br/>EngineValue tagged union; cycles become a loop marker"]
    SER --> BACK["postMessage back to the UI"]
    BACK --> GUARD{"Step budget or timeout hit?"}
    GUARD -->|"Yes"| ERR["Friendly execution-limit error<br/>no frozen tab"]
    GUARD -->|"No"| REPLAY["Player replays the events<br/>instant scrub or timed playback"]
    REPLAY --> PANELS["All visualizer panels update from the same step"]
```

**Why this design matters:** one event array drives the highlight, the scope tree, the call stack, the graph, and the log — so they can never disagree with each other. The same pure interpreter grades challenge submissions on the server, because it has no access to `window`, `fetch`, `eval`, or `Function`.

---

## 4. Stepping, breakpoints, and live state

Because the interpreter is a suspendable generator, "step" and "breakpoint" are real execution control, not a replay trick.

```mermaid
flowchart TD
    A["Driver starts the generator"] --> B{"Breakpoint on this line<br/>or user pressed Pause?"}
    B -->|"No"| C["Run to the next event"]
    C --> B
    B -->|"Yes"| D["Suspend the generator"]
    D --> E["Show the live scope snapshot<br/>and current call stack"]
    E --> F{"Next action"}
    F -->|"Step into"| G["Advance into the called function"]
    F -->|"Step over"| H["Advance one statement in this frame"]
    F -->|"Step out"| I["Run until the current frame returns"]
    F -->|"Continue"| C
    G --> B
    H --> B
    I --> B
```

**Features in this flow:** gutter breakpoints, step into / over / out, pause and continue, speed control, and `Ctrl/Cmd+Enter`, `F10`, `F11`, `Shift+F11` shortcuts.

---

## 5. What each panel shows

Every panel is a different lens on the same current step.

```mermaid
flowchart LR
    EV["Current event + step index"] --> ED
    EV --> FL
    EV --> SC
    EV --> CS
    EV --> LG
    EV --> TL
    subgraph WS["Workspace UI"]
        ED["Code editor<br/>current line highlight, breakpoint gutter,<br/>inline error marker, engine-aware autocomplete"]
        FL["Flow graph<br/>nodes are executed statements,<br/>edges are the path actually taken"]
        SC["Scope inspector<br/>variables, shadowing, const / let / var badges,<br/>diff of what changed this step"]
        CS["Call stack<br/>frames with argument values,<br/>click a frame to jump"]
        LG["Execution log<br/>typed console output, jump back to its line"]
        TL["Timeline scrubber<br/>drag anywhere in the event stream"]
    end
```

**Short version:** editor, visualizer, and log are the three main columns; the scope inspector and call stack are supporting panels; the timeline ties them all together.

---

## 6. Signing in and staying signed in

Account state is deliberately split: a short-lived access token lives in memory, a long-lived refresh token lives in a cookie, and a refresh happens automatically when access expires.

```mermaid
flowchart TD
    A["Register / Login"] --> B["Argon2id password check<br/>or OAuth via arctic"]
    B --> C["Access token: 15 min, in memory"]
    B --> D["Refresh token: 30 days, httpOnly cookie<br/>SameSite=None; Secure"]
    C --> E["Call a protected API endpoint"]
    E --> F{"Response 401?"}
    F -->|"No"| G["RBAC gate<br/>user / moderator / admin<br/>banned users are blocked server-side"]
    F -->|"Yes"| H["Single-flight refresh mutex<br/>one request across all tabs"]
    H --> I["POST /auth/refresh<br/>with double-submit CSRF token"]
    I --> J{"Token family reuse detected?"}
    J -->|"Yes"| K["Revoke the whole family, log out"]
    J -->|"No"| L["Grace window accepts near-simultaneous retries;<br/>new access token + rotated refresh token"]
    L --> E
```

**Features in this flow:** own-the-session auth, rotating refresh tokens, reuse detection, ban enforcement, RBAC, CSRF protection, and shared-store rate limits.

---

## 7. Saving and sharing your work

A save is a real record; a share is just a link. Anonymous users can still share, because sharing is how a first-time visitor brings a friend in without hitting the wall.

```mermaid
flowchart TD
    A["Current code + event snapshot"] --> B{"Signed in?"}
    B -->|"Yes"| C["Save a Session<br/>slug, engineVersion, eventSnapshot, code"]
    C --> D["Deep link: sessionSlug step 142<br/>points to an exact step in that event stream"]
    B -->|"No"| E["URL-encoded link<br/>playground?code=base64url"]
    D --> F{"Engine version changed since save?"}
    F -->|"No"| G["Open at the exact step"]
    F -->|"Yes"| H["Graceful fallback:<br/>show the code at that line instead"]
```

**Features in this flow:** saved sessions, forks, public/private toggles, deep links to a step, and anonymous code sharing.

---

## 8. Challenges, XP, and the leaderboard

Grading uses the same sandboxed engine as the playground, but on the server, where it is bounded by a step budget and timeout.

```mermaid
flowchart TD
    A["Challenge prompt + starter code"] --> B["Write a solution in the playground"]
    B --> C["Submit solution"]
    C --> D["Server runs the same engine<br/>sandboxed, step budget enforced"]
    D --> E["Compare ProgramResult to tests<br/>output-equals / output-contains / global-equals"]
    E --> F["Progress record<br/>attempts, best score, solved status"]
    F --> G["XP, level, and streak<br/>computed with a Mongo aggregation"]
    G --> H["Leaderboard<br/>week / month / all time"]
```

**Features in this flow:** challenge CRUD, grading contract, hints, XP and levels, streaks, public profile, and the leaderboard. Account-only, because progress has to belong to someone.

---

## 9. The AI tutor

The tutor never sees the whole file or any secret. It is fed the exact state on screen, so its answers stay grounded in what you are actually looking at.

```mermaid
flowchart TD
    A["Explain this step / ask a question"] --> B["Build the request<br/>code window ±15 lines, current event,<br/>scope snapshot, call stack, mode"]
    B --> C["POST /api/tutor/explain<br/>SSE stream, account only, 50 per day"]
    C --> D{"30-day cache hit?"}
    D -->|"Yes"| E["Return the cached answer"]
    D -->|"No"| F["System prompt treats code as inert data<br/>injection attempts cannot become instructions"]
    F --> G["Anthropic API<br/>Sonnet for full explanations, Haiku for short ones"]
    G --> H["Stream the answer into the panel"]
    H --> I["Cache it and label it AI-generated"]
    I --> J{"API down or key missing?"}
    J -->|"Yes"| K["Hide the button; the visualizer keeps working"]
```

**Features in this flow:** step explanation, free-text questions, "why is this wrong?" on errors, quiz mode, streaming responses, AI-generated disclaimer, and a graceful fallback.

---

## 10. Content, admin, and support

Everything the public sees is authored or moderated here, and every privileged action leaves a trace.

```mermaid
flowchart LR
    SEED["Seed script<br/>admin, 20+ examples, 10+ challenges"] --> DB[("MongoDB")]
    DB --> LIB["Public example library<br/>search, category, difficulty, tags,<br/>sorting, pagination"]
    CONTACT["Contact form"] --> MSG["ContactMessage"]
    MSG --> INBOX["Admin inbox"]
    ADMIN["Admin console"] --> USERS["Users: change role, ban / unban"]
    ADMIN --> CONTENT["Examples: create, edit, publish"]
    ADMIN --> INBOX
    ADMIN --> STATS["Stats + audit log"]
    USERS --> AUDIT[("AuditLog<br/>record every privileged action")]
    CONTENT --> AUDIT
    INBOX --> AUDIT
```

**Features in this flow:** real contact pipeline, admin console, moderation, analytics, and audit trail.

---

## 11. One codebase, two environments

The same engine code runs in the browser worker and on the server. Local development and deployment differ only in wiring and environment variables.

```mermaid
flowchart LR
    subgraph DEV["Local development"]
        P["pnpm dev"] --> W["Vite dev server"]
        P --> A["Fastify API"]
        W -->|"proxy /api"| A
        A --> M[("mongo:7 via Docker Compose<br/>seeded by pnpm seed")]
    end
    subgraph PROD["Deployed"]
        VW["Vercel: SSR / prerendered web"] --> VA["Vercel: serverless Fastify API"]
        VA --> MAT[("MongoDB Atlas")]
        VA --> R["Upstash Redis"]
        VA --> S["Anthropic + Sentry"]
    end
```

**Short version:** no hand-written `index.html`, no secret fallbacks, and the database credentials are rotated at the database level before anything ships.

---

## 12. Feature quick reference

| Feature | What it does | Flow |
|---|---|---|
| Public pages | Landing, examples, docs, how-it-works — prerendered so they can be found and read | 2 |
| Playground | Write code and watch what it does, step by step | 2, 3 |
| Sandboxed engine | Parses and interprets JavaScript without touching the browser or Node host | 3 |
| Event stream | One typed, replayable record of every operation | 3, 5 |
| Timeline + speed | Scrub or watch the execution at different speeds | 4, 5 |
| Breakpoints + stepping | Pause real execution and inspect live state | 4 |
| Scope inspector / call stack | See variables, shadowing, and function frames | 5 |
| Flow graph | See the path the program actually took | 5 |
| 5-run wall | Anonymous taste of the product, then an account ask | 2, 6 |
| Own-the-session auth | Tokens, refresh rotation, RBAC, bans, CSRF | 6 |
| Saved sessions + sharing | Keep runs, fork them, link to an exact step, share without an account | 7 |
| Challenges + progression | Grade solutions, earn XP, keep streaks, climb the leaderboard | 8 |
| AI tutor | Explain the step you are on, grounded in the engine's own state | 9 |
| Admin + contact | Moderate content and users, answer messages, audit privileged actions | 10 |
| PWA + offline | The app keeps working after the first load | 11 |

---

## 13. Where this sits in the build plan

| Flow above | Built in |
|---|---|
| 1, 11 | Phase 0 (foundation) and Phase 4 (backend v2) |
| 2, 5 | Phase 3 (UI/UX rebuild) |
| 3, 4 | Phase 2 (the engine) — the highest-value phase |
| 6 | Phase 4 (backend v2) |
| 7, 8, 10 | Phase 5 (product depth) |
| 9 | Phase 6 (the AI tutor) |

The product is genuinely usable at Phase 4; Phases 5–7 add the depth that makes it a portfolio piece rather than a demo.
