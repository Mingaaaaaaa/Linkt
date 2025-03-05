import { PointerCoords } from "../types";

/**
 * 将屏幕坐标转换为画布坐标
 */
export const getScenePointerCoords = (
    clientX: number,
    clientY: number,
    canvasRef: React.RefObject<HTMLCanvasElement>,
    scrollX: number,
    scrollY: number,
    zoom: number
): PointerCoords => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) {
        return { x: 0, y: 0 };
    }

    return {
        x: (clientX - rect.left - scrollX) / zoom,
        y: (clientY - rect.top - scrollY) / zoom
    };
};
