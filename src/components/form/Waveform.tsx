import React, { useEffect, useRef } from 'react';
import { useResolvedTheme } from '../../lib/theme';

export interface WaveformProps {
  analyser: AnalyserNode | null;
  audioLevel?: number;
  className?: string;
  height?: number;
  barCount?: number;
}

export const Waveform: React.FC<WaveformProps> = ({
  analyser,
  audioLevel = 0,
  className = '',
  height = 48,
  barCount = 32,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);
  const theme = useResolvedTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 280;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    ctx.scale(dpr, dpr);

    const buffer = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      if (analyser && buffer) {
        analyser.getByteFrequencyData(buffer);
      }

      const barWidth = 3;
      const gap = (width - barCount * barWidth) / (barCount - 1);
      const centerY = height / 2;

      for (let i = 0; i < barCount; i++) {
        let val = 0.1;
        if (analyser && buffer) {
          const index = Math.floor((i / barCount) * (buffer.length / 2));
          val = Math.max(0.1, buffer[index] / 255);
        } else if (audioLevel > 0) {
          val = Math.max(0.1, audioLevel * (0.5 + Math.sin(i * 0.4 + Date.now() * 0.01) * 0.5));
        }

        const barHeight = Math.max(4, val * (height - 8));
        const x = i * (barWidth + gap);
        const y = centerY - barHeight / 2;

        const isDark = theme === 'dark';
        const color = isDark ? `rgba(198, 255, 61, ${0.4 + val * 0.6})` : `rgba(63, 104, 0, ${0.4 + val * 0.6})`;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      if (analyser || audioLevel > 0) {
        animRef.current = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [analyser, audioLevel, barCount, height, theme]);

  return (
    <div className={`w-full flex items-center justify-center ${className}`}>
      <canvas ref={canvasRef} className="w-full max-w-[320px]" style={{ height: `${height}px` }} />
    </div>
  );
};
