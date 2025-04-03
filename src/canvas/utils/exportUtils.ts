import { NonDeletedExcalidrawElement } from '../types';
import { Renderer } from '../Renderer';
import rough from 'roughjs';

interface ExportOptions {
    elements: readonly NonDeletedExcalidrawElement[];
    appState: any;
    exportBackground: boolean;
    exportPadding?: number;
    exportScale?: number;
    exportWithoutSelection?: boolean;
    filename?: string;
}

// 通用的准备导出函数
const prepareElementsForExport = (
    options: ExportOptions
): {
    elements: readonly NonDeletedExcalidrawElement[];
    scale: number;
    padding: number;
} => {
    const {
        elements,
        exportWithoutSelection = false,
        exportPadding = 10,
        exportScale = 1
    } = options;

    // 获取要导出的元素 - 所有元素或选中的元素
    let elementsToExport = elements;
    const selectedElementIds = options.appState.selectedElementIds;
    const hasSelection = Object.keys(selectedElementIds).length > 0;

    if (hasSelection && !exportWithoutSelection) {
        elementsToExport = elements.filter(element => selectedElementIds[element.id]);
    }

    // 为空则返回空数据
    if (elementsToExport.length === 0) {
        return { elements: [], scale: exportScale, padding: exportPadding };
    }

    return {
        elements: elementsToExport,
        scale: exportScale,
        padding: exportPadding
    };
};

// 计算导出图像的区域和尺寸
const getExportSize = (
    elements: readonly NonDeletedExcalidrawElement[],
    padding: number
): { x: number; y: number; width: number; height: number } => {
    if (elements.length === 0) {
        return { x: 0, y: 0, width: 0, height: 0 };
    }

    // 找出包含所有元素的最小区域
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    elements.forEach(element => {
        minX = Math.min(minX, element.x);
        minY = Math.min(minY, element.y);
        maxX = Math.max(maxX, element.x + element.width);
        maxY = Math.max(maxY, element.y + element.height);
    });

    // 添加内边距
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
    };
};

// 导出为 PNG
export const exportToPNG = async (options: ExportOptions): Promise<void> => {
    const { elements, exportBackground, appState } = options;
    const { elements: elementsToExport, scale, padding } = prepareElementsForExport(options);

    if (elementsToExport.length === 0) {
        console.warn('没有可导出的元素');
        return;
    }

    // 计算导出区域
    const exportArea = getExportSize(elementsToExport, padding);

    // 创建临时画布
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = exportArea.width * scale;
    tempCanvas.height = exportArea.height * scale;

    const renderer = new Renderer(tempCanvas);

    // 创建新的应用状态，调整坐标系使选中区域居中
    const exportAppState = {
        ...appState,
        scrollX: -exportArea.x * scale,
        scrollY: -exportArea.y * scale,
        zoom: { value: scale },
        viewBackgroundColor: exportBackground ? appState.viewBackgroundColor : 'transparent',
        selectedElementIds: {},
        showGrid: false,
        exportBackground
    };

    // 渲染到临时画布
    renderer.render(elementsToExport, exportAppState);

    // 将画布转换为 PNG
    try {
        const dataURL = tempCanvas.toDataURL('image/png');

        // 创建下载链接
        const filename = options.filename || `whiteboard-export-${new Date().toISOString().slice(0, 10)}.png`;
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = filename;
        link.click();
    } catch (error) {
        console.error('导出PNG失败:', error);
    }
};

