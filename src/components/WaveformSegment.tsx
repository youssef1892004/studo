// src/components/WaveformSegment.tsx
'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Scissors, Trash2, Check, X } from 'lucide-react';

interface WaveformSegmentProps {
  audioUrl: string;
  duration: number;
  isPlaying: boolean;
  color: string;
  progressColor: string;
  zoomLevel: number;
  playbackTime: number;
  onSeek: (time: number) => void;
  onTrim?: (segmentId: string, startTime: number, endTime: number) => void;
  onDelete?: (segmentId: string) => void;
  segmentId?: string;
}

const WaveformSegment: React.FC<WaveformSegmentProps> = ({
  audioUrl,
  duration,
  isPlaying,
  color,
  progressColor,
  playbackTime,
  onSeek,
  onTrim,
  onDelete,
  segmentId
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<{ start: number; end: number } | null>(null);
  const [isDragging, setIsDragging] = useState<'start' | 'end' | 'middle' | null>(null);

  // توليد موجة حقيقية من الصوت
  useEffect(() => {
    let mounted = true;

    const loadAndGenerateWaveform = async () => {
      try {
        console.log('🎵 بدء تحميل الموجة لـ:', audioUrl);
        
        // تحميل الملف الصوتي
        const response = await fetch(audioUrl);
        if (!response.ok) throw new Error('فشل تحميل الصوت');
        
        const arrayBuffer = await response.arrayBuffer();
        
        // إنشاء Audio Context
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        
        // فك تشفير الصوت
        const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
        
        if (!mounted) return;
        
        console.log('✅ تم فك تشفير الصوت:', {
          duration: audioBuffer.duration,
          sampleRate: audioBuffer.sampleRate,
          channels: audioBuffer.numberOfChannels
        });
        
        // استخراج بيانات القناة الأولى
        const rawData = audioBuffer.getChannelData(0);
        const samples = 300; // عدد النقاط في الموجة
        const blockSize = Math.floor(rawData.length / samples);
        const filteredData: number[] = [];
        
        // حساب متوسط الطاقة لكل block
        for (let i = 0; i < samples; i++) {
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            const index = i * blockSize + j;
            if (index < rawData.length) {
              sum += Math.abs(rawData[index]);
            }
          }
          filteredData.push(sum / blockSize);
        }
        
        // Normalize البيانات
        const maxAmplitude = Math.max(...filteredData, 0.0001);
        const normalized = filteredData.map(n => Math.min(n / maxAmplitude, 1));
        
        console.log('✅ تم إنشاء الموجة بنجاح:', normalized.length, 'نقطة');
        
        setWaveformData(normalized);
        setIsLoaded(true);
        
      } catch (error) {
        console.error('❌ خطأ في توليد الموجة:', error);
        
        // Fallback: إنشاء موجة عشوائية واقعية
        const fallbackData = Array.from({ length: 300 }, (_, i) => {
          const base = Math.sin(i / 10) * 0.5 + 0.5;
          const noise = Math.random() * 0.3;
          return Math.max(0.1, Math.min(1, base + noise));
        });
        
        setWaveformData(fallbackData);
        setIsLoaded(true);
      }
    };

    loadAndGenerateWaveform();

    return () => {
      mounted = false;
    };
  }, [audioUrl]);

  // رسم الموجة على Canvas
  const drawWaveform = useCallback(() => {
    if (!canvasRef.current || waveformData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    ctx.scale(dpr, dpr);
    
    const width = rect.width;
    const height = rect.height;
    const progress = duration > 0 ? Math.min(playbackTime / duration, 1) : 0;

    // مسح Canvas
    ctx.clearRect(0, 0, width, height);

    // رسم الموجة
    const barWidth = width / waveformData.length;
    const centerY = height / 2;
    
    waveformData.forEach((amplitude, index) => {
      const barHeight = amplitude * height * 0.85;
      const x = index * barWidth;
      const y = centerY - barHeight / 2;
      
      const barProgress = index / waveformData.length;
      
      // لون البار حسب التقدم
      if (barProgress < progress) {
        ctx.fillStyle = progressColor;
      } else {
        ctx.fillStyle = color;
      }
      
      // رسم البار
      ctx.fillRect(x, y, Math.max(barWidth - 1, 1), barHeight);
    });

    // رسم المنطقة المحددة
    if (selectedRegion && isSelecting) {
      const startX = (selectedRegion.start / duration) * width;
      const endX = (selectedRegion.end / duration) * width;
      const regionWidth = endX - startX;

      // خلفية شفافة
      ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.fillRect(startX, 0, regionWidth, height);

      // إطار المنطقة
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 3;
      ctx.strokeRect(startX, 0, regionWidth, height);

      // مقابض السحب
      const handleWidth = 10;
      const handleHeight = height;
      
      // مقبض البداية (أحمر)
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(startX - handleWidth / 2, 0, handleWidth, handleHeight);
      
      // مقبض النهاية (أحمر)
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(endX - handleWidth / 2, 0, handleWidth, handleHeight);
      
      // خط منتصف للسحب
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(startX + regionWidth / 2, 0);
      ctx.lineTo(startX + regionWidth / 2, height);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [waveformData, duration, playbackTime, color, progressColor, selectedRegion, isSelecting]);

  // رسم الموجة عند التغيير
  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);

  // معالجة النقر
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickedTime = (x / rect.width) * duration;

    if (!isSelecting) {
      // النقر العادي للانتقال
      console.log('🎯 النقر على الموجة:', clickedTime.toFixed(2), 'ثانية');
      onSeek(clickedTime);
    }
  };

  // معالجة بداية السحب
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isSelecting || !selectedRegion || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    const startX = (selectedRegion.start / duration) * rect.width;
    const endX = (selectedRegion.end / duration) * rect.width;
    const middleX = (startX + endX) / 2;

    // تحديد نوع السحب
    if (Math.abs(x - startX) < 15) {
      setIsDragging('start');
      console.log('🔴 بدء سحب البداية');
    } else if (Math.abs(x - endX) < 15) {
      setIsDragging('end');
      console.log('🔴 بدء سحب النهاية');
    } else if (x > startX && x < endX) {
      setIsDragging('middle');
      console.log('🔵 بدء سحب المنتصف');
    }
  };

  // معالجة السحب
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedRegion || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const currentTime = (x / rect.width) * duration;

    let newStart = selectedRegion.start;
    let newEnd = selectedRegion.end;
    const minDuration = 0.1; // الحد الأدنى للمدة

    if (isDragging === 'start') {
      newStart = Math.max(0, Math.min(currentTime, selectedRegion.end - minDuration));
    } else if (isDragging === 'end') {
      newEnd = Math.max(selectedRegion.start + minDuration, Math.min(currentTime, duration));
    } else if (isDragging === 'middle') {
      const regionDuration = selectedRegion.end - selectedRegion.start;
      const centerTime = currentTime;
      newStart = Math.max(0, centerTime - regionDuration / 2);
      newEnd = Math.min(duration, newStart + regionDuration);
      
      // تعديل إذا وصلنا للنهاية
      if (newEnd >= duration) {
        newEnd = duration;
        newStart = duration - regionDuration;
      }
    }

    setSelectedRegion({ start: newStart, end: newEnd });
  };

  // إيقاف السحب
  const handleMouseUp = () => {
    if (isDragging) {
      console.log('✋ انتهى السحب');
      setIsDragging(null);
    }
  };

  // بدء التحديد
  const startSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('✂️ بدء وضع التحديد');
    setIsSelecting(true);
    setSelectedRegion({
      start: duration * 0.2,
      end: duration * 0.8
    });
  };

  // تطبيق القص
  const applyTrim = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedRegion && onTrim && segmentId) {
      console.log('✅ تطبيق القص:', selectedRegion);
      onTrim(segmentId, selectedRegion.start, selectedRegion.end);
      setSelectedRegion(null);
      setIsSelecting(false);
    }
  };

  // إلغاء التحديد
  const cancelSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('❌ إلغاء التحديد');
    setSelectedRegion(null);
    setIsSelecting(false);
  };

  // حذف المقطع
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && segmentId) {
      if (confirm('🗑️ هل تريد حذف هذا المقطع نهائياً؟')) {
        console.log('🗑️ حذف المقطع:', segmentId);
        onDelete(segmentId);
      }
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full group">
      {/* Canvas للموجة */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-pointer"
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ 
          display: 'block',
          cursor: isDragging ? 'grabbing' : isSelecting ? 'crosshair' : 'pointer'
        }}
      />

      {/* شاشة التحميل */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-gray-700 font-semibold">جاري تحليل الصوت...</span>
          </div>
        </div>
      )}

      
      

      
    </div>
  );
};

export default WaveformSegment;