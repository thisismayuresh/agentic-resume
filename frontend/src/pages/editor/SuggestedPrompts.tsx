import { FormButton } from '../../components/ui';

interface SuggestedPromptsProps {
  ticket: number;
  hasUserMessage: boolean;
  isStreaming: boolean;
  isChecking: boolean;
  onChatPrompt: (message: string) => void;
  onRunQuality: () => void;
}

interface SuggestedPrompt {
  id: string;
  label: string;
  kind: 'chat' | 'quality';
  message?: string;
}

const STARTER_PROMPTS: SuggestedPrompt[] = [
  { id: 'quality', label: 'Check my resume for issues', kind: 'quality' },
  {
    id: 'one-page',
    label: 'Make it fit on one page',
    kind: 'chat',
    message: 'Make my resume fit on one page.',
  },
  {
    id: 'ats',
    label: 'Find missing ATS keywords',
    kind: 'chat',
    message: 'Compare my resume to the job description and list the missing ATS keywords.',
  },
  {
    id: 'tailor',
    label: 'Tailor my summary to the job',
    kind: 'chat',
    message: 'Rewrite my summary so it matches the job description better.',
  },
  {
    id: 'improve',
    label: 'Suggest improvements',
    kind: 'chat',
    message: 'Suggest three concrete improvements to my resume.',
  },
];

export function SuggestedPrompts({
  ticket,
  hasUserMessage,
  isStreaming,
  isChecking,
  onChatPrompt,
  onRunQuality,
}: SuggestedPromptsProps) {
  if (ticket === 0 || hasUserMessage || isStreaming || isChecking) {
    return null;
  }

  const handlePrompt = (prompt: SuggestedPrompt) => {
    if (prompt.kind === 'quality') {
      onRunQuality();
      return;
    }
    if (prompt.message !== undefined) {
      onChatPrompt(prompt.message);
    }
  };

  return (
    <div className="suggested-prompts" role="group" aria-label="Suggested next steps">
      <p className="suggested-prompts__title">What should we do next?</p>
      <div className="suggested-prompts__list">
        {STARTER_PROMPTS.map((prompt) => (
          <FormButton
            key={prompt.id}
            label={prompt.label}
            variant="secondary"
            onClick={() => handlePrompt(prompt)}
          />
        ))}
      </div>
      <p className="muted-note">Or type anything below - the agent picks it up from there.</p>
    </div>
  );
}
