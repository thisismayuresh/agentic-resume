import type { ResumeBlock, ResumeOp, ResumeSection } from '@app/resume';
import { scanBullet, scanText } from './check-output';

export interface OpsScan {
  ops: ResumeOp[];
  violations: string[];
}

function scanBlock(
  block: ResumeBlock,
  sourceText: string,
): { block: ResumeBlock | null; violations: string[] } {
  const next: ResumeBlock = { ...block };
  const violations: string[] = [];

  if (next.text) {
    const textScan = scanText(next.text, sourceText);
    next.text = textScan.text;
    violations.push(...textScan.violations);
  }

  if (next.bullets) {
    const keptBullets: string[] = [];
    for (const bullet of next.bullets) {
      const bulletScan = scanBullet(bullet, sourceText);
      if (bulletScan.keep) {
        keptBullets.push(bullet);
      } else if (bulletScan.violation) {
        violations.push(bulletScan.violation);
      }
    }
    next.bullets = keptBullets;
  }

  const hasText = typeof next.text === 'string' && next.text.trim().length > 0;
  const hasBullets = (next.bullets?.length ?? 0) > 0;
  const hasMeta = next.meta !== undefined;

  if (!hasText && !hasBullets && !hasMeta) {
    return { block: null, violations };
  }
  return { block: next, violations };
}

function scanSection(
  section: ResumeSection,
  sourceText: string,
): { section: ResumeSection | null; violations: string[] } {
  const keptBlocks: ResumeBlock[] = [];
  const violations: string[] = [];

  for (const block of section.blocks) {
    const blockScan = scanBlock(block, sourceText);
    violations.push(...blockScan.violations);
    if (blockScan.block) {
      keptBlocks.push(blockScan.block);
    }
  }

  if (keptBlocks.length === 0) {
    return { section: null, violations };
  }
  return { section: { ...section, blocks: keptBlocks }, violations };
}

function scanOneOp(
  op: ResumeOp,
  sourceText: string,
): { op: ResumeOp | null; violations: string[] } {
  if (op.type === 'updateText') {
    const textScan = scanText(op.text, sourceText);
    if (textScan.text.trim().length === 0) {
      return { op: null, violations: textScan.violations };
    }
    return {
      op: { ...op, text: textScan.text },
      violations: textScan.violations,
    };
  }

  if (op.type === 'insertSection') {
    const sectionScan = scanSection(op.section, sourceText);
    if (!sectionScan.section) {
      return { op: null, violations: sectionScan.violations };
    }
    return {
      op: { ...op, section: sectionScan.section },
      violations: sectionScan.violations,
    };
  }

  return { op, violations: [] };
}

export function scanOps(ops: ResumeOp[], sourceText: string): OpsScan {
  const keptOps: ResumeOp[] = [];
  const violations: string[] = [];

  for (const op of ops) {
    const opScan = scanOneOp(op, sourceText);
    violations.push(...opScan.violations);
    if (opScan.op) {
      keptOps.push(opScan.op);
    }
  }

  return { ops: keptOps, violations };
}
