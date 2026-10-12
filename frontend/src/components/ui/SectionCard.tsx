import { useState } from 'react';
import type { ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  /** Start collapsed. Panels that are not the main workspace default to false. */
  defaultOpen?: boolean;
}

export function SectionCard({ title, children, actions, defaultOpen = true }: SectionCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleToggle = () => {
    setIsOpen((current) => !current);
  };

  return (
    <section className={`section-card${isOpen ? '' : ' section-card--collapsed'}`}>
      <header className="section-card__header">
        <button
          type="button"
          className="section-card__toggle"
          aria-expanded={isOpen}
          onClick={handleToggle}
        >
          <span className="section-card__chevron" aria-hidden="true">
            {isOpen ? '▾' : '▸'}
          </span>
          <span className="section-card__title">{title}</span>
        </button>
        {actions ? <div className="section-card__actions">{actions}</div> : null}
      </header>
      {isOpen ? <div className="section-card__body">{children}</div> : null}
    </section>
  );
}
