import { useState } from 'react';
import { FormButton } from '../../components/ui';
import { useSession } from '../../hooks';
import type { UploadResult } from '../../types';
// TODO(auth): static Google / email buttons stay hidden until real auth lands.
// import { AuthButtons } from './AuthButtons';
import { ChatPanel } from './ChatPanel';
import { MatchPanel } from './MatchPanel';
import { ResumePreview } from './ResumePreview';
import { RoastPanel } from './RoastPanel';
import { TopBar } from './TopBar';
import { UploadPanel } from './UploadPanel';
import { WarningsStrip } from './WarningsStrip';

export function EditorPage() {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [promptTicket, setPromptTicket] = useState(0);
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

  const handleUploaded = (result: UploadResult) => {
    refreshSession();
    setPromptTicket((ticket) => ticket + 1);
    if (result.findings !== undefined && result.findings.length > 0) {
      if (result.qualitySummary !== undefined) {
        addWarning({ code: 'quality_check', message: result.qualitySummary });
      }
      for (const finding of result.findings) {
        addWarning({ code: finding.code, message: finding.message });
      }
    }
  };

  if (bootError !== null) {
    return (
      <>
        <TopBar sessionId={null} />
        <div className="boot-screen">
          <p className="boot-screen__message" role="alert">
            {bootError}
          </p>
          <p className="muted-note">
            The editor needs a session on the server before it can start.
          </p>
          <FormButton label="Try again" onClick={() => void startSession()} />
        </div>
      </>
    );
  }

  if (isBooting && sessionId === null) {
    return (
      <>
        <TopBar sessionId={null} />
        <div className="boot-screen">
          <p className="boot-screen__message">Starting a new session…</p>
          <span className="working-line" aria-hidden="true" />
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar sessionId={sessionId} />
      <div className="editor">
        <div className="editor__agent">
          {/* <AuthButtons /> */}
          <WarningsStrip warnings={warnings} />
          <ChatPanel
            sessionId={sessionId}
            promptTicket={promptTicket}
            onOp={applyStreamOp}
            onWarning={addWarning}
          />
          <UploadPanel sessionId={sessionId} onUploaded={handleUploaded} />
          <MatchPanel sessionId={sessionId} jobDescription={jobDescription} />
          <RoastPanel sessionId={sessionId} selectedPath={selectedPath} applyOps={applyOps} />
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
    </>
  );
}
