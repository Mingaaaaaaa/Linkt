import React, { useRef, useEffect } from 'react';
import {
  PaletteIcon,
  ExportIcon,
  ImportIcon,
  GridIcon,
  GithubIcon,
  ScaleIcon,
  SaveIcon,
} from './MenuIcons.tsx';
import { useCanvasStore } from '../../store';
import {
  exportToPNG,
  exportToSVG,
  saveToLinkt,
  importFromLinkt
} from '../utils/exportUtils';

interface MainMenuProps {
  isOpen: boolean;
  onClose: () => void;
  anchorEl: HTMLElement | null;
  showGrid: boolean;
  onToggleGrid: () => void;
  viewBackgroundColor: string;
  onChangeBackgroundColor: (color: string) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  isOpen,
  onClose,
  anchorEl,
  showGrid,
  onToggleGrid,
  viewBackgroundColor,
  onChangeBackgroundColor
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 添加比例尺相关状态
  const showRulers = useCanvasStore((state) => state.showRulers);
  const toggleRulers = useCanvasStore((state) => state.toggleRulers);
  const rulerUnit = useCanvasStore((state) => state.rulerUnit);
  const setRulerUnit = useCanvasStore((state) => state.setRulerUnit);
  const zoom = useCanvasStore((state) => state.zoom);

  // 添加获取元素和状态的函数
  const getNonDeletedElements = useCanvasStore(
    (state) => state.getNonDeletedElements
  );
  const selectedElementIds = useCanvasStore(
    (state) => state.selectedElementIds
  );
  const scrollX = useCanvasStore((state) => state.scrollX);
  const scrollY = useCanvasStore((state) => state.scrollY);
  const replaceAllElements = useCanvasStore(
    (state) => state.replaceAllElements
  );
  const setViewBackgroundColor = useCanvasStore(
    (state) => state.setViewBackgroundColor
  );
  const setScrollPosition = useCanvasStore((state) => state.setScrollPosition);
  const setZoom = useCanvasStore((state) => state.setZoom);

  // 添加本地状态以管理比例尺设置的展开状态
  const [isScaleSettingsExpanded, setIsScaleSettingsExpanded] =
    React.useState(false);

  // 处理导出PNG
  const handleExportToPNG = () => {
    const elements = getNonDeletedElements();
    const appState = {
      viewBackgroundColor,
      zoom,
      selectedElementIds,
      scrollX,
      scrollY,
      showGrid: false // 导出时不显示网格
    };

    exportToPNG({
      elements,
      appState,
      exportBackground: true,
      exportPadding: 10,
      exportScale: 2 // 2倍缩放以获得更高质量
    });

    onClose(); // 关闭菜单
  };

  // 处理导出SVG
  const handleExportToSVG = () => {
    const elements = getNonDeletedElements();
    const appState = {
      viewBackgroundColor,
      zoom,
      selectedElementIds,
      scrollX,
      scrollY,
      showGrid: false // 导出时不显示网格
    };

    exportToSVG({
      elements,
      appState,
      exportBackground: true,
      exportPadding: 10
    });

    onClose(); // 关闭菜单
  };

  // 添加保存为.linkt文件的处理函数
  const handleSaveToLinkt = () => {
    const elements = getNonDeletedElements();
    const appState = {
      viewBackgroundColor,
      zoom,
      selectedElementIds,
      scrollX,
      scrollY,
      showGrid
    };

    saveToLinkt({
      elements,
      appState,
      exportBackground: true,
      exportPadding: 10,
      filename: `linkt-canvas-${new Date().toISOString().slice(0, 10)}.linkt`
    });

    onClose(); // 关闭菜单
  };

