import { NonDeletedExcalidrawElement, ExcalidrawElement, ExcalidrawTextElement } from "../types";
import { ResizeHandle } from "../Renderer";

// 拖动状态类型
export interface DragInfo {
    elementIds: string[];
    startX: number;
    startY: number;
    originalElements: NonDeletedExcalidrawElement[];
}

// 拉伸状态类型
export interface ResizeInfo {
    element: NonDeletedExcalidrawElement;
    handle: ResizeHandle;
    originalElement: NonDeletedExcalidrawElement;
    originalMouseX: number;
    originalMouseY: number;
}

// 选择框状态类型
export interface SelectionBox {
    startX: number;
    startY: number;
    x: number;
    y: number;
    width: number;
    height: number;
}

// 元素创建状态类型
export interface CreatingElement {
    type: ExcalidrawElement["type"];
    startX: number;
    startY: number;
    elementId: string;
}

// 平移状态类型
export interface PanInfo {
    startX: number;
    startY: number;
    startScrollX: number;
    startScrollY: number;
}

// 文本编辑状态类型
export interface TextEditingInfo {
    element: ExcalidrawTextElement;
    inputValue: string;
    x: number;
    y: number;
    width: number;
    height: number;
}
