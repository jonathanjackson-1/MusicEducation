'use client';

import { useEffect, useRef, useState } from 'react';
import { HighlighterIcon, PenSquareIcon, Undo2Icon } from 'lucide-react';

import { Button } from '@/components/ui/button';

type Mode = 'highlight' | 'draw';

interface PdfAnnotatorProps {
  src: string;
  onExport?: (dataUrl: string) => void;
}

export const PdfAnnotator = ({ src, onExport }: PdfAnnotatorProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mode, setMode] = useState<Mode>('highlight');
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const getContext = () => canvasRef.current?.getContext('2d', { willReadFrequently: true }) ?? null;

  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = getContext();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    setIsDrawing(true);
    setHistory((prev) => [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)]);
    draw(event, true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    onExport?.(canvasRef.current?.toDataURL('image/png') ?? '');
  };

  const draw = (event: React.PointerEvent<HTMLCanvasElement>, begin = false) => {
    if (!isDrawing && !begin) return;
    const ctx = getContext();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    ctx.globalCompositeOperation = 'source-over';
    ctx.lineCap = 'round';
    ctx.lineWidth = mode === 'highlight' ? 20 : 4;
    ctx.strokeStyle = mode === 'highlight' ? 'rgba(250, 204, 21, 0.35)' : '#ef4444';

    if (begin) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const undo = () => {
    const ctx = getContext();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    setHistory((prev) => {
      const clone = [...prev];
      const previous = clone.pop();
      if (previous) {
        ctx.putImageData(previous, 0, 0);
        return clone;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return [];
    });
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-background p-4">
      <div className="flex flex-wrap gap-2">
        <Button variant={mode === 'highlight' ? 'default' : 'secondary'} className="gap-2" onClick={() => setMode('highlight')}>
          <HighlighterIcon className="h-4 w-4" /> Highlight
        </Button>
        <Button variant={mode === 'draw' ? 'default' : 'secondary'} className="gap-2" onClick={() => setMode('draw')}>
          <PenSquareIcon className="h-4 w-4" /> Draw
        </Button>
        <Button variant="outline" className="gap-2" onClick={undo}>
          <Undo2Icon className="h-4 w-4" /> Undo
        </Button>
      </div>
      <div ref={containerRef} className="relative h-[600px] w-full overflow-hidden rounded-md border border-border">
        <iframe title="PDF preview" src={src} className="h-full w-full" />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full cursor-crosshair"
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
        />
      </div>
    </div>
  );
};

