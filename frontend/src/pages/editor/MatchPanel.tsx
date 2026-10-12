import { useEffect, useState } from 'react';
import { FormButton, FormTextArea, SectionCard } from '../../components/ui';
import { useMatch } from '../../hooks';
import { MatchReportView } from './MatchReportView';

interface MatchPanelProps {
  sessionId: string | null;
  jobDescription: string | null;
}

export function MatchPanel({ sessionId, jobDescription }: MatchPanelProps) {
  const [draft, setDraft] = useState('');
  const { matchReport, isMatching, matchError, runMatch } = useMatch({ sessionId });

  useEffect(() => {
    if (jobDescription !== null) {
      setDraft(jobDescription);
    }
  }, [jobDescription]);

  const handleRun = () => {
    void runMatch(draft);
  };

  return (
    <SectionCard title="Job match">
      <FormTextArea
        id="match-job-description"
        label="Job description"
        value={draft}
        onChange={setDraft}
        placeholder="Paste the job you are applying for"
        rows={4}
      />
      <FormButton
        label={isMatching ? 'Scoring…' : 'Run match'}
        onClick={handleRun}
        disabled={isMatching || draft.trim() === '' || sessionId === null}
      />
      {matchError ? (
        <p className="inline-error" role="alert">
          {matchError}
        </p>
      ) : null}
      {matchReport !== null ? <MatchReportView report={matchReport} /> : null}
    </SectionCard>
  );
}
