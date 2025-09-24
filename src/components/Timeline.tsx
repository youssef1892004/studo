'use client';

import { TTSCardData } from '@/lib/types';
import { Play, Pause, RotateCcw, LoaderCircle } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

interface TimelineProps {
  cards: TTSCardData[];
}

export default function Timeline({ cards }: TimelineProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  
  const audioSegments = cards.filter(c => c.audioUrl && c.duration);

  useEffect(() => {
    const total = audioSegments.reduce((sum, card) => sum + (card.duration || 0), 0);
    setTotalDuration(total);
  }, [cards]);

  const updateProgress = () => {
    if (audioRef.current && totalDuration > 0) {
      let elapsedInPreviousSegments = 0;
      for (let i = 0; i < currentCardIndex; i++) {
        elapsedInPreviousSegments += audioSegments[i].duration || 0;
      }
      const newCurrentTime = elapsedInPreviousSegments + audioRef.current.currentTime;
      setCurrentTime(newCurrentTime);
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }
  };
  
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
  
    const handlePlayNext = () => {
      if (currentCardIndex < audioSegments.length - 1) {
        setCurrentCardIndex(currentCardIndex + 1);
      } else {
        setIsPlaying(false);
        setCurrentCardIndex(0);
        setCurrentTime(0);
      }
    };
  
    audio.addEventListener('ended', handlePlayNext);
    return () => audio.removeEventListener('ended', handlePlayNext);
  }, [currentCardIndex, audioSegments]);
  
  useEffect(() => {
    if (isPlaying && audioSegments[currentCardIndex]?.audioUrl) {
      audioRef.current!.src = audioSegments[currentCardIndex].audioUrl!;
      audioRef.current!.play();
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    } else {
      audioRef.current?.pause();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  }, [isPlaying, currentCardIndex]);

  const togglePlayPause = () => {
    if(audioSegments.length === 0) return;
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || totalDuration === 0) return;

    const progressBar = progressBarRef.current;
    const rect = progressBar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = clickX / rect.width;
    const seekTime = totalDuration * percentage;
    
    let accumulatedTime = 0;
    for (let i = 0; i < audioSegments.length; i++) {
        const segmentDuration = audioSegments[i].duration || 0;
        if (seekTime < accumulatedTime + segmentDuration) {
            setCurrentCardIndex(i);
            const timeInSegment = seekTime - accumulatedTime;
            audioRef.current!.src = audioSegments[i].audioUrl!;
            audioRef.current!.currentTime = timeInSegment;
            setCurrentTime(seekTime);
            if (isPlaying) audioRef.current!.play();
            break;
        }
        accumulatedTime += segmentDuration;
    }
  };

  return (
    <div className="w-full flex items-center gap-4 p-2 bg-gray-50 rounded-lg">
      <audio ref={audioRef} />
      <button onClick={togglePlayPause} className="p-2 bg-black text-white rounded-full">
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
      </button>

      <div className="flex-grow flex flex-col">
        <div ref={progressBarRef} className="w-full h-8 flex cursor-pointer" onClick={handleSeek}>
          {audioSegments.map((card, index) => (
            <div
              key={card.id}
              style={{ width: `${((card.duration || 0) / totalDuration) * 100}%` }}
              className={`h-full border-r-2 border-white relative group ${ index % 2 === 0 ? 'bg-blue-200' : 'bg-indigo-200'}`}
            >
              {card.isGenerating && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                    <LoaderCircle className="animate-spin text-gray-600"/>
                </div>
              )}
            </div>
          ))}
        </div>
        <div ref={progressBarRef} className="w-full bg-gray-300 h-1.5 rounded-full mt-2 relative cursor-pointer" onClick={handleSeek}>
            <div className="bg-black h-full rounded-full" style={{ width: `${(currentTime / totalDuration) * 100}%` }}/>
            <div className="absolute h-3.5 w-3.5 bg-black rounded-full -top-1 border-2 border-white" style={{ left: `calc(${(currentTime / totalDuration) * 100}% - 7px)` }}/>
        </div>
      </div>

      <div className="text-sm font-mono text-gray-600 w-12 text-center">{formatTime(currentTime)} / {formatTime(totalDuration)}</div>
    </div>
  );
}