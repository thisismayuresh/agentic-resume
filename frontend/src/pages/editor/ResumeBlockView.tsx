import type { MouseEvent, ReactNode } from 'react';
import type { ResumeBlock } from '../../types';

interface ResumeBlockViewProps {
  block: ResumeBlock;
  path: string;
  isSelected: boolean;
  isChanged: boolean;
  onSelect: (path: string) => void;
}

export function ResumeBlockView({
  block,
  path,
  isSelected,
  isChanged,
  onSelect,
}: ResumeBlockViewProps) {
  const classNames = ['resume-block'];
  if (isSelected) {
    classNames.push('resume-block--selected');
  }
  if (isChanged) {
    classNames.push('resume-block--changed');
  }
  if (block.style?.bold) {
    classNames.push('resume-block--bold');
  }
  if (block.style?.italic) {
    classNames.push('resume-block--italic');
  }

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    onSelect(path);
  };

  const content = blockContent(block);

  return (
    <div
      className={classNames.join(' ')}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(path);
        }
      }}
    >
      {isChanged ? (
        <span className="resume-block__sparkles" aria-hidden="true">
          <span className="resume-block__star">✦</span>
          <span className="resume-block__star">✦</span>
          <span className="resume-block__star">✦</span>
        </span>
      ) : null}
      {content}
    </div>
  );
}

function blockContent(block: ResumeBlock): ReactNode {
  if (block.type === 'heading') {
    return <h4 className="resume-block__heading">{block.text ?? ''}</h4>;
  }
  if (block.type === 'bulletList') {
    const bullets = block.bullets ?? [];
    return (
      <ul className="resume-block__bullets">
        {bullets.map((bullet, index) => (
          <li key={`${index}-${bullet.slice(0, 24)}`}>{bullet}</li>
        ))}
      </ul>
    );
  }
  if (block.type === 'entry') {
    return entryContent(block);
  }
  return <p className="resume-block__text">{block.text ?? ''}</p>;
}

function entryContent(block: ResumeBlock): ReactNode {
  const meta = block.meta;
  const details = [meta?.role, meta?.company].filter((part) => part !== undefined && part !== '');
  const dates = [meta?.start, meta?.end].filter((part) => part !== undefined && part !== '');
  return (
    <div className="resume-entry">
      <div className="resume-entry__head">
        <span className="resume-entry__details">{details.join(' — ')}</span>
        <span className="resume-entry__dates">{dates.join(' – ')}</span>
      </div>
      {block.text !== undefined && block.text !== '' ? (
        <p className="resume-block__text">{block.text}</p>
      ) : null}
      <ul className="resume-block__bullets">
        {(block.bullets ?? []).map((bullet, index) => (
          <li key={`${index}-${bullet.slice(0, 24)}`}>{bullet}</li>
        ))}
      </ul>
    </div>
  );
}
