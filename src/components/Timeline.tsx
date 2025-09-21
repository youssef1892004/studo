'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import VoiceCard from './VoiceCard';
import { Voice, TTSCardData } from '@/lib/types';
import { GripVertical } from 'lucide-react';

interface SortableVoiceCardProps {
  cardData: TTSCardData;
  voices: Voice[];
  onUpdate: (id: string, data: Partial<TTSCardData>) => void;
  onRemove: (id: string) => void;
}

export default function SortableVoiceCard(props: SortableVoiceCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.cardData.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    // positioning relative to allow the handle to be placed correctly
    position: 'relative' as 'relative',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} >
        <div className="flex items-start gap-4">
           {/* Drag Handle */}
          <button {...listeners} className="flex-shrink-0 p-2 mt-8 text-gray-400 cursor-grab active:cursor-grabbing touch-none">
              <GripVertical />
          </button>
          <VoiceCard {...props} />
        </div>
    </div>
  );
}