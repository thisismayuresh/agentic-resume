import type { DocumentKind } from '../types';
import { readEventStream } from './sse';

export class ApiError extends Error {
  readonly code: string;
  readonly status: number | null;

  constructor(code: string, message: string, status: number | null = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
}

interface StreamHandlers {
  signal: AbortSignal;
  body: unknown;
  onEvent: (name: string, data: string) => void;
}

const NETWORK_ERROR = new ApiError('network', 'Cannot reach the server.');

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

async function readErrorBody(response: Response): Promise<ApiError> {
  const fallback = new ApiError(
    'http_error',
    `Request failed (${response.status}).`,
    response.status,
  );
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return fallback;
  }
  if (typeof payload !== 'object' || payload === null) {
    return fallback;
  }
  const body = payload as { code?: unknown; message?: unknown };
  const code = typeof body.code === 'string' ? body.code : 'http_error';
  const message = typeof body.message === 'string' ? body.message : fallback.message;
  return new ApiError(code, message, response.status);
}

async function toResult<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw await readErrorBody(response);
  }
  const text = await response.text();
  if (text.length === 0) {
    return undefined as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError('bad_response', 'The server sent an unexpected reply.');
  }
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const init: RequestInit = { method: options.method ?? 'GET' };
  if (options.body !== undefined) {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = JSON.stringify(options.body);
  }
  let response: Response;
  try {
    response = await fetch(path, init);
  } catch {
    throw NETWORK_ERROR;
  }
  return toResult<T>(response);
}

export async function uploadDocument<T>(path: string, file: File, kind: DocumentKind): Promise<T> {
  const form = new FormData();
  form.append('file', file);
  form.append('kind', kind);
  let response: Response;
  try {
    response = await fetch(path, { method: 'POST', body: form });
  } catch {
    throw NETWORK_ERROR;
  }
  return toResult<T>(response);
}

export async function streamRequest(path: string, handlers: StreamHandlers): Promise<void> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(handlers.body),
      signal: handlers.signal,
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    throw NETWORK_ERROR;
  }
  if (!response.ok) {
    throw await readErrorBody(response);
  }
  if (response.body === null) {
    throw new ApiError('stream_failed', 'The server closed the connection.');
  }
  await readEventStream(response.body, handlers.onEvent);
}

export async function downloadFile(path: string, fallbackName: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(path);
  } catch {
    throw NETWORK_ERROR;
  }
  if (!response.ok) {
    throw await readErrorBody(response);
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileNameFrom(response, fallbackName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

function fileNameFrom(response: Response, fallbackName: string): string {
  const header = response.headers.get('content-disposition');
  if (header === null) {
    return fallbackName;
  }
  const match = /filename="?([^";]+)"?/i.exec(header);
  if (match === null) {
    return fallbackName;
  }
  return match[1];
}
