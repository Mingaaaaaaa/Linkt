import React, { useEffect, useRef, useState } from 'react';
import { Renderer } from './Renderer';
import {
  PointerCoords,
  ExcalidrawTextElement,
  NonDeletedExcalidrawElement,
  ExcalidrawElement
} from './types';
import { useCanvasStore } from '../store/';
import { getScenePointerCoords } from './utils/coordinateUtils';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useTextEditor } from './hooks/useTextEditor';
import { useElementCreation } from './hooks/useElementCreation';
import { useElementInteraction } from './hooks/useElementInteraction';
import { useCanvasGestures } from './hooks/useCanvasGestures';
import { SelectionOverlay } from './components/SelectionOverlay';
import { TextEditor } from './components/TextEditor';

// 导入协同编辑相关组件和服务
import { CollaborationDialog } from './components/CollaborationDialog';
import { CollaborationStatusBar } from './components/CollaborationStatusBar';
import { CollaborationCursors } from './components/CollaborationCursors';
import { CollaboratorsList } from './components/CollaboratorsList';
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

interface CanvasProps {
  width: number;
  height: number;
  showCollaborationDialog?: boolean;
  collaborationSession?: CollaborationSession | null;
  setShowCollaborationDialog?: (show: boolean) => void;
  onCollaborationSessionChange?: (session: CollaborationSession | null) => void;
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
  const [showCollaboratorsList, setShowCollaboratorsList] = useState(false);
  const lastCursorPositionRef = useRef<PointerCoords | null>(null);
  const throttleTimeoutRef = useRef<any>(null);

