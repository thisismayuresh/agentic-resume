import type { ChangeEvent } from 'react';

interface FormTextAreaProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
}

export function FormTextArea({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  rows = 4,
}: FormTextAreaProps) {
  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className="form-field">
      <label className="form-field__label" htmlFor={id}>
        {label}
      </label>
      <textarea
        id={id}
        className="form-field__textarea"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
      />
    </div>
  );
}
