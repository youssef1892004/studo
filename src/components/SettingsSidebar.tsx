'use client';

import { Voice } from '@/lib/types';
import { Sparkles, Replace } from 'lucide-react';

interface SettingsSidebarProps {
  voices: Voice[];
  onApplyVoice: (voiceName: string) => void;
  activeVoiceName?: string;
}

export default function SettingsSidebar({ voices, onApplyVoice, activeVoiceName }: SettingsSidebarProps) {
  return (
    <div className="flex flex-col h-full bg-white p-4 space-y-6">
      <div>
        <h3 className="px-2 text-sm font-semibold text-gray-500 mb-2">Selected Voice</h3>
        <div className="p-3 rounded-lg bg-gray-100 flex items-center">
            <div className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
              {activeVoiceName ? activeVoiceName.charAt(0).toUpperCase() : '?'}
            </div>
            <span className="ml-3 font-semibold text-gray-800">{activeVoiceName || 'No selection'}</span>
        </div>
      </div>

      <div>
        <h3 className="px-2 text-sm font-semibold text-gray-500 mb-2">Select used voice</h3>
        <div className="space-y-1 max-h-[50vh] overflow-y-auto">
          {voices.map((voice) => {
            const nameParts = voice.name.split('-');
            const displayName = nameParts.length > 2 && nameParts[2] ? nameParts[2].replace('Neural', '') : voice.name;
            const voiceInitial = nameParts.length > 2 && nameParts[2] ? nameParts[2].charAt(0) : voice.name.charAt(0);

            return (
              <div
                key={voice.name}
                className="p-2 rounded-lg flex items-center justify-between hover:bg-gray-100 group"
              >
                <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-bold">
                      {voiceInitial}
                    </div>
                    <span className="ml-3 font-medium text-gray-700">{displayName}</span>
                </div>
                <button
                  onClick={() => onApplyVoice(voice.name)}
                  className="px-3 py-1 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-md opacity-0 group-hover:opacity-100 hover:bg-gray-50 transition-opacity"
                >
                  Apply
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t pt-4">
          <h3 className="px-2 text-sm font-semibold text-gray-500 mb-2">AI Tools</h3>
          <div className="space-y-2">
            <button className="w-full flex items-center p-3 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-700 font-medium">
              <Sparkles className="h-5 w-5 mr-3 text-purple-500" />
              Remove background
            </button>
            <button className="w-full flex items-center p-3 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-700 font-medium">
              <Replace className="h-5 w-5 mr-3 text-purple-500" />
              Use voice changer
            </button>
          </div>
      </div>
    </div>
  );
}