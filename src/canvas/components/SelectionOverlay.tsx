import React from 'react';
import { SelectionBox } from '../types/interactionTypes';

interface SelectionOverlayProps {
  selectionBox: SelectionBox;
  zoom: number;
  scrollX: number;
  scrollY: number;
}

export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({
  selectionBox,
  zoom,
  scrollX,
  scrollY
}) => {
  if (!selectionBox) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: selectionBox.x * zoom + scrollX,
        top: selectionBox.y * zoom + scrollY,
        width: selectionBox.width * zoom,
        height: selectionBox.height * zoom,
        border: '1px dashed blue',
        backgroundColor: 'rgba(0, 0, 255, 0.1)',
        pointerEvents: 'none' // 确保选择框不会干扰鼠标事件
      }}
    />
  );
};
