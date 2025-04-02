import { useEffect, useRef, useState } from "react";
import { ExcalidrawElement, ToolType } from "../types";
import { createRandomId } from "../ElementUtils";

interface CopyableElement extends ExcalidrawElement {
    _offsetX: number;
    _offsetY: number;
}

interface KeyboardShortcutsProps {
    selectedElementIds: Record<string, boolean>;
    deleteElement: (id: string) => void;
    setSelectedElementIds: (ids: Record<string, boolean>) => void;
    editingText: boolean;
    isSpacePressed: boolean;
    setIsSpacePressed: (pressed: boolean) => void;
    currentTool?: string;
    setCurrentTool?: (tool: ToolType) => void;
    undo?: () => void;
    redo?: () => void;
    // 添加获取元素和添加元素的函数
    getElements?: () => readonly ExcalidrawElement[];
    addElement?: (element: ExcalidrawElement) => void;
    // 获取画布坐标转换信息
    getCanvasCoordinates?: (clientX: number, clientY: number) => { x: number, y: number };
}

export const useKeyboardShortcuts = ({
    selectedElementIds,
    deleteElement,
    setSelectedElementIds,
    editingText,
    isSpacePressed,
    setIsSpacePressed,
    currentTool,
    setCurrentTool,
    undo,
    redo,
    getElements,
    addElement,
    getCanvasCoordinates
}: KeyboardShortcutsProps) => {
    // 用于存储复制的元素
    const [copiedElements, setCopiedElements] = useState<CopyableElement[]>([]);
    // 监听鼠标移动以记录最新位置
    const mousePositionRef = useRef({ x: 0, y: 0 });
    useEffect(() => {
        const trackMousePosition = (e: MouseEvent) => {
            mousePositionRef.current = { x: e.clientX, y: e.clientY };
        };

        window.addEventListener('mousemove', trackMousePosition);
        return () => {
            window.removeEventListener('mousemove', trackMousePosition);
        };
    }, []);
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

            // 处理撤销操作 (Ctrl+Z / Command+Z)
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey && undo) {
                e.preventDefault();
                undo();
                return;
            }

            // 处理重做操作 (Ctrl+Shift+Z / Command+Shift+Z 或 Ctrl+Y / Command+Y)
            if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') ||
                ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
                e.preventDefault();
                if (redo) redo();
                return;
            }

            // 复制功能 (Ctrl+C / Command+C)
            if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
                e.preventDefault();
                if (Object.keys(selectedElementIds).length > 0 && getElements) {
                    const elements = getElements();
                    const selectedElements = elements.filter(
                        element => selectedElementIds[element.id]
                    );

                    if (selectedElements.length > 0) {
                        // 深拷贝选中的元素
                        const elementsToCopy: ExcalidrawElement[] = JSON.parse(JSON.stringify(selectedElements));

                        // 计算选中元素的边界框
                        const minX = Math.min(...selectedElements.map(el => el.x));
                        const minY = Math.min(...selectedElements.map(el => el.y));

                        // 存储相对位置信息的副本
                        setCopiedElements(
                            elementsToCopy.map(el => ({
                                ...el,
                                // 记录相对于边界框左上角的偏移量
                                _offsetX: el.x - minX,
                                _offsetY: el.y - minY
                            }))
                        );
                    }
                }
                return;
            }

            // 粘贴功能 (Ctrl+V / Command+V)
            if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                e.preventDefault();
                if (copiedElements.length > 0 && addElement && getCanvasCoordinates) {
                    // 获取鼠标在画布上的坐标
                    const { x: canvasX, y: canvasY } = getCanvasCoordinates(
                        mousePositionRef.current.x,
                        mousePositionRef.current.y
                    );

                    // 创建新选择集合，用于存储新元素的ID
                    const newSelectedIds: Record<string, boolean> = {};

                    // 为每个复制的元素创建新副本，放置在鼠标位置
                    copiedElements.forEach(element => {
                        const newId = createRandomId(); // 获取新ID的函数
                        const newElement = {
                            ...element,
                            id: newId,
                            x: canvasX + element._offsetX,
                            y: canvasY + element._offsetY,
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

                    console.log('已粘贴元素到鼠标位置:', copiedElements.length);
                }
                return;
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

            // 添加ESC键处理逻辑
            if (e.key === 'Escape') {
                if (!editingText && setCurrentTool && currentTool !== 'selection') {
                    setCurrentTool('selection');
                }
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
        isSpacePressed,
        setIsSpacePressed,
        currentTool,
        setCurrentTool,
        undo,
        redo,
        getElements,
        addElement,
        getCanvasCoordinates,
        copiedElements // 添加复制的元素到依赖数组
    ]);
};
