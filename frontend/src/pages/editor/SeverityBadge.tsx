import type { Severity } from '../../types';

interface SeverityBadgeProps {
  severity: Severity;
}

const SEVERITY_LABELS: Record<Severity, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  return (
    <span className={`severity-badge severity-badge--${severity}`}>
      {SEVERITY_LABELS[severity]}
    </span>
  );
}
