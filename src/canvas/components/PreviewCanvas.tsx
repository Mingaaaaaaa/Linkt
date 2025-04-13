import React, { useEffect, useRef } from 'react';

interface PreviewCanvasProps {
  elements: any[];
  width: number;
  height: number;
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  elements,
  width,
  height
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !elements || elements.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, width, height);

    // 设置背景色
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, width, height);

    // 计算元素的边界框，用于自动缩放
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    elements.forEach((element) => {
      const right = element.x + (element.width || 0);
      const bottom = element.y + (element.height || 0);

      minX = Math.min(minX, element.x);
      minY = Math.min(minY, element.y);
      maxX = Math.max(maxX, right);
      maxY = Math.max(maxY, bottom);
    });

    // 添加边距
    const padding = 20;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;

    // 计算缩放比例
    const elementWidth = maxX - minX;
    const elementHeight = maxY - minY;
    const scaleX = width / elementWidth;
    const scaleY = height / elementHeight;
    const scale = Math.min(scaleX, scaleY);

    // 保存当前状态
    ctx.save();

    // 应用变换
    ctx.translate(-minX * scale, -minY * scale);
    ctx.scale(scale, scale);

    // 绘制元素
    elements.forEach((element) => {
      try {
        drawElement(ctx, element);
      } catch (err) {
        console.error('绘制元素出错:', err);
      }
    });

    // 恢复状态
    ctx.restore();
  }, [elements, width, height]);

  // 简化的元素绘制函数
  const drawElement = (ctx: CanvasRenderingContext2D, element: any) => {
    ctx.strokeStyle = element.strokeColor || '#000000';
    ctx.fillStyle = element.backgroundColor || 'transparent';
    ctx.lineWidth = element.strokeWidth || 1;

    switch (element.type) {
      case 'rectangle':
        ctx.beginPath();
        ctx.rect(element.x, element.y, element.width, element.height);
        if (element.backgroundColor) {
          ctx.fill();
        }
        ctx.stroke();
        break;

      case 'ellipse':
        ctx.beginPath();
        ctx.ellipse(
          element.x + element.width / 2,
          element.y + element.height / 2,
          element.width / 2,
          element.height / 2,
          0,
          0,
          Math.PI * 2
        );
        if (element.backgroundColor) {
          ctx.fill();
        }
        ctx.stroke();
        break;

      case 'line':
        ctx.beginPath();
        ctx.moveTo(element.x, element.y);
        ctx.lineTo(element.x + element.width, element.y + element.height);
        ctx.stroke();
        break;

      case 'arrow':
        ctx.beginPath();
        ctx.moveTo(element.x, element.y);
        ctx.lineTo(element.x + element.width, element.y + element.height);
        ctx.stroke();

        // 简单箭头
        if (element.endArrowhead) {
          const angle = Math.atan2(element.height, element.width);
          const length = 10;

          ctx.beginPath();
          ctx.moveTo(element.x + element.width, element.y + element.height);
          ctx.lineTo(
            element.x + element.width - length * Math.cos(angle - Math.PI / 7),
            element.y + element.height - length * Math.sin(angle - Math.PI / 7)
          );
          ctx.moveTo(element.x + element.width, element.y + element.height);
          ctx.lineTo(
            element.x + element.width - length * Math.cos(angle + Math.PI / 7),
            element.y + element.height - length * Math.sin(angle + Math.PI / 7)
          );
          ctx.stroke();
        }
        break;

      case 'text':
        ctx.fillStyle = element.strokeColor || '#000000';
        ctx.font = '14px Arial';
        ctx.fillText(element.text || '', element.x, element.y + 14);
        break;

      case 'freeDraw':
        if (element.points && element.points.length > 0) {
          ctx.beginPath();
          const firstPoint = element.points[0];
          ctx.moveTo(element.x + firstPoint[0], element.y + firstPoint[1]);

          for (let i = 1; i < element.points.length; i++) {
            const point = element.points[i];
            ctx.lineTo(element.x + point[0], element.y + point[1]);
          }

          ctx.stroke();
        }
        break;

      default:
        console.warn('未支持的元素类型:', element.type);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: `${height}px`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: '4px',
        overflow: 'hidden'
      }}
    >
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ maxWidth: '100%', border: '1px solid #ddd' }}
      />
    </div>
  );
};
