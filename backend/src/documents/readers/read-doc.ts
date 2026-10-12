import WordExtractor from 'word-extractor';

export async function readDoc(buffer: Buffer): Promise<string> {
  const extractor = new WordExtractor();
  const document = await extractor.extract(buffer);
  return document.body();
}
