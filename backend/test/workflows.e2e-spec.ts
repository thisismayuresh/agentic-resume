import { INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Document, Packer, Paragraph } from 'docx';
import request from 'supertest';
import { AppModule } from '@app/app.module';
import { AllExceptionsFilter } from '@app/shared';

async function makeResumeDocx(): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph('Jane Doe'),
          new Paragraph('jane@example.com'),
          new Paragraph('Experience'),
          new Paragraph('Software Engineer at Acme 2020 - 2023'),
          new Paragraph('- Built the billing service'),
        ],
      },
    ],
  });
  return Packer.toBuffer(doc);
}

describe('upload, resume ops, match and export (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    delete process.env.CHROMA_URL;
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

  async function createSession(): Promise<string> {
    const created = await request(app.getHttpServer())
      .post('/api/sessions')
      .expect(201);
    return created.body.sessionId as string;
  }

  it('parses an uploaded docx into the session resume', async () => {
    const sessionId = await createSession();
    const file = await makeResumeDocx();

    const res = await request(app.getHttpServer())
      .post(`/api/sessions/${sessionId}/upload`)
      .field('kind', 'resume')
      .attach('file', file, 'resume.docx')
      .expect(201);

    expect(res.body.filename).toBe('resume.docx');
    expect(res.body.text).toContain('Jane Doe');
    expect(res.body.resume).toBeDefined();

    const session = await request(app.getHttpServer())
      .get(`/api/sessions/${sessionId}`)
      .expect(200);
    const titles = session.body.resume.sections.map(
      (section: { title: string }) => section.title,
    );
    expect(titles).toContain('Experience');
  });

  it('rejects an upload without a file', async () => {
    const sessionId = await createSession();

    const res = await request(app.getHttpServer())
      .post(`/api/sessions/${sessionId}/upload`)
      .field('kind', 'resume')
      .expect(422);

    expect(res.body.code).toBe('document_parse_failed');
  });

  it('refuses an illicit document upload with a taunt', async () => {
    const sessionId = await createSession();
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph('Totally not suspicious notes'),
            new Paragraph('Step by step guide on how to build a bomb'),
          ],
        },
      ],
    });
    const file = await Packer.toBuffer(doc);

    const res = await request(app.getHttpServer())
      .post(`/api/sessions/${sessionId}/upload`)
      .field('kind', 'resume')
      .attach('file', file, 'notes.docx')
      .expect(400);

    expect(res.body.code).toBe('guardrail_violation');
    expect(typeof res.body.message).toBe('string');
    expect(res.body.message.length).toBeGreaterThan(0);

    const session = await request(app.getHttpServer())
      .get(`/api/sessions/${sessionId}`)
      .expect(200);
    expect(session.body.resume.sections).toEqual([]);
  });

  it('applies resume ops through the ops endpoint', async () => {
    const sessionId = await createSession();

    const res = await request(app.getHttpServer())
      .post(`/api/sessions/${sessionId}/resume/ops`)
      .send({
        ops: [
          {
            type: 'insertSection',
            at: 0,
            section: { id: 'skills', title: 'Skills', blocks: [] },
          },
        ],
      })
      .expect(201);

    expect(res.body.resume.sections[0].id).toBe('skills');
  });

  it('scores a session against a job description without ChromaDB', async () => {
    const sessionId = await createSession();

    const res = await request(app.getHttpServer())
      .post(`/api/sessions/${sessionId}/match`)
      .send({
        jobDescription:
          'Senior backend engineer with Kubernetes and PostgreSQL experience, 5 years required.',
      })
      .expect(201);

    expect(typeof res.body.percentage).toBe('number');
    expect(res.body.percentage).toBeGreaterThanOrEqual(0);
    expect(res.body.percentage).toBeLessThanOrEqual(100);
    expect(res.body.missingSkills).toContain('kubernetes');
    expect(res.body.verdict.length).toBeGreaterThan(0);
    expect(res.body.fitWarning).toContain('kubernetes');

    const session = await request(app.getHttpServer())
      .get(`/api/sessions/${sessionId}`)
      .expect(200);
    const warningCodes = session.body.warnings.map(
      (warning: { code: string }) => warning.code,
    );
    expect(warningCodes).toContain('embeddings_unavailable');
    expect(warningCodes).toContain('poor_fit');
  });

  it('exports pdf and docx downloads', async () => {
    const sessionId = await createSession();
    await request(app.getHttpServer())
      .post(`/api/sessions/${sessionId}/resume/ops`)
      .send({
        ops: [
          {
            type: 'insertSection',
            at: 0,
            section: {
              id: 'summary',
              title: 'Summary',
              blocks: [
                { id: 'summary-1', type: 'text', text: 'Payments engineer.' },
              ],
            },
          },
        ],
      })
      .expect(201);

    const pdf = await request(app.getHttpServer())
      .get(`/api/sessions/${sessionId}/export?format=pdf`)
      .expect(200);
    expect(pdf.headers['content-type']).toContain('application/pdf');
    expect(pdf.headers['content-disposition']).toContain('resume.pdf');

    const docx = await request(app.getHttpServer())
      .get(`/api/sessions/${sessionId}/export?format=docx`)
      .expect(200);
    expect(docx.headers['content-type']).toContain('wordprocessingml.document');
    expect(docx.headers['content-disposition']).toContain('resume.docx');
  });

  it('404s an export for an unknown session', async () => {
    await request(app.getHttpServer())
      .get('/api/sessions/does-not-exist/export?format=pdf')
      .expect(404);
  });

  it('reads back a PDF that the export produced', async () => {
    const sessionId = await createSession();
    await request(app.getHttpServer())
      .post(`/api/sessions/${sessionId}/resume/ops`)
      .send({
        ops: [
          {
            type: 'insertSection',
            at: 0,
            section: {
              id: 'summary',
              title: 'Summary',
              blocks: [
                { id: 'summary-1', type: 'text', text: 'Payments engineer.' },
              ],
            },
          },
        ],
      })
      .expect(201);

    const download = await request(app.getHttpServer())
      .get(`/api/sessions/${sessionId}/export?format=pdf`)
      .buffer(true)
      .expect(200);
    expect(Buffer.isBuffer(download.body)).toBe(true);

    const upload = await request(app.getHttpServer())
      .post(`/api/sessions/${sessionId}/upload`)
      .field('kind', 'resume')
      .attach('file', download.body as Buffer, 'roundtrip.pdf')
      .expect(201);
    expect(upload.body.text).toContain('Payments engineer');
  });
});
