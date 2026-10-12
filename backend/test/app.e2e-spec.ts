import { INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@app/app.module';
import { AllExceptionsFilter } from '@app/shared';

describe('API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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

  it('serves the health check at /api/health', async () => {
    await request(app.getHttpServer())
      .get('/api/health')
      .expect(200, { status: 'ok' });
  });

  it('creates a session and reads it back', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/sessions')
      .expect(201);
    expect(typeof created.body.sessionId).toBe('string');

    const fetched = await request(app.getHttpServer())
      .get(`/api/sessions/${created.body.sessionId}`)
      .expect(200);
    expect(fetched.body.sessionId).toBe(created.body.sessionId);
    expect(fetched.body.resume).toBeDefined();
    expect(fetched.body.warnings).toEqual([]);
    expect(fetched.body.jobDescription).toBeNull();
  });

  it('answers with session_not_found for an unknown session', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/sessions/does-not-exist')
      .expect(404);
    expect(res.body.code).toBe('session_not_found');
    expect(res.body.statusCode).toBe(404);
  });

  it('404s before opening an SSE stream for an unknown session', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/sessions/does-not-exist/messages')
      .send({ content: 'hello' })
      .expect(404);
    expect(res.body.code).toBe('session_not_found');
  });

  it('rejects a message body that is missing content', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/sessions')
      .expect(201);
    const res = await request(app.getHttpServer())
      .post(`/api/sessions/${created.body.sessionId}/messages`)
      .send({})
      .expect(400);
    expect(res.body.statusCode).toBe(400);
  });
});
