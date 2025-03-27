import React from 'react';
import { ToolType } from './types';
import { useCanvasStore } from '../store';
import { CollaborationButton } from './components/CollaborationButton';
import { CollaborationSession } from '../services/CollaborationService';
import { UndoRedoButtons } from './components/UndoRedoButtons';
import { Tooltip } from './components/Tooltip';
import {
  SelectionIcon,
  RectangleIcon,
  EllipseIcon,
  LineIcon,
  ArrowIcon,
  TextIcon,
  FreeDrawIcon,
  HandIcon,
  EraserIcon,
  MenuIcon
} from './components/Icons';

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
    { name: 'hand', icon: HandIcon, title: '平移工具' },
    { name: 'selection', icon: SelectionIcon, title: '选择工具' },
    { name: 'rectangle', icon: RectangleIcon, title: '矩形工具' },
    { name: 'ellipse', icon: EllipseIcon, title: '椭圆工具' },
    { name: 'arrow', icon: ArrowIcon, title: '箭头工具' },
    { name: 'line', icon: LineIcon, title: '线条工具' },
    { name: 'text', icon: TextIcon, title: '文本工具' },
    { name: 'freeDraw', icon: FreeDrawIcon, title: '自由绘制' },
    { name: 'eraser', icon: EraserIcon, title: '橡皮擦' }
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
      <Tooltip text='菜单'>
        <button
          style={{
            padding: '8px',
            background: 'transparent',
            cursor: 'pointer',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <MenuIcon size={20} />
        </button>
      </Tooltip>

      <div
        style={{
          display: 'flex',
          gap: '8px',
          border: '1px solid #ddd',
          padding: '8px',
          borderRadius: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.8)'
        }}
      >
        <UndoRedoButtons className='undo-redo-buttons' />

        {tools.map((tool) => {
          const Icon = tool.icon;
          const isSelected = currentTool === tool.name;

          return (
            <Tooltip key={tool.name} text={tool.title}>
              <button
                onClick={() => handleToolSelect(tool.name)}
                style={{
                  padding: '8px',
                  background: isSelected ? '#e0dfff' : 'transparent',
                  border: isSelected
                    ? '1px solid #aaa'
                    : '1px solid transparent',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Icon size={20} color={isSelected ? '#4040ff' : '#666'} />
              </button>
            </Tooltip>
          );
        })}
      </div>

      <CollaborationButton
        onOpenDialog={onOpenCollaborationDialog}
        collaborationSession={collaborationSession}
      />
    </div>
  );
};
