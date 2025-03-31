import React from 'react';

interface OpacitySectionProps {
  opacity?: number;
  onOpacityChange?: (opacity: number) => void;
}

export const OpacitySection: React.FC<OpacitySectionProps> = ({
  opacity = 100,
  onOpacityChange
}) => {
  // 确保opacity有默认值
  const opacityValue = opacity !== undefined ? opacity : 100;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onOpacityChange) {
      onOpacityChange(parseInt(e.target.value));
    }
  };

  // 在状态变化时立即调用回调
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(e);
  };

  return (
    <div className='style-panel-section'>
      <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>透明度</h4>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type='range'
          min='0'
          max='100'
          value={opacityValue}
          onChange={handleInputChange}
          style={{
            width: '100%',
            accentColor: '#4285f4'
          }}
        />
        <span
          style={{ fontSize: '12px', minWidth: '30px', textAlign: 'right' }}
        >
          {opacityValue}%
        </span>
      </div>
    </div>
  );
};
