export type ExcalidrawElement = {
    id: string;
    type: "rectangle" | "ellipse" | "line" | "arrow" | "text" | "freeDraw";
    x: number;
    y: number;
    width: number;
    height: number;
    angle: number;
    strokeColor: string;
    backgroundColor: string;
    fillStyle: "solid" | "hachure" | "cross-hatch";
    strokeWidth: number;
    roughness: number;
    opacity: number;
    isDeleted?: boolean;
    seed?: number;
    groupIds?: string[];
    locked?: boolean;
    link?: string;
    boundElements?: { id: string; type: "arrow" | "text" }[];
    version?: number;
    lastModified?: number;
    originalVersion?: number; // 添加原始版本号，用于冲突检测
    points?: Array<[number, number]>; // 路径点的数组 [x, y]
    text?: string;
};

export type NonDeletedExcalidrawElement = ExcalidrawElement & {
    isDeleted?: false;
};

export type ExcalidrawRectangleElement = ExcalidrawElement & {
    type: "rectangle";
};

export type ExcalidrawEllipseElement = ExcalidrawElement & {
    type: "ellipse";
};

export type ExcalidrawLineElement = ExcalidrawElement & {
    type: "line";
    startArrowhead?: "arrow" | "bar" | "dot" | "triangle" | null;
    endArrowhead?: "arrow" | "bar" | "dot" | "triangle" | null;
};

export type ExcalidrawTextElement = ExcalidrawElement & {
    type: "text";
    text: string;
    fontSize?: number;
    fontFamily?: string;
    textAlign?: "left" | "center" | "right";
    verticalAlign?: "top" | "middle" | "bottom";
};

export type ExcalidrawArrowElement = ExcalidrawElement & {
    type: "arrow";
};

export type ExcalidrawFreeDrawElement = ExcalidrawElement & {
    type: "freeDraw";
    points: Array<[number, number]>; // 路径点的数组 [x, y]
    simulatePressure: boolean; // 是否模拟压力
    strokeWidth: number;
    roughness: number;
    strokeColor: string;
    backgroundColor?: string;
};

export type AppState = {
    viewBackgroundColor: string;
    zoom: {
        value: number;
    };
    offsetLeft: number;
    offsetTop: number;
    width: number;
    height: number;
    selectedElementIds: Record<string, boolean>;
    scrollX: number;
    scrollY: number;
    currentTool?: ToolType;
    editingElement?: string | null;
    penMode?: boolean;
    penDetected?: boolean;
    exportBackground?: boolean;
    gridSize: number; // 更改为必需属性
    showGrid: boolean; // 更改为必需属性
};

export type ToolType =
    | "selection"
    | "rectangle"
    | "ellipse"
    | "line"
    | "arrow"
    | "text"
    | "freeDraw"  // 添加自由绘制工具
    | "hand"
    | "eraser";

export interface Device {
    isMobile: boolean;
    isTouchScreen: boolean;
}

export type Zoom = {
    value: number;
};

export type Offsets = {
    offsetLeft: number;
    offsetTop: number;
};

export type PointerCoords = {
    x: number;
    y: number;
};

export type Dimensions = {
    width: number;
    height: number;
};

export type SceneData = {
    elements: readonly ExcalidrawElement[];
    appState: AppState;
    scrollToContent?: boolean;
};

