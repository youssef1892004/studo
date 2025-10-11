'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import VoiceCard from './VoiceCard';
import { Voice, StudioBlock } from '@/lib/types';
import { GripVertical } from 'lucide-react';

interface SortableVoiceCardProps {
  cardData: StudioBlock;
  voices: Voice[];
  onUpdate: (id: string, data: Partial<StudioBlock>) => void;
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
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <VoiceCard {...props} />
      <button {...attributes} {...listeners} className="absolute top-1/2 -left-8 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing">
        <GripVertical />
      </button>
    </div>
  );
}
