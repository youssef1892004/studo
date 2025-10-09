// src/components/Timeline.tsx
'use client';

import { TTSCardData } from '@/lib/types';
import { Play, Pause, ZoomIn, ZoomOut } from 'lucide-react';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Button from '@/components/ui/button'; 

// استيراد مكون WaveformSegment
const WaveformSegment = dynamic(() => import('./WaveformSegment').then(mod => mod.default), { ssr: false });

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

// تحسين عرض الزمن ليشمل المللي ثانية
const formatTime = (time: number) => {
    if (isNaN(time) || time < 0) return '0:00.00';
    const totalMilliseconds = Math.floor(time * 1000);
    const milliseconds = (totalMilliseconds % 1000).toString().padStart(3, '0');
    const totalSeconds = Math.floor(totalMilliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}.${milliseconds.substring(0, 2)}`; 
};

interface TimelineProps {
  cards: TTSCardData[];
  onCardsUpdate?: (cards: TTSCardData[]) => void; // لتحديث الكروت من المكون الأب
}

export default function Timeline({ cards, onCardsUpdate }: TimelineProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [totalDuration, setTotalDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1.0);
    const [containerWidth, setContainerWidth] = useState(0);
    const [zoomLevel, setZoomLevel] = useState(50); 
    const [scrollLeft, setScrollLeft] = useState(0);

    const audioRef = useRef<HTMLAudioElement>(null);
    const timelineContainerRef = useRef<HTMLDivElement>(null);
    const waveformWrapperRef = useRef<HTMLDivElement>(null);
    const animationFrameRef = useRef<number>();
    
    const audioSegments = useMemo(() => cards.filter(c => c.audioUrl && typeof c.duration === 'number' && c.duration > 0), [cards]);

    useEffect(() => {
        const total = audioSegments.reduce((sum, card) => sum + (card.duration || 0), 0);
        setTotalDuration(total);
        if (total <= 0) {
            setCurrentTime(0);
            setCurrentCardIndex(0);
            setIsPlaying(false);
        }
    }, [audioSegments]);

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

    const handlePlayNext = useCallback(() => {
        cancelAnimationFrame(animationFrameRef.current!);
        if (currentCardIndex < audioSegments.length - 1) {
            setCurrentCardIndex(prevIndex => prevIndex + 1);
        } else {
            setIsPlaying(false);
            setCurrentCardIndex(0);
            setCurrentTime(totalDuration);
        }
    }, [currentCardIndex, audioSegments.length, totalDuration]);

    const updateProgress = useCallback(() => {
        if (audioRef.current && totalDuration > 0) {
            const card = audioSegments[currentCardIndex];
            if (card) {
                const endTime = card.trimEnd;
                if (endTime && audioRef.current.currentTime >= endTime) {
                    handlePlayNext();
                    return;
                }
            }

            let elapsedInPreviousSegments = 0;
            for (let i = 0; i < currentCardIndex; i++) {
                elapsedInPreviousSegments += audioSegments[i].duration || 0;
            }
            const newCurrentTime = elapsedInPreviousSegments + (audioRef.current.currentTime - (audioSegments[currentCardIndex]?.trimStart || 0));
            setCurrentTime(newCurrentTime);
            
            // تمرير الشريط الزمني للمتابعة التلقائية
            if (waveformWrapperRef.current && isPlaying) {
                const totalWidth = waveformWrapperRef.current.scrollWidth;
                const newScrollLeft = (newCurrentTime / totalDuration) * totalWidth - (containerWidth / 2);
                waveformWrapperRef.current.scrollLeft = Math.max(0, newScrollLeft);
                setScrollLeft(waveformWrapperRef.current.scrollLeft);
            }

            animationFrameRef.current = requestAnimationFrame(updateProgress);
        }
    }, [totalDuration, currentCardIndex, audioSegments, isPlaying, containerWidth, handlePlayNext]);
  
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
    
        audio.addEventListener('ended', handlePlayNext);
        return () => audio.removeEventListener('ended', handlePlayNext);
    }, [handlePlayNext]);
  
    useEffect(() => {
        const playCurrentSegment = async () => {
            const card = audioSegments[currentCardIndex];
            if (isPlaying && card?.audioUrl && audioRef.current) {
                if (audioRef.current.src !== card.audioUrl) {
                    audioRef.current.src = card.audioUrl!;
                }
                audioRef.current.currentTime = card.trimStart || 0;
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
    }, [isPlaying, currentCardIndex, audioSegments, updateProgress]);

    const togglePlayPause = () => {
        if (audioSegments.length === 0) return;
        if (!isPlaying && currentTime >= totalDuration && totalDuration > 0) {
            setCurrentTime(0);
            setCurrentCardIndex(0);
            if(audioRef.current) audioRef.current.currentTime = 0;
        }
        setIsPlaying(!isPlaying);
    };
    
    // دالة الانتقال إلى وقت محدد
    const handleSeek = useCallback((time: number) => {
        let timeRemaining = time;
        let newIndex = 0;
        let timeInNewSegment = 0;

        for (let i = 0; i < audioSegments.length; i++) {
            const segmentDuration = audioSegments[i].duration || 0;
            if (timeRemaining <= segmentDuration) {
                newIndex = i;
                timeInNewSegment = timeRemaining;
                break;
            }
            timeRemaining -= segmentDuration;
        }
        
        if (audioRef.current) {
            audioRef.current.pause();
            setCurrentCardIndex(newIndex);
            if (audioRef.current.src !== audioSegments[newIndex]?.audioUrl) {
                audioRef.current.src = audioSegments[newIndex]?.audioUrl || '';
            }
            audioRef.current.currentTime = timeInNewSegment;
        }
        
        setCurrentTime(time);
        setIsPlaying(true);
    }, [audioSegments]);

    // دالة النقر على المقطع للانتقال
    const handleSeekFromSegment = useCallback((timeInSegment: number, segmentId: string) => {
        const segmentIndex = audioSegments.findIndex(s => s.id === segmentId);
        if (segmentIndex === -1) return;
        
        let timeBeforeSegment = 0;
        for (let i = 0; i < segmentIndex; i++) {
            timeBeforeSegment += audioSegments[i].duration || 0;
        }
        
        const newTotalTime = timeBeforeSegment + timeInSegment;
        handleSeek(newTotalTime);
    }, [audioSegments, handleSeek]);
    
    // دالة التحكم في التكبير
    const handleZoom = (direction: 'in' | 'out') => {
        setZoomLevel(prev => {
            let newZoom = direction === 'in' ? prev * 1.5 : prev / 1.5;
            return Math.max(25, Math.min(500, newZoom));
        });
    };
    
    // [NEW] دالة معالجة القص
    const handleTrim = useCallback((segmentId: string, startTime: number, endTime: number) => {
        if (!onCardsUpdate) return;
        
        const updatedCards = cards.map(card => {
            if (card.id === segmentId) {
                const newDuration = endTime - startTime;
                return { 
                    ...card, 
                    duration: newDuration,
                    trimStart: startTime,
                    trimEnd: endTime
                };
            }
            return card;
        });
        
        onCardsUpdate(updatedCards);
        
        // إعادة ضبط التشغيل
        setCurrentCardIndex(0);
        setCurrentTime(0);
        setIsPlaying(false);
        
        alert(`✅ تم قص المقطع بنجاح!\n\nالمدة الجديدة: ${(endTime - startTime).toFixed(2)} ثانية`);
        
    }, [cards, onCardsUpdate]);

    // [NEW] دالة معالجة الحذف
    const handleDelete = useCallback((segmentId: string) => {
        if (!onCardsUpdate) return;

        const updatedCards = cards.filter(card => card.id !== segmentId);
        
        onCardsUpdate(updatedCards);
        
        // إعادة ضبط التشغيل
        setCurrentCardIndex(0);
        setCurrentTime(0);
        setIsPlaying(false);
        
        alert(`🗑️ تم حذف المقطع بنجاح.`);
    }, [cards, onCardsUpdate]);
    
    const totalWidthWithZoom = totalDuration * zoomLevel;
    const progressLeft = (currentTime / totalDuration) * totalWidthWithZoom;
    
    return (
        <div ref={timelineContainerRef} className="w-full h-full flex flex-col bg-gray-50/50" dir="ltr">
            <audio ref={audioRef} />
            
            {/* شريط التحكم */}
            <div className="flex-shrink-0 flex items-center justify-between gap-2 sm:gap-4 py-2 px-4 border-b border-gray-200">
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={togglePlayPause} 
                        disabled={audioSegments.length === 0}
                        className="p-3 bg-black hover:bg-gray-800 text-white rounded-full transition-colors disabled:bg-gray-400"
                    >
                        {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                    </button>
                    <div className="text-sm font-mono text-gray-700 w-28 sm:w-32 text-center">
                        {formatTime(currentTime)} / {formatTime(totalDuration)}
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <Button 
                        onClick={() => setPlaybackRate(rate => rate === 1.0 ? 1.5 : 1.0)} 
                        variant="outline"
                        className="h-8 px-2 text-xs font-bold w-12"
                        title="Change Playback Speed"
                    >
                        {playbackRate.toFixed(1)}x
                    </Button>
                    <div className="flex items-center gap-1">
                        <Button 
                            onClick={() => handleZoom('out')} 
                            variant="outline"
                            className="p-1 h-8 w-8"
                            title="Zoom Out"
                        >
                            <ZoomOut size={16} />
                        </Button>
                        <Button 
                            onClick={() => handleZoom('in')} 
                            variant="outline"
                            className="p-1 h-8 w-8"
                            title="Zoom In"
                        >
                            <ZoomIn size={16} />
                        </Button>
                    </div>
                </div>

            </div>

            {/* شريط الموجات الصوتية */}
            <div 
                ref={waveformWrapperRef} 
                onScroll={(e) => setScrollLeft(e.currentTarget.scrollLeft)}
                className="flex-grow w-full px-4 relative flex items-start overflow-x-scroll overflow-y-hidden"
            >
                <div className="relative h-16 mt-6 flex" style={{ width: `${totalWidthWithZoom}px`, minWidth: `${containerWidth - 32}px` }}>
                    <div className="absolute top-1/2 -translate-y-1/2 w-full h-0.5 bg-gray-300"></div>
                    
                    {audioSegments.map((card, index) => {
                        const characterInitial = card.voice.split('-')[2]?.charAt(0).toUpperCase() || '?';
                        const textPreview = card.content.blocks.map(b => b.data.text).join(' ').trim();
                        const isCurrentSegment = index === currentCardIndex;
                        const segmentDuration = card.duration || 0;
                        
                        let timeBeforeSegment = 0;
                        for (let i = 0; i < index; i++) {
                            timeBeforeSegment += audioSegments[i].duration || 0;
                        }
                        
                        const timeInSegment = isCurrentSegment ? currentTime - timeBeforeSegment : 0;
                        const segmentWidthPx = segmentDuration * zoomLevel;
                        
                        const isSegmentPlaying = isCurrentSegment && isPlaying;
                        const waveColor = isSegmentPlaying ? '#9CA3AF' : '#D1D5DB'; 
                        const progressColor = isSegmentPlaying ? '#22C55E' : '#3B82F6';

                        return (
                            <div
                                key={card.id}
                                style={{ width: `${segmentWidthPx}px` }} 
                                className={`h-full border-2 last:border-r-0 relative group rounded-lg overflow-hidden flex-shrink-0 transition-all duration-200 ${
                                    isCurrentSegment && isPlaying 
                                        ? 'border-green-500 shadow-lg shadow-green-200 bg-green-50' 
                                        : 'border-gray-300 bg-white hover:border-blue-400 hover:shadow-md'
                                }`}
                            >
                                
                                {card.audioUrl && (
                                    <WaveformSegment
                                        audioUrl={card.audioUrl}
                                        duration={segmentDuration}
                                        isPlaying={isSegmentPlaying}
                                        color={waveColor}
                                        progressColor={progressColor}
                                        zoomLevel={zoomLevel} 
                                        playbackTime={timeInSegment}
                                        onSeek={(t: number) => handleSeekFromSegment(t, card.id)}
                                        onTrim={handleTrim}
                                        onDelete={handleDelete}
                                        segmentId={card.id}
                                    />
                                )}

                                <div className="absolute inset-0 p-2 flex items-start gap-2 pointer-events-none z-10">
                                    <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold rounded-full text-xs shadow-md">
                                        {characterInitial}
                                    </div>
                                    <p className="text-gray-800 text-xs leading-tight line-clamp-2 bg-white/90 backdrop-blur-sm rounded px-2 py-0.5 shadow-sm">
                                        {textPreview}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                    
                    {/* مؤشر التشغيل الرئيسي */}
                    {totalDuration > 0 && (
                        <div 
                            className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-50 shadow-lg" 
                            style={{ 
                                left: `${progressLeft}px`,
                                transform: 'translateX(-50%)',
                                boxShadow: '0 0 10px rgba(239, 68, 68, 0.6)'
                            }} 
                        >
                            <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-red-500 rounded-full -translate-x-1/2 border-2 border-white shadow-lg"></div>
                            <div className="absolute top-0 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent border-t-red-500"></div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}