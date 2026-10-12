import type { ResumeOp, RoastReport } from '../../types';
import { RoastFixList } from './RoastFixList';
import { SeverityBadge } from './SeverityBadge';

interface RoastReportViewProps {
  report: RoastReport;
  selectedPath: string | null;
  applyOps: (ops: ResumeOp[]) => Promise<void>;
}

export function RoastReportView({ report, selectedPath, applyOps }: RoastReportViewProps) {
  return (
    <div className="roast-report">
      <section className="roast-report__rating">
        <p className="roast-report__score">{report.rating}/10</p>
        <p className="roast-report__verdict">{report.verdict}</p>
      </section>

      <section className="roast-report__section">
        <h3 className="roast-report__heading">Red flags</h3>
        {report.redFlags.length === 0 ? (
          <p className="muted-note">None.</p>
        ) : (
          <ul className="roast-report__flags">
            {report.redFlags.map((flag) => (
              <li key={flag.title} className="red-flag">
                <div className="red-flag__head">
                  <span className="red-flag__title">{flag.title}</span>
                  <SeverityBadge severity={flag.severity} />
                </div>
                <p className="red-flag__why">{flag.why}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <StringListSection heading="Critical flaws" items={report.criticalFlaws} />
      <StringListSection heading="What already works" items={report.strengths} />

      <section className="roast-report__section">
        <h3 className="roast-report__heading">Fix list</h3>
        <p className="muted-note">
          Select a block in the preview, then apply a rewrite one fix at a time.
        </p>
        <RoastFixList fixes={report.fixes} selectedPath={selectedPath} applyOps={applyOps} />
      </section>
    </div>
  );
}

interface StringListSectionProps {
  heading: string;
  items: string[];
}

function StringListSection({ heading, items }: StringListSectionProps) {
  return (
    <section className="roast-report__section">
      <h3 className="roast-report__heading">{heading}</h3>
      {items.length === 0 ? (
        <p className="muted-note">None.</p>
      ) : (
        <ul className="roast-report__list">
          {items.map((item) => (
            <li key={item} className="roast-report__list-item">
              {item}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
