import React from 'react';
import { ToolType } from './types';
import { useCanvasStore } from '../store';
import { CollaborationButton } from './components/CollaborationButton';
import { CollaborationSession } from '../services/CollaborationService';
import { UndoRedoButtons } from './components/UndoRedoButtons';

interface ToolbarProps {
  onOpenCollaborationDialog?: () => void;
  collaborationSession?: CollaborationSession | null;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onOpenCollaborationDialog,
  collaborationSession
}) => {
  const currentTool = useCanvasStore((state) => state.currentTool);
  const setCurrentTool = useCanvasStore((state) => state.setCurrentTool);

  const tools = [
    { name: 'selection', icon: '👆', title: '选择工具' },
    { name: 'rectangle', icon: '⬛', title: '矩形工具' },
    { name: 'ellipse', icon: '⭕', title: '椭圆工具' },
    { name: 'line', icon: '📏', title: '线条工具' },
    { name: 'arrow', icon: '➡️', title: '箭头工具' },
    { name: 'text', icon: '📝', title: '文本工具' },
    { name: 'hand', icon: '✋', title: '平移工具' },
    { name: 'eraser', icon: '🧽', title: '橡皮擦' }
  ];

  const handleToolSelect = (toolName: string) => {
    setCurrentTool(toolName as ToolType);
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        backgroundColor: 'white',
        background: 'transparent',
        zIndex: 1000,
        pointerEvents: 'auto'
      }}
    >
      <button
        style={{
          padding: '8px',
          background: 'transparent',
          cursor: 'pointer',
          border: 'none'
        }}
      >
        {'☰'}
      </button>
      <UndoRedoButtons className='undo-redo-buttons' />
      <div
        style={{
          display: 'flex',
          gap: '8px',
          border: '1px solid #ddd',
          padding: '8px ',
          borderRadius: '8px'
        }}
      >
        {tools.map((tool) => (
          <button
            key={tool.name}
            onClick={() => handleToolSelect(tool.name)}
            title={tool.title}
            style={{
              padding: '8px',
              background: currentTool === tool.name ? '#e0dfff' : 'transparent',
              border:
                currentTool === tool.name
                  ? '1px solid #aaa'
                  : '1px solid transparent',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {tool.icon}
          </button>
        ))}
      </div>

      <CollaborationButton
        onOpenDialog={onOpenCollaborationDialog}
        collaborationSession={collaborationSession}
      />
    </div>
  );
};
