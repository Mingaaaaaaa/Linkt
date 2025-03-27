import { useState } from "react";
import { ExcalidrawElement, PointerCoords } from "../types";
import { CreatingElement, FreeDrawingState } from "../types/interactionTypes";
import {
    createRectangle,
    createEllipse,
    createLine,
    createArrow,
    createText,
    createFreeDraw,
    simplifyPath
} from "../ElementUtils";



export const useElementCreation = (
    addElement: (element: ExcalidrawElement) => void,
    updateElement: (id: string, props: Partial<ExcalidrawElement>) => void,
    setSelectedElementIds: (ids: Record<string, boolean>) => void,
    forceRender: () => void
) => {
    const [creatingElement, setCreatingElement] = useState<CreatingElement | null>(null);
    const [freeDrawing, setFreeDrawing] = useState<FreeDrawingState | null>(null);

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
            case 'freeDraw':
                startFreeDrawing(sceneCoords);
                return;
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

    // 开始自由绘制
    const startFreeDrawing = (sceneCoords: PointerCoords) => {
        // 创建新的自由绘制元素
        const element = createFreeDraw(sceneCoords.x, sceneCoords.y, {
            strokeColor: '#000000',
            strokeWidth: 2
        });

        // 初始化自由绘制状态
        setFreeDrawing({
            element,
            lastPoint: [0, 0], // 相对于元素坐标的起始点
            lastTime: Date.now(),
            points: [[0, 0]] // 初始点
        });

        // 添加新元素
        addElement(element);
    };

    // 更新自由绘制
    const updateFreeDrawing = (sceneCoords: PointerCoords) => {
        if (!freeDrawing) return;

        const { element, points } = freeDrawing;

        // 计算相对于元素坐标系的点
        const x = sceneCoords.x - element.x;
        const y = sceneCoords.y - element.y;

        // 添加新点
        const newPoints: [number, number][] = [...points, [x, y]];

        // 计算元素的宽度和高度
        let minX = Number.MAX_VALUE;
        let minY = Number.MAX_VALUE;
        let maxX = Number.MIN_VALUE;
        let maxY = Number.MIN_VALUE;

        for (const point of newPoints) {
            minX = Math.min(minX, point[0]);
            minY = Math.min(minY, point[1]);
            maxX = Math.max(maxX, point[0]);
            maxY = Math.max(maxY, point[1]);
        }

        // 如果有足够多的点，尝试简化路径
        let pointsToUse = newPoints;
        if (newPoints.length > 10) {
            // pointsToUse = simplifyPath(newPoints, 0.5);
        }

        // 更新元素
        const updatedElement = {
            ...element,
            points: pointsToUse,
            width: Math.max(1, maxX - minX),
            height: Math.max(1, maxY - minY)
        };

        // 更新状态
        setFreeDrawing({
            ...freeDrawing,
            element: updatedElement,
            lastPoint: [x, y],
            lastTime: Date.now(),
            points: pointsToUse
        });

        // 更新元素
        updateElement(element.id, updatedElement);

        // 触发重新渲染
        forceRender();
    };

    // 结束自由绘制
    const finishFreeDrawing = () => {
        if (!freeDrawing) return;

        // 最终简化路径点，提高性能
        const finalPoints = simplifyPath(freeDrawing.points, 1);

        // 更新元素的最终路径
        updateElement(freeDrawing.element.id, {
            points: finalPoints
        });

        // 重置状态
        setFreeDrawing(null);

        // 触发重新渲染
        forceRender();
    };

    return {
        creatingElement,
        setCreatingElement,
        handleElementCreationStart,
        handleElementCreationResize,
        freeDrawing,
        startFreeDrawing,
        updateFreeDrawing,
        finishFreeDrawing
    };
};
