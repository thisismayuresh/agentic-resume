import { describe, expect, it } from 'vitest';
import { InvalidOpError } from '@app/shared';
import { applyOps } from './apply-ops';
import type { ResumeDocument, ResumeOp } from './resume.types';

function makeResume(): ResumeDocument {
  return {
    fullName: 'Jane Doe',
    contact: { email: 'jane@example.com' },
    sections: [
      {
        id: 'experience',
        title: 'Experience',
        blocks: [
          {
            id: 'job-1',
            type: 'entry',
            meta: {
              company: 'Acme',
              role: 'Engineer',
              start: '2020',
              end: '2023',
            },
            bullets: ['Built the billing service', 'Cut p95 latency in half'],
          },
          {
            id: 'job-2',
            type: 'entry',
            meta: { company: 'Globex', role: 'Developer' },
            bullets: ['Shipped the onboarding flow'],
          },
        ],
      },
      {
        id: 'skills',
        title: 'Skills',
        blocks: [
          { id: 'skills-1', type: 'bulletList', bullets: ['TypeScript'] },
        ],
      },
    ],
  };
}

describe('applyOps', () => {
  it('updates a single bullet without touching the original resume', () => {
    const original = makeResume();
    const op: ResumeOp = {
      type: 'updateText',
      path: 'experience/job-1/0',
      text: 'Built the billing service in Go',
    };

    const next = applyOps(original, [op]);

    expect(next.sections[0].blocks[0].bullets?.[0]).toBe(
      'Built the billing service in Go',
    );
    expect(original.sections[0].blocks[0].bullets?.[0]).toBe(
      'Built the billing service',
    );
  });

  it('renames a section when the path stops at the section', () => {
    const next = applyOps(makeResume(), [
      { type: 'updateText', path: 'skills', text: 'Tools' },
    ]);

    expect(next.sections[1].title).toBe('Tools');
  });

  it('removes one bullet when the path points at a bullet', () => {
    const next = applyOps(makeResume(), [
      { type: 'removeBlock', path: 'experience/job-1/1' },
    ]);

    expect(next.sections[0].blocks[0].bullets).toEqual([
      'Built the billing service',
    ]);
  });

  it('removes a whole section when the path stops at the section', () => {
    const next = applyOps(makeResume(), [
      { type: 'removeBlock', path: 'skills' },
    ]);

    expect(next.sections.map((section) => section.id)).toEqual(['experience']);
  });

  it('reorders sections on a section path move', () => {
    const next = applyOps(makeResume(), [
      { type: 'moveBlock', path: 'skills', to: 0 },
    ]);

    expect(next.sections.map((section) => section.id)).toEqual([
      'skills',
      'experience',
    ]);
  });

  it('sets block style on a block path', () => {
    const next = applyOps(makeResume(), [
      { type: 'setStyle', path: 'experience/job-2', style: { bold: true } },
    ]);

    expect(next.sections[0].blocks[1].style).toEqual({ bold: true });
  });

  it('inserts a section at the requested position', () => {
    const next = applyOps(makeResume(), [
      {
        type: 'insertSection',
        at: 0,
        section: { id: 'education', title: 'Education', blocks: [] },
      },
    ]);

    expect(next.sections[0].id).toBe('education');
    expect(next.sections).toHaveLength(3);
  });

  it('rejects a path that points at a missing section', () => {
    expect(() =>
      applyOps(makeResume(), [{ type: 'updateText', path: 'nope', text: 'x' }]),
    ).toThrow(InvalidOpError);
  });

  it('rejects a setStyle that targets a section path', () => {
    expect(() =>
      applyOps(makeResume(), [
        { type: 'setStyle', path: 'skills', style: { bold: true } },
      ]),
    ).toThrow(InvalidOpError);
  });

  it('rejects a bullet index past the end of the block', () => {
    expect(() =>
      applyOps(makeResume(), [
        { type: 'updateText', path: 'experience/job-1/5', text: 'x' },
      ]),
    ).toThrow(InvalidOpError);
  });
});
