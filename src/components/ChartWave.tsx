'use client';

import { useEffect, useRef } from 'react';

interface ChartWaveProps {
  color?: string;
  amplitude?: number;
  frequency?: number;
  speed?: number;
  height?: number;
  width?: number;
  className?: string;
  offsetY?: number; // Vertical offset for wave positioning
  isGlowing?: boolean; // Glow effect for new records
  thickness?: number; // Line thickness
}

export default function ChartWave({
  color = 'red',
  amplitude = 10,
  frequency = 0.01,
  speed = 1,
  height = 60,
  width = 300,
  className = '',
  offsetY = 0,
  isGlowing = false,
  thickness = 2,
}: ChartWaveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phase = useRef(0);
  const animationId = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = width;
    canvas.height = height;

    const animate = () => {
      // Increment phase continuously for infinite motion
      phase.current += speed;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Begin path for wave
      ctx.beginPath();

      // Draw seamless infinite wave with vertical offset
      for (let x = 0; x < canvas.width; x++) {
        const y = (height / 2) + offsetY + amplitude * Math.sin((x + phase.current) * frequency);
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      // 🌟 SPECIAL VISUALS: Glow effect for new records
      if (isGlowing) {
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness + 2; // Thicker when glowing
        ctx.shadowBlur = 20; // Strong glow
        ctx.shadowColor = color;
        ctx.globalAlpha = 0.9;
      } else {
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness;
        ctx.shadowBlur = 8;
        ctx.shadowColor = color;
        ctx.globalAlpha = 0.8;
      }
      
      ctx.stroke();
      ctx.globalAlpha = 1; // Reset alpha

      // Continue animation
      animationId.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      if (animationId.current) {
        cancelAnimationFrame(animationId.current);
      }
    };
  }, [amplitude, frequency, speed, height, width, color]);

  return (
    <canvas 
      ref={canvasRef} 
      className={className}
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%'
      }}
    />
  );
}