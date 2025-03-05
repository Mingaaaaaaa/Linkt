import { useState } from "react";
import { ResizeHandle } from "../Renderer";
import {
    NonDeletedExcalidrawElement,
    PointerCoords
} from "../types";
import {
    DragInfo,
    ResizeInfo,
    SelectionBox
} from "../types/interactionTypes";

export const useElementInteraction = (
    updateElement: (id: string, props: Partial<NonDeletedExcalidrawElement>) => void,
    deleteElement: (id: string) => void,
    getNonDeletedElements: () => readonly NonDeletedExcalidrawElement[],
    forceRender: () => void
) => {
    // 拖动状态
    const [dragInfo, setDragInfo] = useState<DragInfo | null>(null);

    // 调整大小状态
    const [resizeInfo, setResizeInfo] = useState<ResizeInfo | null>(null);

    // 选择框状态
    const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);

    // 处理橡皮擦工具
    const handleEraserMouseDown = (sceneCoords: PointerCoords) => {
        const elements = getNonDeletedElements();

        // 检查是否点击了元素，从后往前检查（后添加的元素在上层）
        for (let i = elements.length - 1; i >= 0; i--) {
            const element = elements[i];
            if (
                sceneCoords.x >= element.x &&
                sceneCoords.x <= element.x + element.width &&
                sceneCoords.y >= element.y &&
                sceneCoords.y <= element.y + element.height
            ) {
                deleteElement(element.id);
                break;
            }
        }
    };

    // 处理拖动元素
    const handleElementDrag = (sceneCoords: PointerCoords, currentDragInfo: DragInfo) => {
        if (!currentDragInfo) return;

        const deltaX = sceneCoords.x - currentDragInfo.startX;
        const deltaY = sceneCoords.y - currentDragInfo.startY;

        // 移动所有选中的元素
        currentDragInfo.elementIds.forEach((id, index) => {
            const originalElement = currentDragInfo.originalElements[index];
            updateElement(id, {
                x: originalElement.x + deltaX,
                y: originalElement.y + deltaY
            });
        });

        // 手动触发渲染，确保立即更新
        forceRender();
    };

    // 处理调整元素大小
    const handleElementResize = (sceneCoords: PointerCoords, currentResizeInfo: ResizeInfo) => {
        if (!currentResizeInfo) return;

        const {
            element,
            handle,
            originalElement,
            originalMouseX,
            originalMouseY
        } = currentResizeInfo;

        // 计算鼠标移动的距离
        const deltaX = sceneCoords.x - originalMouseX;
        const deltaY = sceneCoords.y - originalMouseY;

        // 根据拉伸点计算新的位置和尺寸
        let newX = element.x;
        let newY = element.y;
        let newWidth = element.width;
        let newHeight = element.height;

        if (element.type === 'line' || element.type === 'arrow') {
            if (handle === ResizeHandle.Start) {
                newX = originalElement.x + deltaX;
                newY = originalElement.y + deltaY;
                newWidth = originalElement.width - deltaX;
                newHeight = originalElement.height - deltaY;
            } else if (handle === ResizeHandle.End) {
                newWidth = originalElement.width + deltaX;
                newHeight = originalElement.height + deltaY;
            }
        } else {
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
        forceRender();
    };

    // 更新选择框
    const updateSelectionBox = (sceneCoords: PointerCoords, currentSelectionBox: SelectionBox) => {
        if (!currentSelectionBox) return;

        const newWidth = sceneCoords.x - currentSelectionBox.startX;
        const newHeight = sceneCoords.y - currentSelectionBox.startY;

        // 计算选择框的位置和大小，支持向任意方向拖拽
        let newX = currentSelectionBox.startX;
        let newY = currentSelectionBox.startY;

        if (newWidth < 0) {
            newX = currentSelectionBox.startX + newWidth;
        }

        if (newHeight < 0) {
            newY = currentSelectionBox.startY + newHeight;
        }

        setSelectionBox({
            ...currentSelectionBox,
            x: newX,
            y: newY,
            width: Math.abs(newWidth),
            height: Math.abs(newHeight)
        });
    };

    return {
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
    };
};
