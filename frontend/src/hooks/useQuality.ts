import { useCallback, useState } from 'react';
import { apiPaths } from '../constants/api';
import { friendlyMessage } from '../lib/errorMessages';
import { request } from '../lib/http';
import type { QualityReport } from '../types';

interface UseQualityOptions {
  sessionId: string | null;
}

interface UseQualityResult {
  isChecking: boolean;
  checkError: string | null;
  runQualityCheck: () => Promise<QualityReport | null>;
}

export function useQuality({ sessionId }: UseQualityOptions): UseQualityResult {
  const [isChecking, setIsChecking] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  const runQualityCheck = useCallback(async (): Promise<QualityReport | null> => {
    if (sessionId === null) {
      return null;
    }
    setIsChecking(true);
    setCheckError(null);
    try {
      return await request<QualityReport>(apiPaths.quality(sessionId), { method: 'POST' });
    } catch (error) {
      setCheckError(friendlyMessage(error));
      return null;
    } finally {
      setIsChecking(false);
    }
  }, [sessionId]);

  return { isChecking, checkError, runQualityCheck };
}
