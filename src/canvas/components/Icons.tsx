import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const SelectionIcon: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke={color}
    className={className}
    style={style}
    xmlns='http://www.w3.org/2000/svg'
  >
    <g
      stroke='currentColor'
      strokeWidth={1.25}
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <path stroke='none' d='M0 0h24v24H0z' fill='none'></path>
      <path d='M6 6l4.153 11.793a0.365 .365 0 0 0 .331 .207a0.366 .366 0 0 0 .332 -.207l2.184 -4.793l4.787 -1.994a0.355 .355 0 0 0 .213 -.323a0.355 .355 0 0 0 -.213 -.323l-11.787 -4.36z'></path>
      <path d='M13.5 13.5l4.5 4.5'></path>
    </g>
  </svg>
);

export const RectangleIcon: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke={color}
    className={className}
    style={style}
    xmlns='http://www.w3.org/2000/svg'
  >
    <rect
      x='4'
      y='6'
      width='16'
      height='12'
      rx='1'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const EllipseIcon: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke={color}
    className={className}
    style={style}
    xmlns='http://www.w3.org/2000/svg'
  >
    <ellipse
      cx='12'
      cy='12'
      rx='8'
      ry='6'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const LineIcon: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke={color}
    className={className}
    style={style}
    xmlns='http://www.w3.org/2000/svg'
  >
    <line
      x1='5'
      y1='19'
      x2='19'
      y2='5'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const ArrowIcon: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke={color}
    className={className}
    style={style}
    xmlns='http://www.w3.org/2000/svg'
  >
    <line
      x1='5'
      y1='12'
      x2='19'
      y2='12'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <polyline
      points='12 5 19 12 12 19'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const TextIcon: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke={color}
    className={className}
    style={style}
    xmlns='http://www.w3.org/2000/svg'
  >
    <line
      x1='6'
      y1='7'
      x2='18'
      y2='7'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <line
      x1='12'
      y1='7'
      x2='12'
      y2='19'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const FreeDrawIcon: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke={color}
    className={className}
    style={style}
    xmlns='http://www.w3.org/2000/svg'
  >
    <g strokeWidth='2'>
      <path
        clipRule='evenodd'
        d='m7.643 15.69 7.774-7.773a2.357 2.357 0 1 0-3.334-3.334L4.31 12.357a3.333 3.333 0 0 0-.977 2.357v1.953h1.953c.884 0 1.732-.352 2.357-.977Z'
      ></path>
      <path d='m11.25 5.417 3.333 3.333'></path>
    </g>
  </svg>
);

export const HandIcon: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke={color}
    className={className}
    style={style}
    xmlns='http://www.w3.org/2000/svg'
  >
    <g strokeWidth='1.5'>
      <path stroke='none' d='M0 0h24v24H0z' fill='none'></path>
      <path d='M8 13v-7.5a1.5 1.5 0 0 1 3 0v6.5'></path>
      <path d='M11 5.5v-2a1.5 1.5 0 1 1 3 0v8.5'></path>
      <path d='M14 5.5a1.5 1.5 0 0 1 3 0v6.5'></path>
      <path d='M17 7.5a1.5 1.5 0 0 1 3 0v8.5a6 6 0 0 1 -6 6h-2h.208a6 6 0 0 1 -5.012 -2.7a69.74 69.74 0 0 1 -.196 -.3c-.312 -.479 -1.407 -2.388 -3.286 -5.728a1.5 1.5 0 0 1 .536 -2.022a1.867 1.867 0 0 1 2.28 .28l1.47 1.47'></path>
    </g>
  </svg>
);

export const EraserIcon: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke={color}
    className={className}
    style={style}
    xmlns='http://www.w3.org/2000/svg'
  >
    <g strokeWidth='2'>
      <path stroke='none' d='M0 0h24v24H0z' fill='none'></path>
      <path d='M19 20h-10.5l-4.21 -4.3a1 1 0 0 1 0 -1.41l10 -10a1 1 0 0 1 1.41 0l5 5a1 1 0 0 1 0 1.41l-9.2 9.3'></path>
      <path d='M18 13.3l-6.3 -6.3'></path>
    </g>
  </svg>
);

export const UndoIcon: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke={color}
    className={className}
    style={style}
    xmlns='http://www.w3.org/2000/svg'
  >
    <path
      d='M7 11L3 7L7 3'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M3 7H15C18.3137 7 21 9.68629 21 13C21 16.3137 18.3137 19 15 19H10'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const RedoIcon: React.FC<IconProps> = ({
  size = 22,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke={color}
    className={className}
    style={style}
    xmlns='http://www.w3.org/2000/svg'
  >
    <path
      d='M17 11L21 7L17 3'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M21 7H9C5.68629 7 3 9.68629 3 13C3 16.3137 5.68629 19 9 19H14'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const MenuIcon: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke={color}
    className={className}
    style={style}
    xmlns='http://www.w3.org/2000/svg'
  >
    <line
      x1='4'
      y1='6'
      x2='20'
      y2='6'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <line
      x1='4'
      y1='12'
      x2='20'
      y2='12'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <line
      x1='4'
      y1='18'
      x2='20'
      y2='18'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);
