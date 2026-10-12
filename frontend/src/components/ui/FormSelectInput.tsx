import type { ChangeEvent } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

interface FormSelectInputProps {
  id: string;
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  /** Keep the label for screen readers only (compact toolbars). */
  hideLabel?: boolean;
}

export function FormSelectInput({
  id,
  label,
  value,
  options,
  onChange,
  hideLabel = false,
}: FormSelectInputProps) {
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className={`form-field${hideLabel ? ' form-field--inline' : ''}`}>
      <label className={hideLabel ? 'visually-hidden' : 'form-field__label'} htmlFor={id}>
        {label}
      </label>
      <select id={id} className="form-field__select" value={value} onChange={handleChange}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
