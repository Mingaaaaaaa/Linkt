import React from 'react';
import { ExcalidrawElement, ExcalidrawTextElement } from '../../types';
import { ColorSection } from './StylePanelSections/ColorSection';
import { StrokeSection } from './StylePanelSections/StrokeSection';
import { TextSection } from './StylePanelSections/TextSection';
import { AlignmentSection } from './StylePanelSections/AlignmentSection';
import { OpacitySection } from './StylePanelSections/OpacitySection';
import './StylePanel.css';

interface StylePanelProps {
  selectedElements: ExcalidrawElement[];
  onClose: () => void;
  position?: { x: number; y: number };
  updateElement: (id: string, props: Partial<ExcalidrawElement>) => void;
  startRecordingHistory: () => void;
  stopRecordingHistory: () => void;
}

export const StylePanel: React.FC<StylePanelProps> = ({
  selectedElements,
  position = { x: 20, y: 80 },
  updateElement,
  startRecordingHistory,
  stopRecordingHistory
}) => {
  // 所选元素的类型
  const hasTextElement = selectedElements.some((el) => el.type === 'text');
  const hasMultipleElements = selectedElements.length > 1;

  // 获取共同样式属性
  const commonStyle = getCommonStyle(selectedElements);

  // 在单个变更开始前记录历史
  const handleStyleChangeStart = () => {
    startRecordingHistory();
  };

  // 在单个变更结束后停止记录历史
  const handleStyleChangeEnd = () => {
    stopRecordingHistory();
  };

  // 处理颜色变更
  const handleColorChange = (
    colorType: 'strokeColor' | 'backgroundColor',
    color: string
  ) => {
    handleStyleChangeStart();

    selectedElements.forEach((element) => {
      updateElement(element.id, { [colorType]: color });
    });

    handleStyleChangeEnd();
  };

  // 处理描边宽度变更
  const handleStrokeWidthChange = (width: number) => {
    handleStyleChangeStart();

    selectedElements.forEach((element) => {
      updateElement(element.id, { strokeWidth: width });
    });

    handleStyleChangeEnd();
  };

  // 处理填充样式变更
  const handleFillStyleChange = (style: string) => {
    handleStyleChangeStart();

    selectedElements.forEach((element) => {
      updateElement(element.id, { fillStyle: style as any });
    });

    handleStyleChangeEnd();
  };

  // 处理粗糙度变更
  const handleRoughnessChange = (roughness: number) => {
    handleStyleChangeStart();

    selectedElements.forEach((element) => {
      updateElement(element.id, { roughness });
    });

    handleStyleChangeEnd();
  };

  // 处理透明度变更
  const handleOpacityChange = (opacity: number) => {
    handleStyleChangeStart();
    selectedElements.forEach((element) => {
      updateElement(element.id, { opacity });
    });

    handleStyleChangeEnd();
  };

  // 处理文本属性变更
  const handleTextChange = (property: string, value: any) => {
    handleStyleChangeStart();

    selectedElements.forEach((element) => {
      if (element.type === 'text') {
        updateElement(element.id, { [property]: value });
      }
    });

    handleStyleChangeEnd();
  };

  // 处理对齐操作
  const handleAlignment = (alignType: string) => {
    if (selectedElements.length <= 1) return;

    handleStyleChangeStart();

    // 获取元素边界
    const bounds = getElementsBounds(selectedElements);

    // 根据对齐类型计算新位置
    selectedElements.forEach((element) => {
      let newX = element.x;
      let newY = element.y;

      switch (alignType) {
        case 'left':
          newX = bounds.minX;
          break;
        case 'center-horizontal':
          newX = bounds.minX + (bounds.maxX - bounds.minX - element.width) / 2;
          break;
        case 'right':
          newX = bounds.maxX - element.width;
          break;
        case 'top':
          newY = bounds.minY;
          break;
        case 'center-vertical':
          newY = bounds.minY + (bounds.maxY - bounds.minY - element.height) / 2;
          break;
        case 'bottom':
          newY = bounds.maxY - element.height;
          break;
      }

      updateElement(element.id, { x: newX, y: newY });
    });

    handleStyleChangeEnd();
  };

  return (
    <div
      className='style-panel'
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: '240px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        padding: '16px',
        zIndex: 10,
        overflow: 'auto',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}
    >
      {commonStyle && (
        <>
          <ColorSection
            strokeColor={commonStyle.strokeColor}
            backgroundColor={commonStyle.backgroundColor}
            hasTextElement={hasTextElement}
            onStrokeColorChange={(color) =>
              handleColorChange('strokeColor', color)
            }
            onBackgroundColorChange={(color) =>
              handleColorChange('backgroundColor', color)
            }
          />

          {!hasTextElement && (
            <StrokeSection
              strokeWidth={commonStyle.strokeWidth}
              fillStyle={commonStyle.fillStyle}
              roughness={commonStyle.roughness}
              onStrokeWidthChange={handleStrokeWidthChange}
              onFillStyleChange={handleFillStyleChange}
              onRoughnessChange={handleRoughnessChange}
            />
          )}

          <OpacitySection
            opacity={commonStyle.opacity}
            onOpacityChange={handleOpacityChange}
          />

          {hasTextElement && (
            <TextSection
              fontSize={commonStyle.fontSize}
              fontFamily={commonStyle.fontFamily}
              textAlign={commonStyle.textAlign}
              onFontSizeChange={(size) => handleTextChange('fontSize', size)}
              onFontFamilyChange={(family) =>
                handleTextChange('fontFamily', family)
              }
              onTextAlignChange={(align) =>
                handleTextChange('textAlign', align)
              }
            />
          )}

          {hasMultipleElements && (
            <AlignmentSection onAlignmentChange={handleAlignment} />
          )}
        </>
      )}
    </div>
  );
};

