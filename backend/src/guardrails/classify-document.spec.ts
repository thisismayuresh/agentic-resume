import { classifyDocumentText } from './classify-document';
import { DOCUMENT_TAUNTS, pickDocumentTaunt } from './refusal-copy';

describe('classifyDocumentText', () => {
  it('allows an ordinary resume', () => {
    expect(
      classifyDocumentText(
        'Jane Doe - Software Engineer. Built the billing service at Acme, 2020 to 2023. Skills: TypeScript, NestJS, PostgreSQL.',
      ),
    ).toBeNull();
  });

  it('allows a security resume that mentions malware', () => {
    expect(
      classifyDocumentText(
        'Reverse-engineered ransomware samples for the SOC. Wrote detection rules for keylogger behavior and phishing kits.',
      ),
    ).toBeNull();
  });

  it('refuses bomb-making instructions', () => {
    expect(
      classifyDocumentText('Step by step guide on how to build a bomb at home'),
    ).toBe('illicit_document');
  });

  it('refuses named explosive materials', () => {
    expect(
      classifyDocumentText('Mix urea nitrate with the other reagents listed'),
    ).toBe('illicit_document');
  });

  it('refuses CSAM content', () => {
    expect(classifyDocumentText('child porn collection')).toBe(
      'illicit_document',
    );
  });

  it('refuses a hit-man solicitation', () => {
    expect(classifyDocumentText('I want to hire a hit on my ex boss')).toBe(
      'illicit_document',
    );
  });

  it('refuses a document selling fake degrees', () => {
    expect(
      classifyDocumentText('Buy a degree online - diploma mill, cheap certificates'),
    ).toBe('fabricated_credentials');
  });

  it('refuses novelty diploma marketing', () => {
    expect(
      classifyDocumentText('Novelty diplomas and fake transcripts for sale'),
    ).toBe('fabricated_credentials');
  });

  it('allows a job description', () => {
    expect(
      classifyDocumentText(
        'Hiring a senior nurse for the night shift. Experience with patient records and medication schedules required.',
      ),
    ).toBeNull();
  });
});

describe('pickDocumentTaunt', () => {
  it('returns a non-empty taunt from the list', () => {
    const taunt = pickDocumentTaunt('illicit_document', 'malware.pdf:illicit_document');
    expect(taunt.length).toBeGreaterThan(0);
    expect(DOCUMENT_TAUNTS.illicit_document).toContain(taunt);
  });

  it('is deterministic for the same seed', () => {
    const first = pickDocumentTaunt('fabricated_credentials', 'fake.pdf:fabricated_credentials');
    const second = pickDocumentTaunt('fabricated_credentials', 'fake.pdf:fabricated_credentials');
    expect(first).toBe(second);
  });
});
