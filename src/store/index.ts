import { create } from 'zustand'
import { AppState, ExcalidrawElement, ToolType, NonDeletedExcalidrawElement } from '../canvas/types'
import { Scene } from '../canvas/Scene'
import { persist, createJSONStorage } from 'zustand/middleware'

// 定义历史记录项类型
interface HistoryEntry {
    elements: ExcalidrawElement[];
}

interface CanvasStore extends AppState {
    // 场景相关
    scene: Scene
    elements: ExcalidrawElement[] // 添加元素数组，用于持久化
    undoStack: HistoryEntry[];
    redoStack: HistoryEntry[];
    isCurrentlyRecording: boolean; // 添加标记，表示是否正在记录历史

    // 操作方法
    setCurrentTool: (tool: ToolType) => void
    setSelectedElementIds: (elementIds: Record<string, boolean>) => void
    setZoom: (zoom: number) => void
    setScrollPosition: (scrollX: number, scrollY: number) => void
    setViewBackgroundColor: (color: string) => void

    // 元素操作
    addElement: (element: ExcalidrawElement) => void
    updateElement: (elementId: string, updates: Partial<ExcalidrawElement>) => void
    deleteElement: (elementId: string) => void
    replaceAllElements: (elements: ExcalidrawElement[]) => void

    // 撤销和重做
    undo: () => void
    redo: () => void
    recordCurrentStateToHistory: () => void
    startRecordingHistory: () => void // 开始一组操作
    stopRecordingHistory: () => void  // 结束一组操作并记录历史

    // 清空重做栈
    clearRedoStack: () => void

    // 获取元素
    getElements: () => readonly ExcalidrawElement[]
    getNonDeletedElements: () => readonly NonDeletedExcalidrawElement[]

    // 设置网格显示
    setShowGrid: (showGrid: boolean) => void

    // 添加比例尺相关状态
    showRulers: boolean;
    rulerUnit: 'px' | 'cm' | 'mm' | 'in';
    toggleRulers: () => void;
    setRulerUnit: (unit: 'px' | 'cm' | 'mm' | 'in') => void;
}

// 创建一个新的 Scene 实例
const initialScene = new Scene()

// 从本地存储中获取元素
const storedData = localStorage.getItem('canvas-storage')
let storedElements: ExcalidrawElement[] = []
if (storedData) {
    try {
        const parsed = JSON.parse(storedData)
        if (parsed.state && parsed.state.elements) {
            storedElements = parsed.state.elements
            // 将存储的元素添加到初始场景
            initialScene.replaceAllElements(storedElements)
            console.log("从存储恢复元素:", storedElements.length)
        }
    } catch (e) {
        console.error("解析存储数据失败:", e)
    }
}

