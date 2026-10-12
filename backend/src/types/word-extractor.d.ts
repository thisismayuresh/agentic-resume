declare module 'word-extractor' {
  interface ExtractedWordDocument {
    body(): string;
    headers(): string;
    footers(): string;
  }

  export default class WordExtractor {
    extract(buffer: Buffer): Promise<ExtractedWordDocument>;
  }
}
