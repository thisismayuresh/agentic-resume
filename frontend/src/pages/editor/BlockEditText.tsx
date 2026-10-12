import { useState } from 'react';
import { FormButton, FormTextArea } from '../../components/ui';
import type { ResumeBlock } from '../../types';

interface BlockEditTextProps {
  block: ResumeBlock;
  onSave: (text: string) => void;
  onCancel: () => void;
}

function initialText(block: ResumeBlock): string {
  if (block.type === 'bulletList') {
    return (block.bullets ?? []).join('\n');
  }
  return block.text ?? '';
}

export function BlockEditText({ block, onSave, onCancel }: BlockEditTextProps) {
  const [draft, setDraft] = useState(() => initialText(block));

  const handleSave = () => {
    onSave(draft);
  };

  return (
    <div className="block-editor">
      <FormTextArea
        id="block-edit"
        label="Edit block text"
        value={draft}
        onChange={setDraft}
        rows={5}
      />
      <div className="block-editor__actions">
        <FormButton label="Save" onClick={handleSave} />
        <FormButton label="Cancel" variant="quiet" onClick={onCancel} />
      </div>
    </div>
  );
}
