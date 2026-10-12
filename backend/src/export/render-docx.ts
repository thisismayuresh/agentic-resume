import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import { ExportFailedError } from '@app/shared';
import type { ResumeLine } from './resume-view';

function paragraphFor(line: ResumeLine): Paragraph {
  switch (line.kind) {
    case 'name':
      return new Paragraph({
        children: [new TextRun({ text: line.text, bold: true, size: 36 })],
        spacing: { after: 120 },
      });
    case 'contact':
      return new Paragraph({
        children: [new TextRun({ text: line.text, size: 19, color: '444444' })],
        spacing: { after: 120 },
      });
    case 'sectionTitle':
      return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun({ text: line.text.toUpperCase(), bold: true })],
        spacing: { before: 240, after: 120 },
      });
    case 'entry':
      return new Paragraph({
        children: buildEntryRuns(line),
        spacing: { before: 80 },
      });
    case 'paragraph':
      return new Paragraph({
        children: [
          new TextRun({
            text: line.text,
            bold: line.bold,
            italics: line.italic,
          }),
        ],
        spacing: { after: 60 },
      });
    case 'bullet':
      return new Paragraph({
        children: [
          new TextRun({
            text: line.text,
            bold: line.bold,
            italics: line.italic,
          }),
        ],
        bullet: { level: 0 },
        spacing: { after: 40 },
      });
    default:
      return new Paragraph({ children: [] });
  }
}

function buildEntryRuns(
  line: Extract<ResumeLine, { kind: 'entry' }>,
): TextRun[] {
  const runs: TextRun[] = [];
  if (line.role.length > 0) {
    runs.push(new TextRun({ text: line.role, bold: true }));
  }
  const details = [line.company, line.dates]
    .filter((part) => part.length > 0)
    .join('  |  ');
  if (details.length > 0) {
    runs.push(new TextRun({ text: `  ${details}`, color: '444444' }));
  }
  if (runs.length === 0) {
    runs.push(new TextRun({ text: ' ' }));
  }
  return runs;
}

export async function renderDocx(lines: ResumeLine[]): Promise<Buffer> {
  try {
    const children = lines.map(paragraphFor);
    const doc = new Document({
      title: 'Resume',
      sections: [{ children }],
    });
    return await Packer.toBuffer(doc);
  } catch {
    throw new ExportFailedError('The DOCX could not be created. Try again.');
  }
}
