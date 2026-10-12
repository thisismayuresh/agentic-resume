import { useEffect, useState } from 'react';
import type { MouseEvent } from 'react';
import { FormButton } from '../../components/ui';
import { blockPath, parseBlockPath } from '../../lib/resumeOps';
import type { ResumeBlock, ResumeDocument, ResumeOp } from '../../types';
import { BlockControlStrip } from './BlockControlStrip';
import { BlockEditText } from './BlockEditText';
import { ResumeBlockView } from './ResumeBlockView';

const FIT_STORAGE_KEY = 'resume-fit-one-page';

interface ResumePreviewProps {
  resume: ResumeDocument;
  changedPaths: string[];
  selectedPath: string | null;
  applyOps: (ops: ResumeOp[]) => Promise<void>;
  opsError: string | null;
  onSelectedPathChange: (path: string | null) => void;
}

export function ResumePreview({
  resume,
  changedPaths,
  selectedPath,
  applyOps,
  opsError,
  onSelectedPathChange,
}: ResumePreviewProps) {
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [fitOnePage, setFitOnePage] = useState(
    () => window.localStorage.getItem(FIT_STORAGE_KEY) === '1',
  );

  useEffect(() => {
    setEditingPath(null);
  }, [selectedPath]);

  useEffect(() => {
    window.localStorage.setItem(FIT_STORAGE_KEY, fitOnePage ? '1' : '0');
  }, [fitOnePage]);

  const selectedBlock = blockAt(resume, selectedPath);
  const editingBlock = blockAt(resume, editingPath);
  const sectionOfSelection = sectionAt(resume, selectedPath);

  const handlePageClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) {
      return;
    }
    onSelectedPathChange(null);
  };

  const handleSelect = (path: string) => {
    onSelectedPathChange(path);
  };

  const handleSaveEdit = (text: string) => {
    if (editingPath === null) {
      return;
    }
    setEditingPath(null);
    void applyOps([{ type: 'updateText', path: editingPath, text }]);
  };

  return (
    <div className="resume-preview">
      <div className="preview-header">
        <span className="preview-header__label">Preview</span>
        <FormButton
          label={fitOnePage ? 'Show full size' : 'Fit to one page'}
          variant="quiet"
          onClick={() => setFitOnePage((current) => !current)}
        />
      </div>

      {selectedBlock !== null && selectedPath !== null && sectionOfSelection !== null ? (
        <div className="preview-toolbar">
          {editingPath !== null && editingBlock !== null ? (
            <BlockEditText
              block={editingBlock}
              onSave={handleSaveEdit}
              onCancel={() => setEditingPath(null)}
            />
          ) : (
            <BlockControlStrip
              path={selectedPath}
              block={selectedBlock}
              blockCount={sectionOfSelection.blocks.length}
              applyOps={applyOps}
              onEdit={() => setEditingPath(selectedPath)}
            />
          )}
        </div>
      ) : null}

      {opsError !== null ? (
        <p className="inline-error preview-error" role="alert">
          {opsError}
        </p>
      ) : null}

      <div
        className={`resume-page${fitOnePage ? ' resume-page--fit' : ''}`}
        onClick={handlePageClick}
        role="presentation"
      >
        <header className="resume-header">
          <h1 className="resume-header__name">{resume.fullName ?? 'Your name'}</h1>
          <p className="resume-header__contact">{contactLine(resume)}</p>
        </header>
        {resume.sections.length === 0 ? (
          <p className="resume-page__empty">
            Your resume will appear here. Answer the questions on the left, or upload a resume to
            get started.
          </p>
        ) : null}
        {resume.sections.map((section, sectionIndex) => (
          <section key={section.id} className="resume-section">
            <h2 className="resume-section__title">{section.title}</h2>
            {section.blocks.map((block, blockIndex) => (
              <ResumeBlockView
                key={block.id}
                block={block}
                path={blockPath(sectionIndex, blockIndex)}
                isSelected={selectedPath === blockPath(sectionIndex, blockIndex)}
                isChanged={changedPaths.includes(blockPath(sectionIndex, blockIndex))}
                onSelect={handleSelect}
              />
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

function contactLine(resume: ResumeDocument): string {
  const contact = resume.contact ?? {};
  const parts = [contact.phone, contact.email, contact.location].filter(
    (part): part is string => typeof part === 'string' && part !== '',
  );
  return parts.join(' · ');
}

function blockAt(document: ResumeDocument, path: string | null): ResumeBlock | null {
  if (path === null) {
    return null;
  }
  const parsed = parseBlockPath(path);
  if (parsed === null || parsed.blockIndex === null) {
    return null;
  }
  const section = document.sections[parsed.sectionIndex];
  if (section === undefined) {
    return null;
  }
  const block = section.blocks[parsed.blockIndex];
  if (block === undefined) {
    return null;
  }
  return block;
}

function sectionAt(
  document: ResumeDocument,
  path: string | null,
): ResumeDocument['sections'][number] | null {
  if (path === null) {
    return null;
  }
  const parsed = parseBlockPath(path);
  if (parsed === null) {
    return null;
  }
  const section = document.sections[parsed.sectionIndex];
  if (section === undefined) {
    return null;
  }
  return section;
}
