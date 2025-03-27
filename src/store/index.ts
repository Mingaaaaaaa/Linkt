import { create } from 'zustand'
import { AppState, ExcalidrawElement, ToolType, NonDeletedExcalidrawElement } from '../canvas/types'
import { Scene } from '../canvas/Scene'
import { persist, createJSONStorage } from 'zustand/middleware'

interface CanvasStore extends AppState {
    // 场景相关
    scene: Scene
    elements: ExcalidrawElement[] // 添加元素数组，用于持久化

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

    // 获取元素
    getElements: () => readonly ExcalidrawElement[]
    getNonDeletedElements: () => readonly NonDeletedExcalidrawElement[]
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
            viewBackgroundColor: '#ffffff',
            zoom: { value: 1 },
            offsetLeft: 0,
            offsetTop: 0,
            width: window.innerWidth,
            height: window.innerHeight - 60,
            selectedElementIds: {},
            scrollX: 0,
            scrollY: 0,
            currentTool: 'selection',
            editingElement: null,
            penMode: false,
            penDetected: false,
            exportBackground: true,
            gridSize: 20,
            showGrid: false,

            // 场景和元素
            scene: initialScene,
            elements: storedElements,

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
                const { scene } = get()
                // 为每个新添加的元素添加版本标记
                const elementWithVersion = {
                    ...element,
                    version: 1, // 初始版本为1
                    lastModified: Date.now()
                };
                scene.addElement(elementWithVersion)
                // 更新 elements 数组用于持久化
                set({
                    scene: scene,
                    elements: [...scene.getElements()]
                })
            },

            updateElement: (elementId: string, updates: Partial<ExcalidrawElement>
            ) => {
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
                const { scene } = get()
                scene.deleteElement(elementId)
                set({
                    scene: scene,
                    elements: [...scene.getElements()]
                })
            },

            replaceAllElements: (elements: ExcalidrawElement[]) => {
                const { scene } = get()
                scene.replaceAllElements(elements)
                set({
                    scene: scene,
                    elements: [...scene.getElements()]
                })
            },

            // 获取元素
            getElements: () => {
                const { scene } = get()
                return scene.getElements()
            },

            getNonDeletedElements: () => {
                const { scene } = get()
                return scene.getNonDeletedElements()
            }
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
                scrollY: state.scrollY
            })
        }
    )
)