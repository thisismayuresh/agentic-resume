import { Inject, Injectable, Logger } from '@nestjs/common';
import { ChromaClient } from 'chromadb';
import { LLM_CLIENT, type LlmClient } from '@app/llm';

const COLLECTION_NAME = 'resume-match';

export interface SimilarityInput {
  sessionId: string;
  resumeText: string;
  jobDescription: string;
}

@Injectable()
export class ChromaSimilarity {
  private readonly logger = new Logger(ChromaSimilarity.name);

  constructor(@Inject(LLM_CLIENT) private readonly llm: LlmClient) {}

  async similarity(input: SimilarityInput): Promise<number | null> {
    const chromaUrl = process.env.CHROMA_URL;
    if (!chromaUrl) {
      return null;
    }

    try {
      return await this.measureSimilarity(input, chromaUrl);
    } catch (error) {
      this.logger.warn(
        `ChromaDB at ${chromaUrl} is not usable: ${describeError(error)}`,
      );
      return null;
    }
  }

  private async measureSimilarity(
    input: SimilarityInput,
    chromaUrl: string,
  ): Promise<number> {
    const vectors = await Promise.all([
      this.llm.embed(input.resumeText),
      this.llm.embed(input.jobDescription),
    ]);
    const [resumeVector, jobVector] = vectors;

    const client = makeChromaClient(chromaUrl);
    const collection = await client.getOrCreateCollection({
      name: COLLECTION_NAME,
    });
    await collection.upsert({
      ids: [`resume-${input.sessionId}`],
      embeddings: [resumeVector],
      documents: [input.resumeText],
    });

    const result = await collection.query({
      queryEmbeddings: [jobVector],
      nResults: 1,
    });
    const distances = result.distances;
    if (!distances || distances.length === 0 || distances[0].length === 0) {
      throw new Error('the vector query returned no distances');
    }
    const distance = distances[0][0];
    if (typeof distance !== 'number') {
      throw new Error('the vector query returned an empty distance');
    }
    const similarity = 1 - distance;
    return Math.min(Math.max(similarity, 0), 1);
  }
}

function makeChromaClient(chromaUrl: string): ChromaClient {
  const parsed = new URL(chromaUrl);
  const port = parsed.port.length > 0 ? Number(parsed.port) : 8000;
  return new ChromaClient({
    host: parsed.hostname,
    port,
    ssl: parsed.protocol === 'https:',
  });
}

function describeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'unknown error';
}
