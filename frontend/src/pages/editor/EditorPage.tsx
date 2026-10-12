import { useState } from 'react';
import { FormButton } from '../../components/ui';
import { useSession } from '../../hooks';
import { AuthButtons } from './AuthButtons';
import { ChatPanel } from './ChatPanel';
import { ExportRow } from './ExportRow';
import { MatchPanel } from './MatchPanel';
import { ResumePreview } from './ResumePreview';
import { RoastPanel } from './RoastPanel';
import { UploadPanel } from './UploadPanel';
import { WarningsStrip } from './WarningsStrip';

export function EditorPage() {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const {
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
  } = useSession();

  if (bootError !== null) {
    return (
      <div className="boot-screen">
        <p className="boot-screen__message" role="alert">
          {bootError}
        </p>
        <p className="muted-note">The editor needs a session on the server before it can start.</p>
        <FormButton label="Try again" onClick={() => void startSession()} />
      </div>
    );
  }

  if (isBooting && sessionId === null) {
    return (
      <div className="boot-screen">
        <p className="boot-screen__message">Starting a new session…</p>
        <span className="working-line" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="editor">
      <div className="editor__agent">
        <AuthButtons />
        <WarningsStrip warnings={warnings} />
        <ChatPanel sessionId={sessionId} onOp={applyStreamOp} onWarning={addWarning} />
        <UploadPanel sessionId={sessionId} onUploaded={refreshSession} />
        <MatchPanel sessionId={sessionId} jobDescription={jobDescription} />
        <RoastPanel sessionId={sessionId} selectedPath={selectedPath} applyOps={applyOps} />
        <ExportRow sessionId={sessionId} />
      </div>
      <div className="editor__preview">
        <ResumePreview
          resume={resume}
          changedPaths={changedPaths}
          selectedPath={selectedPath}
          applyOps={applyOps}
          opsError={opsError}
          onSelectedPathChange={setSelectedPath}
        />
      </div>
    </div>
  );
}
