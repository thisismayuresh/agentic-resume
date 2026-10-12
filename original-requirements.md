# Original Product Requirements

This is where the project started: the product requirements, written out
clearly. It records what was asked for and why.

`README.md` is the maintained parent document — requirements, architecture,
and code rules live there and stay current. When something changes, update
`README.md`; this file stays as the original brief.

---

## 1. What we are building

An open-source resume maker.

- The user gives the tool a job description and it builds a resume for that
  job.
- It starts by asking questions: name first, then phone/contact number, job
  history, and a few more. It works through the answers and writes the resume
  from them.
- The resume is shown on the right side of the screen while it is being built.
- The user can interact with the resume directly on that right pane: select a
  piece of text and guided controls appear — move it, bold it, and so on.
- No authentication in this version. Ship it as an initial POC.

## 2. How it should look and feel

- Simple and easy to use. The AI must not feel like "an AI product".
- No obvious AI styling — not the usual blue/gradient background that gives it
  away in a second.
- While the agent edits the resume, the user watches it happen: formatting
  changes and new text appearing in place.
- There is a small animation that plays while the AI is working on resume
  edits.

## 3. Workflow and agents

- The workflow is agentic — a multi-agent setup with **two highly specialized
  agents** handing work to each other, not a single prompt.
- The user can upload their original resume together with the job description,
  and the agent edits that resume for the role.
- Supported upload formats: `.doc`, `.docx`, `.pdf`.
- The user chooses the download format. PDF is the preferred default.
- The user's skills and experience are matched against the job description,
  with a matching percentage.
- The agent can warn the user when a job is not a good fit for them.

## 4. Guard rails

Handle bad input carefully:

- requests for illicit content
- requests that break the terms and conditions or the product policy
- general arguments, or curses aimed at the agent

The agent should respond calmly and stay on task, and must never produce
policy-violating output.

## 5. New users

A user with no resume should be shown sample resumes: ATS-friendly, well
formatted, well written. Picking one gives them a starting point.

## 6. Quality of the written resume

The resume the AI produces must not read like it was written by an AI. Use
simple language that a recruiter understands at a glance — plain words, short
sentences, no buzzword stacking.

## 7. Tech stack and constraints

- **Frontend:** React + TypeScript.
- **Backend:** NestJS (TypeScript). Skip Python/FastAPI for now — NestJS alone
  does the whole job, one service to run and debug.
- **Package manager:** pnpm for the whole project.
- **Model:** Ollama in Docker with a good model, plus an embedding model if we
  need one. There is no budget for expensive LLM APIs right now.
- **Keep the door open:** later we may want OpenAI or another LLM provider.
  Pick an integration layer that could swap providers without rewriting the
  app — the OpenAI SDK is a candidate if it works with all the models we care
  about; decide when we get there.
- **Vector store:** ChromaDB.
- **Streaming:** use HTTP streaming or a WebSocket where the UI needs live
  updates from the agent.
- **Documents:** to read the uploaded `.pdf` / `.doc` / `.docx` files and to
  render the download, use the best, most popular library that gets the job
  done. No hand-rolled parsing.
- **Docker Compose:** one file that brings up Ollama and every other
  dependency the project needs.

## 8. Code quality

Write very good quality code that is maintainable and easy to read and debug.

- Do not stuff everything into one file.
- No nested ternaries. Use readable `if`, `if/else`, and `switch` statements.
- Minimal use of the spread operator — only when it is genuinely needed.
  Prefer explicit step-by-step updates you can read top to bottom.
- Elegant, good-looking code. Follow design patterns where they fit. If
  tomorrow another developer joins, they should be able to read the repo and
  get started without help.
- Use modern tooling while developing — current, well-maintained dev tools
  (TypeScript strict, ESLint + Prettier, Vite, Nest CLI watch mode, Jest/Vitest,
  pnpm scripts). Do not hand-roll what a standard tool does.

### NestJS code quality

The quality of the Nest codebase must be very, very good. Neat, clean,
structured like a proper open-source project:

- Small APIs, small services — one job per controller action and per service
  method.
- Very structured imports and exports: every feature folder has an `index.ts`
  barrel; the rest of the app imports through it, never a deep file path.
- DTOs for every request and response that crosses a boundary.
- Multi-step operations are command objects with `execute()` methods (e.g.
  `RoastResumeCommand.execute(input)`), not giant service methods.
- Custom exception classes, exported and used everywhere — no bare `Error`
  throws, no internal details leaking to the client.
- Predictable, readable, highly maintainable code, so understanding and
  refactoring are easy.

## 9. Documentation

Every change, big feature introduction, and architecture decision gets added to
`README.md` (the parent README) in the same change that ships the code.

That file must be very readable. Coding agents tend to write complicated
sentences and inflated words — use technical language, but easy-to-understand
language.

## 10. Frontend skill

The frontend has a binding code-style skill:
`frontend/.claude/skills/react-human-code/SKILL.md` (reproduced in README §8).
It covers no `React.FC`, early returns instead of nesting, plain CSS, one
concern per component, all HTTP through the shared wrapper, and a 200-line cap
per component file.

One addition on top of the skill text: do not overuse `AbortController`.
Declare it in the parent data fetcher and use it only where it is actually
needed — do not attach one to every request as a reflex.

## 11. Agent options, including the Resume Roast

There will be a bunch of options the user can run on their resume — one-shot
agent actions offered on the left side of the editor. The first one is the
**Resume Roast/Review**.

- The agent roasts the resume: it finds the criticalities, the flaws, and the
  red flags — but in a good and most positive way. Honest and direct, tough
  love from someone who wants the user to get the interview. Never cruel,
  never personal.
- It gives a rating, in a very structured and comprehensive way.
- The report always has the same structure — same sections, same order, same
  depth, every single time:
  1. Rating (score out of 10 + one-line verdict)
  2. Red flags (each with severity and a one-line why)
  3. Critical flaws
  4. What already works
  5. Fix list, ordered by impact, each with a concrete rewrite

Detailed in `README.md` as FR-13.

## 12. Privacy and consent

The user's personal files are theirs. Protect them.

- The app accesses a personal file (resume, job description, anything on the
  user's machine) only after the user explicitly picks it and gives consent.
  Asking first is not optional.
- The app never scans the user's disk and never reads their home folder. No
  consent, no read.
- Uploaded files live in memory for the session only. The user can remove
  them at any time, and they are gone.
- Coding agents working in this repo follow the same rule: do not read files
  outside the project folder without asking the user first.
- Do not run arbitrary commands that put the user or their system in danger.
  No destructive shell commands, no scripts piped from the internet, no
  touching system settings. Anything risky gets explained and approved first.
  User privacy is very important — as important as the MVP itself.

Detailed in `README.md` as FR-14.
