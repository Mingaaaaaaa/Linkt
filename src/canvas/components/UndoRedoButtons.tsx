import React from 'react';
import { useCanvasStore } from '../../store';

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

  return (
    <div className={className} style={{ display: 'flex', gap: '5px' }}>
      <button
        onClick={handleUndo}
        disabled={undoStack?.length === 0}
        title='撤销 (Ctrl+Z)'
        style={{
          opacity: undoStack?.length === 0 ? 0.5 : 1,
          padding: '5px 10px',
          background: '#f1f1f1',
          border: '1px solid #ccc',
          borderRadius: '4px',
          cursor: undoStack?.length === 0 ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <span style={{ transform: 'rotateX( 180deg)' }}>↩</span>
      </button>

      <button
        onClick={handleRedo}
        disabled={redoStack?.length === 0}
        title='重做 (Ctrl+Shift+Z 或 Ctrl+Y)'
        style={{
          opacity: redoStack?.length === 0 ? 0.5 : 1,
          padding: '5px 10px',
          background: '#f1f1f1',
          border: '1px solid #ccc',
          borderRadius: '4px',
          cursor: redoStack?.length === 0 ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <span style={{ transform: 'rotate(180deg)' }}>↩</span>
      </button>
    </div>
  );
};
