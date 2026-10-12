import { useState } from 'react';
import { FormButton } from '../../components/ui';
import { parseBlockPath } from '../../lib/resumeOps';
import type { ResumeBlock, ResumeOp } from '../../types';

interface BlockControlStripProps {
  path: string;
  block: ResumeBlock;
  blockCount: number;
  applyOps: (ops: ResumeOp[]) => Promise<void>;
  onEdit: () => void;
}

export function BlockControlStrip({
  path,
  block,
  blockCount,
  applyOps,
  onEdit,
}: BlockControlStripProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const parsed = parseBlockPath(path);
  const blockIndex = parsed?.blockIndex ?? 0;
  const style = block.style ?? {};

  const sendOps = (ops: ResumeOp[]) => {
    void applyOps(ops);
  };

  const handleBold = () => {
    sendOps([{ type: 'setStyle', path, style: { bold: !style.bold } }]);
  };

  const handleItalic = () => {
    sendOps([{ type: 'setStyle', path, style: { italic: !style.italic } }]);
  };

  const handleMoveUp = () => {
    sendOps([{ type: 'moveBlock', path, to: blockIndex - 1 }]);
  };

  const handleMoveDown = () => {
    sendOps([{ type: 'moveBlock', path, to: blockIndex + 1 }]);
  };

  const handleDelete = () => {
    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true);
      return;
    }
    setIsConfirmingDelete(false);
    sendOps([{ type: 'removeBlock', path }]);
  };

  return (
    <div className="control-strip" role="toolbar" aria-label="Block controls">
      <FormButton label={style.bold ? 'Unbold' : 'Bold'} variant="quiet" onClick={handleBold} />
      <FormButton
        label={style.italic ? 'Unitalic' : 'Italic'}
        variant="quiet"
        onClick={handleItalic}
      />
      <FormButton
        label="Move up"
        variant="quiet"
        onClick={handleMoveUp}
        disabled={blockIndex <= 0}
      />
      <FormButton
        label="Move down"
        variant="quiet"
        onClick={handleMoveDown}
        disabled={blockIndex >= blockCount - 1}
      />
      <FormButton label="Edit" variant="quiet" onClick={onEdit} />
      <FormButton
        label={isConfirmingDelete ? 'Confirm delete' : 'Delete'}
        variant={isConfirmingDelete ? 'secondary' : 'quiet'}
        onClick={handleDelete}
      />
      {isConfirmingDelete ? (
        <FormButton label="Keep" variant="quiet" onClick={() => setIsConfirmingDelete(false)} />
      ) : null}
    </div>
  );
}
