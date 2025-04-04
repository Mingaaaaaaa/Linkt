import React, { useRef, useState } from 'react';
import { ToolType } from './types';
import { useCanvasStore } from '../store';
import { CollaborationButton } from './components/CollaborationButton';
import { CollaborationSession } from '../services/CollaborationService';
import { UndoRedoButtons } from './components/UndoRedoButtons';
import { Tooltip } from './components/Tooltip';
import { MainMenu } from './components/MainMenu';
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
  MenuIcon,
  ImageIcon
} from './components/Icons';

interface ToolbarProps {
  onOpenCollaborationDialog?: () => void;
  collaborationSession?: CollaborationSession | null;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onOpenCollaborationDialog,
  collaborationSession
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentTool = useCanvasStore((state) => state.currentTool);
  const setCurrentTool = useCanvasStore((state) => state.setCurrentTool);
  const showGrid = useCanvasStore((state) => state.showGrid);
  const setShowGrid = useCanvasStore((state) => state.setShowGrid);
  const viewBackgroundColor = useCanvasStore(
    (state) => state.viewBackgroundColor
  );
  const setViewBackgroundColor = useCanvasStore(
    (state) => state.setViewBackgroundColor
  );

  const handleToolSelect = (tool: ToolType) => {
    setCurrentTool(tool);

    // 如果选择了图片工具，触发文件选择框
    if (tool === 'image' && fileInputRef.current) {
      fileInputRef.current.click();
      // 选择文件后重置为选择工具
      setTimeout(() => {
        setCurrentTool('selection');
      }, 100);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      if (event.target && event.target.result) {
        // 创建并触发自定义事件
        const imageLoadEvent = new CustomEvent('image-upload', {
          detail: {
            dataURL: event.target.result,
            fileName: file.name,
            fileType: file.type
          }
        });
        document.dispatchEvent(imageLoadEvent);
      }
    };

    reader.readAsDataURL(file);

    // 重置input，以便可以再次选择相同的文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleToggleGrid = () => {
    setShowGrid(!showGrid);
  };

  const handleChangeBackgroundColor = (color: string) => {
    setViewBackgroundColor(color);
  };

  const tools = [
    { name: 'selection', title: '选择 (V)', icon: SelectionIcon },
    { name: 'rectangle', title: '矩形 (R)', icon: RectangleIcon },
    { name: 'ellipse', title: '椭圆 (O)', icon: EllipseIcon },
    { name: 'line', title: '直线 (L)', icon: LineIcon },
    { name: 'arrow', title: '箭头 (A)', icon: ArrowIcon },
    { name: 'text', title: '文本 (T)', icon: TextIcon },
    { name: 'freeDraw', title: '自由绘制 (P)', icon: FreeDrawIcon },
    { name: 'image', title: '插入图片 (I)', icon: ImageIcon },
    { name: 'hand', title: '平移 (H)', icon: HandIcon },
    { name: 'eraser', title: '橡皮擦 (E)', icon: EraserIcon }
  ];

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 16px',
        width: '100%',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1000,
      }}
    >
      <button
        ref={menuButtonRef}
        onClick={toggleMenu}
        style={{
          margin: '8px',
          border: '1px solid #ddd',
          background: '#fff',
          borderRadius: '4px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <MenuIcon size={20} color='#666' />
      </button>

      <input
        type='file'
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept='image/*'
        onChange={handleImageUpload}
      />

      <MainMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        anchorEl={menuButtonRef.current}
        showGrid={showGrid}
        onToggleGrid={handleToggleGrid}
        viewBackgroundColor={viewBackgroundColor}
        onChangeBackgroundColor={handleChangeBackgroundColor}
      />

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
                onClick={() => handleToolSelect(tool.name as ToolType)}
                style={{
                  padding: '8px',
                  background: isSelected ? '#e0dfff' : 'transparent',
                  border: isSelected
                    ? '1px solid rgb(190, 189, 255)'
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
