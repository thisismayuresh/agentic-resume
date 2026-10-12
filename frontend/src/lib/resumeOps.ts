import type { ResumeBlock, ResumeDocument, ResumeOp } from '../types';

export function blockPath(sectionIndex: number, blockIndex: number): string {
  return `${sectionIndex}.${blockIndex}`;
}

export function pathOfOp(op: ResumeOp): string {
  if (op.type === 'insertSection') {
    return String(op.at);
  }
  return op.path;
}

interface ParsedBlockPath {
  sectionIndex: number;
  blockIndex: number | null;
}

export function parseBlockPath(path: string): ParsedBlockPath | null {
  const compact = path.trim();
  const detailedMatch = /^sections\.(\d+)\.blocks\.(\d+)$/.exec(compact);
  if (detailedMatch !== null) {
    return {
      sectionIndex: Number(detailedMatch[1]),
      blockIndex: Number(detailedMatch[2]),
    };
  }
  const parts = compact.split(/[./]/);
  const sectionIndex = toIndex(parts[0]);
  if (sectionIndex === null) {
    return null;
  }
  if (parts.length === 1) {
    return { sectionIndex, blockIndex: null };
  }
  const blockIndex = toIndex(parts[1]);
  if (blockIndex === null) {
    return null;
  }
  return { sectionIndex, blockIndex };
}

function toIndex(value: string | undefined): number | null {
  if (value === undefined || !/^\d+$/.test(value)) {
    return null;
  }
  return Number(value);
}

export function applyResumeOp(document: ResumeDocument, op: ResumeOp): ResumeDocument {
  switch (op.type) {
    case 'insertSection':
      return insertSection(document, op);
    case 'updateText':
      return updateText(document, op);
    case 'moveBlock':
      return moveBlock(document, op);
    case 'setStyle':
      return setStyle(document, op);
    case 'removeBlock':
      return removeBlock(document, op);
  }
}

function insertSection(
  document: ResumeDocument,
  op: Extract<ResumeOp, { type: 'insertSection' }>,
): ResumeDocument {
  const sections = [...document.sections];
  const at = clamp(op.at, 0, sections.length);
  sections.splice(at, 0, op.section);
  return { ...document, sections };
}

function updateText(
  document: ResumeDocument,
  op: Extract<ResumeOp, { type: 'updateText' }>,
): ResumeDocument {
  const target = findBlock(document, op.path);
  if (target === null) {
    return document;
  }
  const updated = withText(target.block, op.text);
  return replaceBlock(document, target.sectionIndex, target.blockIndex, updated);
}

function withText(block: ResumeBlock, text: string): ResumeBlock {
  if (block.type !== 'bulletList') {
    return { ...block, text };
  }
  const bullets = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  return { ...block, bullets };
}

function moveBlock(
  document: ResumeDocument,
  op: Extract<ResumeOp, { type: 'moveBlock' }>,
): ResumeDocument {
  const target = findBlock(document, op.path);
  if (target === null) {
    return document;
  }
  const section = document.sections[target.sectionIndex];
  const blocks = [...section.blocks];
  const moved = blocks.splice(target.blockIndex, 1)[0];
  const destination = clamp(op.to, 0, blocks.length);
  blocks.splice(destination, 0, moved);
  return replaceSection(document, target.sectionIndex, { ...section, blocks });
}

function setStyle(
  document: ResumeDocument,
  op: Extract<ResumeOp, { type: 'setStyle' }>,
): ResumeDocument {
  const target = findBlock(document, op.path);
  if (target === null) {
    return document;
  }
  const style = { ...target.block.style, ...op.style };
  const updated = { ...target.block, style };
  return replaceBlock(document, target.sectionIndex, target.blockIndex, updated);
}

function removeBlock(
  document: ResumeDocument,
  op: Extract<ResumeOp, { type: 'removeBlock' }>,
): ResumeDocument {
  const target = findBlock(document, op.path);
  if (target === null) {
    return document;
  }
  const section = document.sections[target.sectionIndex];
  const blocks = [...section.blocks];
  blocks.splice(target.blockIndex, 1);
  return replaceSection(document, target.sectionIndex, { ...section, blocks });
}

interface BlockTarget {
  sectionIndex: number;
  blockIndex: number;
  block: ResumeBlock;
}

function findBlock(document: ResumeDocument, path: string): BlockTarget | null {
  const parsed = parseBlockPath(path);
  if (parsed === null || parsed.blockIndex === null) {
    return null;
  }
  const section = document.sections[parsed.sectionIndex];
  if (section === undefined) {
    return null;
  }
  const block = section.blocks[parsed.blockIndex];
  if (block === undefined) {
    return null;
  }
  return { sectionIndex: parsed.sectionIndex, blockIndex: parsed.blockIndex, block };
}

function replaceBlock(
  document: ResumeDocument,
  sectionIndex: number,
  blockIndex: number,
  block: ResumeBlock,
): ResumeDocument {
  const section = document.sections[sectionIndex];
  const blocks = [...section.blocks];
  blocks[blockIndex] = block;
  return replaceSection(document, sectionIndex, { ...section, blocks });
}

function replaceSection(
  document: ResumeDocument,
  sectionIndex: number,
  section: ResumeDocument['sections'][number],
): ResumeDocument {
  const sections = [...document.sections];
  sections[sectionIndex] = section;
  return { ...document, sections };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}
