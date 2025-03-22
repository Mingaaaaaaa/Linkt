import rough from "roughjs";
import { NonDeletedExcalidrawElement, AppState, ExcalidrawTextElement } from "./types";

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

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.ctx.translate(appState.scrollX, appState.scrollY);
        this.ctx.scale(appState.zoom.value, appState.zoom.value);

        // 绘制背景
        this.renderBackground(appState);

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
        }

        // 如果元素被选中，绘制选中框和拉伸点
        if (isSelected) {
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
        this.ctx.lineWidth = 1 / appState.zoom.value;

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
} 