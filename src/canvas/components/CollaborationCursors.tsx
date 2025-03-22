import React, { useEffect, useState } from 'react';
import { CollaborationUser } from '../../services/CollaborationService';

interface CollaborationCursorsProps {
  users: CollaborationUser[];
  currentUserId: string;
  zoom: number;
  scrollX: number;
  scrollY: number;
}

export const CollaborationCursors: React.FC<CollaborationCursorsProps> = ({
  users,
  currentUserId,
  zoom,
  scrollX,
  scrollY
}) => {
  const [cursors, setCursors] = useState<CollaborationUser[]>([]);

  // 当users发生变化时更新cursors
  useEffect(() => {
    const usersWithCursors = users.filter(
      (user) => user.id !== currentUserId && user.cursor
    );
    setCursors(usersWithCursors);
  }, [users, currentUserId]);

  return (
    <>
      {cursors.map((user) => {
        if (!user.cursor) return null;

        // 计算光标在视口中的位置
        const x = user.cursor.x * zoom + scrollX;
        const y = user.cursor.y * zoom + scrollY;

        return (
          <div
            key={`cursor-${user.id}`}
            style={{
              position: 'absolute',
              left: `${x}px`,
              top: `${y}px`,
              pointerEvents: 'none',
              zIndex: 100,
              transform: 'translate(-50%, -50%)',
              transition: 'left 0.1s ease-out, top 0.1s ease-out'  
            }}
          >
            {/* 光标图形 */}
            <svg
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                d='M7 2L18 13L14 14L16 22L13 23L10 15L7 18L7 2Z'
                fill={`#${user.id.split('_')[1].substring(7)}`}
                stroke='#ffffff'
                strokeWidth='1'
              />
            </svg>

            {/* 用户名标签 */}
            <div
              style={{
                position: 'absolute',
                left: '24px',
                top: '0',
                backgroundColor: `#${user.id.split('_')[1].substring(7)}`,
                color: 'white',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '12px',
                whiteSpace: 'nowrap'
              }}
            >
              {user.username}
            </div>
          </div>
        );
      })}
    </>
  );
};
