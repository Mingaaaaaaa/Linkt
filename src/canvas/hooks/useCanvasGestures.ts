import { useState } from "react";
import { PanInfo } from "../types/interactionTypes";

export const useCanvasGestures = (
    setZoom: (value: number) => void,
    setScrollPosition: (x: number, y: number) => void
) => {
    // 平移状态
    const [panInfo, setPanInfo] = useState<PanInfo | null>(null);

    // 处理平移
    const handlePan = (clientX: number, clientY: number, scrollX: number, scrollY: number) => {
        if (!panInfo) return;

        const deltaX = clientX - panInfo.startX;
        const deltaY = clientY - panInfo.startY;

        setScrollPosition(
            panInfo.startScrollX + deltaX,
            panInfo.startScrollY + deltaY
        );
    };

    // 处理缩放
    const handleZoom = (
        e: React.WheelEvent<HTMLCanvasElement>,
        zoom: number,
        scrollX: number,
        scrollY: number,
        canvasRef: React.RefObject<HTMLCanvasElement>
    ) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const { clientX, clientY, deltaY } = e;
        const { left, top } = rect;

        const x = clientX - left;
        const y = clientY - top;

        // 缩放计算
        const zoomFactor = 0.1;
        const direction = Math.sign(deltaY);
        const currentZoom = zoom;
        const newZoom = Math.min(
            10,
            Math.max(0.1, currentZoom * (1 - direction * zoomFactor))
        );

        if (newZoom === currentZoom) return;

        // 计算相对于鼠标指针的场景位置
        const sceneX = (x - scrollX) / currentZoom;
        const sceneY = (y - scrollY) / currentZoom;

        // 调整滚动以保持鼠标位置稳定
        const newScrollX = scrollX + (sceneX - (x - scrollX) / newZoom) * newZoom;
        const newScrollY = scrollY + (sceneY - (y - scrollY) / newZoom) * newZoom;

        setZoom(newZoom);
        setScrollPosition(newScrollX, newScrollY);
    };

    return {
        panInfo,
        setPanInfo,
        handlePan,
        handleZoom
    };
};
