import { useCallback, useState } from 'react';
import { apiPaths } from '../constants/api';
import { friendlyMessage } from '../lib/errorMessages';
import { downloadFile } from '../lib/http';
import type { ExportFormat } from '../types';

interface UseExportOptions {
  sessionId: string | null;
}

interface UseExportResult {
  isExporting: boolean;
  exportError: string | null;
  exportResume: (format: ExportFormat) => Promise<void>;
}

export function useExport({ sessionId }: UseExportOptions): UseExportResult {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const exportResume = useCallback(
    async (format: ExportFormat) => {
      if (sessionId === null) {
        return;
      }
      setIsExporting(true);
      setExportError(null);
      try {
        await downloadFile(apiPaths.exportResume(sessionId, format), `resume.${format}`);
      } catch (error) {
        setExportError(friendlyMessage(error));
      } finally {
        setIsExporting(false);
      }
    },
    [sessionId],
  );

  return {
    isExporting,
    exportError,
    exportResume,
  };
}
