import type { MatchReport } from '../../types';

interface MatchReportViewProps {
  report: MatchReport;
}

export function MatchReportView({ report }: MatchReportViewProps) {
  return (
    <div className="match-report">
      <p className="match-report__score">{report.percentage}% match</p>
      <p className="match-report__verdict">{report.verdict}</p>
      <SkillList title="Matched skills" skills={report.matchedSkills} modifier="matched" />
      <SkillList title="Missing skills" skills={report.missingSkills} modifier="missing" />
      {report.fitWarning !== null ? (
        <p className="fit-warning" role="note">
          {report.fitWarning}
        </p>
      ) : null}
    </div>
  );
}

interface SkillListProps {
  title: string;
  skills: string[];
  modifier: 'matched' | 'missing';
}

function SkillList({ title, skills, modifier }: SkillListProps) {
  return (
    <div className={`skill-list skill-list--${modifier}`}>
      <h3 className="skill-list__title">{title}</h3>
      {skills.length === 0 ? (
        <p className="skill-list__empty">None listed.</p>
      ) : (
        <ul className="skill-list__items">
          {skills.map((skill) => (
            <li key={skill} className="skill-chip">
              {skill}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
