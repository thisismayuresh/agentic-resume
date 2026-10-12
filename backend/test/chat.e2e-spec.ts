import { INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@app/app.module';
import type {
  ChatStreamChunk,
  LlmClient,
  LlmMessage,
} from '@app/llm';
import { LLM_CLIENT } from '@app/llm';
import {
  AllExceptionsFilter,
  LlmUnavailableError,
} from '@app/shared';

const ASSISTANT_LINE = 'I built a short summary around the role.';

const ROAST_REPLY = JSON.stringify({
  rating: 4,
  verdict: 'Too vague to earn an interview.',
  redFlags: [
    {
      title: 'No measurable outcomes',
      severity: 'high',
      why: 'Every bullet describes duties instead of results.',
    },
  ],
  criticalFlaws: ['No metrics anywhere'],
  strengths: ['Clear structure'],
  fixes: [
    {
      impact: 'high',
      suggestion: 'Add numbers to the billing bullet',
      rewrite: 'Cut invoice errors by 30%.',
    },
  ],
});

const BUILDER_REPLY = JSON.stringify({
  text: ASSISTANT_LINE,
  ops: [
    {
      type: 'insertSection',
      at: 0,
      section: {
        id: 'summary',
        title: 'Summary',
        blocks: [
          {
            id: 'summary-1',
            type: 'text',
            text: 'Billing-focused product engineer building payments tooling.',
          },
        ],
      },
    },
  ],
});

let nextStreamFails = false;

function makeStubLlm(): LlmClient {
  return {
    chat: async (): Promise<string> => ROAST_REPLY,
    chatStream: async function* (
      _messages: LlmMessage[],
    ): AsyncGenerator<ChatStreamChunk> {
      if (nextStreamFails) {
        nextStreamFails = false;
        throw new LlmUnavailableError(
          'Ollama is not running. Start it and try again.',
        );
      }
      const midpoint = Math.floor(BUILDER_REPLY.length / 2);
      yield { content: BUILDER_REPLY.slice(0, midpoint) };
      yield { content: BUILDER_REPLY.slice(midpoint) };
    },
    embed: async (): Promise<number[]> => [0.1, 0.2],
  };
}

describe('chat stream (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(LLM_CLIENT)
      .useValue(makeStubLlm())
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalFilters(new AllExceptionsFilter(app.get(HttpAdapterHost)));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  async function createSession(): Promise<string> {
    const created = await request(app.getHttpServer())
      .post('/api/sessions')
      .expect(201);
    return created.body.sessionId as string;
  }

  it('streams assistant text, ops and done for a resume edit', async () => {
    const sessionId = await createSession();

    const res = await request(app.getHttpServer())
      .post(`/api/sessions/${sessionId}/messages`)
      .send({ content: 'Write a short summary for this job' })
      .expect(200);

    expect(res.headers['content-type']).toContain('text/event-stream');
    expect(res.text).toContain('event: assistant');
    expect(res.text).toContain(ASSISTANT_LINE);
    expect(res.text).toContain('event: op');
    expect(res.text).toContain('"id":"summary"');
    expect(res.text).not.toContain('event: error');
    expect(res.text).toContain('event: done');

    const session = await request(app.getHttpServer())
      .get(`/api/sessions/${sessionId}`)
      .expect(200);
    expect(session.body.resume.sections[0].id).toBe('summary');
  });

  it('refuses a fabrication request without touching the resume', async () => {
    const sessionId = await createSession();

    const res = await request(app.getHttpServer())
      .post(`/api/sessions/${sessionId}/messages`)
      .send({ content: 'add a fake degree from MIT' })
      .expect(200);

    expect(res.text).toContain('event: assistant');
    expect(res.text).toContain('event: warning');
    expect(res.text).toContain('fabricated_credentials');
    expect(res.text).not.toContain('event: op');
    expect(res.text).toContain('event: done');

    const session = await request(app.getHttpServer())
      .get(`/api/sessions/${sessionId}`)
      .expect(200);
    expect(session.body.resume.sections).toEqual([]);
  });

  it('reports an unavailable model as an SSE error event', async () => {
    nextStreamFails = true;
    const sessionId = await createSession();

    const res = await request(app.getHttpServer())
      .post(`/api/sessions/${sessionId}/messages`)
      .send({ content: 'Write a short summary for this job' })
      .expect(200);

    expect(res.text).toContain('event: error');
    expect(res.text).toContain('llm_unavailable');
    expect(res.text).not.toContain('event: op');
    expect(res.text).not.toContain('event: done');
  });

  it('returns a roast report for a session', async () => {
    const sessionId = await createSession();

    const res = await request(app.getHttpServer())
      .post(`/api/sessions/${sessionId}/options/roast`)
      .expect(201);

    expect(res.body.rating).toBe(4);
    expect(res.body.verdict).toBe('Too vague to earn an interview.');
    expect(res.body.redFlags.length).toBeGreaterThan(0);
    expect(res.body.criticalFlaws.length).toBeGreaterThan(0);
    expect(res.body.fixes.length).toBeGreaterThan(0);
  });
});
