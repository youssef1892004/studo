'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import EditorBlock from './EditorBlock';
import { Voice, TTSCardData } from '@/lib/types';
import { GripVertical, Trash2 } from 'lucide-react'; // استيراد أيقونة سلة المهملات

interface SortableEditorBlockProps {
  cardData: TTSCardData;
  voices: Voice[];
  onUpdate: (id: string, data: Partial<TTSCardData>) => void;
  onRemove: (id: string) => void;
  isActive: boolean;
  onClick: (id: string) => void;
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
  
  const activeVoice = props.voices.find(v => v.name === props.cardData.voice);
  const voiceInitial = activeVoice ? activeVoice.name.split('-')[2].charAt(0) : '?';

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="flex items-start gap-2 group">
        {/*
          * Container for Drag Handle and Delete Button
          * They will appear on hover over the entire block (group)
        */}
        <div className="flex-shrink-0 pt-2 flex flex-col items-center space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div {...listeners} className="text-gray-400 cursor-grab active:cursor-grabbing touch-none">
              <GripVertical size={20}/>
            </div>
            {/* --- === زر الحذف الجديد === --- */}
            <button 
              onClick={() => props.onRemove(props.cardData.id)}
              className="text-gray-400 hover:text-red-500 cursor-pointer touch-none"
              aria-label="Remove block"
            >
              <Trash2 size={18} />
            </button>
        </div>

        <div className="flex-grow">
            <EditorBlock {...props} />
        </div>
      </div>
    </div>
  );
}