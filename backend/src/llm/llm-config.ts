export interface LlmConfig {
  /**
   * OpenAI-compatible base URL. Defaults to the local Ollama docker service.
   * To move to OpenAI (or any other provider), change OPENAI_BASE_URL and
   * OPENAI_API_KEY in .env - no code change needed.
   */
  baseUrl: string;
  apiKey: string;
  chatModel: string;
  embedModel: string;
}

export function readLlmConfig(): LlmConfig {
  const baseUrl = process.env.OPENAI_BASE_URL ?? 'http://localhost:11434/v1';

  return {
    baseUrl: baseUrl.replace(/\/$/, ''),
    apiKey: process.env.OPENAI_API_KEY ?? 'local-ollama',
    chatModel: process.env.CHAT_MODEL ?? 'llama3.1',
    embedModel: process.env.EMBED_MODEL ?? 'nomic-embed-text',
  };
}
