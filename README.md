# Resume Agent

An open-source AI resume maker. You answer a few questions (or upload the resume
you already have), paste the job you are applying for, and the agent builds and
edits a resume for you while you watch.

The resume is shown on the right side of the screen. You can edit it directly,
and you can see the AI's changes appear in real time — text being added, sections
being reordered, formatting being applied.

This document is the requirement doc, the engineering doc, and the original
project plan in one place. Everything about the product, the architecture, the
code rules, and the docs policy lives here.

---

## 1. Scope of this release (POC)

This is a proof of concept. The point is to prove that the end-to-end flow works
and feels good, not to ship a finished product.

**In scope**

- Guided question flow that collects the user's details.
- Live resume preview with in-place editing.
- AI-driven resume building and editing, streamed so the user sees it happen.
- Upload of an existing resume (`.doc`, `.docx`, `.pdf`) plus a job description.
- Job-match scoring, with a warning when the job is a bad fit.
- Guard rails on user input.
- Sample ATS-friendly resumes for first-time users.
- Export to a chosen file format (PDF is the preferred default).

**Out of scope for now**

- Authentication, accounts, login, sessions.
- Saving resumes for multiple users over time (local/in-memory is fine).
- Billing, teams, sharing links.
- Deployment/production hardening.

---

## 2. Product flows

There are three ways a user can start. All three land in the same editor screen.

### Flow A — Guided build (new resume from scratch)

1. The agent asks questions one at a time, in plain language:
   - full name
   - phone / contact number
   - email, location (optional)
   - job history (role, company, dates, what they did)
   - education
   - skills
   - certifications
2. As answers come in, the resume on the right fills itself in.
3. The user can interrupt, skip a question, or go back at any time.

### Flow B — Upload an existing resume

1. The user uploads their current resume (`.doc`, `.docx`, `.pdf`) and,
   optionally, the job description of the role they want.
2. The agent parses the file, shows what it extracted, and starts editing.
3. The match analysis runs against the job description (see FR-8).

### Flow C — Browse samples (first-time user)

1. If the user has nothing to upload, the app shows a small set of sample
   resumes: ATS-friendly, well formatted, well written.
2. The user picks one as a starting point, then swaps in their own content.

### The editor screen

Split view:

```
+-----------------------------+------------------------------+
|  LEFT: agent / inputs       |  RIGHT: live resume preview  |
|                             |                              |
|  question flow, chat,       |  the actual resume page,     |
|  uploads, match score,      |  clickable sections,         |
|  warnings, export button    |  inline formatting controls  |
+-----------------------------+------------------------------+
```

- The user sees the resume being built and reformatted as the agent works.
- Selecting text on the right shows guided controls: move the block, bold,
  bullet, reorder, delete, tweak wording.
- An "AI is working" animation plays while the agent is editing (FR-5).
- A small set of one-shot agent options sits on the left pane — Resume Roast
  and friends (FR-13).

---

## 3. Functional requirements

Each requirement has an ID so we can refer to it in commits and docs.

### FR-1 — Guided questionnaire

- The agent asks for name, contact number, job history, education, skills, and
  certifications, one question at a time.
- Answers are optional to skip. The agent never blocks on a missing field.
- The agent rephrases follow-ups based on earlier answers (for example, if the
  user says "I was a barista for 3 years", it asks about impact, not about
  their job title again).

### FR-2 — Live resume preview

- The right pane always shows the current resume, rendered to look like a real
  printed page (A4/Letter, sensible margins).
- Every AI edit is reflected in the preview immediately.
- The preview is the source of truth for what gets exported.

### FR-3 — In-place editing controls

- The user can select text or a whole block in the preview.
- A small control strip appears with guided actions: move up/down, bold,
  italic, bullet list, edit text, delete.
- Manual edits are never silently overwritten by the AI. If the agent wants to
  change something the user hand-edited, it asks first.

### FR-4 — Streaming AI edits

- Resume changes stream in. The user watches text appear and formatting land,
  rather than waiting for a final result.
