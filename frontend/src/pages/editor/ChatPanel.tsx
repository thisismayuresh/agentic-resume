import { useState } from 'react';
import { SectionCard } from '../../components/ui';
import { useChatStream, useQuality } from '../../hooks';
import type { ResumeOp, SessionWarning } from '../../types';
import { ChatComposer } from './ChatComposer';
import { ChatMessageList } from './ChatMessageList';
import { SuggestedPrompts } from './SuggestedPrompts';

interface ChatPanelProps {
  sessionId: string | null;
  promptTicket: number;
  onOp: (op: ResumeOp) => void;
  onWarning: (warning: SessionWarning) => void;
}

export function ChatPanel({ sessionId, promptTicket, onOp, onWarning }: ChatPanelProps) {
  const [draft, setDraft] = useState('');
  const { messages, isStreaming, streamError, sendMessage, stopStream } = useChatStream({
    sessionId,
    onOp,
    onWarning,
  });
  const { isChecking, runQualityCheck } = useQuality({ sessionId });

  const handleSend = () => {
    const content = draft.trim();
    if (content === '') {
      return;
    }
    setDraft('');
    void sendMessage(content);
  };

  const handlePrompt = (message: string) => {
    void sendMessage(message);
  };

  const handleRunQuality = () => {
    void runQualityCheck().then((report) => {
      if (report === null) {
        return;
      }
      onWarning({ code: 'quality_check', message: report.summary });
      for (const finding of report.findings) {
        onWarning({ code: finding.code, message: finding.message });
      }
    });
  };

  const hasUserMessage = messages.some((message) => message.role === 'user');

  return (
    <SectionCard title="Build your resume">
      <ChatMessageList messages={messages} />
      <SuggestedPrompts
        ticket={promptTicket}
        hasUserMessage={hasUserMessage}
        isStreaming={isStreaming}
        isChecking={isChecking}
        onChatPrompt={handlePrompt}
        onRunQuality={handleRunQuality}
      />
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
