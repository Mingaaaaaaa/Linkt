import { Renderer, ResizeHandle } from './Renderer';
import React, { useEffect, useRef, useState } from 'react';
import {
  PointerCoords,
  ExcalidrawElement,
  NonDeletedExcalidrawElement,
  ExcalidrawTextElement
} from './types';
import {
  createRectangle,
  createEllipse,
  createLine,
  createText,
  createArrow
} from './ElementUtils';
import { useDevice } from './CanvasApp';
import { useCanvasStore } from '../store/';

interface CanvasProps {
  width: number;
  height: number;
}

export const Canvas: React.FC<CanvasProps> = ({ width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const device = useDevice();
  const [initialized, setInitialized] = useState(false);
  const [resizeInfo, setResizeInfo] = useState<{
    element: NonDeletedExcalidrawElement;
    handle: ResizeHandle;
    originalElement: NonDeletedExcalidrawElement;
    originalMouseX: number;
    originalMouseY: number;
  } | null>(null);

  // 添加平移状态
  const [panInfo, setPanInfo] = useState<{
    startX: number;
    startY: number;
    startScrollX: number;
    startScrollY: number;
  } | null>(null);

  // 添加拖拽状态
  const [dragInfo, setDragInfo] = useState<{
    element: NonDeletedExcalidrawElement;
    startX: number;
    startY: number;
    originalElement: NonDeletedExcalidrawElement;
  } | null>(null);

  // 添加文本编辑状态
  const [editingText, setEditingText] = useState<{
    element: ExcalidrawTextElement;
    inputValue: string;
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  // 添加空格键状态
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // 从 Zustand 获取状态和方法
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

  // 初始化渲染器和示例元素
  useEffect(() => {
    if (canvasRef.current && !initialized) {
      rendererRef.current = new Renderer(canvasRef.current);

      try {
        // 检查是否已有元素，如果没有才添加示例元素
        const existingElements = getElements();
        console.log('现有元素:', existingElements);

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

  // 添加键盘事件监听，用于空格键和删除元素
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果正在编辑文本，则不处理键盘事件
      if (editingText) {
        return;
      }

      // 处理空格键按下
      if (e.key === ' ' && !isSpacePressed) {
        setIsSpacePressed(true);
        e.preventDefault(); // 防止页面滚动
      }

      // 如果按下 Delete 或 Backspace 键，且有选中的元素，则删除元素
      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        Object.keys(selectedElementIds).length > 0
      ) {
        // 防止在输入框中按下删除键时触发
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement
        ) {
          return;
        }

        // 删除所有选中的元素
        Object.keys(selectedElementIds).forEach((elementId) => {
          deleteElement(elementId);
        });

        // 清空选中状态
        setSelectedElementIds({});
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // 处理空格键松开
      if (e.key === ' ') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    selectedElementIds,
    deleteElement,
    setSelectedElementIds,
    editingText,
    isSpacePressed
  ]);

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
    const newZoom = Math.min(10, Math.max(0.1, currentZoom * (1 - direction * zoomFactor)));

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

    // 检查是否点击了拉伸点
    if (rendererRef.current) {
      const elements = getNonDeletedElements();
      const selectedElementIds = appstate.selectedElementIds;
      const selectedElementsArray = elements.filter(
        (element) => selectedElementIds[element.id]
      );

      if (selectedElementsArray.length === 1) {
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

        // 检查是否点击了选中的元素（用于拖动）
        if (
          sceneCoords.x >= selectedElement.x &&
          sceneCoords.x <= selectedElement.x + selectedElement.width &&
          sceneCoords.y >= selectedElement.y &&
          sceneCoords.y <= selectedElement.y + selectedElement.height
        ) {
          // 开始拖动操作
          setDragInfo({
            element: selectedElement,
            startX: sceneCoords.x,
            startY: sceneCoords.y,
            originalElement: { ...selectedElement }
          });
          return;
        }
      }
    }

    // 如果不是拉伸或拖动操作，则按照当前工具执行操作
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
      default:
        handleSelectionMouseDown(sceneCoords);
    }
  };

  // 处理鼠标移动事件
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // 如果正在编辑文本，则不处理鼠标移动
    if (editingText) {
      return;
    }

    const { clientX, clientY } = e;

    // 处理画布平移
    if (panInfo) {
      const deltaX = clientX - panInfo.startX;
      const deltaY = clientY - panInfo.startY;
      setScrollPosition(
        panInfo.startScrollX + deltaX,
        panInfo.startScrollY + deltaY
      );
      return;
    }

    // 处理元素拖动
    if (dragInfo) {
      const sceneCoords = getScenePointerCoords(clientX, clientY);
      const deltaX = sceneCoords.x - dragInfo.startX;
      const deltaY = sceneCoords.y - dragInfo.startY;

      updateElement(dragInfo.element.id, {
        x: dragInfo.originalElement.x + deltaX,
        y: dragInfo.originalElement.y + deltaY
      });

      // 手动触发渲染，确保立即更新
      requestAnimationFrame(forceRender);
      return;
    }

    // 处理元素拉伸
    if (resizeInfo) {
      const sceneCoords = getScenePointerCoords(clientX, clientY);
      const {
        element,
        handle,
        originalElement,
        originalMouseX,
        originalMouseY
      } = resizeInfo;

      // 计算鼠标移动的距离
      const deltaX = sceneCoords.x - originalMouseX;
      const deltaY = sceneCoords.y - originalMouseY;

      // 根据拉伸点计算新的位置和尺寸
      let newX = element.x;
      let newY = element.y;
      let newWidth = element.width;
      let newHeight = element.height;

      if (element.type === 'line' || element.type === 'arrow') {
        // 对于线条和箭头，特殊处理拉伸点
        if (handle === ResizeHandle.Start) {
          // 移动起点
          newX = originalElement.x + deltaX;
          newY = originalElement.y + deltaY;
          newWidth = originalElement.width - deltaX;
          newHeight = originalElement.height - deltaY;
        } else if (handle === ResizeHandle.End) {
          // 移动终点
          newWidth = originalElement.width + deltaX;
          newHeight = originalElement.height + deltaY;
        }
      } else {
        // 对于其他元素，使用标准的拉伸逻辑
        switch (handle) {
          case ResizeHandle.TopLeft:
            newX = originalElement.x + deltaX;
            newY = originalElement.y + deltaY;
            newWidth = originalElement.width - deltaX;
            newHeight = originalElement.height - deltaY;
            break;
          case ResizeHandle.TopRight:
            newY = originalElement.y + deltaY;
            newWidth = originalElement.width + deltaX;
            newHeight = originalElement.height - deltaY;
            break;
          case ResizeHandle.BottomRight:
            newWidth = originalElement.width + deltaX;
            newHeight = originalElement.height + deltaY;
            break;
          case ResizeHandle.BottomLeft:
            newX = originalElement.x + deltaX;
            newWidth = originalElement.width - deltaX;
            newHeight = originalElement.height + deltaY;
            break;
        }
      }

      // 确保宽度和高度不为负
      if (newWidth < 10) {
        newWidth = 10;
        newX =
          handle === ResizeHandle.TopLeft ||
          handle === ResizeHandle.BottomLeft ||
          handle === ResizeHandle.Start
            ? originalElement.x + originalElement.width - 10
            : originalElement.x;
      }

      if (newHeight < 10) {
        newHeight = 10;
        newY =
          handle === ResizeHandle.TopLeft ||
          handle === ResizeHandle.TopRight ||
          handle === ResizeHandle.Start
            ? originalElement.y + originalElement.height - 10
            : originalElement.y;
      }

      // 更新元素
      updateElement(element.id, {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight
      });

      // 手动触发渲染，确保立即更新
      requestAnimationFrame(forceRender);
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
        newElement = createLine(sceneCoords.x, sceneCoords.y, 100, 0, {
          seed
        });
        break;
      case 'arrow':
        newElement = createArrow(sceneCoords.x, sceneCoords.y, 100, 0, {
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

  // 处理文本输入变化
  const handleTextInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (editingText) {
      setEditingText({
        ...editingText,
        inputValue: e.target.value
      });
    }
  };

  // 处理文本输入完成
  const handleTextInputBlur = () => {
    if (editingText) {
      // 更新文本元素
      updateElement(editingText.element.id, {
        text: editingText.inputValue
      } as Partial<ExcalidrawTextElement>);

      // 结束文本编辑
      setEditingText(null);

      // 手动触发渲染
      requestAnimationFrame(forceRender);
    }
  };

  // 处理文本输入按键
  const handleTextInputKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextInputBlur();
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

      {/* 文本编辑输入框 */}
      {editingText && (
        <textarea
          value={editingText.inputValue}
          onChange={handleTextInputChange}
          onBlur={handleTextInputBlur}
          onKeyDown={handleTextInputKeyDown}
          style={{
            position: 'absolute',
            left:
              editingText.x +
              (canvasRef.current?.getBoundingClientRect().left || 0) +
              'px',
            top:
              editingText.y +
              (canvasRef.current?.getBoundingClientRect().top || 0) +
              'px',
            width: editingText.width + 'px',
            height: editingText.height + 'px',
            padding: '0',
            margin: '0',
            resize: 'none',
            overflow: 'hidden',
            lineHeight: '1.2',
            textAlign: editingText.element.textAlign || 'left',
            verticalAlign: 'top'
          }}
          autoFocus
        />
      )}
    </div>
  );
};
