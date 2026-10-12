import { useState } from 'react';
import { FormButton, FormSelectInput } from '../../components/ui';
import { useExport } from '../../hooks';
import type { ExportFormat } from '../../types';

interface ExportRowProps {
  sessionId: string | null;
}

const FORMAT_OPTIONS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'docx', label: 'DOCX' },
];

export function ExportRow({ sessionId }: ExportRowProps) {
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const { isExporting, exportError, exportResume } = useExport({ sessionId });

  const handleFormatChange = (value: string) => {
    setFormat(value === 'docx' ? 'docx' : 'pdf');
  };

  const handleDownload = () => {
    void exportResume(format);
  };

  return (
    <div className="export-controls">
      <FormSelectInput
        id="export-format"
        label="Download format"
        hideLabel
        value={format}
        options={FORMAT_OPTIONS}
        onChange={handleFormatChange}
      />
      <FormButton
        label={isExporting ? 'Preparing…' : 'Download'}
        onClick={handleDownload}
        disabled={isExporting || sessionId === null}
      />
      {exportError ? (
        <p className="inline-error export-controls__error" role="alert">
          {exportError}
        </p>
      ) : null}
    </div>
  );
}
