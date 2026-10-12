---
name: nest-structure
description: Use when writing or editing any NestJS/TypeScript code in this repo (backend/, controllers, services, commands, DTOs, tests). Binding rules for imports, module layout, barrels, commands, and exceptions.
---

# NestJS/TypeScript code style for this project

These rules are mandatory for every change under `backend/`. They exist so a
new developer can read any file and know exactly where each import comes from.

## Imports

There are three import styles — nothing else:

1. **Same folder** — role-suffixed file, extensionless:

   ```ts
   import { ChatService } from './chat.service';
   import { CreateSessionDto } from './dtos/create-session.dto';
   import { RoastResumeCommand } from './commands/roast-resume.command';
   import type { Session } from './session.types';
   ```

   File suffixes match their role: `.service`, `.controller`, `.module`,
   `.command`, `.dto`, `.types`, `.prompt`, `.step`.

2. **Inside your own module, one level up at most** — never two:

   ```ts
   // agent/builder/steps/draft.step.ts
   import type { BuildContext } from '../builder.types';
   import { buildBuilderPrompt } from '../builder.prompt';
   ```

3. **Across modules — always the `@app/` alias and the module barrel:**

   ```ts
   import { ApplyResumeOps, ResumeDocument } from '@app/resume';
   import { SessionsService } from '@app/sessions';
   import { LLM_CLIENT } from '@app/llm';
   ```

   Tests use the same alias: `import { AppModule } from '@app/app.module';`

Hard rules:

- **No `.js` extensions** on relative imports. The compiler setup is classic
  Nest: `module: commonjs`, `moduleResolution: node` (with
  `ignoreDeprecations` for TS 6). Extensionless is the point — do not "fix"
  it back to NodeNext.
- **Never climb two or more directories** (`../../`, `../../../`). The lint
  rule `no-restricted-imports` in `.oxlintrc.json` fails the run. If you feel
  the urge, your file is too deep — flatten it or use the alias.
- **Never deep-import another module's internals.**
  `import { X } from '@app/resume/resume.types'` is wrong;
  `import { X } from '@app/resume'` is right. The barrel is the public
  surface; anything not exported from the module's `index.ts` is private to
  that module.
- The alias is defined once in `tsconfig.json` (`@app/*` → `./src/*`). The
  build rewrites it with `tsc-alias`, so never hand-write paths that would
  survive only in TypeScript.

## Module layout

- One concern per file. Controllers stay thin; services stay single-purpose.
- Every module folder has an `index.ts` exporting the public surface only
  (module, controller, service, commands, DTOs other modules may need).
- Multi-step work is a command object with an `execute()` method, exported
  from the barrel — not one giant service method.
- Domain errors are custom exception classes in `shared/exceptions/`,
  exported and thrown by name. Never a bare `Error`, never internal details
  in a client-facing message.
- DTOs for every request and response that crosses a boundary. No `any`.
- Control flow: `if` / `if/else` / `switch`, early returns, max two nesting
  levels, no nested ternaries, sparse spreads. pnpm only.
