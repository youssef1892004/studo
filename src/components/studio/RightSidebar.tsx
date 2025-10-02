// src/components/studio/RightSidebar.tsx
'use client';

import { Voice } from '@/lib/types';
import { Check, ChevronDown, Play, Search } from 'lucide-react';

// Props Interface
interface RightSidebarProps {
  voices: Voice[];
  onApplyVoice: (voiceName: string) => void;
  activeVoiceName?: string;
  
  // Props for filtering
  languages: { code: string; name: string }[];
  countries: { code: string; name: string }[];
  genderFilter: string;
  setGenderFilter: (gender: string) => void;
  countryFilter: string;
  setCountryFilter: (countryCode: string) => void;
  languageFilter: string;
  setLanguageFilter: (langCode: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  
  voiceMode: 'Free' | 'Pro';
  setVoiceMode: (mode: 'Free' | 'Pro') => void;
}

// Helper component for Gender buttons
const GenderButton = ({ label, value, currentFilter, onClick }: {
  label: string;
  value: string;
  currentFilter: string;
  onClick: (value: string) => void;
}) => (
  <button
    onClick={() => onClick(value)}
    className={`flex-1 px-3 py-1 text-sm font-medium rounded-lg transition-colors duration-200 ${
      currentFilter === value
        ? 'bg-blue-600 text-white shadow-sm'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
    }`}
  >
    {label}
  </button>
);


export default function RightSidebar({
  voices, 
  onApplyVoice, 
  activeVoiceName, 
  languages, 
  countries,
  genderFilter, 
  setGenderFilter, 
  countryFilter, 
  setCountryFilter, 
  languageFilter, 
  setLanguageFilter,
  searchTerm, 
  setSearchTerm,
  voiceMode,
  setVoiceMode
}: RightSidebarProps) {

  const proVoices: Voice[] = [
    { name: '0', characterName: 'كريم', gender: 'Male', languageName: 'Arabic', languageCode: 'ar', countryName: 'Pro', countryCode: 'PRO' },
    { name: '1', characterName: 'طارق', gender: 'Male', languageName: 'Arabic', languageCode: 'ar', countryName: 'Pro', countryCode: 'PRO' },
    { name: '2', characterName: 'ليلى', gender: 'Female', languageName: 'Arabic', languageCode: 'ar', countryName: 'Pro', countryCode: 'PRO' },
    { name: '3', characterName: 'نور', gender: 'Female', languageName: 'Arabic', languageCode: 'ar', countryName: 'Pro', countryCode: 'PRO' },
  ];

  const voicesToDisplay = voiceMode === 'Pro' ? proVoices : voices;
  
  return (
    <aside 
      className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex-col h-full overflow-hidden hidden md:flex transition-colors duration-200"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Voice Library</h2>
        </div>

        {/* Voice Mode Selector */}
        <div className="flex-shrink-0 p-4 border-b border-gray-100 dark:border-gray-700">
            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">Voice Mode</label>
            <div className="flex bg-gray-100 dark:bg-gray-700 p-0.5 rounded-lg gap-0.5">
                <button
                    onClick={() => setVoiceMode('Free')}
                    className={`flex-1 px-4 py-2 text-sm font-bold rounded-lg transition-colors duration-200 ${
                        voiceMode === 'Free' 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : 'text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                >
                    Free Voices
                </button>
                <button
                    onClick={() => setVoiceMode('Pro')}
                    className={`flex-1 px-4 py-2 text-sm font-bold rounded-lg transition-colors duration-200 ${
                        voiceMode === 'Pro' 
                            ? 'bg-gray-900 text-white shadow-md dark:bg-blue-600 dark:hover:bg-blue-700' 
                            : 'text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                >
                    Pro Arabic
                </button>
            </div>
        </div>

        {/* Filters Section - Conditionally rendered */}
        {voiceMode === 'Free' && (
          <div className="flex-shrink-0 p-4 space-y-4 border-b border-gray-100 dark:border-gray-700">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
                <input
                  type="text"
                  placeholder="Search voice or country..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg py-2 pl-10 pr-3 text-sm text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            {/* Gender Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
              <div className="flex space-x-2">
                <GenderButton label="All" value="all" currentFilter={genderFilter} onClick={setGenderFilter} />
                <GenderButton label="Male" value="Male" currentFilter={genderFilter} onClick={setGenderFilter} />
                <GenderButton label="Female" value="Female" currentFilter={genderFilter} onClick={setGenderFilter} />
              </div>
            </div>
            
            {/* Language Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Language</label>
              <div className="relative">
                <select
                  value={languageFilter}
                  onChange={(e) => setLanguageFilter(e.target.value)}
                  className="block w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg py-2 pl-3 pr-10 text-sm text-gray-800 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Languages</option>
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" size={16} />
              </div>
            </div>

            {/* Country Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
              <div className="relative">
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="block w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg py-2 pl-3 pr-10 text-sm text-gray-800 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Countries</option>
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" size={16} />
              </div>
            </div>
          </div>
        )}

        {/* Voices List */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="sticky top-0 bg-white dark:bg-gray-800 px-4 py-2 border-b border-gray-100 dark:border-gray-700 z-10 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {voiceMode === 'Pro' ? 'Pro Arabic Voices' : 'Free Voices'} ({voicesToDisplay.length})
            </h3>
          </div>

          <div className="px-1 space-y-1 pb-4">
            {voicesToDisplay.length > 0 ? (
              voicesToDisplay.map((voice) => (
                <div 
                  key={voice.name} 
                  onClick={() => onApplyVoice(voice.name)}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors duration-150 
                    ${activeVoiceName === voice.name 
                      ? 'bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                >
                  <div className="flex items-center space-x-3 text-right">
                    <div className="w-10 h-10 flex items-center justify-center bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-200 font-bold rounded-full text-lg flex-shrink-0">
                      {voice.characterName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{voice.characterName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {voice.countryName} ({voice.gender})
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                        className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600"
                        title="Preview"
                    >
                        <Play size={16} />
                    </button>

                    {activeVoiceName === voice.name && (
                      <Check className="text-blue-600 dark:text-blue-400" size={20} />
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                No voices found matching the current filters.
              </p>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}