// 导出为 SVG
export const exportToSVG = async (options: ExportOptions): Promise<void> => {
    const { elements, exportBackground, appState } = options;
    const { elements: elementsToExport, scale, padding } = prepareElementsForExport(options);

    if (elementsToExport.length === 0) {
        console.warn('没有可导出的元素');
        return;
    }

    // 计算导出区域
    const exportArea = getExportSize(elementsToExport, padding);

    // 创建 SVG 文档
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('width', `${exportArea.width * scale}`);
    svg.setAttribute('height', `${exportArea.height * scale}`);
    svg.setAttribute('viewBox', `0 0 ${exportArea.width * scale} ${exportArea.height * scale}`);

    // 设置背景色
    if (exportBackground) {
        const background = document.createElementNS(svgNS, 'rect');
        background.setAttribute('width', '100%');
        background.setAttribute('height', '100%');
        background.setAttribute('fill', appState.viewBackgroundColor);
        svg.appendChild(background);
    }

    // 为每个元素创建 SVG 元素
    const roughSVG = rough.svg(svg);

    // 调整元素坐标，使其相对于导出区域
    elementsToExport.forEach(element => {
        const adjustedElement = {
            ...element,
            x: (element.x - exportArea.x) * scale,
            y: (element.y - exportArea.y) * scale,
            width: element.width * scale,
            height: element.height * scale
        };

        // 根据元素类型创建相应的 SVG 元素
        switch (element.type) {
            case 'rectangle': {
                const options = {
                    stroke: element.strokeColor,
                    fill: element.backgroundColor,
                    fillStyle: element.fillStyle,
                    strokeWidth: element.strokeWidth,
                    roughness: element.roughness,
                };
                const rect = roughSVG.rectangle(
                    adjustedElement.x,
                    adjustedElement.y,
                    adjustedElement.width,
                    adjustedElement.height,
                    options
                );
                svg.appendChild(rect);
                break;
            }
            case 'ellipse': {
                const options = {
                    stroke: element.strokeColor,
                    fill: element.backgroundColor,
                    fillStyle: element.fillStyle,
                    strokeWidth: element.strokeWidth,
                    roughness: element.roughness,
                };
                const ellipse = roughSVG.ellipse(
                    adjustedElement.x + adjustedElement.width / 2,
                    adjustedElement.y + adjustedElement.height / 2,
                    adjustedElement.width,
                    adjustedElement.height,
                    options
                );
                svg.appendChild(ellipse);
                break;
            }
            case 'line':
            case 'arrow': {
                const options = {
                    stroke: element.strokeColor,
                    strokeWidth: element.strokeWidth,
                    roughness: element.roughness,
                };
                const line = roughSVG.line(
                    adjustedElement.x,
                    adjustedElement.y,
                    adjustedElement.x + adjustedElement.width,
                    adjustedElement.y + adjustedElement.height,
                    options
                );
                svg.appendChild(line);

                // 如果是箭头，添加箭头头部
                if (element.type === 'arrow') {
                    const arrowSize = 10 * scale;
                    // 计算箭头方向
                    const angle = Math.atan2(
                        adjustedElement.height,
                        adjustedElement.width
                    );

                    // 箭头终点
                    const endX = adjustedElement.x + adjustedElement.width;
                    const endY = adjustedElement.y + adjustedElement.height;

                    // 创建箭头路径
                    const arrowPath = document.createElementNS(svgNS, 'path');
                    arrowPath.setAttribute('fill', element.strokeColor);
                    arrowPath.setAttribute('d', `
            M ${endX},${endY}
            L ${endX - arrowSize * Math.cos(angle - Math.PI / 6)},${endY - arrowSize * Math.sin(angle - Math.PI / 6)}
            L ${endX - arrowSize * Math.cos(angle + Math.PI / 6)},${endY - arrowSize * Math.sin(angle + Math.PI / 6)}
            Z
          `);
                    svg.appendChild(arrowPath);
                }
                break;
            }
            case 'text': {
                const textElement = element as any; // ExcalidrawTextElement
                const text = document.createElementNS(svgNS, 'text');
                text.setAttribute('x', `${adjustedElement.x}`);
                text.setAttribute('y', `${adjustedElement.y}`);
                text.setAttribute('font-family', textElement.fontFamily || 'sans-serif');
                text.setAttribute('font-size', `${(textElement.fontSize || 20) * scale}px`);
                text.setAttribute('fill', element.strokeColor);

                // 处理多行文本
                const lines = (textElement.text || '双击编辑文本').split('\n');
                const lineHeight = (textElement.fontSize || 20) * 1.2 * scale;

                lines.forEach((line: any, index: any) => {
                    const tspan = document.createElementNS(svgNS, 'tspan');
                    tspan.setAttribute('x', `${adjustedElement.x}`);
                    tspan.setAttribute('y', `${adjustedElement.y + index * lineHeight}`);
                    tspan.textContent = line;
                    text.appendChild(tspan);
                });

                svg.appendChild(text);
                break;
            }
            case 'freeDraw': {
                if (element.points && element.points.length >= 2) {
                    const freeDrawElement = element as any; // ExcalidrawFreeDrawElement
                    const path = document.createElementNS(svgNS, 'path');

                    // 构建路径数据
                    let pathData = `M ${(freeDrawElement.x - exportArea.x + freeDrawElement.points[0][0]) * scale} ${(freeDrawElement.y - exportArea.y + freeDrawElement.points[0][1]) * scale}`;

                    for (let i = 1; i < freeDrawElement.points.length; i++) {
                        const point = freeDrawElement.points[i];
                        pathData += ` L ${(freeDrawElement.x - exportArea.x + point[0]) * scale} ${(freeDrawElement.y - exportArea.y + point[1]) * scale}`;
                    }

                    path.setAttribute('d', pathData);
                    path.setAttribute('stroke', freeDrawElement.strokeColor);
                    path.setAttribute('stroke-width', `${freeDrawElement.strokeWidth * scale}`);
                    path.setAttribute('fill', 'none');
                    path.setAttribute('stroke-linecap', 'round');
                    path.setAttribute('stroke-linejoin', 'round');

                    svg.appendChild(path);
                }
                break;
            }
        }
    });

    // 将 SVG 转换为字符串
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
    const svgUrl = URL.createObjectURL(svgBlob);

    // 创建下载链接
    const filename = options.filename || `whiteboard-export-${new Date().toISOString().slice(0, 10)}.svg`;
    const link = document.createElement('a');
    link.href = svgUrl;
    link.download = filename;
    link.click();

    // 清理
    URL.revokeObjectURL(svgUrl);
}; 