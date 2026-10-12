const TEXT_KEY = '"text"';
const OPS_KEY = '"ops"';

function unescapeJsonString(raw: string): string {
  let out = '';
  for (let index = 0; index < raw.length; index += 1) {
    const char = raw[index];
    if (char !== '\\') {
      out += char;
      continue;
    }
    const next = raw[index + 1];
    if (next === undefined) {
      continue;
    }
    switch (next) {
      case 'b':
        out += '\b';
        index += 1;
        break;
      case 'f':
        out += '\f';
        index += 1;
        break;
      case 'n':
        out += '\n';
        index += 1;
        break;
      case 'r':
        out += '\r';
        index += 1;
        break;
      case 't':
        out += '\t';
        index += 1;
        break;
      case 'u': {
        const hex = raw.slice(index + 2, index + 6);
        if (hex.length < 4) {
          return out;
        }
        if (/^[0-9a-fA-F]{4}$/.test(hex)) {
          out += String.fromCharCode(Number.parseInt(hex, 16));
          index += 5;
        } else {
          out += 'u';
          index += 1;
        }
        break;
      }
      default:
        out += next;
        index += 1;
        break;
    }
  }
  return out;
}

export class AssistantTextExtractor {
  private valueStart = -1;
  private valueEnd = -1;
  private emittedLength = 0;

  push(buffer: string): string | null {
    if (this.valueStart === -1) {
      this.locateStart(buffer);
    }
    if (this.valueStart === -1) {
      return null;
    }
    if (this.valueEnd === -1) {
      this.locateEnd(buffer);
    }

    const sliceEnd = this.valueEnd === -1 ? buffer.length : this.valueEnd;
    if (sliceEnd <= this.valueStart) {
      return null;
    }

    const rawValue = buffer.slice(this.valueStart, sliceEnd);
    const text = unescapeJsonString(rawValue);

    if (text.length <= this.emittedLength) {
      return null;
    }
    const delta = text.slice(this.emittedLength);
    this.emittedLength = text.length;
    return delta;
  }

  private locateStart(buffer: string): void {
    const keyIndex = buffer.indexOf(TEXT_KEY);
    if (keyIndex === -1) {
      return;
    }
    const opsIndex = buffer.indexOf(OPS_KEY);
    if (opsIndex !== -1 && keyIndex > opsIndex) {
      return;
    }

    let cursor = keyIndex + TEXT_KEY.length;
    while (cursor < buffer.length && /\s/.test(buffer[cursor])) {
      cursor += 1;
    }
    if (buffer[cursor] !== ':') {
      return;
    }
    cursor += 1;
    while (cursor < buffer.length && /\s/.test(buffer[cursor])) {
      cursor += 1;
    }
    if (buffer[cursor] !== '"') {
      return;
    }
    this.valueStart = cursor + 1;
  }

  private locateEnd(buffer: string): void {
    for (let index = this.valueStart; index < buffer.length; index += 1) {
      const char = buffer[index];
      if (char === '\\') {
        index += 1;
        continue;
      }
      if (char === '"') {
        this.valueEnd = index;
        return;
      }
    }
  }
}
