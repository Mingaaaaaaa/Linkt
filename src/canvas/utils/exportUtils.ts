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
    format?: string;
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

// 公共的渲染函数：准备图像渲染所需画布和SVG
const prepareRendering = (options: ExportOptions): {
    canvas?: HTMLCanvasElement;
    svg?: SVGSVGElement;
    svgNS?: string;
    roughSVG?: any;
    exportArea: { x: number; y: number; width: number; height: number };
    elementsToExport: readonly NonDeletedExcalidrawElement[];
    exportAppState: any;
    scale: number;
} => {
    const { exportBackground, appState } = options;
    const { elements: elementsToExport, scale, padding } = prepareElementsForExport(options);

    if (elementsToExport.length === 0) {
        throw new Error('没有可导出的元素');
    }

    // 计算导出区域
    const exportArea = getExportSize(elementsToExport, padding);

    // 创建通用的应用状态，调整坐标系使选中区域居中
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

    // 根据输出类型不同，准备不同的渲染目标
    if (options.format === 'png' || !options.format) {
        // 创建临时画布 - 不添加到DOM
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = exportArea.width * scale;
        tempCanvas.height = exportArea.height * scale;
        // 确保canvas不会被意外显示
        tempCanvas.style.position = 'absolute';
        tempCanvas.style.opacity = '0';
        tempCanvas.style.pointerEvents = 'none';
        tempCanvas.style.zIndex = '-9999';
        tempCanvas.style.top = '-9999px';
        tempCanvas.style.left = '-9999px';

        return {
            canvas: tempCanvas,
            exportArea,
            elementsToExport,
            exportAppState,
            scale
        };
    } else if (options.format === 'svg') {
        // 创建SVG文档 - 不添加到DOM
        const svgNS = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNS, 'svg');
        svg.setAttribute('width', `${exportArea.width * scale}`);
        svg.setAttribute('height', `${exportArea.height * scale}`);
        svg.setAttribute('viewBox', `0 0 ${exportArea.width * scale} ${exportArea.height * scale}`);
        // 确保SVG不会被意外显示
        svg.style.position = 'absolute';
        svg.style.opacity = '0';
        svg.style.pointerEvents = 'none';
        svg.style.zIndex = '-9999';
        svg.style.top = '-9999px';
        svg.style.left = '-9999px';

        // 设置背景色
        if (exportBackground) {
            const background = document.createElementNS(svgNS, 'rect');
            background.setAttribute('width', '100%');
            background.setAttribute('height', '100%');
            background.setAttribute('fill', appState.viewBackgroundColor);
            svg.appendChild(background);
        }

        // 为每个元素创建SVG元素
        const roughSVG = rough.svg(svg);

        return {
            svg,
            svgNS,
            roughSVG,
            exportArea,
            elementsToExport,
            exportAppState,
            scale
        };
    }

    throw new Error(`不支持的格式: ${options.format}`);
};

// 渲染SVG元素
const renderSVGElements = (
    svg: SVGSVGElement,
    roughSVG: any,
    svgNS: string,
    elementsToExport: readonly NonDeletedExcalidrawElement[],
    exportArea: { x: number; y: number; width: number; height: number },
    scale: number
): void => {
    // 调整元素坐标，使其相对于导出区域
    elementsToExport.forEach(element => {
        const adjustedElement = {
            ...element,
            x: (element.x - exportArea.x) * scale,
            y: (element.y - exportArea.y) * scale,
            width: element.width * scale,
            height: element.height * scale
        };

        // 根据元素类型创建相应的SVG元素
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
};

// 导出为 PNG
export const exportToPNG = async (options: ExportOptions): Promise<void> => {
    try {
        const renderResult = prepareRendering({ ...options, format: 'png' });
        const { canvas, elementsToExport, exportAppState } = renderResult;

        if (!canvas) throw new Error('无法创建画布');

        const renderer = new Renderer(canvas);

        // 渲染到临时画布
        renderer.render(elementsToExport, exportAppState);

        // 将画布转换为 PNG 并下载
        const dataURL = canvas.toDataURL('image/png');
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
    try {
        const renderResult = prepareRendering({ ...options, format: 'svg' });
        const { svg, svgNS, roughSVG, elementsToExport, exportArea, scale } = renderResult;

        if (!svg || !svgNS || !roughSVG) throw new Error('无法创建SVG');

        // 渲染SVG元素
        renderSVGElements(svg, roughSVG, svgNS, elementsToExport, exportArea, scale);

        // 将 SVG 转换为字符串并下载
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svg);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
        const svgUrl = URL.createObjectURL(svgBlob);

        const filename = options.filename || `whiteboard-export-${new Date().toISOString().slice(0, 10)}.svg`;
        const link = document.createElement('a');
        link.href = svgUrl;
        link.download = filename;
        link.click();

        // 清理
        URL.revokeObjectURL(svgUrl);
    } catch (error) {
        console.error('导出SVG失败:', error);
    }
};

// 导出为.linkt格式（自定义格式）
export const saveToLinkt = async (options: ExportOptions): Promise<void> => {
    const { elements, appState, exportBackground } = options;

    if (elements.length === 0) {
        console.warn('没有可保存的元素');
        return;
    }

    // 创建要保存的数据结构
    const saveData = {
        version: '1.0.0',
        timestamp: Date.now(),
        appState: {
            viewBackgroundColor: appState.viewBackgroundColor,
            zoom: appState.zoom,
            scrollX: appState.scrollX,
            scrollY: appState.scrollY,
            showGrid: appState.showGrid,
            exportBackground
        },
        elements: elements
    };

    // 转换为JSON字符串
    const jsonString = JSON.stringify(saveData, null, 2);
    const linktBlob = new Blob([jsonString], { type: 'application/linkt' });
    const linktUrl = URL.createObjectURL(linktBlob);

    // 创建下载链接
    const filename = options.filename || `whiteboard-save-${new Date().toISOString().slice(0, 10)}.linkt`;
    const link = document.createElement('a');
    link.href = linktUrl;
    link.download = filename;
    link.click();

    // 清理
    URL.revokeObjectURL(linktUrl);
};

// 导入.linkt文件
export const importFromLinkt = async (file: File): Promise<{ elements: NonDeletedExcalidrawElement[], appState: any } | null> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                if (!event.target || !event.target.result) {
                    throw new Error('读取文件失败');
                }

                const jsonData = JSON.parse(event.target.result as string);

                // 验证数据格式
                if (!jsonData.elements || !Array.isArray(jsonData.elements) || !jsonData.appState) {
                    throw new Error('无效的.linkt文件格式');
                }

                // 确保所有元素都有必要的属性
                const validElements = jsonData.elements.filter((element: any) => {
                    return element && element.id && element.type &&
                        typeof element.x === 'number' &&
                        typeof element.y === 'number';
                });

                // 返回解析后的数据
                resolve({
                    elements: validElements as NonDeletedExcalidrawElement[],
                    appState: jsonData.appState
                });
            } catch (error) {
                console.error('解析.linkt文件失败:', error);
                reject(error);
            }
        };

        reader.onerror = () => {
            reject(new Error('读取文件时发生错误'));
        };

        reader.readAsText(file);
    });
};

