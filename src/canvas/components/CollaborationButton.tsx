import React from 'react';
import { CollaborationSession } from '../../services/CollaborationService';

interface CollaborationButtonProps {
  onOpenDialog?: () => void;
  collaborationSession?: CollaborationSession | null;
}

export const CollaborationButton: React.FC<CollaborationButtonProps> = ({
  onOpenDialog,
  collaborationSession
}) => {
  return (
    <button
      id='collaboration-button'
      onClick={onOpenDialog}
      style={{
        padding: '8px 12px',
        margin: ' 8px 30px',
        backgroundColor: collaborationSession ? '#4CAF50' : '#2196F3',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        fontSize: '14px'
      }}
    >
      <svg
        width='16'
        height='16'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
        style={{ marginRight: '5px' }}
      >
        {collaborationSession ? (
          // 已连接图标 - 勾号
          <path d='M20 6L9 17l-5-5' />
        ) : (
          // 未连接图标 - 用户组
          <>
            <svg
              aria-hidden='true'
              focusable='false'
              role='img'
              viewBox='0 0 24 24'
              fill='none'
              stroke-width='4'
              stroke='currentColor'
              stroke-linecap='round'
              stroke-linejoin='round'
            >
              <g stroke-width='2'>
                <path stroke='none' d='M0 0h24v24H0z' fill='none'></path>
                <circle cx='9' cy='7' r='4'></circle>
                <path d='M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2'></path>
                <path d='M16 3.13a4 4 0 0 1 0 7.75'></path>
                <path d='M21 21v-2a4 4 0 0 0 -3 -3.85'></path>
              </g>
            </svg>
          </>
        )}
      </svg>
      {collaborationSession
        ? `已连接 (${collaborationSession.connectedUsers.length})`
        : '协同编辑'}
    </button>
  );
};
