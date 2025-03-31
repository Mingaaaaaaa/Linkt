import React from 'react';
import {
  StrokeNormalIcon,
  StrokeRoughIcon,
  StrokeSmoothIcon,
  GridFillIcon,
  SolidFillIcon,
  SingleLineFillIcon
} from './Icons';

interface StrokeSectionProps {
  strokeWidth?: number;
  fillStyle?: string;
  roughness?: number;
  onStrokeWidthChange?: (width: number) => void;
  onFillStyleChange?: (style: string) => void;
  onRoughnessChange?: (roughness: number) => void;
}

export const StrokeSection: React.FC<StrokeSectionProps> = ({
  strokeWidth = 1,
  fillStyle = 'solid',
  roughness = 1,
  onStrokeWidthChange,
  onFillStyleChange,
  onRoughnessChange
}) => {
  const strokeWidthOptions = [1, 2, 4];
  const fillStyleOptions = [
    { value: 'solid', label: '实心', icon: SolidFillIcon },
    { value: 'hachure', label: '平行线', icon: SingleLineFillIcon },
    { value: 'cross-hatch', label: '交叉线', icon: GridFillIcon }
  ];
  const roughnessOptions = [
    { value: 0, label: '光滑', icon: StrokeSmoothIcon },
    { value: 1, label: '正常', icon: StrokeNormalIcon },
    { value: 2, label: '粗糙', icon: StrokeRoughIcon }
  ];

  return (
    <div className='style-panel-section'>
      <div style={{ marginBottom: '12px' }}>
        <label
          style={{ display: 'block', marginBottom: '6px', fontSize: '12px' }}
        >
          填充样式:
        </label>
        <div
          className='fill-style-options'
          style={{ display: 'flex', gap: '8px' }}
        >
          {fillStyleOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => onFillStyleChange?.(option.value)}
                className={`style-button ${
                  fillStyle === option.value
                    ? 'style-button-selected'
                    : 'style-button-unselected'
                }`}
                title={option.label}
                style={{ padding: '8px' }}
              >
                <Icon />
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label
          style={{ display: 'block', marginBottom: '6px', fontSize: '12px' }}
        >
          描边宽度:
        </label>
        <div
          className='stroke-width-options'
          style={{ display: 'flex', gap: '8px' }}
        >
          {strokeWidthOptions.map((width) => (
            <button
              key={width}
              onClick={() => onStrokeWidthChange?.(width)}
              className={`style-button ${
                strokeWidth === width
                  ? 'style-button-selected'
                  : 'style-button-unselected'
              }`}
              style={{
                width: '36px',
                height: '41px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px'
              }}
            >
              <div
                style={{
                  width: '20px',
                  height: `${width}px`,
                  backgroundColor: '#000',
                  borderRadius: width > 1 ? '2px' : 0
                }}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label
          style={{ display: 'block', marginBottom: '6px', fontSize: '12px' }}
        >
          线条风格:
        </label>
        <div
          className='roughness-options'
          style={{ display: 'flex', gap: '8px' }}
        >
          {roughnessOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => onRoughnessChange?.(option.value)}
                className={`style-button ${
                  roughness === option.value
                    ? 'style-button-selected'
                    : 'style-button-unselected'
                }`}
                title={option.label}
                style={{ padding: '8px' }}
              >
                <Icon />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
