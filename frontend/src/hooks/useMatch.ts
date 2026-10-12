import { useCallback, useState } from 'react';
import { apiPaths } from '../constants/api';
import { friendlyMessage } from '../lib/errorMessages';
import { request } from '../lib/http';
import type { MatchReport } from '../types';

interface UseMatchOptions {
  sessionId: string | null;
}

interface UseMatchResult {
  matchReport: MatchReport | null;
  isMatching: boolean;
  matchError: string | null;
  runMatch: (jobDescription: string) => Promise<void>;
}

export function useMatch({ sessionId }: UseMatchOptions): UseMatchResult {
  const [matchReport, setMatchReport] = useState<MatchReport | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);

  const runMatch = useCallback(
    async (jobDescription: string) => {
      if (sessionId === null || jobDescription.trim() === '') {
        return;
      }
      setIsMatching(true);
      setMatchError(null);
      try {
        const report = await request<MatchReport>(apiPaths.match(sessionId), {
          method: 'POST',
          body: { jobDescription },
        });
        setMatchReport(report);
      } catch (error) {
        setMatchError(friendlyMessage(error));
      } finally {
        setIsMatching(false);
      }
    },
    [sessionId],
  );

  return {
    matchReport,
    isMatching,
    matchError,
    runMatch,
  };
}
