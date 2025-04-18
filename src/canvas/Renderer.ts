import rough from "roughjs";
import { NonDeletedExcalidrawElement, AppState, ExcalidrawTextElement, ExcalidrawFreeDrawElement, ExcalidrawImageElement } from "./types";

// 定义拉伸点的位置
export enum ResizeHandle {
    TopLeft = "tl",
    TopRight = "tr",
    BottomRight = "br",
    BottomLeft = "bl",
    Start = "start",
    End = "end"
}

export class Renderer {
    private canvas: HTMLCanvasElement;
    private roughCanvas: any;
    private ctx: CanvasRenderingContext2D;
    private roughGenerators: Map<string, any> = new Map();
    private imageCache: Map<string, HTMLImageElement> = new Map();
    private loadingImages: Set<string> = new Set();

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!;
        this.roughCanvas = rough.canvas(canvas);
    }

    render(
        elements: readonly NonDeletedExcalidrawElement[],
        appState: AppState
    ) {
        if (!this.ctx) {
            return;
        }

        // 保存当前元素和状态
        this.currentElements = elements;
        this.currentAppState = appState;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.ctx.translate(appState.scrollX, appState.scrollY);
        this.ctx.scale(appState.zoom.value, appState.zoom.value);

        // 绘制背景
        this.renderBackground(appState);

        // 修改网格渲染条件判断，使用严格判断
        if (appState.showGrid === true) {
            this.renderGrid(appState);
        }

        // 绘制元素
        elements.forEach((element) => {
            this.renderElement(element, appState);
        });

        this.ctx.restore();
    }

    private renderBackground(appState: AppState) {
        this.ctx.fillStyle = appState.viewBackgroundColor;
        this.ctx.fillRect(
            -appState.scrollX / appState.zoom.value,
            -appState.scrollY / appState.zoom.value,
            this.canvas.width / appState.zoom.value,
            this.canvas.height / appState.zoom.value
        );
    }

    // 添加网格渲染方法
    private renderGrid(appState: AppState) {
        const { gridSize, zoom, scrollX, scrollY } = appState;
        const actualGridSize = gridSize || 20;

        const gridColor = 'rgba(0, 0, 0, 0.1)';
        this.ctx.save();
        this.ctx.strokeStyle = gridColor;
        this.ctx.lineWidth = 1 / zoom.value;

        // 计算可见区域的网格线
        const startX = Math.floor(-scrollX / zoom.value / actualGridSize) * actualGridSize;
        const startY = Math.floor(-scrollY / zoom.value / actualGridSize) * actualGridSize;
        const endX = startX + (this.canvas.width / zoom.value) + actualGridSize * 2;
        const endY = startY + (this.canvas.height / zoom.value) + actualGridSize * 2;

        // 绘制垂直线
        for (let x = startX; x < endX; x += actualGridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, startY);
            this.ctx.lineTo(x, endY);
            this.ctx.stroke();
        }

        // 绘制水平线
        for (let y = startY; y < endY; y += actualGridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(startX, y);
            this.ctx.lineTo(endX, y);
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    private getRoughGenerator(element: NonDeletedExcalidrawElement) {
        // 使用元素的 id 和 seed 作为缓存键
        const key = `${element.id}_${element.seed || 0}`;

        if (!this.roughGenerators.has(key)) {
            // 创建新的 rough 生成器并缓存
            const generator = rough.generator();
            this.roughGenerators.set(key, generator);
            return generator;
        }

        return this.roughGenerators.get(key);
    }

    private renderElement(
        element: NonDeletedExcalidrawElement,
        appState: AppState
    ) {
        this.ctx.save();
        this.ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
        this.ctx.rotate(element.angle);
        this.ctx.translate(-element.width / 2, -element.height / 2);

        // 设置元素的透明度
        this.ctx.globalAlpha = (element.opacity !== undefined ? element.opacity : 100) / 100;

        const isSelected = appState.selectedElementIds[element.id];
        const options = {
            stroke: element.strokeColor,
            fill: element.backgroundColor,
            fillStyle: element.fillStyle,
            strokeWidth: element.strokeWidth,
            roughness: element.roughness,
            seed: element.seed || 0
        };

        // 获取或创建 rough 生成器
        const generator = this.getRoughGenerator(element);

        switch (element.type) {
            case "rectangle": {
                const shape = generator.rectangle(0, 0, element.width, element.height, options);
                this.roughCanvas.draw(shape);
                break;
            }
            case "ellipse": {
                const shape = generator.ellipse(
                    element.width / 2,
                    element.height / 2,
                    element.width,
                    element.height,
                    options
                );
                this.roughCanvas.draw(shape);
                break;
            }
            case "line": {
                const shape = generator.line(0, 0, element.width, element.height, options);
                this.roughCanvas.draw(shape);
                break;
            }
            case "arrow": {
                // 绘制箭头线条
                const shape = generator.line(0, 0, element.width, element.height, options);
                this.roughCanvas.draw(shape);

                // 绘制箭头头部
                this.drawArrowhead(element.width, element.height, options.stroke);
                break;
            }
            case "text": {
                const textElement = element as ExcalidrawTextElement;
                this.ctx.font = `${textElement.fontSize || 20}px ${textElement.fontFamily || 'sans-serif'}`;
                this.ctx.fillStyle = element.strokeColor;
                this.ctx.textAlign = textElement.textAlign || "left";
                this.ctx.textBaseline = "top";

                // 渲染文本内容
                const text = textElement.text || "双击编辑文本";
                const lines = text.split('\n');
                const lineHeight = (textElement.fontSize || 20) * 1.2;

                lines.forEach((line, index) => {
                    this.ctx.fillText(line, 0, index * lineHeight);
                });
                break;
            }
            case 'freeDraw':
                this.renderFreeDrawElement(
                    this.ctx,
                    element as ExcalidrawFreeDrawElement,
                    appState
                );
                break;
            case 'image':
                this.renderImageElement(
                    this.ctx,
                    element as ExcalidrawImageElement
                );
                break;
        }

        // 如果元素被选中，绘制选中框和拉伸点
        if (isSelected) {
            // 重置透明度，确保选择框和控制点不受透明度影响
            this.ctx.globalAlpha = 1;
            this.renderSelectionBorder(element, appState);
            this.renderResizeHandles(element, appState);
        }

        this.ctx.restore();
    }

    // 绘制箭头头部
    private drawArrowhead(x: number, y: number, color: string) {
        const arrowSize = 10;
        this.ctx.fillStyle = color;

        // 计算箭头方向
        const angle = Math.atan2(y, x);
        const reverseAngle = angle;

        this.ctx.save();
        this.ctx.translate(x, y);

        // 绘制三角形箭头
        this.ctx.beginPath();
        this.ctx.moveTo(2, 0);
        this.ctx.lineTo(
            -arrowSize * Math.cos(reverseAngle - Math.PI / 6),
            -arrowSize * Math.sin(reverseAngle - Math.PI / 6)
        );
        this.ctx.lineTo(
            -arrowSize * Math.cos(reverseAngle + Math.PI / 6),
            -arrowSize * Math.sin(reverseAngle + Math.PI / 6)
        );
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.restore();
    }

    private renderSelectionBorder(
        element: NonDeletedExcalidrawElement,
        appState: AppState
    ) {
        this.ctx.strokeStyle = "blue";
        this.ctx.lineWidth = 1 / appState?.zoom?.value || 1;

        if (element.type === "line" || element.type === "arrow") {
            // 对于线条和箭头，不绘制选中框，只绘制拉伸点
            return;
        }

        this.ctx.strokeRect(-4, -4, element.width + 8, element.height + 8);
    }

    private renderResizeHandles(
        element: NonDeletedExcalidrawElement,
        appState: AppState
    ) {
        const handleSize = 8 / appState.zoom.value;

        if (element.type === "line" || element.type === "arrow") {
            // 对于线条和箭头，只在两端绘制拉伸点
            const handlePositions = [
                { x: 0 - handleSize / 2, y: 0 - handleSize / 2, cursor: "move", handle: ResizeHandle.Start },
                { x: element.width - handleSize / 2, y: element.height - handleSize / 2, cursor: "move", handle: ResizeHandle.End }
            ];

            // 绘制拉伸点
            this.ctx.fillStyle = "white";
            this.ctx.strokeStyle = "blue";
            this.ctx.lineWidth = 1 / appState.zoom.value;

            handlePositions.forEach(({ x, y }) => {
                this.ctx.fillRect(x, y, handleSize, handleSize);
                this.ctx.strokeRect(x, y, handleSize, handleSize);
            });

            return;
        }

        // 对于其他元素，绘制四个角落的拉伸点
        const handlePositions = [
            // 角落 - 调整位置使拉伸点的中心点在边角坐标上
            { x: -4 - handleSize / 2, y: -4 - handleSize / 2, cursor: "nwse-resize", handle: ResizeHandle.TopLeft },
            { x: element.width + 4 - handleSize / 2, y: -4 - handleSize / 2, cursor: "nesw-resize", handle: ResizeHandle.TopRight },
            { x: element.width + 4 - handleSize / 2, y: element.height + 4 - handleSize / 2, cursor: "nwse-resize", handle: ResizeHandle.BottomRight },
            { x: -4 - handleSize / 2, y: element.height + 4 - handleSize / 2, cursor: "nesw-resize", handle: ResizeHandle.BottomLeft }
        ];

        // 绘制拉伸点
        this.ctx.fillStyle = "white";
        this.ctx.strokeStyle = "blue";
        this.ctx.lineWidth = 1 / appState.zoom.value;

        handlePositions.forEach(({ x, y }) => {
            this.ctx.fillRect(x, y, handleSize, handleSize);
            this.ctx.strokeRect(x, y, handleSize, handleSize);
        });
    }

    // 检查点击是否在拉伸点上
    public getResizeHandleAtPosition(
        element: NonDeletedExcalidrawElement,
        x: number,
        y: number,
        zoom: number
    ): ResizeHandle | null {
        if (!element) return null;

        const handleSize = 8 / zoom;

        if (element.type === "line" || element.type === "arrow") {
            // 对于线条和箭头，只检查两端的拉伸点
            const handlePositions = [
                { x: element.x - handleSize / 2, y: element.y - handleSize / 2, handle: ResizeHandle.Start },
                { x: element.x + element.width - handleSize / 2, y: element.y + element.height - handleSize / 2, handle: ResizeHandle.End }
            ];

            for (const { x: handleX, y: handleY, handle } of handlePositions) {
                if (
                    x >= handleX &&
                    x <= handleX + handleSize &&
                    y >= handleY &&
                    y <= handleY + handleSize
                ) {
                    return handle;
                }
            }

            return null;
        }

        // 对于其他元素，检查四个角落的拉伸点
        const handlePositions = [
            // 角落 - 调整位置使拉伸点的中心点在边角坐标上
            { x: element.x - 4 - handleSize / 2, y: element.y - 4 - handleSize / 2, handle: ResizeHandle.TopLeft },
            { x: element.x + element.width + 4 - handleSize / 2, y: element.y - 4 - handleSize / 2, handle: ResizeHandle.TopRight },
            { x: element.x + element.width + 4 - handleSize / 2, y: element.y + element.height + 4 - handleSize / 2, handle: ResizeHandle.BottomRight },
            { x: element.x - 4 - handleSize / 2, y: element.y + element.height + 4 - handleSize / 2, handle: ResizeHandle.BottomLeft }
        ];

        for (const { x: handleX, y: handleY, handle } of handlePositions) {
            if (
                x >= handleX &&
                x <= handleX + handleSize &&
                y >= handleY &&
                y <= handleY + handleSize
            ) {
                return handle;
            }
        }

        return null;
    }

    private renderFreeDrawElement(
        context: CanvasRenderingContext2D,
        element: ExcalidrawFreeDrawElement,
        appState: AppState
    ) {
        const { points, strokeColor, strokeWidth } = element;

        if (!points || points.length < 2) return;

        // 保存当前上下文
        context.save();

        // 设置元素的透明度
        context.globalAlpha = (element.opacity !== undefined ? element.opacity : 100);

        // 设置绘制样式
        context.strokeStyle = strokeColor;
        context.lineWidth = strokeWidth;
        context.lineCap = 'round';
        context.lineJoin = 'round';

        // 开始绘制路径
        context.beginPath();
        context.moveTo(points[0][0], points[0][1]);

        // 使用曲线平滑连接点
        for (let i = 1; i < points.length; i++) {
            // 对于少量点直接连接
            if (points.length < 3) {
                context.lineTo(points[i][0], points[i][1]);
            } else {
                // 对于更多点，使用二次贝塞尔曲线平滑连接
                const currentPoint = points[i];

                if (i < points.length - 1) {
                    const nextPoint = points[i + 1];
                    // 计算中点作为终点
                    const midPointX = (currentPoint[0] + nextPoint[0]) / 2;
                    const midPointY = (currentPoint[1] + nextPoint[1]) / 2;

                    // 使用当前点作为控制点，中点作为终点
                    context.quadraticCurveTo(
                        currentPoint[0], currentPoint[1], // 控制点
                        midPointX, midPointY             // 终点
                    );
                } else {
                    // 最后一个点直接连线
                    context.lineTo(currentPoint[0], currentPoint[1]);
                }
            }
        }

        // 描边路径
        context.stroke();

        // 如果选中了元素，绘制选中框
        if (appState.selectedElementIds && appState.selectedElementIds[element.id]) {
            // 重置透明度，确保选择框不受透明度影响
            context.globalAlpha = 1;
            this.renderSelectionBorder(element as NonDeletedExcalidrawElement, appState);
        }

        // 恢复上下文
        context.restore();
    }

    private renderImageElement(
        context: CanvasRenderingContext2D,
        element: ExcalidrawImageElement,
    ) {
        const { dataURL, width, height } = element;

        // 如果图片已经在缓存中，直接渲染
        if (this.imageCache.has(dataURL)) {
            const img = this.imageCache.get(dataURL)!;
            context.drawImage(img, 0, 0, width, height);
            return;
        }

        // 如果图片正在加载中，不重复加载
        if (this.loadingImages.has(dataURL)) {
            return;
        }

        // 标记图片为加载中
        this.loadingImages.add(dataURL);

        const img = new Image();
        img.src = dataURL;

        img.onload = () => {
            // 将加载完成的图片加入缓存
            this.imageCache.set(dataURL, img);
            // 从加载中集合移除
            this.loadingImages.delete(dataURL);
            // 重新渲染画布
            this.render(this.getCurrentElements(), this.getCurrentAppState());
        };

        img.onerror = () => {
            console.error('图片加载失败:', dataURL);
            this.loadingImages.delete(dataURL);
        };
    }

    // 添加获取当前元素和状态的方法
    private currentElements: readonly NonDeletedExcalidrawElement[] = [];
    private currentAppState: AppState | null = null;

    private getCurrentElements() {
        return this.currentElements;
    }

    private getCurrentAppState() {
        return this.currentAppState!;
    }
}