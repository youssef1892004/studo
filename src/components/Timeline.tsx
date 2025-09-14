'use client';

import { TTSCardData } from '@/lib/types';

interface TimelineProps {
  cards: TTSCardData[];
  totalDuration: number;
}

export default function Timeline({ cards, totalDuration }: TimelineProps) {
  if (cards.length === 0 || totalDuration === 0) {
    return null;
  }

  return (
    <div className="w-full bg-gray-200 rounded-lg h-16 flex overflow-hidden border border-gray-300">
      {cards.map((card, index) => {
        const percentage = (card.duration || 0) / totalDuration * 100;
        if (percentage === 0) return null;

        return (
          <div
            key={card.id}
            className={`h-full flex items-center justify-center border-r border-gray-300 last:border-r-0 bg-blue-200 hover:bg-blue-300 transition-colors duration-200`}
            style={{ width: `${percentage}%` }}
            title={`${card.text.substring(0, 50)}... (${(card.duration || 0).toFixed(2)}s)`}
          >
            <span className="text-xs font-medium text-blue-800 px-2 truncate">
              {card.text}
            </span>
          </div>
        );
      })}
    </div>
  );
}
