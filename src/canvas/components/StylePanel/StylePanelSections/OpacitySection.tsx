import React from 'react';

interface OpacitySectionProps {
  opacity?: number;
}

export const OpacitySection: React.FC<OpacitySectionProps> = ({
  opacity = 100
}) => {
  return (
    <div className="style-panel-section">
      <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>透明度</h4>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input
          type="range"
          min="0"
          max="100"
          value={opacity}
          style={{ 
            width: '100%',
            accentColor: '#4285f4'  // 在支持的浏览器中设置滑块颜色
          }}
        />
        <span style={{ fontSize: '12px', minWidth: '30px', textAlign: 'right' }}>
          {opacity}%
        </span>
      </div>
    </div>
  );
};
