import type { LlmClient, LlmMessage } from '@app/llm';
import {
  buildBuilderSystemPrompt,
  buildBuilderUserPrompt,
} from '../builder.prompt';
import { AssistantTextExtractor } from '../assistant-text-extractor';
import type {
  AssistantTextListener,
  BuildContext,
  PlanInstruction,
} from '../builder.types';

export async function draftResume(
  llm: LlmClient,
  context: BuildContext,
  plan: PlanInstruction,
  listener: AssistantTextListener,
  signal?: AbortSignal,
): Promise<string> {
  const messages: LlmMessage[] = [
    { role: 'system', content: buildBuilderSystemPrompt() },
    { role: 'user', content: buildBuilderUserPrompt(context, plan) },
  ];
  const extractor = new AssistantTextExtractor();
  let raw = '';

  for await (const chunk of llm.chatStream(messages, { signal })) {
    raw += chunk.content;
    const delta = extractor.push(raw);
    if (delta) {
      listener.onAssistantText(delta);
    }
  }

  const finalDelta = extractor.push(raw);
  if (finalDelta) {
    listener.onAssistantText(finalDelta);
  }
  return raw;
}
