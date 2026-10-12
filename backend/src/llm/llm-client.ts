export interface LlmMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmChatOptions {
  signal?: AbortSignal;
}

export interface ChatStreamChunk {
  content: string;
}

export interface LlmClient {
  chat(messages: LlmMessage[], options?: LlmChatOptions): Promise<string>;
  chatStream(
    messages: LlmMessage[],
    options?: LlmChatOptions,
  ): AsyncGenerator<ChatStreamChunk>;
  embed(text: string, options?: LlmChatOptions): Promise<number[]>;
}

export const LLM_CLIENT = Symbol('LLM_CLIENT');