// 导出选中元素为PNG并复制到剪贴板
export const copySelectedToPNG = async (options: ExportOptions): Promise<boolean> => {
    let tempCanvas = null;
    try {
        const renderResult = prepareRendering({ ...options, format: 'png' });
        const { canvas, elementsToExport, exportAppState } = renderResult;

        if (!canvas) throw new Error('无法创建画布');
        tempCanvas = canvas;

        // 添加到DOM但在屏幕外渲染
        if (!tempCanvas.parentNode) {
            document.body.appendChild(tempCanvas);
        }

        const renderer = new Renderer(canvas);

        // 渲染到临时画布
        renderer.render(elementsToExport, exportAppState);

        // 将画布内容复制到剪贴板
        return new Promise((resolve) => {
            canvas.toBlob(async (blob) => {
                if (blob) {
                    try {
                        // 主流浏览器支持直接复制图像
                        await navigator.clipboard.write([
                            new ClipboardItem({
                                [blob.type]: blob
                            })
                        ]);
                        console.log('图像已复制到剪贴板');
                        resolve(true);
                    } catch (err) {
                        console.error('复制到剪贴板失败:', err);

                        // 回退方案：创建一个临时下载链接
                        const dataURL = canvas.toDataURL('image/png');
                        const link = document.createElement('a');
                        link.href = dataURL;
                        link.download = `selection-export-${new Date().toISOString().slice(0, 10)}.png`;
                        link.click();
                        resolve(false);
                    }
                } else {
                    resolve(false);
                }
            }, 'image/png');
        });
    } catch (error) {
        console.error('复制PNG到剪贴板失败:', error);
        return false;
    } finally {
        // 确保临时Canvas被清理
        if (tempCanvas) {
            if (tempCanvas.parentNode) {
                tempCanvas.parentNode.removeChild(tempCanvas);
            }
            // 额外尝试关闭上下文和释放资源
            const ctx = tempCanvas.getContext('2d');
            if (ctx) {
                // @ts-ignore - 某些浏览器支持的释放资源方法
                if (typeof ctx.reset === 'function') ctx.reset();
                else ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
            }
        }
    }
};

// 导出选中元素为SVG并复制到剪贴板
export const copySelectedToSVG = async (options: ExportOptions): Promise<boolean> => {
    let tempSvg = null;
    try {
        const renderResult = prepareRendering({ ...options, format: 'svg' });
        const { svg, svgNS, roughSVG, elementsToExport, exportArea, scale } = renderResult;

        if (!svg || !svgNS || !roughSVG) throw new Error('无法创建SVG');
        tempSvg = svg;

        // 添加到DOM但在屏幕外渲染
        if (!tempSvg.parentNode) {
            document.body.appendChild(tempSvg);
        }

        // 渲染SVG元素
        renderSVGElements(svg, roughSVG, svgNS, elementsToExport, exportArea, scale);

        // 转换为字符串
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svg);

        try {
            // 尝试将SVG字符串复制到剪贴板
            await navigator.clipboard.writeText(svgString);
            console.log('SVG已复制到剪贴板');
            return true;
        } catch (error) {
            console.error('复制SVG到剪贴板失败:', error);

            // 回退方案：创建下载链接
            const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
            const svgUrl = URL.createObjectURL(svgBlob);
            const link = document.createElement('a');
            link.href = svgUrl;
            link.download = `selection-export-${new Date().toISOString().slice(0, 10)}.svg`;
            link.click();
            URL.revokeObjectURL(svgUrl);
            return false;
        }
    } catch (error) {
        console.error('复制SVG到剪贴板失败:', error);
        return false;
    } finally {
        // 确保临时SVG被清理
        if (tempSvg) {
            if (tempSvg.parentNode) {
                tempSvg.parentNode.removeChild(tempSvg);
            }
            // 移除所有子元素以释放资源
            while (tempSvg.firstChild) {
                tempSvg.removeChild(tempSvg.firstChild);
            }
        }
    }
}; 