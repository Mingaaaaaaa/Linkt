import React from 'react';
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
  return (
    <>
      {users.map((user) => {
        // 不显示当前用户的光标
        if (user.id === currentUserId || !user.cursor) {
          return null;
        }

        const { x, y } = user.cursor;
        const cursorX = x * zoom + scrollX;
        const cursorY = y * zoom + scrollY;

        return (
          <div
            key={user.id}
            style={{
              position: 'absolute',
              left: `${cursorX}px`,
              top: `${cursorY}px`,
              zIndex: 1000,
              pointerEvents: 'none', // 确保光标不会阻挡用户交互
              transition: 'transform 0.1s ease' // 平滑光标移动
            }}
          >
            {/* 光标图标 */}
            <svg
              width='16'
              height='16'
              viewBox='0 0 16 16'
              fill={user.color}
              style={{
                transform: 'translate(-2px, -2px)',
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.25))'
              }}
            >
              <polygon points='0,0 8,14 10,8 16,8' />
            </svg>

            {/* 用户名气泡 */}
            <div
              style={{
                backgroundColor: user.color,
                color: '#fff',
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '12px',
                marginTop: '3px',
                whiteSpace: 'nowrap',
                maxWidth: '150px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
              }}
            >
              {user.name}
            </div>
          </div>
        );
      })}
    </>
  );
};
