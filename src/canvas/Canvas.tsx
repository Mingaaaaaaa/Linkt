import React, { useEffect, useRef, useState } from 'react';
import { Renderer } from './Renderer';
import { useCanvasStore } from '../store/';
import {
  PointerCoords,
  ExcalidrawElement,
  ExcalidrawTextElement,
  NonDeletedExcalidrawElement
} from './types';

import {
  useKeyboardShortcuts,
  useTextEditor,
  useElementCreation,
  useElementInteraction,
  useCanvasGestures
} from './hooks';

import {
  SelectionOverlay,
  TextEditor,
  StylePanel,
  ScaleRuler,
  CollaborationDialog,
  CollaborationCursors,
  CollaborationStatusBar
} from './components';

import {
  collaborationService,
  CollaborationEvent,
  CollaborationSession
} from '../services/CollaborationService';

import {
  createArrow,
  createEllipse,
  createLine,
  createRectangle,
  createText
} from './ElementUtils';

import { getScenePointerCoords } from './utils/coordinateUtils';

interface CanvasProps {
  width: number;
  height: number;
  showCollaborationDialog?: boolean;
  collaborationSession?: CollaborationSession | null;
  setShowCollaborationDialog: (show: boolean) => void;
  onCollaborationSessionChange: (
    session: CollaborationSession | null | undefined
  ) => void;
}

