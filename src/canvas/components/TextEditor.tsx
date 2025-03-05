import React from 'react';
import { TextEditingInfo } from '../types/interactionTypes';

interface TextEditorProps {
  editingText: TextEditingInfo;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  handleTextInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleTextInputBlur: () => void;
  handleTextInputKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export const TextEditor: React.FC<TextEditorProps> = ({
  editingText,
  canvasRef,
  handleTextInputChange,
  handleTextInputBlur,
  handleTextInputKeyDown
}) => {
  if (!editingText) return null;

  return (
    <textarea
      value={editingText.inputValue}
      onChange={handleTextInputChange}
      onBlur={handleTextInputBlur}
      onKeyDown={handleTextInputKeyDown}
      style={{
        position: 'absolute',
        left:
          editingText.x +
          (canvasRef.current?.getBoundingClientRect().left || 0) +
          'px',
        top:
          editingText.y +
          (canvasRef.current?.getBoundingClientRect().top || 0) +
          'px',
        width: editingText.width + 'px',
        height: editingText.height + 'px',
        padding: '0',
        margin: '0',
        resize: 'none',
        overflow: 'hidden',
        lineHeight: '1.2',
        textAlign: editingText.element.textAlign || 'left',
        verticalAlign: 'top'
      }}
      autoFocus
    />
  );
};
