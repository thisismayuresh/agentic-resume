import { InvalidOpError } from '@app/shared';
import type { ResumeDocument, ResumeOp } from './resume.types';
import {
  findBlock,
  findBulletIndex,
  findSection,
  parseResumePath,
} from './ops-path';

function insertSection(
  resume: ResumeDocument,
  op: Extract<ResumeOp, { type: 'insertSection' }>,
): void {
  if (!Number.isInteger(op.at)) {
    throw new InvalidOpError(
      `insertSection needs a whole number for "at", got ${String(op.at)}.`,
    );
  }
  const index = Math.min(Math.max(op.at, 0), resume.sections.length);
  resume.sections.splice(index, 0, op.section);
}

function updateText(
  resume: ResumeDocument,
  op: Extract<ResumeOp, { type: 'updateText' }>,
): void {
  const path = parseResumePath(op.path);

  if (path.blockId === null) {
    const section = findSection(resume, path.sectionId);
    section.title = op.text;
    return;
  }

  const section = findSection(resume, path.sectionId);
  const block = findBlock(section, path.blockId);

  if (path.bulletIndex === null) {
    block.text = op.text;
    return;
  }

  const bulletIndex = findBulletIndex(block, path.bulletIndex, op.path);
  const bullets = block.bullets ?? [];
  bullets[bulletIndex] = op.text;
}

function moveItem(items: unknown[], fromIndex: number, toIndex: number): void {
  const [item] = items.splice(fromIndex, 1);
  const target = Math.min(Math.max(toIndex, 0), items.length);
  items.splice(target, 0, item);
}

function moveBlock(
  resume: ResumeDocument,
  op: Extract<ResumeOp, { type: 'moveBlock' }>,
): void {
  const path = parseResumePath(op.path);
  if (!Number.isInteger(op.to)) {
    throw new InvalidOpError(
      `moveBlock needs a whole number for "to", got ${String(op.to)}.`,
    );
  }

  if (path.blockId === null) {
    const fromIndex = resume.sections.findIndex(
      (section) => section.id === path.sectionId,
    );
    if (fromIndex < 0) {
      throw new InvalidOpError(
        `The section "${path.sectionId}" is not in this resume.`,
      );
    }
    moveItem(resume.sections, fromIndex, op.to);
    return;
  }

  const section = findSection(resume, path.sectionId);
  const fromIndex = section.blocks.findIndex(
    (block) => block.id === path.blockId,
  );
  if (fromIndex < 0) {
    throw new InvalidOpError(
      `The block "${path.blockId}" is not in section "${section.title}".`,
    );
  }
  moveItem(section.blocks, fromIndex, op.to);
}

function setStyle(
  resume: ResumeDocument,
  op: Extract<ResumeOp, { type: 'setStyle' }>,
): void {
  const path = parseResumePath(op.path);
  if (path.blockId === null || path.bulletIndex !== null) {
    throw new InvalidOpError(
      `setStyle needs a block path like "sectionId/blockId", got "${op.path}".`,
    );
  }
  const section = findSection(resume, path.sectionId);
  const block = findBlock(section, path.blockId);
  const nextStyle = { ...block.style };
  if (op.style.bold !== undefined) {
    nextStyle.bold = op.style.bold;
  }
  if (op.style.italic !== undefined) {
    nextStyle.italic = op.style.italic;
  }
  block.style = nextStyle;
}

function removeBlock(
  resume: ResumeDocument,
  op: Extract<ResumeOp, { type: 'removeBlock' }>,
): void {
  const path = parseResumePath(op.path);
  const section = findSection(resume, path.sectionId);

  if (path.blockId === null) {
    const sectionIndex = resume.sections.findIndex(
      (candidate) => candidate.id === section.id,
    );
    resume.sections.splice(sectionIndex, 1);
    return;
  }

  const block = findBlock(section, path.blockId);

  if (path.bulletIndex === null) {
    const blockIndex = section.blocks.findIndex(
      (candidate) => candidate.id === block.id,
    );
    section.blocks.splice(blockIndex, 1);
    return;
  }

  const bulletIndex = findBulletIndex(block, path.bulletIndex, op.path);
  const bullets = block.bullets ?? [];
  bullets.splice(bulletIndex, 1);
}

function applyOne(resume: ResumeDocument, op: ResumeOp): void {
  switch (op.type) {
    case 'insertSection':
      insertSection(resume, op);
      return;
    case 'updateText':
      updateText(resume, op);
      return;
    case 'moveBlock':
      moveBlock(resume, op);
      return;
    case 'setStyle':
      setStyle(resume, op);
      return;
    case 'removeBlock':
      removeBlock(resume, op);
      return;
    default:
      throw new InvalidOpError('This edit type is not supported by the app.');
  }
}

export function applyOps(
  resume: ResumeDocument,
  ops: ResumeOp[],
): ResumeDocument {
  const next: ResumeDocument = structuredClone(resume);
  for (const op of ops) {
    applyOne(next, op);
  }
  return next;
}
