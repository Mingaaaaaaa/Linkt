import React, { useEffect, useState } from 'react';
import { ExcalidrawElement, ExcalidrawTextElement } from '../../types';
import { ColorSection } from './StylePanelSections/ColorSection';
import { StrokeSection } from './StylePanelSections/StrokeSection.tsx';
import { TextSection } from './StylePanelSections/TextSection.tsx';
import { AlignmentSection } from './StylePanelSections/AlignmentSection.tsx';
import { OpacitySection } from './StylePanelSections/OpacitySection.tsx';
import './StylePanel.css';

interface StylePanelProps {
  selectedElements: ExcalidrawElement[];
  onClose: () => void;
  position?: { x: number; y: number };
}

export const StylePanel: React.FC<StylePanelProps> = ({
  selectedElements,
  onClose,
  position = { x: 20, y: 80 }
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [panelHeight, setPanelHeight] = useState(0);

  // 当选中元素时显示面板
  useEffect(() => {
    if (selectedElements.length > 0) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [selectedElements]);

  // 所选元素的类型
  const hasTextElement = selectedElements.some(el => el.type === 'text');
  const hasMultipleElements = selectedElements.length > 1;
  
  // 获取共同样式属性（用于UI显示）
  const getCommonStyle = () => {
    if (selectedElements.length === 0) return null;
    
    const firstElement = selectedElements[0];
    let commonStyle = {
      strokeColor: firstElement.strokeColor,
      backgroundColor: firstElement.backgroundColor,
      strokeWidth: firstElement.strokeWidth,
      fillStyle: firstElement.fillStyle,
      roughness: firstElement.roughness,
      opacity: firstElement.opacity,
      fontSize: hasTextElement ? (firstElement as ExcalidrawTextElement).fontSize : undefined,
      fontFamily: hasTextElement ? (firstElement as ExcalidrawTextElement).fontFamily : undefined,
      textAlign: hasTextElement ? (firstElement as ExcalidrawTextElement).textAlign : undefined
    };

    // 检查所有选中元素是否共享相同的样式
    for (let i = 1; i < selectedElements.length; i++) {
      const element = selectedElements[i];
      if (element.strokeColor !== commonStyle.strokeColor) commonStyle.strokeColor = '';
      if (element.backgroundColor !== commonStyle.backgroundColor) commonStyle.backgroundColor = '';
      if (element.strokeWidth !== commonStyle.strokeWidth) commonStyle.strokeWidth = 0;
      if (element.fillStyle !== commonStyle.fillStyle) commonStyle.fillStyle = undefined;
      if (element.roughness !== commonStyle.roughness) commonStyle.roughness = 0;
      if (element.opacity !== commonStyle.opacity) commonStyle.opacity = 0;
      
      if (element.type === 'text') {
        const textElement = element as ExcalidrawTextElement;
        if (textElement.fontSize !== commonStyle.fontSize) commonStyle.fontSize = undefined;
        if (textElement.fontFamily !== commonStyle.fontFamily) commonStyle.fontFamily = undefined;
        if (textElement.textAlign !== commonStyle.textAlign) commonStyle.textAlign = undefined;
      }
    }

    return commonStyle;
  };

  const commonStyle = getCommonStyle();

  // 对于面板高度动态调整
  useEffect(() => {
    const baseHeight = 150; // 标题和基本部分
    let additionalHeight = 0;
    
    if (commonStyle) {
      additionalHeight += 150; // 颜色和描边部分
      additionalHeight += 80; // 透明度部分
      
      if (hasTextElement) {
        additionalHeight += 150; // 文本部分
      }
      
      if (hasMultipleElements) {
        additionalHeight += 80; // 对齐部分
      }
    }
    
    setPanelHeight(baseHeight + additionalHeight);
  }, [commonStyle, hasTextElement, hasMultipleElements]);

  if (!isVisible) return null;

  return (
    <div 
      className="style-panel"
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: '240px',
        height: `${panelHeight}px`,
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        padding: '12px 8px',
        zIndex: 1000,
        overflow: 'auto',
        transition: 'all 0.3s ease',
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
          />
          
          <StrokeSection 
            strokeWidth={commonStyle.strokeWidth}
            fillStyle={commonStyle.fillStyle}
            roughness={commonStyle.roughness}
          />
          
          <OpacitySection 
            opacity={commonStyle.opacity}
          />
          
          {hasTextElement && (
            <TextSection 
              fontSize={commonStyle.fontSize}
              fontFamily={commonStyle.fontFamily}
              textAlign={commonStyle.textAlign}
            />
          )}
          
          {hasMultipleElements && (
            <AlignmentSection />
          )}
        </>
      )}
    </div>
  );
};
