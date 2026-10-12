import { checkResumeQuality } from './quality-checks';
import type { ResumeDocument } from './resume.types';

function codesOf(resume: ResumeDocument): string[] {
  return checkResumeQuality(resume).findings.map((finding) => finding.code);
}

describe('checkResumeQuality', () => {
  const cleanResume: ResumeDocument = {
    fullName: 'Jane Doe',
    contact: { email: 'jane@example.com', phone: '555-0100' },
    sections: [
      {
        id: 'experience',
        title: 'Experience',
        blocks: [
          {
            id: 'job-1',
            type: 'entry',
            meta: { role: 'Engineer', company: 'Acme', start: '2020', end: '2023' },
            bullets: ['Built the billing service', 'Led the migration to NestJS'],
          },
          {
            id: 'job-2',
            type: 'entry',
            meta: { role: 'Intern', company: 'Beta', start: '2019', end: '2019' },
            bullets: ['Wrote internal tooling'],
          },
          {
            id: 'job-3',
            type: 'entry',
            meta: { role: 'Junior Engineer', company: 'Gamma', start: '2017', end: '2019' },
            bullets: ['Maintained the API gateway'],
          },
        ],
      },
      {
        id: 'education',
        title: 'Education',
        blocks: [
          { id: 'edu-1', type: 'text', text: 'BSc Computer Science, State University, 2019' },
        ],
      },
      {
        id: 'skills',
        title: 'Skills',
        blocks: [{ id: 'skills-1', type: 'bulletList', bullets: ['TypeScript', 'NestJS'] }],
      },
    ],
  };

  it('passes a clean resume', () => {
    const report = checkResumeQuality(cleanResume);
    expect(report.findings).toEqual([]);
    expect(report.summary).toContain('clean');
  });

  it('flags missing contact details', () => {
    const report = checkResumeQuality({
      ...cleanResume,
      fullName: undefined,
      contact: {},
    });
    const codes = report.findings.map((finding) => finding.code);
    expect(codes).toContain('missing_contact');
    expect(codes).toContain('missing_name');
  });

  it('flags missing standard sections', () => {
    const report = checkResumeQuality({
      ...cleanResume,
      sections: cleanResume.sections.slice(0, 1),
    });
    const codes = codesOf({ ...cleanResume, sections: cleanResume.sections.slice(0, 1) });
    expect(codes).toContain('missing_section');
    expect(report.findings.length).toBeGreaterThan(0);
  });

  it('flags an empty section', () => {
    const codes = codesOf({
      ...cleanResume,
      sections: [...cleanResume.sections, { id: 'projects', title: 'Projects', blocks: [] }],
    });
    expect(codes).toContain('empty_section');
  });

  it('flags scattered bold on body lines', () => {
    const resume: ResumeDocument = JSON.parse(JSON.stringify(cleanResume)) as ResumeDocument;
    const firstBlock = resume.sections[0].blocks[0];
    firstBlock.style = { bold: true };
    expect(codesOf(resume)).toContain('odd_formatting');
  });

  it('flags ALL CAPS lines and repeated words', () => {
    const resume: ResumeDocument = JSON.parse(JSON.stringify(cleanResume)) as ResumeDocument;
    resume.sections[2].blocks[0].bullets = [
      'LED A TEAM OF TEN PEOPLE ACROSS THREE OFFICES AND TWO TIME ZONES',
      'Worked with the the design team',
    ];
    const codes = codesOf(resume);
    expect(codes).toContain('all_caps');
    expect(codes).toContain('possible_typo');
  });

  it('flags very long bullets', () => {
    const resume: ResumeDocument = JSON.parse(JSON.stringify(cleanResume)) as ResumeDocument;
    const longLine = Array.from({ length: 50 }, (_, index) => `word${index}`).join(' ');
    resume.sections[0].blocks[0].bullets = [longLine];
    expect(codesOf(resume)).toContain('long_bullet');
  });

  it('caps the number of findings', () => {
    const blocks = Array.from({ length: 20 }, (_, index) => ({
      id: `b-${index}`,
      type: 'text' as const,
      text: `THE THE SAME SAME WORDS WORDS REPEATED REPEATED HERE HERE ${index}`,
    }));
    const report = checkResumeQuality({
      ...cleanResume,
      sections: [{ id: 'notes', title: 'Notes', blocks }],
    });
    expect(report.findings.length).toBeLessThanOrEqual(12);
  });
});
