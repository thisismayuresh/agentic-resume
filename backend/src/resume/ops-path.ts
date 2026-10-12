import { InvalidOpError } from '@app/shared';
import type {
  ResumeBlock,
  ResumeDocument,
  ResumeSection,
} from './resume.types';

export interface ResumePath {
  sectionId: string;
  blockId: string | null;
  bulletIndex: number | null;
}

export function parseResumePath(path: string): ResumePath {
  const segments = path.split('/').filter((segment) => segment.length > 0);
  if (segments.length < 1 || segments.length > 3) {
    throw new InvalidOpError(
      `The path "${path}" is not usable. Use "sectionId", "sectionId/blockId" or "sectionId/blockId/bulletIndex".`,
    );
  }

  const sectionId = segments[0];
  if (segments.length === 1) {
    return { sectionId, blockId: null, bulletIndex: null };
  }

  const blockId = segments[1];
  if (segments.length === 2) {
    return { sectionId, blockId, bulletIndex: null };
  }

  const bulletIndex = Number(segments[2]);
  if (!Number.isInteger(bulletIndex) || bulletIndex < 0) {
    throw new InvalidOpError(
      `The path "${path}" does not end in a bullet position. Use a number like 0 for the first bullet.`,
    );
  }
  return { sectionId, blockId, bulletIndex };
}

export function findSection(
  resume: ResumeDocument,
  sectionId: string,
): ResumeSection {
  const section = resume.sections.find(
    (candidate) => candidate.id === sectionId,
  );
  if (!section) {
    throw new InvalidOpError(
      `The section "${sectionId}" is not in this resume.`,
    );
  }
  return section;
}

export function findBlock(
  section: ResumeSection,
  blockId: string,
): ResumeBlock {
  const block = section.blocks.find((candidate) => candidate.id === blockId);
  if (!block) {
    throw new InvalidOpError(
      `The block "${blockId}" is not in section "${section.title}".`,
    );
  }
  return block;
}

export function findBulletIndex(
  block: ResumeBlock,
  position: number,
  path: string,
): number {
  const bullets = block.bullets ?? [];
  if (position >= bullets.length) {
    throw new InvalidOpError(
      `The path "${path}" points at bullet ${position}, but this block has ${bullets.length}.`,
    );
  }
  return position;
}
