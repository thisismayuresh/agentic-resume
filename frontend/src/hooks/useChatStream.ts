import { useCallback, useEffect, useRef, useState } from 'react';
import { apiPaths } from '../constants/api';
import { friendlyMessage } from '../lib/errorMessages';
import { ApiError, streamRequest } from '../lib/http';
import type { ChatMessage, ResumeOp, SessionWarning } from '../types';

interface UseChatStreamOptions {
  sessionId: string | null;
  onOp: (op: ResumeOp) => void;
  onWarning: (warning: SessionWarning) => void;
}

interface UseChatStreamResult {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamError: string | null;
  sendMessage: (content: string) => Promise<void>;
  stopStream: () => void;
}

let messageCounter = 0;

function nextMessageId(): string {
  messageCounter += 1;
  return `message-${messageCounter}`;
}

function parseJson(data: string): unknown | null {
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function textChunkFrom(data: string): string {
  const payload = parseJson(data);
  if (typeof payload !== 'object' || payload === null) {
    return '';
  }
  const chunk = payload as { text?: unknown };
  return typeof chunk.text === 'string' ? chunk.text : '';
}

function warningFrom(data: string): SessionWarning | null {
  const payload = parseJson(data);
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }
  const warning = payload as { code?: unknown; message?: unknown };
  const code = typeof warning.code === 'string' ? warning.code : 'warning';
  const message = typeof warning.message === 'string' ? warning.message : '';
  if (message === '') {
    return null;
  }
  return { code, message };
}

function opFrom(data: string): ResumeOp | null {
  const payload = parseJson(data);
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }
  return payload as ResumeOp;
}

function errorDetailsFrom(data: string): { code: string; message: string } {
  const payload = parseJson(data);
  if (typeof payload !== 'object' || payload === null) {
    return { code: 'stream_failed', message: '' };
  }
  const details = payload as { code?: unknown; message?: unknown };
  const code = typeof details.code === 'string' ? details.code : 'stream_failed';
  const message = typeof details.message === 'string' ? details.message : '';
  return { code, message };
}

export function useChatStream({
  sessionId,
  onOp,
  onWarning,
}: UseChatStreamOptions): UseChatStreamResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const appendAssistantText = useCallback((assistantId: string, text: string) => {
    if (text === '') {
      return;
    }
    setMessages((current) =>
      current.map((message) =>
        message.id === assistantId ? { ...message, text: message.text + text } : message,
      ),
    );
  }, []);

  const handleEvent = useCallback(
    (name: string, data: string, assistantId: string) => {
      if (name === 'op') {
        const op = opFrom(data);
        if (op !== null) {
          onOp(op);
        }
        return;
      }
      if (name === 'assistant') {
        appendAssistantText(assistantId, textChunkFrom(data));
        return;
      }
      if (name === 'warning') {
        const warning = warningFrom(data);
        if (warning !== null) {
          onWarning(warning);
        }
        return;
      }
      if (name === 'error') {
        const details = errorDetailsFrom(data);
        setStreamError(friendlyMessage(new ApiError(details.code, details.message)));
      }
    },
    [appendAssistantText, onOp, onWarning],
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (sessionId === null) {
        return;
      }
      const trimmed = content.trim();
      if (trimmed === '' || controllerRef.current !== null) {
        return;
      }
      const assistantId = nextMessageId();
      setStreamError(null);
      setMessages((current) => [
        ...current,
        { id: nextMessageId(), role: 'user', text: trimmed },
        { id: assistantId, role: 'assistant', text: '' },
      ]);
      setIsStreaming(true);
      const controller = new AbortController();
      controllerRef.current = controller;
      try {
        await streamRequest(apiPaths.messages(sessionId), {
          signal: controller.signal,
          body: { content: trimmed },
          onEvent: (name, data) => handleEvent(name, data, assistantId),
        });
      } catch (error) {
        if (!controller.signal.aborted) {
          setStreamError(friendlyMessage(error));
        }
      } finally {
        controllerRef.current = null;
        setIsStreaming(false);
        setMessages((current) =>
          current.filter((message) => message.role !== 'assistant' || message.text !== ''),
        );
      }
    },
    [sessionId, handleEvent],
  );

  const stopStream = useCallback(() => {
    if (controllerRef.current !== null) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      const controller = controllerRef.current;
      if (controller !== null) {
        controller.abort();
      }
    };
  }, []);

  return {
    messages,
    isStreaming,
    streamError,
    sendMessage,
    stopStream,
  };
}
