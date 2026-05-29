'use client';

import { useEffect, useRef, useCallback } from 'react';

interface FlickeringGridProps {
  squareSize?: number;
  gridGap?: number;
  flickerChance?: number;
  color?: string;
  maxOpacity?: number;
  className?: string;
  width?: number;
  height?: number;
}

export function FlickeringGrid({
  squareSize = 4,
  gridGap = 6,
  flickerChance = 0.3,
  color = '#ffffff',
  maxOpacity = 0.3,
  className,
  width,
  height,
}: FlickeringGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const hexToRgb = useCallback((hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
      : { r: 255, g: 255, b: 255 };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { r, g, b } = hexToRgb(color);

    let animId = 0;

    const setupAndDraw = () => {
      const w = width ?? canvas.offsetWidth;
      const h = height ?? canvas.offsetHeight;
      if (!w || !h) return;
      canvas.width = w;
      canvas.height = h;

      const cols = Math.floor(w / (squareSize + gridGap));
      const rows = Math.floor(h / (squareSize + gridGap));
      const opacities = new Float32Array(cols * rows);
      for (let i = 0; i < opacities.length; i++) {
        opacities[i] = Math.random() * maxOpacity;
      }

      const draw = () => {
        ctx.clearRect(0, 0, w, h);
        for (let i = 0; i < opacities.length; i++) {
          if (Math.random() < flickerChance) {
            opacities[i] = Math.random() * maxOpacity;
          }
          ctx.fillStyle = `rgba(${r},${g},${b},${opacities[i]})`;
          const col = i % cols;
          const row = Math.floor(i / cols);
          ctx.fillRect(
            col * (squareSize + gridGap),
            row * (squareSize + gridGap),
            squareSize,
            squareSize,
          );
        }
        animId = requestAnimationFrame(draw);
        animFrameRef.current = animId;
      };

      cancelAnimationFrame(animFrameRef.current);
      draw();
    };

    setupAndDraw();

    const observer = new ResizeObserver(setupAndDraw);
    observer.observe(canvas);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      observer.disconnect();
    };
  }, [squareSize, gridGap, flickerChance, color, maxOpacity, width, height, hexToRgb]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: width ?? '100%', height: height ?? '100%' }}
    />
  );
}
