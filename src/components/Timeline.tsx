'use client';

import { TTSCardData } from '@/lib/types';
import { Play, Pause, LoaderCircle, Volume2, VolumeX, SkipBack, SkipForward, List } from 'lucide-react';
import React, { useState, useEffect, useRef, useMemo } from 'react';

// --- مكون صغير لإنشاء شكل موجة صوتية وهمي ---
const FakeWaveform = () => {
    const bars = useMemo(() => {
        return Array.from({ length: 80 }, () => Math.random() * 0.8 + 0.2);
    }, []);

    return (
        <div className="absolute inset-0 flex items-center justify-between w-full h-full px-2">
            {bars.map((height, i) => (
                <div 
                    key={i} 
                    className="bg-gray-300 rounded-sm transition-colors duration-200" 
                    style={{ 
                        height: `${height * 60}%`,
                        width: '1px'
                    }}
                />
            ))}
        </div>
    );
};

interface TimelineProps {
  cards: TTSCardData[];
}

export default function Timeline({ cards }: TimelineProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);

  const audioRef = useRef<HTMLAudioElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  
  const relevantCards = cards.filter(c => c.data.blocks.some(b => b.data.text && b.data.text.trim().length > 0));
  const audioSegments = relevantCards.filter(c => c.audioUrl && typeof c.duration === 'number');

  useEffect(() => {
    const total = audioSegments.reduce((sum, card) => sum + (card.duration || 0), 0);
    setTotalDuration(total);
  }, [audioSegments]);

  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
        audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const updateProgress = () => {
    if (audioRef.current && totalDuration > 0) {
      let elapsedInPreviousSegments = 0;
      for (let i = 0; i < currentCardIndex; i++) {
        elapsedInPreviousSegments += (audioSegments[i].duration || 0);
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
        setCurrentTime(totalDuration);
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

  const skipToPrevious = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
      setCurrentTime(0);
      if (audioRef.current) audioRef.current.currentTime = 0;
    }
  };

  const skipToNext = () => {
    if (currentCardIndex < audioSegments.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setCurrentTime(0);
      if (audioRef.current) audioRef.current.currentTime = 0;
    }
  };
  
  const toggleMute = () => setVolume(v => v > 0 ? 0 : 1);
  const cyclePlaybackRate = () => setPlaybackRate(r => r === 1 ? 1.25 : r === 1.25 ? 1.5 : r === 1.5 ? 2 : 1);

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
                    if (isPlaying) audio.play().catch(e => console.error("Play interrupted", e));
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

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden" dir="ltr">
      <audio ref={audioRef} />
      
      {/* --- أزرار التحكم في الأعلى --- */}
      <div className="flex items-center justify-center gap-1 py-3 px-4 bg-gray-50 border-b border-gray-200">
        <button 
          onClick={() => {}} 
          className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          title="قائمة المسارات"
        >
          <List size={18} className="text-gray-600" />
        </button>
        
        <div className="flex items-center gap-1 mx-4">
          <button 
            onClick={cyclePlaybackRate} 
            className="px-2 py-1 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded transition-colors min-w-[45px]"
            title="سرعة التشغيل"
          >
            {playbackRate}x
          </button>
          
          <button 
            onClick={skipToPrevious} 
            disabled={currentCardIndex === 0}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="المقطع السابق"
          >
            <SkipBack size={18} className="text-gray-600" />
          </button>
          
          <button 
            onClick={togglePlayPause} 
            disabled={audioSegments.length === 0}
            className="p-3 bg-black hover:bg-gray-800 text-white rounded-full transition-colors disabled:bg-gray-400"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
          </button>
          
          <button 
            onClick={skipToNext} 
            disabled={currentCardIndex >= audioSegments.length - 1}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="المقطع التالي"
          >
            <SkipForward size={18} className="text-gray-600" />
          </button>
        </div>

        <div className="flex items-center gap-2 text-sm font-mono text-gray-600">
          <span>{formatTime(currentTime)}</span>
          <span className="text-gray-400">/</span>
          <span>{formatTime(totalDuration)}</span>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <button 
            onClick={toggleMute}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            {volume === 0 ? <VolumeX size={18} className="text-gray-600" /> : <Volume2 size={18} className="text-gray-600" />}
          </button>
          
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-gray-900"></div>
            <span className="text-xl text-gray-400 font-light">+</span>
            <button className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"></button>
          </div>
        </div>
      </div>

      {/* --- المقياس الزمني --- */}
      <div className="px-4 py-2 bg-gray-50">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <span>0:00</span>
          <span>0:05</span>
          <span>0:10</span>
          <span>0:15</span>
          <span>0:20</span>
          <span>0:25</span>
        </div>
      </div>

      {/* --- الشريط الزمني --- */}
      <div className="relative">
        <div 
          ref={timelineContainerRef} 
          className="w-full h-24 flex relative cursor-pointer bg-white overflow-hidden" 
          onClick={handleSeek}
        >
          {relevantCards.map((card, index) => {
             const characterInitial = card.voice.split('-')[2]?.charAt(0).toUpperCase() || '?';
             const textPreview = card.data.blocks.map(b => b.data.text).join(' ').trim();
             const segmentDuration = card.duration || (textPreview.length / 15) || 1;
             const isCurrentSegment = index === currentCardIndex && isPlaying;

             return (
              <div
                key={card.id}
                style={{ width: `${(segmentDuration / totalEstimatedDuration) * 100}%` }}
                className={`h-full border-l border-gray-200 first:border-l-0 relative group flex flex-col ${
                  isCurrentSegment ? 'bg-green-50' : 'bg-white hover:bg-gray-50'
                } transition-colors duration-200`}
                title={textPreview}
              >
                {/* معلومات المقطع */}
                <div className="relative z-10 p-3 flex-1 flex flex-col justify-start">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`flex-shrink-0 flex items-center justify-center w-6 h-6 ${
                      isCurrentSegment ? 'bg-green-500 text-white' : 'bg-gray-600 text-white'
                    } font-bold rounded-full text-xs transition-colors duration-200`}>
                      {characterInitial}
                    </div>
                    {card.isGenerating && (
                      <LoaderCircle className="animate-spin text-gray-400" size={14} />
                    )}
                  </div>
                  <p className="text-gray-700 text-xs leading-tight line-clamp-3 text-right">
                    {textPreview}
                  </p>
                </div>
                
                {/* الموجة الصوتية */}
                <div className="absolute bottom-0 left-0 right-0 h-12">
                  {card.isGenerating ? (
                    <div className="h-full bg-gray-100 flex items-center justify-center">
                      <div className="flex gap-1">
                        <div className="w-1 h-3 bg-gray-300 animate-pulse"></div>
                        <div className="w-1 h-4 bg-gray-300 animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-1 h-2 bg-gray-300 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  ) : card.audioUrl ? (
                    <div className={`h-full ${isCurrentSegment ? 'bg-green-50' : 'bg-gray-50'} transition-colors duration-200`}>
                      <FakeWaveform />
                    </div>
                  ) : (
                    <div className="h-full bg-gray-100"></div>
                  )}
                </div>
              </div>
             )
          })}
          
          {/* مؤشر التقدم */}
          {totalDuration > 0 && (
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-black pointer-events-none z-20" 
              style={{ left: `${(currentTime / totalDuration) * 100}%` }} 
            >
              <div className="absolute top-0 w-3 h-3 bg-black rounded-full -translate-x-1/2"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}