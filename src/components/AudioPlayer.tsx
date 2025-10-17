'use client';
import { Play, Pause, RotateCcw, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

const AudioPlayer = ({ audioUrl }: { audioUrl: string }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // ✅ التحقق من صحة audioUrl
    if (!audioUrl || typeof audioUrl !== "string" || audioUrl.trim() === "") {
      console.warn("❗ AudioPlayer: رابط الصوت غير صالح:", audioUrl);
      setHasError(true);
      setErrorMessage("رابط الصوت غير صالح");
      return;
    }

    // ✅ التحقق من تنسيق الرابط
    if (!audioUrl.startsWith("blob:") && !audioUrl.startsWith("http://") && !audioUrl.startsWith("https://") && !audioUrl.startsWith("/")) {
      console.warn("❗ AudioPlayer: تنسيق رابط الصوت غير مدعوم:", audioUrl);
      setHasError(true);
      setErrorMessage("تنسيق الرابط غير مدعوم");
      return;
    }

    // ✅ إعادة تعيين حالة الخطأ
    setHasError(false);
    setErrorMessage("");

    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    }
    const setAudioTime = () => setCurrentTime(audio.currentTime);
    const onEnded = () => setIsPlaying(false);
    
    const handleError = (e: Event) => {
      const target = e.target as HTMLAudioElement;
      let errorMsg = "خطأ في تحميل الصوت";
      
      if (target && target.error) {
        switch (target.error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMsg = "تم إلغاء تحميل الصوت";
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            errorMsg = "خطأ في الشبكة";
            break;
          case MediaError.MEDIA_ERR_DECODE:
            errorMsg = "خطأ في فك تشفير الملف";
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMsg = "تنسيق الملف غير مدعوم";
            break;
        }
      }
      
      console.error("❌ AudioPlayer Error:", errorMsg, e);
      setHasError(true);
      setErrorMessage(errorMsg);
      setIsPlaying(false);
    };

    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', handleError);
    
    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl]);

  const togglePlayPause = () => {
    if (hasError) return; // منع التشغيل في حالة وجود خطأ
    
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

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full flex items-center gap-4 p-2 bg-gray-100 rounded-lg">
      <audio key={hasError ? 'error' : (audioUrl || 'no-url')} ref={audioRef} src={hasError ? undefined : audioUrl} preload="metadata"></audio>
      <button 
        onClick={togglePlayPause} 
        className={`p-2 rounded-full ${hasError ? 'bg-red-500 cursor-not-allowed' : 'bg-black'} text-white`}
        disabled={hasError}
      >
        {hasError ? <X size={20} /> : (isPlaying ? <Pause size={20} /> : <Play size={20} className="-scale-x-100" />)}
      </button>
      
      {hasError ? (
        <div className="flex-1 text-sm text-red-600 font-medium">
          ❌ {errorMessage}
        </div>
      ) : (
        <>
          <div className="text-sm font-mono text-gray-600">{formatTime(currentTime)}</div>
          <div className="w-full bg-gray-300 h-1 rounded-full overflow-hidden">
            <div
              className="bg-black h-full"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
          <div className="text-sm font-mono text-gray-600">{formatTime(duration)}</div>
        </>
      )}
    </div>
  );
};
export default AudioPlayer;