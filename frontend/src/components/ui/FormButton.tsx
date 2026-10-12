export type FormButtonVariant = 'primary' | 'secondary' | 'quiet';

interface FormButtonProps {
  label: string;
  /** Omit for static buttons that are not wired up yet. */
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: FormButtonVariant;
  disabled?: boolean;
  title?: string;
}

export function FormButton({
  label,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  title,
}: FormButtonProps) {
  return (
    <button
      type={type}
      className={`form-button form-button--${variant}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {label}
    </button>
  );
}
