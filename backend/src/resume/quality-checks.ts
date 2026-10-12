import type { ResumeBlock, ResumeDocument } from './resume.types';

/**
 * Deterministic quality review of a resume - no model involved, so it runs
 * instantly after an upload or on demand. Catches the things that make a
 * resume look odd to a human and invisible to an ATS: missing contact info,
 * missing standard sections, scattered bold/italics, ALL-CAPS walls,
 * repeated words, and bullets no one can scan.
 */

export interface QualityFinding {
  code: string;
  message: string;
  /** Resume path of the offending block, when the finding is about one. */
  path?: string;
}

export interface QualityReport {
  findings: QualityFinding[];
  summary: string;
}

const MAX_FINDINGS = 12;
const LONG_BULLET_WORDS = 45;
const ALL_CAPS_MIN_LENGTH = 18;

const EXPERIENCE_TITLES = [
  'experience',
  'work',
  'work history',
  'employment',
  'professional background',
  'professional experience',
];
const EDUCATION_TITLES = ['education', 'academic', 'academics'];
const SKILLS_TITLES = [
  'skills',
  'competencies',
  'technologies',
  'tech stack',
  'tools',
];

const REPEATED_WORD = /\b([a-z]{3,})\s+\1\b/i;

function hasLetters(text: string): boolean {
  return /[a-z]/i.test(text);
}

function isAllCaps(text: string): boolean {
  return (
    text.length >= ALL_CAPS_MIN_LENGTH &&
    hasLetters(text) &&
    text === text.toUpperCase()
  );
}

function titleMatches(title: string, candidates: string[]): boolean {
  const normalized = title.trim().toLowerCase();
  return candidates.some((candidate) => normalized.includes(candidate));
}

function blockTexts(block: ResumeBlock): string[] {
  const texts: string[] = [];
  if (block.text !== undefined && block.text !== '') {
    texts.push(block.text);
  }
  for (const bullet of block.bullets ?? []) {
    texts.push(bullet);
  }
  return texts;
}

function checkContact(resume: ResumeDocument, findings: QualityFinding[]): void {
  const contact = resume.contact ?? {};
  const missing: string[] = [];
  if (contact.email === undefined || contact.email === '') {
    missing.push('email');
  }
  if (contact.phone === undefined || contact.phone === '') {
    missing.push('phone');
  }
  if (missing.length > 0) {
    findings.push({
      code: 'missing_contact',
      message: `No ${missing.join(' or ')} on the resume. Recruiters and ATS parsers look for contact details first.`,
    });
  }
  if (resume.fullName === undefined || resume.fullName === '') {
    findings.push({
      code: 'missing_name',
      message: 'The resume has no name at the top.',
    });
  }
}

function checkSections(resume: ResumeDocument, findings: QualityFinding[]): void {
  if (resume.sections.length === 0) {
    return;
  }
  const groups: { label: string; titles: string[] }[] = [
    { label: 'Experience', titles: EXPERIENCE_TITLES },
    { label: 'Education', titles: EDUCATION_TITLES },
    { label: 'Skills', titles: SKILLS_TITLES },
  ];
  for (const group of groups) {
    const found = resume.sections.some((section) =>
      titleMatches(section.title, group.titles),
    );
    if (!found) {
      findings.push({
        code: 'missing_section',
        message: `No ${group.label} section. ATS systems score resumes higher when the standard sections are present.`,
      });
    }
  }
  for (const section of resume.sections) {
    if (section.blocks.length === 0) {
      findings.push({
        code: 'empty_section',
        message: `The "${section.title}" section is empty.`,
        path: section.id,
      });
    }
  }
}

function checkBlocks(resume: ResumeDocument, findings: QualityFinding[]): void {
  let styledBodyBlocks = 0;
  let totalBodyBlocks = 0;

  for (const section of resume.sections) {
    for (const block of section.blocks) {
      const path = `${section.id}/${block.id}`;
      if (block.type !== 'heading') {
        totalBodyBlocks += 1;
        if (block.style?.bold === true || block.style?.italic === true) {
          styledBodyBlocks += 1;
        }
      }
      for (const text of blockTexts(block)) {
        if (isAllCaps(text)) {
          findings.push({
            code: 'all_caps',
            message: 'A line is written in ALL CAPS, which reads as shouting.',
            path,
          });
        }
        const repeated = REPEATED_WORD.exec(text);
        if (repeated !== null) {
          findings.push({
            code: 'possible_typo',
            message: `Possible typo: the word "${repeated[1]}" is repeated ("${repeated[0]}").`,
            path,
          });
        }
        const wordCount = text.split(/\s+/).filter((word) => word !== '').length;
        if (wordCount > LONG_BULLET_WORDS) {
          findings.push({
            code: 'long_bullet',
            message: `A line runs ${wordCount} words. Recruiters scan - try splitting it.`,
            path,
          });
        }
      }
    }
  }

  if (styledBodyBlocks >= 1 && styledBodyBlocks <= 4 && totalBodyBlocks >= 5) {
    findings.push({
      code: 'odd_formatting',
      message: `Bold or italics appear on only ${styledBodyBlocks} of ${totalBodyBlocks} lines, which looks uneven. Keep emphasis on headings or drop it.`,
    });
  }
}

export function checkResumeQuality(resume: ResumeDocument): QualityReport {
  const findings: QualityFinding[] = [];
  checkContact(resume, findings);
  checkSections(resume, findings);
  checkBlocks(resume, findings);

  const capped = findings.slice(0, MAX_FINDINGS);
  if (capped.length === 0) {
    return {
      findings: [],
      summary: 'Nothing odd stood out. Looks like a clean, scannable resume.',
    };
  }
  return {
    findings: capped,
    summary: `${capped.length} thing${capped.length === 1 ? '' : 's'} worth fixing before you send this out.`,
  };
}
