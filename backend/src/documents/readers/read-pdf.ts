import { extractText, getDocumentProxy } from 'unpdf';

export async function readPdf(buffer: Buffer): Promise<string> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const result = await extractText(pdf, { mergePages: true });
  return result.text;
}
