import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
}

export const PaletteIcon: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor'
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke={color}
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <circle cx='13.5' cy='6.5' r='2.5' />
    <circle cx='17.5' cy='10.5' r='2.5' />
    <circle cx='8.5' cy='7.5' r='2.5' />
    <circle cx='6.5' cy='12.5' r='2.5' />
    <path d='M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z' />
  </svg>
);

export const ExportIcon: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor'
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke={color}
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
    <polyline points='7 10 12 15 17 10' />
    <line x1='12' y1='15' x2='12' y2='3' />
  </svg>
);

export const ImportIcon: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor'
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke={color}
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' />
    <polyline points='17 8 12 3 7 8' />
    <line x1='12' y1='3' x2='12' y2='15' />
  </svg>
);

export const GridIcon: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor'
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke={color}
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <rect x='3' y='3' width='18' height='18' rx='2' ry='2' />
    <line x1='3' y1='9' x2='21' y2='9' />
    <line x1='3' y1='15' x2='21' y2='15' />
    <line x1='9' y1='3' x2='9' y2='21' />
    <line x1='15' y1='3' x2='15' y2='21' />
  </svg>
);

export const GithubIcon: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor'
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke={color}
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22' />
  </svg>
);

export const ScaleIcon: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor'
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke={color}
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <line x1='4' y1='20' x2='20' y2='20' />
    <line x1='6' y1='16' x2='6' y2='20' />
    <line x1='12' y1='16' x2='12' y2='20' />
    <line x1='18' y1='16' x2='18' y2='20' />
    <polyline points='6 14 12 8 18 14' />
  </svg>
);

export const SaveIcon: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor'
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke={color}
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z' />
    <polyline points='17 21 17 13 7 13 7 21' />
    <polyline points='7 3 7 8 15 8' />
  </svg>
);

export const SettingsIcon: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor'
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke={color}
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <circle cx='12' cy='12' r='3' />
    <path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z' />
  </svg>
);

export const HelpIcon: React.FC<IconProps> = ({
  size = 24,
  color = 'currentColor'
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke={color}
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <circle cx='12' cy='12' r='10' />
    <path d='M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3' />
    <line x1='12' y1='17' x2='12.01' y2='17' />
  </svg>
);
