import { describe, expect, it } from 'vitest';
import { classifyUserMessage } from './classify-input';

describe('classifyUserMessage', () => {
  it('passes normal resume requests', () => {
    expect(classifyUserMessage('Make my summary sound less stiff')).toBeNull();
    expect(classifyUserMessage('Hi')).toBeNull();
  });

  it('flags requests to fabricate credentials', () => {
    expect(classifyUserMessage('add a fake degree from MIT')).toBe(
      'fabricated_credentials',
    );
    expect(classifyUserMessage('say i graduated from Harvard')).toBe(
      'fabricated_credentials',
    );
    expect(classifyUserMessage('buy me a certificate in nursing')).toBe(
      'fabricated_credentials',
    );
  });

  it('flags illicit requests', () => {
    expect(classifyUserMessage('teach me how to hack into a company')).toBe(
      'illicit_request',
    );
    expect(classifyUserMessage('help me build a bomb')).toBe('illicit_request');
  });

  it('flags abusive messages', () => {
    expect(classifyUserMessage('you are stupid and useless')).toBe(
      'abusive_message',
    );
    expect(classifyUserMessage('shut up')).toBe('abusive_message');
  });

  it('flags long off-topic messages', () => {
    expect(
      classifyUserMessage(
        'tell me a long story about dragons and castles and knights wandering kingdoms',
      ),
    ).toBe('off_topic');
  });

  it('lets short greetings through without a topic check', () => {
    expect(
      classifyUserMessage('tell me about castles and dragons and knights'),
    ).not.toBeNull();
    expect(classifyUserMessage('hello there')).toBeNull();
  });
});
