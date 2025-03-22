import { useEffect } from "react";
import { ToolType } from "../types";

interface KeyboardShortcutsProps {
    selectedElementIds: Record<string, boolean>;
    deleteElement: (id: string) => void;
    setSelectedElementIds: (ids: Record<string, boolean>) => void;
    editingText: boolean;
    isSpacePressed: boolean;
    setIsSpacePressed: (pressed: boolean) => void;
    currentTool?: string;
    setCurrentTool?: (tool: ToolType) => void;
}

export const useKeyboardShortcuts = ({
    selectedElementIds,
    deleteElement,
    setSelectedElementIds,
    editingText,
    isSpacePressed,
    setIsSpacePressed,
    currentTool,
    setCurrentTool
}: KeyboardShortcutsProps) => {
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

            // 添加ESC键处理逻辑
            if (e.key === 'Escape') {
                if (!editingText && setCurrentTool && currentTool !== 'selection') {
                    setCurrentTool('selection');
                    console.log('已切换到选择模式');
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
        setCurrentTool
    ]);
};