  // 处理导入.linkt文件
  const handleImportFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    try {
      const files = event.target.files;
      if (!files || files.length === 0) {
        return;
      }

      const file = files[0];
      if (!file.name.endsWith('.linkt')) {
        alert('请选择.linkt格式的文件');
        return;
      }

      const result = await importFromLinkt(file);
      if (result) {
        // 更新画布状态
        replaceAllElements(result.elements);

        // 更新应用状态
        if (result.appState) {
          if (result.appState.viewBackgroundColor) {
            setViewBackgroundColor(result.appState.viewBackgroundColor);
          }
          if (
            result.appState.scrollX !== undefined &&
            result.appState.scrollY !== undefined
          ) {
            setScrollPosition(result.appState.scrollX, result.appState.scrollY);
          }
          if (result.appState.zoom) {
            setZoom(result.appState.zoom.value);
          }
        }
      }

      // 重置文件输入，以便能够重新选择相同的文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onClose(); // 关闭菜单
    } catch (error) {
      console.error('导入文件失败:', error);
      alert(
        '导入文件失败: ' + (error instanceof Error ? error.message : '未知错误')
      );
    }
  };

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        anchorEl &&
        !anchorEl.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, anchorEl]);

  if (!isOpen) return null;

  // 获取菜单位置
  const getMenuPosition = () => {
    if (!anchorEl) return { top: 0, left: 0 };
    const rect = anchorEl.getBoundingClientRect();
    return {
      top: rect.bottom + 5,
      left: rect.left
    };
  };

  const position = getMenuPosition();

  return (
    <div
      ref={menuRef}
      className='main-menu'
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        zIndex: 1200,
        minWidth: '240px',
        overflow: 'hidden',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div style={{ padding: '8px 0' }}>
        <div className='menu-section'>
          <MenuItem
            icon={<PaletteIcon size={18} />}
            label='背景设置'
            onClick={() => {}}
          >
            <div
              className='color-palette'
              style={{
                display: 'flex',
                gap: '4px',
                marginTop: '8px',
                flexWrap: 'wrap'
              }}
            >
              {[
                '#ffffff',
                '#f8f9fa',
                '#f1f3f5',
                '#fff3bf',
                '#d3f9d8',
                '#e7f5ff',
                '#edf2ff'
              ].map((color) => (
                <div
                  key={color}
                  onClick={() => onChangeBackgroundColor(color)}
                  style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: color,
                    borderRadius: '4px',
                    border:
                      color === viewBackgroundColor
                        ? '2px solid rgb(190, 189, 255)'
                        : color === '#ffffff'
                        ? '1px solid #ddd'
                        : 'none',
                    cursor: 'pointer'
                  }}
                />
              ))}
            </div>
          </MenuItem>
          <MenuItem
            icon={<GridIcon size={18} />}
            label='网格显示'
            onClick={onToggleGrid}
            rightElement={
              <div
                style={{
                  width: '36px',
                  height: '20px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '10px',
                  padding: '2px',
                  boxSizing: 'border-box',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: showGrid ? 'flex-end' : 'flex-start',
                  transition: 'all 0.3s'
                }}
              >
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    backgroundColor: showGrid ? 'rgb(224, 223, 255)' : 'white',
                    border: showGrid
                      ? '1px solid rgb(190, 189, 255)'
                      : '1px solid #ddd',
                    borderRadius: '50%',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s'
                  }}
                />
              </div>
            }
          />

          {/* 比例尺设置 - 修改后的版本 */}
          <div>
            {/* 比例尺标题和开关 */}
            <div
              className='menu-item'
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 16px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                color: '#333',
                fontSize: '14px'
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = '#f5f5f5')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = 'transparent')
              }
              onClick={() =>
                setIsScaleSettingsExpanded(!isScaleSettingsExpanded)
              }
            >
              <div style={{ marginRight: '12px', opacity: 0.8 }}>
                <ScaleIcon size={18} />
              </div>
              <div style={{ flex: 1 }}>比例尺设置</div>
              <div
                style={{
                  marginLeft: '8px',
                  transform: isScaleSettingsExpanded
                    ? 'rotate(180deg)'
                    : 'none',
                  transition: 'transform 0.2s'
                }}
              >
                ▼
              </div>
            </div>

            {/* 比例尺展开设置 */}
            {isScaleSettingsExpanded && (
              <div style={{ padding: '0 16px 12px 48px' }}>
                {/* 显示/隐藏比例尺开关 */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px'
                  }}
                >
                  <label style={{ fontSize: '13px' }}>显示比例尺</label>
                  <div
                    style={{
                      width: '36px',
                      height: '20px',
                      backgroundColor: '#f0f0f0',
                      borderRadius: '10px',
                      padding: '2px',
                      boxSizing: 'border-box',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: showRulers ? 'flex-end' : 'flex-start',
                      transition: 'all 0.3s',
                      cursor: 'pointer'
                    }}
                    onClick={(e) => {
                      e.stopPropagation(); // 防止事件冒泡
                      toggleRulers();
                    }}
                  >
                    <div
                      style={{
                        width: '16px',
                        height: '16px',
                        backgroundColor: showRulers
                          ? 'rgb(224, 223, 255)'
                          : 'white',
                        border: showRulers
                          ? '1px solid rgb(190, 189, 255)'
                          : '1px solid #ddd',
                        borderRadius: '50%',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        transition: 'all 0.3s'
                      }}
                    />
                  </div>
                </div>

                {/* 比例尺单位 - 仅在启用后显示 */}
                {showRulers && (
                  <>
                    <div
                      style={{
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <label style={{ fontSize: '13px', width: '40px' }}>
                        单位:
                      </label>
                      <select
                        value={rulerUnit}
                        onChange={(e) => setRulerUnit(e.target.value as any)}
                        style={{
                          padding: '4px 8px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontSize: '13px',
                          flexGrow: 1
                        }}
                      >
                        <option value='px'>像素 (px)</option>
                        <option value='cm'>厘米 (cm)</option>
                        <option value='mm'>毫米 (mm)</option>
                        <option value='in'>英寸 (in)</option>
                      </select>
                    </div>
                    <div style={{ fontSize: '13px', color: '#666' }}>
                      当前缩放: {Math.round(zoom.value * 100)}%
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <Divider />

        {/* 文件操作 */}
        <div className='menu-section'>
          <h3 style={{ margin: '8px 16px', fontSize: '14px', color: '#666' }}>
            文件
          </h3>
          <input
            type='file'
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept='.linkt'
            onChange={handleFileSelected}
          />
          <MenuItem
            icon={<ImportIcon size={18} />}
            label='打开文件'
            onClick={handleImportFile}
            shortcut='Ctrl+O'
          />
          <MenuItem
            icon={<SaveIcon size={18} />}
            label='保存画板'
            onClick={() => {}}
            shortcut='Ctrl+S'
          >
            <div
              style={{
                marginTop: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <button
                className='sub-menu-button'
                onClick={handleSaveToLinkt}
                style={{
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #ddd',
                  width: 'max-content',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  padding: '6px 12px'
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = '#e9ecef')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = '#f8f9fa')
                }
              >
                保存到本地
              </button>
              <button
                className='sub-menu-button'
                style={{
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #ddd',
                  width: 'max-content',
                  borderRadius: '4px',
                  cursor: 'not-allowed',
                  opacity: '0.6',
                  transition: 'all 0.2s',
                  padding: '6px 12px'
                }}
              >
                保存到云端 (尚未实现)
              </button>
            </div>
          </MenuItem>
          <MenuItem
            icon={<ExportIcon size={18} />}
            label='导出图片'
            onClick={() => {}}
          >
            <div
              style={{
                marginTop: '4px',
                display: 'flex',
                flexDirection: 'row',
                gap: '6px'
              }}
            >
              <button
                className='sub-menu-button'
                onClick={handleExportToPNG}
                style={{
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #ddd',
                  width: 'max-content',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = '#e9ecef')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = '#f8f9fa')
                }
              >
                导出为PNG
              </button>
              <button
                className='sub-menu-button'
                onClick={handleExportToSVG}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #ddd',
                  width: 'max-content',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = '#e9ecef')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = '#f8f9fa')
                }
              >
                导出为SVG
              </button>
            </div>
          </MenuItem>
        </div>

        <Divider />

        {/* 其他选项 */}
        <div className='menu-section'>
          <MenuItem
            icon={<GithubIcon size={18} />}
            label='GitHub仓库'
            onClick={() => {
              window.open('https://github.com/Mingaaaaaaa/Linkt', '_blank');
            }}
          />
        </div>
      </div>

      <style>
        {`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .sub-menu-button {
          background: none;
          border: none;
          text-align: left;
          padding: 6px 8px;
          font-size: 13px;
          border-radius: 4px;
          cursor: pointer;
        }

        .sub-menu-button:hover {
          background-color: #f5f5f5;
        }
      `}
      </style>
    </div>
  );
};

