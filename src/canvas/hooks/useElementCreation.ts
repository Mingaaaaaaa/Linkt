import { useState } from "react";
import { ExcalidrawElement, PointerCoords } from "../types";
import { CreatingElement } from "../types/interactionTypes";
import {
    createRectangle,
    createEllipse,
    createLine,
    createArrow,
    createText
} from "../ElementUtils";

export const useElementCreation = (
    addElement: (element: ExcalidrawElement) => void,
    updateElement: (id: string, props: Partial<ExcalidrawElement>) => void,
    setSelectedElementIds: (ids: Record<string, boolean>) => void,
    forceRender: () => void
) => {
    const [creatingElement, setCreatingElement] = useState<CreatingElement | null>(null);

    // 处理开始创建元素
    const handleElementCreationStart = (
        type: ExcalidrawElement['type'],
        sceneCoords: PointerCoords
    ) => {
        // 创建一个初始很小的元素
        const seed = Math.floor(Math.random() * 2000);
        let newElement: ExcalidrawElement;

        switch (type) {
            case 'rectangle':
                newElement = createRectangle(sceneCoords.x, sceneCoords.y, 1, 1, { seed });
                break;
            case 'ellipse':
                newElement = createEllipse(sceneCoords.x, sceneCoords.y, 1, 1, { seed });
                break;
            case 'line':
                newElement = createLine(sceneCoords.x, sceneCoords.y, 1, 1, { seed });
                break;
            case 'arrow':
                newElement = createArrow(sceneCoords.x, sceneCoords.y, 1, 1, { seed });
                break;
            case 'text':
                newElement = createText(sceneCoords.x, sceneCoords.y, 100, 50, { seed });
                break;
            default:
                return;
        }

        // 添加元素并记录创建状态
        addElement(newElement);
        setSelectedElementIds({ [newElement.id]: true });

        setCreatingElement({
            type,
            startX: sceneCoords.x,
            startY: sceneCoords.y,
            elementId: newElement.id
        });
    };

    // 处理元素创建过程中的调整大小
    const handleElementCreationResize = (
        sceneCoords: PointerCoords,
        currentCreatingElement: CreatingElement
    ) => {
        if (!currentCreatingElement) return;

        const { startX, startY, elementId } = currentCreatingElement;

        // 计算新的宽度和高度
        const width = sceneCoords.x - startX;
        const height = sceneCoords.y - startY;

        // 确定元素的新位置和尺寸
        let newX = startX;
        let newY = startY;
        let newWidth = width;
        let newHeight = height;

        // 支持向任何方向拖拽
        if (width < 0) {
            newX = startX + width;
            newWidth = Math.abs(width);
        }

        if (height < 0) {
            newY = startY + height;
            newHeight = Math.abs(height);
        }

        // 确保最小尺寸
        newWidth = Math.max(newWidth, 10);
        newHeight = Math.max(newHeight, 10);

        // 更新元素
        updateElement(elementId, {
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight
        });

        // 手动触发渲染，确保立即更新
        forceRender();
    };

    return {
        creatingElement,
        setCreatingElement,
        handleElementCreationStart,
        handleElementCreationResize
    };
};