export const useCanvasStore = create<CanvasStore>()(
    persist(
        (set, get) => ({
            // 基本状态
            viewBackgroundColor: '#f8f9fa', // 改为浅灰色背景
            zoom: { value: 1 },
            offsetLeft: 0,
            offsetTop: 0,
            width: window.innerWidth,
            height: window.innerHeight - 60,
            selectedElementIds: {},
            scrollX: 0,
            scrollY: 0,
            currentTool: 'line', // 默认使用直线工具
            editingElement: null,
            penMode: false,
            penDetected: false,
            exportBackground: true,
            gridSize: 20,
            showGrid: true, // 默认显示网格

            // 场景和元素
            scene: initialScene,
            elements: storedElements,

            // 历史记录
            undoStack: [],
            redoStack: [],
            isCurrentlyRecording: false, // 默认不在记录状态

            // 记录当前状态到历史
            recordCurrentStateToHistory: () => {
                const { elements, undoStack, isCurrentlyRecording } = get();
                // 如果正在记录中，则不创建新的历史记录点
                if (isCurrentlyRecording) return;

                // 避免记录相同的状态
                if (undoStack.length > 0) {
                    const lastState = undoStack[undoStack.length - 1];
                    // 如果元素数量相同，可能是相同状态，进行深度比较
                    if (lastState.elements.length === elements.length) {
                        const lastElements = JSON.stringify(lastState.elements);
                        const currentElements = JSON.stringify(elements);
                        if (lastElements === currentElements) {
                            return; // 状态相同，不记录
                        }
                    }
                }

                // 保存当前状态的深拷贝到撤销栈
                const currentState: HistoryEntry = {
                    elements: JSON.parse(JSON.stringify(elements))
                };

                set({
                    undoStack: [...undoStack, currentState],
                    redoStack: []
                });
            },

            // 开始记录操作 - 用于拖拽、调整大小等连续操作
            startRecordingHistory: () => {
                const { elements, undoStack } = get();

                // 首先记录当前状态，作为操作开始前的状态
                const currentState: HistoryEntry = {
                    elements: JSON.parse(JSON.stringify(elements))
                };

                set({
                    undoStack: [...undoStack, currentState],
                    redoStack: [], // 清空重做栈
                    isCurrentlyRecording: true // 标记为正在记录状态
                });
            },

            // 结束记录操作 - 在连续操作完成时调用
            stopRecordingHistory: () => {
                set({ isCurrentlyRecording: false });
                // 不立即记录状态，交由下一次操作时判断是否需要记录
            },

            // 清空重做栈
            clearRedoStack: () => set({ redoStack: [] }),

            // 操作方法
            setCurrentTool: (tool: ToolType) => set({ currentTool: tool }),

            setSelectedElementIds: (elementIds: Record<string, boolean>) =>
                set({ selectedElementIds: elementIds }),

            setZoom: (zoomValue: number) =>
                set({ zoom: { value: zoomValue } }),

            setScrollPosition: (scrollX: number, scrollY: number) =>
                set({ scrollX, scrollY }),

            setViewBackgroundColor: (color: string) =>
                set({ viewBackgroundColor: color }),

            // 元素操作
            addElement: (element: ExcalidrawElement) => {
                // 添加元素前记录状态
                get().recordCurrentStateToHistory();

                const { scene } = get();
                // 为每个新添加的元素添加版本标记
                const elementWithVersion = {
                    ...element,
                    version: 1, // 初始版本为1
                    lastModified: Date.now()
                };
                scene.addElement(elementWithVersion);
                // 更新 elements 数组用于持久化
                set({
                    scene: scene,
                    elements: [...scene.getElements()]
                });
            },

            updateElement: (elementId: string, updates: Partial<ExcalidrawElement>) => {
                // 更新元素前不记录历史，在交互开始和结束时记录，而不是每次微小更新

                const { scene } = get()
                const element = scene.getElementById(elementId);

                // 如果元素存在，保留原始版本号并增加版本号
                if (element) {
                    // 检查是否已经在updates中提供了版本信息
                    const currentVersion = updates.version || element.version || 1;
                    // 如果updates中没有提供新版本，则自动增加
                    const newVersion = updates.version ? updates.version : currentVersion + 1;

                    const updatedElement = {
                        ...element,
                        ...updates,
                        version: newVersion,
                        lastModified: updates.lastModified || Date.now()
                    };
                    scene.updateElement(elementId, updatedElement)
                } else {
                    scene.updateElement(elementId, {
                        ...updates,
                        version: updates.version || 1,
                        lastModified: updates.lastModified || Date.now()
                    })
                }

                set({
                    scene: scene,
                    elements: [...scene.getElements()]
                })
            },

            deleteElement: (elementId: string) => {
                // 删除元素前记录状态
                get().recordCurrentStateToHistory();

                const { scene } = get()
                scene.deleteElement(elementId)
                set({
                    scene: scene,
                    elements: [...scene.getElements()]
                })
            },

            replaceAllElements: (elements: ExcalidrawElement[]) => {
                const { scene } = get();
                scene.replaceAllElements(elements);
                set({
                    scene: scene,
                    elements: [...scene.getElements()]
                });
            },

            // 撤销操作
            undo: () => {
                const { undoStack, redoStack, elements, scene } = get();
                console.log(undoStack)
                // 如果撤销栈为空，不执行任何操作
                if (undoStack.length === 0) return;

                // 获取撤销栈顶部状态
                const lastState = undoStack[undoStack.length - 1];
                const newUndoStack = undoStack.slice(0, -1);

                // 保存当前状态到重做栈
                const currentState: HistoryEntry = {
                    elements: JSON.parse(JSON.stringify(elements))
                };

                // 更新场景
                scene.replaceAllElements(lastState.elements);

                // 更新状态
                set({
                    undoStack: newUndoStack,
                    redoStack: [...redoStack, currentState],
                    elements: [...lastState.elements],
                    scene: scene
                });
            },

            // 重做操作
            redo: () => {
                const { undoStack, redoStack, elements, scene } = get();

                // 如果重做栈为空，不执行任何操作
                if (redoStack.length === 0) return;

                // 获取重做栈顶部状态
                const nextState = redoStack[redoStack.length - 1];
                const newRedoStack = redoStack.slice(0, -1);

                // 保存当前状态到撤销栈
                const currentState: HistoryEntry = {
                    elements: JSON.parse(JSON.stringify(elements))
                };

                // 更新场景
                scene.replaceAllElements(nextState.elements);

                // 更新状态
                set({
                    undoStack: [...undoStack, currentState],
                    redoStack: newRedoStack,
                    elements: [...nextState.elements],
                    scene: scene
                });
            },

            // 获取元素
            getElements: () => {
                const { scene } = get()
                return scene.getElements()
            },

            getNonDeletedElements: () => {
                const { scene } = get()
                return scene.getNonDeletedElements()
            },

            // 设置网格显示
            setShowGrid: (showGrid: boolean) =>
                set({ showGrid }),

            // 初始化比例尺相关状态
            showRulers: true,
            rulerUnit: 'px',

            // 比例尺相关方法
            toggleRulers: () => set(state => ({ showRulers: !state.showRulers })),
            setRulerUnit: (unit) => set({ rulerUnit: unit })
        }),
        {
            name: 'canvas-storage', // 存储的键名
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                // 只持久化这些字段
                elements: state.elements,
                viewBackgroundColor: state.viewBackgroundColor,
                zoom: state.zoom,
                currentTool: state.currentTool,
                scrollX: state.scrollX,
                scrollY: state.scrollY,
                showGrid: state.showGrid, // 添加网格状态持久化
                // 注意：不持久化历史栈，以避免存储过大
            })
        }
    )
)