import type { ChangeEvent, KeyboardEvent } from 'react';

interface FormTextInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function FormTextInput({
  id,
  label,
  value,
  onChange,
  onKeyDown,
  placeholder,
  disabled = false,
}: FormTextInputProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className="form-field">
      <label className="form-field__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="form-field__input"
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}
