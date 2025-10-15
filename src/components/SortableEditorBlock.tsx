// src/components/SortableEditorBlock.tsx

'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import dynamic from 'next/dynamic'; 
import { Voice, StudioBlock } from '@/lib/types';
import { GripVertical, Mic, Trash2, Download, User } from 'lucide-react'; 
import { useState, useEffect, useCallback } from 'react';
import SegmentPlayer from './studio/SegmentPlayer';

// <--- استيراد ديناميكي لحل مشكلة SSR
const EditorBlock = dynamic(() => import('./EditorBlock'), { ssr: false });

interface SortableEditorBlockProps {
  cardData: StudioBlock;
  voices: Voice[];
  onUpdate: (id: string, data: Partial<StudioBlock>) => void;
  onRemove: (id: string) => void;
  isActive: boolean;
  onClick: (id: string) => void;
  projectId: string; // إضافة projectId لتجديد روابط الصوت
}

export default function SortableEditorBlock(props: SortableEditorBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: props.cardData.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [estimatedDuration, setEstimatedDuration] = useState(0);
  const textContent = props.cardData.content.blocks.map(block => block.data.text || '').join(' ').trim();

  useEffect(() => {
    if (textContent.length > 0) {
      const charsPerSecond = 15;
      const duration = Math.max(1, Math.round(textContent.length / charsPerSecond));
      setEstimatedDuration(duration);
    } else {
      setEstimatedDuration(0);
    }
  }, [textContent]);
  
  const activeVoice = props.voices.find(v => v.name === props.cardData.voice);
  const characterName = activeVoice ? activeVoice.characterName : '...';
  const characterInitial = characterName ? characterName.charAt(0).toUpperCase() : '?';

  // دالة لتحميل المقطع الفردي
  const handleDownloadSegment = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!props.cardData.audioUrl) return;
    const link = document.createElement('a');
    link.href = props.cardData.audioUrl;
    link.download = `${characterName}_${textContent.substring(0, 20)}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUrlRefresh = useCallback((newUrl: string) => {
    props.onUpdate(props.cardData.id, { audioUrl: newUrl });
  }, [props.onUpdate, props.cardData.id]);
  
  // [REMOVED LOGIC] تم حذف دالة toggleArabicFeature بالكامل لأن الزر أصبح في الشريط الجانبي

  // [REMOVED LOGIC] تم حذف رسالة التنبيه لزر التشكيل

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="group flex items-start gap-4 p-2 rounded-lg hover:bg-gray-50/70 transition-colors duration-200">
        <div className="flex-shrink-0 flex flex-col items-center gap-1 pt-2">
          
          <div
            className="flex items-center justify-center w-7 h-7 bg-gray-200 text-gray-700 text-sm font-bold rounded-full cursor-pointer"
            title={`Voice: ${props.cardData.voiceSelected ? characterName : 'Default'}`}
          >
            {props.cardData.voiceSelected ? characterInitial : <User size={16} />}
          </div>
          
          {/* 🚨 [REMOVED] تم حذف زر تفعيل التشكيل العربي (Pro Arabic Toggle Button) */}


          {estimatedDuration > 0 && !props.cardData.audioUrl && (
            <div className="flex items-center gap-1 text-xs text-gray-500 font-mono opacity-0 group-hover:opacity-100" title="Estimated duration">
                <Mic size={12} />
                <span>~{estimatedDuration}s</span>
            </div>
          )}

          <div 
            {...listeners} 
            className="text-gray-400 cursor-grab active:cursor-grabbing touch-none p-1 opacity-0 group-hover:opacity-100"
            aria-label="Drag to reorder"
          >
            <GripVertical size={20}/>
          </div>
          
          {/* إضافة زر التحميل هنا */}
          {props.cardData.audioUrl && (
             <button
                onClick={handleDownloadSegment}
                className="text-gray-400 hover:text-blue-500 cursor-pointer touch-none p-1 opacity-0 group-hover:opacity-100"
                aria-label="Download segment"
             >
                <Download size={18} />
             </button>
          )}

          <button
            onClick={() => props.onRemove(props.cardData.id)}
            className="text-gray-400 hover:text-red-500 cursor-pointer touch-none p-1 opacity-0 group-hover:opacity-100"
            aria-label="Remove block"
          >
            <Trash2 size={18} />
          </button>
        </div>
        
        <div className="flex-grow">
          <EditorBlock {...props} />
          {props.cardData.audioUrl && 
           typeof props.cardData.audioUrl === 'string' && 
           props.cardData.audioUrl.trim() !== '' && (
            <SegmentPlayer 
              audioUrl={props.cardData.audioUrl} 
              text={textContent}
              blockId={props.cardData.id}
              projectId={props.projectId}
              onUrlRefresh={handleUrlRefresh}
            />
          )}
        </div>
      </div>
    </div>
  );
}