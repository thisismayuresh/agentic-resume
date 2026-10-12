import { useCallback, useState } from 'react';
import { apiPaths } from '../constants/api';
import { friendlyMessage } from '../lib/errorMessages';
import { request } from '../lib/http';
import type { RoastReport } from '../types';

interface UseRoastOptions {
  sessionId: string | null;
}

interface UseRoastResult {
  roastReport: RoastReport | null;
  isRoasting: boolean;
  roastError: string | null;
  runRoast: () => Promise<void>;
}

export function useRoast({ sessionId }: UseRoastOptions): UseRoastResult {
  const [roastReport, setRoastReport] = useState<RoastReport | null>(null);
  const [isRoasting, setIsRoasting] = useState(false);
  const [roastError, setRoastError] = useState<string | null>(null);

  const runRoast = useCallback(async () => {
    if (sessionId === null) {
      return;
    }
    setIsRoasting(true);
    setRoastError(null);
    try {
      const report = await request<RoastReport>(apiPaths.roast(sessionId), { method: 'POST' });
      setRoastReport(report);
    } catch (error) {
      setRoastError(friendlyMessage(error));
    } finally {
      setIsRoasting(false);
    }
  }, [sessionId]);

  return {
    roastReport,
    isRoasting,
    roastError,
    runRoast,
  };
}
