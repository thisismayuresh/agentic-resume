import type { BuildContext, PlanInstruction } from '../builder.types';

const SECTION_PRIORITY = [
  'summary',
  'objective',
  'experience',
  'work experience',
  'employment',
  'skills',
  'education',
  'certifications',
  'projects',
];

const DEFAULT_ORDER = ['summary', 'experience', 'skills', 'education'];

function sectionsMentioned(jobDescription: string): string[] {
  const found: string[] = [];
  for (const title of SECTION_PRIORITY) {
    if (jobDescription.includes(title) && !found.includes(title)) {
      found.push(title);
    }
  }
  return found;
}

export function planSections(context: BuildContext): PlanInstruction {
  const jobDescription = (context.jobDescription ?? '').toLowerCase();
  const mentioned = sectionsMentioned(jobDescription);

  const sectionOrder = mentioned.length >= 2 ? mentioned : DEFAULT_ORDER;
  const focus =
    mentioned.length > 0
      ? mentioned.slice(0, 3).join(', ')
      : 'the job description';

  return { sectionOrder, focus };
}
