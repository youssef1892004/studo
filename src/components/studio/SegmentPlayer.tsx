// src/components/studio/SegmentPlayer.tsx
'use client';

import { Play, Pause } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

interface SegmentPlayerProps {
  audioUrl: string;
  text: string;
}

export default function SegmentPlayer({ audioUrl, text }: SegmentPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // إيقاف أي صوت آخر عند تشغيل هذا الصوت
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => {
      document.querySelectorAll('audio').forEach(otherAudio => {
        if (otherAudio !== audio) {
          otherAudio.pause();
        }
      });
    };
    
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('ended', () => setIsPlaying(false));
    };
  }, [audioUrl]);


  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation(); // يمنع تفعيل المحرر عند الضغط على الزر
    const audio = audioRef.current;
    if (audio) {
      if (isPlaying) {
        audio.pause();
      } else {
        audio.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="mt-2 flex items-center gap-3 p-2 bg-gray-50 rounded-md border border-gray-200 cursor-pointer" onClick={togglePlayPause}>
      <audio ref={audioRef} src={audioUrl} preload="metadata"></audio>
      <button
        onClick={togglePlayPause}
        className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full transition-colors flex-shrink-0"
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
      </button>
      <p className="text-sm text-gray-600 truncate" dir="rtl">
        {text}
      </p>
    </div>
  );
}