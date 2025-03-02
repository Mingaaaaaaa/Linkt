import React, { useState, useEffect } from 'react';
import { Canvas } from './Canvas';
import { Toolbar } from './Toolbar';
import { Device } from './types';
// 创建上下文
export const DeviceContext = React.createContext<Device>({
  isMobile: false,
  isTouchScreen: false
});

export const useDevice = () => React.useContext<Device>(DeviceContext);

export const CanvasApp: React.FC = () => {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight - 60 // 减去工具栏高度
  });
  const [device, setDevice] = useState<Device>({
    isMobile: window.innerWidth < 640,
    isTouchScreen: 'ontouchstart' in window
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight - 60
      });
      setDevice({
        isMobile: window.innerWidth < 640,
        isTouchScreen: 'ontouchstart' in window
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <DeviceContext.Provider value={device}>
      <div
        style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}
      >
        <Toolbar />
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <Canvas width={dimensions.width} height={dimensions.height} />
        </div>
      </div>
    </DeviceContext.Provider>
  );
};