export const Canvas: React.FC<CanvasProps> = ({
  width,
  height,
  showCollaborationDialog,
  collaborationSession,
  setShowCollaborationDialog,
  onCollaborationSessionChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // 添加协同编辑相关状态
  const lastCursorPositionRef = useRef<PointerCoords | null>(null);
  const throttleTimeoutRef = useRef<any>(null);

  // Zustand store hooks
  const currentTool = useCanvasStore((state) => state.currentTool);
  const setCurrentTool = useCanvasStore((state) => state.setCurrentTool);
  const selectedElementIds = useCanvasStore(
    (state) => state.selectedElementIds
  );
  const setSelectedElementIds = useCanvasStore(
    (state) => state.setSelectedElementIds
  );
  const viewBackgroundColor = useCanvasStore(
    (state) => state.viewBackgroundColor
  );
  const zoom = useCanvasStore((state) => state.zoom);
  const scrollX = useCanvasStore((state) => state.scrollX);
  const scrollY = useCanvasStore((state) => state.scrollY);
  const setScrollPosition = useCanvasStore((state) => state.setScrollPosition);
  const setZoom = useCanvasStore((state) => state.setZoom);
  const addElement = useCanvasStore((state) => state.addElement);
  const updateElement = useCanvasStore((state) => state.updateElement);
  const deleteElement = useCanvasStore((state) => state.deleteElement);
  const getNonDeletedElements = useCanvasStore(
    (state) => state.getNonDeletedElements
  );
  const getElements = useCanvasStore((state) => state.getElements);
  const appstate = useCanvasStore((state) => state);
  const elements = useCanvasStore((state) => state.elements);

  // 获取撤销和重做函数
  const undo = useCanvasStore((state) => state.undo);
  const redo = useCanvasStore((state) => state.redo);
  const startRecordingHistory = useCanvasStore(
    (state) => state.startRecordingHistory
  );
  const stopRecordingHistory = useCanvasStore(
    (state) => state.stopRecordingHistory
  );

  // 在相关状态导入处添加 showGrid
  const showGrid = useCanvasStore((state) => state.showGrid);

  // 添加比例尺相关状态
  const showRulers = useCanvasStore((state) => state.showRulers);
  const rulerUnit = useCanvasStore((state) => state.rulerUnit);

  // 手动触发渲染函数
  const forceRender = () => {
    if (rendererRef.current) {
      try {
        const elements = getNonDeletedElements();
        const appState = {
          viewBackgroundColor,
          zoom,
          offsetLeft: 0,
          offsetTop: 0,
          width,
          height,
          selectedElementIds,
          scrollX,
          scrollY,
          currentTool,
          gridSize: 20,
          showGrid, // 添加网格显示状态
          showRulers,
          rulerUnit
        };
        rendererRef.current.render(elements, appState);
      } catch (error) {
        console.error('强制渲染时出错:', error);
      }
    }
  };

  // 创建来源标记，用于区分本地和远程操作
  const UPDATE_SOURCE = {
    LOCAL: 'local',
    REMOTE: 'remote'
  };

  // 创建带协同功能的操作函数，增加操作来源标记
  const handleAddElementWithCollaboration = (
    element: any,
    source = UPDATE_SOURCE.LOCAL
  ) => {
    // 确保元素有版本和时间戳
    if (!element.version) {
      element.version = 1;
    }
    if (!element.lastModified) {
      element.lastModified = Date.now();
    }

    // 只有本地操作才需要记录历史和发送到服务器
    if (source === UPDATE_SOURCE.LOCAL) {
      // 添加元素是离散操作，直接记录历史
      addElement(element);
      if (collaborationSession && collaborationSession.isConnected) {
        collaborationService.addElement(element);
      }
    } else {
      // 远程操作直接应用，不记录历史
      const { scene } = useCanvasStore.getState();
      const elementWithVersion = {
        ...element,
        version: element.version || 1,
        lastModified: element.lastModified || Date.now()
      };
      scene.addElement(elementWithVersion);
      useCanvasStore.setState({
        scene: scene,
        elements: [...scene.getElements()]
      });
    }
  };

  const handleUpdateElementWithCollaboration = (
    elementId: string,
    updates: any,
    source = UPDATE_SOURCE.LOCAL
  ) => {
    // 获取当前元素
    const currentElement = useCanvasStore
      .getState()
      .scene.getElementById(elementId);

    // 如果元素存在，记录原始版本号用于冲突检测
    if (currentElement && source === UPDATE_SOURCE.LOCAL) {
      updates = {
        ...updates,
        originalVersion: currentElement.version || 1,
        version: (currentElement.version || 1) + 1,
        lastModified: Date.now()
      };
    }

    // 只有本地操作才需要记录历史和发送到服务器
    if (source === UPDATE_SOURCE.LOCAL) {
      updateElement(elementId, updates);
      if (collaborationSession && collaborationSession.isConnected) {
        collaborationService.updateElement(elementId, updates);
      }
    } else {
      // 远程操作直接应用，不记录历史
      const { scene } = useCanvasStore.getState();
      const element = scene.getElementById(elementId);
      if (element) {
        scene.updateElement(elementId, { ...element, ...updates });
      } else {
        scene.updateElement(elementId, updates);
      }
      useCanvasStore.setState({
        scene: scene,
        elements: [...scene.getElements()]
      });
    }
  };

  const handleDeleteElementWithCollaboration = (
    elementId: string,
    source = UPDATE_SOURCE.LOCAL
  ) => {
    // 只有本地操作才需要记录历史和发送到服务器
    if (source === UPDATE_SOURCE.LOCAL) {
      deleteElement(elementId);
      if (collaborationSession && collaborationSession.isConnected) {
        collaborationService.deleteElement(elementId);
      }
    } else {
      // 远程操作直接应用，不记录历史
      const { scene } = useCanvasStore.getState();
      scene.deleteElement(elementId);
      useCanvasStore.setState({
        scene: scene,
        elements: [...scene.getElements()]
      });
    }
  };

  const {
    editingText,
    setEditingText,
    handleTextInputChange,
    handleTextInputBlur,
    handleTextInputKeyDown
  } = useTextEditor(updateElement, forceRender);

  const {
    dragInfo,
    setDragInfo,
    resizeInfo,
    setResizeInfo,
    selectionBox,
    setSelectionBox,
    handleEraserMouseDown: originalHandleEraserMouseDown,
    handleElementDrag,
    handleElementResize,
    updateSelectionBox
  } = useElementInteraction(
    handleUpdateElementWithCollaboration,
    handleDeleteElementWithCollaboration,
    getNonDeletedElements,
    forceRender
  );

  // 覆盖橡皮擦处理函数，支持协同
  const handleEraserMouseDown = (sceneCoords: PointerCoords) => {
    originalHandleEraserMouseDown(sceneCoords);
  };

  const {
    freeDrawing,
    startFreeDrawing,
    updateFreeDrawing,
    finishFreeDrawing
  } = useElementCreation(
    handleAddElementWithCollaboration,
    handleUpdateElementWithCollaboration,
    setSelectedElementIds,
    forceRender
  );

  const { panInfo, setPanInfo, handlePan, handleZoom } = useCanvasGestures(
    setZoom,
    setScrollPosition
  );

  // 使用键盘快捷键
  useKeyboardShortcuts({
    selectedElementIds,
    deleteElement: handleDeleteElementWithCollaboration,
    setSelectedElementIds,
    editingText: !!editingText,
    isSpacePressed,
    setIsSpacePressed,
    currentTool,
    setCurrentTool,
    undo,
    redo,
    getElements,
    addElement,
    getCanvasCoordinates: (clientX, clientY) =>
      getScenePointerCoords(
        clientX,
        clientY,
        canvasRef,
        scrollX,
        scrollY,
        zoom.value
      )
  });

  // 添加样式面板状态
  const [showStylePanel, setShowStylePanel] = useState(false);

  // 获取当前选中的元素
  const selectedElements = getNonDeletedElements().filter(
    (element) => selectedElementIds[element.id]
  );

  // 关闭样式面板
  const handleCloseStylePanel = () => {
    setShowStylePanel(false);
  };

  // 修改处理元素选择的逻辑，当元素被选中时显示样式面板
  useEffect(() => {
    if (Object.keys(selectedElementIds).length > 0) {
      setShowStylePanel(true);
    } else {
      setShowStylePanel(false);
    }
  }, [selectedElementIds]);

  // 完善协同编辑事件监听
  useEffect(() => {
    // 存储上次处理的操作时间戳，用于防止重复处理
    const lastProcessedOperations = {
      update: new Map<string, number>(),
      add: new Map<string, number>(),
      delete: new Map<string, number>()
    };

    // 元素更新事件处理优化
    const handleElementUpdate = (data: {
      elementId: string;
      updates: any;
      userId: string;
      timestamp?: number;
      version?: number;
    }) => {
      // 忽略自己发出的更新
      if (collaborationSession && data.userId === collaborationSession.userId) {
        return;
      }

      // 检查是否已处理过该操作（防止在不同连接收到重复消息）
      const operationKey = `${data.userId}-${data.elementId}-${
        data.timestamp || Date.now()
      }`;
      const lastTimestamp =
        lastProcessedOperations.update.get(operationKey) || 0;
      const currentTimestamp = data.timestamp || Date.now();

      if (currentTimestamp <= lastTimestamp) {
        console.log('忽略重复或过期的元素更新');
        return;
      }

      // 更新处理时间戳
      lastProcessedOperations.update.set(operationKey, currentTimestamp);

      // 冲突处理: 检查本地元素的版本和时间戳
      const localElement = useCanvasStore
        .getState()
        .scene.getElementById(data.elementId);

      if (localElement) {
        const localVersion = localElement.version || 1;
        const localTimestamp = localElement.lastModified || 0;
        const remoteVersion = data.updates.version || data.version || 1;
        const remoteTimestamp = data.timestamp || Date.now();

        // 检查是否存在冲突(本地也有修改)
        if (localVersion !== (data.updates.originalVersion || 1)) {
          console.log('冲突检测:', {
            localVersion,
            localTimestamp,
            remoteVersion,
            remoteTimestamp
          });
          // 优先使用版本号较大的更改
          if (remoteVersion > localVersion) {
            console.log('采用远程版本(版本号更高)');
            handleUpdateElementWithCollaboration(
              data.elementId,
              data.updates,
              UPDATE_SOURCE.REMOTE
            );
          } else if (remoteVersion < localVersion) {
            console.log('保留本地版本(版本号更高)');
            // 但发送我们的版本到远程，确保同步
            collaborationService.updateElement(data.elementId, localElement);
          } else {
            // 版本号相同，使用时间戳决定
            if (remoteTimestamp > localTimestamp) {
              console.log('采用远程版本(时间戳更新)');
              handleUpdateElementWithCollaboration(
                data.elementId,
                data.updates,
                UPDATE_SOURCE.REMOTE
              );
            } else {
              console.log('保留本地版本(时间戳更新)');
              collaborationService.updateElement(data.elementId, localElement);
            }
          }
        } else {
          // 没有冲突，直接应用远程更新
          handleUpdateElementWithCollaboration(
            data.elementId,
            data.updates,
            UPDATE_SOURCE.REMOTE
          );
        }
      } else {
        // 本地不存在此元素，直接应用远程更新
        handleUpdateElementWithCollaboration(
          data.elementId,
          data.updates,
          UPDATE_SOURCE.REMOTE
        );
      }

      requestAnimationFrame(forceRender);
    };

    // 添加元素事件处理
    const handleElementAdd = (data: {
      element: any;
      userId: string;
      timestamp?: number;
    }) => {
      // 忽略自己发出的添加
      if (collaborationSession && data.userId === collaborationSession.userId) {
        return;
      }

      // 检查是否已处理过该操作
      const operationKey = `${data.userId}-${data.element.id}`;
      const lastTimestamp = lastProcessedOperations.add.get(operationKey) || 0;
      const currentTimestamp = data.timestamp || Date.now();

      if (currentTimestamp <= lastTimestamp) {
        console.log('忽略重复或过期的元素添加');
        return;
      }

      // 更新处理时间戳
      lastProcessedOperations.add.set(operationKey, currentTimestamp);

      console.log('应用远程元素添加:', data);

      // 使用标记为远程来源的方法应用添加
      handleAddElementWithCollaboration(data.element, UPDATE_SOURCE.REMOTE);

      requestAnimationFrame(forceRender);
    };

    // 删除元素事件处理优化
    const handleElementDelete = (data: {
      elementId: string;
      userId: string;
      timestamp?: number;
    }) => {
      // 忽略自己发出的删除
      if (collaborationSession && data.userId === collaborationSession.userId) {
        return;
      }

      // 检查是否已处理过该操作
      const operationKey = `${data.userId}-${data.elementId}-${
        data.timestamp || Date.now()
      }`;
      const lastTimestamp =
        lastProcessedOperations.delete.get(operationKey) || 0;
      const currentTimestamp = data.timestamp || Date.now();

      if (currentTimestamp <= lastTimestamp) {
        console.log('忽略重复或过期的元素删除');
        return;
      }

      // 更新处理时间戳
      lastProcessedOperations.delete.set(operationKey, currentTimestamp);

      console.log('接收到远程元素删除:', data);

      // 使用标记为远程来源的方法应用删除
      handleDeleteElementWithCollaboration(
        data.elementId,
        UPDATE_SOURCE.REMOTE
      );

      // 触发重新渲染
      requestAnimationFrame(forceRender);
    };

    // 场景同步事件处理
    const handleSceneSync = (data: {
      elements: any[];
      appState: any;
      userId: string;
    }) => {
      // 忽略自己发出的同步
      if (collaborationSession && data.userId === collaborationSession.userId) {
        return;
      }

      console.log('收到场景同步:', data);
      // 替换所有元素
      const store = useCanvasStore.getState();
      if (store.replaceAllElements) {
        store.replaceAllElements(data.elements);
      }

      // 更新应用状态（如果需要）
      if (data.appState) {
        if (data.appState.zoom) {
          setZoom(data.appState.zoom.value);
        }
        if (
          data.appState.scrollX !== undefined &&
          data.appState.scrollY !== undefined
        ) {
          setScrollPosition(data.appState.scrollX, data.appState.scrollY);
        }
      }

      requestAnimationFrame(forceRender);
    };

    // 用户加入事件处理
    const handleUserJoin = (data: { user: any; users: any[] }) => {
      console.log('用户加入:', data);
      if (collaborationSession && onCollaborationSessionChange) {
        // 更新会话中的用户列表
        const updatedSession = {
          ...collaborationSession,
          connectedUsers: data.users
        };
        onCollaborationSessionChange(updatedSession);
      }
    };

    // 用户离开事件处理
    const handleUserLeave = (data: { userId: string; users: any[] }) => {
      console.log('用户离开:', data);
      if (collaborationSession && onCollaborationSessionChange) {
        // 更新会话中的用户列表
        const updatedSession = {
          ...collaborationSession,
          connectedUsers: data.users
        };
        onCollaborationSessionChange(updatedSession);
      }
    };

    // 房间状态更新事件处理
    const handleRoomStatusUpdate = (data: { roomId: string; users: any[] }) => {
      console.log('收到房间状态更新:', data);
      if (
        collaborationSession &&
        onCollaborationSessionChange &&
        collaborationSession.roomId === data.roomId
      ) {
        // 更新会话中的用户列表
        const updatedSession = {
          ...collaborationSession,
          connectedUsers: data.users
        };
        onCollaborationSessionChange(updatedSession);
      }
    };

    // 处理其他用户的光标位置
    const updateOtherCursor = (data: {
      userId: string;
      x: number;
      y: number;
    }) => {
      if (!collaborationSession) return;

      // 创建一个新的会话对象副本
      const newSession = { ...collaborationSession };
      const users = [...newSession.connectedUsers];

      // 查找并更新用户
      const userIndex = users.findIndex((user) => user.id === data.userId);
      if (userIndex === -1) return;

      // 创建新对象以确保引用变化
      const updatedUser = { ...users[userIndex] };
      updatedUser.cursor = { x: data.x, y: data.y };
      users[userIndex] = updatedUser;

      // 更新整个用户数组
      newSession.connectedUsers = users;

      // 更新状态，触发重新渲染
      onCollaborationSessionChange(newSession);
    };

    // 注册事件监听
    collaborationService.on(
      CollaborationEvent.UPDATE_ELEMENT,
      handleElementUpdate
    );
    collaborationService.on(
      CollaborationEvent.DELETE_ELEMENT,
      handleElementDelete
    );
    collaborationService.on(CollaborationEvent.ADD_ELEMENT, handleElementAdd);
    collaborationService.on(CollaborationEvent.SYNC_SCENE, handleSceneSync);
    collaborationService.on(CollaborationEvent.USER_JOIN, handleUserJoin);
    collaborationService.on(CollaborationEvent.USER_LEAVE, handleUserLeave);
    collaborationService.on(
      CollaborationEvent.ROOM_STATUS_UPDATE,
      handleRoomStatusUpdate
    );
    collaborationService.on(
      CollaborationEvent.CURSOR_POSITION,
      updateOtherCursor
    );

    // 清理函数
    return () => {
      collaborationService.off(
        CollaborationEvent.UPDATE_ELEMENT,
        handleElementUpdate
      );
      collaborationService.off(
        CollaborationEvent.DELETE_ELEMENT,
        handleElementDelete
      );
      collaborationService.off(
        CollaborationEvent.ADD_ELEMENT,
        handleElementAdd
      );
      collaborationService.off(CollaborationEvent.SYNC_SCENE, handleSceneSync);
      collaborationService.off(CollaborationEvent.USER_JOIN, handleUserJoin);
      collaborationService.off(CollaborationEvent.USER_LEAVE, handleUserLeave);
      collaborationService.off(
        CollaborationEvent.ROOM_STATUS_UPDATE,
        handleRoomStatusUpdate
      );
      collaborationService.off(
        CollaborationEvent.CURSOR_POSITION,
        updateOtherCursor
      );
    };
  }, [
    collaborationSession,
    addElement,
    updateElement,
    deleteElement,
    setZoom,
    setScrollPosition,
    forceRender,
    onCollaborationSessionChange
  ]);

  // 修改定期发送光标位置的逻辑，提高更新频率
  useEffect(() => {
    if (!collaborationSession || !collaborationSession.isConnected) return;

    // 当有其他用户在房间时才发送光标位置
    if (collaborationSession.connectedUsers.length <= 1) return;

    const sendCursorPosition = () => {
      try {
        if (lastCursorPositionRef.current) {
          collaborationService.updateCursorPosition(
            lastCursorPositionRef.current.x,
            lastCursorPositionRef.current.y
          );
        }
      } catch (error) {
        console.error('发送光标位置时发生错误:', error);
      }
    };

    // 提高发送频率到300ms，平衡网络负载和响应速度
    const intervalId = setInterval(sendCursorPosition, 300);

    return () => {
      clearInterval(intervalId);
    };
  }, [collaborationSession]);

  // 添加混合同步策略
  useEffect(() => {
    // 设定定期全量同步的间隔（比如每30秒）
    const syncInterval = 30000;
    let lastSyncTime = Date.now();

    // 定期全量同步
    const periodicSync = setInterval(() => {
      if (collaborationSession && collaborationSession.isConnected) {
        // 只有当有其他用户在房间时才进行同步
        if (collaborationSession.connectedUsers.length > 1) {
          const elements = [...getElements()];
          const appState = {
            zoom: zoom,
            scrollX: scrollX,
            scrollY: scrollY,
            viewBackgroundColor: viewBackgroundColor
          };
          collaborationService.syncScene(elements, appState);
          lastSyncTime = Date.now();
        }
      }
    }, syncInterval);

    return () => {
      clearInterval(periodicSync);
    };
  }, [
    collaborationSession,
    getElements,
    zoom,
    scrollX,
    scrollY,
    viewBackgroundColor
  ]);

  // 初始化渲染器和示例元素
  useEffect(() => {
    if (canvasRef.current && !initialized) {
      rendererRef.current = new Renderer(canvasRef.current);

      try {
        // 检查是否已有元素，如果没有才添加示例元素
        const existingElements = getElements();

        if (!existingElements || existingElements.length === 0) {
          // 添加一些示例元素
          const rect = createRectangle(100, 100, 200, 100, {
            strokeColor: '#1864ab',
            backgroundColor: '#a5d8ff',
            roughness: 2,
            seed: Math.floor(Math.random() * 2000)
          });

          const ellipse = createEllipse(400, 100, 150, 100, {
            strokeColor: '#e67700',
            backgroundColor: '#ffec99',
            roughness: 2,
            seed: Math.floor(Math.random() * 2000)
          });

          const line = createLine(100, 300, 300, 0, {
            strokeColor: '#c92a2a',
            strokeWidth: 2,
            roughness: 1,
            seed: Math.floor(Math.random() * 2000)
          });

          const arrow = createArrow(400, 200, 200, 100, {
            strokeColor: '#2b8a3e',
            strokeWidth: 2,
            roughness: 1,
            seed: Math.floor(Math.random() * 2000)
          });

          const text = createText(400, 300, 200, 50, {
            strokeColor: '#2b8a3e',
            seed: Math.floor(Math.random() * 2000)
          });

          // 添加元素到 store
          addElement(rect);
          addElement(ellipse);
          addElement(line);
          addElement(arrow);
          addElement(text);
          requestAnimationFrame(forceRender);
        }
      } catch (error) {
        console.error('初始化元素时出错:', error);
      }

      setInitialized(true);
    }
  }, [canvasRef, initialized, addElement, getElements]);

  // 当场景或状态变化时重新渲染
  useEffect(() => {
    if (rendererRef.current && !editingText) {
      try {
        const elements = getNonDeletedElements();
        const appState = {
          viewBackgroundColor,
          zoom,
          offsetLeft: 0,
          offsetTop: 0,
          width,
          height,
          selectedElementIds,
          scrollX,
          scrollY,
          currentTool,
          gridSize: 20, // 网格大小
          showGrid, // 添加网格显示状态
          showRulers,
          rulerUnit
        };
        rendererRef.current.render(elements, appState);
      } catch (error) {
        console.error('渲染元素时出错:', error);
      }
    }
  }, [
    getNonDeletedElements,
    viewBackgroundColor,
    zoom,
    width,
    height,
    selectedElementIds,
    scrollX,
    scrollY,
    currentTool,
    elements,
    editingText,
    showGrid, // 添加到依赖数组中
    showRulers,
    rulerUnit
  ]);

  // 处理窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        requestAnimationFrame(forceRender);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width, height]);

  const handleCloseCollaborationDialog = () => {
    setShowCollaborationDialog(false);
  };

  const handleJoinRoom = (session: CollaborationSession) => {
    onCollaborationSessionChange(session);
    setShowCollaborationDialog(false);

    // 加入房间后立即同步当前场景
    const elements = [...getElements()];
    const appState = {
      zoom: zoom,
      scrollX: scrollX,
      scrollY: scrollY,
      viewBackgroundColor: viewBackgroundColor
    };
    collaborationService.syncScene(elements, appState);
  };

  const handleLeaveRoom = () => {
    collaborationService.leaveRoom();
    onCollaborationSessionChange(null);
  };

  // 修改 handleMouseMove 函数，确保光标位置实时更新
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (editingText) return;

    const { clientX, clientY } = e;
    const sceneCoords = getScenePointerCoords(
      clientX,
      clientY,
      canvasRef,
      scrollX,
      scrollY,
      zoom.value
    );

    // 保存光标位置，用于协同编辑
    lastCursorPositionRef.current = sceneCoords;

    // 如果有其他人在房间，且距离上次发送已超过100ms，立即发送位置更新
    if (
      collaborationSession &&
      collaborationSession.connectedUsers.length > 1 &&
      !throttleTimeoutRef.current
    ) {
      throttleTimeoutRef.current = setTimeout(() => {
        throttleTimeoutRef.current = null;
        if (lastCursorPositionRef.current) {
          collaborationService.updateCursorPosition(
            lastCursorPositionRef.current.x,
            lastCursorPositionRef.current.y
          );
        }
      }, 100);
    }

    // 处理自由绘制更新 - 提高优先级
    if (freeDrawing && currentTool === 'freeDraw') {
      updateFreeDrawing(sceneCoords);
      return;
    }

    if (panInfo) {
      handlePan(clientX, clientY, scrollX, scrollY);
      return;
    }

    if (dragInfo) {
      handleElementDrag(sceneCoords, dragInfo);
      return;
    }

    if (resizeInfo) {
      handleElementResize(sceneCoords, resizeInfo);
      return;
    }

    if (selectionBox) {
      updateSelectionBox(sceneCoords, selectionBox);
    }
  };

  // 组件卸载时断开连接
  useEffect(() => {
    return () => {
      if (collaborationService.isInRoom()) {
        collaborationService.leaveRoom();
      }
    };
  }, []);

  // 处理鼠标滚轮缩放
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (editingText) return;

    const isZooming = e.ctrlKey || e.metaKey;

    // Retrieve canvas bounding rect only once
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const { clientX, clientY, deltaX, deltaY } = e;
    const { left, top } = rect;

    const x = clientX - left;
    const y = clientY - top;

    if (isZooming) {
      e.preventDefault();

      // Zoom calculation with clamping
      const zoomFactor = 0.1;
      const direction = Math.sign(deltaY);
      const currentZoom = zoom.value;
      const newZoom = Math.min(
        10,
        Math.max(0.1, currentZoom * (1 - direction * zoomFactor))
      );

      if (newZoom === currentZoom) return; // Skip redundant updates

      // Calculate scene position relative to mouse pointer
      const sceneX = (x - scrollX) / currentZoom;
      const sceneY = (y - scrollY) / currentZoom;

      // Adjust scroll to keep mouse position stable
      const newScrollX = scrollX + (sceneX - (x - scrollX) / newZoom) * newZoom;
      const newScrollY = scrollY + (sceneY - (y - scrollY) / newZoom) * newZoom;

      setZoom(newZoom);
      setScrollPosition(newScrollX, newScrollY);
    } else {
      setScrollPosition(scrollX - deltaX, scrollY - deltaY);
    }
  };

  // 处理鼠标按下事件
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // 如果正在编辑文本，则不处理鼠标事件
    if (editingText) {
      return;
    }

    const { clientX, clientY } = e;
    const sceneCoords = getScenePointerCoords(
      clientX,
      clientY,
      canvasRef,
      scrollX,
      scrollY,
      zoom.value
    );

    // 如果是空格键按下、中键按下或者当前工具是手形工具，则开始平移
    if (
      isSpacePressed ||
      e.buttons === 4 ||
      e.button === 1 ||
      currentTool === 'hand'
    ) {
      setPanInfo({
        startX: clientX,
        startY: clientY,
        startScrollX: scrollX,
        startScrollY: scrollY
      });
      return;
    }

    // 获取所有元素和当前选中的元素
    const elements = getNonDeletedElements();
    const selectedElementIds = appstate.selectedElementIds;
    const selectedElementsArray = elements.filter(
      (element) => selectedElementIds[element.id]
    );

    // 检查是否点击了拉伸点（只适用于单元素选择）
    if (rendererRef.current && selectedElementsArray.length === 1) {
      const selectedElement = selectedElementsArray[0];
      const resizeHandle = rendererRef.current.getResizeHandleAtPosition(
        selectedElement,
        sceneCoords.x,
        sceneCoords.y,
        zoom.value
      );

      if (resizeHandle) {
        // 开始拉伸操作
        setResizeInfo({
          element: selectedElement,
          handle: resizeHandle,
          originalElement: { ...selectedElement },
          originalMouseX: sceneCoords.x,
          originalMouseY: sceneCoords.y
        });
        // 开始记录历史
        startRecordingHistory();
        return;
      }
    }

    // 判断是否有元素被选中
    const hasSelectedElements = selectedElementsArray.length > 0;

    // 检查点击是否在任何选中的元素内部
    const isClickInsideSelectedElement = selectedElementsArray.some(
      (element) =>
        sceneCoords.x >= element.x &&
        sceneCoords.x <= element.x + element.width &&
        sceneCoords.y >= element.y &&
        sceneCoords.y <= element.y + element.height
    );

    // 如果有选中的元素且当前工具是选择工具
    if (hasSelectedElements && (currentTool === 'selection' || !currentTool)) {
      // 如果点击在选中元素内部，开始拖动操作
      if (isClickInsideSelectedElement) {
        setDragInfo({
          elementIds: selectedElementsArray.map((el) => el.id),
          startX: sceneCoords.x,
          startY: sceneCoords.y,
          originalElements: selectedElementsArray.map((el) => ({ ...el }))
        });
        // 开始记录历史
        startRecordingHistory();
        return;
      }

      // 点击在选区外部，清除选择并开始新的选择
      // 但仅当点击非元素区域或按下Shift键时
      if (!e.shiftKey) {
        // 检查点击是否命中了任何元素
        let hitAnyElement = false;
        for (let i = elements.length - 1; i >= 0; i--) {
          const element = elements[i];
          if (
            sceneCoords.x >= element.x &&
            sceneCoords.x <= element.x + element.width &&
            sceneCoords.y >= element.y &&
            sceneCoords.y <= element.y + element.height
          ) {
            hitAnyElement = true;
            setSelectedElementIds({ [element.id]: true });

            // 立即开始拖动此元素
            setDragInfo({
              elementIds: [element.id],
              startX: sceneCoords.x,
              startY: sceneCoords.y,
              originalElements: [{ ...element }]
            });
            // 开始记录历史
            startRecordingHistory();
            break;
          }
        }

        if (!hitAnyElement) {
          // 没有命中任何元素，清除选择并开始框选
          setSelectedElementIds({});
          setSelectionBox({
            startX: sceneCoords.x,
            startY: sceneCoords.y,
            x: sceneCoords.x,
            y: sceneCoords.y,
            width: 0,
            height: 0
          });
        }
        return;
      }
    }

    // 如果点击在空白区域或当前不是选择工具
    switch (currentTool) {
      case 'selection':
        handleSelectionMouseDown(sceneCoords);
        break;
      case 'rectangle':
        handleElementCreation('rectangle', sceneCoords);
        break;
      case 'ellipse':
        handleElementCreation('ellipse', sceneCoords);
        break;
      case 'line':
        handleElementCreation('line', sceneCoords);
        break;
      case 'arrow':
        handleElementCreation('arrow', sceneCoords);
        break;
      case 'text':
        handleElementCreation('text', sceneCoords);
        break;
      case 'eraser':
        handleEraserMouseDown(sceneCoords);
        break;
      case 'freeDraw':
        startFreeDrawing(sceneCoords);
        break;
      default:
        handleSelectionMouseDown(sceneCoords);
    }
  };

  const handleMouseUp = () => {
    // 操作结束时，停止历史记录 - 现在stopRecordingHistory会自动记录最终状态
    stopRecordingHistory();
    // 结束拉伸操作
    setResizeInfo(null);
    // 结束平移操作
    setPanInfo(null);
    // 结束拖动操作
    setDragInfo(null);

    // 结束选择框操作
    if (selectionBox && selectionBox.width > 5 && selectionBox.height > 5) {
      const elements = getNonDeletedElements();
      const selectedIds: Record<string, boolean> = {};
      const { x, y, width, height } = selectionBox;

      elements.forEach((element) => {
        if (
          !(
            element.x > x + width ||
            element.x + element.width < x ||
            element.y > y + height ||
            element.y + element.height < y
          )
        ) {
          selectedIds[element.id] = true;
        }
      });

      setSelectedElementIds(selectedIds);
    }
    setSelectionBox(null);

    // 结束自由绘制
    if (freeDrawing) {
      finishFreeDrawing();
    }
  };

  // 处理选择工具的鼠标按下事件
  const handleSelectionMouseDown = (sceneCoords: PointerCoords) => {
    const elements = getNonDeletedElements();
    let hitElement: NonDeletedExcalidrawElement | null = null;

    // 检查是否点击了元素，从后往前检查（后添加的元素在上层）
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i];
      if (
        sceneCoords.x >= element.x &&
        sceneCoords.x <= element.x + element.width &&
        sceneCoords.y >= element.y &&
        sceneCoords.y <= element.y + element.height
      ) {
        hitElement = element;
        break;
      }
    }

    if (hitElement) {
      // 选中元素
      setSelectedElementIds({ [hitElement.id]: true });
    } else {
      // 取消选中
      setSelectedElementIds({});
      setSelectionBox({
        startX: sceneCoords.x,
        startY: sceneCoords.y,
        x: sceneCoords.x,
        y: sceneCoords.y,
        width: 0,
        height: 0
      });
    }
  };

  // 处理元素创建
  const handleElementCreation = (
    type: ExcalidrawElement['type'],
    sceneCoords: PointerCoords
  ) => {
    // 这里只是简单地创建一个新元素
    // 在实际应用中，应该启动一个拖拽操作来确定元素的大小
    let newElement: ExcalidrawElement;

    // 为每个元素创建一个固定的种子值，避免重新渲染时变化
    const seed = Math.floor(Math.random() * 2000);

    switch (type) {
      case 'rectangle':
        newElement = createRectangle(sceneCoords.x, sceneCoords.y, 100, 80, {
          seed
        });
        break;
      case 'ellipse':
        newElement = createEllipse(sceneCoords.x, sceneCoords.y, 100, 80, {
          seed
        });
        break;
      case 'line':
        newElement = createLine(sceneCoords.x, sceneCoords.y, 100, 100, {
          seed
        });
        break;
      case 'arrow':
        newElement = createArrow(sceneCoords.x, sceneCoords.y, 100, 100, {
          seed
        });
        break;
      case 'text':
        newElement = createText(sceneCoords.x, sceneCoords.y, 100, 50, {
          seed
        });
        break;
      default:
        return;
    }

    handleAddElementWithCollaboration(newElement);
    // 选中新创建的元素
    setSelectedElementIds({ [newElement.id]: true });
  };

  // 计算当前光标样式
  const getCursorStyle = () => {
    if (panInfo || isSpacePressed) {
      return 'grabbing';
    }

    if (dragInfo) {
      return 'move';
    }

    if (currentTool === 'hand' || isSpacePressed) {
      return 'grab';
    }

    if (currentTool === 'selection') {
      return 'default';
    }

    return 'crosshair';
  };

  // 处理双击事件，用于编辑文本
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { clientX, clientY } = e;
    const sceneCoords = getScenePointerCoords(
      clientX,
      clientY,
      canvasRef,
      scrollX,
      scrollY,
      zoom.value
    );

    // 检查是否双击了文本元素
    const elements = getNonDeletedElements();

    // 从后往前检查（后添加的元素在上层）
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i];
      if (
        element.type === 'text' &&
        sceneCoords.x >= element.x &&
        sceneCoords.x <= element.x + element.width &&
        sceneCoords.y >= element.y &&
        sceneCoords.y <= element.y + element.height
      ) {
        // 开始编辑文本
        const textElement = element as ExcalidrawTextElement;
        const canvasRect = canvasRef.current?.getBoundingClientRect();
        if (!canvasRect) return;

        // 修正位置计算，使用更精确的坐标转换
        const x = element.x * zoom.value + scrollX;
        const y = element.y * zoom.value + scrollY - canvasRect.top;
        const width = element.width * zoom.value;
        const height = element.height * zoom.value;

        setEditingText({
          element: textElement,
          inputValue: textElement.text || '',
          x,
          y,
          width,
          height
        });

        break;
      }
    }
  };

  return (
    <div style={{ position: 'relative', width, height }}>
      {/* 比例尺组件 */}
      {showRulers && (
        <ScaleRuler
          width={width}
          height={height}
          zoom={zoom.value}
          scrollX={scrollX}
          scrollY={scrollY}
          unit={rulerUnit}
        />
      )}

      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          border: '1px solid #ddd',
          cursor: getCursorStyle()
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
      />

      {/* 选择框覆盖层 */}
      {selectionBox && (
        <SelectionOverlay
          selectionBox={selectionBox}
          zoom={zoom.value}
          scrollX={scrollX}
          scrollY={scrollY}
        />
      )}

      {/* 文本编辑器 */}
      {editingText && (
        <TextEditor
          editingText={editingText}
          canvasRef={canvasRef as any}
          handleTextInputChange={handleTextInputChange}
          handleTextInputBlur={handleTextInputBlur}
          handleTextInputKeyDown={handleTextInputKeyDown}
        />
      )}

      {/* 样式编辑面板 */}
      {showStylePanel && selectedElements.length > 0 && (
        <StylePanel
          selectedElements={selectedElements}
          onClose={handleCloseStylePanel}
          updateElement={handleUpdateElementWithCollaboration}
          startRecordingHistory={startRecordingHistory}
          stopRecordingHistory={stopRecordingHistory}
        />
      )}

      {/* 协同编辑相关组件 */}
      {showCollaborationDialog && (
        <CollaborationDialog
          onClose={handleCloseCollaborationDialog}
          onJoinRoom={handleJoinRoom}
        />
      )}

      {/* 协同状态栏 */}
      {collaborationSession && (
        <CollaborationStatusBar
          session={collaborationSession}
          onLeaveRoom={handleLeaveRoom}
        />
      )}

      {/* 协作者光标 */}
      {collaborationSession && (
        <CollaborationCursors
          users={collaborationSession.connectedUsers}
          currentUserId={collaborationSession.userId}
          zoom={zoom.value}
          scrollX={scrollX}
          scrollY={scrollY}
        />
      )}
    </div>
  );
};
