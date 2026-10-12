import { useCallback, useState } from 'react';
import { apiPaths } from '../constants/api';
import { isSupportedUpload } from '../constants/upload';
import { friendlyMessage } from '../lib/errorMessages';
import { uploadDocument } from '../lib/http';
import type { DocumentKind, UploadResult, UploadSlotState } from '../types';

interface UseUploadOptions {
  sessionId: string | null;
  onUploaded: () => void;
}

interface UseUploadResult {
  resumeSlot: UploadSlotState | null;
  jobSlot: UploadSlotState | null;
  isUploading: boolean;
  resumeError: string | null;
  jobError: string | null;
  uploadFile: (file: File, kind: DocumentKind) => Promise<void>;
  removeSlot: (kind: DocumentKind) => void;
}

const UNSUPPORTED_FILE = 'Unsupported file type. Use a .pdf, .doc, or .docx file.';

export function useUpload({ sessionId, onUploaded }: UseUploadOptions): UseUploadResult {
  const [resumeSlot, setResumeSlot] = useState<UploadSlotState | null>(null);
  const [jobSlot, setJobSlot] = useState<UploadSlotState | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [jobError, setJobError] = useState<string | null>(null);

  const setErrorFor = useCallback((kind: DocumentKind, message: string | null) => {
    if (kind === 'resume') {
      setResumeError(message);
      return;
    }
    setJobError(message);
  }, []);

  const setSlotFor = useCallback((kind: DocumentKind, result: UploadResult) => {
    const slot = { filename: result.filename, text: result.text };
    if (kind === 'resume') {
      setResumeSlot(slot);
      return;
    }
    setJobSlot(slot);
  }, []);

  const uploadFile = useCallback(
    async (file: File, kind: DocumentKind) => {
      if (sessionId === null) {
        return;
      }
      setErrorFor(kind, null);
      if (!isSupportedUpload(file.name)) {
        setErrorFor(kind, UNSUPPORTED_FILE);
        return;
      }
      setIsUploading(true);
      try {
        const result = await uploadDocument<UploadResult>(apiPaths.upload(sessionId), file, kind);
        setSlotFor(kind, result);
        onUploaded();
      } catch (error) {
        setErrorFor(kind, friendlyMessage(error));
      } finally {
        setIsUploading(false);
      }
    },
    [sessionId, onUploaded, setErrorFor, setSlotFor],
  );

  const removeSlot = useCallback(
    (kind: DocumentKind) => {
      setErrorFor(kind, null);
      if (kind === 'resume') {
        setResumeSlot(null);
        return;
      }
      setJobSlot(null);
    },
    [setErrorFor],
  );

  return {
    resumeSlot,
    jobSlot,
    isUploading,
    resumeError,
    jobError,
    uploadFile,
    removeSlot,
  };
}
