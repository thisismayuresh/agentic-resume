import { FormButton, SectionCard } from '../../components/ui';
import { useRoast } from '../../hooks';
import type { ResumeOp } from '../../types';
import { RoastReportView } from './RoastReportView';

interface RoastPanelProps {
  sessionId: string | null;
  selectedPath: string | null;
  applyOps: (ops: ResumeOp[]) => Promise<void>;
}

export function RoastPanel({ sessionId, selectedPath, applyOps }: RoastPanelProps) {
  const { roastReport, isRoasting, roastError, runRoast } = useRoast({ sessionId });

  const handleRun = () => {
    void runRoast();
  };

  return (
    <SectionCard title="Options">
      <FormButton
        label={isRoasting ? 'Roasting…' : 'Resume Roast'}
        onClick={handleRun}
        disabled={isRoasting || sessionId === null}
      />
      <p className="muted-note">
        A tough-love review of the current resume. It never edits the resume on its own.
      </p>
      {roastError ? (
        <p className="inline-error" role="alert">
          {roastError}
        </p>
      ) : null}
      {roastReport !== null ? (
        <RoastReportView report={roastReport} selectedPath={selectedPath} applyOps={applyOps} />
      ) : null}
    </SectionCard>
  );
}
