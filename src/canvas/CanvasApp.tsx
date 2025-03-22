import React, { useState, useEffect } from 'react';
import { Canvas } from './Canvas';
import { Toolbar } from './Toolbar';
import { Device } from './types';
import {
  collaborationService,
  CollaborationSession
} from '../services/CollaborationService';

// 创建上下文
export const DeviceContext = React.createContext<Device>({
  isMobile: false,
  isTouchScreen: false
});

export const useDevice = () => React.useContext<Device>(DeviceContext);

export const CanvasApp: React.FC = () => {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight // 不再减去工具栏高度
  });

  const [device, setDevice] = useState<Device>({
    isMobile: window.innerWidth < 640,
    isTouchScreen: 'ontouchstart' in window
  });

  // 从Canvas组件获取协同会话状态和对话框打开函数
  const [collaborationSession, setCollaborationSession] = useState<
    CollaborationSession | undefined | null
  >(null);
  const [showCollaborationDialog, setShowCollaborationDialog] = useState(false);

  const handleOpenCollaborationDialog = () => {
    setShowCollaborationDialog(true);
  };

  // 获取协同会话状态的回调
  const handleCollaborationSessionChange = (session: any) => {
    setCollaborationSession(session);
  };

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight // 不再减去工具栏高度
      });
      setDevice({
        isMobile: window.innerWidth < 640,
        isTouchScreen: 'ontouchstart' in window
      });
    };

    // 添加 Ctrl+Shift+C 快捷键打开协同编辑对话框
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        // 直接调用打开对话框函数
        handleOpenCollaborationDialog();
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);

      // 组件卸载时断开连接
      if (collaborationService.isInRoom()) {
        collaborationService.leaveRoom();
      }
      if (collaborationService.isConnected()) {
        collaborationService.disconnect();
      }
    };
  }, []);

  return (
    <DeviceContext.Provider value={device}>
      <div
        style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}
      >
        <Toolbar
          onOpenCollaborationDialog={handleOpenCollaborationDialog}
          collaborationSession={collaborationSession}
        />
        <Canvas
          width={dimensions.width}
          height={dimensions.height}
          collaborationSession={collaborationSession}
          showCollaborationDialog={showCollaborationDialog}
          setShowCollaborationDialog={setShowCollaborationDialog}
          onCollaborationSessionChange={handleCollaborationSessionChange}
        />
      </div>
    </DeviceContext.Provider>
  );
};
