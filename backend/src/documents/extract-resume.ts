import type {
  ResumeBlock,
  ResumeDocument,
  ResumeSection,
} from '@app/resume';
import { extractContact } from './contact';
import { detectSectionTitle } from './headings';

const BULLET_PREFIX = /^([-•*]|\d+\.)\s+/;
const DATE_RANGE =
  /\b((?:19|20)\d{2})\s*(?:[-–—]|to)\s*(?:(?:[A-Za-z]{3,9})\s+)?((?:19|20)\d{2}|present|current)\b/i;
const NOISE_LINE = /^[\d\s.]+$/;
const TRAILING_MONTH =
  /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s*$/i;
const PHONE_LIKE = /(?:\+?\d[\s().-]?){7,}/;
const ENTRY_SEPARATORS = /\s+\bat\s+|\s*\|\s*|\s+[–—]\s+|\s*,\s+/;

function slugify(text: string): string {
  const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return slug.replace(/^-+|-+$/g, '');
}

function digitCount(text: string): number {
  const matches = text.match(/\d/g);
  return matches ? matches.length : 0;
}

function buildContactNoise(lines: string[]): Set<string> {
  const noise = new Set<string>();
  for (const line of lines.slice(0, 8)) {
    if (line.includes('@')) {
      noise.add(line);
      continue;
    }
    if (line.length <= 45 && digitCount(line) >= 7 && PHONE_LIKE.test(line)) {
      noise.add(line);
    }
  }
  return noise;
}

function startSection(sections: ResumeSection[], title: string): ResumeSection {
  const section: ResumeSection = {
    id: `section-${sections.length + 1}-${slugify(title)}`,
    title,
    blocks: [],
  };
  sections.push(section);
  return section;
}

function nextBlockId(section: ResumeSection): string {
  return `${section.id}-b${section.blocks.length + 1}`;
}

function capitalizeToken(token: string): string {
  const lowered = token.toLowerCase();
  return lowered[0].toUpperCase() + lowered.slice(1);
}

function buildEntry(section: ResumeSection, line: string): ResumeBlock {
  const match = DATE_RANGE.exec(line);
  const start = match ? match[1] : undefined;
  const end = match ? capitalizeToken(match[2]) : undefined;
  const remainder = line
    .replace(DATE_RANGE, '')
    .replace(TRAILING_MONTH, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/[,;|.\s]+$/, '')
    .trim();
  const parts = remainder
    .split(ENTRY_SEPARATORS)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  const block: ResumeBlock = {
    id: nextBlockId(section),
    type: 'entry',
    bullets: [],
  };
  const meta: NonNullable<ResumeBlock['meta']> = {};
  if (parts.length > 0) {
    meta.role = parts[0];
  }
  if (parts.length > 1) {
    meta.company = parts.slice(1).join(', ');
  }
  if (start) {
    meta.start = start;
  }
  if (end) {
    meta.end = end;
  }
  block.meta = meta;
  return block;
}

function addBullet(
  section: ResumeSection,
  lastEntry: ResumeBlock | null,
  text: string,
): void {
  if (lastEntry) {
    lastEntry.bullets?.push(text);
    return;
  }
  const lastBlock =
    section.blocks.length > 0
      ? section.blocks[section.blocks.length - 1]
      : null;
  if (lastBlock && lastBlock.type === 'bulletList') {
    lastBlock.bullets?.push(text);
    return;
  }
  section.blocks.push({
    id: nextBlockId(section),
    type: 'bulletList',
    bullets: [text],
  });
}

function addTextLine(
  section: ResumeSection,
  lastEntry: ResumeBlock | null,
  line: string,
): void {
  if (lastEntry) {
    lastEntry.bullets?.push(line);
    return;
  }
  const lastBlock =
    section.blocks.length > 0
      ? section.blocks[section.blocks.length - 1]
      : null;
  if (lastBlock && lastBlock.type === 'text' && lastBlock.text) {
    lastBlock.text = `${lastBlock.text} ${line}`;
    return;
  }
  section.blocks.push({ id: nextBlockId(section), type: 'text', text: line });
}

export function extractResumeDocument(text: string): ResumeDocument {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const contactInfo = extractContact(lines);
  const contactNoise = buildContactNoise(lines);
  const bodyLines = lines.slice(contactInfo.fullName ? 1 : 0);

  const sections: ResumeSection[] = [];
  let currentSection: ResumeSection | null = null;
  let lastEntry: ResumeBlock | null = null;

  for (const line of bodyLines) {
    if (NOISE_LINE.test(line) || contactNoise.has(line)) {
      continue;
    }
    const title = detectSectionTitle(line);
    if (title && !DATE_RANGE.test(line)) {
      currentSection = startSection(sections, title);
      lastEntry = null;
      continue;
    }
    if (currentSection === null) {
      currentSection = startSection(sections, 'Summary');
    }
    if (DATE_RANGE.test(line)) {
      lastEntry = buildEntry(currentSection, line);
      currentSection.blocks.push(lastEntry);
      continue;
    }
    if (BULLET_PREFIX.test(line)) {
      addBullet(
        currentSection,
        lastEntry,
        line.replace(BULLET_PREFIX, '').trim(),
      );
      continue;
    }
    addTextLine(currentSection, lastEntry, line);
  }

  const document: ResumeDocument = {
    sections: sections.filter((section) => section.blocks.length > 0),
  };
  if (contactInfo.fullName) {
    document.fullName = contactInfo.fullName;
  }
  if (Object.keys(contactInfo.contact).length > 0) {
    document.contact = contactInfo.contact;
  }
  return document;
}
