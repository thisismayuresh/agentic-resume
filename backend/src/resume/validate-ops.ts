import {
  InvalidOpError,
  readArray,
  readNumber,
  readString,
  toRecord,
} from '@app/shared';
import type {
  BlockStyle,
  ResumeBlock,
  ResumeOp,
  ResumeSection,
} from './resume.types';

const BLOCK_TYPES = ['heading', 'text', 'bulletList', 'entry'];

function fail(index: number, problem: string): never {
  throw new InvalidOpError(`Edit ${index + 1} is not usable: ${problem}.`);
}

function readBlockType(
  value: unknown,
  index: number,
  blockPosition: number,
): ResumeBlock['type'] {
  if (typeof value !== 'string' || !BLOCK_TYPES.includes(value)) {
    fail(
      index,
      `block ${blockPosition + 1} needs type "heading", "text", "bulletList" or "entry"`,
    );
  }
  return value as ResumeBlock['type'];
}

function parseBlock(
  rawBlock: unknown,
  index: number,
  blockPosition: number,
): ResumeBlock {
  const record = toRecord(rawBlock);
  if (!record) {
    fail(index, `block ${blockPosition + 1} is not an object`);
  }
  const id = readString(record, 'id');
  if (!id) {
    fail(index, `block ${blockPosition + 1} is missing an id`);
  }
  const type = readBlockType(record.type, index, blockPosition);
  const block: ResumeBlock = { id, type };

  const text = readString(record, 'text');
  if (text !== null) {
    block.text = text;
  }

  const bullets = readArray(record, 'bullets');
  if (bullets !== null) {
    const cleaned: string[] = [];
    for (const item of bullets) {
      if (typeof item !== 'string') {
        fail(index, `block ${blockPosition + 1} has a bullet that is not text`);
      }
      cleaned.push(item);
    }
    block.bullets = cleaned;
  }

  const meta = toRecord(record.meta);
  if (meta) {
    block.meta = {};
    const company = readString(meta, 'company');
    const role = readString(meta, 'role');
    const start = readString(meta, 'start');
    const end = readString(meta, 'end');
    if (company !== null) block.meta.company = company;
    if (role !== null) block.meta.role = role;
    if (start !== null) block.meta.start = start;
    if (end !== null) block.meta.end = end;
  }

  const style = toRecord(record.style);
  if (style) {
    block.style = parseStyle(style, index, 'block style');
  }

  return block;
}

function parseStyle(
  record: Record<string, unknown>,
  index: number,
  label: string,
): BlockStyle {
  const style: BlockStyle = {};
  const bold = record.bold;
  const italic = record.italic;
  if (bold !== undefined) {
    if (typeof bold !== 'boolean') {
      fail(index, `${label} "bold" must be true or false`);
    }
    style.bold = bold;
  }
  if (italic !== undefined) {
    if (typeof italic !== 'boolean') {
      fail(index, `${label} "italic" must be true or false`);
    }
    style.italic = italic;
  }
  const extraKey = Object.keys(record).find(
    (key) => key !== 'bold' && key !== 'italic',
  );
  if (extraKey !== undefined) {
    fail(index, `${label} has an unknown field "${extraKey}"`);
  }
  return style;
}

export function validateResumeSection(
  rawSection: unknown,
  index: number,
): ResumeSection {
  const record = toRecord(rawSection);
  if (!record) {
    fail(index, 'the section is not an object');
  }
  const id = readString(record, 'id');
  const title = readString(record, 'title');
  if (!id) {
    fail(index, 'the section is missing an id');
  }
  if (!title) {
    fail(index, 'the section is missing a title');
  }
  const rawBlocks = readArray(record, 'blocks');
  if (rawBlocks === null) {
    fail(index, 'the section has no blocks array');
  }

  const blocks: ResumeBlock[] = [];
  for (const rawBlock of rawBlocks) {
    blocks.push(parseBlock(rawBlock, index, blocks.length));
  }
  return { id, title, blocks };
}

function parseStringOp(
  record: Record<string, unknown>,
  index: number,
  key: 'path' | 'text',
): string {
  const value = readString(record, key);
  if (value === null || value.trim().length === 0) {
    fail(index, `"${key}" must be a non-empty string`);
  }
  return value;
}

function parseNumberOp(
  record: Record<string, unknown>,
  index: number,
  key: 'at' | 'to',
): number {
  const value = readNumber(record, key);
  if (value === null) {
    fail(index, `"${key}" must be a number`);
  }
  return value;
}

function parseOp(rawOp: unknown, index: number): ResumeOp {
  const record = toRecord(rawOp);
  if (!record) {
    fail(index, 'it is not an object');
  }

  switch (record.type) {
    case 'insertSection':
      return {
        type: 'insertSection',
        at: parseNumberOp(record, index, 'at'),
        section: validateResumeSection(record.section, index),
      };
    case 'updateText':
      return {
        type: 'updateText',
        path: parseStringOp(record, index, 'path'),
        text: parseStringOp(record, index, 'text'),
      };
    case 'moveBlock':
      return {
        type: 'moveBlock',
        path: parseStringOp(record, index, 'path'),
        to: parseNumberOp(record, index, 'to'),
      };
    case 'setStyle': {
      const styleRecord = toRecord(record.style);
      if (!styleRecord) {
        fail(index, '"style" must be an object like { "bold": true }');
      }
      return {
        type: 'setStyle',
        path: parseStringOp(record, index, 'path'),
        style: parseStyle(styleRecord, index, 'style'),
      };
    }
    case 'removeBlock':
      return {
        type: 'removeBlock',
        path: parseStringOp(record, index, 'path'),
      };
    default:
      fail(index, `it has an unknown edit type "${String(record.type)}"`);
  }
}

export function parseResumeOps(rawOps: unknown[]): ResumeOp[] {
  const ops: ResumeOp[] = [];
  let position = 0;
  for (const rawOp of rawOps) {
    ops.push(parseOp(rawOp, position));
    position += 1;
  }
  return ops;
}
