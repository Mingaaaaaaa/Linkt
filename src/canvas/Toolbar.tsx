import React from 'react';
import { ToolType } from './types';
import { useCanvasStore } from '../store';

interface ToolbarProps {
  onToolSelect?: (tool: string) => void;
  currentTool?: string;
}

export const Toolbar: React.FC<ToolbarProps> = () => {
  // 使用 Zustand store
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
        display: 'flex',
        padding: '8px',
        background: '#f5f5f5',
        borderBottom: '1px solid #ddd'
      }}
    >
      {tools.map((tool) => (
        <button
          key={tool.name}
          onClick={() => handleToolSelect(tool.name)}
          title={tool.title}
          style={{
            margin: '0 4px',
            padding: '8px 12px',
            fontSize: '16px',
            background: currentTool === tool.name ? '#e0e0e0' : 'transparent',
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
  );
};
