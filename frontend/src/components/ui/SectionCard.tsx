import type { ReactNode } from 'react';

interface SectionCardProps {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function SectionCard({ title, children, actions }: SectionCardProps) {
  return (
    <section className="section-card">
      <header className="section-card__header">
        <h2 className="section-card__title">{title}</h2>
        {actions ? <div className="section-card__actions">{actions}</div> : null}
      </header>
      <div className="section-card__body">{children}</div>
    </section>
  );
}
