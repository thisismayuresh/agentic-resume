import { describe, expect, it } from 'vitest';
import type { ResumeDocument } from '../types';
import { applyResumeOp, blockPath, parseBlockPath } from './resumeOps';

function buildDocument(): ResumeDocument {
  return {
    fullName: 'Alex Example',
    sections: [
      {
        id: 'summary',
        title: 'Summary',
        blocks: [{ id: 'summary-1', type: 'text', text: 'Short summary.' }],
      },
      {
        id: 'experience',
        title: 'Experience',
        blocks: [
          { id: 'exp-1', type: 'text', text: 'First job.' },
          { id: 'exp-2', type: 'text', text: 'Second job.' },
        ],
      },
    ],
  };
}

describe('parseBlockPath', () => {
  it('parses the compact section.block form', () => {
    expect(parseBlockPath('1.0')).toEqual({ sectionIndex: 1, blockIndex: 0 });
  });

  it('parses the verbose sections.blocks form', () => {
    expect(parseBlockPath('sections.2.blocks.3')).toEqual({
      sectionIndex: 2,
      blockIndex: 3,
    });
  });

  it('parses a section-only path', () => {
    expect(parseBlockPath('0')).toEqual({ sectionIndex: 0, blockIndex: null });
  });

  it('rejects paths without numbers', () => {
    expect(parseBlockPath('experience.headline')).toBeNull();
  });
});

describe('applyResumeOp', () => {
  it('updates block text', () => {
    const document = applyResumeOp(buildDocument(), {
      type: 'updateText',
      path: blockPath(0, 0),
      text: 'Rewritten summary.',
    });
    expect(document.sections[0].blocks[0].text).toBe('Rewritten summary.');
  });

  it('splits bullet list text into bullets', () => {
    const start = buildDocument();
    start.sections[1].blocks.push({ id: 'exp-3', type: 'bulletList', bullets: [] });
    const document = applyResumeOp(start, {
      type: 'updateText',
      path: blockPath(1, 2),
      text: 'Shipped the billing rewrite.\nCut support tickets in half.',
    });
    const bullets = document.sections[1].blocks[2].bullets;
    expect(bullets).toEqual(['Shipped the billing rewrite.', 'Cut support tickets in half.']);
  });

  it('moves a block down inside its section', () => {
    const document = applyResumeOp(buildDocument(), {
      type: 'moveBlock',
      path: blockPath(1, 0),
      to: 1,
    });
    expect(document.sections[1].blocks.map((block) => block.id)).toEqual(['exp-2', 'exp-1']);
  });

  it('toggles block style', () => {
    const document = applyResumeOp(buildDocument(), {
      type: 'setStyle',
      path: blockPath(0, 0),
      style: { bold: true },
    });
    expect(document.sections[0].blocks[0].style).toEqual({ bold: true });
  });

  it('removes a block', () => {
    const document = applyResumeOp(buildDocument(), {
      type: 'removeBlock',
      path: blockPath(1, 0),
    });
    expect(document.sections[1].blocks.map((block) => block.id)).toEqual(['exp-2']);
  });

  it('inserts a section at the given index', () => {
    const document = applyResumeOp(buildDocument(), {
      type: 'insertSection',
      at: 1,
      section: { id: 'education', title: 'Education', blocks: [] },
    });
    expect(document.sections.map((section) => section.id)).toEqual([
      'summary',
      'education',
      'experience',
    ]);
  });

  it('ignores ops with unknown paths', () => {
    const start = buildDocument();
    const document = applyResumeOp(start, {
      type: 'updateText',
      path: '9.9',
      text: 'Nope.',
    });
    expect(document).toEqual(start);
  });
});
