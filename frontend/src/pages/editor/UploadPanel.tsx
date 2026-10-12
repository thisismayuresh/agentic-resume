import { SectionCard } from '../../components/ui';
import { useUpload } from '../../hooks';
import type { UploadResult } from '../../types';
import { UploadSlot } from './UploadSlot';

interface UploadPanelProps {
  sessionId: string | null;
  onUploaded: (result: UploadResult) => void;
}

export function UploadPanel({ sessionId, onUploaded }: UploadPanelProps) {
  const { resumeSlot, jobSlot, isUploading, resumeError, jobError, uploadFile, removeSlot } =
    useUpload({ sessionId, onUploaded });

  return (
    <SectionCard title="Upload">
      <UploadSlot
        kind="resume"
        title="My resume"
        slot={resumeSlot}
        isUploading={isUploading}
        errorMessage={resumeError}
        onFile={uploadFile}
        onRemove={removeSlot}
      />
      <UploadSlot
        kind="jobDescription"
        title="Job description"
        slot={jobSlot}
        isUploading={isUploading}
        errorMessage={jobError}
        onFile={uploadFile}
        onRemove={removeSlot}
      />
    </SectionCard>
  );
}
