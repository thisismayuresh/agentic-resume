import type { Response } from 'express';
import type { ResumeOp, Warning } from '@app/resume';

export class SseEmitter {
  private closed = false;
  private assistantTextSent = false;

  constructor(private readonly res: Response) {}

  start(): void {
    this.res.status(200);
    this.res.setHeader('Content-Type', 'text/event-stream');
    this.res.setHeader('Cache-Control', 'no-cache');
    this.res.flushHeaders();
  }

  assistant(text: string): void {
    if (text.length === 0) {
      return;
    }
    this.assistantTextSent = true;
    this.send('assistant', { text });
  }

  op(op: ResumeOp): void {
    this.send('op', op);
  }

  warning(warning: Warning): void {
    this.send('warning', warning);
  }

  done(): void {
    this.send('done', {});
    this.end();
  }

  error(code: string, message: string): void {
    this.send('error', { code, message });
    this.end();
  }

  close(): void {
    this.closed = true;
  }

  hasAssistantText(): boolean {
    return this.assistantTextSent;
  }

  isClosed(): boolean {
    return this.closed || this.res.destroyed || this.res.writableEnded;
  }

  private send(event: string, data: unknown): void {
    if (this.isClosed()) {
      return;
    }
    this.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }

  private end(): void {
    this.closed = true;
    if (!this.res.writableEnded) {
      this.res.end();
    }
  }
}
