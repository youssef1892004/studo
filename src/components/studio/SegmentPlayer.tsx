// src/components/studio/SegmentPlayer.tsx
'use client';

import { Play, Pause, LoaderCircle, X } from 'lucide-react';
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface SegmentPlayerProps {
  audioUrl: string;
  text: string;
  blockId?: string; // إضافة blockId لتجديد الرابط
  projectId?: string; // إضافة projectId لتجديد الرابط
  onUrlRefresh?: (newUrl: string) => void; // callback لتحديث الرابط في الحالة الأب
}

export default function SegmentPlayer({ audioUrl, text, blockId, projectId, onUrlRefresh }: SegmentPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMediaReady, setIsMediaReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isRefreshingUrl, setIsRefreshingUrl] = useState(false);
  const isRefreshingRef = useRef(false);

  // دالة لتجديد الرابط المنتهي الصلاحية
  const refreshAudioUrl = useCallback(async () => {
    if (!blockId || !projectId || !onUrlRefresh || isRefreshingRef.current) {
      return false;
    }

    try {
      isRefreshingRef.current = true;
      setIsRefreshingUrl(true);
      console.log("🔄 تجديد رابط الملف الصوتي للبلوك:", blockId);
      
      const response = await fetch(`/api/project/get-records?projectId=${projectId}`);
      if (!response.ok) {
        throw new Error('فشل في جلب الروابط الجديدة');
      }
      
      const records = await response.json();
      const updatedRecord = records.find((r: any) => r.id === blockId);
      
      if (updatedRecord?.s3_url && !updatedRecord.error) {
        console.log("✅ تم تجديد رابط الملف الصوتي بنجاح");
        onUrlRefresh(updatedRecord.s3_url);
        return true;
      } else {
        throw new Error('لم يتم العثور على رابط صالح للملف');
      }
    } catch (error) {
      console.error("❌ فشل في تجديد رابط الملف الصوتي:", error);
      return false;
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshingUrl(false);
    }
  }, [blockId, projectId, onUrlRefresh]); 

  // 1. إدارة أحداث الوسائط وتنظيف URL
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // ✅ التحقق من صحة audioUrl قبل المتابعة
    if (!audioUrl || typeof audioUrl !== "string" || audioUrl.trim() === "") {
      console.warn("❗ SegmentPlayer: رابط الصوت غير صالح:", audioUrl);
      setHasError(true);
      setErrorMessage("لا يوجد ملف صوتي متاح");
      setIsMediaReady(false);
      setIsPlaying(false);
      return;
    }

    // ✅ التحقق من تنسيق الرابط
    if (!audioUrl.startsWith("blob:") && !audioUrl.startsWith("http://") && !audioUrl.startsWith("https://")) {
      console.warn("❗ SegmentPlayer: تنسيق رابط الصوت غير مدعوم:", audioUrl);
      setHasError(true);
      setErrorMessage("تنسيق الرابط غير مدعوم");
      setIsMediaReady(false);
      setIsPlaying(false);
      return;
    }

    // ✅ التحقق من صحة URL
    try {
      const url = new URL(audioUrl);
      
      // ✅ التحقق من انتهاء صلاحية signed URLs
      if (url.hostname.includes('wasabisys.com') || url.hostname.includes('amazonaws.com')) {
        const expiresParam = url.searchParams.get('X-Amz-Expires') || url.searchParams.get('Expires');
        const dateParam = url.searchParams.get('X-Amz-Date');
        
        if (expiresParam && dateParam) {
          const expiresInSeconds = parseInt(expiresParam);
          const dateString = dateParam.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z');
          const signedDate = new Date(dateString);
          const expiryDate = new Date(signedDate.getTime() + (expiresInSeconds * 1000));
          
          if (new Date() > expiryDate) {
            console.warn("❗ SegmentPlayer: انتهت صلاحية رابط الصوت:", audioUrl);
            
            // محاولة تجديد الرابط تلقائياً
            if (blockId && projectId && onUrlRefresh) {
              console.log("🔄 محاولة تجديد الرابط المنتهي الصلاحية...");
              refreshAudioUrl().then(success => {
                if (!success) {
                  setHasError(true);
                  setErrorMessage("انتهت صلاحية رابط الملف الصوتي - يرجى إعادة تحميل الصفحة");
                  setIsMediaReady(false);
                  setIsPlaying(false);
                }
              });
              return;
            } else {
              setHasError(true);
              setErrorMessage("انتهت صلاحية رابط الملف الصوتي - يرجى إعادة تحميل الصفحة");
              setIsMediaReady(false);
              setIsPlaying(false);
              return;
            }
          }
        }
      }
    } catch (urlError) {
      console.warn("❗ SegmentPlayer: رابط الصوت غير صالح:", audioUrl, urlError);
      setHasError(true);
      setErrorMessage("رابط الملف الصوتي غير صحيح");
      setIsMediaReady(false);
      setIsPlaying(false);
      return;
    }

    // ✅ إعادة تعيين حالة الخطأ عند وجود رابط صالح
    setHasError(false);
    setErrorMessage("");
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
        let errorMessage = "خطأ في تشغيل الملف الصوتي";
        
        const target = e.target as HTMLAudioElement;
        
        if (target && target.error) {
          switch (target.error.code) {
            case MediaError.MEDIA_ERR_ABORTED:
              errorMessage = "تم إلغاء تحميل الملف الصوتي";
              break;
            case MediaError.MEDIA_ERR_NETWORK:
              errorMessage = "خطأ في الشبكة أثناء تحميل الملف الصوتي";
              break;
            case MediaError.MEDIA_ERR_DECODE:
              errorMessage = "الملف الصوتي تالف أو غير مكتمل";
              break;
            case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
               // قد يكون السبب انتهاء صلاحية الرابط أو مشكلة في الخادم
               if (audioUrl.includes('wasabisys.com') || audioUrl.includes('amazonaws.com')) {
                 // محاولة تجديد الرابط قبل إظهار الخطأ
                 if (blockId && projectId && onUrlRefresh && !isRefreshingUrl) {
                   console.log("🔄 محاولة تجديد الرابط بسبب MEDIA_ERR_SRC_NOT_SUPPORTED...");
                   refreshAudioUrl().then(success => {
                     if (!success) {
                       setHasError(true);
                       setErrorMessage("انتهت صلاحية رابط الملف الصوتي - يرجى إعادة تحميل الصفحة");
                       setIsPlaying(false);
                       setIsMediaReady(false);
                     }
                   });
                   return; // لا نعرض الخطأ فوراً، ننتظر نتيجة التجديد
                 } else {
                   errorMessage = "انتهت صلاحية رابط الملف الصوتي - يرجى إعادة تحميل الصفحة";
                 }
               } else {
                 errorMessage = "تنسيق الملف الصوتي غير مدعوم";
               }
               console.warn("❗ MEDIA_ERR_SRC_NOT_SUPPORTED for URL:", audioUrl);
               break;
            default:
              errorMessage = "فشل في تحميل الملف الصوتي";
          }
        } else {
          // خطأ عام غير متعلق بـ MediaError
          errorMessage = "لا يمكن تشغيل الملف الصوتي";
        }
        
        console.error("❌ SegmentPlayer Audio Error:", errorMessage, e);
        setHasError(true);
        setErrorMessage(errorMessage);
        setIsPlaying(false);
        setIsMediaReady(false);
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
    };
  }, [audioUrl, blockId, onUrlRefresh, projectId, refreshAudioUrl, isRefreshingUrl]);


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
      <audio key={audioUrl || 'no-url'} ref={audioRef} src={audioUrl} preload="metadata" className="hidden"></audio> 
      
      <button
        onClick={togglePlayPause}
        disabled={!isMediaReady || hasError} // تعطيل الزر في حالة الخطأ أو التحميل
        className={`p-2 rounded-full transition-colors flex-shrink-0 ${
            hasError 
                ? 'bg-red-100 text-red-500 cursor-not-allowed'
                : isMediaReady 
                    ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        {hasError ? (
            <X size={16} />
        ) : !isMediaReady ? (
            <LoaderCircle size={16} className="animate-spin" />
        ) : isPlaying ? (
            <Pause size={16} />
        ) : (
            <Play size={16} className="ml-0.5" />
        )}
      </button>
      
      {/* عرض حالة المشغل مع رسائل الخطأ */}
      <span className={`flex-1 text-right pr-2 text-sm font-medium truncate select-none ${
        hasError ? 'text-red-600' : isRefreshingUrl ? 'text-blue-600' : 'text-gray-600'
      }`} dir="rtl">
        {hasError 
          ? `خطأ: ${errorMessage}` 
          : isRefreshingUrl
            ? "جاري تجديد رابط الملف الصوتي..."
            : isMediaReady 
              ? "المقطع الصوتي جاهز" 
              : "جاري تحميل المقطع الصوتي..."
        }
      </span>
    </div>
  );
}