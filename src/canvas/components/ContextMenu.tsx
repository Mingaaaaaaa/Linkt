import React, { useRef, useEffect } from 'react';
import { useCanvasStore } from '../../store';
import { copySelectedToPNG, copySelectedToSVG } from '../utils/exportUtils';
import { createRandomId } from '../ElementUtils';
import { NonDeletedExcalidrawElement } from '../types';

interface ContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  canvasCoords: { x: number; y: number };
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  isOpen,
  onClose,
  position,
  canvasCoords
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // 从 store 获取必要的 state 和方法
  const selectedElementIds = useCanvasStore(
    (state) => state.selectedElementIds
  );
  const getElements = useCanvasStore((state) => state.getElements);
  const addElement = useCanvasStore((state) => state.addElement);
  const deleteElement = useCanvasStore((state) => state.deleteElement);
  const setSelectedElementIds = useCanvasStore(
    (state) => state.setSelectedElementIds
  );
  const viewBackgroundColor = useCanvasStore(
    (state) => state.viewBackgroundColor
  );
  const zoom = useCanvasStore((state) => state.zoom);

  // 复制操作的状态管理
  const [copiedElements, setCopiedElements] = React.useState<any[]>([]);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        handleCloseMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // 处理复制操作
  const handleCopy = () => {
    if (Object.keys(selectedElementIds).length > 0 && getElements) {
      const elements = getElements();
      const selectedElements = elements.filter(
        (element) => selectedElementIds[element.id]
      );

      if (selectedElements.length > 0) {
        // 深拷贝选中的元素
        const elementsToCopy = JSON.parse(JSON.stringify(selectedElements));

        // 计算选中元素的边界框
        const minX = Math.min(...selectedElements.map((el) => el.x));
        const minY = Math.min(...selectedElements.map((el) => el.y));

        // 存储相对位置信息的副本
        const copyElements = elementsToCopy.map((el: any) => ({
          ...el,
          // 记录相对于边界框左上角的偏移量
          _offsetX: el.x - minX,
          _offsetY: el.y - minY
        }));

        setCopiedElements(copyElements);
        console.log('已复制元素:', copyElements.length);
      }
    }
    // 取消元素选中状态
    setSelectedElementIds({});
    onClose();
  };

  // 处理粘贴操作
  const handlePaste = () => {
    // 先检查剪贴板是否有图片数据
    if (navigator.clipboard && navigator.clipboard.read) {
      navigator.clipboard
        .read()
        .then((clipboardItems) => {
          // 处理所有clipboardItems
          const imagePromises = clipboardItems.map((item) => {
            // 查找图片类型
            if (item.types.some((type) => type.startsWith('image/'))) {
              return item
                .getType('image/png')
                .then((blob) => {
                  // 读取blob数据
                  const reader = new FileReader();
                  return new Promise<string>((resolve) => {
                    reader.onload = () => {
                      if (reader.result) {
                        resolve(reader.result as string);
                      }
                    };
                    reader.readAsDataURL(blob);
                  });
                })
                .catch(() => {
                  // 尝试JPEG格式
                  return item
                    .getType('image/jpeg')
                    .then((blob) => {
                      const reader = new FileReader();
                      return new Promise<string>((resolve) => {
                        reader.onload = () => {
                          if (reader.result) {
                            resolve(reader.result as string);
                          }
                        };
                        reader.readAsDataURL(blob);
                      });
                    })
                    .catch(() => null);
                });
            }
            return Promise.resolve(null);
          });

          // 处理所有Promise
          Promise.all(imagePromises)
            .then((results) => {
              // 筛选出有效的数据URL
              const imageDataURL = results.find((result) => result !== null);

              if (imageDataURL) {
                // 触发图片粘贴事件
                const pasteEvent = new CustomEvent('image-paste', {
                  detail: {
                    dataURL: imageDataURL,
                    fileType: 'image/png',
                    fileName: `pasted-image-${new Date()
                      .toISOString()
                      .slice(0, 10)}`,
                    position: canvasCoords // 使用右键菜单的画布坐标
                  }
                });
                document.dispatchEvent(pasteEvent);
                onClose();
                return; // 如果处理了图片，就不处理复制的元素
              }

              // 如果没有图片，则处理复制的元素
              pasteElements();
            })
            .catch((error) => {
              console.error('Error accessing clipboard:', error);
              // 失败时退回到处理复制的元素
              pasteElements();
            });
        })
        .catch((error) => {
          console.error('Error reading clipboard:', error);
          // 如果读取失败，仍然粘贴已复制的元素
          pasteElements();
        });
    } else {
      // 如果不支持clipboard API，直接粘贴已复制的元素
      pasteElements();
    }
  };

  // 粘贴复制的元素
  const pasteElements = () => {
    if (copiedElements.length > 0 && addElement) {
      // 创建新选择集合，用于存储新元素的ID
      const newSelectedIds: Record<string, boolean> = {};

      // 为每个复制的元素创建新副本，放置在鼠标右键位置
      copiedElements.forEach((element) => {
        const newId = createRandomId();
        const newElement = {
          ...element,
          id: newId,
          x: canvasCoords.x + element._offsetX,
          y: canvasCoords.y + element._offsetY,
          // 重置版本信息
          version: 1,
          lastModified: Date.now()
        };

        // 添加新元素到画布
        addElement(newElement);

        // 将新元素添加到选择集
        newSelectedIds[newId] = true;
      });

      // 更新选择状态为新添加的元素
      setSelectedElementIds(newSelectedIds);
    }
    onClose();
  };

  // 处理剪切操作
  const handleCut = () => {
    // 先复制
    handleCopy();

    // 然后删除选中的元素
    if (Object.keys(selectedElementIds).length > 0) {
      Object.keys(selectedElementIds).forEach((elementId) => {
        deleteElement(elementId);
      });

      // 清空选择状态
      setSelectedElementIds({});
    }
    onClose();
  };

  // 复制为PNG
  const handleCopyAsPNG = () => {
    if (Object.keys(selectedElementIds).length === 0) {
      onClose();
      return;
    }

    const elements = getElements();
    const selectedElements = elements.filter(
      (element) => selectedElementIds[element.id]
    );

    // 过滤掉已删除的元素，并且显式断言为所需类型
    const nonDeletedElements = selectedElements.filter(
      (element) => !element.isDeleted
    ) as unknown as readonly NonDeletedExcalidrawElement[];

    const appState = {
      viewBackgroundColor,
      zoom,
      selectedElementIds,
      scrollX: 0,
      scrollY: 0,
      showGrid: false
    };

    copySelectedToPNG({
      elements: nonDeletedElements,
      appState,
      exportBackground: false,
      exportPadding: 10,
      exportScale: 2
    });

    // 取消元素选中状态
    setSelectedElementIds({});
    onClose();
  };

  // 复制为SVG
  const handleCopyAsSVG = () => {
    if (Object.keys(selectedElementIds).length === 0) {
      onClose();
      return;
    }

    const elements = getElements();
    const selectedElements = elements.filter(
      (element) => selectedElementIds[element.id]
    );

    // 过滤掉已删除的元素，并且显式断言为所需类型
    const nonDeletedElements = selectedElements.filter(
      (element) => !element.isDeleted
    ) as unknown as readonly NonDeletedExcalidrawElement[];

    const appState = {
      viewBackgroundColor,
      zoom,
      selectedElementIds,
      scrollX: 0,
      scrollY: 0,
      showGrid: false
    };

    copySelectedToSVG({
      elements: nonDeletedElements,
      appState,
      exportBackground: false,
      exportPadding: 10
    });

    // 取消元素选中状态
    setSelectedElementIds({});
    onClose();
  };

  // 关闭菜单时取消选中状态
  const handleCloseMenu = () => {
    setSelectedElementIds({});
    // 重置所有可能的拖拽状态
    const event = new CustomEvent('reset-drag-state', {});
    document.dispatchEvent(event);
    onClose();
  };

  if (!isOpen) return null;

  // 检查是否有选中的元素
  const hasSelection = Object.keys(selectedElementIds).length > 0;

  return (
    <div
      ref={menuRef}
      className='context-menu'
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
        zIndex: 2000,
        padding: '4px 0',
        minWidth: '180px',
        animation: 'fadeIn 0.15s ease-out'
      }}
    >
      <MenuItem
        label='复制'
        shortcut='Ctrl+C'
        onClick={handleCopy}
        disabled={!hasSelection}
      />
      <MenuItem
        label='粘贴'
        shortcut='Ctrl+V'
        onClick={handlePaste}
        disabled={false}
      />
      <MenuItem
        label='剪切'
        shortcut='Ctrl+X'
        onClick={handleCut}
        disabled={!hasSelection}
      />

      <Divider />

      <MenuItem
        label='复制为PNG'
        onClick={handleCopyAsPNG}
        disabled={!hasSelection}
      />
      <MenuItem
        label='复制为SVG'
        onClick={handleCopyAsSVG}
        disabled={!hasSelection}
      />

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-5px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
};

// 菜单项组件
interface MenuItemProps {
  label: string;
  onClick: () => void;
  shortcut?: string;
  disabled?: boolean;
  showSubmenu?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({
  label,
  onClick,
  shortcut,
  disabled = false,
  showSubmenu = false
}) => {
  return (
    <div
      className='menu-item'
      onClick={disabled ? undefined : onClick}
      style={{
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        backgroundColor: 'transparent',
        transition: 'background-color 0.2s',
        color: '#333',
        fontSize: '14px'
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.backgroundColor = '#f5f5f5';
      }}
      onMouseLeave={(e) => {
        if (!disabled) e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      <div>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {shortcut && (
          <span
            style={{
              fontSize: '12px',
              color: '#999',
              marginRight: shortcut === '>' ? '0' : '8px'
            }}
          >
            {shortcut}
          </span>
        )}
        {showSubmenu && <span style={{ marginLeft: '4px' }}>▶</span>}
      </div>
    </div>
  );
};

const Divider = () => (
  <div style={{ height: '1px', backgroundColor: '#eee', margin: '4px 0' }} />
);
