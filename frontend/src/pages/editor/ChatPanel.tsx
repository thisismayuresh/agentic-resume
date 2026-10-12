import { useState } from 'react';
import { SectionCard } from '../../components/ui';
import { useChatStream } from '../../hooks';
import type { ResumeOp, SessionWarning } from '../../types';
import { ChatComposer } from './ChatComposer';
import { ChatMessageList } from './ChatMessageList';

interface ChatPanelProps {
  sessionId: string | null;
  onOp: (op: ResumeOp) => void;
  onWarning: (warning: SessionWarning) => void;
}

export function ChatPanel({ sessionId, onOp, onWarning }: ChatPanelProps) {
  const [draft, setDraft] = useState('');
  const { messages, isStreaming, streamError, sendMessage, stopStream } = useChatStream({
    sessionId,
    onOp,
    onWarning,
  });

  const handleSend = () => {
    const content = draft.trim();
    if (content === '') {
      return;
    }
    setDraft('');
    void sendMessage(content);
  };

  return (
    <SectionCard title="Build your resume">
      <ChatMessageList messages={messages} />
      {streamError ? (
        <p className="inline-error" role="alert">
          {streamError}
        </p>
      ) : null}
      <ChatComposer
        isStreaming={isStreaming}
        isDisabled={sessionId === null}
        draft={draft}
        onDraftChange={setDraft}
        onSend={handleSend}
        onStop={stopStream}
      />
    </SectionCard>
  );
}
