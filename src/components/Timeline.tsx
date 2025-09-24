'use client';

import { TTSCardData } from '@/lib/types';
import { Play, Pause, LoaderCircle } from 'lucide-react';
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
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  
  const relevantCards = cards.filter(c => c.data.blocks.some(b => b.data.text && b.data.text.trim().length > 0));
  const audioSegments = relevantCards.filter(c => c.audioUrl && typeof c.duration === 'number');

  useEffect(() => {
    const total = audioSegments.reduce((sum, card) => sum + (card.duration || 0), 0);
    setTotalDuration(total);
  }, [audioSegments]);

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
      cancelAnimationFrame(animationFrameRef.current!);
      if (currentCardIndex < audioSegments.length - 1) {
        setCurrentCardIndex(prevIndex => prevIndex + 1);
      } else {
        setIsPlaying(false);
        setCurrentCardIndex(0);
        setCurrentTime(totalDuration); // Go to the end
      }
    };
  
    audio.addEventListener('ended', handlePlayNext);
    return () => audio.removeEventListener('ended', handlePlayNext);
  }, [currentCardIndex, audioSegments.length, totalDuration]);
  
  useEffect(() => {
    const playCurrentSegment = async () => {
        if (isPlaying && audioSegments[currentCardIndex]?.audioUrl && audioRef.current) {
            if (audioRef.current.src !== audioSegments[currentCardIndex].audioUrl) {
                audioRef.current.src = audioSegments[currentCardIndex].audioUrl!;
            }
            try {
                if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
                await audioRef.current.play();
                animationFrameRef.current = requestAnimationFrame(updateProgress);
            } catch (e) {
                console.error("Error playing audio:", e);
                setIsPlaying(false);
            }
        }
    };
    
    if (isPlaying) {
      playCurrentSegment();
    } else {
      audioRef.current?.pause();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, currentCardIndex, audioSegments]);

  const togglePlayPause = () => {
    if (audioSegments.length === 0) return;
    if (!isPlaying && currentTime >= totalDuration && totalDuration > 0) {
        setCurrentTime(0);
        setCurrentCardIndex(0);
        if(audioRef.current) audioRef.current.currentTime = 0;
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || time < 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineContainerRef.current || totalDuration === 0) return;

    const rect = timelineContainerRef.current.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const seekTime = totalDuration * percentage;
    
    let accumulatedTime = 0;
    for (let i = 0; i < audioSegments.length; i++) {
        const segmentDuration = audioSegments[i].duration || 0;
        if (seekTime <= accumulatedTime + segmentDuration || i === audioSegments.length - 1) {
            const timeInSegment = seekTime - accumulatedTime;
            if (audioRef.current) {
                const audio = audioRef.current;
                const newSrc = audioSegments[i].audioUrl!;

                const seekAndPlay = () => {
                    audio.currentTime = timeInSegment;
                    setCurrentTime(seekTime);
                    if (isPlaying) {
                        audio.play().catch(e => console.error("Play interrupted", e));
                    }
                }
                
                setCurrentCardIndex(i);

                if (audio.src !== newSrc) {
                    audio.src = newSrc;
                    audio.load();
                    audio.onloadedmetadata = seekAndPlay;
                } else {
                    seekAndPlay();
                }
            }
            break;
        }
        accumulatedTime += segmentDuration;
    }
  };
  
  const totalEstimatedDuration = relevantCards.reduce((sum, c) => {
    const textPreview = c.data.blocks.map(b => b.data.text || '').join(' ').trim();
    return sum + (c.duration || (textPreview.length / 15) || 1);
  }, 0) || 1;

  // --- (تعديل) إضافة dir="ltr" لعكس اتجاه المكون ---
  return (
    <div className="w-full flex items-center gap-4 p-2 bg-gray-50 rounded-lg" dir="ltr">
      <audio ref={audioRef} />
      
      {/* --- (تعديل) عكس ترتيب الأزرار والوقت --- */}
      <div className="text-sm font-mono text-gray-600 w-28 text-center flex-shrink-0">{formatTime(currentTime)} / {formatTime(totalDuration)}</div>

      <div className="flex-grow w-full">
        <div ref={timelineContainerRef} className="w-full h-16 flex relative cursor-pointer bg-gray-200 rounded-md overflow-hidden" onClick={handleSeek}>
          {relevantCards.map((card, index) => {
             const characterInitial = card.voice.split('-')[2]?.charAt(0).toUpperCase() || '?';
             const textPreview = card.data.blocks.map(b => b.data.text).join(' ').trim();
             const segmentDuration = card.duration || (textPreview.length / 15) || 1;

             return (
              <div
                key={card.id}
                style={{ width: `${(segmentDuration / totalEstimatedDuration) * 100}%` }}
                className={`h-full border-r border-white/50 relative group flex items-center p-2 text-sm ${
                    card.audioUrl ? (index % 2 === 0 ? 'bg-blue-100' : 'bg-indigo-100') : 'bg-gray-200'
                }`}
                title={textPreview}
              >
                {card.isGenerating ? (
                    <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                        <LoaderCircle className="animate-spin text-gray-600"/>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 overflow-hidden w-full">
                        <div className="flex-shrink-0 flex items-center justify-center w-7 h-7 bg-white text-gray-700 font-bold rounded-full shadow-sm">
                            {characterInitial}
                        </div>
                        <p className="text-gray-800 whitespace-nowrap overflow-hidden text-ellipsis">{textPreview}</p>
                    </div>
                )}
              </div>
             )
          })}
          
          {totalDuration > 0 && (
            <div 
              className="absolute top-0 left-0 h-full w-0.5 bg-red-500 pointer-events-none" 
              style={{ left: `${(currentTime / totalDuration) * 100}%` }} 
            />
          )}
        </div>
      </div>

      <button onClick={togglePlayPause} className="p-2 bg-black text-white rounded-full flex-shrink-0 disabled:bg-gray-400" disabled={audioSegments.length === 0}>
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
      </button>

    </div>
  );
}