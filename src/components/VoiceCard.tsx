'use client';

import { Voice, TTSCardData } from '@/lib/types';
import { X } from 'lucide-react';

interface VoiceCardProps {
  cardData: TTSCardData;
  voices: Voice[];
  onUpdate: (id: string, data: Partial<TTSCardData>) => void;
  onRemove: (id: string) => void;
}

export default function VoiceCard({ cardData, voices, onUpdate, onRemove }: VoiceCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 relative">
      <button 
        onClick={() => onRemove(cardData.id)}
        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
        aria-label="Remove card"
      >
        <X size={20} />
      </button>
      <div className="grid grid-cols-1 gap-4">
        <textarea
          value={cardData.text}
          onChange={(e) => onUpdate(cardData.id, { text: e.target.value })}
          placeholder="اكتب النص هنا..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
          rows={4}
          dir="rtl"
        />
        <select
          value={cardData.voice}
          onChange={(e) => onUpdate(cardData.id, { voice: e.target.value })}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
        >
          {voices.map((voice) => (
            <option key={voice.name} value={voice.name}>
              {`${voice.name} (${voice.gender}, ${voice.language})`}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}