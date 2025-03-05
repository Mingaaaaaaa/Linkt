export type ExcalidrawElement = {
    id: string;
    type: "rectangle" | "ellipse" | "line" | "arrow" | "text";
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
    gridSize?: number | null;
    showGrid?: boolean;
};

export type ToolType =
    | "selection"
    | "rectangle"
    | "ellipse"
    | "line"
    | "arrow"
    | "text"
    | "eraser"
    | "hand";

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