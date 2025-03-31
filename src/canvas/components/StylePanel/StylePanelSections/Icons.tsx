import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const StrokeSmoothIcon: React.FC<IconProps> = ({
  size = 18,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    aria-hidden='true'
    focusable='false'
    role='img'
    viewBox='0 0 20 20'
    className={className}
    style={style}
    width={size}
    height={size}
    color={color}
    fill='none'
    stroke='currentColor'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path
      d='M2.5 12.038c1.655-.885 5.9-3.292 8.568-4.354 2.668-1.063.101 2.821 1.32 3.104 1.218.283 5.112-1.814 5.112-1.814'
      strokeWidth='1.25'
    ></path>
  </svg>
);

export const StrokeNormalIcon: React.FC<IconProps> = ({
  size = 18,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    aria-hidden='true'
    focusable='false'
    role='img'
    className={className}
    style={style}
    width={size}
    height={size}
    color={color}
    viewBox='0 0 20 20'
    fill='none'
    stroke='currentColor'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path
      d='M2.5 12.563c1.655-.886 5.9-3.293 8.568-4.355 2.668-1.062.101 2.822 1.32 3.105 1.218.283 5.112-1.814 5.112-1.814m-13.469 2.23c2.963-1.586 6.13-5.62 7.468-4.998 1.338.623-1.153 4.11-.132 5.595 1.02 1.487 6.133-1.43 6.133-1.43'
      strokeWidth='1.25'
    ></path>
  </svg>
);

export const StrokeRoughIcon: React.FC<IconProps> = ({
  size = 18,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    aria-hidden='true'
    focusable='false'
    role='img'
    viewBox='0 0 20 20'
    className={className}
    style={style}
    color={color}
    width={size}
    fill='none'
    stroke='currentColor'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path
      d='M2.5 11.936c1.737-.879 8.627-5.346 10.42-5.268 1.795.078-.418 5.138.345 5.736.763.598 3.53-1.789 4.235-2.147M2.929 9.788c1.164-.519 5.47-3.28 6.987-3.114 1.519.165 1 3.827 2.121 4.109 1.122.281 3.839-2.016 4.606-2.42'
      strokeWidth='1.25'
    ></path>
  </svg>
);

export const SingleLineFillIcon: React.FC<IconProps> = ({
  size = 18,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    aria-hidden='true'
    focusable='false'
    role='img'
    viewBox='0 0 20 20'
    className={className}
    style={style}
    color={color}
    width={size}
    fill='none'
    stroke='currentColor'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path
      d='M5.879 2.625h8.242a3.254 3.254 0 0 1 3.254 3.254v8.242a3.254 3.254 0 0 1-3.254 3.254H5.88a3.254 3.254 0 0 1-3.254-3.254V5.88a3.254 3.254 0 0 1 3.254-3.254Z'
      stroke='currentColor'
      strokeWidth='1.25'
    ></path>
    <mask
      id='FillHachureIcon'
      maskUnits='userSpaceOnUse'
      x='2'
      y='2'
      width='16'
      height='16'
      style={{ maskType: 'alpha', ...style }}
    >
      <path
        d='M5.879 2.625h8.242a3.254 3.254 0 0 1 3.254 3.254v8.242a3.254 3.254 0 0 1-3.254 3.254H5.88a3.254 3.254 0 0 1-3.254-3.254V5.88a3.254 3.254 0 0 1 3.254-3.254Z'
        fill='currentColor'
        stroke='currentColor'
        strokeWidth='1.25'
      ></path>
    </mask>
    <g mask='url(#FillHachureIcon)'>
      <path
        d='M2.258 15.156 15.156 2.258M7.324 20.222 20.222 7.325m-20.444 5.35L12.675-.222m-8.157 18.34L17.416 5.22'
        stroke='currentColor'
        strokeWidth='1.25'
        strokeLinecap='round'
        strokeLinejoin='round'
      ></path>
    </g>
  </svg>
);

export const GridFillIcon: React.FC<IconProps> = ({
  size = 18,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    aria-hidden='true'
    focusable='false'
    role='img'
    viewBox='0 0 20 20'
    className={className}
    style={style}
    color={color}
    width={size}
    fill='none'
    stroke='currentColor'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <g clip-path='url(#a)'>
      <path
        d='M5.879 2.625h8.242a3.254 3.254 0 0 1 3.254 3.254v8.242a3.254 3.254 0 0 1-3.254 3.254H5.88a3.254 3.254 0 0 1-3.254-3.254V5.88a3.254 3.254 0 0 1 3.254-3.254Z'
        stroke='currentColor'
        strokeWidth='1.25'
      ></path>
      <mask
        id='FillCrossHatchIcon'
        maskUnits='userSpaceOnUse'
        x='-1'
        y='-1'
        width='22'
        height='22'
        style={{ maskType: 'alpha', ...style }}
      >
        <path
          d='M2.426 15.044 15.044 2.426M7.383 20 20 7.383M0 12.617 12.617 0m-7.98 17.941L17.256 5.324m-2.211 12.25L2.426 4.956M20 12.617 7.383 0m5.234 20L0 7.383m17.941 7.98L5.324 2.745'
          stroke='currentColor'
          strokeWidth='1.25'
          strokeLinecap='round'
          strokeLinejoin='round'
        ></path>
      </mask>
      <g mask='url(#FillCrossHatchIcon)'>
        <path
          d='M14.121 2H5.88A3.879 3.879 0 0 0 2 5.879v8.242A3.879 3.879 0 0 0 5.879 18h8.242A3.879 3.879 0 0 0 18 14.121V5.88A3.879 3.879 0 0 0 14.121 2Z'
          fill='currentColor'
        ></path>
      </g>
    </g>
    <defs>
      <clipPath id='a'>
        <path fill='#fff' d='M0 0h20v20H0z'></path>
      </clipPath>
    </defs>
  </svg>
);

export const SolidFillIcon: React.FC<IconProps> = ({
  size = 18,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    aria-hidden='true'
    focusable='false'
    role='img'
    viewBox='0 0 20 20'
    className={className}
    style={style}
    color={color}
    width={size}
    height={size}
    fill='currentColor'
    stroke='currentColor'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <g clip-path='url(#a)'>
      <path
        d='M4.91 2.625h10.18a2.284 2.284 0 0 1 2.285 2.284v10.182a2.284 2.284 0 0 1-2.284 2.284H4.909a2.284 2.284 0 0 1-2.284-2.284V4.909a2.284 2.284 0 0 1 2.284-2.284Z'
        stroke='currentColor'
        strokeWidth='1.25'
      ></path>
    </g>
    <defs>
      <clipPath id='a'>
        <path fill='#fff' d='M0 0h20v20H0z'></path>
      </clipPath>
    </defs>
  </svg>
);

export const ArrowIcon: React.FC<IconProps> = ({
  size = 18,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 20 20'
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
  size = 18,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 20 20'
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
  size = 18,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 20 20'
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
  size = 18,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 20 20'
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
  size = 18,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 20 20'
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
  size = 18,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 20 20'
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
    viewBox='0 0 20 20'
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
  size = 18,
  color = 'currentColor',
  className,
  style
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 20 20'
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
