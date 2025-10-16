'use client';

import { useEffect, useRef, useState } from 'react';
import { PauseCircleIcon, PlayCircleIcon, RotateCcwIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface PracticeTimerProps {
  onComplete?: (minutes: number) => void;
}

export const PracticeTimer = ({ onComplete }: PracticeTimerProps) => {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [running]);

  const toggle = () => {
    setRunning((prev) => !prev);
  };

  const reset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSeconds(0);
    setRunning(false);
    onComplete?.(0);
  };

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  useEffect(() => {
    const minutesElapsed = seconds / 60;
    if (!running && seconds > 0) {
      onComplete?.(minutesElapsed);
    }
  }, [running, seconds, onComplete]);

  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-background p-6 text-center">
      <div className="text-5xl font-semibold tabular-nums">
        {minutes.toString().padStart(2, '0')}:{remainder.toString().padStart(2, '0')}
      </div>
      <div className="flex gap-2">
        <Button onClick={toggle} className="gap-2">
          {running ? (
            <>
              <PauseCircleIcon className="h-5 w-5" /> Pause
            </>
          ) : (
            <>
              <PlayCircleIcon className="h-5 w-5" /> Start
            </>
          )}
        </Button>
        <Button variant="outline" onClick={reset} className="gap-2">
          <RotateCcwIcon className="h-5 w-5" /> Reset
        </Button>
      </div>
    </div>
  );
};

