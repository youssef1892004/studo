// src/components/studio/SegmentPlayer.tsx
'use client';

import { Play, Pause, LoaderCircle } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

interface SegmentPlayerProps {
  audioUrl: string;
  text: string;
}

export default function SegmentPlayer({ audioUrl, text }: SegmentPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMediaReady, setIsMediaReady] = useState(false); 

  // 1. إدارة أحداث الوسائط وتنظيف URL
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setIsMediaReady(false);
    setIsPlaying(false);

    const handlePlay = () => {
      // إيقاف أي صوت آخر
      document.querySelectorAll('audio').forEach(otherAudio => {
        if (otherAudio !== audio) {
          otherAudio.pause();
        }
      });
      setIsPlaying(true);
    };
    
    const handleReady = () => {
      setIsMediaReady(true);
    };

    const handleEnded = () => setIsPlaying(false);

    // معالجة الأخطاء (بما في ذلك NotSupportedError)
    const handleError = (e: Event) => {
        console.error("Audio Load Error:", e);
        setIsPlaying(false);
        setIsMediaReady(false);
        // يمكنك إضافة إشعار للمستخدم هنا
    };

    audio.addEventListener('loadeddata', handleReady);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError); 

    // دالة التنظيف: إلغاء URL الخاص بالـ Blob لمنع تسرب الذاكرة
    return () => {
      audio.removeEventListener('loadeddata', handleReady);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      
      // إلغاء URL الخاص بالـ Blob عند إزالة المكون أو تغيير الـ URL
      if (audioUrl && audioUrl.startsWith('blob:')) {
         URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]); // الركض عند تغيير الـ URL


  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation(); // يمنع تفعيل المحرر
    const audio = audioRef.current;
    
    if (audio && isMediaReady) { // التشغيل فقط إذا كان الملف جاهزاً
      if (isPlaying) {
        audio.pause();
      } else {
        // استخدام catch لالتقاط رفض التشغيل (Autoplay Policy)
        audio.play().catch(error => {
            console.error("Audio play failed (Autoplay/Promise rejection):", error);
            setIsPlaying(false);
        }); 
      }
    } else if (!isMediaReady) {
        // لا تفعل شيئاً إذا كان التحميل جارياً
    }
  };

  return (
    // [MODIFIED] تم إزالة gap-3 لضبط التنسيق، وإزالة كلاسات الوضع الداكن
    <div className="mt-2 flex items-center p-2 bg-gray-50 rounded-md border border-gray-200 cursor-pointer transition-colors duration-200" onClick={togglePlayPause}>
      {/* Audio element src is set here and managed by React */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" style={{ display: 'none' }}></audio> 
      
      <button
        onClick={togglePlayPause}
        disabled={!isMediaReady} // تعطيل الزر إذا كان التحميل جارياً
        className={`p-2 rounded-full transition-colors flex-shrink-0 ${
            isMediaReady 
                ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        {!isMediaReady ? (
            <LoaderCircle size={16} className="animate-spin" />
        ) : isPlaying ? (
            <Pause size={16} />
        ) : (
            <Play size={16} className="ml-0.5" />
        )}
      </button>
      
      {/* [FIX] استبدال نص المقطع برسالة حالة بسيطة لتجنب التكرار */}
      <span className="flex-1 text-right pr-2 text-sm font-medium text-gray-600 truncate select-none" dir="rtl">
        {isMediaReady ? "المقطع الصوتي جاهز" : "جاري تحميل المقطع الصوتي..."}
      </span>
    </div>
  );
}