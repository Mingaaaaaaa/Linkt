import React, { useEffect, useRef } from 'react';

interface ScaleRulerProps {
  width: number;
  height: number;
  zoom: number;
  scrollX: number;
  scrollY: number;
  unit: 'px' | 'cm' | 'mm' | 'in';
}

export const ScaleRuler: React.FC<ScaleRulerProps> = ({
  width,
  height,
  zoom,
  scrollX,
  scrollY,
  unit
}) => {
  const horizontalRulerRef = useRef<HTMLCanvasElement>(null);
  const verticalRulerRef = useRef<HTMLCanvasElement>(null);

  const RULER_SIZE = 20; // 标尺宽度

  // 单位转换因子
  const getUnitFactor = () => {
    switch (unit) {
      case 'cm':
        return 37.8; // 1cm ≈ 37.8px
      case 'mm':
        return 3.78; // 1mm ≈ 3.78px
      case 'in':
        return 96; // 1in = 96px
      default:
        return 1; // px
    }
  };

  // 获取单位标签
  const getUnitLabel = () => {
    return unit;
  };

  // 绘制水平标尺
  const drawHorizontalRuler = () => {
    const canvas = horizontalRulerRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置高清显示
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = RULER_SIZE * dpr;
    ctx.scale(dpr, dpr);

    canvas.style.width = `${width}px`;
    canvas.style.height = `${RULER_SIZE}px`;

    // 清除画布
    ctx.clearRect(0, 0, width, RULER_SIZE);

    // 设置样式
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, width, RULER_SIZE);
    ctx.strokeStyle = '#aaa';
    ctx.fillStyle = '#555';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const unitFactor = getUnitFactor();

    // 计算最适合当前缩放级别的刻度间隔
    let interval = calculateTickInterval(zoom, unitFactor);

    // 计算起始刻度位置
    const startX = Math.floor(-scrollX / zoom / interval) * interval;

    // 绘制刻度和标签
    for (let x = startX; x < (width + scrollX) / zoom; x += interval) {
      const canvasX = x * zoom + scrollX;
      if (canvasX < 0) continue;
      if (canvasX > width) break;

      // 主刻度
      ctx.beginPath();
      ctx.moveTo(canvasX, RULER_SIZE);
      ctx.lineTo(canvasX, RULER_SIZE / 2);
      ctx.stroke();

      // 标签 - 根据当前单位显示
      const label = Math.round(x / unitFactor);
      if (label % 5 === 0 || interval * unitFactor >= 50) {
        // 只在合适的间隔显示标签
        ctx.fillText(`${label}`, canvasX, 2);
      }

      // 次刻度
      const minorTickCount = 5; // 每个主刻度之间的次刻度数量
      const minorInterval = interval / minorTickCount;
      for (let i = 1; i < minorTickCount; i++) {
        const minorX = (x + minorInterval * i) * zoom + scrollX;
        if (minorX > 0 && minorX < width) {
          ctx.beginPath();
          ctx.moveTo(minorX, RULER_SIZE);
          ctx.lineTo(minorX, RULER_SIZE * 0.8);
          ctx.stroke();
        }
      }
    }

    // 绘制单位标签
    ctx.fillStyle = '#888';
    ctx.textAlign = 'left';
    ctx.fillText(getUnitLabel(), 5, 2);
  };

  // 绘制垂直标尺
  const drawVerticalRuler = () => {
    const canvas = verticalRulerRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 设置高清显示
    const dpr = window.devicePixelRatio || 1;
    canvas.width = RULER_SIZE * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    canvas.style.width = `${RULER_SIZE}px`;
    canvas.style.height = `${height}px`;

    // 清除画布
    ctx.clearRect(0, 0, RULER_SIZE, height);

    // 设置样式
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, RULER_SIZE, height);
    ctx.strokeStyle = '#aaa';
    ctx.fillStyle = '#555';
    ctx.font = '10px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const unitFactor = getUnitFactor();

    // 计算最适合当前缩放级别的刻度间隔
    let interval = calculateTickInterval(zoom, unitFactor);

    // 计算起始刻度位置
    const startY = Math.floor(-scrollY / zoom / interval) * interval;

    // 绘制刻度和标签
    for (let y = startY; y < (height + scrollY) / zoom; y += interval) {
      const canvasY = y * zoom + scrollY;
      if (canvasY < 0) continue;
      if (canvasY > height) break;

      // 主刻度
      ctx.beginPath();
      ctx.moveTo(RULER_SIZE, canvasY);
      ctx.lineTo(RULER_SIZE / 2, canvasY);
      ctx.stroke();

      // 标签 - 根据当前单位显示
      const label = Math.round(y / unitFactor);
      if (label % 5 === 0 || interval * unitFactor >= 50) {
        // 只在合适的间隔显示标签
        ctx.fillText(`${label}`, RULER_SIZE - 2, canvasY);
      }

      // 次刻度
      const minorTickCount = 5; // 每个主刻度之间的次刻度数量
      const minorInterval = interval / minorTickCount;
      for (let i = 1; i < minorTickCount; i++) {
        const minorY = (y + minorInterval * i) * zoom + scrollY;
        if (minorY > 0 && minorY < height) {
          ctx.beginPath();
          ctx.moveTo(RULER_SIZE, minorY);
          ctx.lineTo(RULER_SIZE * 0.8, minorY);
          ctx.stroke();
        }
      }
    }
  };

  // 计算最适合当前缩放级别的刻度间隔
  const calculateTickInterval = (zoom: number, unitFactor: number) => {
    // 以实际显示的像素单位计算合适的间隔
    const targetIntervalPixels = 50; // 目标刻度间隔（像素）
    let interval = targetIntervalPixels / zoom; // 先以像素为单位计算间隔

    // 转换为当前单位
    interval = interval / unitFactor;

    // 将间隔圆整到最接近的"漂亮"数字
    // 如1, 2, 5, 10, 20, 50, 100等
    const magnitude = Math.pow(10, Math.floor(Math.log10(interval)));
    const normalizedInterval = interval / magnitude;

    if (normalizedInterval < 1.5) {
      interval = 1 * magnitude;
    } else if (normalizedInterval < 3.5) {
      interval = 2 * magnitude;
    } else if (normalizedInterval < 7.5) {
      interval = 5 * magnitude;
    } else {
      interval = 10 * magnitude;
    }

    // 确保返回的间隔在当前单位下至少有1个单位
    return Math.max(interval, 1 / unitFactor);
  };

  // 当相关参数变化时重新绘制
  useEffect(() => {
    drawHorizontalRuler();
    drawVerticalRuler();
  }, [width, height, zoom, scrollX, scrollY, unit]);

  return (
    <>
      {/* 左上角方块 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: RULER_SIZE,
          height: RULER_SIZE,
          background: '#e0e0e0',
          borderRight: '1px solid #ccc',
          borderBottom: '1px solid #ccc',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          color: '#888'
        }}
      >
        {unit}
      </div>

      {/* 水平标尺 */}
      <canvas
        ref={horizontalRulerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: RULER_SIZE,
          height: RULER_SIZE,
          borderBottom: '1px solid #ccc',
          zIndex: 1
        }}
      />

      {/* 垂直标尺 */}
      <canvas
        ref={verticalRulerRef}
        style={{
          position: 'absolute',
          top: RULER_SIZE,
          left: 0,
          width: RULER_SIZE,
          borderRight: '1px solid #ccc',
          zIndex: 1
        }}
      />
    </>
  );
};
