import { useCallback, useEffect, useRef, useState } from 'react';
import { apiPaths } from '../constants/api';
import { friendlyMessage } from '../lib/errorMessages';
import { applyResumeOp, pathOfOp } from '../lib/resumeOps';
import { request } from '../lib/http';
import type {
  CreatedSession,
  ResumeDocument,
  ResumeOp,
  SessionSnapshot,
  SessionWarning,
} from '../types';

const EMPTY_RESUME: ResumeDocument = { sections: [] };
const HIGHLIGHT_MS = 1400;

interface UseSessionResult {
  sessionId: string | null;
  resume: ResumeDocument;
  jobDescription: string | null;
  warnings: SessionWarning[];
  changedPaths: string[];
  isBooting: boolean;
  bootError: string | null;
  opsError: string | null;
  startSession: () => Promise<void>;
  refreshSession: () => Promise<void>;
  applyOps: (ops: ResumeOp[]) => Promise<void>;
  applyStreamOp: (op: ResumeOp) => void;
  addWarning: (warning: SessionWarning) => void;
}

export function useSession(): UseSessionResult {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [resume, setResume] = useState<ResumeDocument>(EMPTY_RESUME);
  const [jobDescription, setJobDescription] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<SessionWarning[]>([]);
  const [changedPaths, setChangedPaths] = useState<string[]>([]);
  const [isBooting, setIsBooting] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [opsError, setOpsError] = useState<string | null>(null);
  const highlightTimers = useRef<Map<string, number>>(new Map());
  const hasStartedRef = useRef(false);

  const applySnapshot = useCallback((snapshot: SessionSnapshot) => {
    setResume(snapshot.resume);
    setJobDescription(snapshot.jobDescription);
    setWarnings(snapshot.warnings);
  }, []);

  const loadSession = useCallback(
    async (id: string) => {
      const snapshot = await request<SessionSnapshot>(apiPaths.session(id));
      applySnapshot(snapshot);
    },
    [applySnapshot],
  );

  const startSession = useCallback(async () => {
    setIsBooting(true);
    setBootError(null);
    try {
      const created = await request<CreatedSession>(apiPaths.createSession, { method: 'POST' });
      setSessionId(created.sessionId);
      await loadSession(created.sessionId);
    } catch (error) {
      setBootError(friendlyMessage(error));
    } finally {
      setIsBooting(false);
    }
  }, [loadSession]);

  const refreshSession = useCallback(async () => {
    if (sessionId === null) {
      return;
    }
    try {
      await loadSession(sessionId);
    } catch (error) {
      setOpsError(friendlyMessage(error));
    }
  }, [sessionId, loadSession]);

  const applyOps = useCallback(
    async (ops: ResumeOp[]) => {
      if (sessionId === null || ops.length === 0) {
        return;
      }
      setOpsError(null);
      try {
        const snapshot = await request<SessionSnapshot>(apiPaths.resumeOps(sessionId), {
          method: 'POST',
          body: { ops },
        });
        applySnapshot(snapshot);
      } catch (error) {
        setOpsError(friendlyMessage(error));
      }
    },
    [sessionId, applySnapshot],
  );

  const markChanged = useCallback((path: string) => {
    setChangedPaths((current) => (current.includes(path) ? current : [...current, path]));
    const previousTimer = highlightTimers.current.get(path);
    if (previousTimer !== undefined) {
      window.clearTimeout(previousTimer);
    }
    const timerId = window.setTimeout(() => {
      highlightTimers.current.delete(path);
      setChangedPaths((current) => current.filter((item) => item !== path));
    }, HIGHLIGHT_MS);
    highlightTimers.current.set(path, timerId);
  }, []);

  const applyStreamOp = useCallback(
    (op: ResumeOp) => {
      setResume((current) => applyResumeOp(current, op));
      markChanged(pathOfOp(op));
    },
    [markChanged],
  );

  const addWarning = useCallback((warning: SessionWarning) => {
    setWarnings((current) => {
      const alreadyKnown = current.some(
        (item) => item.code === warning.code && item.message === warning.message,
      );
      if (alreadyKnown) {
        return current;
      }
      return [...current, warning];
    });
  }, []);

  useEffect(() => {
    if (hasStartedRef.current) {
      return;
    }
    hasStartedRef.current = true;
    void startSession();
  }, [startSession]);

  useEffect(() => {
    const timers = highlightTimers.current;
    return () => {
      for (const timerId of timers.values()) {
        window.clearTimeout(timerId);
      }
    };
  }, []);

  return {
    sessionId,
    resume,
    jobDescription,
    warnings,
    changedPaths,
    isBooting,
    bootError,
    opsError,
    startSession,
    refreshSession,
    applyOps,
    applyStreamOp,
    addWarning,
  };
}