  // Zustand store hooks
  const currentTool = useCanvasStore((state) => state.currentTool);
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
  // 获取元素数组，用于触发重新渲染
  const elements = useCanvasStore((state) => state.elements);

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
          currentTool
        };
        rendererRef.current.render(elements, appState);
      } catch (error) {
        console.error('强制渲染时出错:', error);
      }
    }
  };

  // 创建带协同功能的操作函数
  const handleAddElementWithCollaboration = (element: any) => {
    addElement(element);

    // 如果在协同会话中，发送元素添加消息
    if (collaborationSession && collaborationSession.isConnected) {
      collaborationService.addElement(element);
    }
  };

  const handleUpdateElementWithCollaboration = (
    elementId: string,
    updates: any
  ) => {
    updateElement(elementId, updates);

    // 如果在协同会话中，发送元素更新消息
    if (collaborationSession && collaborationSession.isConnected) {
      collaborationService.updateElement(elementId, updates);
    }
  };

  const handleDeleteElementWithCollaboration = (elementId: string) => {
    deleteElement(elementId);

    // 如果在协同会话中，发送元素删除消息
    if (collaborationSession && collaborationSession.isConnected) {
      collaborationService.deleteElement(elementId);
    }
  };

  // // 使用hooks，带上协同功能
  // const {
  //   editingText,
  //   setEditingText,
  //   handleTextInputChange,
  //   handleTextInputBlur,
  //   handleTextInputKeyDown
  // } = useTextEditor(handleUpdateElementWithCollaboration, forceRender);

  // 使用拆分出的hooks
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
    creatingElement,
    setCreatingElement,
    handleElementCreationStart,
    handleElementCreationResize
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
    setIsSpacePressed
  });

  // 协同编辑事件监听
  useEffect(() => {
    // 元素更新事件处理
    const handleElementUpdate = (data: {
      elementId: string;
      updates: any;
      userId: string;
    }) => {
      // 忽略自己发出的更新
      if (collaborationSession && data.userId === collaborationSession.userId) {
        return;
      }

      console.log('收到元素更新:', data);
      updateElement(data.elementId, data.updates);
      requestAnimationFrame(forceRender);
    };

    // 添加元素事件处理
    const handleElementAdd = (data: { element: any; userId: string }) => {
      // 忽略自己发出的添加
      if (collaborationSession && data.userId === collaborationSession.userId) {
        return;
      }

      console.log('收到新元素:', data);
      addElement(data.element);
      requestAnimationFrame(forceRender);
    };

    // 删除元素事件处理
    const handleElementDelete = (data: {
      elementId: string;
      userId: string;
    }) => {
      // 忽略自己发出的删除
      if (collaborationSession && data.userId === collaborationSession.userId) {
        return;
      }

      console.log('收到元素删除:', data);
      deleteElement(data.elementId);
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

    // 注册事件监听
    collaborationService.on(
      CollaborationEvent.UPDATE_ELEMENT,
      handleElementUpdate
    );
    collaborationService.on(CollaborationEvent.ADD_ELEMENT, handleElementAdd);
    collaborationService.on(
      CollaborationEvent.DELETE_ELEMENT,
      handleElementDelete
    );
    collaborationService.on(CollaborationEvent.SYNC_SCENE, handleSceneSync);
    collaborationService.on(CollaborationEvent.USER_JOIN, handleUserJoin);
    collaborationService.on(CollaborationEvent.USER_LEAVE, handleUserLeave);
    collaborationService.on(
      CollaborationEvent.ROOM_STATUS_UPDATE,
      handleRoomStatusUpdate
    );

    // 清理函数
    return () => {
      collaborationService.off(
        CollaborationEvent.UPDATE_ELEMENT,
        handleElementUpdate
      );
      collaborationService.off(
        CollaborationEvent.ADD_ELEMENT,
        handleElementAdd
      );
      collaborationService.off(
        CollaborationEvent.DELETE_ELEMENT,
        handleElementDelete
      );
      collaborationService.off(CollaborationEvent.SYNC_SCENE, handleSceneSync);
      collaborationService.off(CollaborationEvent.USER_JOIN, handleUserJoin);
      collaborationService.off(CollaborationEvent.USER_LEAVE, handleUserLeave);
      collaborationService.off(
        CollaborationEvent.ROOM_STATUS_UPDATE,
        handleRoomStatusUpdate
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

  // 定期发送光标位置
  useEffect(() => {
    if (!collaborationSession) {
      return;
    }

    const sendCursorPosition = () => {
      if (lastCursorPositionRef.current) {
        collaborationService.updateCursorPosition(
          lastCursorPositionRef.current.x,
          lastCursorPositionRef.current.y
        );
      }
      throttleTimeoutRef.current = null;
    };

    // 设置定时器，节流发送光标位置
    const intervalId = setInterval(() => {
      if (lastCursorPositionRef.current && !throttleTimeoutRef.current) {
        throttleTimeoutRef.current = setTimeout(sendCursorPosition, 50);
      }
    }, 100);

    return () => {
      clearInterval(intervalId);
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
    };
  }, [collaborationSession]);

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
          currentTool
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
    editingText
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

  // 协同编辑相关函数
  const handleOpenCollaborationDialog = () => {
    setShowCollaborationDialog(true);
  };

  const handleCloseCollaborationDialog = () => {
    setShowCollaborationDialog(false);
  };

  const handleJoinRoom = (session: CollaborationSession) => {
    onCollaborationSessionChange(session);
    setShowCollaborationDialog(false);

    // 加入房间后立即同步当前场景
    const elements = getNonDeletedElements();
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

  const handleShowCollaborators = () => {
    setShowCollaboratorsList(true);
  };

  const handleCloseCollaboratorsList = () => {
    setShowCollaboratorsList(false);
  };

  // 修改 handleMouseMove 函数，记录光标位置并发送给协作者
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (editingText) return;

    const { clientX, clientY } = e;
    const sceneCoords = getScenePointerCoords(clientX, clientY);

    // 保存光标位置，用于协同编辑
    lastCursorPositionRef.current = sceneCoords;

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

    if (creatingElement) {
      handleElementCreationResize(sceneCoords, creatingElement);
    }
  };

  // 添加Ctrl+Shift+C快捷键打开协同对话框
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingText) return;

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        handleOpenCollaborationDialog();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingText]);

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
    // Ignore zooming while editing text
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
      // Pan canvas
      setScrollPosition(scrollX - deltaX, scrollY - deltaY);
    }
  };

  // 获取场景坐标
  const getScenePointerCoords = (
    clientX: number,
    clientY: number
  ): PointerCoords => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) {
      return { x: 0, y: 0 };
    }

    return {
      x: (clientX - rect.left - scrollX) / zoom.value,
      y: (clientY - rect.top - scrollY) / zoom.value
    };
  };

  // 处理鼠标按下事件
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // 如果正在编辑文本，则不处理鼠标事件
    if (editingText) {
      return;
    }

    const { clientX, clientY } = e;
    const sceneCoords = getScenePointerCoords(clientX, clientY);

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
      default:
        handleSelectionMouseDown(sceneCoords);
    }
  };

  // 处理鼠标松开事件
  const handleMouseUp = () => {
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

    // 添加元素到 store
    addElement(newElement);

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
    const sceneCoords = getScenePointerCoords(clientX, clientY);

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
        // 不要添加 canvasRect.top 和 canvasRect.left，因为 clientX/Y 已经是相对于视口的坐标
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
          onShowCollaborators={handleShowCollaborators}
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

      {/* 协作者列表 */}
      {showCollaboratorsList && collaborationSession && (
        <CollaboratorsList
          users={collaborationSession.connectedUsers}
          currentUserId={collaborationSession.userId}
          onClose={handleCloseCollaboratorsList}
        />
      )}
    </div>
  );
};
