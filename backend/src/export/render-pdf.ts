import PDFDocument from 'pdfkit';
import { ExportFailedError } from '@app/shared';
import type { ResumeLine } from './resume-view';

const PAGE_MARGIN = 54;
const BODY_FONT_SIZE = 10.5;
const SMALL_FONT_SIZE = 9.5;

type PdfDocument = InstanceType<typeof PDFDocument>;

function writeBody(doc: PdfDocument, lines: ResumeLine[]): void {
  for (const line of lines) {
    writeLine(doc, line);
  }
}

function writeLine(doc: PdfDocument, line: ResumeLine): void {
  switch (line.kind) {
    case 'name':
      doc
        .font('Helvetica-Bold')
        .fontSize(18)
        .fillColor('#000000')
        .text(line.text);
      doc.moveDown(0.2);
      return;
    case 'contact':
      doc
        .font('Helvetica')
        .fontSize(SMALL_FONT_SIZE)
        .fillColor('#444444')
        .text(line.text);
      doc.moveDown(0.3);
      return;
    case 'sectionTitle':
      doc.moveDown(0.4);
      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .fillColor('#000000')
        .text(line.text.toUpperCase());
      doc
        .moveTo(doc.x, doc.y)
        .lineTo(doc.page.width - PAGE_MARGIN, doc.y)
        .stroke();
      doc.moveDown(0.3);
      return;
    case 'entry':
      if (line.role.length > 0) {
        doc
          .font('Helvetica-Bold')
          .fontSize(BODY_FONT_SIZE)
          .fillColor('#000000')
          .text(line.role);
      }
      const details = [line.company, line.dates]
        .filter((part) => part.length > 0)
        .join('  |  ');
      if (details.length > 0) {
        doc
          .font('Helvetica')
          .fontSize(SMALL_FONT_SIZE)
          .fillColor('#444444')
          .text(details);
      }
      return;
    case 'paragraph':
      doc
        .font(fontFor(line.bold, line.italic))
        .fontSize(BODY_FONT_SIZE)
        .fillColor('#000000');
      doc.text(line.text);
      return;
    case 'bullet':
      doc
        .font(fontFor(line.bold, line.italic))
        .fontSize(BODY_FONT_SIZE)
        .fillColor('#000000');
      doc.text(`•  ${line.text}`, { indent: 12 });
      return;
    default:
      return;
  }
}

function fontFor(bold: boolean, italic: boolean): string {
  if (bold && italic) {
    return 'Helvetica-BoldOblique';
  }
  if (bold) {
    return 'Helvetica-Bold';
  }
  if (italic) {
    return 'Helvetica-Oblique';
  }
  return 'Helvetica';
}

export function renderPdf(lines: ResumeLine[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: PAGE_MARGIN,
        bottom: PAGE_MARGIN,
        left: PAGE_MARGIN,
        right: PAGE_MARGIN,
      },
      info: { Title: 'Resume' },
    });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', () =>
      reject(new ExportFailedError('The PDF could not be created. Try again.')),
    );

    writeBody(doc, lines);
    doc.end();
  });
}
