import { useState } from 'react';
import { FormButton } from '../../components/ui';
import type { ResumeOp, RoastFix } from '../../types';
import { SeverityBadge } from './SeverityBadge';

interface RoastFixListProps {
  fixes: RoastFix[];
  selectedPath: string | null;
  applyOps: (ops: ResumeOp[]) => Promise<void>;
}

export function RoastFixList({ fixes, selectedPath, applyOps }: RoastFixListProps) {
  const [confirmingIndex, setConfirmingIndex] = useState<number | null>(null);

  if (fixes.length === 0) {
    return <p className="muted-note">No fixes came back this time.</p>;
  }

  return (
    <ol className="fix-list">
      {fixes.map((fix, index) => (
        <FixItem
          key={`${index}-${fix.suggestion}`}
          fix={fix}
          isConfirming={confirmingIndex === index}
          selectedPath={selectedPath}
          onApply={() => setConfirmingIndex(index)}
          onCancel={() => setConfirmingIndex(null)}
          onConfirm={() => {
            setConfirmingIndex(null);
            if (selectedPath !== null && fix.rewrite !== undefined) {
              void applyOps([{ type: 'updateText', path: selectedPath, text: fix.rewrite }]);
            }
          }}
        />
      ))}
    </ol>
  );
}

interface FixItemProps {
  fix: RoastFix;
  isConfirming: boolean;
  selectedPath: string | null;
  onApply: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}

function FixItem({ fix, isConfirming, selectedPath, onApply, onCancel, onConfirm }: FixItemProps) {
  const missingRewrite = fix.rewrite === undefined;
  const missingSelection = selectedPath === null;
  const applyDisabled = missingRewrite || missingSelection;

  if (isConfirming) {
    return (
      <li className="fix-item fix-item--confirming">
        <p className="fix-item__text">{fix.suggestion}</p>
        <p className="fix-item__confirm-question">Replace the selected block with this rewrite?</p>
        <pre className="fix-item__rewrite">{fix.rewrite}</pre>
        <div className="fix-item__actions">
          <FormButton label="Confirm replace" onClick={onConfirm} />
          <FormButton label="Cancel" variant="quiet" onClick={onCancel} />
        </div>
      </li>
    );
  }

  return (
    <li className="fix-item">
      <SeverityBadge severity={fix.impact} />
      <p className="fix-item__text">{fix.suggestion}</p>
      {fix.rewrite !== undefined ? <pre className="fix-item__rewrite">{fix.rewrite}</pre> : null}
      <FormButton
        label="Apply"
        variant="secondary"
        onClick={onApply}
        disabled={applyDisabled}
        title={applyTitle(missingRewrite, missingSelection)}
      />
    </li>
  );
}

function applyTitle(missingRewrite: boolean, missingSelection: boolean): string {
  if (missingRewrite) {
    return 'This fix is advice, not replacement text — edit the block yourself.';
  }
  if (missingSelection) {
    return 'Select a block in the preview first.';
  }
  return 'Replace the selected block with this rewrite.';
}
