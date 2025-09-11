'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useRef } from 'react';
import { useVoiceVisualizer } from 'react-voice-visualizer';

// Dynamically import the VoiceVisualizer and disable Server-Side Rendering (SSR).
const VoiceVisualizer = dynamic(
  () => import('react-voice-visualizer').then(mod => mod.VoiceVisualizer),
  { ssr: false,
    // Optional: add a loading state while the component is being fetched
    loading: () => <p className="text-center text-gray-500">Loading Visualizer...</p>
  }
);

interface AudioPlayerProps {
  audioBlob: Blob;
}

const AudioPlayer = ({ audioBlob }: AudioPlayerProps) => {
  const controls = useVoiceVisualizer();
  const { setPreloadedAudioBlob } = controls;
  const setPreloadedAudioBlobRef = useRef(setPreloadedAudioBlob);

  useEffect(() => {
    if (audioBlob && setPreloadedAudioBlobRef.current) {
        setPreloadedAudioBlobRef.current(audioBlob);
    }
  }, [audioBlob]);

  if (!audioBlob) {
    return null;
  }

  return (
    <div className="w-full">
      <VoiceVisualizer
        controls={controls}
        mainBarColor="#4f46e5"      // Indigo
        secondaryBarColor="#a5b4fc"  // Lighter Indigo
        backgroundColor="#f3f4f6"  // Light Gray
        barWidth={4}
        gap={2}
      />
    </div>
  );
};

export default AudioPlayer;
