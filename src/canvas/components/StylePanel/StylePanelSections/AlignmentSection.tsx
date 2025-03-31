import React from 'react';

interface AlignmentSectionProps {
  onAlignmentChange?: (alignType: string) => void;
}

export const AlignmentSection: React.FC<AlignmentSectionProps> = ({
  onAlignmentChange
}) => {
  const alignmentOptions = [
    { value: 'left', icon: '⫪', title: '左对齐' },
    { value: 'center-horizontal', icon: '⟷', title: '水平居中' },
    { value: 'right', icon: '⫫', title: '右对齐' },
    { value: 'top', icon: '⫯', title: '顶部对齐' },
    { value: 'center-vertical', icon: '⟺', title: '垂直居中' },
    { value: 'bottom', icon: '⫰', title: '底部对齐' }
  ];

  return (
    <div className='style-panel-section'>
      <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>对齐工具</h4>

      <div
        className='alignment-options'
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '4px'
        }}
      >
        {alignmentOptions.map((option) => (
          <button
            key={option.value}
            title={option.title}
            onClick={() => onAlignmentChange?.(option.value)}
            className='style-button style-button-unselected'
            style={{
              padding: '6px 0',
              fontSize: '14px'
            }}
          >
            {option.icon}
          </button>
        ))}
      </div>
    </div>
  );
};
