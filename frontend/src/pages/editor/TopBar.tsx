import { FormButton } from '../../components/ui';
import { useTheme } from '../../hooks';
import { ExportRow } from './ExportRow';

interface TopBarProps {
  sessionId: string | null;
}

export function TopBar({ sessionId }: TopBarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="topbar">
      <p className="topbar__brand">Resume Agent</p>
      <div className="topbar__actions">
        <FormButton
          label={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          variant="quiet"
          onClick={toggleTheme}
        />
        <ExportRow sessionId={sessionId} />
      </div>
    </header>
  );
}
