'use client';

import { Voice, TTSCardData } from '@/lib/types';
import { X, User, ChevronDown } from 'lucide-react';

interface VoiceCardProps {
  cardData: TTSCardData; // 👈 رجّعها زي ما هي
  voices: Voice[];
  onUpdate: (id: string, data: Partial<TTSCardData>) => void;
  onRemove: (id: string) => void;
}

export default function VoiceCard({ cardData, voices, onUpdate, onRemove }: VoiceCardProps) {
  return (
    <div className="flex-grow flex items-start space-x-4 rtl:space-x-reverse">
      {/* Voice Selector */}
      <div className="flex-shrink-0 w-48 mt-2">
        <div className="relative">
          <select
            value={cardData.voice}
            onChange={(e) => onUpdate(cardData.id, { voice: e.target.value })}
            className="w-full appearance-none bg-white border border-gray-200 rounded-lg py-3 pl-10 pr-4 text-gray-800 font-medium leading-tight focus:outline-none focus:bg-white focus:border-blue-500"
          >
            {voices.map((voice) => (
              <option key={voice.name} value={voice.name}>
                {(voice.name.split('-')[2]?.replace('Neural', '') || voice.name)} ({voice.gender})
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-gray-500">
            <User size={18} />
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
            <ChevronDown size={18} />
          </div>
        </div>
      </div>

      {/* Text Area */}
      <div className="flex-grow relative">
        <textarea
          value={cardData.text || ''} // 👈 default string لو undefined
          onChange={(e) => onUpdate(cardData.id, { text: e.target.value })}
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