// 辅助函数：获取所有选中元素的共同样式
function getCommonStyle(selectedElements: ExcalidrawElement[]) {
  if (selectedElements.length === 0) return null;

  const firstElement = selectedElements[0];
  let commonStyle = {
    strokeColor: firstElement.strokeColor,
    backgroundColor: firstElement.backgroundColor,
    strokeWidth: firstElement.strokeWidth,
    fillStyle: firstElement.fillStyle,
    roughness: firstElement.roughness,
    opacity: firstElement.opacity || 100,
    fontSize: (firstElement as any).fontSize,
    fontFamily: (firstElement as any).fontFamily,
    textAlign: (firstElement as any).textAlign
  };

  // 检查所有选中元素是否共享相同的样式
  for (let i = 1; i < selectedElements.length; i++) {
    const element = selectedElements[i];
    if (element.strokeColor !== commonStyle.strokeColor)
      commonStyle.strokeColor = '';
    if (element.backgroundColor !== commonStyle.backgroundColor)
      commonStyle.backgroundColor = '';
    if (element.strokeWidth !== commonStyle.strokeWidth)
      commonStyle.strokeWidth = 0;
    if (element.fillStyle !== commonStyle.fillStyle)
      commonStyle.fillStyle = undefined as any;
    if (element.roughness !== commonStyle.roughness) commonStyle.roughness = 0;
    if (element.opacity !== commonStyle.opacity) commonStyle.opacity = 0;

    if (element.type === 'text') {
      const textElement = element as ExcalidrawTextElement;
      if (textElement.fontSize !== commonStyle.fontSize)
        commonStyle.fontSize = undefined;
      if (textElement.fontFamily !== commonStyle.fontFamily)
        commonStyle.fontFamily = undefined;
      if (textElement.textAlign !== commonStyle.textAlign)
        commonStyle.textAlign = undefined;
    }
  }

  return commonStyle;
}

// 辅助函数：获取元素组的边界
function getElementsBounds(elements: ExcalidrawElement[]) {
  if (elements.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  elements.forEach((element) => {
    minX = Math.min(minX, element.x);
    minY = Math.min(minY, element.y);
    maxX = Math.max(maxX, element.x + element.width);
    maxY = Math.max(maxY, element.y + element.height);
  });

  return { minX, minY, maxX, maxY };
}
