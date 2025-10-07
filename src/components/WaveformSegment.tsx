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
        console.log("🎵 بدء تحميل الموجة لـ:", audioUrl);

        if (!audioUrl || typeof audioUrl !== "string") {
          console.warn("❗ رابط الصوت غير صالح:", audioUrl);
          return;
        }

        let arrayBuffer: ArrayBuffer;

        // ✅ التعامل مع blob URLs مباشرة
        if (audioUrl.startsWith("blob:")) {
          console.log("📦 جارٍ قراءة blob مباشرة...");
          const response = await fetch(audioUrl);
          arrayBuffer = await response.arrayBuffer();
        } else {
          // 🔗 روابط Wasabi أو سيرفر
          const response = await fetch(audioUrl);
          if (!response.ok) throw new Error("فشل تحميل الصوت");
          arrayBuffer = await response.arrayBuffer();
        }

        // 🎧 إنشاء AudioContext
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext ||
            (window as any).webkitAudioContext)();
        }

        // 🔍 فك تشفير الصوت
        const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);

        if (!mounted) return;

        console.log("✅ تم فك تشفير الصوت:", {
          duration: audioBuffer.duration,
          sampleRate: audioBuffer.sampleRate,
          channels: audioBuffer.numberOfChannels,
        });

        // 🎨 توليد الموجة
        const rawData = audioBuffer.getChannelData(0);
        const samples = 300;
        const blockSize = Math.floor(rawData.length / samples);
        const filteredData: number[] = [];

        for (let i = 0; i < samples; i++) {
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            const index = i * blockSize + j;
            if (index < rawData.length) sum += Math.abs(rawData[index]);
          }
          filteredData.push(sum / blockSize);
        }

        const maxAmplitude = Math.max(...filteredData, 0.0001);
        const normalized = filteredData.map((n) => Math.min(n / maxAmplitude, 1));

        console.log("✅ تم إنشاء الموجة بنجاح:", normalized.length, "نقطة");
        setWaveformData(normalized);
        setIsLoaded(true);
      } catch (error) {
        console.error("❌ خطأ في توليد الموجة:", error);

        // 🎛️ موجة احتياطية عشوائية
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

  // رسم الموجة على Canvas - موجة حقيقية احترافية
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

    const centerY = height / 2;
    const spacing = width / waveformData.length;

    // دالة رسم الموجة المتصلة
    const drawWavePath = (fillColor: string, startIdx: number, endIdx: number) => {
      ctx.beginPath();
      ctx.moveTo(startIdx * spacing, centerY);

      // رسم الجزء العلوي من الموجة
      for (let i = startIdx; i <= endIdx; i++) {
        const x = i * spacing;
        const amplitude = waveformData[i] || 0;
        const y = centerY - (amplitude * height * 0.4);
        
        if (i === startIdx) {
          ctx.lineTo(x, y);
        } else {
          // استخدام منحنيات بيزيه للحصول على موجة سلسة
          const prevX = (i - 1) * spacing;
          const cpX = (prevX + x) / 2;
          ctx.quadraticCurveTo(cpX, y, x, y);
        }
      }

      // رسم الجزء السفلي من الموجة (انعكاس)
      for (let i = endIdx; i >= startIdx; i--) {
        const x = i * spacing;
        const amplitude = waveformData[i] || 0;
        const y = centerY + (amplitude * height * 0.4);
        
        if (i === endIdx) {
          ctx.lineTo(x, y);
        } else {
          const nextX = (i + 1) * spacing;
          const cpX = (x + nextX) / 2;
          ctx.quadraticCurveTo(cpX, y, x, y);
        }
      }

      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();
    };

    // رسم الجزء الذي تم تشغيله
    const progressIndex = Math.floor(progress * waveformData.length);
    if (progressIndex > 0) {
      drawWavePath(progressColor, 0, progressIndex);
    }

    // رسم الجزء المتبقي
    if (progressIndex < waveformData.length - 1) {
      drawWavePath(color, progressIndex, waveformData.length - 1);
    }

    // رسم خط مركزي رفيع
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    // رسم المنطقة المحددة
    if (selectedRegion && isSelecting) {
      const startX = (selectedRegion.start / duration) * width;
      const endX = (selectedRegion.end / duration) * width;
      const regionWidth = endX - startX;

      // خلفية شفافة مع تدرج
      const gradient = ctx.createLinearGradient(startX, 0, endX, 0);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.15)');
      gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.25)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0.15)');
      ctx.fillStyle = gradient;
      ctx.fillRect(startX, 0, regionWidth, height);

      // إطار المنطقة مع تأثير الظل
      ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
      ctx.shadowBlur = 10;
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2;
      ctx.strokeRect(startX, 0, regionWidth, height);
      ctx.shadowBlur = 0;

      // مقابض السحب بتصميم دائري
      const handleRadius = 8;
      
      // مقبض البداية
      ctx.fillStyle = '#EF4444';
      ctx.shadowColor = 'rgba(239, 68, 68, 0.5)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(startX, centerY, handleRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // حلقة بيضاء داخلية
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(startX, centerY, handleRadius - 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // مقبض النهاية
      ctx.fillStyle = '#EF4444';
      ctx.shadowColor = 'rgba(239, 68, 68, 0.5)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(endX, centerY, handleRadius, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(endX, centerY, handleRadius - 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

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