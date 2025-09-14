'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useRef, useState } from 'react';
import { useVoiceVisualizer } from 'react-voice-visualizer';

const VoiceVisualizer = dynamic(
  () => import('react-voice-visualizer').then(mod => mod.VoiceVisualizer),
  { ssr: false,
    loading: () => <p className="text-center text-gray-500">Loading Visualizer...</p>
  }
);

interface AudioPlayerProps {
  audioUrl: string;
}

const AudioPlayer = ({ audioUrl }: AudioPlayerProps) => {
  const controls = useVoiceVisualizer();
  const { setPreloadedAudioBlob, clearCanvas } = controls;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const controlsRef = useRef(controls);
  controlsRef.current = controls;

  useEffect(() => {
    if (audioUrl) {
      const fetchAudio = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(audioUrl);
          if (!response.ok) {
            throw new Error('Failed to fetch audio');
          }
          const blob = await response.blob();
          controlsRef.current.setPreloadedAudioBlob(blob);
        } catch (err: any) {
          setError(err.message);
          controlsRef.current.clearCanvas();
        } finally {
          setIsLoading(false);
        }
      };
      fetchAudio();
    } else {
        controlsRef.current.clearCanvas();
    }
  }, [audioUrl]);

  if (isLoading) {
    return <p className="text-center text-gray-500">Loading audio...</p>;
  }
  
  if (error) {
      return <p className="text-center text-red-500">Error: {error}</p>;
  }

  if (!audioUrl) {
    return null;
  }

  return (
    <div className="w-full">
      <VoiceVisualizer
        controls={controls}
        mainBarColor="#4f46e5"
        secondaryBarColor="#a5b4fc"
        backgroundColor="#f3f4f6"
        barWidth={4}
        gap={2}
      />
    </div>
  );
};

export default AudioPlayer;
