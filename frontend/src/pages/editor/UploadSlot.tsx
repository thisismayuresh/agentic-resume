import { useRef } from 'react';
import type { ChangeEvent } from 'react';
import { UPLOAD_ACCEPT } from '../../constants/upload';
import { FormButton } from '../../components/ui';
import type { DocumentKind, UploadSlotState } from '../../types';

interface UploadSlotProps {
  kind: DocumentKind;
  title: string;
  slot: UploadSlotState | null;
  isUploading: boolean;
  errorMessage: string | null;
  onFile: (file: File, kind: DocumentKind) => void;
  onRemove: (kind: DocumentKind) => void;
}

export function UploadSlot({
  kind,
  title,
  slot,
  isUploading,
  errorMessage,
  onFile,
  onRemove,
}: UploadSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePick = () => {
    if (inputRef.current !== null) {
      inputRef.current.click();
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file !== undefined) {
      onFile(file, kind);
    }
  };

  if (slot === null) {
    return (
      <div className="upload-slot">
        <p className="upload-slot__title">{title}</p>
        <input
          ref={inputRef}
          type="file"
          accept={UPLOAD_ACCEPT}
          className="visually-hidden"
          onChange={handleChange}
        />
        <FormButton
          label={isUploading ? 'Reading file…' : 'Choose file'}
          variant="secondary"
          onClick={handlePick}
          disabled={isUploading}
        />
        <p className="upload-slot__hint">
          Only the file you pick is read, and only for this session. Formats: .pdf, .doc, .docx.
        </p>
        {errorMessage ? (
          <p className="inline-error" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="upload-slot">
      <p className="upload-slot__title">{title}</p>
      <p className="upload-slot__file">
        {slot.filename} — text extracted ({slot.text.length.toLocaleString()} characters)
      </p>
      <pre className="upload-slot__extract">{slot.text}</pre>
      <div className="upload-slot__row">
        <FormButton label="Replace" variant="quiet" onClick={handlePick} disabled={isUploading} />
        <FormButton label="Remove" variant="quiet" onClick={() => onRemove(kind)} />
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={UPLOAD_ACCEPT}
        className="visually-hidden"
        onChange={handleChange}
      />
      {errorMessage ? (
        <p className="inline-error" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
