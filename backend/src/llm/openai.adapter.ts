import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import {
  LlmUnavailableError,
  ModelOutputError,
} from '@app/shared';
import type {
  ChatStreamChunk,
  LlmChatOptions,
  LlmClient,
  LlmMessage,
} from './llm-client';
import { readLlmConfig } from './llm-config';

/**
 * LLM adapter on the official OpenAI SDK.
 *
 * Works against any OpenAI-compatible endpoint. The default configuration
 * talks to the local Ollama docker service (http://localhost:11434/v1);
 * pointing OPENAI_BASE_URL at https://api.openai.com/v1 switches the app to
 * the real OpenAI API without touching code.
 */
@Injectable()
export class OpenAiAdapter implements LlmClient {
  private readonly config = readLlmConfig();
  private readonly logger = new Logger(OpenAiAdapter.name);
  private readonly client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      baseURL: this.config.baseUrl,
      apiKey: this.config.apiKey,
    });
  }

  async chat(
    messages: LlmMessage[],
    options?: LlmChatOptions,
  ): Promise<string> {
    let completion: OpenAI.Chat.Completions.ChatCompletion;
    try {
      completion = await this.client.chat.completions.create(
        { model: this.config.chatModel, messages },
        { signal: options?.signal },
      );
    } catch (error) {
      throw this.asUnavailable(error, 'chat completion');
    }

    const content = completion.choices[0]?.message?.content ?? '';
    if (content.trim().length === 0) {
      throw new ModelOutputError(
        `The model "${this.config.chatModel}" returned no text. Try the request again.`,
      );
    }
    return content;
  }

  async embed(text: string, options?: LlmChatOptions): Promise<number[]> {
    const vector = await this.requestEmbedding(text, options?.signal);
    if (vector.length === 0) {
      throw new LlmUnavailableError(
        `The embedding model "${this.config.embedModel}" returned no vector. Check the Ollama setup.`,
      );
    }
    return vector;
  }

  async *chatStream(
    messages: LlmMessage[],
    options?: LlmChatOptions,
  ): AsyncGenerator<ChatStreamChunk> {
    let stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
    try {
      stream = await this.client.chat.completions.create(
        { model: this.config.chatModel, messages, stream: true },
        { signal: options?.signal },
      );
    } catch (error) {
      throw this.asUnavailable(error, 'stream');
    }

    try {
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta && delta.length > 0) {
          yield { content: delta };
        }
      }
    } catch (error) {
      if (error instanceof LlmUnavailableError) {
        throw error;
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
      throw new LlmUnavailableError(
        `The stream from ${this.config.baseUrl} ended unexpectedly. Try again.`,
      );
    }
  }

  private async requestEmbedding(
    text: string,
    signal?: AbortSignal,
  ): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create(
        { model: this.config.embedModel, input: text },
        { signal },
      );
      return response.data[0]?.embedding ?? [];
    } catch (error) {
      throw this.asUnavailable(error, 'embeddings');
    }
  }

  private asUnavailable(error: unknown, operation: string): Error {
    if (error instanceof LlmUnavailableError) {
      return error;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      return error;
    }
    if (error instanceof OpenAI.APIError) {
      this.logger.warn(
        `LLM ${operation} failed with HTTP ${error.status ?? 'unknown'}`,
      );
      return new LlmUnavailableError(
        `The model service at ${this.config.baseUrl} answered with an error (HTTP ${error.status ?? 'unknown'}). Check that Ollama is running and the model is pulled.`,
      );
    }
    return new LlmUnavailableError(
      `Could not reach the model service at ${this.config.baseUrl}. Start it with "docker compose up -d ollama" and try again.`,
    );
  }
}