// 菜单项组件
interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  children?: React.ReactNode;
  shortcut?: string;
  rightElement?: React.ReactNode;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  label,
  onClick,
  children,
  shortcut,
  rightElement
}) => {
  const [expanded, setExpanded] = React.useState(false);

  const handleClick = () => {
    if (children) {
      setExpanded(!expanded);
    } else {
      onClick();
    }
  };

  return (
    <div>
      <div
        className='menu-item'
        onClick={handleClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 16px',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
          color: '#333',
          fontSize: '14px'
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = '#f5f5f5')
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = 'transparent')
        }
      >
        <div style={{ marginRight: '12px', opacity: 0.9, display: 'flex' }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>{label}</div>
        {shortcut && (
          <div style={{ fontSize: '12px', color: '#999', marginRight: '8px' }}>
            {shortcut}
          </div>
        )}
        {rightElement && rightElement}
        {children && (
          <div
            style={{
              marginLeft: '8px',
              transform: expanded ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s'
            }}
          >
            ▼
          </div>
        )}
      </div>

      {expanded && children && (
        <div style={{ padding: '0 16px 8px 48px' }}>{children}</div>
      )}
    </div>
  );
};

const Divider = () => (
  <div style={{ height: '1px', backgroundColor: '#eee', margin: '4px 0' }} />
);
