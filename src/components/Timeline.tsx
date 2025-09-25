// src/components/Timeline.tsx
'use client';

import { TTSCardData } from '@/lib/types';
import { Play, Pause } from 'lucide-react';
import React, { useState, useEffect, useRef, useMemo } from 'react';

// --- مكون الموجة الصوتية المتجاوب ---
const Waveform = ({ isPlaying, width }: { isPlaying: boolean, width: number }) => {
    const barCount = Math.max(10, Math.floor(width / 4));
    
    // --- (تصحيح) التأكد من أن الطول صالح قبل إنشاء المصفوفة ---
    const bars = useMemo(() => {
        const count = Number.isFinite(barCount) ? barCount : 10;
        return Array.from({ length: count }, () => Math.random() * 0.9 + 0.1);
    }, [barCount]);
    
    return (
        <div className="absolute inset-0 flex items-center justify-between w-full h-full px-1 overflow-hidden">
            {bars.map((height, i) => (
                <div 
                    key={i} 
                    className={`${isPlaying ? 'bg-green-300' : 'bg-gray-300'} rounded-sm transition-colors duration-200`}
                    style={{ height: `${height * 100}%`, width: '2px' }}
                />
            ))}
        </div>
    );
};

// --- مكون مسطرة الوقت المتجاوبة ---
const TimeRuler = ({ duration, containerWidth }: { duration: number, containerWidth: number }) => {
    if (duration <= 0 || containerWidth === 0) return null;

    let interval = 5;
    if (containerWidth < 400) interval = 15;
    else if (containerWidth < 700) interval = 10;

    const ticks = Math.floor(duration / interval);
    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="absolute top-8 left-0 right-0 h-4 text-xs text-gray-400 px-4">
            {Array.from({ length: ticks + 1 }).map((_, i) => {
                const time = i * interval;
                if (time > duration) return null;
                const position = (time / duration) * 100;
                return (
                    <div key={i} className="absolute top-0" style={{ left: `${position}%` }}>
                        <span className="absolute -translate-x-1/2">{formatTime(time)}</span>
                        <div className="h-2 w-px bg-gray-300 mx-auto mt-4"></div>
                    </div>
                );
            })}
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
    const [playbackRate, setPlaybackRate] = useState(1.0);
    const [containerWidth, setContainerWidth] = useState(0);

    const audioRef = useRef<HTMLAudioElement>(null);
    const timelineContainerRef = useRef<HTMLDivElement>(null);
    const animationFrameRef = useRef<number>();
    
    const audioSegments = cards.filter(c => c.audioUrl && typeof c.duration === 'number' && c.duration > 0);

    useEffect(() => {
        const total = audioSegments.reduce((sum, card) => sum + (card.duration || 0), 0);
        setTotalDuration(total);
        if (total > 0) {
            // Reset state only when cards change fundamentally
        } else {
            setCurrentTime(0);
            setCurrentCardIndex(0);
            setIsPlaying(false);
        }
    }, [cards]);

    useEffect(() => {
        const observer = new ResizeObserver(entries => {
            if (entries[0]) {
                setContainerWidth(entries[0].contentRect.width);
            }
        });
        if (timelineContainerRef.current) {
            observer.observe(timelineContainerRef.current);
        }
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (audioRef.current) audioRef.current.playbackRate = playbackRate;
    }, [playbackRate]);

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
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
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

    const formatTime = (time: number) => {
        if (isNaN(time) || time < 0) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="w-full h-full flex flex-col bg-gray-50/50" dir="ltr">
            <audio ref={audioRef} />
            
            <div className="flex-shrink-0 flex items-center justify-center gap-2 sm:gap-4 py-2 px-4 border-b border-gray-200">
                <button 
                    onClick={() => setPlaybackRate(rate => rate === 1.0 ? 1.5 : 1.0)} 
                    className="px-2 sm:px-3 py-1 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-md transition-colors w-14 sm:w-16"
                    title="Change Playback Speed"
                >
                    {playbackRate.toFixed(1)}x
                </button>
                <button 
                    onClick={togglePlayPause} 
                    disabled={audioSegments.length === 0}
                    className="p-3 bg-black hover:bg-gray-800 text-white rounded-full transition-colors disabled:bg-gray-400"
                >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                </button>
                <div className="text-xs sm:text-sm font-mono text-gray-700 w-20 sm:w-24 text-center">
                    {formatTime(currentTime)} / {formatTime(totalDuration)}
                </div>
            </div>

            <div ref={timelineContainerRef} className="flex-grow w-full px-4 relative flex items-center overflow-hidden">
                <TimeRuler duration={totalDuration} containerWidth={containerWidth} />
                <div className="relative w-full h-16 mt-6">
                    <div className="absolute top-1/2 -translate-y-1/2 w-full h-0.5 bg-gray-300"></div>
                    <div className="w-full h-full flex">
                        {audioSegments.map((card, index) => {
                            const characterInitial = card.voice.split('-')[2]?.charAt(0).toUpperCase() || '?';
                            const textPreview = card.data.blocks.map(b => b.data.text).join(' ').trim();
                            const isCurrentSegment = index === currentCardIndex;
                            // --- (تصحيح) التعامل مع حالة قسمة صفر على صفر ---
                            const segmentWidth = totalDuration > 0 ? ((card.duration || 0) / totalDuration) * containerWidth : 0;

                            return (
                                <div
                                    key={card.id}
                                    style={{ width: `${totalDuration > 0 ? ((card.duration || 0) / totalDuration) * 100 : 0}%` }}
                                    className={`h-full border-r-2 border-gray-50/50 last:border-r-0 relative group rounded-md overflow-hidden ${isCurrentSegment && isPlaying ? 'bg-green-100/50' : 'bg-transparent'}`}
                                >
                                    <Waveform isPlaying={isCurrentSegment && isPlaying} width={segmentWidth} />
                                    <div className="absolute inset-0 p-2 flex items-start gap-2">
                                        <div className="flex-shrink-0 flex items-center justify-center w-5 h-5 bg-gray-600 text-white font-bold rounded-full text-xs">
                                            {characterInitial}
                                        </div>
                                        <p className="text-gray-700 text-xs leading-tight line-clamp-2">
                                            {textPreview}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    {totalDuration > 0 && (
                        <div 
                            className="absolute top-0 bottom-0 w-0.5 bg-black pointer-events-none z-20" 
                            style={{ left: `${(currentTime / totalDuration) * 100}%` }} 
                        >
                        <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-black rounded-full -translate-x-1/2 border-2 border-white"></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}