- Edits are applied as structured operations (insert section, replace bullet,
  reorder entry) so the UI can animate each one.

### FR-5 — AI working animation

- While the agent is generating or applying edits, a small, tasteful animation
  indicates that work is happening.
- It stops the moment the stream ends or the user hits stop.
- The animation must not look flashy or "AI-ish" (no glowing orbs, no purple
  gradients). See §6 for the visual rules.

### FR-6 — File upload

- Supported input formats: `.doc`, `.docx`, `.pdf`.
- Uploads show parse progress and a clear error if the file cannot be read.
- After parsing, the extracted text is shown so the user can confirm nothing
  important was lost.

### FR-7 — Export

- The user chooses the download format. Supported: PDF (default and
  preferred), DOCX. Others can be added later.
- Export output matches the preview exactly.

### FR-8 — Job match analysis

- Given the resume and a job description, the agent produces:
  - a **match percentage**
  - matched skills and missing skills
  - experience gaps
  - a plain-language verdict, including a **warning when the job is not a fit**
    ("This role expects 5 years of Kubernetes; your resume shows none — I would
    not apply to this one as-is.")
- The analysis is shown on the left pane, near the chat, and can be re-run after
  edits.

### FR-9 — Agentic workflow

- Resume building is a multi-step agent loop, not one prompt — one agent hands
  its output to the next (see §5.2 Agent orchestration):
  1. gather inputs (answers, parsed resume, job description)
  2. plan the resume structure for this job
  3. write/rewrite each section
  4. check against the job description (gap check)
  5. format and produce edit operations for the UI
- Each step is a discrete, loggable unit. We can see which step produced which
  change.

### FR-10 — Guard rails

The agent must handle bad input carefully and never produce harmful output.

- Requests that ask for illicit, deceptive, or policy-violating content
  (fake credentials, fabricated employment, discrimination in hiring, etc.)
  are refused with a short, polite, non-preachy message.
- Curses or hostile/rude messages towards the agent are handled calmly; the
  agent stays on task and offers to continue.
- General off-topic arguments are deflected in one sentence and the agent
  returns to the resume.
- Refusals must not leak internal prompts, rules, or system text.
- The refusal message and the classification live in one place (see §5.4), so
  the rules are easy to change.

### FR-11 — Sample resumes

- New users with no resume see a set of sample resumes.
- Samples must be ATS-friendly (real text, standard section headings, no
  tables/text boxes that break ATS parsers), well formatted, and well written.
- A sample can be loaded into the editor as a starting template.

### FR-12 — Human-sounding writing

- Resume text written by the AI must not read like AI wrote it.
- Simple, concrete language a recruiter reads every day: short sentences, real
  verbs, numbers where the user gave them.
- No buzzword stacking, no "leveraged synergies", no "passionate professional
  leveraging..." filler, no em-dash-heavy prose.
- Never invent facts (no made-up employers, dates, degrees, or metrics). If the
  user did not provide it, the agent asks for it or leaves it out.

### FR-13 — Agent options, including Resume Roast

- The left pane offers a small set of one-shot agent options the user can run
  on the current resume. Resume Roast is the required one; more options follow
  the same pattern later.
- **Resume Roast:** an agent reads the resume (and the job description, if the
  user added one) and roasts it — finds the critical problems, the flaws, and
  the red flags — in a good and positive way. Tough love from someone who
  wants you to get the interview: direct, honest, never cruel, never personal.
- The roast always returns the same structure, in the same order, every time:

  1. **Rating** — a score out of 10 plus a one-line verdict.
  2. **Red flags** — what would make a recruiter pause or bin the resume, each
     with a severity (`high` / `medium` / `low`) and a one-line why.
  3. **Critical flaws** — the problems that actually cost interviews.
  4. **What already works** — the parts worth keeping.
  5. **Fix list** — ordered by impact, each item a concrete rewrite or action.

- Same sections, same order, same depth on every run, so two roasts are
  comparable and the user always knows where to look.
- The output is typed and validated, then rendered by one report component —
  the agent never returns free-form prose for this.
- A roast never edits the resume by itself. Applying a fix goes through the
  normal edit ops (§5.3), one item at a time, user-confirmed.

### FR-14 — Privacy and consent

- The app touches only the personal files the user explicitly picked and
  uploaded. It never scans the disk, never reads the home directory, and never
  opens a path the user did not give it.
- Before any personal file is read, the UI says what will be read and asks for
  consent. The upload button is the consent — its label states what happens.
  No consent, no read.
- Consent is per file and can be withdrawn: the user can remove an uploaded
  file from the session at any time, and it is dropped from memory and storage.
- POC data lives in memory for the session only. Nothing is copied into
  long-term storage, sent anywhere else, or used for anything but the current
  resume — in the default setup the only outbound call is to the local Ollama.
- Coding agents working in this repo follow the same rule: they ask before
  reading any file outside the project folder.

---

## 4. Architecture

### Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + TypeScript | Requirement. Component model fits a live editor. |
| Backend | NestJS (TypeScript) | Requirement. Modules, DI, and a clean place to hang the agent loop. Everything backend lives here — no Python service for now. |
| Package manager | pnpm | Requirement. One tool across the repo, one lockfile, fast installs. |
| LLM | Ollama, run in Docker | Requirement. Local, free, no API keys for a POC. |
| Embeddings | Embedding model served by Ollama | Needed for semantic search over resumes/job descriptions. |
| Vector store | ChromaDB | Requirement. Stores resume chunks, job-description chunks, and sample resumes for retrieval. |
| Document parsing / export | Popular Node libraries inside NestJS | Read `.doc`/`.docx`/`.pdf` and render the download with the most popular, battle-tested library for each format. See §7 for how they are wrapped. |

### System diagram

```
Browser (React + TS)
   |  HTTP + SSE (streaming edits)
   v
NestJS API
   |-- agent module      (orchestrator: intake -> planner -> writer -> check, one agent hands off to the next)
   |-- resume module     (resume document model, edit operations)
   |-- match module      (match %, gaps, fit warning)
   |-- guardrails module (input/output classification + refusal copy)
   |-- upload module     (file intake, hands off to document reader)
   |-- documents module  (doc/docx/pdf -> text, resume -> pdf/docx)
   |
   +--> Ollama (docker)        : chat model + embedding model
   +--> ChromaDB               : retrieval (samples, resume chunks, JD chunks)
```

### Why this split

- **NestJS owns everything server-side.** Routes, sessions (in-memory),
  validation, the agent loop, streaming, and document parsing/export all live
  here. Python/FastAPI is skipped for now — NestJS does the whole job, and a
  second service would only add deployment and debugging weight at this stage.
- **Ollama is the model layer.** One docker-compose file brings up Ollama with
  a chat model and an embedding model pulled. Nothing in the app code knows
  about a specific vendor — it talks to the Ollama HTTP API.
- **ChromaDB is memory.** Sample resumes and parsed resume sections are chunked
  and embedded so the agent can retrieve relevant material instead of stuffing
  everything into a prompt.

### Proposed repo layout

```
resume-agent/
  README.md                  <- this file (parent doc, always current)
  AGENTS.md                  <- quick context brief for coding agents
  docker-compose.yml         <- ollama, chromadb, api, web
  frontend/                  <- React + TS app (pnpm)
    .claude/skills/react-human-code/SKILL.md   <- frontend code rules
    src/
      components/
      pages/
      hooks/
      lib/                   <- http wrappers, one data fetcher layer
      styles/                <- plain CSS
      constants/
      types/
  backend/                   <- NestJS app (pnpm), the only backend service
    src/
      agent/                 <- orchestrator + sub-agents, prompts, edit-op emitters
      resume/                <- resume model + operations
      match/                 <- match scoring
      guardrails/            <- refusal rules and classification
      upload/                <- file intake
      documents/             <- doc/docx/pdf reading + pdf/docx rendering
      export/                <- download endpoints
      sessions/              <- in-memory session store (no auth yet)
      shared/                <- custom exceptions, base commands, common utils
  samples/                   <- sample ATS resumes (seeded into chroma)
```

---

## 5. Key design details

### 5.1 The agent loop

The agent is a loop over discrete steps, each in its own file:

1. `gather` — collect answers, parsed resume, job description.
2. `plan` — decide section order and what the target job cares about.
3. `draft` — write each section from the user's real content.
4. `check` — compare against the job description, record gaps.
5. `emit` — turn the result into edit operations the UI can animate.

Every step logs: step name, inputs used, output summary, time taken. That log
is what makes the thing debuggable at 2 AM.

### 5.2 Agent orchestration

This is a multi-agent product: work moves from one agent to the next. Each
agent has exactly one job, takes a typed input, and returns a typed result. No
agent calls another agent directly — an orchestrator in
`backend/src/agent/` runs them in order and passes the result along.

| Agent | Job | Hands off to |
|---|---|---|
| Intake agent | Reads answers, parsed resume, job description; spots what is missing and asks the user for it. | Planner agent |
| Planner agent | Builds the section outline that fits the target job. | Writer agent |
| Writer agent | Drafts each section from the user's real content, in plain recruiter language. | Check agent |
| Check agent | Compares the draft with the job description, records gaps, writes the match verdict and any "not a fit" warning. | Emit step (edit ops) |

Rules for orchestration:

- The orchestrator owns the order, the shared context object, and the failure
  handling. If one agent fails, the run stops with a human-readable message —
  never a raw stack trace shown to the user.
- Each agent and its prompts live in their own file, so a single step can be
  re-run or swapped without touching the others.
- Every hand-off is logged: which agent ran, what it received, what it passed
  on, how long it took.
- The guard rails module runs around the loop (input before the intake agent,
  output before the edit ops reach the preview) — see §5.4.

Action agents run outside this pipeline. When the user picks an option from
the left pane (Resume Roast, FR-13, and others like it), the orchestrator runs
that one agent on its own: read the current resume, produce a typed report,
stream it to the pane. Same logging and guard-rail rules apply; no resume edit
ops are produced unless the user applies a fix.

### 5.3 Edit operations (how the UI animates changes)

The agent never sends a whole new resume HTML blob. It sends operations:

```ts
type ResumeOp =
  | { type: "insertSection"; at: number; section: ResumeSection }
  | { type: "updateText"; path: string; text: string }
  | { type: "moveBlock"; path: string; to: number }
  | { type: "setStyle"; path: string; style: BlockStyle }
  | { type: "removeBlock"; path: string };
```

The backend streams ops over SSE. The frontend applies them one by one, so the
user sees each change land. It also means undo is trivial later.

### 5.4 Guard rails placement

- **Input side:** classify the user message before it reaches the model. Illicit
  requests, abusive messages, and off-topic prompts are routed to a canned
  response.
- **Output side:** the drafted resume text is checked for fabricated
  credentials and policy-violating content before it hits the preview.
- All refusal copy lives in one module with a short reason code
  (`fabricated_credentials`, `abusive_message`, `off_topic`, ...). One place to
  read, one place to change.

### 5.5 Match scoring

1. Embed the job description and the resume (via Ollama embedding model).
2. Pull overlapping chunks from ChromaDB.
3. Produce three signals: skill overlap, experience-level fit, keyword coverage.
4. Combine into a single percentage, and write a short verdict in plain
   language — including "this one is not for you" when the gap is large.

---

## 6. Design rules for the UI

The app must not look like a generic AI product.

- **No AI clichés:** no blue/purple gradients, no glowing orb animation, no
  dark neon dashboard, no "✨ AI ✨" labels.
- Neutral palette: grays, near-black accents, a white page for the resume.
- Plain CSS in `frontend/src/styles/`. No Tailwind, no CSS-in-JS, no UI kits,
  no icon or font packages.
- Only `react` and `react-dom` as runtime dependencies.
- The AI-working animation (FR-5) is small and quiet — a subtle shimmer on the
  section being edited, or a thin progress line. It reads as "loading", not as
  "magic".
- Focus states, disabled states, and error messages are consistent everywhere.

---

## 7. Code quality rules

These apply to the whole repo. They exist so the next developer can clone, read
the top of the file, and understand it.

1. **One concern per file.** Do not stuff a component, its data fetching, its
   types, and its styling into one file. Split by responsibility.
2. **Max 200 lines per React component file** (blank lines and comments don't
   count). This is enforced: ESLint runs with `max-lines` set to 200, so an
   oversized component fails lint. Split it into subcomponents instead of
   raising the limit.
3. **No nested ternaries.** Use `if`, `if/else`, and `switch`. Early returns
   beat deep nesting.
4. **Max ~2 levels of nesting** in logic and in JSX. Extract a subcomponent or
   a helper instead.
5. **Boring code over clever code.** Prefer explicit step-by-step logic with
   intermediate variables over short functional chains. No `reduce()` for
   anything non-trivial, no long method chains (max 2 calls).
6. **Named things read like the domain:** `session`, `documents`, `matchScore`
   — never `data1`, `stuff`, `handler2`. No single-letter callback params like
   `(r) => r.id`; write `(row) => row.id`.
7. **Types and constants go by scope.** Shared across features → global
   (`src/types/`, `src/constants/`). Used by one file → inline at the top of
   that file. Do not scaffold a `types.ts` for every folder.
8. **Small components, standard layout.** A small component is one file. A big
   component gets one folder with the main file, flat sibling subcomponents,
   and an `index.ts`. No nested `components/` folders inside a component folder.
9. **No `React.FC`.** Plain functions with an exported `Props` interface.
10. **All HTTP goes through one wrapper** in `frontend/src/lib/http.ts`. No raw
    `fetch` in components or hooks. Endpoint paths live in
    `frontend/src/constants/api.ts`.
11. **Data fetching lives in hooks**, one hook per concern, returning named
    actions and status — never inline in a component.
12. **TypeScript strict mode stays on.** No `any` at untyped boundaries without
    a comment explaining why. Prefer `unknown` + narrowing.
13. **Error messages are human-readable and actionable.** Never dump raw
    internal objects into logs or exceptions.
14. **Reuse the shared UI primitives** in `frontend/src/components/ui/` before
    hand-rolling a button or input. If a primitive is missing a prop, extend it
    rather than forking a copy.
15. **pnpm only, everywhere.** The whole repo uses pnpm — backend and
    frontend. No npm, no yarn, one lockfile per package.
16. **User privacy first.** The app reads only the files the user explicitly
    picks and uploads — never the home directory, never a random path on disk.
    Always ask for the user's consent before accessing a personal file, and
    proceed only if they say yes (FR-14). The same applies to coding agents in
    this repo: do not read files outside the project folder without asking
    first.
17. **NestJS code quality is non-negotiable.** See the backend rules below —
    the bar is "structured like a good open-source project".
18. **No arbitrary or dangerous commands.** Never run shell commands that put
    the user or their system at risk: no recursive deletes on paths we did not
    create, no piping remote scripts into a shell, no touching system config,
    no killing processes, no widening permissions. Prefer the safest boring
    command; if a risky one is genuinely needed, say exactly what it does and
    get the user's approval first. User privacy and system safety come before
    shipping the MVP — the same weight as the feature itself.

The frontend rules are also enforced by the repo skill in
`frontend/.claude/skills/react-human-code/SKILL.md` (full text in §8), so any
coding agent working in `frontend/` picks them up automatically.

### Abort handling

Do not sprinkle `AbortController` through the app. Declare it once, in the
parent data fetcher (the hook or `lib/http` layer that owns the request), and
use it only where aborting is actually meaningful:

- a chat/agent stream with a Stop button
- a request that would land on an unmounted component and confuse state

Ordinary GETs and short POSTs do not need an abort controller. No request
timeouts either — the backend waits for the LLM, and the Stop button is the
user's escape hatch.

### Backend (NestJS) rules

The Nest codebase is the core of the product. Its quality bar is higher than
"it works": neat, clean, structured like a good open-source project.

- **Small APIs and small services.** One controller action per use case, one
  service method per job. If a service file grows past what fits on a screen,
  split it — same "one concern per file" rule as the frontend.
- **Structured imports and exports.** Every feature folder has an `index.ts`
  barrel that exports what the rest of the app may use. Other code imports
  through the barrel (`import { ResumeService } from '../resume'`), never a
  deep path into a file (`.../resume/resume.service`). Same for
  `shared/` — one clear import surface per module.
- **DTOs at every boundary.** Every request body, query, and response that
  crosses a module boundary is a named, exported DTO class, validated at the
  controller. No `any` bodies.
- **Commands with `execute`.** Multi-step operations are command objects with
  an `execute()` method (`RoastResumeCommand.execute(input)`,
  `BuildResumeCommand.execute(input)`), not one long service method that does
  five things. Commands live beside the module that owns them and are
  exported from the barrel.
- **Custom exception classes.** Domain errors are exported classes in
  `src/shared/exceptions/` — `ResumeNotFoundError`, `DocumentParseError`,
  `MatchScoreFailedError` — each with a human-readable message. Controllers
  map them to HTTP status codes in one place. Never throw a bare `Error`, and
  never leak internal details to the client.
- **Design patterns where they earn their place.** Command for multi-step
  operations, strategy for swappable LLM providers, adapter for anything
  external (Ollama, ChromaDB, document libraries). No pattern for pattern's
  sake.
- **Predictable control flow.** `if` / `if/else` / `switch`, early returns,
  max two levels of nesting — the same as the frontend. Spread sparingly:
  prefer step-by-step updates with intermediate variables over long
  `{ ...a, ...b, ...c }` chains that hide what changed.
- **Documents module wraps the libraries.** Reading `.pdf` / `.doc` / `.docx`
  and rendering the download goes through our own `documents` module, which
  uses the most popular, well-maintained library for each format. The library
  choice is pinned in the lockfile and can be swapped behind that module
  later without touching feature code.

### Tooling

Use modern, current-generation dev tooling. Do not hand-roll what a standard
tool does, and do not stack overlapping tools — one tool per job.

- TypeScript strict mode everywhere, with `tsc --noEmit` as a separate
  typecheck script in both apps.
- ESLint + Prettier with a single shared config; lint and format run in
  pre-commit hooks and in CI.
- Frontend: Vite as the dev server (HMR), Vitest for tests.
- Backend: Nest CLI with watch mode, Jest for tests, `tsx` for one-off scripts.
- pnpm scripts are the entry point, same names in both apps: `pnpm dev`,
  `pnpm lint`, `pnpm typecheck`, `pnpm test`. A new developer should be able
  to run the whole thing from memory.
- Dependencies must be well maintained and actively used. Pin them in the
  lockfile. If a package is abandoned, or duplicates a tool we already have,
  do not add it.

---

## 8. Frontend skill (verbatim)

This file is committed at `frontend/.claude/skills/react-human-code/SKILL.md`.
It is the binding style guide for anything under `frontend/`.

```markdown
---
name: react-human-code
description: Use when writing or editing any React/TypeScript code in this repo (frontend/, hooks, components, fetch layers). Enforces human-readable code style rules the project owner requires - no React.FC, no deep nesting, early returns, plain CSS.
---

# React/TypeScript code style for this project

These rules are mandatory for every change under `frontend/`. They exist so the
code reads like a human wrote it.

## Component rules

- Never use `React.FC`, `FunctionComponent`, or the `FC` type. Write plain
  function components with an exported `Props` interface:

  ```tsx
  interface DocumentListProps {
    documents: DocumentInfo[];
    onRemove: (name: string) => void;
  }

  export function DocumentList({ documents, onRemove }: DocumentListProps) {
    // ...
  }
  ```

- One concern per component. If a component needs three unrelated chunks of
  state or markup, split it.
- A component file must stay at or under 200 lines of code (excluding blank
  lines and comments). The ESLint `max-lines` rule is set to 200 and will fail
  the lint run if a component grows past it - split the component into
  subcomponents before that happens.
- Prefer early returns over nesting:

  ```tsx
  // Good
  if (documents.length === 0) {
    return <p>No documents yet.</p>;
  }

  return <ul>...</ul>;
  ```

  Do not write `documents.length === 0 ? <p/> : <ul/>` chains two levels deep,
  and never nest ternaries. An `if/else` statement in JSX-land (early return or
  a small helper) beats a clever expression every time.

- Maximum ~2 levels of nesting in JSX and in logic. Extract a subcomponent or
  a helper function instead.
- Name things after what they are in the domain (`session`, `documents`,
  `isUploading`), not after how they are implemented (`data1`, `stuff`,
  `handler2`).

## Data fetching rules

- Every API call goes through the reusable wrappers in `src/lib/http.ts`
  (`request<T>` for JSON, `uploadDocument` for multipart uploads). Never call
  `fetch` directly from a component or hook.
- Every call site wraps the await in `try/catch`. Map failures to user-facing
  messages; use the `ApiError.code` when the UI needs to branch (e.g.
  `unknown_session`).
- AbortController is declared in the parent data fetcher (the hook or http
  wrapper that owns the request) and used only when it is actually needed: a
  chat/agent stream with a Stop button, or a request that would resolve after
  unmount. Do not add an AbortController to every call as a reflex.
- No request timeouts. The backend waits indefinitely for the LLM; the UI's
  only escape hatch is the abort button.
- Endpoint paths come from `src/constants/api.ts`. Never inline a raw path
  string like `"/chat"` in a hook.

## Hook rules

- Hooks expose named functions for the component to destructure - no action
  objects, no boolean soup:

  ```ts
  const { documents, uploadDocument, removeDocument, isUploading } =
    useSession();
  ```

- Keep hooks framework-agnostic and small. A hook that talks to more than one
  backend resource probably wants to be two hooks.

## Style rules

- Plain CSS in `src/styles/`. No Tailwind, no CSS-in-JS, no UI kits, no
  icon/font packages. Neutral palette (grays, near-black accents) - no blue
  gradients, no glow effects.
- No third-party runtime dependencies beyond `react` and `react-dom`.
- TypeScript strict mode stays on. No `any` unless interoperating with a
  genuinely untyped boundary (and then an `// eslint-disable`-style comment
  explaining why). Prefer `unknown` + narrowing.
