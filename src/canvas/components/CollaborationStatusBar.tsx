import React, { useRef, useState } from 'react';
import { CollaborationSession } from '../../services/CollaborationService';
import { CollaboratorsList } from './CollaboratorsList';

interface CollaborationStatusBarProps {
  session: CollaborationSession | null;
  onLeaveRoom: () => void;
}

export const CollaborationStatusBar: React.FC<CollaborationStatusBarProps> = ({
  session,
  onLeaveRoom
}) => {
  const [showCollaborators, setShowCollaborators] = useState(false);
  const collaboratorsButtonRef = useRef<HTMLButtonElement>(null);

  if (!session) return null;

  const toggleCollaboratorsList = () => {
    setShowCollaborators(!showCollaborators);
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '4px',
        padding: '5px 10px',
        display: 'flex',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        zIndex: 100
      }}
    >
      <div
        style={{
          backgroundColor: '#4CAF50',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          marginRight: '8px'
        }}
      />

      <div style={{ marginRight: '15px' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
          协同编辑中: {session.roomId}
        </div>
        <div style={{ fontSize: '11px', color: '#666' }}>
          {session.connectedUsers.length} 位用户在线
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <button
          ref={collaboratorsButtonRef}
          onClick={toggleCollaboratorsList}
          style={{
            background: 'none',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '3px 8px',
            fontSize: '12px',
            marginRight: '8px',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          查看协作者
        </button>

        <CollaboratorsList
          users={session.connectedUsers}
          currentUserId={session.userId}
          triggerRef={collaboratorsButtonRef as React.RefObject<HTMLButtonElement>}
          isOpen={showCollaborators}
          onClose={() => setShowCollaborators(false)}
        />
      </div>

      <button
        onClick={onLeaveRoom}
        style={{
          background: 'none',
          border: '1px solid #f44336',
          color: '#f44336',
          borderRadius: '4px',
          padding: '3px 8px',
          fontSize: '12px',
          cursor: 'pointer'
        }}
      >
        退出
      </button>
    </div>
  );
};
