import React from 'react';

interface ColorSectionProps {
  strokeColor?: string;
  backgroundColor?: string;
  hasTextElement?: boolean;
  onStrokeColorChange?: (color: string) => void;
  onBackgroundColorChange?: (color: string) => void;
}

export const ColorSection: React.FC<ColorSectionProps> = ({
  strokeColor = '#000000',
  backgroundColor = '#ffffff',
  hasTextElement = false,
  onStrokeColorChange,
  onBackgroundColorChange
}) => {
  // 处理颜色变更
  const handleStrokeColorInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onStrokeColorChange) {
      onStrokeColorChange(e.target.value);
    }
  };

  const handleBackgroundColorInput = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (onBackgroundColorChange) {
      onBackgroundColorChange(e.target.value);
    }
  };

  return (
    <div className='style-panel-section'>
      <div style={{ marginBottom: '12px' }}>
        <div
          style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}
        >
          <label style={{ width: '80px', fontSize: '12px' }}>
            {hasTextElement ? '文字颜色' : '描边颜色'}:
          </label>
          <div
            className='color-picker-container'
            style={{ position: 'relative', width: '80%' }}
          >
            <input
              type='color'
              value={strokeColor || '#000000'}
              onChange={handleStrokeColorInput}
              style={{
                width: '100%',
                display: 'flex',
                height: '24px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>
        </div>

        {!hasTextElement && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <label style={{ width: '80px', fontSize: '12px' }}>填充颜色:</label>
            <div
              className='color-picker-container'
              style={{ position: 'relative', width: '80%' }}
            >
              <input
                type='color'
                value={backgroundColor || '#ffffff'}
                onChange={handleBackgroundColorInput}
                style={{
                  width: '100%',
                  display: 'flex',
                  height: '24px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
