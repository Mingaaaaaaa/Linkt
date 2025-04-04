import {
    ExcalidrawElement,
    ExcalidrawFreeDrawElement // 引入自由绘制元素类型
} from './types';

export const createRandomId = () => {
    return Math.random().toString(36).substring(2, 10);
};

export const createElement = (
    type: ExcalidrawElement["type"],
    x: number,
    y: number,
    width: number,
    height: number,
    options: Partial<ExcalidrawElement> = {}
): ExcalidrawElement => {
    return {
        id: createRandomId(),
        type,
        x,
        y,
        width,
        height,
        angle: 0,
        strokeColor: "#000000",
        backgroundColor: "#ffffff",
        fillStyle: "solid",
        strokeWidth: 1,
        roughness: 0,
        opacity: 100,
        ...options,
    };
};

export const createRectangle = (
    x: number,
    y: number,
    width: number,
    height: number,
    options: Partial<ExcalidrawElement> = {}
): ExcalidrawElement => {
    return createElement("rectangle", x, y, width, height, options);
};

export const createEllipse = (
    x: number,
    y: number,
    width: number,
    height: number,
    options: Partial<ExcalidrawElement> = {}
): ExcalidrawElement => {
    return createElement("ellipse", x, y, width, height, options);
};

export const createLine = (
    x: number,
    y: number,
    width: number,
    height: number,
    options: Partial<ExcalidrawElement> = {}
): ExcalidrawElement => {
    return createElement("line", x, y, width, height, options);
};

export const createArrow = (
    x: number,
    y: number,
    width: number,
    height: number,
    options: Partial<ExcalidrawElement> = {}
): ExcalidrawElement => {
    return createElement("arrow", x, y, width, height, options);
};

export const createText = (
    x: number,
    y: number,
    width: number,
    height: number,
    options: Partial<ExcalidrawElement> = {}
): ExcalidrawElement => {
    return createElement("text", x, y, width, height, {
        text: "双击编辑文本",
        ...options
    });
};

// 创建自由绘制元素
export const createFreeDraw = (
    x: number,
    y: number,
    options: {
        strokeColor?: string;
        strokeWidth?: number;
        roughness?: number;
        seed?: number;
    } = {}
): ExcalidrawFreeDrawElement => {
    return {
        id: createRandomId(),
        type: 'freeDraw',
        x,
        y,
        width: 0, // 初始宽度为0
        height: 0, // 初始高度为0
        points: [[0, 0]], // 初始点相对于元素坐标系
        angle: 0,
        strokeColor: options.strokeColor || '#000000',
        strokeWidth: options.strokeWidth || 2,
        roughness: options.roughness || 1,
        seed: options.seed || Math.floor(Math.random() * 2000),
        simulatePressure: true,
        isDeleted: false,
        version: 1,
        lastModified: Date.now(),
        backgroundColor: '#ffffff',
        fillStyle: 'solid',
        opacity: 1,
    };
};

// 用于简化路径点的函数，减少点的数量但保持路径形状
export const simplifyPath = (
    points: Array<[number, number]>,
    tolerance: number = 1
): Array<[number, number]> => {
    if (points.length <= 2) return points;

    // 简化算法 - Douglas-Peucker算法的简化版
    const result: Array<[number, number]> = [points[0]];
    let lastPoint = points[0];

    for (let i = 1; i < points.length - 1; i++) {
        const currentPoint = points[i];
        const nextPoint = points[i + 1];

        // 计算当前点到上一个保留点和下一个点连线的距离
        const dx = nextPoint[0] - lastPoint[0];
        const dy = nextPoint[1] - lastPoint[1];
        const length = Math.sqrt(dx * dx + dy * dy);

        if (length === 0) continue;

        const dist = Math.abs(
            (currentPoint[1] - lastPoint[1]) * dx -
            (currentPoint[0] - lastPoint[0]) * dy
        ) / length;

        // 如果距离大于容差，保留该点
        if (dist > tolerance) {
            result.push(currentPoint);
            lastPoint = currentPoint;
        }
    }

    // 确保添加最后一个点
    if (points.length > 1) {
        result.push(points[points.length - 1]);
    }

    return result;
};

export const createImage = (
    x: number,
    y: number,
    width: number,
    height: number,
    dataURL: string,
    fileType: string,
    fileName?: string,
    options: Partial<ExcalidrawElement> = {}
): ExcalidrawElement => {
    return createElement(
        "image",
        x, y, width, height,
        {
            ...options,
            dataURL,
            fileType,
            fileName,
            roughness: 0, // 图片不需要粗糙效果
            strokeWidth: 0 // 默认无边框
        }
    );
};