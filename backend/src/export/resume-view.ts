import type { ResumeDocument } from '@app/resume';

export type ResumeLine =
  | { kind: 'name'; text: string }
  | { kind: 'contact'; text: string }
  | { kind: 'sectionTitle'; text: string }
  | { kind: 'entry'; role: string; company: string; dates: string }
  | { kind: 'paragraph'; text: string; bold: boolean; italic: boolean }
  | { kind: 'bullet'; text: string; bold: boolean; italic: boolean };

function contactLine(resume: ResumeDocument): string | null {
  const contact = resume.contact;
  if (!contact) {
    return null;
  }
  const parts: string[] = [];
  if (contact.location) parts.push(contact.location);
  if (contact.phone) parts.push(contact.phone);
  if (contact.email) parts.push(contact.email);
  if (parts.length === 0) {
    return null;
  }
  return parts.join('  |  ');
}

function entryDates(start?: string, end?: string): string {
  if (start && end) {
    return `${start} - ${end}`;
  }
  if (start) {
    return start;
  }
  if (end) {
    return end;
  }
  return '';
}

export function buildResumeView(resume: ResumeDocument): ResumeLine[] {
  const lines: ResumeLine[] = [];

  if (resume.fullName) {
    lines.push({ kind: 'name', text: resume.fullName });
  }
  const contact = contactLine(resume);
  if (contact) {
    lines.push({ kind: 'contact', text: contact });
  }

  for (const section of resume.sections) {
    lines.push({ kind: 'sectionTitle', text: section.title });

    for (const block of section.blocks) {
      const bold = block.style?.bold === true;
      const italic = block.style?.italic === true;

      if (block.type === 'entry') {
        lines.push({
          kind: 'entry',
          role: block.meta?.role ?? '',
          company: block.meta?.company ?? '',
          dates: entryDates(block.meta?.start, block.meta?.end),
        });
      }
      if (block.text && block.text.trim().length > 0) {
        lines.push({
          kind: 'paragraph',
          text: block.text.trim(),
          bold,
          italic,
        });
      }
      for (const bullet of block.bullets ?? []) {
        if (bullet.trim().length > 0) {
          lines.push({ kind: 'bullet', text: bullet.trim(), bold, italic });
        }
      }
    }
  }

  return lines;
}
