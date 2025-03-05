import React, { useEffect, useRef, useState } from 'react';
import { Renderer } from './Renderer';
import { useCanvasStore } from '../store/';
import { useTextEditor } from './hooks/useTextEditor';
import { getScenePointerCoords } from './utils/coordinateUtils';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useElementCreation } from './hooks/useElementCreation';
import { useElementInteraction } from './hooks/useElementInteraction';
import { useCanvasGestures } from './hooks/useCanvasGestures';
import { SelectionOverlay } from './components/SelectionOverlay';
import { TextEditor } from './components/TextEditor';
import { PointerCoords, ExcalidrawTextElement } from './types';

interface CanvasProps {
  width: number;
  height: number;
}

export const Canvas: React.FC<CanvasProps> = ({ width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  // 从Zustand获取状态和方法
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
    handleEraserMouseDown,
    handleElementDrag,
    handleElementResize,
    updateSelectionBox
  } = useElementInteraction(
    updateElement,
    deleteElement,
    getNonDeletedElements,
    forceRender
  );

  const {
    creatingElement,
    setCreatingElement,
    handleElementCreationStart,
    handleElementCreationResize
  } = useElementCreation(
    addElement,
    updateElement,
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
    deleteElement,
    setSelectedElementIds,
    editingText: !!editingText,
    isSpacePressed,
    setIsSpacePressed
  });

  // 初始化渲染器和示例元素
  useEffect(() => {
    if (canvasRef.current && !initialized) {
      rendererRef.current = new Renderer(canvasRef.current);
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

  // 处理鼠标滚轮缩放
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (editingText) return;

    const isZooming = e.ctrlKey || e.metaKey;
    if (isZooming) {
      e.preventDefault();
      handleZoom(
        e,
        zoom.value,
        scrollX,
        scrollY,
        canvasRef as React.RefObject<HTMLCanvasElement>
      );
    } else {
      setScrollPosition(scrollX - e.deltaX, scrollY - e.deltaY);
    }
  };

  // 处理选择工具的鼠标按下事件
  const handleSelectionMouseDown = (sceneCoords: PointerCoords) => {
    const elements = getNonDeletedElements();
    let hitElement = null;

    // 检查是否点击了元素
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
      setSelectedElementIds({ [hitElement.id]: true });
    } else {
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

  // 处理鼠标按下事件
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (editingText) return;

    const { clientX, clientY } = e;
    const sceneCoords = getScenePointerCoords(
      clientX,
      clientY,
      canvasRef as React.RefObject<HTMLCanvasElement>,
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

    // 检查是否点击了拉伸点或已选中元素
    if (rendererRef.current) {
      const elements = getNonDeletedElements();
      const selectedElementsArray = elements.filter(
        (element) => selectedElementIds[element.id]
      );

      // 单个元素的拉伸
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
          // 开始拖动操作（单个元素）
          setDragInfo({
            elementIds: [selectedElement.id],
            startX: sceneCoords.x,
            startY: sceneCoords.y,
            originalElements: [{ ...selectedElement }]
          });
          return;
        }
      } else if (selectedElementsArray.length > 1) {
        // 检查是否点击了任何选中的元素（用于批量拖动）
        for (const element of selectedElementsArray) {
          if (
            sceneCoords.x >= element.x &&
            sceneCoords.x <= element.x + element.width &&
            sceneCoords.y >= element.y &&
            sceneCoords.y <= element.y + element.height
          ) {
            // 开始批量拖动操作（多个元素）
            setDragInfo({
              elementIds: selectedElementsArray.map((el) => el.id),
              startX: sceneCoords.x,
              startY: sceneCoords.y,
              originalElements: selectedElementsArray.map((el) => ({ ...el }))
            });
            return;
          }
        }
      }
    }

    // 如果不是拉伸或拖动操作，则按照当前工具执行操作
    switch (currentTool) {
      case 'selection':
        handleSelectionMouseDown(sceneCoords);
        break;
      case 'rectangle':
      case 'ellipse':
      case 'line':
      case 'arrow':
      case 'text':
        handleElementCreationStart(currentTool, sceneCoords);
        break;
      case 'eraser':
        handleEraserMouseDown(sceneCoords);
        break;
      default:
        handleSelectionMouseDown(sceneCoords);
    }
  };

  // 修改鼠标移动事件
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (editingText) return;

    const { clientX, clientY } = e;
    const sceneCoords = getScenePointerCoords(
      clientX,
      clientY,
      canvasRef as React.RefObject<HTMLCanvasElement>,
      scrollX,
      scrollY,
      zoom.value
    );

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

  const handleMouseUp = () => {
    setResizeInfo(null);
    setPanInfo(null);
    setDragInfo(null);
    setCreatingElement(null);

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

    if (currentTool === 'eraser') {
      return 'not-allowed';
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
      canvasRef as React.RefObject<HTMLCanvasElement>,
      scrollX,
      scrollY,
      zoom.value
    );

    const elements = getNonDeletedElements();

    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i];
      if (
        element.type === 'text' &&
        sceneCoords.x >= element.x &&
        sceneCoords.x <= element.x + element.width &&
        sceneCoords.y >= element.y &&
        sceneCoords.y <= element.y + element.height
      ) {
        const textElement = element as ExcalidrawTextElement;
        const canvasRect = canvasRef.current?.getBoundingClientRect();
        if (!canvasRect) return;

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

      {selectionBox && (
        <SelectionOverlay
          selectionBox={selectionBox}
          zoom={zoom.value}
          scrollX={scrollX}
          scrollY={scrollY}
        />
      )}

      {editingText && (
        <TextEditor
          editingText={editingText}
          canvasRef={canvasRef as React.RefObject<HTMLCanvasElement>}
          handleTextInputChange={handleTextInputChange}
          handleTextInputBlur={handleTextInputBlur}
          handleTextInputKeyDown={handleTextInputKeyDown}
        />
      )}
    </div>
  );
};
