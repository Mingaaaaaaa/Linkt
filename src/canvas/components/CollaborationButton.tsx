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
            <circle cx='12' cy='7' r='4' />
            <path d='M3 21v-2a4 4 0 0 1 4-4h14a4 4 0 0 1 4 4v2' />
          </>
        )}
      </svg>
      {collaborationSession
        ? `已连接 (${collaborationSession.connectedUsers.length})`
        : '协同编辑'}
    </button>
  );
};
