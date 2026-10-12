import type { SessionWarning } from '../../types';

interface WarningsStripProps {
  warnings: SessionWarning[];
}

export function WarningsStrip({ warnings }: WarningsStripProps) {
  if (warnings.length === 0) {
    return null;
  }

  return (
    <div className="warnings-strip" role="status">
      <p className="warnings-strip__title">Notes from the agent</p>
      <ul className="warnings-strip__list">
        {warnings.map((warning) => (
          <li key={`${warning.code}-${warning.message}`} className="warnings-strip__item">
            {warning.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
