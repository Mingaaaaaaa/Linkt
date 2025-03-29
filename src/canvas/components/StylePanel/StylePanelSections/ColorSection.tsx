import React from 'react';

interface ColorSectionProps {
  strokeColor?: string;
  backgroundColor?: string;
  hasTextElement?: boolean;
}

export const ColorSection: React.FC<ColorSectionProps> = ({
  strokeColor = '#000000',
  backgroundColor = '#ffffff',
  hasTextElement = false
}) => {
  const colorOptions = [
    { color: '#000000', name: '黑色' },
    { color: '#ffffff', name: '白色' },
    { color: '#f44336', name: '红色' },
    { color: '#e91e63', name: '粉红' },
    { color: '#9c27b0', name: '紫色' },
    { color: '#673ab7', name: '深紫' }
  ];

  return (
    <div className='style-panel-section'>
      <div style={{ marginBottom: '12px' }}>
        <div
          style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}
        >
          <label style={{ width: '80px', fontSize: '12px' }}>
            {hasTextElement ? '文字颜色' : '描边颜色'}:
          </label>
        </div>

        {!hasTextElement && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <label style={{ width: '80px', fontSize: '12px' }}>填充颜色:</label>
            <div
              className='color-picker-container'
              style={{ position: 'relative', width: '100%' }}
            >
              <input
                type='color'
                value={backgroundColor || '#ffffff'}
                style={{
                  width: '100%',
                  height: '24px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div
        className='color-palette'
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '4px'
        }}
      >
        {colorOptions.map((option) => (
          <button
            key={option.color}
            title={option.name}
            className='style-button'
            style={{
              width: '20px',
              height: '20px',
              backgroundColor: option.color,
              border:
                option.color === strokeColor
                  ? '2px solid rgb(190, 189, 255)'
                  : option.color === '#ffffff'
                  ? '1px solid #ddd'
                  : '1px solid transparent',
              borderRadius: '4px',
              cursor: 'pointer',
              padding: 0
            }}
          />
        ))}

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>|</span>
          <input
            type='color'
            value={strokeColor || '#000000'}
            style={{
              display: 'inline-block',
              width: '20px',
              height: '20px',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
      </div>
    </div>
  );
};
