'use client';

import { useEffect, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import { PlayIcon, PauseIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface Marker {
  id: string;
  label: string;
  time: number;
  color?: string;
}

interface AudioPlayerProps {
  src: string;
  markers?: Marker[];
}

export const AudioPlayer = ({ src, markers = [] }: AudioPlayerProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#c7d2fe',
      progressColor: '#4338ca',
      cursorColor: '#1e3a8a',
      height: 80,
      responsive: true,
      plugins: [RegionsPlugin.create()]
    });

    wavesurfer.load(src);
    wavesurferRef.current = wavesurfer;

    wavesurfer.on('ready', () => {
      markers.forEach((marker) => {
        wavesurfer.addRegion({
          id: marker.id,
          start: marker.time,
          end: marker.time + 0.5,
          drag: false,
          resize: false,
          color: marker.color ?? 'rgba(168, 85, 247, 0.2)'
        });
      });
    });

    return () => {
      wavesurfer.destroy();
    };
  }, [src, markers]);

  const togglePlayback = () => {
    wavesurferRef.current?.playPause();
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-background p-4">
      <div ref={containerRef} className="w-full" />
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={togglePlayback} className="gap-2">
          <PlayIcon className="h-4 w-4" />
          <span>Play / Pause</span>
        </Button>
        <audio controls className="hidden" src={src} />
      </div>
      {markers.length ? (
        <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
          {markers.map((marker) => (
            <div key={marker.id} className="flex items-center gap-2">
              <PauseIcon className="h-3 w-3" />
              <span className="font-medium text-foreground">{marker.label}</span>
              <span>@ {marker.time.toFixed(1)}s</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

