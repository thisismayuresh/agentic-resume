# AGENTS.md

Brief for coding agents working in this repo. Read this first, then read
`README.md` — that is the full requirement doc, architecture, and code rules.

## What this is

An open-source AI resume maker (POC). The user answers a few questions or
uploads their existing resume plus a job description, and a multi-agent backend
builds and edits a resume while the user watches it happen in a live preview on
the right side of the screen. Export is PDF/DOCX. No authentication in this
version.

## Read in this order

1. `AGENTS.md` (this file) — orientation.
2. `README.md` — the parent doc: product requirements (FR-1…FR-13), stack,
   architecture, agent orchestration, code quality rules, doc policy.
3. `original-requirements.md` — the original brief, written clearly, for
   intent behind the polished version.
4. `frontend/.claude/skills/react-human-code/SKILL.md` — binding style rules
   for any change under `frontend/`.
5. `backend/.claude/skills/nest-structure/SKILL.md` — binding import and
   structure rules for any change under `backend/`.

## Where things live

| Path | What it holds |
|---|---|
| `frontend/` | React + TypeScript app (pnpm). Plain CSS, no UI kits, no extra runtime deps. |
| `frontend/.claude/skills/` | Frontend code rules a coding agent must follow. |
| `backend/` | NestJS (TypeScript, pnpm) — the only backend service: agent orchestration, resume model, match scoring, guard rails, upload, documents (pdf/docx parse + render), export, in-memory sessions. |
| `backend/src/agent/` | The orchestrator, the Resume Builder agent (gather → plan → draft → check → emit), and the Resume Review agent (roast), each with its own prompt file. |
| `backend/src/shared/` | Custom exception classes, base commands, common utils. |
| `samples/` | Sample ATS-friendly resumes, seeded into ChromaDB. |
| `docker-compose.yml` | Ollama (chat + embedding model), ChromaDB, and MongoDB. |

There is no Python/FastAPI service — NestJS does the whole backend, document
parsing and PDF export included (see README §7 for the Nest rules).

Note: only `README.md`, `original-requirements.md`, and the frontend skill
exist right now. Scaffolding the apps is milestone 1 (see README §10).

## Hard rules

- **No auth.** Do not add login, accounts, or sessions beyond the in-memory
  session store.
- **pnpm only.** Use pnpm for every install, script, and workspace. No npm,
  no yarn.
- **NestJS structure (README §7 and the nest-structure skill have the full
  list):** small controllers and services, `index.ts` barrels for
  imports/exports, DTOs at every boundary, multi-step work as command objects
  with `execute()`, custom exported exception classes (no bare `Error`),
  design patterns where they earn their place, spreads used sparingly.
- **Backend imports (nest-structure skill):** no `.js` extensions; same
  folder `./file-name.service`; across modules only via the `@app/` alias and
  the module barrel (`@app/resume`); never climb two directories — lint fails
  on it.
- **One concern per file.** No giant files that hold everything.
- **No nested ternaries.** Use `if` / `if/else` / `switch`. Early returns.
  Max ~2 levels of nesting.
- **React components max 200 lines** (blank lines and comments excluded).
  ESLint `max-lines` set to 200 fails the lint run past that — split the
  component, do not raise the limit.
- **Frontend style is the skill file**, not your habits: no `React.FC`, plain
  CSS only, all HTTP through `src/lib/http.ts`, endpoint paths in
  `src/constants/api.ts`, named exports everywhere except `main.tsx`,
  TypeScript strict, no `any`.
- **AbortController is not a reflex.** Declare it in the parent data fetcher
  and only use it where it matters (a stream with a Stop button, or a request
  resolving after unmount).
- **The UI must not look like an AI product.** No gradients, glow, neon, or
  "AI" branding. Neutral grays and near-black accents.
- **Never fabricate resume facts.** No invented employers, dates, degrees, or
  metrics. Ask for the input or leave it out.
- **User privacy first.** The app only reads files the user explicitly picked
  and uploaded — ask for consent before accessing any personal file (FR-14).
  Same for coding agents: never read files in the user's home directory or
  outside this project without their explicit permission — ask first, proceed
  only if they say yes.
- **Safe commands only.** Never run shell commands that put the user or their
  system in danger — no recursive deletes on paths we did not create, no
  remote scripts piped into a shell, no changes to system config or
  permissions, no killing processes. If a command is even mildly destructive,
  explain it and get approval first. User privacy and system safety weigh as
  much as the MVP — more than shipping speed.
- **Modern tooling.** Current-generation dev tools: TypeScript strict, ESLint +
  Prettier, Vite/Vitest (frontend), Nest CLI + Jest (backend), pnpm scripts as
  the entry point. Do not hand-roll what a standard tool does.
- **Write like a human.** Resume text must read like something a person wrote
  for a recruiter — plain words, short sentences, no buzzword stacking.

## Documentation policy

Every big feature, architecture change, or notable decision gets a short
section in `README.md` in the same change that ships the code. Use plain
technical sentences — no inflated wording. Keep requirement IDs (FR-x) stable.

## Verification

- Frontend: `pnpm run lint` (must pass the `max-lines` and style rules) and
  `pnpm run typecheck`.
- Backend: lint + typecheck + tests for the module you touched.
- Commands will be listed here once the projects are scaffolded.
