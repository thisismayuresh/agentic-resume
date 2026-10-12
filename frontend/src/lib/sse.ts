export async function readEventStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (name: string, data: string) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) {
      break;
    }
    buffer += decoder.decode(chunk.value, { stream: true });
    const rawEvents = buffer.split(/\r?\n\r?\n/);
    buffer = rawEvents.pop() ?? '';
    for (const rawEvent of rawEvents) {
      dispatchEventChunk(rawEvent, onEvent);
    }
  }
  if (buffer.trim().length > 0) {
    dispatchEventChunk(buffer, onEvent);
  }
}

function dispatchEventChunk(rawEvent: string, onEvent: (name: string, data: string) => void): void {
  const lines = rawEvent.split(/\r?\n/);
  let eventName = '';
  const dataLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith(':')) {
      continue;
    }
    if (line.startsWith('event:')) {
      eventName = line.slice('event:'.length).trim();
      continue;
    }
    if (line.startsWith('data:')) {
      const value = line.slice('data:'.length);
      dataLines.push(value.startsWith(' ') ? value.slice(1) : value);
    }
  }
  const data = dataLines.join('\n');
  const name = eventName !== '' ? eventName : eventNameFromData(data);
  if (name === '') {
    return;
  }
  onEvent(name, data);
}

function eventNameFromData(data: string): string {
  try {
    const payload: unknown = JSON.parse(data);
    if (typeof payload !== 'object' || payload === null) {
      return '';
    }
    const eventLike = payload as { event?: unknown; type?: unknown };
    if (typeof eventLike.event === 'string') {
      return eventLike.event;
    }
    if (typeof eventLike.type === 'string') {
      return eventLike.type;
    }
  } catch {
    return '';
  }
  return '';
}
