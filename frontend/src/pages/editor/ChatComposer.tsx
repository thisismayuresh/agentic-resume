import type { KeyboardEvent } from 'react';
import { FormButton, FormTextInput } from '../../components/ui';

interface ChatComposerProps {
  isStreaming: boolean;
  isDisabled: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
}

export function ChatComposer({
  isStreaming,
  isDisabled,
  draft,
  onDraftChange,
  onSend,
  onStop,
}: ChatComposerProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') {
      return;
    }
    event.preventDefault();
    if (!isStreaming && !isDisabled) {
      onSend();
    }
  };

  if (isStreaming) {
    return (
      <div className="chat-composer">
        <p className="chat-composer__working">
          <span className="working-line" aria-hidden="true" />
          <span className="chat-composer__working-label">
            <span className="working-star" aria-hidden="true">
              ✦
            </span>
            Working on your resume…
          </span>
        </p>
        <FormButton label="Stop" variant="secondary" onClick={onStop} />
      </div>
    );
  }

  const sendDisabled = isDisabled || draft.trim() === '';

  return (
    <div className="chat-composer">
      <FormTextInput
        id="chat-input"
        label="Message"
        value={draft}
        onChange={onDraftChange}
        onKeyDown={handleKeyDown}
        placeholder="Describe a change, or answer the last question"
        disabled={isDisabled}
      />
      <FormButton label="Send" onClick={onSend} disabled={sendDisabled} />
    </div>
  );
}