- Default-export nothing except `main.tsx`. Named exports everywhere else.
```

---

## 9. Documentation policy

- **This README is the single parent document.** Every big feature, every
  architecture change, and every notable decision gets a short section here in
  the same change that ships the code.
- Write in technical language, but plain sentences. No marketing wording, no
  inflated vocabulary, no long winded clauses. If a sentence needs two reads,
  rewrite it.
- Keep requirement IDs (FR-x) stable. Add new ones; do not renumber old ones.
- A new developer should be able to read this file top to bottom and start
  working without asking anyone.

---

## 10. Milestones

1. **Scaffold** — repo layout, pnpm workspaces, docker-compose (Ollama +
   ChromaDB), Nest skeleton, React skeleton, documents module skeleton,
   health checks.
2. **Editor shell** — split screen, resume preview component, in-place
   selection controls, plain-CSS theme.
3. **Guided flow** — question sequence, answers stored on the session, preview
   fills in.
4. **Agent loop** — plan/draft/check/emit steps, SSE streaming of edit ops,
   working animation.
5. **Upload + parse** — doc/docx/pdf intake, extraction preview, feed into the
   agent.
6. **Match analysis** — embeddings into ChromaDB, match percentage, fit
   warning.
7. **Guard rails** — input classification, refusal copy, output check for
   fabricated content.
8. **Samples + export** — sample resumes seeded and browsable, PDF/DOCX
   download with format choice.
9. **Agent options** — options panel on the left, Resume Roast agent with its
   fixed report structure, and per-fix apply through edit ops.

Each milestone ends with: working demo, updated README, no nested ternaries.
