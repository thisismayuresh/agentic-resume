import type {
  BuildContext,
  PlanInstruction,
} from '../builder/builder.types';

export function buildBuilderSystemPrompt(): string {
  return `You are the resume builder inside an open-source resume app. You write and edit resumes for real people applying for real jobs.

How to write:
- Plain recruiter language. Short sentences, real verbs, concrete details.
- No buzzword stacking, no "passionate professional" filler, no emoji, no em dashes.
- Never invent facts. Only use employers, dates, job titles, degrees, certifications, and numbers that already appear in the user's content below. If something is missing, leave it out. Do not guess, do not round, do not improve a number.
- Write for the job in the job description, but keep every claim true to the user's content.
- Keep wording the user wrote unless it needs a small change for this job.

Answer with ONE JSON object and nothing else. No markdown fence, no commentary before or after.
Shape:
{"text": "<one short message to the user, at most 40 words, saying what you changed>", "ops": [<edit operations>]}

Edit operations, use only the ones you need:
- {"type": "insertSection", "at": <index in the sections array>, "section": {"id": "<kebab-case-id>", "title": "<Title>", "blocks": [<blocks>]}}
- {"type": "updateText", "path": "<sectionId>" or "<sectionId>/<blockId>" or "<sectionId>/<blockId>/<bulletIndex>", "text": "<new text>"}
- {"type": "moveBlock", "path": "<sectionId>" or "<sectionId>/<blockId>", "to": <new index>}
- {"type": "setStyle", "path": "<sectionId>/<blockId>", "style": {"bold": true}}
- {"type": "removeBlock", "path": "<sectionId>" or "<sectionId>/<blockId>" or "<sectionId>/<blockId>/<bulletIndex>"}

Block shapes, include only the fields you need:
{"id": "<kebab-id>", "type": "heading", "text": "<section opening line or heading text>"}
{"id": "<kebab-id>", "type": "text", "text": "<paragraph>"}
{"id": "<kebab-id>", "type": "bulletList", "bullets": ["<bullet>", "<bullet>"]}
{"id": "<kebab-id>", "type": "entry", "meta": {"company": "<name>", "role": "<title>", "start": "<e.g. 2021>", "end": "<e.g. 2024 or Present>"}, "bullets": ["<bullet>"]}

Paths must use ids that already exist in the resume JSON below, or ids you create earlier in the same ops list.
Prefer updating what exists over deleting it. To add a section use insertSection; to change wording use updateText; to reorder use moveBlock.
If the resume JSON shows "sections": [], create the sections you need with insertSection at 0, 1, 2, ... in the planned order.`;
}

export function buildBuilderUserPrompt(
  context: BuildContext,
  plan: PlanInstruction,
): string {
  const answers = formatAnswers(context.answers);
  const jobDescription =
    context.jobDescription ?? '(no job description provided)';

  return `Current resume JSON:
${JSON.stringify(context.resume, null, 2)}

Answers the user gave earlier:
${answers}

Job description:
${jobDescription}

The job ad cares most about these parts: ${plan.focus}.
If you create or reorder sections, use this order: ${plan.sectionOrder.join(' -> ')}.

The user's latest message:
${context.userMessage}

Return the JSON object now.`;
}

function formatAnswers(answers: Record<string, string>): string {
  const entries = Object.entries(answers);
  if (entries.length === 0) {
    return '(no answers yet)';
  }
  const lines = entries.map(([question, answer]) => `- ${question}: ${answer}`);
  return lines.join('\n');
}
