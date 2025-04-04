import React from 'react';
import { useCanvasStore } from '../../store';
import { UndoIcon, RedoIcon } from './Icons';
import { Tooltip } from './Tooltip';

interface UndoRedoButtonsProps {
  className?: string;
}

export const UndoRedoButtons: React.FC<UndoRedoButtonsProps> = ({
  className
}) => {
  const undo = useCanvasStore((state) => state.undo);
  const redo = useCanvasStore((state) => state.redo);
  const undoStack = useCanvasStore((state) => state.undoStack);
  const redoStack = useCanvasStore((state) => state.redoStack);

  const handleUndo = () => {
    undo();
  };

  const handleRedo = () => {
    redo();
  };

  const isUndoDisabled = undoStack?.length === 0;
  const isRedoDisabled = redoStack?.length === 0;

  return (
    <div className={className} style={{ display: 'flex', gap: '5px' }}>
      <Tooltip text='撤销 (Ctrl+Z)'>
        <button
          onClick={handleUndo}
          disabled={isUndoDisabled}
          style={{
            opacity: isUndoDisabled ? 0.5 : 1,
            padding: '8px',
            background: '#f1f1f1',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: isUndoDisabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <UndoIcon size={20} color={isUndoDisabled ? '#999' : '#666'} />
        </button>
      </Tooltip>

      <Tooltip text='重做 (Ctrl+Shift+Z 或 Ctrl+Y)'>
        <button
          onClick={handleRedo}
          disabled={isRedoDisabled}
          style={{
            opacity: isRedoDisabled ? 0.5 : 1,
            padding: '8px',
            background: '#f1f1f1',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: isRedoDisabled ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <RedoIcon size={20} color={isRedoDisabled ? '#999' : '#666'} />
        </button>
      </Tooltip>
    </div>
  );
};
