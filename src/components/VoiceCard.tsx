'use client';

import { Voice, StudioBlock } from '@/lib/types';
import { X, User } from 'lucide-react';

interface VoiceCardProps {
  cardData: StudioBlock;
  voices: Voice[];
  onUpdate: (id: string, data: Partial<StudioBlock>) => void;
  onRemove: (id: string) => void;
}

export default function VoiceCard({ cardData, voices, onUpdate, onRemove }: VoiceCardProps) {
  // Extract text from content structure
  const textContent = cardData.content.blocks.map(block => block.data.text || '').join(' ').trim();
  
  const handleTextChange = (newText: string) => {
    // Update the content structure with new text
    const updatedContent = {
      ...cardData.content,
      blocks: [{
        id: cardData.content.blocks[0]?.id || cardData.id,
        type: 'paragraph',
        data: { text: newText }
      }]
    };
    onUpdate(cardData.id, { content: updatedContent });
  };

  return (
    <div className="flex-grow flex items-start space-x-4 rtl:space-x-reverse">
      {/* Voice Selector */}
      <div className="flex-shrink-0 w-48 mt-2">
        <div className="flex items-center gap-2 px-3 py-3 bg-gray-50 border border-gray-200 rounded-lg">
          <User size={18} className="text-gray-500" />
          <span className="text-gray-800 font-medium truncate" title={cardData.voice}>
            {cardData.voice}
          </span>
        </div>
      </div>

      {/* Text Area */}
      <div className="flex-grow relative">
        <textarea
          value={textContent}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Type or paste text here..."
          className="w-full p-4 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 resize-none text-lg text-gray-700 leading-relaxed"
          rows={3}
          dir="rtl"
        />
        <button
          onClick={() => onRemove(cardData.id)}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-full"
          aria-label="Remove text block"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
