import type { ResumeDocument } from './resume.types';

function pushLine(parts: string[], text: string | undefined): void {
  if (text && text.trim().length > 0) {
    parts.push(text.trim());
  }
}

export function resumeToText(resume: ResumeDocument): string {
  const parts: string[] = [];
  pushLine(parts, resume.fullName);

  const contact = resume.contact;
  if (contact) {
    const contactParts: string[] = [];
    pushLine(contactParts, contact.location);
    pushLine(contactParts, contact.phone);
    pushLine(contactParts, contact.email);
    if (contactParts.length > 0) {
      parts.push(contactParts.join(' | '));
    }
  }

  for (const section of resume.sections) {
    parts.push(section.title);
    for (const block of section.blocks) {
      if (block.meta) {
        const metaParts: string[] = [];
        pushLine(metaParts, block.meta.role);
        pushLine(metaParts, block.meta.company);
        pushLine(metaParts, block.meta.start);
        pushLine(metaParts, block.meta.end);
        if (metaParts.length > 0) {
          parts.push(metaParts.join(' '));
        }
      }
      pushLine(parts, block.text);
      for (const bullet of block.bullets ?? []) {
        pushLine(parts, bullet);
      }
    }
  }

  return parts.join('\n');
}
