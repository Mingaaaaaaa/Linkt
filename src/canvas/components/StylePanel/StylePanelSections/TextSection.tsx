import React from 'react';

interface TextSectionProps {
  fontSize?: number;
  fontFamily?: string;
  textAlign?: string;
  onFontSizeChange?: (size: number) => void;
  onFontFamilyChange?: (family: string) => void;
  onTextAlignChange?: (align: string) => void;
}

export const TextSection: React.FC<TextSectionProps> = ({
  fontSize = 20,
  fontFamily = 'sans-serif',
  textAlign = 'left',
  onFontSizeChange,
  onFontFamilyChange,
  onTextAlignChange
}) => {
  const fontSizeOptions = [14, 16, 20, 24, 28, 36];
  const fontFamilyOptions = [
    { value: 'sans-serif', label: '无衬线字体' },
    { value: 'serif', label: '衬线字体' },
    { value: 'monospace', label: '等宽字体' }
  ];
  const textAlignOptions = [
    { value: 'left', icon: '⫪' },
    { value: 'center', icon: '☰' },
    { value: 'right', icon: '⫫' }
  ];

  return (
    <div className='style-panel-section'>
      <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>文本样式</h4>

      <div style={{ marginBottom: '12px' }}>
        <label
          style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}
        >
          字体大小:
        </label>
        <div
          className='font-size-options'
          style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}
        >
          {fontSizeOptions.map((size) => (
            <button
              key={size}
              onClick={() => onFontSizeChange?.(size)}
              className={`style-button ${
                fontSize === size
                  ? 'style-button-selected'
                  : 'style-button-unselected'
              }`}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                minWidth: '40px'
              }}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <label
          style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}
        >
          字体:
        </label>
        <select
          value={fontFamily}
          onChange={(e) => onFontFamilyChange?.(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '12px'
          }}
        >
          {fontFamilyOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          style={{ display: 'block', marginBottom: '4px', fontSize: '12px' }}
        >
          文本对齐:
        </label>
        <div
          className='text-align-options'
          style={{ display: 'flex', gap: '4px' }}
        >
          {textAlignOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onTextAlignChange?.(option.value)}
              className={`style-button ${
                textAlign === option.value
                  ? 'style-button-selected'
                  : 'style-button-unselected'
              }`}
              style={{
                flex: 1,
                padding: '6px 0',
                fontSize: '14px'
              }}
            >
              {option.icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
