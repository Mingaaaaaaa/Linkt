import React, { useRef, useEffect } from 'react';
import { CollaborationUser } from '../../services/CollaborationService';

interface CollaboratorsListProps {
  users: CollaborationUser[];
  currentUserId: string;
  triggerRef: React.RefObject<HTMLButtonElement>; // 添加触发按钮的引用
  isOpen: boolean;
  onClose: () => void;
}

export const CollaboratorsList: React.FC<CollaboratorsListProps> = ({
  users,
  currentUserId,
  triggerRef,
  isOpen,
  onClose
}) => {
  const popupRef = useRef<HTMLDivElement>(null);

  // 处理点击外部关闭弹出窗口
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={popupRef}
      style={{
        position: 'absolute',
        bottom: '100%', // 定位在触发按钮上方
        left: '50%',
        transform: 'translateX(-50%)',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
        width: '250px',
        marginBottom: '10px',
        zIndex: 1000,
        animation: 'slideUp 0.2s ease-out',
        maxHeight: '300px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{ overflow: 'auto', maxHeight: '250px' }}>
        {users.map((user) => (
          <div
            key={user.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 15px',
              borderBottom: '1px solid #f5f5f5',
              backgroundColor:
                user.id === currentUserId ? '#f5f9ff' : 'transparent'
            }}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                marginRight: '10px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: `#${user.id.split('_')[1].substring(7)}`,
                color: 'white',
                fontWeight: 'bold',
                fontSize: '12px'
              }}
            >
              {user.username.charAt(0).toUpperCase()}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', fontSize: '13px' }}>
                {user.username}
                {user.id === currentUserId && (
                  <span
                    style={{
                      marginLeft: '5px',
                      fontSize: '11px',
                      color: '#888',
                    }}
                  >
                    (你)
                  </span>
                )}
              </div>
            </div>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#4CAF50'
              }}
            />
          </div>
        ))}
      </div>

      {/* 添加一个小三角形作为指示器，指向触发按钮 */}
      <div
        style={{
          position: 'absolute',
          bottom: '-5px',
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
          width: '10px',
          height: '10px',
          backgroundColor: 'white',
          boxShadow: '2px 2px 3px rgba(0, 0, 0, 0.05)',
          zIndex: -1
        }}
      />

      <style>
        {`
          @keyframes slideUp {
            from {
              transform: translate(-50%, 10px);
              opacity: 0;
            }
            to {
              transform: translate(-50%, 0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
};
