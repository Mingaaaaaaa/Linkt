import { ExcalidrawElement } from "./types";

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
        roughness: 1,
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